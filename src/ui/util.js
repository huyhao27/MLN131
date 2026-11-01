// Small DOM/string helpers shared by the UI modules.

const ESC = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
export function esc(v) {
  return v == null ? '' : String(v).replace(/[&<>"']/g, (c) => ESC[c]);
}

export function signed(n) {
  const v = Math.round(Number(n) || 0);
  return v > 0 ? `+${v}` : v < 0 ? `−${Math.abs(v)}` : '0';
}

// Generic text for loosely-typed list items (string or object from the sim).
export function itemText(x) {
  if (x == null) return '';
  if (typeof x === 'string' || typeof x === 'number') return String(x);
  return x.text ?? x.why ?? x.reason ?? x.summary ?? x.description ?? x.label ?? x.title ?? '';
}

export function storageGet(key) {
  try { return localStorage.getItem(key); } catch { return null; }
}
export function storageSet(key, value) {
  try { localStorage.setItem(key, value); } catch { /* private mode etc. */ }
}
