// Persistent run state (score, lives, ammo, pogo, parts) and pickup rules.
import { RULES } from '../core/constants.js';

export function createSession() {
  return Object.freeze({
    score: 0,
    lives: RULES.startLives,
    ammo: RULES.startAmmo,
    hasPogo: false,
    parts: Object.freeze([]),
    completed: Object.freeze([]),
    nextExtraLife: RULES.extraLifeEvery,
  });
}

export const PART_NAMES = Object.freeze({
  1: 'FUSION BATTERY',
  2: 'NAV JOYSTICK',
  3: 'PLASMA MANIFOLD',
  4: 'ARGENT FUEL CELL',
});

const partMessage = (n) => [
  `YOU FOUND THE ${PART_NAMES[n]}!`,
  '',
  'ONE OF THE FOUR PARTS THE',
  'DEMONS STOLE FROM YOUR',
  'MEGAROCKET.',
];

export const ITEMS = Object.freeze({
  armorBonus: { points: 100, sound: 'pickup' },
  healthBonus: { points: 200, sound: 'pickup' },
  stimpack: { points: 500, sound: 'pickup' },
  medikit: { points: 1000, sound: 'bigPickup' },
  clip: { ammo: RULES.clipAmmo, sound: 'ammo' },
  soulsphere: { life: 1, sound: 'oneUp' },
  keyRed: { key: 'red', sound: 'key' },
  keyBlue: { key: 'blue', sound: 'key' },
  keyYellow: { key: 'yellow', sound: 'key' },
  pogo: {
    pogo: true,
    sound: 'bigPickup',
    message: [
      'YOU FOUND THE ARGENT POGO STICK!',
      '',
      'PRESS X (OR ALT) TO HOP ON/OFF.',
      'HOLD Z WHILE BOUNCING TO',
      'SPRING EXTRA HIGH.',
    ],
  },
  part1: { part: 1, points: 2500, sound: 'bigPickup', message: partMessage(1) },
  part2: { part: 2, points: 2500, sound: 'bigPickup', message: partMessage(2) },
  part3: { part: 3, points: 2500, sound: 'bigPickup', message: partMessage(3) },
  part4: { part: 4, points: 2500, sound: 'bigPickup', message: partMessage(4) },
});

export function addScore(session, points) {
  let { score, lives, nextExtraLife } = session;
  const events = [];
  score += points;
  while (score >= nextExtraLife) {
    lives += 1;
    nextExtraLife += RULES.extraLifeEvery;
    events.push('oneUp');
  }
  return { session: Object.freeze({ ...session, score, lives, nextExtraLife }), events };
}

export function applyPickup(session, keys, kind) {
  const item = ITEMS[kind];
  if (!item) throw new Error(`Unknown item kind: ${kind}`);
  let next = session;
  const events = [item.sound];
  if (item.points) {
    const scored = addScore(next, item.points);
    next = scored.session;
    events.push(...scored.events);
  }
  if (item.ammo) next = { ...next, ammo: next.ammo + item.ammo };
  if (item.life) next = { ...next, lives: next.lives + item.life };
  if (item.pogo) next = { ...next, hasPogo: true };
  if (item.part && !next.parts.includes(item.part)) {
    next = { ...next, parts: Object.freeze([...next.parts, item.part].sort()) };
  }
  const nextKeys = item.key ? Object.freeze({ ...keys, [item.key]: true }) : keys;
  return { session: Object.freeze(next), keys: nextKeys, events, message: item.message || null };
}

export function completeLevel(session, levelId) {
  if (session.completed.includes(levelId)) return session;
  return Object.freeze({ ...session, completed: Object.freeze([...session.completed, levelId]) });
}

export function hasAllParts(session) {
  return session.parts.length >= RULES.partsNeeded;
}
