// Vietnamese wording and hand-drawn line icons for the region mode.
// Neutral pictograms only: no flags, emblems, real people or religious symbols.
import { esc } from '../util.js';

export const REGION_ORDER = ['CN', 'NN', 'TT', 'DC', 'VC', 'CB'];

// Fallback names when a view omits them (the sim normally sends name/short).
export const REGION_NAMES = {
  CN: { name: 'Công nghiệp Thiên Hà', short: 'Thiên Hà' },
  NN: { name: 'Đồng bằng nông nghiệp', short: 'Đồng bằng' },
  TT: { name: 'Đô thị trung tâm', short: 'Trung tâm' },
  DC: { name: 'Khu dân cư', short: 'Khu dân cư' },
  VC: { name: 'Vùng cao Bản Mây', short: 'Bản Mây' },
  CB: { name: 'Duyên hải và cảng', short: 'Cảng' },
};

export const STATUS_TEXT = {
  stable: 'Ổn định',
  opportunity: 'Có cơ hội',
  attention: 'Cần quan tâm',
  urgent: 'Khẩn cấp',
};

export const ORIGIN_TEXT = {
  random: 'Ngẫu nhiên',
  consequence: 'Hệ quả',
  opportunity: 'Cơ hội',
};

export const PROBLEM_STATUS_TEXT = {
  open: 'Chưa xử lý',
  working: 'Đang xử lý',
  escalated: 'Đang leo thang',
};

export const SEVERITY_TEXT = { 1: 'Nhẹ', 2: 'Vừa', 3: 'Nặng' };

export const SERVICE_STATUS_TEXT = { short: 'Thiếu', tight: 'Sát nhu cầu', ok: 'Đủ' };

export const INDICATORS = [
  { key: 'output', label: 'Sản xuất' },
  { key: 'wellbeing', label: 'Đời sống' },
  { key: 'access', label: 'Tiếp cận dịch vụ' },
];

export const LINK_KIND_TEXT = { risk: 'nguy cơ', active: 'đang ảnh hưởng', benefit: 'lợi ích' };

const S = (body, vb = 48) =>
  `<svg viewBox="0 0 ${vb} ${vb}" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${body}</svg>`;

