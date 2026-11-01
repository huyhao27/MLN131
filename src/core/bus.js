// Synchronous pub/sub. Gameplay emits; audio, UI and VFX listen.
const listeners = new Map();

export const bus = {
  on(type, fn) {
    let set = listeners.get(type);
    if (!set) listeners.set(type, (set = new Set()));
    set.add(fn);
    return () => set.delete(fn);
  },
  once(type, fn) {
    const off = bus.on(type, (payload) => { off(); fn(payload); });
    return off;
  },
  off(type, fn) {
    listeners.get(type)?.delete(fn);
  },
  emit(type, payload = {}) {
    const set = listeners.get(type);
    if (!set) return;
    // Copy so a listener can unsubscribe itself while running.
    for (const fn of [...set]) {
      try { fn(payload); } catch (err) { console.warn(`[bus] ${type}`, err); }
    }
  },
};
