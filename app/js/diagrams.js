// Geetar: SVG drawings. Every drawing uses CSS classes so it follows light and dark themes.
import { STRINGS, noteName, stringFretMidi } from './music.js';

const NS = 'http://www.w3.org/2000/svg';
export function el(tag, attrs = {}, parent) {
  const e = document.createElementNS(NS, tag);
  for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, v);
  if (parent) parent.appendChild(e);
  return e;
}
const txt = (parent, x, y, s, cls, extra = {}) => { const t = el('text', { x, y, class: cls, ...extra }, parent); t.textContent = s; return t; };

/** Chord box diagram. */
export function chordDiagram(chord, { size = 1, showNames = true, title } = {}) {
  const sx = 22, top = 46, fs = 28, frets = 5, left = 24;
  const W = left * 2 + sx * 5, H = top + fs * frets + (showNames ? 26 : 10);
  const svg = el('svg', { viewBox: `0 0 ${W} ${H}`, width: W * size, height: H * size, class: 'chord-svg', role: 'img' });
  svg.setAttribute('aria-label', `${title || chord.name} chord diagram`);
  const played = chord.frets.filter((f) => f > 0);
  const maxF = played.length ? Math.max(...played) : 0;
  const base = maxF > frets ? Math.min(...played) : 1;
  // Fret lines.
  for (let i = 0; i <= frets; i++) el('line', { x1: left, x2: left + sx * 5, y1: top + i * fs, y2: top + i * fs, class: i === 0 && base === 1 ? 'cd-nut' : 'cd-fret' }, svg);
  // Strings.
  for (let i = 0; i < 6; i++) el('line', { x1: left + i * sx, x2: left + i * sx, y1: top, y2: top + fs * frets, class: 'cd-string', 'stroke-width': 2.2 - i * 0.25 }, svg);
  if (base > 1) txt(svg, left - 8, top + fs * 0.62, `${base}fr`, 'cd-base', { 'text-anchor': 'end' });
  // Open and muted markers.
  chord.frets.forEach((f, i) => {
    const x = left + i * sx;
    if (f === 0) el('circle', { cx: x, cy: top - 13, r: 6, class: 'cd-open' }, svg);
    if (f < 0) txt(svg, x, top - 8, '×', 'cd-mute', { 'text-anchor': 'middle' });
  });
  // Barre.
  if (chord.barre) {
    const b = chord.barre;
    const i1 = 6 - b.from, i2 = 6 - b.to;
    const y = top + (b.fret - base + 0.5) * fs;
    el('rect', { x: left + i1 * sx - 9, y: y - 9, width: (i2 - i1) * sx + 18, height: 18, rx: 9, class: 'cd-dot' }, svg);
  }
  chord.frets.forEach((f, i) => {
    if (f <= 0) return;
    const x = left + i * sx, y = top + (f - base + 0.5) * fs;
    const onBarre = chord.barre && f === chord.barre.fret && (6 - i) <= chord.barre.from && (6 - i) >= chord.barre.to;
    if (!onBarre) el('circle', { cx: x, cy: y, r: 9, class: 'cd-dot' }, svg);
    const fg = chord.fingers[i];
    if (fg && (!onBarre || i === 6 - chord.barre.from)) txt(svg, x, y + 4.5, String(fg), 'cd-finger', { 'text-anchor': 'middle' });
  });
  if (showNames) STRINGS.forEach((s, i) => txt(svg, left + i * sx, H - 8, s.name, 'cd-sname', { 'text-anchor': 'middle' }));
  return svg;
}

/** Guitar tab. Returns { svg, noteEls, xs } so a player can highlight notes. */
export function tabDiagram(song) {
  const unit = 30, pad = 34, lineGap = 18, top = 20;
  let x = pad + 10;
  const xs = [];
  let beat = -(song.pickup || 0);
  const bars = [];
  song.notes.forEach((nt) => {
    xs.push(x);
    x += Math.max(26, nt.b * unit);
    beat += nt.b;
    if (beat > 0 && Math.abs(beat / song.beatsPerBar - Math.round(beat / song.beatsPerBar)) < 1e-6) bars.push(x - 8);
  });
  const W = x + 10, H = top + lineGap * 5 + 22;
  const svg = el('svg', { viewBox: `0 0 ${W} ${H}`, width: W, height: H, class: 'tab-svg', role: 'img' });
  svg.setAttribute('aria-label', `Tab for ${song.title}`);
  ['e', 'B', 'G', 'D', 'A', 'E'].forEach((n, i) => {
    el('line', { x1: pad, x2: W - 6, y1: top + i * lineGap, y2: top + i * lineGap, class: 'tab-line' }, svg);
    txt(svg, 12, top + i * lineGap + 4, n, 'tab-sname', { 'text-anchor': 'middle' });
  });
  el('line', { x1: pad, x2: pad, y1: top, y2: top + lineGap * 5, class: 'tab-bar' }, svg);
  bars.forEach((bx) => el('line', { x1: bx, x2: bx, y1: top, y2: top + lineGap * 5, class: 'tab-bar' }, svg));
  const noteEls = song.notes.map((nt, k) => {
    const g = el('g', { class: 'tab-note' }, svg);
    if (nt.r) { txt(g, xs[k], top + lineGap * 2.6, '𝄽', 'tab-rest', { 'text-anchor': 'middle' }); return g; }
    const y = top + (nt.s - 1) * lineGap;
    const label = String(nt.f);
    el('rect', { x: xs[k] - 9 - (label.length - 1) * 4, y: y - 9, width: 18 + (label.length - 1) * 8, height: 18, rx: 5, class: 'tab-bg' }, g);
    txt(g, xs[k], y + 5, label, 'tab-fret', { 'text-anchor': 'middle' });
    if (nt.t) txt(g, xs[k] - 14, y - 10, nt.t, 'tab-tech', { 'text-anchor': 'middle' });
    return g;
  });
  return { svg, noteEls, xs };
}

