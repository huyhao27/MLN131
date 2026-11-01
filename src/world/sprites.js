// Every prop on the island is painted here with Canvas2D at load time (no image files).
// Each sprite: card size in world units (w, h), pixel density s, painter, and metadata
// (smoke anchors, glow channel, plant tint, sway, shadow size).
import { PAL } from './palette.js';
import {
  wash, inkPath, line, disc, rectPts, foliage, LEAF, lobedBlob, tracePath, brushStroke, glowDot, mix, shade, rgba,
} from './paint.js';

// Unit -> pixel helpers. u: horizontal from base center; v: height above base.
const P = (p, u, v) => [(p.W / 2 + u) * p.s, (p.H - v) * p.s];
const pts = (p, arr) => arr.map(([u, v]) => P(p, u, v));

// Oblique box: front face, a narrow right side (shear sx, sy), optional flat top.
function box(p, { x = 0, y = 0, w, h, d = 1, k = 0.55, wall, side, top = true, topCol, outline = 0.3 }) {
  const sx = d * k, sy = d;
  const l = x - w / 2, r = x + w / 2;
  wash(p.ctx, pts(p, [[r, y], [r + sx, y + sy], [r + sx, y + h + sy], [r, y + h]]), side || shade(wall, -0.28), p.rng, { outline, light: 0.1 });
  wash(p.ctx, pts(p, [[l, y], [r, y], [r, y + h], [l, y + h]]), wall, p.rng, { outline });
  if (top) wash(p.ctx, pts(p, [[l, y + h], [r, y + h], [r + sx, y + h + sy], [l + sx, y + h + sy]]), topCol || shade(wall, 0.2), p.rng, { outline, pool: 0.25 });
  return { x, y, w, h, sx, sy, l, r, t: y + h };
}

// Pitched roof over a box: back slope, right gable end, front slope with tile strokes.
function gable(p, b, { color, rise = 1.2, over = 0.35, tiles = true }) {
  const { l, r, t, sx, sy } = b;
  const L = l - over, R = r + over;
  const rl = [L + sx / 2, t + sy / 2 + rise], rr = [R + sx / 2, t + sy / 2 + rise];
  wash(p.ctx, pts(p, [rl, rr, [R + sx, t + sy], [L + sx, t + sy]]), shade(color, 0.12), p.rng, { outline: 0.25 });
  wash(p.ctx, pts(p, [[r, t], [r + sx, t + sy], [r + sx / 2, t + sy / 2 + rise]]), shade(PAL.wallCream, -0.25), p.rng, { outline: 0.2 });
  const front = [[L, t - over * 0.3], [R, t - over * 0.3], rr, rl];
  wash(p.ctx, pts(p, front), color, p.rng, { outline: 0.35 });
  if (tiles) {
    const n = Math.max(3, Math.round((R - L) * 1.6));
    for (let i = 1; i < n; i++) {
      const f = i / n;
      const a = P(p, L + (R - L) * f, t - over * 0.3), c = P(p, rl[0] + (rr[0] - rl[0]) * f, rl[1]);
      line(p.ctx, a[0], a[1], c[0], c[1], shade(color, -0.35), 1, 0.25);
    }
  }
  const a = P(p, ...rl), c = P(p, ...rr);
  line(p.ctx, a[0], a[1], c[0], c[1], shade(color, -0.45), 2, 0.6);
}

// Window grid on a box front; lit windows also go to the emission canvas.
function windows(p, b, { rows, cols, mx = 0.5, mt = 0.5, mb = 0.6, gap = 0.35, lit = 0.6, color = PAL.glassDeep, frame = PAL.wallWhite, shutters = null }) {
  const { l, r, y, t } = b;
  const cw = (r - l - mx * 2 - gap * (cols - 1)) / cols;
  const rh = (t - y - mt - mb - gap * (rows - 1)) / rows;
  for (let i = 0; i < rows; i++) {
    for (let j = 0; j < cols; j++) {
      const u = l + mx + j * (cw + gap), v = y + mb + i * (rh + gap);
      const q = pts(p, [[u, v], [u + cw, v], [u + cw, v + rh], [u, v + rh]]);
      const on = p.rng.chance(lit);
      p.ctx.fillStyle = on ? mix(color, PAL.glow, 0.35) : color;
      p.ctx.beginPath(); p.ctx.moveTo(...q[0]); for (const k of q.slice(1)) p.ctx.lineTo(...k); p.ctx.closePath(); p.ctx.fill();
      p.ctx.fillStyle = rgba(PAL.paper, 0.35);
      p.ctx.fillRect(q[3][0], q[3][1], (q[1][0] - q[0][0]) * 0.35, (q[0][1] - q[3][1]) * 0.45);
      p.ctx.strokeStyle = rgba(frame, 0.8); p.ctx.lineWidth = 1; p.ctx.strokeRect(q[3][0], q[3][1], q[1][0] - q[0][0], q[0][1] - q[3][1]);
      if (shutters) {
        p.ctx.fillStyle = shutters;
        const ww = (q[1][0] - q[0][0]) * 0.22;
        p.ctx.fillRect(q[3][0] - ww, q[3][1], ww, q[0][1] - q[3][1]);
        p.ctx.fillRect(q[1][0], q[3][1], ww, q[0][1] - q[3][1]);
      }
      if (on) {
        p.emit.fillStyle = `rgba(255,255,255,${p.rng.range(0.7, 1)})`;
        p.emit.fillRect(q[3][0], q[3][1], q[1][0] - q[0][0], q[0][1] - q[3][1]);
      }
    }
  }
}

function door(p, u, w, h, color = PAL.woodDark) {
  wash(p.ctx, pts(p, [[u - w / 2, 0], [u + w / 2, 0], [u + w / 2, h], [u - w / 2, h]]), color, p.rng, { outline: 0.3, pool: 0.2 });
}

function trunk(p, u, v0, v1, w, color = PAL.wood, bend = 0) {
  const a = P(p, u, v0), b = P(p, u + bend, v1);
  const mid = P(p, u + bend * 0.3, (v0 + v1) / 2);
  brushStroke(p.ctx, [a, mid, b], { width: w * p.s, color });
  brushStroke(p.ctx, [[a[0] - w * p.s * 0.2, a[1]], [mid[0] - w * p.s * 0.2, mid[1]]], { width: w * p.s * 0.35, color: shade(color, 0.3), alpha: 0.6 });
}

// ---------- people ----------
const SHIRTS = [PAL.accentRed, PAL.accentBlue, PAL.accentTeal, PAL.accentYellow, PAL.wallWhite, PAL.accentPurple, PAL.accentOrange, PAL.accentGreen, '#d98aa0'];

function person(p, u, { shirt, pants = '#4a4f63', hat = 'none', scale = 1, cane = false, skin = PAL.skin, arms = 'down' }) {
  const c = p.ctx, s = p.s * scale;
  const [x, y] = P(p, u, 0);
  // legs
  line(c, x - 0.12 * s, y - 0.75 * s, x - 0.14 * s, y - 0.04 * s, pants, 0.17 * s);
  line(c, x + 0.12 * s, y - 0.75 * s, x + 0.15 * s, y - 0.04 * s, shade(pants, -0.2), 0.17 * s);
  // body
  c.fillStyle = shirt;
  c.beginPath();
  c.roundRect(x - 0.27 * s, y - 1.42 * s, 0.54 * s, 0.78 * s, 0.16 * s);
  c.fill();
  c.fillStyle = rgba(shade(shirt, -0.35), 0.5);
  c.fillRect(x + 0.08 * s, y - 1.38 * s, 0.17 * s, 0.7 * s);
  c.fillStyle = rgba(shade(shirt, 0.4), 0.5);
  c.fillRect(x - 0.24 * s, y - 1.38 * s, 0.1 * s, 0.6 * s);
  // arms
  if (arms === 'up') {
    line(c, x - 0.26 * s, y - 1.35 * s, x - 0.42 * s, y - 1.85 * s, shirt, 0.13 * s);
    line(c, x + 0.26 * s, y - 1.35 * s, x + 0.36 * s, y - 1.0 * s, shade(shirt, -0.2), 0.13 * s);
  } else {
    line(c, x - 0.3 * s, y - 1.35 * s, x - 0.36 * s, y - 0.85 * s, shirt, 0.13 * s);
    line(c, x + 0.3 * s, y - 1.35 * s, x + 0.36 * s, y - 0.85 * s, shade(shirt, -0.2), 0.13 * s);
  }
  // head
  disc(c, x, y - 1.66 * s, 0.24 * s, skin);
  disc(c, x + 0.07 * s, y - 1.62 * s, 0.17 * s, shade(skin, -0.15), 0.4);
  if (hat === 'hard') {
    c.fillStyle = PAL.accentYellow;
    c.beginPath(); c.ellipse(x, y - 1.78 * s, 0.3 * s, 0.2 * s, 0, Math.PI, 0); c.fill();
    c.fillRect(x - 0.34 * s, y - 1.8 * s, 0.68 * s, 0.07 * s);
  } else if (hat === 'conical') {
    c.fillStyle = '#e8d49a';
    c.beginPath(); c.moveTo(x - 0.5 * s, y - 1.72 * s); c.lineTo(x, y - 2.1 * s); c.lineTo(x + 0.5 * s, y - 1.72 * s); c.closePath(); c.fill();
    c.strokeStyle = rgba(PAL.woodDark, 0.4); c.lineWidth = 1; c.stroke();
  } else if (hat === 'cap') {
    c.fillStyle = shade(shirt, -0.3);
    c.beginPath(); c.ellipse(x, y - 1.8 * s, 0.26 * s, 0.15 * s, 0, Math.PI, 0); c.fill();
    c.fillRect(x - 0.05 * s, y - 1.82 * s, 0.4 * s, 0.06 * s);
  } else if (hat === 'gray') {
    c.fillStyle = '#d9d6d0';
    c.beginPath(); c.ellipse(x, y - 1.76 * s, 0.25 * s, 0.17 * s, 0, Math.PI, 0); c.fill();
  } else {
    c.fillStyle = PAL.hair;
    c.beginPath(); c.ellipse(x, y - 1.76 * s, 0.25 * s, 0.17 * s, 0, Math.PI, 0); c.fill();
  }
  if (cane) line(c, x + 0.42 * s, y - 0.9 * s, x + 0.5 * s, y - 0.02 * s, PAL.woodDark, 0.07 * s);
}

function crowdPainter(n, opts = {}) {
  return (p) => {
    const order = [];
    for (let i = 0; i < n; i++) order.push(i);
    for (const i of order) {
      const u = -p.W / 2 + 0.55 + (i + 0.5) * ((p.W - 1.1) / n) + p.rng.range(-0.15, 0.15);
      const sc = opts.kids && i % 2 ? 0.66 : p.rng.range(0.92, 1.04);
      person(p, u, {
        shirt: p.rng.pick(opts.shirts || SHIRTS),
        pants: p.rng.pick(['#4a4f63', '#5b4b3f', '#3f5560', '#6b6a7a']),
        hat: opts.hat ? (p.rng.chance(opts.hatChance ?? 0.7) ? opts.hat : 'none') : (p.rng.chance(0.15) ? 'cap' : 'none'),
        scale: sc,
        arms: opts.cheer && p.rng.chance(0.5) ? 'up' : 'down',
        skin: p.rng.chance(0.3) ? PAL.skinDark : PAL.skin,
      });
    }
  };
}

// ---------- trees ----------
function roundTree(pal, { trunkH = 1.6 } = {}) {
  return (p) => {
    trunk(p, 0, 0, trunkH + 1, 0.42);
    const R = p.W * 0.27 * p.s;
    const [cx, cy] = P(p, 0, trunkH + (p.H - trunkH) * 0.45);
    foliage(p.ctx, cx + R * 0.45, cy + R * 0.25, R * 0.75, p.rng, pal);
    foliage(p.ctx, cx - R * 0.5, cy + R * 0.2, R * 0.8, p.rng, pal);
    foliage(p.ctx, cx, cy - R * 0.25, R * 0.95, p.rng, pal);
  };
}

function palm(p) {
  const base = P(p, 0, 0);
  const top = P(p, 0.6, p.H - 1.4);
  const mid = P(p, 0.05, p.H * 0.45);
  brushStroke(p.ctx, [base, mid, top], { width: 0.32 * p.s, color: '#8b7458' });
  for (let i = 0; i < 9; i++) {
    const a = -Math.PI / 2 + (i / 8 - 0.5) * 3.4;
    const L = p.rng.range(1.3, 1.9) * p.s;
    const tip = [top[0] + Math.cos(a) * L, top[1] + Math.sin(a) * L * 0.75 + L * 0.35];
    const ctrl = [top[0] + Math.cos(a) * L * 0.5, top[1] + Math.sin(a) * L * 0.6 - 0.3 * p.s];
    const col = i % 2 ? LEAF.lime.body : LEAF.oak.shadow;
    brushStroke(p.ctx, [top, ctrl, tip], { width: 0.42 * p.s, color: col });
  }
  disc(p.ctx, top[0], top[1] + 4, 0.22 * p.s, '#7a5a35');
}

function pine(p) {
  trunk(p, 0, 0, 1.2, 0.35, PAL.woodDark);
  const pal = LEAF.teal;
  for (let i = 0; i < 4; i++) {
    const v = 0.9 + i * (p.H - 1.4) / 4.2;
    const hw = (p.W / 2 - 0.2) * (1 - i * 0.2);
    const tri = pts(p, [[-hw, v], [hw, v - 0.15], [0.05, v + 2.1]]);
    wash(p.ctx, tri, i % 2 ? pal.body : pal.shadow, p.rng, { smooth: false, outline: 0.2 });
    const hl = pts(p, [[-hw * 0.8, v + 0.1], [-0.05, v + 0.25], [0.02, v + 1.8]]);
    wash(p.ctx, hl, pal.light, p.rng, { outline: 0, pool: 0 });
  }
}

