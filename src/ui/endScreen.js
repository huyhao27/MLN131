// Final report: ending, hand-drawn SVG line chart of the 6 metrics, turning points,
// delayed effects, stakeholders and the "what if" prompt.
import { METRICS, STAKEHOLDERS, ENDING_TONES, TOTAL_YEARS, WARN_LEVEL, YEAR_THEMES } from './labels.js';
import { glyph, stakeholderIcon } from './icons.js';
import { esc, itemText, signed } from './util.js';
import { choiceList } from './cards.js';

const W = 720, H = 360;
const MARGIN = { l: 46, r: 150, t: 18, b: 64 };

// GDD §3.1 starting values; used when the sim does not send `initialMetrics`.
const DEFAULT_START = { PROD: 52, LIFE: 48, TRUST: 54, LAW: 51, EQUITY: 45, COHESION: 57 };

const isMain = (code) => /^Y\d/.test(String(code ?? ''));

function seriesFrom(view) {
  const start = view.initialMetrics ?? view.history?.find((h) => h.metricsBefore)?.metricsBefore ?? DEFAULT_START;
  const byYear = new Map();
  for (const h of view.history ?? []) {
    if (h?.metricsAfter && h.year != null) byYear.set(Number(h.year), h.metricsAfter); // last entry of a year wins
  }
  const points = [[0, start], ...[...byYear.entries()].sort((a, b) => a[0] - b[0])];
  return points;
}

function lineChart(view) {
  const points = seriesFrom(view);
  const m = MARGIN;
  const maxYear = Math.max(TOTAL_YEARS, ...points.map((p) => p[0]));
  const x = (yr) => m.l + (yr / maxYear) * (W - m.l - m.r);
  const y = (v) => m.t + (1 - Math.max(0, Math.min(100, v)) / 100) * (H - m.t - m.b);

  const grid = [0, 20, 40, 60, 80, 100].map((v) => `
    <line class="tt-ch-grid" x1="${m.l}" x2="${W - m.r}" y1="${y(v)}" y2="${y(v)}"/>
    <text class="tt-ch-axis" x="${m.l - 10}" y="${y(v) + 5}" text-anchor="end">${v}</text>`).join('');

  const zone = `<rect class="tt-ch-zone" x="${m.l}" y="${y(WARN_LEVEL)}" width="${W - m.l - m.r}" height="${y(0) - y(WARN_LEVEL)}"/>`;

  const mainByYear = new Map();
  for (const h of view.history ?? []) if (isMain(h.code)) mainByYear.set(Number(h.year), h);
  const xLabels = Array.from({ length: maxYear + 1 }, (_, yr) => {
    const h = mainByYear.get(yr);
    const code = h ? (h.choiceId ?? h.code) : '';
    return `<text class="tt-ch-axis" x="${x(yr)}" y="${H - m.b + 24}" text-anchor="middle">${yr === 0 ? 'Đầu' : `N${yr}`}</text>
      ${code ? `<text class="tt-ch-code" x="${x(yr)}" y="${H - m.b + 46}" text-anchor="middle">${esc(code)}</text>` : ''}`;
  }).join('');

  const tpYears = new Set((view.turningPoints ?? []).map((t) => Number(t?.year)).filter((v) => !Number.isNaN(v)));
  const tpLines = [...tpYears].map((yr) => `<line class="tt-ch-tp" x1="${x(yr)}" x2="${x(yr)}" y1="${m.t}" y2="${H - m.b}"/>
    <circle class="tt-ch-tpdot" cx="${x(yr)}" cy="${m.t}" r="7" data-yr="${yr}"><title>Bước ngoặt năm ${yr}</title></circle>`).join('');

  // Invisible per-year columns that catch hover/click for the tooltip.
  const step = (W - m.l - m.r) / maxYear;
  const hits = points.map(([yr]) => `<rect class="tt-ch-hit" data-yr="${yr}" x="${(x(yr) - step / 2).toFixed(1)}" y="${m.t}" width="${step.toFixed(1)}" height="${H - m.t - m.b + 50}"/>`).join('');
  const hl = `<line class="tt-ch-hl" x1="0" x2="0" y1="${m.t}" y2="${H - m.b}" visibility="hidden"/>`;

  // End labels, nudged apart so they do not overlap.
  const last = points[points.length - 1];
  const labels = METRICS.map((mt) => ({ mt, v: Number(last[1]?.[mt.key] ?? 0), ty: y(Number(last[1]?.[mt.key] ?? 0)) }))
    .sort((a, b) => a.ty - b.ty);
  const GAP = 21;
  for (let i = 1; i < labels.length; i++) labels[i].ty = Math.max(labels[i].ty, labels[i - 1].ty + GAP);
  const overflow = labels[labels.length - 1].ty - (H - m.b);
  if (overflow > 0) labels.forEach((l) => (l.ty -= overflow));
  for (let i = labels.length - 2; i >= 0; i--) labels[i].ty = Math.min(labels[i].ty, labels[i + 1].ty - GAP);

  const lines = METRICS.map((mt, i) => {
    const d = points.map(([yr, ms], j) => `${j ? 'L' : 'M'}${x(yr).toFixed(1)},${y(Number(ms?.[mt.key] ?? 0)).toFixed(1)}`).join(' ');
    const dots = points.map(([yr, ms]) => `<circle cx="${x(yr).toFixed(1)}" cy="${y(Number(ms?.[mt.key] ?? 0)).toFixed(1)}" r="3.6"/>`).join('');
    return `<g class="tt-ch-series" data-m="${mt.key}" style="--mc:${mt.color};--i:${i}">
      <path class="tt-ch-line" d="${d}"/>
      <g class="tt-ch-dots">${dots}</g></g>`;
  }).join('');

  const endLabels = labels.map((l) => `<g class="tt-ch-end" data-m="${l.mt.key}" style="--mc:${l.mt.color}">
      <line class="tt-ch-lead" x1="${x(last[0]) + 6}" y1="${y(l.v)}" x2="${W - m.r + 12}" y2="${l.ty}"/>
      <text class="tt-ch-label" x="${W - m.r + 16}" y="${l.ty + 6}"><tspan class="tt-ch-lv">${Math.round(l.v)}</tspan> ${esc(l.mt.short)}</text></g>`).join('');

  return `<svg class="tt-chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="Diễn biến 6 chỉ số qua các năm">
    ${zone}${grid}${hl}${lines}${endLabels}${xLabels}${hits}${tpLines}
  </svg>`;
}

