// The island ground: a per-pixel mask (land / rural / forest / sea depth) baked in JS,
// a Canvas2D painted detail layer (roads, fields, plazas, docks) and one shader that
// composes them into a gouache-like surface with animated water and cloud shadows.
import * as THREE from 'three';
import { makeRng, fbm2 } from '../core/rng.js';
import { PAL, vec3, rgba, shade, mix } from './palette.js';
import { makeCanvas } from './paint.js';
import { landField, ROADS, RIVER, RESERVOIR, ZONES, DOCKS, FIELDS, distPolyline } from './layout.js';
import { GLSL_COMMON } from './glsl.js';

export const MAP = { x0: -200, z0: -150, size: 400 };

function bakeMask(res) {
  const data = new Uint8Array(res * res * 4);
  const k = MAP.size / res;
  for (let j = 0; j < res; j++) {
    const z = MAP.z0 + (j + 0.5) * k;
    for (let i = 0; i < res; i++) {
      const x = MAP.x0 + (i + 0.5) * k;
      let land = landField(x, z);
      for (const d of DOCKS) if (x > d.x0 && x < d.x1 && z > d.z0 && z < d.z1) land = Math.max(land, 0.3);
      // Carve river and reservoir.
      if (x > -125 && x < -60 && z > -70) {
        const dr = distPolyline(x, z, RIVER);
        const t = Math.max(0, Math.min(1, (z + 46) / 110));
        const w = 1.6 + t * 2.6;
        land = Math.min(land, (dr - w) * 0.06);
        const ex = (x - RESERVOIR.x) / RESERVOIR.rx, ez = (z - RESERVOIR.z) / RESERVOIR.rz;
        const er = Math.sqrt(ex * ex + ez * ez) + fbm2(x * 0.08, z * 0.08, 2, 3) * 0.12;
        land = Math.min(land, (er - 1) * 0.5);
      }
      const rural = Math.max(0, Math.min(1, (-x - 8) / 40 + fbm2(x * 0.02, z * 0.02, 2, 21) * 0.3));
      const forest = Math.max(0, Math.min(1, fbm2(x * 0.03, z * 0.03, 3, 5) * 1.3 + 0.25 + (x < -50 && z < -10 ? 0.35 : 0)));
      const o = (j * res + i) * 4;
      data[o] = Math.max(0, Math.min(255, (0.5 + land * 2.2) * 255));
      data[o + 1] = rural * 255;
      data[o + 2] = forest * 255;
      data[o + 3] = Math.max(0, Math.min(255, (0.5 + land * 0.9) * 255));
    }
  }
  const tex = new THREE.DataTexture(data, res, res, THREE.RGBAFormat);
  tex.magFilter = THREE.LinearFilter;
  tex.minFilter = THREE.LinearMipmapLinearFilter;
  tex.generateMipmaps = true;
  tex.needsUpdate = true;
  return tex;
}

