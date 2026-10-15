// Integration tests: run the level simulation with scripted input.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createPlay, updatePlay } from '../src/game/play.js';
import { createSession } from '../src/game/session.js';
import { makeInput } from '../src/core/input.js';
import { STEP, TILE, RULES } from '../src/core/constants.js';
import { tileAt } from '../src/game/level.js';
import { levelFrom } from './helpers.js';

const rand = () => 0.5;

function simulate(state, frames, inputFor = () => makeInput()) {
  let s = state;
  const events = [];
  let outcome = null;
  for (let i = 0; i < frames && !outcome; i++) {
    const r = updatePlay(s, inputFor(i, s), STEP, rand);
    s = r.state;
    events.push(...r.events);
    outcome = r.outcome;
  }
  return { state: s, events, outcome };
}

const walkRight = () => makeInput({ held: ['right'] });

test('walking into the exit completes the level', () => {
  const level = levelFrom(['##########', '#.......E#', '#@......E#', '##########']);
  const r = simulate(createPlay(level, createSession(), rand), 400, walkRight);
  assert.equal(r.outcome, 'complete');
  assert.ok(r.events.includes('exit'));
});

test('keycard opens the matching door; without it the door blocks', () => {
  const map = ['###########', '#......R.E#', '#@.r...R.E#', '###########'];
  const r = simulate(createPlay(levelFrom(map), createSession(), rand), 600, walkRight);
  assert.equal(r.outcome, 'complete');
  assert.ok(r.events.includes('key') && r.events.includes('door'));

  const locked = ['###########', '#......R.E#', '#@.....R.E#', '###########'];
  const blocked = simulate(createPlay(levelFrom(locked), createSession(), rand), 300, walkRight);
  assert.equal(blocked.outcome, null);
  assert.equal(tileAt(blocked.state.level, 7, 2), 'R');
});

test('falling into nukage kills, then the death animation ends the attempt', () => {
  const level = levelFrom(['#########', '#.......#', '#@......#', '###~~####', '#########']);
  const r = simulate(createPlay(level, createSession(), rand), 600, walkRight);
  assert.ok(r.events.includes('death'));
  assert.equal(r.outcome, 'died');
});

test('touching an imp kills; stomping a zombieman stuns it', () => {
  const impLevel = levelFrom(['##########', '#........#', '#@...i...#', '##########']);
  const start = createPlay(impLevel, createSession(), rand);
  const pinned = { ...start, enemies: start.enemies.map((e) => ({ ...e, attack: 99 })) };
  const dead = simulate(pinned, 300, walkRight);
  assert.ok(dead.events.includes('death'));

  const zLevel = levelFrom(['##########', '#........#', '#........#', '#@.......#', '##########']);
  const zs = createPlay(zLevel, createSession(), rand);
  const zombie = { ...zs.enemies[0] };
  const withZombie = {
    ...zs,
    player: { ...zs.player, x: 60, y: 10, vy: 100 },
    enemies: [{ ...(zombie.kind ? zombie : {}), kind: 'zombie', w: 12, h: 22, hp: 1, x: 58, y: 64 - 22, vx: 0, vy: 0, facing: 1, state: 'look', timer: 9, attack: 9, anim: 0, flash: 0, alive: true, onGround: true }],
  };
  const stomped = simulate(withZombie, 40);
  assert.ok(stomped.events.includes('stomp'));
  assert.equal(stomped.state.enemies[0].state, 'stunned');
  assert.ok(!stomped.events.includes('death'));
});

test('shooting kills a demon, scores points and uses ammo', () => {
  const level = levelFrom(['##########', '#........#', '#@.....i.#', '##########']);
  const start = createPlay(level, createSession(), rand);
  const calm = { ...start, enemies: start.enemies.map((e) => ({ ...e, attack: 99, facing: 1 })) };
  let fired = 0;
  const r = simulate(calm, 120, (i) => {
    const fire = i % 20 === 0 && fired < 2;
    if (fire) fired++;
    return makeInput({ pressed: fire ? ['fire'] : [] });
  });
  assert.equal(r.state.session.ammo, RULES.startAmmo - 2);
  assert.equal(r.state.enemies[0].alive, false);
  assert.equal(r.state.stats.kills, 1);
  assert.equal(r.state.session.score, 200);
});

test('picking up the pogo stick pauses on a dialog until dismissed', () => {
  const level = levelFrom(['########', '#......#', '#@.g...#', '########']);
  const r = simulate(createPlay(level, createSession(), rand), 120, walkRight);
  assert.equal(r.state.phase, 'dialog');
  assert.ok(r.state.session.hasPogo);
  const resumed = updatePlay(r.state, makeInput({ pressed: ['jump'] }), STEP, rand);
  assert.equal(resumed.state.phase, 'play');
});

test('the boss gate opens once every Baron is dead', () => {
  const level = levelFrom(['##########', '#.....X.E#', '#@..V.X.E#', '##########'], { theme: 'hell' });
  const start = createPlay(level, createSession(), rand);
  const r = simulate({ ...start, enemies: start.enemies.map((e) => ({ ...e, alive: false, hp: 0 })) }, 2);
  assert.equal(tileAt(r.state.level, 6, 1), '.');
  assert.ok(r.events.includes('door'));
});

test('camera stays inside level bounds', () => {
  const level = levelFrom(['#'.repeat(60), `#@${'.'.repeat(57)}#`, `#${'.'.repeat(58)}#`, '#'.repeat(60)]);
  const r = simulate(createPlay(level, createSession(), rand), 600, walkRight);
  assert.ok(r.state.camera.x >= 0 && r.state.camera.x <= 60 * TILE - 320);
  assert.equal(r.state.camera.y, 0);
});
