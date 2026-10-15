// Individual simulation steps for a running level. Each takes the play state
// and returns { state, events? } without mutating its input.
import { TILE, CAMERA, SCREEN_W, SCREEN_H } from '../core/constants.js';
import { tileAt, setTiles, connectedTiles, findTiles } from './level.js';
import { tileDef, HAZARD_INSET } from './tiles.js';
import { overlaps, inset } from './physics.js';
import { updatePlayer, pushPlayer, bouncePlayer, killPlayer } from './player.js';
import { updateEnemy, damageEnemy, stunEnemy, isHarmful, ENEMY_TYPES } from './enemies.js';
import { updateProjectile, makeImpact } from './projectiles.js';
import { applyPickup, addScore } from './session.js';

export function stepPlayer(state, input, dt) {
  const r = updatePlayer(state.player, input, {
    level: state.level,
    hasPogo: state.session.hasPogo,
    ammo: state.session.ammo,
  }, dt);
  const fired = r.fired ? [r.fired] : [];
  const session = r.fired ? { ...state.session, ammo: state.session.ammo - 1 } : state.session;
  return {
    state: { ...state, player: r.player, session, shots: [...state.shots, ...fired], blockers: r.blockers },
    events: r.events,
  };
}

// Keen 1 doors: bump into one while holding the matching keycard and it slides away.
export function stepDoors(state) {
  const door = (state.blockers || [])
    .map(({ tx, ty }) => ({ tx, ty, def: tileDef(tileAt(state.level, tx, ty)) }))
    .find(({ def }) => def.door && state.keys[def.door]);
  if (!door) return { state };
  const ch = tileAt(state.level, door.tx, door.ty);
  const cells = connectedTiles(state.level, door.tx, door.ty);
  const slides = cells.map(({ tx, ty }) => ({ type: 'door', ch, tx, ty, t: 0, dur: 0.5 }));
  return {
    state: { ...state, level: setTiles(state.level, cells, '.'), effects: [...state.effects, ...slides] },
    events: ['door'],
  };
}

export function stepEnemies(state, dt, rand) {
  const ctx = { level: state.level, player: state.player, dt, rand };
  const results = state.enemies.map((e) => updateEnemy(e, ctx));
  return {
    state: {
      ...state,
      enemies: results.map((r) => r.enemy),
      shots: [...state.shots, ...results.flatMap((r) => r.spawns)],
    },
    events: results.flatMap((r) => r.events),
  };
}

export function stepProjectiles(state, dt) {
  const results = state.shots.map((s) => updateProjectile(s, state.level, dt));
  return {
    state: {
      ...state,
      shots: results.map((r) => r.shot).filter(Boolean),
      effects: [...state.effects, ...results.flatMap((r) => r.effects)],
    },
    events: results.flatMap((r) => r.events),
  };
}

function killReward(state, enemy) {
  const { session, events } = addScore(state.session, ENEMY_TYPES[enemy.kind].points);
  const puff = enemy.kind === 'lostSoul'
    ? [{ type: 'sprite', name: 'puff', x: enemy.x - 2, y: enemy.y - 2, t: 0, dur: 0.4 }]
    : [];
  return { session, events: [enemy.kind === 'baron' ? 'bossDie' : 'enemyDie', ...events], effects: puff };
}

export function stepShotHits(state) {
  let { session, enemies, effects, stats } = state;
  const events = [];
  const shots = [];
  enemies = [...enemies];
  state.shots.forEach((shot) => {
    if (shot.owner !== 'player') {
      shots.push(shot);
      return;
    }
    const idx = enemies.findIndex((e) => e.alive && overlaps(shot, e));
    if (idx < 0) {
      shots.push(shot);
      return;
    }
    const target = enemies[idx];
    const hit = damageEnemy(target);
    enemies[idx] = hit.enemy;
    effects = [...effects, makeImpact(shot.kind, shot.x + shot.w / 2, shot.y + shot.h / 2)];
    if (hit.killed) {
      const reward = killReward({ session }, target);
      session = reward.session;
      effects = [...effects, ...reward.effects];
      events.push(...reward.events);
      stats = { ...stats, kills: stats.kills + 1 };
    } else {
      events.push('enemyHit');
    }
  });
  return {
    state: { ...state, shots, session, effects, stats, enemies: enemies.filter((e) => e.alive || e.kind !== 'lostSoul') },
    events,
  };
}