// Painted detail layer: fields, zones, docks, roads. Alpha = coverage.
function paintDetail(res) {
  const c = makeCanvas(res, res);
  const ctx = c.getContext('2d');
  const k = res / MAP.size;
  const X = (x) => (x - MAP.x0) * k, Z = (z) => (z - MAP.z0) * k;
  const rng = makeRng('ground');

  const ellipse = (e, fill, edge) => {
    ctx.save();
    ctx.beginPath();
    const n = 40;
    for (let i = 0; i <= n; i++) {
      const a = (i / n) * Math.PI * 2;
      const r = 1 + fbm2(Math.cos(a) * 2 + e.x, Math.sin(a) * 2 + e.z, 2, 9) * 0.12;
      const x = X(e.x + Math.cos(a) * e.rx * r), y = Z(e.z + Math.sin(a) * e.rz * r);
      i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
    }
    ctx.closePath();
    ctx.fillStyle = fill;
    ctx.fill();
    ctx.strokeStyle = edge;
    ctx.lineWidth = 2.5 * k * 0.5;
    ctx.stroke();
    ctx.restore();
  };

  // Paddy fields: strips with alternating greens and thin water-mirror dykes.
  for (const f of FIELDS) {
    ctx.save();
    ctx.translate(X(f.x), Z(f.z));
    ctx.rotate(f.a);
    const w = f.w * k, d = f.d * k;
    const strips = Math.max(3, Math.round(f.d / 2.2));
    for (let i = 0; i < strips; i++) {
      const cols = 2 + Math.floor(rng() * 2);
      for (let j = 0; j < cols; j++) {
        const t = rng();
        ctx.fillStyle = rgba(t < 0.25 ? PAL.paddyWater : t < 0.7 ? PAL.paddy : t < 0.9 ? mix(PAL.paddy, PAL.grassLight, 0.5) : PAL.paddyRipe, 0.95);
        ctx.fillRect(-w / 2 + (j * w) / cols, -d / 2 + (i * d) / strips, w / cols - 1.5, d / strips - 1.5);
      }
    }
    ctx.strokeStyle = rgba(shade(PAL.paddy, -0.3), 0.5);
    ctx.lineWidth = 1.2;
    ctx.strokeRect(-w / 2, -d / 2, w, d);
    ctx.restore();
  }

  for (const zn of ZONES) {
    if (zn.kind === 'plaza') ellipse(zn, rgba(PAL.plaza, 0.95), rgba(shade(PAL.plaza, -0.25), 0.7));
    if (zn.kind === 'concrete') ellipse(zn, rgba(PAL.concrete, 0.95), rgba(shade(PAL.concrete, -0.25), 0.7));
    if (zn.kind === 'lawn') ellipse(zn, rgba(mix(PAL.grassLight, PAL.plaza, 0.25), 0.9), rgba(shade(PAL.grass, -0.2), 0.6));
    if (zn.kind === 'dirt') ellipse(zn, rgba(PAL.plaza, 0.9), rgba(shade(PAL.dirt, -0.2), 0.6));
  }
  // Paving grid on plazas.
  ctx.strokeStyle = rgba(shade(PAL.plaza, -0.15), 0.25);
  ctx.lineWidth = 1;
  for (const zn of ZONES.filter((z) => z.kind === 'plaza' || z.kind === 'concrete')) {
    for (let x = zn.x - zn.rx; x < zn.x + zn.rx; x += 4) {
      ctx.beginPath(); ctx.moveTo(X(x), Z(zn.z - zn.rz * 0.8)); ctx.lineTo(X(x), Z(zn.z + zn.rz * 0.8)); ctx.stroke();
    }
  }

  for (const d of DOCKS) {
    ctx.fillStyle = PAL.concrete;
    ctx.fillRect(X(d.x0), Z(d.z0), (d.x1 - d.x0) * k, (d.z1 - d.z0) * k);
    ctx.strokeStyle = rgba(PAL.inkSoft, 0.6);
    ctx.lineWidth = 3;
    ctx.strokeRect(X(d.x0), Z(d.z0), (d.x1 - d.x0) * k, (d.z1 - d.z0) * k);
    ctx.strokeStyle = rgba(PAL.accentYellow, 0.6);
    ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(X(d.x0 + 1), Z(d.z1 - 1.2)); ctx.lineTo(X(d.x1 - 1), Z(d.z1 - 1.2)); ctx.stroke();
  }

  // Roads: dark edge, asphalt body, pale dashed center line.
  const strokeRoad = (r, width, color, dash) => {
    ctx.save();
    ctx.beginPath();
    r.pts.forEach(([x, z], i) => (i ? ctx.lineTo(X(x), Z(z)) : ctx.moveTo(X(x), Z(z))));
    if (r.ring) ctx.closePath();
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.strokeStyle = color;
    ctx.lineWidth = width * k;
    if (dash) ctx.setLineDash(dash.map((v) => v * k));
    ctx.stroke();
    ctx.restore();
  };
  for (const r of ROADS) strokeRoad(r, r.w + 1.0, rgba(shade(PAL.road, -0.35), 0.8));
  for (const r of ROADS) strokeRoad(r, r.w, PAL.road);
  for (const r of ROADS) strokeRoad(r, r.w * 0.55, rgba(PAL.roadLight, 0.35));
  for (const r of ROADS) strokeRoad(r, 0.25, rgba('#efe6cf', 0.85), [2.2, 2.4]);

  // Little footpaths between villages.
  ctx.save();
  ctx.strokeStyle = rgba(PAL.dirt, 0.7);
  ctx.lineWidth = 1.1 * k;
  ctx.setLineDash([3 * k, 1.2 * k]);
  const paths = [[[-50, -12], [-56, 4], [-48, 18], [-30, 26]], [[-34, -26], [-40, -4]], [[-72, -34], [-74, -24], [-75, -12], [-83, -3]], [[-97, -30], [-101, -16]], [[-70, 40], [-86, 28]]];
  for (const p of paths) {
    ctx.beginPath();
    p.forEach(([x, z], i) => (i ? ctx.lineTo(X(x), Z(z)) : ctx.moveTo(X(x), Z(z))));
    ctx.stroke();
  }
  ctx.restore();

  const tex = new THREE.CanvasTexture(c);
  tex.premultiplyAlpha = true;
  tex.anisotropy = 8;
  tex.minFilter = THREE.LinearMipmapLinearFilter;
  return tex;
}

