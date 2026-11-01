#!/usr/bin/env node
// Exhaustive search with random events off: walks every decision path
// (main, consequence, fallback and repair choices) via act()/undo() and reports
// the ending distribution plus dominant / dominated first-year choices.
//   npm run exhaustive
import { createGame } from '../src/sim/index.js';

const CHOICE = new Set(['event', 'consequence', 'finalRepair']);
const game = createGame({ seed: 1, randomEvents: false, emit: false });

const endings = {};
const byFirst = {}; // Y1 choice -> ending counts
const bestPath = { E1: null };
let leaves = 0;

function walk(path) {
  const v = game.view();
  if (v.phase === 'end') {
    leaves++;
    const e = v.ending.id + (v.ending.variant ? `:${v.ending.variant}` : '');
    endings[e] = (endings[e] || 0) + 1;
    const first = path[0];
    (byFirst[first] ||= {})[v.ending.id] = (byFirst[first][v.ending.id] || 0) + 1;
    if (v.ending.id === 'E1' && !bestPath.E1) bestPath.E1 = path.join(' ');
    return;
  }
  const opts = v.options.filter((o) => !o.disabled);
  if (!CHOICE.has(v.phase)) {
    game.act(opts[0].id);
    walk(path);
    game.undo();
    return;
  }
  for (const o of opts) {
    game.act(o.id);
    walk([...path, o.id]);
    game.undo();
  }
}

const t0 = Date.now();
game.act('start');
walk([]);
const pct = (n) => `${((100 * n) / leaves).toFixed(1)}%`;
console.log(`Exhaustive (random off): ${leaves} complete paths in ${((Date.now() - t0) / 1000).toFixed(1)}s`);
for (const [e, n] of Object.entries(endings).sort()) console.log(`  ${e.padEnd(12)} ${String(n).padStart(7)}  ${pct(n)}`);
console.log('\nEnding share by Y1 choice:');
for (const [c, d] of Object.entries(byFirst)) {
  const tot = Object.values(d).reduce((a, b) => a + b, 0);
  console.log(`  ${c.padEnd(8)} ${Object.entries(d).sort().map(([e, n]) => `${e}=${((100 * n) / tot).toFixed(0)}%`).join(' ')}`);
}
console.log(`\nSample E1 path: ${bestPath.E1 || '(none)'}`);
if (!endings.E1) process.exit(1);