/** Labelled acoustic guitar for the "Meet your guitar" lesson. */
export function guitarParts() {
  const svg = el('svg', { viewBox: '-56 0 472 640', class: 'parts-svg', role: 'img' });
  svg.setAttribute('aria-label', 'A guitar with its parts labelled');
  const cx = 180;
  // Body outline (drawn larger underneath), then fill.
  const body = (cls, grow) => {
    const g = el('g', { class: cls }, svg);
    el('ellipse', { cx, cy: 382, rx: 78 + grow, ry: 70 + grow }, g);
    el('ellipse', { cx, cy: 512, rx: 104 + grow, ry: 92 + grow }, g);
    el('rect', { x: cx - 70 - grow, y: 400, width: 140 + grow * 2, height: 80 }, g);
  };
  body('gp-outline', 4);
  body('gp-body', 0);
  el('circle', { cx, cy: 404, r: 32, class: 'gp-hole' }, svg);
  el('circle', { cx, cy: 404, r: 38, class: 'gp-rosette' }, svg);
  el('rect', { x: cx - 40, y: 530, width: 80, height: 16, rx: 5, class: 'gp-bridge' }, svg);
  // Neck and headstock.
  el('rect', { x: cx - 22, y: 98, width: 44, height: 250, class: 'gp-neck' }, svg);
  el('path', { d: `M${cx - 30} 18 Q${cx} 6 ${cx + 30} 18 L${cx + 24} 92 L${cx - 24} 92 Z`, class: 'gp-head' }, svg);
  for (let i = 0; i < 3; i++) {
    el('ellipse', { cx: cx - 42, cy: 34 + i * 22, rx: 11, ry: 7, class: 'gp-peg' }, svg);
    el('ellipse', { cx: cx + 42, cy: 34 + i * 22, rx: 11, ry: 7, class: 'gp-peg' }, svg);
  }
  el('rect', { x: cx - 24, y: 92, width: 48, height: 7, class: 'gp-nut' }, svg);
  let fy = 99, gap = 26;
  for (let i = 0; i < 9; i++) { fy += gap; gap *= 0.94; el('line', { x1: cx - 22, x2: cx + 22, y1: fy, y2: fy, class: 'gp-fretwire' }, svg); }
  [3, 5, 7].forEach((f) => {
    let y = 99, gg = 26; for (let i = 0; i < f; i++) { y += gg; gg *= 0.94; } y -= gg / 0.94 / 2;
    el('circle', { cx, cy: y, r: 3.5, class: 'gp-inlay' }, svg);
  });
  for (let i = 0; i < 6; i++) {
    const x1 = cx - 15 + i * 6, x2 = cx - 25 + i * 10;
    el('line', { x1, x2, y1: 94, y2: 538, class: 'gp-str', 'stroke-width': 1.8 - i * 0.2 }, svg);
  }
  const label = (text, tx, ty, px, py, anchor) => {
    el('line', { x1: tx + (anchor === 'end' ? 4 : -4), y1: ty - 5, x2: px, y2: py, class: 'gp-lead' }, svg);
    el('circle', { cx: px, cy: py, r: 3, class: 'gp-leaddot' }, svg);
    txt(svg, tx, ty, text, 'gp-label', { 'text-anchor': anchor });
  };
  label('Headstock', 70, 20, cx - 20, 22, 'end');
  label('Tuning pegs', 290, 60, cx + 52, 56, 'start');
  label('Nut', 70, 100, cx - 24, 95, 'end');
  label('Frets', 290, 160, cx + 20, 172, 'start');
  label('Neck', 70, 230, cx - 22, 230, 'end');
  label('Strings', 290, 290, cx + 4, 290, 'start');
  label('Sound hole', 46, 404, cx - 32, 404, 'end');
  label('Body', 300, 450, cx + 92, 470, 'start');
  label('Bridge', 60, 590, cx - 40, 540, 'end');
  return svg;
}

