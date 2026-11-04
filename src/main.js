// Integration entry. Each module is owned by its own team (see ARCHITECTURE.md and
// ARCHITECTURE_REGIONS.md); this file only wires sim -> ui + world.
//   /                 region mode (default, doc 04/05)
//   /?mode=classic    the 8-year presentation mode
import { bus } from './core/bus.js';

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

async function bootClassic(params, world) {
  const { createGame } = await import('./sim/index.js');
  const { createUI } = await import('./ui/index.js');
  world?.setMode?.('classic');
  world?.bindBus?.(bus);
  // Light flourish on outcomes: net metric change decides the mood.
  bus.on('sim:view', ({ view }) => {
    if (!world || (view.phase !== 'result' && view.phase !== 'randomResult')) return;
    const net = Object.values(view.deltas ?? {}).reduce((a, b) => a + b, 0);
    world.pulse(net > 4 ? 'good' : net < -4 ? 'bad' : 'neutral');
  });

  const seed = Number(params.get('seed')) || 2026;
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

async function bootRegions(params, world) {
  const { createRegionGame } = await import('./regions/index.js');
  const { createRegionUI } = await import('./ui/regions/index.js');
  const seed = Number(params.get('seed')) || 2026;
  const saveKey = 'mln133:regions:v1:' + seed;
  let savedState;
  try { savedState = JSON.parse(localStorage.getItem(saveKey)); }
  catch { /* Storage may be unavailable or contain an invalid save. */ }
  const game = createRegionGame({ seed, bus, savedState });
  function save() {
    try { localStorage.setItem(saveKey, JSON.stringify(game.state)); }
    catch (err) { console.warn('Không lưu được ván chơi', err); }
  }

  world?.setMode?.('regions');
  world?.bindBus?.(bus);

  let view = game.view();
  let selected = null;
  const render = (v) => {
    view = v;
    ui.render(v);
    world?.setRegions?.(v.regions);
    if (v.phase === 'end') world?.selectRegion?.(null);
  };
  const select = (id) => {
    selected = id;
    ui.select(id);
    world?.selectRegion?.(id);
    if (!id) world?.showLinks?.([]);
  };

  const ui = createRegionUI(document.getElementById('ui'), {
    onAction: (action) => {
      const before = view;
      const next = game.act(action);
      save();
      render(next);
      if (action.type === 'endPeriod' || action.type === 'restart') {
        world?.showLinks?.([]);
        if (action.type === 'restart') select(null);
      }
      if (action.type === 'choose') {
        const p = before.problems.find((x) => x.instanceId === action.problem);
        world?.pulse?.(p?.origin === 'opportunity' ? 'good' : 'neutral');
      }
    },
    onSelect: (id) => select(id),
    onHover: (id) => world?.hoverRegion?.(id),
    onFocusProblem: (p) => world?.showLinks?.(p ? p.links : []),
    onUndo: () => { const next = game.undo(); save(); render(next); },
  });

  // World -> UI: region picking and label anchors.
  bus.on('world:pick', ({ region }) => { if (view.phase === 'period') select(region ?? null); });
  bus.on('world:hover', ({ region }) => ui.hover(region ?? null));
  world?.onFrame?.((anchors) => ui.setAnchors(anchors));

  render(view);
  world?.selectRegion?.(null);
  window.__game = game; // playtest hook
  window.__ui = { select, get selected() { return selected; } };
}

async function boot() {
  const params = new URLSearchParams(location.search);
  const world = await loadWorld(document.getElementById('world'));
  if (params.get('mode') === 'classic') await bootClassic(params, world);
  else await bootRegions(params, world);
}

boot();
