// Billboard cards: one InstancedBufferGeometry per layer, every card tilted to face the
// fixed-pitch camera (computed in the vertex shader), plus a painted soft shadow layer
// that shares the same instance attributes.
import * as THREE from 'three';
import { GLSL_COMMON } from './glsl.js';
import { vec3 } from './palette.js';
import { easeOutBack } from '../core/math.js';

const cardVert = /* glsl */ `
attribute vec3 aPos;
attribute vec2 aSize;
attribute vec4 aUv;
attribute vec4 aA; // grow, sway, glow channel, plant
attribute vec4 aB; // bob, seed, shadow scale, -
uniform float uTime;
uniform float uPitch;
uniform vec4 uGlow;
varying vec2 vUv;
varying vec2 vQ;
varying float vGlow;
varying float vPlant;
varying float vDepth;
varying vec3 vW;
void main() {
  vec2 q = position.xy;
  float g = aA.x;
  vec3 up = vec3(0.0, cos(uPitch), -sin(uPitch));
  float sway = aA.y * q.y * q.y * (sin(uTime * 1.3 + aPos.x * 0.21 + aPos.z * 0.13) + 0.5 * sin(uTime * 2.1 + aPos.x * 0.5));
  float bob = aB.x * abs(sin(uTime * 7.0 + aB.y * 6.2831)) * 0.14;
  vec3 wp = aPos + vec3(q.x * aSize.x * g + sway, 0.0, 0.0) + up * (q.y * aSize.y * g + bob);
  vUv = mix(aUv.xy, aUv.zw, vec2(q.x + 0.5, q.y));
  vQ = q;
  float ch = aA.z;
  vGlow = ch < 0.5 ? 0.0 : (ch < 1.5 ? uGlow.x : (ch < 2.5 ? uGlow.y : (ch < 3.5 ? uGlow.z : uGlow.w)));
  vPlant = aA.w;
  vW = wp;
  vec4 mv = viewMatrix * vec4(wp, 1.0);
  vDepth = -mv.z;
  gl_Position = projectionMatrix * mv;
}
`;

const cardFrag = /* glsl */ `
${GLSL_COMMON}
uniform sampler2D uAtlas;
uniform sampler2D uEmit;
uniform float uLife;
uniform float uFade;
varying vec2 vUv;
varying vec2 vQ;
varying float vGlow;
varying float vPlant;
varying float vDepth;
varying vec3 vW;
void main() {
  vec4 t = texture2D(uAtlas, vUv);
  float a = t.a;
#ifdef USE_A2C
  a = clamp((a - 0.5) / max(fwidth(a), 0.0001) + 0.5, 0.0, 1.0);
  if (a < 0.02) discard;
#else
  if (a < 0.5) discard;
  a = 1.0;
#endif
  if (uFade < 0.999 && bayer4(gl_FragCoord.xy) > uFade) discard;
  vec3 col = t.rgb / max(t.a, 0.001);
  // Plants dry out and yellow when living standards fall.
  float dry = vPlant * clamp((0.5 - uLife) * 1.4, 0.0, 0.6);
  col = mix(col, desat(col, 0.45) * vec3(1.1, 0.98, 0.78), dry);
  col = mix(col, col * vec3(0.95, 1.05, 0.93), vPlant * clamp((uLife - 0.55) * 1.5, 0.0, 0.5));
  // Contact darkening at the foot of each card.
  col *= mix(0.8, 1.0, smoothstep(0.0, 0.16, vQ.y));
  // Lit windows.
  float e = texture2D(uEmit, vUv).r * vGlow;
  col = mix(col, vec3(1.0, 0.85, 0.5), clamp(e * 0.8, 0.0, 0.85)) + e * 0.12;
  col *= 1.0 - cloudShadow(vW.xz) * 0.16;
  col *= uLightCol;
  col = haze(col, vDepth);
  gl_FragColor = vec4(col, a);
}
`;

