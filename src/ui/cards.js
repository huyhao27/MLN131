// Right-hand card for every in-game phase (everything except `end`).
// Returns an HTML string; index.js wires clicks via [data-opt] delegation.
import {
  METRICS, METRIC_BY_KEY, RESOURCES, RESOURCE_BY_KEY, YEAR_THEMES, PHASE_TAGS,
  chapterLabel, flagInfo,
} from './labels.js';
import { glyph, stakeholderBadge } from './icons.js';
import { esc, signed, itemText } from './util.js';

// ---------- shared pieces ----------

function tagRow(view, { tag, tone = '', code } = {}) {
  const parts = [];
  if (code ?? view.code) parts.push(`<span class="tt-code">${esc(code ?? view.code)}</span>`);
  parts.push(`<span class="tt-tag ${tone}">${esc(tag ?? PHASE_TAGS[view.phase] ?? view.phase)}</span>`);
  if (view.chapter != null && view.chapter !== '') parts.push(`<span class="tt-tag is-chapter">${esc(chapterLabel(view.chapter))}</span>`);
  return `<div class="tt-tagrow">${parts.join('')}</div>`;
}

function paragraphs(text) {
  if (!text) return '';
  const list = Array.isArray(text) ? text : String(text).split(/\n{2,}/);
  return list.filter(Boolean).map((p) => `<p>${esc(p)}</p>`).join('');
}

function facts(list, title = 'Dữ kiện') {
  if (!list?.length) return '';
  return `<section class="tt-sec"><h3 class="tt-h3">${esc(title)}</h3>
    <ul class="tt-facts">${list.map((f) => `<li>${esc(itemText(f))}</li>`).join('')}</ul></section>`;
}

function costChip(cost) {
  if (cost == null || cost === '') return '';
  const c = Number(cost);
  if (Number.isNaN(c)) return `<span class="tt-cost">${glyph('budget')}${esc(cost)}</span>`;
  const txt = c > 0 ? `Chi ${c}` : c < 0 ? `Thu về ${Math.abs(c)}` : 'Không tốn';
  return `<span class="tt-cost ${c < 0 ? 'is-gain' : ''}" title="Chi phí ngân sách">${glyph('budget')}<span>${txt}</span></span>`;
}

function isSingle(view) {
  return (view.options?.length ?? 0) === 1;
}

export function choiceList(view) {
  const opts = view.options ?? [];
  if (!opts.length) return '';
  if (opts.length === 1) {
    const o = opts[0];
    return `<div class="tt-choices is-single">
      <button class="tt-continue" data-opt="${esc(o.id)}" type="button">
        <span>${esc(o.label || 'Tiếp tục')}</span><kbd class="tt-kbd">Enter</kbd>
      </button></div>`;
  }
  return `<div class="tt-choices" role="group" aria-label="Các phương án">
    ${opts.map((o, i) => `
      <button class="tt-choice${o.disabled ? ' is-disabled' : ''}" data-opt="${esc(o.id)}" type="button"
        ${o.disabled ? 'aria-disabled="true"' : ''} style="--i:${i}">
        <kbd class="tt-key">${esc(o.key ?? i + 1)}</kbd>
        <span class="tt-choice-body">
          <span class="tt-choice-label">${esc(o.label)}</span>
          ${o.explanation ? `<span class="tt-choice-expl tt-note">${esc(o.explanation)}</span>` : ''}
          ${o.disabled ? `<span class="tt-choice-reason">${glyph('lock')}${esc(o.disabledReason || 'Chưa đủ điều kiện')}</span>` : ''}
        </span>
        ${costChip(o.cost)}
      </button>`).join('')}
  </div>`;
}

function stakeholderRow(list, title = 'Các nhóm liên quan') {
  if (!list?.length) return '';
  return `<section class="tt-sec"><h3 class="tt-h3">${esc(title)}</h3>
    <div class="tt-sh-row">${list.map((s) => stakeholderBadge(s)).join('')}</div></section>`;
}

// Delta chips for metric deltas (+ optional resource deltas).
export function deltaChips(deltas = {}, resourceDeltas = {}, { big = false } = {}) {
  const chips = [];
  let i = 0;
  for (const m of METRICS) {
    const d = Number(deltas?.[m.key]);
    if (!d) continue;
    chips.push(`<span class="tt-delta ${d > 0 ? 'is-good' : 'is-bad'}${big ? ' is-big' : ''} tt-reveal" style="--i:${i++};--mc:${m.color}" title="${esc(m.name)}">
      <span class="tt-delta-name">${esc(m.short)}</span>
      <span class="tt-delta-num">${glyph(d > 0 ? 'up' : 'down')}${signed(d)}</span></span>`);
  }
  for (const r of RESOURCES) {
    const d = Number(resourceDeltas?.[r.key]);
    if (!d) continue;
    const good = r.bad ? d < 0 : d > 0;
    chips.push(`<span class="tt-delta is-res ${good ? 'is-good' : 'is-bad'}${big ? ' is-big' : ''} tt-reveal" style="--i:${i++}">
      <span class="tt-delta-name">${esc(r.name)}</span><span class="tt-delta-num">${signed(d)}</span></span>`);
  }
  // Unknown keys (future metrics) still show up rather than vanish silently.
  for (const [k, v] of Object.entries(deltas ?? {})) {
    if (METRIC_BY_KEY[k] || RESOURCE_BY_KEY[k] || !Number(v)) continue;
    chips.push(`<span class="tt-delta ${v > 0 ? 'is-good' : 'is-bad'} tt-reveal" style="--i:${i++}"><span class="tt-delta-name">${esc(k)}</span><span class="tt-delta-num">${signed(v)}</span></span>`);
  }
  return chips.length ? `<div class="tt-deltas${big ? ' is-big' : ''}">${chips.join('')}</div>` : '';
}

