#!/usr/bin/env bash
# Builds the signed Play bundle (AAB) for Geetar with the real AdMob ids.
#   bash mobile/scripts/build_release.sh            -> build/app/outputs/bundle/release/app-release.aab
#   bash mobile/scripts/build_release.sh apk        -> a release APK for testing on a phone
# Needs .secrets/ad-units.env (see .secrets/ad-units.env.example) and android/key.properties.
set -euo pipefail
cd "$(dirname "$0")/.."
ENV=../.secrets/ad-units.env
[ -f "$ENV" ] || { echo "Missing $ENV: create the Geetar app and its banner and interstitial units in AdMob first."; exit 1; }
[ -f android/key.properties ] || { echo "Missing android/key.properties: the bundle would not be signed for Play."; exit 1; }
set -a; source "$ENV"; set +a
: "${ADMOB_APP_ID:?}" "${AD_BANNER_ID:?}" "${AD_INTERSTITIAL_ID:?}"
for v in "$ADMOB_APP_ID" "$AD_BANNER_ID" "$AD_INTERSTITIAL_ID"; do
  case "$v" in
    *3940256099942544*) echo "Refusing: $v is one of Google's sample ad ids."; exit 1 ;;
    *XXXX*) echo "Refusing: $v is still the template placeholder."; exit 1 ;;
    ca-app-pub-*) ;;
    *) echo "Refusing: $v does not look like an AdMob id."; exit 1 ;;
  esac
done
if pgrep -f "[q]emu-system" >/dev/null; then echo "An emulator is running. Stop it first (one heavy job at a time)."; exit 1; fi
bash scripts/sync-web.sh
flutter analyze
flutter test
export ADMOB_APP_ID
TARGET="${1:-appbundle}"
nice -n 10 flutter build "$TARGET" --release \
  --dart-define=AD_BANNER_ID="$AD_BANNER_ID" \
  --dart-define=AD_INTERSTITIAL_ID="$AD_INTERSTITIAL_ID"
VERSION=$(grep '^version:' pubspec.yaml | cut -d' ' -f2)
OUT="../releases/v${VERSION/+/-}"
mkdir -p "$OUT"
if [ "$TARGET" = appbundle ]; then cp build/app/outputs/bundle/release/app-release.aab "$OUT/geetar-$VERSION.aab"; else cp build/app/outputs/flutter-apk/app-release.apk "$OUT/geetar-$VERSION.apk"; fi
( cd "$OUT" && sha256sum geetar-* > SHA256SUMS )
echo "Built into $OUT"
