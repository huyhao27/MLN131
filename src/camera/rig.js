import * as THREE from 'three';
import { U } from '../core/uniforms.js';
import { noise1 } from '../core/rng.js';
import { clamp, damp, lerp, easeInOutCubic } from '../core/math.js';

// Fixed pitch, never yaws: every billboard can be rotated once and stay correct forever.
export const PITCH = THREE.MathUtils.degToRad(52);
export const FOV = 30;

export const SHOTS = {
  title: { distance: 150, offsetX: 0, offsetZ: -12, lookAhead: 0 },
  explore: { distance: 72, offsetX: 0, offsetZ: -2, lookAhead: 4 },
  close: { distance: 34, offsetX: 0, offsetZ: 0, lookAhead: 1 },
  vista: { distance: 150, offsetX: 0, offsetZ: -24, lookAhead: 0 },
};
const KEYS = ['distance', 'offsetX', 'offsetZ', 'lookAhead'];

// Narrow or portrait screens pull the camera back so the same width stays visible.
const aspectFactor = (aspect) => 1 + Math.min(0.32, Math.max(0, (1.25 - aspect) * 0.4));

export class CameraRig {
  constructor(camera) {
    this.name = 'camera';
    this.camera = camera;
    this.camera.fov = FOV;
    this.camera.updateProjectionMatrix();
    this.shot = { ...SHOTS.explore };
    this.tween = null;
    this.target = null;
    this.look = new THREE.Vector3();
    this.lead = new THREE.Vector2();
    this.focus = { x: 0, z: 0, weight: 0 };
    this.follow = 3;
    this.trauma = 0;
    this.shakeScale = 1;
    this.kickOffset = new THREE.Vector2();
    this.clock = 0;
    this._ndc = new THREE.Vector3();
  }

  setShot(shot, duration = 1.2) {
    const to = typeof shot === 'string' ? SHOTS[shot] : { ...this.shot, ...shot };
    if (!to) return console.warn(`[camera] unknown shot ${shot}`);
    if (duration <= 0) return this.cut(to);
    this.tween = { from: { ...this.shot }, to, t: 0, duration };
  }

  // Jump instantly and snap the look point to the target.
  cut(shot = this.shot) {
    const to = typeof shot === 'string' ? SHOTS[shot] : shot;
    this.tween = null;
    Object.assign(this.shot, to);
    if (this.target) this.look.set(this.target.position.x + this.shot.offsetX, 0, this.target.position.z + this.shot.offsetZ);
  }

  // Trauma model: shake grows with trauma² so small hits stay subtle.
  shake(amount) {
    this.trauma = clamp(this.trauma + amount * this.shakeScale, 0, 1);
  }

  kick(x, z) {
    this.kickOffset.x += x;
    this.kickOffset.y += z;
  }

  update(dt, time, realDt) {
    const e = realDt ?? dt;
    this.clock += e;

    if (this.tween) {
      const tw = this.tween;
      tw.t += e / tw.duration;
      const k = easeInOutCubic(Math.min(1, tw.t));
      for (const key of KEYS) this.shot[key] = lerp(tw.from[key], tw.to[key], k);
      if (tw.t >= 1) this.tween = null;
    }

    let gx = this.look.x, gz = this.look.z;
    if (this.target) {
      const p = this.target.position, v = this.target.velocity;
      const speed = v ? Math.hypot(v.x, v.z) : 0;
      const want = speed > 0.01 ? (this.shot.lookAhead * clamp(speed / 4)) / speed : 0;
      const kl = damp(1.1, e);
      this.lead.x += ((v?.x ?? 0) * want - this.lead.x) * kl;
      this.lead.y += ((v?.z ?? 0) * want - this.lead.y) * kl;
      gx = p.x + this.lead.x + this.shot.offsetX;
      gz = p.z + this.lead.y + this.shot.offsetZ;
    }
    gx = lerp(gx, this.focus.x, this.focus.weight);
    gz = lerp(gz, this.focus.z, this.focus.weight);
    const kf = damp(this.follow, e);
    this.look.x += (gx - this.look.x) * kf;
    this.look.z += (gz - this.look.z) * kf;

    this.trauma = Math.max(0, this.trauma - 1.4 * e);
    this.kickOffset.multiplyScalar(Math.exp(-10 * e));

    const d = this.shot.distance * aspectFactor(this.camera.aspect);
    const s = this.trauma * this.trauma;
    const t = this.clock;
    const ox = noise1(t * 22, 1) * s * d * 0.012 + noise1(t * 0.13, 5) * d * 0.006 + this.kickOffset.x;
    const oz = noise1(t * 22, 2) * s * d * 0.012 + noise1(t * 0.11, 9) * d * 0.004 + this.kickOffset.y;

    this.camera.position.set(this.look.x + ox, Math.sin(PITCH) * d, this.look.z + Math.cos(PITCH) * d + oz);
    this.camera.rotation.set(-PITCH, 0, noise1(t * 18, 7) * s * 0.012);
    this.camera.updateMatrixWorld();

    if (this.target) {
      const p = this.target.position;
      U.uFocusPos.value.set(p.x, p.y, p.z);
      U.uFocusDist.value = this.camera.position.distanceTo(p);
      this._ndc.set(p.x, p.y + 1, p.z).project(this.camera);
      U.uFocusNdc.value.set(this._ndc.x, this._ndc.y);
    }
  }

  // Size of the visible ground area at the look point.
  viewSize() {
    const d = this.shot.distance * aspectFactor(this.camera.aspect);
    const h = 2 * d * Math.tan(THREE.MathUtils.degToRad(FOV / 2));
    return { width: h * this.camera.aspect, height: h / Math.sin(PITCH) };
  }
}
