// Debug overlay drawn on the ground: road edges, prop footprints, mover paths and
// validation failures (red). Toggled from the demo (D) via world.debug.showLayout().
import * as THREE from 'three';
import { ROADS } from './layout.js';
import { footOf, samplePath, roadOffsetLine } from './footprint.js';

const COLORS = {
  road: 0x303030, building: 0x8a3c10, solid: 0xd07a10, kerb: 0x1f5fd0, plant: 0x1f8a2f,
  water: 0x1040a0, dam: 0x555555, shore: 0x555555, vehicle: 0xc000c0, walker: 0x00a050, boat: 0x0050ff, bad: 0xff0000,
};

export function createLayoutOverlay(props, movers, overlaps) {
  const group = new THREE.Group();
  group.name = 'layout-overlay';
  group.visible = false;
  const buckets = new Map();
  // Three parallel copies per segment so the 1px lines read on a projector.
  const seg = (color, a, b) => {
    if (!buckets.has(color)) buckets.set(color, []);
    const arr = buckets.get(color);
    for (const [ox, oz] of [[0, 0], [0.12, 0.12], [-0.12, -0.12]]) arr.push(a[0] + ox, 0.12, a[1] + oz, b[0] + ox, 0.12, b[1] + oz);
  };
  const poly = (color, pts, closed = false) => {
    for (let i = 0; i < pts.length - 1; i++) seg(color, pts[i], pts[i + 1]);
    if (closed && pts.length > 2) seg(color, pts[pts.length - 1], pts[0]);
  };
  const rect = (color, r) => poly(color, [[r.x0, r.z0], [r.x1, r.z0], [r.x1, r.z1], [r.x0, r.z1]], true);
  const cross = (color, x, z, s = 1.6) => { seg(color, [x - s, z - s], [x + s, z + s]); seg(color, [x - s, z + s], [x + s, z - s]); };

  ROADS.forEach((r) => {
    poly(COLORS.road, roadOffsetLine(r.pts, r.w / 2));
    poly(COLORS.road, roadOffsetLine(r.pts, -r.w / 2));
  });
  const bad = new Set();
  for (const o of overlaps) {
    for (const s of [o.a, o.b]) if (s) bad.add(s);
    if (o.at) cross(COLORS.bad, o.at[0], o.at[1]);
  }
  for (const p of props) {
    const r = footOf(p);
    if (!r) continue;
    const name = `${p.k}@${p.x.toFixed(1)},${p.z.toFixed(1)}`;
    rect(bad.has(name) ? COLORS.bad : COLORS[r.cls], r);
    if (bad.has(name)) cross(COLORS.bad, p.x, p.z);
  }
  const drawn = new Set();
  for (const m of movers) {
    const key = m.path;
    if (drawn.has(key) && m.k !== 'boat') continue;
    drawn.add(key);
    const color = m.k === 'boat' ? COLORS.boat : m.walker ? COLORS.walker : COLORS.vehicle;
    const pts = samplePath(m, 1.2);
    // One polyline per travel direction (samplePath returns forward then backward).
    const half = m.closed ? pts.length : Math.floor(pts.length / 2);
    poly(color, pts.slice(0, half));
    if (!m.closed) poly(color, pts.slice(half));
  }

  for (const [color, arr] of buckets) {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(arr, 3));
    const mat = new THREE.LineBasicMaterial({ color, depthTest: false, transparent: true, opacity: 0.95 });
    const lines = new THREE.LineSegments(g, mat);
    lines.renderOrder = 1000;
    lines.frustumCulled = false;
    group.add(lines);
  }
  return group;
}
