import * as THREE from 'three';
import { input } from './input.js';
import { U } from './uniforms.js';

const MAX_DT = 0.05;
const HITSTOP_SCALE = 0.04;

// Update order: lower runs first.
export const ORDER = {
  director: 5,
  player: 10,
  combat: 20,
  world: 30,
  particles: 40,
  camera: 50,
  presentation: 60,
};

export class Engine {
  constructor(canvas) {
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.NeutralToneMapping;
    this.renderer.setClearColor(0x1e333a);

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(30, 1, 2, 4000);

    this.systems = [];
    this.time = 0;
    this.realTime = 0;
    this.timeScale = 1;
    this.hitstopTimer = 0;
    this.paused = false;
    this.maxFps = 60;
    this.fps = 0;

    this.renderFn = () => this.renderer.render(this.scene, this.camera);
    this._raf = 0;
    this._last = 0;
    this._intervals = [];
    this._skip = 1;
    this._tick = 0;

    this.resize();
    window.addEventListener('resize', () => this.resize());
  }

  add(system, order = 30) {
    system.__order = order;
    this.systems.push(system);
    this.systems.sort((a, b) => a.__order - b.__order);
    return system;
  }

  remove(system) {
    const i = this.systems.indexOf(system);
    if (i >= 0) this.systems.splice(i, 1);
  }

  // Slow time to 4% for `seconds` of real time. Overlapping calls keep the longest.
  hitstop(seconds) {
    this.hitstopTimer = Math.max(this.hitstopTimer, seconds);
  }

  resize() {
    const canvas = this.renderer.domElement;
    const w = canvas.clientWidth || window.innerWidth;
    const h = canvas.clientHeight || window.innerHeight;
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    U.uAspect.value = w / h;
  }

  start() {
    if (this._raf) return;
    this._last = performance.now();
    const loop = (now) => {
      this._raf = requestAnimationFrame(loop);
      this._measure(now);
      if (++this._tick % this._skip !== 0) return;
      const realDt = Math.min(MAX_DT, (now - this._last) / 1000);
      this._last = now;
      this.step(realDt);
    };
    this._raf = requestAnimationFrame(loop);
  }

  stop() {
    cancelAnimationFrame(this._raf);
    this._raf = 0;
  }

  // Track the display refresh rate so a 120Hz screen can be capped at maxFps.
  _measure(now) {
    if (this._prevRaf) {
      const d = now - this._prevRaf;
      if (d > 2 && d < 50) this._intervals.push(d);
      if (this._intervals.length > 40) this._intervals.shift();
    }
    this._prevRaf = now;
    if (this._tick % 30 === 0 && this._intervals.length >= 10) {
      const sorted = [...this._intervals].sort((a, b) => a - b);
      const hz = 1000 / sorted[sorted.length >> 1];
      this._skip = this.maxFps > 0 ? Math.max(1, Math.floor(hz / this.maxFps + 0.1)) : 1;
    }
  }

  step(realDt) {
    input.poll(realDt);

    let dt = realDt * this.timeScale;
    if (this.hitstopTimer > 0) {
      this.hitstopTimer -= realDt;
      dt *= HITSTOP_SCALE;
    }
    if (this.paused) dt = 0;

    this.time += dt;
    this.realTime += realDt;
    U.uTime.value = this.realTime;
    this.fps += (1 / Math.max(realDt, 1e-4) - this.fps) * 0.05;

    for (const s of this.systems) {
      try { s.update?.(dt, this.time, realDt); }
      catch (err) { console.error(`[engine] system ${s.name ?? '?'} failed`, err); }
    }

    this.renderFn(realDt);
    input.endFrame();
  }
}
