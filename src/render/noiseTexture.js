import * as THREE from 'three';
import { hash2 } from '../core/rng.js';

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

// 4 independent fBm channels baked once; shaders read fBm with a single texture fetch.
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
    // Stretch each channel to the full 0..1 range.
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
