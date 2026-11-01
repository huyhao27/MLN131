// Hand-authored map of the fictional island republic "Hoa Minh".
// x grows east (screen right), z grows south (toward the camera). Units ~ meters x 10.
import { makeRng, fbm2 } from '../core/rng.js';
import { Occupancy, settle, footOf } from './footprint.js';
import { regionAt, REGION_IDS } from './regiongeo.js';

// ---------- state rules ----------
// A rule maps the normalized world state S -> 0..1 (visibility target of a prop).
export const above = (k, v) => (S) => (S[k] >= v ? 1 : 0);
export const below = (k, v) => (S) => (S[k] < v ? 1 : 0);
export const flag = (f) => (S) => (S.flags.has(f) ? 1 : 0);
export const noFlag = (f) => (S) => (S.flags.has(f) ? 0 : 1);
export const year = (y) => (S) => (S.year >= y ? 1 : 0);
export const all = (...rs) => (S) => rs.reduce((a, r) => a * r(S), 1);
export const any = (...rs) => (S) => (rs.some((r) => r(S) > 0) ? 1 : 0);
const avg = (...ks) => (S) => ks.reduce((a, k) => a + S[k], 0) / ks.length;
export const avgAbove = (ks, v) => (S) => (avg(...ks)(S) >= v ? 1 : 0);

// ---------- region-mode rules ----------
// They read S.R (regionstate.js) and are 0 outside region mode, so classic never sees them.
const RG = (S, id) => (S.mode === 'regions' ? S.R?.[id] : null);
export const rShort = (id, fam) => (S) => (RG(S, id)?.short.has(fam) ? 1 : 0);
export const rBuilt = (id, ...keys) => (S) => { const r = RG(S, id); return r && keys.some((k) => r.built.has(k)) ? 1 : 0; };
export const rWorks = (id, n = 1) => (S) => ((RG(S, id)?.projects ?? 0) >= n ? 1 : 0);
export const rAbove = (id, k, v) => (S) => ((RG(S, id)?.[k] ?? -1) >= v ? 1 : 0);
export const rBelow = (id, k, v) => (S) => { const r = RG(S, id); return r && r[k] < v ? 1 : 0; };
export const rNot = (rule) => (S) => (S.mode === 'regions' && !(rule(S) > 0) ? 1 : 0);
export const anyRegionBuilt = (key) => (S) => (S.mode === 'regions' && REGION_IDS.some((id) => S.R?.[id]?.built.has(key)) ? 1 : 0);

// ---------- geography ----------
export const ISLAND = [
  { x: 0, z: 5, rx: 130, rz: 78 },
  { x: -80, z: -48, rx: 58, rz: 42 },
  { x: 60, z: -38, rx: 52, rz: 32 },
];

export function landField(x, z) {
  let e = -1;
  for (const el of ISLAND) {
    const dx = (x - el.x) / el.rx, dz = (z - el.z) / el.rz;
    e = Math.max(e, 1 - dx * dx - dz * dz);
  }
  return e + fbm2(x * 0.018, z * 0.018, 3, 11) * 0.22;
}

export const RING = { x: 20, z: 5, rx: 62, rz: 44 };
export function ringPoint(t) {
  return [RING.x + Math.cos(t) * RING.rx, RING.z + Math.sin(t) * RING.rz];
}
const ringPts = (() => {
  const out = [];
  for (let i = 0; i <= 96; i++) out.push(ringPoint((i / 96) * Math.PI * 2));
  return out;
})();

export const ROADS = [
  { pts: ringPts, w: 3.6, ring: true },
  { pts: [[-42, 6], [-20, 8], [0, 14], [18, 22], [40, 33], [64, 40], [84, 42], [98, 46]], w: 3.0 },
  { pts: [[0, 14], [4, 0], [12, -20], [24, -36], [34, -44]], w: 2.6 },
  { pts: [[60, -10], [80, -12], [104, -12]], w: 2.6 },
  { pts: [[-38, -12], [-52, -20], [-64, -24], [-74, -36], [-82, -42]], w: 2.2 },
  { pts: [[-40, 30], [-55, 36], [-66, 40]], w: 2.2 },
  { pts: [[18, 22], [22, 40], [26, 48]], w: 2.0 },
];

export const RIVER = [[-80, -46], [-81, -38], [-86, -30], [-84, -22], [-90, -14], [-95, -4], [-93, 6], [-99, 16], [-104, 26], [-102, 36], [-107, 46], [-110, 62]];
export const RESERVOIR = { x: -80, z: -57, rx: 21, rz: 9 };

// Zones painted on the ground. kind: plaza | concrete | dock | lawn | dirt
export const ZONES = [
  { kind: 'plaza', x: 30, z: 31, rx: 26, rz: 15 },
  { kind: 'plaza', x: 0, z: 9, rx: 16, rz: 9 },
  { kind: 'plaza', x: -14, z: 46, rx: 16, rz: 9 },
  { kind: 'lawn', x: 40, z: -50, rx: 24, rz: 13 },
  { kind: 'concrete', x: 80, z: -24, rx: 30, rz: 15 },
  { kind: 'concrete', x: 100, z: 48, rx: 22, rz: 8 },
  { kind: 'dirt', x: -70, z: 35, rx: 11, rz: 6 },
];

// Docks are rectangles of land reaching into the sea.
export const DOCKS = [
  { x0: 86, z0: 44, x1: 116, z1: 64 },
  { x0: 70, z0: 48, x1: 78, z1: 62 },
];

