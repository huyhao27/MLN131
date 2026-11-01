// Geometry of the six management regions (region mode, ARCHITECTURE_REGIONS.md).
// Pure JS (no three.js): shared by the renderer, picking, prop placement and the Node
// layout validator. The ground shader reads the same field baked into textures
// (ground.js, bakeRegionField), so a pixel painted as region R is the ground point
// regionAt() reports as R.
//
// Method: additively weighted Voronoi over several hand-placed seeds per region, in a
// gently warped domain (smooth sine warp) so borders meander like hand-drawn boundaries.
// Land-only: sea points have no region (docks belong to CB).
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

// Domain warp (world units).
export function warp(x, z) {
  return [
    x + 5.0 * Math.sin(z * 0.061 + 1.3) + 2.6 * Math.sin((x + z) * 0.137 + 0.4),
    z + 5.0 * Math.sin(x * 0.053 + 2.1) + 2.6 * Math.sin((x - z) * 0.121 + 1.7),
  ];
}

// Nearest region, runner-up region, distance to their border (world units, approximate)
// and a coordinate along that border (for dashes; oriented by region index so it does not
// flip from one side of the border to the other).
export function regionField(x, z) {
  const [wx, wz] = warp(x, z);
  const best = new Array(REGION_IDS.length).fill(Infinity);
  const at = new Array(REGION_IDS.length).fill(null);
  for (const s of SEEDS) {
    const d = Math.hypot(wx - s.x, wz - s.z) - s.w;
    if (d < best[s.ri]) { best[s.ri] = d; at[s.ri] = s; }
  }
  let a = 0;
  for (let i = 1; i < best.length; i++) if (best[i] < best[a]) a = i;
  let b = a === 0 ? 1 : 0;
  for (let i = 0; i < best.length; i++) if (i !== a && best[i] < best[b]) b = i;
  const margin = (best[b] - best[a]) / 2;
  // The margin grows at rate |ua - ub| / 2 (unit vectors toward both seeds): divide it out.
  const pa = at[a], pb = at[b];
  const la = Math.hypot(wx - pa.x, wz - pa.z) || 1, lb = Math.hypot(wx - pb.x, wz - pb.z) || 1;
  const g = 0.5 * Math.hypot((wx - pb.x) / lb - (wx - pa.x) / la, (wz - pb.z) / lb - (wz - pa.z) / la);
  const [lo, hi] = a < b ? [pa, pb] : [pb, pa];
  const nx = hi.x - lo.x, nz = hi.z - lo.z, nl = Math.hypot(nx, nz) || 1;
  return {
    index: a, id: REGION_IDS[a], second: REGION_IDS[b], secondIndex: b, margin,
    dist: margin / Math.max(g, 0.06),
    along: (wx * -nz + wz * nx) / nl,
  };
}

// Is (x, z) part of the island (land, river, reservoir or docks)? Sea -> false.
export const onIsland = (x, z) => landField(x, z) >= 0.03 || onDock(x, z);

// Region at a ground point, or null over the sea.
export function regionAt(x, z) {
  if (!onIsland(x, z)) return null;
  return regionField(x, z).id;
}

// Coarse sampled bounding box, centroid and area per region (camera framing).
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

// Field bounds baked for the ground shader (covers the island with margin).
export const REGION_FIELD_RECT = { x0: -160, z0: -110, w: 320, h: 220 };
