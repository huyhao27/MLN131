// Integration entry. Each module is owned by its own team (see ARCHITECTURE.md);
// this file only wires sim -> ui + world.
import { bus } from './core/bus.js';

async function boot() {
  const params = new URLSearchParams(location.search);
  const seed = Number(params.get('seed')) || 2026;

  const { createGame } = await import('./sim/index.js');
  const { createUI } = await import('./ui/index.js');
  const { createDiorama } = await import('./world/index.js');

  const world = createDiorama(document.getElementById('world'));
  world.bindBus?.(bus);

  const game = createGame({ seed, randomEvents: params.get('random') !== '0' });
  const ui = createUI(document.getElementById('ui'), {
    onAct: (id) => ui.render(game.act(id)),
    onUndo: () => ui.render(game.undo()),
  });
  ui.render(game.view());
  world.setState({ ...game.state, year: game.state.year });
  world.focus(game.view().site, { instant: true });

  window.__game = game; // playtest hook
}

boot();
