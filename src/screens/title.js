// Title screen with a Keen-style menu.
import { SCREEN_W } from '../core/constants.js';
import { drawText, drawTextCentered } from '../core/font.js';
import { drawStarfield, drawPlanet, drawLogo } from './backdrop.js';

export function createTitle(hasSave) {
  const items = [
    { id: 'new', label: 'NEW GAME' },
    ...(hasSave ? [{ id: 'continue', label: 'CONTINUE GAME' }] : []),
    { id: 'help', label: 'CONTROLS' },
  ];
  return Object.freeze({ items, sel: hasSave ? 1 : 0, t: 0 });
}

export function updateTitle(state, input, dt) {
  const { pressed } = input;
  const n = state.items.length;
  let sel = state.sel;
  const events = [];
  if (pressed.up) sel = (sel + n - 1) % n;
  if (pressed.down) sel = (sel + 1) % n;
  if (sel !== state.sel) events.push('mapStep');
  const chosen = pressed.confirm || pressed.jump || pressed.fire;
  return {
    state: { ...state, sel, t: state.t + dt },
    events: chosen ? ['select'] : events,
    action: chosen ? state.items[sel].id : null,
  };
}

export function renderTitle(ctx, state, gfx, time) {
  drawStarfield(ctx, time, 0.3);
  drawPlanet(ctx, 290, 170, 40);
  drawTextCentered(ctx, 'COMMANDER', SCREEN_W / 2, 18, 'B', { scale: 2, shadow: 1 });
  drawLogo(ctx, 'DOOM', SCREEN_W / 2, 38, 6, drawTextCentered);
  drawTextCentered(ctx, 'EPISODE ONE: MAROONED ON PHOBOS', SCREEN_W / 2, 90, 'F');

  const hero = gfx.sprite('hero.shoot_stand', 1);
  ctx.drawImage(hero, 40, 128, 32, 48);
  const imp = gfx.sprite('imp.walkA', -1);
  ctx.drawImage(imp, 238, 128, 32, 48);

  state.items.forEach((item, i) => {
    const y = 112 + i * 14;
    const selected = i === state.sel;
    drawTextCentered(ctx, item.label, SCREEN_W / 2, y, selected ? 'E' : 7);
    if (selected && Math.floor(time * 3) % 2 === 0) drawText(ctx, '>', SCREEN_W / 2 - 58, y, 'C');
  });
  drawTextCentered(ctx, 'ARROWS MOVE  Z JUMP  X POGO  SPACE FIRE', SCREEN_W / 2, 180, 8);
  drawTextCentered(ctx, 'A FAN TRIBUTE TO KEEN AND DOOM', SCREEN_W / 2, 190, 8);
}