function listBlock(title, items, icon, render) {
  if (!items?.length) return '';
  return `<section class="tt-end-block"><h3 class="tt-h3">${glyph(icon)}${title}</h3><ol class="tt-end-list">
    ${items.map(render).join('')}</ol></section>`;
}

const yearAttr = (yr) => (yr != null && yr !== '' && !Number.isNaN(Number(yr)) ? ` data-year="${Number(yr)}" title="Bấm để xem năm ${Number(yr)} trên biểu đồ"` : '');

function turningPoint(t) {
  if (typeof t === 'string') return `<li><span>${esc(t)}</span></li>`;
  const head = [t.year != null ? `Năm ${t.year}` : '', t.code ?? t.choiceId].filter(Boolean).join(' · ');
  const label = t.label ?? t.title ?? '';
  const why = t.text ?? t.why ?? t.reason ?? '';
  return `<li${yearAttr(t.year)}>${head ? `<span class="tt-code is-small">${esc(head)}</span>` : ''}
    ${label ? `<b>${esc(label)}</b>` : ''}${why ? `<span class="tt-end-why">${esc(why)}</span>` : ''}</li>`;
}

function delayedItem(d) {
  if (typeof d === 'string') return `<li><span>${esc(d)}</span></li>`;
  const from = d.fromYear ?? d.from ?? d.source;
  const to = d.year ?? d.dueYear ?? d.to;
  const head = [from != null ? (typeof from === 'number' ? `Năm ${from}` : from) : '', to != null ? `Năm ${to}` : ''].filter(Boolean).join(' → ');
  return `<li${yearAttr(typeof to === 'number' ? to : null)}>${head ? `<span class="tt-code is-small">${esc(head)}</span>` : ''}<span>${esc(itemText(d))}</span></li>`;
}

