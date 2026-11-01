// Hand-drawn, neutral line icons. No flags, emblems, real people or religious symbols.
import { STAKEHOLDERS } from './labels.js';
import { esc } from './util.js';

const S = (body, vb = 48) =>
  `<svg viewBox="0 0 ${vb} ${vb}" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${body}</svg>`;

const STAKEHOLDER_SVG = {
  // Person in a hard hat.
  worker: S(`<path d="M16 17a8 8 0 0 1 16 0z"/><path d="M13.5 17h21"/><path d="M18.5 19.5a5.5 5.5 0 0 0 11 0"/><path d="M11 42c0-8 5.5-13 13-13s13 5 13 13"/><path d="M24 29v6"/>`),
  // Person with wide-brim hat and a sprout.
  farmer: S(`<path d="M9 15h22"/><path d="M14 15c1-4 3.5-6 6-6s5 2 6 6"/><circle cx="20" cy="20" r="4.5"/><path d="M8 42c0-7.5 5-12 12-12s12 4.5 12 12"/><path d="M39 42V27"/><path d="M39 32c-4.5 0-7-2.6-7-6.5 4.5 0 7 2.6 7 6.5z"/><path d="M39 29.5c0-3.8 2.3-6.2 6-6.2 0 3.8-2.3 6.2-6 6.2z"/>`),
  // Phone with a location pin: app-based work.
  platform: S(`<rect x="14" y="5" width="20" height="38" rx="3.5"/><path d="M21 37.5h6"/><path d="M24 13.5c-3.3 0-5.6 2.4-5.6 5.4 0 4.2 5.6 9.4 5.6 9.4s5.6-5.2 5.6-9.4c0-3-2.3-5.4-5.6-5.4z"/><circle cx="24" cy="19" r="1.7"/>`),
  // Open book with a small spark of an idea.
  intellectual: S(`<path d="M5 17c6.5-2.2 13-1.4 19 2.6 6-4 12.5-4.8 19-2.6v22c-6.5-2.2-13-1.4-19 2.6-6-4-12.5-4.8-19-2.6z"/><path d="M24 19.6v22"/><path d="M24 4v4"/><path d="M15.5 7.5l2.2 2.6"/><path d="M32.5 7.5l-2.2 2.6"/>`),
  // Briefcase.
  business: S(`<rect x="6.5" y="15" width="35" height="24" rx="3"/><path d="M18 15v-3.5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2V15"/><path d="M6.5 25.5h35"/><rect x="21" y="22.5" width="6" height="6" rx="1.2"/>`),
  // Three linked people above a woven textile band: diverse communities.
  minority: S(`<circle cx="11" cy="14" r="4"/><circle cx="24" cy="11" r="4"/><circle cx="37" cy="14" r="4"/><path d="M4.5 31c0-5 3-8.5 6.5-8.5"/><path d="M17 29c0-6 3-10 7-10s7 4 7 10"/><path d="M43.5 31c0-5-3-8.5-6.5-8.5"/><path d="M5 40l4.25-4 4.25 4 4.25-4 4.25 4 4.25-4 4.25 4 4.25-4 4.25 4 4.25-4"/>`),
  // Cupped open hands holding a small light: belief and non-belief alike.
  faith: S(`<path d="M7 25c0 9.5 7.6 16 17 16s17-6.5 17-16"/><path d="M13 27.5c2.4 5 6.4 7.5 11 7.5s8.6-2.5 11-7.5"/><circle cx="24" cy="17" r="4"/><path d="M24 6.5v3"/><path d="M14.5 10.5l2.1 2.1"/><path d="M33.5 10.5l-2.1 2.1"/>`),
  // Roof sheltering an adult and a child.
  family: S(`<path d="M5 22L24 7l19 15"/><circle cx="19" cy="23" r="3.6"/><path d="M12.5 41c0-6.5 3-10 6.5-10s6.5 3.5 6.5 10"/><circle cx="31.5" cy="29" r="2.8"/><path d="M27 41c0-4.3 2-6.6 4.5-6.6S36 36.7 36 41"/>`),
};

const GLYPHS = {
  budget: S(`<ellipse cx="24" cy="14" rx="14" ry="5.5"/><path d="M10 14v10c0 3 6.3 5.5 14 5.5S38 27 38 24V14"/><path d="M10 24v10c0 3 6.3 5.5 14 5.5S38 37 38 34V24"/>`),
  capacity: S(`<circle cx="24" cy="24" r="6"/><path d="M24 5v6M24 37v6M5 24h6M37 24h6M10.6 10.6l4.2 4.2M33.2 33.2l4.2 4.2M10.6 37.4l4.2-4.2M33.2 14.8l4.2-4.2"/>`),
  debt: S(`<path d="M15 16h18l5 25H10z"/><path d="M19 16a5 5 0 0 1 10 0"/><path d="M19 30h10"/>`),
  warning: S(`<path d="M24 6L44 41H4z"/><path d="M24 19v10"/><path d="M24 34.5v.5"/>`),
  lock: S(`<rect x="10" y="21" width="28" height="20" rx="3"/><path d="M16 21v-5a8 8 0 0 1 16 0v5"/>`),
  clock: S(`<circle cx="24" cy="24" r="17"/><path d="M24 14v10l7 5"/>`),
  book: S(`<path d="M8 8h13a5 5 0 0 1 5 5v28a4 4 0 0 0-4-4H8z"/><path d="M40 8H30a5 5 0 0 0-4 2"/><path d="M40 8v29H30a4 4 0 0 0-4 4"/>`),
  flag: S(`<path d="M11 43V6"/><path d="M11 8h24l-5 7 5 7H11"/>`),
  up: S(`<path d="M24 38V10M12 22l12-12 12 12"/>`),
  down: S(`<path d="M24 10v28M12 26l12 12 12-12"/>`),
  question: S(`<circle cx="24" cy="24" r="18"/><path d="M18.5 19a5.5 5.5 0 1 1 7.5 5.1c-1.3.5-2 1.6-2 3v1.4"/><path d="M24 34v.5"/>`),
  dice: S(`<rect x="8" y="8" width="32" height="32" rx="6"/><circle cx="17" cy="17" r="1.5"/><circle cx="31" cy="31" r="1.5"/><circle cx="24" cy="24" r="1.5"/><circle cx="31" cy="17" r="1.5"/><circle cx="17" cy="31" r="1.5"/>`),
  restart: S(`<path d="M9 24a15 15 0 1 0 4.4-10.6"/><path d="M9 7v7h7"/>`),
};

export function glyph(name, cls = '') {
  return `<span class="tt-glyph ${cls}">${GLYPHS[name] ?? ''}</span>`;
}

export function stakeholderIcon(id) {
  return STAKEHOLDER_SVG[id] ?? GLYPHS.question;
}

// Icon + caption. `id` may be a plain id or an object { id, ... }.
export function stakeholderBadge(id, extraCls = '') {
  const key = typeof id === 'string' ? id : id?.id;
  const label = esc(STAKEHOLDERS[key] ?? key ?? '');
  return `<span class="tt-sh ${extraCls}" data-sh="${esc(key)}" data-pop="sh:${esc(key)}" title="${label}"><span class="tt-sh-icon">${stakeholderIcon(key)}</span><span class="tt-sh-label">${label}</span></span>`;
}
