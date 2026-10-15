// Prints each level with reachable standing spots marked, and reports
// whether the exit (and every item) can be reached. `npm run check-levels [id]`
import { LEVELS, requiresPogoFromStart } from '../src/levels/index.js';
import { parseLevel, tileAt } from '../src/game/level.js';
import { analyzeLevel } from '../src/game/reachability.js';

const only = process.argv[2];
let failed = false;

Object.values(LEVELS)
  .filter((def) => !only || def.id === only)
  .forEach((def) => {
    const level = parseLevel(def);
    const r = analyzeLevel(level, { pogo: requiresPogoFromStart(def.id) });
    const rows = [];
    for (let y = 0; y < level.height; y++) {
      let row = '';
      for (let x = 0; x < level.width; x++) {
        const ent = level.entities.find((e) => e.tx === x && e.ty === y);
        const ch = tileAt(level, x, y);
        if (ent) row += ent.cat === 'enemy' ? '!' : '$';
        else if (r.visited.has(`${x},${y}`)) row += 'o';
        else if (ch === '.' && r.touched.has(`${x},${y}`)) row += ',';
        else row += ch;
      }
      rows.push(row);
    }
    console.log(`\n=== ${def.id} ${def.name} — exit ${r.exitReachable ? 'REACHABLE' : 'UNREACHABLE'} keys=${JSON.stringify(r.keys)} pogo=${r.pogo}`);
    console.log(rows.join('\n'));
    if (r.unreachableItems.length) {
      console.log('Unreachable items:', r.unreachableItems.map((e) => `${e.kind}@${e.tx},${e.ty}`).join(' '));
    }
    if (!r.exitReachable) failed = true;
  });

process.exitCode = failed ? 1 : 0;