// Paddy fields: blocks of strips (x, z, w, d, angle).
export const FIELDS = [
  { x: -58, z: -4, w: 20, d: 16, a: 0.05 }, { x: -60, z: 16, w: 18, d: 12, a: -0.08 },
  { x: -26, z: -32, w: 18, d: 12, a: 0.12 }, { x: -30, z: 62, w: 22, d: 10, a: 0.02 },
  { x: -52, z: 54, w: 16, d: 10, a: -0.05 }, { x: -6, z: -52, w: 18, d: 12, a: 0.04 },
  { x: 14, z: -62, w: 14, d: 8, a: -0.06 }, { x: -96, z: -26, w: 12, d: 10, a: 0.1 },
  { x: -66, z: -14, w: 14, d: 8, a: -0.12 }, { x: -86, z: 12, w: 14, d: 12, a: 0.06 },
  { x: -16, z: -64, w: 14, d: 8, a: 0.1 }, { x: 70, z: 62, w: 12, d: 8, a: 0 },
];

// ---------- camera sites ----------
// x, z: point of interest; d: camera distance. The rig frames the point toward the left/center.
export const SITES = {
  overview: { x: 4, z: 0, d: 360, fx: -0.16, fy: 0.06 },
  industrial: { x: 80, z: -24, d: 76 },
  economy: { x: 28, z: -52, d: 92 },
  ringroad: { x: -40, z: 2, d: 88 },
  hospital: { x: -6, z: 4, d: 62 },
  coalition: { x: -14, z: 44, d: 72 },
  valley: { x: -84, z: -42, d: 100, fy: 0.0 },
  temple: { x: -72, z: 33, d: 60 },
  housing: { x: 36, z: 28, d: 78 },
  port: { x: 102, z: 56, d: 80 },
};

// ---------- helpers ----------
function distSeg(px, pz, ax, az, bx, bz) {
  const dx = bx - ax, dz = bz - az;
  const t = Math.max(0, Math.min(1, ((px - ax) * dx + (pz - az) * dz) / (dx * dx + dz * dz || 1)));
  return Math.hypot(px - ax - dx * t, pz - az - dz * t);
}
export function distPolyline(px, pz, pts) {
  let d = Infinity;
  for (let i = 0; i < pts.length - 1; i++) d = Math.min(d, distSeg(px, pz, pts[i][0], pts[i][1], pts[i + 1][0], pts[i + 1][1]));
  return d;
}
// Half width of the river at depth z (matches the carve in ground.js).
export const riverHalfWidth = (z) => 1.6 + Math.max(0, Math.min(1, (z + 46) / 110)) * 2.6;
export const onDock = (x, z) => DOCKS.some((d) => x > d.x0 && x < d.x1 && z > d.z0 && z < d.z1);
// Sea, river or reservoir.
export function isWater(x, z) {
  if (onDock(x, z)) return false;
  if (landField(x, z) < 0.03) return true;
  if (x > -125 && x < -60 && z > -70) {
    if (distPolyline(x, z, RIVER) < riverHalfWidth(z) + 0.4) return true;
    if (inEllipse(x, z, RESERVOIR, 1)) return true;
  }
  return false;
}
const inEllipse = (x, z, e, pad = 0) => ((x - e.x) / (e.rx + pad)) ** 2 + ((z - e.z) / (e.rz + pad)) ** 2 < 1;

