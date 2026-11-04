// Map-first HUD: top bar (period, money, slots, next-period button) and the news strip.
import { BUSINESS_TITLES } from './challenge.js';
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
  const business = view.business;
  const businessTitle = business ? BUSINESS_TITLES[business.challenge.kind] : '';
  const businessLabel = business?.status === 'ready' ? 'Chơi minigame' :
    business?.status === 'won' ? 'Đã nhận +' + business.reward + ' ngân sách' : 'Đã hết lượt';
  // Two compact pills at the top corners; the strip between them is map (pointer-events: none).
  return `
    <div class="rg-top-row">
      <div class="rg-hud">
        <div class="rg-period" aria-label="Kỳ ${esc(view.period)} trên ${esc(view.totalPeriods)}">
          <span class="rg-eyebrow">Kỳ</span>
          <span class="rg-period-num"><b>${esc(view.period)}</b><small>/${esc(view.totalPeriods)}</small></span>
        </div>
        <ul class="rg-stats">
          <li class="rg-stat is-budget" title="Ngân sách hiện có">${icon('budget')}<span class="rg-stat-label">Ngân sách</span><b>${esc(view.budget)}</b></li>
          <li class="rg-stat" title="Thu dự kiến kỳ tới, đã trừ phí duy trì">${icon('income')}<span class="rg-stat-label">Thu kỳ tới</span><b>${esc(signedNum(view.incomeNext))}</b></li>
          <li class="rg-stat${view.upkeep > 0 ? ' is-upkeep' : ''}" title="Phí duy trì đang trả mỗi kỳ">${icon('upkeep')}<span class="rg-stat-label">Duy trì</span><b>${view.upkeep > 0 ? '−' + esc(view.upkeep) : '0'}<small>/kỳ</small></b></li>
          <li class="rg-stat${full ? ' is-full' : ''}" title="Dự án dài hạn đang thi công (tối đa ${esc(slots.max)})${full ? ' · đã đủ chỗ' : ''}">${icon('project')}<span class="rg-stat-label">Dự án</span><b>${esc(slots.used)}/${esc(slots.max)}</b></li>
        </ul>
        ${testMode ? '<span class="rg-badge-test">Thử nghiệm</span>' : ''}
      </div>
      <div class="rg-next-wrap">
        ${business ? `<button type="button" class="rg-btn rg-business" data-action="business" title="${businessTitle}" ${business.status === 'ready' ? '' : 'disabled'}>${businessLabel}</button>` : ''}
        <button type="button" class="rg-next${hard ? ' has-warn' : ''}" data-action="next" aria-keyshortcuts="N"${hard ? ` title="Còn ${hard} việc gấp chưa xử lý"` : ''}>
          ${hard ? icon('attention') : icon('next')}<span>${last ? 'Kết thúc ván' : 'Sang kỳ tiếp theo'}</span><kbd>N</kbd>
        </button>
        ${confirmOpen ? confirmHtml(view, warns, last) : ''}
      </div>
    </div>
    ${business ? `<button type="button" class="rg-btn is-primary rg-business" data-action="business"
      ${business.status === 'ready' ? '' : 'disabled'}>
      <b>${businessLabel}</b>
      <span>${businessTitle}${business.status === 'ready' ? ' · +' + business.prize + ' nếu thắng' : ''}</span>
    </button>` : ''}`;
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

// News: a one-line ticker by default (most important item of this period); the full
// list opens upward on demand.
export function renderNews(view, { expanded = false } = {}) {
  const now = (view.news ?? []).filter((n) => n.period === view.period);
  if (!now.length) return '';
  const lead = now.find((n) => n.tone === 'bad') ?? now[0];
  const item = (n) => `<li class="rg-news-item is-${esc(n.tone || 'neutral')}"${n.region ? ` data-region-hover="${esc(n.region)}"` : ''}>
        ${icon(n.tone === 'good' ? 'good' : n.tone === 'bad' ? 'bad' : 'neutral', 'rg-news-ic')}
        <span class="rg-news-text">${n.region ? `<b class="rg-news-region">${esc(regionMeta(view, n.region).short)}:</b> ` : ''}${esc(n.text)}${n.chain?.length && !String(n.text).includes(n.chain[0]) ? `<span class="rg-news-chain"><span class="rg-sr">Chuỗi: </span>${chainHtml(n.chain)}</span>` : ''}</span>
      </li>`;
  return `
    ${expanded ? `<div class="rg-news-pop" data-scroll-news>
      <h2 class="rg-news-head">${icon('news')}<span>Tin kỳ ${esc(view.period)}</span></h2>
      <ul class="rg-news-list">${now.map(item).join('')}</ul>
    </div>` : ''}
    <button type="button" class="rg-news-tick is-${esc(lead.tone || 'neutral')}" data-action="news-toggle" aria-expanded="${expanded}"
      title="${expanded ? 'Thu gọn tin' : 'Xem tất cả tin kỳ này'}"${lead.region ? ` data-region-hover="${esc(lead.region)}"` : ''}>
      ${icon('news')}<span class="rg-news-k">Tin kỳ ${esc(view.period)}</span>
      ${expanded ? '<span class="rg-news-one">Thu gọn</span>' : `<span class="rg-news-one">${lead.region ? `<b>${esc(regionMeta(view, lead.region).short)}:</b> ` : ''}${esc(lead.text)}</span>`}
      ${now.length > 1 && !expanded ? `<span class="rg-news-n">+${now.length - 1}</span>` : ''}
      <span class="rg-news-caret" aria-hidden="true">${expanded ? '▾' : '▴'}</span>
    </button>`;
}
