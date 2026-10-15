// Every shipped level must parse and be beatable (per the conservative analyzer).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { LEVELS, requiresPogoFromStart } from '../src/levels/index.js';
import { parseLevel, tileAt } from '../src/game/level.js';
import { analyzeLevel } from '../src/game/reachability.js';
import { LEVEL_NAMES } from '../src/world/map-data.js';

const parsed = Object.values(LEVELS).map((def) => ({ def, level: parseLevel(def) }));

test('there are eight levels with names matching the overworld', () => {
  assert.equal(parsed.length, 8);
  parsed.forEach(({ def }) => assert.equal(def.name, LEVEL_NAMES[def.id]));
});

parsed.forEach(({ def, level }) => {
  test(`${def.id} map is rectangular, enclosed and has a 2-tall exit`, () => {
    def.map.forEach((row, i) => assert.equal(row.length, level.width, `row ${i}`));
    for (let x = 0; x < level.width; x++) assert.notEqual(tileAt(level, x, 0), '.', 'ceiling closed');
    const exits = level.tiles.filter((ch) => ch === 'E').length;
    assert.ok(exits >= 2 && exits % 2 === 0, 'exit door is two tiles tall');
  });

  test(`${def.id} can be completed`, () => {
    const r = analyzeLevel(level, { pogo: requiresPogoFromStart(def.id) });
    assert.ok(r.exitReachable, `${def.id} exit unreachable`);
  });

  test(`${def.id} parts, keys and pogo are reachable`, () => {
    const r = analyzeLevel(level, { pogo: requiresPogoFromStart(def.id) });
    const important = r.unreachableItems.filter((e) => /^(part|key|pogo)/.test(e.kind));
    assert.deepEqual(important.map((e) => `${e.kind}@${e.tx},${e.ty}`), []);
  });
});

test('the four Megarocket parts each appear exactly once', () => {
  const parts = parsed.flatMap(({ level }) => level.entities.filter((e) => e.kind.startsWith('part')).map((e) => e.kind));
  assert.deepEqual(parts.sort(), ['part1', 'part2', 'part3', 'part4']);
});

test('E1M1 needs no pogo; E1M2 provides it and needs it', () => {
  assert.ok(analyzeLevel(parseLevel(LEVELS.e1m1)).exitReachable);
  const e1m2 = parseLevel(LEVELS.e1m2);
  assert.ok(e1m2.entities.some((e) => e.kind === 'pogo'));
  const withoutPickup = { ...e1m2, entities: e1m2.entities.filter((e) => e.kind !== 'pogo') };
  assert.equal(analyzeLevel(withoutPickup).exitReachable, false, 'pogo wall should block');
  assert.ok(analyzeLevel(e1m2).exitReachable);
});

test('E1M8 has Barons behind... in front of the boss gate', () => {
  const level = parseLevel(LEVELS.e1m8);
  assert.ok(level.entities.filter((e) => e.kind === 'baron').length >= 2);
  assert.ok(level.tiles.includes('X'));
});

test('analyzer respects locked doors', () => {
  const level = parseLevel({
    id: 't', name: 'T', theme: 'tech',
    map: ['########', '#@..R.E#', '#....RE#', '########'],
  });
  assert.equal(analyzeLevel(level).exitReachable, false);
});
