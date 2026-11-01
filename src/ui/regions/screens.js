// Briefing and end-of-game summary for the region mode.
import { esc } from '../util.js';
import { chapterLabel } from '../labels.js';
import { icon, regionMeta, REGION_ORDER, INDICATORS, signedNum } from './text.js';

export function renderBriefing(view) {
  const paras = view.paragraphs ?? [];
  return `
    <div class="rg-brief" role="dialog" aria-modal="false" aria-labelledby="rg-brief-title">
      <p class="rg-eyebrow">Hòa Minh · chế độ quản lý vùng</p>
      <h1 id="rg-brief-title" class="rg-brief-title">${esc(view.title ?? 'Điều hành đất nước qua bản đồ vùng')}</h1>
      ${paras.map((t) => `<p>${esc(t)}</p>`).join('')}
      <ol class="rg-steps" aria-label="Vòng chơi">
        <li>${icon('attention')}<span>Nhìn bản đồ: nơi nào đang cần quan tâm</span></li>
        <li>${icon('NN')}<span>Chọn vùng (bấm hoặc phím 1–6)</span></li>
        <li>${icon('budget')}<span>Chọn cách xử lý trong ngân sách (A/B/C)</span></li>
        <li>${icon('next')}<span>Sang kỳ tiếp theo (N) và xem vùng thay đổi</span></li>
      </ol>
      <div class="rg-brief-actions">
        <button type="button" class="rg-btn is-primary is-big" data-action="start">Bắt đầu điều hành <kbd>Enter</kbd></button>
      </div>
    </div>`;
}

// ---------- end summary ----------

function miniBars(before, after) {
  return `<span class="rg-mini">${INDICATORS.map(({ key, label }) => {
    const b = Math.round(before?.[key] ?? 0), a = Math.round(after?.[key] ?? 0);
    const d = a - b;
    return `<span class="rg-mini-row" title="${label}: ${b} → ${a}">
      <span class="rg-mini-label">${label}</span>
      <span class="rg-mini-bar" aria-hidden="true"><span class="is-before" style="width:${Math.max(0, Math.min(100, b))}%"></span><span class="is-after" style="width:${Math.max(0, Math.min(100, a))}%"></span></span>
      <span class="rg-mini-num">${b} → <b>${a}</b> <span class="rg-delta ${d > 0 ? 'is-up' : d < 0 ? 'is-down' : ''}">(${signedNum(d)})</span></span>
    </span>`;
  }).join('')}</span>`;
}

const SERIES = [
  { key: 'output', label: 'Sản xuất', color: '#2a78d6', dash: '' },
  { key: 'wellbeing', label: 'Đời sống', color: '#eb6834', dash: '10 6' },
  { key: 'access', label: 'Tiếp cận dịch vụ', color: '#1baf7a', dash: '3 5' },
  { key: 'gap', label: 'Chênh lệch giữa vùng', color: '#b07c00', dash: '14 5 3 5' },
];

