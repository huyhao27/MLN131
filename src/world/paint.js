// Canvas2D painting primitives: watercolor washes, wobbly ink, foliage blobs.
// Light always comes from the top-left; shadows mix toward ink, never black.
import { noise1 } from '../core/rng.js';
import { PAL, mix, shade, rgba } from './palette.js';

export function makeCanvas(w, h) {
  const c = typeof OffscreenCanvas !== 'undefined' && typeof document === 'undefined'
    ? new OffscreenCanvas(Math.max(1, Math.ceil(w)), Math.max(1, Math.ceil(h)))
    : document.createElement('canvas');
  c.width = Math.max(1, Math.ceil(w));
  c.height = Math.max(1, Math.ceil(h));
  return c;
}

// Smooth closed/open path through points (quadratic curves via midpoints).
export function tracePath(ctx, pts, closed = true) {
  const n = pts.length;
  if (n < 2) return;
  ctx.beginPath();
  if (closed) {
    const mid = (a, b) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
    const s = mid(pts[n - 1], pts[0]);
    ctx.moveTo(s[0], s[1]);
    for (let i = 0; i < n; i++) {
      const p = pts[i], m = mid(p, pts[(i + 1) % n]);
      ctx.quadraticCurveTo(p[0], p[1], m[0], m[1]);
    }
    ctx.closePath();
  } else {
    ctx.moveTo(pts[0][0], pts[0][1]);
    for (let i = 1; i < n - 1; i++) {
      const m = [(pts[i][0] + pts[i + 1][0]) / 2, (pts[i][1] + pts[i + 1][1]) / 2];
      ctx.quadraticCurveTo(pts[i][0], pts[i][1], m[0], m[1]);
    }
    ctx.lineTo(pts[n - 1][0], pts[n - 1][1]);
  }
}

// Straight-edged polygon (buildings), corners kept sharp.
export function polyPath(ctx, pts) {
  ctx.beginPath();
  ctx.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
  ctx.closePath();
}

// Polygon in polar coordinates with rounded lobes (foliage, rocks, clouds).
export function lobedBlob(cx, cy, R, rng, { lobes = 7, depth = 0.25, jitter = 0.08, squash = 1, steps = 48 } = {}) {
  const amps = Array.from({ length: lobes }, () => rng.range(0.6, 1.4));
  const rot = rng() * Math.PI * 2;
  const seed = rng() * 1000;
  const pts = [];
  for (let i = 0; i < steps; i++) {
    const f = (i / steps) * Math.PI * 2;
    const m = ((f + rot) / (Math.PI * 2)) * lobes;
    const lobe = Math.pow(Math.sin((m % 1) * Math.PI), 0.55) * amps[Math.floor(m) % lobes];
    const L = R * (1 - depth + depth * lobe) * (1 + noise1(seed + f * 1.7) * jitter);
    pts.push([cx + Math.cos(f) * L, cy + Math.sin(f) * L * squash]);
  }
  return pts;
}

// Slightly hand-drawn version of a polygon: each vertex nudged a little.
export function jitterPts(pts, rng, amt = 0.6) {
  return pts.map(([x, y]) => [x + rng.range(-amt, amt), y + rng.range(-amt, amt)]);
}

function bounds(pts) {
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (const [x, y] of pts) {
    if (x < x0) x0 = x;
    if (y < y0) y0 = y;
    if (x > x1) x1 = x;
    if (y > y1) y1 = y;
  }
  return { x0, y0, x1, y1, w: x1 - x0, h: y1 - y0 };
}

// Watercolor wash: base fill, light gradient from top-left, pigment dabs, pooled darker edge.
export function wash(ctx, pts, color, rng, { smooth = false, light = 0.18, dabs = 1, pool = 0.35, outline = 0.28, grad = true } = {}) {
  const b = bounds(pts);
  ctx.save();
  if (smooth) tracePath(ctx, pts); else polyPath(ctx, pts);
  ctx.fillStyle = color;
  ctx.fill();
  ctx.clip();
  if (grad && light > 0) {
    const g = ctx.createLinearGradient(b.x0, b.y0, b.x1, b.y1);
    g.addColorStop(0, rgba(shade(color, 0.5), light));
    g.addColorStop(0.55, rgba(color, 0));
    g.addColorStop(1, rgba(shade(color, -0.35), light * 0.9));
    ctx.fillStyle = g;
    ctx.fillRect(b.x0 - 2, b.y0 - 2, b.w + 4, b.h + 4);
  }
  // Pigment granulation: soft dabs of slightly varied color.
  const n = Math.min(60, Math.floor((b.w * b.h) / 140 * dabs));
  for (let i = 0; i < n; i++) {
    const x = rng.range(b.x0, b.x1), y = rng.range(b.y0, b.y1);
    const r = rng.range(2, 2 + Math.min(b.w, b.h) * 0.22);
    ctx.fillStyle = rgba(rng.chance(0.5) ? shade(color, 0.22) : shade(color, -0.18), rng.range(0.05, 0.13));
    ctx.beginPath();
    ctx.ellipse(x, y, r, r * rng.range(0.5, 1), rng() * Math.PI, 0, Math.PI * 2);
    ctx.fill();
  }
  // Pooled edge: pigment collects at the rim of a wash.
  if (pool > 0) {
    if (smooth) tracePath(ctx, pts); else polyPath(ctx, pts);
    ctx.strokeStyle = rgba(shade(color, -0.4), pool);
    ctx.lineWidth = Math.max(1.5, Math.min(b.w, b.h) * 0.06);
    ctx.stroke();
  }
  ctx.restore();
  if (outline > 0) inkPath(ctx, pts, rng, { alpha: outline, smooth });
}

