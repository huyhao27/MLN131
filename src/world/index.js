// Diorama of the fictional island republic "Hòa Minh".
// Contract (ARCHITECTURE.md): createDiorama(canvas) -> { focus, setState, pulse, setQuality, bindBus }.
import * as THREE from 'three';
import { clamp, damp } from '../core/math.js';
import { makeRng } from '../core/rng.js';
import { buildAtlas } from './atlas.js';
import { createSharedUniforms } from './glsl.js';
import { createGround } from './ground.js';
import { CardLayer } from './cards.js';
import { Smoke } from './smoke.js';
import { PaintPass } from './post.js';
import { CameraRig, PITCH } from './camera.js';
import { buildProps, buildMovers, EXTRA_SMOKE, SITES } from './layout.js';

const METRICS = ['PROD', 'LIFE', 'TRUST', 'LAW', 'EQUITY', 'COHESION'];
const DEFAULTS = { PROD: 52, LIFE: 48, TRUST: 54, LAW: 51, EQUITY: 45, COHESION: 57 };
const GLOW_CH = { PROD: 1, LIFE: 2, TRUST: 3, COHESION: 4 };
const PULSES = {
  good: { color: [1.0, 0.8, 0.42], desat: 0, shake: 0 },
  bad: { color: [-0.12, -0.1, -0.02], desat: 0.45, shake: 0.35 },
  neutral: { color: [0.55, 0.55, 0.6], desat: 0, shake: 0 },
};

export const SITE_IDS = Object.keys(SITES);

function normalizeState(input, prev) {
  const src = input?.metrics ?? input ?? {};
  const S = { ...prev };
  for (const k of METRICS) {
    const v = Number(src[k]);
    if (Number.isFinite(v)) S[k] = clamp(v, 0, 100);
  }
  const f = input?.flags;
  if (f instanceof Set) S.flags = new Set(f);
  else if (Array.isArray(f)) S.flags = new Set(f);
  else if (f && typeof f === 'object') S.flags = new Set(Object.keys(f).filter((k) => f[k]));
  const y = Number(input?.year ?? input?.YEAR);
  if (Number.isFinite(y)) S.year = y > 100 ? y - 2025 : y;
  return S;
}

