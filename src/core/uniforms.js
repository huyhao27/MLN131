import * as THREE from 'three';

// Shared uniforms, passed by reference into every material so one write per frame reaches them all.
export const U = {
  uTime: { value: 0 },
  uWind: { value: 0.5 },
  uAspect: { value: 1 },
  uLight: { value: new THREE.Color(1, 1, 1) },
  uFogColor: { value: new THREE.Color(0x1e333a) },
  uFogDensity: { value: 0.004 },
  uFocusPos: { value: new THREE.Vector3() },
  uFocusDist: { value: 100 },
};
