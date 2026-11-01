// Hand-authored map of the fictional island republic "Hòa Minh".
// x grows east (screen right), z grows south (toward the camera). Units ~ meters x 10.
import { makeRng, fbm2 } from '../core/rng.js';

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

export const RIVER = [[-80, -46], [-81, -38], [-85, -28], [-90, -14], [-96, 2], [-100, 18], [-103, 34], [-107, 50], [-110, 66]];
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
  overview: { x: 0, z: 2, d: 330 },
  industrial: { x: 80, z: -22, d: 92 },
  economy: { x: 26, z: -52, d: 108 },
  ringroad: { x: -38, z: 2, d: 100 },
  hospital: { x: 0, z: 8, d: 78 },
  coalition: { x: -14, z: 42, d: 86 },
  valley: { x: -82, z: -38, d: 104 },
  temple: { x: -72, z: 34, d: 74 },
  housing: { x: 34, z: 30, d: 92 },
  port: { x: 100, z: 54, d: 92 },
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
const inEllipse = (x, z, e, pad = 0) => ((x - e.x) / (e.rx + pad)) ** 2 + ((z - e.z) / (e.rz + pad)) ** 2 < 1;

// ---------- props ----------
export function buildProps() {
  const P = [];
  const add = (k, x, z, o = {}) => (P.push({ k, x, z, ...o }), P[P.length - 1]);
  const rng = makeRng('layout');
  const tree = () => rng.pick(['tree_a', 'tree_b', 'tree_c', 'tree_a']);

  // ===== Industrial park "Thiên Hà" =====
  add('factory', 70, -36, { glowK: 'PROD' });
  add('factory', 92, -35, { glowK: 'PROD', flip: true });
  add('factory', 68, -22, { glowK: 'PROD' });
  add('factory', 92, -21, { glowK: 'PROD' });
  add('warehouse', 110, -26);
  add('warehouse', 52, -30);
  add('crane', 104, -40, { show: above('PROD', 58) });
  add('crane', 54, -42, { show: above('PROD', 70), flip: true });
  add('pylon', 112, -40);
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
        add('hut', x, z, { show: below('EQUITY', th) });
        add('solar_house', x, z + 0.05, { show: above('EQUITY', th) });
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
  add('hospital', 0, 3, { glowK: 'TRUST' });
  add('shophouses', -18, 10);
  add('shophouses', 17, 6);
  add('crowd_family', -4, 13, { show: above('LIFE', 35) });
  add('crowd_elders', 5, 14, { show: above('TRUST', 45) });
  add('car_white', 9, 12);
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

  // ===== Valley "Bản Mây": dam, reservoir, stilt houses =====
  add('mountain_c', -76, -96);
  add('mountain_a', -88, -80);
  add('mountain_b', -116, -66);
  add('mountain_b', -50, -76);
  add('mountain_a', -32, -74);
  add('dam', -80, -46, { glowK: 'PROD' });
  add('pylon', -60, -44);
  add('pylon', -44, -38);
  add('pylon', -28, -32);
  const stilts = [[-94, -32], [-73, -32], [-71, -22], [-97, -18], [-78, -14], [-92, -6]];
  stilts.forEach(([x, z], i) => add('stilt', x, z, { flip: i % 2 === 1 }));
  add('community_hall', -78, -26, { show: flag('REGION_PARTICIPATION') });
  add('crowd_farmers', -82, -20, { show: any(flag('REGION_PARTICIPATION'), above('TRUST', 60)) });
  add('crowd_farmers', -70, -16, { show: above('COHESION', 45) });
  add('hut', -102, -10, { show: below('EQUITY', 45) });
  add('solar_house', -102, -10, { show: above('EQUITY', 45) });
  add('buffalo', -88, -22);
  for (let i = 0; i < 6; i++) add(i % 2 ? 'bamboo' : 'pine', -110 + i * 7, -36 + (i % 3) * 3);
  add('pine', -62, -52);
  add('pine', -100, -46);
  add('pine', -58, -30);

  // ===== Temple: neutral place of worship =====
  add('temple', -70, 30, { glowK: 'COHESION' });
  add('banyan', -86, 28);
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
  add('hill', -74, 14);

  // ===== Port =====
  add('warehouse', 84, 42);
  add('containers', 92, 50);
  add('containers', 101, 49, { show: above('PROD', 40) });
  add('containers', 110, 51, { show: above('PROD', 55) });
  add('containers', 96, 58, { show: above('PROD', 65) });
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
  add('hill', 112, -10);
  add('hill', 0, 62);
  add('lighthouse', -112, 72);

  // ===== Scattered trees (seeded jittered grid, filtered) =====
  const occupied = P.map((p) => ({ x: p.x, z: p.z, r: p.k.startsWith('mountain') ? 0 : 4.5 }));
  const trees = makeRng('trees');
  const CELL = 6.5;
  for (let gz = -110; gz < 100; gz += CELL) {
    for (let gx = -150; gx < 150; gx += CELL) {
      const x = gx + trees.range(0, CELL), z = gz + trees.range(0, CELL);
      const land = landField(x, z);
      if (land < 0.08) continue;
      let ok = true;
      for (const r of ROADS) if (distPolyline(x, z, r.pts) < r.w + 2.2) { ok = false; break; }
      if (!ok) continue;
      if (distPolyline(x, z, RIVER) < 5) continue;
      if (inEllipse(x, z, RESERVOIR, 3)) continue;
      if (ZONES.some((zn) => inEllipse(x, z, zn, 1))) continue;
      if (FIELDS.some((f) => Math.abs(x - f.x) < f.w / 2 + 1 && Math.abs(z - f.z) < f.d / 2 + 1)) continue;
      if (occupied.some((o) => Math.hypot(o.x - x, o.z - z) < o.r + 2.5)) continue;
      const forest = fbm2(x * 0.03, z * 0.03, 3, 5) + (x < -50 && z < -10 ? 0.35 : 0) + (z < -60 ? 0.2 : 0);
      const density = 0.18 + forest * 0.9;
      if (trees() > density) continue;
      const rural = x < -20 ? 1 : 0;
      const k = forest > 0.4 ? trees.pick(['tree_c', 'pine', 'tree_a']) : rural ? trees.pick(['tree_a', 'palm', 'bamboo', 'tree_b']) : trees.pick(['tree_b', 'tree_a', 'tree_bloom', 'bush']);
      // A share of trees only grows when living standards rise (greenery).
      const grows = trees() < 0.3;
      add(k, x, z, { s: trees.range(0.85, 1.15), flip: trees() < 0.5, show: grows ? above('LIFE', 35 + trees() * 40) : undefined });
      if (trees() < 0.25) add(trees.pick(['bush', 'bush_lime', 'rock']), x + trees.range(-3, 3), z + trees.range(1, 3), { s: trees.range(0.8, 1.1) });
    }
  }
  return P;
}