// Hand-written SVG line chart of national values per period (0..100, one axis).
export function lineChart(timeline) {
  if (!timeline?.length) return '<p class="rg-muted">Chưa có số liệu theo kỳ.</p>';
  const W = 640, H = 300, L = 44, R = 150, T = 16, B = 40;
  const pw = W - L - R, ph = H - T - B;
  const n = timeline.length;
  const xs = (i) => L + (n === 1 ? pw / 2 : (i / (n - 1)) * pw);
  const ys = (v) => T + ph - (Math.max(0, Math.min(100, v)) / 100) * ph;
  const grid = [0, 25, 50, 75, 100].map((v) => `<g><line x1="${L}" x2="${L + pw}" y1="${ys(v)}" y2="${ys(v)}" class="rg-ch-grid"/><text x="${L - 8}" y="${ys(v) + 5}" text-anchor="end" class="rg-ch-tick">${v}</text></g>`).join('');
  const xt = timeline.map((t, i) => `<text x="${xs(i)}" y="${H - B + 22}" text-anchor="middle" class="rg-ch-tick">${esc(t.period)}</text>`).join('');
  // Direct labels at the line ends, nudged apart so they never collide.
  const ends = SERIES.map((s) => ({ s, y: ys(timeline[n - 1].national?.[s.key] ?? 0), v: Math.round(timeline[n - 1].national?.[s.key] ?? 0) }))
    .sort((a, b) => a.y - b.y);
  for (let i = 1; i < ends.length; i++) if (ends[i].y - ends[i - 1].y < 18) ends[i].y = ends[i - 1].y + 18;
  const lines = SERIES.map((s) => {
    const pts = timeline.map((t, i) => `${xs(i).toFixed(1)},${ys(t.national?.[s.key] ?? 0).toFixed(1)}`).join(' ');
    const dots = timeline.map((t, i) => `<circle cx="${xs(i).toFixed(1)}" cy="${ys(t.national?.[s.key] ?? 0).toFixed(1)}" r="4" fill="${s.color}" class="rg-ch-dot"><title>Kỳ ${esc(t.period)} · ${s.label}: ${Math.round(t.national?.[s.key] ?? 0)}</title></circle>`).join('');
    return `<polyline points="${pts}" fill="none" stroke="${s.color}" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round" ${s.dash ? `stroke-dasharray="${s.dash}"` : ''}/>${dots}`;
  }).join('');
  const labels = ends.map((e) => `<text x="${L + pw + 10}" y="${(e.y + 5).toFixed(1)}" class="rg-ch-end">${e.s.label} ${e.v}</text>`).join('');
  return `
    <figure class="rg-chart">
      <svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Chỉ số cả nước theo kỳ">
        ${grid}${xt}
        <text x="${L + pw / 2}" y="${H - 4}" text-anchor="middle" class="rg-ch-axis">Kỳ</text>
        ${lines}${labels}
      </svg>
      <figcaption class="rg-legend">${SERIES.map((s) => `<span><svg viewBox="0 0 30 10" aria-hidden="true"><line x1="1" x2="29" y1="5" y2="5" stroke="${s.color}" stroke-width="3" ${s.dash ? `stroke-dasharray="${s.dash.split(' ').map((x) => Math.max(2, x * 0.6)).join(' ')}"` : ''}/></svg>${s.label}</span>`).join('')}
        <span class="rg-muted">Chênh lệch: càng thấp càng đều giữa các vùng.</span></figcaption>
    </figure>
    <details class="rg-sub"><summary>Xem bảng số</summary>
      <table class="rg-table"><thead><tr><th>Kỳ</th>${SERIES.map((s) => `<th>${s.label}</th>`).join('')}</tr></thead>
      <tbody>${timeline.map((t) => `<tr><td>${esc(t.period)}</td>${SERIES.map((s) => `<td>${Math.round(t.national?.[s.key] ?? 0)}</td>`).join('')}</tr>`).join('')}</tbody></table>
    </details>`;
}

