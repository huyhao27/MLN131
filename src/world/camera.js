// Fixed-pitch camera rig (52° down, FOV 30). Sites are framed toward the left/upper part
// of the screen because UI panels cover the right ~40% and the bottom.
// On top of the sim-driven site shot the viewer may pan (drag), zoom (wheel / pinch) and
// turn slightly (right-drag); a new site from focus() or resetView() eases that back out.
import * as THREE from 'three';
import { easeInOutCubic, clamp } from '../core/math.js';
import { noise1 } from '../core/rng.js';
import { SITES } from './layout.js';

export const PITCH = THREE.MathUtils.degToRad(52);
export const FOV = 30;
// Where the site point should land on screen, in NDC (-1..1).
const FRAME = { x: -0.3, y: 0.1 };
// Viewer limits: look point stays over the island, distance and yaw stay in range
// (cards are billboards facing the fixed pitch, so only a small turn keeps them readable).
const BOUNDS = { x0: -135, x1: 135, z0: -95, z1: 85 };
const DIST = { min: 28, max: 420 };
const YAW_MAX = 0.3;

const KEYS = ['x', 'z', 'd', 'fx', 'fy'];
const USER_KEYS = ['x', 'z', 'zoom', 'yaw'];
const NO_USER = { x: 0, z: 0, zoom: 1, yaw: 0 };
function shotOf(id) {
  const s = SITES[id] || SITES.overview;
  return { x: s.x, z: s.z, d: s.d, fx: s.fx ?? FRAME.x, fy: s.fy ?? FRAME.y };
}

const aspectFactor = (aspect) => 1 + Math.min(0.45, Math.max(0, (1.6 - aspect) * 0.5));

export class CameraRig {
  constructor(camera) {
    this.camera = camera;
    camera.fov = FOV;
    camera.rotation.order = 'YXZ';
    camera.updateProjectionMatrix();
    this.cur = shotOf('overview');
    this.user = { ...NO_USER };
    this.tween = null;
    this.userTween = null;
    this.site = 'overview';
    this.clock = 0;
    this.trauma = 0;
    this.hop = 0;
    this.drift = [0, 0, 0];
  }

  focus(siteId, { instant = false } = {}) {
    if (!SITES[siteId]) console.warn('[world] unknown site', siteId);
    const next = SITES[siteId] ? siteId : 'overview';
    this.goTo(next, shotOf(next), { instant });
  }

  // Fly to an arbitrary framing { x, z, d, fx?, fy? } under the name `name` (region mode
  // uses 'region:CN' etc.). Same easing / hop / user-view reset as focus().
  goTo(name, shot, { instant = false } = {}) {
    // Re-focusing the shot already shown keeps whatever view the viewer chose.
    if (name === this.site && !instant && (this.tween || this.isUserMoved())) return;
    this.site = name;
    const to = { x: shot.x, z: shot.z, d: shot.d, fx: shot.fx ?? FRAME.x, fy: shot.fy ?? FRAME.y };
    if (instant) {
      this.tween = null;
      this.userTween = null;
      Object.assign(this.cur, to);
      Object.assign(this.user, NO_USER);
      return;
    }
    const from = { ...this.cur };
    const travel = Math.hypot(to.x - from.x - this.user.x, to.z - from.z - this.user.z);
    // Long hops rise up and over the island; short ones glide.
    const hop = Math.min(110, travel * 0.55) * (Math.max(from.d, to.d) < 200 ? 1 : 0.3);
    const duration = 1.7 + Math.min(1.2, travel / 140);
    this.tween = { from, to, t: 0, duration, hop };
    this.resetView({ duration });
  }

  // Ease the viewer's pan / zoom / turn back to the current site framing.
  resetView({ duration = 0.9 } = {}) {
    if (!this.isUserMoved()) { this.userTween = null; return; }
    this.userTween = { from: { ...this.user }, t: 0, duration };
  }

  isUserMoved() {
    const u = this.user;
    return Math.abs(u.x) + Math.abs(u.z) > 0.05 || Math.abs(u.zoom - 1) > 0.005 || Math.abs(u.yaw) > 0.002;
  }

  shake(a) {
    this.trauma = clamp(this.trauma + a, 0, 1);
  }

  get distance() {
    return this.cur.d * this.user.zoom * aspectFactor(this.camera.aspect);
  }

  // ---- viewer input (screen pixels) ----
  _grab() { this.userTween = null; }

  // World units per screen pixel at the current distance.
  _pxScale(heightPx) {
    const d = this.distance + this.hop;
    return (2 * d * Math.tan(THREE.MathUtils.degToRad(FOV / 2))) / Math.max(1, heightPx);
  }

