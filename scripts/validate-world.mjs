// Prove the diorama layout is physically coherent: no prop on a road, in water or inside
// another prop, vehicles on lanes, walkers off roads and buildings, boats on water.
// Covers the classic world states and region mode (every prop then sees its own region's
// values, see src/world/regionstate.js).
// Usage: node scripts/validate-world.mjs [--verbose]
import { buildProps, buildMovers } from '../src/world/layout.js';
import { validateLayout } from '../src/world/footprint.js';
import { regionWorldState, localState } from '../src/world/regionstate.js';
import { REGION_IDS } from '../src/world/regiongeo.js';

const METRICS = ['PROD', 'LIFE', 'TRUST', 'LAW', 'EQUITY', 'COHESION'];
const FLAGS = ['ECON_OVERHEAT', 'ECON_BALANCED', 'REGION_PARTICIPATION', 'CARE_INFRASTRUCTURE', 'COALITION_BUILT', 'LABOR_DIALOGUE', 'WAGE_SHOCK', 'CONSULT_REAL', 'RELIGION_FAIR_PROCESS'];
const st = (v, flags = [], year = 1) => ({ ...Object.fromEntries(METRICS.map((m) => [m, v])), flags: new Set(flags), year });

// Region mode: view.regions as the sim sends it.
const SERVICES = ['water', 'power', 'components', 'outlet', 'port', 'access', 'housing', 'care', 'health', 'food', 'labor'];
const BUILT = ['canal', 'power_reserve', 'cold_storage', 'cold_small', 'housing', 'care_center', 'care_point', 'green_space', 'clinic', 'road_vc', 'berth', 'bridge', 'bus_line', 'supplier', 'training', 'heat_link', 'heat_pilot', 'community_road', 'market'];
const regionCase = (v, { status = 'stable', short = false, built = [], projects = 0 } = {}) => {
  const regions = REGION_IDS.map((id) => ({
    id, status, indicators: { output: v, wellbeing: v, access: v },
    services: SERVICES.map((s) => ({ id: s, status: short ? 'short' : 'ok' })),
    projects: Array.from({ length: projects }, (_, i) => `j${i}`),
    built: typeof built === 'function' ? built(id) : built,
  }));
  const S = regionWorldState(st(50), regions);
  return { ...S, localFor: (p) => localState(S, p.region) };
};
// Every key finished in every region at once: the spare slots then show their first two.
const HOME = { CN: ['power_reserve', 'supplier', 'training', 'heat_link'], NN: ['canal'], TT: ['bridge', 'market'], DC: ['housing', 'care_center', 'green_space', 'bus_line'], VC: ['road_vc', 'clinic'], CB: ['berth', 'cold_storage'] };

const props = buildProps();
const movers = buildMovers();
const cases = [
  ['every prop that can ever appear', undefined],
  ['all low', st(5)],
  ['all mid', st(50, [], 4)],
  ['all high', st(95, [], 8)],
  ['all high + all flags', st(95, FLAGS, 8)],
  ['all low + all flags', st(5, FLAGS, 8)],
  ['regions: calm, nothing built', regionCase(55)],
  ['regions: low, everything short, 2 works each', regionCase(10, { status: 'urgent', short: true, projects: 2 })],
  ['regions: high, home works built', regionCase(92, { status: 'opportunity', built: (id) => HOME[id] })],
  ['regions: every key built everywhere', regionCase(70, { built: BUILT, projects: 1 })],
  ['regions: short + built + works', regionCase(40, { status: 'attention', short: true, built: (id) => HOME[id], projects: 2 })],
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