// ---------- moving things ----------
const ringArc = (t0, t1, n = 24) => Array.from({ length: n + 1 }, (_, i) => ringPoint(t0 + (t1 - t0) * (i / n)));

export function buildMovers() {
  const M = [];
  const loop = ringPts;
  // Vehicles around the ring road (two lanes, opposite directions).
  const veh = ['car_red', 'bus', 'car_blue', 'truck', 'car_white', 'rider', 'car_red', 'rider', 'bus', 'car_blue', 'truck', 'rider'];
  veh.forEach((k, i) => M.push({ k, path: loop, closed: true, offset: i / veh.length, speed: k === 'rider' ? 7 : 5.5, lane: i % 2 ? 1 : -1, show: i < 6 ? undefined : above('PROD', 35 + i * 3) }));
  // Delivery riders on the coalition stretch and main avenue.
  for (let i = 0; i < 6; i++) M.push({ k: 'rider', path: ringArc(Math.PI * 0.25, Math.PI * 0.95), offset: i / 6, speed: 6.5, lane: i % 2 ? 1 : -1, show: above('PROD', 20 + i * 8) });
  for (let i = 0; i < 4; i++) M.push({ k: i % 2 ? 'car_white' : 'rider', path: ROADS[1].pts, offset: i / 4, speed: 6, lane: i % 2 ? 1 : -1 });
  // Trucks to the industrial park and the port.
  for (let i = 0; i < 3; i++) M.push({ k: 'truck', path: ROADS[3].pts, offset: i / 3, speed: 4.5, lane: i % 2 ? 1 : -1, show: above('PROD', 30 + i * 15) });
  M.push({ k: 'truck', path: [[64, 40], [84, 42], [98, 46], [104, 52]], offset: 0.2, speed: 4, lane: 1, show: above('PROD', 45) });
  // Boats in the bay.
  M.push({ k: 'boat', path: [[80, 80], [130, 84], [138, 70], [90, 72], [80, 80]], closed: true, offset: 0, speed: 3, lane: 0 });
  M.push({ k: 'boat', path: [[-120, 72], [-96, 82], [-70, 78], [-120, 72]], closed: true, offset: 0.4, speed: 2.5, lane: 0 });
  M.push({ k: 'boat', path: [[60, 74], [76, 78], [92, 86], [60, 74]], closed: true, offset: 0.7, speed: 2.2, lane: 0, show: above('LIFE', 45) });

  // Pedestrians: little loops at each site. Count grows with trust / cohesion / life.
  const walk = (path, n, keys, metric = 'TRUST', base = 25) => {
    for (let i = 0; i < n; i++) M.push({ k: keys[i % keys.length], path, closed: true, offset: i / n, speed: 1.1 + (i % 3) * 0.2, lane: (i % 3) - 1, walker: true, show: above(metric, base + (i * 47) % 50) });
  };
  const W = ['walker_a', 'walker_b', 'walker_c', 'walker_d', 'walker_e'];
  walk([[60, -11], [100, -11], [100, -13], [60, -13]], 8, ['worker', 'worker', 'walker_e'], 'COHESION');
  walk([[-12, 16], [12, 16], [12, 18], [-12, 18]], 7, [...W, 'elder'], 'TRUST');
  walk([[-24, 53], [0, 53], [0, 56], [-24, 56]], 10, [...W, 'child'], 'LIFE', 15);
  walk([[14, 38], [56, 38], [56, 40], [14, 40]], 9, [...W, 'child', 'elder'], 'LIFE');
  walk([[-90, -12], [-72, -12], [-72, -10], [-90, -10]], 5, ['farmer', 'farmer', 'child'], 'COHESION');
  walk([[-80, 40], [-60, 40], [-60, 42], [-80, 42]], 6, ['elder', ...W], 'COHESION');
  walk([[-46, 6], [-32, -8], [-30, -6], [-44, 8]], 5, ['farmer', 'walker_b', 'child'], 'TRUST');
  walk([[86, 54], [112, 54], [112, 56], [86, 56]], 6, ['worker'], 'PROD');
  walk([[20, -42], [56, -42], [56, -40], [20, -40]], 6, [...W], 'PROD');
  return M;
}

// Chimney smoke sources come from sprite metadata; extra plumes here (dam spray, port stacks).
export const EXTRA_SMOKE = [
  { x: 108 + 5.5, y: 6.5, z: 74, rate: 0.6, kind: 'smoke' },
];
