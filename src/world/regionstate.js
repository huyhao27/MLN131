// Region mode world state (pure JS, also used by scripts/validate-world.mjs).
// setRegions(view.regions) is folded into the same normalized state S the classic rules
// read: S.mode = 'regions', S.R[id] = per-region values, and the six classic metrics become
// national averages. Every prop / mover carries the region it stands in (p.region); its
// show(S) rule is evaluated against localState(S, p.region), where the classic metrics are
// replaced by that region's own indicators. So the classic rules (lamps with LAW, market
// stalls with LIFE, cranes with PROD ...) react to the region they stand in, and the
// region-only rules (layout.js: rShort, rBuilt, rWorks ...) read S.R directly.
import { REGION_IDS } from './regiongeo.js';

// Service ids from the sim, folded into a few visual families.
const SERVICE_FAMILY = {
  water: 'water', irrigation: 'water', available_water: 'water',
  power: 'power', electricity: 'power', energy: 'power',
  transport: 'transport', logistics: 'transport', freight: 'transport', port: 'transport', shipping: 'transport', cargo: 'transport', storage: 'transport', outlet: 'transport', goods: 'transport',
  components: 'components', parts: 'components',
  road: 'road', roads: 'road', access: 'road', connection: 'road', link: 'road',
  housing: 'housing', homes: 'housing', home: 'housing',
  care: 'care', health: 'care', clinic: 'care', childcare: 'care', healthcare: 'care', medical: 'care',
  food: 'food', supply: 'food',
  jobs: 'jobs', labor: 'jobs', labour: 'jobs', work: 'jobs', workers: 'jobs', skills: 'jobs', portlabor: 'jobs',
};
export const serviceFamily = (id) => SERVICE_FAMILY[String(id).toLowerCase()] ?? String(id).toLowerCase();

// Built works that switch on classic flags inside their own region (the classic props for
// those flags then appear there: kindergarten + elder home, wind turbine, bunting ...).
const BUILT_FLAGS = {
  care_center: ['CARE_INFRASTRUCTURE'],
  care_point: ['CARE_INFRASTRUCTURE'],
  community_road: ['REGION_PARTICIPATION'],
  market: ['COALITION_BUILT'],
  heat_link: ['ECON_BALANCED'],
  power_reserve: ['ECON_BALANCED'],
  canal: ['ECON_BALANCED'],
  cold_storage: ['ECON_BALANCED'],
  training: ['COALITION_BUILT'],
  clinic: ['REGION_PARTICIPATION'],
  road_vc: ['REGION_PARTICIPATION'],
};

const num = (v, d) => (Number.isFinite(Number(v)) ? Math.max(0, Math.min(100, Number(v))) : d);

export function emptyRegion(id) {
  return { id, status: 'stable', output: 55, wellbeing: 55, access: 55, short: new Set(), tight: new Set(), projects: 0, built: new Set(), builtList: [] };
}

// view.regions (array) -> { CN: {...}, ... } with every region present.
export function normalizeRegions(list, prev = null) {
  const R = {};
  for (const id of REGION_IDS) R[id] = prev?.[id] ? { ...prev[id] } : emptyRegion(id);
  for (const r of Array.isArray(list) ? list : []) {
    if (!r || !R[r.id]) continue;
    const o = R[r.id];
    o.status = ['urgent', 'attention', 'opportunity', 'stable'].includes(r.status) ? r.status : 'stable';
    const ind = r.indicators ?? {};
    o.output = num(ind.output, o.output);
    o.wellbeing = num(ind.wellbeing, o.wellbeing);
    o.access = num(ind.access, o.access);
    o.short = new Set();
    o.tight = new Set();
    for (const s of Array.isArray(r.services) ? r.services : []) {
      if (!s) continue;
      const fam = serviceFamily(s.id);
      if (s.status === 'short') o.short.add(fam);
      else if (s.status === 'tight') o.tight.add(fam);
    }
    o.projects = Array.isArray(r.projects) ? r.projects.length : 0;
    o.builtList = Array.isArray(r.built) ? r.built.map(String) : [];
    o.built = new Set(o.builtList);
  }
  return R;
}

const avg = (R, k) => REGION_IDS.reduce((a, id) => a + R[id][k], 0) / REGION_IDS.length;

// National classic metrics in region mode (for things that belong to no single region:
// ring-road traffic, global light and post-processing).
export function nationalMetrics(R) {
  const out = avg(R, 'output'), life = avg(R, 'wellbeing'), acc = avg(R, 'access');
  const lifes = REGION_IDS.map((id) => R[id].wellbeing);
  const gap = Math.max(...lifes) - Math.min(...lifes);
  return {
    PROD: out, LIFE: life, LAW: acc, TRUST: (life + acc) / 2,
    EQUITY: Math.max(0, Math.min(100, 100 - gap * 1.4 - (100 - life) * 0.3)), COHESION: life * 0.6 + acc * 0.4,
  };
}

// The state a prop in region `id` sees.
export function localState(S, id) {
  if (S.mode !== 'regions' || !id || !S.R?.[id]) return S;
  S.local ??= {};
  let L = S.local[id];
  if (L) return L;
  const r = S.R[id];
  const flags = new Set();
  for (const k of r.built) for (const f of BUILT_FLAGS[k] ?? []) flags.add(f);
  // The classic "overheating" scaffolds and cranes become this region's building sites.
  if (r.projects > 0) flags.add('ECON_OVERHEAT');
  if (r.status === 'opportunity' && r.wellbeing >= 55) flags.add('CONSULT_REAL');
  L = {
    ...S,
    PROD: r.output,
    LIFE: r.wellbeing,
    LAW: r.access,
    TRUST: (r.wellbeing + r.access) / 2,
    EQUITY: (r.wellbeing * 0.5 + r.access * 0.5),
    COHESION: r.wellbeing * 0.7 + r.access * 0.3,
    flags,
    // Finished housing in a region plays the role of the later classic years (extra blocks).
    year: r.built.has('housing') ? 8 : 1,
    region: id,
  };
  S.local[id] = L;
  return L;
}

// Build the region-mode S from the previous S and view.regions.
export function regionWorldState(prevS, list) {
  const R = normalizeRegions(list, prevS?.R);
  return { ...prevS, ...nationalMetrics(R), flags: new Set(), year: 1, mode: 'regions', R, local: undefined };
}