  pan(dxPx, dyPx, heightPx) {
    this._grab();
    const k = this._pxScale(heightPx);
    const c = Math.cos(this.user.yaw), s = Math.sin(this.user.yaw);
    // Screen right = (c, -s) on the ground; screen up = (-s, -c) stretched by 1/sin(pitch).
    const up = (dyPx * k) / Math.sin(PITCH);
    this.user.x += -dxPx * k * c - s * up;
    this.user.z += dxPx * k * s - c * up;
    this._clamp();
  }

  // Zoom by factor f (>1 = out) keeping the ground point under (ndcX, ndcY) fixed.
  zoomAt(f, ndcX = 0, ndcY = 0) {
    this._grab();
    const before = this._groundAt(ndcX, ndcY);
    const base = this.cur.d * aspectFactor(this.camera.aspect);
    this.user.zoom = clamp(this.user.zoom * f, DIST.min / base, DIST.max / base);
    this._apply(0, ...this.drift);
    const after = this._groundAt(ndcX, ndcY);
    if (before && after) {
      this.user.x += before.x - after.x;
      this.user.z += before.z - after.z;
    }
    this._clamp();
  }

  rotate(dxPx) {
    this._grab();
    this.user.yaw = clamp(this.user.yaw - dxPx * 0.003, -YAW_MAX, YAW_MAX);
  }

  _clamp() {
    const lx = this.cur.x + this.user.x, lz = this.cur.z + this.user.z;
    this.user.x += clamp(lx, BOUNDS.x0, BOUNDS.x1) - lx;
    this.user.z += clamp(lz, BOUNDS.z0, BOUNDS.z1) - lz;
  }

  _groundAt(ndcX, ndcY) {
    const ray = new THREE.Raycaster();
    ray.setFromCamera(new THREE.Vector2(ndcX, ndcY), this.camera);
    const t = -ray.ray.origin.y / ray.ray.direction.y;
    if (!(t > 0)) return null;
    return ray.ray.at(t, new THREE.Vector3());
  }

