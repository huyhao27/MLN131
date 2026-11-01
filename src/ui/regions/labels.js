// Region labels floating over the diorama. Content is rebuilt on render(view);
// positions are updated every frame from world anchors with transforms only
// (sizes are cached at render time, so a frame never reads layout).
import { esc } from '../util.js';
import { REGION_ORDER, icon, regionMeta, statusText, lowerFirst, PROBLEM_STATUS_TEXT } from './text.js';

const TAIL = 12; // px between the anchor point and the label's bottom edge
const PAD = 6; // min px gap between two labels
const EDGE = 6; // min px from the screen edge
const MAX_PINS = 2;

export function createLabels(layer, { onHover, onSelect, onOpenProblem }) {
  const items = new Map(); // id -> { el, dot, leader, w, h, shown, tx, ty, lead }
  let anchors = null;
  let safe = { top: 0, bottom: 0, right: Infinity };
  let selected = null;
  let hovered = null;
  let dirty = true;

  function ensure(id) {
    let it = items.get(id);
    if (it) return it;
    const el = document.createElement('div');
    el.className = 'rg-label';
    el.dataset.region = id;
    const dot = document.createElement('span');
    dot.className = 'rg-anchor';
    dot.setAttribute('aria-hidden', 'true');
    const leader = document.createElement('span');
    leader.className = 'rg-leader';
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
    it = { el, dot, leader, w: 0, h: 0, shown: null, tx: null, ty: null, lead: null, tail: false };
    items.set(id, it);
    return it;
  }

  function pinHtml(p, view) {
    const working = p.status === 'working' || p.chosen;
    let when = '';
    if (working && p.chosen?.completesAt) when = `xong kỳ ${p.chosen.completesAt}`;
    else if (working) when = lowerFirst(PROBLEM_STATUS_TEXT.working);
    else if (p.deadlineText) when = lowerFirst(p.deadlineText);
    const short = p.short || p.title;
    const kind = working ? 'is-working' : `is-${p.origin}`;
    const ic = working ? 'clock' : p.origin === 'opportunity' ? 'opportunity' : p.origin === 'consequence' ? 'consequence' : 'attention';
    const sev = p.severity >= 3 && !working ? ' is-severe' : '';
    return `<li><button type="button" class="rg-pin ${kind}${sev}" data-problem="${esc(p.instanceId)}" title="${esc(p.title)}${when ? ' · ' + esc(when) : ''}" tabindex="-1">
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
      const more = probs.length - shownProbs.length;
      const projs = (view.projects ?? []).filter((j) => !j.done && (j.region === id || (r.projects ?? []).includes(j.id)));
      const st = statusText(r);
      const key = REGION_ORDER.indexOf(id) + 1;
      it.el.className = `rg-label is-${r.status || 'stable'}${selected === id ? ' is-selected' : ''}${hovered === id ? ' is-hover' : ''}${interactive ? '' : ' is-passive'}${it.shown === false ? ' is-off' : ''}${it.tail ? ' has-tail' : ''}`;
      it.el.innerHTML = `
        <button type="button" class="rg-label-main" data-select="${id}" ${interactive ? '' : 'tabindex="-1"'}
          aria-label="${esc(meta.name)}: ${esc(st)}${probs.length ? `, ${probs.length} việc cần xem` : ''}. Phím ${key}">
          <span class="rg-label-head"><kbd class="rg-key" aria-hidden="true">${key}</kbd><span class="rg-label-name">${esc(meta.short)}</span></span>
          <span class="rg-label-status">${icon(r.status || 'stable')}<span>${esc(st)}</span></span>
        </button>
        ${shownProbs.length ? `<ul class="rg-pins">${shownProbs.map((p) => pinHtml(p, view)).join('')}${more > 0 ? `<li class="rg-pin-more">+${more} việc khác</li>` : ''}</ul>` : ''}
        ${projs.length ? `<div class="rg-chip-project" title="${esc(projs.map((j) => `${j.label}: ${j.doneText ?? ''}`).join('; '))}">${icon('project')}<span>Đang thi công · kỳ ${esc(projs[0].doneAt ?? '?')}${projs.length > 1 ? ` (+${projs.length - 1})` : ''}</span></div>` : ''}`;
    }
    measure();
  }

  function rank(p, view) {
    const working = p.status === 'working' || p.chosen ? 1000 : 0;
    const esc2 = p.status === 'escalated' ? -50 : 0;
    const dl = p.deadline == null ? 50 : Math.max(0, p.deadline - (view.period ?? 0)) * 10;
    return working + esc2 - (p.severity ?? 1) * 20 + dl + (p.origin === 'opportunity' ? 15 : 0);
  }

  // Read sizes once per content change / resize.
  function measure() {
    for (const it of items.values()) {
      it.w = it.el.offsetWidth;
      it.h = it.el.offsetHeight;
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

  function layout() {
    if (!anchors) return;
    const W = layer.clientWidth || window.innerWidth;
    const H = layer.clientHeight || window.innerHeight;
    const top = safe.top + EDGE;
    const bottom = H - safe.bottom - EDGE;
    const boxes = [];
    for (const id of REGION_ORDER) {
      const it = items.get(id);
      const a = anchors[id];
      const vis = !!a && a.visible !== false && !it?.missing && Number.isFinite(a.x) && Number.isFinite(a.y)
        && a.x >= -40 && a.x <= W + 40 && a.y >= -40 && a.y <= H + 40 && a.x < safe.right;
      if (it) show(it, vis);
      if (!vis) continue;
      boxes.push({ id, it, ax: a.x, ay: a.y, x: a.x - it.w / 2, y: a.y - it.h - TAIL, w: it.w, h: it.h });
    }
    const clamp = (b) => {
      b.x = Math.max(EDGE, Math.min(Math.min(W, safe.right) - EDGE - b.w, b.x));
      b.y = Math.max(top, Math.min(bottom - b.h, b.y));
    };
    boxes.forEach(clamp);
    // Relax overlaps: push each overlapping pair apart along the axis of least overlap.
    for (let iter = 0; iter < 10; iter++) {
      let moved = false;
      for (let i = 0; i < boxes.length; i++) {
        for (let j = i + 1; j < boxes.length; j++) {
          const a = boxes[i], b = boxes[j];
          const ox = Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x) + PAD;
          const oy = Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y) + PAD;
          if (ox <= PAD || oy <= PAD) continue;
          moved = true;
          if (oy <= ox * 1.4) {
            const up = a.ay + a.y / 1e6 <= b.ay + b.y / 1e6 ? a : b;
            const dn = up === a ? b : a;
            up.y -= oy / 2; dn.y += oy / 2;
          } else {
            const lf = a.ax <= b.ax ? a : b;
            const rt = lf === a ? b : a;
            lf.x -= ox / 2; rt.x += ox / 2;
          }
          clamp(a); clamp(b);
        }
      }
      if (!moved) break;
    }
    for (const b of boxes) place(b);
  }

  function show(it, on) {
    if (it.shown === on) return;
    it.shown = on;
    it.el.classList.toggle('is-off', !on);
    it.dot.classList.toggle('is-off', !on);
    if (!on) it.leader.classList.add('is-off');
  }

  function place(b) {
    const { it } = b;
    const tx = Math.round(b.x), ty = Math.round(b.y);
    if (tx !== it.tx || ty !== it.ty) {
      it.tx = tx; it.ty = ty;
      it.el.style.transform = `translate3d(${tx}px,${ty}px,0)`;
    }
    it.dot.style.transform = `translate3d(${Math.round(b.ax)}px,${Math.round(b.ay)}px,0)`;
    // Leader line from the anchor to the label's nearest bottom/top edge when displaced.
    const lx = Math.max(b.x + 10, Math.min(b.x + b.w - 10, b.ax));
    const ly = b.ay < b.y ? b.y : b.y + b.h;
    const dx = lx - b.ax, dy = ly - b.ay;
    const naturalX = b.ax - b.w / 2, naturalY = b.ay - b.h - TAIL;
    const displaced = Math.abs(b.x - naturalX) > 14 || Math.abs(b.y - naturalY) > 14;
    const len = Math.hypot(dx, dy);
    const lead = displaced && len > 4;
    if (it.tail !== !displaced) { it.tail = !displaced; it.el.classList.toggle('has-tail', it.tail); }
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
  }

  window.addEventListener('resize', () => measure());
  document.fonts?.ready?.then(() => measure());

  return {
    update,
    measure,
    setAnchors,
    setSafe(s) {
      const changed = s.top !== safe.top || s.bottom !== safe.bottom || s.right !== safe.right;
      safe = s;
      if (changed) layout();
    },
    setSelected(id) { selected = id; setFlags(); },
    setHover(id) { hovered = id; setFlags(); },
    setVisible(on) { layer.classList.toggle('is-hidden', !on); },
  };
}