// ---------- props ----------
export function buildProps() {
  const P = [];
  const add = (k, x, z, o = {}) => (P.push({ k, x, z, ...o }), P[P.length - 1]);
  const rng = makeRng('layout');
  const tree = () => rng.pick(['tree_a', 'tree_b', 'tree_c', 'tree_a']);

  // ===== Industrial park "Thien Ha" =====
  add('factory', 70, -36, { glowK: 'PROD' });
  add('factory', 92, -35, { glowK: 'PROD', flip: true });
  add('factory', 68, -22, { glowK: 'PROD' });
  add('factory', 92, -21, { glowK: 'PROD' });
  add('warehouse', 110, -26);
  add('warehouse', 52, -30);
  add('crane', 112, -31, { show: above('PROD', 58) });
  add('crane', 54, -42, { show: above('PROD', 70), flip: true });
  add('pylon', 112, -40);
  add('tanks', 108, -14);
  add('tanks', 47, -18, { flip: true });
  add('containers', 58, -15, { show: above('PROD', 45) });
  add('containers', 100, -29, { show: above('PROD', 60) });
  add('boxes', 64, -28);
  add('worker', 80, -28, { bob: 0 });
  add('worker', 83, -29);
  add('worker', 60, -33);
  add('crowd_workers', 78, -14, { show: above('COHESION', 35) });
  add('crowd_workers', 85, -15.5, { show: above('TRUST', 50) });
  add('crowd_workers', 72, -15, { show: any(flag('LABOR_DIALOGUE'), flag('WAGE_SHOCK')) });
  add('trash', 76, -8, { show: below('LAW', 48) });
  add('boxes', 88, -8.5, { show: below('LAW', 42) });
  add('broken_fence', 62, -14, { show: below('LAW', 40) });
  add('trash', 99, -15, { show: below('LAW', 35) });
  for (let i = 0; i < 6; i++) add('lamp', 60 + i * 9, -7.5, { show: above('LAW', 45 + i * 4) });
  for (let i = 0; i < 6; i++) add(tree(), 58 + i * 10 + rng.range(-1, 1), -4, { show: above('LIFE', 30 + i * 8) });
  add('truck', 100, -9, { flip: true });

  // ===== Economy: high-tech zone + cooperatives =====
  add('tower', 42, -60, { glowK: 'PROD' });
  add('tower', 54, -57, { glowK: 'PROD' });
  add('lab', 30, -50, { glowK: 'PROD' });
  add('lab', 50, -44, { glowK: 'PROD' });
  add('tower', 32, -64, { show: above('PROD', 62), glowK: 'PROD' });
  add('scaffold', 64, -48, { show: flag('ECON_OVERHEAT') });
  add('crane', 70, -56, { show: flag('ECON_OVERHEAT') });
  add('scaffold', 20, -60, { show: flag('ECON_OVERHEAT') });
  add('crane', 16, -70, { show: flag('ECON_OVERHEAT'), flip: true });
  add('truck', 58, -40, { show: flag('ECON_OVERHEAT') });
  add('crowd_b', 40, -42, { show: above('TRUST', 45) });
  add('lab', 38, -36, { show: above('PROD', 45), glowK: 'PROD' });
  add('crowd_a', 30, -44, { show: above('LIFE', 50) });
  for (let i = 0; i < 4; i++) add('planter', 26 + i * 6, -46, { show: above('LAW', 45 + i * 4) });
  for (let i = 0; i < 4; i++) add('lamp', 23 + i * 7, -38.5, { show: above('LAW', 42 + i * 5) });
  add('tree_bloom', 60, -50, { show: above('LIFE', 45) });
  add('tree_c', 20, -50);
  add('bush_lime', 46, -47);
  add('bush', 34, -47);
  for (let i = 0; i < 5; i++) add('tree_b', 24 + i * 7, -40, { show: above('LIFE', 35 + i * 6) });
  add('wind_turbine', 76, -60);
  add('wind_turbine', 88, -54);
  add('wind_turbine', 98, -48, { show: flag('ECON_BALANCED') });
  // Cooperative farms
  add('barn', 2, -60);
  add('greenhouse', 12, -48, { show: any(flag('ECON_BALANCED'), above('EQUITY', 50)) });
  add('greenhouse', -8, -44, { show: flag('ECON_BALANCED') });
  add('haystack', -12, -58);
  add('haystack', -9, -56);
  add('crowd_farmers', -4, -50, { show: above('COHESION', 40) });
  add('buffalo', -18, -48);
  add('farmer', 8, -54);

  // ===== Ring road through the villages (west arc) =====
  const villages = [[-50, -12], [-34, -26], [-48, 18], [-30, 26], [-56, 4], [-40, -4]];
  villages.forEach(([vx, vz], vi) => {
    for (let j = 0; j < 3; j++) {
      const x = vx + (j - 1) * 7.5 + rng.range(-1, 1), z = vz + rng.range(-2, 2) + (j === 1 ? -3 : 0);
      if (j === 1) add(rng.pick(['house_red', 'house_blue', 'house_terra']), x, z);
      else {
        const th = 38 + ((vi * 3 + j) % 6) * 6;
        const alt = `v${vi}-${j}`;
        add('hut', x, z, { show: below('EQUITY', th), alt });
        add('solar_house', x, z, { show: above('EQUITY', th), alt });
      }
    }
    add('bamboo', vx + 12, vz - 2);
    add('palm', vx - 11, vz + 1);
  });
  add('crowd_farmers', -44, 10, { show: above('TRUST', 45) });
  add('crowd_a', -36, 0, { show: any(flag('CONSULT_REAL'), above('TRUST', 62)) });
  add('buffalo', -62, -2);
  add('buffalo', -26, -36);
  add('haystack', -60, 12);
  add('haystack', -24, -30);
  for (let i = 0; i < 4; i++) add('lamp', -44 + i * 2, -18 + i * 9, { show: above('LAW', 50 + i * 5) });
  add('broken_fence', -44, 22, { show: below('LAW', 42) });
  add('trash', -36, -8, { show: below('LAW', 40) });

  // ===== Hospital =====
  add('hospital', -9, 3, { glowK: 'TRUST' });
  add('shophouses', -18, 10);
  add('shophouses', 17, 6);
  add('crowd_family', -4, 13, { show: above('LIFE', 35) });
  add('crowd_elders', 5, 14, { show: above('TRUST', 45) });
  add('ambulance', 11, 11);
  add('trash', -9, 14, { show: below('LAW', 45) });
  add('boxes', 11, 15, { show: below('LAW', 40) });
  for (let i = 0; i < 4; i++) add('planter', -9 + i * 6, 17, { show: above('LAW', 48 + i * 4) });
  for (let i = 0; i < 4; i++) add('lamp', -12 + i * 8, 18.5, { show: above('LAW', 44 + i * 5) });
  add('tree_bloom', -12, 4, { show: above('LIFE', 45) });
  add('tree_b', 12, -2, { show: above('LIFE', 40) });

  // ===== Coalition: vocational school, market, riders =====
  add('school', -24, 32, { glowK: 'TRUST' });
  const stalls = ['stall_red', 'stall_teal', 'stall_yellow'];
  for (let r = 0; r < 2; r++) {
    for (let i = 0; i < 5; i++) {
      const x = -22 + i * 4.4 + r * 1.5, z = 50 + r * 5;
      add(stalls[(i + r) % 3], x, z, { show: above('LIFE', 20 + ((i * 7 + r * 13) % 40)) });
    }
  }
  add('crowd_a', -14, 52.5, { show: above('LIFE', 40) });
  add('crowd_b', -4, 57.5, { show: above('LIFE', 55) });
  add('crowd_family', -20, 58, { show: above('COHESION', 50) });
  add('bunting', -12, 48, { show: any(flag('COALITION_BUILT'), above('COHESION', 66)) });
  add('crowd_cheer', -30, 39, { show: flag('COALITION_BUILT') });
  add('crowd_workers', -18, 38, { show: above('TRUST', 50) });
  add('shophouses', 4, 50);
  add('trash', -26, 46, { show: below('LAW', 42) });
  add('tree_a', -36, 34, { show: above('LIFE', 35) });
  add('tree_c', 6, 40, { show: above('LIFE', 50) });

  // ===== Housing: apartments, kindergarten, elder care =====
  add('apt_cream', 22, 21);
  add('apt_blue', 38, 18);
  add('apt_pink', 52, 24);
  add('apt_cream', 62, 30, { show: year(4) });
  add('apt_blue', 10, 28, { show: year(6) });
  add('shophouses', 30, 33);
  add('shophouses', 44, 34);
  add('kindergarten', 48, 43, { show: flag('CARE_INFRASTRUCTURE') });
  add('elder_home', 32, 44, { show: flag('CARE_INFRASTRUCTURE') });
  add('crowd_family', 50, 47, { show: all(flag('CARE_INFRASTRUCTURE'), above('LIFE', 30)) });
  add('crowd_elders', 36, 47, { show: flag('CARE_INFRASTRUCTURE') });
  add('crowd_family', 22, 38, { show: above('COHESION', 45) });
  add('trash', 40, 40, { show: below('LAW', 45) });
  add('boxes', 18, 36, { show: below('LAW', 40) });
  for (let i = 0; i < 6; i++) add(i % 2 ? 'tree_bloom' : 'tree_b', 14 + i * 9, 40 + (i % 2) * 2, { show: above('LIFE', 32 + i * 7) });
  for (let i = 0; i < 5; i++) add('lamp', 18 + i * 10, 37, { show: above('LAW', 46 + i * 4) });

  // ===== Valley "Ban May": dam, reservoir, stilt houses =====
  add('mountain_c', -78, -86);
  add('mountain_a', -92, -72);
  add('mountain_b', -118, -60);
  add('mountain_b', -58, -70);
  add('mountain_a', -32, -74);
  add('dam', -80, -46, { glowK: 'PROD' });
  add('pylon', -60, -44);
  add('pylon', -44, -38);
  add('pylon', -28, -32);
  const stilts = [[-97, -30], [-72, -34], [-101, -16], [-75, -12], [-83, -3], [-64, -26]];
  stilts.forEach(([x, z], i) => add('stilt', x, z, { flip: i % 2 === 1 }));
  add('community_hall', -74, -24, { show: flag('REGION_PARTICIPATION') });
  add('crowd_farmers', -77, -18, { show: any(flag('REGION_PARTICIPATION'), above('TRUST', 60)) });
  add('crowd_farmers', -70, -16, { show: above('COHESION', 45) });
  add('hut', -102, -10, { show: below('EQUITY', 45), alt: 'valley' });
  add('solar_house', -102, -10, { show: above('EQUITY', 45), alt: 'valley' });
  add('buffalo', -88, -22);
  for (let i = 0; i < 6; i++) add(i % 2 ? 'bamboo' : 'pine', -110 + i * 7, -36 + (i % 3) * 3);
  add('pine', -62, -52);
  add('pine', -100, -46);
  add('pine', -58, -30);

  // ===== Temple: neutral place of worship =====
  add('temple', -70, 30, { glowK: 'COHESION' });
  add('banyan', -86, 28);
  add('bamboo', -80, 22);
  add('tree_c', -62, 20);
  add('bush', -58, 31);
  add('bush_lime', -83, 35);
  add('pine', -90, 40);
  add('bamboo', -56, 24);
  add('pine', -60, 22);
  add('crowd_elders', -74, 37, { show: above('COHESION', 40) });
  add('crowd_family', -66, 38.5, { show: above('TRUST', 50) });
  add('crowd_a', -60, 39, { show: flag('RELIGION_FAIR_PROCESS') });
  add('flowers', -80, 37, { show: above('LIFE', 40) });
  add('flowers', -62, 35);
  add('lamp', -77, 40, { show: above('LAW', 40) });
  add('lamp', -63, 41, { show: above('LAW', 40) });
  add('trash', -58, 42, { show: below('LAW', 40) });

  // ===== Port =====
  add('warehouse', 84, 42);
  add('containers', 92, 50);
  add('containers', 101, 49, { show: above('PROD', 40) });
  add('containers', 110, 51, { show: above('PROD', 55) });
  add('containers', 96, 58, { show: above('PROD', 65) });
  add('containers', 89, 59, { show: above('PROD', 35) });
  add('containers', 110, 59, { show: above('PROD', 45) });
  add('containers', 117, 56, { show: above('PROD', 75) });
  add('truck', 103, 61, { show: above('PROD', 50) });
  for (let i = 0; i < 4; i++) add('lamp', 88 + i * 9, 62.5, { show: above('LAW', 45 + i * 5) });
  add('gantry', 98, 64);
  add('gantry', 112, 64, { show: above('PROD', 50) });
  add('ship', 108, 74);
  add('lighthouse', 128, 26);
  add('crowd_workers', 88, 56, { show: above('COHESION', 40) });
  add('crowd_workers', 104, 56, { show: any(flag('WAGE_SHOCK'), above('TRUST', 55)) });
  add('truck', 82, 50);
  add('trash', 106, 46, { show: below('LAW', 42) });
  add('boxes', 116, 47, { show: below('LAW', 45) });
  add('palm', 122, 30);
  add('palm', 78, 40);

  // ===== Landmarks seen from the overview =====
  add('lighthouse', -112, 72);

  // ===== Resolve into free slots =====
  const occ = new Occupancy(WALKWAYS);
  const placed = settle(P, occ, { log: true });
  P.length = 0;
  P.push(...placed);

  // ===== Scattered trees (seeded jittered grid, filtered) =====
  const trees = makeRng('trees');
  const CELL = 6.5;
  for (let gz = -110; gz < 100; gz += CELL) {
    for (let gx = -150; gx < 150; gx += CELL) {
      const x = gx + trees.range(0, CELL), z = gz + trees.range(0, CELL);
      const land = landField(x, z);
      if (land < 0.08) continue;
      if (inEllipse(x, z, RESERVOIR, 3)) continue;
      if (distPolyline(x, z, RIVER) < 5) continue;
      if (ZONES.some((zn) => inEllipse(x, z, zn, 1))) continue;
      if (FIELDS.some((f) => Math.abs(x - f.x) < f.w / 2 + 1 && Math.abs(z - f.z) < f.d / 2 + 1)) continue;
      // Keep a margin from roads and from everything built (trees stay out of yards).
      const probe = { k: 'bush', x, z, s: 2.2 };
      if (occ.conflict(probe, { roadPad: 1.6 })) continue;
      const forest = fbm2(x * 0.03, z * 0.03, 3, 5) + (x < -50 && z < -10 ? 0.35 : 0) + (z < -60 ? 0.2 : 0);
      const density = 0.18 + forest * 0.9;
      if (trees() > density) continue;
      const rural = x < -20 ? 1 : 0;
      const k = forest > 0.4 ? trees.pick(['tree_c', 'pine', 'tree_a']) : rural ? trees.pick(['tree_a', 'palm', 'bamboo', 'tree_b']) : trees.pick(['tree_b', 'tree_a', 'tree_bloom', 'bush']);
      // A share of trees only grows when living standards rise (greenery).
      const grows = trees() < 0.3;
      occ.add(add(k, x, z, { s: trees.range(0.85, 1.15), flip: trees() < 0.5, show: grows ? above('LIFE', 35 + trees() * 40) : undefined, scatter: true }));
      if (trees() < 0.25) {
        const b = { k: trees.pick(['bush', 'bush_lime', 'rock']), x: x + trees.range(-3, 3), z: z + trees.range(1, 3), s: trees.range(0.8, 1.1) };
        if (!occ.conflict(b, { roadPad: 1 })) occ.add(add(b.k, b.x, b.z, { s: b.s, scatter: true }));
      }
    }
  }
  // ===== Region mode works =====
  // Placed after the classic island is final, so classic placement is untouched. They avoid
  // every authored prop; scattered trees standing where a work appears yield to it (they are
  // hidden only while that work is shown, i.e. only in region mode).
  const rocc = new Occupancy(WALKWAYS);
  for (const p of P) if (!p.scatter) rocc.add(p);
  const works = settle(buildRegionProps(), rocc, { log: true });
  for (const t of P) {
    if (!t.scatter) continue;
    const tr = footOf(t);
    if (!tr) continue;
    let ys = null;
    for (const w of works) {
      const r = footOf(w);
      if (!r) continue;
      if (tr.x0 < r.x1 + 0.3 && r.x0 < tr.x1 + 0.3 && tr.z0 < r.z1 + 0.3 && r.z0 < tr.z1 + 0.3) (ys ??= new Set()).add(w);
    }
    if (!ys) continue;
    t.yieldTo = ys;
    const own = t.show, list = [...ys];
    t.show = (S) => ((own ? own(S) : 1) > 0 && list.every((w) => !(w.show(S) > 0)) ? 1 : 0);
  }
  P.push(...works);
  for (const p of P) p.region = regionAt(p.x, p.z);
  return P;
}

