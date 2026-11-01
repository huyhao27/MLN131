import * as THREE from 'three';
import { U } from '../core/uniforms.js';
import { GLSL_NOISE, GLSL_FOG } from '../render/glsl.js';
import { GLSL_MAP } from '../level/worldMap.js';
import { PAL, lin } from '../paint/palette.js';

const MAX_GAPS = 4;

const vert = /* glsl */ `
varying vec3 vWorld;
varying float vViewDepth;
void main() {
  vec4 wp = modelMatrix * vec4(position, 1.0);
  vWorld = wp.xyz;
  vec4 mv = viewMatrix * wp;
  vViewDepth = -mv.z;
  gl_Position = projectionMatrix * mv;
}
`;

const frag = /* glsl */ `
uniform float uTime;
uniform vec3 uLight;
uniform vec3 cGrassDeep, cGrass, cGrassLight, cGrassSun;
uniform vec3 cPath, cPathLight, cPathDark, cWater, cWaterLight, cInk, cBark, cBarkLight;
uniform vec4 uBridge;          // x, z, half width, half length
uniform vec3 uGaps[${MAX_GAPS}]; // x, z, r
uniform int uGapCount;
varying vec3 vWorld;
varying float vViewDepth;
${GLSL_NOISE}
${GLSL_MAP}
${GLSL_FOG}

void main() {
  vec2 xz = vWorld.xz;
  vec4 m = uw_map(xz);
  float walk = uw_walk(m), stream = uw_stream(m), path = uw_path(m), wild = m.b;

  // Grass: two noise scales posterized into 4 bands, darker in the deep forest.
  float t = clamp(uw_fbm(xz * 0.05) * 0.8 + uw_fbm3(xz * 0.21) * 0.4 - 0.12 - wild * 0.35, 0.0, 1.0);
  vec3 col = ramp4(t, cGrassDeep, cGrass, cGrassLight, cGrassSun);

  // Clearings: a touch lighter and warmer.
  float clearing = smoothstep(0.0, 3.0, walk);
  col = mix(col, mix(col, cGrassSun, 0.18), clearing);

  // Path: noisy edge, posterized dirt, faint wheel ruts along the center.
  float edgeN = (uw_fbm3(xz * 0.35) - 0.5) * 1.6;
  float onPath = smoothstep(-0.35, 0.35, path + edgeN);
  float tp = clamp(uw_fbm(xz * 0.18) * 0.9 + path * 0.06, 0.0, 1.0);
  vec3 dirt = ramp4(tp, cPathDark, cPath, cPath, cPathLight);
  col = mix(col, dirt, onPath);
  col = mix(col, cInk, (1.0 - smoothstep(0.0, 0.45, abs(path + edgeN))) * 0.18);

  // Stream: depth tint, drifting glints, inked shoreline.
  float edgeW = (uw_fbm3(xz * 0.5) - 0.5) * 1.2;
  float water = smoothstep(0.3, -0.3, stream + edgeW);
  vec3 wcol = mix(cWaterLight, cWater, smoothstep(0.0, -2.5, stream));
  wcol += smoothstep(0.64, 0.72, uw_T(xz * 0.15 + vec2(uTime * 0.05, uTime * 0.01)).b) * 0.12;
  float shore = 1.0 - smoothstep(0.0, 0.5, abs(stream + edgeW));

  // Pond gaps share the water look.
  for (int i = 0; i < ${MAX_GAPS}; i++) {
    if (i >= uGapCount) break;
    float d = length(xz - uGaps[i].xy) - uGaps[i].z + edgeW;
    water = max(water, smoothstep(0.3, -0.3, d));
    shore = max(shore, 1.0 - smoothstep(0.0, 0.5, abs(d)));
    wcol = mix(wcol, cWater, smoothstep(0.0, -2.0, d));
  }
  col = mix(col, wcol, water);
  col = mix(col, cInk, shore * 0.4);

  // Bridge deck: planks across the stream.
  vec2 bq = abs(xz - uBridge.xy);
  float onBridge = step(bq.x, uBridge.z) * step(bq.y, uBridge.w);
  float plank = fract((xz.y - uBridge.y) * 1.4);
  vec3 wood = mix(cBarkLight, cBark, step(0.85, plank) + uw_fbm3(xz * vec2(0.3, 3.0)) * 0.4);
  float rail = step(uBridge.z - 0.25, bq.x);
  col = mix(col, mix(wood, cInk, rail * 0.6), onBridge);

  col *= 1.0 - uw_cloud(xz, uTime) * 0.28;
  col *= uLight;
  col = uw_fog(col, vViewDepth);
  gl_FragColor = vec4(col, 1.0);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}
`;

export function createGround(map, layout, size = 700) {
  const gaps = layout.GAPS.slice(0, MAX_GAPS).map((g) => new THREE.Vector3(g.x, g.z, g.r));
  while (gaps.length < MAX_GAPS) gaps.push(new THREE.Vector3());
  const b = layout.STREAM?.bridge;

  const material = new THREE.ShaderMaterial({
    vertexShader: vert,
    fragmentShader: frag,
    uniforms: {
      ...U,
      uwMap: { value: map.texture },
      uwMapRect: { value: map.rect },
      uBridge: { value: b ? new THREE.Vector4(b.x, b.z, b.width / 2, b.length / 2) : new THREE.Vector4(0, 0, -1, -1) },
      uGaps: { value: gaps },
      uGapCount: { value: Math.min(layout.GAPS.length, MAX_GAPS) },
      cGrassDeep: { value: lin(PAL.grassDeep) },
      cGrass: { value: lin(PAL.grass) },
      cGrassLight: { value: lin(PAL.grassLight) },
      cGrassSun: { value: lin(PAL.grassSun) },
      cPath: { value: lin(PAL.path) },
      cPathLight: { value: lin(PAL.pathLight) },
      cPathDark: { value: lin(PAL.pathDark) },
      cWater: { value: lin(PAL.water) },
      cWaterLight: { value: lin(PAL.waterLight) },
      cInk: { value: lin(PAL.ink) },
      cBark: { value: lin(PAL.bark) },
      cBarkLight: { value: lin(PAL.barkLight) },
    },
  });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(size, size), material);
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.set(map.rect.x + map.rect.z / 2, 0, map.rect.y + map.rect.w / 2);
  mesh.name = 'ground';
  return mesh;
}
