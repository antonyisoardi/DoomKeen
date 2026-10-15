// Conservative "can this level be beaten?" analysis on the tile grid.
// Standing positions are tile cells where the 2-tile-tall hero fits with
// support below. Jumps rise straight up, travel sideways, then fall — a
// rectangle that is strictly easier to block than a real arc, so anything
// this proves reachable really is.
import { tileAt } from './level.js';
import { tileDef } from './tiles.js';

export const JUMP = Object.freeze({ rise: 4, reach: 3 });
export const POGO = Object.freeze({ rise: 6, reach: 4 });

function makeGrid(level, open) {
  const free = (tx, ty) => {
    if (tx < 0 || tx >= level.width || ty < 0) return false;
    if (ty >= level.height) return true;
    const def = tileDef(tileAt(level, tx, ty));
    if (def.hazard) return false;
    if (def.door) return open[def.door];
    if (def.bossGate) return true;
    return !def.solid;
  };
  const support = (tx, ty) => {
    if (ty >= level.height) return false;
    const def = tileDef(tileAt(level, tx, ty));
    if (def.door) return !open[def.door];
    if (def.bossGate) return false;
    return !!(def.solid || def.oneWay);
  };
  const body = (tx, ty) => free(tx, ty) && free(tx, ty - 1);
  const stand = (tx, ty) => body(tx, ty) && support(tx, ty + 1);
  return { free, body, stand };
}

// Drop straight down from a free body position; null if it lands in a hazard or the void.
function fallFrom(level, grid, tx, ty, touch) {
  for (let y = ty; y < level.height + 2; y++) {
    if (!grid.body(tx, y)) return null;
    touch(tx, y);
    if (grid.stand(tx, y)) return y;
  }
  return null;
}

function neighbours(level, grid, sx, sy, move, touch) {
  const out = [];
  [-1, 1].forEach((dx) => {
    if (!grid.body(sx + dx, sy)) return;
    const land = fallFrom(level, grid, sx + dx, sy, touch);
    if (land !== null) out.push([sx + dx, land]);
  });
  let maxRise = 0;
  while (maxRise < move.rise && grid.body(sx, sy - maxRise - 1)) {
    maxRise++;
    touch(sx, sy - maxRise);
  }
  for (let rise = 0; rise <= maxRise; rise++) {
    const row = sy - rise;
    [-1, 1].forEach((dir) => {
      for (let step = 1; step <= move.reach; step++) {
        const x = sx + dir * step;
        if (!grid.body(x, row)) break;
        touch(x, row);
        const land = fallFrom(level, grid, x, row, touch);
        if (land !== null) out.push([x, land]);
      }
    });
  }
  return out;
}

function explore(level, open, pogo) {
  const grid = makeGrid(level, open);
  const touched = new Set();
  const touch = (x, y) => { touched.add(`${x},${y}`); touched.add(`${x},${y - 1}`); };
  const visited = new Set();
  const { tx, ty } = level.spawn;
  const start = fallFrom(level, grid, tx, ty, touch);
  if (start === null) return { visited, touched };
  const queue = [[tx, start]];
  visited.add(`${tx},${start}`);
  const moves = pogo ? [JUMP, POGO] : [JUMP];
  while (queue.length) {
    const [x, y] = queue.shift();
    moves.forEach((move) => {
      neighbours(level, grid, x, y, move, touch).forEach(([nx, ny]) => {
        const key = `${nx},${ny}`;
        if (visited.has(key)) return;
        visited.add(key);
        queue.push([nx, ny]);
      });
    });
  }
  return { visited, touched };
}

const KEY_ITEMS = { keyRed: 'red', keyBlue: 'blue', keyYellow: 'yellow' };

// Repeats the search as keycards / the pogo stick become reachable.
export function analyzeLevel(level, { pogo = false } = {}) {
  let open = { red: false, blue: false, yellow: false };
  let hasPogo = pogo;
  let result;
  for (let round = 0; round < 8; round++) {
    result = explore(level, open, hasPogo);
    const reached = level.entities.filter((e) => e.cat === 'item' && result.touched.has(`${e.tx},${e.ty}`));
    const nextOpen = { ...open };
    reached.forEach((e) => { if (KEY_ITEMS[e.kind]) nextOpen[KEY_ITEMS[e.kind]] = true; });
    const nextPogo = hasPogo || reached.some((e) => e.kind === 'pogo');
    if (JSON.stringify(nextOpen) === JSON.stringify(open) && nextPogo === hasPogo) break;
    open = nextOpen;
    hasPogo = nextPogo;
  }
  const exits = [];
  level.tiles.forEach((ch, i) => {
    const x = i % level.width;
    const y = Math.floor(i / level.width);
    if (ch === 'E' && tileAt(level, x, y + 1) !== 'E') exits.push([x, y]);
  });
  const items = level.entities.filter((e) => e.cat === 'item');
  return {
    exitReachable: exits.some(([x, y]) => result.visited.has(`${x},${y}`)),
    exits,
    visited: result.visited,
    touched: result.touched,
    keys: open,
    pogo: hasPogo,
    unreachableItems: items.filter((e) => !result.touched.has(`${e.tx},${e.ty}`)),
  };
}
