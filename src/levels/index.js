// Episode 1: Knee-Deep in the Dead (on a pogo stick).
import e1m1 from './e1m1.js';
import e1m2 from './e1m2.js';
import e1m3 from './e1m3.js';
import e1m4 from './e1m4.js';
import e1m5 from './e1m5.js';
import e1m6 from './e1m6.js';
import e1m7 from './e1m7.js';
import e1m8 from './e1m8.js';

export const LEVELS = Object.freeze({ e1m1, e1m2, e1m3, e1m4, e1m5, e1m6, e1m7, e1m8 });
export const LEVEL_ORDER = Object.freeze(Object.keys(LEVELS));

// Levels beyond E1M2 sit behind the force field E1M2 opens, so the pogo stick is guaranteed.
export const requiresPogoFromStart = (id) => LEVEL_ORDER.indexOf(id) >= 2;
