import { parseLevel } from '../src/game/level.js';
import { makeInput } from '../src/core/input.js';

export const NO_INPUT = makeInput();

export function levelFrom(map, extra = {}) {
  return parseLevel({ id: 'test', name: 'TEST', theme: 'tech', map, ...extra });
}

// A flat 30x12 room with the player standing on the floor at column 3.
export function flatRoom() {
  const rows = Array.from({ length: 12 }, (_, y) => {
    if (y === 0 || y >= 10) return '#'.repeat(30);
    return `#${y === 9 ? '..@' : '...'}${'.'.repeat(26)}#`;
  });
  return levelFrom(rows);
}

export function run(steps, state, update) {
  let s = state;
  for (let i = 0; i < steps; i++) s = update(s, i);
  return s;
}
