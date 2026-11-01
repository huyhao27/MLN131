// Fixed-pitch camera rig (52° down, FOV 30, never yaws). Sites are framed toward the
// left/upper part of the screen because UI panels cover the right ~40% and the bottom.
import * as THREE from 'three';
import { easeInOutCubic, clamp } from '../core/math.js';
import { noise1 } from '../core/rng.js';
import { SITES } from './layout.js';

export const PITCH = THREE.MathUtils.degToRad(52);
export const FOV = 30;
// Where the site point should land on screen, in NDC (-1..1).
const FRAME = { x: -0.3, y: 0.16 };

const aspectFactor = (aspect) => 1 + Math.min(0.45, Math.max(0, (1.6 - aspect) * 0.5));

export class CameraRig {
  constructor(camera) {
    this.camera = camera;
    camera.fov = FOV;
    camera.updateProjectionMatrix();
    const o = SITES.overview;
    this.cur = { x: o.x, z: o.z, d: o.d };
    this.tween = null;
    this.site = 'overview';
    this.clock = 0;
    this.trauma = 0;
    this.focusNdc = new THREE.Vector2(FRAME.x, FRAME.y);
  }

  focus(siteId, { instant = false } = {}) {
    const to = SITES[siteId] || SITES.overview;
    if (!SITES[siteId]) console.warn('[world] unknown site', siteId);
    this.site = SITES[siteId] ? siteId : 'overview';
    if (instant) {
      this.tween = null;
      Object.assign(this.cur, { x: to.x, z: to.z, d: to.d });
      return;
    }
    const from = { ...this.cur };
    const travel = Math.hypot(to.x - from.x, to.z - from.z);
    // Long hops rise up and over the island; short ones glide.
    const hop = Math.min(110, travel * 0.55) * (Math.max(from.d, to.d) < 200 ? 1 : 0.3);
    const duration = 1.7 + Math.min(1.2, travel / 140);
    this.tween = { from, to, t: 0, duration, hop };
  }

  shake(a) {
    this.trauma = clamp(this.trauma + a, 0, 1);
  }

  get distance() {
    return this.cur.d * aspectFactor(this.camera.aspect);
  }

  update(dt) {
    this.clock += dt;
    let hop = 0;
    if (this.tween) {
      const tw = this.tween;
      tw.t += dt / tw.duration;
      const k = easeInOutCubic(clamp(tw.t));
      this.cur.x = tw.from.x + (tw.to.x - tw.from.x) * k;
      this.cur.z = tw.from.z + (tw.to.z - tw.from.z) * k;
      this.cur.d = tw.from.d + (tw.to.d - tw.from.d) * k;
      hop = Math.sin(Math.PI * clamp(tw.t)) * tw.hop;
      if (tw.t >= 1) this.tween = null;
    }
    const t = this.clock;
    const d = (this.cur.d + hop) * aspectFactor(this.camera.aspect);
    // Gentle idle drift, a breathing diorama.
    const ix = noise1(t * 0.05, 3) * d * 0.012;
    const iz = noise1(t * 0.045, 8) * d * 0.008;
    const s = this.trauma * this.trauma;
    this.trauma = Math.max(0, this.trauma - dt * 1.6);
    const sx = noise1(t * 20, 1) * s * d * 0.01;
    const sz = noise1(t * 20, 2) * s * d * 0.01;

    const halfH = d * Math.tan(THREE.MathUtils.degToRad(FOV / 2));
    const halfW = halfH * this.camera.aspect;
    const lookX = this.cur.x - FRAME.x * halfW + ix + sx;
    const lookZ = this.cur.z + (FRAME.y * halfH) / Math.sin(PITCH) + iz + sz;
    this.camera.position.set(lookX, Math.sin(PITCH) * d, lookZ + Math.cos(PITCH) * d);
    this.camera.rotation.set(-PITCH, 0, noise1(t * 18, 7) * s * 0.01);
    this.camera.updateMatrixWorld();
    return d;
  }
}