export function renderEnd(view) {
  const s = view.summary ?? {};
  const regionName = (id) => esc(regionMeta(view, id).short);
  const ids = REGION_ORDER.filter((id) => s.before?.[id] || s.after?.[id]);
  const seen = (s.topics ?? []).filter((t) => t.seen);
  const unseen = (s.topics ?? []).filter((t) => !t.seen);
  return `
    <div class="rg-end" role="dialog" aria-modal="false" aria-labelledby="rg-end-title">
      <header class="rg-end-head">
        <p class="rg-eyebrow">Tổng kết sau ${esc(view.totalPeriods ?? '')} kỳ</p>
        <h1 id="rg-end-title" class="rg-end-title">${esc(s.headline ?? 'Kết thúc nhiệm kỳ')}</h1>
        ${s.text ? `<p class="rg-end-lead">${esc(s.text)}</p>` : ''}
      </header>
      <div class="rg-end-body" data-scroll>
        <div class="rg-end-cols">
          <section class="rg-end-box is-good"><h2>${icon('up')}Vùng đã khá lên</h2>
            ${(s.improved ?? []).length ? `<ul>${s.improved.map((x) => `<li><b>${regionName(x.region)}</b> · ${esc(x.text)}</li>`).join('')}</ul>` : '<p class="rg-muted">Chưa vùng nào cải thiện rõ.</p>'}
          </section>
          <section class="rg-end-box is-bad"><h2>${icon('down')}Nơi còn bị bỏ lại</h2>
            ${(s.leftBehind ?? []).length ? `<ul>${s.leftBehind.map((x) => `<li><b>${regionName(x.region)}</b> · ${esc(x.text)}</li>`).join('')}</ul>` : '<p class="rg-muted">Không vùng nào bị tụt lại rõ rệt.</p>'}
          </section>
        </div>

        ${(s.chains ?? []).length ? `<section class="rg-end-sec"><h2>Ba chuỗi đáng nhớ</h2>
          <ol class="rg-chains">${s.chains.slice(0, 3).map((c) => `<li class="rg-chaincard">
            <h3>${esc(c.title)}${c.period ? ` <span class="rg-muted">· kỳ ${esc(c.period)}</span>` : ''}</h3>
            <ol class="rg-chain-steps">${(c.steps ?? []).map((t) => `<li>${esc(t)}</li>`).join('')}</ol>
          </li>`).join('')}</ol></section>` : ''}

        ${ids.length ? `<section class="rg-end-sec"><h2>Bản đồ trước → sau</h2>
          <ul class="rg-ba">${ids.map((id) => `<li class="rg-ba-row"><span class="rg-ba-name">${icon(id)}${regionName(id)}</span>${miniBars(s.before?.[id], s.after?.[id])}</li>`).join('')}</ul>
          <p class="rg-muted rg-ba-key"><span class="rg-key-swatch is-before"></span>đầu ván <span class="rg-key-swatch is-after"></span>cuối ván</p>
        </section>` : ''}

        ${(s.openProblems ?? []).length ? `<section class="rg-end-sec"><h2>Việc còn dang dở</h2>
          <ul class="rg-open">${s.openProblems.map((x) => `<li>${icon('attention')}<b>${regionName(x.region)}</b> · ${esc(x.title)}</li>`).join('')}</ul></section>` : ''}

        <details class="rg-end-more"><summary>${icon('income')}Số liệu cả nước qua các kỳ</summary>${lineChart(s.timeline)}</details>

        <details class="rg-end-more"><summary>${icon('book')}Liên hệ môn học (${seen.length}/${(s.topics ?? []).length} chủ đề đã gặp)</summary>
          ${seen.length ? `<h3 class="rg-sec-title">Đã gặp trong ván</h3><ul class="rg-topics">${seen.map((t) => `<li class="is-seen">${icon('stable')}<span><b>${esc(t.topic)}</b>${t.chapter ? ` <span class="rg-muted">· ${esc(chapterLabel(t.chapter))}</span>` : ''}${(t.via ?? []).length ? `<span class="rg-via">qua: ${t.via.map(esc).join('; ')}</span>` : ''}</span></li>`).join('')}</ul>` : ''}
          ${unseen.length ? `<h3 class="rg-sec-title">Chưa gặp trong ván này</h3><p class="rg-muted">Phiên này ngắn hoặc chưa đi qua các tình huống đó; không tính là đã học.</p><ul class="rg-topics">${unseen.map((t) => `<li class="is-unseen">${icon('neutral')}<span>${esc(t.topic)}${t.chapter ? ` <span class="rg-muted">· ${esc(chapterLabel(t.chapter))}</span>` : ''}</span></li>`).join('')}</ul>` : ''}
        </details>

        ${(s.decisions ?? []).length ? `<details class="rg-end-more"><summary>${icon('keys')}Các quyết định đã đưa ra (${s.decisions.length})</summary>
          <ol class="rg-decisions">${s.decisions.map((d) => `<li><span class="rg-muted">Kỳ ${esc(d.period)} · ${regionName(d.region)}</span> ${esc(d.title)} → <b>${esc(d.option)}</b></li>`).join('')}</ol>
        </details>` : ''}
      </div>
      <footer class="rg-end-foot">
        <button type="button" class="rg-btn is-primary is-big" data-action="restart">${icon('restart')}Chơi ván mới</button>
      </footer>
    </div>`;
}