function flagChips(list) {
  if (!list?.length) return '';
  return `<section class="tt-sec"><h3 class="tt-h3">Di sản chính sách</h3><div class="tt-flags">
    ${list.map((f) => {
      const info = flagInfo(f);
      return `<span class="tt-flag is-${info.tone}${info.removed ? ' is-removed' : ''}" title="${esc(info.id)}">${glyph('flag')}${info.removed ? 'Gỡ bỏ: ' : ''}${esc(info.label)}</span>`;
    }).join('')}</div></section>`;
}

function scheduledList(list) {
  if (!list?.length) return '';
  return `<section class="tt-sec"><h3 class="tt-h3">Hệ quả hẹn trước</h3><ul class="tt-sched">
    ${list.map((s) => `<li>${glyph('clock')}<b>${s.year != null ? `Năm ${esc(s.year)}` : 'Sau này'}:</b> <span>${esc(itemText(s))}</span></li>`).join('')}
  </ul></section>`;
}

function winnersLosers(view) {
  const w = view.winners ?? [];
  const l = view.losers ?? [];
  if (!w.length && !l.length) return '';
  const col = (title, list, cls) => `<div class="tt-wl-col ${cls}"><h3 class="tt-h3">${title}</h3>
    <div class="tt-sh-row">${list.length ? list.map((s) => stakeholderBadge(s)).join('') : '<span class="tt-muted">Không rõ rệt</span>'}</div></div>`;
  return `<section class="tt-sec tt-wl">${col('Hưởng lợi', w, 'is-win')}${col('Chịu chi phí', l, 'is-lose')}</section>`;
}

function academicBox(a) {
  if (!a) return '';
  // With an explicit topic, keep only "Chương N" so the topic is not repeated.
  const ch = a.chapter != null && a.topic && /^\d+$/.test(String(a.chapter)) ? `Chương ${a.chapter}` : chapterLabel(a.chapter);
  const head = [ch, a.topic].filter(Boolean).join(' — ');
  return `<section class="tt-academic">
    <h3 class="tt-h3">${glyph('book')}Lăng kính học thuật</h3>
    ${head ? `<div class="tt-ac-topic">${esc(head)}</div>` : ''}
    ${a.lesson ? `<p class="tt-ac-lesson tt-note">${esc(a.lesson)}</p>` : ''}
    ${a.debrief ? `<p class="tt-ac-debrief">${glyph('question')}<span>${esc(a.debrief)}</span></p>` : ''}
  </section>`;
}

function card(view, inner, { cls = '' } = {}) {
  return `<article class="tt-card ${cls}" data-phase="${esc(view.phase)}">
    <div class="tt-card-scroll" data-scroll>${inner}</div>
    ${choiceList(view)}
  </article>`;
}

// ---------- phases ----------

