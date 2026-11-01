import * as THREE from 'three';
import { hash2 } from '../core/rng.js';
import { vec3, PAL } from './palette.js';

const fade = (t) => t * t * t * (t * (t * 6 - 15) + 10);

// Value noise whose lattice wraps every `period` cells, so the result tiles seamlessly.
function tileNoise(x, y, period, seed) {
  const ix = Math.floor(x), iy = Math.floor(y);
  const fx = fade(x - ix), fy = fade(y - iy);
  const w = (v) => ((v % period) + period) % period;
  const a = hash2(w(ix), w(iy), seed), b = hash2(w(ix + 1), w(iy), seed);
  const c = hash2(w(ix), w(iy + 1), seed), d = hash2(w(ix + 1), w(iy + 1), seed);
  const top = a + (b - a) * fx, bottom = c + (d - c) * fx;
  return top + (bottom - top) * fy;
}

// 4 independent tileable fBm channels baked once: shaders get fBm with one texture fetch.
export function bakeNoiseTexture(size = 128, octaves = 4) {
  const data = new Uint8Array(size * size * 4);
  for (let ch = 0; ch < 4; ch++) {
    const values = new Float32Array(size * size);
    let lo = Infinity, hi = -Infinity;
    for (let py = 0; py < size; py++) {
      for (let px = 0; px < size; px++) {
        let v = 0, amp = 0.5;
        for (let o = 0; o < octaves; o++) {
          const freq = 4 << o;
          v += amp * tileNoise((px / size) * freq, (py / size) * freq, freq, ch * 7 + o);
          amp *= 0.5;
        }
        values[py * size + px] = v;
        if (v < lo) lo = v;
        if (v > hi) hi = v;
      }
    }
    for (let i = 0; i < values.length; i++) data[i * 4 + ch] = Math.round(((values[i] - lo) / (hi - lo)) * 255);
  }
  const tex = new THREE.DataTexture(data, size, size, THREE.RGBAFormat);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.magFilter = THREE.LinearFilter;
  tex.minFilter = THREE.LinearMipmapLinearFilter;
  tex.generateMipmaps = true;
  tex.needsUpdate = true;
  return tex;
}

// Uniforms shared by reference across every world material: set once per frame.
export function createSharedUniforms() {
  return {
    uTime: { value: 0 },
    uNoise: { value: bakeNoiseTexture() },
    uLife: { value: 0.5 },
    uEquity: { value: 0.5 },
    uLaw: { value: 0.5 },
    uProd: { value: 0.5 },
    uWarmth: { value: 0.5 },
    uGlow: { value: new THREE.Vector4(0.5, 0.5, 0.5, 0.5) },
    uLightCol: { value: new THREE.Vector3(1, 0.98, 0.94) },
    uHaze: { value: vec3(PAL.haze) },
    uCamDist: { value: 100 },
    uPitch: { value: THREE.MathUtils.degToRad(52) },
    uYaw: { value: 0 },
  };
}

export const GLSL_COMMON = /* glsl */ `
uniform float uTime;
uniform sampler2D uNoise;
uniform vec3 uLightCol;
uniform vec3 uHaze;
uniform float uCamDist;
vec4 nT(vec2 p) { return texture2D(uNoise, p); }
// Drifting domain-warped cloud shadows, 0..1.
float cloudShadow(vec2 xz) {
  vec2 p = xz * 0.0045 + vec2(uTime * 0.0035, uTime * 0.0012);
  float n = nT(p + nT(p * 1.7 + 0.31).b * 0.25).a;
  return smoothstep(0.5, 0.8, n);
}
float bayer4(vec2 fc) {
  vec2 p = mod(floor(fc), 4.0);
  float i = p.x + p.y * 4.0;
  // Compact 4x4 Bayer via bit tricks on small ints.
  float a = mod(p.x, 2.0), b = mod(p.y, 2.0), c = floor(p.x / 2.0), d = floor(p.y / 2.0);
  float v = (a * 2.0 + abs(a - b)) * 4.0 + (c * 2.0 + abs(c - d));
  return (v + 0.5) / 16.0;
}
vec3 desat(vec3 c, float k) { float l = dot(c, vec3(0.3, 0.55, 0.15)); return mix(c, vec3(l), k); }
// Atmospheric haze: far things melt into warm paper.
vec3 haze(vec3 col, float depth) {
  float f = smoothstep(uCamDist * 1.05, uCamDist * 2.4, depth);
  return mix(col, uHaze, f * 0.7);
}
`;