// Wobbly thin ink line around a polygon.
export function inkPath(ctx, pts, rng, { alpha = 0.3, width = 1.2, smooth = false, closed = true, color = PAL.ink } = {}) {
  ctx.save();
  ctx.strokeStyle = rgba(color, alpha);
  ctx.lineWidth = width;
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  const j = jitterPts(pts, rng, 0.5);
  if (smooth) tracePath(ctx, j, closed);
  else {
    ctx.beginPath();
    ctx.moveTo(j[0][0], j[0][1]);
    for (let i = 1; i < j.length; i++) ctx.lineTo(j[i][0], j[i][1]);
    if (closed) ctx.closePath();
  }
  ctx.stroke();
  ctx.restore();
}

export function line(ctx, x0, y0, x1, y1, color, width = 1.5, alpha = 1) {
  ctx.save();
  ctx.strokeStyle = rgba(color, alpha);
  ctx.lineWidth = width;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(x0, y0);
  ctx.lineTo(x1, y1);
  ctx.stroke();
  ctx.restore();
}

export function disc(ctx, x, y, r, color, alpha = 1) {
  ctx.fillStyle = rgba(color, alpha);
  ctx.beginPath();
  ctx.arc(x, y, Math.max(0.3, r), 0, Math.PI * 2);
  ctx.fill();
}

export function rectPts(x, y, w, h) {
  return [[x, y], [x + w, y], [x + w, y + h], [x, y + h]];
}

// Soft glow used on the emission canvas.
export function glowDot(ctx, x, y, r, a = 1) {
  const g = ctx.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, `rgba(255,255,255,${a})`);
  g.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = g;
  ctx.fillRect(x - r, y - r, r * 2, r * 2);
}

// One foliage cluster: shadow blob, body shifted toward the light, highlight, sunlit rim.
export function foliage(ctx, cx, cy, R, rng, pal, { squash = 0.9, lobes = 7 } = {}) {
  const base = lobedBlob(cx, cy, R, rng, { lobes, depth: 0.28, squash });
  wash(ctx, base, pal.shadow, rng, { smooth: true, light: 0, pool: 0.25, outline: 0.18, dabs: 0.6 });
  ctx.save();
  tracePath(ctx, base);
  ctx.clip();
  const body = lobedBlob(cx - R * 0.12, cy - R * 0.14, R * 0.86, rng, { lobes, depth: 0.3, squash });
  tracePath(ctx, body);
  ctx.fillStyle = pal.body;
  ctx.fill();
  const hl = lobedBlob(cx - R * 0.3, cy - R * 0.32, R * 0.48, rng, { lobes: 5, depth: 0.35, squash });
  tracePath(ctx, hl);
  ctx.fillStyle = pal.light;
  ctx.fill();
  // Leaf dabs.
  for (let i = 0; i < 18; i++) {
    const a = rng() * Math.PI * 2, d = rng() * R * 0.85;
    const x = cx + Math.cos(a) * d, y = cy + Math.sin(a) * d * squash;
    const lit = (x - cx) + (y - cy) < 0;
    ctx.fillStyle = rgba(lit ? pal.hl : pal.deep, rng.range(0.25, 0.5));
    ctx.beginPath();
    ctx.ellipse(x, y, R * 0.13, R * 0.08, rng() * Math.PI, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

export const LEAF = {
  oak: { deep: '#2f4a33', shadow: '#456b45', body: '#5f8a4e', light: '#88ad5c', hl: '#c3cf73' },
  lime: { deep: '#3d5a34', shadow: '#5b7f43', body: '#7ea350', light: '#a8c463', hl: '#dcdb84' },
  teal: { deep: '#2a4a46', shadow: '#3e6658', body: '#578463', light: '#7ea472', hl: '#b4c98a' },
  autumn: { deep: '#6a4a2c', shadow: '#9b6b3a', body: '#c08c45', light: '#dcb35c', hl: '#f0d488' },
  blossom: { deep: '#8a4f5c', shadow: '#c27b85', body: '#e09ea2', light: '#f2c3bd', hl: '#fbe3d6' },
};

// Tapered brush stroke along a polyline.
export function brushStroke(ctx, pts, { width = 4, color = PAL.ink, alpha = 1 } = {}) {
  const n = pts.length;
  if (n < 2) return;
  const left = [], right = [];
  for (let i = 0; i < n; i++) {
    const a = pts[Math.max(0, i - 1)], b = pts[Math.min(n - 1, i + 1)];
    let tx = b[0] - a[0], ty = b[1] - a[1];
    const tl = Math.hypot(tx, ty) || 1;
    tx /= tl; ty /= tl;
    const t = i / (n - 1);
    const w = (width / 2) * Math.pow(Math.max(0.05, Math.sin(Math.PI * (0.15 + t * 0.85))), 0.6);
    left.push([pts[i][0] - ty * w, pts[i][1] + tx * w]);
    right.push([pts[i][0] + ty * w, pts[i][1] - tx * w]);
  }
  ctx.save();
  ctx.fillStyle = rgba(color, alpha);
  ctx.beginPath();
  ctx.moveTo(left[0][0], left[0][1]);
  for (let i = 1; i < n; i++) ctx.lineTo(left[i][0], left[i][1]);
  for (let i = n - 1; i >= 0; i--) ctx.lineTo(right[i][0], right[i][1]);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

export { mix, shade, rgba };