// E1M8: the gate opens once every Baron of Hell is dead.
export function stepBossGate(state) {
  const gates = findTiles(state.level, (ch) => tileDef(ch).bossGate);
  if (gates.length === 0 || state.enemies.some((e) => e.alive && e.kind === 'baron')) return { state };
  const slides = gates.map(({ tx, ty }) => ({ type: 'door', ch: 'X', tx, ty, t: 0, dur: 0.8 }));
  return {
    state: { ...state, level: setTiles(state.level, gates, '.'), effects: [...state.effects, ...slides] },
    events: ['door'],
  };
}

export function stepItems(state) {
  const box = state.player;
  let { session, keys, stats } = state;
  const events = [];
  let message = null;
  const items = state.items.filter((item) => {
    if (!overlaps(box, inset(item, 3, 3))) return true;
    const r = applyPickup(session, keys, item.kind);
    session = r.session;
    keys = r.keys;
    events.push(...r.events);
    message = r.message || message;
    stats = { ...stats, items: stats.items + 1 };
    return false;
  });
  const next = { ...state, items, session, keys, stats };
  return { state: message ? { ...next, phase: 'dialog', dialog: message } : next, events };
}

export function die(state) {
  return { state: { ...state, phase: 'dying', phaseTime: 0, player: killPlayer(state.player) }, events: ['death'] };
}

export function stepEnemyContact(state) {
  let { player } = state;
  const events = [];
  const body = inset(player, 1, 1);
  const enemies = state.enemies.map((e) => {
    if (!e.alive || !overlaps(body, e)) return e;
    if (e.kind !== 'zombie' || e.state === 'stunned') return e;
    const feet = player.y + player.h;
    if (player.vy > 0 && feet <= e.y + 8) {
      player = bouncePlayer(player);
      events.push('stomp');
      return stunEnemy(e);
    }
    player = pushPlayer(player, player.x + player.w / 2 < e.x + e.w / 2 ? -1 : 1);
    events.push('push');
    return e;
  });
  const next = { ...state, player, enemies };
  const deadly = enemies.some((e) => isHarmful(e) && overlaps(inset(player, 2, 2), inset(e, 1, 1)));
  const shotHit = state.shots.some((s) => s.owner === 'enemy' && overlaps(inset(player, 2, 2), s));
  if (deadly || shotHit) {
    const r = die(next);
    return { state: r.state, events: [...events, ...r.events] };
  }
  return { state: next, events };
}

function touchesHazard(level, p) {
  const box = inset(p, 2, 2);
  const x0 = Math.floor(box.x / TILE);
  const x1 = Math.floor((box.x + box.w) / TILE);
  const y0 = Math.floor(box.y / TILE);
  const y1 = Math.floor((box.y + box.h) / TILE);
  for (let ty = y0; ty <= y1; ty++) {
    for (let tx = x0; tx <= x1; tx++) {
      if (!tileDef(tileAt(level, tx, ty)).hazard) continue;
      if (overlaps(box, { x: tx * TILE, y: ty * TILE + HAZARD_INSET, w: TILE, h: TILE - HAZARD_INSET })) return true;
    }
  }
  return false;
}

export function stepHazards(state) {
  const fellOut = state.player.y > state.level.height * TILE + 8;
  if (fellOut || touchesHazard(state.level, state.player)) return die(state);
  return { state };
}

export function stepExit(state) {
  const p = state.player;
  if (!p.onGround) return { state };
  const tx = Math.floor((p.x + p.w / 2) / TILE);
  const ty = Math.floor((p.y + p.h - 1) / TILE);
  const isExit = tileAt(state.level, tx, ty) === 'E' && tileDef(tileAt(state.level, tx, ty + 1)).solid;
  if (!isExit) return { state };
  return {
    state: { ...state, phase: 'exiting', phaseTime: 0, player: { ...p, vx: 0, pogo: false } },
    events: ['exit'],
  };
}

export function stepEffects(state, dt) {
  const effects = state.effects
    .map((fx) => ({ ...fx, t: fx.t + dt }))
    .filter((fx) => fx.t < fx.dur);
  return { state: { ...state, effects } };
}

export function cameraFor(level, player, camera) {
  const px = player.x + player.w / 2;
  const py = player.y + player.h / 2;
  let x = camera ? camera.x : px - SCREEN_W / 2;
  let y = camera ? camera.y : py - SCREEN_H / 2;
  if (px - x > CAMERA.right) x = px - CAMERA.right;
  if (px - x < CAMERA.left) x = px - CAMERA.left;
  if (py - y > CAMERA.bottom) y = py - CAMERA.bottom;
  if (py - y < CAMERA.top) y = py - CAMERA.top;
  const maxX = Math.max(0, level.width * TILE - SCREEN_W);
  const maxY = Math.max(0, level.height * TILE - SCREEN_H);
  return { x: Math.min(Math.max(0, x), maxX), y: Math.min(Math.max(0, y), maxY) };
}
