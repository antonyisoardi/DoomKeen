import { test } from 'node:test';
import assert from 'node:assert/strict';
import { SONGS } from '../src/core/songs.js';
import { compileSong, noteToFreq, STEPS_PER_BAR } from '../src/core/sequencer.js';
import { musicFor, createApp } from '../src/app.js';
import { createPlay } from '../src/game/play.js';
import { parseLevel } from '../src/game/level.js';
import { createSession } from '../src/game/session.js';
import { LEVELS } from '../src/levels/index.js';

test('note names convert to equal-tempered frequencies', () => {
  assert.equal(noteToFreq('A4'), 440);
  assert.ok(Math.abs(noteToFreq('E1') - 41.2) < 0.01);
  assert.ok(Math.abs(noteToFreq('C#5') - 554.37) < 0.01);
  assert.throws(() => noteToFreq('H2'), /Bad note/);
});

Object.entries(SONGS).forEach(([id, song]) => {
  test(`song "${id}" compiles: every bar is 16 steps with valid notes and drums`, () => {
    const c = compileSong(song);
    assert.equal(c.length, song.order.length * STEPS_PER_BAR);
    const events = c.steps.flat();
    assert.ok(events.length > song.order.length * 4, 'song is not near-silent');
    events.forEach((e) => {
      if (e.instrument === 'drums') assert.ok(e.drum);
      else assert.ok(e.freq > 20 && e.freq < 5000 && e.steps >= 1, `${id} ${e.channel}`);
    });
  });
});

test('holds extend a note until the next token', () => {
  const c = compileSong({ bpm: 120, sections: { A: { lead: 'E4 - - . G4 - . . . . . . . . . .' } }, order: ['A'] });
  assert.equal(c.steps[0][0].steps, 3);
  assert.equal(c.steps[4][0].steps, 2);
  assert.equal(c.stepDur, 0.125);
});

test('compiler rejects malformed songs', () => {
  assert.throws(() => compileSong({ bpm: 100, sections: { A: { lead: 'E4' } }, order: ['A'] }), /expected 16/);
  assert.throws(() => compileSong({ bpm: 100, sections: {}, order: ['A'] }), /missing section/);
  assert.throws(() => compileSong({ bpm: 100, sections: { A: { kazoo: '. . . . . . . . . . . . . . . .' } }, order: ['A'] }), /Unknown instrument/);
});

test('each screen and level theme gets a suitable track', () => {
  const app = createApp(null);
  assert.equal(musicFor(app), 'title');
  assert.equal(musicFor({ ...app, screen: 'map' }), 'map');
  const level = (id) => ({ ...app, screen: 'level', play: createPlay(parseLevel(LEVELS[id]), createSession()) });
  assert.equal(musicFor(level('e1m1')), 'tech');
  assert.equal(musicFor(level('e1m2')), 'nukage');
  assert.equal(musicFor(level('e1m8')), 'boss');
  ['title', 'map', 'tech', 'nukage', 'hell', 'boss', 'intermission', 'gameover', 'ending'].forEach((t) => assert.ok(SONGS[t], t));
});
