// Demon AI, modelled on Keen 1's cast:
//   zombie   -> Yorp: harmless wanderer that shoves you; stomp to stun it.
//   pinky    -> Garg: patrols, roars, then charges when it spots you.
//   imp      -> lobs fireballs when you're in its line of sight.
//   lostSoul -> bounces around the room, occasionally lunging at you.
//   baron    -> Vorticon: tough, jumps erratically and throws plasma.
import { TILE, PHYS, TIMING } from '../core/constants.js';
import { moveBody, isStandableAt, hasLineOfSight } from './physics.js';
import { makeEnemyShot } from './projectiles.js';

export const ENEMY_TYPES = Object.freeze({
  zombie: { w: 12, h: 22, hp: 1, points: 100, deadly: false },
  imp: { w: 12, h: 22, hp: 2, points: 200, deadly: true },
  pinky: { w: 20, h: 18, hp: 3, points: 300, deadly: true },
  lostSoul: { w: 12, h: 12, hp: 1, points: 200, deadly: true },
  baron: { w: 18, h: 30, hp: 8, points: 2000, deadly: true },
});

export function spawnEnemy(kind, tx, ty, rand = Math.random) {
  const type = ENEMY_TYPES[kind];
  if (!type) throw new Error(`Unknown enemy kind: ${kind}`);
  const facing = rand() < 0.5 ? -1 : 1;
  const base = {
    kind,
    w: type.w,
    h: type.h,
    hp: type.hp,
    x: tx * TILE + (TILE - type.w) / 2,
    y: (ty + 1) * TILE - type.h,
    vx: 0,
    vy: 0,
    facing,
    state: 'walk',
    timer: 1 + rand() * 2,
    attack: 1 + rand() * 2,
    anim: rand(),
    flash: 0,
    alive: true,
    onGround: false,
  };
  if (kind === 'lostSoul') {
    return Object.freeze({ ...base, y: ty * TILE + (TILE - type.h) / 2, vx: facing * 50, vy: (rand() < 0.5 ? -1 : 1) * 40 });
  }
  return Object.freeze(base);
}

const centerX = (b) => b.x + b.w / 2;
const centerY = (b) => b.y + b.h / 2;
const dirTo = (from, to) => (centerX(to) >= centerX(from) ? 1 : -1);

function canSee(e, player, level, rangeX, rangeY) {
  if (player.dead) return false;
  const dx = centerX(player) - centerX(e);
  const dy = centerY(player) - centerY(e);
  if (Math.abs(dx) > rangeX || Math.abs(dy) > rangeY) return false;
  return hasLineOfSight(level, centerX(e), centerY(e), centerX(player), centerY(player));
}

function physics(e, level, vx, vy, dt) {
  const m = moveBody(level, { x: e.x, y: e.y, w: e.w, h: e.h, vx, vy }, dt);
  return { ...e, x: m.x, y: m.y, vx: m.vx, vy: m.vy, onGround: m.onGround, hitWall: m.hitLeft || m.hitRight };
}

function fall(e, level, dt) {
  return physics(e, level, 0, Math.min(e.vy + PHYS.gravity * dt, PHYS.maxFall), dt);
}

// Walk forward; turn around at walls and (optionally) ledges.
function walk(e, level, dt, speed, turnAtLedge) {
  const vy = Math.min(e.vy + PHYS.gravity * dt, PHYS.maxFall);
  const m = physics(e, level, e.facing * speed, vy, dt);
  if (m.hitWall) return { ...m, facing: -e.facing };
  if (turnAtLedge && m.onGround) {
    const aheadX = e.facing > 0 ? m.x + m.w + 1 : m.x - 1;
    const below = Math.floor((m.y + m.h + 1) / TILE);
    if (!isStandableAt(level, Math.floor(aheadX / TILE), below)) return { ...m, facing: -e.facing };
  }
  return m;
}

const done = (enemy, spawns = [], events = []) => ({ enemy: Object.freeze(enemy), spawns, events });

function zombie(e, { level, player, dt, rand }) {
  if (e.state === 'stunned' || e.state === 'look') {
    const timer = e.timer - dt;
    const m = fall(e, level, dt);
    if (timer > 0) return done({ ...m, timer });
    const toward = dirTo(e, player);
    return done({ ...m, state: 'walk', facing: rand() < 0.75 ? toward : -toward, timer: 1.5 + rand() * 2 });
  }
  const timer = e.timer - dt;
  let m = walk(e, level, dt, 28, true);
  if (m.onGround && rand() < 0.008) m = { ...m, vy: -140 };
  if (timer <= 0) return done({ ...m, state: 'look', timer: 0.7 + rand() * 0.6 });
  return done({ ...m, timer });
}