function bamboo(p) {
  for (let i = 0; i < 10; i++) {
    const u = (i / 9 - 0.5) * (p.W - 1.2);
    const lean = p.rng.range(-0.6, 0.6);
    const a = P(p, u, 0), b = P(p, u + lean, p.H - p.rng.range(0.3, 1.2));
    brushStroke(p.ctx, [a, b], { width: 0.14 * p.s, color: i % 2 ? '#7f9b4c' : '#9ab35a' });
  }
  for (let i = 0; i < 190; i++) {
    const v = p.rng.range(1.0, p.H - 0.2);
    const spread = (p.W / 2 - 0.3) * (0.55 + 0.45 * Math.sin(Math.min(1, v / p.H) * Math.PI));
    const u = p.rng.range(-spread, spread);
    const [x, y] = P(p, u, v);
    p.ctx.fillStyle = rgba(p.rng.pick([LEAF.lime.body, LEAF.lime.shadow, LEAF.oak.shadow, LEAF.lime.light]), 0.92);
    p.ctx.beginPath();
    p.ctx.ellipse(x, y, 0.35 * p.s, 0.1 * p.s, p.rng.range(-0.9, 0.9), 0, Math.PI * 2);
    p.ctx.fill();
  }
}

function bush(pal) {
  return (p) => {
    const R = p.H * 0.42 * p.s;
    const [cx, cy] = P(p, 0, p.H * 0.45);
    foliage(p.ctx, cx - R * 0.6, cy + R * 0.1, R * 0.8, p.rng, pal, { squash: 0.8 });
    foliage(p.ctx, cx + R * 0.55, cy + R * 0.15, R * 0.75, p.rng, pal, { squash: 0.8 });
    foliage(p.ctx, cx, cy - R * 0.1, R, p.rng, pal, { squash: 0.8 });
  };
}

function flowers(p) {
  const [cx, cy] = P(p, 0, 0.35);
  foliage(p.ctx, cx, cy, p.H * 0.38 * p.s, p.rng, LEAF.lime, { squash: 0.6 });
  for (let i = 0; i < 16; i++) {
    const x = cx + p.rng.range(-0.6, 0.6) * p.s, y = cy + p.rng.range(-0.3, 0.15) * p.s;
    disc(p.ctx, x, y, 0.09 * p.s, p.rng.pick(['#f2c14e', '#e8798a', '#f6efe3', '#c98ad1']));
  }
}

function rock(p) {
  const [cx, cy] = P(p, 0, p.H * 0.42);
  const b = lobedBlob(cx, cy, p.W * 0.4 * p.s, p.rng, { lobes: 5, depth: 0.15, squash: 0.6 });
  wash(p.ctx, b, '#9a978c', p.rng, { smooth: true, outline: 0.3 });
}

function mountain(color, { snowless = true, peaks = 2 } = {}) {
  return (p) => {
    const c = p.ctx;
    const W = p.W, H = p.H;
    const ridge = [];
    const n = 40;
    const pk = Array.from({ length: peaks }, (_, i) => ({ u: (i + 0.5) / peaks + p.rng.range(-0.12, 0.12), h: p.rng.range(0.7, 1) }));
    for (let i = 0; i <= n; i++) {
      const f = i / n;
      let h = 0;
      for (const k of pk) h = Math.max(h, k.h * Math.pow(Math.max(0, 1 - Math.abs(f - k.u) * 2.1), 1.3));
      h = Math.max(h, 0.12 * Math.sin(f * Math.PI));
      h *= 1 + (p.rng() - 0.5) * 0.06;
      ridge.push([-W / 2 + f * W, 0.2 + h * (H - 0.6)]);
    }
    const shape = pts(p, [[-W / 2, 0], ...ridge, [W / 2, 0]]);
    wash(c, shape, color, p.rng, { smooth: true, outline: 0.2, light: 0.25 });
    // Shadow side of each peak (right of the summit, away from the light).
    c.save();
    tracePath(c, shape);
    c.clip();
    for (const k of pk) {
      const u = -W / 2 + k.u * W, top = 0.2 + k.h * (H - 0.6);
      const sh = pts(p, [[u, top], [u + W * 0.32, 0], [u + W * 0.05, 0]]);
      c.fillStyle = rgba(shade(color, -0.3), 0.45);
      tracePath(c, sh); c.fill();
      for (let i = 0; i < 5; i++) {
        const a = P(p, u - p.rng.range(0, W * 0.15), top * p.rng.range(0.4, 0.85));
        const b = P(p, u - p.rng.range(W * 0.05, W * 0.25), top * p.rng.range(0.1, 0.35));
        brushStroke(c, [a, b], { width: p.s * 0.6, color: shade(color, -0.2), alpha: 0.3 });
      }
    }
    // Forest dabs on lower slopes.
    for (let i = 0; i < 140; i++) {
      const u = p.rng.range(-W / 2, W / 2), v = p.rng.range(0, H * 0.35);
      const [x, y] = P(p, u, v);
      c.fillStyle = rgba(p.rng.chance(0.5) ? LEAF.teal.shadow : LEAF.oak.body, 0.5);
      c.beginPath(); c.ellipse(x, y, p.s * 0.9, p.s * 0.6, 0, 0, Math.PI * 2); c.fill();
    }
    c.restore();
    // Mist at the foot so the card melts into the ground.
    c.save();
    c.globalCompositeOperation = 'destination-out';
    const g = c.createLinearGradient(0, p.H * p.s, 0, (p.H - 2.5) * p.s);
    g.addColorStop(0, 'rgba(0,0,0,0.85)');
    g.addColorStop(1, 'rgba(0,0,0,0)');
    c.fillStyle = g;
    c.fillRect(0, 0, W * p.s, H * p.s);
    c.restore();
  };
}

function cloud(p) {
  const c = p.ctx;
  const parts = 5;
  for (let i = 0; i < parts; i++) {
    const u = (i / (parts - 1) - 0.5) * p.W * 0.62;
    const v = p.H * 0.4 + Math.sin((i / (parts - 1)) * Math.PI) * p.H * 0.18;
    const [x, y] = P(p, u, v);
    const R = p.H * p.rng.range(0.22, 0.32) * p.s;
    const b = lobedBlob(x, y, R, p.rng, { lobes: 6, depth: 0.2, squash: 0.75 });
    tracePath(c, b);
    c.fillStyle = rgba('#cfc6d6', 0.95);
    c.fill();
  }
  for (let i = 0; i < parts; i++) {
    const u = (i / (parts - 1) - 0.5) * p.W * 0.58 - 0.4;
    const v = p.H * 0.48 + Math.sin((i / (parts - 1)) * Math.PI) * p.H * 0.2;
    const [x, y] = P(p, u, v);
    const R = p.H * p.rng.range(0.18, 0.27) * p.s;
    const b = lobedBlob(x, y, R, p.rng, { lobes: 6, depth: 0.2, squash: 0.75 });
    tracePath(c, b);
    c.fillStyle = '#fbf6ea';
    c.fill();
  }
}

// ---------- rural ----------
function house(roof, wall) {
  return (p) => {
    const b = box(p, { x: -0.3, w: p.W - 1.8, h: 2.0, d: 1.4, wall, top: false });
    windows(p, b, { rows: 1, cols: 2, mx: 0.5, mb: 0.7, mt: 0.45, gap: 1.2, lit: 0.6, color: '#4c5a62', shutters: shade(PAL.accentTeal, -0.1) });
    door(p, b.x + 0.1, 0.8, 1.4);
    gable(p, b, { color: roof, rise: 1.15 });
  };
}

function thatchHut(p) {
  const b = box(p, { x: -0.2, w: p.W - 1.6, h: 1.5, d: 1.1, wall: '#b49a72', top: false });
  door(p, b.x, 0.7, 1.1, '#5e4630');
  // Patchy straw roof.
  gable(p, b, { color: PAL.roofThatch, rise: 1.3, tiles: false });
  for (let i = 0; i < 30; i++) {
    const a = P(p, p.rng.range(b.l, b.r), b.t + p.rng.range(0, 1.2));
    line(p.ctx, a[0], a[1], a[0] + p.rng.range(-3, 3), a[1] + 6, shade(PAL.roofThatch, -0.3), 1, 0.4);
  }
  // A leaning plank: run-down look.
  const a = P(p, b.r + 0.2, 0), c = P(p, b.r + 0.6, 1.4);
  line(p.ctx, a[0], a[1], c[0], c[1], PAL.woodDark, 0.15 * p.s);
}

function solarHouse(p) {
  const b = box(p, { x: -0.3, w: p.W - 1.8, h: 2.2, d: 1.4, wall: PAL.wallYellow, top: false });
  windows(p, b, { rows: 1, cols: 2, mx: 0.5, mb: 0.75, mt: 0.45, gap: 1.2, lit: 0.9, color: '#4c5a62' });
  door(p, b.x + 0.1, 0.8, 1.4, PAL.accentTeal);
  gable(p, b, { color: PAL.roofRed, rise: 1.15 });
  // Solar panel on the front slope.
  const q = pts(p, [[b.l + 0.3, b.t + 0.2], [b.l + 2.1, b.t + 0.2], [b.l + 2.3, b.t + 0.95], [b.l + 0.5, b.t + 0.95]]);
  wash(p.ctx, q, '#3b5f86', p.rng, { outline: 0.5, light: 0.4 });
  const lamp = P(p, b.r + 0.6, 2.2);
  line(p.ctx, lamp[0], lamp[1], lamp[0], P(p, 0, 0)[1], PAL.inkSoft, 2);
  disc(p.ctx, lamp[0], lamp[1], 0.18 * p.s, PAL.glow);
  glowDot(p.emit, lamp[0], lamp[1], 0.7 * p.s);
}

function stiltHouse(p) {
  const floor = 1.4;
  for (const u of [-2.2, -0.8, 0.8, 2.2]) {
    const a = P(p, u, 0), b = P(p, u, floor);
    line(p.ctx, a[0], a[1], b[0], b[1], PAL.woodDark, 0.18 * p.s);
  }
  const b = box(p, { x: -0.2, y: floor, w: p.W - 1.6, h: 1.6, d: 1.2, wall: PAL.woodLight, top: false });
  for (let i = 0; i < 8; i++) {
    const a = P(p, b.l + (i + 0.5) * (b.w / 8), floor), c = P(p, b.l + (i + 0.5) * (b.w / 8), floor + 1.6);
    line(p.ctx, a[0], a[1], c[0], c[1], PAL.wood, 1, 0.5);
  }
  windows(p, b, { rows: 1, cols: 2, mx: 0.6, mb: 0.45, mt: 0.45, gap: 1.6, lit: 0.7, color: '#3f3a36', frame: PAL.woodDark });
  // Steep hipped roof.
  const { l, r, t, sx, sy } = b;
  wash(p.ctx, pts(p, [[l - 0.6, t - 0.2], [r + 0.6, t - 0.2], [r - 0.6 + sx, t + 2.3], [l + 0.6 + sx * 0.5, t + 2.3]]), '#8e7a4e', p.rng, { outline: 0.35 });
  for (let i = 0; i < 26; i++) {
    const a = P(p, p.rng.range(l, r), t + p.rng.range(0, 2));
    line(p.ctx, a[0], a[1], a[0] + p.rng.range(-2, 2), a[1] + 7, '#6b5a36', 1, 0.45);
  }
  // Ladder.
  const la = P(p, l + 0.3, 0), lb = P(p, l + 0.7, floor);
  line(p.ctx, la[0], la[1], lb[0], lb[1], PAL.woodDark, 2);
  line(p.ctx, la[0] + 6, la[1], lb[0] + 6, lb[1], PAL.woodDark, 2);
}

function barn(p) {
  const b = box(p, { w: p.W - 1.6, h: 2.6, d: 1.6, wall: '#c9b48a', top: false });
  door(p, b.x - 1.2, 1.6, 2, PAL.accentGreen);
  door(p, b.x + 1.2, 1.6, 2, PAL.accentGreen);
  gable(p, b, { color: PAL.roofGreen, rise: 1.0 });
}

function greenhouse(p) {
  const n = 3;
  const w = (p.W - 1) / n;
  for (let i = 0; i < n; i++) {
    const u0 = -p.W / 2 + 0.3 + i * w;
    const arc = [];
    for (let k = 0; k <= 12; k++) {
      const a = Math.PI * (k / 12);
      arc.push([u0 + w / 2 - Math.cos(a) * w / 2 * 0.95, Math.sin(a) * 1.9]);
    }
    const shape = pts(p, [[u0 + 0.05, 0], ...arc, [u0 + w - 0.05, 0]]);
    wash(p.ctx, shape, '#d6e6dc', p.rng, { smooth: true, outline: 0.35, light: 0.35 });
    for (let k = 1; k < 5; k++) {
      const a = P(p, u0 + (k / 5) * w, 0), c = P(p, u0 + (k / 5) * w, Math.sin(Math.PI * k / 5) * 1.9);
      line(p.ctx, a[0], a[1], c[0], c[1], '#9fb5aa', 1, 0.7);
    }
    for (let k = 0; k < 10; k++) {
      const [x, y] = P(p, u0 + p.rng.range(0.4, w - 0.4), p.rng.range(0.2, 0.8));
      disc(p.ctx, x, y, 0.14 * p.s, LEAF.lime.body, 0.8);
    }
  }
}

