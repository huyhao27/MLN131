// Occupancy model of the island: what physically sits where on the ground plane.
// Every prop gets a footprint rectangle (the base of its billboard card is the FRONT edge,
// the building extends back toward -z). Roads are polylines with a width, water comes from
// the land field / river / reservoir. validateLayout() reports every overlap, so the
// layout can be proven coherent in Node (scripts/validate-world.mjs) or in the demo (D key).
// No three.js here: this file must run headless.
import { ROADS, FIELDS, distPolyline, isWater, onDock } from './layout.js';

// Ground footprint per sprite kind. hw: half width, d: depth behind the base, f: in front.
// cls: building | solid (vehicles, crowds, stalls, crates) | kerb (street furniture)
//      | plant | water (sits on water) | backdrop (ignored)
const B = (hw, d, f = 0.3) => ({ cls: 'building', hw, d, f });
const S = (hw, d, f = 0.3) => ({ cls: 'solid', hw, d, f });
const K = (hw, d, f = 0.2) => ({ cls: 'kerb', hw, d, f });
const T = (hw, d = hw, f = hw * 0.5) => ({ cls: 'plant', hw, d, f });
export const FOOT = {
  // plants (trunk / clump only, canopies may overhang)
  tree_a: T(0.8), tree_b: T(0.7), tree_c: T(0.7), tree_bloom: T(0.7), tree_autumn: T(0.7),
  banyan: T(1.8), palm: T(0.6), pine: T(0.6), bamboo: T(0.9), bush: T(1.1, 0.9), bush_lime: T(1.0, 0.9),
  flowers: T(0.8, 0.6), rock: T(1.0, 0.8),
  // backdrop
  mountain_a: { cls: 'backdrop' }, mountain_b: { cls: 'backdrop' }, mountain_c: { cls: 'backdrop' },
  hill: { cls: 'backdrop' }, cloud_a: { cls: 'backdrop' }, cloud_b: { cls: 'backdrop' },
  // homes
  house_red: B(2.7, 2.6), house_blue: B(2.7, 2.6), house_terra: B(2.7, 2.6),
  hut: B(2.4, 2.2), solar_house: B(2.7, 2.6), stilt: B(2.9, 2.8), barn: B(3.2, 3.0),
  greenhouse: B(4.3, 3.6), shophouses: B(4.7, 4.4), apt_cream: B(4.3, 4.2), apt_pink: B(4.3, 4.2), apt_blue: B(4.3, 4.2),
  // work & public
  tower: B(3.4, 3.4), lab: B(6.4, 5.4), factory: B(6.8, 6.4), tanks: B(3.0, 2.8), warehouse: B(4.7, 4.4),
  crane: B(3.0, 3.0), scaffold: B(4.2, 3.6), hospital: B(8.2, 7.0), school: B(7.3, 6.4),
  kindergarten: B(5.6, 4.6), elder_home: B(5.6, 4.6), community_hall: B(5.2, 4.4), temple: B(6.4, 5.6),
  dam: { cls: 'dam', hw: 14, d: 3, f: 0.5 }, pylon: B(1.2, 1.2), wind_turbine: B(1.2, 1.2),
  // Lighthouses stand on coastal rocks by design: exempt from the water test.
  lighthouse: { cls: 'shore', hw: 1.4, d: 1.4, f: 0.3 },
  gantry: B(4.4, 3.0), containers: S(3.6, 2.6), haystack: S(0.8, 0.8), buffalo: S(1.2, 1.0), barnyard: S(1, 1),
  stall_red: S(1.6, 1.4), stall_teal: S(1.6, 1.4), stall_yellow: S(1.6, 1.4), bunting: S(4.0, 0.6),
  ambulance: S(1.7, 1.4), truck: S(2.3, 1.5), car_red: S(1.5, 1.2), car_blue: S(1.5, 1.2), car_white: S(1.5, 1.2),
  bus: S(2.5, 1.4), rider: S(1.0, 0.8),
  crowd_a: S(1.9, 1.4), crowd_b: S(1.6, 1.4), crowd_cheer: S(1.9, 1.4), crowd_workers: S(1.9, 1.4),
  crowd_farmers: S(1.9, 1.4), crowd_family: S(1.8, 1.4), crowd_elders: S(1.6, 1.4),
  walker_a: S(0.4, 0.5), walker_b: S(0.4, 0.5), walker_c: S(0.4, 0.5), walker_d: S(0.4, 0.5), walker_e: S(0.4, 0.5),
  worker: S(0.4, 0.5), farmer: S(0.45, 0.5), elder: S(0.45, 0.5), child: S(0.35, 0.4),
  // street furniture: belongs on kerbs and sidewalks
  lamp: K(0.35, 0.35), planter: K(0.7, 0.6), broken_fence: K(1.6, 0.4),
  // litter can lie anywhere free
  trash: S(1.1, 0.8), boxes: S(1.1, 0.9),
  // on water
  ship: { cls: 'water', hw: 7, d: 2.5, f: 0.5 }, boat: { cls: 'water', hw: 2, d: 1, f: 0.3 },
  // region mode
  site_fence: S(3.5, 0.5), road_block: K(2.0, 0.5), sluice: S(2.3, 1.0), bus_stop: K(1.9, 0.7),
  cold_store: B(5.2, 4.4), substation: B(4.3, 2.6), clinic: B(3.8, 3.4), workshop: B(5.2, 4.6),
  // A footbridge spans the river by design: exempt from the water test like the dam.
  bridge: { cls: 'dam', hw: 6, d: 1.2, f: 0.3 },
};