const ICONS = {
  // Status
  stable: S('<circle cx="24" cy="24" r="17"/><path d="M15.5 24.5l6 6 11-12"/>'),
  opportunity: S('<path d="M24 6l4.6 12.4L41 24l-12.4 5.6L24 42l-4.6-12.4L7 24l12.4-5.6z"/>'),
  attention: S('<path d="M24 6L44 41H4z"/><path d="M24 19v10"/><path d="M24 34.5v.5"/>'),
  urgent: S('<path d="M16.5 5h15L43 16.5v15L31.5 43h-15L5 31.5v-15z"/><path d="M24 14v13"/><path d="M24 33v.5"/>'),
  // Origin
  random: S('<rect x="8" y="8" width="32" height="32" rx="6"/><circle cx="17" cy="17" r="1.6"/><circle cx="31" cy="31" r="1.6"/><circle cx="24" cy="24" r="1.6"/><circle cx="31" cy="17" r="1.6"/><circle cx="17" cy="31" r="1.6"/>'),
  consequence: S('<path d="M20 28l8-8"/><path d="M22.5 13.5l3-3a8 8 0 0 1 11.3 11.3l-3 3"/><path d="M25.5 34.5l-3 3a8 8 0 0 1-11.3-11.3l3-3"/>'),
  // Misc
  project: S('<path d="M8 42h32"/><path d="M14 42V14h4v28"/><path d="M16 14h22l-4 6"/><path d="M34 20v8"/><rect x="30" y="28" width="8" height="6" rx="1"/>'),
  clock: S('<circle cx="24" cy="24" r="17"/><path d="M24 14v10l7 5"/>'),
  budget: S('<ellipse cx="24" cy="14" rx="14" ry="5.5"/><path d="M10 14v10c0 3 6.3 5.5 14 5.5S38 27 38 24V14"/><path d="M10 24v10c0 3 6.3 5.5 14 5.5S38 37 38 34V24"/>'),
  income: S('<path d="M24 40V12"/><path d="M13 22l11-11 11 11"/><path d="M10 44h28"/>'),
  upkeep: S('<path d="M38 22a14 14 0 1 0-3.5 11"/><path d="M38 12v10H28"/>'),
  next: S('<path d="M10 12l14 12-14 12z"/><path d="M26 12l14 12-14 12z"/>'),
  back: S('<path d="M30 10L16 24l14 14"/>'),
  close: S('<path d="M13 13l22 22M35 13L13 35"/>'),
  book: S('<path d="M8 8h13a5 5 0 0 1 5 5v28a4 4 0 0 0-4-4H8z"/><path d="M40 8H30a5 5 0 0 0-4 2"/><path d="M40 8v29H30a4 4 0 0 0-4 4"/>'),
  news: S('<rect x="6" y="10" width="30" height="30" rx="3"/><path d="M36 18h6v18a4 4 0 0 1-4 4H10"/><path d="M12 18h18M12 25h18M12 32h11"/>'),
  good: S('<circle cx="24" cy="24" r="17"/><path d="M15.5 24.5l6 6 11-12"/>'),
  bad: S('<path d="M24 6L44 41H4z"/><path d="M24 19v10"/><path d="M24 34.5v.5"/>'),
  neutral: S('<circle cx="24" cy="24" r="17"/><path d="M16 24h16"/>'),
  up: S('<path d="M24 38V12M13 22l11-11 11 11"/>'),
  down: S('<path d="M24 10v26M13 26l11 11 11-11"/>'),
  flat: S('<path d="M10 24h28M30 16l8 8-8 8"/>'),
  wait: S('<path d="M14 6h20M14 42h20"/><path d="M16 6c0 9 16 11 16 18S16 33 16 42"/><path d="M32 6c0 9-16 11-16 18s16 9 16 18"/>'),
  fullscreen: S('<path d="M8 18V8h10M30 8h10v10M40 30v10H30M18 40H8V30"/>'),
  keys: S('<rect x="5" y="12" width="38" height="24" rx="4"/><path d="M12 19h2M19 19h2M26 19h2M33 19h2M12 26h2M33 26h2M19 29h10"/>'),
  restart: S('<path d="M9 24a15 15 0 1 0 4.4-10.6"/><path d="M9 7v7h7"/>'),
  lock: S('<rect x="10" y="21" width="28" height="20" rx="3"/><path d="M16 21v-5a8 8 0 0 1 16 0v5"/>'),
  // Region pictograms (panel header)
  CN: S('<path d="M6 42V22l10 6v-6l10 6v-6l10 6V8h6v34z"/><path d="M6 42h36"/>'),
  NN: S('<path d="M6 40c8-4 28-4 36 0"/><path d="M24 36V14"/><path d="M24 22c-6 0-9-3.5-9-8.5 6 0 9 3.5 9 8.5z"/><path d="M24 18c0-5 3-8 9-8 0 5-3 8-9 8z"/>'),
  TT: S('<path d="M6 42h36"/><path d="M10 42V20h10v22"/><path d="M20 42V10h12v32"/><path d="M32 42V24h6v18"/><path d="M24 16h4M24 22h4M24 28h4"/>'),
  DC: S('<path d="M6 22L24 8l18 14"/><path d="M11 18v24h26V18"/><rect x="20" y="30" width="8" height="12"/><path d="M15 25h4M29 25h4"/>'),
  VC: S('<path d="M4 40l13-22 8 12 6-9 13 19z"/><path d="M13 25l4-7 4 6"/>'),
  CB: S('<path d="M6 34h36l-5 8H11z"/><path d="M14 34V22h14v12"/><path d="M28 26h8v8"/><path d="M4 44c4 0 4-2 8-2s4 2 8 2 4-2 8-2 4 2 8 2 4-2 8-2"/>'),
};

export function icon(name, cls = '') {
  return `<span class="rg-ic ${cls}">${ICONS[name] ?? ''}</span>`;
}

export function regionMeta(view, id) {
  const r = view?.regions?.find((x) => x.id === id);
  const fb = REGION_NAMES[id] ?? { name: id, short: id };
  return { name: r?.name ?? fb.name, short: r?.short ?? fb.short };
}

export function statusText(region) {
  return region?.statusLabel || STATUS_TEXT[region?.status] || '';
}

export function lowerFirst(s) {
  if (!s) return '';
  return s.charAt(0).toLocaleLowerCase('vi') + s.slice(1);
}

// "Hồ xuống thấp → Điện thiếu → Xưởng chia ca"
export function chainHtml(steps, cls = 'rg-chain') {
  if (!steps?.length) return '';
  return `<span class="${cls}">${steps.map((s) => `<span class="rg-chain-step">${esc(s)}</span>`).join('<span class="rg-chain-arrow" aria-label="dẫn đến"> → </span>')}</span>`;
}

export function signedNum(n) {
  const v = Math.round(Number(n) || 0);
  return v > 0 ? `+${v}` : v < 0 ? `−${Math.abs(v)}` : '0';
}

export function costText(opt) {
  const parts = [];
  parts.push(opt.cost > 0 ? `Chi ${opt.cost}` : 'Không tốn ngân sách');
  if (opt.upkeep > 0) parts.push(`Duy trì ${opt.upkeep}/kỳ${opt.upkeepFor > 0 ? ` trong ${opt.upkeepFor} kỳ` : ''}`);
  return parts;
}

export function delayText(opt) {
  if (opt.delayText) return opt.delayText;
  if (!opt.delay) return 'Ngay';
  return `Sau ${opt.delay} kỳ`;
}