function imp(e, { level, player, dt, rand }) {
  if (e.state === 'throw') {
    const timer = e.timer - dt;
    const m = fall(e, level, dt);
    const throwing = e.timer > 0.2 && timer <= 0.2;
    const spawns = throwing ? [makeEnemyShot('fireball', m, 120)] : [];
    const events = throwing ? ['fireball'] : [];
    return done(timer <= 0 ? { ...m, state: 'walk', timer: 0 } : { ...m, timer }, spawns, events);
  }
  const attack = e.attack - dt;
  const m = walk(e, level, dt, 32, true);
  if (attack <= 0 && canSee(m, player, level, 220, 40)) {
    return done({ ...m, state: 'throw', timer: 0.5, attack: 1.8 + rand() * 1.6, facing: dirTo(m, player) });
  }
  return done({ ...m, attack: Math.max(0, attack) });
}

function pinky(e, { level, player, dt }) {
  if (e.state === 'roar') {
    const timer = e.timer - dt;
    const m = fall(e, level, dt);
    return done(timer <= 0 ? { ...m, state: 'charge', timer: 2.2 } : { ...m, timer });
  }
  if (e.state === 'charge') {
    const timer = e.timer - dt;
    const m = walk(e, level, dt, 150, false);
    if (m.facing !== e.facing || timer <= 0) return done({ ...m, state: 'walk', attack: 1.2 });
    return done({ ...m, timer });
  }
  const attack = e.attack - dt;
  const m = walk(e, level, dt, 40, true);
  if (attack <= 0 && m.onGround && canSee(m, player, level, 170, 22)) {
    return done({ ...m, state: 'roar', timer: 0.35, facing: dirTo(m, player) }, [], ['roar']);
  }
  return done({ ...m, attack: Math.max(0, attack) });
}

function lostSoul(e, { level, player, dt, rand }) {
  let { vx, vy, state } = e;
  let timer = e.timer - dt;
  const events = [];
  if (state === 'charge' && timer <= 0) {
    state = 'walk';
    timer = 2 + rand() * 2;
    vx = (Math.sign(vx) || 1) * 50;
    vy = (Math.sign(vy) || 1) * 40;
  } else if (state === 'walk' && timer <= 0) {
    timer = 1 + rand();
    if (canSee(e, player, level, 150, 110)) {
      const dx = centerX(player) - centerX(e);
      const dy = centerY(player) - centerY(e);
      const len = Math.hypot(dx, dy) || 1;
      vx = (dx / len) * 120;
      vy = (dy / len) * 120;
      state = 'charge';
      timer = 0.9;
      events.push('fireball');
    }
  }
  const m = physics(e, level, vx, vy, dt);
  const bx = m.hitWall ? -vx : vx;
  const by = m.vy === 0 && vy !== 0 ? -vy : vy;
  return done({ ...m, vx: bx, vy: by, state, timer, facing: bx >= 0 ? 1 : -1 }, [], events);
}

function baron(e, { level, player, dt, rand }) {
  const facing = e.onGround ? dirTo(e, player) : e.facing;
  let vx = e.onGround ? facing * 45 : e.vx;
  let vy = Math.min(e.vy + PHYS.gravity * dt, PHYS.maxFall);
  let attack = e.attack - dt;
  const spawns = [];
  const events = [];
  if (attack <= 0 && e.onGround) {
    attack = 0.8 + rand() * 1.2;
    if (rand() < 0.45) {
      vy = -340;
      vx = facing * 90;
    } else if (canSee(e, player, level, 260, 64)) {
      spawns.push(makeEnemyShot('baronball', { ...e, facing }, 140));
      events.push('fireball');
    }
  }
  const m = physics({ ...e, facing }, level, vx, vy, dt);
  return done({ ...m, attack }, spawns, events);
}

const BEHAVIOURS = { zombie, imp, pinky, lostSoul, baron };

// ctx: { level, player, dt, rand }. Returns { enemy, spawns, events }.
export function updateEnemy(e, ctx) {
  const ticked = { ...e, flash: Math.max(0, e.flash - ctx.dt), anim: e.anim + ctx.dt };
  if (!e.alive) return done(fall(ticked, ctx.level, ctx.dt));
  return BEHAVIOURS[e.kind](ticked, ctx);
}

export function damageEnemy(e, amount = 1) {
  const hp = e.hp - amount;
  if (hp > 0) return { enemy: Object.freeze({ ...e, hp, flash: 0.12 }), killed: false };
  return { enemy: Object.freeze({ ...e, hp: 0, alive: false, state: 'dead', vx: 0, flash: 0 }), killed: true };
}

export function stunEnemy(e) {
  return Object.freeze({ ...e, state: 'stunned', timer: TIMING.stunDuration, vx: 0 });
}

export function isHarmful(e) {
  return e.alive && ENEMY_TYPES[e.kind].deadly;
}
