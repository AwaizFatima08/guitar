// Geetar: pitch detection (McLeod Pitch Method, normalised square difference).
// Pure functions, no DOM, so tests can run them in Node.

import { STRINGS, midiToFreq, freqToMidi, noteName, noteOctave } from './music.js';

/**
 * Detect the fundamental frequency of a mono buffer.
 * Returns { freq, clarity, rms } or null when the signal is too quiet or unclear.
 */
export function detectPitch(buf, sampleRate, opts = {}) {
  const minFreq = opts.minFreq ?? 60;
  const maxFreq = opts.maxFreq ?? 1100;
  const minRms = opts.minRms ?? 0.005;
  const k = opts.k ?? 0.9;
  const N = buf.length;

  let mean = 0;
  for (let i = 0; i < N; i++) mean += buf[i];
  mean /= N;
  let rms = 0;
  for (let i = 0; i < N; i++) rms += (buf[i] - mean) * (buf[i] - mean);
  rms = Math.sqrt(rms / N);
  if (rms < minRms) return null;

  const minLag = Math.max(2, Math.floor(sampleRate / maxFreq));
  const maxLag = Math.min(N - 2, Math.ceil(sampleRate / minFreq));
  const x = new Float32Array(N);
  for (let i = 0; i < N; i++) x[i] = buf[i] - mean;

  // Running energy terms make m(tau) O(1) per lag.
  const sq = new Float64Array(N + 1);
  for (let i = 0; i < N; i++) sq[i + 1] = sq[i] + x[i] * x[i];

  const nsdf = new Float32Array(maxLag + 2);
  for (let tau = 0; tau <= maxLag + 1; tau++) {
    let acf = 0;
    const lim = N - tau;
    for (let j = 0; j < lim; j++) acf += x[j] * x[j + tau];
    const m = sq[lim] + (sq[N] - sq[tau]);
    nsdf[tau] = m > 0 ? (2 * acf) / m : 0;
  }

  // Collect the highest peak in every positive lobe after the first zero crossing.
  const peaks = [];
  let tau = 1;
  while (tau < maxLag && nsdf[tau] > 0) tau++; // skip the lobe at lag 0
  while (tau < maxLag) {
    while (tau < maxLag && nsdf[tau] <= 0) tau++;
    let best = -1, bestVal = -Infinity;
    while (tau < maxLag && nsdf[tau] > 0) {
      if (nsdf[tau] > bestVal && tau >= minLag) { bestVal = nsdf[tau]; best = tau; }
      tau++;
    }
    if (best > 0) peaks.push(best);
  }
  if (!peaks.length) return null;

  let globalMax = 0;
  for (const p of peaks) globalMax = Math.max(globalMax, nsdf[p]);
  const threshold = k * globalMax;
  const chosen = peaks.find((p) => nsdf[p] >= threshold);

  // Parabolic interpolation around the chosen lag.
  const a = nsdf[chosen - 1], b = nsdf[chosen], c = nsdf[chosen + 1];
  const denom = a - 2 * b + c;
  const shift = denom !== 0 ? (0.5 * (a - c)) / denom : 0;
  const period = chosen + Math.max(-1, Math.min(1, shift));
  const clarity = b - 0.25 * (a - c) * shift;
  return { freq: sampleRate / period, clarity, rms };
}

/** Cents between a frequency and a target frequency (+ = too high / sharp). */
export const centsOff = (freq, target) => 1200 * Math.log2(freq / target);

/** Nearest guitar string to a frequency (standard tuning). */
export function nearestString(freq) {
  const m = freqToMidi(freq);
  let best = STRINGS[0], bestD = Infinity;
  for (const s of STRINGS) {
    const d = Math.abs(m - s.midi);
    if (d < bestD) { bestD = d; best = s; }
  }
  return best;
}

/** Describe a reading for a beginner. `target` is a STRINGS entry (or null for automatic). */
export function describeReading(freq, target) {
  const s = target || nearestString(freq);
  const goal = midiToFreq(s.midi);
  const cents = centsOff(freq, goal);
  const midi = freqToMidi(freq);
  const heard = noteName(midi) + noteOctave(midi);
  let status, advice;
  const abs = Math.abs(cents);
  if (abs <= 5) { status = 'in'; advice = 'In tune!'; }
  else if (cents < 0) {
    status = 'low';
    advice = abs > 150 ? 'Far too low. Tighten slowly, and check it is the right string.' : abs > 30 ? 'Too low. Tighten the string.' : 'A little low. Tighten a tiny bit.';
  } else {
    status = 'high';
    advice = abs > 150 ? 'Far too high. Loosen slowly, and check it is the right string.' : abs > 30 ? 'Too high. Loosen the string.' : 'A little high. Loosen a tiny bit.';
  }
  return { string: s, cents, status, advice, heard, goal };
}

/** Small helper that keeps the median of the last few readings, to stop the needle jumping. */
export class Smoother {
  constructor(size = 5) { this.size = size; this.vals = []; }
  push(v) {
    if (this.vals.length && Math.abs(1200 * Math.log2(v / this.vals[this.vals.length - 1])) > 80) this.vals = [];
    this.vals.push(v);
    if (this.vals.length > this.size) this.vals.shift();
    const s = [...this.vals].sort((a, b) => a - b);
    return s[Math.floor(s.length / 2)];
  }
  reset() { this.vals = []; }
}
