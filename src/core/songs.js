// Original Doom-flavoured soundtrack (not transcriptions of any existing music).
// Each section is one bar of 16 sixteenth-note steps per channel:
//   note  "E2", "F#3"   - hold previous note   . rest
//   drums k kick  s snare  h hi-hat  c crash
// Channel names pick the instrument: bass, power (distorted power chord),
// lead, arp, pad (a trailing digit allows duplicates, e.g. pad2).

const bar = (s) => s;

// ---------- Title: "Marooned on Phobos" ----------
const T_I1 = {
  power: bar('E2 - - - - - - - . . . . G2 - F#2 -'),
  bass: bar('E1 - - - - - - - . . . . G1 - F#1 -'),
  drums: bar('c . . . . . . . . . . . k . k .'),
};
const T_I2 = {
  power: bar('E2 - - - - - - - . . . . A#2 - A2 -'),
  bass: bar('E1 - - - - - - - . . . . A#1 - A1 -'),
  drums: bar('c . . . . . . . k . s . k s s s'),
};
const T_A = {
  bass: bar('E1 E1 . E1 . E1 E1 . G1 . E1 . A#1 - A1 .'),
  power: bar('E2 . . . . . . . G2 - . . A#2 - A2 .'),
  drums: bar('k . h . s . h k . k h . s . h .'),
};
const T_A2 = {
  bass: bar('E1 E1 . E1 . E1 E1 . D2 . C2 . B1 - A#1 .'),
  power: bar('E2 . . . . . . . D3 - C3 . B2 - A#2 .'),
  drums: bar('k . h . s . h k . k h . s . s s'),
};
const TITLE = {
  bpm: 138,
  sections: {
    I1: T_I1, I2: T_I2, A: T_A, A2: T_A2,
    B1: { ...T_A, lead: bar('E4 - - - - - G4 - F#4 - E4 - D4 - E4 -') },
    B2: { ...T_A2, lead: bar('B4 - - - - - A#4 - A4 - G4 - F#4 - D4 -') },
    B3: { ...T_A, lead: bar('E4 - - - G4 - A4 - A#4 - - - A4 - G4 -') },
    B4: { ...T_A2, lead: bar('F#4 - - - - - - - E4 - - - - - - -') },
  },
  order: ['I1', 'I2', 'A', 'A2', 'A', 'A2', 'B1', 'B2', 'B3', 'B4', 'A', 'A2'],
};

// ---------- Overworld: "Surface of Phobos" ----------
const softHats = bar('h . . . h . . . h . . . h . h .');
const MAP = {
  bpm: 84,
  sections: {
    M1: { pad: bar('E3 - - - - - - - - - - - - - - -'), pad2: bar('B3 - - - - - - - - - - - - - - -'), arp: bar('E4 . G4 . B4 . G4 . E4 . G4 . B4 . D5 .'), bass: bar('E2 - - - - - - - E2 - - - - - - -'), drums: softHats },
    M2: { pad: bar('C3 - - - - - - - - - - - - - - -'), pad2: bar('G3 - - - - - - - - - - - - - - -'), arp: bar('C4 . E4 . G4 . E4 . C4 . E4 . G4 . B4 .'), bass: bar('C2 - - - - - - - C2 - - - - - - -'), drums: softHats },
    M3: { pad: bar('A2 - - - - - - - - - - - - - - -'), pad2: bar('E3 - - - - - - - - - - - - - - -'), arp: bar('A3 . C4 . E4 . C4 . A3 . C4 . E4 . G4 .'), bass: bar('A1 - - - - - - - A1 - - - - - - -'), drums: softHats },
    M4: { pad: bar('B2 - - - - - - - - - - - - - - -'), pad2: bar('F#3 - - - - - - - - - - - - - - -'), arp: bar('B3 . D#4 . F#4 . D#4 . B3 . D#4 . F#4 . A4 .'), bass: bar('B1 - - - - - - - B1 - - - - - - -'), drums: bar('h . . . h . . . h . h . h h h h') },
    L1: { pad: bar('E3 - - - - - - - - - - - - - - -'), arp: bar('E4 . G4 . B4 . G4 . E4 . G4 . B4 . D5 .'), lead: bar('B4 - - - - - - - A4 - G4 - F#4 - - -'), bass: bar('E2 - - - - - - - E2 - - - - - - -'), drums: softHats },
    L2: { pad: bar('C3 - - - - - - - - - - - - - - -'), arp: bar('C4 . E4 . G4 . E4 . C4 . E4 . G4 . B4 .'), lead: bar('G4 - - - - - - - E4 - - - - - - -'), bass: bar('C2 - - - - - - - C2 - - - - - - -'), drums: softHats },
    L3: { pad: bar('A2 - - - - - - - - - - - - - - -'), arp: bar('A3 . C4 . E4 . C4 . A3 . C4 . E4 . G4 .'), lead: bar('A4 - - - B4 - C5 - B4 - - - A4 - - -'), bass: bar('A1 - - - - - - - A1 - - - - - - -'), drums: softHats },
    L4: { pad: bar('B2 - - - - - - - - - - - - - - -'), arp: bar('B3 . D#4 . F#4 . D#4 . B3 . D#4 . F#4 . A4 .'), lead: bar('F#4 - - - - - - - D#4 - - - - - - -'), bass: bar('B1 - - - - - - - B1 - - - - - - -'), drums: softHats },
  },
  order: ['M1', 'M2', 'M3', 'M4', 'L1', 'L2', 'L3', 'L4'],
};