const vert = /* glsl */ `
varying vec2 vXZ;
varying float vDepth;
void main() {
  vec4 wp = modelMatrix * vec4(position, 1.0);
  vXZ = wp.xz;
  vec4 mv = viewMatrix * wp;
  vDepth = -mv.z;
  gl_Position = projectionMatrix * mv;
}
`;

const frag = /* glsl */ `
${GLSL_COMMON}
uniform sampler2D uMask;
uniform sampler2D uDetail;
uniform vec4 uMapRect;
uniform float uLife, uEquity, uLaw;
uniform vec3 cGrassDeep, cGrass, cGrassLight, cGrassSun, cDry, cForest, cSand;
uniform vec3 cSea, cSeaDeep, cSeaLight, cFoam, cPaper, cInk;
varying vec2 vXZ;
varying float vDepth;

vec3 ramp4(float t, vec3 a, vec3 b, vec3 c, vec3 d) {
  return t < 0.3 ? a : (t < 0.52 ? b : (t < 0.75 ? c : d));
}

void main() {
  vec2 muv = (vXZ - uMapRect.xy) / uMapRect.z;
  vec4 m = texture2D(uMask, muv);
  // Brush-stroke edge noise so every boundary wobbles like a hand-painted edge.
  vec4 n1 = nT(vXZ * 0.031);
  vec4 n2 = nT(vXZ * 0.11 + 0.37);
  float edgeN = (n2.r - 0.5) * 0.09 + (n1.g - 0.5) * 0.05;
  float land = smoothstep(0.47, 0.53, m.r + edgeN);

  // --- grass: soft-posterized bands (gouache), low frequency so it reads as washes ---
  float lo = nT(vXZ * 0.011).r;
  float mid = nT(vXZ * 0.04 + 0.3).g;
  float t = clamp(lo * 0.8 + mid * 0.4 - 0.18 - m.b * 0.25, 0.0, 0.999);
  float tb = (floor(t * 4.0) + smoothstep(0.3, 0.7, fract(t * 4.0))) / 4.0;
  vec3 col = mix(cGrassDeep, cGrass, smoothstep(0.0, 0.3, tb));
  col = mix(col, cGrassLight, smoothstep(0.3, 0.6, tb));
  col = mix(col, cGrassSun, smoothstep(0.65, 0.95, tb));
  col = mix(col, cForest, smoothstep(0.55, 0.9, m.b + (mid - 0.5) * 0.3) * 0.5);
  // Directional brush streaks.
  float streak = nT(vec2(vXZ.x * 0.06, vXZ.y * 0.22)).b;
  col *= 0.95 + streak * 0.09;
  // Living standards: greener lusher grass; low LIFE dries the land.
  float dryness = clamp((0.55 - uLife) * 1.8, 0.0, 0.75) + m.g * clamp((0.55 - uEquity) * 1.6, 0.0, 0.5);
  col = mix(col, mix(cDry, col, 0.3), clamp(dryness, 0.0, 0.85) * (0.5 + 0.5 * smoothstep(0.3, 0.7, n1.b)));
  col = mix(col, col * vec3(0.96, 1.04, 0.94), clamp((uLife - 0.5) * 1.6, 0.0, 0.6));
  // Rural/urban contrast: low equity desaturates the countryside.
  col = desat(col, m.g * clamp((0.5 - uEquity) * 1.2, 0.0, 0.45));

  // Beach ring.
  float beach = 1.0 - smoothstep(0.53, 0.6, m.r + edgeN * 1.4);
  col = mix(col, cSand, beach * step(0.25, m.a) * 0.9);

  // Painted detail layer on top.
  vec4 d = texture2D(uDetail, muv);
  vec3 dcol = d.rgb / max(d.a, 0.001);
  dcol *= 0.94 + n2.a * 0.12;
  col = mix(col, dcol, d.a * land);

  // --- water ---
  float depth = clamp(1.0 - m.a * 2.0, 0.0, 1.0);
  vec3 w = mix(cSeaLight, cSea, smoothstep(0.0, 0.3, depth));
  w = mix(w, cSeaDeep, smoothstep(0.3, 1.0, depth) * 0.85);
  // Long horizontal wash strokes drifting slowly, plus sparse glints.
  float s1 = nT(vec2(vXZ.x * 0.008 + uTime * 0.003, vXZ.y * 0.045)).b;
  float s2 = nT(vec2(vXZ.x * 0.02 - uTime * 0.004, vXZ.y * 0.1 + 0.5)).g;
  w = mix(w, w * 1.06 + 0.025, smoothstep(0.4, 0.8, s1) * 0.7);
  w = mix(w, w * 0.94, smoothstep(0.5, 0.85, s2) * 0.5);
  float gl = nT(vec2(vXZ.x * 0.05, vXZ.y * 0.3) + vec2(uTime * 0.01, uTime * 0.004)).a;
  w += smoothstep(0.84, 0.9, gl) * 0.06 * smoothstep(0.1, 0.4, depth);
  // Animated foam bands that hug the shore.
  float shore = m.r + edgeN;
  float band = sin(shore * 70.0 - uTime * 1.4 + n2.r * 6.0);
  float foam = smoothstep(0.38, 0.5, shore) * smoothstep(0.55, 0.95, band) * 0.8 + smoothstep(0.455, 0.5, shore) * 0.6;
  w = mix(w, cFoam, clamp(foam, 0.0, 1.0));
  col = mix(w, col, land);
  // Inked coastline.
  col = mix(col, cInk, (1.0 - smoothstep(0.0, 0.012, abs(shore - 0.5))) * 0.35);

  // Cloud shadows, light, pigment grain.
  col *= 1.0 - cloudShadow(vXZ) * 0.16;
  col *= uLightCol;

  // The world fades into paper at its edges, like a painting on a page.
  float r = length((vXZ - vec2(0.0, 0.0)) * vec2(0.82, 1.15));
  col = mix(col, cPaper, smoothstep(170.0, 290.0, r + (n1.a - 0.5) * 40.0));
  col = haze(col, vDepth);
  gl_FragColor = vec4(col, 1.0);
}
`;

