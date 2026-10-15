// Plasma shots and demon fireballs: fly straight, burst on walls.
import { TILE } from '../core/constants.js';
import { isSolidAt } from './physics.js';

const IMPACT_FOR = { plasma: 'impactBlue', fireball: 'impactRed', baronball: 'impactGreen' };

export function makeImpact(kind, x, y) {
  return Object.freeze({ type: 'sprite', name: IMPACT_FOR[kind] || 'impactRed', x: x - 4, y: y - 4, t: 0, dur: 0.16 });
}

export function updateProjectile(shot, level, dt) {
  const x = shot.x + shot.vx * dt;
  const y = shot.y + shot.vy * dt;
  const ttl = shot.ttl - dt;
  const leadX = shot.vx >= 0 ? x + shot.w : x;
  const midY = y + shot.h / 2;
  if (isSolidAt(level, Math.floor(leadX / TILE), Math.floor(midY / TILE))) {
    return {
      shot: null,
      effects: [makeImpact(shot.kind, leadX, midY)],
      events: shot.owner === 'player' ? ['hitWall'] : [],
    };
  }
  if (ttl <= 0) return { shot: null, effects: [], events: [] };
  return { shot: Object.freeze({ ...shot, x, y, ttl }), effects: [], events: [] };
}

export function makeEnemyShot(kind, from, speed) {
  return Object.freeze({
    kind,
    owner: 'enemy',
    x: from.facing > 0 ? from.x + from.w : from.x - 8,
    y: from.y + Math.min(8, from.h / 3),
    w: 8,
    h: 6,
    vx: from.facing * speed,
    vy: 0,
    ttl: 3,
  });
}
