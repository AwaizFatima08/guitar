// Geetar: music data and helpers. Pure data, no DOM, so tests can import it.

export const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
export const FRIENDLY_SHARP = { 'C#': 'C♯ / D♭', 'D#': 'D♯ / E♭', 'F#': 'F♯ / G♭', 'G#': 'G♯ / A♭', 'A#': 'A♯ / B♭' };

// Standard tuning, string 6 (thickest) to string 1 (thinnest), as MIDI numbers.
export const STRINGS = [
  { num: 6, name: 'E', label: 'Low E', midi: 40, hint: 'thickest string, closest to your chin' },
  { num: 5, name: 'A', label: 'A', midi: 45, hint: 'second thickest' },
  { num: 4, name: 'D', label: 'D', midi: 50, hint: 'third from the top' },
  { num: 3, name: 'G', label: 'G', midi: 55, hint: 'third from the floor' },
  { num: 2, name: 'B', label: 'B', midi: 59, hint: 'second thinnest' },
  { num: 1, name: 'E', label: 'High E', midi: 64, hint: 'thinnest string, closest to the floor' },
];

export const midiToFreq = (m) => 440 * Math.pow(2, (m - 69) / 12);
export const freqToMidi = (f) => 69 + 12 * Math.log2(f / 440);
export const noteName = (m) => NOTE_NAMES[((Math.round(m) % 12) + 12) % 12];
export const noteOctave = (m) => Math.floor(Math.round(m) / 12) - 1;

/** MIDI number of string `num` (1..6) at `fret`. */
export function stringFretMidi(num, fret) {
  const s = STRINGS.find((x) => x.num === num);
  return s.midi + fret;
}

