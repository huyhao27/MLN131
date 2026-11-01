// UI overlay: createUI(rootEl, { onAct, onUndo, onToggleRandom }) -> { render(view) }.
// Reads View objects only (ARCHITECTURE.md); never computes game rules itself.
import './ui.css';
import { createDashboard } from './dashboard.js';
import { renderCard } from './cards.js';
import { renderEnd } from './endScreen.js';
import { storageGet, storageSet } from './util.js';

const INPUT_GUARD_MS = 380; // ignore keys right after a new card appears (double-press safety)

export function createUI(rootEl, { onAct = () => {}, onUndo, onToggleRandom } = {}) {
  const params = new URLSearchParams(location.search);
  const testMode = params.get('test') === '1';

  const st = {
    view: null,
    presenter: storageGet('tt.presenter') === '1',
    skip: storageGet('tt.skip') === '1',
    acting: false,
    shownAt: 0,
    lastKey: '',
  };

  rootEl.classList.add('tt-root');
  rootEl.innerHTML = `
    <div class="tt-ui">
      <header class="tt-top"></header>
      <section class="tt-dash" aria-label="Bảng chỉ số"></section>
      <aside class="tt-panel" aria-live="polite"></aside>
      <section class="tt-end"></section>
      <div class="tt-toasts" aria-live="polite"></div>
    </div>`;
  const ui = rootEl.querySelector('.tt-ui');
  const panel = ui.querySelector('.tt-panel');
  const endEl = ui.querySelector('.tt-end');
  const toasts = ui.querySelector('.tt-toasts');

  const dash = createDashboard(ui.querySelector('.tt-top'), ui.querySelector('.tt-dash'), { skip: () => st.skip });

  function applyModes() {
    ui.classList.toggle('tt-presenter', st.presenter);
    ui.classList.toggle('tt-skip', st.skip);
    const badges = [];
    if (st.presenter) badges.push('Trình chiếu');
    if (testMode) badges.push('Thử nghiệm');
    if (st.view?.randomEvents === false) badges.push('Không biến cố');
    dash.setBadges(badges);
  }

  function toast(text, tone = '') {
    const t = document.createElement('div');
    t.className = `tt-toast ${tone}`;
    t.textContent = text;
    toasts.appendChild(t);
    setTimeout(() => t.classList.add('is-out'), 1800);
    setTimeout(() => t.remove(), 2300);
  }

  function activeEl() {
    return st.view?.phase === 'end' ? endEl : panel;
  }

  function act(opt) {
    if (!opt || st.acting) return;
    if (opt.disabled) {
      toast(opt.disabledReason || 'Phương án này chưa thể chọn', 'is-bad');
      const btn = activeEl().querySelector(`[data-opt="${CSS.escape(opt.id)}"]`);
      btn?.classList.remove('is-shake'); void btn?.offsetWidth; btn?.classList.add('is-shake');
      return;
    }
    st.acting = true;
    const btn = activeEl().querySelector(`[data-opt="${CSS.escape(opt.id)}"]`);
    btn?.classList.add('is-picked');
    // Release the lock even if the integrator never calls render() back.
    const release = setTimeout(() => { st.acting = false; }, 1500);
    try {
      onAct(opt.id);
    } catch (err) {
      console.error('[ui] onAct failed', err);
      toast('Không thực hiện được lựa chọn này', 'is-bad');
      st.acting = false;
      clearTimeout(release);
      btn?.classList.remove('is-picked');
    }
  }

  function render(view) {
    if (!view) return;
    const prev = st.view;
    st.view = view;
    st.acting = false;
    const isEnd = view.phase === 'end';
    const changed = !prev || prev.phase !== view.phase || prev.code !== view.code || prev.year !== view.year
      || prev.options?.map((o) => o.id).join() !== view.options?.map((o) => o.id).join();

    ui.dataset.phase = view.phase;
    ui.classList.toggle('is-end', isEnd);
    dash.update(view);
    applyModes();

    if (isEnd) {
      endEl.innerHTML = renderEnd(view);
      panel.innerHTML = '';
    } else {
      endEl.innerHTML = '';
      const scrollTop = changed ? 0 : panel.querySelector('[data-scroll]')?.scrollTop ?? 0;
      panel.innerHTML = renderCard(view, { canToggleRandom: typeof onToggleRandom === 'function' });
      const sc = panel.querySelector('[data-scroll]');
      if (sc) sc.scrollTop = scrollTop;
    }
    if (changed) {
      st.shownAt = performance.now();
      const card = activeEl().firstElementChild;
      card?.classList.add('is-enter');
    }
  }

  // ---------- input ----------

  function optionForKey(key) {
    const opts = st.view?.options ?? [];
    return opts.find((o) => String(o.key) === key) ?? (/^[1-9]$/.test(key) ? opts[Number(key) - 1] : null);
  }

  function scrollActive(dy) {
    const sc = activeEl().querySelector('[data-scroll]');
    sc?.scrollBy({ top: dy * sc.clientHeight, behavior: st.skip ? 'auto' : 'smooth' });
  }

  function toggleFullscreen() {
    if (document.fullscreenElement) document.exitFullscreen?.();
    else document.documentElement.requestFullscreen?.().catch(() => toast('Trình duyệt chặn toàn màn hình'));
  }

  function onKey(e) {
    if (e.defaultPrevented || e.isComposing) return;
    const t = e.target;
    if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT' || t.isContentEditable)) return;
    const k = e.key;
    const lower = k.length === 1 ? k.toLowerCase() : k;

    if ((e.ctrlKey || e.metaKey) && lower === 'z') {
      if (testMode && typeof onUndo === 'function') {
        e.preventDefault();
        st.acting = false;
        onUndo();
        toast('Đã hoàn tác (chế độ thử nghiệm)');
      }
      return;
    }
    if (e.ctrlKey || e.metaKey || e.altKey) return;

    if (lower === 'p') {
      st.presenter = !st.presenter; storageSet('tt.presenter', st.presenter ? '1' : '0');
      applyModes(); toast(st.presenter ? 'Chế độ trình chiếu: ẩn chú thích' : 'Hiện chú thích');
      e.preventDefault(); return;
    }
    if (lower === 's') {
      st.skip = !st.skip; storageSet('tt.skip', st.skip ? '1' : '0');
      if (st.skip) dash.finish();
      applyModes(); toast(st.skip ? 'Đã tắt hoạt ảnh' : 'Đã bật hoạt ảnh');
      e.preventDefault(); return;
    }
    if (lower === 'f') { toggleFullscreen(); e.preventDefault(); return; }
    if (lower === 'r' && typeof onToggleRandom === 'function') {
      const on = onToggleRandom();
      if (typeof on === 'boolean') toast(on ? 'Biến cố ngẫu nhiên: Bật' : 'Biến cố ngẫu nhiên: Tắt');
      else toast('Đã đổi chế độ biến cố ngẫu nhiên');
      e.preventDefault(); return;
    }
    if (k === 'ArrowDown' || k === 'PageDown') { scrollActive(k === 'PageDown' ? 0.85 : 0.3); e.preventDefault(); return; }
    if (k === 'ArrowUp' || k === 'PageUp') { scrollActive(k === 'PageUp' ? -0.85 : -0.3); e.preventDefault(); return; }

    if (!st.view) return;
    const guard = st.skip ? 120 : INPUT_GUARD_MS;
    const tooSoon = performance.now() - st.shownAt < guard;

    if (k === 'Enter' || k === ' ' || k === 'Spacebar') {
      e.preventDefault(); // also stops a focused button from double-firing
      if (e.repeat || tooSoon) return;
      const opts = st.view.options ?? [];
      // Enter/Space only "continues": it never casts a vote among several policies.
      if (opts.length === 1) act(opts[0]);
      else if (opts.length > 1) toast('Bấm phím số 1–' + opts.length + ' để chọn phương án');
      return;
    }
    const digit = e.code?.startsWith('Numpad') && /^Numpad\d$/.test(e.code) ? e.code.slice(6) : k;
    if (/^[0-9]$/.test(digit)) {
      e.preventDefault();
      if (e.repeat || tooSoon) return;
      const opt = optionForKey(digit);
      if (opt) act(opt);
    }
  }
  window.addEventListener('keydown', onKey);

  ui.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-opt], [data-action]');
    if (!btn) return;
    btn.blur();
    if (btn.dataset.action === 'toggle-random') {
      const on = onToggleRandom?.();
      if (typeof on === 'boolean') {
        toast(on ? 'Biến cố ngẫu nhiên: Bật' : 'Biến cố ngẫu nhiên: Tắt');
        const b = btn.querySelector('b'); if (b) b.textContent = on ? 'Bật' : 'Tắt';
      }
      return;
    }
    const opt = st.view?.options?.find((o) => String(o.id) === btn.dataset.opt);
    act(opt);
  });

  applyModes();

  return {
    render,
    // Extras for the integrator; not part of the required contract.
    toast: (text) => toast(String(text)),
    destroy() {
      window.removeEventListener('keydown', onKey);
      rootEl.innerHTML = '';
    },
  };
}
