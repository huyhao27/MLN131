import * as THREE from 'three';

// One small palette for the whole island so every painted thing shares a tone.
// All shaders work directly in sRGB "paint space": colors here are what ends up on screen.
export const PAL = {
  ink: '#2b2a33',
  inkSoft: '#4a4652',
  paper: '#f1e8d2',
  paperDeep: '#e2d3b2',
  haze: '#e8dcc0',
  sun: '#ffe2a0',
  glow: '#ffd27a',

  sea: '#71aab0',
  seaDeep: '#56909b',
  seaLight: '#a9d3c8',
  foam: '#f4efdc',
  sand: '#e6cf9b',

  grassDeep: '#62844a',
  grass: '#7ea25b',
  grassLight: '#a5c06d',
  grassSun: '#cdd389',
  dry: '#bfa66a',
  forest: '#4f7447',
  paddy: '#9fc06a',
  paddyRipe: '#d9c66a',
  paddyWater: '#8fb9a8',
  soil: '#a98a5e',

  road: '#8f8a83',
  roadLight: '#b9b2a4',
  plaza: '#d9ccb0',
  concrete: '#bdb5a5',
  dirt: '#b39a72',

  roofRed: '#c4664a',
  roofTerra: '#b8573f',
  roofBlue: '#5d7c94',
  roofGreen: '#6f8f5c',
  roofThatch: '#b59a5c',
  roofDark: '#55545f',
  wallCream: '#efe2c4',
  wallWhite: '#f2eee4',
  wallYellow: '#ebc978',
  wallOchre: '#d9a75e',
  wallPink: '#e2a9a0',
  wallBlue: '#a9c3cc',
  wallGray: '#b9b6b0',
  brick: '#b36a4f',
  glass: '#7fb0bd',
  glassDeep: '#4e7f93',
  steel: '#8d96a0',
  wood: '#8a5e3c',
  woodLight: '#b0845a',
  woodDark: '#5c3d28',

  accentRed: '#d9573e',
  accentOrange: '#e98b3a',
  accentYellow: '#f0c34a',
  accentTeal: '#3f9c94',
  accentBlue: '#4a77b0',
  accentPurple: '#8a6aa8',
  accentGreen: '#5fa05a',

  skin: '#e2b48c',
  skinDark: '#b98560',
  hair: '#33292a',
  mountain: '#7f9a86',
  mountainDeep: '#5b7a6f',
  mountainFar: '#a9b9ae',
};

// Shader uniform from hex, raw sRGB values (paint space = display space).
export const vec3 = (hex) => {
  const c = rgbOf(hex);
  return new THREE.Vector3(c[0] / 255, c[1] / 255, c[2] / 255);
};

export function rgbOf(hex) {
  return [parseInt(hex.slice(1, 3), 16), parseInt(hex.slice(3, 5), 16), parseInt(hex.slice(5, 7), 16)];
}

const toHex = (r, g, b) => '#' + [r, g, b].map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('');

export function mix(a, b, t) {
  const A = rgbOf(a), B = rgbOf(b);
  return toHex(A[0] + (B[0] - A[0]) * t, A[1] + (B[1] - A[1]) * t, A[2] + (B[2] - A[2]) * t);
}

// Positive t lightens toward paper; negative darkens toward ink (never pure black).
export function shade(hex, t) {
  return t >= 0 ? mix(hex, PAL.paper, t) : mix(hex, PAL.ink, -t);
}

export function rgba(hex, a) {
  const c = rgbOf(hex);
  return `rgba(${c[0]},${c[1]},${c[2]},${a})`;
}
