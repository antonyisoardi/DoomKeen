import { test } from 'node:test';
import assert from 'node:assert/strict';
import { heroFrames } from '../src/gfx/data/hero.js';
import { enemyFrames, FIREBALL, BARONBALL, PLASMA } from '../src/gfx/data/enemies.js';
import { itemFrames } from '../src/gfx/data/items.js';
import { padTo, remap } from '../src/gfx/data/util.js';
import { GLYPH_BITS } from '../src/core/font.js';

const VALID = /^[.0-9A-F]+$/;

function assertRect(name, rows) {
  assert.ok(rows.length > 0, `${name} has no rows`);
  const w = rows[0].length;
  rows.forEach((row, i) => {
    assert.equal(row.length, w, `${name} row ${i} is ${row.length} wide, expected ${w}`);
    assert.match(row, VALID, `${name} row ${i} has invalid characters`);
  });
}

test('hero frames are 16x24 with valid EGA characters', () => {
  const frames = heroFrames();
  assert.ok(frames.stand_stand && frames.shoot_pogo && frames.dead);
  Object.entries(frames).forEach(([name, rows]) => {
    assertRect(name, rows);
    assert.equal(rows.length, 24, `${name} height`);
    assert.equal(rows[0].length, 16, `${name} width`);
  });
});

test('enemy frames are rectangular and sized as expected', () => {
  const sizes = { zombie: [16, 24], imp: [16, 24], pinky: [24, 20], lostSoul: [16, 16], baron: [24, 32] };
  Object.entries(enemyFrames()).forEach(([name, rows]) => {
    assertRect(name, rows);
    const [w, h] = sizes[name.split('.')[0]];
    assert.equal(rows[0].length, w, `${name} width`);
    assert.equal(rows.length, h, `${name} height`);
  });
  [FIREBALL, BARONBALL, PLASMA].forEach((rows, i) => assertRect(`projectile${i}`, rows));
});

test('items are padded to 16x16', () => {
  Object.entries(itemFrames()).forEach(([name, rows]) => {
    assertRect(name, rows);
    assert.equal(rows.length, 16, name);
    assert.equal(rows[0].length, 16, name);
  });
});

test('padTo centres and bottom-aligns, and rejects oversize sprites', () => {
  const out = padTo(['AB'], 4, 3, 1);
  assert.deepEqual(out, ['....', '.AB.', '....']);
  assert.throws(() => padTo(['ABCDE'], 4, 4), /too big/);
});

test('remap swaps colours without touching others', () => {
  assert.deepEqual(remap(['12.3'], { 1: '9', 3: 'F' }), ['92.F']);
});

test('font glyphs are 5x7 bitmaps', () => {
  Object.entries(GLYPH_BITS).forEach(([ch, rows]) => {
    assert.equal(rows.length, 7, `glyph ${ch}`);
    rows.forEach((r) => assert.match(r, /^[01]{5}$/, `glyph ${ch}`));
  });
});