export function footOf(p) {
  const f = FOOT[p.k];
  if (!f) throw new Error(`[footprint] no footprint for kind "${p.k}"`);
  if (f.cls === 'backdrop') return null;
  const s = p.s ?? 1;
  return { cls: f.cls, x0: p.x - f.hw * s, x1: p.x + f.hw * s, z0: p.z - f.d * s, z1: p.z + f.f * s };
}

const rectsOverlap = (a, b, pad = 0) => a.x0 < b.x1 + pad && b.x0 < a.x1 + pad && a.z0 < b.z1 + pad && b.z0 < a.z1 + pad;
const inRect = (x, z, r, pad = 0) => x > r.x0 - pad && x < r.x1 + pad && z > r.z0 - pad && z < r.z1 + pad;
// Sample points over a rect (corners, edge midpoints, center).
function rectSamples(r) {
  const xs = [r.x0, (r.x0 + r.x1) / 2, r.x1], zs = [r.z0, (r.z0 + r.z1) / 2, r.z1];
  const out = [];
  for (const x of xs) for (const z of zs) out.push([x, z]);
  return out;
}

// Distance from a rect to a polyline (0 if the line passes through the rect).
function ptSeg(px, pz, ax, az, bx, bz) {
  const dx = bx - ax, dz = bz - az;
  const t = Math.max(0, Math.min(1, ((px - ax) * dx + (pz - az) * dz) / (dx * dx + dz * dz || 1)));
  return Math.hypot(px - ax - dx * t, pz - az - dz * t);
}
function segRectDist(ax, az, bx, bz, r) {
  // Liang-Barsky style: does the segment cross the rect?
  let t0 = 0, t1 = 1;
  const dx = bx - ax, dz = bz - az;
  const clip = (p, q) => {
    if (p === 0) return q >= 0;
    const t = q / p;
    if (p < 0) { if (t > t1) return false; if (t > t0) t0 = t; } else { if (t < t0) return false; if (t < t1) t1 = t; }
    return true;
  };
  if (clip(-dx, ax - r.x0) && clip(dx, r.x1 - ax) && clip(-dz, az - r.z0) && clip(dz, r.z1 - az)) return 0;
  const cl = (v, a, b) => Math.max(a, Math.min(b, v));
  return Math.min(
    ptSeg(r.x0, r.z0, ax, az, bx, bz), ptSeg(r.x1, r.z0, ax, az, bx, bz),
    ptSeg(r.x0, r.z1, ax, az, bx, bz), ptSeg(r.x1, r.z1, ax, az, bx, bz),
    Math.hypot(ax - cl(ax, r.x0, r.x1), az - cl(az, r.z0, r.z1)),
    Math.hypot(bx - cl(bx, r.x0, r.x1), bz - cl(bz, r.z0, r.z1)),
  );
}
// maxD: segments whose bounding box is farther than this are skipped (result capped at maxD).
export function rectPolylineDist(r, pts, maxD = Infinity) {
  let d = maxD;
  for (let i = 0; i < pts.length - 1; i++) {
    const [ax, az] = pts[i], [bx, bz] = pts[i + 1];
    if (Math.min(ax, bx) > r.x1 + d || Math.max(ax, bx) < r.x0 - d || Math.min(az, bz) > r.z1 + d || Math.max(az, bz) < r.z0 - d) continue;
    d = Math.min(d, segRectDist(ax, az, bx, bz, r));
  }
  return d;
}

