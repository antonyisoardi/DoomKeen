// Doom-style end-of-level tally.
import { SCREEN_W } from '../core/constants.js';
import { drawText, drawTextCentered } from '../core/font.js';
import { drawStarfield } from './backdrop.js';

const pct = (n, total) => (total === 0 ? 100 : Math.round((n / total) * 100));
const clock = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;

export function createIntermission(play) {
  const { stats, level, time } = play;
  return Object.freeze({
    levelId: level.id,
    name: level.name,
    kills: pct(stats.kills, stats.totalKills),
    items: pct(stats.items, stats.totalItems),
    time,
    par: level.par,
    t: 0,
  });
}

export function updateIntermission(state, input, dt) {
  const t = state.t + dt;
  const { pressed } = input;
  const go = (pressed.confirm || pressed.jump || pressed.fire) && t > 0.6;
  const tick = Math.floor(t * 12) !== Math.floor(state.t * 12) && t < 2;
  return { state: { ...state, t }, events: go ? ['select'] : tick ? ['mapStep'] : [], action: go ? 'done' : null };
}

export function renderIntermission(ctx, state, time) {
  drawStarfield(ctx, time, 0);
  drawTextCentered(ctx, `${state.levelId.toUpperCase()}: ${state.name}`, SCREEN_W / 2, 30, 'C', { scale: 2, shadow: 4 });
  drawTextCentered(ctx, 'FINISHED', SCREEN_W / 2, 52, 'E', { scale: 2, shadow: 4 });
  const reveal = Math.min(1, state.t / 1.5);
  const rows = [
    ['KILLS', `${Math.round(state.kills * reveal)}%`],
    ['ITEMS', `${Math.round(state.items * reveal)}%`],
    ['TIME', clock(state.time * reveal)],
    ['PAR', clock(state.par)],
  ];
  rows.forEach(([label, value], i) => {
    drawText(ctx, label, 90, 90 + i * 16, 'C', { scale: 1, shadow: 4 });
    drawText(ctx, value, 190, 90 + i * 16, 'F');
  });
  if (state.t > 0.6) drawTextCentered(ctx, 'PRESS A KEY', SCREEN_W / 2, 170, 8);
}

export function renderGameOver(ctx, time) {
  drawStarfield(ctx, time, 0);
  drawTextCentered(ctx, 'GAME OVER', SCREEN_W / 2, 80, 'C', { scale: 3, shadow: 4 });
  drawTextCentered(ctx, 'THE DEMONS GET TO KEEP THE MEGAROCKET.', SCREEN_W / 2, 120, 7);
  drawTextCentered(ctx, 'PRESS A KEY', SCREEN_W / 2, 150, 8);
}