const TONE_LABEL = { gain: 'Hưởng lợi', good: 'Hưởng lợi', loss: 'Chịu thiệt', bad: 'Chịu thiệt', mixed: 'Đan xen', neutral: 'Trung tính' };

function stakeholderCard(s) {
  const id = typeof s === 'string' ? s : s?.id;
  const tone = (typeof s === 'object' && (s.tone ?? s.verdict)) || 'neutral';
  const toneCls = { gain: 'good', good: 'good', loss: 'bad', bad: 'bad', mixed: 'mixed' }[tone] ?? 'neutral';
  const text = typeof s === 'object' ? itemText({ ...s, label: undefined, title: undefined }) : '';
  return `<li class="tt-end-sh is-${toneCls}" data-pop="sh:${esc(id)}">
    <span class="tt-sh-icon">${stakeholderIcon(id)}</span>
    <span class="tt-end-sh-body"><b>${esc(STAKEHOLDERS[id] ?? s?.label ?? id)}</b>
      <span class="tt-end-sh-tone">${esc(TONE_LABEL[tone] ?? tone)}</span>
      ${text ? `<span class="tt-end-why">${esc(text)}</span>` : ''}</span></li>`;
}

function whatIf(view) {
  const pick = (yr) => (view.history ?? []).find((h) => Number(h.year) === yr && isMain(h.code));
  const rows = [3, 6].map((yr) => {
    const h = pick(yr);
    return `<li><span class="tt-code is-small">Y${yr}</span>${h ? `Đã chọn <b>${esc(h.choiceId ?? '')}</b>${h.label ? ` — ${esc(h.label)}` : ''}` : '<span class="tt-muted">Chưa có dữ liệu</span>'}</li>`;
  }).join('');
  return `<section class="tt-end-block tt-whatif"><h3 class="tt-h3">${glyph('question')}Nếu chọn khác ở Y3, Y6 thì sao?</h3>
    <ul class="tt-end-list">${rows}</ul>
    <p class="tt-note tt-muted">Ai được lợi? Ai chịu chi phí? Có giải pháp thay thế trong giới hạn ngân sách? Nếu năng lực thực thi thấp thì sao?</p>
  </section>`;
}

function pathChips(view) {
  const mains = (view.history ?? []).filter((h) => isMain(h.code));
  if (!mains.length) return '';
  return `<div class="tt-path">${mains.map((h) => `<span class="tt-code is-small"${yearAttr(h.year)} title="${esc(h.label ?? '')}">${esc(h.choiceId ?? h.code)}</span>`).join('<span class="tt-path-sep">›</span>')}</div>`;
}

function legend() {
  return `<div class="tt-ch-legend" role="group" aria-label="Bật/tắt đường chỉ số">
    ${METRICS.map((mt) => `<button type="button" class="tt-ch-leg" data-legend="${mt.key}" style="--mc:${mt.color}" aria-pressed="true"
      title="Bấm: ẩn/hiện · Bấm đúp: chỉ xem chỉ số này"><span class="tt-ch-sw"></span>${esc(mt.short)}</button>`).join('')}
    <button type="button" class="tt-ch-leg is-all" data-legend="*" title="Hiện tất cả">Tất cả</button>
  </div>`;
}

