// Detail popovers for metrics, resources, flags and stakeholders. The UI keeps its own
// memory of what it has rendered (values per year, decisions and their deltas), so the
// popover never asks the sim for anything beyond the views it already received.
import {
  METRIC_BY_KEY, RESOURCE_BY_KEY, STAKEHOLDERS, STAKEHOLDER_INFO, WARN_LEVEL, flagInfo,
} from './labels.js';
import { glyph, stakeholderIcon } from './icons.js';
import { esc, signed } from './util.js';

const DECISION_PHASES = new Set(['result', 'randomResult']);
const CHOICE_PHASES = new Set(['event', 'random', 'consequence', 'finalRepair']);

// ---------- what the UI has seen ----------

export function createTracker() {
  let start = null; // { metrics, resources } of the first view of the run
  let years = new Map(); // year -> { metrics, resources } (latest view of that year)
  let decisions = []; // { key, year, code, nodeCode, label, deltas, resourceDeltas, flags, winners, losers }

  function reset() { start = null; years = new Map(); decisions = []; }

  function see(view) {
    const year = Number(view.year) || 1;
    if (view.phase === 'briefing') reset();
    // Undo or restart went back in time: forget the future we had recorded.
    for (const y of [...years.keys()]) if (y > year) years.delete(y);
    decisions = decisions.filter((d) => d.year <= year);
    if (CHOICE_PHASES.has(view.phase) && view.code) {
      decisions = decisions.filter((d) => !(d.year === year && d.nodeCode === view.code));
    }

    const snap = { metrics: { ...(view.metrics ?? {}) }, resources: { ...(view.resources ?? {}) } };
    if (!start) start = snap;
    if (view.phase !== 'briefing' && view.phase !== 'end') years.set(year, snap);

    if (DECISION_PHASES.has(view.phase)) {
      const nodeCode = view.nodeCode ?? String(view.code ?? '').replace(/-.*$/, '');
      const key = `${year}:${view.code ?? view.choiceLabel}`;
      if (!decisions.some((d) => d.key === key)) {
        decisions.push({
          key, year, nodeCode, code: view.code ?? nodeCode, label: view.choiceLabel ?? '',
          deltas: view.deltas ?? {}, resourceDeltas: view.resourceDeltas ?? {},
          flags: view.flagsSet ?? [], winners: view.winners ?? [], losers: view.losers ?? [],
        });
      }
    }
  }

  return {
    see,
    // [{ label, value }] — start, then the latest value of every year seen.
    series(kind, key) {
      const pick = (s) => Number(s?.[kind]?.[key]);
      const out = [];
      if (start && !Number.isNaN(pick(start))) out.push({ label: 'Đầu', value: pick(start) });
      for (const y of [...years.keys()].sort((a, b) => a - b)) {
        const v = pick(years.get(y));
        if (!Number.isNaN(v)) out.push({ label: `N${y}`, value: v });
      }
      return out;
    },
    decisions: () => decisions,
  };
}

// ---------- content ----------

