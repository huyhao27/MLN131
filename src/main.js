// Integration entry. Each module is owned by its own team (see ARCHITECTURE.md);
// this file only wires sim -> ui + world.
import { bus } from './core/bus.js';
import { createGame } from './sim/index.js';
import { createUI } from './ui/index.js';

// Glob so the game still runs (UI over a plain background) if the world module fails.
const worldModules = import.meta.glob('./world/index.js');

async function loadWorld(canvas) {
  const load = worldModules['./world/index.js'];
  if (!load) return null;
  try {
    const { createDiorama } = await load();
    return createDiorama(canvas);
  } catch (err) {
    console.error('[main] diorama failed, continuing without it', err);
    return null;
  }
}

async function boot() {
  const params = new URLSearchParams(location.search);
  const seed = Number(params.get('seed')) || 2026;

  const world = await loadWorld(document.getElementById('world'));
  world?.bindBus?.(bus);

  const game = createGame({ seed, bus, randomEvents: params.get('random') !== '0' });
  const ui = createUI(document.getElementById('ui'), {
    onAct: (id) => ui.render(game.act(id)),
    onUndo: () => ui.render(game.undo()),
    onToggleRandom: () => {
      const on = game.toggleRandomEvents();
      ui.render(game.view());
      return on;
    },
  });

  ui.render(game.view());
  world?.focus?.(game.view().site, { instant: true });
  game.sync?.();

  window.__game = game; // playtest hook
}

boot();