export function createDiorama(canvas, opts = {}) {
  let quality = opts.quality ?? (() => {
    try { return localStorage.getItem('world:quality') || 'high'; } catch { return 'high'; }
  })();

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: 'high-performance', alpha: false });
  renderer.outputColorSpace = THREE.LinearSRGBColorSpace;
  renderer.setClearColor(0xf1e8d2, 1);
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(30, 16 / 9, 5, 3000);
  const rig = new CameraRig(camera);
  const U = createSharedUniforms();

  const atlas = buildAtlas({ scale: 1 });
  const ground = createGround(U, { quality });
  scene.add(ground);

  const props = buildProps();
  const movers = buildMovers();
  const a2c = quality !== 'low';
  const statics = new CardLayer(atlas, U, props.length + 16, { name: 'props', a2c });
  const dynamics = new CardLayer(atlas, U, movers.length + 8, { name: 'movers', a2c });
  const clouds = new CardLayer(atlas, U, 24, { name: 'clouds', shadows: false, a2c });
  scene.add(statics.group, dynamics.group, clouds.group);
  const smoke = new Smoke(U, 700);
  scene.add(smoke.points);

  let S = { ...DEFAULTS, flags: new Set(), year: 1 };
  const shown = { ...DEFAULTS };

  // ---- static props ----
  const ruled = [];
  props.forEach((p) => {
    const glowCh = p.glowK ? GLOW_CH[p.glowK] : undefined;
    const i = statics.add({ ...p, glowCh });
    if (i < 0) return;
    if (p.show) ruled.push({ layer: statics, i, rule: p.show, x: p.x, z: p.z });
    const def = statics.items[i].def;
    for (const [u, v] of def.smoke ?? []) {
      const pos = statics.anchor(i, u, v, PITCH);
      const it = statics.items[i];
      smoke.addEmitter(pos, {
        rate: 5, size: 2.4, rise: 2.4,
        getStrength: () => it.g * clamp((shown.PROD - 25) / 55, 0.05, 1.2),
      });
    }
  });
  for (const e of EXTRA_SMOKE) smoke.addEmitter(new THREE.Vector3(e.x, e.y, e.z), { rate: 2.5, size: 1.8, getStrength: () => clamp((shown.PROD - 30) / 50, 0, 1) });
  // Dam spray: white mist at the foot of the spillway.
  smoke.addEmitter(new THREE.Vector3(-80, 0.6, -45.5), { rate: 6, size: 2.2, rise: 0.8, shade: 1, getStrength: () => 0.6 });

  // ---- movers ----
  const rng = makeRng('movers');
  const movingThings = movers.map((m) => {
    const pts = m.path;
    const lens = [0];
    for (let j = 1; j < pts.length; j++) lens.push(lens[j - 1] + Math.hypot(pts[j][0] - pts[j - 1][0], pts[j][1] - pts[j - 1][1]));
    const L = lens[lens.length - 1] || 1;
    const i = dynamics.add({ k: m.k, x: pts[0][0], z: pts[0][1], bob: m.walker ? 1 : m.k === 'boat' ? 0.4 : m.k === 'rider' ? 0.15 : 0.05, seed: rng() });
    if (m.show) ruled.push({ layer: dynamics, i, rule: m.show, x: pts[0][0], z: pts[0][1] });
    return { ...m, i, lens, L, s: m.offset * L };
  });

  function placeMover(mv, dt) {
    mv.s += mv.speed * dt;
    let s = mv.s;
    let dir = 1;
    if (mv.closed) s = ((s % mv.L) + mv.L) % mv.L;
    else {
      const t = ((s % (2 * mv.L)) + 2 * mv.L) % (2 * mv.L);
      if (t > mv.L) { s = 2 * mv.L - t; dir = -1; } else s = t;
    }
    const { lens, path } = mv;
    let j = 1;
    while (j < lens.length - 1 && lens[j] < s) j++;
    const a = path[j - 1], b = path[j];
    const seg = lens[j] - lens[j - 1] || 1;
    const f = (s - lens[j - 1]) / seg;
    let dx = (b[0] - a[0]) / seg, dz = (b[1] - a[1]) / seg;
    const lane = mv.lane * (mv.walker ? 0.6 : 0.95);
    const x = a[0] + (b[0] - a[0]) * f - dz * lane * dir;
    const z = a[1] + (b[1] - a[1]) * f + dx * lane * dir;
    dynamics.setPos(mv.i, x, 0, z);
    if (Math.abs(dx) > 0.15) dynamics.setFlip(mv.i, dx * dir < 0);
  }

  // ---- clouds (only seen from afar) ----
  const cloudList = [];
  const crng = makeRng('clouds');
  for (let i = 0; i < 9; i++) {
    const x = crng.range(-170, 170), z = crng.range(-120, 60), y = crng.range(55, 75);
    const i2 = clouds.add({ k: crng.chance(0.5) ? 'cloud_a' : 'cloud_b', x, y, z, s: crng.range(0.9, 1.4), flip: crng.chance(0.5) });
    cloudList.push({ i: i2, x, y, z, v: crng.range(1.2, 2.4) });
  }

  // ---- state ----
  function applyRules({ instant = false } = {}) {
    const fx = SITES[rig.site]?.x ?? 0, fz = SITES[rig.site]?.z ?? 0;
    for (const r of ruled) {
      const to = r.rule(S) ? 1 : 0;
      // Things near the focused site pop in sequence, others quietly.
      const dist = Math.hypot(r.x - fx, r.z - fz);
      r.layer.setTarget(r.i, to, { instant, delay: instant ? 0 : Math.min(1.4, 0.15 + dist * 0.006 + Math.random() * 0.35) });
    }
  }
  applyRules({ instant: true });

  function setState(input) {
    S = normalizeState(input, S);
    applyRules();
  }

  // ---- render setup / quality ----
  const post = new PaintPass(renderer, U.uNoise.value, { samples: quality === 'low' ? 0 : 4 });
  let width = 0, height = 0;
  function resize() {
    const w = canvas.clientWidth || window.innerWidth;
    const h = canvas.clientHeight || window.innerHeight;
    const pr = Math.min(window.devicePixelRatio || 1, quality === 'low' ? 1 : 1.5) * (quality === 'low' ? 0.75 : 1);
    if (w === width && h === height && renderer.getPixelRatio() === pr) return;
    width = w; height = h;
    renderer.setPixelRatio(pr);
    renderer.setSize(w, h, false);
    camera.aspect = w / Math.max(1, h);
    camera.updateProjectionMatrix();
    const bw = Math.floor(w * pr), bh = Math.floor(h * pr);
    post.setSize(bw, bh);
    smoke.uniforms.uPxScale.value = bh / (2 * Math.tan(THREE.MathUtils.degToRad(15)));
  }

  function setQuality(q) {
    quality = q === 'low' ? 'low' : 'high';
    try { localStorage.setItem('world:quality', quality); } catch { /* storage may be blocked */ }
    const a = quality !== 'low';
    statics.setA2C(a); dynamics.setA2C(a); clouds.setA2C(a);
    post.setSamples(a ? 4 : 0);
    post.uniforms.uBoil.value = a ? 1 : 0.6;
    smoke.setQuality(quality);
    width = 0;
    resize();
  }
  setQuality(quality);

  // ---- pulse ----
  const pulseState = { t: 1, kind: 'neutral' };
  function pulse(kind = 'neutral') {
    const k = PULSES[kind] ? kind : 'neutral';
    pulseState.t = 0;
    pulseState.kind = k;
    if (PULSES[k].shake) rig.shake(PULSES[k].shake);
  }

  // ---- loop ----
  let last = performance.now();
  let running = true;
  let frameAvg = 16, slowFor = 0, autoLowered = false;
  function frame(now) {
    if (!running) return;
    requestAnimationFrame(frame);
    const realDt = (now - last) / 1000;
    last = now;
    const dt = Math.min(0.05, Math.max(0, realDt));
    const time = (U.uTime.value += dt);
    resize();

    // Ease displayed metrics toward targets so the world shifts smoothly.
    const k = damp(1.6, dt);
    for (const m of METRICS) shown[m] += (S[m] - shown[m]) * k;
    U.uLife.value = shown.LIFE / 100;
    U.uEquity.value = shown.EQUITY / 100;
    U.uLaw.value = shown.LAW / 100;
    U.uProd.value = shown.PROD / 100;
    const warmth = clamp(((shown.TRUST + shown.COHESION) / 2 - 20) / 60, 0, 1);
    U.uWarmth.value = warmth;
    U.uGlow.value.set(
      clamp(0.15 + shown.PROD / 90, 0, 1.2),
      clamp(0.2 + shown.LIFE / 110, 0, 1.1),
      clamp(0.2 + shown.TRUST / 110, 0, 1.1),
      clamp(0.2 + shown.COHESION / 110, 0, 1.1),
    );
    // Light: warmer and brighter with cohesion; slightly grey when it breaks down.
    U.uLightCol.value.set(0.97 + warmth * 0.06, 0.97 + warmth * 0.02, 0.98 - warmth * 0.05);

    const d = rig.update(realDt > 0.25 ? 0.016 : Math.min(0.05, realDt));
    U.uCamDist.value = d;

    for (const mv of movingThings) placeMover(mv, dt);
    for (const c of cloudList) {
      c.x += c.v * dt;
      if (c.x > 200) c.x = -200;
      clouds.setPos(c.i, c.x, c.y, c.z);
    }
    clouds.uniforms.uFade.value = clamp((d - 170) / 140, 0, 1);
    clouds.mesh.visible = clouds.uniforms.uFade.value > 0.01;

    statics.update(dt);
    dynamics.update(dt);
    clouds.update(dt);
    smoke.update(dt, time);

    // Pulse decay.
    pulseState.t += dt;
    const P = PULSES[pulseState.kind];
    const pk = Math.max(0, 1 - pulseState.t / 1.4);
    const env = pk * pk * (pulseState.t < 0.12 ? pulseState.t / 0.12 : 1);
    post.uniforms.uPulse.value.set(P.color[0], P.color[1], P.color[2], env);
    post.uniforms.uPulseR.value = pulseState.t * 0.55;
    post.uniforms.uDesat.value = P.desat * env + clamp((40 - shown.COHESION) / 80, 0, 0.25);
    post.uniforms.uWarmth.value = warmth;
    post.uniforms.uTime.value = time;

    post.render(scene, camera);

    // Auto-lower quality once if frames stay slow for a few seconds.
    frameAvg += (realDt * 1000 - frameAvg) * 0.05;
    if (!autoLowered && quality === 'high' && frameAvg > 24) {
      slowFor += dt;
      if (slowFor > 4) {
        autoLowered = true;
        console.info('[world] frame time high, switching to low quality');
        setQuality('low');
      }
    } else slowFor = 0;
  }
  requestAnimationFrame(frame);

  function focus(siteId, { instant = false } = {}) {
    rig.focus(siteId, { instant });
  }

  function bindBus(bus) {
    const offs = [
      bus.on('sim:view', (p) => {
        const view = p?.view ?? p;
        if (view?.site) focus(view.site);
      }),
      bus.on('sim:state', (s) => setState(s)),
    ];
    return () => offs.forEach((f) => f());
  }

  function dispose() {
    running = false;
    renderer.dispose();
  }

  const api = {
    focus, setState, pulse, setQuality, bindBus, dispose,
    get state() { return { ...S, flags: [...S.flags] }; },
    get site() { return rig.site; },
    get quality() { return quality; },
    sites: SITE_IDS,
  };
  return api;
}