// Chord shapes. frets: string 6 -> 1; -1 = do not play, 0 = open.
// fingers: 1 index, 2 middle, 3 ring, 4 little finger, 0 none.
// barre: { fret, from, to } with from/to string numbers (6..1).
export const CHORDS = {
  Em:    { name: 'E minor', frets: [0, 2, 2, 0, 0, 0], fingers: [0, 2, 3, 0, 0, 0], level: 'basic', mood: 'a little sad, very easy' },
  Am:    { name: 'A minor', frets: [-1, 0, 2, 2, 1, 0], fingers: [0, 0, 2, 3, 1, 0], level: 'basic', mood: 'gentle and thoughtful' },
  C:     { name: 'C major', frets: [-1, 3, 2, 0, 1, 0], fingers: [0, 3, 2, 0, 1, 0], level: 'medium', mood: 'bright and happy' },
  G:     { name: 'G major', frets: [3, 2, 0, 0, 0, 3], fingers: [2, 1, 0, 0, 0, 3], level: 'medium', mood: 'big and cheerful' },
  D:     { name: 'D major', frets: [-1, -1, 0, 2, 3, 2], fingers: [0, 0, 0, 1, 3, 2], level: 'medium', mood: 'bright and sparkly' },
  E:     { name: 'E major', frets: [0, 2, 2, 1, 0, 0], fingers: [0, 2, 3, 1, 0, 0], level: 'medium', mood: 'strong and full' },
  A:     { name: 'A major', frets: [-1, 0, 2, 2, 2, 0], fingers: [0, 0, 1, 2, 3, 0], level: 'medium', mood: 'happy and open' },
  Dm:    { name: 'D minor', frets: [-1, -1, 0, 2, 3, 1], fingers: [0, 0, 0, 2, 3, 1], level: 'medium', mood: 'serious and sad' },
  E5:    { name: 'E power chord', frets: [0, 2, -1, -1, -1, -1], fingers: [0, 1, 0, 0, 0, 0], level: 'medium', mood: 'rock' },
  A5:    { name: 'A power chord', frets: [-1, 0, 2, -1, -1, -1], fingers: [0, 0, 1, 0, 0, 0], level: 'medium', mood: 'rock' },
  D5:    { name: 'D power chord', frets: [-1, -1, 0, 2, -1, -1], fingers: [0, 0, 0, 1, 0, 0], level: 'medium', mood: 'rock' },
  G5:    { name: 'G power chord', frets: [3, 5, -1, -1, -1, -1], fingers: [1, 3, 0, 0, 0, 0], level: 'medium', mood: 'rock' },
  A7:    { name: 'A seven', frets: [-1, 0, 2, 0, 2, 0], fingers: [0, 0, 2, 0, 3, 0], level: 'medium', mood: 'bluesy' },
  D7:    { name: 'D seven', frets: [-1, -1, 0, 2, 1, 2], fingers: [0, 0, 0, 2, 1, 3], level: 'medium', mood: 'bluesy' },
  E7:    { name: 'E seven', frets: [0, 2, 0, 1, 0, 0], fingers: [0, 2, 0, 1, 0, 0], level: 'medium', mood: 'bluesy' },
  Fmaj7: { name: 'F major 7 (easy F)', frets: [-1, -1, 3, 2, 1, 0], fingers: [0, 0, 3, 2, 1, 0], level: 'expert', mood: 'dreamy' },
  F:     { name: 'F major (barre)', frets: [1, 3, 3, 2, 1, 1], fingers: [1, 3, 4, 2, 1, 1], barre: { fret: 1, from: 6, to: 1 }, level: 'expert', mood: 'full and warm' },
  Bm:    { name: 'B minor (barre)', frets: [-1, 2, 4, 4, 3, 2], fingers: [0, 1, 3, 4, 2, 1], barre: { fret: 2, from: 5, to: 1 }, level: 'expert', mood: 'moody' },
  Fm:    { name: 'F minor (barre)', frets: [1, 3, 3, 1, 1, 1], fingers: [1, 3, 4, 1, 1, 1], barre: { fret: 1, from: 6, to: 1 }, level: 'expert', mood: 'dark' },
  Cm:    { name: 'C minor (barre)', frets: [-1, 3, 5, 5, 4, 3], fingers: [0, 1, 3, 4, 2, 1], barre: { fret: 3, from: 5, to: 1 }, level: 'expert', mood: 'dark' },
  B7:    { name: 'B seven', frets: [-1, 2, 1, 2, 0, 2], fingers: [0, 2, 1, 3, 0, 4], level: 'expert', mood: 'bluesy' },
  G7:    { name: 'G seven', frets: [3, 2, 0, 0, 0, 1], fingers: [3, 2, 0, 0, 0, 1], level: 'expert', mood: 'wants to move on' },
  C7:    { name: 'C seven', frets: [-1, 3, 2, 3, 1, 0], fingers: [0, 3, 2, 4, 1, 0], level: 'expert', mood: 'bluesy' },
  Cmaj7: { name: 'C major 7', frets: [-1, 3, 2, 0, 0, 0], fingers: [0, 3, 2, 0, 0, 0], level: 'expert', mood: 'soft and jazzy' },
  Am7:   { name: 'A minor 7', frets: [-1, 0, 2, 0, 1, 0], fingers: [0, 0, 2, 0, 1, 0], level: 'expert', mood: 'mellow' },
  Em7:   { name: 'E minor 7', frets: [0, 2, 0, 0, 0, 0], fingers: [0, 2, 0, 0, 0, 0], level: 'expert', mood: 'airy' },
  Asus2: { name: 'A sus 2', frets: [-1, 0, 2, 2, 0, 0], fingers: [0, 0, 1, 2, 0, 0], level: 'expert', mood: 'open and floating' },
  Dsus2: { name: 'D sus 2', frets: [-1, -1, 0, 2, 3, 0], fingers: [0, 0, 0, 1, 3, 0], level: 'expert', mood: 'open and floating' },
  Dsus4: { name: 'D sus 4', frets: [-1, -1, 0, 2, 3, 3], fingers: [0, 0, 0, 1, 2, 3], level: 'expert', mood: 'tense, wants to resolve' },
};

/** MIDI notes that sound when the chord is strummed, low to high. */
export function chordMidis(chord) {
  const out = [];
  chord.frets.forEach((f, i) => { if (f >= 0) out.push(STRINGS[i].midi + f); });
  return out;
}

// Songs and exercises as tab. Each note: s = string (1 thin .. 6 thick), f = fret, b = beats.
// t = technique: 'h' hammer-on, 'p' pull-off, '/' slide up. r: true = rest.
// All melodies are traditional or public domain. No lyrics are included.
const n = (s, f, b = 1, t) => (t ? { s, f, b, t } : { s, f, b });
const rest = (b = 1) => ({ r: true, b });

// Upper melody positions (key of C, first position).
const E4 = (b) => n(1, 0, b), F4 = (b) => n(1, 1, b), G4 = (b) => n(1, 3, b);
const B3 = (b) => n(2, 0, b), C4 = (b) => n(2, 1, b), D4 = (b) => n(2, 3, b);
const G3 = (b) => n(3, 0, b), A3 = (b) => n(3, 2, b);
// Lower melody positions.
const C3 = (b) => n(5, 3, b), D3 = (b) => n(4, 0, b), E3 = (b) => n(4, 2, b), F3 = (b) => n(4, 3, b);
const A3lo = (b) => n(3, 2, b), G3lo = (b) => n(3, 0, b);

