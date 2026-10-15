// Level tile legend. Entity characters are pulled out of the grid at parse time.

const DEFS = Object.freeze({
  '.': {},
  '#': { solid: true },
  '=': { solid: true },
  B: { solid: true },
  M: { solid: true },
  '-': { oneWay: true },
  '~': { hazard: true },
  '%': { hazard: true },
  '^': { hazard: true },
  R: { solid: true, door: 'red' },
  U: { solid: true, door: 'blue' },
  Y: { solid: true, door: 'yellow' },
  X: { solid: true, bossGate: true },
  E: { exit: true },
  w: { decor: true },
  L: { decor: true },
  '|': { decor: true },
  T: { decor: true },
});

const EMPTY = Object.freeze({});

export function tileDef(ch) {
  return DEFS[ch] || EMPTY;
}

export function isTileChar(ch) {
  return Object.hasOwn(DEFS, ch);
}

// Pixels from the top of a hazard tile before it starts hurting (liquid surface / spike tips).
export const HAZARD_INSET = 5;

export const ENTITY_CHARS = Object.freeze({
  r: { cat: 'item', kind: 'keyRed' },
  u: { cat: 'item', kind: 'keyBlue' },
  y: { cat: 'item', kind: 'keyYellow' },
  a: { cat: 'item', kind: 'armorBonus' },
  h: { cat: 'item', kind: 'healthBonus' },
  s: { cat: 'item', kind: 'stimpack' },
  m: { cat: 'item', kind: 'medikit' },
  c: { cat: 'item', kind: 'clip' },
  S: { cat: 'item', kind: 'soulsphere' },
  g: { cat: 'item', kind: 'pogo' },
  1: { cat: 'item', kind: 'part1' },
  2: { cat: 'item', kind: 'part2' },
  3: { cat: 'item', kind: 'part3' },
  4: { cat: 'item', kind: 'part4' },
  z: { cat: 'enemy', kind: 'zombie' },
  i: { cat: 'enemy', kind: 'imp' },
  p: { cat: 'enemy', kind: 'pinky' },
  l: { cat: 'enemy', kind: 'lostSoul' },
  V: { cat: 'enemy', kind: 'baron' },
});

export const DOOR_KEYS = Object.freeze({ red: 'keyRed', blue: 'keyBlue', yellow: 'keyYellow' });