  // Wire pointer / wheel input on the canvas. Only pointer events: keyboard keys belong to the UI.
  // Optional hooks: onTap(event) for a click / tap that did not drag, onHover(event | null)
  // for pointer moves with no button held (null when the pointer leaves the canvas).
  bindInput(el, { onTap = null, onHover = null } = {}) {
    const pts = new Map();
    let mode = null, pinch = null;
    // Tap detection: one pointer, little travel, short press.
    let tap = null;
    const TAP_PX = 6, TAP_MS = 650;
    const H = () => el.clientHeight || window.innerHeight;
    const ndc = (e) => {
      const r = el.getBoundingClientRect();
      return [((e.clientX - r.left) / r.width) * 2 - 1, -(((e.clientY - r.top) / r.height) * 2 - 1)];
    };
    const pinchInfo = () => {
      const [a, b] = [...pts.values()];
      return { d: Math.hypot(a.x - b.x, a.y - b.y), x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
    };
    const down = (e) => {
      if (e.pointerType === 'mouse' && e.button !== 0 && e.button !== 2) return;
      try { el.setPointerCapture(e.pointerId); } catch { /* synthetic or already released pointer */ }
      pts.set(e.pointerId, { x: e.clientX, y: e.clientY });
      tap = pts.size === 1 && e.button === 0 ? { id: e.pointerId, x: e.clientX, y: e.clientY, t: performance.now() } : null;
      if (pts.size === 2) { mode = 'pinch'; pinch = pinchInfo(); } else if (pts.size === 1) mode = e.button === 2 ? 'rotate' : 'pan';
      el.style.cursor = 'grabbing';
    };
    const move = (e) => {
      const p = pts.get(e.pointerId);
      if (!p) {
        if (onHover && e.pointerType !== 'touch') onHover(e);
        return;
      }
      if (tap && (tap.id !== e.pointerId || Math.hypot(e.clientX - tap.x, e.clientY - tap.y) > TAP_PX)) tap = null;
      const dx = e.clientX - p.x, dy = e.clientY - p.y;
      p.x = e.clientX; p.y = e.clientY;
      if (mode === 'pan') this.pan(dx, dy, H());
      else if (mode === 'rotate') this.rotate(dx);
      else if (mode === 'pinch' && pts.size === 2) {
        const now = pinchInfo();
        this.pan(now.x - pinch.x, now.y - pinch.y, H());
        if (now.d > 10 && pinch.d > 10) {
          const r = el.getBoundingClientRect();
          this.zoomAt(pinch.d / now.d, ((now.x - r.left) / r.width) * 2 - 1, -(((now.y - r.top) / r.height) * 2 - 1));
        }
        pinch = now;
      }
    };
    const up = (e) => {
      const wasTap = tap && tap.id === e.pointerId && e.type === 'pointerup' && pts.size === 1
        && Math.hypot(e.clientX - tap.x, e.clientY - tap.y) <= TAP_PX && performance.now() - tap.t < TAP_MS;
      tap = null;
      pts.delete(e.pointerId);
      if (wasTap && onTap) onTap(e);
      mode = pts.size === 1 ? 'pan' : null;
      if (!pts.size) el.style.cursor = '';
    };
    const wheel = (e) => {
      e.preventDefault();
      const dy = e.deltaMode === 1 ? e.deltaY * 16 : e.deltaY;
      this.zoomAt(Math.exp(clamp(dy, -200, 200) * 0.0012), ...ndc(e));
    };
    const dbl = () => this.resetView();
    const ctx = (e) => e.preventDefault();
    const leave = () => { if (onHover && !pts.size) onHover(null); };
    el.style.touchAction = 'none';
    el.addEventListener('pointerdown', down);
    el.addEventListener('pointermove', move);
    el.addEventListener('pointerup', up);
    el.addEventListener('pointercancel', up);
    el.addEventListener('wheel', wheel, { passive: false });
    el.addEventListener('dblclick', dbl);
    el.addEventListener('contextmenu', ctx);
    el.addEventListener('pointerleave', leave);
    return () => {
      el.removeEventListener('pointerleave', leave);
      el.removeEventListener('pointerdown', down);
      el.removeEventListener('pointermove', move);
      el.removeEventListener('pointerup', up);
      el.removeEventListener('pointercancel', up);
      el.removeEventListener('wheel', wheel);
      el.removeEventListener('dblclick', dbl);
      el.removeEventListener('contextmenu', ctx);
    };
  }

  update(dt) {
    this.clock += dt;
    let hop = 0;
    if (this.tween) {
      const tw = this.tween;
      tw.t += dt / tw.duration;
      const k = easeInOutCubic(clamp(tw.t));
      for (const key of KEYS) this.cur[key] = tw.from[key] + (tw.to[key] - tw.from[key]) * k;
      hop = Math.sin(Math.PI * clamp(tw.t)) * tw.hop;
      if (tw.t >= 1) this.tween = null;
    }
    if (this.userTween) {
      const ut = this.userTween;
      ut.t += dt / ut.duration;
      const k = easeInOutCubic(clamp(ut.t));
      for (const key of USER_KEYS) this.user[key] = ut.from[key] + (NO_USER[key] - ut.from[key]) * k;
      if (ut.t >= 1) this.userTween = null;
    }
    this.hop = hop;
    const t = this.clock;
    const d = (this.cur.d * this.user.zoom + hop) * aspectFactor(this.camera.aspect);
    // Gentle idle drift, a breathing diorama.
    const ix = noise1(t * 0.05, 3) * d * 0.012;
    const iz = noise1(t * 0.045, 8) * d * 0.008;
    const s = this.trauma * this.trauma;
    this.trauma = Math.max(0, this.trauma - dt * 1.6);
    const sx = noise1(t * 20, 1) * s * d * 0.01;
    const sz = noise1(t * 20, 2) * s * d * 0.01;
    this.drift = [ix + sx, iz + sz, noise1(t * 18, 7) * s * 0.01];
    this._apply(d, ...this.drift);
    return d;
  }

  // Place the camera: distance d (0 = recompute from state), extra look offset, roll.
  _apply(d, ox, oz, roll) {
    if (!d) d = (this.cur.d * this.user.zoom + this.hop) * aspectFactor(this.camera.aspect);
    const halfH = d * Math.tan(THREE.MathUtils.degToRad(FOV / 2));
    const halfW = halfH * this.camera.aspect;
    const yaw = this.user.yaw, c = Math.cos(yaw), s = Math.sin(yaw);
    // Frame offset in screen space (right, up) rotated onto the ground.
    const r = -this.cur.fx * halfW, u = -(this.cur.fy * halfH) / Math.sin(PITCH);
    const lookX = this.cur.x + this.user.x + r * c - u * s + ox;
    const lookZ = this.cur.z + this.user.z - r * s - u * c + oz;
    const back = Math.cos(PITCH) * d;
    this.camera.position.set(lookX + s * back, Math.sin(PITCH) * d, lookZ + c * back);
    this.camera.rotation.set(-PITCH, yaw, roll);
    this.camera.updateMatrixWorld();
  }
}