// ---------- region works ----------
// Built keys that have a dedicated look in a region. Any other finished work lands in that
// region's spare slots with a generic look for its key.
// Keys and home regions follow src/regions/data/regions.js (BUILT); the extra entries cover
// a key finished in another region than its usual one.
const DEDICATED = {
  CN: ['power_reserve', 'supplier', 'training', 'heat_link', 'heat_pilot'],
  NN: ['canal', 'cold_storage', 'cold_small'],
  TT: ['bridge', 'market', 'training', 'clinic', 'bus_line'],
  DC: ['housing', 'care_center', 'care_point', 'green_space', 'clinic', 'bus_line'],
  VC: ['road_vc', 'community_road', 'clinic', 'bridge'],
  CB: ['berth', 'cold_storage', 'cold_small', 'supplier'],
};
const GENERIC_KIND = {
  canal: 'sluice', cold_storage: 'cold_store', cold_small: 'cold_store', power_reserve: 'substation', housing: 'apt_pink',
  care_center: 'kindergarten', care_point: 'kindergarten', green_space: 'banyan', clinic: 'clinic', road_vc: 'bus_stop',
  community_road: 'community_hall', berth: 'warehouse', bridge: 'workshop', bus_line: 'bus_stop', supplier: 'warehouse',
  training: 'workshop', heat_link: 'tanks', heat_pilot: 'tanks', market: 'stall_teal',
};
const SPARE_KINDS = ['workshop', 'warehouse', 'cold_store', 'substation', 'clinic', 'kindergarten', 'apt_pink', 'sluice', 'bus_stop', 'banyan', 'community_hall', 'tanks', 'stall_teal'];
const extraBuilt = (S, id) => (S.mode === 'regions' ? (S.R?.[id]?.builtList ?? []).filter((k) => !DEDICATED[id].includes(k)) : []);
const spareRule = (id, i, kind) => (S) => {
  const k = extraBuilt(S, id)[i];
  return k != null && (GENERIC_KIND[k] ?? 'workshop') === kind ? 1 : 0;
};
export const REGION_DEDICATED = DEDICATED;
export const REGION_GENERIC_KIND = GENERIC_KIND;

