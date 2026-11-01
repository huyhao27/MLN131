// Right-side region panel: region overview, then one problem with its options.
import { esc } from '../util.js';
import { chapterLabel } from '../labels.js';
import {
  icon, regionMeta, statusText, chainHtml, signedNum, costText, delayText,
  INDICATORS, ORIGIN_TEXT, PROBLEM_STATUS_TEXT, SEVERITY_TEXT, SERVICE_STATUS_TEXT, LINK_KIND_TEXT,
} from './text.js';

const OPTION_KEYS = ['A', 'B', 'C', 'D'];

export function problemsOf(view, region) {
  return (region.problems ?? []).map((id) => view.problems?.find((p) => p.instanceId === id)).filter(Boolean);
}

function trendHtml(d) {
  const v = Math.round(Number(d) || 0);
  if (v > 0) return `<span class="rg-trend is-up" title="Tăng ${v} so với kỳ trước">${icon('up')}<span>${signedNum(v)}</span></span>`;
  if (v < 0) return `<span class="rg-trend is-down" title="Giảm ${-v} so với kỳ trước">${icon('down')}<span>${signedNum(v)}</span></span>`;
  return `<span class="rg-trend is-flat" title="Không đổi so với kỳ trước">${icon('flat')}<span>0</span></span>`;
}

function indicatorsHtml(r) {
  return `<ul class="rg-inds">${INDICATORS.map(({ key, label }) => {
    const v = Math.max(0, Math.min(100, Math.round(r.indicators?.[key] ?? 0)));
    return `<li class="rg-ind">
      <span class="rg-ind-label">${label}</span>
      <span class="rg-bar" role="meter" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${v}" aria-label="${label}"><span style="width:${v}%"></span></span>
      <b class="rg-ind-val">${v}</b>${trendHtml(r.trend?.[key])}
    </li>`;
  }).join('')}</ul>`;
}

function servicesHtml(r) {
  const list = r.services ?? [];
  if (!list.length) return '';
  const order = { short: 0, tight: 1, ok: 2 };
  const sorted = [...list].sort((a, b) => (order[a.status] ?? 3) - (order[b.status] ?? 3));
  return `<section class="rg-sec"><h3 class="rg-sec-title">Dịch vụ thiết yếu</h3>
    <ul class="rg-svcs">${sorted.map((s) => {
      const pct = s.need > 0 ? Math.max(0, Math.min(100, Math.round((s.have / s.need) * 100))) : 100;
      const ic = s.status === 'short' ? 'attention' : s.status === 'tight' ? 'clock' : 'stable';
      return `<li class="rg-svc is-${esc(s.status)}">
        <span class="rg-svc-label">${esc(s.label)}</span>
        <span class="rg-svc-state">${icon(ic)}${esc(SERVICE_STATUS_TEXT[s.status] ?? s.status)}</span>
        <span class="rg-svc-nums" title="Có ${esc(s.have)} trên nhu cầu ${esc(s.need)}">có <b>${esc(s.have)}</b> / cần ${esc(s.need)}</span>
        <span class="rg-svc-bar" aria-hidden="true"><span style="width:${pct}%"></span></span>
      </li>`;
    }).join('')}</ul></section>`;
}

function projectsHtml(view, r) {
  const all = (view.projects ?? []).filter((j) => j.region === r.id || (r.projects ?? []).includes(j.id));
  if (!all.length) return '';
  return `<section class="rg-sec"><h3 class="rg-sec-title">Công trình</h3>
    <ul class="rg-projs">${all.map((j) => `<li class="rg-proj${j.done ? ' is-done' : ''}">
      ${icon(j.done ? 'stable' : 'project')}<span class="rg-proj-label">${esc(j.label)}</span>
      <span class="rg-proj-when">${j.done ? 'Đã hoàn tất' : esc(j.doneText || `Hoàn tất kỳ ${j.doneAt}`)}</span>
    </li>`).join('')}</ul></section>`;
}

export function originBadge(p) {
  const o = p.origin || 'random';
  const ic = o === 'opportunity' ? 'opportunity' : o === 'consequence' ? 'consequence' : 'random';
  return `<span class="rg-origin is-${esc(o)}">${icon(ic)}${esc(ORIGIN_TEXT[o] ?? o)}</span>`;
}