/** Fretting hand with finger numbers. */
export function handDiagram() {
  const svg = el('svg', { viewBox: '0 0 260 250', class: 'hand-svg', role: 'img' });
  svg.setAttribute('aria-label', 'Finger numbers: index 1, middle 2, ring 3, little 4, thumb T');
  // Thumb first, so the palm covers its base.
  el('rect', { x: 160, y: 118, width: 28, height: 76, rx: 14, class: 'hand-skin', transform: 'rotate(40 174 194)' }, svg);
  el('rect', { x: 50, y: 108, width: 136, height: 104, rx: 40, class: 'hand-skin' }, svg);
  const fingers = [{ n: 4, x: 54, h: 66 }, { n: 3, x: 86, h: 92 }, { n: 2, x: 118, h: 102 }, { n: 1, x: 150, h: 90 }];
  fingers.forEach((f) => {
    el('rect', { x: f.x, y: 128 - f.h, width: 30, height: f.h + 24, rx: 15, class: 'hand-skin' }, svg);
    el('circle', { cx: f.x + 15, cy: 128 - f.h + 16, r: 12, class: 'hand-num' }, svg);
    txt(svg, f.x + 15, 128 - f.h + 21, String(f.n), 'hand-numtxt', { 'text-anchor': 'middle' });
  });
  el('circle', { cx: 210, cy: 148, r: 12, class: 'hand-num thumb' }, svg);
  txt(svg, 210, 153, 'T', 'hand-numtxt', { 'text-anchor': 'middle' });
  txt(svg, 130, 232, '1 index · 2 middle · 3 ring · 4 little', 'hand-name', { 'text-anchor': 'middle' });
  txt(svg, 130, 247, 'T thumb (stays behind the neck)', 'hand-name', { 'text-anchor': 'middle' });
  return svg;
}

/** Interactive fretboard, string 1 on top like tab. onTap(string, fret, midi). */
export function fretboard({ frets = 12, onTap, showNames = false, highlight = null, mark = [] } = {}) {
  const fw = 58, sg = 26, left = 40, top = 22;
  const W = left + fw * (frets + 0.6), H = top + sg * 5 + 34;
  const svg = el('svg', { viewBox: `0 0 ${W} ${H}`, width: W, height: H, class: 'fb-svg', role: 'img' });
  svg.setAttribute('aria-label', 'Guitar fretboard. Tap a spot to hear the note.');
  el('rect', { x: left + fw * 0.6, y: top - 10, width: fw * frets, height: sg * 5 + 20, rx: 6, class: 'fb-wood' }, svg);
  el('rect', { x: left + fw * 0.6 - 5, y: top - 10, width: 6, height: sg * 5 + 20, class: 'fb-nut' }, svg);
  const fx = (f) => (f === 0 ? left + fw * 0.3 : left + fw * 0.6 + (f - 0.5) * fw);
  for (let f = 1; f <= frets; f++) {
    el('line', { x1: left + fw * 0.6 + f * fw, x2: left + fw * 0.6 + f * fw, y1: top - 10, y2: top + sg * 5 + 10, class: 'fb-wire' }, svg);
    txt(svg, fx(f), H - 6, String(f), 'fb-fretnum', { 'text-anchor': 'middle' });
    if ([3, 5, 7, 9].includes(f)) el('circle', { cx: fx(f), cy: top + sg * 2.5, r: 5, class: 'fb-inlay' }, svg);
    if (f === 12) { el('circle', { cx: fx(f), cy: top + sg * 1.5, r: 5, class: 'fb-inlay' }, svg); el('circle', { cx: fx(f), cy: top + sg * 3.5, r: 5, class: 'fb-inlay' }, svg); }
  }
  txt(svg, fx(0), H - 6, 'open', 'fb-fretnum', { 'text-anchor': 'middle' });
  const cells = [];
  for (let s = 1; s <= 6; s++) {
    const y = top + (s - 1) * sg;
    el('line', { x1: left, x2: W - 4, y1: y, y2: y, class: 'fb-str', 'stroke-width': 0.8 + s * 0.35 }, svg);
    txt(svg, 14, y + 4, ['e', 'B', 'G', 'D', 'A', 'E'][s - 1], 'fb-sname', { 'text-anchor': 'middle' });
    for (let f = 0; f <= frets; f++) {
      const midi = stringFretMidi(s, f);
      const g = el('g', { class: 'fb-cell', tabindex: 0, role: 'button' }, svg);
      g.setAttribute('aria-label', `String ${s}, ${f === 0 ? 'open' : 'fret ' + f}: ${noteName(midi)}`);
      el('rect', { x: fx(f) - fw / 2 + 2, y: y - sg / 2, width: fw - 4, height: sg, class: 'fb-hit' }, g);
      const c = el('circle', { cx: fx(f), cy: y, r: 10.5, class: 'fb-dot' }, g);
      const t = txt(g, fx(f), y + 4, noteName(midi), 'fb-dottxt', { 'text-anchor': 'middle' });
      const isMarked = mark.some(([ms, mf]) => ms === s && mf === f);
      const on = showNames || isMarked || (highlight && noteName(midi) === highlight);
      g.classList.toggle('show', !!on);
      if (isMarked) g.classList.add('marked');
      const fire = () => onTap && onTap(s, f, midi, g);
      g.addEventListener('click', fire);
      g.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fire(); } });
      cells.push({ s, f, midi, g, c, t });
    }
  }
  return { svg, cells };
}