// ---------- Tech base levels: "Knee-Deep in the Hangar" ----------
const K_1 = {
  bass: bar('E1 E1 E2 . E1 E1 F#2 . E1 E1 G2 . E1 E1 F#2 .'),
  power: bar('E2 . . . . . . . E2 . . . G2 - F#2 -'),
  drums: bar('k . h . s . h . k . k . s . h .'),
};
const K_2 = {
  bass: bar('E1 E1 E2 . E1 E1 F#2 . E1 E1 A2 . E1 E1 A#2 B2'),
  power: bar('E2 . . . . . . . A2 - . . A#2 - B2 -'),
  drums: bar('k . h . s . h . k . k . s s s s'),
};
const K_3 = {
  bass: bar('C2 C2 C3 . C2 C2 D3 . C2 C2 E3 . C2 C2 D3 .'),
  power: bar('C3 . . . . . . . C3 . . . E3 - D3 -'),
  drums: bar('k . h . s . h . k . k . s . h .'),
};
const K_4 = {
  bass: bar('D2 D2 D3 . D2 D2 E3 . D2 D2 F#3 . B1 - C2 C#2'),
  power: bar('D3 . . . . . . . D3 . . . B2 - C3 C#3'),
  drums: bar('k . h . s . h . k . k . s s c .'),
};
const TECH = {
  bpm: 152,
  sections: {
    K1: K_1, K2: K_2, K3: K_3, K4: K_4,
    S1: { ...K_1, lead: bar('B4 - - - A4 - G4 - F#4 - G4 - E4 - - -') },
    S2: { ...K_2, lead: bar('B4 - - - D5 - C5 - B4 - A4 - B4 - - -') },
    S3: { ...K_1, lead: bar('E5 - - - D5 - B4 - D5 - - - E5 - G5 -') },
    S4: { ...K_2, lead: bar('F#5 - - - E5 - - - - - - - . . . .') },
  },
  order: ['K1', 'K1', 'K2', 'K2', 'S1', 'S2', 'S3', 'S4', 'K3', 'K4', 'K3', 'K4', 'K1', 'K2'],
};