function buildRegionProps() {
  const P = [];
  const add = (id, k, x, z, show, o = {}) => {
    const p = { k, x, z, show, search: 24, keepIn: (px, pz) => regionAt(px, pz) === id, work: id, ...o };
    P.push(p);
    return p;
  };
  const w1 = (id) => rWorks(id, 1), w2 = (id) => rWorks(id, 2);
  const roadOpen = (id) => rNot(rShort(id, 'road'));

  // ----- CN: Thien Ha industry -----
  add('CN', 'substation', 104, 0, rBuilt('CN', 'power_reserve'));
  add('CN', 'wind_turbine', 114, -44, rBuilt('CN', 'power_reserve'));
  add('CN', 'warehouse', 40, -10, rBuilt('CN', 'supplier'));
  add('CN', 'containers', 44, -2, rBuilt('CN', 'supplier'));
  add('CN', 'workshop', 30, -24, rBuilt('CN', 'training'));
  add('CN', 'crowd_workers', 30, -18, rBuilt('CN', 'training'));
  // Waste-heat line to the drying kilns: tanks and a pipe bridge toward the farmland.
  add('CN', 'tanks', 24, -32, rBuilt('CN', 'heat_link', 'heat_pilot'));
  add('CN', 'pylon', 18, -28, rBuilt('CN', 'heat_link'));
  add('CN', 'site_fence', 62, -44, w1('CN'));
  add('CN', 'scaffold', 104, -54, w2('CN'));
  add('CN', 'site_fence', 104, -50, w2('CN'));

  // ----- NN: farmland -----
  add('NN', 'sluice', -49, 9, rBuilt('NN', 'canal'));
  add('NN', 'sluice', -26, -24, rBuilt('NN', 'canal'));
  add('NN', 'crowd_farmers', -64, 26, rBuilt('NN', 'canal'));
  add('NN', 'cold_store', -34, -46, rBuilt('NN', 'cold_storage', 'cold_small'));
  add('NN', 'truck', -26, -44, rBuilt('NN', 'cold_storage', 'cold_small'));
  add('NN', 'scaffold', -44, -36, w1('NN'));
  add('NN', 'crane', -36, -34, w1('NN'));
  add('NN', 'site_fence', -44, -32, w1('NN'));
  add('NN', 'scaffold', -44, 58, w2('NN'));
  add('NN', 'site_fence', -44, 62, w2('NN'));
  add('NN', 'crowd_farmers', -50, -6, rShort('NN', 'water'));
  add('NN', 'haystack', -66, 6, rShort('NN', 'water'));
  // No outlet for the harvest: sacks and crates pile up by the road.
  add('NN', 'boxes', -36, -12, rShort('NN', 'transport'));
  add('NN', 'boxes', -60, 32, rShort('NN', 'transport'));
  add('NN', 'haystack', -22, -44, rShort('NN', 'transport'));
  add('NN', 'truck', -64, 2, rShort('NN', 'transport'));

  // ----- TT: city centre -----
  add('TT', 'workshop', -34, 46, rBuilt('TT', 'training'));
  // Repaired bridge: a footbridge over the avenue south of the high-tech road.
  add('TT', 'bridge', 8, -10, rBuilt('TT', 'bridge'));
  // Market day: extra stalls and shoppers.
  add('TT', 'stall_red', -36, 54, rBuilt('TT', 'market'));
  add('TT', 'stall_yellow', -31, 56, rBuilt('TT', 'market'));
  add('TT', 'stall_teal', -26, 60, rBuilt('TT', 'market'));
  add('TT', 'crowd_a', -32, 60, rBuilt('TT', 'market'));
  add('TT', 'clinic', -26, 18, rBuilt('TT', 'clinic'));
  add('TT', 'bus_stop', -24, 9, rBuilt('TT', 'bus_line'));
  add('TT', 'scaffold', -30, 2, w1('TT'));
  add('TT', 'crane', -24, -2, w1('TT'));
  add('TT', 'site_fence', -30, 6, w1('TT'));
  add('TT', 'scaffold', 4, 62, w2('TT'));
  add('TT', 'site_fence', 4, 66, w2('TT'));
  add('TT', 'crowd_elders', -16, 14, rShort('TT', 'care'));
  add('TT', 'crowd_family', -2, 20, rShort('TT', 'care'));

  // ----- DC: housing -----
  add('DC', 'apt_pink', 66, 44, rBuilt('DC', 'housing'));
  // Green space: a small park with a banyan, flowers and families.
  add('DC', 'banyan', 26, 64, rBuilt('DC', 'green_space'));
  add('DC', 'flowers', 20, 62, rBuilt('DC', 'green_space'));
  add('DC', 'flowers', 32, 60, rBuilt('DC', 'green_space'));
  add('DC', 'bush_lime', 18, 58, rBuilt('DC', 'green_space'));
  add('DC', 'crowd_family', 24, 60, rBuilt('DC', 'green_space'));
  add('DC', 'apt_cream', 24, 54, rBuilt('DC', 'housing'));
  add('DC', 'clinic', 14, 48, rBuilt('DC', 'clinic'));
  add('DC', 'bus_stop', 40, 30, rBuilt('DC', 'bus_line'));
  add('DC', 'scaffold', 56, 56, w1('DC'));
  add('DC', 'crane', 62, 58, w1('DC'));
  add('DC', 'site_fence', 56, 60, w1('DC'));
  add('DC', 'scaffold', 36, 62, w2('DC'));
  add('DC', 'site_fence', 36, 66, w2('DC'));
  // Housing short: crowded yards, belongings stacked outside.
  add('DC', 'crowd_a', 28, 26, rShort('DC', 'housing'));
  add('DC', 'crowd_family', 46, 28, rShort('DC', 'housing'));
  add('DC', 'crowd_b', 56, 38, rShort('DC', 'housing'));
  add('DC', 'crowd_family', 18, 44, rShort('DC', 'housing'));
  add('DC', 'boxes', 34, 38, rShort('DC', 'housing'));
  add('DC', 'boxes', 52, 46, rShort('DC', 'housing'));
  add('DC', 'crowd_elders', 30, 48, rShort('DC', 'care'));

  // ----- VC: Ban May highlands -----
  add('VC', 'road_block', -62, -27, rShort('VC', 'road'));
  add('VC', 'road_block', -48, -18, rShort('VC', 'road'));
  add('VC', 'rock', -60, -21, rShort('VC', 'road'));
  add('VC', 'clinic', -88, -6, rBuilt('VC', 'clinic'));
  add('VC', 'crowd_farmers', -84, 2, rBuilt('VC', 'clinic'));
  add('VC', 'bridge', -94.2, 1, rBuilt('VC', 'bridge'));
  add('VC', 'lamp', -56, -22, all(rBuilt('VC', 'road_vc', 'community_road'), roadOpen('VC')));
  add('VC', 'lamp', -70, -31, all(rBuilt('VC', 'road_vc', 'community_road'), roadOpen('VC')));
  add('VC', 'bus_stop', -66, -24, all(rBuilt('VC', 'road_vc', 'community_road'), roadOpen('VC')));
  add('VC', 'scaffold', -70, -6, w1('VC'));
  add('VC', 'site_fence', -70, -2, w1('VC'));
  add('VC', 'scaffold', -108, -34, w2('VC'));
  add('VC', 'site_fence', -108, -30, w2('VC'));
  add('VC', 'crowd_elders', -80, -18, rShort('VC', 'care'));

  // ----- CB: coast and port -----
  add('CB', 'gantry', 76, 58, rBuilt('CB', 'berth'));
  add('CB', 'containers', 82, 52, rBuilt('CB', 'berth'));
  add('CB', 'ship', 84, 73, rBuilt('CB', 'berth'), { keepIn: null });
  add('CB', 'cold_store', 118, 40, rBuilt('CB', 'cold_storage', 'cold_small'));
  add('CB', 'warehouse', 110, 20, rBuilt('CB', 'supplier'));
  add('CB', 'scaffold', 120, 12, w1('CB'));
  add('CB', 'crane', 126, 18, w1('CB'));
  add('CB', 'site_fence', 120, 16, w1('CB'));
  add('CB', 'scaffold', 96, 26, w2('CB'));
  add('CB', 'site_fence', 96, 30, w2('CB'));
  // Transport short: boxes pile up, trucks queue at the gate.
  add('CB', 'containers', 88, 36, rShort('CB', 'transport'));
  add('CB', 'containers', 100, 36, rShort('CB', 'transport'));
  add('CB', 'containers', 112, 44, rShort('CB', 'transport'));
  add('CB', 'truck', 76, 46, rShort('CB', 'transport'));
  add('CB', 'truck', 70, 47, rShort('CB', 'transport'));
  add('CB', 'truck', 64, 46, rShort('CB', 'transport'));

  // ----- Spare slots: any other finished work, generic look by key -----
  const SPARE = {
    CN: [[100, -36], [36, -30]], NN: [[-62, 46], [-20, -66]], TT: [[-14, -14], [-6, 66]],
    DC: [[70, 34], [44, 58]], VC: [[-112, -20], [-66, -50]], CB: [[124, 34], [90, 30]],
  };
  for (const id of REGION_IDS) {
    SPARE[id].forEach(([x, z], i) => {
      for (const kind of SPARE_KINDS) add(id, kind, x, z, spareRule(id, i, kind), { alt: `spare-${id}-${i}` });
    });
  }
  return P;
}

