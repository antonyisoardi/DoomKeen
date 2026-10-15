import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createPlayer, updatePlayer, pushPlayer, killPlayer } from '../src/game/player.js';
import { makeInput } from '../src/core/input.js';
import { STEP, TILE, PHYS } from '../src/core/constants.js';
import { JUMP, POGO } from '../src/game/reachability.js';
import { flatRoom } from './helpers.js';

const level = flatRoom();
const ctx = (extra = {}) => ({ level, hasPogo: false, ammo: 5, ...extra });

function settle(p) {
  let s = p;
  for (let i = 0; i < 30; i++) s = updatePlayer(s, makeInput(), ctx(), STEP).player;
  return s;
}

function peakRise(start, { held = [], pressedFirst = [], context = ctx(), frames = 120 } = {}) {
  let p = start;
  let minY = p.y;
  for (let i = 0; i < frames; i++) {
    const input = makeInput({ held, pressed: i === 0 ? pressedFirst : [] });
    p = updatePlayer(p, input, context, STEP).player;
    minY = Math.min(minY, p.y);
  }
  return start.y - minY;
}

test('player spawns standing on the floor', () => {
  const p = settle(createPlayer(level.spawn.tx, level.spawn.ty));
  assert.ok(p.onGround);
  assert.equal(p.y + p.h, 10 * TILE);
});

test('held jump clears the analyzer\'s jump height, a tap jumps much lower', () => {
  const p = settle(createPlayer(3, 9));
  const full = peakRise(p, { held: ['jump'], pressedFirst: ['jump'] });
  const tap = peakRise(p, { pressedFirst: ['jump'] });
  assert.ok(full >= JUMP.rise * TILE + 8, `full jump ${full}px`);
  assert.ok(full <= 6 * TILE, `full jump not absurd: ${full}px`);
  assert.ok(tap < full / 2, `tap ${tap}px vs full ${full}px`);
});

test('pogo with jump held clears the analyzer\'s pogo height', () => {
  const p = settle(createPlayer(3, 9));
  const pogoCtx = ctx({ hasPogo: true });
  const toggled = updatePlayer(p, makeInput({ pressed: ['pogo'] }), pogoCtx, STEP).player;
  assert.ok(toggled.pogo);
  const high = peakRise(toggled, { held: ['jump'], context: pogoCtx, frames: 200 });
  const passive = peakRise(toggled, { context: pogoCtx, frames: 200 });
  assert.ok(high >= POGO.rise * TILE + 8, `pogo jump ${high}px`);
  assert.ok(passive < high, 'holding jump bounces higher');
});

test('pogo cannot be used before it is found', () => {
  const p = settle(createPlayer(3, 9));
  assert.equal(updatePlayer(p, makeInput({ pressed: ['pogo'] }), ctx(), STEP).player.pogo, false);
});

test('running jump covers the analyzer\'s horizontal reach', () => {
  let p = settle(createPlayer(3, 9));
  for (let i = 0; i < 30; i++) p = updatePlayer(p, makeInput({ held: ['right'] }), ctx(), STEP).player;
  const startX = p.x;
  let landed = false;
  for (let i = 0; i < 120 && !landed; i++) {
    const r = updatePlayer(p, makeInput({ held: ['right', 'jump'], pressed: i === 0 ? ['jump'] : [] }), ctx(), STEP);
    landed = i > 2 && r.player.onGround;
    p = r.player;
  }
  assert.ok(p.x - startX >= (JUMP.reach + 0.5) * TILE, `jump distance ${p.x - startX}px`);
});

test('walking accelerates to walk speed and slides to a stop', () => {
  let p = settle(createPlayer(3, 9));
  for (let i = 0; i < 40; i++) p = updatePlayer(p, makeInput({ held: ['right'] }), ctx(), STEP).player;
  assert.equal(p.vx, PHYS.walkSpeed);
  assert.equal(p.facing, 1);
  const next = updatePlayer(p, makeInput(), ctx(), STEP).player;
  assert.ok(next.vx > 0 && next.vx < PHYS.walkSpeed, 'keeps some momentum');
});

test('firing spends ammo via a shot; empty gun clicks', () => {
  const p = settle(createPlayer(3, 9));
  const r = updatePlayer(p, makeInput({ pressed: ['fire'] }), ctx(), STEP);
  assert.ok(r.fired);
  assert.equal(r.fired.vx, PHYS.shotSpeed);
  assert.ok(r.events.includes('shoot'));
  const empty = updatePlayer(p, makeInput({ pressed: ['fire'] }), ctx({ ammo: 0 }), STEP);
  assert.equal(empty.fired, null);
  assert.ok(empty.events.includes('click'));
});

test('push and kill return new player objects', () => {
  const p = settle(createPlayer(3, 9));
  const pushed = pushPlayer(p, -1);
  assert.equal(pushed.vx, -PHYS.pushSpeed);
  assert.ok(pushed.push > 0);
  const dead = killPlayer(p);
  assert.ok(dead.dead && dead.vy < 0);
  assert.equal(p.dead, false, 'original untouched');
});
