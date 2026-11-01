// Top-down debug map of the layout (world-map.html): water, roads, zones, footprints,
// mover paths and every validation failure in red. Pure Canvas2D, no three.js.
import { ROADS, ZONES, FIELDS, DOCKS, SITES, isWater, buildProps, buildMovers } from './layout.js';
import { footOf, samplePath, validateLayout } from './footprint.js';

const COLORS = { building: '#7a4a2a', solid: '#c0702a', kerb: '#2a5aa0', plant: '#3d8a3d', water: '#204a80', dam: '#555', shore: '#555' };

export function drawMap(canvas, { view = { x0: -150, z0: -110, x1: 150, z1: 100 }, state } = {}) {
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;
  const k = Math.min(W / (view.x1 - view.x0), H / (view.z1 - view.z0));
  const X = (x) => (x - view.x0) * k, Z = (z) => (z - view.z0) * k;
  ctx.fillStyle = '#e8e2cc';
  ctx.fillRect(0, 0, W, H);
  // Water by sampling.
  const step = Math.max(0.5, 2 / k);
  ctx.fillStyle = '#9cc3d8';
  for (let z = view.z0; z < view.z1; z += step) for (let x = view.x0; x < view.x1; x += step) if (isWater(x, z)) ctx.fillRect(X(x), Z(z), step * k + 1, step * k + 1);
  ctx.globalAlpha = 0.5;
  for (const f of FIELDS) { ctx.fillStyle = '#a8c870'; ctx.fillRect(X(f.x - f.w / 2), Z(f.z - f.d / 2), f.w * k, f.d * k); }
  for (const zn of ZONES) { ctx.fillStyle = zn.kind === 'lawn' ? '#c8e0a0' : '#d8c8a8'; ctx.beginPath(); ctx.ellipse(X(zn.x), Z(zn.z), zn.rx * k, zn.rz * k, 0, 0, Math.PI * 2); ctx.fill(); }
  for (const d of DOCKS) { ctx.fillStyle = '#aaa'; ctx.fillRect(X(d.x0), Z(d.z0), (d.x1 - d.x0) * k, (d.z1 - d.z0) * k); }
  ctx.globalAlpha = 1;
  ROADS.forEach((r, i) => {
    ctx.strokeStyle = '#555'; ctx.lineWidth = r.w * k; ctx.lineJoin = 'round';
    ctx.beginPath(); r.pts.forEach(([x, z], j) => (j ? ctx.lineTo(X(x), Z(z)) : ctx.moveTo(X(x), Z(z)))); ctx.stroke();
    ctx.fillStyle = '#fff'; ctx.font = '11px monospace'; const m = r.pts[Math.floor(r.pts.length / 2)]; ctx.fillText(`road${i}`, X(m[0]), Z(m[1]));
  });
  const props = buildProps(), movers = buildMovers();
  const vis = (s) => !state || !s || s(state) > 0;
  for (const m of movers) {
    if (!vis(m.show)) continue;
    ctx.fillStyle = m.k === 'boat' ? '#0050ff' : m.walker ? '#009040' : '#d000d0';
    for (const [x, z] of samplePath(m, 1)) ctx.fillRect(X(x) - 1, Z(z) - 1, 2, 2);
  }
  for (const p of props) {
    if (!vis(p.show)) continue;
    const r = footOf(p);
    if (!r) continue;
    ctx.strokeStyle = COLORS[r.cls]; ctx.lineWidth = 1.5;
    ctx.strokeRect(X(r.x0), Z(r.z0), (r.x1 - r.x0) * k, (r.z1 - r.z0) * k);
    if (r.cls === 'building' && k > 3) { ctx.fillStyle = '#000'; ctx.font = '10px monospace'; ctx.fillText(p.k, X(r.x0), Z(r.z0) - 2); }
  }
  for (const [id, s] of Object.entries(SITES)) { ctx.fillStyle = '#d00'; ctx.font = 'bold 12px sans-serif'; ctx.fillText(`◎${id}`, X(s.x), Z(s.z)); }
  const { overlaps } = validateLayout(props, movers, { state });
  ctx.strokeStyle = '#f00'; ctx.lineWidth = 3;
  const at = (s) => { const m = /@(-?[\d.]+),(-?[\d.]+)/.exec(s ?? ''); return m ? [+m[1], +m[2]] : null; };
  for (const o of overlaps) {
    const p = o.at ?? at(o.a);
    if (p) { ctx.beginPath(); ctx.arc(X(p[0]), Z(p[1]), 6, 0, Math.PI * 2); ctx.stroke(); }
  }
  // Grid labels every 20 units.
  ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.font = '10px monospace';
  for (let x = Math.ceil(view.x0 / 20) * 20; x < view.x1; x += 20) ctx.fillText(x, X(x), 10);
  for (let z = Math.ceil(view.z0 / 20) * 20; z < view.z1; z += 20) ctx.fillText(z, 2, Z(z));
  ctx.strokeStyle = 'rgba(0,0,0,0.08)'; ctx.lineWidth = 1;
  for (let x = Math.ceil(view.x0 / 10) * 10; x < view.x1; x += 10) { ctx.beginPath(); ctx.moveTo(X(x), 0); ctx.lineTo(X(x), H); ctx.stroke(); }
  for (let z = Math.ceil(view.z0 / 10) * 10; z < view.z1; z += 10) { ctx.beginPath(); ctx.moveTo(0, Z(z)); ctx.lineTo(W, Z(z)); ctx.stroke(); }
  return overlaps;
}