// Polyline offset sideways by `off` (+ = left of the drawing direction), per-vertex normals.
export function roadOffsetLine(pts, off) {
  return pts.map((p, i) => {
    const a = pts[Math.max(0, i - 1)], b = pts[Math.min(pts.length - 1, i + 1)];
    const dx = b[0] - a[0], dz = b[1] - a[1], L = Math.hypot(dx, dz) || 1;
    return [p[0] - (dz / L) * off, p[1] + (dx / L) * off];
  });
}

// Clearance a footprint must keep from a road's centerline.
const ROAD_CLEAR = { building: 1.2, solid: 0.6, kerb: 0.25, plant: 0.6 };

// Nearest road edge distance (negative = on the carriageway).
export function roadClearance(x, z) {
  let best = Infinity;
  for (const r of ROADS) best = Math.min(best, distPolyline(x, z, r.pts) - r.w / 2);
  return best;
}
export const onRoad = (x, z, pad = 0) => roadClearance(x, z) < pad;

const inField = (r) => FIELDS.some((f) => rectsOverlap(r, { x0: f.x - f.w / 2, x1: f.x + f.w / 2, z0: f.z - f.d / 2, z1: f.z + f.d / 2 }));

// Walk a mover's path exactly like the renderer does (lane offset included) and
// return sample points [x, z].
export function samplePath(m, step = 0.6) {
  const pts = m.path;
  const out = [];
  const lens = [0];
  for (let j = 1; j < pts.length; j++) lens.push(lens[j - 1] + Math.hypot(pts[j][0] - pts[j - 1][0], pts[j][1] - pts[j - 1][1]));
  const L = lens[lens.length - 1];
  const dirs = m.closed ? [1] : [1, -1];
  for (const dir of dirs) {
    for (let s = 0; s <= L; s += step) out.push(moverPoint(m, pts, lens, L, s, dir));
  }
  return out;
}

// Position of a mover at arclength s (0..L) along its path, travelling in dir (+1/-1).
// Shared with the renderer so validation sees exactly what is drawn.
export function moverPoint(m, path, lens, L, s, dir) {
  let j = 1;
  while (j < lens.length - 1 && lens[j] < s) j++;
  const a = path[j - 1], b = path[j];
  const seg = lens[j] - lens[j - 1] || 1;
  const f = Math.max(0, Math.min(1, (s - lens[j - 1]) / seg));
  const dx = (b[0] - a[0]) / seg, dz = (b[1] - a[1]) / seg;
  // Ping-pong paths squeeze the lane offset to zero at the ends so the U-turn is continuous.
  const endK = m.closed ? 1 : Math.min(1, Math.min(s, L - s) / 2.5);
  const lane = (m.laneOff ?? 0) * endK * dir;
  return [a[0] + (b[0] - a[0]) * f - dz * lane, a[1] + (b[1] - a[1]) * f + dx * lane, dx * dir, dz * dir];
}