const shadowVert = /* glsl */ `
attribute vec3 aPos;
attribute vec2 aSize;
attribute vec4 aA;
attribute vec4 aB;
varying vec2 vQ;
void main() {
  vec2 q = position.xy;
  float w = abs(aSize.x) * aA.x * aB.z;
  // Light from the top-left: shadows fall right and slightly back.
  vec3 c = aPos + vec3(w * 0.16, 0.05, -w * 0.12);
  vec3 wp = c + vec3(q.x * w * 1.2, 0.0, -(q.y - 0.5) * w * 0.62);
  vQ = vec2(q.x * 2.0, (q.y - 0.5) * 2.0);
  gl_Position = projectionMatrix * viewMatrix * vec4(wp, 1.0);
}
`;

const shadowFrag = /* glsl */ `
uniform vec3 uShadowCol;
varying vec2 vQ;
void main() {
  float d = length(vQ);
  float a = (1.0 - smoothstep(0.35, 1.0, d)) * 0.55;
  if (a < 0.01) discard;
  gl_FragColor = vec4(mix(vec3(1.0), uShadowCol, a), 1.0);
}
`;

function baseGeometry(capacity) {
  const g = new THREE.InstancedBufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute([-0.5, 0, 0, 0.5, 0, 0, 0.5, 1, 0, -0.5, 1, 0], 3));
  g.setIndex([0, 1, 2, 0, 2, 3]);
  const mk = (n) => {
    const a = new THREE.InstancedBufferAttribute(new Float32Array(capacity * n), n);
    a.setUsage(THREE.DynamicDrawUsage);
    return a;
  };
  g.setAttribute('aPos', mk(3));
  g.setAttribute('aSize', mk(2));
  g.setAttribute('aUv', mk(4));
  g.setAttribute('aA', mk(4));
  g.setAttribute('aB', mk(4));
  g.instanceCount = 0;
  return g;
}

export class CardLayer {
  constructor(atlas, U, capacity, { name = 'cards', shadows = true, a2c = true, fade = false } = {}) {
    this.atlas = atlas;
    this.capacity = capacity;
    this.count = 0;
    this.items = [];
    this.animating = new Set();
    this.geometry = baseGeometry(capacity);
    this.uniforms = { ...U, uAtlas: { value: atlas.texture }, uEmit: { value: atlas.emitTexture }, uFade: { value: 1 } };
    this.material = new THREE.ShaderMaterial({
      vertexShader: cardVert,
      fragmentShader: cardFrag,
      uniforms: this.uniforms,
      side: THREE.DoubleSide,
      defines: a2c ? { USE_A2C: 1 } : {},
      alphaToCoverage: a2c,
    });
    this.mesh = new THREE.Mesh(this.geometry, this.material);
    this.mesh.frustumCulled = false;
    this.mesh.renderOrder = 2;
    this.mesh.name = name;
    this.group = new THREE.Group();
    this.group.add(this.mesh);
    if (shadows) {
      this.shadowMaterial = new THREE.ShaderMaterial({
        vertexShader: shadowVert,
        fragmentShader: shadowFrag,
        uniforms: { uShadowCol: { value: vec3('#8f8aa6') } },
        depthWrite: false,
        blending: THREE.CustomBlending,
        blendEquation: THREE.AddEquation,
        blendSrc: THREE.DstColorFactor,
        blendDst: THREE.ZeroFactor,
        polygonOffset: true,
        polygonOffsetFactor: -2,
        polygonOffsetUnits: -4,
      });
      this.shadowMesh = new THREE.Mesh(this.geometry, this.shadowMaterial);
      this.shadowMesh.frustumCulled = false;
      this.shadowMesh.renderOrder = 1;
      this.group.add(this.shadowMesh);
    }
  }

  setA2C(on) {
    this.material.alphaToCoverage = on;
    this.material.defines = on ? { USE_A2C: 1 } : {};
    this.material.needsUpdate = true;
  }

