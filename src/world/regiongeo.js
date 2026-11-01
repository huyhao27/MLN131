// Geometry of the six management regions (region mode, ARCHITECTURE_REGIONS.md).
// Pure JS (no three.js): shared by the renderer, picking, prop placement and the Node
// layout validator. The same formula runs in the ground shader (GLSL_REGION below), so a
// pixel painted as region R is exactly the ground point regionAt() reports as R.
//
// Method: additively weighted Voronoi over several hand-placed seeds per region, in a
// gently warped domain (smooth sine warp, identical in JS and GLSL) so borders meander
// like hand-drawn boundaries. Land-only: sea points have no region (docks belong to CB).
import { landField, onDock } from './layout.js';

export const REGION_IDS = ['CN', 'NN', 'TT', 'DC', 'VC', 'CB'];

// Seeds: [x, z, weight]. A larger weight pushes that seed's border outward.
export const REGION_SEEDS = {
  CN: [[80, -24, 4], [100, -22, 2], [42, -52, 4], [62, -54, 2], [88, -48, 2], [50, -26, 0], [30, -42, -2]],
  NN: [[-50, 6, 4], [-36, -22, 0], [-6, -54, 2], [-20, -40, 0], [-56, 40, 0], [-32, 64, -2], [-88, 18, -4], [-72, 26, 0]],
  TT: [[-6, 6, 2], [-20, 32, 0], [-10, 50, 0], [-28, 12, -6], [4, 26, -4]],
  DC: [[36, 30, 4], [56, 32, 0], [20, 34, -2], [34, 52, -2], [12, 52, -6]],
  VC: [[-84, -42, 6], [-96, -16, 2], [-110, -48, 2], [-68, -62, 0], [-56, -42, -4]],
  CB: [[102, 52, 4], [84, 58, 0], [118, 30, 0], [112, 8, -2], [76, 72, -4]],
};

// Label anchors: open ground near the heart of each region (world coords).
export const REGION_ANCHORS = {
  CN: { x: 78, z: -42 },
  NN: { x: -40, z: 14 },
  TT: { x: -6, z: 26 },
  DC: { x: 40, z: 40 },
  VC: { x: -88, z: -30 },
  CB: { x: 102, z: 36 },
};

const SEEDS = [];
REGION_IDS.forEach((id, ri) => {
  for (const [x, z, w] of REGION_SEEDS[id]) SEEDS.push({ x, z, w, ri });
});
export const SEED_LIST = SEEDS;

// Domain warp (world units). Mirrored in GLSL_REGION.
export function warp(x, z) {
  return [
    x + 5.0 * Math.sin(z * 0.061 + 1.3) + 2.6 * Math.sin((x + z) * 0.137 + 0.4),
    z + 5.0 * Math.sin(x * 0.053 + 2.1) + 2.6 * Math.sin((x - z) * 0.121 + 1.7),
  ];
}

// Nearest region and the margin to the second nearest (in warped units, ~half the gap).
export function regionField(x, z) {
  const [wx, wz] = warp(x, z);
  const best = new Array(REGION_IDS.length).fill(Infinity);
  for (const s of SEEDS) {
    const d = Math.hypot(wx - s.x, wz - s.z) - s.w;
    if (d < best[s.ri]) best[s.ri] = d;
  }
  let a = 0;
  for (let i = 1; i < best.length; i++) if (best[i] < best[a]) a = i;
  let b = a === 0 ? 1 : 0;
  for (let i = 0; i < best.length; i++) if (i !== a && best[i] < best[b]) b = i;
  return { index: a, id: REGION_IDS[a], second: REGION_IDS[b], margin: (best[b] - best[a]) / 2 };
}

// Is (x, z) part of the island (land, river, reservoir or docks)? Sea -> false.
export const onIsland = (x, z) => landField(x, z) >= 0.03 || onDock(x, z);

// Region at a ground point, or null over the sea.
export function regionAt(x, z) {
  if (!onIsland(x, z)) return null;
  return regionField(x, z).id;
}