// Visible subset under a world state S (undefined -> everything that can ever appear).
// Region mode: S.localFor(p) gives the state a prop's rule sees (its own region's values).
const visible = (list, S) => (S ? list.filter((p) => !p.show || p.show(S.localFor ? S.localFor(p) : S) > 0) : list);

// Returns { overlaps: [{type, a, b?, at?}], counts }. With no state every prop that can
// ever be shown is checked at once (state-reactive props must already have free slots);
// props sharing an `alt` id replace each other and are never shown together.
export function validateLayout(props, movers, { state } = {}) {
  const overlaps = [];
  const P = visible(props, state).map((p) => ({ p, r: footOf(p) })).filter((e) => e.r);
  const name = (p) => `${p.k}@${p.x.toFixed(1)},${p.z.toFixed(1)}`;

  for (const { p, r } of P) {
    if (r.cls === 'water') {
      if (!rectSamples(r).every(([x, z]) => isWater(x, z))) overlaps.push({ type: 'not-on-water', a: name(p) });
      continue;
    }
    if (r.cls === 'dam' || r.cls === 'shore') continue;
    // Land, not river / reservoir / sea (docks count as land).
    if (rectSamples(r).some(([x, z]) => isWater(x, z))) overlaps.push({ type: 'prop-water', a: name(p) });
    // Roads.
    for (let i = 0; i < ROADS.length; i++) {
      const d = rectPolylineDist(r, ROADS[i].pts, ROADS[i].w / 2 + 5) - ROADS[i].w / 2;
      if (d < ROAD_CLEAR[r.cls]) overlaps.push({ type: 'prop-road', a: name(p), b: `road${i}`, d: +d.toFixed(2) });
    }
    if (r.cls === 'building' && inField(r)) overlaps.push({ type: 'building-field', a: name(p) });
  }
  // Pairs: anything solid against anything solid; plants only against solids.
  for (let i = 0; i < P.length; i++) {
    for (let j = i + 1; j < P.length; j++) {
      const A = P[i], Bb = P[j];
      if (A.p.alt != null && A.p.alt === Bb.p.alt) continue;
      // A scattered tree that yields to a region work is never shown together with it.
      if (A.p.yieldTo?.has(Bb.p) || Bb.p.yieldTo?.has(A.p)) continue;
      const ca = A.r.cls, cb = Bb.r.cls;
      if (ca === 'plant' && cb === 'plant') continue;
      if (ca === 'water' || cb === 'water') continue;
      const pad = ca === 'building' && cb === 'building' ? 0.4 : 0.1;
      if (rectsOverlap(A.r, Bb.r, pad)) overlaps.push({ type: 'prop-prop', a: name(A.p), b: name(Bb.p) });
    }
  }

  // Movers.
  const solids = P.filter((e) => e.r.cls !== 'water');
  const M = visible(movers, state);
  for (const m of M) {
    const label = `${m.k}#${m.id ?? ''}`;
    const bad = new Map();
    const flag = (type, x, z, extra = '') => { if (!bad.has(type + extra)) bad.set(type + extra, { type, a: label, at: [+x.toFixed(1), +z.toFixed(1)], b: extra || undefined }); };
    for (const [x, z] of samplePath(m)) {
      if (m.k === 'boat') {
        if (!isWater(x, z) || !isWater(x + 2, z) || !isWater(x - 2, z)) flag('boat-on-land', x, z);
        continue;
      }
      if (isWater(x, z)) flag('mover-water', x, z);
      if (m.walker) {
        if (onRoad(x, z, 0.3)) flag('walker-on-road', x, z);
        for (const e of solids) if (e.r.cls !== 'dam' && inRect(x, z, e.r, 0.2)) flag('walker-hits-prop', x, z, name(e.p));
      } else {
        if (!ROADS.some((r) => distPolyline(x, z, r.pts) <= r.w / 2 - 0.2) && !onDock(x, z)) flag('vehicle-off-road', x, z);
        // Dam and bridges span above the lane.
        for (const e of solids) if (e.r.cls !== 'plant' && e.r.cls !== 'dam' && inRect(x, z, e.r, 0.3)) flag('vehicle-hits-prop', x, z, name(e.p));
      }
    }
    overlaps.push(...bad.values());
  }
  return { overlaps, counts: { props: P.length, movers: M.length } };
}

