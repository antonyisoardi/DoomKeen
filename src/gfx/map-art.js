// Overworld (Phobos surface) art: terrain, UAC bunkers, force fields, the
// Megarocket and the top-down hero.
import { paint, hashRand } from './painter.js';

const S = 16;

function ground(variant) {
  return paint(S, S, (p) => {
    p.rect(0, 0, S, S, '6');
    const rnd = hashRand(variant * 97 + 5);
    for (let i = 0; i < 9; i++) p.px(Math.floor(rnd() * S), Math.floor(rnd() * S), i % 3 ? '4' : '8');
    if (variant === 3) p.px(Math.floor(rnd() * S), Math.floor(rnd() * S), 'E');
  });
}

function crater() {
  return paint(S, S, (p) => {
    p.rect(0, 0, S, S, '6');
    p.rect(3, 5, 10, 7, '8');
    p.rect(4, 4, 8, 9, '8');
    p.rect(4, 6, 8, 5, '4');
    p.rect(5, 5, 6, 7, '4');
    p.hline(5, 12, 6, 'C');
    p.hline(4, 3, 8, '0');
  });
}

function rock(variant) {
  return paint(S, S, (p) => {
    p.rect(0, 0, S, S, '8');
    const rnd = hashRand(variant * 31 + 9);
    for (let i = 0; i < 4; i++) {
      const x = Math.floor(rnd() * 12);
      const y = Math.floor(rnd() * 12);
      p.rect(x, y, 4, 3, '7');
      p.hline(x, y, 4, 'F');
      p.hline(x, y + 3, 4, '0');
    }
  });
}

function pool(base, foam, frame) {
  return paint(S, S, (p) => {
    p.rect(0, 0, S, S, base);
    for (let i = 0; i < 4; i++) p.hline((i * 5 + frame * 2) % 12, 2 + i * 4, 4, foam);
  });
}

function barrier(frame) {
  return paint(S, S, (p) => {
    p.rect(0, 0, S, S, '1');
    for (let x = 0; x < S; x += 4) p.vline((x + frame) % S, 0, S, frame % 2 ? 'B' : '9');
    p.rect(0, 0, 2, S, '8');
    p.rect(14, 0, 2, S, '8');
  });
}

function bunker(done) {
  return paint(S, S, (p) => {
    p.rect(0, 0, S, S, '6');
    p.rect(1, 3, 14, 12, '8');
    p.rect(2, 4, 12, 10, '7');
    p.hline(2, 4, 12, 'F');
    p.rect(6, 8, 4, 6, '0');
    p.rect(3, 6, 2, 2, done ? 'A' : 'C');
    p.rect(11, 6, 2, 2, done ? 'A' : 'C');
    p.rect(1, 1, 14, 2, '8');
    if (done) {
      p.vline(13, 0, 6, 'F');
      p.rect(9, 0, 4, 3, 'A');
    }
  });
}

function ship() {
  return paint(32, 24, (p) => {
    p.rect(4, 6, 22, 12, '8');
    p.rect(5, 7, 20, 10, '7');
    p.hline(5, 7, 20, 'F');
    p.rect(24, 9, 5, 6, '7');
    p.rect(28, 10, 2, 4, '8');
    p.rect(19, 9, 5, 4, 'B');
    p.hline(19, 9, 5, 'F');
    p.rect(1, 3, 6, 4, '4');
    p.rect(1, 17, 6, 4, '4');
    p.rect(0, 9, 4, 6, '8');
    p.rect(0, 10, 2, 4, 'E');
    p.rect(8, 11, 9, 2, 'C');
    p.rect(10, 18, 2, 4, '8');
    p.rect(18, 18, 2, 4, '8');
  });
}

function hero(dir, frame) {
  return paint(S, S, (p) => {
    const step = frame ? 1 : 0;
    if (dir === 'left' || dir === 'right') {
      p.rect(5, 11 + step, 3, 3, '6');
      p.rect(9, 12 - step, 3, 3, '6');
    } else {
      p.rect(4, 11 + step, 3, 4 - step, '6');
      p.rect(9, 11 + (1 - step), 3, 3 + step, '6');
    }
    p.rect(3, 6, 10, 7, '0');
    p.rect(4, 7, 8, 5, '2');
    p.rect(4, 7, 2, 5, 'A');
    p.rect(4, 1, 8, 7, '0');
    p.rect(5, 2, 6, 5, 'A');
    p.hline(5, 2, 6, 'F');
    if (dir === 'down') p.rect(5, 4, 6, 2, 'E');
    if (dir === 'up') p.rect(7, 3, 2, 4, '2');
    if (dir === 'left') { p.rect(4, 4, 3, 2, 'E'); p.rect(0, 9, 4, 2, '8'); }
    if (dir === 'right') { p.rect(9, 4, 3, 2, 'E'); p.rect(12, 9, 4, 2, '8'); }
  });
}

export function buildMapArt() {
  const heroFrames = {};
  ['down', 'up', 'left', 'right'].forEach((dir) => { heroFrames[dir] = [hero(dir, 0), hero(dir, 1)]; });
  return {
    ground: [0, 1, 2, 3].map(ground),
    crater: crater(),
    rock: [0, 1, 2].map(rock),
    nukage: [0, 1, 2, 3].map((f) => pool('2', 'A', f)),
    lava: [0, 1, 2, 3].map((f) => pool('4', 'E', f)),
    barrier: [0, 1, 2, 3].map(barrier),
    bunker: bunker(false),
    bunkerDone: bunker(true),
    ship: ship(),
    hero: heroFrames,
  };
}
