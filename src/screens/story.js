// Paged story text (intro and ending share this).
import { SCREEN_W, SCREEN_H } from '../core/constants.js';
import { drawTextCentered } from '../core/font.js';
import { drawStarfield, drawPlanet } from './backdrop.js';

export const INTRO_PAGES = Object.freeze([
  [
    'BILLY BLAZE\'S GRANDSON WAS ON A',
    'UAC SCHOOL TRIP TO PHOBOS WHEN',
    'THE TELEPORTER EXPERIMENTS WENT',
    'HORRIBLY, HORRIBLY WRONG.',
    '',
    'SOMETHING CAME THROUGH THE GATE.',
  ],
  [
    'THE DEMONS RANSACKED THE HANGAR',
    'AND STOLE FOUR PARTS FROM HIS',
    'BEAN-WITH-BACON MEGAROCKET:',
    '',
    'THE FUSION BATTERY, THE NAV',
    'JOYSTICK, THE PLASMA MANIFOLD',
    'AND THE ARGENT FUEL CELL.',
  ],
  [
    'ARMED WITH A PLASMA PISTOL AND',
    'A FOOTBALL HELMET, OUR HERO',
    'BECOMES...',
    '',
    'COMMANDER DOOM!',
    '',
    'FIND THE PARTS. GET HOME BEFORE',
    'MOM NOTICES.',
  ],
]);

export const ENDING_PAGES = Object.freeze([
  [
    'WITH THE LAST PART BOLTED IN,',
    'THE MEGAROCKET ROARS TO LIFE.',
    '',
    'COMMANDER DOOM BLASTS OFF FROM',
    'PHOBOS, LEAVING THE DEMONS TO',
    'FIGHT OVER THE VENDING MACHINES.',
  ],
  [
    'BUT AS THE SHIP CLIMBS INTO',
    'ORBIT, HE NOTICES SOMETHING',
    'STRANGE...',
    '',
    'DEIMOS, PHOBOS\'S SISTER MOON,',
    'HAS VANISHED!',
  ],
  [
    'TO BE CONTINUED IN',
    '',
    'EPISODE TWO:',
    'THE SHORES OF HELL',
    '',
    '',
    'THANKS FOR PLAYING!',
  ],
]);

export function createStory(pages, kind = 'intro') {
  return Object.freeze({ pages, page: 0, t: 0, kind });
}

export function updateStory(state, input, dt) {
  const { pressed } = input;
  const next = pressed.confirm || pressed.jump || pressed.fire;
  if (pressed.back) return { state, events: ['select'], action: 'done' };
  if (!next || state.t < 0.25) return { state: { ...state, t: state.t + dt }, events: [], action: null };
  if (state.page + 1 >= state.pages.length) return { state, events: ['select'], action: 'done' };
  return { state: { ...state, page: state.page + 1, t: 0 }, events: ['select'], action: null };
}

export function renderStory(ctx, state, gfx, time) {
  drawStarfield(ctx, time, state.kind === 'ending' ? 2 : 0.2);
  if (state.kind === 'ending') {
    const ship = gfx.map.ship;
    const x = 40 + ((time * 30) % 260);
    ctx.drawImage(ship, Math.round(x), 30 + Math.round(Math.sin(time * 3) * 3));
  } else {
    drawPlanet(ctx, SCREEN_W / 2, 30, 22);
  }
  state.pages[state.page].forEach((line, i) => {
    drawTextCentered(ctx, line, SCREEN_W / 2, 70 + i * 11, line === 'COMMANDER DOOM!' ? 'C' : 'F');
  });
  drawTextCentered(ctx, `PAGE ${state.page + 1}/${state.pages.length} - PRESS ENTER`, SCREEN_W / 2, SCREEN_H - 12, 8);
}