// ---------- placement ----------
// An occupancy grid of everything already placed, plus reserved walkway points.
export class Occupancy {
  constructor(walkways = []) {
    this.items = [];
    this.walk = walkways.map((w) => {
      const pts = samplePath(w, 0.8);
      const xs = pts.map((p) => p[0]), zs = pts.map((p) => p[1]);
      return { pts, box: { x0: Math.min(...xs), x1: Math.max(...xs), z0: Math.min(...zs), z1: Math.max(...zs) } };
    });
  }

  // Why the prop p (with its current x, z) cannot stand there, or null when it can.
  conflict(p, { roadPad = 0 } = {}) {
    const r = footOf(p);
    if (!r || r.cls === 'water' || r.cls === 'dam' || r.cls === 'shore') return null;
    // Region works stay inside their region.
    if (p.keepIn && !p.keepIn(p.x, p.z)) return 'region';
    if (rectSamples(r).some(([x, z]) => isWater(x, z))) return 'water';
    const clear = ROAD_CLEAR[r.cls] + roadPad;
    for (const rd of ROADS) if (rectPolylineDist(r, rd.pts, rd.w / 2 + clear + 0.01) - rd.w / 2 < clear) return 'road';
    if (r.cls === 'building' && inField(r)) return 'field';
    for (const w of this.walk) {
      if (!rectsOverlap(r, w.box, 0.8)) continue;
      for (const [x, z] of w.pts) if (inRect(x, z, r, 0.7)) return 'walkway';
    }
    for (const o of this.items) {
      if (o.p.alt != null && o.p.alt === p.alt) continue;
      if (o.r.cls === 'plant' && r.cls === 'plant') continue;
      if (rectsOverlap(r, o.r, o.r.cls === 'building' && r.cls === 'building' ? 0.6 : 0.25)) return o.p;
    }
    return null;
  }

  add(p) {
    const r = footOf(p);
    if (r) this.items.push({ p, r });
  }
}

const RANK = { building: 0, solid: 1, kerb: 2, plant: 3 };
const SEARCH = { building: 16, solid: 12, kerb: 4, plant: 6 };
// Street furniture within this distance of a road edge belongs to that road's kerb.
const KERB_REACH = 5;

// Nearest road to (x, z): { road, foot:[x,z], n:[nx,nz] (unit normal toward the point), s, side }.
function nearestRoad(x, z) {
  let best = null;
  for (const road of ROADS) {
    let acc = 0;
    for (let i = 0; i < road.pts.length - 1; i++) {
      const [ax, az] = road.pts[i], [bx, bz] = road.pts[i + 1];
      const dx = bx - ax, dz = bz - az, L = Math.hypot(dx, dz) || 1;
      const t = Math.max(0, Math.min(1, ((x - ax) * dx + (z - az) * dz) / (L * L)));
      const fx = ax + dx * t, fz = az + dz * t;
      const d = Math.hypot(x - fx, z - fz) - road.w / 2;
      if (!best || d < best.d) {
        const side = (dx * (z - az) - dz * (x - ax)) >= 0 ? 1 : -1;
        best = { d, road, s: acc + L * t, side };
      }
      acc += L;
    }
  }
  return best;
}
// Point and left normal at arclength s along a road.
function roadFrame(road, s) {
  let acc = 0;
  const pts = road.pts;
  for (let i = 0; i < pts.length - 1; i++) {
    const [ax, az] = pts[i], [bx, bz] = pts[i + 1];
    const L = Math.hypot(bx - ax, bz - az) || 1;
    if (s <= acc + L || i === pts.length - 2) {
      const t = Math.max(0, Math.min(1, (s - acc) / L));
      const dx = (bx - ax) / L, dz = (bz - az) / L;
      return { x: ax + (bx - ax) * t, z: az + (bz - az) * t, nx: -dz, nz: dx };
    }
    acc += L;
  }
  return null;
}

