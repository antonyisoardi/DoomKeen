// Keen-style message boxes and the in-level score box.
import { egaColor } from '../core/palette.js';
import { drawText, drawTextCentered, GLYPH_H } from '../core/font.js';
import { SCREEN_W, SCREEN_H } from '../core/constants.js';

export function fillRect(ctx, x, y, w, h, c) {
  ctx.fillStyle = egaColor(c);
  ctx.fillRect(x, y, w, h);
}

// White Keen 1 dialog box with a double border.
export function drawBox(ctx, x, y, w, h) {
  fillRect(ctx, x - 1, y - 1, w + 2, h + 2, 0);
  fillRect(ctx, x, y, w, h, 'F');
  fillRect(ctx, x + 2, y + 2, w - 4, h - 4, 1);
  fillRect(ctx, x + 3, y + 3, w - 6, h - 6, 'F');
}

export function drawMessageBox(ctx, lines, { title = null, footer = 'PRESS A KEY', titleColor = 4 } = {}) {
  const all = [...(title ? [title, ''] : []), ...lines, ...(footer ? ['', footer] : [])];
  const longest = Math.max(...all.map((l) => l.length));
  const w = Math.min(SCREEN_W - 16, longest * 6 + 20);
  const h = all.length * (GLYPH_H + 1) + 16;
  const x = Math.round((SCREEN_W - w) / 2);
  const y = Math.round((SCREEN_H - h) / 2);
  drawBox(ctx, x, y, w, h);
  all.forEach((line, i) => {
    const isTitle = title && i === 0;
    const isFooter = footer && i === all.length - 1;
    const color = isTitle ? titleColor : isFooter ? 8 : 0;
    drawTextCentered(ctx, line, SCREEN_W / 2, y + 9 + i * (GLYPH_H + 1), color);
  });
}

export function drawPanel(ctx, x, y, w, h) {
  fillRect(ctx, x, y, w, h, 0);
  fillRect(ctx, x, y, w, 1, 8);
  fillRect(ctx, x, y + h - 1, w, 1, 8);
  fillRect(ctx, x, y, 1, h, 8);
  fillRect(ctx, x + w - 1, y, 1, h, 8);
}

export function drawHud(ctx, session, keys, gfx) {
  drawPanel(ctx, 2, 2, 132, 22);
  drawText(ctx, String(session.score).padStart(8, '0'), 6, 5, 'C');
  const helmet = gfx.sprite('hero.stand_stand', 1);
  ctx.drawImage(helmet, 0, 0, 16, 9, 58, 4, 16, 9);
  drawText(ctx, `x${session.lives}`, 74, 5, 'F');
  const plasma = gfx.sprite('plasma', 1);
  ctx.drawImage(plasma, 98, 6);
  drawText(ctx, String(session.ammo), 108, 5, 'B');
  const keyColors = { red: 'C', blue: '9', yellow: 'E' };
  Object.entries(keyColors).forEach(([name, color], i) => {
    if (keys && keys[name]) fillRect(ctx, 6 + i * 8, 15, 6, 4, color);
  });
  if (session.hasPogo) drawText(ctx, 'POGO', 34, 14, 7);
  drawText(ctx, `PARTS ${session.parts.length}/4`, 64, 14, 'A');
}