// ---------- moving things ----------
const ringArc = (t0, t1, n = 24) => Array.from({ length: n + 1 }, (_, i) => ringPoint(t0 + (t1 - t0) * (i / n)));

// A slice [s0, s1] (arclength) of road i, offset sideways by `off` (+ = left of travel).
export function roadOffset(i, s0, s1, off) {
  const pts = ROADS[i].pts;
  const out = [];
  let acc = 0;
  for (let j = 0; j < pts.length - 1; j++) {
    const [ax, az] = pts[j], [bx, bz] = pts[j + 1];
    const L = Math.hypot(bx - ax, bz - az) || 1;
    const nx = -(bz - az) / L, nz = (bx - ax) / L;
    for (const s of [Math.max(s0, acc), Math.min(s1, acc + L)]) {
      if (s < acc || s > acc + L || s0 > acc + L || s1 < acc) continue;
      const t = (s - acc) / L;
      const q = [ax + (bx - ax) * t + nx * off, az + (bz - az) * t + nz * off];
      const last = out[out.length - 1];
      if (!last || Math.hypot(last[0] - q[0], last[1] - q[1]) > 0.05) out.push(q);
    }
    acc += L;
  }
  return out;
}
// Sidewalk along road i: 1.7 beyond the kerb, side +1 = left of the road's drawing direction.
const sidewalk = (i, s0, s1, side) => roadOffset(i, s0, s1, side * (ROADS[i].w / 2 + 1.7));