// Street furniture goes on the kerb of the nearest road, sliding along it to a free spot.
function placeKerb(p, occ) {
  const f = FOOT[p.k];
  const near = nearestRoad(p.x, p.z);
  if (!near) return false;
  const { road } = near;
  for (let k = 0; k <= 10; k++) {
    const ds = (k % 2 ? 1 : -1) * Math.ceil(k / 2) * 1.3;
    for (const side of [near.side, -near.side]) {
      const fr = roadFrame(road, near.s + ds);
      if (!fr) continue;
      const nx = fr.nx * side, nz = fr.nz * side;
      const ext = f.hw * Math.abs(nx) + (nz > 0 ? f.d : f.f) * Math.abs(nz);
      const off = road.w / 2 + 0.35 + ext;
      p.x = fr.x + nx * off;
      p.z = fr.z + nz * off;
      if (!occ.conflict(p)) return true;
    }
  }
  return false;
}

// Move p to the nearest free spot within its search radius (spiral search).
function placeNear(p, occ, maxR) {
  if (!occ.conflict(p)) return true;
  const x0 = p.x, z0 = p.z;
  for (let r = 0.75; r <= maxR; r += 0.75) {
    const n = Math.max(8, Math.round(r * 5));
    const a0 = (x0 * 7 + z0 * 13) % (Math.PI * 2);
    for (let i = 0; i < n; i++) {
      const a = a0 + (i / n) * Math.PI * 2;
      p.x = x0 + Math.cos(a) * r;
      p.z = z0 + Math.sin(a) * r;
      if (!occ.conflict(p)) return true;
    }
  }
  p.x = x0; p.z = z0;
  return false;
}

// Resolve the authored layout into a physically coherent one. Buildings claim space first,
// then crowds/vehicles/stalls, then kerb furniture (snapped to road edges), then plants.
// Props sharing an `alt` id are variants of the same slot and move together.
// Returns the kept props; plants that find no room are dropped. `p.moved` records nudges.
export function settle(raw, occ, { log = false } = {}) {
  const order = raw.map((p, i) => ({ p, i, rank: RANK[FOOT[p.k]?.cls] ?? -1 })).sort((a, b) => a.rank - b.rank || a.i - b.i);
  const altPos = new Map();
  const drop = new Set();
  for (const { p } of order) {
    const cls = FOOT[p.k]?.cls;
    if (!(cls in RANK)) { occ.add(p); continue; }
    const ox = p.x, oz = p.z;
    let ok;
    if (p.alt != null && altPos.has(p.alt)) {
      [p.x, p.z] = altPos.get(p.alt);
      ok = !occ.conflict(p) || placeNear(p, occ, p.search ?? SEARCH[cls]);
    } else if (cls === 'kerb' && nearestRoad(p.x, p.z).d < KERB_REACH) ok = placeKerb(p, occ);
    else ok = placeNear(p, occ, p.search ?? SEARCH[cls]);
    if (!ok) {
      if (cls === 'plant' || cls === 'kerb' || p.optional) { drop.add(p); continue; }
      if (log) console.warn('[layout] no free slot for', p.k, ox, oz, '->', occ.conflict(p));
    }
    p.moved = Math.hypot(p.x - ox, p.z - oz);
    if (p.alt != null && !altPos.has(p.alt)) altPos.set(p.alt, [p.x, p.z]);
    occ.add(p);
  }
  return raw.filter((p) => !drop.has(p));
}

