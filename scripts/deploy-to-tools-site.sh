#!/usr/bin/env bash
# Copy the Geetar web app into the tools.homilabs.org site folder.
# Afterwards upload homilabs_tools/site/guitar_app/ (including the hidden .htaccess)
# to public_html/guitar_app/ of tools.homilabs.org in Hostinger's File Manager.
set -euo pipefail
SRC="/mnt/storage/projects/guitar/app/"
DEST="/mnt/storage/projects/homilabs_tools/site/guitar_app/"
cd /mnt/storage/projects/guitar
node --test tests/*.test.js >/dev/null || { echo "Tests failed: not deploying"; exit 1; }
mkdir -p "$DEST"
rsync -a --delete "$SRC" "$DEST"
cp app/img/icon-192.png /mnt/storage/projects/homilabs_tools/site/img/geetar/icon.png
echo "Copied to $DEST"
echo "Next: upload that folder to public_html/guitar_app/ on Hostinger (tools.homilabs.org)."
