import 'dart:async';

import 'package:flutter/foundation.dart';
import 'package:flutter/widgets.dart';
import 'package:google_mobile_ads/google_mobile_ads.dart';

/// Audience switch. false: Geetar is listed for ages 13+ (like Lingo15) and ads are
/// family-safe (rating G) but not child-directed. Set true if the Play Console target audience
/// includes children under 13: ads are then tagged child-directed (no personalised ads).
const bool kChildDirected = false;

/// Ad unit ids. Debug and profile builds use Google's public test ids. Release builds read real
/// ids from --dart-define (scripts/build_release.sh); without them a release shows no ads at all,
/// so test ads can never ship.
class AdUnits {
  const AdUnits._();

  static const testBanner = 'ca-app-pub-3940256099942544/6300978111';
  static const testInterstitial = 'ca-app-pub-3940256099942544/1033173712';

  static const _banner = String.fromEnvironment('AD_BANNER_ID');
  static const _interstitial = String.fromEnvironment('AD_INTERSTITIAL_ID');

  static String? get banner => kReleaseMode ? (_banner.isEmpty ? null : _banner) : testBanner;
  static String? get interstitial =>
      kReleaseMode ? (_interstitial.isEmpty ? null : _interstitial) : testInterstitial;
  static bool get anyConfigured => banner != null || interstitial != null;
}

/// When a full-screen ad may follow a finished lesson. Pure, so it is unit tested.
/// - only right after a lesson is marked done (never on the tuner, during a song or a lesson);
/// - never after the first lesson of the day;
/// - at most one per two lessons finished;
/// - at least [minGap] since the last one.
class InterstitialPolicy {
  const InterstitialPolicy({this.lessonsPerAd = 2, this.minGap = const Duration(minutes: 4)});

  final int lessonsPerAd;
  final Duration minGap;

  bool shouldShow({
    required int lessonsDoneToday,
    required int lessonsSinceLastAd,
    required DateTime now,
    required DateTime? lastShown,
  }) {
    if (lessonsDoneToday < 2) return false;
    if (lessonsSinceLastAd < lessonsPerAd) return false;
    if (lastShown != null && now.difference(lastShown) < minGap) return false;
    return true;
  }
}

/// Ads and consent behind one interface, so the shell never touches the SDK directly.
abstract class AdService {
  Future<void> init();
  bool get canShowAds;
  Future<bool> get privacyOptionsRequired;
  Future<void> showPrivacyOptions();
  Widget banner(BuildContext context);

  /// Counts a finished lesson and shows an interstitial if the policy allows. Returns whether it showed.
  Future<bool> lessonFinished({required int lessonsDoneToday});
}

class NoAdService implements AdService {
  const NoAdService();
  @override
  Future<void> init() async {}
  @override
  bool get canShowAds => false;
  @override
  Future<bool> get privacyOptionsRequired async => false;
  @override
  Future<void> showPrivacyOptions() async {}
  @override
  Widget banner(BuildContext context) => const SizedBox.shrink();
  @override
  Future<bool> lessonFinished({required int lessonsDoneToday}) async => false;
}

/// AdMob with Google's User Messaging Platform consent.
class AdMobService implements AdService {
  AdMobService({this.policy = const InterstitialPolicy(), DateTime Function()? clock}) : _clock = clock ?? DateTime.now;

  final InterstitialPolicy policy;
  final DateTime Function() _clock;
  bool _initStarted = false;
  bool _canRequest = false;
  InterstitialAd? _interstitial;
  int _sinceLastAd = 0;
  DateTime? _lastShown;

  @override
  bool get canShowAds => _canRequest;

  @override
  Future<void> init() async {
    if (_initStarted) return;
    _initStarted = true;
    if (!AdUnits.anyConfigured) return; // release build without real ids: stay ad-free
    try {
      final done = Completer<void>();
      ConsentInformation.instance.requestConsentInfoUpdate(
        ConsentRequestParameters(tagForUnderAgeOfConsent: kChildDirected),
        () async {
          await ConsentForm.loadAndShowConsentFormIfRequired((_) {});
          if (!done.isCompleted) done.complete();
        },
        (error) {
          debugPrint('Consent update failed: ${error.message}');
          if (!done.isCompleted) done.complete();
        },
      );
      await done.future.timeout(const Duration(seconds: 20), onTimeout: () {});
      _canRequest = await ConsentInformation.instance.canRequestAds();
      if (!_canRequest) return;
      await MobileAds.instance.updateRequestConfiguration(RequestConfiguration(
        maxAdContentRating: MaxAdContentRating.g,
        ageRestrictedTreatment: kChildDirected ? AgeRestrictedTreatment.child : AgeRestrictedTreatment.unspecified,
      ));
      await MobileAds.instance.initialize();
      _loadInterstitial();
    } on Object catch (e) {
      debugPrint('Ads init failed: $e');
      _canRequest = false;
    }
  }

