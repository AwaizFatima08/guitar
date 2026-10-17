#!/usr/bin/env bash
# Copy the Geetar web app (../app) into the Flutter assets. Run before every build.
set -euo pipefail
cd "$(dirname "$0")/.."
rm -rf assets/web
mkdir -p assets/web
rsync -a --exclude '.htaccess' --exclude 'sw.js' ../app/ assets/web/
echo "Synced web app into mobile/assets/web"
