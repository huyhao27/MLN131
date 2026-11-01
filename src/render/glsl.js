// Shared GLSL snippets. Noise comes from the baked texture (one fetch instead of many octaves).
export const GLSL_NOISE = /* glsl */ `
uniform sampler2D uwNoise;
vec4 uw_T(vec2 p) { return texture2D(uwNoise, p * 0.25); }
float uw_fbm(vec2 p) { return uw_T(p).g; }
float uw_fbm3(vec2 p) { return uw_T(p).r; }
float uw_hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
// Domain-warped drifting cloud shadow, 0..1.
float uw_cloud(vec2 xz, float t) {
  vec2 p = xz * 0.02 + vec2(t * 0.011, t * 0.004);
  float n = uw_T(p + uw_T(p * 1.7 + 3.1).b * 0.6).a;
  return smoothstep(0.48, 0.7, n);
}
// Posterize into 4 hard bands for a gouache feel.
vec3 ramp4(float t, vec3 a, vec3 b, vec3 c, vec3 d) {
  return t < 0.27 ? a : (t < 0.5 ? b : (t < 0.73 ? c : d));
}
float bayer4(vec2 fc) {
  ivec2 p = ivec2(mod(fc, 4.0));
  int i = p.x + p.y * 4;
  float m[16] = float[16](0., 8., 2., 10., 12., 4., 14., 6., 3., 11., 1., 9., 15., 7., 13., 5.);
  return (m[i] + 0.5) / 16.0;
}
`;

// Depth fog that starts at the focus plane, so the hero stays crisp and the distance blurs out.
export const GLSL_FOG = /* glsl */ `
uniform vec3 uFogColor;
uniform float uFogDensity;
uniform float uFocusDist;
vec3 uw_fog(vec3 col, float viewDepth) {
  float f = 1.0 - exp(-uFogDensity * max(0.0, viewDepth - uFocusDist + 10.0));
  return mix(col, uFogColor, clamp(f, 0.0, 1.0));
}
`;
