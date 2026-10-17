# Geetar

Guitar-learning app for complete beginners, made for Homi's daughter Parishay ("Pari") and published for everyone. One code base: the web app in `app/` (plain HTML, CSS and ES-module JavaScript, no build step), shipped twice: on the web at tools.homilabs.org/guitar_app (no ads) and as the Android app in `mobile/` (Flutter WebView shell with AdMob, for Google Play). Publisher: HomiLabs.

## Locked
- Name **Geetar**; dedicated to Pari (home screen and About).
- Every HomiLabs app shows the HomiLabs logo (`app/img/homilabs.svg`, same mark as tools.homilabs.org) and the lines **Created By: HomiLabs** and **Managed By: Awaiz Fatima** (About screen and home footer).
- Three level brackets: Basic, Medium, Expert. Basic assumes no music knowledge: explain every word, use string numbers and plain "tighten / loosen" language.
- No login or accounts: the first screen asks only for a name. No analytics. Microphone audio never leaves the device.
- Home shows **Geetar** with the tagline **Made with Love for Pari** under it.
- Ads only in the Android app, family-rated **G** (code and AdMob account setting). Banner only on menu screens (home, lessons list, level lists, practice, songs list, glossary), never on the tuner, lessons, players or tools. Interstitial only after a finished lesson: never the first of the day, at most one per two lessons, 4 minutes apart (`mobile/lib/ads.dart`). No rewarded ads. Audience switch `kChildDirected` (false = listed 13+).
- Only traditional or public-domain melodies, and no lyrics.
- Sounds are synthesised (Karplus-Strong in `app/js/pluck.js`); no homidev assets are used yet.

## Locations
- Project: `/mnt/storage/projects/guitar`
- Hosting: https://tools.homilabs.org/guitar_app/ (static Hostinger; manual upload of `homilabs_tools/site/guitar_app/`, filled by `scripts/deploy-to-tools-site.sh`). Hub card and privacy/terms sections use the slug `geetar`.
- Local backup: `/mnt/storage/project_backups/guitar_backup/`
- Google Drive: folder `1W_5-DH-Mr6G6pWkyADM7QueIXUiH7O1z` (rclone remote `gdrive`)
- GitHub (**public**): `git@github.com:AwaizFatima08/guitar.git`
- Backup: `bash scripts/backup.sh` (commit first).

## Android app (`mobile/`)
- Package **com.homilabs.geetar** (locked). Version in `mobile/pubspec.yaml` and `kAppVersion` in `mobile/lib/shell.dart`; keep `VERSION` in `app/js/app.js` the same.
- `lib/local_server.dart` serves `assets/web/` (copied from `../app` by `scripts/sync-web.sh`, gitignored) on 127.0.0.1:47391 (fixed port keeps WebView storage). `/__geetar/boot.json?t=<token>` returns saved progress and app flags.
- `lib/shell.dart`: WebView, JS channel `GeetarNative` (messages: save, page, lessonDone, open, privacyOptions), microphone permission, back button, banner slot. Progress is mirrored to SharedPreferences.
- AdMob (account homilabs.smc@gmail.com, publisher pub-2087846699268567, same as Lingo15): app `ca-app-pub-2087846699268567~1050337647`; units in `.secrets/ad-units.env`. Debug builds use Google test ids.
- Release: `bash mobile/scripts/build_release.sh` (AAB) or `... apk`; refuses sample or missing ids and a running emulator. Output in `releases/v<version>/` (gitignored; in local and Drive backups). Signing: `.secrets/geetar-upload.keystore`, `mobile/android/key.properties`.
- Play listing, data safety and audience notes: `docs/play-console-listing-kit.md`.
- Debug quirk: after an emulator crash a debug build may fail with "Could not prepare isolate"; `adb shell pm clear com.homilabs.geetar` fixes it. The headless emulator is unstable here; test on the Tab S9 FE or A12 (`-s <serial>`). WebView debugging: forward `localabstract:webview_devtools_remote_<pid>`.

## Code map
- `app/js/music.js`: tuning, chord shapes, songs as tab, strum patterns, progressions.
- `app/js/lessons.js`: all lesson content as blocks (p, steps, chords, song, strum, quiz …).
- `app/js/app.js`: hash router, pages, widgets (tuner, song player with Play along, strum trainer, metronome, changes, quiz, capo, note finder), localStorage state (`geetar.v1`).
- `app/js/pitch.js`: McLeod pitch detection and beginner advice. `app/js/mic.js`: microphone. `app/js/audio.js`: Web Audio, scheduler.
- `app/js/diagrams.js`: SVG chord boxes, tab, guitar parts, hand, fretboard.
- `app/sw.js`: offline cache. Bump `CACHE` with every release, and `VERSION` in `app.js`.

## Commands
- Tests: `npm test` (pitch accuracy on synthetic plucks for all strings, content integrity).
- Preview: `.claude/launch.json` config `geetar` (port 8765).

## Status (2026-10-18)
v1.1.0: welcome screen (name only), tagline under the title, Android app with AdMob. Release AAB and APK built and signed (`releases/v1.1.0-1/`); release APK tested on the Tab S9 FE (welcome, home, tuner with microphone, lessons, back button, progress after restart). Debug build tested with test ads (banner on home, hidden on tuner; interstitial after the 2nd lesson). Real ads return "no fill" until AdMob reviews the app after the Play listing is linked. Not yet submitted to Play; web update not yet uploaded to Hostinger. Tuner not yet tried with a real guitar.
