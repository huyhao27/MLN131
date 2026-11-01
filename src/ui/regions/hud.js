// Map-first HUD: top bar (period, money, slots, next-period button) and the news strip.
import { esc } from '../util.js';
import { icon, chainHtml, regionMeta, signedNum } from './text.js';

// Problems the player should know about before ending the period.
export function pendingWarnings(view) {
  const out = [];
  for (const p of view?.problems ?? []) {
    if (p.chosen || p.status === 'working') continue;
    const dueNow = p.deadline != null && p.deadline <= view.period;
    if (p.origin === 'opportunity') {
      if (dueNow) out.push({ p, text: 'cơ hội hết hạn kỳ này', soft: true });
      continue;
    }
    if (p.status === 'escalated' || p.severity >= 3 || dueNow) {
      out.push({ p, text: dueNow ? 'hết hạn kỳ này' : p.status === 'escalated' ? 'đang leo thang' : 'mức nặng' });
    }
  }
  return out;
}

export function renderTop(view, { confirmOpen = false, testMode = false } = {}) {
  const slots = view.slots ?? { used: 0, max: 2 };
  const full = slots.used >= slots.max;
  const warns = pendingWarnings(view);
  const hard = warns.filter((w) => !w.soft).length;
  const last = view.period >= view.totalPeriods;
  return `
    <div class="rg-top-row">
      <div class="rg-period" aria-label="Kỳ ${view.period} trên ${view.totalPeriods}">
        <span class="rg-eyebrow">Kỳ</span>
        <span class="rg-period-num"><b>${esc(view.period)}</b><small>/${esc(view.totalPeriods)}</small></span>
      </div>
      <ul class="rg-stats">
        <li class="rg-stat is-budget" title="Ngân sách hiện có">${icon('budget')}<span class="rg-stat-label">Ngân sách</span><b>${esc(view.budget)}</b></li>
        <li class="rg-stat" title="Thu dự kiến kỳ tới, đã trừ phí duy trì">${icon('income')}<span class="rg-stat-label">Thu kỳ tới</span><b>${esc(signedNum(view.incomeNext))}</b></li>
        <li class="rg-stat${view.upkeep > 0 ? ' is-upkeep' : ''}" title="Phí duy trì đang trả mỗi kỳ">${icon('upkeep')}<span class="rg-stat-label">Phí duy trì</span><b>${view.upkeep > 0 ? '−' + esc(view.upkeep) : '0'}<small>/kỳ</small></b></li>
        <li class="rg-stat${full ? ' is-full' : ''}" title="Dự án dài hạn đang thi công (tối đa ${esc(slots.max)})">${icon('project')}<span class="rg-stat-label">Dự án</span><b>${esc(slots.used)}/${esc(slots.max)}</b>${full ? '<span class="rg-stat-note">đã đủ</span>' : ''}</li>
      </ul>
      ${testMode ? '<span class="rg-badge-test">Thử nghiệm</span>' : ''}
      <div class="rg-next-wrap">
        <button type="button" class="rg-next${hard ? ' has-warn' : ''}" data-action="next" aria-keyshortcuts="N">
          ${hard ? icon('attention') : icon('next')}<span>${last ? 'Kết thúc ván' : 'Sang kỳ tiếp theo'}</span><kbd>N</kbd>
        </button>
        ${confirmOpen ? confirmHtml(view, warns, last) : ''}
      </div>
    </div>`;
}

function confirmHtml(view, warns, last) {
  return `<div class="rg-confirm" role="alertdialog" aria-label="Còn việc chưa xử lý">
    <p class="rg-confirm-title">${icon('attention')}<b>Còn ${warns.length} việc chưa xử lý</b></p>
    <ul>${warns.slice(0, 4).map((w) => `<li><button type="button" class="rg-linkish" data-open-problem="${esc(w.p.instanceId)}" data-region="${esc(w.p.region)}">${esc(w.p.title)}</button> <span class="rg-muted">· ${esc(regionMeta(view, w.p.region).short)} · ${esc(w.text)}</span></li>`).join('')}</ul>
    <p class="rg-muted rg-confirm-hint">Vấn đề chưa xử lý sẽ tiếp tục sang kỳ sau${last ? '' : ' và có thể nặng thêm'}.</p>
    <div class="rg-confirm-actions">
      <button type="button" class="rg-btn is-primary" data-action="next-confirm">${last ? 'Vẫn kết thúc' : 'Vẫn sang kỳ'} <kbd>N</kbd></button>
      <button type="button" class="rg-btn" data-action="next-cancel">Ở lại <kbd>Esc</kbd></button>
    </div>
  </div>`;
}

export function renderNews(view, { expanded = false } = {}) {
  const now = (view.news ?? []).filter((n) => n.period === view.period);
  if (!now.length) return '';
  const max = expanded ? now.length : 2;
  const items = now.slice(0, max);
  const rest = now.length - items.length;
  return `
    <h2 class="rg-news-head">${icon('news')}<span>Tin kỳ ${esc(view.period)}</span></h2>
    <ul class="rg-news-list">
      ${items.map((n) => `<li class="rg-news-item is-${esc(n.tone || 'neutral')}"${n.region ? ` data-region-hover="${esc(n.region)}"` : ''}>
        ${icon(n.tone === 'good' ? 'good' : n.tone === 'bad' ? 'bad' : 'neutral', 'rg-news-ic')}
        <span class="rg-news-text">${n.region ? `<b class="rg-news-region">${esc(regionMeta(view, n.region).short)}:</b> ` : ''}${esc(n.text)}${n.chain?.length ? `<span class="rg-news-chain"><span class="rg-sr">Chuỗi: </span>${chainHtml(n.chain)}</span>` : ''}</span>
      </li>`).join('')}
    </ul>
    ${rest > 0 || expanded ? `<button type="button" class="rg-linkish rg-news-more" data-action="news-toggle">${expanded ? 'Thu gọn' : `+${rest} tin khác`}</button>` : ''}`;
}
