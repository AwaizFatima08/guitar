// Geetar: app shell, router, pages and widgets.
import { CHORDS, SONGS, STRUMS, PROGRESSIONS, STRINGS, NOTE_NAMES, midiToFreq, noteName, stringFretMidi, transposeChord, songBeats } from './music.js';
import { LEVELS, LESSONS, lessonById, lessonsFor } from './lessons.js';
import { audioCtx, playNote, strum, click, Scheduler, newBus } from './audio.js';
import { chordDiagram, tabDiagram, guitarParts, handDiagram, fretboard } from './diagrams.js';
import { detectPitch, describeReading, Smoother, centsOff } from './pitch.js';
import { startMic, stopMic, micErrorText } from './mic.js';

export const VERSION = '1.1.0';

// ---------- Android app bridge ----------
// Inside the Play Store app the page is served from 127.0.0.1 by the Flutter shell, which adds a
// JavaScript channel (GeetarNative) and a boot file with saved progress and app settings.
const IN_APP = location.hostname === '127.0.0.1' && !!window.GeetarNative;
let APP = { ads: false, privacyOptions: false, version: VERSION };
let bootState = null;
if (IN_APP) {
  try {
    const t = new URLSearchParams(location.search).get('t') || '';
    const r = await fetch(`__geetar/boot.json?t=${encodeURIComponent(t)}`, { cache: 'no-store' });
    const b = await r.json();
    APP = { ...APP, ...(b.app || {}) };
    bootState = b.state ? JSON.parse(b.state) : null;
  } catch (e) { /* boot file missing: run like the web version */ }
}
// The shell calls this after the ads consent step, e.g. to show the "Ad privacy choices" button.
window.__geetarApp = (o) => { Object.assign(APP, o || {}); if (/^#\/about/.test(location.hash)) render(); };
function native(type, data = {}) {
  if (!IN_APP) return;
  try { window.GeetarNative.postMessage(JSON.stringify({ type, ...data })); } catch (e) { /* ignore */ }
}

// ---------- tiny DOM helper ----------
function h(tag, props = {}, ...kids) {
  const e = document.createElement(tag);
  for (const [k, v] of Object.entries(props || {})) {
    if (v == null || v === false) continue;
    if (k === 'class') e.className = v;
    else if (k === 'html') e.innerHTML = v;
    else if (k.startsWith('on')) e.addEventListener(k.slice(2), v);
    else if (k === 'style') e.setAttribute('style', v);
    else e.setAttribute(k, v === true ? '' : v);
  }
  for (const kid of kids.flat()) if (kid != null && kid !== false) e.append(kid.nodeType ? kid : document.createTextNode(String(kid)));
  return e;
}
const icon = (name) => h('span', { class: `ico ico-${name}`, 'aria-hidden': 'true' });

// ---------- storage ----------
const KEY = 'geetar.v1';
const defaults = () => ({ name: '', onboarded: false, goal: 10, theme: 'auto', done: {}, checks: {}, best: {}, history: {}, days: {}, timerStart: null });
let S = defaults();
try {
  const raw = localStorage.getItem(KEY);
  // The app shell keeps a copy of the progress, in case the WebView storage is ever cleared.
  S = { ...defaults(), ...(raw ? JSON.parse(raw) : bootState || {}) };
  if (!raw && bootState) localStorage.setItem(KEY, JSON.stringify(S)); // restored from the app's copy
} catch (e) { /* storage blocked: keep defaults */ }
function save() {
  const json = JSON.stringify(S);
  try { localStorage.setItem(KEY, json); } catch (e) { /* ignore */ }
  native('save', { state: json });
}
const dayKey = (d = new Date()) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
function addActivity(secs = 0) {
  const k = dayKey();
  const d = S.days[k] || { secs: 0, acts: 0 };
  d.secs += Math.round(secs); d.acts += 1;
  S.days[k] = d; save();
}
function streak() {
  let n = 0; const d = new Date();
  if (!S.days[dayKey(d)]) d.setDate(d.getDate() - 1); // today not started yet: count from yesterday
  while (S.days[dayKey(d)]) { n++; d.setDate(d.getDate() - 1); }
  return n;
}
function todaySecs() {
  let s = (S.days[dayKey()] || {}).secs || 0;
  if (S.timerStart) s += Math.min(7200, (Date.now() - S.timerStart) / 1000);
  return s;
}
function stopTimer() {
  if (!S.timerStart) return;
  const secs = Math.min(7200, (Date.now() - S.timerStart) / 1000);
  S.timerStart = null; addActivity(secs);
}
const levelProgress = (lvl) => { const ls = lessonsFor(lvl); return { done: ls.filter((l) => S.done[l.id]).length, total: ls.length }; };
const nextLesson = () => LESSONS.find((l) => !S.done[l.id]);

function applyTheme() {
  const r = document.documentElement;
  if (S.theme === 'auto') r.removeAttribute('data-theme'); else r.setAttribute('data-theme', S.theme);
}

// ---------- router ----------
let cleanups = [];
const onLeave = (fn) => cleanups.push(fn);
const main = document.getElementById('main');

const routes = [
  [/^#?\/?(home)?$/, pageHome, 'home'],
  [/^#\/learn$/, pageLearn, 'learn'],
  [/^#\/level\/(basic|medium|expert)$/, pageLevel, 'learn'],
  [/^#\/lesson\/(\w+)$/, pageLesson, 'learn'],
  [/^#\/tuner$/, pageTuner, 'tuner'],
  [/^#\/chords$/, pageChords, 'chords'],
  [/^#\/practice$/, pagePractice, 'practice'],
  [/^#\/tool\/(\w+)$/, pageTool, 'practice'],
  [/^#\/songs$/, pageSongs, 'practice'],
  [/^#\/song\/(\w+)$/, pageSong, 'practice'],
  [/^#\/glossary$/, pageGlossary, 'learn'],
  [/^#\/about$/, pageAbout, 'about'],
];

function render() {
  cleanups.forEach((f) => { try { f(); } catch (e) { console.error(e); } });
  cleanups = [];
  stopMic();
  const hash = location.hash || '#/';
  let view = null, tab = 'home';
  for (const [re, fn, t] of routes) {
    const m = re.exec(hash);
    if (m) { view = fn(...m.slice(1)); tab = t; break; }
  }
  if (!view) { view = pageHome(); tab = 'home'; }
  if (!S.onboarded) { view = pageWelcome(); tab = 'welcome'; }
  document.body.classList.toggle('welcome-mode', tab === 'welcome');
  main.replaceChildren(view.node);
  // Banner ads (Android app only) are allowed on menu screens, never where you play or tune.
  const menuScreens = ['#/', '#', '', '#/home', '#/learn', '#/practice', '#/songs', '#/glossary'];
  native('page', { route: hash, banner: S.onboarded && (menuScreens.includes(hash) || /^#\/level\//.test(hash)) });
  document.title = view.title ? `${view.title} · Geetar` : 'Geetar: learn guitar';
  document.querySelectorAll('.tabbar a').forEach((a) => a.toggleAttribute('aria-current', a.dataset.tab === tab));
  window.scrollTo(0, 0);
  main.focus({ preventScroll: true });
}
window.addEventListener('hashchange', render);

// ---------- shared bits ----------
const back = (to, label) => h('a', { class: 'back', href: to }, '‹ ', label);
const levelChip = (lvl) => h('span', { class: `chip lvl-${lvl}` }, LEVELS[lvl].emoji, ' ', LEVELS[lvl].name);
function progressBar(done, total, lvl) {
  return h('div', { class: `bar lvl-${lvl || 'any'}`, role: 'progressbar', 'aria-valuemin': 0, 'aria-valuemax': total, 'aria-valuenow': done },
    h('span', { style: `width:${total ? (100 * done) / total : 0}%` }));
}
function credits() {
  return h('div', { class: 'credits' },
    h('img', { src: 'img/homilabs.svg', alt: 'HomiLabs logo', width: 34, height: 34 }),
    h('div', {}, h('div', {}, h('b', {}, 'Created By: '), 'HomiLabs'), h('div', {}, h('b', {}, 'Managed By: '), 'Awaiz Fatima')));
}
function fmtMin(secs) { const m = Math.floor(secs / 60); return m < 1 ? '0 min' : `${m} min`; }
function toast(msg) {
  const t = h('div', { class: 'toast', role: 'status' }, msg);
  document.body.append(t);
  setTimeout(() => t.classList.add('out'), 2200);
  setTimeout(() => t.remove(), 2700);
}

// ---------- WELCOME (first start) ----------
function pageWelcome() {
  const nameIn = h('input', { type: 'text', maxlength: 20, placeholder: 'Your name', 'aria-label': 'Your name', autocomplete: 'given-name' });
  const go = h('button', { class: 'btn btn-primary btn-wide', disabled: true }, 'Let’s play! 🎸');
  nameIn.addEventListener('input', () => { go.disabled = !nameIn.value.trim(); });
  const start = () => {
    if (!nameIn.value.trim()) return;
    S.name = nameIn.value.trim(); S.onboarded = true; save();
    location.hash = '#/'; render();
  };
  go.addEventListener('click', start);
  nameIn.addEventListener('keydown', (e) => { if (e.key === 'Enter') start(); });
  setTimeout(() => nameIn.focus(), 50);
  return { title: 'Welcome', node: h('div', { class: 'page welcome' },
    h('img', { class: 'welcome-logo', src: 'img/geetar.svg', alt: 'Geetar logo', width: 112, height: 112 }),
    h('h1', {}, 'Geetar'),
    h('p', { class: 'dedic' }, '💜 Made with Love for Pari'),
    h('p', { class: 'lead' }, 'Learn guitar from zero: a tuner, step-by-step lessons, chords, songs and practice games. No music knowledge needed.'),
    h('section', { class: 'card' },
      h('label', { class: 'welcome-label' }, 'What should we call you?', nameIn),
      h('p', { class: 'muted small' }, 'Just your first name or a nickname. No account and no sign-in: it stays on this device.'),
      go),
    h('div', { class: 'welcome-foot' }, credits())) };
}

// ---------- HOME ----------
function pageHome() {
  const nl = nextLesson();
  const timerLabel = h('span', { class: 'big' });
  const ring = h('div', { class: 'ring' });
  const timerBtn = h('button', { class: 'btn' });
  const upd = () => {
    const secs = todaySecs();
    const pct = Math.min(1, secs / 60 / S.goal);
    ring.style.setProperty('--p', pct);
    ring.textContent = Math.floor(secs / 60);
    timerLabel.textContent = S.timerStart ? `Practising… ${fmtClock((Date.now() - S.timerStart) / 1000)}` : `${fmtMin(secs)} of ${S.goal} min today`;
    timerBtn.textContent = S.timerStart ? '■ Stop practice' : '▶ Start practice timer';
    timerBtn.classList.toggle('btn-primary', !S.timerStart);
  };
  timerBtn.addEventListener('click', () => { if (S.timerStart) { stopTimer(); toast('Practice saved. Great work!'); } else { S.timerStart = Date.now(); save(); } upd(); });
  upd();
  const iv = setInterval(upd, 1000); onLeave(() => clearInterval(iv));
  const st = streak();

  const node = h('div', { class: 'page home' },
    h('section', { class: 'hero' },
      h('img', { class: 'hero-logo', src: 'img/geetar.svg', alt: '', width: 84, height: 84 }),
      h('div', {},
        h('h1', { class: 'hero-title' }, 'Geetar'),
        h('p', { class: 'dedic' }, '💜 Made with Love for Pari'))),
    h('p', { class: 'greet' }, h('b', {}, `Hi ${S.name || 'there'}! 👋`), ' Ready to play? Tune up, then pick up where you left off.'),
    nl ? h('a', { class: 'card continue', href: `#/lesson/${nl.id}` },
      h('div', { class: 'card-kicker' }, S.done.b1 ? 'Continue' : 'Start here', ' · ', levelChip(nl.level)),
      h('h2', {}, nl.title), h('p', {}, nl.goal),
      h('span', { class: 'btn btn-primary' }, S.done.b1 ? 'Continue lesson ›' : 'Start lesson 1 ›'))
      : h('div', { class: 'card continue' }, h('h2', {}, '🏆 All lessons done!'), h('p', {}, 'You finished every level. Keep practising songs and try the tools.')),
    h('div', { class: 'grid2' },
      h('div', { class: 'card today' },
        h('div', { class: 'today-top' }, ring, h('div', {}, timerLabel, h('div', { class: 'muted' }, st ? `🔥 ${st}-day streak` : 'Practise today to start a streak'))),
        timerBtn),
      h('a', { class: 'card tune-first', href: '#/tuner' },
        h('div', { class: 'tf-ico' }, '🎯'), h('div', {}, h('h3', {}, 'Tune first'), h('p', { class: 'muted' }, 'Every time you pick up the guitar. It takes a minute.')))),
    h('h2', { class: 'section' }, 'Your path'),
    h('div', { class: 'levels' }, ...Object.keys(LEVELS).map((k) => {
      const p = levelProgress(k);
      return h('a', { class: `card level lvl-${k}`, href: `#/level/${k}` },
        h('div', { class: 'level-emoji' }, LEVELS[k].emoji),
        h('div', { class: 'level-body' }, h('h3', {}, LEVELS[k].name), h('p', { class: 'muted' }, LEVELS[k].tag), progressBar(p.done, p.total, k), h('small', { class: 'muted' }, `${p.done} of ${p.total} lessons`)));
    })),
    h('h2', { class: 'section' }, 'Tools'),
    h('div', { class: 'tools' },
      toolTile('#/tuner', '🎯', 'Tuner'), toolTile('#/chords', '🖐️', 'Chords'), toolTile('#/tool/metronome', '⏱️', 'Metronome'),
      toolTile('#/tool/strum', '↕️', 'Strumming'), toolTile('#/songs', '🎵', 'Songs'), toolTile('#/glossary', '📖', 'Words')),
    h('footer', { class: 'home-foot' }, credits(), h('a', { href: '#/about' }, 'About Geetar')));
  return { title: 'Home', node };
}
const toolTile = (href, emo, label) => h('a', { class: 'tile', href }, h('span', { class: 'tile-emo' }, emo), label);
const fmtClock = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;

// ---------- LEARN ----------
function pageLearn() {
  const node = h('div', { class: 'page' },
    h('h1', {}, 'Lessons'),
    h('p', { class: 'lead' }, 'Three levels. Go in order if you are new. Each lesson takes 5 to 20 minutes, and you can repeat any lesson as often as you like.'),
    ...Object.keys(LEVELS).map((k) => levelSection(k, true)),
    h('a', { class: 'card glossary-link', href: '#/glossary' }, '📖 ', h('b', {}, 'Guitar words'), ' — what is a fret, a chord, a bar? Look it up here.'));
  return { title: 'Lessons', node };
}
function levelSection(k, withHead) {
  const p = levelProgress(k);
  const nl = nextLesson();
  return h('section', { class: `level-sec lvl-${k}` },
    withHead ? h('div', { class: 'level-head' }, h('h2', {}, LEVELS[k].emoji, ' ', LEVELS[k].name), h('span', { class: 'muted' }, `${p.done}/${p.total}`)) : null,
    withHead ? h('p', { class: 'muted' }, LEVELS[k].tag) : null,
    progressBar(p.done, p.total, k),
    h('ol', { class: 'lesson-list' }, ...lessonsFor(k).map((l, i) =>
      h('li', {}, h('a', { href: `#/lesson/${l.id}`, class: S.done[l.id] ? 'done' : '' },
        h('span', { class: 'num' }, S.done[l.id] ? '✓' : String(i + 1)),
        h('span', { class: 'lt' }, h('b', {}, l.title), h('small', { class: 'muted' }, `${l.minutes} min · ${l.goal}`)),
        nl && nl.id === l.id ? h('span', { class: 'chip next' }, 'Next') : null)))));
}
function pageLevel(k) {
  const node = h('div', { class: 'page' }, back('#/learn', 'All lessons'),
    h('h1', {}, LEVELS[k].emoji, ' ', LEVELS[k].name), h('p', { class: 'lead' }, LEVELS[k].tag), levelSection(k, false));
  return { title: LEVELS[k].name, node };
}

function pageLesson(id) {
  const l = lessonById(id);
  if (!l) return { title: 'Not found', node: h('div', { class: 'page' }, h('p', {}, 'Lesson not found.'), back('#/learn', 'Lessons')) };
  const list = lessonsFor(l.level);
  const idx = LESSONS.indexOf(l);
  const prev = LESSONS[idx - 1], next = LESSONS[idx + 1];
  const checks = S.checks[id] || {};
  const doneBtn = h('button', { class: 'btn btn-primary btn-wide' });
  const updDone = () => { doneBtn.textContent = S.done[id] ? '✓ Lesson done (tap to undo)' : 'Mark lesson as done'; doneBtn.classList.toggle('is-done', !!S.done[id]); };
  doneBtn.addEventListener('click', () => {
    if (S.done[id]) delete S.done[id];
    else {
      S.done[id] = dayKey(); addActivity(0); celebrate(l);
      // The app shell decides (with its own caps) whether a short ad may follow a finished lesson.
      native('lessonDone', { id, doneToday: Object.values(S.done).filter((d) => d === dayKey()).length });
    }
    save(); updDone();
  });
  updDone();
  const node = h('article', { class: `page lesson lvl-${l.level}` },
    back(`#/level/${l.level}`, `${LEVELS[l.level].name} lessons`),
    h('div', { class: 'lesson-kicker' }, levelChip(l.level), h('span', { class: 'muted' }, `Lesson ${list.indexOf(l) + 1} of ${list.length} · ${l.minutes} min`)),
    h('h1', {}, l.title),
    h('p', { class: 'goal' }, h('b', {}, 'Goal: '), l.goal),
    ...l.blocks.map(renderBlock),
    h('section', { class: 'card checklist' },
      h('h3', {}, 'Can you do it?'),
      ...l.check.map((c, i) => {
        const cb = h('input', { type: 'checkbox', id: `ck-${id}-${i}` });
        cb.checked = !!checks[i];
        cb.addEventListener('change', () => { S.checks[id] = { ...(S.checks[id] || {}), [i]: cb.checked }; save(); });
        return h('label', { class: 'check', for: `ck-${id}-${i}` }, cb, h('span', {}, c));
      }),
      h('p', { class: 'muted small' }, 'Not yet? That is fine. Repeat the lesson tomorrow; it gets easier every time.'),
      doneBtn),
    h('nav', { class: 'pager' },
      prev ? h('a', { class: 'btn', href: `#/lesson/${prev.id}` }, '‹ ', prev.title) : h('span'),
      next ? h('a', { class: 'btn', href: `#/lesson/${next.id}` }, next.title, ' ›') : h('span')));
  return { title: l.title, node };
}

function celebrate(l) {
  const lvlDone = levelProgress(l.level);
  const msg = lvlDone.done === lvlDone.total ? `🎉 You finished the ${LEVELS[l.level].name} level!` : '🎉 Lesson done!';
  toast(msg);
  const c = audioCtx();
  [72, 76, 79, 84].forEach((m, i) => playNote(m, { when: c.currentTime + i * 0.09, gain: 0.35, bright: 0.7 }));
}

// ---------- lesson blocks ----------
function renderBlock(b) {
  if (b.p) return h('p', { html: b.p });
  if (b.h) return h('h2', { class: 'block-h' }, b.h);
  if (b.tip) return h('aside', { class: 'tip' }, h('b', {}, '💡 Tip '), h('span', { html: b.tip }));
  if (b.warn) return h('aside', { class: 'warn' }, h('b', {}, '⚠️ Careful '), h('span', { html: b.warn }));
  if (b.steps) return h('ol', { class: 'steps' }, ...b.steps.map((s) => h('li', { html: s })));
  if (b.table) return h('div', { class: 'table-wrap' }, h('table', {},
    h('thead', {}, h('tr', {}, ...b.table.head.map((x) => h('th', {}, x)))),
    h('tbody', {}, ...b.table.rows.map((r) => h('tr', {}, ...r.map((x) => h('td', {}, x)))))));
  if (b.img === 'parts') return h('figure', { class: 'figure' }, guitarParts(), h('figcaption', {}, 'The parts of an acoustic guitar'));
  if (b.img === 'hand') return h('figure', { class: 'figure hand' }, handDiagram(), h('figcaption', {}, 'Fretting hand finger numbers (left hand for right-handed players)'));
  if (b.chords) return h('div', { class: 'chord-grid' }, ...b.chords.map((c) => chordCard(c)));
  if (b.song) return songPlayer(b.song);
  if (b.strings) return stringsWidget();
  if (b.fretplay) return fretPlay(b.fretplay);
  if (b.strum) return strumTrainer(b.strum);
  if (b.metronome) return metronome(b.metronome);
  if (b.changes) return changesTrainer(b.changes);
  if (b.quiz) return quiz(b.quiz);
  if (b.link) return h('p', {}, h('a', { class: 'btn btn-primary', href: b.link.to }, b.link.label, ' ›'));
  if (b.capo) return capoHelper();
  if (b.notefind) return noteFinder();
  if (b.fretnames) return fretPlay({ frets: 12, names: true });
  return h('div');
}

// ---------- widgets ----------
function chordCard(name, { compact = false } = {}) {
  const ch = CHORDS[name];
  if (!ch) return h('div', { class: 'card' }, `Unknown chord ${name}`);
  const diag = chordDiagram(ch, { title: name });
  const play = () => strum(ch);
  const slow = () => { const c = audioCtx(); ch.frets.forEach((f, i) => { if (f >= 0) playNote(STRINGS[i].midi + f, { when: c.currentTime + i * 0.28 }); }); };
  return h('div', { class: `card chord-card lvl-${ch.level}${compact ? ' compact' : ''}` },
    h('div', { class: 'chord-name' }, h('b', {}, name), h('small', { class: 'muted' }, ch.name)),
    h('button', { class: 'diagram-btn', 'aria-label': `Play ${ch.name}`, onclick: play }, diag),
    compact ? null : h('div', { class: 'row' },
      h('button', { class: 'btn btn-sm', onclick: play }, '▶ Strum'),
      h('button', { class: 'btn btn-sm', onclick: slow }, '♪ One by one')),
    compact ? null : h('small', { class: 'muted mood' }, `Sounds: ${ch.mood}`));
}

function stringsWidget() {
  return h('div', { class: 'strings-w' }, ...STRINGS.map((s) => {
    const b = h('button', { class: 'string-btn', style: `--thick:${(7 - s.num) * 0.6 + 1}px` },
      h('span', { class: 'sn' }, s.num), h('span', { class: 'sname' }, s.name), h('small', {}, s.hint), h('i', { class: 'wire' }));
    b.addEventListener('click', () => { playNote(s.midi, { gain: 0.7 }); b.classList.remove('ring'); void b.offsetWidth; b.classList.add('ring'); });
    return b;
  }));
}

function fretPlay({ frets = 5, mark = [], names = false }) {
  const out = h('div', { class: 'fp-info muted' }, 'Tap a spot to hear it.');
  const fb = fretboard({
    frets, mark, showNames: names,
    onTap: (s, f, midi, g) => {
      playNote(midi, { gain: 0.7 });
      g.classList.add('show', 'hit'); setTimeout(() => g.classList.remove('hit'), 300);
      out.textContent = `String ${s}, ${f === 0 ? 'open' : 'fret ' + f}: the note ${noteName(midi)}`;
    },
  });
  return h('div', { class: 'card fretplay' }, h('div', { class: 'hscroll' }, fb.svg), out);
}

function songPlayer(arg) {
  const song = typeof arg === 'string' ? SONGS[arg] : arg;
  const { svg, noteEls, xs } = tabDiagram(song);
  const scroller = h('div', { class: 'hscroll tab-scroll' }, svg);
  let bpm = song.bpm;
  const bpmOut = h('output', {}, bpm);
  const slider = h('input', { type: 'range', min: 40, max: 160, step: 5, value: bpm, 'aria-label': 'Speed (beats per minute)' });
  slider.addEventListener('input', () => { bpm = +slider.value; bpmOut.textContent = bpm; });
  const loopCb = h('input', { type: 'checkbox' });
  const clickCb = h('input', { type: 'checkbox', checked: true });
  const playBtn = h('button', { class: 'btn btn-primary' }, '▶ Play');
  const listenBtn = h('button', { class: 'btn' }, '🎤 Play along');
  const status = h('div', { class: 'song-status muted' }, 'Press Play to hear it, or Play along and the app listens to you.');
  let bus = null, raf = null, playing = false, listening = false;

  const highlight = (k) => {
    noteEls.forEach((g, i) => g.classList.toggle('now', i === k));
    if (k >= 0) {
      const target = xs[k] - scroller.clientWidth / 3;
      if (Math.abs(scroller.scrollLeft - target) > 40) scroller.scrollTo({ left: target, behavior: 'smooth' });
    }
  };
  const stopAll = () => {
    if (bus) { bus.disconnect(); bus = null; }
    if (raf) cancelAnimationFrame(raf); raf = null;
    if (listening) stopMic();
    playing = false; listening = false;
    playBtn.textContent = '▶ Play'; listenBtn.textContent = '🎤 Play along';
    highlight(-1);
  };
  onLeave(stopAll);

  function play() {
    stopAll();
    const c = audioCtx();
    bus = newBus();
    playing = true; playBtn.textContent = '■ Stop';
    const spb = 60 / bpm;
    const t0 = c.currentTime + 0.15;
    const countIn = song.beatsPerBar;
    for (let i = 0; i < countIn; i++) click(t0 + i * spb, i === 0, bus);
    const start = t0 + countIn * spb;
    const times = [];
    let t = start;
    song.notes.forEach((nt) => {
      times.push(t);
      if (!nt.r) playNote(stringFretMidi(nt.s, nt.f), { when: t, gain: nt.t ? 0.45 : 0.65, duration: Math.max(0.15, nt.b * spb * 0.98), out: bus });
      t += nt.b * spb;
    });
    const total = songBeats(song);
    if (clickCb.checked) for (let bt = 0; bt < total; bt++) click(start + bt * spb, bt % song.beatsPerBar === 0, bus);
    const end = t;
    status.textContent = 'Listen and follow the highlighted note…';
    const loop = () => {
      const now = c.currentTime;
      if (now < start) { status.textContent = `Get ready… ${countIn - Math.floor((now - t0) / spb)}`; }
      else {
        let k = times.length - 1; while (k > 0 && times[k] > now) k--;
        highlight(k);
        status.textContent = 'Follow the highlighted note…';
      }
      if (now > end + 0.3) {
        if (loopCb.checked) { play(); return; }
        stopAll(); addActivity(0); status.textContent = 'Done! Press Play again, or try Play along.'; return;
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
  }

  async function listen() {
    stopAll();
    listening = true; listenBtn.textContent = '■ Stop listening';
    let k = 0, hits = 0, needOnset = false, peak = 0, dip = 0;
    const skipRests = () => { while (k < song.notes.length && song.notes[k].r) k++; };
    skipRests();
    const showTarget = () => {
      highlight(k);
      const nt = song.notes[k];
      status.innerHTML = `Your turn: play <b>string ${nt.s}, ${nt.f === 0 ? 'open' : 'fret ' + nt.f}</b> (${noteName(stringFretMidi(nt.s, nt.f))}). Note ${k + 1} of ${song.notes.length}.`;
    };
    showTarget();
    try {
      await startMic((buf, sr) => {
        if (!listening) return;
        let rms = 0;
        for (let i = 0; i < buf.length; i++) rms += buf[i] * buf[i];
        rms = Math.sqrt(rms / buf.length);
        // Loudness envelope since the last accepted note: a new pluck is a dip followed by a rise.
        if (rms > peak) { peak = rms; dip = rms; } else dip = Math.min(dip, rms);
        const freshPluck = dip < peak * 0.6 && rms > dip * 1.5;
        const r = detectPitch(buf, sr);
        if (!r || r.clarity < 0.8) { hits = 0; return; }
        const want = midiToFreq(stringFretMidi(song.notes[k].s, song.notes[k].f));
        let cents = Math.abs(centsOff(r.freq, want));
        cents = Math.min(cents, Math.abs(cents - 1200)); // forgive octave confusion
        if (cents > 45) { hits = 0; return; }
        if (needOnset && !freshPluck) return; // same note again: wait for a new pluck
        needOnset = false;
        if (++hits < 2) return;
        hits = 0;
        const prevMidi = stringFretMidi(song.notes[k].s, song.notes[k].f);
        noteEls[k].classList.add('got');
        k++; skipRests();
        if (k >= song.notes.length) {
          stopAll(); noteEls.forEach((g) => g.classList.remove('got'));
          status.textContent = '🎉 You played the whole thing! Brilliant.'; addActivity(0);
          celebrate({ level: song.level || 'basic' });
          return;
        }
        needOnset = stringFretMidi(song.notes[k].s, song.notes[k].f) === prevMidi;
        peak = rms; dip = rms;
        showTarget();
      });
    } catch (err) { stopAll(); status.textContent = micErrorText(err); }
  }

  playBtn.addEventListener('click', () => (playing ? stopAll() : play()));
  listenBtn.addEventListener('click', () => (listening ? (stopAll(), noteEls.forEach((g) => g.classList.remove('got'))) : listen()));
  return h('section', { class: 'card song' },
    h('h3', {}, '🎵 ', song.title), song.about ? h('p', { class: 'muted small' }, song.about) : null,
    scroller, status,
    h('div', { class: 'controls' }, playBtn, listenBtn,
      h('label', { class: 'slider' }, 'Speed ', slider, bpmOut),
      h('label', { class: 'inline' }, clickCb, ' Click'),
      h('label', { class: 'inline' }, loopCb, ' Repeat')));
}

function strumTrainer({ pattern = 'quarters', chords = ['Em'], bpm = 70, pickers = false }) {
  let pat = pattern, list = [...chords];
  let bpmV = bpm;
  const slotsRow = h('div', { class: 'strum-slots' });
  const countRow = h('div', { class: 'strum-count' });
  const chordNow = h('div', { class: 'strum-chord' });
  const chordNext = h('div', { class: 'strum-next muted' });
  const listLine = h('b', {});
  const playBtn = h('button', { class: 'btn btn-primary' }, '▶ Play');
  const soundCb = h('input', { type: 'checkbox', checked: true });
  const bpmOut = h('output', {}, bpmV);
  const slider = h('input', { type: 'range', min: 40, max: 160, step: 5, value: bpmV, 'aria-label': 'Speed (beats per minute)' });
  let sched = null, bus = null;
  const slotEls = [];
  const head = h('h3', {});
  const draw = () => {
    const p = STRUMS[pat].pattern;
    head.textContent = `↕️ Strum along: ${STRUMS[pat].name}`;
    listLine.textContent = list.join(' – ');
    slotEls.length = 0;
    slotsRow.replaceChildren(...[...p].map((c) => { const e = h('span', { class: `slot s-${c === '-' ? 'x' : c}` }, c === 'D' ? '↓' : c === 'U' ? '↑' : '·'); slotEls.push(e); return e; }));
    const counts = p.length === 6 ? ['1', '&', '2', '&', '3', '&'] : ['1', '&', '2', '&', '3', '&', '4', '&'];
    countRow.replaceChildren(...counts.map((c) => h('span', {}, c)));
    chordNow.textContent = list[0]; chordNext.textContent = list.length > 1 ? `then ${list[1]}` : '';
  };
  const stop = () => { if (sched) sched.stop(); sched = null; if (bus) bus.disconnect(); bus = null; playBtn.textContent = '▶ Play'; slotEls.forEach((e) => e.classList.remove('on')); };
  onLeave(stop);
  slider.addEventListener('input', () => { bpmV = +slider.value; bpmOut.textContent = bpmV; if (sched) sched.bpm = bpmV; });
  playBtn.addEventListener('click', () => {
    if (sched) { stop(); return; }
    const p = STRUMS[pat].pattern, len = p.length, countIn = len;
    // Gap (in ticks) from each slot to the next strum, so strums ring until the next one.
    const gaps = [...p].map((c, i) => { let g = 1; while (g < len && p[(i + g) % len] === '-') g++; return g; });
    bus = newBus();
    sched = new Scheduler({
      bpm: bpmV, ticksPerBeat: 2,
      onTick: (i, t) => {
        if (i < countIn) { if (i % 2 === 0) click(t, i === 0, bus); return; }
        const j = i - countIn, slot = j % len, bar = Math.floor(j / len);
        const ch = CHORDS[list[bar % list.length]];
        if (slot % 2 === 0) click(t, slot === 0, bus);
        const c = p[slot];
        if (c !== '-' && soundCb.checked) strum(ch, { when: t, dir: c, duration: gaps[slot] * sched.tickLen + 0.05, out: bus });
      },
      onVisual: (i) => {
        if (i < countIn) { chordNow.textContent = i % 2 === 0 ? `${countIn / 2 - i / 2}…` : chordNow.textContent; chordNext.textContent = `get ready: ${list[0]}`; return; }
        const j = i - countIn, slot = j % len, bar = Math.floor(j / len);
        slotEls.forEach((e, k) => e.classList.toggle('on', k === slot));
        chordNow.textContent = list[bar % list.length];
        chordNext.textContent = list.length > 1 ? `next: ${list[(bar + 1) % list.length]}` : '';
      },
    });
    sched.start(); playBtn.textContent = '■ Stop'; addActivity(0);
  });
  draw();
  let pickerRow = null;
  if (pickers) {
    const patSel = h('select', { 'aria-label': 'Strumming pattern' }, ...Object.entries(STRUMS).map(([k, v]) => h('option', { value: k, selected: k === pat }, `${v.name}  (${v.pattern.replaceAll('-', '·')})`)));
    const progSel = h('select', { 'aria-label': 'Chords' }, h('option', { value: '' }, 'Choose chords…'), ...Object.entries(PROGRESSIONS).map(([k, v]) => h('option', { value: k }, v.name)));
    patSel.addEventListener('change', () => { stop(); pat = patSel.value; draw(); });
    progSel.addEventListener('change', () => { if (!progSel.value) return; stop(); list = [...PROGRESSIONS[progSel.value].chords]; draw(); });
    pickerRow = h('div', { class: 'pickers' }, h('label', {}, 'Pattern ', patSel), h('label', {}, 'Chords ', progSel));
  }
  return h('section', { class: 'card strum' },
    head,
    pickerRow,
    h('div', { class: 'strum-stage' }, h('div', {}, chordNow, chordNext), h('div', { class: 'strum-grid' }, slotsRow, countRow)),
    h('p', { class: 'muted small' }, '↓ down-strum · ↑ up-strum · · keep your hand moving but miss the strings. One chord per bar: ', listLine),
    h('div', { class: 'controls' }, playBtn,
      h('label', { class: 'slider' }, 'Speed ', slider, bpmOut),
      h('label', { class: 'inline' }, soundCb, ' Guitar sound')));
}

function metronome(start = 80, big = false) {
  let bpm = typeof start === 'number' ? start : 80, bpb = 4;
  const out = h('output', { class: 'met-bpm' }, bpm);
  const dots = h('div', { class: 'met-dots' });
  const drawDots = () => dots.replaceChildren(...Array.from({ length: bpb }, (_, i) => h('span', { class: i === 0 ? 'acc' : '' })));
  drawDots();
  const slider = h('input', { type: 'range', min: 40, max: 200, value: bpm, 'aria-label': 'Beats per minute' });
  const setBpm = (v) => { bpm = Math.max(40, Math.min(200, Math.round(v))); out.textContent = bpm; slider.value = bpm; if (sched) sched.bpm = bpm; tempoName.textContent = tempoWord(bpm); };
  const tempoName = h('div', { class: 'muted small' }, tempoWord(bpm));
  slider.addEventListener('input', () => setBpm(+slider.value));
  let sched = null, bus = null;
  const btn = h('button', { class: 'btn btn-primary' }, '▶ Start');
  const stop = () => { if (sched) sched.stop(); sched = null; if (bus) bus.disconnect(); bus = null; btn.textContent = '▶ Start'; [...dots.children].forEach((d) => d.classList.remove('on')); };
  onLeave(stop);
  btn.addEventListener('click', () => {
    if (sched) return stop();
    bus = newBus();
    sched = new Scheduler({ bpm, ticksPerBeat: 1,
      onTick: (i, t) => click(t, i % bpb === 0, bus),
      onVisual: (i) => [...dots.children].forEach((d, k) => d.classList.toggle('on', k === i % bpb)) });
    sched.start(); btn.textContent = '■ Stop'; addActivity(0);
  });
  const taps = [];
  const tap = h('button', { class: 'btn' }, 'Tap tempo');
  tap.addEventListener('click', () => {
    const now = performance.now();
    if (taps.length && now - taps[taps.length - 1] > 2000) taps.length = 0;
    taps.push(now); if (taps.length > 5) taps.shift();
    if (taps.length >= 2) setBpm(60000 / ((taps[taps.length - 1] - taps[0]) / (taps.length - 1)));
  });
  const bpbSel = h('select', { 'aria-label': 'Beats per bar' }, ...[2, 3, 4, 6].map((n) => h('option', { value: n, selected: n === 4 }, `${n} beats per bar`)));
  bpbSel.addEventListener('change', () => { bpb = +bpbSel.value; drawDots(); });
  return h('section', { class: `card metronome${big ? ' big' : ''}` },
    h('h3', {}, '⏱️ Metronome'),
    h('div', { class: 'met-main' },
      h('button', { class: 'btn btn-round', 'aria-label': 'Slower', onclick: () => setBpm(bpm - 5) }, '−'),
      h('div', { class: 'met-read' }, out, h('div', { class: 'muted small' }, 'beats per minute'), tempoName),
      h('button', { class: 'btn btn-round', 'aria-label': 'Faster', onclick: () => setBpm(bpm + 5) }, '+')),
    slider, dots,
    h('div', { class: 'controls' }, btn, tap, bpbSel));
}
function tempoWord(b) { return b < 60 ? 'very slow' : b < 76 ? 'slow' : b < 108 ? 'walking pace' : b < 140 ? 'quick' : 'fast'; }

function changesTrainer([a0, b0]) {
  let a = a0, b = b0;
  const names = Object.keys(CHORDS);
  const sel = (v, set) => { const s = h('select', { 'aria-label': 'Chord' }, ...names.map((n) => h('option', { value: n, selected: n === v }, n))); s.addEventListener('change', () => { set(s.value); drawPair(); }); return s; };
  const pairBox = h('div', { class: 'chord-grid two' });
  const bestLine = h('p', { class: 'muted small' });
  const pairKey = () => [a, b].sort().join('-');
  const drawPair = () => {
    pairBox.replaceChildren(chordCard(a, { compact: true }), chordCard(b, { compact: true }));
    const best = S.best[pairKey()];
    const hist = (S.history[pairKey()] || []).slice(-5).map((x) => x.n).join(', ');
    bestLine.textContent = best ? `Best for ${a} ↔ ${b}: ${best} changes${hist ? ` · recent: ${hist}` : ''}` : `No score yet for ${a} ↔ ${b}.`;
  };
  const clock = h('div', { class: 'big-clock' }, '1:00');
  const btn = h('button', { class: 'btn btn-primary' }, '▶ Start one minute');
  const entry = h('div', { class: 'entry', hidden: true });
  let iv = null;
  const stop = () => { if (iv) clearInterval(iv); iv = null; };
  onLeave(stop);
  btn.addEventListener('click', () => {
    if (iv) { stop(); clock.textContent = '1:00'; btn.textContent = '▶ Start one minute'; return; }
    entry.hidden = true;
    const c = audioCtx();
    const t0 = performance.now() + 3000;
    [0, 1, 2].forEach((i) => click(c.currentTime + i, false));
    click(c.currentTime + 3, true);
    btn.textContent = '■ Cancel';
    let ended = false;
    iv = setInterval(() => {
      const left = 60 - (performance.now() - t0) / 1000;
      if (left > 60) { clock.textContent = `Ready… ${Math.ceil(left - 60)}`; return; }
      if (left <= 0 && !ended) {
        ended = true; stop();
        const cc = audioCtx(); [0, 0.18, 0.36].forEach((d) => click(cc.currentTime + d, true));
        clock.textContent = 'Time!'; btn.textContent = '▶ Again';
        showEntry(); return;
      }
      clock.textContent = fmtClock(Math.ceil(left));
    }, 100);
  });
  function showEntry() {
    let n = 15;
    const val = h('output', { class: 'big' }, n);
    const set = (v) => { n = Math.max(0, Math.min(150, v)); val.textContent = n; };
    entry.replaceChildren(h('p', {}, 'How many changes did you make? (Count one each time you switch.)'),
      h('div', { class: 'stepper' }, h('button', { class: 'btn btn-round', onclick: () => set(n - 1) }, '−'), val, h('button', { class: 'btn btn-round', onclick: () => set(n + 1) }, '+')),
      h('button', { class: 'btn btn-primary', onclick: () => {
        const k = pairKey();
        const isBest = !S.best[k] || n > S.best[k];
        if (isBest) S.best[k] = n;
        S.history[k] = [...(S.history[k] || []), { d: dayKey(), n }].slice(-30);
        save(); addActivity(60); entry.hidden = true; drawPair();
        toast(isBest ? `🏅 New best: ${n}!` : `Saved: ${n}. Keep going!`);
      } }, 'Save score'));
    entry.hidden = false;
  }
  drawPair();
  return h('section', { class: 'card changes' },
    h('h3', {}, '🔁 One-minute changes'),
    h('p', { class: 'muted small' }, 'Strum each chord once, then switch. Count how many times you switch in one minute.'),
    h('div', { class: 'pickers' }, h('label', {}, 'From ', sel(a, (v) => { a = v; })), h('label', {}, 'To ', sel(b, (v) => { b = v; }))),
    pairBox, clock, h('div', { class: 'controls' }, btn), entry, bestLine);
}

function quiz(qs) {
  let right = 0, answered = 0;
  const score = h('p', { class: 'quiz-score muted' });
  const wrap = h('section', { class: 'card quiz' }, h('h3', {}, '❓ Quick check'));
  qs.forEach((q, qi) => {
    const why = h('p', { class: 'why', hidden: true });
    const opts = q.options.map((o, oi) => {
      const b = h('button', { class: 'opt' }, o);
      b.addEventListener('click', () => {
        if (b.parentElement.dataset.done) return;
        b.parentElement.dataset.done = '1';
        const ok = oi === q.a;
        b.classList.add(ok ? 'right' : 'wrong');
        if (!ok) b.parentElement.children[q.a].classList.add('right');
        why.hidden = false; why.textContent = (ok ? '✓ Yes! ' : '✗ Not quite. ') + q.why;
        answered++; if (ok) right++;
        if (answered === qs.length) { score.textContent = right === qs.length ? `🌟 ${right} out of ${qs.length}. Perfect!` : `${right} out of ${qs.length}. Read the answers above and try again tomorrow.`; addActivity(0); }
      });
      return b;
    });
    wrap.append(h('div', { class: 'q' }, h('p', { class: 'qq' }, `${qi + 1}. ${q.q}`), h('div', { class: 'opts' }, ...opts), why));
  });
  wrap.append(score);
  return wrap;
}

function capoHelper() {
  const shapes = ['C', 'G', 'D', 'A', 'E', 'Am', 'Em', 'Dm'];
  let capo = 2;
  const grid = h('div', { class: 'capo-grid' });
  const draw = () => grid.replaceChildren(...shapes.map((s) => h('div', { class: 'capo-cell' }, h('small', { class: 'muted' }, 'shape'), h('b', {}, s), h('span', { class: 'arrow' }, '↓'), h('small', { class: 'muted' }, 'you hear'), h('b', { class: 'snd' }, pretty(transposeChord(s, capo))))));
  const sel = h('select', { 'aria-label': 'Capo fret' }, ...Array.from({ length: 8 }, (_, i) => h('option', { value: i, selected: i === capo }, i === 0 ? 'No capo' : `Capo on fret ${i}`)));
  sel.addEventListener('change', () => { capo = +sel.value; draw(); });
  draw();
  // Reverse lookup: which capo + easy shape gives the key you want?
  const keySel = h('select', { 'aria-label': 'Key you want' }, ...NOTE_NAMES.map((n) => h('option', { value: n }, pretty(n))));
  const ans = h('p', { class: 'small' });
  const find = () => {
    const out = [];
    for (const s of ['C', 'G', 'D', 'A', 'E']) for (let c = 0; c <= 7; c++) if (transposeChord(s, c) === keySel.value) out.push(c === 0 ? `${s} shapes, no capo` : `${s} shapes with capo ${c}`);
    ans.textContent = out.length ? out.join(' · ') : 'Use barre chords for this key.';
  };
  keySel.addEventListener('change', find); find();
  return h('section', { class: 'card capo' }, h('h3', {}, '🗜️ Capo helper'), h('label', {}, sel), grid,
    h('h4', {}, 'I want to play in the key of…'), h('label', {}, keySel), ans);
}
const pretty = (n) => n.replace('#', '♯');

function noteFinder() {
  const naturals = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
  let target = null, strOnly = 6, score = 0, tries = 0;
  const ask = h('p', { class: 'nf-ask' });
  const res = h('p', { class: 'muted small' });
  const holder = h('div', { class: 'hscroll' });
  const newQ = () => {
    target = naturals[Math.floor(Math.random() * naturals.length)];
    strOnly = Math.random() < 0.5 ? 6 : 5; tries = 0;
    ask.innerHTML = `Find <b>${target}</b> on <b>string ${strOnly}</b> (${strOnly === 6 ? 'thick E' : 'A'} string).`;
    build();
  };
  const build = (reveal = false) => {
    const fb = fretboard({ frets: 12, highlight: reveal ? target : null, onTap: (s, f, midi, g) => {
      playNote(midi, { gain: 0.6 });
      if (s === strOnly && noteName(midi) === target) {
        g.classList.add('show', 'right'); score++; res.textContent = `✓ Yes, ${target} is at fret ${f}. Score: ${score}`;
        setTimeout(newQ, 900);
      } else {
        g.classList.add('show', 'wrong'); setTimeout(() => g.classList.remove('wrong'), 500);
        tries++; res.textContent = s !== strOnly ? `That is string ${s}. Look on string ${strOnly}.` : `That is ${noteName(midi)}. Try again!`;
        if (tries >= 3) { res.textContent += ' Here are all the ' + target + ' notes.'; build(true); }
      }
    } });
    holder.replaceChildren(fb.svg);
  };
  newQ();
  return h('section', { class: 'card notefind' }, h('h3', {}, '🔎 Find the note'), ask, holder, res, h('div', { class: 'controls' }, h('button', { class: 'btn', onclick: newQ }, 'Skip')));
}

// ---------- TUNER ----------
function pageTuner() {
  let target = null; // null = automatic
  const tuned = new Set();
  const smoother = new Smoother(5);
  let running = false, quietUntil = 0, inHold = 0, lastSeen = 0;

  const noteEl = h('div', { class: 'tn-note' }, '–');
  const subEl = h('div', { class: 'tn-sub muted' }, 'Press Start, then pluck a string');
  const adviceEl = h('div', { class: 'tn-advice' }, ' ');
  const hzEl = h('div', { class: 'tn-hz muted small' }, ' ');
  const needle = gauge();
  const startBtn = h('button', { class: 'btn btn-primary btn-wide' }, '🎤 Start tuner');
  const errEl = h('p', { class: 'warn', hidden: true });
  const modeBtn = h('button', { class: 'str-btn auto on', 'aria-pressed': 'true' }, h('b', {}, 'Auto'), h('small', {}, 'any string'));
  const strBtns = STRINGS.map((s) => h('button', { class: 'str-btn', 'aria-pressed': 'false' }, h('b', {}, s.name), h('small', {}, `string ${s.num}`), h('i', { class: 'tick' }, '✓')));
  const setTarget = (s) => {
    target = s; smoother.reset();
    modeBtn.classList.toggle('on', !s); modeBtn.setAttribute('aria-pressed', String(!s));
    strBtns.forEach((b, i) => { const on = s && STRINGS[i] === s; b.classList.toggle('on', !!on); b.setAttribute('aria-pressed', String(!!on)); });
    if (s) { subEl.textContent = `String ${s.num} · ${s.label} · ${s.hint}`; noteEl.textContent = s.name; }
  };
  modeBtn.addEventListener('click', () => setTarget(null));
  strBtns.forEach((b, i) => b.addEventListener('click', () => { setTarget(STRINGS[i]); }));
  const refBtn = h('button', { class: 'btn' }, '🔊 Hear the string');
  refBtn.addEventListener('click', () => {
    const s = target || STRINGS[0];
    if (!target) setTarget(s);
    quietUntil = performance.now() + 2600; // do not tune to our own reference sound
    playNote(s.midi, { gain: 0.8 });
  });

  const update = (buf, sr) => {
    const now = performance.now();
    if (now < quietUntil) { adviceEl.textContent = 'Listen to the reference…'; return; }
    const r = detectPitch(buf, sr, { minFreq: 70, maxFreq: 400 });
    if (!r || r.clarity < 0.85) {
      if (now - lastSeen > 1200) { needle.set(0, 'idle'); adviceEl.textContent = 'Pluck a string and let it ring'; adviceEl.className = 'tn-advice'; hzEl.textContent = ' '; inHold = 0; }
      return;
    }
    lastSeen = now;
    const f = smoother.push(r.freq);
    const d = describeReading(f, target);
    if (!target) subEl.textContent = `String ${d.string.num} · ${d.string.label}`;
    noteEl.textContent = d.string.name;
    needle.set(d.cents, d.status);
    adviceEl.textContent = d.status === 'in' ? '✓ In tune!' : `${d.status === 'low' ? '↑' : '↓'} ${d.advice}`;
    adviceEl.className = `tn-advice st-${d.status}`;
    hzEl.textContent = `Heard ${d.heard} · ${f.toFixed(1)} Hz · ${d.cents > 0 ? '+' : ''}${d.cents.toFixed(0)} cents`;
    if (d.status === 'in') {
      if (++inHold >= 8 && !tuned.has(d.string.num)) {
        tuned.add(d.string.num);
        strBtns[STRINGS.indexOf(d.string)].classList.add('tuned');
        if (tuned.size === 6) toast('🎉 All six strings are in tune!');
        else toast(`String ${d.string.num} is in tune ✓`);
      }
    } else inHold = 0;
  };
  const stop = () => { running = false; stopMic(); startBtn.textContent = '🎤 Start tuner'; startBtn.classList.add('btn-primary'); needle.set(0, 'idle'); };
  onLeave(stop);
  startBtn.addEventListener('click', async () => {
    if (running) return stop();
    errEl.hidden = true;
    try {
      audioCtx();
      await startMic(update);
      running = true; startBtn.textContent = '■ Stop tuner'; startBtn.classList.remove('btn-primary');
      adviceEl.textContent = 'Pluck a string and let it ring'; addActivity(0);
    } catch (err) { errEl.hidden = false; errEl.textContent = micErrorText(err); }
  });

  const node = h('div', { class: 'page tuner' },
    h('h1', {}, 'Tuner'),
    h('p', { class: 'lead' }, 'Standard tuning, E A D G B E. Pluck one string at a time. The app tells you to tighten or loosen.'),
    h('section', { class: 'card tn-card' }, noteEl, subEl, needle.svg, adviceEl, hzEl, startBtn, errEl),
    h('div', { class: 'str-row', role: 'group', 'aria-label': 'Choose a string' }, modeBtn, ...strBtns),
    h('div', { class: 'controls center' }, refBtn),
    h('details', { class: 'card help' },
      h('summary', {}, 'How do I tune? (first time)'),
      h('ol', { class: 'steps' },
        h('li', {}, 'Press Start and allow the microphone. Nothing is recorded or sent anywhere.'),
        h('li', {}, 'Choose a string above, or leave it on Auto.'),
        h('li', {}, 'Pluck that string once and let it ring.'),
        h('li', { html: '<b>Too low (↑)</b>: tighten the peg slowly. <b>Too high (↓)</b>: loosen it.' }),
        h('li', {}, 'When the needle is in the green middle and it says In tune, go on to the next string.')),
      h('p', { class: 'muted small' }, 'Tip: in a noisy room, hold the phone close to the sound hole. Choosing the string yourself helps when the guitar is very far out of tune.')));
  return { title: 'Tuner', node };
}

function gauge() {
  const NS = 'http://www.w3.org/2000/svg';
  const mk = (t, a, p) => { const e = document.createElementNS(NS, t); for (const k in a) e.setAttribute(k, a[k]); p && p.appendChild(e); return e; };
  const svg = mk('svg', { viewBox: '0 0 300 170', class: 'gauge', role: 'img', 'aria-label': 'Tuning meter' });
  const cx = 150, cy = 158, r = 128;
  const pt = (deg, rr) => [cx + rr * Math.sin((deg * Math.PI) / 180), cy - rr * Math.cos((deg * Math.PI) / 180)];
  const arc = (d1, d2, cls) => { const [x1, y1] = pt(d1, r), [x2, y2] = pt(d2, r); mk('path', { d: `M${x1} ${y1} A${r} ${r} 0 0 1 ${x2} ${y2}`, class: cls }, svg); };
  arc(-62, 62, 'g-track');
  arc(-6, 6, 'g-zone');
  for (let c = -50; c <= 50; c += 10) {
    const deg = (c / 50) * 60;
    const [x1, y1] = pt(deg, r - 14), [x2, y2] = pt(deg, r - (c === 0 ? 30 : 22));
    mk('line', { x1, y1, x2, y2, class: c === 0 ? 'g-tick0' : 'g-tick' }, svg);
  }
  const lbl = (deg, s, cls) => { const [x, y] = pt(deg, r - 44); const t = mk('text', { x, y: y + 4, class: cls, 'text-anchor': 'middle' }, svg); t.textContent = s; };
  lbl(-48, 'low', 'g-lbl'); lbl(48, 'high', 'g-lbl');
  const needle = mk('g', { class: 'g-needle st-idle' }, svg);
  mk('line', { x1: cx, y1: cy, x2: cx, y2: cy - r + 8, class: 'g-needle-line' }, needle);
  mk('circle', { cx, cy, r: 9, class: 'g-hub' }, svg);
  let cur = 0;
  return {
    svg,
    set(cents, status) {
      const tgt = Math.max(-62, Math.min(62, (cents / 50) * 60));
      cur = cur + (tgt - cur) * 0.5;
      needle.setAttribute('transform', `rotate(${cur.toFixed(2)} ${cx} ${cy})`);
      needle.setAttribute('class', `g-needle st-${status}`);
    },
  };
}

// ---------- CHORDS ----------
function pageChords() {
  let filter = 'all';
  const grid = h('div', { class: 'chord-grid' });
  const draw = () => grid.replaceChildren(...Object.keys(CHORDS).filter((k) => filter === 'all' || CHORDS[k].level === filter).map((k) => chordCard(k)));
  const chips = h('div', { class: 'filter', role: 'group', 'aria-label': 'Filter by level' }, ...['all', 'basic', 'medium', 'expert'].map((k) => {
    const b = h('button', { class: `chip-btn${k === filter ? ' on' : ''}`, 'aria-pressed': String(k === filter) }, k === 'all' ? 'All' : `${LEVELS[k].emoji} ${LEVELS[k].name}`);
    b.addEventListener('click', () => { filter = k; [...chips.children].forEach((c) => { c.classList.toggle('on', c === b); c.setAttribute('aria-pressed', String(c === b)); }); draw(); });
    return b;
  }));
  draw();
  const node = h('div', { class: 'page' }, h('h1', {}, 'Chord library'),
    h('p', { class: 'lead' }, 'Tap a chord box to hear it. Numbers are fingers (1 index … 4 little). O = open string, × = do not play.'), chips, grid);
  return { title: 'Chords', node };
}

// ---------- PRACTICE ----------
const TOOLS = {
  metronome: { emo: '⏱️', name: 'Metronome', desc: 'A steady click to keep time.', make: () => metronome(80, true) },
  strum: { emo: '↕️', name: 'Strumming trainer', desc: 'Patterns and chord progressions with a click.', make: () => strumTrainer({ pattern: 'quarters', chords: ['G', 'D', 'Em', 'C'], bpm: 70, pickers: true }) },
  changes: { emo: '🔁', name: 'One-minute changes', desc: 'The fastest way to switch chords quickly.', make: () => changesTrainer(['Em', 'Am']) },
  fretboard: { emo: '🎸', name: 'Fretboard explorer', desc: 'Tap anywhere to hear and name the note.', make: () => fretPlay({ frets: 12, names: true }) },
  findnote: { emo: '🔎', name: 'Find the note', desc: 'A game to learn the notes on the neck.', make: () => noteFinder() },
  capo: { emo: '🗜️', name: 'Capo helper', desc: 'What a capo does to your chords.', make: () => capoHelper() },
};
function pagePractice() {
  const node = h('div', { class: 'page' }, h('h1', {}, 'Practice'),
    h('p', { class: 'lead' }, 'Little and often beats long and rare. Ten minutes a day is perfect.'),
    h('div', { class: 'tool-list' },
      h('a', { class: 'card tool-item', href: '#/songs' }, h('span', { class: 'tool-emo' }, '🎵'), h('div', {}, h('h3', {}, 'Songs and exercises'), h('p', { class: 'muted' }, 'Play tab with the app, or let it listen to you.'))),
      ...Object.entries(TOOLS).map(([k, t]) => h('a', { class: 'card tool-item', href: `#/tool/${k}` }, h('span', { class: 'tool-emo' }, t.emo), h('div', {}, h('h3', {}, t.name), h('p', { class: 'muted' }, t.desc))))));
  return { title: 'Practice', node };
}
function pageTool(k) {
  const t = TOOLS[k];
  if (!t) return pagePractice();
  return { title: t.name, node: h('div', { class: 'page' }, back('#/practice', 'Practice'), h('h1', {}, t.emo, ' ', t.name), h('p', { class: 'lead' }, t.desc), t.make()) };
}
function pageSongs() {
  const groups = Object.keys(LEVELS).map((lvl) => h('section', {}, h('h2', { class: 'section' }, LEVELS[lvl].emoji, ' ', LEVELS[lvl].name),
    h('div', { class: 'tool-list' }, ...Object.entries(SONGS).filter(([, s]) => s.level === lvl).map(([k, s]) =>
      h('a', { class: 'card tool-item', href: `#/song/${k}` }, h('span', { class: 'tool-emo' }, '🎵'), h('div', {}, h('h3', {}, s.title), h('p', { class: 'muted' }, s.about)))))));
  return { title: 'Songs', node: h('div', { class: 'page' }, back('#/practice', 'Practice'), h('h1', {}, 'Songs and exercises'),
    h('p', { class: 'lead' }, 'All tunes are traditional or public domain. Use Play to hear them, or Play along: the app listens and moves on when you play the right note.'), ...groups) };
}
function pageSong(k) {
  const s = SONGS[k];
  if (!s) return pageSongs();
  return { title: s.title, node: h('div', { class: 'page' }, back('#/songs', 'Songs'), songPlayer(k)) };
}

// ---------- GLOSSARY ----------
const WORDS = [
  ['Bar', 'A small group of beats, usually 4. We count 1 2 3 4, 1 2 3 4…'],
  ['Barre chord', 'A chord where one finger presses all the strings at one fret.'],
  ['Beat', 'The steady pulse of the music, like a clock ticking.'],
  ['BPM', 'Beats per minute: how fast the music goes. 60 BPM is one beat every second.'],
  ['Capo', 'A clamp that holds down all strings at one fret, so easy chords sound higher.'],
  ['Chord', 'Several notes played together, by strumming.'],
  ['Chord box', 'A picture showing where to put your fingers for a chord.'],
  ['Fret', 'The metal strips on the neck. “Fret 2” means press just before the 2nd strip.'],
  ['Fretting hand', 'The hand that presses the strings on the neck (left hand for most players).'],
  ['Major / minor', 'Major chords sound bright and happy. Minor chords sound softer or sadder.'],
  ['Metronome', 'A clicking tool that keeps a steady beat for you.'],
  ['Note', 'A single musical sound. There are 12 different notes: C C♯ D D♯ E F F♯ G G♯ A A♯ B.'],
  ['Open string', 'A string played without pressing any fret. Written as 0 in tab.'],
  ['Pick', 'A small flat piece of plastic used to strum or pick the strings.'],
  ['Riff', 'A short catchy pattern of notes that repeats.'],
  ['Root', 'The note a chord is named after. The root of G major is G.'],
  ['Scale', 'A set of notes that sound good together, played in order.'],
  ['Sharp (♯) / flat (♭)', 'One fret higher (sharp) or lower (flat). C♯ is one fret above C.'],
  ['Strum', 'Brushing across the strings with a pick or fingers. ↓ down, ↑ up.'],
  ['Strumming hand', 'The hand that strums or plucks over the sound hole.'],
  ['Tab', 'Guitar music with 6 lines for the strings and numbers for the frets.'],
  ['Tuning', 'Adjusting each string to the right note. Always tune before playing.'],
];
function pageGlossary() {
  return { title: 'Guitar words', node: h('div', { class: 'page' }, back('#/learn', 'Lessons'), h('h1', {}, '📖 Guitar words'),
    h('p', { class: 'lead' }, 'Every word used in the lessons, explained simply.'),
    h('dl', { class: 'glossary' }, ...WORDS.flatMap(([w, d]) => [h('dt', {}, w), h('dd', {}, d)]))) };
}

// ---------- ABOUT ----------
let installEvt = null;
window.addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); installEvt = e; });
function pageAbout() {
  const nameIn = h('input', { type: 'text', value: S.name, maxlength: 20, 'aria-label': 'Your name' });
  nameIn.addEventListener('change', () => { S.name = nameIn.value.trim(); save(); toast('Saved'); });
  const goalSel = h('select', { 'aria-label': 'Daily goal' }, ...[5, 10, 15, 20, 30].map((m) => h('option', { value: m, selected: m === S.goal }, `${m} minutes a day`)));
  goalSel.addEventListener('change', () => { S.goal = +goalSel.value; save(); });
  const themeSel = h('select', { 'aria-label': 'Theme' }, ...[['auto', 'Match my device'], ['light', 'Light'], ['dark', 'Dark']].map(([v, l]) => h('option', { value: v, selected: v === S.theme }, l)));
  themeSel.addEventListener('change', () => { S.theme = themeSel.value; save(); applyTheme(); });
  const installBtn = h('button', { class: 'btn btn-primary', hidden: !installEvt || IN_APP }, '⬇ Install Geetar on this device');
  installBtn.addEventListener('click', async () => { if (!installEvt) return; installEvt.prompt(); await installEvt.userChoice; installEvt = null; installBtn.hidden = true; });
  const reset = h('button', { class: 'btn btn-danger' }, 'Reset all progress');
  reset.addEventListener('click', () => { if (confirm('Delete all lessons done, scores and practice history on this device?')) { const keep = { name: S.name, onboarded: S.onboarded, goal: S.goal, theme: S.theme }; S = { ...defaults(), ...keep }; save(); toast('Progress reset'); render(); } });
  const totalMin = Math.round(Object.values(S.days).reduce((a, d) => a + d.secs, 0) / 60);
  const node = h('div', { class: 'page about' },
    h('section', { class: 'about-hero' }, h('img', { src: 'img/geetar.svg', alt: 'Geetar logo', width: 96, height: 96 }), h('h1', {}, 'Geetar'), h('p', { class: 'muted' }, `Learn guitar from zero · version ${APP.version}`)),
    h('section', { class: 'card dedication' },
      h('div', { class: 'heart' }, '💜'),
      h('h2', {}, 'Dedicated to Pari'),
      h('p', {}, 'For Parishay, who got her very first guitar in October 2026 and asked for an app to learn with. May every chord you learn make you smile.')),
    h('section', { class: 'card' }, h('h3', {}, 'Your stats'),
      h('div', { class: 'stats' },
        stat(Object.keys(S.done).length, 'lessons done'), stat(streak(), 'day streak'), stat(totalMin, 'minutes practised'), stat(Object.keys(S.days).length, 'days played'))),
    h('section', { class: 'card settings' }, h('h3', {}, 'Settings'),
      h('label', {}, 'Name on the home screen', nameIn), h('label', {}, 'Daily practice goal', goalSel), h('label', {}, 'Theme', themeSel),
      installBtn, IN_APP ? null : h('p', { class: 'muted small' }, 'On iPhone or iPad: tap Share, then “Add to Home Screen”. After the first visit Geetar works offline.')),
    h('section', { class: 'card' }, h('h3', {}, 'Privacy'),
      h('p', { class: 'small' }, IN_APP
        ? 'Geetar has no accounts and no sign-in. Your name and progress are saved only on this phone. The microphone is used only by the tuner and Play along; the sound is analysed on the phone and is never recorded or sent anywhere. The app is free thanks to Google AdMob ads, limited to family-friendly content. Google may use your device’s advertising ID; you can change your ad choices below.'
        : 'Geetar has no accounts, no ads and no tracking. Your progress is saved only in this browser on this device. The microphone is used only by the tuner and Play along; the sound is analysed on your device and is never recorded or sent anywhere.'),
      APP.privacyOptions ? h('button', { class: 'btn', onclick: () => native('privacyOptions') }, 'Ad privacy choices') : null,
      h('p', { class: 'small' }, h('a', { href: 'https://tools.homilabs.org/privacy#geetar' }, 'Full privacy policy'), ' · ', h('a', { href: 'https://tools.homilabs.org/terms#geetar' }, 'Terms')),
      reset),
    h('section', { class: 'card made-by' }, credits(),
      h('p', { class: 'muted small' }, 'All songs in Geetar are traditional or in the public domain. Guitar sounds are generated by the app itself.'),
      h('p', { class: 'small' }, h('a', { href: 'https://tools.homilabs.org/' }, 'More HomiLabs tools'), ' · ', h('a', { href: 'mailto:homilabs.smc@gmail.com' }, 'homilabs.smc@gmail.com'))));
  return { title: 'About', node };
}
const stat = (n, l) => h('div', { class: 'stat' }, h('b', {}, String(n)), h('small', { class: 'muted' }, l));

// ---------- boot ----------
applyTheme();
render();
if ('serviceWorker' in navigator && location.protocol !== 'file:' && !IN_APP) {
  navigator.serviceWorker.register('./sw.js').catch(() => { /* offline support is optional */ });
}
// In the app, links to the web or email open outside the app.
document.addEventListener('click', (e) => {
  const a = e.target.closest && e.target.closest('a[href]');
  if (!a || !IN_APP) return;
  const href = a.getAttribute('href');
  if (/^(https?:|mailto:)/.test(href)) { e.preventDefault(); native('open', { url: href }); }
});
// Unlock audio on the first touch (iOS needs a gesture).
window.addEventListener('pointerdown', () => audioCtx(), { once: true });