function stateLine(p) {
  if (p.chosen || p.status === 'working') {
    const c = p.chosen;
    return `<span class="rg-pstate is-working">${icon('clock')}Đang xử lý${c?.completesAt ? ` · xong kỳ ${esc(c.completesAt)}` : ''}</span>`;
  }
  if (p.status === 'escalated') return `<span class="rg-pstate is-escalated">${icon('urgent')}Đang leo thang</span>`;
  return p.deadlineText ? `<span class="rg-pstate is-deadline">${icon('clock')}${esc(p.deadlineText)}</span>` : '';
}

function problemCard(view, p) {
  const n = p.options?.length ?? 0;
  return `<li><button type="button" class="rg-pcard is-${esc(p.origin)}${p.chosen ? ' is-chosen' : ''}" data-open-problem="${esc(p.instanceId)}">
    <span class="rg-pcard-top">${originBadge(p)}${p.severity ? `<span class="rg-sev is-s${esc(p.severity)}">Mức ${esc(SEVERITY_TEXT[p.severity] ?? p.severity).toLowerCase()}</span>` : ''}</span>
    <span class="rg-pcard-title">${esc(p.title)}</span>
    <span class="rg-pcard-meta">${stateLine(p)}${!p.chosen && n ? `<span class="rg-muted">${n} cách xử lý</span>` : ''}${p.chosen ? `<span class="rg-muted">Đã chọn: ${esc(p.chosen.label ?? p.chosen.option)}</span>` : ''}</span>
    <span class="rg-pcard-go" aria-hidden="true">›</span>
  </button></li>`;
}

export function renderRegion(view, regionId) {
  const r = view.regions?.find((x) => x.id === regionId);
  if (!r) return '';
  const meta = regionMeta(view, regionId);
  const probs = problemsOf(view, r);
  return `
    <header class="rg-ph">
      <button type="button" class="rg-iconbtn" data-action="close" title="Về bản đồ (Esc)" aria-label="Về bản đồ">${icon('back')}<span>Bản đồ</span></button>
      <span class="rg-ph-crumb rg-muted">Vùng</span>
    </header>
    <div class="rg-pbody" data-scroll>
      <div class="rg-rhead">
        ${icon(regionId, 'rg-rhead-ic')}
        <div>
          <h2 class="rg-rname">${esc(meta.name)}</h2>
          <span class="rg-status is-${esc(r.status)}">${icon(r.status || 'stable')}${esc(statusText(r))}</span>
        </div>
      </div>
      ${r.line ? `<p class="rg-line">${esc(r.line)}</p>` : ''}
      <section class="rg-sec"><h3 class="rg-sec-title">Việc cần xem${probs.length ? ` (${probs.length})` : ''}</h3>
        ${probs.length ? `<ul class="rg-pcards">${probs.map((p) => problemCard(view, p)).join('')}</ul>`
          : '<p class="rg-empty">Không có vấn đề đang mở. Vùng có thể chờ để bạn lo nơi khác.</p>'}
      </section>
      ${indicatorsHtml(r)}
      ${servicesHtml(r)}
      ${projectsHtml(view, r)}
    </div>`;
}

function optionHtml(view, p, o, i, locked) {
  const key = OPTION_KEYS[i] ?? '';
  const chosen = p.chosen && (p.chosen.option === o.id);
  const disabled = o.disabled || locked;
  const cost = costText(o);
  return `<li><button type="button" class="rg-opt${o.disabled ? ' is-disabled' : ''}${chosen ? ' is-chosen' : ''}${locked && !chosen ? ' is-locked' : ''}"
      data-opt="${esc(o.id)}" aria-disabled="${disabled ? 'true' : 'false'}" ${key ? `aria-keyshortcuts="${key}"` : ''}>
    <span class="rg-opt-head"><kbd class="rg-opt-key">${key}</kbd><span class="rg-opt-label">${esc(o.label)}</span>${chosen ? '<span class="rg-opt-tag">Đã chọn</span>' : ''}</span>
    <span class="rg-opt-facts">
      <span class="rg-fact is-cost">${icon('budget')}${esc(cost[0])}</span>
      ${cost[1] ? `<span class="rg-fact is-upkeep">${icon('upkeep')}${esc(cost[1])}</span>` : ''}
      <span class="rg-fact">${icon('clock')}${esc(delayText(o))}</span>
      ${o.project ? `<span class="rg-fact is-project">${icon('project')}Dự án dài hạn · ${esc((view.slots?.used ?? 0))}/${esc(view.slots?.max ?? 2)} chỗ</span>` : ''}
    </span>
    ${o.preview ? `<span class="rg-opt-preview">${esc(o.preview)}</span>` : ''}
    ${o.disabled && o.reason ? `<span class="rg-opt-reason">${icon('lock')}${esc(o.reason)}</span>` : ''}
  </button></li>`;
}