  @override
  Future<bool> get privacyOptionsRequired async {
    try {
      return await ConsentInformation.instance.getPrivacyOptionsRequirementStatus() ==
          PrivacyOptionsRequirementStatus.required;
    } on Object {
      return false;
    }
  }

  @override
  Future<void> showPrivacyOptions() async {
    try {
      await ConsentForm.showPrivacyOptionsForm((_) {});
    } on Object catch (e) {
      debugPrint('Privacy options failed: $e');
    }
  }

  void _loadInterstitial() {
    final id = AdUnits.interstitial;
    if (id == null || !_canRequest) return;
    InterstitialAd.load(
      adUnitId: id,
      request: const AdRequest(),
      adLoadCallback: InterstitialAdLoadCallback(
        onAdLoaded: (ad) => _interstitial = ad,
        onAdFailedToLoad: (e) => debugPrint('Interstitial failed: ${e.message}'),
      ),
    );
  }

  @override
  Future<bool> lessonFinished({required int lessonsDoneToday}) async {
    _sinceLastAd++;
    if (!_canRequest) return false;
    final now = _clock();
    if (!policy.shouldShow(lessonsDoneToday: lessonsDoneToday, lessonsSinceLastAd: _sinceLastAd, now: now, lastShown: _lastShown)) {
      return false;
    }
    final ad = _interstitial;
    if (ad == null) {
      _loadInterstitial();
      return false;
    }
    _interstitial = null;
    final done = Completer<void>();
    ad.fullScreenContentCallback = FullScreenContentCallback<InterstitialAd>(
      onAdDismissedFullScreenContent: (a) {
        a.dispose();
        _loadInterstitial();
        if (!done.isCompleted) done.complete();
      },
      onAdFailedToShowFullScreenContent: (a, e) {
        a.dispose();
        _loadInterstitial();
        if (!done.isCompleted) done.complete();
      },
    );
    _sinceLastAd = 0;
    _lastShown = now;
    await ad.show();
    await done.future.timeout(const Duration(minutes: 2), onTimeout: () {});
    return true;
  }

  @override
  Widget banner(BuildContext context) {
    final id = AdUnits.banner;
    if (!_canRequest || id == null) return const SizedBox.shrink();
    return _BannerSlot(adUnitId: id);
  }
}

class _BannerSlot extends StatefulWidget {
  const _BannerSlot({required this.adUnitId});
  final String adUnitId;
  @override
  State<_BannerSlot> createState() => _BannerSlotState();
}

class _BannerSlotState extends State<_BannerSlot> {
  BannerAd? _ad;
  bool _loaded = false;
  bool _requested = false;

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    if (_requested) return;
    _requested = true;
    unawaited(_load());
  }

  Future<void> _load() async {
    final width = MediaQuery.sizeOf(context).width.truncate();
    final size = await AdSize.getLargeAnchoredAdaptiveBannerAdSizeWithOrientation(MediaQuery.orientationOf(context), width);
    if (!mounted || size == null) return;
    final ad = BannerAd(
      adUnitId: widget.adUnitId,
      size: size,
      request: const AdRequest(),
      listener: BannerAdListener(
        onAdLoaded: (_) {
          if (mounted) setState(() => _loaded = true);
        },
        onAdFailedToLoad: (a, e) {
          debugPrint('Banner failed: ${e.message}');
          a.dispose();
        },
      ),
    );
    _ad = ad;
    await ad.load();
  }

  @override
  void dispose() {
    _ad?.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final ad = _ad;
    if (!_loaded || ad == null) return const SizedBox.shrink();
    return SizedBox(width: ad.size.width.toDouble(), height: ad.size.height.toDouble(), child: AdWidget(ad: ad));
  }
}
