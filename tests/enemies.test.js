import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnEnemy, updateEnemy, damageEnemy, stunEnemy, isHarmful, ENEMY_TYPES } from '../src/game/enemies.js';
import { createPlayer } from '../src/game/player.js';
import { STEP } from '../src/core/constants.js';
import { levelFrom } from './helpers.js';

const rand = () => 0.3;
// Floor with a ledge drop on the right at column 9.
const LEDGE = levelFrom([
  '################',
  '#..............#',
  '#..............#',
  '#@.............#',
  '#########......#',
  '################',
]);

function tick(e, level, player, n = 1) {
  let enemy = e;
  const spawns = [];
  const events = [];
  for (let i = 0; i < n; i++) {
    const r = updateEnemy(enemy, { level, player, dt: STEP, rand });
    enemy = r.enemy;
    spawns.push(...r.spawns);
    events.push(...r.events);
  }
  return { enemy, spawns, events };
}

test('spawnEnemy places feet on the tile bottom and rejects unknown kinds', () => {
  const z = spawnEnemy('zombie', 4, 3, rand);
  assert.equal(z.y + z.h, 4 * 16);
  assert.equal(z.hp, ENEMY_TYPES.zombie.hp);
  assert.throws(() => spawnEnemy('cyberdemon', 1, 1), /Unknown enemy/);
});

test('walkers turn around at ledges instead of falling', () => {
  const player = { ...createPlayer(1, 3), x: 16 };
  let z = { ...spawnEnemy('zombie', 7, 3, rand), facing: 1, timer: 99 };
  z = tick(z, LEDGE, player, 120).enemy;
  assert.ok(z.x + z.w <= 9 * 16 + 1, `zombie stayed on the ledge (x=${z.x})`);
  assert.equal(z.y + z.h, 4 * 16, 'still standing on the floor');
});

test('imps throw fireballs at a visible player', () => {
  const player = { ...createPlayer(2, 3) };
  const imp = { ...spawnEnemy('imp', 6, 3, rand), attack: 0, facing: -1 };
  const r = tick(imp, LEDGE, player, 60);
  assert.ok(r.spawns.some((s) => s.kind === 'fireball' && s.vx < 0), 'fireball heading left');
  assert.ok(r.events.includes('fireball'));
});

test('pinky roars then charges when it sees the player', () => {
  const player = createPlayer(2, 3);
  const pinky = { ...spawnEnemy('pinky', 7, 3, rand), attack: 0 };
  const roared = tick(pinky, LEDGE, player, 2);
  assert.ok(roared.events.includes('roar'));
  const charging = tick(roared.enemy, LEDGE, player, 30).enemy;
  assert.equal(charging.state, 'charge');
  assert.ok(Math.abs(charging.vx) > 100);
});

test('damage, death, stun and harmfulness', () => {
  const imp = spawnEnemy('imp', 3, 3, rand);
  const hurt = damageEnemy(imp);
  assert.equal(hurt.killed, false);
  assert.ok(hurt.enemy.flash > 0);
  const dead = damageEnemy(hurt.enemy);
  assert.equal(dead.killed, true);
  assert.equal(isHarmful(dead.enemy), false);
  assert.equal(isHarmful(imp), true);
  const zombie = spawnEnemy('zombie', 3, 3, rand);
  assert.equal(isHarmful(zombie), false, 'zombiemen only push');
  assert.equal(stunEnemy(zombie).state, 'stunned');
});

test('lost souls bounce off walls', () => {
  const player = { ...createPlayer(1, 3), dead: true };
  let soul = { ...spawnEnemy('lostSoul', 13, 2, rand), vx: 50, vy: 0, timer: 99 };
  soul = tick(soul, LEDGE, player, 40).enemy;
  assert.ok(soul.vx < 0, 'reversed after hitting the right wall');
});
