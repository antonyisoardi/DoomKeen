// Starfield + Mars backdrop shared by the title, story and ending screens.
import { SCREEN_W, SCREEN_H } from '../core/constants.js';
import { egaColor } from '../core/palette.js';
import { hashRand } from '../gfx/painter.js';

const rnd = hashRand(1993);
const STARS = Array.from({ length: 70 }, () => ({
  x: Math.floor(rnd() * SCREEN_W),
  y: Math.floor(rnd() * SCREEN_H),
  c: rnd() < 0.2 ? 'F' : rnd() < 0.5 ? '7' : '8',
  s: 4 + rnd() * 12,
}));

export function drawStarfield(ctx, time, scroll = 0) {
  ctx.fillStyle = egaColor(0);
  ctx.fillRect(0, 0, SCREEN_W, SCREEN_H);
  STARS.forEach((s) => {
    ctx.fillStyle = egaColor(s.c);
    const x = ((s.x - time * s.s * scroll) % SCREEN_W + SCREEN_W) % SCREEN_W;
    ctx.fillRect(Math.floor(x), s.y, 1, 1);
  });
}

export function drawPlanet(ctx, cx, cy, r) {
  for (let y = -r; y <= r; y++) {
    const half = Math.floor(Math.sqrt(r * r - y * y));
    ctx.fillStyle = egaColor(y < -r / 3 ? 'C' : y < r / 3 ? '4' : '6');
    ctx.fillRect(cx - half, cy + y, half * 2, 1);
  }
  ctx.fillStyle = egaColor('6');
  [[-r / 3, -r / 4, 4], [r / 4, r / 5, 6], [-r / 6, r / 2, 3]].forEach(([dx, dy, s]) => {
    ctx.fillRect(Math.round(cx + dx), Math.round(cy + dy), s, Math.ceil(s / 2));
  });
}

// Big yellow-to-red "DOOM"-style logo text.
export function drawLogo(ctx, text, cx, y, scale, drawTextCentered) {
  drawTextCentered(ctx, text, cx + scale, y + scale, 4, { scale });
  drawTextCentered(ctx, text, cx, y, 'C', { scale });
  ctx.save();
  ctx.beginPath();
  ctx.rect(0, y, SCREEN_W, Math.round(7 * scale * 0.4));
  ctx.clip();
  drawTextCentered(ctx, text, cx, y, 'E', { scale });
  ctx.restore();
}