function haystack(p) {
  const [cx, cy] = P(p, 0, 0.7);
  const b = lobedBlob(cx, cy, 0.75 * p.s, p.rng, { lobes: 4, depth: 0.1, squash: 0.95 });
  wash(p.ctx, b, '#d7b45f', p.rng, { smooth: true, outline: 0.3 });
}

function buffalo(p) {
  const c = p.ctx;
  const [x, y] = P(p, 0, 0);
  const s = p.s;
  for (const dx of [-0.6, -0.35, 0.45, 0.7]) line(c, x + dx * s, y - 0.6 * s, x + dx * s, y, '#3d3a3e', 0.16 * s);
  c.fillStyle = '#4c4850';
  c.beginPath(); c.ellipse(x, y - 0.85 * s, 0.95 * s, 0.42 * s, 0, 0, Math.PI * 2); c.fill();
  c.beginPath(); c.ellipse(x - 1.0 * s, y - 0.95 * s, 0.32 * s, 0.25 * s, 0.2, 0, Math.PI * 2); c.fill();
  c.strokeStyle = '#d8cdb5'; c.lineWidth = 0.08 * s;
  c.beginPath(); c.arc(x - 1.0 * s, y - 1.2 * s, 0.32 * s, Math.PI * 1.05, Math.PI * 1.95); c.stroke();
  c.fillStyle = rgba(PAL.paper, 0.2);
  c.beginPath(); c.ellipse(x - 0.2 * s, y - 1.05 * s, 0.5 * s, 0.12 * s, 0, 0, Math.PI * 2); c.fill();
}

// ---------- city ----------
function shophouses(p) {
  const cols = [PAL.wallYellow, PAL.wallPink, PAL.wallBlue, PAL.wallCream];
  const n = 4, w = (p.W - 1.2) / n;
  for (let i = n - 1; i >= 0; i--) {
    const h = p.rng.range(4.5, 6.4);
    const b = box(p, { x: -p.W / 2 + 0.2 + w * (i + 0.5), w, h, d: 1.2, k: 0.4, wall: cols[i % cols.length] });
    // ground floor shop
    wash(p.ctx, pts(p, [[b.l + 0.2, 0], [b.r - 0.2, 0], [b.r - 0.2, 1.6], [b.l + 0.2, 1.6]]), '#5d5450', p.rng, { outline: 0.2 });
    wash(p.ctx, pts(p, [[b.l, 1.6], [b.r, 1.6], [b.r + 0.2, 2.1], [b.l - 0.2, 2.1]]), p.rng.pick([PAL.accentRed, PAL.accentTeal, PAL.accentOrange, PAL.accentBlue]), p.rng, { outline: 0.25 });
    p.emit.fillStyle = 'rgba(255,255,255,0.8)';
    const q = P(p, b.l + 0.3, 1.5), q2 = P(p, b.r - 0.3, 0.1);
    p.emit.fillRect(q[0], q[1], q2[0] - q[0], q2[1] - q[1]);
    const up = { ...b, y: 2.2 };
    windows(p, up, { rows: Math.max(1, Math.floor((h - 2.4) / 1.4)), cols: 1, mx: 0.35, mb: 0.3, mt: 0.4, gap: 0.5, lit: 0.5, color: '#5b6a72' });
    // little balcony plants
    const [bx, by] = P(p, b.x, 3.2);
    disc(p.ctx, bx - 4, by, 0.18 * p.s, LEAF.lime.body);
    disc(p.ctx, bx + 4, by, 0.16 * p.s, LEAF.oak.body);
  }
}

function apartment(wall, floors = 7) {
  return (p) => {
    const h = p.H - 1.8;
    const b = box(p, { x: -0.4, w: p.W - 2, h, d: 1.6, wall });
    windows(p, b, { rows: floors, cols: 4, mx: 0.5, mb: 0.6, mt: 0.5, gap: 0.45, lit: 0.55, color: '#5c6d78' });
    // Balcony bands.
    for (let i = 1; i < floors; i++) {
      const v = 0.6 + i * ((h - 1.1) / floors) - 0.12;
      const q = pts(p, [[b.l - 0.1, v], [b.r + 0.1, v], [b.r + 0.1, v + 0.16], [b.l - 0.1, v + 0.16]]);
      p.ctx.fillStyle = rgba(shade(wall, 0.35), 0.9);
      p.ctx.fillRect(q[3][0], q[3][1], q[1][0] - q[0][0], q[0][1] - q[3][1]);
    }
    // Laundry and plants dabs.
    for (let i = 0; i < 10; i++) {
      const [x, y] = P(p, p.rng.range(b.l + 0.4, b.r - 0.4), p.rng.range(1, h - 0.6));
      disc(p.ctx, x, y, 0.12 * p.s, p.rng.pick([PAL.accentRed, LEAF.lime.body, PAL.accentBlue, PAL.wallWhite]), 0.9);
    }
    // Roof water tank.
    const q = pts(p, [[b.r - 1.6, b.t + 0.8], [b.r - 0.7, b.t + 0.8], [b.r - 0.7, b.t + 1.5], [b.r - 1.6, b.t + 1.5]]);
    wash(p.ctx, q, PAL.steel, p.rng, { outline: 0.3 });
  };
}

function tower(p) {
  const h = p.H - 1.5;
  const b = box(p, { x: -0.4, w: p.W - 1.8, h, d: 1.3, wall: PAL.glass, side: PAL.glassDeep, topCol: PAL.concrete });
  // Glass reflections and mullions.
  p.ctx.save();
  p.ctx.beginPath();
  const fq = pts(p, [[b.l, 0], [b.r, 0], [b.r, h], [b.l, h]]);
  p.ctx.moveTo(...fq[0]); for (const k of fq.slice(1)) p.ctx.lineTo(...k); p.ctx.closePath(); p.ctx.clip();
  for (let i = 0; i < 4; i++) {
    const a = P(p, b.l + p.rng.range(0, b.w), p.rng.range(0, h)), c = [a[0] + 3 * p.s, a[1] - 4 * p.s];
    line(p.ctx, a[0], a[1], c[0], c[1], '#e8f2ee', 0.5 * p.s, 0.25);
  }
  p.ctx.restore();
  const floors = Math.floor(h / 1.1);
  for (let i = 0; i < floors; i++) {
    const v = 0.5 + i * 1.1;
    const a = P(p, b.l, v), c = P(p, b.r, v);
    line(p.ctx, a[0], a[1], c[0], c[1], '#d6e4e4', 1, 0.55);
    for (let j = 0; j < 5; j++) {
      if (p.rng.chance(0.3)) {
        const q = P(p, b.l + 0.25 + j * (b.w - 0.4) / 5, v + 0.85);
        p.emit.fillStyle = `rgba(255,255,255,${p.rng.range(0.4, 0.8)})`;
        p.emit.fillRect(q[0], q[1], (b.w - 0.9) / 5 * p.s, 0.6 * p.s);
      }
    }
  }
  for (let j = 1; j < 5; j++) {
    const a = P(p, b.l + j * b.w / 5, 0), c = P(p, b.l + j * b.w / 5, h);
    line(p.ctx, a[0], a[1], c[0], c[1], '#c9dad9', 1, 0.5);
  }
  // Antenna.
  const a = P(p, b.x, h + 0.6), c = P(p, b.x, h + 1.4);
  line(p.ctx, a[0], a[1], c[0], c[1], PAL.inkSoft, 2);
}

function lab(p) {
  const b = box(p, { x: -0.6, w: p.W - 2.6, h: 3.2, d: 2.2, wall: PAL.wallWhite, topCol: '#d9dcd6' });
  // Curved glass band.
  wash(p.ctx, pts(p, [[b.l + 0.4, 0.9], [b.r - 0.4, 0.9], [b.r - 0.4, 2.5], [b.l + 0.4, 2.5]]), PAL.glass, p.rng, { outline: 0.3, light: 0.35 });
  for (let j = 0; j < 9; j++) {
    const a = P(p, b.l + 0.4 + j * (b.w - 0.8) / 8, 0.9), c = P(p, b.l + 0.4 + j * (b.w - 0.8) / 8, 2.5);
    line(p.ctx, a[0], a[1], c[0], c[1], '#e4efee', 1, 0.7);
    if (j < 8 && p.rng.chance(0.6)) {
      p.emit.fillStyle = 'rgba(255,255,255,0.75)';
      p.emit.fillRect(a[0] + 2, c[1] + 2, (b.w - 0.8) / 8 * p.s - 4, 1.4 * p.s);
    }
  }
  // Solar panels on roof.
  for (let i = 0; i < 4; i++) {
    const u = b.l + 0.6 + i * (b.w / 4.2);
    const q = pts(p, [[u, b.t + 0.3], [u + b.w / 5, b.t + 0.3], [u + b.w / 5 + 0.5, b.t + 1.6], [u + 0.5, b.t + 1.6]]);
    wash(p.ctx, q, '#3e5f86', p.rng, { outline: 0.4, light: 0.45 });
  }
  // Green accent stripe.
  wash(p.ctx, pts(p, [[b.l, 2.8], [b.r, 2.8], [b.r, 3.05], [b.l, 3.05]]), PAL.accentTeal, p.rng, { outline: 0 });
}

function factory(p) {
  // Main hall with sawtooth roof.
  const b = box(p, { x: -0.8, w: p.W - 4.5, h: 3.4, d: 2.2, wall: '#c5b39a', top: false });
  const teeth = 5, tw = (b.w + 0.4) / teeth;
  for (let i = 0; i < teeth; i++) {
    const u = b.l - 0.2 + i * tw;
    wash(p.ctx, pts(p, [[u, b.t], [u + tw, b.t], [u + tw + b.sx * 0.5, b.t + b.sy * 0.6 + 0.2], [u + tw * 0.15 + b.sx * 0.5, b.t + b.sy * 0.6 + 1.3]]), '#8a8f97', p.rng, { outline: 0.35 });
    wash(p.ctx, pts(p, [[u + tw * 0.15 + b.sx * 0.5, b.t + b.sy * 0.6 + 1.3], [u + tw * 0.15 + b.sx * 0.5, b.t + b.sy * 0.6 + 0.3], [u, b.t]]), PAL.glass, p.rng, { outline: 0.2 });
    const g = P(p, u + tw * 0.15 + b.sx * 0.5, b.t + b.sy * 0.6 + 1.0);
    p.emit.fillStyle = 'rgba(255,255,255,0.6)';
    p.emit.fillRect(g[0] - 3, g[1], 6, 0.6 * p.s);
  }
  windows(p, b, { rows: 1, cols: 6, mx: 0.4, mb: 1.6, mt: 0.5, gap: 0.3, lit: 0.7, color: '#56646e' });
  door(p, b.x - 1.5, 2.2, 1.4, '#6d7680');
  door(p, b.x + 1.8, 2.2, 1.4, '#6d7680');
  // Brick chimney on the right.
  const cx = b.r + 2.0;
  const c = box(p, { x: cx, w: 1.0, h: p.H - 1.0, d: 0.5, k: 0.6, wall: PAL.brick, topCol: '#3f3a3a' });
  for (let i = 1; i < 6; i++) {
    const v = i * (c.h / 6);
    const a = P(p, c.l, v), d = P(p, c.r, v);
    line(p.ctx, a[0], a[1], d[0], d[1], '#f0e4d0', 1.5, 0.6);
  }
  // Storage tank.
  const tq = pts(p, [[b.r + 0.1, 0], [b.r + 1.4, 0], [b.r + 1.4, 2.0], [b.r + 0.1, 2.0]]);
  wash(p.ctx, tq, '#a9b3b5', p.rng, { outline: 0.3, light: 0.3 });
}

function tanks(p) {
  const c = p.ctx;
  for (const [u, r, h] of [[-1.8, 1.4, 3.6], [1.4, 1.7, 4.2]]) {
    const body = pts(p, [[u - r, 0], [u + r, 0], [u + r, h], [u - r, h]]);
    wash(c, body, '#c9cfd0', p.rng, { outline: 0.35, light: 0.35 });
    const [x, y] = P(p, u, h);
    c.fillStyle = '#e4e8e6';
    c.beginPath(); c.ellipse(x, y, r * p.s, r * 0.45 * p.s, 0, 0, Math.PI * 2); c.fill();
    c.strokeStyle = rgba(PAL.ink, 0.3); c.lineWidth = 1.2; c.stroke();
    for (let i = 1; i < 4; i++) {
      const a = P(p, u - r, (h * i) / 4), b = P(p, u + r, (h * i) / 4);
      line(c, a[0], a[1], b[0], b[1], '#9aa3a6', 1, 0.6);
    }
    const s0 = P(p, u + r * 0.6, 0), s1 = P(p, u + r * 0.2, h);
    line(c, s0[0], s0[1], s1[0], s1[1], PAL.accentOrange, 1.5, 0.8);
  }
  const a = P(p, -0.4, 2.2), b = P(p, 0.0, 2.2);
  line(c, a[0], a[1], b[0], b[1], '#7d868c', 0.3 * p.s);
}