export function renderEnd(view) {
  const e = view.ending ?? {};
  const tone = ENDING_TONES[e.id] ?? 'neutral';
  const secondary = (e.secondary ?? []).map((s) => (typeof s === 'string' ? s : [s.id, s.title].filter(Boolean).join(' '))).filter(Boolean);
  return `<article class="tt-endcard is-${tone}" data-phase="end">
    <div class="tt-card-scroll" data-scroll>
      <header class="tt-end-head">
        <div class="tt-tagrow"><span class="tt-tag">Tổng kết 8 năm</span>${e.id ? `<span class="tt-code">${esc(e.id)}</span>` : ''}${pathChips(view)}</div>
        <h1 class="tt-end-title">${esc(e.title ?? 'Kết thúc')}</h1>
        ${e.text ? `<p class="tt-end-text">${esc(e.text)}</p>` : ''}
        ${secondary.length ? `<p class="tt-end-secondary"><span class="tt-eyebrow">Chú giải phụ</span> ${secondary.map((s) => `<span class="tt-flag is-mixed">${esc(s)}</span>`).join(' ')}</p>` : ''}
      </header>
      <div class="tt-end-grid">
        <section class="tt-end-block tt-end-chart"><h3 class="tt-h3">Diễn biến 6 chỉ số</h3>
          <p class="tt-ch-caption">Nét đứt: năm có quyết định bước ngoặt · Vùng đỏ nhạt: dưới ${WARN_LEVEL} · Rê hoặc bấm vào một năm để xem chi tiết</p>
          ${legend()}
          <div class="tt-ch-wrap">${lineChart(view)}<div class="tt-ch-tip" hidden></div></div></section>
        <div class="tt-end-side">
          ${e.question ? `<section class="tt-end-block tt-end-question"><h3 class="tt-h3">${glyph('book')}Câu hỏi giáo trình</h3><p>${esc(e.question)}</p></section>` : ''}
          ${listBlock('Quyết định bước ngoặt', view.turningPoints, 'flag', turningPoint)}
        </div>
        ${listBlock('Hệ quả trễ', view.delayed, 'clock', delayedItem)}
        ${view.stakeholders?.length ? `<section class="tt-end-block"><h3 class="tt-h3">Quyền lợi các nhóm</h3><ul class="tt-end-list tt-end-shs">${view.stakeholders.map(stakeholderCard).join('')}</ul></section>` : ''}
        ${whatIf(view)}
      </div>
    </div>
    ${choiceList(view)}
  </article>`;
}

// ---------- chart interaction (wired after each render of the end card) ----------

const yearTitle = (yr) => (YEAR_THEMES[yr] ? ` <small>· ${esc(YEAR_THEMES[yr])}</small>` : '');

function tipHtml(view, points, idx) {
  const [yr, ms] = points[idx];
  const prev = idx > 0 ? points[idx - 1][1] : null;
  const rows = METRICS.map((mt) => {
    const v = Number(ms?.[mt.key] ?? 0);
    const d = prev ? v - Number(prev[mt.key] ?? 0) : 0;
    return `<li data-m="${mt.key}" style="--mc:${mt.color}"><span class="tt-ch-sw"></span><span class="tt-tip-name">${esc(mt.short)}</span>
      <b>${Math.round(v)}</b>${prev ? `<span class="tt-tip-d ${d > 0 ? 'is-good' : d < 0 ? 'is-bad' : ''}">${d ? signed(d) : '·'}</span>` : ''}</li>`;
  }).join('');
  const decisions = (view.history ?? []).filter((h) => Number(h.year) === yr);
  return `<div class="tt-tip-head">${yr === 0 ? 'Khởi điểm' : `Năm ${yr}`}${yearTitle(yr)}</div>
    <ul class="tt-tip-rows">${rows}</ul>
    ${decisions.length ? `<ul class="tt-tip-dec">${decisions.map((h) => `<li><span class="tt-code is-small">${esc(h.choiceId ?? h.code)}</span> ${esc(h.label ?? '')}</li>`).join('')}</ul>` : ''}`;
}

