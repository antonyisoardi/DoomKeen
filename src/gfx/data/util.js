// Pure helpers for pixel-string sprites (no DOM needed, so they're unit-testable).

export function remap(rows, mapping) {
  return rows.map((row) => [...row].map((ch) => mapping[ch] ?? ch).join(''));
}

// Centre rows horizontally and bottom-align them inside a w x h box,
// leaving `bottomGap` blank rows underneath.
export function padTo(rows, w, h, bottomGap = 1) {
  const rw = rows[0].length;
  if (rw > w || rows.length + bottomGap > h) throw new Error(`Sprite ${rw}x${rows.length} too big for ${w}x${h}`);
  const left = Math.floor((w - rw) / 2);
  const right = w - rw - left;
  const blank = '.'.repeat(w);
  const body = rows.map((r) => '.'.repeat(left) + r + '.'.repeat(right));
  const top = h - rows.length - bottomGap;
  return [...Array(top).fill(blank), ...body, ...Array(bottomGap).fill(blank)];
}

export function flipRowsV(rows) {
  return [...rows].reverse();
}
