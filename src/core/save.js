// Progress persistence. Save data is untrusted input: always validated on load.
import { RULES } from './constants.js';

const KEY = 'commander-doom.save.v1';
const LEVEL_ID = /^e1m[1-8]$/;

const isInt = (v, min = 0, max = 1e9) => Number.isInteger(v) && v >= min && v <= max;
const isNum = (v) => typeof v === 'number' && Number.isFinite(v);

export function validateSave(data) {
  if (!data || typeof data !== 'object') return null;
  const { session, mapPos } = data;
  if (!session || typeof session !== 'object') return null;
  const { score, lives, ammo, hasPogo, parts, completed, nextExtraLife } = session;
  const valid =
    isInt(score) && isInt(lives, 1, 99) && isInt(ammo, 0, 999) && typeof hasPogo === 'boolean' &&
    Array.isArray(parts) && parts.every((p) => isInt(p, 1) && p <= RULES.partsNeeded) &&
    Array.isArray(completed) && completed.every((id) => typeof id === 'string' && LEVEL_ID.test(id)) &&
    isInt(nextExtraLife, 1) && nextExtraLife > score - RULES.extraLifeEvery * 100;
  if (!valid) return null;
  const pos = mapPos && isNum(mapPos.x) && isNum(mapPos.y) ? { x: mapPos.x, y: mapPos.y } : null;
  return {
    session: {
      score, lives, ammo, hasPogo,
      parts: [...new Set(parts)].sort(),
      completed: [...new Set(completed)],
      nextExtraLife,
    },
    mapPos: pos,
  };
}

export function loadSave(storage = globalThis.localStorage) {
  try {
    const raw = storage?.getItem(KEY);
    if (!raw) return null;
    const parsed = validateSave(JSON.parse(raw));
    if (!parsed) console.warn('Ignoring invalid save data.');
    return parsed;
  } catch (err) {
    console.warn('Could not read save data:', err);
    return null;
  }
}

export function writeSave(data, storage = globalThis.localStorage) {
  try {
    storage?.setItem(KEY, JSON.stringify(data));
    return true;
  } catch (err) {
    console.warn('Could not write save data:', err);
    return false;
  }
}

export function clearSave(storage = globalThis.localStorage) {
  try {
    storage?.removeItem(KEY);
  } catch (err) {
    console.warn('Could not clear save data:', err);
  }
}