function warehouse(p) {
  const b = box(p, { w: p.W - 1.6, h: 2.4, d: 1.8, wall: '#a7b4b6', top: false });
  const arc = [];
  for (let k = 0; k <= 10; k++) arc.push([b.l - 0.2 + (b.w + 0.4) * k / 10, b.t + Math.sin(Math.PI * k / 10) * 1.2]);
  wash(p.ctx, pts(p, [...arc, [b.r + b.sx, b.t + b.sy], [b.l + b.sx, b.t + b.sy]]), '#8c9aa4', p.rng, { outline: 0.3 });
  wash(p.ctx, pts(p, [[b.l - 0.2, b.t], ...arc]), '#7a8a96', p.rng, { outline: 0.3, smooth: false });
  door(p, b.x, 2.4, 1.8, '#5f6a73');
  for (let i = 0; i < 4; i++) {
    const a = P(p, b.x - 1.2 + i * 0.8, 0.05), c = P(p, b.x - 1.2 + i * 0.8, 1.8);
    line(p.ctx, a[0], a[1], c[0], c[1], '#4d575f', 1, 0.6);
  }
}

function crane(p) {
  const c = p.ctx;
  const mastU = -p.W / 2 + 3.5;
  const top = p.H - 1.5;
  const a = P(p, mastU - 0.35, 0), b = P(p, mastU + 0.35, 0), t1 = P(p, mastU - 0.35, top), t2 = P(p, mastU + 0.35, top);
  line(c, a[0], a[1], t1[0], t1[1], PAL.accentYellow, 3);
  line(c, b[0], b[1], t2[0], t2[1], PAL.accentYellow, 3);
  for (let v = 0; v < top; v += 0.8) {
    const l0 = P(p, mastU - 0.35, v), r1 = P(p, mastU + 0.35, v + 0.8);
    line(c, l0[0], l0[1], r1[0], r1[1], shade(PAL.accentYellow, -0.2), 1.5);
  }
  // Jib and counter-jib.
  const j0 = P(p, mastU - 3, top), j1 = P(p, p.W / 2 - 0.3, top);
  line(c, j0[0], j0[1], j1[0], j1[1], PAL.accentYellow, 4);
  const peak = P(p, mastU, top + 1.2);
  line(c, peak[0], peak[1], j1[0], j1[1], shade(PAL.accentYellow, -0.3), 1.5);
  line(c, peak[0], peak[1], j0[0], j0[1], shade(PAL.accentYellow, -0.3), 1.5);
  wash(c, pts(p, [[mastU - 3, top - 0.9], [mastU - 1.9, top - 0.9], [mastU - 1.9, top], [mastU - 3, top]]), '#7d7f86', p.rng, { outline: 0.3 });
  wash(c, pts(p, [[mastU - 0.6, top - 1.1], [mastU + 0.7, top - 1.1], [mastU + 0.7, top - 0.1], [mastU - 0.6, top - 0.1]]), PAL.accentYellow, p.rng, { outline: 0.4 });
  // Hook and load.
  const hu = p.W / 2 - 3;
  const h0 = P(p, hu, top), h1 = P(p, hu, top - 5);
  line(c, h0[0], h0[1], h1[0], h1[1], PAL.inkSoft, 1);
  wash(c, pts(p, [[hu - 0.8, top - 5.8], [hu + 0.8, top - 5.8], [hu + 0.8, top - 5], [hu - 0.8, top - 5]]), '#b36a4f', p.rng, { outline: 0.3 });
  disc(p.ctx, peak[0], peak[1], 2.5, PAL.accentRed);
  glowDot(p.emit, peak[0], peak[1], 0.5 * p.s, 0.9);
}

function scaffold(p) {
  const b = box(p, { x: -0.4, w: p.W - 2, h: p.H - 2.6, d: 1.4, wall: '#cbc2b0', top: false });
  // Unfinished top: bare columns.
  for (let i = 0; i <= 4; i++) {
    const u = b.l + i * b.w / 4;
    const a = P(p, u, b.t), c = P(p, u, b.t + 1.4);
    line(p.ctx, a[0], a[1], c[0], c[1], '#9a9488', 0.25 * p.s);
  }
  // Scaffold grid and green safety mesh.
  p.ctx.fillStyle = rgba('#6f9a6b', 0.35);
  const m = pts(p, [[b.l - 0.3, 0], [b.l + b.w * 0.55, 0], [b.l + b.w * 0.55, b.t + 0.8], [b.l - 0.3, b.t + 0.8]]);
  p.ctx.fillRect(m[3][0], m[3][1], m[1][0] - m[0][0], m[0][1] - m[3][1]);
  for (let v = 0; v <= b.t + 0.8; v += 1.2) {
    const a = P(p, b.l - 0.4, v), c = P(p, b.r + 0.4, v);
    line(p.ctx, a[0], a[1], c[0], c[1], '#6e6a63', 1.2, 0.8);
  }
  for (let u = b.l - 0.4; u <= b.r + 0.5; u += 1.1) {
    const a = P(p, u, 0), c = P(p, u, b.t + 0.8);
    line(p.ctx, a[0], a[1], c[0], c[1], '#6e6a63', 1.2, 0.8);
  }
  // Material piles.
  wash(p.ctx, pts(p, [[b.r - 0.5, 0], [b.r + 1.4, 0], [b.r + 1.0, 0.7], [b.r - 0.2, 0.7]]), '#c9a46a', p.rng, { outline: 0.3 });
}

function hospital(p) {
  const wing = box(p, { x: -p.W / 2 + 3.4, w: 5.4, h: 3.6, d: 2, wall: '#eef0ea' });
  windows(p, wing, { rows: 2, cols: 3, mx: 0.5, mb: 0.6, mt: 0.4, gap: 0.4, lit: 0.6, color: '#5d8a94' });
  const b = box(p, { x: 1.6, w: p.W - 7.4, h: 6.4, d: 2.2, wall: '#f6f4ee', topCol: '#9fcfc6' });
  windows(p, b, { rows: 3, cols: 5, mx: 0.6, mb: 1.9, mt: 0.6, gap: 0.4, lit: 0.6, color: '#5d8a94' });
  // Teal bands: the building reads as a clinic, not housing.
  wash(p.ctx, pts(p, [[b.l, 1.35], [b.r, 1.35], [b.r, 1.7], [b.l, 1.7]]), PAL.accentTeal, p.rng, { outline: 0.2 });
  wash(p.ctx, pts(p, [[b.l, b.t - 0.35], [b.r, b.t - 0.35], [b.r, b.t], [b.l, b.t]]), PAL.accentTeal, p.rng, { outline: 0.2 });
  wash(p.ctx, pts(p, [[b.x - 2.2, 1.25], [b.x + 2.2, 1.25], [b.x + 2.7, 1.75], [b.x - 1.7, 1.75]]), '#2f7f78', p.rng, { outline: 0.3 });
  door(p, b.x + 0.2, 2.4, 1.15, PAL.glassDeep);
  // Big green plus sign on a rooftop board (neutral health symbol, not an emblem).
  const sb = box(p, { x: b.x, y: b.t + 0.6, w: 3.0, h: 2.6, d: 0.3, wall: '#ffffff', outline: 0.4 });
  const [cx, cy] = P(p, sb.x, sb.y + 1.3);
  const s = 0.95 * p.s;
  p.ctx.fillStyle = '#3fa05a';
  p.ctx.fillRect(cx - s, cy - s * 0.33, s * 2, s * 0.66);
  p.ctx.fillRect(cx - s * 0.33, cy - s, s * 0.66, s * 2);
  p.emit.fillStyle = 'rgba(255,255,255,0.8)';
  p.emit.fillRect(cx - s, cy - s * 0.33, s * 2, s * 0.66);
  p.emit.fillRect(cx - s * 0.33, cy - s, s * 0.66, s * 2);
  const l0 = P(p, sb.x - 1, b.t), l1 = P(p, sb.x - 1, sb.y);
  line(p.ctx, l0[0], l0[1], l1[0], l1[1], PAL.inkSoft, 2);
  const r0 = P(p, sb.x + 1, b.t), r1 = P(p, sb.x + 1, sb.y);
  line(p.ctx, r0[0], r0[1], r1[0], r1[1], PAL.inkSoft, 2);
}

function ambulance(p) {
  const c = p.ctx, s = p.s;
  const [x, y] = P(p, 0, 0);
  for (const dx of [-1.0, 1.0]) disc(c, x + dx * s, y - 0.3 * s, 0.3 * s, '#2f2f36');
  wash(c, pts(p, [[-1.8, 0.3], [1.0, 0.3], [1.0, 1.9], [-1.8, 1.9]]), '#f6f4ee', p.rng, { outline: 0.4 });
  wash(c, pts(p, [[1.0, 0.3], [1.8, 0.3], [1.8, 1.1], [1.4, 1.6], [1.0, 1.6]]), '#f6f4ee', p.rng, { outline: 0.4 });
  wash(c, pts(p, [[1.1, 1.0], [1.65, 1.0], [1.35, 1.4], [1.1, 1.4]]), PAL.glass, p.rng, { outline: 0 });
  wash(c, pts(p, [[-1.8, 0.75], [1.8, 0.75], [1.8, 0.95], [-1.8, 0.95]]), '#3fa05a', p.rng, { outline: 0 });
  const [px, py] = P(p, -0.4, 1.4);
  c.fillStyle = '#3fa05a';
  c.fillRect(px - 0.3 * s, py - 0.1 * s, 0.6 * s, 0.2 * s);
  c.fillRect(px - 0.1 * s, py - 0.3 * s, 0.2 * s, 0.6 * s);
  const [lx, ly] = P(p, 0.6, 2.0);
  disc(c, lx, ly, 0.14 * s, '#7fc4f0');
  glowDot(p.emit, lx, ly, 0.5 * s, 1);
}

function school(p) {
  const b = box(p, { x: -1.5, w: p.W - 5.2, h: 4.2, d: 1.8, wall: PAL.wallYellow, top: false });
  windows(p, b, { rows: 2, cols: 5, mx: 0.5, mb: 0.6, mt: 0.6, gap: 0.45, lit: 0.6, color: '#566a73' });
  gable(p, b, { color: PAL.roofRed, rise: 1.0, over: 0.4 });
  // Workshop with sawtooth roof (vocational training).
  const w = box(p, { x: p.W / 2 - 2.3, w: 3.4, h: 2.6, d: 1.4, wall: '#c8bba3', top: false });
  for (let i = 0; i < 2; i++) {
    const u = w.l + i * 1.7;
    wash(p.ctx, pts(p, [[u, w.t], [u + 1.7, w.t], [u + 1.7, w.t + 0.4], [u + 0.2, w.t + 1.2]]), '#8a8f97', p.rng, { outline: 0.3 });
  }
  door(p, w.x, 1.6, 1.8, '#6d7680');
  // Flagpole-free banner board with a simple gear+book pictogram.
  const [cx, cy] = P(p, b.x, b.t - 0.25);
  p.ctx.fillStyle = PAL.wallWhite;
  p.ctx.fillRect(cx - 1.4 * p.s, cy - 0.35 * p.s, 2.8 * p.s, 0.55 * p.s);
  disc(p.ctx, cx - 0.9 * p.s, cy - 0.08 * p.s, 0.18 * p.s, PAL.accentBlue);
  p.ctx.fillStyle = PAL.accentBlue;
  p.ctx.fillRect(cx - 0.5 * p.s, cy - 0.14 * p.s, 1.6 * p.s, 0.12 * p.s);
}

function stall(awning) {
  return (p) => {
    const c = p.ctx;
    for (const u of [-p.W / 2 + 0.35, p.W / 2 - 0.55]) {
      const a = P(p, u, 0), b = P(p, u, 1.7);
      line(c, a[0], a[1], b[0], b[1], PAL.woodDark, 2);
    }
    // Table with goods.
    wash(c, pts(p, [[-p.W / 2 + 0.3, 0.55], [p.W / 2 - 0.5, 0.55], [p.W / 2 - 0.3, 0.95], [-p.W / 2 + 0.5, 0.95]]), PAL.woodLight, p.rng, { outline: 0.3 });
    for (let i = 0; i < 14; i++) {
      const [x, y] = P(p, p.rng.range(-p.W / 2 + 0.6, p.W / 2 - 0.6), p.rng.range(0.95, 1.25));
      disc(c, x, y, 0.13 * p.s, p.rng.pick(['#e2603e', '#f0c34a', '#7fae4f', '#e98b3a', '#9b5aa0']));
    }
    // Striped awning.
    const aw = pts(p, [[-p.W / 2 + 0.1, 1.7], [p.W / 2 - 0.1, 1.7], [p.W / 2 - 0.4, 2.4], [-p.W / 2 + 0.4, 2.4]]);
    wash(c, aw, awning, p.rng, { outline: 0.35 });
    c.save();
    c.beginPath(); c.moveTo(...aw[0]); for (const k of aw.slice(1)) c.lineTo(...k); c.closePath(); c.clip();
    for (let i = 0; i < 8; i += 2) {
      const a = P(p, -p.W / 2 + i * p.W / 8, 1.6);
      c.fillStyle = rgba(PAL.wallWhite, 0.75);
      c.fillRect(a[0], a[1] - 1 * p.s, p.W / 8 * p.s, 1 * p.s);
    }
    c.restore();
    glowDot(p.emit, ...P(p, 0, 1.6), 0.6 * p.s, 0.6);
  };
}

