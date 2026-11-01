// Region mode of the diorama (ARCHITECTURE_REGIONS.md, "Hợp đồng Diorama cho vùng").
// This file holds the per-region look (status wash, hover / selection, dryness, window
// light, smoke), the floating link arcs, camera framings, picking and label anchors.
// index.js owns the world state S and the prop rules; geometry lives in regiongeo.js.
import * as THREE from 'three';
import { clamp, damp } from '../core/math.js';
import { REGION_IDS, REGION_ANCHORS, regionAt, regionBoxes } from './regiongeo.js';
import { PITCH, FOV } from './camera.js';
import { vec3 } from './palette.js';

// Pigment and strength of the status glaze (gentle: the art must stay readable).
const STATUS_WASH = {
  urgent: [0.9, 0.46, 0.38, 0.5],
  attention: [0.91, 0.69, 0.27, 0.46],
  opportunity: [0.30, 0.66, 0.58, 0.44],
  stable: [1, 1, 1, 0],
};
const LINK_STYLE = {
  risk: { color: '#c4553d', kind: 0 },
  active: { color: '#3d5f8a', kind: 1 },
  benefit: { color: '#3f9a58', kind: 2 },
};

const idx = (id) => REGION_IDS.indexOf(id);

// ---------- camera framings ----------
// The region sits in the left / centre 60% of the screen (the region panel covers the
// right 40%), centred near 30% of the width.
const TAN = Math.tan(THREE.MathUtils.degToRad(FOV / 2));
export function regionShot(id, aspect = 16 / 9) {
  const b = regionBoxes()[id];
  if (!b) return null;
  const a = Math.max(1.2, aspect);
  const cx = (b.x0 + b.x1) / 2 * 0.5 + b.cx * 0.5, cz = (b.z0 + b.z1) / 2 * 0.5 + b.cz * 0.5;
  const W = b.x1 - b.x0 + 10, D = b.z1 - b.z0 + 10;
  const dW = W / (0.5 * 2 * TAN * a);
  const dD = D / (0.66 * (2 * TAN / Math.sin(PITCH)));
  return { x: cx, z: cz, d: clamp(Math.max(dW, dD), 80, 280), fx: -0.38, fy: 0.02 };
}
// Whole island, centred (no panel open on the map screen).
export function overviewShot(aspect = 16 / 9) {
  const a = Math.max(1.2, aspect);
  const W = 285, D = 190;
  const d = clamp(Math.max(W / (0.92 * 2 * TAN * a), D / (0.86 * (2 * TAN / Math.sin(PITCH)))), 260, 420);
  return { x: -3, z: -4, d, fx: -0.02, fy: 0.0 };
}

// ---------- link arcs ----------
const linkVert = /* glsl */ `
attribute vec3 aSide;
attribute vec2 aSV; // arclength, across (-1..1)
uniform float uWidth;
varying vec2 vSV;
void main() {
  vSV = aSV;
  vec3 p = position + aSide * aSV.y * uWidth;
  gl_Position = projectionMatrix * viewMatrix * vec4(p, 1.0);
}
`;
const linkFrag = /* glsl */ `
uniform vec3 uColor;
uniform float uKind, uTime, uAlpha, uLen;
varying vec2 vSV;
void main() {
  float s = vSV.x, v = abs(vSV.y);
  // Brushy ribbon: soft edge, slightly darker rim.
  float a = 1.0 - smoothstep(0.62, 1.0, v);
  vec3 col = mix(uColor, uColor * 0.72, smoothstep(0.35, 0.9, v));
  if (uKind < 0.5) {
    // Risk: dashes marching from source to target.
    float f = fract((s - uTime * 3.2) / 3.4);
    a *= smoothstep(0.0, 0.08, f) * (1.0 - smoothstep(0.52, 0.6, f));
  } else {
    // Active / benefit: solid with light pulses travelling along.
    float f = fract((s - uTime * 5.0) / 16.0);
    float p = smoothstep(0.0, 0.04, f) * (1.0 - smoothstep(0.04, 0.22, f));
    col = mix(col, vec3(1.0, 0.97, 0.88), p * (1.0 - v) * 0.5);
  }
  // Chevrons near the target show the direction.
  float tgt = smoothstep(uLen - 9.0, uLen - 2.0, s) * (1.0 - smoothstep(uLen - 2.0, uLen - 0.5, s));
  float chev = step(fract((s + v * 1.4) / 2.2), 0.3) * tgt;
  col = mix(col, col * 0.55, chev);
  float ends = smoothstep(0.0, 1.5, s) * smoothstep(0.0, 0.6, uLen - s);
  gl_FragColor = vec4(col, a * ends * uAlpha * 0.92);
}
`;