// Pedestrian routes (ping-pong; walkers keep to the right). Props are kept off them.
// n: walkers, metric/base: they appear as that metric rises.
const W5 = ['walker_a', 'walker_b', 'walker_c', 'walker_d', 'walker_e'];
export const WALKWAYS = [
  { id: 'industrial', path: sidewalk(3, 24, 43, -1), n: 6, keys: ['worker', 'worker', 'walker_e'], metric: 'COHESION' },
  { id: 'industrial-n', path: sidewalk(3, 24, 43, 1), n: 3, keys: ['worker'], metric: 'PROD' },
  { id: 'hospital', path: [[-17, 7], [-1, 7]], n: 4, keys: [...W5, 'elder'], metric: 'TRUST' },
  { id: 'hospital-st', path: sidewalk(1, 30, 62, 1), n: 4, keys: ['elder', ...W5], metric: 'TRUST' },
  { id: 'market', path: [[-23, 52], [-1, 52]], n: 8, keys: [...W5, 'child'], metric: 'LIFE', base: 15 },
  { id: 'housing', path: sidewalk(1, 68, 100, 1), n: 8, keys: [...W5, 'child', 'elder'], metric: 'LIFE' },
  { id: 'valley', path: [[-82, -7], [-66, -7]], n: 5, keys: ['farmer', 'farmer', 'child'], metric: 'COHESION' },
  { id: 'temple', path: [[-79, 33.5], [-62, 33.5]], n: 6, keys: ['elder', ...W5], metric: 'COHESION' },
  { id: 'village', path: sidewalk(0, 150, 178, -1), n: 5, keys: ['farmer', 'walker_b', 'child'], metric: 'TRUST' },
  { id: 'port', path: [[87, 53], [115, 53]], n: 6, keys: ['worker'], metric: 'PROD' },
  { id: 'economy', path: [[25, -47.5], [43, -47.5]], n: 6, keys: W5, metric: 'PROD' },
].map((w) => ({ ...w, laneOff: 0.35, walker: true }));

