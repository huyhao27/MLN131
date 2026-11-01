import * as THREE from 'three';
import { Engine, ORDER } from './core/engine.js';
import { input } from './core/input.js';
import { bus } from './core/bus.js';
import { U } from './core/uniforms.js';
import { CameraRig } from './camera/rig.js';
import { bakeNoiseTexture } from './render/noiseTexture.js';
import { createGround } from './world/ground.js';

function createGame(canvas) {
  const engine = new Engine(canvas);
  return {
    engine,
    scene: engine.scene,
    camera: engine.camera,
    renderer: engine.renderer,
    input,
    bus,
    U,
    rig: null,
    world: null,
    player: null,
  };
}

// Placeholder capsule player: moves and dodges.
function createTestPlayer(game) {
  const mesh = new THREE.Mesh(
    new THREE.CapsuleGeometry(0.45, 1, 4, 12),
    new THREE.MeshBasicMaterial({ color: 0xe5452c }),
  );
  mesh.position.y = 0.95;
  game.scene.add(mesh);

  return {
    name: 'player',
    position: mesh.position,
    velocity: new THREE.Vector3(),
    speed: 7,
    dodgeTimer: 0,
    update(dt) {
      const m = input.move();
      if (this.dodgeTimer <= 0 && input.buffered('dodge', 0.16) && m.mag > 0) {
        this.dodgeTimer = 0.3;
        bus.emit('player:dodge', { x: m.x, z: m.z });
      }
      if (input.buffered('attack', 0.24)) {
        game.engine.hitstop(0.08);
        game.rig.shake(0.35);
        bus.emit('player:action', { x: this.position.x, z: this.position.z });
      }
      const speed = this.dodgeTimer > 0 ? this.speed * 2.6 : this.speed;
      this.dodgeTimer -= dt;
      const k = 1 - Math.exp(-26 * dt);
      this.velocity.x += (m.x * speed - this.velocity.x) * k;
      this.velocity.z += (m.z * speed - this.velocity.z) * k;
      this.position.x += this.velocity.x * dt;
      this.position.z += this.velocity.z * dt;
    },
  };
}

function createDebugOverlay(game) {
  const el = document.getElementById('debug');
  let acc = 0;
  return {
    name: 'debug',
    update(dt, time, realDt) {
      acc += realDt;
      if (acc < 0.25) return;
      acc = 0;
      const p = game.player.position;
      el.textContent =
        `fps ${game.engine.fps.toFixed(0)}  time ${time.toFixed(1)}s\n` +
        `pos ${p.x.toFixed(1)}, ${p.z.toFixed(1)}\n` +
        `WASD move · Space dodge · J action · 1/2/3/4 camera shot`;
    },
  };
}

// Number keys switch camera shots, to show tweened framing.
function bindShotKeys(game) {
  const shots = { Digit1: 'explore', Digit2: 'close', Digit3: 'vista', Digit4: 'title' };
  window.addEventListener('keydown', (e) => {
    if (shots[e.code]) game.rig.setShot(shots[e.code], 1.4);
  });
}

function boot() {
  const game = createGame(document.getElementById('game'));
  window.game = game;
  input.attach(window);

  U.uwNoise.value = bakeNoiseTexture();
  game.renderer.setClearColor(U.uFogColor.value);

  game.rig = game.engine.add(new CameraRig(game.camera), ORDER.camera);

  try { game.scene.add(createGround()); }
  catch (err) { console.error('[boot] ground failed to load', err); }
  try { game.player = game.engine.add(createTestPlayer(game), ORDER.player); }
  catch (err) { console.error('[boot] player failed to load', err); }

  game.rig.target = game.player;
  game.rig.cut('explore');
  game.engine.add(createDebugOverlay(game), ORDER.presentation);
  bindShotKeys(game);

  game.engine.start();
  bus.emit('game:start');
  console.info('[boot] ready');
}

boot();
