// Prove the diorama layout is physically coherent: no prop on a road, in water or inside
// another prop, vehicles on lanes, walkers off roads and buildings, boats on water.
// Usage: node scripts/validate-world.mjs [--verbose]
import { buildProps, buildMovers } from '../src/world/layout.js';
import { validateLayout } from '../src/world/footprint.js';

const METRICS = ['PROD', 'LIFE', 'TRUST', 'LAW', 'EQUITY', 'COHESION'];
const FLAGS = ['ECON_OVERHEAT', 'ECON_BALANCED', 'REGION_PARTICIPATION', 'CARE_INFRASTRUCTURE', 'COALITION_BUILT', 'LABOR_DIALOGUE', 'WAGE_SHOCK', 'CONSULT_REAL', 'RELIGION_FAIR_PROCESS'];
const st = (v, flags = [], year = 1) => ({ ...Object.fromEntries(METRICS.map((m) => [m, v])), flags: new Set(flags), year });

const props = buildProps();
const movers = buildMovers();
const cases = [
  ['every prop that can ever appear', undefined],
  ['all low', st(5)],
  ['all mid', st(50, [], 4)],
  ['all high', st(95, [], 8)],
  ['all high + all flags', st(95, FLAGS, 8)],
  ['all low + all flags', st(5, FLAGS, 8)],
];
let total = 0;
for (const [label, state] of cases) {
  const { overlaps, counts } = validateLayout(props, movers, { state });
  total += overlaps.length;
  console.log(`${overlaps.length === 0 ? 'OK  ' : 'FAIL'} ${label}: ${overlaps.length} overlaps (${counts.props} props, ${counts.movers} movers)`);
  if (overlaps.length && (process.argv.includes('--verbose') || state === undefined)) {
    for (const o of overlaps) console.log('   ', o.type, o.a, o.b ?? '', o.at ? `at ${o.at}` : '', o.d ?? '');
  }
}
process.exit(total ? 1 : 0);