export const SONGS = {
  mary: {
    title: 'Mary Had a Little Lamb', level: 'basic', bpm: 90, beatsPerBar: 4,
    about: 'A traditional nursery tune. Only two strings (1 and 2) and three frets.',
    notes: [E4(), D4(), C4(), D4(), E4(), E4(), E4(2), D4(), D4(), D4(2), E4(), G4(), G4(2),
      E4(), D4(), C4(), D4(), E4(), E4(), E4(), E4(), D4(), D4(), E4(), D4(), C4(4)],
  },
  ode: {
    title: 'Ode to Joy', level: 'basic', bpm: 90, beatsPerBar: 4,
    about: 'Beethoven’s famous melody (1824). Strings 1 and 2 only.',
    notes: [E4(), E4(), F4(), G4(), G4(), F4(), E4(), D4(), C4(), C4(), D4(), E4(), E4(1.5), D4(0.5), D4(2),
      E4(), E4(), F4(), G4(), G4(), F4(), E4(), D4(), C4(), C4(), D4(), E4(), D4(1.5), C4(0.5), C4(2)],
  },
  twinkle: {
    title: 'Twinkle Twinkle Little Star', level: 'medium', bpm: 100, beatsPerBar: 4,
    about: 'Traditional melody, played low on strings 3, 4 and 5.',
    notes: [C3(), C3(), G3lo(), G3lo(), A3lo(), A3lo(), G3lo(2), F3(), F3(), E3(), E3(), D3(), D3(), C3(2),
      G3lo(), G3lo(), F3(), F3(), E3(), E3(), D3(2), G3lo(), G3lo(), F3(), F3(), E3(), E3(), D3(2),
      C3(), C3(), G3lo(), G3lo(), A3lo(), A3lo(), G3lo(2), F3(), F3(), E3(), E3(), D3(), D3(), C3(2)],
  },
  jingle: {
    title: 'Jingle Bells (chorus)', level: 'medium', bpm: 110, beatsPerBar: 4,
    about: 'James Lord Pierpont, 1857. Strings 1 and 2.',
    notes: [E4(), E4(), E4(2), E4(), E4(), E4(2), E4(), G4(), C4(1.5), D4(0.5), E4(4),
      F4(), F4(), F4(1.5), F4(0.5), F4(), E4(), E4(), E4(0.5), E4(0.5), E4(), D4(), D4(), E4(), D4(2), G4(2),
      E4(), E4(), E4(2), E4(), E4(), E4(2), E4(), G4(), C4(1.5), D4(0.5), E4(4),
      F4(), F4(), F4(), F4(), F4(), E4(), E4(), E4(0.5), E4(0.5), G4(), G4(), F4(), D4(), C4(4)],
  },
  birthday: {
    title: 'Happy Birthday', level: 'medium', bpm: 100, beatsPerBar: 3, pickup: 1,
    about: 'The melody (from 1893) is in the public domain. Strings 1, 2 and 3. Play it at the next birthday!',
    notes: [G3(0.75), G3(0.25), A3(), G3(), C4(), B3(2), G3(0.75), G3(0.25), A3(), G3(), D4(), C4(2),
      G3(0.75), G3(0.25), G4(), E4(), C4(), B3(), A3(2), F4(0.75), F4(0.25), E4(), C4(), D4(), C4(2)],
  },
  cmajor: {
    title: 'C major scale', level: 'expert', bpm: 80, beatsPerBar: 4,
    about: 'Do–Re–Mi–Fa–So–La–Ti–Do in first position, up and back down.',
    notes: [n(5, 3), n(4, 0), n(4, 2), n(4, 3), n(3, 0), n(3, 2), n(2, 0), n(2, 1),
      n(2, 0), n(3, 2), n(3, 0), n(4, 3), n(4, 2), n(4, 0), n(5, 3, 2)],
  },
  pentatonic: {
    title: 'A minor pentatonic (box 1)', level: 'expert', bpm: 80, beatsPerBar: 4,
    about: 'The most used scale in rock and blues. Index finger on fret 5, ring or little finger on 7 and 8.',
    notes: [n(6, 5), n(6, 8), n(5, 5), n(5, 7), n(4, 5), n(4, 7), n(3, 5), n(3, 7), n(2, 5), n(2, 8), n(1, 5), n(1, 8),
      n(1, 5), n(2, 8), n(2, 5), n(3, 7), n(3, 5), n(4, 7), n(4, 5), n(5, 7), n(5, 5), n(6, 8), n(6, 5, 2)],
  },
  legato: {
    title: 'Hammer-on, pull-off and slide lick', level: 'expert', bpm: 70, beatsPerBar: 4,
    about: 'h = hammer-on, p = pull-off, / = slide. Pick only the first note of each pair.',
    notes: [n(3, 5, 0.5), n(3, 7, 0.5, 'h'), n(3, 5, 1), n(2, 5, 0.5), n(2, 8, 0.5, 'h'), n(2, 5, 1),
      n(2, 8, 0.5), n(2, 5, 0.5, 'p'), n(3, 7, 1), n(3, 7, 0.5), n(3, 9, 0.5, '/'), n(3, 7, 1, 'p'), n(4, 7, 4)],
  },
  fingerpick: {
    title: 'Fingerpicking: C and G', level: 'expert', bpm: 70, beatsPerBar: 4,
    about: 'Thumb (p) plays the bass note; i, m, a are your index, middle and ring fingers. Hold the chord shape the whole time.',
    notes: [
      n(5, 3, 0.5), n(3, 0, 0.5), n(2, 1, 0.5), n(1, 0, 0.5), n(4, 2, 0.5), n(3, 0, 0.5), n(2, 1, 0.5), n(3, 0, 0.5),
      n(5, 3, 0.5), n(3, 0, 0.5), n(2, 1, 0.5), n(1, 0, 0.5), n(4, 2, 0.5), n(3, 0, 0.5), n(2, 1, 0.5), n(3, 0, 0.5),
      n(6, 3, 0.5), n(3, 0, 0.5), n(2, 0, 0.5), n(1, 3, 0.5), n(4, 0, 0.5), n(3, 0, 0.5), n(2, 0, 0.5), n(3, 0, 0.5),
      n(6, 3, 0.5), n(3, 0, 0.5), n(2, 0, 0.5), n(1, 3, 0.5), n(4, 0, 0.5), n(3, 0, 0.5), n(2, 0, 0.5), n(3, 0, 0.5),
      n(5, 3, 4)],
  },
  firstnotes: {
    title: 'First notes warm-up', level: 'basic', bpm: 70, beatsPerBar: 4,
    about: 'Open string, fret 1, fret 3 on string 1, then the same on string 2.',
    notes: [n(1, 0), n(1, 1), n(1, 3), rest(), n(1, 3), n(1, 1), n(1, 0), rest(),
      n(2, 0), n(2, 1), n(2, 3), rest(), n(2, 3), n(2, 1), n(2, 0), rest()],
  },
};

