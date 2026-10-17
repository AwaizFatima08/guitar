// Geetar: Web Audio engine. Plucked notes, strummed chords, metronome clicks.
import { renderPluck } from './pluck.js';
import { midiToFreq, chordMidis } from './music.js';

let ctx = null;
let master = null;
const cache = new Map();

export function audioCtx() {
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    ctx = new AC({ latencyHint: 'interactive' });
    master = ctx.createGain();
    master.gain.value = 0.8;
    // A gentle body resonance makes the synth string sound less "electronic".
    const body = ctx.createBiquadFilter();
    body.type = 'peaking'; body.frequency.value = 200; body.Q.value = 1; body.gain.value = 4;
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -12; comp.ratio.value = 4;
    master.connect(body).connect(comp).connect(ctx.destination);
  }
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

function pluckBuffer(midi, bright = 0.5) {
  const key = `${midi}:${bright}`;
  if (cache.has(key)) return cache.get(key);
  const c = audioCtx();
  const data = renderPluck(midiToFreq(midi), c.sampleRate, midi < 50 ? 2.6 : 2.0, { brightness: bright, seed: midi * 31 });
  const buf = c.createBuffer(1, data.length, c.sampleRate);
  buf.copyToChannel(data, 0);
  cache.set(key, buf);
  return buf;
}

/** A gain node feeding the master bus. Disconnect it to silence everything scheduled through it. */
export function newBus(volume = 1) {
  const c = audioCtx();
  const g = c.createGain();
  g.gain.value = volume;
  g.connect(master);
  return g;
}

/** Play one plucked note. `when` is an AudioContext time (default now). Returns the source node. */
export function playNote(midi, { when = 0, gain = 0.6, bright = 0.5, duration = null, out = null } = {}) {
  const c = audioCtx();
  const src = c.createBufferSource();
  src.buffer = pluckBuffer(midi, bright);
  const g = c.createGain();
  g.gain.value = gain;
  src.connect(g).connect(out || master);
  const t = when || c.currentTime;
  src.start(t);
  if (duration) {
    g.gain.setValueAtTime(gain, t + duration);
    g.gain.linearRampToValueAtTime(0, t + duration + 0.08);
    src.stop(t + duration + 0.1);
  }
  return src;
}

/** Strum a chord. dir 'D' = low to high, 'U' = high to low (top strings only, softer). */
export function strum(chord, { when = 0, dir = 'D', gain = 0.32, spread = 0.022, duration = null, out = null } = {}) {
  const c = audioCtx();
  let notes = chordMidis(chord);
  if (dir === 'U') notes = notes.slice(-4).reverse();
  const t0 = when || c.currentTime;
  notes.forEach((m, i) => playNote(m, { when: t0 + i * spread, gain: dir === 'U' ? gain * 0.75 : gain, bright: dir === 'U' ? 0.6 : 0.45, duration, out }));
}

/** Short click for the metronome. */
export function click(when, accent = false, out = null) {
  const c = audioCtx();
  const osc = c.createOscillator();
  const g = c.createGain();
  osc.frequency.value = accent ? 1600 : 1000;
  g.gain.setValueAtTime(0.0001, when);
  g.gain.exponentialRampToValueAtTime(accent ? 0.5 : 0.3, when + 0.002);
  g.gain.exponentialRampToValueAtTime(0.0001, when + 0.06);
  osc.connect(g).connect(out || master);
  osc.start(when); osc.stop(when + 0.07);
}

/**
 * Look-ahead scheduler. Calls onTick(tickIndex, audioTime) for every tick, ahead of time,
 * and onVisual(tickIndex) close to when the tick is heard.
 * ticksPerBeat: 1 for a metronome, 2 for eighth-note strumming.
 */
export class Scheduler {
  constructor({ bpm = 80, ticksPerBeat = 1, onTick, onVisual }) {
    this.bpm = bpm; this.ticksPerBeat = ticksPerBeat;
    this.onTick = onTick; this.onVisual = onVisual;
    this.timer = null; this.raf = null; this.queue = [];
  }
  get tickLen() { return 60 / this.bpm / this.ticksPerBeat; }
  start() {
    const c = audioCtx();
    this.stop();
    this.tick = 0;
    this.next = c.currentTime + 0.08;
    this.timer = setInterval(() => this.pump(), 25);
    this.pump();
    const draw = () => {
      const now = audioCtx().currentTime;
      while (this.queue.length && this.queue[0].t <= now + 0.01) {
        const q = this.queue.shift();
        this.onVisual && this.onVisual(q.i);
      }
      this.raf = requestAnimationFrame(draw);
    };
    this.raf = requestAnimationFrame(draw);
    this.running = true;
  }
  pump() {
    const c = audioCtx();
    while (this.next < c.currentTime + 0.12) {
      const keep = this.onTick && this.onTick(this.tick, this.next);
      this.queue.push({ i: this.tick, t: this.next });
      if (keep === false) { this.stopAfter = this.next; }
      this.tick++;
      this.next += this.tickLen;
      if (this.stopAfter) { setTimeout(() => this.stop(), Math.max(0, (this.stopAfter - c.currentTime) * 1000 + 600)); this.stopAfter = null; clearInterval(this.timer); this.timer = null; break; }
    }
  }
  stop() {
    if (this.timer) clearInterval(this.timer);
    if (this.raf) cancelAnimationFrame(this.raf);
    this.timer = null; this.raf = null; this.queue = [];
    if (this.running && this.onStop) this.onStop();
    this.running = false;
  }
}

/** Stop everything that is currently scheduled (used when leaving a page). */
export const activeSchedulers = new Set();
export function stopAll() { for (const s of activeSchedulers) s.stop(); activeSchedulers.clear(); }
