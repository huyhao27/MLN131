import { bus } from './bus.js';

// Action map: one action, many physical keys.
const KEY_MAP = {
  KeyW: 'up', ArrowUp: 'up',
  KeyS: 'down', ArrowDown: 'down',
  KeyA: 'left', ArrowLeft: 'left',
  KeyD: 'right', ArrowRight: 'right',
  KeyJ: 'attack', KeyX: 'attack',
  Space: 'dodge', KeyK: 'dodge', ShiftLeft: 'dodge',
  KeyE: 'interact',
  Enter: 'start',
  Escape: 'pause', KeyP: 'pause',
};

const MOUSE_MAP = { 0: 'attack', 2: 'dodge' };

// Standard gamepad mapping.
const PAD_MAP = { 0: 'dodge', 1: 'dodge', 2: 'attack', 9: 'pause', 12: 'up', 13: 'down', 14: 'left', 15: 'right' };
const PAD_DEADZONE = 0.2;

class Input {
  constructor() {
    this.held = new Set();
    this.justPressed = new Set();
    this.justReleased = new Set();
    this.lastPressTime = new Map();
    this.time = 0;
    this.enabled = true;
    this.lastDevice = 'keyboard';
    this.padAxis = { x: 0, z: 0 };
    this._padHeld = new Set();
    this._gestured = false;
  }

  attach(target = window) {
    target.addEventListener('keydown', (e) => {
      const action = KEY_MAP[e.code];
      if (!action) return;
      e.preventDefault();
      if (!e.repeat) this._press(action, 'keyboard');
    });
    target.addEventListener('keyup', (e) => {
      const action = KEY_MAP[e.code];
      if (action) this._release(action);
    });
    target.addEventListener('mousedown', (e) => {
      const action = MOUSE_MAP[e.button];
      if (action) this._press(action, 'keyboard');
    });
    target.addEventListener('mouseup', (e) => {
      const action = MOUSE_MAP[e.button];
      if (action) this._release(action);
    });
    target.addEventListener('contextmenu', (e) => e.preventDefault());
    target.addEventListener('blur', () => this.held.clear());
  }

  _press(action, device) {
    this.lastDevice = device;
    if (!this.held.has(action)) this.justPressed.add(action);
    this.held.add(action);
    this.lastPressTime.set(action, this.time);
    this.justPressed.add('any');
    if (!this._gestured) {
      this._gestured = true;
      bus.emit('input:first-gesture');
    }
  }

  _release(action) {
    if (this.held.delete(action)) this.justReleased.add(action);
  }

  // Called once per frame before systems update.
  poll(realDt) {
    this.time += realDt;
    const pad = navigator.getGamepads?.().find((p) => p && p.connected);
    if (!pad) { this.padAxis.x = this.padAxis.z = 0; return; }

    const ax = pad.axes[0] ?? 0, az = pad.axes[1] ?? 0;
    const mag = Math.hypot(ax, az);
    if (mag > PAD_DEADZONE) {
      const k = (mag - PAD_DEADZONE) / (1 - PAD_DEADZONE) / mag;
      this.padAxis.x = ax * k; this.padAxis.z = az * k;
      this.lastDevice = 'pad';
    } else {
      this.padAxis.x = this.padAxis.z = 0;
    }

    for (const [index, action] of Object.entries(PAD_MAP)) {
      const pressed = pad.buttons[index]?.pressed;
      const key = `${action}:${index}`;
      if (pressed && !this._padHeld.has(key)) { this._padHeld.add(key); this._press(action, 'pad'); }
      else if (!pressed && this._padHeld.has(key)) { this._padHeld.delete(key); this._release(action); }
    }
  }

  // Called once per frame after rendering.
  endFrame() {
    this.justPressed.clear();
    this.justReleased.clear();
  }

  down(action) { return this.enabled && this.held.has(action); }
  pressed(action) { return this.enabled && this.justPressed.has(action); }
  released(action) { return this.enabled && this.justReleased.has(action); }

  // True if the action was pressed within `window` seconds; consumes the press.
  buffered(action, window = 0.14) {
    if (!this.enabled) return false;
    const t = this.lastPressTime.get(action);
    if (t === undefined || this.time - t > window) return false;
    this.lastPressTime.delete(action);
    return true;
  }

  // Normalized movement on the XZ plane (screen up = -z).
  move() {
    if (!this.enabled) return { x: 0, z: 0, mag: 0 };
    let x = this.padAxis.x, z = this.padAxis.z;
    if (x === 0 && z === 0) {
      x = (this.held.has('right') ? 1 : 0) - (this.held.has('left') ? 1 : 0);
      z = (this.held.has('down') ? 1 : 0) - (this.held.has('up') ? 1 : 0);
    }
    const mag = Math.hypot(x, z);
    if (mag > 1) { x /= mag; z /= mag; }
    return { x, z, mag: Math.min(1, mag) };
  }
}

export const input = new Input();
