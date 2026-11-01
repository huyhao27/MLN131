// Watercolor post pass: line boil, pooled pigment at edges, warm/cool grade driven by
// social trust, paper grain and wash, light leak, vignette, pulse flourishes, dither.
import * as THREE from 'three';

const vert = /* glsl */ `
varying vec2 vUv;
void main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }
`;

const frag = /* glsl */ `
uniform sampler2D tScene;
uniform sampler2D uNoise;
uniform vec2 uRes;
uniform float uTime;
uniform float uWarmth;
uniform vec4 uPulse;     // rgb, strength
uniform float uPulseR;   // ring radius
uniform float uDesat;
uniform vec2 uFocusUv;
uniform float uBoil;
varying vec2 vUv;
float lum(vec3 c) { return dot(c, vec3(0.3, 0.55, 0.15)); }
void main() {
  vec2 px = 1.0 / uRes;
  // Line boil: tiny uv wobble that steps ~8 times a second, like redrawn frames.
  float st = floor(uTime * 8.0);
  vec2 bo = (texture2D(uNoise, vUv * 2.3 + st * 0.137).rg - 0.5) * px * 2.0 * uBoil;
  vec2 uv = vUv + bo;
  vec3 c = texture2D(tScene, uv).rgb;
  // Pigment pooling: darken along color edges.
  vec3 cx1 = texture2D(tScene, uv + vec2(px.x * 1.5, 0.0)).rgb;
  vec3 cx0 = texture2D(tScene, uv - vec2(px.x * 1.5, 0.0)).rgb;
  vec3 cy1 = texture2D(tScene, uv + vec2(0.0, px.y * 1.5)).rgb;
  vec3 cy0 = texture2D(tScene, uv - vec2(0.0, px.y * 1.5)).rgb;
  float e = length(vec2(lum(cx1) - lum(cx0), lum(cy1) - lum(cy0)));
  vec3 soft = (cx1 + cx0 + cy1 + cy0) * 0.25;
  c = mix(c, soft, 0.25);
  c *= 1.0 - clamp(e * 1.8, 0.0, 0.28);
  // Grade: trust/cohesion warms the light, distrust cools and greys it.
  vec3 warm = c * vec3(1.07, 1.0, 0.88);
  vec3 cool = c * vec3(0.93, 0.98, 1.06);
  c = mix(cool, warm, uWarmth);
  c = mix(vec3(lum(c)), c, 0.82 + uWarmth * 0.3);
  c = mix(c, c * c * (3.0 - 2.0 * c), 0.22);
  // Paper: grain + granulation + low-frequency wash, fixed to the screen.
  vec2 suv = vUv * uRes / 220.0;
  float grain = texture2D(uNoise, suv).r;
  float gran = texture2D(uNoise, suv * 0.37 + 0.5).b;
  float wash = texture2D(uNoise, vUv * 0.6 + 0.2).g;
  c *= 0.93 + grain * 0.08 + gran * 0.03;
  c *= 0.95 + wash * 0.08;
  // Warm light leak from the top-left.
  c += vec3(1.0, 0.82, 0.55) * 0.08 * smoothstep(1.1, 0.0, length((vUv - vec2(0.0, 1.0)) * vec2(1.2, 1.6)));
  // Pulse: soft glow plus an expanding ring around the focused site.
  vec2 a = vec2(uRes.x / uRes.y, 1.0);
  float pr = length((vUv - uFocusUv) * a);
  float glow = smoothstep(0.9, 0.0, pr) * 0.7 + 0.3;
  float ring = exp(-pow((pr - uPulseR) * 9.0, 2.0));
  c += uPulse.rgb * uPulse.a * (glow * 0.35 + ring * 0.35);
  c = mix(c, vec3(lum(c)) * vec3(0.86, 0.88, 0.95), uDesat);
  // Vignette.
  vec2 q = vUv * 2.0 - 1.0;
  float vig = smoothstep(1.55, 0.55, length(q * vec2(0.85, 1.0)));
  c *= mix(0.78, 1.0, vig);
  c = mix(c, c * vec3(0.95, 0.93, 1.0), (1.0 - vig) * 0.4);
  // Dither against banding.
  c += (fract(sin(dot(gl_FragCoord.xy, vec2(12.9898, 78.233))) * 43758.5453) - 0.5) / 255.0;
  gl_FragColor = vec4(c, 1.0);
}
`;

export class PaintPass {
  constructor(renderer, noiseTex, { samples = 4 } = {}) {
    this.renderer = renderer;
    this.samples = samples;
    this.target = new THREE.WebGLRenderTarget(4, 4, { samples, type: THREE.UnsignedByteType, depthBuffer: true });
    this.uniforms = {
      tScene: { value: this.target.texture },
      uNoise: { value: noiseTex },
      uRes: { value: new THREE.Vector2(4, 4) },
      uTime: { value: 0 },
      uWarmth: { value: 0.5 },
      uPulse: { value: new THREE.Vector4(0, 0, 0, 0) },
      uPulseR: { value: 0 },
      uDesat: { value: 0 },
      uFocusUv: { value: new THREE.Vector2(0.36, 0.58) },
      uBoil: { value: 1 },
    };
    this.material = new THREE.ShaderMaterial({ vertexShader: vert, fragmentShader: frag, uniforms: this.uniforms, depthTest: false, depthWrite: false });
    this.quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), this.material);
    this.quad.frustumCulled = false;
    this.scene = new THREE.Scene();
    this.scene.add(this.quad);
    this.cam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  }

  setSize(w, h) {
    this.target.setSize(w, h);
    this.uniforms.uRes.value.set(w, h);
  }

  setSamples(n) {
    if (n === this.samples) return;
    this.samples = n;
    const { width, height } = this.target;
    this.target.dispose();
    this.target = new THREE.WebGLRenderTarget(width, height, { samples: n, type: THREE.UnsignedByteType, depthBuffer: true });
    this.uniforms.tScene.value = this.target.texture;
  }

  render(scene, camera) {
    const r = this.renderer;
    r.setRenderTarget(this.target);
    r.render(scene, camera);
    r.setRenderTarget(null);
    r.render(this.scene, this.cam);
  }
}