// Regions as polygons are not needed: the shader evaluates the field per pixel. For camera
// framing and free-spot searches we keep a coarse sampled bounding box per region.
let boxes = null;
export function regionBoxes() {
  if (boxes) return boxes;
  boxes = {};
  for (const id of REGION_IDS) boxes[id] = { x0: Infinity, x1: -Infinity, z0: Infinity, z1: -Infinity, n: 0, cx: 0, cz: 0 };
  for (let z = -100; z <= 100; z += 2) {
    for (let x = -150; x <= 150; x += 2) {
      const id = regionAt(x, z);
      if (!id) continue;
      const b = boxes[id];
      b.x0 = Math.min(b.x0, x); b.x1 = Math.max(b.x1, x);
      b.z0 = Math.min(b.z0, z); b.z1 = Math.max(b.z1, z);
      b.n++; b.cx += x; b.cz += z;
    }
  }
  for (const b of Object.values(boxes)) { b.cx /= b.n || 1; b.cz /= b.n || 1; b.area = b.n * 4; }
  return boxes;
}

// GLSL twin of regionField(). Needs `uniform vec4 uRSeed[RSEEDS]` (x, z, weight, region index).
export const RSEEDS = SEEDS.length;
export const GLSL_REGION = /* glsl */ `
#define RSEEDS ${SEEDS.length}
uniform vec4 uRSeed[RSEEDS];
vec2 rWarp(vec2 p) {
  return vec2(
    p.x + 5.0 * sin(p.y * 0.061 + 1.3) + 2.6 * sin((p.x + p.y) * 0.137 + 0.4),
    p.y + 5.0 * sin(p.x * 0.053 + 2.1) + 2.6 * sin((p.x - p.y) * 0.121 + 1.7));
}
// Returns (region index a, second region b, distance to the border, coordinate along it).
// The distance is the weighted-Voronoi margin divided by its gradient, so it reads in
// world units whatever the seed layout (no fat lines where two seeds sit in a row).
vec4 regionField(vec2 xz) {
  vec2 w = rWarp(xz);
  float d0 = 1e5, d1 = 1e5, d2 = 1e5, d3 = 1e5, d4 = 1e5, d5 = 1e5;
  vec2 p0 = vec2(0.0), p1 = vec2(0.0), p2 = vec2(0.0), p3 = vec2(0.0), p4 = vec2(0.0), p5 = vec2(0.0);
  for (int i = 0; i < RSEEDS; i++) {
    vec4 s = uRSeed[i];
    float d = length(w - s.xy) - s.z;
    float r = s.w;
    if (r < 0.5) { if (d < d0) { d0 = d; p0 = s.xy; } }
    else if (r < 1.5) { if (d < d1) { d1 = d; p1 = s.xy; } }
    else if (r < 2.5) { if (d < d2) { d2 = d; p2 = s.xy; } }
    else if (r < 3.5) { if (d < d3) { d3 = d; p3 = s.xy; } }
    else if (r < 4.5) { if (d < d4) { d4 = d; p4 = s.xy; } }
    else { if (d < d5) { d5 = d; p5 = s.xy; } }
  }
  float ba = d0, bb = 1e5; float ia = 0.0, ib = 0.0; vec2 pa = p0, pb = p0;
  #define RTAKE(D, I, PP) if (D < ba) { bb = ba; ib = ia; pb = pa; ba = D; ia = I; pa = PP; } else if (D < bb) { bb = D; ib = I; pb = PP; }
  RTAKE(d1, 1.0, p1) RTAKE(d2, 2.0, p2) RTAKE(d3, 3.0, p3) RTAKE(d4, 4.0, p4) RTAKE(d5, 5.0, p5)
  vec2 n = pb - pa;
  vec2 t = normalize(vec2(-n.y, n.x) + 1e-5);
  float g = 0.5 * length(normalize(w - pb + 1e-4) - normalize(w - pa + 1e-4));
  return vec4(ia, ib, (bb - ba) * 0.5 / max(g, 0.06), dot(w, t));
}
`;
