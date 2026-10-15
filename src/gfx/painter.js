// Canvas helpers: turn pixel strings into canvases and give procedural art a
// tiny palette-indexed drawing API.
import { egaColor, egaRgb } from '../core/palette.js';

export function createCanvas(w, h) {
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  return { canvas, ctx: canvas.getContext('2d') };
}

export function fromRows(rows) {
  const h = rows.length;
  const w = rows[0].length;
  const { canvas, ctx } = createCanvas(w, h);
  const img = ctx.createImageData(w, h);
  rows.forEach((row, y) => {
    for (let x = 0; x < w; x++) {
      const ch = row[x];
      if (ch === '.' || ch === undefined) continue;
      const [r, g, b] = egaRgb(ch);
      const i = (y * w + x) * 4;
      img.data[i] = r;
      img.data[i + 1] = g;
      img.data[i + 2] = b;
      img.data[i + 3] = 255;
    }
  });
  ctx.putImageData(img, 0, 0);
  return canvas;
}

export function paint(w, h, draw) {
  const { canvas, ctx } = createCanvas(w, h);
  const rect = (x, y, rw, rh, c) => {
    ctx.fillStyle = egaColor(c);
    ctx.fillRect(x, y, rw, rh);
  };
  draw({
    w,
    h,
    rect,
    px: (x, y, c) => rect(x, y, 1, 1, c),
    hline: (x, y, len, c) => rect(x, y, len, 1, c),
    vline: (x, y, len, c) => rect(x, y, 1, len, c),
    clear: (x, y, rw, rh) => ctx.clearRect(x, y, rw, rh),
    pattern: (x, y, rows) => rows.forEach((row, dy) => {
      [...row].forEach((ch, dx) => { if (ch !== '.') rect(x + dx, y + dy, 1, 1, ch); });
    }),
  });
  return canvas;
}

function transformed(src, setup) {
  const { canvas, ctx } = createCanvas(src.width, src.height);
  setup(ctx, src);
  ctx.drawImage(src, 0, 0);
  return canvas;
}

export const flipH = (src) => transformed(src, (ctx) => { ctx.translate(src.width, 0); ctx.scale(-1, 1); });
export const flipV = (src) => transformed(src, (ctx) => { ctx.translate(0, src.height); ctx.scale(1, -1); });

// Solid-colour silhouette of a sprite (used for the "hit" flash).
export function silhouette(src, c = 'F') {
  const { canvas, ctx } = createCanvas(src.width, src.height);
  ctx.drawImage(src, 0, 0);
  ctx.globalCompositeOperation = 'source-in';
  ctx.fillStyle = egaColor(c);
  ctx.fillRect(0, 0, src.width, src.height);
  return canvas;
}

// Deterministic pseudo-random for procedural textures.
export function hashRand(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}
