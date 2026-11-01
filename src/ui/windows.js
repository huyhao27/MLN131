// Lightweight window frames for the overlay panels: drag by the title bar, resize from
// edges/corners, collapse to a title chip, reset layout. Default placement stays in CSS;
// once the user moves/resizes a window it gets inline left/top/width(/height), stored as
// fractions of the overlay so the layout survives a projector resolution change.
import { storageGet, storageSet } from './util.js';

const STORE_KEY = 'tt.layout';
const DRAG_THRESHOLD = 4; // px before a press on the bar counts as a drag
const EDGES = ['n', 's', 'e', 'w', 'ne', 'nw', 'se', 'sw'];

function loadLayout() {
  try { return JSON.parse(storageGet(STORE_KEY) || '{}') || {}; } catch { return {}; }
}

export function createWindowManager(uiEl, { onLayoutChange = () => {} } = {}) {
  const wins = new Map(); // id -> { el, bar, opts, rect|null, collapsed }
  let saved = loadLayout();
  let zTop = 10;
  let suppressClickUntil = 0;

  const em = () => parseFloat(getComputedStyle(uiEl).fontSize) || 16;
  const bounds = () => ({ W: uiEl.clientWidth, H: uiEl.clientHeight, m: Math.round(em() * 0.4) });

  function persist() {
    const out = {};
    for (const [id, w] of wins) {
      if (!w.rect && !w.collapsed) continue;
      const { W, H } = bounds();
      out[id] = { c: w.collapsed ? 1 : 0 };
      if (w.rect) Object.assign(out[id], { x: w.rect.x / W, y: w.rect.y / H, w: w.rect.w / W, h: w.rect.h == null ? null : w.rect.h / H });
    }
    saved = out;
    storageSet(STORE_KEY, JSON.stringify(out));
    uiEl.classList.toggle('has-layout', Object.keys(out).length > 0);
    onLayoutChange();
  }

  function limits(w) {
    const e = em();
    const { W, H, m } = bounds();
    return {
      minW: Math.min(w.opts.minW * e, W - 2 * m), minH: Math.min(w.opts.minH * e, H - 2 * m),
      maxW: W - 2 * m, maxH: H - 2 * m, W, H, m,
    };
  }

  // Clamp size then position so the whole window stays inside the overlay.
  function clampRect(w, r) {
    const L = limits(w);
    const out = { ...r };
    out.w = Math.max(L.minW, Math.min(L.maxW, out.w));
    if (out.h != null) out.h = Math.max(L.minH, Math.min(L.maxH, out.h));
    const h = out.h ?? Math.min(w.el.offsetHeight, L.maxH);
    out.x = Math.max(L.m, Math.min(L.W - L.m - out.w, out.x));
    out.y = Math.max(L.m, Math.min(L.H - L.m - h, out.y));
    return out;
  }

  function apply(w) {
    const s = w.el.style;
    w.el.classList.toggle('is-collapsed', w.collapsed);
    w.collapseBtn.textContent = w.collapsed ? '+' : '–';
    w.collapseBtn.title = w.collapsed ? 'Mở rộng' : 'Thu gọn';
    if (!w.rect) {
      for (const p of ['left', 'top', 'right', 'bottom', 'width', 'height', 'maxHeight']) s[p] = '';
      w.el.classList.remove('is-placed');
      return;
    }
    const { H, m } = bounds();
    w.el.classList.add('is-placed');
    s.left = `${w.rect.x}px`; s.top = `${w.rect.y}px`;
    s.right = 'auto'; s.bottom = 'auto';
    s.width = `${w.rect.w}px`;
    s.height = w.rect.h == null ? '' : `${w.rect.h}px`;
    s.maxHeight = `${H - m - w.rect.y}px`;
  }

  function currentRect(w) {
    const u = uiEl.getBoundingClientRect();
    const r = w.el.getBoundingClientRect();
    return { x: r.left - u.left, y: r.top - u.top, w: r.width, h: w.rect?.h ?? null };
  }

  function front(w) {
    w.el.style.zIndex = String(++zTop);
  }

  function setCollapsed(w, on, { save = true } = {}) {
    if (w.collapsed === on) return;
    w.collapsed = on;
    apply(w);
    if (w.rect) { w.rect = clampRect(w, w.rect); apply(w); }
    if (save) persist();
  }

  // ---------- pointer handling ----------

  function startGesture(w, e, mode) {
    if (e.button !== 0) return;
    e.preventDefault();
    e.stopPropagation();
    const start = { x: e.clientX, y: e.clientY };
    const base = currentRect(w);
    if (mode !== 'move' && base.h == null) base.h = w.el.getBoundingClientRect().height;
    let active = mode !== 'move';
    const target = e.currentTarget;
    try { target.setPointerCapture(e.pointerId); } catch { /* synthetic event */ }
    front(w);
    if (active) uiEl.classList.add('is-gesturing');

    const onMove = (ev) => {
      const dx = ev.clientX - start.x;
      const dy = ev.clientY - start.y;
      if (!active) {
        if (Math.hypot(dx, dy) < DRAG_THRESHOLD) return;
        active = true;
        uiEl.classList.add('is-gesturing');
      }
      const r = { ...base };
      if (mode === 'move') { r.x += dx; r.y += dy; }
      else {
        const L = limits(w);
        if (mode.includes('e')) r.w = base.w + dx;
        if (mode.includes('s')) r.h = base.h + dy;
        if (mode.includes('w')) { r.w = Math.max(L.minW, Math.min(L.maxW, base.w - dx)); r.x = base.x + base.w - r.w; }
        if (mode.includes('n')) { r.h = Math.max(L.minH, Math.min(L.maxH, base.h - dy)); r.y = base.y + base.h - r.h; }
      }
      w.rect = clampRect(w, r);
      apply(w);
    };
    const onUp = () => {
      target.removeEventListener('pointermove', onMove);
      target.removeEventListener('pointerup', onUp);
      target.removeEventListener('pointercancel', onUp);
      uiEl.classList.remove('is-gesturing');
      if (active) {
        suppressClickUntil = performance.now() + 300;
        persist();
      }
    };
    target.addEventListener('pointermove', onMove);
    target.addEventListener('pointerup', onUp);
    target.addEventListener('pointercancel', onUp);
  }

  function register(el, { id, title = '', minW = 16, minH = 6 } = {}) {
    el.classList.add('tt-win');
    el.dataset.win = id;
    const bar = document.createElement('div');
    bar.className = 'tt-win-bar';
    bar.innerHTML = `
      <span class="tt-win-grip" aria-hidden="true"></span>
      <span class="tt-win-title"></span>
      <button type="button" class="tt-win-btn" data-win-act="reset" title="Đặt lại bố cục (L)" aria-label="Đặt lại bố cục">⟲</button>
      <button type="button" class="tt-win-btn" data-win-act="collapse"></button>`;
    const body = document.createElement('div');
    body.className = 'tt-win-body';
    while (el.firstChild) body.appendChild(el.firstChild);
    el.append(bar, body);
    for (const edge of EDGES) {
      const h = document.createElement('span');
      h.className = `tt-win-rz is-${edge}`;
      h.dataset.edge = edge;
      el.appendChild(h);
    }
    const w = { id, el, bar, body, opts: { minW, minH }, rect: null, collapsed: false, collapseBtn: bar.querySelector('[data-win-act="collapse"]') };
    wins.set(id, w);
    w.bar.querySelector('.tt-win-title').textContent = title;

    bar.addEventListener('pointerdown', (e) => {
      if (e.target.closest('button')) return;
      startGesture(w, e, 'move');
    });
    bar.addEventListener('dblclick', (e) => {
      if (e.target.closest('button')) return;
      setCollapsed(w, !w.collapsed);
    });
    bar.addEventListener('click', (e) => {
      const b = e.target.closest('[data-win-act]');
      if (!b) return;
      b.blur();
      if (b.dataset.winAct === 'collapse') setCollapsed(w, !w.collapsed);
      else resetAll();
    });
    el.addEventListener('pointerdown', (e) => {
      const h = e.target.closest('.tt-win-rz');
      if (h && h.parentElement === el) startGesture(w, e, h.dataset.edge);
      else front(w);
    });

    // Content height changes (new card, warning line) must not push a placed window off-screen.
    new ResizeObserver(() => {
      if (!w.rect || uiEl.classList.contains('is-gesturing')) return;
      const r = clampRect(w, w.rect);
      if (r.x !== w.rect.x || r.y !== w.rect.y || r.w !== w.rect.w || r.h !== w.rect.h) { w.rect = r; apply(w); }
    }).observe(el);

    restore(w);
    return w;
  }

  function restore(w) {
    const s = saved[w.id];
    w.collapsed = !!s?.c;
    w.rect = null;
    if (s && s.x != null) {
      const { W, H } = bounds();
      w.rect = { x: s.x * W, y: s.y * H, w: s.w * W, h: s.h == null ? null : s.h * H };
    }
    apply(w);
    if (w.rect && w.el.offsetParent) { w.rect = clampRect(w, w.rect); apply(w); }
  }

  function resetAll() {
    saved = {};
    for (const w of wins.values()) { w.rect = null; w.collapsed = false; w.el.style.zIndex = ''; apply(w); }
    persist();
  }

  // Re-derive pixel rects from the stored fractions so the layout scales with the viewport.
  window.addEventListener('resize', () => {
    for (const w of wins.values()) restore(w);
  });

  uiEl.classList.toggle('has-layout', Object.keys(saved).length > 0);

  return {
    register,
    resetAll,
    setTitle(id, text) {
      const w = wins.get(id);
      if (w) w.bar.querySelector('.tt-win-title').textContent = text;
    },
    expand(id) {
      const w = wins.get(id);
      if (w) setCollapsed(w, false);
    },
    // A window that just became visible (display:none before) needs its stored rect clamped.
    refresh(id) {
      const w = wins.get(id);
      if (w) restore(w);
    },
    body: (id) => wins.get(id)?.body,
    // True right after a drag/resize, so the release never counts as a click on content.
    suppressClick: () => performance.now() < suppressClickUntil,
  };
}
