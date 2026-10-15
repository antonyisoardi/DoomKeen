// Procedural 16x16 level tiles: UAC tech base, nukage plant and Hell themes.
import { paint, hashRand } from './painter.js';

const S = 16;
const tile = (draw) => paint(S, S, draw);

const THEME_TRIM = { tech: '6', nukage: '2', hell: '4' };

function techWall(trim) {
  return tile((p) => {
    p.rect(0, 0, S, S, '8');
    p.rect(1, 1, 14, 14, '7');
    p.hline(1, 1, 14, 'F');
    p.vline(1, 1, 14, 'F');
    p.hline(1, 14, 14, '8');
    p.vline(14, 1, 14, '8');
    p.rect(1, 6, 14, 4, trim);
    p.hline(1, 6, 14, '0');
    p.hline(1, 9, 14, '0');
    [[3, 3], [12, 3], [3, 12], [12, 12]].forEach(([x, y]) => p.px(x, y, '8'));
  });
}

function brick() {
  return tile((p) => {
    p.rect(0, 0, S, S, '4');
    p.hline(0, 7, S, '0');
    p.hline(0, 15, S, '0');
    p.vline(7, 0, 7, '0');
    p.vline(3, 8, 7, '0');
    p.vline(12, 8, 7, '0');
    p.hline(0, 0, 7, 'C');
    p.hline(8, 0, 8, 'C');
    p.hline(0, 8, 3, 'C');
    p.hline(4, 8, 8, 'C');
    p.hline(13, 8, 3, 'C');
    const rnd = hashRand(7);
    for (let i = 0; i < 6; i++) p.px(Math.floor(rnd() * S), Math.floor(rnd() * S), '6');
  });
}

function marble() {
  return tile((p) => {
    p.rect(0, 0, S, S, '2');
    p.hline(0, 0, S, 'A');
    p.vline(0, 0, S, 'A');
    p.hline(0, 15, S, '0');
    p.vline(15, 0, S, '0');
    [[2, 3], [3, 4], [4, 4], [5, 5], [6, 7], [7, 8], [9, 8], [10, 9], [11, 11], [12, 12]].forEach(([x, y]) => p.px(x, y, 'A'));
    [[8, 2], [9, 3], [10, 3], [4, 10], [5, 11], [5, 12]].forEach(([x, y]) => p.px(x, y, '0'));
  });
}

function girder() {
  return tile((p) => {
    p.rect(0, 0, S, S, '8');
    p.hline(0, 0, S, 'F');
    p.hline(0, 1, S, '7');
    p.hline(0, 14, S, '7');
    p.hline(0, 15, S, '0');
    for (let i = 0; i < 12; i++) {
      p.px(2 + i, 2 + i, '7');
      p.px(13 - i, 2 + i, '7');
    }
    [[1, 3], [14, 3], [1, 12], [14, 12]].forEach(([x, y]) => p.px(x, y, 'E'));
  });
}

function grate() {
  return tile((p) => {
    p.hline(0, 0, S, 'F');
    p.rect(0, 1, S, 3, '7');
    for (let x = 1; x < S; x += 3) p.px(x, 2, '0');
    p.hline(0, 4, S, '8');
    p.vline(2, 5, 2, '8');
    p.vline(13, 5, 2, '8');
  });
}

function liquid(base, foam, deep, frame) {
  return tile((p) => {
    p.rect(0, 4, S, 12, base);
    for (let x = 0; x < S; x++) {
      const up = (x + frame * 2) % 8 < 4;
      p.rect(x, up ? 3 : 4, 1, 2, foam);
    }
    p.px((3 + frame * 4) % S, 8, foam);
    p.px((11 + frame * 5) % S, 12, foam);
    p.px((7 + frame * 3) % S, 14, deep);
    p.hline(0, 15, S, deep);
  });
}

function spikes() {
  return tile((p) => {
    for (let i = 0; i < 4; i++) {
      const x = i * 4;
      p.vline(x + 1, 9, 6, '7');
      p.vline(x + 2, 5, 10, 'F');
      p.vline(x + 3, 9, 6, '8');
      p.px(x + 2, 4, '7');
    }
    p.rect(0, 14, S, 2, '8');
  });
}

function door(color) {
  return tile((p) => {
    p.rect(0, 0, S, S, '7');
    p.vline(0, 0, S, color);
    p.vline(1, 0, S, color);
    p.vline(14, 0, S, color);
    p.vline(15, 0, S, color);
    p.vline(2, 0, S, '0');
    p.vline(13, 0, S, '0');
    p.hline(3, 3, 10, '8');
    p.hline(3, 12, 10, '8');
    p.rect(6, 6, 4, 4, color);
    p.hline(6, 6, 4, 'F');
  });
}

