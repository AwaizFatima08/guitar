# Geetar

A guitar-learning web app for complete beginners, made by HomiLabs and **dedicated to Pari**.

Live at **https://tools.homilabs.org/guitar_app/** (after upload, see below).

- **Tuner** using the microphone, in plain words ("too low, tighten"), with reference tones and a tick for each tuned string.
- **27 lessons** in three levels: Basic (10), Medium (9), Expert (8). Every lesson has a goal, steps, sounds, quizzes and a checklist.
- **Chord library** of 29 chords with diagrams you can hear.
- **Songs in tab** (all traditional or public domain), played by the app or in **Play along** mode, where the app listens and moves on when you play the right note.
- **Practice tools**: metronome, strumming trainer, one-minute chord changes, fretboard explorer, find-the-note game, capo helper.
- Practice timer, daily goal and streak. Works offline and installs to the home screen.

No accounts, no ads, no tracking. Progress is kept in the browser.

Created By: HomiLabs · Managed By: Awaiz Fatima

## Run locally
```bash
python3 -m http.server 8765 --directory app --bind 127.0.0.1
```
Open http://localhost:8765. The microphone works on localhost and on https only.

## Test
```bash
npm test
```
Node 18+ runs the pitch detector against synthetic guitar plucks and checks that every lesson, chord and song is valid.

## Publish
```bash
bash scripts/deploy-to-tools-site.sh
```
This copies `app/` into `/mnt/storage/projects/homilabs_tools/site/guitar_app/`. Then upload that folder, including its hidden `.htaccess`, to `public_html/guitar_app/` of tools.homilabs.org in Hostinger's File Manager. After any change to app files, raise `CACHE` in `app/sw.js` and `VERSION` in `app/js/app.js` so installed copies update.

## Backup
```bash
bash scripts/backup.sh
```
Local copy, Google Drive and GitHub. Commit first.
