import * as THREE from 'three';
import { U } from '../core/uniforms.js';
import { GLSL_NOISE, GLSL_FOG } from '../render/glsl.js';
import { PAL, lin } from '../paint/palette.js';

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
varying vec3 vWorld;
varying float vViewDepth;
${GLSL_NOISE}
${GLSL_FOG}
void main() {
  vec2 xz = vWorld.xz;
  float n = uw_fbm(xz * 0.05);
  float n2 = uw_fbm3(xz * 0.21);
  float t = clamp(n * 0.8 + n2 * 0.4 - 0.12, 0.0, 1.0);
  vec3 col = ramp4(t, cGrassDeep, cGrass, cGrassLight, cGrassSun);
  col *= 1.0 - uw_cloud(xz, uTime) * 0.28;
  col *= uLight;
  col = uw_fog(col, vViewDepth);
  gl_FragColor = vec4(col, 1.0);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}
`;

export function createGround(size = 600) {
  const material = new THREE.ShaderMaterial({
    vertexShader: vert,
    fragmentShader: frag,
    uniforms: {
      ...U,
      cGrassDeep: { value: lin(PAL.grassDeep) },
      cGrass: { value: lin(PAL.grass) },
      cGrassLight: { value: lin(PAL.grassLight) },
      cGrassSun: { value: lin(PAL.grassSun) },
    },
  });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(size, size), material);
  mesh.rotation.x = -Math.PI / 2;
  mesh.name = 'ground';
  return mesh;
}
