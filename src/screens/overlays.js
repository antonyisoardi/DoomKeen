// Pause-style overlays: status screen, controls help and yes/no prompts.
import { SCREEN_W } from '../core/constants.js';
import { drawText, drawTextCentered } from '../core/font.js';
import { drawBox, drawMessageBox, fillRect } from '../ui/box.js';
import { RULES } from '../core/constants.js';
import { PART_NAMES } from '../game/session.js';

export const HELP_LINES = Object.freeze([
  'ARROWS / WASD .... MOVE',
  'Z ................ JUMP (HOLD = HIGHER)',
  'X OR ALT ......... POGO ON / OFF',
  'SPACE OR C ....... FIRE PLASMA PISTOL',
  'ENTER ............ STATUS SCREEN',
  'ESC .............. QUIT LEVEL / MENU',
  'M ................ MUSIC / SOUND ON / OFF',
  '',
  'STOMP ZOMBIEMEN TO STUN THEM.',
  'EVERYTHING ELSE KILLS ON TOUCH.',
  'GRAB KEYCARDS TO OPEN DOORS.',
]);

export function renderHelp(ctx) {
  drawMessageBox(ctx, HELP_LINES, { title: 'CONTROLS' });
}

export function renderConfirm(ctx, lines) {
  drawMessageBox(ctx, lines, { footer: 'PRESS Y OR N' });
}

// Keen 1's status screen, Doom flavoured.
export function renderStatus(ctx, session, keys, gfx) {
  const x = 28;
  const y = 14;
  const w = SCREEN_W - 56;
  drawBox(ctx, x, y, w, 178);
  drawTextCentered(ctx, 'COMMANDER DOOM STATUS', SCREEN_W / 2, y + 8, 4);
  const row = (label, value, i, color = 0) => {
    drawText(ctx, label, x + 12, y + 24 + i * 12, 1);
    drawText(ctx, String(value), x + 140, y + 24 + i * 12, color);
  };
  row('SCORE', session.score, 0);
  row('EXTRA LIFE AT', session.nextExtraLife, 1);
  row('LIVES', session.lives, 2);
  row('PLASMA CHARGES', session.ammo, 3);
  row('POGO STICK', session.hasPogo ? 'YES' : 'NO', 4);

  drawText(ctx, 'KEYCARDS', x + 12, y + 84, 1);
  [['red', 'keyRed'], ['blue', 'keyBlue'], ['yellow', 'keyYellow']].forEach(([name, item], i) => {
    const art = gfx.item(item);
    if (keys && keys[name]) ctx.drawImage(art, x + 136 + i * 20, y + 78);
    else fillRect(ctx, x + 141 + i * 20, y + 85, 8, 2, 7);
  });

  drawText(ctx, 'MEGAROCKET PARTS', x + 12, y + 104, 1);
  [1, 2, 3, 4].forEach((n, i) => {
    const px = x + 24 + i * 52;
    const have = session.parts.includes(n);
    fillRect(ctx, px - 2, y + 114, 20, 20, have ? 'A' : 7);
    fillRect(ctx, px - 1, y + 115, 18, 18, 'F');
    if (have) ctx.drawImage(gfx.item(`part${n}`), px, y + 116);
    else drawText(ctx, '?', px + 6, y + 121, 8);
  });
  const names = Object.values(PART_NAMES).map((n) => n.split(' ').pop());
  names.forEach((n, i) => drawText(ctx, n.slice(0, 8), x + 16 + i * 52, y + 138, session.parts.includes(i + 1) ? 2 : 8));
  drawTextCentered(ctx, `${session.parts.length} OF ${RULES.partsNeeded} PARTS FOUND`, SCREEN_W / 2, y + 152, 0);
  drawTextCentered(ctx, 'PRESS A KEY', SCREEN_W / 2, y + 162, 8);
}
