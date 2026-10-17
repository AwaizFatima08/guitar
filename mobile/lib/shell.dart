import 'dart:async';
import 'dart:convert';

import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:permission_handler/permission_handler.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:webview_flutter/webview_flutter.dart';
import 'package:webview_flutter_android/webview_flutter_android.dart';

import 'ads.dart';
import 'local_server.dart';

const kAppVersion = '1.1.0';
const _kState = 'geetar.state';
const _kPrivacyOptions = 'geetar.privacyOptions';

/// Messages the web app sends through window.GeetarNative.postMessage(json).
sealed class BridgeMessage {
  const BridgeMessage();
  static BridgeMessage? parse(String raw) {
    final Object? m;
    try {
      m = jsonDecode(raw);
    } on FormatException {
      return null;
    }
    if (m is! Map) return null;
    return switch (m['type']) {
      'save' when m['state'] is String => SaveState(m['state'] as String),
      'page' => PageShown(route: '${m['route'] ?? ''}', banner: m['banner'] == true),
      'lessonDone' => LessonDone((m['doneToday'] as num?)?.toInt() ?? 0),
      'open' when m['url'] is String => OpenExternal(m['url'] as String),
      'privacyOptions' => const ShowPrivacyOptions(),
      _ => null,
    };
  }
}

final class SaveState extends BridgeMessage {
  const SaveState(this.state);
  final String state;
}

final class PageShown extends BridgeMessage {
  const PageShown({required this.route, required this.banner});
  final String route;
  final bool banner;
}

final class LessonDone extends BridgeMessage {
  const LessonDone(this.doneToday);
  final int doneToday;
}

final class OpenExternal extends BridgeMessage {
  const OpenExternal(this.url);
  final String url;
}

final class ShowPrivacyOptions extends BridgeMessage {
  const ShowPrivacyOptions();
}

/// Only these links leave the app, and only to an outside app (browser or mail).
bool isAllowedExternal(String url) {
  final u = Uri.tryParse(url);
  if (u == null) return false;
  return u.scheme == 'mailto' || (u.scheme == 'https' && (u.host == 'tools.homilabs.org' || u.host == 'homilabs.org'));
}

class GeetarShell extends StatefulWidget {
  const GeetarShell({super.key, required this.server, required this.prefs, required this.ads});
  final LocalServer server;
  final SharedPreferences prefs;
  final AdService ads;

  @override
  State<GeetarShell> createState() => _GeetarShellState();
}

class _GeetarShellState extends State<GeetarShell> {
  late final WebViewController _web;
  bool _banner = false;
  bool _adsStarted = false;

  @override
  void initState() {
    super.initState();
    _web = WebViewController(onPermissionRequest: _onPermission)
      ..setJavaScriptMode(JavaScriptMode.unrestricted)
      ..setBackgroundColor(const Color(0xFFFFF8F1))
      ..addJavaScriptChannel('GeetarNative', onMessageReceived: (m) => _onMessage(m.message))
      ..setNavigationDelegate(NavigationDelegate(onNavigationRequest: (req) {
        if (req.url.startsWith(widget.server.origin) || req.url == 'about:blank') return NavigationDecision.navigate;
        if (isAllowedExternal(req.url)) unawaited(launchUrl(Uri.parse(req.url), mode: LaunchMode.externalApplication));
        return NavigationDecision.prevent;
      }));
    final platform = _web.platform;
    if (platform is AndroidWebViewController) {
      unawaited(platform.setMediaPlaybackRequiresUserGesture(false));
      unawaited(AndroidWebViewController.enableDebugging(kDebugMode));
    }
    unawaited(_web.loadRequest(widget.server.startUri));
  }

  Future<void> _onPermission(WebViewPermissionRequest req) async {
    if (!req.types.contains(WebViewPermissionResourceType.microphone)) {
      await req.deny();
      return;
    }
    final status = await Permission.microphone.request();
    if (status.isGranted) {
      await req.grant();
    } else {
      await req.deny();
    }
  }

  Future<void> _onMessage(String raw) async {
    final msg = BridgeMessage.parse(raw);
    switch (msg) {
      case SaveState(:final state):
        await widget.prefs.setString(_kState, state);
      case PageShown(:final banner):
        if (banner && !_adsStarted) unawaited(_startAds()); // banner is only true once the learner has entered a name
        if (mounted && banner != _banner) setState(() => _banner = banner);
      case LessonDone(:final doneToday):
        // Let the celebration play first; the service applies its own caps.
        await Future<void>.delayed(const Duration(milliseconds: 1800));
        await widget.ads.lessonFinished(lessonsDoneToday: doneToday);
      case OpenExternal(:final url):
        if (isAllowedExternal(url)) await launchUrl(Uri.parse(url), mode: LaunchMode.externalApplication);
      case ShowPrivacyOptions():
        await widget.ads.showPrivacyOptions();
      case null:
        break;
    }
  }

  Future<void> _startAds() async {
    _adsStarted = true;
    await widget.ads.init();
    final options = await widget.ads.privacyOptionsRequired;
    await widget.prefs.setBool(_kPrivacyOptions, options);
    await _web.runJavaScript('window.__geetarApp && window.__geetarApp(${jsonEncode({'ads': widget.ads.canShowAds, 'privacyOptions': options})})');
    if (mounted) setState(() {});
  }

  Future<void> _onBack() async {
    if (await _web.canGoBack()) {
      await _web.goBack();
    } else {
      await SystemNavigator.pop();
    }
  }

  @override
  Widget build(BuildContext context) {
    final dark = MediaQuery.platformBrightnessOf(context) == Brightness.dark;
    final bg = dark ? const Color(0xFF161117) : const Color(0xFFFFF8F1);
    return AnnotatedRegion<SystemUiOverlayStyle>(
      value: (dark ? SystemUiOverlayStyle.light : SystemUiOverlayStyle.dark).copyWith(
        statusBarColor: Colors.transparent,
        systemNavigationBarColor: bg,
      ),
      child: PopScope(
        canPop: false,
        onPopInvokedWithResult: (didPop, _) {
          if (!didPop) unawaited(_onBack());
        },
        child: Scaffold(
          backgroundColor: bg,
          body: SafeArea(
            child: Column(children: [
              Expanded(child: WebViewWidget(controller: _web)),
              if (_banner && widget.ads.canShowAds) Center(child: widget.ads.banner(context)),
            ]),
          ),
        ),
      ),
    );
  }
}

/// Builds the boot file the page reads on start.
String bootFor(SharedPreferences prefs, AdService ads) => LocalServer.buildBoot(
      state: prefs.getString(_kState),
      ads: ads.canShowAds,
      privacyOptions: prefs.getBool(_kPrivacyOptions) ?? false,
      version: kAppVersion,
    );
