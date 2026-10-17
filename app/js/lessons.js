// Geetar: lesson content. Each lesson is a list of blocks rendered by app.js.
// Block types: p, h, tip, warn, steps, table, img, chords, song, strings, fretplay,
// strum, metronome, changes, quiz, link, capo, notefind, fretnames.

export const LEVELS = {
  basic: { name: 'Basic', tag: 'Start here: no music knowledge needed', color: 'var(--basic)', emoji: '🌱' },
  medium: { name: 'Medium', tag: 'Real chords, rhythm and your first songs', color: 'var(--medium)', emoji: '🌿' },
  expert: { name: 'Expert', tag: 'Barre chords, scales, fingerpicking and theory', color: 'var(--expert)', emoji: '🌳' },
};

export const LESSONS = [
  // ---------------- BASIC ----------------
  {
    id: 'b1', level: 'basic', title: 'Meet your guitar', minutes: 5,
    goal: 'Learn the names of the guitar’s parts, so every other lesson makes sense.',
    blocks: [
      { p: 'Welcome! You do not need to know anything about music to start. Each lesson is short. Do one a day, or repeat one as often as you like.' },
      { img: 'parts' },
      { table: { head: ['Part', 'What it does'], rows: [
        ['Headstock and tuning pegs', 'Turn a peg to make its string tighter (higher) or looser (lower). This is how you tune.'],
        ['Nut', 'The little white strip the strings rest on at the top of the neck.'],
        ['Neck and frets', 'Frets are the metal strips. Pressing a string between them changes its note.'],
        ['Body and sound hole', 'The hollow body makes the sound louder.'],
        ['Bridge', 'Holds the strings at the bottom end.'],
      ] } },
      { p: 'Your guitar may be acoustic (steel strings), classical (nylon strings, softer on the fingers) or electric. Every lesson works on all three.' },
      { tip: 'Fingertips feel sore for the first week or two. That is normal and it goes away as they toughen up. Practise 10 to 15 minutes at a time, and rest when it hurts.' },
      { quiz: [
        { q: 'Which part do you turn to tune a string?', options: ['The bridge', 'A tuning peg', 'The sound hole'], a: 1, why: 'Tuning pegs are on the headstock. Each one tightens or loosens one string.' },
        { q: 'What are the metal strips across the neck called?', options: ['Strings', 'Frets', 'Pegs'], a: 1, why: 'They are frets. “Fret 3” means the space just before the third metal strip.' },
      ] },
    ],
    check: ['I can point to the headstock, neck, frets and body', 'I know where the tuning pegs are'],
  },
  {
    id: 'b2', level: 'basic', title: 'Holding the guitar and pick', minutes: 8,
    goal: 'Sit comfortably, know which hand does what, and learn the finger numbers.',
    blocks: [
      { h: 'Sitting' },
      { steps: [
        'Sit on a chair without arms, with your back straight and feet flat.',
        'Rest the curved “waist” of the guitar on your right leg (left leg if you play left-handed).',
        'The back of the guitar touches your tummy. The neck points slightly up.',
        'Your strumming hand (right) rests over the sound hole, forearm on the top edge of the body.',
        'Your fretting hand (left) holds the neck: thumb behind it, fingers curved as if holding a ball.',
        'Keep your shoulders loose. If anything feels tense, stop and shake it out.',
      ] },
      { h: 'Finger numbers' },
      { p: 'Lessons tell you which finger to use with a number. “Finger 1 on fret 2” means your index finger.' },
      { img: 'hand' },
      { h: 'Holding a pick' },
      { steps: [
        'Curl your strumming hand loosely, like a soft fist.',
        'Lay the pick flat on the side of your index finger, pointy end sticking out.',
        'Press your thumb on top. Only a little tip of the pick should show.',
        'No pick? Strum with the side of your thumb or the nail of your index finger.',
      ] },
      { tip: 'Left-handed? You can play a left-handed guitar (everything is mirrored), or learn the normal way; many left-handed people do. Pick one and stay with it.' },
      { quiz: [
        { q: 'Which finger is number 3?', options: ['Index', 'Ring', 'Little'], a: 1, why: 'Index = 1, middle = 2, ring = 3, little = 4. The thumb is T.' },
        { q: 'Where does your thumb go on the neck?', options: ['Behind the neck', 'On the frets', 'Wrapped over the strings'], a: 0, why: 'Behind the neck, so the fingers can reach the strings with their tips.' },
      ] },
    ],
    check: ['I can sit and hold the guitar comfortably', 'I know the finger numbers 1, 2, 3, 4', 'I can hold a pick'],
  },
  {
    id: 'b3', level: 'basic', title: 'The six strings', minutes: 6,
    goal: 'Know each string’s number and name.',
    blocks: [
      { p: 'Strings are numbered 1 to 6. <b>String 1 is the thinnest</b>, closest to the floor. <b>String 6 is the thickest</b>, closest to your face.' },
      { p: 'Tap each string below to hear it.' },
      { strings: true },
      { p: 'Their names, from thickest to thinnest, are <b>E A D G B E</b>. A trick to remember: <i>Eddie Ate Dynamite, Good Bye Eddie</i>.' },
      { table: { head: ['Number', 'Name', 'Where'], rows: [
        ['6', 'E (low E)', 'Thickest, top when you hold the guitar'],
        ['5', 'A', ''], ['4', 'D', ''], ['3', 'G', ''], ['2', 'B', ''],
        ['1', 'E (high E)', 'Thinnest, nearest the floor'],
      ] } },
      { p: 'Playing a string without pressing any fret is called playing it <b>open</b>.' },
      { quiz: [
        { q: 'Which string is number 1?', options: ['The thickest', 'The thinnest'], a: 1, why: 'Number 1 is the thinnest string, nearest the floor.' },
        { q: 'What are the string names from thickest to thinnest?', options: ['E A D G B E', 'A B C D E F', 'E B G D A E'], a: 0, why: 'Eddie Ate Dynamite, Good Bye Eddie.' },
        { q: 'Which string is number 4?', options: ['D', 'G', 'A'], a: 0, why: 'Counting up from the thin side: 1 E, 2 B, 3 G, 4 D.' },
      ] },
    ],
    check: ['I can say the string names E A D G B E', 'I know that string 1 is the thinnest'],
  },
  {
    id: 'b4', level: 'basic', title: 'Tune your guitar', minutes: 8,
    goal: 'Tune all six strings with the Geetar tuner, every time you play.',
    blocks: [
      { p: 'Guitars go out of tune easily: with heat, new strings, or even a bump. Out of tune, even perfect playing sounds wrong. So tune every time you pick it up. It gets quick with practice.' },
      { link: { to: '#/tuner', label: 'Open the tuner' } },
      { steps: [
        'Open the tuner and press <b>Start</b>. Allow the microphone when asked. The sound is only used on your device.',
        'Pluck one string and let it ring. Hold the phone or laptop near the guitar.',
        'Read the message. <b>Too low</b> means tighten the string. <b>Too high</b> means loosen it.',
        'Turn the peg slowly. A small turn makes a big change.',
        'When the meter turns green and says <b>In tune</b>, go to the next string.',
        'When all six are done, check them once more. Tuning one string can move the others a little.',
      ] },
      { tip: 'Not sure which way tightens? Pluck and turn very slowly. If the note goes up, you are tightening. It is best to finish tuning by going <i>up</i> to the note: if a string is too high, loosen it below the note and then come back up.' },
      { warn: 'Never turn a peg fast or far. A string that is too tight can snap. If the tuner says “far too low”, check you are plucking the string it shows.' },
      { p: 'You can also tap a string button in the tuner to hear what that string should sound like.' },
    ],
    check: ['I can tune all six strings with the tuner'],
  },
  {
    id: 'b5', level: 'basic', title: 'Your first notes', minutes: 10,
    goal: 'Press a string behind a fret and get a clean note.',
    blocks: [
      { p: 'Pressing a string onto the neck makes the part that vibrates shorter, so the note goes higher. “Fret 1” means pressing in the space between the nut and the first metal fret.' },
      { steps: [
        'Press with the very tip of your finger, nail pointing toward you.',
        'Put your fingertip just behind the metal fret wire: close to it, not on top of it.',
        'Press only as hard as you need for a clear sound. Squeezing harder does not help.',
        'Use one finger per fret: finger 1 for fret 1, finger 3 for fret 3.',
      ] },
      { p: 'Tap a glowing spot to hear how it should sound, then play it yourself.' },
      { fretplay: { frets: 5, mark: [[1, 0], [1, 1], [1, 3], [2, 0], [2, 1], [2, 3]] } },
      { song: 'firstnotes' },
      { tip: '<b>Buzzing?</b> Move your finger closer to the fret wire, or press a little harder. <b>Dull or dead note?</b> Part of your finger is touching another string, or you are using the soft pad instead of the tip.' },
    ],
    check: ['I can play fret 1 and fret 3 cleanly on strings 1 and 2'],
  },
  {
    id: 'b6', level: 'basic', title: 'Reading tab and chord boxes', minutes: 8,
    goal: 'Understand the two pictures guitarists use instead of sheet music.',
    blocks: [
      { h: 'Tab' },
      { p: 'Tab (short for tablature) has 6 lines, one for each string. <b>The top line is string 1</b> (thin e) and the bottom line is string 6 (thick E). It is as if the guitar lies on your lap and you look down at it.' },
      { p: 'A number on a line tells you which fret to press on that string. <b>0 means play it open</b>. Read from left to right, like a sentence.' },
      { song: { title: 'Tab example', bpm: 70, beatsPerBar: 4, about: 'String 1 open, string 1 fret 3, string 2 fret 1, string 3 open.', notes: [{ s: 1, f: 0, b: 1 }, { s: 1, f: 3, b: 1 }, { s: 2, f: 1, b: 1 }, { s: 3, f: 0, b: 1 }] } },
      { h: 'Chord boxes' },
      { p: 'A chord box shows the neck standing up, facing you. The vertical lines are strings, with the thick E on the <b>left</b>. The horizontal lines are frets, and the thick line at the top is the nut.' },
      { p: 'Dots show where your fingers go, and the number in a dot says which finger. <b>O</b> above a string means play it open. <b>×</b> means do not play that string.' },
      { chords: ['Em'] },
      { quiz: [
        { q: 'In tab, the top line is…', options: ['String 6, the thick one', 'String 1, the thin one'], a: 1, why: 'Tab’s top line is the thin high e string.' },
        { q: 'In a chord box, × above a string means…', options: ['Play it open', 'Do not play this string', 'Use finger 10'], a: 1, why: '× means skip it. O means play it open.' },
        { q: 'A 0 in tab means…', options: ['Open string', 'Mute the string', 'Fret 10'], a: 0, why: '0 = play the string without pressing a fret.' },
      ] },
    ],
    check: ['I can read a simple tab', 'I know what O, × and the dots mean in a chord box'],
  },
  {
    id: 'b7', level: 'basic', title: 'First song: Mary Had a Little Lamb', minutes: 12,
    goal: 'Play a whole tune with just four notes.',
    blocks: [
      { p: 'You only need string 1 (open and fret 3) and string 2 (fret 1 and fret 3).' },
      { fretplay: { frets: 4, mark: [[1, 0], [1, 3], [2, 1], [2, 3]] } },
      { p: 'Press <b>Play</b> to hear the tune and follow the moving highlight. Then play along at a slow speed.' },
      { song: 'mary' },
      { tip: 'Use the speed slider. Start slow, around 60. Speed comes by itself once the notes feel easy.' },
      { h: 'Bonus: Ode to Joy' },
      { p: 'This one adds one more note: string 1, fret 1.' },
      { song: 'ode' },
    ],
    check: ['I can play Mary Had a Little Lamb from start to end', 'Bonus: I can play Ode to Joy'],
  },
  {
    id: 'b8', level: 'basic', title: 'Your first chord: E minor', minutes: 10,
    goal: 'Play the easiest chord on the guitar.',
    blocks: [
      { p: 'A <b>chord</b> is several notes played together. You strum across the strings with your pick or thumb.' },
      { chords: ['Em'] },
      { steps: [
        'Finger 2 on string 5, fret 2.',
        'Finger 3 on string 4, fret 2, right next to it.',
        'Strum all six strings slowly, from the thickest down.',
        'Now play one string at a time. All six should ring clearly.',
        'If a string sounds dead, curve your fingers more so they do not touch the strings next to them.',
      ] },
      { p: 'Strum once on every click. Press <b>Play</b> to hear it first.' },
      { strum: { pattern: 'quarters', chords: ['Em'], bpm: 60 } },
    ],
    check: ['All six strings ring clearly when I play Em'],
  },
  {
    id: 'b9', level: 'basic', title: 'Second chord: A minor', minutes: 12,
    goal: 'Play A minor, then switch between Em and Am.',
    blocks: [
      { chords: ['Am'] },
      { steps: [
        'Finger 1 on string 2, fret 1.',
        'Finger 2 on string 4, fret 2.',
        'Finger 3 on string 3, fret 2.',
        'Strum from string 5 down. Skip the thick string 6 (it has a × in the box).',
      ] },
      { tip: 'Em and Am share a shape: fingers 2 and 3 sit side by side at fret 2. For Am, that pair moves one string thinner and finger 1 joins in. Move the fingers together, close to the strings.' },
      { p: 'Practise the switch: how many times can you change from Em to Am and back in one minute? Write down your score and beat it tomorrow.' },
      { changes: ['Em', 'Am'] },
    ],
    check: ['I can play Am with all five strings ringing', 'I can change Em ↔ Am 15 times in a minute'],
  },
  {
    id: 'b10', level: 'basic', title: 'Strumming in time', minutes: 12,
    goal: 'Strum steady down-strums with a beat and change chords without stopping.',
    blocks: [
      { p: 'Music has a steady beat, like a clock ticking. We count it <b>1, 2, 3, 4</b> over and over. Each group of four is called a <b>bar</b>.' },
      { p: 'Start the click below and count out loud with it.' },
      { metronome: 60 },
      { p: 'Now strum: 4 strums of Em, then 4 of Am, one strum on every count.' },
      { strum: { pattern: 'quarters', chords: ['Em', 'Am'], bpm: 60 } },
      { tip: 'Keep the beat going even if the chord is not perfect. The beat matters more than perfect fingers. If you need time to change, lift your fingers on count 4.' },
      { quiz: [
        { q: 'How many beats are in one bar here?', options: ['2', '4', '8'], a: 1, why: 'We count 1, 2, 3, 4. That is one bar.' },
      ] },
      { p: '🎉 When you can do this, you have finished <b>Basic</b>. Well done! Medium is next.' },
    ],
    check: ['I can strum Em and Am to the click at 60 without stopping'],
  },

  // ---------------- MEDIUM ----------------
  {
    id: 'm1', level: 'medium', title: 'The big three: G, C and D', minutes: 15,
    goal: 'Learn the three chords used in thousands of songs.',
    blocks: [
      { chords: ['G', 'C', 'D'] },
      { table: { head: ['Chord', 'Fingers', 'Strum'], rows: [
        ['G', '2 on string 6 fret 3 · 1 on string 5 fret 2 · 3 on string 1 fret 3', 'All 6 strings'],
        ['C', '3 on string 5 fret 3 · 2 on string 4 fret 2 · 1 on string 2 fret 1', 'From string 5'],
        ['D', '1 on string 3 fret 2 · 3 on string 2 fret 3 · 2 on string 1 fret 2', 'From string 4 only'],
      ] } },
      { tip: 'For C, keep finger 1 curved so it does not touch the open string 1. For D, aim your strum at the thinner four strings.' },
      { strum: { pattern: 'quarters', chords: ['G', 'C', 'D', 'G'], bpm: 60 } },
    ],
    check: ['I can play G, C and D with clear strings', 'I can play G – C – D – G to the click'],
  },
  {
    id: 'm2', level: 'medium', title: 'More open chords: E, A and D minor', minutes: 15,
    goal: 'Hear the difference between major and minor, and grow your chord collection.',
    blocks: [
      { chords: ['E', 'A', 'Dm'] },
      { p: '<b>Major</b> chords (E, A, G, C, D) sound bright and happy. <b>Minor</b> chords (Em, Am, Dm) sound softer or sadder. Play E, then Em, and listen to the change. Only one finger is different!' },
      { chords: ['E', 'Em'] },
      { tip: 'A squeezes three fingers into fret 2. Tilt them, or try fingers 2, 1, 3 in a row; any order that rings clearly is fine.' },
      { strum: { pattern: 'quarters', chords: ['Am', 'Dm', 'E', 'Am'], bpm: 65 } },
      { quiz: [
        { q: 'Which usually sounds happier?', options: ['E major', 'E minor'], a: 0, why: 'Major chords sound bright. Minor chords sound softer or sadder.' },
      ] },
    ],
    check: ['I can play E, A and Dm', 'I can hear the difference between E and Em'],
  },
  {
    id: 'm3', level: 'medium', title: 'Smooth chord changes', minutes: 15,
    goal: 'Change chords quickly and without stopping the strum.',
    blocks: [
      { steps: [
        '<b>Find anchor fingers.</b> From C to Am, fingers 1 and 2 stay where they are. Only finger 3 moves!',
        '<b>Move as one shape.</b> Lift all fingers together and land them together, not one by one.',
        '<b>Practise silently.</b> Shape, lift, shape, lift, without strumming.',
        '<b>Look ahead.</b> Start moving on the last beat of the bar.',
      ] },
      { table: { head: ['Change', 'Trick'], rows: [
        ['C ↔ Am', 'Fingers 1 and 2 stay. Move only finger 3.'],
        ['E ↔ Am', 'Same shape! Move all three fingers one string thinner.'],
        ['G ↔ Em', 'Finger 2 moves from string 6 to string 5. The rest let go.'],
        ['D ↔ A', 'Keep finger 1 close to string 3 while you change.'],
      ] } },
      { p: 'Pick a pair, start the timer and count your changes. Your best score is saved.' },
      { changes: ['C', 'G'] },
    ],
    check: ['I can do 30 changes a minute on C ↔ G', 'I can do 30 changes a minute on G ↔ D'],
  },
  {
    id: 'm4', level: 'medium', title: 'Strumming patterns', minutes: 15,
    goal: 'Add up-strums and play real strumming patterns.',
    blocks: [
      { p: 'Your strumming hand moves down and up all the time, like a pendulum. Count <b>1 & 2 & 3 & 4 &</b>: down on the numbers, up on the “&”.' },
      { p: 'For a gap in the pattern, keep the hand moving but miss the strings. That keeps your timing steady.' },
      { strum: { pattern: 'eighths', chords: ['G'], bpm: 70 } },
      { p: 'Now the famous <b>campfire</b> pattern: Down, Down-Up, Up-Down-Up.' },
      { strum: { pattern: 'campfire', chords: ['G', 'C'], bpm: 70 } },
      { tip: 'Up-strums only need to touch the thinner 3 or 4 strings, lightly. Keep your wrist loose, as if shaking water off your hand.' },
    ],
    check: ['I can strum down-up eighths', 'I can play the campfire pattern on G and C'],
  },
  {
    id: 'm5', level: 'medium', title: 'Play a chord song: G – D – Em – C', minutes: 15,
    goal: 'Play the four-chord pattern behind countless pop songs.',
    blocks: [
      { p: 'Many popular songs use just G, D, Em and C, in this order, again and again. Once you can play it, try looking up “G D Em C songs” and play along with your favourites.' },
      { chords: ['G', 'D', 'Em', 'C'] },
      { strum: { pattern: 'campfire', chords: ['G', 'D', 'Em', 'C'], bpm: 70 } },
      { p: 'Another classic, used in many folk songs:' },
      { strum: { pattern: 'quarters', chords: ['G', 'C', 'D', 'G'], bpm: 80 } },
    ],
    check: ['I can loop G – D – Em – C without stopping'],
  },
  {
    id: 'm6', level: 'medium', title: 'Melodies: Twinkle, Jingle Bells, Happy Birthday', minutes: 20,
    goal: 'Play well-known tunes note by note, on more strings.',
    blocks: [
      { p: 'Twinkle Twinkle is played low on strings 3, 4 and 5. Use your thumb or pick.' },
      { song: 'twinkle' },
      { song: 'jingle' },
      { p: 'Happy Birthday uses three beats in each bar. Now you can play it at the next birthday party!' },
      { song: 'birthday' },
    ],
    check: ['I can play Twinkle Twinkle', 'I can play Happy Birthday'],
  },
  {
    id: 'm7', level: 'medium', title: 'Reading rhythm', minutes: 12,
    goal: 'Understand how long notes last, and count rhythms.',
    blocks: [
      { table: { head: ['Note', 'Lasts', 'Count it'], rows: [
        ['Whole note', '4 beats', '1 – 2 – 3 – 4'],
        ['Half note', '2 beats', '1 – 2'],
        ['Quarter note', '1 beat', '1'],
        ['Eighth note', '½ beat', '1 &'],
        ['Dotted note', '1½ times as long', 'dotted half = 3 beats'],
      ] } },
      { p: 'Try half notes (2 beats per strum), then eighth notes (2 strums per beat).' },
      { strum: { pattern: 'halves', chords: ['C'], bpm: 70 } },
      { strum: { pattern: 'eighths', chords: ['C'], bpm: 70 } },
      { metronome: 70 },
      { quiz: [
        { q: 'How many eighth notes fit in one beat?', options: ['1', '2', '4'], a: 1, why: 'Two: “1 &”.' },
        { q: 'How long does a half note last?', options: ['1 beat', '2 beats', '4 beats'], a: 1, why: 'Half of a whole note, so 2 beats.' },
      ] },
    ],
    check: ['I can count 1 & 2 & 3 & 4 & while strumming'],
  },
  {
    id: 'm8', level: 'medium', title: 'Power chords and palm muting', minutes: 15,
    goal: 'Play the two-note chords used in rock music.',
    blocks: [
      { chords: ['E5', 'A5', 'D5', 'G5'] },
      { p: 'A power chord has just two notes. It sounds great loud, and especially on an electric guitar. The shape moves anywhere: finger 1 on the low note, finger 3 two frets higher on the next thinner string.' },
      { p: '<b>Palm muting:</b> rest the side of your strumming hand lightly on the strings right next to the bridge, then strum short down-strokes. You get a chunky “chug” sound.' },
      { strum: { pattern: 'eighths', chords: ['E5', 'G5', 'A5', 'A5'], bpm: 90 } },
    ],
    check: ['I can play E5, A5 and G5', 'I can palm-mute a steady chug'],
  },
  {
    id: 'm9', level: 'medium', title: 'The 12-bar blues', minutes: 15,
    goal: 'Play the 12-bar pattern behind blues and rock and roll.',
    blocks: [
      { p: 'The 12-bar blues uses three chords, here A7, D7 and E7, in a fixed order of 12 bars.' },
      { chords: ['A7', 'D7', 'E7'] },
      { table: { head: ['Bars 1–4', 'Bars 5–8', 'Bars 9–12'], rows: [['A7 · A7 · A7 · A7', 'D7 · D7 · A7 · A7', 'E7 · D7 · A7 · E7']] } },
      { strum: { pattern: 'rock', chords: ['A7', 'A7', 'A7', 'A7', 'D7', 'D7', 'A7', 'A7', 'E7', 'D7', 'A7', 'E7'], bpm: 90 } },
      { tip: 'For a bluesy “swing”, make each down-strum a little longer than the up-strum: long-short, long-short.' },
      { p: '🎉 Finish this and you have completed <b>Medium</b>.' },
    ],
    check: ['I can play the full 12-bar blues without stopping'],
  },

  // ---------------- EXPERT ----------------
  {
    id: 'e1', level: 'expert', title: 'Barre chords: F and B minor', minutes: 20,
    goal: 'Use one finger as a “bar” across the strings.',
    blocks: [
      { p: 'In a barre chord, finger 1 presses all the strings at one fret, like a moveable nut. It is the big step up, and it takes most people a few weeks to get clean. Be patient with yourself.' },
      { steps: [
        'Lay finger 1 flat across all strings, just behind fret 1.',
        'Roll it slightly onto its bony side (toward the headstock). The bony side presses better.',
        'Thumb behind the neck, around the middle, opposite finger 2.',
        'Use your arm’s weight to pull the neck gently back toward you. Do not just squeeze with the thumb.',
        'Add fingers 2, 3 and 4 (it is the E major shape moved up).',
        'Pluck each string one by one, and fix the dead ones.',
      ] },
      { p: 'Start with the easy F (Fmaj7), then try the full barre F and B minor.' },
      { chords: ['Fmaj7', 'F', 'Bm'] },
      { tip: 'Practise the barre at fret 5 first: the strings are easier to press there. Then slide it down toward fret 1.' },
      { changes: ['C', 'F'] },
    ],
    check: ['I can play F with at least 5 strings ringing', 'I can play Bm'],
  },
  {
    id: 'e2', level: 'expert', title: 'Moveable shapes: one shape, every chord', minutes: 20,
    goal: 'Use barre shapes to play any major or minor chord.',
    blocks: [
      { p: 'The barre F is just the open E shape moved up one fret, with finger 1 acting as the nut. Slide the same shape up and the chord changes name. The name comes from the note under finger 1 on string 6.' },
      { table: { head: ['Fret', '1', '3', '5', '7', '8', '10'], rows: [
        ['String 6 (E shape)', 'F', 'G', 'A', 'B', 'C', 'D'],
        ['String 5 (A shape)', 'A♯/B♭', 'C', 'D', 'E', 'F', 'G'],
      ] } },
      { p: 'E shape: major like F, minor like Fm. A shape (root on string 5): minor like Bm and Cm.' },
      { chords: ['F', 'Fm', 'Bm', 'Cm'] },
      { p: 'Learn the notes on strings 6 and 5 with this game: find the note anywhere on the fretboard.' },
      { notefind: true },
    ],
    check: ['I can find G on string 6 and play a G barre chord at fret 3', 'I can play C minor at fret 3'],
  },
  {
    id: 'e3', level: 'expert', title: 'The minor pentatonic scale', minutes: 20,
    goal: 'Learn the scale behind most rock and blues solos, and improvise.',
    blocks: [
      { p: 'A <b>scale</b> is a set of notes that sound good together. The minor pentatonic has 5 notes, and almost every rock and blues solo uses it. “Box 1” in A starts at fret 5.' },
      { fretplay: { frets: 9, mark: [[6, 5], [6, 8], [5, 5], [5, 7], [4, 5], [4, 7], [3, 5], [3, 7], [2, 5], [2, 8], [1, 5], [1, 8]] } },
      { steps: [
        'Finger 1 plays fret 5 on every string.',
        'Finger 3 plays fret 7, finger 4 plays fret 8.',
        'Pick down, up, down, up (alternate picking).',
      ] },
      { song: 'pentatonic' },
      { p: '<b>Improvise!</b> Start this blues backing and play any notes from the box, in any order. You cannot play a wrong note.' },
      { strum: { pattern: 'rock', chords: ['A7', 'A7', 'A7', 'A7', 'D7', 'D7', 'A7', 'A7', 'E7', 'D7', 'A7', 'E7'], bpm: 85 } },
    ],
    check: ['I can play box 1 up and down', 'I can improvise over the blues for one minute'],
  },
  {
    id: 'e4', level: 'expert', title: 'Hammer-ons, pull-offs and slides', minutes: 15,
    goal: 'Play smooth, connected notes without picking every one.',
    blocks: [
      { table: { head: ['Sign in tab', 'Technique', 'How'], rows: [
        ['h', 'Hammer-on', 'Pick a note, then bring another finger down hard on a higher fret. The new note sounds without picking.'],
        ['p', 'Pull-off', 'Pick the higher note, then flick that finger off sideways. The lower note (already pressed) sounds.'],
        ['/', 'Slide', 'Pick, then slide the same finger along the string to the new fret without lifting it.'],
      ] } },
      { song: 'legato' },
      { tip: 'Hammer with the very tip of the finger, right behind the fret. For pull-offs, pull slightly down toward the floor, as if you were plucking with the fretting finger.' },
    ],
    check: ['I can play the lick with clear hammer-ons and pull-offs'],
  },
  {
    id: 'e5', level: 'expert', title: 'Fingerpicking', minutes: 20,
    goal: 'Pluck strings with your fingers for a gentle, flowing sound.',
    blocks: [
      { p: 'Instead of a pick, each finger looks after its own strings. The letters come from Spanish:' },
      { table: { head: ['Letter', 'Finger', 'Strings'], rows: [
        ['p', 'Thumb', '4, 5, 6 (the bass)'], ['i', 'Index', '3'], ['m', 'Middle', '2'], ['a', 'Ring', '1'],
      ] } },
      { steps: [
        'Rest your hand over the sound hole, wrist relaxed.',
        'The thumb pushes down; the fingers pluck up toward your palm.',
        'Hold the whole chord shape with your other hand the entire time.',
        'Start very slowly. Even 50 is fine.',
      ] },
      { chords: ['C', 'G'] },
      { song: 'fingerpick' },
    ],
    check: ['I can fingerpick the C and G pattern evenly'],
  },
  {
    id: 'e6', level: 'expert', title: 'Music theory you can use', minutes: 20,
    goal: 'Understand notes, scales and why chords go together.',
    blocks: [
      { p: 'There are only <b>12 different notes</b>. After that they repeat, higher:' },
      { p: '<span class="mono">C · C♯ · D · D♯ · E · F · F♯ · G · G♯ · A · A♯ · B · (C)</span>' },
      { p: 'Each step is a <b>half step</b>: exactly one fret. Notice that E–F and B–C have nothing in between.' },
      { fretnames: true },
      { p: 'The <b>major scale</b> follows the pattern whole, whole, half, whole, whole, whole, half (whole = 2 frets). From C you get C D E F G A B C: Do Re Mi Fa So La Ti Do.' },
      { song: 'cmajor' },
      { p: 'Chords are built by stacking every other scale note: C + E + G = C major. Each key has its own family of chords, numbered with Roman numerals:' },
      { table: { head: ['Key', 'I', 'IV', 'V', 'vi'], rows: [
        ['C', 'C', 'F', 'G', 'Am'], ['G', 'G', 'C', 'D', 'Em'], ['D', 'D', 'G', 'A', 'Bm'], ['A', 'A', 'D', 'E', 'F♯m'], ['E', 'E', 'A', 'B', 'C♯m'],
      ] } },
      { p: 'That is why G – D – Em – C works so well: it is I – V – vi – IV in the key of G.' },
      { quiz: [
        { q: 'How many frets is a whole step?', options: ['1', '2', '3'], a: 1, why: 'A half step is 1 fret, so a whole step is 2.' },
        { q: 'Which pairs have no sharp between them?', options: ['E–F and B–C', 'C–D and F–G', 'A–B and D–E'], a: 0, why: 'E–F and B–C are only a half step apart.' },
        { q: 'In the key of G, what is the V chord?', options: ['C', 'D', 'Em'], a: 1, why: 'Count G(I) A(ii) B(iii) C(IV) D(V).' },
      ] },
    ],
    check: ['I can name the 12 notes', 'I can find the I, IV and V chords in G'],
  },
  {
    id: 'e7', level: 'expert', title: 'Capo and changing keys', minutes: 12,
    goal: 'Use a capo to play easy shapes in any key.',
    blocks: [
      { p: 'A <b>capo</b> clamps all the strings at one fret, like a barre you do not have to hold. With it you can keep using easy open shapes, but in a higher key, for example to match a singer’s voice.' },
      { p: '<b>Rule:</b> the chord you hear = the shape you play, moved up by the capo’s fret number. Capo on fret 2 + G shape = A.' },
      { capo: true },
      { quiz: [
        { q: 'Capo on fret 2, you play a C shape. What do you hear?', options: ['C', 'D', 'E'], a: 1, why: 'C moved up 2 half steps: C → C♯ → D.' },
      ] },
    ],
    check: ['I can work out the sounding chord with a capo'],
  },
  {
    id: 'e8', level: 'expert', title: 'Colour chords: 7ths, sus and more', minutes: 15,
    goal: 'Add richer chords that make your playing sound grown-up.',
    blocks: [
      { chords: ['Cmaj7', 'Am7', 'Em7', 'G7', 'B7', 'Asus2', 'Dsus2', 'Dsus4'] },
      { p: '<b>maj7</b> chords sound soft and dreamy. <b>7</b> chords (like G7) sound bluesy and want to move on. <b>sus</b> chords are neither happy nor sad; they sound open and floating.' },
      { p: 'A favourite trick: D → Dsus4 → D → Dsus2 adds movement to a plain D.' },
      { strum: { pattern: 'eighths', chords: ['D', 'Dsus4', 'D', 'Dsus2'], bpm: 75 } },
      { p: '🏆 This is the last lesson. You have completed <b>Expert</b>. Keep playing every day and keep having fun!' },
    ],
    check: ['I can play Cmaj7, Am7 and G7', 'I can play the D – Dsus4 – D – Dsus2 trick'],
  },
];

export const lessonById = (id) => LESSONS.find((l) => l.id === id);
export const lessonsFor = (level) => LESSONS.filter((l) => l.level === level);
