// Top bar (year timeline + resources) and bottom dashboard (6 metric bars + warning line).
// Keeps the last shown numbers so value changes animate with +/- floaters.
import { METRICS, RESOURCES, YEAR_THEMES, TOTAL_YEARS, WARN_LEVEL } from './labels.js';
import { glyph } from './icons.js';
import { esc, signed } from './util.js';

const RES_GLYPH = { BUDGET: 'budget', CAPACITY: 'capacity', DEBT: 'debt' };
const TWEEN_MS = 900;

export function createDashboard(topEl, dashEl, ctx) {
  topEl.innerHTML = `
    <div class="tt-top-row">
      <div class="tt-yearbox">
        <span class="tt-eyebrow">Cộng hòa Hòa Minh</span>
        <span class="tt-year">Năm <b data-year>1</b><small>/${TOTAL_YEARS}</small></span>
      </div>
      <ol class="tt-timeline">
        ${Array.from({ length: TOTAL_YEARS }, (_, i) => `
          <li data-y="${i + 1}"><span class="tt-tl-dot">${i + 1}</span><span class="tt-tl-lbl">${YEAR_THEMES[i + 1]}</span></li>`).join('')}
      </ol>
    </div>
    <div class="tt-top-row tt-res-row">
      ${RESOURCES.map((r) => `
        <div class="tt-res" data-res="${r.key}" data-pop="res:${r.key}" title="${r.name} — bấm để xem chi tiết">
          ${glyph(RES_GLYPH[r.key])}
          <span class="tt-res-name">${r.name}</span>
          <span class="tt-res-val" data-val>–</span>
          <span class="tt-float-host"></span>
        </div>`).join('')}
      <div class="tt-badges"></div>
    </div>`;

  dashEl.innerHTML = `
    <div class="tt-warning" hidden>${glyph('warning')}<span data-warning></span></div>
    <div class="tt-metrics">
      ${METRICS.map((m) => `
        <div class="tt-metric" data-m="${m.key}" data-pop="metric:${m.key}" style="--mc:${m.color}" title="${m.name} — bấm để xem chi tiết">
          <div class="tt-m-head">
            <span class="tt-m-name">${m.name}</span>
            <span class="tt-m-val" data-val>–</span>
          </div>
          <div class="tt-m-bar">
            <div class="tt-m-zone" style="width:${WARN_LEVEL}%"></div>
            <div class="tt-m-fill"></div>
            <div class="tt-m-mark" style="left:${WARN_LEVEL}%"></div>
          </div>
          <span class="tt-float-host"></span>
        </div>`).join('')}
    </div>`;

  const shown = {}; // key -> number currently displayed
  const tweens = new Map(); // key -> rAF id

  const metricEls = Object.fromEntries(METRICS.map((m) => [m.key, dashEl.querySelector(`[data-m="${m.key}"]`)]));
  const resEls = Object.fromEntries(RESOURCES.map((r) => [r.key, topEl.querySelector(`[data-res="${r.key}"]`)]));

  function setNumber(key, el, value) {
    el.querySelector('[data-val]').textContent = Math.round(value);
  }

  function tweenNumber(key, el, from, to) {
    cancelAnimationFrame(tweens.get(key));
    if (ctx.skip()) { setNumber(key, el, to); return; }
    const t0 = performance.now();
    const step = (now) => {
      const t = Math.min(1, (now - t0) / TWEEN_MS);
      const e = 1 - Math.pow(1 - t, 3);
      setNumber(key, el, from + (to - from) * e);
      if (t < 1) tweens.set(key, requestAnimationFrame(step));
    };
    tweens.set(key, requestAnimationFrame(step));
  }

  function floater(el, delta, invert) {
    if (ctx.skip() || !delta) return;
    const host = el.querySelector('.tt-float-host');
    const good = invert ? delta < 0 : delta > 0;
    const f = document.createElement('span');
    f.className = `tt-floater ${good ? 'is-good' : 'is-bad'}`;
    f.textContent = signed(delta);
    host.appendChild(f);
    f.addEventListener('animationend', () => f.remove());
    setTimeout(() => f.remove(), 2600);
    el.classList.remove('is-flash-good', 'is-flash-bad');
    void el.offsetWidth; // restart flash animation
    el.classList.add(good ? 'is-flash-good' : 'is-flash-bad');
  }

  function updateValue(key, el, value, { invert = false, bar = false } = {}) {
    if (value == null || Number.isNaN(Number(value))) return;
    const v = Number(value);
    const prev = shown[key];
    if (bar) {
      el.querySelector('.tt-m-fill').style.width = `${Math.max(0, Math.min(100, v))}%`;
      el.classList.toggle('is-low', v < WARN_LEVEL);
    }
    if (prev == null) setNumber(key, el, v);
    else if (prev !== v) {
      tweenNumber(key, el, prev, v);
      floater(el, v - prev, invert);
    }
    shown[key] = v;
  }

  return {
    update(view) {
      for (const m of METRICS) updateValue(m.key, metricEls[m.key], view.metrics?.[m.key], { bar: true });
      for (const r of RESOURCES) updateValue(r.key, resEls[r.key], view.resources?.[r.key], { invert: r.bad });
      resEls.BUDGET.classList.toggle('is-low', Number(view.resources?.BUDGET) < 0);
      resEls.DEBT.classList.toggle('is-low', Number(view.resources?.DEBT) >= 60);

      const year = Number(view.year) || 1;
      topEl.querySelector('[data-year]').textContent = Math.min(year, TOTAL_YEARS);
      topEl.querySelectorAll('.tt-timeline li').forEach((li) => {
        const y = Number(li.dataset.y);
        li.classList.toggle('is-past', y < year || view.phase === 'end');
        li.classList.toggle('is-now', y === year && view.phase !== 'end' && view.phase !== 'briefing');
      });

      const warn = dashEl.querySelector('.tt-warning');
      warn.hidden = !view.warning;
      warn.querySelector('[data-warning]').textContent = view.warning ?? '';
    },
    setBadges(list) {
      topEl.querySelector('.tt-badges').innerHTML = list.map((b) => `<span class="tt-badge">${esc(b)}</span>`).join('');
    },
    finish() {
      for (const [key, id] of tweens) {
        cancelAnimationFrame(id);
        const el = metricEls[key] ?? resEls[key];
        if (el && shown[key] != null) setNumber(key, el, shown[key]);
      }
      tweens.clear();
      document.querySelectorAll('.tt-floater').forEach((f) => f.remove());
    },
  };
}
