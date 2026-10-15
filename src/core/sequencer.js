// Pure song compiler: turns the text tracker format in songs.js into a flat
// list of timed note events. No Web Audio here, so it's unit-testable.

export const STEPS_PER_BAR = 16;
const NOTE = /^([A-G])(#?)(\d)$/;
const SEMITONES = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
export const DRUMS = Object.freeze({ k: 'kick', s: 'snare', h: 'hat', c: 'crash' });
export const INSTRUMENTS = Object.freeze(['bass', 'power', 'lead', 'arp', 'pad', 'drums']);

export function noteToFreq(token) {
  const m = NOTE.exec(token);
  if (!m) throw new Error(`Bad note "${token}"`);
  const midi = 12 * (Number(m[3]) + 1) + SEMITONES[m[1]] + (m[2] ? 1 : 0);
  return 440 * 2 ** ((midi - 69) / 12);
}

export const instrumentFor = (channel) => channel.replace(/\d+$/, '');

function tokensFor(section, channel, sectionName) {
  const text = section[channel];
  if (!text) return Array(STEPS_PER_BAR).fill('.');
  const tokens = text.trim().split(/\s+/);
  if (tokens.length !== STEPS_PER_BAR) {
    throw new Error(`Section ${sectionName}/${channel} has ${tokens.length} steps, expected ${STEPS_PER_BAR}`);
  }
  return tokens;
}

// Returns { stepDur, length, steps: Array<Array<event>> } where an event is
// { channel, instrument, freq, steps } for notes or { channel, instrument: 'drums', drum } for hits.
export function compileSong(song) {
  if (!song || !song.bpm || !Array.isArray(song.order) || !song.sections) throw new Error('Invalid song');
  const sections = song.order.map((name) => {
    const sec = song.sections[name];
    if (!sec) throw new Error(`Song order references missing section "${name}"`);
    return [name, sec];
  });
  const channels = [...new Set(sections.flatMap(([, sec]) => Object.keys(sec)))];
  const length = sections.length * STEPS_PER_BAR;
  const steps = Array.from({ length }, () => []);

  channels.forEach((channel) => {
    const instrument = instrumentFor(channel);
    if (!INSTRUMENTS.includes(instrument)) throw new Error(`Unknown instrument for channel "${channel}"`);
    const tokens = sections.flatMap(([name, sec]) => tokensFor(sec, channel, name));
    tokens.forEach((tok, i) => {
      if (tok === '.' || tok === '-') return;
      if (instrument === 'drums') {
        if (!DRUMS[tok]) throw new Error(`Bad drum "${tok}" on ${channel}`);
        steps[i].push({ channel, instrument, drum: DRUMS[tok] });
        return;
      }
      let hold = 1;
      while (i + hold < tokens.length && tokens[i + hold] === '-') hold++;
      steps[i].push({ channel, instrument, freq: noteToFreq(tok), steps: hold });
    });
  });

  return { stepDur: 60 / song.bpm / 4, length, steps };
}
