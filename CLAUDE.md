# Geetar

Guitar-learning web app (PWA) for Homi's daughter Parishay ("Pari"), who is a complete beginner. Plain HTML, CSS and ES-module JavaScript in `app/`, no build step and no dependencies. Publisher: HomiLabs.

## Locked
- Name **Geetar**; dedicated to Pari (home screen and About).
- Every HomiLabs app shows the HomiLabs logo (`app/img/homilabs.svg`, same mark as tools.homilabs.org) and the lines **Created By: HomiLabs** and **Managed By: Awaiz Fatima** (About screen and home footer).
- Three level brackets: Basic, Medium, Expert. Basic assumes no music knowledge: explain every word, use string numbers and plain "tighten / loosen" language.
- No accounts, ads, analytics or network calls except the Google font. Microphone audio never leaves the browser.
- Only traditional or public-domain melodies, and no lyrics.
- Sounds are synthesised (Karplus-Strong in `app/js/pluck.js`); no homidev assets are used yet.

## Locations
- Project: `/mnt/storage/projects/guitar`
- Hosting: https://tools.homilabs.org/guitar_app/ (static Hostinger; manual upload of `homilabs_tools/site/guitar_app/`, filled by `scripts/deploy-to-tools-site.sh`). Hub card and privacy/terms sections use the slug `geetar`.
- Local backup: `/mnt/storage/project_backups/guitar_backup/`
- Google Drive: folder `1W_5-DH-Mr6G6pWkyADM7QueIXUiH7O1z` (rclone remote `gdrive`)
- GitHub (**public**): `git@github.com:AwaizFatima08/guitar.git`
- Backup: `bash scripts/backup.sh` (commit first).

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
v1.0.0 built and tested in the browser (all 54 pages render; tuner and Play along verified with a synthetic microphone signal). Not yet tested with a real guitar and microphone. Ideas for later are in `docs/features.md`.
