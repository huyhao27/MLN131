// Region labels floating over the diorama. Content is rebuilt on render(view);
// positions are updated every frame from world anchors with transforms only
// (sizes for every display mode are cached at render time, so a frame never reads layout).
//
// Placement is greedy by priority (selected > hovered > urgent > … > stable): each label
// tries a few spots around its anchor in its richest mode, then a smaller mode, and is
// hidden (anchor dot stays) if no spot is free. Labels never overlap each other or the
// HUD/panel/news rects passed in via setSafe({ rects, hide }).
import { esc } from '../util.js';
import { REGION_ORDER, icon, regionMeta, statusText, lowerFirst, PROBLEM_STATUS_TEXT } from './text.js';

const TAIL = 10; // px between the anchor point and the label's edge
const PAD = 5; // min px gap between two labels / a label and a UI box
const EDGE = 6; // min px from the screen edge
const MAX_PINS = 2;
const MAX_DRIFT = 150; // a label further than this from its anchor is not a good spot
const MODES = ['full', 'normal', 'mini'];
const STATUS_RANK = { urgent: 0, attention: 1, opportunity: 2, stable: 3 };

export function createLabels(layer, { onHover, onSelect, onOpenProblem }) {
  const items = new Map(); // id -> { el, dot, leader, sizes, shown, tx, ty, lead, tail, mode, slot, rank }
  let anchors = null;
  let safe = { top: 0, rects: [], hide: [] };
  let selected = null;
  let hovered = null;
  let dirty = true;
  let dims = { W: window.innerWidth, H: window.innerHeight };

  function ensure(id) {
    let it = items.get(id);
    if (it) return it;
    const el = document.createElement('div');
    el.className = 'rg-label';
    el.dataset.region = id;
    const dot = document.createElement('span');
    dot.className = 'rg-anchor is-off';
    dot.setAttribute('aria-hidden', 'true');
    const leader = document.createElement('span');
    leader.className = 'rg-leader is-off';
    leader.setAttribute('aria-hidden', 'true');
    layer.append(leader, dot, el);
    el.addEventListener('pointerenter', () => onHover(id, true));
    el.addEventListener('pointerleave', () => onHover(null, true));
    el.addEventListener('focusin', () => onHover(id, true));
    el.addEventListener('focusout', (e) => { if (!el.contains(e.relatedTarget)) onHover(null, true); });
    el.addEventListener('click', (e) => {
      const pin = e.target.closest('[data-problem]');
      if (pin) { onOpenProblem(pin.dataset.problem, id); return; }
      onSelect(id);
    });
    it = {
      el, dot, leader, sizes: {}, shown: null, tx: null, ty: null, lead: null, tail: false,
      mode: 'normal', slot: -1, rank: 9, probs: 0, missing: false,
    };
    items.set(id, it);
    return it;
  }

  function pinHtml(p, view) {
    const working = p.status === 'working' || p.chosen;
    let when = '';
    if (working && p.chosen?.completesAt) when = `xong kỳ ${p.chosen.completesAt}`;
    else if (working) when = lowerFirst(PROBLEM_STATUS_TEXT.working);
    else if (p.deadline != null && view?.period != null && p.deadline <= view.period) when = 'hạn chót';
    else if (p.deadlineText) when = lowerFirst(p.deadlineText);
    const short = p.short || p.title;
    const kind = working ? 'is-working' : `is-${p.origin}`;
    const ic = working ? 'clock' : p.origin === 'opportunity' ? 'opportunity' : p.origin === 'consequence' ? 'consequence' : 'attention';
    const sev = p.severity >= 3 && !working ? ' is-severe' : '';
    return `<li class="rg-pin-li"><button type="button" class="rg-pin ${kind}${sev}" data-problem="${esc(p.instanceId)}" title="${esc(p.title)}${when ? ' · ' + esc(when) : ''}" tabindex="-1">
      ${icon(ic)}<span class="rg-pin-title">${esc(short)}</span>${when ? `<span class="rg-pin-dl">· ${esc(when)}</span>` : ''}
    </button></li>`;
  }

  function update(view) {
    const regions = view?.regions ?? [];
    const interactive = view?.phase === 'period';
    for (const id of REGION_ORDER) {
      const r = regions.find((x) => x.id === id);
      const it = ensure(id);
      if (!r) { it.el.innerHTML = ''; it.missing = true; continue; }
      it.missing = false;
      const meta = regionMeta(view, id);
      const probs = (r.problems ?? []).map((pid) => view.problems?.find((p) => p.instanceId === pid)).filter(Boolean);
      // Most pressing first: open/escalated before working, then severity, then deadline.
      probs.sort((a, b) => rank(a, view) - rank(b, view));
      const shownProbs = probs.slice(0, MAX_PINS);
      const projs = (view.projects ?? []).filter((j) => !j.done && (j.region === id || (r.projects ?? []).includes(j.id)));
      const st = statusText(r);
      const key = REGION_ORDER.indexOf(id) + 1;
      const open = probs.filter((p) => !(p.status === 'working' || p.chosen)).length;
      it.rank = (STATUS_RANK[r.status] ?? 3) * 10 - Math.min(open, 9);
      it.probs = probs.length;
      const moreNormal = probs.length - 1;
      const moreFull = probs.length - shownProbs.length;
      it.el.className = `rg-label is-${r.status || 'stable'} is-m-${it.mode}${selected === id ? ' is-selected' : ''}${hovered === id ? ' is-hover' : ''}${interactive ? '' : ' is-passive'}${it.shown === false ? ' is-off' : ''}${it.tail ? ' has-tail' : ''}`;
      it.el.innerHTML = `
        <button type="button" class="rg-label-main" data-select="${id}" ${interactive ? '' : 'tabindex="-1"'}
          aria-label="${esc(meta.name)}: ${esc(st)}${probs.length ? `, ${probs.length} việc cần xem` : ''}. Phím ${key}">
          <span class="rg-label-head"><kbd class="rg-key" aria-hidden="true">${key}</kbd><span class="rg-label-name">${esc(meta.short)}</span>${projs.length ? `<span class="rg-label-proj" title="${esc(projs.map((j) => `${j.label}: ${j.doneText ?? ''}`).join('; '))}">${icon('project')}</span>` : ''}${probs.length ? `<span class="rg-label-count" aria-hidden="true">${probs.length}</span>` : ''}</span>
          <span class="rg-label-status">${icon(r.status || 'stable')}<span>${esc(st)}</span></span>
        </button>
        ${shownProbs.length ? `<ul class="rg-pins">${shownProbs.map((p) => pinHtml(p, view)).join('')}${moreNormal > 0 ? `<li class="rg-pin-more is-n">+${moreNormal}</li>` : ''}${moreFull > 0 ? `<li class="rg-pin-more is-f">+${moreFull} việc khác</li>` : ''}</ul>` : ''}
        ${projs.length ? `<div class="rg-chip-project">${icon('project')}<span>Đang thi công · kỳ ${esc(projs[0].doneAt ?? '?')}${projs.length > 1 ? ` (+${projs.length - 1})` : ''}</span></div>` : ''}`;
    }
    measure();
  }

  function rank(p, view) {
    const working = p.status === 'working' || p.chosen ? 1000 : 0;
    const esc2 = p.status === 'escalated' ? -50 : 0;
    const dl = p.deadline == null ? 50 : Math.max(0, p.deadline - (view.period ?? 0)) * 10;
    return working + esc2 - (p.severity ?? 1) * 20 + dl + (p.origin === 'opportunity' ? 15 : 0);
  }

  function setMode(it, mode) {
    if (it.mode === mode) return;
    it.el.classList.remove(`is-m-${it.mode}`);
    it.mode = mode;
    it.el.classList.add(`is-m-${mode}`);
  }

  // Read sizes (every mode) once per content change / resize.
  function measure() {
    dims = { W: layer.clientWidth || window.innerWidth, H: layer.clientHeight || window.innerHeight };
    for (const it of items.values()) {
      const keep = it.mode;
      const wasOff = it.el.classList.contains('is-off');
      if (wasOff) it.el.classList.remove('is-off');
      for (const m of MODES) {
        setMode(it, m);
        it.sizes[m] = { w: it.el.offsetWidth, h: it.el.offsetHeight };
      }
      setMode(it, keep);
      if (wasOff) it.el.classList.add('is-off');
    }
    dirty = true;
    layout();
  }

  function setAnchors(a) {
    if (!a) return;
    if (!dirty && anchors && same(anchors, a)) return;
    anchors = a;
    dirty = false;
    layout();
  }

  function same(a, b) {
    for (const id of REGION_ORDER) {
      const p = a[id], q = b[id];
      if (!p !== !q) return false;
      if (!p) continue;
      if (p.visible !== q.visible || Math.abs(p.x - q.x) > 0.25 || Math.abs(p.y - q.y) > 0.25) return false;
    }
    return true;
  }

  const hits = (a, b, pad = PAD) => a.x < b.x + b.w + pad && b.x < a.x + a.w + pad && a.y < b.y + b.h + pad && b.y < a.y + a.h + pad;
  const inside = (x, y, r) => x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h;

  // Candidate top-left corners around the anchor, best first. Slot 0 is "centred above"
  // (drawn with a tail); the rest get a leader line.
  function candidates(ax, ay, w, h) {
    const up = ay - h - TAIL, dn = ay + TAIL, mid = ay - h / 2;
    const cx = ax - w / 2;
    const c = [
      [cx, up], [cx, dn], [ax + TAIL + 4, mid], [ax - w - TAIL - 4, mid],
      [ax - 18, up], [ax - w + 18, up], [ax - 18, dn], [ax - w + 18, dn],
    ];
    for (let k = 1; k <= 3; k++) {
      const s = k * (h * 0.6 + PAD);
      c.push([cx, up - s], [cx, dn + s], [ax + TAIL + 4, mid - s], [ax + TAIL + 4, mid + s], [ax - w - TAIL - 4, mid - s], [ax - w - TAIL - 4, mid + s]);
    }
    return c;
  }

  function layout() {
    if (!anchors) return;
    const { W, H } = dims; // cached: no layout reads per frame
    const top = Math.max(EDGE, safe.top + EDGE);
    const bottom = H - EDGE;
    const obstacles = safe.rects ?? [];
    const list = [];
    for (const id of REGION_ORDER) {
      const it = items.get(id);
      const a = anchors[id];
      let vis = !!a && !!it && a.visible !== false && !it.missing && Number.isFinite(a.x) && Number.isFinite(a.y)
        && a.x >= 0 && a.x <= W && a.y >= 0 && a.y <= H;
      // Region centre hidden under a panel: no label for it.
      if (vis && (safe.hide ?? []).some((r) => inside(a.x, a.y, r))) vis = false;
      if (!vis) { if (it) show(it, false, false); continue; }
      const pri = id === selected ? -100 : id === hovered ? -50 : it.rank;
      list.push({ id, it, ax: a.x, ay: a.y, pri });
    }
    list.sort((p, q) => p.pri - q.pri || REGION_ORDER.indexOf(p.id) - REGION_ORDER.indexOf(q.id));
    const placed = [];
    for (const b of list) {
      const { it } = b;
      const modes = b.id === selected || b.id === hovered ? MODES : MODES.slice(1);
      let found = null;
      for (const mode of modes) {
        const { w, h } = it.sizes[mode] ?? { w: 0, h: 0 };
        if (!w || !h) continue;
        const cands = candidates(b.ax, b.ay, w, h);
        // Hysteresis: keep last frame's spot if it is still free.
        const order = it.mode === mode && it.slot >= 0 && it.slot < cands.length ? [it.slot, ...cands.keys()] : cands.keys();
        for (const i of order) {
          let [x, y] = cands[i];
          x = Math.max(EDGE, Math.min(W - EDGE - w, x));
          y = Math.max(top, Math.min(bottom - h, y));
          if (Math.hypot(x + w / 2 - b.ax, Math.max(0, y - b.ay, b.ay - (y + h))) > MAX_DRIFT + h) continue;
          const box = { x, y, w, h };
          if (placed.some((p) => hits(p, box)) || obstacles.some((r) => hits(r, box, PAD))) continue;
          // Do not cover another label's anchor dot.
          if (list.some((o) => o !== b && inside(o.ax, o.ay, { x: x - 4, y: y - 4, w: w + 8, h: h + 8 }))) continue;
          found = { mode, slot: i, box, natural: i === 0 && Math.abs(x - cands[0][0]) < 1 && Math.abs(y - cands[0][1]) < 1 };
          break;
        }
        if (found) break;
      }
      if (!found) { show(it, false, true); placeDot(it, b); continue; }
      placed.push(found.box);
      setMode(it, found.mode);
      it.slot = found.slot;
      show(it, true, true);
      place(b, found);
    }
  }

  function show(it, on, dot) {
    if (it.shown !== on) {
      it.shown = on;
      it.el.classList.toggle('is-off', !on);
      if (!on) { it.leader.classList.add('is-off'); it.lead = false; }
    }
    if (it.dotOn !== dot) { it.dotOn = dot; it.dot.classList.toggle('is-off', !dot); }
  }

  function placeDot(it, b) {
    it.dot.style.transform = `translate3d(${Math.round(b.ax)}px,${Math.round(b.ay)}px,0)`;
  }

  function place(b, { box, natural }) {
    const { it } = b;
    const tx = Math.round(box.x), ty = Math.round(box.y);
    if (tx !== it.tx || ty !== it.ty) {
      it.tx = tx; it.ty = ty;
      it.el.style.transform = `translate3d(${tx}px,${ty}px,0)`;
    }
    placeDot(it, b);
    // Leader line from the anchor to the label's nearest edge when not in the natural spot.
    const lx = Math.max(box.x + 10, Math.min(box.x + box.w - 10, b.ax));
    const ly = b.ay < box.y ? box.y : b.ay > box.y + box.h ? box.y + box.h : b.ay;
    const ex = b.ax < box.x ? box.x : b.ax > box.x + box.w ? box.x + box.w : lx;
    const dx = (ly === b.ay ? ex : lx) - b.ax, dy = ly - b.ay;
    const len = Math.hypot(dx, dy);
    const lead = !natural && len > 6;
    if (it.tail !== natural) { it.tail = natural; it.el.classList.toggle('has-tail', natural); }
    if (lead !== it.lead) { it.lead = lead; it.leader.classList.toggle('is-off', !lead); }
    if (lead) {
      it.leader.style.transform = `translate3d(${b.ax.toFixed(1)}px,${b.ay.toFixed(1)}px,0) rotate(${Math.atan2(dy, dx).toFixed(4)}rad) scaleX(${(len / 100).toFixed(3)})`;
    }
  }

  function setFlags() {
    for (const [id, it] of items) {
      it.el.classList.toggle('is-selected', selected === id);
      it.el.classList.toggle('is-hover', hovered === id);
    }
    layout(); // priorities (and the richer "full" mode) follow hover/selection
  }

  window.addEventListener('resize', () => measure());
  document.fonts?.ready?.then(() => measure());

  return {
    update,
    measure,
    setAnchors,
    setSafe(s) {
      safe = { top: s.top ?? 0, rects: s.rects ?? [], hide: s.hide ?? [] };
      layout();
    },
    setSelected(id) { selected = id; setFlags(); },
    setHover(id) { hovered = id; setFlags(); },
    setVisible(on) { layer.classList.toggle('is-hidden', !on); },
  };
}