function kindergarten(p) {
  const b = box(p, { x: -1.2, w: p.W - 4.2, h: 2.6, d: 1.6, wall: '#f6d58e', top: false });
  // Round windows in many colors.
  const cols = [PAL.accentRed, PAL.accentBlue, PAL.accentGreen, PAL.accentPurple];
  for (let i = 0; i < 4; i++) {
    const [x, y] = P(p, b.l + 0.9 + i * (b.w - 1.8) / 3, 1.5);
    disc(p.ctx, x, y, 0.42 * p.s, cols[i]);
    disc(p.ctx, x, y, 0.3 * p.s, '#cfe3e8');
    p.emit.fillStyle = 'rgba(255,255,255,0.7)';
    p.emit.beginPath(); p.emit.arc(x, y, 0.3 * p.s, 0, Math.PI * 2); p.emit.fill();
  }
  gable(p, b, { color: PAL.accentRed, rise: 1.3 });
  // Slide and swing in the yard.
  const s0 = P(p, p.W / 2 - 2.8, 0), s1 = P(p, p.W / 2 - 2.8, 1.8), s2 = P(p, p.W / 2 - 0.6, 0.1);
  line(p.ctx, s0[0], s0[1], s1[0], s1[1], PAL.accentBlue, 3);
  line(p.ctx, s1[0], s1[1], s2[0], s2[1], PAL.accentYellow, 0.3 * p.s);
  const w0 = P(p, p.W / 2 - 2.2, 2.0), w1 = P(p, p.W / 2 - 0.6, 2.0);
  line(p.ctx, w0[0], w0[1], w1[0], w1[1], PAL.accentGreen, 3);
  line(p.ctx, w1[0], w1[1], w1[0], P(p, 0, 0)[1], PAL.accentGreen, 3);
  const r0 = P(p, p.W / 2 - 1.3, 2.0), r1 = P(p, p.W / 2 - 1.3, 0.7);
  line(p.ctx, r0[0], r0[1], r1[0], r1[1], PAL.inkSoft, 1);
  line(p.ctx, r1[0] - 6, r1[1], r1[0] + 6, r1[1], PAL.accentRed, 3);
}

function elderHome(p) {
  const b = box(p, { x: -0.6, w: p.W - 2.8, h: 2.8, d: 1.8, wall: '#e9dcc4', top: false });
  windows(p, b, { rows: 1, cols: 4, mx: 0.6, mb: 1.0, mt: 0.6, gap: 0.8, lit: 0.8, color: '#5b6a72', shutters: PAL.accentGreen });
  gable(p, b, { color: PAL.roofBlue, rise: 1.0, over: 0.6 });
  // Veranda posts.
  for (let i = 0; i < 6; i++) {
    const a = P(p, b.l + i * b.w / 5, 0), c = P(p, b.l + i * b.w / 5, 2.4);
    line(p.ctx, a[0], a[1], c[0], c[1], PAL.wallWhite, 3);
  }
  // Bench and garden.
  const q = pts(p, [[b.r + 0.2, 0.4], [b.r + 1.8, 0.4], [b.r + 1.8, 0.6], [b.r + 0.2, 0.6]]);
  wash(p.ctx, q, PAL.wood, p.rng, { outline: 0.3 });
  const [fx, fy] = P(p, b.l + 0.5, 0.3);
  foliage(p.ctx, fx, fy, 0.6 * p.s, p.rng, LEAF.blossom, { squash: 0.7 });
}

function communityHall(p) {
  const c = p.ctx;
  // Raised floor.
  wash(c, pts(p, [[-p.W / 2 + 0.6, 0], [p.W / 2 - 1.2, 0], [p.W / 2 - 0.4, 0.6], [-p.W / 2 + 1.4, 0.6]]), PAL.woodLight, p.rng, { outline: 0.3 });
  for (let i = 0; i < 6; i++) {
    const u = -p.W / 2 + 1.0 + i * (p.W - 2.6) / 5;
    const a = P(p, u, 0.3), b = P(p, u, 3.0);
    line(c, a[0], a[1], b[0], b[1], PAL.woodDark, 0.22 * p.s);
  }
  // Benches.
  for (let i = 0; i < 3; i++) {
    const u = -p.W / 2 + 1.8 + i * 2.2;
    wash(c, pts(p, [[u, 0.6], [u + 1.6, 0.6], [u + 1.6, 0.85], [u, 0.85]]), PAL.wood, p.rng, { outline: 0.3 });
  }
  // Big sheltering roof with slight upturn at the ends.
  const roof = pts(p, [[-p.W / 2 + 0.1, 2.9], [p.W / 2 - 0.5, 2.9], [p.W / 2 - 0.1, 3.4], [p.W / 2 - 1.6, 5.0], [-p.W / 2 + 1.8, 5.0], [-p.W / 2, 3.3]]);
  wash(c, roof, '#a5603f', p.rng, { outline: 0.4 });
  for (let i = 1; i < 10; i++) {
    const a = P(p, -p.W / 2 + 0.4 + i * (p.W - 1) / 10, 2.95), b = P(p, -p.W / 2 + 1.8 + i * (p.W - 3.4) / 10, 4.95);
    line(c, a[0], a[1], b[0], b[1], shade('#a5603f', -0.3), 1, 0.4);
  }
  glowDot(p.emit, ...P(p, 0, 2.2), 2 * p.s, 0.5);
}

// Neutral place of worship: a calm hall, courtyard steps and lanterns, no symbols of any real faith.
function temple(p) {
  const c = p.ctx;
  // Stone terrace with steps.
  wash(c, pts(p, [[-p.W / 2 + 0.3, 0], [p.W / 2 - 1.3, 0], [p.W / 2 - 0.3, 1.0], [-p.W / 2 + 1.3, 1.0]]), '#cbbfa6', p.rng, { outline: 0.3 });
  for (let i = 0; i < 3; i++) {
    const v = i * 0.3;
    const a = P(p, -1.6 + i * 0.1, v), b = P(p, 1.6 - i * 0.1, v);
    line(c, a[0], a[1], b[0], b[1], '#a99c82', 2, 0.8);
  }
  const b = box(p, { x: -0.3, y: 1.0, w: p.W - 4.4, h: 2.8, d: 1.8, wall: '#efe0bf', top: false });
  // Red-brown columns.
  for (let i = 0; i < 6; i++) {
    const u = b.l + 0.25 + i * (b.w - 0.5) / 5;
    const a = P(p, u, 1.0), d = P(p, u, b.t);
    line(c, a[0], a[1], d[0], d[1], '#9a4a36', 0.25 * p.s);
  }
  // Round window, warmly lit.
  const [wx, wy] = P(p, b.x, 2.6);
  disc(c, wx, wy, 0.55 * p.s, '#8a5a3a');
  disc(c, wx, wy, 0.42 * p.s, '#f3cf7f');
  glowDot(p.emit, wx, wy, 0.9 * p.s, 1);
  // Two-tier roof with gently lifted eaves.
  const roof = (y0, h, inset, col) => {
    const L = b.l - 1.0 + inset, R = b.r + 1.0 - inset;
    const shape = pts(p, [[L - 0.4, y0 + 0.5], [L + 0.4, y0], [R - 0.4, y0], [R + 0.4, y0 + 0.5], [R - 1.0 + b.sx, y0 + h], [L + 1.0 + b.sx * 0.5, y0 + h]]);
    wash(c, shape, col, p.rng, { outline: 0.45 });
    for (let i = 1; i < 12; i++) {
      const a = P(p, L + i * (R - L) / 12, y0 + 0.05), e = P(p, L + 1.0 + i * (R - L - 2 + b.sx * 0.5) / 12, y0 + h - 0.05);
      line(c, a[0], a[1], e[0], e[1], shade(col, -0.3), 1, 0.35);
    }
  };
  roof(b.t - 0.1, 1.5, 0, '#6f6a5e');
  const mid = box(p, { x: -0.1, y: b.t + 1.3, w: b.w * 0.5, h: 1.0, d: 0.8, wall: '#efe0bf', top: false });
  roof(mid.t - 0.1, 1.3, b.w * 0.25 + 0.2, '#6f6a5e');
  // Lanterns on posts.
  for (const u of [-p.W / 2 + 0.9, p.W / 2 - 1.6]) {
    const a = P(p, u, 0), d = P(p, u, 2.0);
    line(c, a[0], a[1], d[0], d[1], PAL.inkSoft, 2);
    disc(c, d[0], d[1], 0.28 * p.s, '#f0b85a');
    glowDot(p.emit, d[0], d[1], 0.7 * p.s, 1);
  }
}

function dam(p) {
  const c = p.ctx;
  // Concrete wall, slightly curved, with spillway.
  const top = p.H - 2.5;
  const wall = [];
  for (let k = 0; k <= 16; k++) {
    const f = k / 16;
    wall.push([-p.W / 2 + 1 + f * (p.W - 2), top - Math.sin(f * Math.PI) * 0.6]);
  }
  const shape = pts(p, [[-p.W / 2 + 3, 0], [p.W / 2 - 3, 0], ...wall.slice().reverse()]);
  wash(c, shape, '#c9c4b8', p.rng, { outline: 0.4, light: 0.3 });
  // Top walkway.
  const walk = pts(p, [...wall.map(([u, v]) => [u, v]), ...wall.slice().reverse().map(([u, v]) => [u + 0.6, v + 1.0])]);
  wash(c, walk, '#e2ddd0', p.rng, { outline: 0.3 });
  // Spillway water stripes (animated look comes from foam particles below).
  c.save();
  tracePath(c, shape); c.clip();
  for (let i = 0; i < 4; i++) {
    const u = -2.6 + i * 1.6;
    const q = pts(p, [[u, 0], [u + 1.1, 0], [u + 1.1, top - 0.6], [u, top - 0.6]]);
    c.fillStyle = rgba('#d8ecee', 0.85);
    c.fillRect(q[3][0], q[3][1], q[1][0] - q[0][0], q[0][1] - q[3][1]);
    for (let k = 0; k < 6; k++) {
      const a = P(p, u + p.rng.range(0.1, 1), p.rng.range(0.5, top - 1));
      line(c, a[0], a[1], a[0], a[1] + 0.9 * p.s, '#8fbac0', 1.2, 0.6);
    }
  }
  for (let i = 0; i < 10; i++) {
    const a = P(p, -p.W / 2 + 4 + i * (p.W - 8) / 9, 0.3), b = P(p, -p.W / 2 + 4 + i * (p.W - 8) / 9, top - 0.8);
    line(c, a[0], a[1], b[0], b[1], '#a8a296', 1, 0.5);
  }
  c.restore();
  // Powerhouse.
  const b = box(p, { x: p.W / 2 - 5.5, w: 4, h: 2.4, d: 1.2, wall: '#e8e2d2' });
  windows(p, b, { rows: 1, cols: 3, mx: 0.4, mb: 0.9, mt: 0.6, gap: 0.4, lit: 0.9 });
  // Foam at the bottom.
  for (let i = 0; i < 18; i++) {
    const [x, y] = P(p, p.rng.range(-3, 3.5), p.rng.range(0, 0.5));
    disc(c, x, y, p.rng.range(0.2, 0.5) * p.s, '#f6f4ec', 0.9);
  }
}

function pylon(p) {
  const c = p.ctx;
  const a = P(p, -1, 0), b = P(p, 1, 0), t = P(p, 0, p.H - 0.3);
  line(c, a[0], a[1], t[0], t[1], '#6f737a', 2);
  line(c, b[0], b[1], t[0], t[1], '#6f737a', 2);
  for (let v = 1; v < p.H - 1; v += 1.2) {
    const w = 1 - v / p.H;
    const l = P(p, -w, v), r = P(p, w, v + 1.2);
    line(c, l[0], l[1], r[0], r[1], '#6f737a', 1);
  }
  for (const v of [p.H - 2.5, p.H - 1.4]) {
    const l = P(p, -1.4, v), r = P(p, 1.4, v);
    line(c, l[0], l[1], r[0], r[1], '#6f737a', 2);
  }
}

function containers(p) {
  const cols = ['#c4664a', '#4a77b0', '#3f9c94', '#e0a43a', '#8a6aa8', '#7f8a57'];
  const w = (p.W - 1.2) / 3;
  for (let row = 0; row < 2; row++) {
    for (let i = 0; i < 3; i++) {
      if (row === 1 && p.rng.chance(0.35)) continue;
      const bx = box(p, { x: -p.W / 2 + 0.3 + w * (i + 0.5) - row * 0.3, y: row * 1.3, w: w - 0.1, h: 1.25, d: 0.8, k: 0.5, wall: p.rng.pick(cols), outline: 0.35 });
      for (let k = 1; k < 6; k++) {
        const a = P(p, bx.l + k * bx.w / 6, bx.y + 0.1), b = P(p, bx.l + k * bx.w / 6, bx.t - 0.1);
        line(p.ctx, a[0], a[1], b[0], b[1], shade(PAL.ink, 0.4), 1, 0.25);
      }
    }
  }
}

function gantry(p) {
  const c = p.ctx;
  const col = '#d8673f';
  const L = -p.W / 2 + 1.5, R = L + 4;
  for (const u of [L, R]) {
    const a = P(p, u, 0), b = P(p, u, p.H - 3);
    line(c, a[0], a[1], b[0], b[1], col, 0.35 * p.s);
  }
  const b0 = P(p, L - 0.5, p.H - 3), b1 = P(p, R + 0.5, p.H - 3);
  line(c, b0[0], b0[1], b1[0], b1[1], col, 0.4 * p.s);
  // Boom reaching over the water.
  const j0 = P(p, L - 2, p.H - 2.2), j1 = P(p, p.W / 2 - 0.3, p.H - 2.2);
  line(c, j0[0], j0[1], j1[0], j1[1], col, 0.35 * p.s);
  const top = P(p, (L + R) / 2, p.H - 0.4);
  line(c, top[0], top[1], j1[0], j1[1], shade(col, -0.3), 1.5);
  line(c, top[0], top[1], j0[0], j0[1], shade(col, -0.3), 1.5);
  wash(c, pts(p, [[L - 0.6, p.H - 3.6], [R + 0.6, p.H - 3.6], [R + 0.6, p.H - 2.4], [L - 0.6, p.H - 2.4]]), shade(col, 0.1), p.rng, { outline: 0.4 });
  const h0 = P(p, p.W / 2 - 3, p.H - 2.2), h1 = P(p, p.W / 2 - 3, p.H - 6);
  line(c, h0[0], h0[1], h1[0], h1[1], PAL.inkSoft, 1);
  wash(c, pts(p, [[p.W / 2 - 4.2, p.H - 7], [p.W / 2 - 1.8, p.H - 7], [p.W / 2 - 1.8, p.H - 6], [p.W / 2 - 4.2, p.H - 6]]), PAL.accentBlue, p.rng, { outline: 0.3 });
  glowDot(p.emit, ...P(p, (L + R) / 2, p.H - 3.0), 0.7 * p.s, 0.8);
}