// Strumming patterns over one bar of 8 eighth notes. D = down, U = up, '-' = miss (keep hand moving).
export const STRUMS = {
  quarters: { name: 'Four downs', pattern: 'D-D-D-D-', level: 'basic', count: '1 · 2 · 3 · 4 ·' },
  halves: { name: 'Slow downs', pattern: 'D---D---', level: 'basic', count: '1 · · · 3 · · ·' },
  eighths: { name: 'Down-up', pattern: 'DUDUDUDU', level: 'medium', count: '1 & 2 & 3 & 4 &' },
  campfire: { name: 'Campfire', pattern: 'D-DU-UDU', level: 'medium', count: '1 · 2 & · & 4 &' },
  rock: { name: 'Rock', pattern: 'D-DUD-DU', level: 'medium', count: '1 · 2 & 3 · 4 &' },
  waltz: { name: 'Waltz (3 beats)', pattern: 'D-D-D-', level: 'medium', count: '1 · 2 · 3 ·' },
};

// Chord progressions for practice.
export const PROGRESSIONS = {
  em_am: { name: 'Em – Am', chords: ['Em', 'Am'], level: 'basic' },
  pop: { name: 'G – D – Em – C (the "four chord" pattern)', chords: ['G', 'D', 'Em', 'C'], level: 'medium' },
  fifties: { name: 'C – Am – F(maj7) – G', chords: ['C', 'Am', 'Fmaj7', 'G'], level: 'medium' },
  folk: { name: 'G – C – D – G', chords: ['G', 'C', 'D', 'G'], level: 'medium' },
  minor: { name: 'Am – Dm – E – Am', chords: ['Am', 'Dm', 'E', 'Am'], level: 'medium' },
  blues: { name: '12-bar blues in A', chords: ['A7', 'A7', 'A7', 'A7', 'D7', 'D7', 'A7', 'A7', 'E7', 'D7', 'A7', 'E7'], level: 'medium' },
  barre: { name: 'F – Bm – G – C', chords: ['F', 'Bm', 'G', 'C'], level: 'expert' },
};

/** Transpose a chord root by semitones; keeps the quality suffix (m, 7, maj7 ...). */
export function transposeChord(name, semis) {
  const m = /^([A-G]#?)(.*)$/.exec(name);
  if (!m) return name;
  const idx = NOTE_NAMES.indexOf(m[1]);
  return NOTE_NAMES[(((idx + semis) % 12) + 12) % 12] + m[2];
}

/** Total beats in a song. */
export const songBeats = (song) => song.notes.reduce((a, x) => a + x.b, 0);
