import { test } from 'node:test';
import assert from 'node:assert/strict';
import { WORLD_MAP, barrierLevel } from '../src/world/map-data.js';
import { createMap, updateMap, isBlocked, mapTileAt } from '../src/world/map.js';
import { createSession } from '../src/game/session.js';
import { makeInput } from '../src/core/input.js';
import { STEP, TILE } from '../src/core/constants.js';

// Flood fill of walkable map tiles from the start, given completed levels.
function reachableMarkers(completed) {
  const start = createMap();
  const sx = Math.floor((start.x + 5) / TILE);
  const sy = Math.floor((start.y + 5) / TILE);
  const seen = new Set([`${sx},${sy}`]);
  const queue = [[sx, sy]];
  const found = new Set();
  while (queue.length) {
    const [x, y] = queue.shift();
    const ch = mapTileAt(x, y);
    if (/[1-8H]/.test(ch)) found.add(ch);
    [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(([dx, dy]) => {
      const key = `${x + dx},${y + dy}`;
      if (seen.has(key) || isBlocked(mapTileAt(x + dx, y + dy), completed)) return;
      seen.add(key);
      queue.push([x + dx, y + dy]);
    });
  }
  return found;
}

test('world map is rectangular with every bunker, the ship and a start', () => {
  WORLD_MAP.forEach((row, i) => assert.equal(row.length, WORLD_MAP[0].length, `row ${i}`));
  const all = WORLD_MAP.join('');
  '12345678H@'.split('').forEach((ch) => assert.ok(all.includes(ch), `missing ${ch}`));
  assert.equal(barrierLevel('A'), 'e1m1');
  assert.equal(barrierLevel('G'), 'e1m7');
});

test('force fields gate progression in order', () => {
  assert.deepEqual([...reachableMarkers([])].sort(), ['1', 'H']);
  assert.deepEqual([...reachableMarkers(['e1m1'])].sort(), ['1', '2', 'H']);
  const hub = reachableMarkers(['e1m1', 'e1m2']);
  ['3', '4', '5'].forEach((m) => assert.ok(hub.has(m), `hub ${m}`));
  assert.ok(!hub.has('6'));
  assert.ok(!reachableMarkers(['e1m1', 'e1m2', 'e1m3', 'e1m4']).has('6'), 'E1M6 needs 3, 4 and 5');
  const six = reachableMarkers(['e1m1', 'e1m2', 'e1m3', 'e1m4', 'e1m5']);
  assert.ok(six.has('6') && !six.has('7'));
  const all = reachableMarkers(['e1m1', 'e1m2', 'e1m3', 'e1m4', 'e1m5', 'e1m6', 'e1m7']);
  assert.ok(all.has('8') && all.has('H'));
});

test('walking onto a bunker and pressing jump enters the level', () => {
  const session = createSession();
  let state = createMap();
  let action = null;
  for (let i = 0; i < 400 && !action; i++) {
    const tx = Math.floor((state.x + 5) / TILE);
    const ty = Math.floor((state.y + 5) / TILE);
    const held = [];
    if (tx < 9) held.push('right');
    if (ty < 7) held.push('down');
    const onMarker = mapTileAt(tx, ty) === '1';
    const r = updateMap(state, makeInput({ held: onMarker ? [] : held, pressed: onMarker ? ['jump'] : [] }), session, STEP);
    state = r.state;
    action = r.action;
  }
  assert.deepEqual(action, { type: 'enter', levelId: 'e1m1' });
});

test('the ship refuses to leave without all four parts', () => {
  const session = createSession();
  const onShip = { ...createMap(), x: 3 * TILE + 3, y: 3 * TILE + 3, onShip: false };
  const r = updateMap(onShip, makeInput(), session, STEP);
  assert.equal(r.action, null);
  assert.ok(r.state.message);
  const ready = updateMap(onShip, makeInput(), { ...session, parts: [1, 2, 3, 4] }, STEP);
  assert.deepEqual(ready.action, { type: 'ship' });
});

test('saved map positions inside rock or off-map fall back to the start', () => {
  const start = createMap();
  assert.deepEqual([createMap({ x: 0, y: 0 }).x, createMap({ x: 0, y: 0 }).y], [start.x, start.y]);
  assert.equal(createMap({ x: -50, y: 9e9 }).x, start.x);
  assert.deepEqual([createMap({ x: 100, y: 100 }).x, createMap({ x: 100, y: 100 }).y], [100, 100]);
});