const LETTERS = {
  E: ['111', '100', '110', '100', '111'],
  X: ['101', '101', '010', '101', '101'],
  I: ['111', '010', '010', '010', '111'],
  T: ['111', '010', '010', '010', '010'],
};

function exitTop() {
  return tile((p) => {
    p.rect(0, 0, S, 7, '0');
    ['E', 'X', 'I', 'T'].forEach((ch, i) => {
      LETTERS[ch].forEach((row, y) => [...row].forEach((b, x) => { if (b === '1') p.px(i * 4 + x, y + 1, 'C'); }));
    });
    p.rect(0, 8, S, 8, '8');
    p.rect(2, 9, 12, 7, '0');
    p.hline(2, 9, 12, '7');
  });
}

function exitBottom() {
  return tile((p) => {
    p.rect(0, 0, S, S, '8');
    p.rect(2, 0, 12, S, '0');
    p.vline(7, 0, S, '8');
    p.px(5, 8, 'E');
    p.px(10, 8, 'E');
  });
}

function bossGate(frame) {
  return tile((p) => {
    p.rect(0, 0, S, S, '0');
    for (let i = 0; i < 4; i++) {
      p.vline(1 + i * 4, 0, S, frame ? 'C' : '4');
      p.vline(2 + i * 4, 0, S, frame ? '4' : 'C');
    }
    p.hline(0, 0, S, '8');
    p.hline(0, 15, S, '8');
  });
}

function computer(frame) {
  return tile((p) => {
    p.rect(1, 2, 14, 12, '8');
    p.rect(2, 3, 12, 6, '0');
    const rnd = hashRand(frame + 3);
    const colors = ['A', 'C', 'E', 'B', '9'];
    for (let i = 0; i < 7; i++) p.px(3 + Math.floor(rnd() * 10), 4 + Math.floor(rnd() * 4), colors[i % colors.length]);
    p.rect(3, 10, 10, 2, '7');
    p.hline(1, 2, 14, '7');
  });
}

function light() {
  return tile((p) => {
    p.rect(4, 0, 8, 2, '8');
    p.rect(5, 2, 6, 1, 'F');
    p.rect(6, 3, 4, 1, 'E');
  });
}

function pipe() {
  return tile((p) => {
    p.rect(5, 0, 6, S, '8');
    p.vline(6, 0, S, '7');
    p.vline(7, 0, S, 'F');
    p.rect(4, 6, 8, 3, '7');
    p.hline(4, 6, 8, 'F');
  });
}

function torch(frame) {
  return tile((p) => {
    p.rect(7, 6, 2, 10, '8');
    p.rect(5, 14, 6, 2, '8');
    const flame = frame ? ['.E..', 'ECE.', 'C4C.', '.4..'] : ['..E.', '.ECE', '.C4C', '..4.'];
    p.pattern(6, 1, flame);
    p.rect(6, 5, 4, 1, '7');
  });
}

function background(theme) {
  return tile((p) => {
    p.rect(0, 0, S, S, '0');
    if (theme === 'hell') {
      const rnd = hashRand(11);
      for (let i = 0; i < 5; i++) p.px(Math.floor(rnd() * S), Math.floor(rnd() * S), '4');
      p.px(3, 9, '8');
      return;
    }
    const line = theme === 'nukage' ? '8' : '1';
    p.hline(0, 0, S, line);
    p.vline(0, 0, S, line);
    p.px(8, 8, line);
  });
}

// Returns { [theme]: { [key]: canvas[] } } where key is a tile char or a special key.
export function buildTileArt() {
  const shared = {
    '=': [girder()],
    B: [brick()],
    M: [marble()],
    '-': [grate()],
    '~': [0, 1, 2, 3].map((f) => liquid('2', 'A', '0', f)),
    '%': [0, 1, 2, 3].map((f) => liquid('4', 'E', 'C', f)),
    '^': [spikes()],
    R: [door('C')],
    U: [door('9')],
    Y: [door('E')],
    X: [bossGate(0), bossGate(1)],
    Etop: [exitTop()],
    Ebot: [exitBottom()],
    w: [computer(0), computer(1)],
    L: [light()],
    '|': [pipe()],
    T: [torch(0), torch(1)],
  };
  return Object.fromEntries(['tech', 'nukage', 'hell'].map((theme) => [
    theme,
    {
      ...shared,
      '#': [theme === 'hell' ? brick() : techWall(THEME_TRIM[theme])],
      bg: [background(theme)],
    },
  ]));
}
