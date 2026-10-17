import { test } from 'node:test';
import assert from 'node:assert/strict';
import { detectPitch, describeReading, centsOff } from '../app/js/pitch.js';
import { renderPluck } from '../app/js/pluck.js';
import { STRINGS, midiToFreq } from '../app/js/music.js';

const SR = 48000;
const frame = (sig, start, size = 4096) => sig.subarray(start, start + size);

for (const s of STRINGS) {
  for (const detune of [-40, -10, 0, 12, 35]) {
    test(`detects string ${s.num} (${s.label}) detuned ${detune} cents`, () => {
      const f = midiToFreq(s.midi) * Math.pow(2, detune / 1200);
      const sig = renderPluck(f, SR, 1.5, { seed: s.num * 7 + detune });
      for (const startSec of [0.1, 0.4, 0.8]) {
        const r = detectPitch(frame(sig, Math.floor(startSec * SR)), SR);
        assert.ok(r, `no pitch at ${startSec}s`);
        const err = centsOff(r.freq, f);
        assert.ok(Math.abs(err) < 4, `off by ${err.toFixed(1)} cents at ${startSec}s (got ${r.freq.toFixed(2)} Hz, want ${f.toFixed(2)})`);
        const d = describeReading(r.freq, null);
        assert.equal(d.string.num, s.num);
      }
    });
  }
}

test('sine waves at 44.1 kHz', () => {
  for (const f of [82.41, 110, 146.83, 196, 246.94, 329.63, 440, 880]) {
    const buf = new Float32Array(4096);
    for (let i = 0; i < buf.length; i++) buf[i] = 0.3 * Math.sin((2 * Math.PI * f * i) / 44100);
    const r = detectPitch(buf, 44100);
    assert.ok(Math.abs(centsOff(r.freq, f)) < 2, `${f}: got ${r.freq}`);
  }
});

test('silence and quiet noise give no reading', () => {
  assert.equal(detectPitch(new Float32Array(4096), SR), null);
  const quiet = new Float32Array(4096).map(() => (Math.random() * 2 - 1) * 0.002);
  assert.equal(detectPitch(quiet, SR), null);
});

test('advice words for beginners', () => {
  const lowE = STRINGS[0];
  const g = midiToFreq(lowE.midi);
  assert.equal(describeReading(g, lowE).status, 'in');
  assert.equal(describeReading(g * Math.pow(2, -20 / 1200), lowE).status, 'low');
  assert.match(describeReading(g * Math.pow(2, -20 / 1200), lowE).advice, /Tighten/);
  assert.match(describeReading(g * Math.pow(2, 50 / 1200), lowE).advice, /Loosen/);
});