// ---------- Nukage levels: "Toxin" ----------
const N_3 = {
  power: bar('E2 - - - - - - - F2 - - - - - - -'),
  bass: bar('E1 E1 . E1 E1 . E1 . F1 F1 . F1 F1 . F1 .'),
  drums: bar('k . h k s . h . k . h k s . h h'),
};
const NUKAGE = {
  bpm: 108,
  sections: {
    N1: { bass: bar('E1 - - - F1 - - - E1 - - - D#1 - - -'), arp: bar('E4 . F4 . . . E4 . B3 . . . A#3 . . .'), drums: bar('k . . . . . . . s . . . . . h .') },
    N2: { bass: bar('E1 - - - F1 - - - G1 - - - F#1 - - -'), arp: bar('G4 . F#4 . . . F4 . E4 . . . D#4 . . .'), drums: bar('k . . . . . . . s . . . k . h .') },
    N3: N_3,
    N4: { power: bar('G2 - - - - - - - F#2 - - - F2 - - -'), bass: bar('G1 G1 . G1 G1 . G1 . F#1 F#1 . F#1 F1 . F1 .'), drums: bar('k . h k s . h . k . h k s . s s') },
    N5: { ...N_3, lead: bar('B4 - - - - - - - C5 - - - - - B4 -') },
    N6: { power: bar('G2 - - - - - - - F#2 - - - F2 - - -'), bass: bar('G1 G1 . G1 G1 . G1 . F#1 F#1 . F#1 F1 . F1 .'), lead: bar('D5 - - - - - C#5 - C5 - - - B4 - - -'), drums: bar('k . h k s . h . k . h k s s c .') },
  },
  order: ['N1', 'N2', 'N1', 'N2', 'N3', 'N4', 'N3', 'N4', 'N5', 'N6', 'N5', 'N6'],
};

// ---------- Hell / boss: "Phobos Anomaly" ----------
const H_1 = {
  bass: bar('E1 E1 E1 E1 F1 E1 E1 E1 E1 E1 A#1 E1 E1 E1 F1 E1'),
  power: bar('E2 - - - F2 - - - E2 - A#2 - - - F2 -'),
  drums: bar('k h s h k k s h k h s h k k s s'),
};
const H_2 = {
  bass: bar('E1 E1 E1 E1 G1 E1 E1 E1 F#1 E1 E1 E1 F1 E1 E1 E1'),
  power: bar('E2 - - - G2 - - - F#2 - - - F2 - - -'),
  drums: bar('k h s h k k s h k h s h k s c .'),
};
const HELL = {
  bpm: 172,
  sections: {
    H1: H_1, H2: H_2,
    H3: { ...H_1, lead: bar('E5 - D#5 - E5 - F5 - E5 - D#5 - C5 - B4 -') },
    H4: { ...H_2, lead: bar('A#4 - - - B4 - - - C5 - - - B4 - A#4 -') },
    H5: { ...H_1, lead: bar('E5 - - - - - - - F5 - - - E5 - - -') },
    H6: { ...H_2, lead: bar('G5 - F5 - E5 - F5 - E5 - D#5 - E5 - - -') },
  },
  order: ['H1', 'H1', 'H2', 'H2', 'H3', 'H4', 'H3', 'H4', 'H1', 'H2', 'H5', 'H6'],
};

// ---------- Intermission ----------
const I_DRUMS = bar('k . h . s . h . k . h k s . h .');
const INTERMISSION = {
  bpm: 116,
  sections: {
    I1: { bass: bar('A1 . A1 A2 . A1 G2 . A1 . A1 A2 . A1 E2 G2'), lead: bar('E4 - - - - - D4 - C4 - D4 - E4 - - -'), drums: I_DRUMS },
    I2: { bass: bar('F1 . F1 F2 . F1 E2 . G1 . G1 G2 . G1 D2 E2'), lead: bar('F4 - - - E4 - D4 - D4 - - - B3 - - -'), drums: I_DRUMS },
    I3: { bass: bar('F1 . F1 F2 . F1 E2 . E1 . E1 E2 . E1 G#1 B1'), lead: bar('C4 - D4 - E4 - - - B3 - - - G#3 - - -'), drums: bar('k . h . s . h . k . h k s s s s') },
  },
  order: ['I1', 'I2', 'I1', 'I3'],
};

// ---------- Game over ----------
const GAMEOVER = {
  bpm: 66,
  sections: {
    G1: { pad: bar('E3 - - - - - - - - - - - - - - -'), bass: bar('E2 - - - - - - - - - - - - - - -'), lead: bar('B4 - - - A4 - - - G4 - - - F#4 - - -') },
    G2: { pad: bar('C3 - - - - - - - - - - - - - - -'), bass: bar('C2 - - - - - - - - - - - - - - -'), lead: bar('E4 - - - - - - - D#4 - - - - - - -') },
  },
  order: ['G1', 'G2'],
};