const laneOf = (i) => ROADS[i].w * 0.25;

export function buildMovers() {
  const M = [];
  // Vehicles drive on the right: lane offset is always to the right of travel; the ring
  // runs both ways by reversing the loop. Ping-pong paths swap sides at the ends.
  const ringRev = [...ringPts].reverse();
  const veh = ['car_red', 'bus', 'car_blue', 'truck', 'car_white', 'rider', 'car_red', 'rider', 'bus', 'car_blue', 'truck', 'rider'];
  veh.forEach((k, i) => M.push({ k, path: i % 2 ? ringRev : ringPts, closed: true, offset: i / veh.length, speed: k === 'rider' ? 7 : 5.5, laneOff: -laneOf(0), show: i < 6 ? undefined : above('PROD', 35 + i * 3) }));
  // Delivery riders on the coalition stretch and main avenue.
  for (let i = 0; i < 6; i++) M.push({ k: 'rider', path: ringArc(Math.PI * 0.25, Math.PI * 0.95), offset: i / 6, speed: 6.5, laneOff: -laneOf(0), show: above('PROD', 20 + i * 8) });
  for (let i = 0; i < 4; i++) M.push({ k: i % 2 ? 'car_white' : 'rider', path: ROADS[1].pts, offset: i / 4, speed: 6, laneOff: -laneOf(1) });
  // Trucks to the industrial park and the port.
  for (let i = 0; i < 3; i++) M.push({ k: 'truck', path: ROADS[3].pts, offset: i / 3, speed: 4.5, laneOff: -laneOf(3), show: above('PROD', 30 + i * 15) });
  M.push({ k: 'truck', path: [[64, 40], [84, 42], [98, 46], [101, 47]], offset: 0.2, speed: 4, laneOff: -laneOf(1), show: above('PROD', 45) });
  // Boats in the bay.
  M.push({ k: 'boat', path: [[80, 80], [130, 84], [138, 70], [90, 72], [80, 80]], closed: true, offset: 0, speed: 3 });
  M.push({ k: 'boat', path: [[-120, 72], [-96, 82], [-70, 78], [-120, 72]], closed: true, offset: 0.4, speed: 2.5 });
  M.push({ k: 'boat', path: [[60, 78], [76, 80], [92, 88], [60, 78]], closed: true, offset: 0.7, speed: 2.2, show: above('LIFE', 45) });

  // Pedestrians on their walkways. Count grows with trust / cohesion / life.
  for (const w of WALKWAYS) {
    for (let i = 0; i < w.n; i++) {
      M.push({ k: w.keys[i % w.keys.length], id: w.id, path: w.path, offset: i / w.n, speed: 1.1 + (i % 3) * 0.2, laneOff: w.laneOff, walker: true, show: above(w.metric, (w.base ?? 25) + (i * 47) % 50) });
    }
  }

  // Region mode traffic: the road up to Ban May runs once it is open and served; the bus
  // line runs on the main avenue once any region has finished it.
  const vcBuilt = rBuilt('VC', 'road_vc', 'community_road');
  const vcRoad = all(rNot(rShort('VC', 'road')), any(vcBuilt, rAbove('VC', 'access', 40)));
  ['car_red', 'truck', 'car_white'].forEach((k, i) => M.push({ k, id: 'vc-road', path: [...ROADS[4].pts.slice(0, 4), [-76, -38.5]], offset: i / 3, speed: 4.5, laneOff: -laneOf(4), show: i === 0 ? vcRoad : all(vcRoad, any(vcBuilt, rAbove('VC', 'access', 50 + i * 10))) }));
  for (let i = 0; i < 2; i++) M.push({ k: 'bus', id: 'bus-line', path: ROADS[1].pts, offset: 0.2 + i / 2, speed: 5, laneOff: -laneOf(1), show: anyRegionBuilt('bus_line') });

  // A mover whose whole route lies in one region follows that region's values.
  for (const m of M) {
    const ids = new Set(m.path.map(([x, z]) => regionAt(x, z)));
    m.region = ids.size === 1 ? [...ids][0] : null;
  }
  return M;
}

// Chimney smoke sources come from sprite metadata; extra plumes here (dam spray, port stacks).
export const EXTRA_SMOKE = [
  { x: 108 + 5.5, y: 6.5, z: 74, rate: 0.6, kind: 'smoke' },
];
