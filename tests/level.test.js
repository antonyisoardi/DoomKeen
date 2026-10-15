import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseLevel, tileAt, setTiles, connectedTiles, findTiles } from '../src/game/level.js';
import { levelFrom } from './helpers.js';

const MAP = [
  '#######',
  '#..r..#',
  '#@.RRz#',
  '#######',
];

test('parses tiles, spawn and entities', () => {
  const level = levelFrom(MAP);
  assert.equal(level.width, 7);
  assert.equal(level.height, 4);
  assert.deepEqual(level.spawn, { tx: 1, ty: 2 });
  assert.deepEqual(level.entities.map((e) => [e.kind, e.tx, e.ty]), [['keyRed', 3, 1], ['zombie', 5, 2]]);
  assert.equal(tileAt(level, 3, 1), '.', 'entity cells become empty');
  assert.equal(tileAt(level, 3, 2), 'R');
});

test('out-of-bounds: solid sides and top, open below', () => {
  const level = levelFrom(MAP);
  assert.equal(tileAt(level, -1, 1), '#');
  assert.equal(tileAt(level, 99, 1), '#');
  assert.equal(tileAt(level, 2, -1), '#');
  assert.equal(tileAt(level, 2, 99), '.');
});

test('short rows are padded with solid wall', () => {
  const level = levelFrom(['#####', '#@..', '#...#', '#####']);
  assert.equal(tileAt(level, 4, 1), '#');
});

test('rejects bad definitions', () => {
  assert.throws(() => levelFrom(['####', '#..#', '#..#', '####']), /no player start/);
  assert.throws(() => levelFrom(['####', '#@?#', '#..#', '####']), /unknown character/);
  assert.throws(() => levelFrom(['####', '#@@#', '#..#', '####']), /more than one start/);
  assert.throws(() => parseLevel({ id: 'x', name: 'X', theme: 'space', map: MAP }), /unknown theme/);
  assert.throws(() => parseLevel(null), /must be an object/);
});

test('setTiles returns a new level and leaves the original untouched', () => {
  const level = levelFrom(MAP);
  const opened = setTiles(level, connectedTiles(level, 3, 2), '.');
  assert.equal(tileAt(opened, 3, 2), '.');
  assert.equal(tileAt(opened, 4, 2), '.');
  assert.equal(tileAt(level, 3, 2), 'R', 'original unchanged');
  assert.ok(Object.isFrozen(opened.tiles));
});

test('findTiles locates matching cells', () => {
  const level = levelFrom(MAP);
  assert.deepEqual(findTiles(level, (ch) => ch === 'R').map(({ tx, ty }) => [tx, ty]), [[3, 2], [4, 2]]);
});
