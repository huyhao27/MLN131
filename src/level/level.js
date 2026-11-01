// 2D signed distance field on the XZ plane. Positive = walkable, negative = blocked.
// Replaces a physics engine: player and actors only ever call resolve().

let layout = null;
const colliders = new Set();
const walkables = new Set();
let lock = null;

function segment(px, pz, ax, az, bx, bz) {
  const dx = bx - ax, dz = bz - az;
  const len2 = dx * dx + dz * dz || 1;
  const t = Math.max(0, Math.min(1, ((px - ax) * dx + (pz - az) * dz) / len2));
  const cx = ax + dx * t, cz = az + dz * t;
  return { d: Math.hypot(px - cx, pz - cz), t };
}

// Union of capsules along PATH with interpolated width.
export function pathSDF(x, z) {
  const P = layout.PATH;
  let best = -1e9;
  for (let i = 0; i < P.length - 1; i++) {
    const a = P[i], b = P[i + 1];
    const s = segment(x, z, a[0], a[1], b[0], b[1]);
    const w = a[2] + (b[2] - a[2]) * s.t;
    best = Math.max(best, w / 2 - s.d);
  }
  return best;
}

// Approximate signed distance to an ellipse (positive inside).
export function ellipseSDF(c, x, z) {
  const k = Math.hypot((x - c.x) / c.rx, (z - c.z) / c.rz);
  return (1 - k) * Math.min(c.rx, c.rz);
}

// Distance to the stream centerline (not "streaming").
export function streamDistance(x, z) {
  const S = layout.STREAM;
  if (!S) return 1e9;
  let best = 1e9;
  for (let i = 0; i < S.points.length - 1; i++) {
    const a = S.points[i], b = S.points[i + 1];
    best = Math.min(best, segment(x, z, a[0], a[1], b[0], b[1]).d);
  }
  return best;
}

// Positive inside the bridge deck. The bridge runs along z.
function bridgeSDF(x, z) {
  const b = layout.STREAM?.bridge;
  if (!b) return -1e9;
  return Math.min(b.width / 2 - Math.abs(x - b.x), b.length / 2 - Math.abs(z - b.z));
}

// Walkable ground from layout only (no dynamic colliders); used to bake the world map.
export function baseSDF(x, z) {
  let s = pathSDF(x, z);
  for (const name in layout.CLEARINGS) s = Math.max(s, ellipseSDF(layout.CLEARINGS[name], x, z));
  if (layout.STREAM) s = Math.min(s, Math.max(streamDistance(x, z) - layout.STREAM.width / 2, bridgeSDF(x, z)));
  for (const g of layout.GAPS) s = Math.min(s, Math.hypot(x - g.x, z - g.z) - g.r);
  return s;
}

export function sdf(x, z) {
  let s = lock ? ellipseSDF(lock, x, z) : baseSDF(x, z);
  for (const w of walkables) if (!lock || w.duringLock) s = Math.max(s, w.r - Math.hypot(x - w.x, z - w.z));
  for (const c of colliders) s = Math.min(s, Math.hypot(x - c.x, z - c.z) - c.r);
  return s;
}

// Push a circle of radius r out of blocked space along the SDF gradient.
export function resolve(x, z, r) {
  let hit = false;
  for (let i = 0; i < 4; i++) {
    const s = sdf(x, z) - r;
    if (s >= 0) break;
    hit = true;
    const h = 0.05;
    let nx = sdf(x + h, z) - sdf(x - h, z);
    let nz = sdf(x, z + h) - sdf(x, z - h);
    const len = Math.hypot(nx, nz) || 1;
    nx /= len; nz /= len;
    x -= nx * (s - 0.001);
    z -= nz * (s - 0.001);
  }
  return { x, z, hit };
}

// Progress (0..1) of a point projected onto the PATH polyline.
export function pathProgress(x, z) {
  const P = layout.PATH;
  let total = 0, best = 1e9, at = 0;
  const lens = [];
  for (let i = 0; i < P.length - 1; i++) lens.push(Math.hypot(P[i + 1][0] - P[i][0], P[i + 1][1] - P[i][1]));
  const sum = lens.reduce((a, b) => a + b, 0);
  for (let i = 0; i < P.length - 1; i++) {
    const s = segment(x, z, P[i][0], P[i][1], P[i + 1][0], P[i + 1][1]);
    if (s.d < best) { best = s.d; at = total + s.t * lens[i]; }
    total += lens[i];
  }
  return at / sum;
}

export const level = {
  get layout() { return layout; },
  loadLayout(l) {
    layout = l;
    colliders.clear();
    walkables.clear();
    lock = null;
  },
  sdf,
  baseSDF,
  pathSDF,
  streamDistance,
  resolve,
  pathProgress,
  isWalkable: (x, z, r = 0) => sdf(x, z) > r,
  addCollider(x, z, r) { const c = { x, z, r }; colliders.add(c); return c; },
  removeCollider(c) { colliders.delete(c); },
  addWalkable(x, z, r, opts = {}) { const w = { x, z, r, duringLock: !!opts.duringLock }; walkables.add(w); return w; },
  removeWalkable(w) { walkables.delete(w); },
  // Replace the walkable area with one clearing (shrunk by margin) to make a closed arena.
  lockTo(name, margin = 1.5) {
    const c = layout.CLEARINGS[name];
    lock = c ? { x: c.x, z: c.z, rx: c.rx - margin, rz: c.rz - margin } : null;
  },
  unlock() { lock = null; },
  get colliderCount() { return colliders.size; },
};
