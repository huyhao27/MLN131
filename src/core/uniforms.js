import * as THREE from 'three';

// Shared uniforms, passed by reference into every material so one write per frame reaches them all.
export const U = {
  uTime: { value: 0 },
  uWind: { value: 0.5 },
  uAspect: { value: 1 },
  uLight: { value: new THREE.Color(1, 1, 1) },
  uFogColor: { value: new THREE.Color('#3d5e5c') },
  uFogDensity: { value: 0.006 },
  uMistColor: { value: new THREE.Color('#9fb8a8') },
  uMist: { value: 0.35 },
  uMistTop: { value: 3.5 },
  uFocusPos: { value: new THREE.Vector3() },
  uFocusNdc: { value: new THREE.Vector2() },
  uFocusDist: { value: 100 },
  uwNoise: { value: null },
};