function ship(p) {
  const c = p.ctx;
  const hull = pts(p, [[-p.W / 2 + 0.4, 1.8], [p.W / 2 - 0.2, 1.8], [p.W / 2 - 1.4, 0.1], [-p.W / 2 + 1.4, 0.1]]);
  wash(c, hull, '#3e5a7a', p.rng, { outline: 0.4 });
  wash(c, pts(p, [[-p.W / 2 + 0.6, 0.9], [p.W / 2 - 0.5, 0.9], [p.W / 2 - 0.9, 0.35], [-p.W / 2 + 1.0, 0.35]]), '#b5523e', p.rng, { outline: 0 });
  // Container deck.
  const cols = ['#c4664a', '#4a77b0', '#3f9c94', '#e0a43a', '#8a6aa8'];
  for (let i = 0; i < 8; i++) {
    for (let r = 0; r < 2; r++) {
      const u = -p.W / 2 + 1.0 + i * 1.5;
      const q = pts(p, [[u, 1.8 + r * 0.9], [u + 1.4, 1.8 + r * 0.9], [u + 1.4, 2.65 + r * 0.9], [u, 2.65 + r * 0.9]]);
      wash(c, q, cols[(i + r * 3) % cols.length], p.rng, { outline: 0.3, dabs: 0.3 });
    }
  }
  // Bridge house at the stern.
  const b = box(p, { x: p.W / 2 - 2.0, y: 1.8, w: 2.2, h: 2.8, d: 0.8, wall: PAL.wallWhite });
  windows(p, b, { rows: 2, cols: 2, mx: 0.3, mb: 0.4, mt: 0.4, gap: 0.3, lit: 0.8 });
}

function boat(p) {
  const c = p.ctx;
  const hull = pts(p, [[-p.W / 2 + 0.1, 0.9], [p.W / 2 - 0.1, 1.1], [p.W / 2 - 0.7, 0.1], [-p.W / 2 + 0.6, 0.1]]);
  wash(c, hull, '#3f6fa0', p.rng, { outline: 0.4 });
  wash(c, pts(p, [[-p.W / 2 + 0.2, 0.9], [p.W / 2 - 0.15, 1.05], [p.W / 2 - 0.2, 0.8], [-p.W / 2 + 0.25, 0.7]]), '#d9573e', p.rng, { outline: 0 });
  const cab = box(p, { x: 0.3, y: 1.0, w: 1.2, h: 0.8, d: 0.4, wall: PAL.wallWhite, outline: 0.3 });
  const m0 = P(p, -0.6, 1.0), m1 = P(p, -0.6, 2.4);
  line(c, m0[0], m0[1], m1[0], m1[1], PAL.woodDark, 2);
  glowDot(p.emit, ...P(p, cab.x, 1.4), 0.5 * p.s, 0.7);
}

function lighthouse(p) {
  const c = p.ctx;
  const shape = pts(p, [[-1.0, 0], [1.0, 0], [0.6, p.H - 2.2], [-0.6, p.H - 2.2]]);
  wash(c, shape, PAL.wallWhite, p.rng, { outline: 0.4 });
  c.save(); polyClip(c, shape);
  for (let i = 0; i < 3; i++) {
    const q = P(p, -1.2, 1.2 + i * 2.2);
    c.fillStyle = rgba(PAL.accentRed, 0.85);
    c.fillRect(q[0], q[1], 2.4 * p.s, 0.9 * p.s);
  }
  c.restore();
  wash(c, pts(p, [[-0.7, p.H - 2.2], [0.7, p.H - 2.2], [0.7, p.H - 1.2], [-0.7, p.H - 1.2]]), '#f3d27a', p.rng, { outline: 0.4 });
  glowDot(p.emit, ...P(p, 0, p.H - 1.7), 1.4 * p.s, 1);
  wash(c, pts(p, [[-0.8, p.H - 1.2], [0.8, p.H - 1.2], [0, p.H - 0.2]]), PAL.accentRed, p.rng, { outline: 0.4 });
}

function polyClip(c, q) {
  c.beginPath(); c.moveTo(...q[0]); for (const k of q.slice(1)) c.lineTo(...k); c.closePath(); c.clip();
}

function lamp(p) {
  const a = P(p, 0, 0), b = P(p, 0, p.H - 0.4);
  line(p.ctx, a[0], a[1], b[0], b[1], '#4c4f5a', 2.5);
  line(p.ctx, b[0], b[1], b[0] + 0.25 * p.s, b[1], '#4c4f5a', 2.5);
  disc(p.ctx, b[0] + 0.25 * p.s, b[1] + 3, 0.16 * p.s, PAL.glow);
  glowDot(p.emit, b[0] + 0.25 * p.s, b[1] + 3, 0.5 * p.s, 1);
}

function planter(p) {
  wash(p.ctx, pts(p, [[-0.6, 0], [0.6, 0], [0.65, 0.4], [-0.55, 0.4]]), '#a9785a', p.rng, { outline: 0.3 });
  const [cx, cy] = P(p, 0, 0.55);
  foliage(p.ctx, cx, cy, 0.4 * p.s, p.rng, LEAF.lime, { squash: 0.7 });
  for (let i = 0; i < 6; i++) disc(p.ctx, cx + p.rng.range(-0.35, 0.35) * p.s, cy + p.rng.range(-0.2, 0.1) * p.s, 0.07 * p.s, p.rng.pick(['#f2c14e', '#e8798a', '#f6efe3']));
}

function trash(p) {
  const k = p.W / 1.6;
  for (let i = 0; i < 9; i++) {
    const [x, y] = P(p, p.rng.range(-0.55, 0.55) * k, p.rng.range(0.15, 0.5) * k);
    const b = lobedBlob(x, y, p.rng.range(0.16, 0.26) * p.s * k, p.rng, { lobes: 4, depth: 0.2, squash: 0.85 });
    wash(p.ctx, b, p.rng.pick(['#3d3f45', '#6b6e75', '#5d6b5a', '#8c7a5b']), p.rng, { smooth: true, outline: 0.3 });
  }
  const a = P(p, -0.7 * k, 0.05), b = P(p, 0.7 * k, 0.05);
  line(p.ctx, a[0], a[1], b[0], b[1], '#6b5f50', 3, 0.4);
}

function brokenFence(p) {
  for (let i = 0; i < 6; i++) {
    const u = -p.W / 2 + 0.3 + i * (p.W - 0.6) / 5;
    const lean = p.rng.range(-0.25, 0.25) + (i === 3 ? 0.5 : 0);
    const a = P(p, u, 0), b = P(p, u + lean, p.rng.range(0.6, 1.0));
    line(p.ctx, a[0], a[1], b[0], b[1], '#7a6450', 2.5);
  }
  const a = P(p, -p.W / 2 + 0.2, 0.7), b = P(p, p.W / 2 - 1.2, 0.45);
  line(p.ctx, a[0], a[1], b[0], b[1], '#8a7258', 2);
  const c = P(p, p.W / 2 - 1.0, 0.1), d = P(p, p.W / 2 - 0.1, 0.5);
  line(p.ctx, c[0], c[1], d[0], d[1], '#8a7258', 2);
}

function boxes(p) {
  const k = p.W / 1.8;
  for (let i = 0; i < 4; i++) {
    const u = (-0.7 + i * 0.45 + p.rng.range(-0.1, 0.1)) * k, v = i === 3 ? 0.5 * k : 0;
    box(p, { x: u, y: v, w: 0.5 * k, h: 0.45 * k, d: 0.25 * k, wall: p.rng.pick(['#c9a46a', '#b08b58', '#9b9c94']), outline: 0.35 });
  }
}

function bunting(p) {
  const c = p.ctx;
  const a = P(p, -p.W / 2 + 0.2, p.H - 0.3), b = P(p, p.W / 2 - 0.2, p.H - 0.3);
  const sag = 0.5 * p.s;
  const pt = (f) => [a[0] + (b[0] - a[0]) * f, a[1] + Math.sin(f * Math.PI) * sag];
  c.strokeStyle = rgba(PAL.inkSoft, 0.8); c.lineWidth = 1;
  c.beginPath(); for (let i = 0; i <= 20; i++) { const q = pt(i / 20); i ? c.lineTo(...q) : c.moveTo(...q); } c.stroke();
  const cols = [PAL.accentYellow, PAL.accentTeal, PAL.accentOrange, PAL.accentBlue, PAL.accentGreen, PAL.accentPurple];
  for (let i = 1; i < 14; i++) {
    const q = pt(i / 14);
    c.fillStyle = cols[i % cols.length];
    c.beginPath(); c.moveTo(q[0] - 0.22 * p.s, q[1]); c.lineTo(q[0] + 0.22 * p.s, q[1]); c.lineTo(q[0], q[1] + 0.5 * p.s); c.closePath(); c.fill();
  }
  for (const u of [-p.W / 2 + 0.2, p.W / 2 - 0.2]) {
    const t = P(p, u, p.H - 0.3), g = P(p, u, 0);
    line(c, t[0], t[1], g[0], g[1], PAL.woodDark, 2);
  }
}

function rider(p) {
  const c = p.ctx;
  const s = p.s;
  const [x, y] = P(p, 0, 0);
  // wheels
  for (const dx of [-0.7, 0.7]) { disc(c, x + dx * s, y - 0.32 * s, 0.32 * s, '#2f2f36'); disc(c, x + dx * s, y - 0.32 * s, 0.14 * s, '#8d96a0'); }
  // body
  c.fillStyle = PAL.accentBlue;
  c.beginPath(); c.roundRect(x - 0.75 * s, y - 0.8 * s, 1.5 * s, 0.38 * s, 0.15 * s); c.fill();
  // delivery box (generic, no brand)
  wash(c, pts(p, [[-1.0, 0.85], [-0.2, 0.85], [-0.2, 1.65], [-1.0, 1.65]]), PAL.accentOrange, p.rng, { outline: 0.4 });
  // rider
  line(c, x + 0.05 * s, y - 0.8 * s, x + 0.35 * s, y - 0.45 * s, '#3f4a5e', 0.18 * s);
  c.fillStyle = PAL.accentGreen;
  c.beginPath(); c.roundRect(x - 0.1 * s, y - 1.6 * s, 0.45 * s, 0.75 * s, 0.14 * s); c.fill();
  line(c, x + 0.25 * s, y - 1.4 * s, x + 0.65 * s, y - 1.0 * s, PAL.accentGreen, 0.12 * s);
  disc(c, x + 0.15 * s, y - 1.85 * s, 0.24 * s, PAL.skin);
  c.fillStyle = PAL.accentYellow;
  c.beginPath(); c.ellipse(x + 0.15 * s, y - 1.92 * s, 0.27 * s, 0.2 * s, 0, Math.PI, 0); c.fill();
  disc(c, x + 0.85 * s, y - 0.75 * s, 0.08 * s, PAL.glow);
  glowDot(p.emit, x + 0.85 * s, y - 0.75 * s, 0.35 * s, 1);
}

function car(color) {
  return (p) => {
    const c = p.ctx, s = p.s;
    const [x, y] = P(p, 0, 0);
    for (const dx of [-0.9, 0.9]) disc(c, x + dx * s, y - 0.28 * s, 0.28 * s, '#2f2f36');
    wash(c, pts(p, [[-1.5, 0.3], [1.5, 0.3], [1.5, 0.95], [-1.5, 0.95]]), color, p.rng, { outline: 0.4 });
    wash(c, pts(p, [[-0.9, 0.95], [0.7, 0.95], [0.4, 1.5], [-0.7, 1.5]]), shade(color, 0.15), p.rng, { outline: 0.35 });
    wash(c, pts(p, [[-0.6, 1.0], [0.45, 1.0], [0.28, 1.38], [-0.5, 1.38]]), PAL.glass, p.rng, { outline: 0 });
    glowDot(p.emit, x + 1.45 * s, y - 0.7 * s, 0.3 * s, 1);
  };
}

function truck(p) {
  const c = p.ctx, s = p.s;
  const [x, y] = P(p, 0, 0);
  for (const dx of [-1.6, -0.7, 1.6]) disc(c, x + dx * s, y - 0.32 * s, 0.32 * s, '#2f2f36');
  wash(c, pts(p, [[-2.4, 0.35], [1.0, 0.35], [1.0, 2.1], [-2.4, 2.1]]), '#d9d2c2', p.rng, { outline: 0.4 });
  wash(c, pts(p, [[1.05, 0.35], [2.4, 0.35], [2.4, 1.3], [2.0, 1.8], [1.05, 1.8]]), PAL.accentRed, p.rng, { outline: 0.4 });
  wash(c, pts(p, [[1.6, 1.2], [2.25, 1.2], [1.95, 1.6], [1.6, 1.6]]), PAL.glass, p.rng, { outline: 0 });
}

