// Tunable numbers for the region mode (doc 05 §3, §7). Design assumptions for
// gameplay, tuned with `npm run sim:regions` — not measured quantities.

export const REGION_ORDER = ['CN', 'NN', 'TT', 'DC', 'VC', 'CB'];
export const INDICATORS = ['output', 'wellbeing', 'access'];

export const CONFIG = {
  periods: 8,
  startBudget: 10,
  income: { base: 7, pivot: 50, step: 6, min: 3 },
  maxProjects: 2,
  draw: {
    firstPeriod: 2,
    chance: 0.85,
    // doc 04 §4 aims for 2–3 regions needing attention: when the map is calm
    // (at most this many root items open), a second event may be drawn.
    calmOpen: 1, secondChance: 0.6,
    attention: 4, // open root problems/opportunities on the map before new draws stop
    perRegion: 2,
    cooldown: 3, // periods a closed family rests
    maxConsequencesBeforeSkip: 2, // when this many consequences arrive, skip the root draw
    quietBoost: 1.6, // weight multiplier for regions with no event in the last 2 periods
    crisisDamp: 0.6, // weight multiplier for regions with an urgent problem
  },
  reservoir: { start: 72, rain: 12, max: 90 },
  // have/need below `short` is a shortage (penalised); below `tight` is shown as tight.
  tolerance: { short: 0.9, tight: 1.0 },
  recovery: 2, // indicator points per period toward potential when nothing pulls it down
  // A region that ends a period with no shortage and no undecided problem develops:
  // its potential rises a little (doc 04 §7: the country grows from its regions).
  develop: { output: 0.5, wellbeing: 0.5, access: 0.5, cap: 85 },
  consequenceDeadline: 2,
  maxDepth: 2, // decision layers one root may create (doc 05 §7)
  // Demand grows a little every period (more output, more people): infrastructure built
  // early pays off, and an untouched network drifts into shortages.
  growth: { 'pwDem.CN': 0.9, 'pwDem.DC': 0.4, housingNeed: 1.5, commuters: 0.8, healthNeed: 0.8, careNeed: 0.5, cnExport: 0.6, nnExport: 0.5, vcTrips: 0.3 },
};

// Base network parameters. Mods (`{ key, op, v }`) and built projects change them.
export const BASE_PARAMS = {
  // power
  plant: 45, plantMul: 1, hydroMax: 30, hydroMul: 1, reservePower: 0,
  pwDem: { CN: 32, TT: 12, DC: 12, CB: 8, NN: 3 },
  // water (reservoir-fed)
  waterBase: 48, waterExtra: 0,
  wDem: { NN: 34, DC: 8, VC: 5 },
  // goods and port
  portCap: 50, portLabor: 1, portStorm: 1,
  compImport: 14, supplyMul: 1, stockMax: 14,
  cnExport: 14, nnExport: 12, outletDomestic: 4, storage: 0,
  // roads
  roadNNCB: 24, roadNNDC: 16, bridge: 1, roadTTVC: 10, vcTrips: 6, vcService: 0,
  // people
  commuteCap: 32, commuters: 26,
  housingCap: 96, housingNeed: 90,
  careCap: 30, careNeed: 27,
  healthCap: 40, healthNeed: 34,
  food: 22, foodNeed: 20,
  portWorkers: 12,
};
