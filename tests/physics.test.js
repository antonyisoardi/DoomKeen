import { test } from 'node:test';
import assert from 'node:assert/strict';
import { moveBody, approach, overlaps, hasLineOfSight } from '../src/game/physics.js';
import { levelFrom } from './helpers.js';

const ROOM = levelFrom([
  '##########',
  '#........#',
  '#........#',
  '#...--...#',
  '#........#',
  '#@.......#',
  '##########',
]);

const body = (x, y, vx = 0, vy = 0) => ({ x, y, w: 10, h: 10, vx, vy });

test('lands on the floor and reports onGround', () => {
  const m = moveBody(ROOM, body(20, 84, 0, 300), 1 / 60);
  assert.equal(m.y, 96 - 10);
  assert.equal(m.vy, 0);
  assert.ok(m.onGround);
});

test('stops against walls and reports blockers', () => {
  const m = moveBody(ROOM, body(130, 40, 600, 0), 1 / 30);
  assert.equal(m.x, 144 - 10);
  assert.ok(m.hitRight);
  assert.deepEqual(m.blockers, [{ tx: 9, ty: 2 }, { tx: 9, ty: 3 }]);
});

test('bumps the ceiling', () => {
  const m = moveBody(ROOM, body(20, 18, 0, -300), 1 / 60);
  assert.equal(m.y, 16);
  assert.ok(m.hitCeiling);
});

test('one-way platforms catch falling bodies only', () => {
  const falling = moveBody(ROOM, body(66, 38, 0, 200), 1 / 60);
  assert.ok(falling.onGround, 'lands on top of the grate');
  assert.equal(falling.y, 48 - 10);
  const rising = moveBody(ROOM, body(66, 50, 0, -300), 1 / 60);
  assert.ok(!rising.hitCeiling, 'passes up through the grate');
  assert.ok(rising.y < 50);
});

test('moveBody does not mutate its input', () => {
  const b = Object.freeze(body(20, 80, 50, 300));
  moveBody(ROOM, b, 1 / 60);
  assert.equal(b.x, 20);
});

test('approach, overlaps and line of sight helpers', () => {
  assert.equal(approach(0, 10, 3), 3);
  assert.equal(approach(9, 10, 3), 10);
  assert.equal(approach(-5, 0, 2), -3);
  assert.ok(overlaps({ x: 0, y: 0, w: 5, h: 5 }, { x: 4, y: 4, w: 5, h: 5 }));
  assert.ok(!overlaps({ x: 0, y: 0, w: 5, h: 5 }, { x: 5, y: 0, w: 5, h: 5 }));
  assert.ok(hasLineOfSight(ROOM, 24, 40, 120, 40));
  assert.ok(!hasLineOfSight(ROOM, 24, 40, 200, 40), 'wall blocks sight');
});