function bus(p) {
  const c = p.ctx, s = p.s;
  const [x, y] = P(p, 0, 0);
  for (const dx of [-1.8, 1.6]) disc(c, x + dx * s, y - 0.3 * s, 0.3 * s, '#2f2f36');
  wash(c, pts(p, [[-2.6, 0.3], [2.6, 0.3], [2.6, 2.0], [-2.6, 2.0]]), PAL.accentGreen, p.rng, { outline: 0.4 });
  for (let i = 0; i < 6; i++) {
    const u = -2.3 + i * 0.8;
    wash(c, pts(p, [[u, 1.1], [u + 0.65, 1.1], [u + 0.65, 1.7], [u, 1.7]]), PAL.glass, p.rng, { outline: 0, pool: 0 });
    const q = P(p, u, 1.7);
    p.emit.fillStyle = 'rgba(255,255,255,0.6)';
    p.emit.fillRect(q[0], q[1], 0.65 * s, 0.6 * s);
  }
  wash(c, pts(p, [[-2.6, 0.75], [2.6, 0.75], [2.6, 0.95], [-2.6, 0.95]]), PAL.wallWhite, p.rng, { outline: 0 });
}

function hill(p) {
  const shape = [];
  for (let k = 0; k <= 24; k++) {
    const f = k / 24;
    shape.push([-p.W / 2 + f * p.W, Math.pow(Math.sin(f * Math.PI), 0.8) * (p.H - 0.4) * (1 + (p.rng() - 0.5) * 0.05)]);
  }
  const q = pts(p, shape);
  wash(p.ctx, q, '#7f9d5c', p.rng, { smooth: true, outline: 0.15, light: 0.3 });
  p.ctx.save();
  tracePath(p.ctx, q); p.ctx.clip();
  for (let i = 0; i < 40; i++) {
    const [x, y] = P(p, p.rng.range(-p.W / 2, p.W / 2), p.rng.range(0, p.H * 0.8));
    disc(p.ctx, x, y, p.rng.range(0.4, 0.9) * p.s, p.rng.chance(0.5) ? LEAF.oak.shadow : LEAF.lime.body, 0.55);
  }
  p.ctx.restore();
  p.ctx.save();
  p.ctx.globalCompositeOperation = 'destination-out';
  const g = p.ctx.createLinearGradient(0, p.H * p.s, 0, (p.H - 1.2) * p.s);
  g.addColorStop(0, 'rgba(0,0,0,0.9)'); g.addColorStop(1, 'rgba(0,0,0,0)');
  p.ctx.fillStyle = g; p.ctx.fillRect(0, 0, p.W * p.s, p.H * p.s);
  p.ctx.restore();
}

function windTurbine(p) {
  const a = P(p, 0, 0), t = P(p, 0, p.H - 2.6);
  brushStroke(p.ctx, [a, t], { width: 0.35 * p.s, color: '#efece4' });
  for (let i = 0; i < 3; i++) {
    const ang = -Math.PI / 2 + i * (Math.PI * 2 / 3) + 0.3;
    const e = [t[0] + Math.cos(ang) * 2.4 * p.s, t[1] + Math.sin(ang) * 2.4 * p.s];
    brushStroke(p.ctx, [t, e], { width: 0.28 * p.s, color: '#f6f3ea' });
  }
  disc(p.ctx, t[0], t[1], 0.2 * p.s, '#c9c4b8');
}

// ---------- region mode: projects, finished works, shortages ----------
// Construction hoarding: plywood panels with a striped band and a hazard lamp.
function siteFence(p) {
  const c = p.ctx;
  const n = 5;
  const pw = (p.W - 0.4) / n;
  for (let i = 0; i < n; i++) {
    const u = -p.W / 2 + 0.2 + i * pw;
    wash(c, pts(p, [[u, 0], [u + pw - 0.06, 0], [u + pw - 0.06, 1.5], [u, 1.5]]), i % 2 ? '#d8c9a4' : '#cdbd96', p.rng, { outline: 0.3, dabs: 0.4 });
  }
  c.save();
  polyClip(c, pts(p, [[-p.W / 2 + 0.2, 1.1], [p.W / 2 - 0.2, 1.1], [p.W / 2 - 0.2, 1.42], [-p.W / 2 + 0.2, 1.42]]));
  for (let u = -p.W / 2; u < p.W / 2 + 1; u += 0.6) {
    const a = P(p, u, 1.0), b = P(p, u + 0.45, 1.5);
    line(c, a[0], a[1], b[0], b[1], PAL.accentOrange, 0.28 * p.s);
  }
  c.restore();
  const [lx, ly] = P(p, p.W / 2 - 0.5, 1.75);
  disc(c, lx, ly, 0.16 * p.s, PAL.accentOrange);
  glowDot(p.emit, lx, ly, 0.4 * p.s, 0.9);
}

// Road closed: striped barrier on two legs, cones and a fallen-rock heap.
function roadBlock(p) {
  const c = p.ctx;
  for (const [u, r] of [[0.9, 0.55], [1.55, 0.42], [0.35, 0.38]]) {
    const b = lobedBlob(...P(p, u, r * 0.7), r * p.s, p.rng, { lobes: 5, depth: 0.2, squash: 0.75 });
    wash(c, b, p.rng.pick(['#8c8478', '#a39a8b', '#7b7468']), p.rng, { smooth: true, outline: 0.35 });
  }
  for (const u of [-1.3, -0.1]) {
    const a = P(p, u, 0), b = P(p, u, 1.0);
    line(c, a[0], a[1], b[0], b[1], '#5a5560', 0.14 * p.s);
  }
  const bar = pts(p, [[-1.6, 0.75], [0.2, 0.75], [0.2, 1.15], [-1.6, 1.15]]);
  wash(c, bar, '#f4efe2', p.rng, { outline: 0.4, pool: 0 });
  c.save(); polyClip(c, bar);
  for (let u = -1.8; u < 0.4; u += 0.45) {
    const a = P(p, u, 0.7), b = P(p, u + 0.3, 1.2);
    line(c, a[0], a[1], b[0], b[1], PAL.accentRed, 0.2 * p.s);
  }
  c.restore();
  for (const u of [-1.9, 0.5]) {
    wash(c, pts(p, [[u - 0.22, 0], [u + 0.22, 0], [u, 0.62]]), PAL.accentOrange, p.rng, { outline: 0.35, pool: 0 });
    const a = P(p, u - 0.12, 0.3), b = P(p, u + 0.12, 0.3);
    line(c, a[0], a[1], b[0], b[1], '#ffffff', 0.08 * p.s);
  }
  const [lx, ly] = P(p, -0.7, 1.3);
  disc(c, lx, ly, 0.13 * p.s, PAL.accentRed);
  glowDot(p.emit, lx, ly, 0.35 * p.s, 0.9);
}

// Cold storage: insulated white hall, blue band, roof chillers.
function coldStore(p) {
  const b = box(p, { x: -0.4, w: p.W - 2.2, h: 3.2, d: 1.8, wall: '#eef1ef', topCol: '#d7dfe0' });
  wash(p.ctx, pts(p, [[b.l, 2.3], [b.r, 2.3], [b.r, 2.75], [b.l, 2.75]]), PAL.accentBlue, p.rng, { outline: 0.2 });
  for (let i = 0; i < 3; i++) {
    const u = b.l + 1.0 + i * 2.2;
    wash(p.ctx, pts(p, [[u, 0], [u + 1.5, 0], [u + 1.5, 1.6], [u, 1.6]]), '#9fb2bb', p.rng, { outline: 0.3, pool: 0.15 });
    for (let k = 1; k < 4; k++) {
      const a = P(p, u, k * 0.4), c2 = P(p, u + 1.5, k * 0.4);
      line(p.ctx, a[0], a[1], c2[0], c2[1], '#7d909a', 1, 0.6);
    }
  }
  for (let i = 0; i < 2; i++) {
    const cb = box(p, { x: b.l + 1.6 + i * 2.6, y: b.t + 0.2, w: 1.6, h: 0.8, d: 0.6, wall: '#c3cbcd', outline: 0.3 });
    const [x, y] = P(p, cb.x, cb.y + 0.4);
    disc(p.ctx, x, y, 0.28 * p.s, '#8b979c');
  }
  glowDot(p.emit, ...P(p, b.r - 0.6, 2.0), 0.4 * p.s, 0.7);
}

// Power reserve: substation frame, transformer and a row of battery cabinets.
function substation(p) {
  const c = p.ctx;
  for (let i = 0; i < 4; i++) {
    const bb = box(p, { x: -p.W / 2 + 1.0 + i * 1.5, w: 1.3, h: 1.3, d: 0.6, wall: i % 2 ? '#7fa59a' : '#86ad9f', outline: 0.3 });
    const [x, y] = P(p, bb.x, 0.9);
    disc(c, x, y, 0.1 * p.s, '#cfe9a8');
    glowDot(p.emit, x, y, 0.25 * p.s, 0.9);
  }
  const L = 0.6, R = p.W / 2 - 0.4;
  for (const u of [L, (L + R) / 2, R]) {
    const a = P(p, u, 0), b = P(p, u, 3.4);
    line(c, a[0], a[1], b[0], b[1], '#6f737a', 0.14 * p.s);
  }
  for (const v of [2.4, 3.3]) {
    const a = P(p, L - 0.2, v), b = P(p, R + 0.2, v);
    line(c, a[0], a[1], b[0], b[1], '#6f737a', 0.12 * p.s);
  }
  const t = box(p, { x: (L + R) / 2, w: 1.8, h: 1.5, d: 0.7, wall: '#8d96a0', outline: 0.35 });
  for (let k = 0; k < 3; k++) {
    const [x, y] = P(p, t.l + 0.4 + k * 0.5, t.t + 0.3);
    line(c, x, y, x, y - 0.5 * p.s, '#c9a46a', 0.1 * p.s);
  }
}

// Clinic: small white health post with a green plus and an awning.
function clinic(p) {
  const b = box(p, { x: -0.3, w: p.W - 1.8, h: 2.8, d: 1.6, wall: '#f6f4ee', top: false });
  windows(p, b, { rows: 1, cols: 3, mx: 0.5, mb: 1.1, mt: 0.6, gap: 0.6, lit: 0.8, color: '#5d8a94' });
  gable(p, b, { color: PAL.accentTeal, rise: 1.0, over: 0.4, tiles: false });
  wash(p.ctx, pts(p, [[b.x - 1.0, 1.0], [b.x + 1.0, 1.0], [b.x + 1.3, 1.35], [b.x - 1.3, 1.35]]), PAL.accentTeal, p.rng, { outline: 0.3 });
  door(p, b.x, 1.0, 1.0, PAL.glassDeep);
  const [cx, cy] = P(p, b.r - 0.9, b.t - 0.75);
  const s = 0.35 * p.s;
  p.ctx.fillStyle = '#3fa05a';
  p.ctx.fillRect(cx - s, cy - s * 0.33, s * 2, s * 0.66);
  p.ctx.fillRect(cx - s * 0.33, cy - s, s * 0.66, s * 2);
}

// Sluice gate over a lined canal: the finished irrigation channel.
function sluice(p) {
  const c = p.ctx;
  wash(c, pts(p, [[-p.W / 2 + 0.2, 0], [p.W / 2 - 0.2, 0], [p.W / 2 - 0.6, 0.55], [-p.W / 2 + 0.6, 0.55]]), PAL.paddyWater, p.rng, { outline: 0.3, pool: 0.2 });
  for (let i = 0; i < 4; i++) {
    const u = -p.W / 2 + 0.8 + i * 0.9;
    const a = P(p, u, 0.2), b = P(p, u + 0.5, 0.25);
    line(c, a[0], a[1], b[0], b[1], '#e8f2ee', 0.07 * p.s, 0.8);
  }
  for (const u of [-1.0, 1.0]) wash(c, pts(p, [[u - 0.3, 0.2], [u + 0.3, 0.2], [u + 0.3, 2.2], [u - 0.3, 2.2]]), '#bdb5a5', p.rng, { outline: 0.35 });
  wash(c, pts(p, [[-0.7, 0.6], [0.7, 0.6], [0.7, 1.5], [-0.7, 1.5]]), '#5d7c94', p.rng, { outline: 0.35 });
  wash(c, pts(p, [[-1.4, 2.1], [1.4, 2.1], [1.4, 2.45], [-1.4, 2.45]]), '#a9a196', p.rng, { outline: 0.35 });
  const [wx, wy] = P(p, 0, 2.75);
  c.strokeStyle = PAL.accentRed; c.lineWidth = 0.1 * p.s;
  c.beginPath(); c.arc(wx, wy, 0.3 * p.s, 0, Math.PI * 2); c.stroke();
}

// Footbridge over the river (stands on both banks).
function bridge(p) {
  const c = p.ctx;
  const deck = [];
  for (let k = 0; k <= 12; k++) deck.push([-p.W / 2 + 0.2 + (p.W - 0.4) * k / 12, 0.9 + Math.sin(Math.PI * k / 12) * 0.7]);
  wash(c, pts(p, [...deck, ...deck.slice().reverse().map(([u, v]) => [u, v - 0.35])]), PAL.woodLight, p.rng, { outline: 0.4 });
  for (let k = 0; k <= 12; k += 2) {
    const [u, v] = deck[k];
    const a = P(p, u, v), b = P(p, u, v + 0.8);
    line(c, a[0], a[1], b[0], b[1], PAL.woodDark, 0.09 * p.s);
  }
  c.strokeStyle = PAL.woodDark; c.lineWidth = 0.08 * p.s;
  c.beginPath(); deck.forEach(([u, v], i) => { const q = P(p, u, v + 0.8); if (i) c.lineTo(...q); else c.moveTo(...q); }); c.stroke();
  for (const u of [-p.W / 2 + 0.6, p.W / 2 - 0.6]) wash(c, pts(p, [[u - 0.35, 0], [u + 0.35, 0], [u + 0.35, 1.0], [u - 0.35, 1.0]]), '#a9a196', p.rng, { outline: 0.35 });
}