// ---------- Ending ----------
const E_DRUMS = bar('k . h . s . h . k . h . s . h h');
const ENDING = {
  bpm: 126,
  sections: {
    E1: { bass: bar('E2 . E2 . B1 . E2 . A1 . A1 . B1 . B1 .'), power: bar('E3 - - - - - - - A2 - - - B2 - - -'), lead: bar('G#4 - - - B4 - - - C#5 - - - B4 - - -'), drums: E_DRUMS },
    E2: { bass: bar('C#2 . C#2 . G#1 . C#2 . A1 . A1 . B1 . B1 .'), power: bar('C#3 - - - - - - - A2 - - - B2 - - -'), lead: bar('E5 - - - D#5 - C#5 - B4 - - - G#4 - - -'), drums: E_DRUMS },
    E3: { bass: bar('A1 . A1 . E2 . A1 . B1 . B1 . B1 . B1 .'), power: bar('A2 - - - - - - - B2 - - - - - - -'), lead: bar('C#5 - B4 - A4 - G#4 - F#4 - - - D#5 - - -'), drums: bar('k . h . s . h . k . h . s s c .') },
  },
  order: ['E1', 'E2', 'E1', 'E3'],
};


// ---------- E1M8 boss: "Argent Fury" ----------
// Original track in the modern-Doom spirit: drop-tuned syncopated chugs,
// a pulsing synth arpeggio over the top and a soaring lead.
const F_CHUG = bar('C1 C1 . C1 . . C1 . C1 . . C1 . C1 C#1 .');
const F_CHUG2 = bar('C1 C1 . C1 . . C1 . D#1 . . D#1 . D1 C#1 .');
const F_PWR = bar('C2 . . C2 . . C2 . C2 . . C2 . C2 C#2 .');
const F_PWR2 = bar('C2 . . C2 . . C2 . D#2 . . D#2 . D2 C#2 .');
const F_DRUM = bar('k k . k s . k . k k . k s . k s');
const F_DRUM2 = bar('k k . k s . k . k k . k s s c .');
const F_ARP = bar('C4 G4 C5 G4 D#5 G4 C5 G4 C4 G4 C5 G4 D5 G4 C5 G4');
const F_ARP2 = bar('G#3 D#4 G#4 D#4 C5 D#4 G#4 D#4 A#3 F4 A#4 F4 D5 F4 A#4 F4');
const BOSS = {
  bpm: 150,
  sections: {
    F0: { arp: F_ARP },
    F1: { arp: F_ARP, drums: bar('k . . . k . . . k . . . k k k k') },
    F2: { bass: F_CHUG, power: F_PWR, drums: F_DRUM },
    F3: { bass: F_CHUG2, power: F_PWR2, drums: F_DRUM2 },
    F4: { bass: F_CHUG, power: F_PWR, drums: F_DRUM, arp: F_ARP },
    F5: { bass: F_CHUG2, power: F_PWR2, drums: F_DRUM2, arp: F_ARP2 },
    F6: { bass: F_CHUG, power: F_PWR, drums: F_DRUM, lead: bar('G4 - - - - - - - G#4 - - - G4 - F4 -') },
    F7: { bass: F_CHUG2, power: F_PWR2, drums: F_DRUM2, lead: bar('D#4 - - - - - - - F4 - - - D4 - - -') },
    F8: { bass: F_CHUG, power: F_PWR, drums: F_DRUM, arp: F_ARP, lead: bar('C5 - - - - - D#5 - D5 - C5 - A#4 - C5 -') },
    F9: { bass: F_CHUG2, power: F_PWR2, drums: F_DRUM2, arp: F_ARP2, lead: bar('G5 - - - - - - - F5 - D#5 - D5 - - -') },
    FB: { power: bar('C2 - - - - - - - . . . . . . . .'), bass: bar('C1 - - - - - - - . . . . . . . .'), drums: bar('c . . . . . . . k . k . k k k k') },
  },
  order: ['F0', 'F1', 'F2', 'F3', 'F2', 'F3', 'F4', 'F5', 'F6', 'F7', 'F8', 'F9', 'F8', 'F9', 'FB', 'F2', 'F3', 'F4', 'F5'],
};

export const SONGS = Object.freeze({
  title: TITLE,
  map: MAP,
  tech: TECH,
  nukage: NUKAGE,
  hell: HELL,
  intermission: INTERMISSION,
  gameover: GAMEOVER,
  ending: ENDING,
  boss: BOSS,
});
