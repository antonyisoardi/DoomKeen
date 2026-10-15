// Overworld logic: walk around Phobos, enter bunkers, return to the ship.
import { TILE } from '../core/constants.js';
import { WORLD_MAP, LEVEL_NAMES, levelIdForDigit, barrierLevel } from './map-data.js';
import { hasAllParts } from '../game/session.js';

const SPEED = 72;
const BOX = 10;
const WIDTH = WORLD_MAP[0].length;
const HEIGHT = WORLD_MAP.length;

export function mapTileAt(tx, ty) {
  if (tx < 0 || ty < 0 || tx >= WIDTH || ty >= HEIGHT) return '#';
  return WORLD_MAP[ty][tx];
}

export const isBarrier = (ch) => ch >= 'A' && ch <= 'G';
export const isLevelMarker = (ch) => ch >= '1' && ch <= '8';

export function isBlocked(ch, completed) {
  if (ch === '#' || ch === '~' || ch === '%') return true;
  if (isBarrier(ch)) return !completed.includes(barrierLevel(ch));
  return false;
}

function findStart() {
  for (let ty = 0; ty < HEIGHT; ty++) {
    const tx = WORLD_MAP[ty].indexOf('@');
    if (tx >= 0) return { x: tx * TILE + (TILE - BOX) / 2, y: ty * TILE + (TILE - BOX) / 2 };
  }
  throw new Error('World map has no start position');
}

// A saved position is untrusted: fall back to the start if it's off-map or inside rock.
export function createMap(pos = null, completed = []) {
  const usable = pos && pos.x >= 0 && pos.y >= 0 && pos.x <= WIDTH * TILE - BOX && pos.y <= HEIGHT * TILE - BOX
    && !blockedAt(pos.x, pos.y, completed);
  const start = usable ? pos : findStart();
  return Object.freeze({ x: start.x, y: start.y, dir: 'down', anim: 0, stepTimer: 0, message: null, onShip: false });
}

function blockedAt(x, y, completed) {
  const corners = [[x, y], [x + BOX - 1, y], [x, y + BOX - 1], [x + BOX - 1, y + BOX - 1]];
  return corners.some(([cx, cy]) => isBlocked(mapTileAt(Math.floor(cx / TILE), Math.floor(cy / TILE)), completed));
}

export function tileUnderHero(state) {
  const tx = Math.floor((state.x + BOX / 2) / TILE);
  const ty = Math.floor((state.y + BOX / 2) / TILE);
  return { tx, ty, ch: mapTileAt(tx, ty) };
}

function heading(dx, dy, current) {
  if (dx === 0 && dy === 0) return current;
  if (Math.abs(dx) > Math.abs(dy)) return dx > 0 ? 'right' : 'left';
  return dy > 0 ? 'down' : 'up';
}

// Returns { state, events, action } where action is null | { type: 'enter', levelId } | { type: 'ship' }.
export function updateMap(state, input, session, dt) {
  const { held, pressed } = input;
  if (state.message) {
    const dismiss = pressed.jump || pressed.fire || pressed.confirm || pressed.back;
    return { state: dismiss ? { ...state, message: null } : state, events: dismiss ? ['select'] : [], action: null };
  }
  const dx = (held.right ? 1 : 0) - (held.left ? 1 : 0);
  const dy = (held.down ? 1 : 0) - (held.up ? 1 : 0);
  const norm = dx && dy ? Math.SQRT1_2 : 1;
  const nx = state.x + dx * SPEED * norm * dt;
  const ny = state.y + dy * SPEED * norm * dt;
  const x = blockedAt(nx, state.y, session.completed) ? state.x : nx;
  const y = blockedAt(x, ny, session.completed) ? state.y : ny;
  const moving = x !== state.x || y !== state.y;
  const stepTimer = moving ? state.stepTimer - dt : 0;
  const events = moving && stepTimer <= 0 ? ['mapStep'] : [];
  let next = {
    ...state, x, y,
    dir: heading(dx, dy, state.dir),
    anim: moving ? state.anim + dt : 0,
    stepTimer: stepTimer <= 0 ? 0.22 : stepTimer,
  };

  const { ch } = tileUnderHero(next);
  const onShip = ch === 'H';
  if (onShip && !state.onShip) {
    if (hasAllParts(session)) return { state: { ...next, onShip }, events: ['exit'], action: { type: 'ship' } };
    next = {
      ...next,
      message: [
        'YOUR MEGAROCKET IS STILL',
        'MISSING PARTS!',
        '',
        `YOU HAVE ${session.parts.length} OF 4.`,
        'SEARCH THE PHOBOS BASE.',
      ],
    };
    events.push('denied');
  }
  next = { ...next, onShip };

  const wantsEnter = pressed.jump || pressed.fire;
  if (wantsEnter && isLevelMarker(ch)) {
    const levelId = levelIdForDigit(ch);
    if (session.completed.includes(levelId)) {
      return { state: { ...next, message: [`${LEVEL_NAMES[levelId]} IS CLEARED.`, '', 'NOTHING LEFT BUT CORPSES.'] }, events: ['denied'], action: null };
    }
    return { state: next, events: ['select'], action: { type: 'enter', levelId } };
  }
  return { state: Object.freeze(next), events, action: null };
}

export function mapCamera(state, viewW, viewH) {
  const maxX = WIDTH * TILE - viewW;
  const maxY = HEIGHT * TILE - viewH;
  return {
    x: Math.round(Math.min(Math.max(0, state.x + BOX / 2 - viewW / 2), maxX)),
    y: Math.round(Math.min(Math.max(0, state.y + BOX / 2 - viewH / 2), maxY)),
  };
}

export const MAP_SIZE = Object.freeze({ width: WIDTH, height: HEIGHT, box: BOX });