class LinkLayer {
  constructor(scene, U) {
    this.U = U;
    this.group = new THREE.Group();
    this.group.name = 'region-links';
    this.group.renderOrder = 6;
    scene.add(this.group);
    this.links = new Map(); // key -> { mesh, alpha, target }
    this.width = { value: 0.9 };
  }

  set(list) {
    const want = new Map();
    const pairs = new Map();
    for (const l of Array.isArray(list) ? list : []) {
      if (!l || !REGION_ANCHORS[l.from] || !REGION_ANCHORS[l.to] || l.from === l.to) continue;
      const kind = LINK_STYLE[l.kind] ? l.kind : 'active';
      const key = `${l.from}>${l.to}:${kind}:${l.service ?? ''}`;
      if (want.has(key)) continue;
      const pk = [l.from, l.to].sort().join('-');
      const n = pairs.get(pk) ?? 0;
      pairs.set(pk, n + 1);
      want.set(key, { from: l.from, to: l.to, kind, lane: n });
    }
    for (const [key, L] of this.links) if (!want.has(key)) L.target = 0;
    for (const [key, w] of want) {
      const L = this.links.get(key);
      if (L) { L.target = 1; continue; }
      const mesh = this.build(w);
      this.group.add(mesh);
      this.links.set(key, { mesh, alpha: 0, target: 1 });
    }
  }

  build({ from, to, kind, lane }) {
    const A = REGION_ANCHORS[from], B = REGION_ANCHORS[to];
    const a = new THREE.Vector3(A.x, 1.2, A.z), b = new THREE.Vector3(B.x, 1.2, B.z);
    const dist = a.distanceTo(b);
    // Lanes: a second link between the same pair bows further out.
    const side2 = new THREE.Vector3(-(b.z - a.z), 0, b.x - a.x).normalize();
    const c = a.clone().add(b).multiplyScalar(0.5);
    c.y += 7 + dist * 0.2 + lane * 5;
    c.addScaledVector(side2, lane * 7);
    const curve = new THREE.QuadraticBezierCurve3(a, c, b);
    const N = 64;
    const pts = curve.getSpacedPoints(N);
    const view = new THREE.Vector3(0, -Math.sin(PITCH), -Math.cos(PITCH));
    const pos = [], side = [], sv = [], index = [];
    let s = 0;
    for (let i = 0; i <= N; i++) {
      if (i) s += pts[i].distanceTo(pts[i - 1]);
      const t = pts[Math.min(N, i + 1)].clone().sub(pts[Math.max(0, i - 1)]).normalize();
      const sd = new THREE.Vector3().crossVectors(t, view);
      if (sd.lengthSq() < 1e-6) sd.set(1, 0, 0);
      sd.normalize();
      for (const v of [-1, 1]) {
        pos.push(pts[i].x, pts[i].y, pts[i].z);
        side.push(sd.x, sd.y, sd.z);
        sv.push(s, v);
      }
      if (i < N) {
        const k = i * 2;
        index.push(k, k + 1, k + 2, k + 1, k + 3, k + 2);
      }
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute('aSide', new THREE.Float32BufferAttribute(side, 3));
    g.setAttribute('aSV', new THREE.Float32BufferAttribute(sv, 2));
    g.setIndex(index);
    const st = LINK_STYLE[kind];
    const m = new THREE.ShaderMaterial({
      vertexShader: linkVert,
      fragmentShader: linkFrag,
      uniforms: {
        uColor: { value: vec3(st.color) },
        uKind: { value: st.kind },
        uTime: this.U.uTime,
        uAlpha: { value: 0 },
        uLen: { value: s },
        uWidth: this.width,
      },
      transparent: true,
      depthTest: false,
      depthWrite: false,
      side: THREE.DoubleSide,
    });
    // The paint pass blends the scene in sRGB paint space like every other material.
    const mesh = new THREE.Mesh(g, m);
    mesh.frustumCulled = false;
    mesh.renderOrder = 6;
    return mesh;
  }

  update(dt, camDist) {
    this.width.value = clamp(camDist * 0.0036, 0.4, 1.5);
    const k = damp(5, dt);
    for (const [key, L] of this.links) {
      L.alpha += (L.target - L.alpha) * k;
      L.mesh.material.uniforms.uAlpha.value = L.alpha;
      L.mesh.visible = L.alpha > 0.01;
      if (L.target === 0 && L.alpha < 0.01) {
        this.group.remove(L.mesh);
        L.mesh.geometry.dispose();
        L.mesh.material.dispose();
        this.links.delete(key);
      }
    }
  }

  get count() {
    let n = 0;
    for (const L of this.links.values()) if (L.target > 0) n++;
    return n;
  }
}

// ---------- region look ----------
export class RegionLayer {
  constructor({ scene, camera, canvas, U, ground }) {
    this.camera = camera;
    this.canvas = canvas;
    this.U = U;
    this.G = ground.material.uniforms;
    this.links = new LinkLayer(scene, U);
    this.on = false;
    this.hover = null;
    this.selected = null;
    this.R = null;
    // Eased per-region values.
    this.cur = REGION_IDS.map(() => ({ wash: [1, 1, 1, 0], hi: 0, life: 0.5, glow: 1, field: 0, smoke: 0.5 }));
    this.selOn = 0;
    this._v = new THREE.Vector3();
    this._ray = new THREE.Raycaster();
    this._ndc = new THREE.Vector2();
  }

