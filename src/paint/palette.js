import * as THREE from 'three';

// Small global palette (~25 colors) so every painted thing shares a tone.
export const PAL = {
  ink: '#15201c',
  paper: '#efe9d6',
  sun: '#ffe6a3',
  shadowCool: '#2a4752',

  grassDeep: '#2c4529',
  grass: '#4d6a34',
  grassLight: '#78903f',
  grassSun: '#b2b25a',

  path: '#a88f63',
  pathLight: '#d3bb86',
  pathDark: '#7c6649',

  water: '#24505b',
  waterLight: '#5d8f8a',

  bark: '#5a4433',
  barkLight: '#8a6c4e',
  barkDark: '#33261d',

  moss: '#6b7f3a',
  stone: '#8b8a7d',
  flower: '#e8a0b4',
  scarf: '#e5452c',
};

export const LEAF_PALS = {
  oak: { deep: '#1d3628', shadow: '#2c4f34', body: '#467339', light: '#759d47', hl: '#b8c463', sun: '#e6dc85', cool: '#3b6a6a' },
  fir: { deep: '#142a25', shadow: '#1f3d33', body: '#2f5a43', light: '#4f7f52', hl: '#86a75c', sun: '#c2c876', cool: '#2f5c66' },
  birch: { deep: '#2a4228', shadow: '#3f6236', body: '#6a9341', light: '#9cbc55', hl: '#d4d872', sun: '#f0e690', cool: '#4f7a70' },
  bush: { deep: '#1f3527', shadow: '#2f4d31', body: '#4b6e36', light: '#7a984a', hl: '#b6bf62', sun: '#dfd682', cool: '#3d6464' },
};

// Linear THREE.Color from an sRGB hex, for shader uniforms.
export const lin = (hex) => new THREE.Color(hex);

export function mixHex(a, b, t) {
  const ca = new THREE.Color(a), cb = new THREE.Color(b);
  return '#' + ca.lerp(cb, t).getHexString();
}

// Positive t lightens toward paper; negative darkens toward ink (never pure black).
export function shade(hex, t) {
  return t >= 0 ? mixHex(hex, PAL.paper, t) : mixHex(hex, PAL.ink, -t);
}

export function rgba(hex, a) {
  const c = new THREE.Color(hex);
  return `rgba(${Math.round(c.r * 255)},${Math.round(c.g * 255)},${Math.round(c.b * 255)},${a})`;
}
