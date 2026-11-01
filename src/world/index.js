// Diorama of the fictional island republic "Hòa Minh".
// Contract (ARCHITECTURE.md): createDiorama(canvas) -> { focus, resetView, setState, pulse, setQuality, bindBus }.
// Region mode (ARCHITECTURE_REGIONS.md): setMode, setRegions, hoverRegion, selectRegion,
// showLinks, pickRegion, regionAnchors, onFrame; emits world:hover / world:pick on the bus.
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
import { moverPoint, validateLayout } from './footprint.js';
import { createLayoutOverlay } from './overlay.js';
import { REGION_IDS, regionAt } from './regiongeo.js';
import { regionWorldState, localState } from './regionstate.js';
import { RegionLayer, regionShot, overviewShot } from './regions.js';

const METRICS = ['PROD', 'LIFE', 'TRUST', 'LAW', 'EQUITY', 'COHESION'];
const DEFAULTS = { PROD: 52, LIFE: 48, TRUST: 54, LAW: 51, EQUITY: 45, COHESION: 57 };
const GLOW_CH = { PROD: 1, LIFE: 2, TRUST: 3, COHESION: 4 };
const PULSES = {
  good: { color: [1.0, 0.78, 0.38], desat: 0, dark: 0, shake: 0 },
  bad: { color: [0.12, 0.16, 0.3], desat: 0.5, dark: 1, shake: 0.35 },
  neutral: { color: [0.55, 0.55, 0.58], desat: 0, dark: 0, shake: 0 },
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
  // Viewer pan / zoom / turn on the canvas (UI panels sit above it and keep their own events).
  // Taps and hovers feed region picking (only acted on in region mode).
  const unbindInput = opts.input === false ? () => {} : rig.bindInput(canvas, {
    onTap: (e) => onTap(e),
    onHover: (e) => onHover(e),
  });
  const U = createSharedUniforms();

  const atlas = buildAtlas({ scale: 1 });
  const ground = createGround(U, { quality });
  scene.add(ground);

  const props = buildProps();
  const movers = buildMovers();
  // MSAA proved expensive on integrated GPUs; cards use alpha-test cutout and the paint
  // pass softens edges instead.
  const a2c = false;
  const statics = new CardLayer(atlas, U, props.length + 16, { name: 'props', a2c });
  const dynamics = new CardLayer(atlas, U, movers.length + 8, { name: 'movers', a2c });
  const clouds = new CardLayer(atlas, U, 24, { name: 'clouds', shadows: false, a2c });
  scene.add(statics.group, dynamics.group, clouds.group);
  const smoke = new Smoke(U, 700);
  scene.add(smoke.points);

  let S = { ...DEFAULTS, flags: new Set(), year: 1 };
  const shown = { ...DEFAULTS };
  // 'classic' (default, the 8-year game) or 'regions'. classicS keeps the classic state
  // while region mode runs, so switching back restores it.
  let mode = 'classic';
  let classicS = S;
  const frameFns = new Set();
  const layer = new RegionLayer({ scene, camera, canvas, U, ground });

  // ---- static props ----
  const ruled = [];
  // Chimney anchors follow the cards when the viewer turns the camera.
  const anchors = [];
  props.forEach((p) => {
    const glowCh = p.glowK ? GLOW_CH[p.glowK] : undefined;
    const i = statics.add({ ...p, glowCh, regionIndex: p.region ? REGION_IDS.indexOf(p.region) : undefined });
    if (i < 0) return;
    if (p.show) ruled.push({ layer: statics, i, rule: p.show, x: p.x, z: p.z, region: p.region });
    const def = statics.items[i].def;
    for (const [u, v] of def.smoke ?? []) {
      const pos = statics.anchor(i, u, v, PITCH);
      anchors.push({ pos, i, u, v });
      const it = statics.items[i];
      const reg = p.region;
      smoke.addEmitter(pos, {
        rate: 7, size: 3.6, rise: 2.6, shade: 0.62,
        // Region mode: the chimney follows its own region (output, power shortage).
        getStrength: () => it.g * (mode === 'regions' && reg ? layer.smokeOf(reg) : clamp((shown.PROD - 25) / 55, 0.05, 1.2)),
      });
    }
  });
  for (const e of EXTRA_SMOKE) smoke.addEmitter(new THREE.Vector3(e.x, e.y, e.z), { rate: 2.5, size: 1.8, getStrength: () => clamp((shown.PROD - 30) / 50, 0, 1) });
  // Dam spray: white mist at the foot of the spillway.
  smoke.addEmitter(new THREE.Vector3(-80, 0.4, -45.2), { rate: 4, size: 1.3, rise: 0.6, shade: 1, getStrength: () => 0.6 });

  // ---- movers ----
  const rng = makeRng('movers');
  const movingThings = movers.map((m) => {
    const pts = m.path;
    const lens = [0];
    for (let j = 1; j < pts.length; j++) lens.push(lens[j - 1] + Math.hypot(pts[j][0] - pts[j - 1][0], pts[j][1] - pts[j - 1][1]));
    const L = lens[lens.length - 1] || 1;
    const i = dynamics.add({ k: m.k, x: pts[0][0], z: pts[0][1], bob: m.walker ? 1 : m.k === 'boat' ? 0.4 : m.k === 'rider' ? 0.15 : 0.05, seed: rng(), regionIndex: m.region ? REGION_IDS.indexOf(m.region) : undefined });
    if (m.show) ruled.push({ layer: dynamics, i, rule: m.show, x: pts[0][0], z: pts[0][1], region: m.region });
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
    const [x, z, dx] = moverPoint(mv, mv.path, mv.lens, mv.L, s, dir);
    dynamics.setPos(mv.i, x, 0, z);
    if (Math.abs(dx) > 0.15) dynamics.setFlip(mv.i, dx < 0);
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
    const fx = SITES[rig.site]?.x ?? (mode === 'regions' ? rig.cur.x : 0), fz = SITES[rig.site]?.z ?? (mode === 'regions' ? rig.cur.z : 0);
    for (const r of ruled) {
      const to = r.rule(mode === 'regions' ? localState(S, r.region) : S) ? 1 : 0;
      // Things near the focused site pop in sequence, others quietly.
      const dist = Math.hypot(r.x - fx, r.z - fz);
      r.layer.setTarget(r.i, to, { instant, delay: instant ? 0 : Math.min(1.4, 0.15 + dist * 0.006 + Math.random() * 0.35) });
    }
  }
  applyRules({ instant: true });

  function setState(input) {
    if (mode === 'regions') {
      // Classic metrics arriving in region mode are kept for when classic returns.
      classicS = normalizeState(input, classicS);
      return;
    }
    S = classicS = normalizeState(input, S);
    applyRules();
  }

  // ---- render setup / quality ----
  const post = new PaintPass(renderer, U.uNoise.value, { samples: 0 });
  let width = 0, height = 0;
  function resize() {
    const w = canvas.clientWidth || window.innerWidth;
    const h = canvas.clientHeight || window.innerHeight;
    const pr = quality === 'low' ? Math.min(window.devicePixelRatio || 1, 1) * 0.7 : Math.min(window.devicePixelRatio || 1, 1.25);
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

  function setQuality(q, { persist = true } = {}) {
    quality = q === 'low' ? 'low' : 'high';
    if (persist) {
      try { localStorage.setItem('world:quality', quality); } catch { /* storage may be blocked */ }
    }
    const a = quality !== 'low';
    post.uniforms.uBoil.value = a ? 1 : 0.6;
    smoke.setQuality(quality);
    width = 0;
    resize();
  }
  setQuality(quality, { persist: false });

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
    resize();
    // rAF timestamps can run slightly behind performance.now(): never step backwards.
    tick(Math.min(0.05, Math.max(0, realDt)), realDt > 0.25 ? 0.016 : Math.min(0.05, Math.max(0, realDt)));
    present();

    // Auto-lower quality once if frames stay slow for a few seconds.
    // Ignore hitches and throttled background frames; only sustained slowness counts.
    if (realDt < 0.1 && document.visibilityState === 'visible') frameAvg += (realDt * 1000 - frameAvg) * 0.05;
    if (!autoLowered && quality === 'high' && frameAvg > 24) {
      slowFor += realDt;
      if (slowFor > 4) {
        autoLowered = true;
        console.info('[world] frame time high, switching to low quality');
        setQuality('low', { persist: false });
      }
    } else slowFor = 0;
  }

  // One simulation step of everything that moves (no rendering).
  function tick(dt, camDt) {
    const time = (U.uTime.value += dt);

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
    U.uLightCol.value.set(0.9 + warmth * 0.13, 0.91 + warmth * 0.08, 0.96 - warmth * 0.03);

    const d = rig.update(camDt);
    U.uCamDist.value = d;
    if (U.uYaw.value !== rig.user.yaw) {
      U.uYaw.value = rig.user.yaw;
      for (const a of anchors) statics.anchor(a.i, a.u, a.v, PITCH, rig.user.yaw, a.pos);
    }

    for (const mv of movingThings) placeMover(mv, dt);
    for (const c of cloudList) {
      c.x += c.v * dt;
      if (c.x > 200) c.x = -200;
      clouds.setPos(c.i, c.x, c.y, c.z);
    }
    clouds.uniforms.uFade.value = clamp((d - 170) / 140, 0, 1);
    clouds.mesh.visible = clouds.uniforms.uFade.value > 0.01;

    layer.update(dt, d);
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
    post.uniforms.uDark.value = P.dark;
    post.uniforms.uDesat.value = P.desat * env + clamp((40 - shown.COHESION) / 80, 0, 0.25);
    post.uniforms.uWarmth.value = warmth;
    post.uniforms.uFocusUv.value.set((rig.cur.fx + 1) / 2, (rig.cur.fy + 1) / 2);
    post.uniforms.uTime.value = time;
  }
  requestAnimationFrame(frame);

  function focus(siteId, { instant = false } = {}) {
    rig.focus(siteId, { instant });
  }

  // Return from the viewer's pan / zoom to the current site framing.
  function resetView() {
    rig.resetView();
  }

  let boundBus = null;
  function bindBus(bus) {
    boundBus = bus;
    const offs = [
      bus.on('sim:view', (p) => {
        const view = p?.view ?? p;
        if (mode === 'classic' && view?.site) focus(view.site);
      }),
      bus.on('sim:state', (s) => setState(s)),
      bus.on('region:view', (p) => {
        const view = p?.view ?? p;
        if (mode === 'regions' && Array.isArray(view?.regions)) setRegions(view.regions);
      }),
    ];
    return () => {
      offs.forEach((f) => f());
      if (boundBus === bus) boundBus = null;
    };
  }

  // ---- region mode ----
  let hovered = null;
  let regionS = null;

  function setMode(m) {
    const next = m === 'regions' ? 'regions' : 'classic';
    if (next === mode) return mode;
    mode = next;
    if (mode === 'regions') {
      classicS = S;
      S = regionS ?? regionWorldState(S, null);
      layer.setOn(true);
      layer.setRegions(S.R);
      hovered = null;
      rig.goTo('region:overview', overviewShot(camera.aspect));
    } else {
      layer.setOn(false);
      regionS = S;
      S = classicS;
      hovered = null;
      canvas.style.cursor = '';
      rig.focus('overview');
    }
    applyRules();
    return mode;
  }

  function setRegions(list) {
    if (mode !== 'regions') setMode('regions');
    S = regionWorldState(S, list);
    layer.setRegions(S.R);
    applyRules();
  }

  function hoverRegion(id) {
    layer.hover = REGION_IDS.includes(id) ? id : null;
  }

  function selectRegion(id, { instant = false } = {}) {
    if (!REGION_IDS.includes(id)) id = null;
    layer.selected = id;
    if (mode !== 'regions') return;
    if (id) rig.goTo(`region:${id}`, regionShot(id, camera.aspect), { instant });
    else rig.goTo('region:overview', overviewShot(camera.aspect), { instant });
  }

  function showLinks(list) {
    layer.links.set(mode === 'regions' ? list : []);
  }

  function pickRegion(clientX, clientY) {
    return layer.pick(clientX, clientY);
  }

  function regionAnchors() {
    return layer.anchors();
  }

  function onFrame(fn) {
    if (typeof fn !== 'function') return () => {};
    frameFns.add(fn);
    return () => frameFns.delete(fn);
  }

  function onHover(e) {
    if (mode !== 'regions') return;
    const id = e ? layer.pick(e.clientX, e.clientY) : null;
    canvas.style.cursor = id ? 'pointer' : '';
    if (id === hovered) return;
    hovered = id;
    // The map highlights what the pointer is over by itself; the UI may also call hoverRegion.
    layer.hover = id;
    boundBus?.emit('world:hover', { region: id });
  }

  function onTap(e) {
    if (mode !== 'regions') return;
    boundBus?.emit('world:pick', { region: layer.pick(e.clientX, e.clientY) });
  }

  // ---- layout debug ----
  // Drawn after the paint pass so the lines stay crisp.
  let overlay = null;
  const overlayScene = new THREE.Scene();
  function present() {
    post.render(scene, camera);
    if (frameFns.size) {
      const a = layer.anchors();
      for (const fn of [...frameFns]) {
        try { fn(a); } catch (err) { console.warn('[world] onFrame', err); }
      }
    }
    if (!overlay?.visible) return;
    renderer.autoClear = false;
    renderer.clearDepth();
    renderer.render(overlayScene, camera);
    renderer.autoClear = true;
  }
  function checkLayout(state) {
    return validateLayout(props, movers, { state: state === 'all' ? undefined : state ?? S });
  }
  function showLayout(on = true) {
    if (on && !overlay) {
      overlay = createLayoutOverlay(props, movers, checkLayout('all').overlaps);
      overlayScene.add(overlay);
    }
    if (overlay) overlay.visible = on;
    return on;
  }

  function dispose() {
    running = false;
    unbindInput();
    renderer.dispose();
  }

  const api = {
    focus, resetView, setState, pulse, setQuality, bindBus, dispose,
    setMode, setRegions, hoverRegion, selectRegion, showLinks, pickRegion, regionAnchors, onFrame,
    get mode() { return mode; },
    get selectedRegion() { return layer.selected; },
    get hoveredRegion() { return layer.hover; },
    // Overlap report for the current state, a given state, or 'all' (every prop that can appear).
    validateLayout: checkLayout,
    get state() { return mode === 'regions' ? { ...S, flags: [...S.flags], R: undefined, local: undefined } : { ...S, flags: [...S.flags] }; },
    get site() { return rig.site; },
    get quality() { return quality; },
    sites: SITE_IDS,
    debug: { renderer, scene, camera, rig, post, smoke, statics, dynamics, showLayout, render: present, regions: layer, regionAt, props, movers,
      // Fast-forward the world (for headless checks / screenshots).
      advance(seconds = 1) {
        for (let t = 0; t < seconds; t += 1 / 30) tick(1 / 30, 1 / 30);
        present();
      },
    },
  };
  return api;
}