export function renderProblem(view, p) {
  const meta = regionMeta(view, p.region);
  const locked = !!p.chosen || p.status === 'working';
  const affects = (p.affects ?? []).filter(Boolean);
  const links = p.links ?? [];
  return `
    <header class="rg-ph">
      <button type="button" class="rg-iconbtn" data-action="back" title="Về vùng (Esc)" aria-label="Về vùng ${esc(meta.short)}">${icon('back')}<span>${esc(meta.short)}</span></button>
      <button type="button" class="rg-iconbtn is-quiet" data-action="close" title="Về bản đồ" aria-label="Về bản đồ">${icon('close')}<span>Bản đồ</span></button>
    </header>
    <div class="rg-pbody" data-scroll>
      <div class="rg-prob-top">${originBadge(p)}${p.severity ? `<span class="rg-sev is-s${esc(p.severity)}">Mức ${esc(SEVERITY_TEXT[p.severity] ?? p.severity).toLowerCase()}</span>` : ''}${stateLine(p)}</div>
      <h2 class="rg-ptitle">${esc(p.title)}</h2>
      ${p.causes?.length ? `<p class="rg-causes"><span class="rg-causes-lead">Vì</span>${chainHtml([...p.causes, p.title])}</p>` : ''}
      ${p.text ? `<p class="rg-ptext">${esc(p.text)}</p>` : ''}
      ${affects.length ? `<div class="rg-affects"><span class="rg-muted">Vùng liên quan:</span>${affects.map((id) => `<button type="button" class="rg-chip-region${id === p.region ? ' is-home' : ''}" data-region-chip="${esc(id)}">${esc(regionMeta(view, id).short)}</button>`).join('')}</div>` : ''}
      ${links.length ? `<ul class="rg-links">${links.map((l) => `<li class="rg-link is-${esc(l.kind)}"><span class="rg-link-line" aria-hidden="true"></span><span>${esc(regionMeta(view, l.from).short)} → ${esc(regionMeta(view, l.to).short)}: ${esc(l.label ?? l.service)} <span class="rg-muted">(${esc(LINK_KIND_TEXT[l.kind] ?? l.kind)})</span></span></li>`).join('')}</ul>` : ''}
      ${locked ? `<p class="rg-working">${icon('clock')}<span>Đã chọn <b>${esc(p.chosen?.label ?? p.chosen?.option ?? '')}</b>${p.chosen?.period ? ` ở kỳ ${esc(p.chosen.period)}` : ''}. Đang thực hiện${p.chosen?.completesAt ? `, có tác dụng từ kỳ ${esc(p.chosen.completesAt)}` : ''}. Vấn đề vẫn còn cho tới khi xong.</span></p>` : ''}
      <h3 class="rg-sec-title">${locked ? 'Các cách đã cân nhắc' : 'Chọn cách xử lý'}</h3>
      <ul class="rg-opts">${(p.options ?? []).map((o, i) => optionHtml(view, p, o, i, locked)).join('')}</ul>
      ${p.wait?.preview && !locked ? `<p class="rg-wait">${icon('wait')}<span><b>Chờ:</b> ${esc(p.wait.preview)}</span></p>` : ''}
      ${p.learn ? `<details class="rg-learn"><summary>${icon('book')}Liên hệ môn học</summary>
        <p><b>${esc(p.learn.topic)}</b>${p.learn.chapter ? ` <span class="rg-muted">· ${esc(chapterLabel(p.learn.chapter))}</span>` : ''}</p>
        ${p.learn.note ? `<p>${esc(p.learn.note)}</p>` : ''}
      </details>` : ''}
      ${p.code ? `<p class="rg-code rg-muted">Mã ${esc(p.code)}</p>` : ''}
    </div>`;
}
