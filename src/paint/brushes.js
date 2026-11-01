import { noise1 } from '../core/rng.js';
import { PAL } from './palette.js';

// Fixed light direction in canvas space: top-left.
export const LIGHT2D = { x: -0.62, y: -0.78 };

export function makeCanvas(w, h) {
  const c = document.createElement('canvas');
  c.width = Math.max(1, Math.ceil(w));
  c.height = Math.max(1, Math.ceil(h));
  return c;
}

// Closed polygon in polar coordinates with rounded lobes and pinched notches.
export function lobedBlob(cx, cy, R, rng, { lobes = 7, depth = 0.25, jitter = 0.08, squash = 1, steps = 56 } = {}) {
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

// Smooth polygon: quadratic curves through edge midpoints.
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

export function fillBlob(ctx, pts, color) {
  tracePath(ctx, pts);
  ctx.fillStyle = color;
  ctx.fill();
}

export function clipBlob(ctx, pts) {
  tracePath(ctx, pts);
  ctx.clip();
}

// Evenly spaced points along a polyline.
export function resample(pts, spacing) {
  const out = [pts[0]];
  let carry = 0;
  for (let i = 0; i < pts.length - 1; i++) {
    const [ax, ay] = pts[i], [bx, by] = pts[i + 1];
    const len = Math.hypot(bx - ax, by - ay);
    let d = spacing - carry;
    while (d <= len) {
      const t = d / len;
      out.push([ax + (bx - ax) * t, ay + (by - ay) * t]);
      d += spacing;
    }
    carry = len - (d - spacing);
  }
  const last = pts[pts.length - 1];
  if (out.length < 2 || Math.hypot(out[out.length - 1][0] - last[0], out[out.length - 1][1] - last[1]) > spacing * 0.3) out.push(last);
  return out;
}

// A brush stroke: tapered at both ends, width wavers like a loaded brush.
export function brushStroke(ctx, pts, { width = 4, color = PAL.ink, taper = 0.5, pressure = 0.3, wobble = 0, seed = 0, alpha = 1 } = {}) {
  const P = resample(pts, Math.max(1, width * 0.35));
  const n = P.length;
  if (n < 2) return;
  const left = [], right = [];
  for (let i = 0; i < n; i++) {
    const a = P[Math.max(0, i - 1)], b = P[Math.min(n - 1, i + 1)];
    let tx = b[0] - a[0], ty = b[1] - a[1];
    const tl = Math.hypot(tx, ty) || 1;
    tx /= tl; ty /= tl;
    const nx = -ty, ny = tx;
    const t = i / (n - 1);
    const ends = Math.pow(Math.max(0, Math.sin(Math.PI * t)), taper);
    const w = (width / 2) * ends * (1 + noise1(seed + t * 5) * pressure);
    const wob = wobble ? noise1(seed * 3.1 + t * 7) * wobble : 0;
    const cx = P[i][0] + nx * wob, cy = P[i][1] + ny * wob;
    left.push([cx + nx * w, cy + ny * w]);
    right.push([cx - nx * w, cy - ny * w]);
  }
  ctx.save();
  ctx.globalAlpha *= alpha;
  ctx.beginPath();
  ctx.moveTo(left[0][0], left[0][1]);
  for (let i = 1; i < n; i++) ctx.lineTo(left[i][0], left[i][1]);
  for (let i = n - 1; i >= 0; i--) ctx.lineTo(right[i][0], right[i][1]);
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
  ctx.restore();
}

// Body polygon from a spine and per-point widths (used for trunks).
export function offsetRibbon(spine, widths) {
  const left = [], right = [];
  for (let i = 0; i < spine.length; i++) {
    const a = spine[Math.max(0, i - 1)], b = spine[Math.min(spine.length - 1, i + 1)];
    let tx = b[0] - a[0], ty = b[1] - a[1];
    const tl = Math.hypot(tx, ty) || 1;
    const nx = -ty / tl, ny = tx / tl;
    left.push([spine[i][0] + nx * widths[i] / 2, spine[i][1] + ny * widths[i] / 2]);
    right.push([spine[i][0] - nx * widths[i] / 2, spine[i][1] - ny * widths[i] / 2]);
  }
  return left.concat(right.reverse());
}

// Batches thousands of elliptical dabs: one beginPath + fill per color bucket.
export class DabBatch {
  constructor() { this.buckets = new Map(); }
  add(color, x, y, rx, ry, rot = 0, alpha = 1) {
    const key = `${color}@${alpha}`;
    let b = this.buckets.get(key);
    if (!b) this.buckets.set(key, (b = { color, alpha, list: [] }));
    b.list.push(x, y, rx, ry, rot);
  }
  flush(ctx) {
    for (const b of this.buckets.values()) {
      ctx.save();
      ctx.globalAlpha *= b.alpha;
      ctx.fillStyle = b.color;
      ctx.beginPath();
      const L = b.list;
      for (let i = 0; i < L.length; i += 5) {
        ctx.moveTo(L[i] + Math.cos(L[i + 4]) * L[i + 2], L[i + 1] + Math.sin(L[i + 4]) * L[i + 2]);
        ctx.ellipse(L[i], L[i + 1], L[i + 2], L[i + 3], L[i + 4], 0, Math.PI * 2);
      }
      ctx.fill();
      ctx.restore();
    }
    this.buckets.clear();
  }
}

// Dabs along a blob outline, nudged in/out along the normal, for a ragged leafy edge.
// `only(nx, ny)` filters by outward normal, e.g. to rim-light just the sunny side.
export function edgeDabs(batch, pts, color, rng, { size = 4, spacing = 4, spread = 0.6, alpha = 1, only = null } = {}) {
  const P = resample([...pts, pts[0]], spacing);
  let cx = 0, cy = 0;
  for (const p of pts) { cx += p[0]; cy += p[1]; }
  cx /= pts.length; cy /= pts.length;
  for (const [x, y] of P) {
    let nx = x - cx, ny = y - cy;
    const l = Math.hypot(nx, ny) || 1;
    nx /= l; ny /= l;
    if (only && !only(nx, ny)) continue;
    const o = rng.range(-spread, spread) * size;
    const r = size * rng.range(0.6, 1.1);
    batch.add(color, x + nx * o, y + ny * o, r, r * rng.range(0.55, 0.85), Math.atan2(ny, nx) + Math.PI / 2, alpha);
  }
}

export function softDot(ctx, x, y, r, color, alpha = 1) {
  const g = ctx.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, color);
  g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.save();
  ctx.globalAlpha *= alpha;
  ctx.fillStyle = g;
  ctx.fillRect(x - r, y - r, r * 2, r * 2);
  ctx.restore();
}

