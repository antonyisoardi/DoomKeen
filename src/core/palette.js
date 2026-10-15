// The 16-colour EGA palette Commander Keen 1 was drawn with.
// Sprite strings use one hex digit per pixel (0-F) and '.' for transparency.
export const EGA = Object.freeze([
  '#000000', '#0000aa', '#00aa00', '#00aaaa',
  '#aa0000', '#aa00aa', '#aa5500', '#aaaaaa',
  '#555555', '#5555ff', '#55ff55', '#55ffff',
  '#ff5555', '#ff55ff', '#ffff55', '#ffffff',
]);

export function egaColor(c) {
  const index = typeof c === 'number' ? c : parseInt(c, 16);
  const value = EGA[index];
  if (value === undefined) throw new Error(`Invalid EGA colour: ${c}`);
  return value;
}

export function egaRgb(c) {
  const hex = egaColor(c);
  return [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
}
