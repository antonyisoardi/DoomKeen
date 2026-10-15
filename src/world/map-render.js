// Draws the Phobos overworld.
import { TILE, SCREEN_W, SCREEN_H } from '../core/constants.js';
import { mapTileAt, mapCamera, tileUnderHero, isBarrier, isLevelMarker, MAP_SIZE } from './map.js';
import { LEVEL_NAMES, levelIdForDigit, barrierLevel } from './map-data.js';
import { drawPanel, drawHud, drawMessageBox } from '../ui/box.js';
import { drawTextCentered } from '../core/font.js';

const hash = (tx, ty) => ((tx * 73856093) ^ (ty * 19349663)) >>> 0;

function tileArt(art, ch, tx, ty, completed, time) {
  const frame = Math.floor(time * 4);
  if (ch === '#') return art.rock[hash(tx, ty) % art.rock.length];
  if (ch === '~') return art.nukage[(frame + tx) % art.nukage.length];
  if (ch === '%') return art.lava[(frame + tx) % art.lava.length];
  if (ch === ',') return art.crater;
  if (isBarrier(ch)) return completed.includes(barrierLevel(ch)) ? art.ground[0] : art.barrier[(frame + ty) % art.barrier.length];
  if (isLevelMarker(ch)) return completed.includes(levelIdForDigit(ch)) ? art.bunkerDone : art.bunker;
  return art.ground[hash(tx, ty) % art.ground.length];
}

export function renderMap(ctx, state, session, gfx, time) {
  const art = gfx.map;
  const cam = mapCamera(state, SCREEN_W, SCREEN_H);
  const x0 = Math.floor(cam.x / TILE);
  const y0 = Math.floor(cam.y / TILE);
  let ship = null;
  for (let ty = y0; ty <= y0 + Math.ceil(SCREEN_H / TILE); ty++) {
    for (let tx = x0; tx <= x0 + Math.ceil(SCREEN_W / TILE); tx++) {
      const ch = mapTileAt(tx, ty);
      const sx = tx * TILE - cam.x;
      const sy = ty * TILE - cam.y;
      ctx.drawImage(art.ground[hash(tx, ty) % art.ground.length], sx, sy);
      if (ch === 'H') ship = { sx, sy };
      else ctx.drawImage(tileArt(art, ch, tx, ty, session.completed, time), sx, sy);
    }
  }
  if (ship) ctx.drawImage(art.ship, ship.sx - 8, ship.sy - 8);

  const frames = art.hero[state.dir];
  const hero = frames[Math.floor(state.anim * 8) % 2];
  ctx.drawImage(hero, Math.round(state.x - (TILE - MAP_SIZE.box) / 2 - cam.x), Math.round(state.y - (TILE - MAP_SIZE.box) / 2 - 3 - cam.y));

  drawHud(ctx, session, null, gfx);
  const { ch } = tileUnderHero(state);
  let label = null;
  if (isLevelMarker(ch)) {
    const id = levelIdForDigit(ch);
    label = `${id.toUpperCase()}: ${LEVEL_NAMES[id]}${session.completed.includes(id) ? ' (CLEARED)' : ' - PRESS Z'}`;
  } else if (ch === 'H') {
    label = 'THE MEGAROCKET';
  }
  if (label) {
    const w = label.length * 6 + 12;
    drawPanel(ctx, Math.round((SCREEN_W - w) / 2), SCREEN_H - 20, w, 14);
    drawTextCentered(ctx, label, SCREEN_W / 2, SCREEN_H - 16, 'E');
  }
  if (state.message) drawMessageBox(ctx, state.message);
}
