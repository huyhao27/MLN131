import * as THREE from 'three';
import { fbm2 } from '../core/rng.js';
import { smoothstep } from '../core/math.js';

const RES = 0.5; // texels per meter (1 texel = 2 m)
const MARGIN = 40;

// Encode ranges, decoded the same way in GLSL_MAP.
const WALK = { lo: -24, span: 48 };
const STREAM = { lo: -8, span: 32 };

const enc = (v, r) => Math.round(Math.max(0, Math.min(1, (v - r.lo) / r.span)) * 255);

// Bake the level into one RGBA texture that every shader reads, plus CPU copies for placement.
//   R = walk SDF   G = stream distance - half width   B = wildness (0..1)   A = path-only SDF
export function bakeWorldMap(level) {
  const L = level.layout;
  const minX = L.BOUNDS.minX - MARGIN, minZ = L.BOUNDS.minZ - MARGIN;
  const sizeX = L.BOUNDS.maxX - L.BOUNDS.minX + MARGIN * 2;
  const sizeZ = L.BOUNDS.maxZ - L.BOUNDS.minZ + MARGIN * 2;
  const w = Math.ceil(sizeX * RES), h = Math.ceil(sizeZ * RES);

  const walk = new Float32Array(w * h);
  const stream = new Float32Array(w * h);
  const wild = new Float32Array(w * h);
  const path = new Float32Array(w * h);
  const data = new Uint8Array(w * h * 4);
  const halfStream = (L.STREAM?.width ?? 0) / 2;

  for (let j = 0; j < h; j++) {
    for (let i = 0; i < w; i++) {
      const x = minX + (i + 0.5) / RES, z = minZ + (j + 0.5) / RES;
      const k = j * w + i;
      walk[k] = level.baseSDF(x, z);
      stream[k] = level.streamDistance(x, z) - halfStream;
      path[k] = level.pathSDF(x, z);
      // "Wildness": deep forest away from the path, broken up by noise.
      wild[k] = smoothstep(-4, -30, walk[k]) * (0.6 + 0.4 * fbm2(x * 0.03, z * 0.03, 3, 77));
      data[k * 4] = enc(walk[k], WALK);
      data[k * 4 + 1] = enc(stream[k], STREAM);
      data[k * 4 + 2] = Math.round(Math.max(0, Math.min(1, wild[k])) * 255);
      data[k * 4 + 3] = enc(path[k], WALK);
    }
  }

  const texture = new THREE.DataTexture(data, w, h, THREE.RGBAFormat);
  texture.magFilter = texture.minFilter = THREE.LinearFilter;
  texture.wrapS = texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.needsUpdate = true;

  // Bilinear CPU sampling so placement code reads exactly what shaders see.
  const sample = (arr, x, z) => {
    const fx = Math.max(0, Math.min(w - 1.001, (x - minX) * RES - 0.5));
    const fz = Math.max(0, Math.min(h - 1.001, (z - minZ) * RES - 0.5));
    const i = Math.floor(fx), j = Math.floor(fz), tx = fx - i, tz = fz - j;
    const a = arr[j * w + i], b = arr[j * w + i + 1], c = arr[(j + 1) * w + i], d = arr[(j + 1) * w + i + 1];
    return (a + (b - a) * tx) * (1 - tz) + (c + (d - c) * tx) * tz;
  };

  return {
    texture,
    rect: new THREE.Vector4(minX, minZ, sizeX, sizeZ),
    walk: (x, z) => sample(walk, x, z),
    stream: (x, z) => sample(stream, x, z),
    wild: (x, z) => sample(wild, x, z),
    path: (x, z) => sample(path, x, z),
  };
}

export const GLSL_MAP = /* glsl */ `
uniform sampler2D uwMap;
uniform vec4 uwMapRect;
vec4 uw_map(vec2 xz) { return texture2D(uwMap, (xz - uwMapRect.xy) / uwMapRect.zw); }
float uw_walk(vec4 m) { return m.r * ${WALK.span.toFixed(1)} + ${WALK.lo.toFixed(1)}; }
float uw_stream(vec4 m) { return m.g * ${STREAM.span.toFixed(1)} + ${STREAM.lo.toFixed(1)}; }
float uw_path(vec4 m) { return m.a * ${WALK.span.toFixed(1)} + ${WALK.lo.toFixed(1)}; }
`;
