import * as THREE from 'three';
import { makeRng } from '../core/rng.js';
import { makeCanvas } from './paint.js';
import { SPRITES } from './sprites.js';

const PAD = 6;
const DEFAULT_S = 20; // px per world unit

// Paint every sprite, shelf-pack into one atlas, plus a half-res emission atlas (lit windows).
export function buildAtlas({ scale = 1, width = 2048 } = {}) {
  const items = [];
  for (const [key, def] of Object.entries(SPRITES)) {
    const s = (def.s ?? DEFAULT_S) * scale;
    const cw = Math.ceil(def.w * s), ch = Math.ceil(def.h * s);
    const color = makeCanvas(cw, ch), emit = makeCanvas(cw, ch);
    const p = { ctx: color.getContext('2d'), emit: emit.getContext('2d'), W: def.w, H: def.h, s, rng: makeRng('sprite:' + key) };
    try {
      def.paint(p);
    } catch (err) {
      console.warn('[world] sprite failed', key, err);
    }
    items.push({ key, def, color, emit, w: cw, h: ch });
  }

  // Shelf packing, tallest first.
  const order = [...items].sort((a, b) => b.h - a.h);
  let x = PAD, y = PAD, shelf = 0;
  for (const it of order) {
    if (it.w + PAD * 2 > width) throw new Error(`[world] sprite ${it.key} wider than atlas`);
    if (x + it.w + PAD > width) {
      x = PAD;
      y += shelf + PAD;
      shelf = 0;
    }
    it.x = x;
    it.y = y;
    x += it.w + PAD;
    shelf = Math.max(shelf, it.h);
  }
  const height = Math.ceil((y + shelf + PAD) / 128) * 128;

  const atlas = makeCanvas(width, height);
  const emitAtlas = makeCanvas(width / 2, height / 2);
  const actx = atlas.getContext('2d'), ectx = emitAtlas.getContext('2d');
  ectx.fillStyle = '#000';
  ectx.fillRect(0, 0, width / 2, height / 2);
  ectx.globalCompositeOperation = 'lighter';
  const rects = {};
  for (const it of items) {
    actx.drawImage(it.color, it.x, it.y);
    ectx.drawImage(it.emit, it.x / 2, it.y / 2, it.w / 2, it.h / 2);
    rects[it.key] = {
      uv: [it.x / width, 1 - (it.y + it.h) / height, (it.x + it.w) / width, 1 - it.y / height],
      def: it.def,
    };
  }

  const tex = new THREE.CanvasTexture(atlas);
  tex.premultiplyAlpha = true;
  tex.anisotropy = 4;
  tex.minFilter = THREE.LinearMipmapLinearFilter;
  tex.generateMipmaps = true;
  const etex = new THREE.CanvasTexture(emitAtlas);
  etex.generateMipmaps = true;
  return { texture: tex, emitTexture: etex, rects, width, height };
}
