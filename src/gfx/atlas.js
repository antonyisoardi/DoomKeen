// Builds every canvas the game draws, once, at startup.
import { fromRows, flipH, silhouette, paint } from './painter.js';
import { heroFrames } from './data/hero.js';
import { enemyFrames, FIREBALL, BARONBALL, PLASMA, CORPSE_COLORS } from './data/enemies.js';
import { itemFrames } from './data/items.js';
import { buildTileArt } from './tile-art.js';
import { buildMapArt } from './map-art.js';

function facingPair(rows) {
  const r = fromRows(rows);
  const l = flipH(r);
  return { r, l, flashR: silhouette(r), flashL: silhouette(l) };
}

function corpse(width, color) {
  return paint(width, 8, (p) => {
    const mid = Math.floor(width / 2);
    p.rect(1, 5, width - 2, 3, '4');
    p.rect(3, 4, width - 6, 1, '4');
    p.rect(mid - 4, 2, 8, 4, color);
    p.rect(mid - 2, 1, 4, 2, color);
    p.px(mid - 3, 3, 'C');
    p.px(mid + 2, 2, 'C');
    p.px(mid + 4, 5, 'F');
    p.px(2, 6, 'C');
    p.px(width - 3, 6, 'C');
  });
}

function impact(frame, color) {
  return paint(8, 8, (p) => {
    if (frame === 0) {
      p.rect(3, 3, 2, 2, 'F');
      [[1, 1], [6, 1], [1, 6], [6, 6]].forEach(([x, y]) => p.px(x, y, color));
    } else {
      [[0, 0], [7, 0], [0, 7], [7, 7], [3, 0], [0, 4], [7, 3], [4, 7]].forEach(([x, y]) => p.px(x, y, color));
    }
  });
}

function puff(frame) {
  return paint(16, 16, (p) => {
    const r = 3 + frame * 2;
    for (let a = 0; a < 12; a++) {
      const ang = (a / 12) * Math.PI * 2;
      p.px(Math.round(8 + Math.cos(ang) * r), Math.round(8 + Math.sin(ang) * r), frame < 2 ? '7' : '8');
    }
  });
}

export function buildAtlas() {
  const sprites = {};
  Object.entries(heroFrames()).forEach(([name, rows]) => { sprites[`hero.${name}`] = facingPair(rows); });
  Object.entries(enemyFrames()).forEach(([name, rows]) => { sprites[name] = facingPair(rows); });
  sprites.fireball = facingPair(FIREBALL);
  sprites.baronball = facingPair(BARONBALL);
  sprites.plasma = facingPair(PLASMA);

  const items = Object.fromEntries(Object.entries(itemFrames()).map(([k, rows]) => [k, fromRows(rows)]));
  const corpses = Object.fromEntries(Object.entries(CORPSE_COLORS).map(([kind, color]) => [
    kind, corpse(kind === 'pinky' || kind === 'baron' ? 24 : 16, color),
  ]));
  const effects = {
    impactBlue: [impact(0, 'B'), impact(1, '9')],
    impactRed: [impact(0, 'E'), impact(1, 'C')],
    impactGreen: [impact(0, 'A'), impact(1, '2')],
    puff: [0, 1, 2, 3].map(puff),
  };
  const tiles = buildTileArt();
  const map = buildMapArt();

  return {
    sprite(name, facing = 1, flash = false) {
      const pair = sprites[name];
      if (!pair) throw new Error(`Missing sprite: ${name}`);
      if (flash) return facing < 0 ? pair.flashL : pair.flashR;
      return facing < 0 ? pair.l : pair.r;
    },
    item: (kind) => items[kind],
    corpse: (kind) => corpses[kind],
    effect: (name, frame) => effects[name][Math.min(frame, effects[name].length - 1)],
    effectFrames: (name) => effects[name].length,
    tile(theme, key, time = 0) {
      const frames = tiles[theme]?.[key];
      if (!frames) return null;
      return frames[Math.floor(time * 6) % frames.length];
    },
    map,
  };
}