export function wireEnd(root, view) {
  const card = root.querySelector('.tt-endcard');
  const svg = root.querySelector('.tt-chart');
  if (!card || !svg) return;
  const wrap = svg.parentElement;
  const tip = wrap.querySelector('.tt-ch-tip');
  const hl = svg.querySelector('.tt-ch-hl');
  const points = seriesFrom(view);
  let pinned = null;
  let hovered = null;
  let hidden = new Set();

  function draw() {
    const yr = hovered ?? pinned;
    const idx = yr == null ? -1 : points.findIndex((p) => p[0] === yr);
    svg.querySelectorAll('.tt-ch-hit').forEach((r) => r.classList.toggle('is-on', Number(r.dataset.yr) === yr));
    card.querySelectorAll('[data-year]').forEach((el) => el.classList.toggle('is-hl', pinned != null && Number(el.dataset.year) === pinned));
    if (idx < 0) { tip.hidden = true; hl.setAttribute('visibility', 'hidden'); return; }
    const hit = svg.querySelector(`.tt-ch-hit[data-yr="${yr}"]`);
    const cx = Number(hit.getAttribute('x')) + Number(hit.getAttribute('width')) / 2;
    hl.setAttribute('x1', cx); hl.setAttribute('x2', cx);
    hl.setAttribute('visibility', 'visible');
    tip.innerHTML = tipHtml(view, points, idx);
    tip.querySelectorAll('[data-m]').forEach((li) => li.classList.toggle('is-off', hidden.has(li.dataset.m)));
    tip.classList.toggle('is-pinned', pinned === yr);
    tip.hidden = false;
    // Beside the year column, flipped to the left near the right edge.
    const w = wrap.getBoundingClientRect();
    const r = hit.getBoundingClientRect();
    const t = tip.getBoundingClientRect();
    const mid = r.left + r.width / 2 - w.left;
    let left = mid + r.width * 0.35;
    if (left + t.width > w.width) left = mid - r.width * 0.35 - t.width;
    tip.style.left = `${Math.max(0, left)}px`;
    tip.style.top = `${Math.max(0, Math.min(w.height - t.height, r.top - w.top))}px`;
  }

  function pin(yr, { scroll = false } = {}) {
    pinned = pinned === yr ? null : yr;
    hovered = null;
    draw();
    if (scroll && pinned != null) wrap.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }

  svg.addEventListener('pointerover', (e) => {
    const yr = e.target.closest?.('[data-yr]')?.dataset.yr;
    if (yr == null || e.pointerType !== 'mouse') return;
    hovered = Number(yr);
    draw();
  });
  svg.addEventListener('pointerleave', () => { hovered = null; draw(); });
  svg.addEventListener('click', (e) => {
    const el = e.target.closest?.('[data-yr]');
    if (el) pin(Number(el.dataset.yr));
  });

  card.addEventListener('click', (e) => {
    const yEl = e.target.closest('[data-year]');
    if (yEl) { pin(Number(yEl.dataset.year), { scroll: true }); return; }
    const leg = e.target.closest('[data-legend]');
    if (!leg) return;
    leg.blur();
    const key = leg.dataset.legend;
    if (key === '*') hidden = new Set();
    else if (e.detail === 2) {
      // Double click: isolate this metric, or show all again if it already is isolated.
      const others = METRICS.map((m) => m.key).filter((k) => k !== key);
      // The first click of the double click already toggled `key`; undo that before deciding.
      if (hidden.has(key)) hidden.delete(key); else hidden.add(key);
      const isolated = others.every((k) => hidden.has(k)) && !hidden.has(key);
      hidden = isolated ? new Set() : new Set(others);
    } else if (e.detail <= 1) {
      if (hidden.has(key)) hidden.delete(key); else hidden.add(key);
    }
    applyLegend();
  });
  card.addEventListener('pointerover', (e) => {
    const leg = e.target.closest?.('[data-legend]');
    const key = leg && leg.dataset.legend !== '*' ? leg.dataset.legend : null;
    svg.classList.toggle('has-focus', !!key);
    svg.querySelectorAll('[data-m]').forEach((g) => g.classList.toggle('is-focus', g.dataset.m === key));
  });

  function applyLegend() {
    svg.querySelectorAll('[data-m]').forEach((g) => g.classList.toggle('is-off', hidden.has(g.dataset.m)));
    card.querySelectorAll('[data-legend]').forEach((b) => {
      const on = b.dataset.legend === '*' ? hidden.size === 0 : !hidden.has(b.dataset.legend);
      b.classList.toggle('is-off', !on);
      b.setAttribute('aria-pressed', String(on));
    });
    draw();
  }
}
