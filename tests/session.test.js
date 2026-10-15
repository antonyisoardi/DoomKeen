import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createSession, addScore, applyPickup, completeLevel, hasAllParts, ITEMS } from '../src/game/session.js';
import { RULES } from '../src/core/constants.js';
import { validateSave } from '../src/core/save.js';

const NO_KEYS = { red: false, blue: false, yellow: false };

test('new session starts with Keen 1 defaults', () => {
  const s = createSession();
  assert.equal(s.lives, RULES.startLives);
  assert.equal(s.ammo, RULES.startAmmo);
  assert.equal(s.hasPogo, false);
  assert.deepEqual(s.parts, []);
});

test('extra life every 20,000 points, including multiple thresholds at once', () => {
  const s = createSession();
  const one = addScore(s, 19999);
  assert.equal(one.session.lives, s.lives);
  const two = addScore(one.session, 1);
  assert.equal(two.session.lives, s.lives + 1);
  assert.deepEqual(two.events, ['oneUp']);
  const big = addScore(s, 45000);
  assert.equal(big.session.lives, s.lives + 2);
  assert.equal(big.session.nextExtraLife, 60000);
});

test('pickups apply points, ammo, keys, pogo, lives and parts', () => {
  const s = createSession();
  assert.equal(applyPickup(s, NO_KEYS, 'medikit').session.score, 1000);
  assert.equal(applyPickup(s, NO_KEYS, 'clip').session.ammo, s.ammo + RULES.clipAmmo);
  assert.equal(applyPickup(s, NO_KEYS, 'soulsphere').session.lives, s.lives + 1);
  assert.equal(applyPickup(s, NO_KEYS, 'keyBlue').keys.blue, true);
  const pogo = applyPickup(s, NO_KEYS, 'pogo');
  assert.equal(pogo.session.hasPogo, true);
  assert.ok(pogo.message.length > 0);
  const part = applyPickup(s, NO_KEYS, 'part3');
  assert.deepEqual(part.session.parts, [3]);
  assert.deepEqual(applyPickup(part.session, NO_KEYS, 'part3').session.parts, [3], 'no duplicates');
  assert.throws(() => applyPickup(s, NO_KEYS, 'bfg9000'), /Unknown item/);
  assert.equal(s.score, 0, 'original session unchanged');
});

test('every item kind has a sound', () => {
  Object.entries(ITEMS).forEach(([kind, item]) => assert.ok(item.sound, kind));
});

test('level completion and the four parts', () => {
  const s = completeLevel(completeLevel(createSession(), 'e1m1'), 'e1m1');
  assert.deepEqual(s.completed, ['e1m1']);
  assert.equal(hasAllParts(s), false);
  assert.equal(hasAllParts({ ...s, parts: [1, 2, 3, 4] }), true);
});

test('save validation accepts good data and rejects tampering', () => {
  const session = { ...createSession(), completed: ['e1m1'], parts: [2, 2, 1] };
  const ok = validateSave({ session, mapPos: { x: 10, y: 20 } });
  assert.deepEqual(ok.session.parts, [1, 2]);
  assert.deepEqual(ok.mapPos, { x: 10, y: 20 });
  assert.equal(validateSave({ session: { ...session, lives: -3 } }), null);
  assert.equal(validateSave({ session: { ...session, completed: ['../../etc'] } }), null);
  assert.equal(validateSave({ session: { ...session, parts: [9] } }), null);
  assert.equal(validateSave('nope'), null);
  assert.equal(validateSave({ session: { ...session, score: 1e300, nextExtraLife: 1 } }), null, 'absurd score');
  assert.equal(validateSave({ session: { ...session, score: 5e8, nextExtraLife: 1 } }), null, 'would loop for ages');
  assert.equal(validateSave({ session: { ...session, ammo: 1e6 } }), null);
  assert.equal(validateSave({ session, mapPos: { x: 'a' } }).mapPos, null);
});
