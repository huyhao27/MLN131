import * as THREE from 'three';
import { Engine, ORDER } from './core/engine.js';
import { input } from './core/input.js';
import { bus } from './core/bus.js';
import { U } from './core/uniforms.js';

const CAMERA = { pitch: THREE.MathUtils.degToRad(52), distance: 60, follow: 3 };

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
    world: null,
    player: null,
  };
}

// Placeholder ground until step 2 brings the real shader.
function createTestWorld(game) {
  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(200, 200),
    new THREE.MeshBasicMaterial({ color: 0x3c5a3a }),
  );
  ground.rotation.x = -Math.PI / 2;
  game.scene.add(ground);

  const grid = new THREE.GridHelper(200, 40, 0x15201c, 0x2f4a30);
  grid.position.y = 0.01;
  game.scene.add(grid);

  return { name: 'world', ground, update() {} };
}

// Placeholder capsule player: moves, dodges, and fires a hitstop on attack.
function createTestPlayer(game) {
  const mesh = new THREE.Mesh(
    new THREE.CapsuleGeometry(0.45, 1, 4, 12),
    new THREE.MeshBasicMaterial({ color: 0xe5452c }),
  );
  mesh.position.y = 0.95;
  game.scene.add(mesh);

  const player = {
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
        bus.emit('player:attack', { x: this.position.x, z: this.position.z });
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
  return player;
}

// Fixed-pitch follow camera, no yaw. Runs on real time so it keeps moving during hitstop.
function createCameraRig(game) {
  const look = new THREE.Vector3();
  return {
    name: 'camera',
    update(dt, time, realDt) {
      const target = game.player?.position;
      if (target) {
        const k = 1 - Math.exp(-CAMERA.follow * realDt);
        look.x += (target.x - look.x) * k;
        look.z += (target.z - look.z) * k;
      }
      const d = CAMERA.distance;
      game.camera.position.set(look.x, Math.sin(CAMERA.pitch) * d, look.z + Math.cos(CAMERA.pitch) * d);
      game.camera.rotation.set(-CAMERA.pitch, 0, 0);
      U.uFocusPos.value.copy(look);
      U.uFocusDist.value = d;
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
        `pos ${p.x.toFixed(1)}, ${p.z.toFixed(1)}  held [${[...input.held].join(' ')}]\n` +
        `WASD move · Space dodge · J attack (hitstop)`;
    },
  };
}

function boot() {
  const game = createGame(document.getElementById('game'));
  window.game = game;
  input.attach(window);

  try { game.world = game.engine.add(createTestWorld(game), ORDER.world); }
  catch (err) { console.error('[boot] world failed to load', err); }
  try { game.player = game.engine.add(createTestPlayer(game), ORDER.player); }
  catch (err) { console.error('[boot] player failed to load', err); }
  game.engine.add(createCameraRig(game), ORDER.camera);
  game.engine.add(createDebugOverlay(game), ORDER.presentation);

  bus.on('player:attack', (e) => console.info('[game] attack at', e.x.toFixed(1), e.z.toFixed(1)));

  game.engine.start();
  bus.emit('game:start');
  console.info('[boot] ready');
}

boot();