let grainCanvas = null;
function grain() {
  if (grainCanvas) return grainCanvas;
  grainCanvas = makeCanvas(128, 128);
  const ctx = grainCanvas.getContext('2d');
  const img = ctx.createImageData(128, 128);
  for (let i = 0; i < img.data.length; i += 4) {
    const v = 110 + Math.random() * 90;
    img.data[i] = img.data[i + 1] = img.data[i + 2] = v;
    img.data[i + 3] = 255;
  }
  ctx.putImageData(img, 0, 0);
  return grainCanvas;
}

// Paper grain printed only onto what's already painted.
export function paperFinish(ctx, w, h, amount = 0.09) {
  ctx.save();
  ctx.globalCompositeOperation = 'source-atop';
  ctx.globalAlpha = amount;
  ctx.fillStyle = ctx.createPattern(grain(), 'repeat');
  ctx.fillRect(0, 0, w, h);
  ctx.restore();
}

// Downsample alpha into a coarse grid; used to test whether a sprite would cover the path.
export function occupancyGrid(canvas, cols = 8, rows = 10, threshold = 0.2) {
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  const { data } = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const grid = new Uint8Array(cols * rows);
  const cw = canvas.width / cols, ch = canvas.height / rows;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      let sum = 0, count = 0;
      for (let y = Math.floor(r * ch); y < (r + 1) * ch; y += 2) {
        for (let x = Math.floor(c * cw); x < (c + 1) * cw; x += 2) {
          sum += data[(y * canvas.width + x) * 4 + 3];
          count++;
        }
      }
      grid[r * cols + c] = count && sum / count / 255 > threshold ? 1 : 0;
    }
  }
  return { cols, rows, grid };
}