  // spec: { k, x, y, z, s, flip, show, glowCh, bob, seed }
  add(spec) {
    if (this.count >= this.capacity) {
      console.warn('[world] card layer full', this.mesh.name);
      return -1;
    }
    const r = this.atlas.rects[spec.k];
    if (!r) {
      console.warn('[world] unknown sprite', spec.k);
      return -1;
    }
    const i = this.count++;
    const def = r.def;
    const s = spec.s ?? 1;
    const it = {
      spec, def, i, s, flip: !!spec.flip,
      g: 1, from: 1, to: 1, t: 1, dur: 0.8,
      x: spec.x, y: spec.y ?? 0, z: spec.z,
    };
    this.items.push(it);
    const g = this.geometry.attributes;
    g.aPos.setXYZ(i, it.x, it.y, it.z);
    g.aSize.setXY(i, def.w * s * (it.flip ? -1 : 1), def.h * s);
    g.aUv.setXYZW(i, ...r.uv);
    const glow = spec.glowCh ?? def.glow ?? 0;
    g.aA.setXYZW(i, 1, (def.sway ?? 0) * (spec.swayMul ?? 1), glow, def.plant ?? 0);
    g.aB.setXYZW(i, spec.bob ?? 0, spec.seed ?? Math.random(), def.shadow ?? 1, 0);
    this.geometry.instanceCount = this.count;
    this.dirty = true;
    return i;
  }

  // World position of a point on a card given in sprite units (u from center, v up from base).
  anchor(i, u, v, pitch) {
    const it = this.items[i];
    const sx = it.flip ? -1 : 1;
    return new THREE.Vector3(it.x + u * it.s * sx, it.y + v * it.s * Math.cos(pitch), it.z - v * it.s * Math.sin(pitch));
  }

  // Animate visibility. instant skips the tween; delay staggers pops.
  setTarget(i, to, { instant = false, delay = 0 } = {}) {
    const it = this.items[i];
    if (it.to === to && !instant) return;
    if (instant) {
      it.g = it.from = it.to = to;
      it.t = 1;
      this.geometry.attributes.aA.setX(i, to);
      this.dirty = true;
      return;
    }
    it.from = it.g;
    it.to = to;
    it.t = -delay;
    it.dur = to > it.from ? 0.85 : 0.45;
    this.animating.add(it);
  }

  setPos(i, x, y, z) {
    const it = this.items[i];
    it.x = x; it.y = y; it.z = z;
    this.geometry.attributes.aPos.setXYZ(i, x, y, z);
    this.posDirty = true;
  }

  setFlip(i, flip) {
    const it = this.items[i];
    if (it.flip === flip) return;
    it.flip = flip;
    this.geometry.attributes.aSize.setX(i, it.def.w * it.s * (flip ? -1 : 1));
    this.sizeDirty = true;
  }

  update(dt) {
    if (this.animating.size) {
      const aA = this.geometry.attributes.aA;
      for (const it of this.animating) {
        it.t += dt / it.dur;
        const k = Math.max(0, Math.min(1, it.t));
        const e = it.to > it.from ? easeOutBack(k) : k * k;
        it.g = it.from + (it.to - it.from) * e;
        aA.setX(it.i, Math.max(0, it.g));
        if (it.t >= 1) {
          it.g = it.to;
          aA.setX(it.i, it.to);
          this.animating.delete(it);
        }
      }
      aA.needsUpdate = true;
    }
    const a = this.geometry.attributes;
    if (this.dirty) {
      for (const k of ['aPos', 'aSize', 'aUv', 'aA', 'aB']) a[k].needsUpdate = true;
      this.dirty = false;
    }
    if (this.posDirty) { a.aPos.needsUpdate = true; this.posDirty = false; }
    if (this.sizeDirty) { a.aSize.needsUpdate = true; this.sizeDirty = false; }
  }
}
