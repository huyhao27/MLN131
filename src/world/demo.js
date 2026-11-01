// Standalone playground for the diorama (world-demo.html).
// Keys: ←/→ cycle sites, 0-9 jump to site, G/B/N pulse good/bad/neutral,
// Q toggle quality, H hide panel, R random state, D layout debug overlay (+ validation in console).
import { createDiorama, SITE_IDS } from './index.js';

const canvas = document.getElementById('world');
const world = createDiorama(canvas);
window.__world = world;

const METRICS = ['PROD', 'LIFE', 'TRUST', 'LAW', 'EQUITY', 'COHESION'];
const FLAGS = ['ECON_OVERHEAT', 'ECON_BALANCED', 'REGION_PARTICIPATION', 'CARE_INFRASTRUCTURE', 'COALITION_BUILT', 'LABOR_DIALOGUE', 'WAGE_SHOCK', 'CONSULT_REAL', 'RELIGION_FAIR_PROCESS'];
const state = { metrics: { PROD: 52, LIFE: 48, TRUST: 54, LAW: 51, EQUITY: 45, COHESION: 57 }, flags: new Set(), year: 1 };
let siteIndex = 0;

const panel = document.getElementById('panel');
panel.innerHTML = `
  <h1>Diorama Hòa Minh</h1>
  <div id="sites"></div>
  <div id="metrics" style="margin-top:8px"></div>
  <div class="row"><span>Năm</span><input id="year" type="range" min="1" max="8" step="1" value="1"><span id="yearv">1</span></div>
  <div class="flags" id="flags" style="margin-top:6px"></div>
  <div style="margin-top:8px">
    <button data-pulse="good">Pulse tốt (G)</button><button data-pulse="bad">Pulse xấu (B)</button><button data-pulse="neutral">Trung tính (N)</button>
  </div>
  <div><button id="q">Chất lượng: …</button><button id="rand">Ngẫu nhiên (R)</button><button id="lo">Tất cả thấp</button><button id="hi">Tất cả cao</button></div>
  <div class="hint">←/→ đổi địa điểm · 0–9 nhảy · H ẩn bảng · D lưới bố cục</div>`;

const sitesEl = panel.querySelector('#sites');
SITE_IDS.forEach((id, i) => {
  const b = document.createElement('button');
  b.textContent = `${i}: ${id}`;
  b.onclick = () => go(i);
  sitesEl.appendChild(b);
});

const mEl = panel.querySelector('#metrics');
for (const m of METRICS) {
  const row = document.createElement('div');
  row.className = 'row';
  row.innerHTML = `<span>${m}</span><input type="range" min="0" max="100" value="${state.metrics[m]}" data-m="${m}"><span>${state.metrics[m]}</span>`;
  mEl.appendChild(row);
  row.querySelector('input').oninput = (e) => {
    state.metrics[m] = Number(e.target.value);
    row.lastChild.textContent = e.target.value;
    push();
  };
}
const fEl = panel.querySelector('#flags');
for (const f of FLAGS) {
  const l = document.createElement('label');
  l.innerHTML = `<input type="checkbox" data-f="${f}"> ${f}`;
  l.querySelector('input').onchange = (e) => {
    if (e.target.checked) state.flags.add(f); else state.flags.delete(f);
    push();
  };
  fEl.appendChild(l);
}
panel.querySelector('#year').oninput = (e) => {
  state.year = Number(e.target.value);
  panel.querySelector('#yearv').textContent = e.target.value;
  push();
};
panel.querySelectorAll('[data-pulse]').forEach((b) => (b.onclick = () => world.pulse(b.dataset.pulse)));
const qBtn = panel.querySelector('#q');
const showQ = () => (qBtn.textContent = `Chất lượng: ${world.quality} (Q)`);
qBtn.onclick = () => { world.setQuality(world.quality === 'low' ? 'high' : 'low'); showQ(); };
showQ();
panel.querySelector('#rand').onclick = randomize;
panel.querySelector('#lo').onclick = () => setAll(15);
panel.querySelector('#hi').onclick = () => setAll(88);

function syncInputs() {
  mEl.querySelectorAll('input').forEach((inp) => {
    inp.value = state.metrics[inp.dataset.m];
    inp.parentElement.lastChild.textContent = inp.value;
  });
  fEl.querySelectorAll('input').forEach((inp) => (inp.checked = state.flags.has(inp.dataset.f)));
}
function setAll(v) {
  for (const m of METRICS) state.metrics[m] = v;
  syncInputs();
  push();
}
function randomize() {
  for (const m of METRICS) state.metrics[m] = Math.round(10 + Math.random() * 80);
  for (const f of FLAGS) if (Math.random() < 0.4) state.flags.add(f); else state.flags.delete(f);
  syncInputs();
  push();
}
function push() {
  world.setState({ metrics: { ...state.metrics }, flags: [...state.flags], year: state.year });
}
function go(i) {
  siteIndex = (i + SITE_IDS.length) % SITE_IDS.length;
  world.focus(SITE_IDS[siteIndex]);
  sitesEl.querySelectorAll('button').forEach((b, j) => b.classList.toggle('on', j === siteIndex));
}

addEventListener('keydown', (e) => {
  if (e.target.tagName === 'INPUT' && e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
  if (e.key === 'ArrowRight') go(siteIndex + 1);
  else if (e.key === 'ArrowLeft') go(siteIndex - 1);
  else if (/^[0-9]$/.test(e.key)) go(Number(e.key));
  else if (e.key === 'g') world.pulse('good');
  else if (e.key === 'b') world.pulse('bad');
  else if (e.key === 'n') world.pulse('neutral');
  else if (e.key === 'q') { world.setQuality(world.quality === 'low' ? 'high' : 'low'); showQ(); }
  else if (e.key === 'h') panel.classList.toggle('hidden');
  else if (e.key === 'r') randomize();
  else if (e.key === 'd') toggleLayout();
  else return;
  e.preventDefault();
});

let layoutOn = false;
function toggleLayout() {
  layoutOn = world.debug.showLayout(!layoutOn);
  if (layoutOn) {
    const all = world.validateLayout('all');
    const now = world.validateLayout();
    console.info(`[layout] ${all.overlaps.length} overlaps over every prop that can appear, ${now.overlaps.length} in the current state`, all.overlaps);
  }
}

// Deep link: ?site=valley
const qs = new URLSearchParams(location.search);
const startSite = SITE_IDS.indexOf(qs.get('site'));
push();
siteIndex = startSite >= 0 ? startSite : 0;
world.focus(SITE_IDS[siteIndex], { instant: true });
sitesEl.querySelectorAll('button')[siteIndex].classList.add('on');

// FPS readout.
const fpsEl = document.getElementById('fps');
let frames = 0, t0 = performance.now();
(function tick(now) {
  frames++;
  if (now - t0 > 1000) {
    fpsEl.textContent = `${Math.round((frames * 1000) / (now - t0))} fps · ${world.site} · ${world.quality}`;
    frames = 0;
    t0 = now;
  }
  requestAnimationFrame(tick);
})(performance.now());
