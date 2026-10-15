// Parses ASCII level definitions into immutable level objects.
import { ENTITY_CHARS, isTileChar } from './tiles.js';

const THEMES = new Set(['tech', 'nukage', 'hell']);

function validateDef(def) {
  if (!def || typeof def !== 'object') throw new Error('Level definition must be an object');
  const { id, name, theme, map } = def;
  if (typeof id !== 'string' || !id) throw new Error('Level is missing an id');
  if (typeof name !== 'string' || !name) throw new Error(`Level ${id} is missing a name`);
  if (!THEMES.has(theme)) throw new Error(`Level ${id} has unknown theme "${theme}"`);
  if (!Array.isArray(map) || map.length < 4 || !map.every((r) => typeof r === 'string')) {
    throw new Error(`Level ${id} map must be an array of strings`);
  }
}

export function parseLevel(def) {
  validateDef(def);
  const width = Math.max(...def.map.map((r) => r.length));
  const height = def.map.length;
  const tiles = [];
  const entities = [];
  let spawn = null;

  def.map.forEach((row, ty) => {
    for (let tx = 0; tx < width; tx++) {
      const ch = tx < row.length ? row[tx] : '#';
      if (ch === '@') {
        if (spawn) throw new Error(`Level ${def.id} has more than one start '@'`);
        spawn = { tx, ty };
        tiles.push('.');
      } else if (Object.hasOwn(ENTITY_CHARS, ch)) {
        entities.push({ ...ENTITY_CHARS[ch], tx, ty });
        tiles.push('.');
      } else if (isTileChar(ch)) {
        tiles.push(ch);
      } else {
        throw new Error(`Level ${def.id}: unknown character '${ch}' at ${tx},${ty}`);
      }
    }
  });
  if (!spawn) throw new Error(`Level ${def.id} has no player start '@'`);

  return Object.freeze({
    id: def.id,
    name: def.name,
    theme: def.theme,
    par: def.par || 120,
    width,
    height,
    tiles: Object.freeze(tiles),
    spawn: Object.freeze(spawn),
    entities: Object.freeze(entities.map(Object.freeze)),
  });
}

// Outside the map: walls on the sides and top, open air below (falling = death).
export function tileAt(level, tx, ty) {
  if (tx < 0 || tx >= level.width || ty < 0) return '#';
  if (ty >= level.height) return '.';
  return level.tiles[ty * level.width + tx];
}

export function setTiles(level, cells, ch) {
  if (cells.length === 0) return level;
  const tiles = [...level.tiles];
  cells.forEach(({ tx, ty }) => { tiles[ty * level.width + tx] = ch; });
  return Object.freeze({ ...level, tiles: Object.freeze(tiles) });
}

export function findTiles(level, predicate) {
  const out = [];
  level.tiles.forEach((ch, i) => {
    if (predicate(ch)) out.push({ tx: i % level.width, ty: Math.floor(i / level.width), ch });
  });
  return out;
}

// 4-connected flood fill of identical tiles starting at (tx, ty).
export function connectedTiles(level, tx, ty) {
  const target = tileAt(level, tx, ty);
  const seen = new Set();
  const out = [];
  const stack = [[tx, ty]];
  while (stack.length) {
    const [x, y] = stack.pop();
    const key = `${x},${y}`;
    if (seen.has(key) || x < 0 || y < 0 || x >= level.width || y >= level.height) continue;
    seen.add(key);
    if (tileAt(level, x, y) !== target) continue;
    out.push({ tx: x, ty: y });
    stack.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]);
  }
  return out;
}
