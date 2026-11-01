// Chimney smoke and steam: a small CPU particle pool drawn as soft painted Points.
import * as THREE from 'three';
import { GLSL_COMMON } from './glsl.js';

const vert = /* glsl */ `
attribute float aAge;
attribute float aSize;
attribute float aShade;
uniform float uPxScale;
varying float vAge;
varying float vShade;
varying float vDepth;
void main() {
  vAge = aAge;
  vShade = aShade;
  vec4 mv = viewMatrix * vec4(position, 1.0);
  vDepth = -mv.z;
  gl_Position = projectionMatrix * mv;
  gl_PointSize = aSize * uPxScale / max(1.0, -mv.z);
}
`;

const frag = /* glsl */ `
${GLSL_COMMON}
varying float vAge;
varying float vShade;
varying float vDepth;
void main() {
  if (vAge <= 0.0 || vAge >= 1.0) discard;
  vec2 p = gl_PointCoord * 2.0 - 1.0;
  float n = nT(gl_PointCoord * 0.35 + vShade * 3.1).r;
  float d = length(p) + (n - 0.5) * 0.5;
  float a = smoothstep(1.0, 0.45, d) * smoothstep(0.0, 0.12, vAge) * (1.0 - vAge) * 0.85;
  if (a < 0.02) discard;
  // Lit from the top-left: lighter rim on that side.
  float lit = clamp(0.6 - (p.x + p.y) * 0.25, 0.0, 1.0);
  vec3 dark = mix(vec3(0.42, 0.41, 0.45), vec3(0.93, 0.91, 0.88), vShade);
  vec3 col = mix(dark, dark + 0.12, lit) * uLightCol;
  col = haze(col, vDepth);
  gl_FragColor = vec4(col, a);
}
`;

export class Smoke {
  constructor(U, capacity = 700) {
    this.capacity = capacity;
    this.emitters = [];
    this.next = 0;
    this.limit = capacity;
    const g = new THREE.BufferGeometry();
    this.pos = new Float32Array(capacity * 3);
    this.vel = new Float32Array(capacity * 3);
    this.age = new Float32Array(capacity);
    this.life = new Float32Array(capacity).fill(1);
    this.size = new Float32Array(capacity);
    this.shadeA = new Float32Array(capacity);
    this.baseSize = new Float32Array(capacity);
    g.setAttribute('position', new THREE.BufferAttribute(this.pos, 3).setUsage(THREE.DynamicDrawUsage));
    g.setAttribute('aAge', new THREE.BufferAttribute(this.age, 1).setUsage(THREE.DynamicDrawUsage));
    g.setAttribute('aSize', new THREE.BufferAttribute(this.size, 1).setUsage(THREE.DynamicDrawUsage));
    g.setAttribute('aShade', new THREE.BufferAttribute(this.shadeA, 1).setUsage(THREE.DynamicDrawUsage));
    this.geometry = g;
    this.uniforms = { ...U, uPxScale: { value: 800 } };
    this.material = new THREE.ShaderMaterial({
      vertexShader: vert,
      fragmentShader: frag,
      uniforms: this.uniforms,
      transparent: true,
      depthWrite: false,
    });
    this.points = new THREE.Points(g, this.material);
    this.points.frustumCulled = false;
    this.points.renderOrder = 3;
  }

  // rate: particles/s at strength 1. getStrength() -> 0..1 evaluated every frame.
  addEmitter(pos, { rate = 4, size = 2.2, rise = 2.2, shade = 0.75, getStrength = () => 1 } = {}) {
    this.emitters.push({ pos, rate, size, rise, shade, getStrength, acc: Math.random() });
  }

  spawn(e) {
    const i = this.next;
    this.next = (this.next + 1) % this.limit;
    this.pos[i * 3] = e.pos.x + (Math.random() - 0.5) * 0.4;
    this.pos[i * 3 + 1] = e.pos.y;
    this.pos[i * 3 + 2] = e.pos.z + (Math.random() - 0.5) * 0.4;
    this.vel[i * 3] = 0.5 + Math.random() * 0.5;
    this.vel[i * 3 + 1] = e.rise * (0.8 + Math.random() * 0.4);
    this.vel[i * 3 + 2] = -0.2 - Math.random() * 0.3;
    this.age[i] = 0.0001;
    this.life[i] = 3.2 + Math.random() * 1.8;
    this.baseSize[i] = e.size * (0.8 + Math.random() * 0.4);
    this.shadeA[i] = Math.min(1, Math.max(0, e.shade + (Math.random() - 0.5) * 0.15));
  }

  setQuality(q) {
    this.limit = q === 'low' ? Math.floor(this.capacity / 2) : this.capacity;
    this.rateMul = q === 'low' ? 0.5 : 1;
    for (let i = this.limit; i < this.capacity; i++) this.age[i] = 0;
    this.next %= this.limit;
  }

  update(dt, time) {
    const mul = this.rateMul ?? 1;
    for (const e of this.emitters) {
      const s = e.getStrength();
      if (s <= 0.01) continue;
      e.acc += dt * e.rate * s * mul;
      while (e.acc >= 1) {
        e.acc -= 1;
        this.spawn(e);
      }
    }
    for (let i = 0; i < this.limit; i++) {
      if (this.age[i] <= 0) continue;
      this.age[i] += dt / this.life[i];
      if (this.age[i] >= 1) {
        this.age[i] = 0;
        this.size[i] = 0;
        continue;
      }
      const a = this.age[i];
      const wob = Math.sin(time * 0.9 + i * 1.7) * 0.4;
      this.pos[i * 3] += (this.vel[i * 3] + wob) * dt;
      this.pos[i * 3 + 1] += this.vel[i * 3 + 1] * dt * (1 - a * 0.6);
      this.pos[i * 3 + 2] += this.vel[i * 3 + 2] * dt;
      this.size[i] = this.baseSize[i] * (0.6 + a * 2.2);
    }
    const at = this.geometry.attributes;
    at.position.needsUpdate = true;
    at.aAge.needsUpdate = true;
    at.aSize.needsUpdate = true;
    at.aShade.needsUpdate = true;
  }
}