// Bus stop shelter with a route sign.
function busStop(p) {
  const c = p.ctx;
  wash(c, pts(p, [[-1.4, 0], [1.2, 0], [1.2, 1.9], [-1.4, 1.9]]), '#c7d7da', p.rng, { outline: 0.35, pool: 0.1 });
  wash(c, pts(p, [[-1.7, 1.9], [1.5, 1.9], [1.7, 2.25], [-1.5, 2.25]]), PAL.accentGreen, p.rng, { outline: 0.4 });
  wash(c, pts(p, [[-1.1, 0.45], [0.9, 0.45], [0.9, 0.62], [-1.1, 0.62]]), PAL.wood, p.rng, { outline: 0.3 });
  const a = P(p, 1.7, 0), b = P(p, 1.7, 2.6);
  line(c, a[0], a[1], b[0], b[1], '#4c4f5a', 0.1 * p.s);
  const [x, y] = P(p, 1.7, 2.6);
  disc(c, x, y, 0.32 * p.s, PAL.accentGreen);
  disc(c, x, y, 0.18 * p.s, '#f4efe2');
  glowDot(p.emit, ...P(p, -0.1, 1.2), 0.6 * p.s, 0.5);
}

// Training workshop: saw-tooth roof hall with big glazed doors.
function workshop(p) {
  const b = box(p, { x: -0.4, w: p.W - 2.0, h: 2.8, d: 1.8, wall: '#e3c79a', top: false });
  const teeth = 4, tw = b.w / teeth;
  for (let i = 0; i < teeth; i++) {
    const u = b.l + i * tw;
    wash(p.ctx, pts(p, [[u, b.t], [u + tw, b.t], [u + tw, b.t + 1.3]]), i % 2 ? '#8a6a5a' : '#9a7564', p.rng, { outline: 0.3 });
    wash(p.ctx, pts(p, [[u + tw * 0.62, b.t + 0.15], [u + tw * 0.95, b.t + 0.15], [u + tw * 0.95, b.t + 1.1]]), PAL.glass, p.rng, { outline: 0, pool: 0 });
  }
  windows(p, b, { rows: 1, cols: 3, mx: 0.6, mb: 0.2, mt: 0.6, gap: 0.7, lit: 0.9, color: PAL.glassDeep });
  wash(p.ctx, pts(p, [[b.l, b.t - 0.5], [b.r, b.t - 0.5], [b.r, b.t - 0.15], [b.l, b.t - 0.15]]), PAL.accentBlue, p.rng, { outline: 0.2 });
}

// ---------- catalog ----------
// w, h: card size in world units. s: px per unit. Options: plant, sway, glow (channel), shadow, smoke anchors.
export const SPRITES = {
  tree_a: { w: 5, h: 6, paint: roundTree(LEAF.oak), plant: 1, sway: 0.12 },
  tree_b: { w: 4.4, h: 5.4, paint: roundTree(LEAF.lime, { trunkH: 1.3 }), plant: 1, sway: 0.14 },
  tree_c: { w: 4.6, h: 5.8, paint: roundTree(LEAF.teal), plant: 1, sway: 0.12 },
  tree_bloom: { w: 4.4, h: 5.2, paint: roundTree(LEAF.blossom, { trunkH: 1.4 }), plant: 0.4, sway: 0.12 },
  tree_autumn: { w: 4.6, h: 5.6, paint: roundTree(LEAF.autumn), plant: 0.3, sway: 0.12 },
  banyan: { w: 10, h: 8.5, paint: roundTree(LEAF.oak, { trunkH: 2.2 }), plant: 1, sway: 0.08 },
  palm: { w: 4.4, h: 6.4, paint: palm, plant: 1, sway: 0.22 },
  pine: { w: 3.2, h: 6.4, paint: pine, plant: 1, sway: 0.08 },
  bamboo: { w: 3.6, h: 5.6, paint: bamboo, plant: 1, sway: 0.25 },
  bush: { w: 2.6, h: 1.7, paint: bush(LEAF.oak), plant: 1, sway: 0.05 },
  bush_lime: { w: 2.4, h: 1.6, paint: bush(LEAF.lime), plant: 1, sway: 0.05 },
  flowers: { w: 1.8, h: 1.0, paint: flowers, plant: 0.6, sway: 0.05, shadow: 0 },
  rock: { w: 2.2, h: 1.4, paint: rock },
  hill: { w: 26, h: 6, s: 10, paint: hill, plant: 0.8, shadow: 0 },
  mountain_a: { w: 46, h: 22, s: 8, paint: mountain(PAL.mountain, { peaks: 2 }), shadow: 0 },
  mountain_b: { w: 38, h: 18, s: 8, paint: mountain(PAL.mountainDeep, { peaks: 1 }), shadow: 0 },
  mountain_c: { w: 52, h: 16, s: 8, paint: mountain(PAL.mountainFar, { peaks: 3 }), shadow: 0 },
  cloud_a: { w: 30, h: 11, s: 7, paint: cloud, shadow: 0 },
  cloud_b: { w: 22, h: 9, s: 7, paint: cloud, shadow: 0 },

  house_red: { w: 6.4, h: 4.6, paint: house(PAL.roofRed, PAL.wallCream), glow: 2 },
  house_blue: { w: 6.4, h: 4.6, paint: house(PAL.roofBlue, PAL.wallYellow), glow: 2 },
  house_terra: { w: 6.4, h: 4.6, paint: house(PAL.roofTerra, PAL.wallPink), glow: 2 },
  hut: { w: 5.6, h: 3.8, paint: thatchHut },
  solar_house: { w: 6.4, h: 4.8, paint: solarHouse, glow: 2 },
  stilt: { w: 7, h: 6.2, paint: stiltHouse, glow: 2 },
  barn: { w: 7.6, h: 5.0, paint: barn },
  greenhouse: { w: 10, h: 2.6, paint: greenhouse, plant: 0.3 },
  haystack: { w: 1.8, h: 1.6, paint: haystack },
  buffalo: { w: 2.8, h: 1.7, paint: buffalo },

  shophouses: { w: 11, h: 8, paint: shophouses, glow: 2 },
  apt_cream: { w: 10, h: 15, paint: apartment(PAL.wallCream, 8), glow: 2 },
  apt_pink: { w: 10, h: 12, paint: apartment(PAL.wallPink, 6), glow: 2 },
  apt_blue: { w: 10, h: 13.5, paint: apartment(PAL.wallBlue, 7), glow: 2 },
  tower: { w: 8, h: 21, paint: tower, glow: 1 },
  lab: { w: 15, h: 6.6, paint: lab, glow: 1 },
  factory: { w: 16, h: 11, paint: factory, glow: 1, smoke: [[7.0, 10.3]] },
  tanks: { w: 7, h: 5.4, paint: tanks },
  warehouse: { w: 11, h: 5.6, paint: warehouse, glow: 1 },
  crane: { w: 12, h: 17, paint: crane, glow: 1, sway: 0.03, shadow: 0.4 },
  scaffold: { w: 10, h: 12, paint: scaffold },
  hospital: { w: 19, h: 10.5, paint: hospital, glow: 3 },
  ambulance: { w: 3.8, h: 2.4, paint: ambulance, glow: 3 },
  school: { w: 17, h: 7.6, paint: school, glow: 3 },
  stall_red: { w: 3.6, h: 2.8, paint: stall(PAL.accentRed), glow: 2 },
  stall_teal: { w: 3.6, h: 2.8, paint: stall(PAL.accentTeal), glow: 2 },
  stall_yellow: { w: 3.6, h: 2.8, paint: stall(PAL.accentYellow), glow: 2 },
  kindergarten: { w: 13, h: 5.6, paint: kindergarten, glow: 3 },
  elder_home: { w: 13, h: 5.4, paint: elderHome, glow: 3 },
  community_hall: { w: 12, h: 5.6, paint: communityHall, glow: 3 },
  temple: { w: 15, h: 9.5, paint: temple, glow: 3 },
  dam: { w: 34, h: 12, s: 14, paint: dam, glow: 1 },
  pylon: { w: 3.4, h: 10, paint: pylon, shadow: 0.3 },
  containers: { w: 8, h: 3.6, paint: containers },
  gantry: { w: 12, h: 14, paint: gantry, glow: 1, shadow: 0.5 },
  ship: { w: 16, h: 6, paint: ship, glow: 1, shadow: 0 },
  boat: { w: 4.4, h: 2.6, paint: boat, glow: 2, shadow: 0 },
  lighthouse: { w: 3.4, h: 9.5, paint: lighthouse, glow: 3 },
  lamp: { w: 1.0, h: 3.4, paint: lamp, glow: 3, shadow: 0.2 },
  planter: { w: 1.5, h: 1.1, paint: planter, plant: 0.6 },
  trash: { w: 2.4, h: 1.3, paint: trash },
  broken_fence: { w: 3.4, h: 1.2, paint: brokenFence },
  boxes: { w: 2.4, h: 1.5, paint: boxes },
  bunting: { w: 9, h: 3.4, paint: bunting, sway: 0.05, shadow: 0 },
  wind_turbine: { w: 5.4, h: 11, paint: windTurbine, shadow: 0.2 },
  // Region mode: works in progress, finished works, shortages.
  site_fence: { w: 7.2, h: 2.2, paint: siteFence, shadow: 0.4 },
  road_block: { w: 4.4, h: 1.8, paint: roadBlock, shadow: 0.5 },
  cold_store: { w: 11, h: 5.2, paint: coldStore, glow: 1 },
  substation: { w: 9, h: 4.2, paint: substation, shadow: 0.6 },
  clinic: { w: 8, h: 4.8, paint: clinic, glow: 3 },
  sluice: { w: 5, h: 3.2, paint: sluice, shadow: 0.4 },
  bridge: { w: 12, h: 2.6, paint: bridge, shadow: 0 },
  bus_stop: { w: 4, h: 2.9, paint: busStop, glow: 2, shadow: 0.5 },
  workshop: { w: 11, h: 5.2, paint: workshop, glow: 3 },

  // Moving / living things.
  rider: { w: 2.4, h: 2.2, paint: rider, glow: 2 },
  car_red: { w: 3.4, h: 1.7, paint: car(PAL.accentRed) },
  car_blue: { w: 3.4, h: 1.7, paint: car(PAL.accentBlue) },
  car_white: { w: 3.4, h: 1.7, paint: car('#e8e4da') },
  truck: { w: 5.2, h: 2.4, paint: truck },
  bus: { w: 5.6, h: 2.3, paint: bus, glow: 2 },
  crowd_a: { w: 4.4, h: 2.3, paint: crowdPainter(5), shadow: 0.8 },
  crowd_b: { w: 3.6, h: 2.3, paint: crowdPainter(4), shadow: 0.8 },
  crowd_cheer: { w: 4.4, h: 2.4, paint: crowdPainter(5, { cheer: true }), shadow: 0.8 },
  crowd_workers: { w: 4.4, h: 2.3, paint: crowdPainter(5, { hat: 'hard', shirts: [PAL.accentBlue, '#5b7fa6', PAL.accentOrange] }), shadow: 0.8 },
  crowd_farmers: { w: 4.4, h: 2.4, paint: crowdPainter(4, { hat: 'conical', shirts: ['#7f9a6a', '#c9a46a', '#7d6a9a', '#4a77b0'] }), shadow: 0.8 },
  crowd_family: { w: 4.0, h: 2.3, paint: crowdPainter(5, { kids: true }), shadow: 0.8 },
  crowd_elders: { w: 3.6, h: 2.3, paint: crowdPainter(3, { hat: 'gray', hatChance: 1, shirts: ['#b9a7c9', '#a9c3cc', '#e2c79a'] }), shadow: 0.8 },
  walker_a: { w: 1.0, h: 2.1, paint: (p) => person(p, 0, { shirt: PAL.accentRed }) },
  walker_b: { w: 1.0, h: 2.1, paint: (p) => person(p, 0, { shirt: PAL.accentBlue }) },
  walker_c: { w: 1.0, h: 2.1, paint: (p) => person(p, 0, { shirt: PAL.accentTeal, hat: 'cap' }) },
  walker_d: { w: 1.0, h: 2.1, paint: (p) => person(p, 0, { shirt: PAL.accentYellow }) },
  walker_e: { w: 1.0, h: 2.1, paint: (p) => person(p, 0, { shirt: PAL.wallWhite, pants: '#5b4b3f' }) },
  worker: { w: 1.0, h: 2.1, paint: (p) => person(p, 0, { shirt: '#5b7fa6', hat: 'hard' }) },
  farmer: { w: 1.1, h: 2.2, paint: (p) => person(p, 0, { shirt: '#7f9a6a', hat: 'conical', skin: PAL.skinDark }) },
  elder: { w: 1.1, h: 2.1, paint: (p) => person(p, -0.1, { shirt: '#b9a7c9', hat: 'gray', cane: true }) },
  child: { w: 0.8, h: 1.5, paint: (p) => person(p, 0, { shirt: PAL.accentOrange, scale: 0.68 }) },
};

export const WALKERS = ['walker_a', 'walker_b', 'walker_c', 'walker_d', 'walker_e'];
