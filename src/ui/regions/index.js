// Region-mode UI overlay (ARCHITECTURE_REGIONS.md, "Hợp đồng UI vùng").
//   const ui = createRegionUI(rootEl, { onAction, onSelect, onHover, onFocusProblem, onUndo });
//   ui.render(view); ui.setAnchors(anchors); ui.select(id|null); ui.hover(id|null);
// Reads RegionView objects only; never computes game rules. Selecting a region or
// opening a problem is UI state, not a sim action.
import './regions.css';
import { createLabels } from './labels.js';
import { renderTop, renderNews, pendingWarnings } from './hud.js';
import { renderRegion, renderProblem } from './panel.js';
import { renderBriefing, renderEnd } from './screens.js';
import { openChallenge } from './challenge.js';
import { REGION_ORDER, regionMeta } from './text.js';

const OPTION_KEYS = ['a', 'b', 'c', 'd'];
const OPEN_GUARD_MS = 350; // ignore A/B/C right after a problem opens
const CHOOSE_GUARD_MS = 700; // ignore a second choice right after one
const ACT_RELEASE_MS = 1500; // unlock even if the integrator never re-renders

export function createRegionUI(rootEl, {
  onAction = () => {}, onSelect = () => {}, onHover = () => {}, onFocusProblem = () => {}, onUndo,
} = {}) {
  const testMode = new URLSearchParams(location.search).get('test') === '1';
  const st = {
    view: null,
    selected: null,
    problem: null, // instanceId of the open problem
    focused: null, // problem object last sent to onFocusProblem
    hover: null,
    confirm: false,
    newsOpen: false,
    panelMin: false, // drawer collapsed to its header
    acting: false,
    openedAt: 0,
    choseAt: 0,
    shownAt: 0,
  };

  rootEl.classList.add('rg-root');
  rootEl.innerHTML = `
    <div class="rg-ui" data-phase="">
      <div class="rg-labels" aria-label="Các vùng trên bản đồ"></div>
      <header class="rg-top" hidden></header>
      <section class="rg-news" aria-label="Tin tức kỳ này" aria-live="polite"></section>
      <p class="rg-keyhint"><kbd>1</kbd>–<kbd>6</kbd> chọn vùng · <kbd>Tab</kbd> vùng kế · <kbd>N</kbd> sang kỳ · <kbd>F</kbd> toàn màn hình</p>
      <aside class="rg-panel" aria-label="Bảng vùng" hidden></aside>
      <div class="rg-overlay"></div>
      <div class="rg-toasts" aria-live="polite"></div>
    </div>`;
  const ui = rootEl.querySelector('.rg-ui');
  const topEl = ui.querySelector('.rg-top');
  const newsEl = ui.querySelector('.rg-news');
  const panelEl = ui.querySelector('.rg-panel');
  const overlayEl = ui.querySelector('.rg-overlay');
  const toasts = ui.querySelector('.rg-toasts');
  const keyhintEl = ui.querySelector('.rg-keyhint');

  const labels = createLabels(ui.querySelector('.rg-labels'), {
    onHover: (id) => setHover(id, true),
    onSelect: (id) => { if (st.view?.phase === 'period') select(id === st.selected && !st.problem ? null : id); },
    onOpenProblem: (pid) => openProblem(pid),
  });

  // ---------- helpers ----------
  const findProblem = (id) => st.view?.problems?.find((p) => p.instanceId === id) ?? null;
  const isPeriod = () => st.view?.phase === 'period';

  function toast(text, tone = '') {
    const last = toasts.lastElementChild;
    if (last && last.textContent === text && !last.classList.contains('is-out')) return;
    const t = document.createElement('div');
    t.className = `rg-toast ${tone}`;
    t.textContent = text;
    toasts.appendChild(t);
    while (toasts.children.length > 3) toasts.firstElementChild.remove();
    setTimeout(() => t.classList.add('is-out'), 2200);
    setTimeout(() => t.remove(), 2700);
  }

  function focusProblem(p) {
    const prev = st.focused;
    st.focused = p;
    if (prev !== p) {
      try { onFocusProblem(p); } catch (err) { console.error('[ui-regions] onFocusProblem failed', err); }
    }
  }

  // UI boxes the labels must keep clear of (CSS px in the .rg-ui frame). Read only on
  // render / resize / toggles, never per frame.
  function boxOf(el) {
    if (!el || el.hidden || !el.isConnected) return null;
    const r = el.getBoundingClientRect();
    if (!r.width || !r.height) return null;
    const o = ui.getBoundingClientRect();
    return { x: r.left - o.left, y: r.top - o.top, w: r.width, h: r.height };
  }
  function updateSafe() {
    const hudBox = boxOf(topEl.querySelector('.rg-hud'));
    const nextBox = boxOf(topEl.querySelector('.rg-next'));
    const topBottom = Math.max(hudBox ? hudBox.y + hudBox.h : 0, nextBox ? nextBox.y + nextBox.h : 0);
    ui.style.setProperty('--top-h', `${Math.round(topBottom || 0)}px`);
    const rects = [hudBox, nextBox, boxOf(topEl.querySelector('.rg-confirm')), boxOf(newsEl.firstElementChild ? newsEl : null), boxOf(keyhintEl)];
    const hide = [];
    if (!panelEl.hidden) {
      // Offsets, not the bounding box: the panel may be mid slide-in animation.
      const pb = { x: panelEl.offsetLeft, y: panelEl.offsetTop, w: panelEl.offsetWidth, h: panelEl.offsetHeight };
      rects.push(pb);
      if (!st.panelMin) hide.push(pb);
      ui.style.setProperty('--panel-px', `${pb.w}px`);
    }
    ui.classList.toggle('is-panel-min', !panelEl.hidden && st.panelMin);
    labels.setSafe({ top: 0, rects: rects.filter(Boolean), hide });
  }

  // ---------- rendering ----------
  function renderTopBar() {
    if (!isPeriod()) { topEl.hidden = true; topEl.innerHTML = ''; return; }
    topEl.hidden = false;
    topEl.innerHTML = renderTop(st.view, { confirmOpen: st.confirm, testMode });
    ui.classList.toggle('has-confirm', st.confirm);
    updateSafe();
  }

  function renderNewsStrip() {
    newsEl.innerHTML = isPeriod() ? renderNews(st.view, { expanded: st.newsOpen }) : '';
    newsEl.classList.toggle('is-open', st.newsOpen);
    updateSafe();
  }

  function renderPanel({ animate = false, keepScroll = true } = {}) {
    const wasHidden = panelEl.hidden;
    const key = `${st.selected}|${st.problem}`;
    const sameTarget = panelEl.dataset.key === key;
    const scroll = keepScroll && sameTarget ? panelEl.querySelector('[data-scroll]')?.scrollTop ?? 0 : 0;
    if (!isPeriod() || !st.selected) {
      panelEl.hidden = true;
      panelEl.innerHTML = '';
      panelEl.dataset.key = '';
      ui.classList.remove('has-panel');
      updateSafe();
      return;
    }
    const p = st.problem ? findProblem(st.problem) : null;
    panelEl.innerHTML = p ? renderProblem(st.view, p) : renderRegion(st.view, st.selected);
    panelEl.dataset.key = key;
    panelEl.setAttribute('aria-label', p ? `Vấn đề: ${p.title}` : `Vùng ${regionMeta(st.view, st.selected).name}`);
    panelEl.hidden = false;
    panelEl.classList.toggle('is-min', st.panelMin);
    panelEl.querySelector('[data-action="panel-min"]')?.setAttribute('aria-expanded', String(!st.panelMin));
    ui.classList.add('has-panel');
    const sc = panelEl.querySelector('[data-scroll]');
    if (sc) sc.scrollTop = scroll;
    if ((animate || wasHidden) && !sameTarget) {
      panelEl.classList.remove('is-enter'); void panelEl.offsetWidth; panelEl.classList.add('is-enter');
    }
    updateSafe();
  }

  function renderOverlay() {
    const v = st.view;
    if (v.phase === 'briefing') overlayEl.innerHTML = renderBriefing(v);
    else if (v.phase === 'end') overlayEl.innerHTML = renderEnd(v);
    else overlayEl.innerHTML = '';
  }

  function render(view) {
    if (!view) return;
    const prev = st.view;
    st.view = view;
    st.acting = false;
    ui.dataset.phase = view.phase;
    ui.classList.toggle('is-first', view.phase === 'period' && view.period <= 1);
    const phaseChanged = !prev || prev.phase !== view.phase;
    const periodChanged = !prev || prev.period !== view.period;

    if (view.phase !== 'period') {
      if (st.selected) { st.selected = null; safeCall(onSelect, null); }
      st.problem = null; st.confirm = false;
      focusProblem(null);
    } else {
      if (periodChanged) { st.confirm = false; st.newsOpen = false; }
      if (st.selected && !view.regions?.some((r) => r.id === st.selected)) { st.selected = null; st.problem = null; safeCall(onSelect, null); }
      if (st.problem) {
        const p = findProblem(st.problem);
        if (!p) {
          // Resolved or closed by the sim: fall back to the region view.
          st.problem = null;
          focusProblem(null);
        } else {
          focusProblem(p); // fresh object (status/links may have changed)
        }
      }
      if (prev?.phase === 'period' && periodChanged) toast(`Bắt đầu kỳ ${view.period}/${view.totalPeriods}`);
    }

    renderTopBar();
    renderNewsStrip();
    labels.setVisible(view.phase !== 'end');
    labels.setSelected(st.selected);
    labels.update(view);
    if (phaseChanged || view.phase !== 'period') renderOverlay();
    renderPanel();
    if (phaseChanged) {
      st.shownAt = performance.now();
      if (view.phase === 'briefing' || view.phase === 'end') {
        requestAnimationFrame(() => overlayEl.querySelector('[data-action="start"], .rg-end-title')?.focus?.({ preventScroll: true }));
      }
    }
  }

  function safeCall(fn, ...args) {
    try { fn(...args); } catch (err) { console.error('[ui-regions] callback failed', err); }
  }

  // ---------- state changes ----------
  function select(id, { problem = null } = {}) {
    if (!isPeriod()) return;
    if (id != null && !REGION_ORDER.includes(id) && !st.view.regions?.some((r) => r.id === id)) return;
    const prevSel = st.selected;
    const prevProb = st.problem;
    st.selected = id ?? null;
    st.problem = id ? problem : null;
    st.confirm = false;
    // A new target re-opens a collapsed drawer; closing it resets.
    if (!id || st.problem !== prevProb || id !== prevSel) st.panelMin = false;
    if (st.problem && st.problem !== prevProb) st.openedAt = performance.now();
    labels.setSelected(st.selected);
    renderTopBar();
    renderPanel({ animate: prevSel !== st.selected, keepScroll: false });
    if (prevSel !== st.selected) safeCall(onSelect, st.selected);
    focusProblem(st.problem ? findProblem(st.problem) : null);
  }

  function openProblem(pid) {
    const p = findProblem(pid);
    if (!p || !isPeriod()) return;
    select(p.region, { problem: pid });
  }

  function back() {
    if (st.confirm) { st.confirm = false; renderTopBar(); return true; }
    if (st.newsOpen) { st.newsOpen = false; renderNewsStrip(); return true; }
    if (st.problem) { select(st.selected); return true; }
    if (st.selected) { select(null); return true; }
    return false;
  }

  function setHover(id, fromUi) {
    if (st.hover === id) return;
    st.hover = id;
    labels.setHover(id);
    if (fromUi) safeCall(onHover, id);
  }

  function act(action, btn) {
    if (st.acting) return false;
    st.acting = true;
    const release = setTimeout(() => { st.acting = false; }, ACT_RELEASE_MS);
    try {
      onAction(action);
      return true;
    } catch (err) {
      console.error('[ui-regions] onAction failed', err);
      toast(err?.message && /[À-ỹ]/.test(err.message) ? err.message : 'Không thực hiện được thao tác này', 'is-bad');
      st.acting = false;
      clearTimeout(release);
      btn?.classList.remove('is-picked');
      return false;
    }
  }

  function choose(optId, { fromKey = false } = {}) {
    if (st.acting || rootEl.querySelector('.rg-challenge[open]')) return;
    const p = findProblem(st.problem);
    if (!p || !isPeriod()) return;
    const o = p.options?.find((x) => String(x.id) === String(optId));
    if (!o) return;
    const now = performance.now();
    if (fromKey && now - st.openedAt < OPEN_GUARD_MS) return;
    if (now - st.choseAt < CHOOSE_GUARD_MS) return;
    const btn = panelEl.querySelector(`[data-opt="${CSS.escape(String(o.id))}"]`);
    if (p.chosen || p.status === 'working') {
      toast(`Đã chọn “${p.chosen?.label ?? p.chosen?.option ?? ''}”, đang thực hiện`);
      return;
    }
    if (o.disabled) {
      toast(o.reason || 'Phương án này chưa thể chọn', 'is-bad');
      if (btn) { btn.classList.remove('is-shake'); void btn.offsetWidth; btn.classList.add('is-shake'); }
      return;
    }
    const commit = (moves) => {
      st.choseAt = performance.now();
      btn?.classList.add('is-picked');
      if (act({ type: 'choose', problem: p.instanceId, option: o.id, moves }, btn)) {
        toast(`Đã chọn: ${o.label}${moves ? ' · tiết kiệm 1 ngân sách' : ''}`, 'is-good');
      }
    };
    if (o.challenge) openChallenge(ui, o.challenge, commit);
    else commit();
  }

  function nextPeriod(confirmed = false) {
    if (!isPeriod() || st.acting) return;
    const warns = pendingWarnings(st.view);
    if (warns.length && !confirmed && !st.confirm) {
      st.confirm = true;
      renderTopBar();
      return;
    }
    st.confirm = false;
    if (act({ type: 'endPeriod' })) renderTopBar();
  }

  // ---------- input ----------
  function toggleFullscreen() {
    if (document.fullscreenElement) document.exitFullscreen?.();
    else document.documentElement.requestFullscreen?.().catch(() => toast('Trình duyệt chặn toàn màn hình'));
  }

  function cycleRegion(dir) {
    const ids = REGION_ORDER.filter((id) => st.view?.regions?.some((r) => r.id === id));
    if (!ids.length) return;
    const cur = ids.indexOf(st.selected ?? st.hover);
    const next = cur < 0 ? (dir > 0 ? 0 : ids.length - 1) : (cur + dir + ids.length) % ids.length;
    select(ids[next]);
  }

  function onKey(e) {
    if (e.defaultPrevented || e.isComposing || rootEl.querySelector('.rg-challenge[open]')) return;
    const t = e.target;
    if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT' || t.isContentEditable)) return;
    if (!st.view) return;
    const k = e.key;
    const lower = k.length === 1 ? k.toLowerCase() : k;
    const phase = st.view.phase;

    if ((e.ctrlKey || e.metaKey) && lower === 'z') {
      if (testMode && typeof onUndo === 'function') {
        e.preventDefault();
        st.acting = false;
        safeCall(onUndo);
        toast('Đã hoàn tác (chế độ thử nghiệm)');
      }
      return;
    }
    if (e.ctrlKey || e.metaKey || e.altKey) return;

    if (lower === 'f') { toggleFullscreen(); e.preventDefault(); return; }

    if (phase === 'briefing') {
      if ((k === 'Enter' || k === ' ') && !e.repeat && !t.closest?.('button:not([data-action="start"])')) {
        e.preventDefault();
        act({ type: 'start' });
      }
      return;
    }
    if (phase !== 'period') return; // end screen: native keyboard only

    if (k === 'Escape') {
      if (back()) {
        e.preventDefault();
        if (panelEl.contains(document.activeElement)) document.activeElement.blur();
      }
      return;
    }
    if (k === 'Tab') {
      // Tab cycles regions on the map; inside the panel/confirm it keeps native focus order.
      const inside = t?.closest?.('.rg-panel, .rg-confirm, .rg-news');
      if (inside) return;
      e.preventDefault();
      cycleRegion(e.shiftKey ? -1 : 1);
      return;
    }
    const digit = /^Digit[1-6]$/.test(e.code ?? '') ? e.code.slice(5) : /^Numpad[1-6]$/.test(e.code ?? '') ? e.code.slice(6) : (/^[1-6]$/.test(k) ? k : null);
    if (digit) {
      e.preventDefault();
      if (e.repeat) return;
      const id = REGION_ORDER[Number(digit) - 1];
      if (st.view.regions?.some((r) => r.id === id)) select(id);
      return;
    }
    if (lower === 'n') {
      e.preventDefault();
      if (e.repeat) return;
      nextPeriod(st.confirm);
      return;
    }
    const oi = OPTION_KEYS.indexOf(lower);
    if (oi >= 0 && st.problem) {
      e.preventDefault();
      if (e.repeat) return;
      const p = findProblem(st.problem);
      const o = p?.options?.[oi];
      if (o) choose(o.id, { fromKey: true });
      return;
    }
    if (k === 'Enter' && st.selected && !t?.closest?.('button, summary, a')) {
      // Move keyboard focus into the panel so Tab can walk its buttons.
      const first = panelEl.querySelector('.rg-pcard, .rg-opt:not(.is-locked), [data-action]');
      if (first) { e.preventDefault(); first.focus(); }
      return;
    }
    if ((k === 'ArrowDown' || k === 'ArrowUp' || k === 'PageDown' || k === 'PageUp') && st.selected && !panelEl.contains(t)) {
      const sc = panelEl.querySelector('[data-scroll]');
      if (sc) {
        e.preventDefault();
        const f = k === 'PageDown' ? 0.85 : k === 'PageUp' ? -0.85 : k === 'ArrowDown' ? 0.25 : -0.25;
        sc.scrollBy({ top: f * sc.clientHeight });
      }
    }
  }
  window.addEventListener('keydown', onKey);

  ui.addEventListener('click', (e) => {
    const el = e.target.closest('[data-action], [data-open-problem], [data-opt], [data-region-chip]');
    if (!el || !ui.contains(el)) return;
    if (el.dataset.openProblem) { openProblem(el.dataset.openProblem); blurIfMouse(el, e); return; }
    if (el.dataset.regionChip) { select(el.dataset.regionChip); return; }
    if (el.dataset.opt) { choose(el.dataset.opt); blurIfMouse(el, e); return; }
    const a = el.dataset.action;
    blurIfMouse(el, e);
    if (a === 'next') nextPeriod(st.confirm);
    else if (a === 'next-confirm') nextPeriod(true);
    else if (a === 'next-cancel') { st.confirm = false; renderTopBar(); }
    else if (a === 'close') select(null);
    else if (a === 'back') select(st.selected);
    else if (a === 'news-toggle') { st.newsOpen = !st.newsOpen; renderNewsStrip(); }
    else if (a === 'panel-min') { st.panelMin = !st.panelMin; renderPanel(); }
    else if (a === 'start') act({ type: 'start' });
    else if (a === 'restart') act({ type: 'restart' });
  });

  // Mouse clicks drop focus so Tab/keys go back to map control; keyboard activation keeps it.
  function blurIfMouse(el, e) { if (e.detail > 0) el.blur?.(); }

  // Hovering a region chip or a news item highlights that region on the map.
  ui.addEventListener('pointerover', (e) => {
    const el = e.target.closest('[data-region-chip], [data-region-hover]');
    if (el) setHover(el.dataset.regionChip || el.dataset.regionHover, true);
  });
  ui.addEventListener('pointerout', (e) => {
    const el = e.target.closest('[data-region-chip], [data-region-hover]');
    if (el && !el.contains(e.relatedTarget)) setHover(null, true);
  });

  window.addEventListener('resize', () => updateSafe());
  // The drawer sizes to its content (details open/close, scrolling content changes):
  // keep the labels' keep-out rects in step with it.
  if (typeof ResizeObserver === 'function') {
    let queued = false;
    const ro = new ResizeObserver(() => {
      if (queued) return;
      queued = true;
      requestAnimationFrame(() => { queued = false; updateSafe(); });
    });
    ro.observe(panelEl); ro.observe(newsEl); ro.observe(topEl);
  }

  return {
    render,
    setAnchors: (anchors) => labels.setAnchors(anchors),
    select: (id) => { if ((id ?? null) !== st.selected) select(id ?? null); },
    hover: (id) => setHover(id ?? null, false),
    // Extras (not part of the contract).
    toast: (text, tone) => toast(String(text), tone),
    get selected() { return st.selected; },
    get openProblem() { return st.problem; },
    destroy() {
      window.removeEventListener('keydown', onKey);
      rootEl.innerHTML = '';
    },
  };
}