function sparkline(points, { invert = false, warn = null } = {}) {
  if (points.length < 2) return '<p class="tt-muted tt-pop-small">Lịch sử sẽ hiện khi có thêm năm.</p>';
  const W = 280, H = 84, l = 26, r = 10, t = 10, b = 20;
  const vals = points.map((p) => p.value);
  let lo = Math.min(...vals), hi = Math.max(...vals);
  if (warn != null) { lo = Math.min(lo, warn); hi = Math.max(hi, warn); }
  if (hi - lo < 10) { const mid = (hi + lo) / 2; lo = mid - 5; hi = mid + 5; }
  const x = (i) => l + (i / (points.length - 1)) * (W - l - r);
  const y = (v) => t + (1 - (v - lo) / (hi - lo)) * (H - t - b);
  const d = points.map((p, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(p.value).toFixed(1)}`).join(' ');
  const first = vals[0], last = vals[vals.length - 1];
  const up = last > first, good = invert ? !up : up;
  const tone = last === first ? '' : good ? 'is-good' : 'is-bad';
  const warnLine = warn != null ? `<line class="tt-spark-warn" x1="${l}" x2="${W - r}" y1="${y(warn)}" y2="${y(warn)}"/>` : '';
  return `<svg class="tt-spark ${tone}" viewBox="0 0 ${W} ${H}" aria-hidden="true">
    ${warnLine}
    <text class="tt-spark-axis" x="${l - 5}" y="${y(hi) + 4}" text-anchor="end">${Math.round(hi)}</text>
    <text class="tt-spark-axis" x="${l - 5}" y="${y(lo) + 4}" text-anchor="end">${Math.round(lo)}</text>
    <path class="tt-spark-line" d="${d}"/>
    ${points.map((p, i) => `<circle class="tt-spark-dot" cx="${x(i).toFixed(1)}" cy="${y(p.value).toFixed(1)}" r="${i === points.length - 1 ? 4 : 2.6}"/>
      <text class="tt-spark-axis" x="${x(i).toFixed(1)}" y="${H - 4}" text-anchor="middle">${esc(p.label)}</text>`).join('')}
  </svg>`;
}

function impactList(decisions, field, key, invert) {
  const rows = decisions
    .map((d) => ({ d, v: Number(d[field]?.[key]) || 0 }))
    .filter((r) => r.v)
    .sort((a, b) => Math.abs(b.v) - Math.abs(a.v) || b.d.year - a.d.year)
    .slice(0, 4);
  if (!rows.length) return '<p class="tt-muted tt-pop-small">Chưa có quyết định nào làm thay đổi trực tiếp chỉ số này.</p>';
  return `<ul class="tt-pop-impacts">${rows.map(({ d, v }) => {
    const good = invert ? v < 0 : v > 0;
    return `<li><span class="tt-delta ${good ? 'is-good' : 'is-bad'}"><span class="tt-delta-num">${signed(v)}</span></span>
      <span class="tt-code is-small">N${d.year} · ${esc(d.code)}</span><span class="tt-pop-impact-label">${esc(d.label)}</span></li>`;
  }).join('')}</ul>`;
}

function head(title, sub = '', color = '') {
  return `<header class="tt-pop-head"${color ? ` style="--mc:${color}"` : ''}>
    <h3 class="tt-pop-title">${title}</h3>${sub}
    <button type="button" class="tt-pop-close" data-pop-close aria-label="Đóng">×</button></header>`;
}

function metricPop(key, view, tracker) {
  const m = METRIC_BY_KEY[key];
  const v = Number(view?.metrics?.[key]);
  const low = v < WARN_LEVEL;
  return `${head(esc(m?.name ?? key), `<span class="tt-pop-val${low ? ' is-low' : ''}">${Number.isNaN(v) ? '–' : Math.round(v)}<small>/100</small></span>`, m?.color)}
    <p class="tt-pop-desc">${esc(m?.desc ?? '')}</p>
    ${low ? `<p class="tt-pop-warn">${glyph('warning')}Đang dưới ngưỡng cảnh báo ${WARN_LEVEL}.</p>` : ''}
    <h4 class="tt-h3">Qua các năm</h4>${sparkline(tracker.series('metrics', key), { warn: WARN_LEVEL })}
    <h4 class="tt-h3">Quyết định tác động mạnh nhất</h4>${impactList(tracker.decisions(), 'deltas', key, false)}`;
}

function resourcePop(key, view, tracker) {
  const r = RESOURCE_BY_KEY[key];
  const v = Number(view?.resources?.[key]);
  return `${head(esc(r?.name ?? key), `<span class="tt-pop-val">${Number.isNaN(v) ? '–' : Math.round(v)}</span>`)}
    <p class="tt-pop-desc">${esc(r?.desc ?? '')}</p>
    <h4 class="tt-h3">Qua các năm</h4>${sparkline(tracker.series('resources', key), { invert: !!r?.bad, warn: key === 'CAPACITY' ? 35 : null })}
    <h4 class="tt-h3">Quyết định tác động mạnh nhất</h4>${impactList(tracker.decisions(), 'resourceDeltas', key, !!r?.bad)}`;
}

function flagPop(id, view, tracker) {
  const info = flagInfo(id);
  const active = (view?.flags ?? []).some((f) => flagInfo(f).id === info.id);
  const setters = tracker.decisions().filter((d) => d.flags.some((f) => flagInfo(f).id === info.id));
  const TONE = { good: 'Di sản thuận lợi', bad: 'Di sản rủi ro', mixed: 'Di sản đan xen' };
  return `${head(`${glyph('flag')}${esc(info.label)}`, `<span class="tt-flag is-${info.tone}">${TONE[info.tone] ?? ''}</span>`)}
    ${info.desc ? `<p class="tt-pop-desc">${esc(info.desc)}</p>` : ''}
    <p class="tt-pop-small tt-muted">Di sản chính sách là dấu vết của quyết định cũ: nó có thể đổi chi phí, tác động và cả tình huống ở những năm sau.</p>
    <p class="tt-pop-small"><b>Hiện tại:</b> ${active ? 'đang có hiệu lực' : 'không còn / chưa có hiệu lực'}</p>
    ${setters.length ? `<h4 class="tt-h3">Xuất hiện sau</h4><ul class="tt-pop-impacts">${setters.map((d) => {
      const removed = d.flags.some((f) => flagInfo(f).id === info.id && flagInfo(f).removed);
      return `<li><span class="tt-code is-small">N${d.year} · ${esc(d.code)}</span><span class="tt-pop-impact-label">${removed ? 'Gỡ bỏ — ' : ''}${esc(d.label)}</span></li>`;
    }).join('')}</ul>` : ''}`;
}

function stakeholderPop(id, view, tracker) {
  const info = STAKEHOLDER_INFO[id];
  const ds = tracker.decisions();
  const has = (list) => list.some((s) => (typeof s === 'string' ? s : s?.id) === id);
  const gains = ds.filter((d) => has(d.winners));
  const losses = ds.filter((d) => has(d.losers));
  const row = (title, list, cls) => (list.length ? `<div class="tt-pop-wl ${cls}"><b>${title}:</b> ${list.map((d) => `<span class="tt-code is-small" title="${esc(d.label)}">${esc(d.code)}</span>`).join(' ')}</div>` : '');
  return `${head(`<span class="tt-sh-icon tt-pop-sh">${stakeholderIcon(id)}</span>${esc(STAKEHOLDERS[id] ?? id)}`)}
    ${info ? `<dl class="tt-pop-dl"><dt>Mối quan tâm</dt><dd>${esc(info.concern)}</dd><dt>Mâu thuẫn khả dĩ</dt><dd>${esc(info.conflict)}</dd></dl>` : ''}
    ${gains.length || losses.length ? `<h4 class="tt-h3">Qua các quyết định</h4>${row('Hưởng lợi', gains, 'is-win')}${row('Chịu chi phí', losses, 'is-lose')}` : ''}
    <p class="tt-pop-small tt-muted">Các nhóm không phải “đối thủ”; bất đồng hợp pháp không tự động là dấu hiệu phá hoại.</p>`;
}

const BUILDERS = { metric: metricPop, res: resourcePop, flag: flagPop, sh: stakeholderPop };

// ---------- popover element ----------

export function createPopover(uiEl, { tracker, getView }) {
  const pop = document.createElement('div');
  pop.className = 'tt-pop';
  pop.setAttribute('role', 'dialog');
  pop.hidden = true;
  uiEl.appendChild(pop);
  let anchor = null;
  let swallowClick = false;

  function place() {
    if (!anchor || pop.hidden) return;
    const u = uiEl.getBoundingClientRect();
    const a = anchor.getBoundingClientRect();
    const p = pop.getBoundingClientRect();
    const m = 8;
    // Prefer above (dashboard sits at the bottom), else below, else beside.
    let top = a.top - u.top - p.height - m;
    if (top < m) top = a.bottom - u.top + m;
    if (top + p.height > u.height - m) top = Math.max(m, u.height - m - p.height);
    let left = a.left - u.left + a.width / 2 - p.width / 2;
    left = Math.max(m, Math.min(u.width - m - p.width, left));
    pop.style.left = `${left}px`;
    pop.style.top = `${top}px`;
  }

  function close() {
    if (pop.hidden) return false;
    pop.hidden = true;
    anchor?.classList.remove('is-pop-open');
    anchor = null;
    return true;
  }

  function open(el) {
    const [kind, id] = String(el.dataset.pop).split(':');
    const build = BUILDERS[kind];
    if (!build) return;
    if (anchor === el && !pop.hidden) { close(); return; }
    close();
    anchor = el;
    el.classList.add('is-pop-open');
    pop.dataset.kind = kind;
    pop.innerHTML = build(id, getView(), tracker);
    pop.hidden = false;
    place();
  }

  // Click-outside closes. A press that closes the popover is swallowed if it lands on a
  // choice, so dismissing a popover never casts a vote by accident.
  window.addEventListener('pointerdown', (e) => {
    if (pop.hidden) { swallowClick = false; return; }
    if (pop.contains(e.target) || e.target.closest?.('[data-pop]') === anchor) return;
    close();
    swallowClick = !!e.target.closest?.('[data-opt], [data-action]');
  }, true);
  window.addEventListener('click', (e) => {
    if (!swallowClick) return;
    swallowClick = false;
    e.stopPropagation();
    e.preventDefault();
  }, true);
  pop.addEventListener('click', (e) => {
    if (e.target.closest('[data-pop-close]')) close();
  });
  window.addEventListener('resize', place);

  return {
    open,
    close,
    isOpen: () => !pop.hidden,
    // Re-render the open popover with fresh numbers (or close it if its anchor vanished).
    refresh() {
      if (pop.hidden) return;
      if (!anchor?.isConnected) { close(); return; }
      const [kind, id] = String(anchor.dataset.pop).split(':');
      pop.innerHTML = BUILDERS[kind](id, getView(), tracker);
      place();
    },
  };
}