  setOn(on) {
    this.on = on;
    this.U.uRegionsOn.value = on ? 1 : 0;
    if (!on) {
      this.links.set([]);
      this.hover = this.selected = null;
    }
  }

  setRegions(R) { this.R = R; }

  target(i) {
    const id = REGION_IDS[i];
    const r = this.R?.[id];
    const hi = this.selected === id ? 1 : this.hover === id ? 0.6 : 0;
    if (!r) return { wash: STATUS_WASH.stable, hi, life: 0.55, glow: 1, field: 0, smoke: 0.5 };
    const power = r.short.has('power') ? 0.12 : r.tight.has('power') ? 0.6 : 1;
    // Missing components idle part of the lines.
    const parts = r.short.has('components') ? 0.45 : r.tight.has('components') ? 0.8 : 1;
    return {
      wash: STATUS_WASH[r.status] ?? STATUS_WASH.stable,
      hi,
      life: r.wellbeing / 100,
      glow: power * (0.6 + 0.4 * parts) * clamp(0.35 + r.output / 100 * 0.85, 0.2, 1.2),
      field: r.short.has('water') ? 1 : r.tight.has('water') ? 0.4 : 0,
      smoke: r.short.has('power') ? 0 : clamp((r.output - 25) / 55, 0.05, 1.2) * (r.tight.has('power') ? 0.6 : 1) * parts,
    };
  }

  smokeOf(regionId) {
    const i = idx(regionId);
    return i < 0 ? null : this.cur[i].smoke;
  }

  update(dt, camDist, instant = false) {
    this.links.update(dt, camDist);
    if (!this.on) return;
    const k = instant ? 1 : damp(3.2, dt), kh = instant ? 1 : damp(7, dt);
    for (let i = 0; i < REGION_IDS.length; i++) {
      const c = this.cur[i], t = this.target(i);
      for (let j = 0; j < 4; j++) c.wash[j] += (t.wash[j] - c.wash[j]) * k;
      c.hi += (t.hi - c.hi) * kh;
      c.life += (t.life - c.life) * k;
      c.glow += (t.glow - c.glow) * k;
      c.field += (t.field - c.field) * k;
      c.smoke += (t.smoke - c.smoke) * k;
      this.G.uRWash.value[i].set(c.wash[0], c.wash[1], c.wash[2], c.wash[3]);
      this.G.uRHi.value[i] = c.hi;
      this.G.uRField.value[i] = c.field;
      this.U.uRLife.value[i] = c.life;
      this.U.uRGlow.value[i] = c.glow;
    }
    this.selOn += ((this.selected ? 1 : 0) - this.selOn) * kh;
    this.G.uRSelOn.value = this.selOn;
  }

  // Ground point under a client (viewport) pixel, or null.
  groundAt(clientX, clientY) {
    const r = this.canvas.getBoundingClientRect();
    if (!r.width || !r.height) return null;
    this._ndc.set(((clientX - r.left) / r.width) * 2 - 1, -(((clientY - r.top) / r.height) * 2 - 1));
    this._ray.setFromCamera(this._ndc, this.camera);
    const o = this._ray.ray.origin, d = this._ray.ray.direction;
    if (d.y > -1e-4) return null;
    const t = -o.y / d.y;
    return { x: o.x + d.x * t, z: o.z + d.z * t };
  }

  pick(clientX, clientY) {
    const p = this.groundAt(clientX, clientY);
    return p ? regionAt(p.x, p.z) : null;
  }

  // Label anchors in viewport CSS px (same space as clientX / clientY).
  anchors() {
    const r = this.canvas.getBoundingClientRect();
    const out = {};
    for (const id of REGION_IDS) {
      const a = REGION_ANCHORS[id];
      const v = this._v.set(a.x, 0.5, a.z).project(this.camera);
      const x = r.left + ((v.x + 1) / 2) * r.width, y = r.top + ((1 - v.y) / 2) * r.height;
      out[id] = { x, y, visible: v.z < 1 && v.x > -1 && v.x < 1 && v.y > -1 && v.y < 1 };
    }
    return out;
  }
}
