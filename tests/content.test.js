import { test } from 'node:test';
import assert from 'node:assert/strict';
import { CHORDS, SONGS, STRUMS, PROGRESSIONS, songBeats, transposeChord } from '../app/js/music.js';
import { LESSONS, LEVELS } from '../app/js/lessons.js';

test('every chord shape is well formed', () => {
  for (const [k, c] of Object.entries(CHORDS)) {
    assert.equal(c.frets.length, 6, k); assert.equal(c.fingers.length, 6, k);
    c.frets.forEach((f, i) => {
      assert.ok(f >= -1 && f <= 12, `${k} fret`);
      if (f > 0) assert.ok(c.fingers[i] >= 1 && c.fingers[i] <= 4, `${k} string ${6 - i} needs a finger`);
      if (f <= 0) assert.equal(c.fingers[i], 0, `${k} string ${6 - i} open/muted has no finger`);
    });
    assert.ok(LEVELS[c.level], k);
    if (c.barre) assert.ok(c.frets.filter((f) => f === c.barre.fret).length >= 2, k);
  }
});

test('songs fill whole bars and use valid strings and frets', () => {
  for (const [k, s] of Object.entries(SONGS)) {
    for (const n of s.notes) if (!n.r) { assert.ok(n.s >= 1 && n.s <= 6, k); assert.ok(n.f >= 0 && n.f <= 12, k); }
    const beats = songBeats(s) - (s.pickup || 0);
    assert.ok(Math.abs(beats / s.beatsPerBar - Math.round(beats / s.beatsPerBar)) < 1e-9, `${k}: ${beats} beats is not whole bars of ${s.beatsPerBar}`);
  }
});

test('lessons reference only existing chords, songs and patterns', () => {
  const ids = new Set();
  for (const l of LESSONS) {
    assert.ok(!ids.has(l.id), `duplicate ${l.id}`); ids.add(l.id);
    assert.ok(LEVELS[l.level] && l.title && l.goal && l.check.length, l.id);
    for (const b of l.blocks) {
      (b.chords || []).forEach((c) => assert.ok(CHORDS[c], `${l.id}: chord ${c}`));
      if (typeof b.song === 'string') assert.ok(SONGS[b.song], `${l.id}: song ${b.song}`);
      if (b.strum) { assert.ok(STRUMS[b.strum.pattern], `${l.id}: pattern`); b.strum.chords.forEach((c) => assert.ok(CHORDS[c], `${l.id}: ${c}`)); }
      if (b.changes) b.changes.forEach((c) => assert.ok(CHORDS[c], `${l.id}: ${c}`));
      if (b.quiz) b.quiz.forEach((q) => assert.ok(q.a >= 0 && q.a < q.options.length, `${l.id}: quiz answer`));
    }
  }
  for (const p of Object.values(PROGRESSIONS)) p.chords.forEach((c) => assert.ok(CHORDS[c], c));
  assert.equal(LESSONS.filter((l) => l.level === 'basic').length, 10);
});

test('capo maths', () => {
  assert.equal(transposeChord('G', 2), 'A');
  assert.equal(transposeChord('C', 2), 'D');
  assert.equal(transposeChord('Am', 3), 'Cm');
  assert.equal(transposeChord('B', 1), 'C');
});