const RENDERERS = {
  briefing(view, ctx) {
    const keys = [
      ['1 – 4', 'Chọn phương án'], ['Enter', 'Tiếp tục'], ['P', 'Chế độ trình chiếu'],
      ['S', 'Bỏ qua hoạt ảnh'], ['F', 'Toàn màn hình'], ['↑ ↓', 'Cuộn nội dung'],
    ];
    if (ctx.canToggleRandom) keys.push(['R', 'Bật/tắt biến cố ngẫu nhiên']);
    return card(view, `
      ${tagRow(view, { tag: 'Giới thiệu', code: null })}
      <h1 class="tt-title">${esc(view.title || 'The Transition — Thời kỳ quá độ')}</h1>
      <div class="tt-prose">${paragraphs(view.paragraphs ?? view.text)}</div>
      <section class="tt-sec tt-note"><h3 class="tt-h3">Điều khiển</h3>
        <dl class="tt-keys">${keys.map(([k, d]) => `<div><dt><kbd class="tt-kbd">${k}</kbd></dt><dd>${d}</dd></div>`).join('')}</dl>
      </section>
      ${ctx.canToggleRandom ? `<button class="tt-ghost" data-action="toggle-random" type="button">${glyph('dice')}Biến cố ngẫu nhiên: <b>${view.randomEvents === false ? 'Tắt' : 'Bật'}</b></button>` : ''}
    `, { cls: 'is-briefing' });
  },

  yearStart(view) {
    const y = Number(view.year);
    const gain = Number(view.budgetGain);
    const applied = view.applied ?? [];
    return card(view, `
      ${tagRow(view, { tag: 'Đầu năm', code: null })}
      <h1 class="tt-title">Năm ${esc(view.year)} bắt đầu${YEAR_THEMES[y] ? `<small> · ${esc(YEAR_THEMES[y])}</small>` : ''}</h1>
      ${view.budgetGain != null ? `<div class="tt-bignum ${gain < 0 ? 'is-bad' : 'is-good'}">${glyph('budget')}<b>${signed(gain)}</b><span>ngân sách thu trong năm</span></div>` : ''}
      ${paragraphs(view.text)}
      <section class="tt-sec"><h3 class="tt-h3">Hệ quả trễ đến hạn</h3>
        ${applied.length ? `<ul class="tt-applied">${applied.map((a) => `
          <li>${a.source ? `<span class="tt-code is-small">${esc(a.source)}</span>` : ''}
            <span class="tt-applied-text">${esc(itemText(a))}</span>
            ${deltaChips(a.deltas, a.resourceDeltas)}</li>`).join('')}</ul>`
          : '<p class="tt-muted">Không có hệ quả trễ nào đến hạn năm nay.</p>'}
      </section>
    `, { cls: 'is-yearstart' });
  },

  consequence(view) {
    return card(view, `
      ${tagRow(view, { tag: 'Hệ quả tiếp diễn', tone: 'is-warn' })}
      <h1 class="tt-title">${esc(view.headline)}</h1>
      <div class="tt-prose tt-quote">${paragraphs(view.text)}</div>
      ${facts(view.facts)}
    `, { cls: 'is-consequence' });
  },

  event(view) {
    return card(view, `
      ${tagRow(view, { tag: `Năm ${view.year ?? ''}`.trim() })}
      <h1 class="tt-title">${esc(view.headline)}</h1>
      <div class="tt-prose">${paragraphs(view.context)}</div>
      ${facts(view.facts, 'Dữ kiện kiểm chứng')}
      ${view.conflict ? `<section class="tt-sec tt-callout is-conflict"><h3 class="tt-h3">Mâu thuẫn</h3><p>${esc(view.conflict)}</p></section>` : ''}
      ${view.uncertainty ? `<section class="tt-sec tt-callout is-uncertain"><h3 class="tt-h3">Thông tin còn thiếu</h3><p>${esc(view.uncertainty)}</p></section>` : ''}
      ${stakeholderRow(view.stakeholders)}
    `, { cls: 'is-event' });
  },

  result(view) {
    return card(view, `
      ${tagRow(view, { tag: 'Kết quả' })}
      <div class="tt-chosen"><span class="tt-eyebrow">Hội đồng đã chọn</span><h1 class="tt-title">${esc(view.choiceLabel)}</h1></div>
      <section class="tt-sec"><h3 class="tt-h3">Tác động tức thì</h3>
        ${deltaChips(view.deltas, view.resourceDeltas, { big: true }) || '<p class="tt-muted">Không có thay đổi tức thì đáng kể.</p>'}</section>
      ${paragraphs(view.text)}
      ${flagChips(view.flagsSet)}
      ${scheduledList(view.scheduled)}
      ${winnersLosers(view)}
      ${academicBox(view.academic)}
    `, { cls: 'is-result' });
  },

  random(view) {
    return card(view, `
      ${tagRow(view, { tag: 'Biến cố bất ngờ', tone: 'is-random' })}
      <h1 class="tt-title">${esc(view.headline)}</h1>
      <div class="tt-prose">${paragraphs(view.text)}</div>
      ${facts(view.facts)}
      ${stakeholderRow(view.stakeholders)}
    `, { cls: 'is-random' });
  },

  randomResult(view) {
    return card(view, `
      ${tagRow(view, { tag: 'Kết quả biến cố', tone: 'is-random' })}
      <div class="tt-chosen"><span class="tt-eyebrow">Phản ứng</span><h1 class="tt-title is-small">${esc(view.choiceLabel)}</h1></div>
      ${deltaChips(view.deltas, view.resourceDeltas, { big: true })}
      ${paragraphs(view.text)}
      ${flagChips(view.flagsSet)}
      ${scheduledList(view.scheduled)}
      ${winnersLosers(view)}
      ${academicBox(view.academic)}
    `, { cls: 'is-random-result' });
  },

  finalRepair(view) {
    return card(view, `
      ${tagRow(view, { tag: 'Quyền cứu vãn một lần', tone: 'is-danger' })}
      <h1 class="tt-title">${esc(view.headline || view.title || 'Khủng hoảng kéo dài hai năm')}</h1>
      <div class="tt-prose">${paragraphs(view.text)}</div>
      ${facts(view.facts)}
    `, { cls: 'is-repair' });
  },
};

export function renderCard(view, ctx) {
  const fn = RENDERERS[view.phase];
  if (fn) return fn(view, ctx);
  // Unknown phase: still show something usable instead of a blank screen.
  return card(view, `${tagRow(view, { tag: view.phase })}
    <h1 class="tt-title">${esc(view.headline || view.title || view.phase)}</h1>${paragraphs(view.text)}`);
}

export { isSingle };
