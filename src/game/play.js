// A single level in progress: creation, phase handling and the update pipeline.
import { TILE, PHYS, TIMING } from '../core/constants.js';
import { createPlayer } from './player.js';
import { spawnEnemy } from './enemies.js';
import {
  stepPlayer, stepDoors, stepEnemies, stepProjectiles, stepShotHits, stepBossGate,
  stepItems, stepEnemyContact, stepHazards, stepExit, stepEffects, cameraFor,
} from './play-steps.js';

export function createPlay(level, session, rand = Math.random) {
  const items = level.entities
    .filter((e) => e.cat === 'item')
    .map((e) => Object.freeze({ kind: e.kind, x: e.tx * TILE, y: e.ty * TILE, w: TILE, h: TILE }));
  const enemies = level.entities
    .filter((e) => e.cat === 'enemy')
    .map((e) => spawnEnemy(e.kind, e.tx, e.ty, rand));
  const player = createPlayer(level.spawn.tx, level.spawn.ty);
  return Object.freeze({
    level,
    session,
    player,
    items,
    enemies,
    shots: [],
    effects: [],
    blockers: [],
    keys: Object.freeze({ red: false, blue: false, yellow: false }),
    camera: cameraFor(level, player, null),
    phase: 'play',
    phaseTime: 0,
    dialog: null,
    time: 0,
    banner: TIMING.levelBanner,
    stats: Object.freeze({ kills: 0, totalKills: enemies.length, items: 0, totalItems: items.length }),
  });
}

// Runs steps in order, collecting sound events. Stops simulating once the
// player dies or exits so later steps never see a stale "play" phase.
function pipeline(state, steps) {
  return steps.reduce((acc, step) => {
    if (acc.state.phase !== 'play') return acc;
    const r = step(acc.state);
    return { state: r.state, events: [...acc.events, ...(r.events || [])] };
  }, { state, events: [] });
}

function updateRunning(state, input, dt, rand) {
  const { state: next, events } = pipeline(state, [
    (s) => stepPlayer(s, input, dt),
    stepDoors,
    (s) => stepEnemies(s, dt, rand),
    (s) => stepProjectiles(s, dt),
    stepShotHits,
    stepBossGate,
    stepItems,
    stepEnemyContact,
    stepHazards,
    stepExit,
  ]);
  const withFx = stepEffects(next, dt).state;
  return {
    state: {
      ...withFx,
      time: state.time + dt,
      banner: Math.max(0, state.banner - dt),
      camera: cameraFor(withFx.level, withFx.player, state.camera),
    },
    events,
    outcome: null,
  };
}

function updateDying(state, dt) {
  const p = state.player;
  const vy = p.vy + PHYS.gravity * 0.45 * dt;
  const player = { ...p, x: p.x + p.vx * dt, y: p.y + vy * dt, vy };
  const phaseTime = state.phaseTime + dt;
  const next = { ...stepEffects(state, dt).state, player, phaseTime };
  return { state: next, events: [], outcome: phaseTime >= TIMING.deathDuration ? 'died' : null };
}

function updateExiting(state, dt) {
  const phaseTime = state.phaseTime + dt;
  return {
    state: { ...state, phaseTime },
    events: [],
    outcome: phaseTime >= TIMING.exitDuration ? 'complete' : null,
  };
}

function updateDialog(state, input) {
  const { pressed } = input;
  const dismiss = pressed.jump || pressed.fire || pressed.confirm || pressed.back || pressed.pogo;
  return {
    state: dismiss ? { ...state, phase: 'play', dialog: null } : state,
    events: dismiss ? ['select'] : [],
    outcome: null,
  };
}

// Returns { state, events, outcome } where outcome is null | 'died' | 'complete'.
export function updatePlay(state, input, dt, rand = Math.random) {
  switch (state.phase) {
    case 'dialog': return updateDialog(state, input);
    case 'dying': return updateDying(state, dt);
    case 'exiting': return updateExiting(state, dt);
    default: return updateRunning(state, input, dt, rand);
  }
}