export function createGround(U, { quality = 'high' } = {}) {
  const maskRes = quality === 'low' ? 512 : 768;
  const detailRes = quality === 'low' ? 1536 : 2048;
  const material = new THREE.ShaderMaterial({
    vertexShader: vert,
    fragmentShader: frag,
    uniforms: {
      ...U,
      uMask: { value: bakeMask(maskRes) },
      uDetail: { value: paintDetail(detailRes) },
      uMapRect: { value: new THREE.Vector4(MAP.x0, MAP.z0, MAP.size, 0) },
      cGrassDeep: { value: vec3(PAL.grassDeep) },
      cGrass: { value: vec3(PAL.grass) },
      cGrassLight: { value: vec3(PAL.grassLight) },
      cGrassSun: { value: vec3(PAL.grassSun) },
      cDry: { value: vec3(PAL.dry) },
      cForest: { value: vec3(PAL.forest) },
      cSand: { value: vec3(PAL.sand) },
      cSea: { value: vec3(PAL.sea) },
      cSeaDeep: { value: vec3(PAL.seaDeep) },
      cSeaLight: { value: vec3(PAL.seaLight) },
      cFoam: { value: vec3(PAL.foam) },
      cPaper: { value: vec3(PAL.paper) },
      cInk: { value: vec3(PAL.ink) },
    },
  });
  // Map texture V is flipped in the shader (canvas row 0 = z0), so disable flipY on the canvas.
  material.uniforms.uDetail.value.flipY = false;
  material.uniforms.uMask.value.flipY = false;
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(900, 900), material);
  mesh.rotation.x = -Math.PI / 2;
  mesh.renderOrder = 0;
  mesh.name = 'ground';
  return mesh;
}
