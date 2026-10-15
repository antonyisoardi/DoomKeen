// Axis-separated AABB vs tile-grid collision. Pure: returns a new body.
import { TILE } from '../core/constants.js';
import { tileAt } from './level.js';
import { tileDef } from './tiles.js';

const EPS = 0.001;

export const isSolidAt = (level, tx, ty) => !!tileDef(tileAt(level, tx, ty)).solid;

export function isStandableAt(level, tx, ty) {
  const def = tileDef(tileAt(level, tx, ty));
  return !!(def.solid || def.oneWay);
}

export function overlaps(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

export function inset(box, dx, dy) {
  return { x: box.x + dx, y: box.y + dy, w: box.w - dx * 2, h: box.h - dy * 2 };
}

function moveX(level, body, dx) {
  const blockers = [];
  if (dx === 0) return { x: body.x, hit: 0, blockers };
  const top = Math.floor(body.y / TILE);
  const bottom = Math.floor((body.y + body.h - EPS) / TILE);
  const nx = body.x + dx;
  const col = dx > 0 ? Math.floor((nx + body.w - EPS) / TILE) : Math.floor(nx / TILE);
  for (let ty = top; ty <= bottom; ty++) {
    if (isSolidAt(level, col, ty)) blockers.push({ tx: col, ty });
  }
  if (blockers.length === 0) return { x: nx, hit: 0, blockers };
  return { x: dx > 0 ? col * TILE - body.w : (col + 1) * TILE, hit: Math.sign(dx), blockers };
}

function moveY(level, body, dy, ignoreOneWay) {
  const blockers = [];
  if (dy === 0) return { y: body.y, hit: 0, blockers };
  const left = Math.floor(body.x / TILE);
  const right = Math.floor((body.x + body.w - EPS) / TILE);
  const ny = body.y + dy;
  const row = dy > 0 ? Math.floor((ny + body.h - EPS) / TILE) : Math.floor(ny / TILE);
  let hit = false;
  for (let tx = left; tx <= right; tx++) {
    const def = tileDef(tileAt(level, tx, row));
    if (def.solid) {
      hit = true;
      blockers.push({ tx, ty: row });
    } else if (dy > 0 && def.oneWay && !ignoreOneWay && body.y + body.h <= row * TILE + EPS) {
      hit = true;
    }
  }
  if (!hit) return { y: ny, hit: 0, blockers };
  return { y: dy > 0 ? row * TILE - body.h : (row + 1) * TILE, hit: Math.sign(dy), blockers };
}

export function moveBody(level, body, dt, { ignoreOneWay = false } = {}) {
  const mx = moveX(level, body, body.vx * dt);
  const my = moveY(level, { ...body, x: mx.x }, body.vy * dt, ignoreOneWay);
  return {
    x: mx.x,
    y: my.y,
    vx: mx.hit ? 0 : body.vx,
    vy: my.hit ? 0 : body.vy,
    hitLeft: mx.hit < 0,
    hitRight: mx.hit > 0,
    hitCeiling: my.hit < 0,
    onGround: my.hit > 0,
    blockers: [...mx.blockers, ...my.blockers],
  };
}

export function approach(value, target, delta) {
  if (value < target) return Math.min(value + delta, target);
  if (value > target) return Math.max(value - delta, target);
  return value;
}

// Coarse line-of-sight: samples every 8px between two points for solid tiles.
export function hasLineOfSight(level, x0, y0, x1, y1) {
  const dist = Math.hypot(x1 - x0, y1 - y0);
  const steps = Math.max(1, Math.ceil(dist / 8));
  for (let i = 1; i < steps; i++) {
    const t = i / steps;
    if (isSolidAt(level, Math.floor((x0 + (x1 - x0) * t) / TILE), Math.floor((y0 + (y1 - y0) * t) / TILE))) return false;
  }
  return true;
}
