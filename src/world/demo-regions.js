// Region-mode test bench for world-demo.html (?mode=regions, or press M).
// Keys (region mode): 1–6 select CN NN TT DC VC CB, Esc / 0 overview, L sample links,
// K clear links, R random regions, M back to classic, H hide panels.
// Hover / click on the island shows the region the world reports (world:hover / world:pick).
import { bus } from '../core/bus.js';

const IDS = ['CN', 'NN', 'TT', 'DC', 'VC', 'CB'];
const NAMES = { CN: 'Công nghiệp Thiên Hà', NN: 'Đồng bằng nông nghiệp', TT: 'Đô thị trung tâm', DC: 'Khu dân cư', VC: 'Vùng cao Bản Mây', CB: 'Duyên hải và cảng' };
const STATUSES = ['stable', 'opportunity', 'attention', 'urgent'];
// Service ids as in src/regions/data/regions.js (world folds them into visual families).
const SERVICES = ['water', 'power', 'components', 'outlet', 'port', 'access', 'housing', 'care', 'health'];
const BUILT = ['canal', 'power_reserve', 'cold_storage', 'cold_small', 'housing', 'care_center', 'care_point', 'green_space', 'clinic', 'road_vc', 'community_road', 'berth', 'bridge', 'bus_line', 'supplier', 'training', 'heat_link', 'market'];
// Home region of each key in the sim (bold in the panel). Others still work: they use the
// region's spare slots.
const BUILT_HINT = {
  CN: ['power_reserve', 'supplier', 'training', 'heat_link'], NN: ['canal'], TT: ['bridge', 'market'],
  DC: ['housing', 'care_center', 'care_point', 'green_space', 'bus_line'], VC: ['clinic', 'road_vc', 'community_road'], CB: ['berth', 'cold_storage', 'cold_small'],
};
export const SAMPLE_LINKS = [
  { from: 'VC', to: 'CN', service: 'power', kind: 'risk', label: 'Điện thủy điện' },
  { from: 'VC', to: 'NN', service: 'water', kind: 'active', label: 'Nước tưới' },
  { from: 'NN', to: 'DC', service: 'food', kind: 'benefit', label: 'Lương thực' },
  { from: 'CB', to: 'CN', service: 'goods', kind: 'active', label: 'Linh kiện nhập khẩu' },
  { from: 'DC', to: 'CN', service: 'labor', kind: 'benefit', label: 'Lao động' },
];

export function mountRegionBench(world, { panelEl, start = false } = {}) {
  const regions = Object.fromEntries(IDS.map((id) => [id, {
    id, name: NAMES[id], status: 'stable', indicators: { output: 55, wellbeing: 55, access: 55 }, short: new Set(), projects: 0, built: new Set(),
  }]));
  let current = 'NN';
  let linksOn = false;
  world.bindBus(bus);

  const el = document.createElement('div');
  el.id = 'rpanel';
  el.innerHTML = `
    <h1>Chế độ vùng</h1>
    <div id="rtabs"></div>
    <div class="row"><span>Trạng thái</span><select id="rstatus">${STATUSES.map((s) => `<option>${s}</option>`).join('')}</select><span></span></div>
    <div id="rind"></div>
    <div class="sub">Dịch vụ thiếu (short)</div><div id="rsvc" class="flags"></div>
    <div class="row"><span>Dự án</span><input id="rproj" type="range" min="0" max="2" step="1" value="0"><span id="rprojv">0</span></div>
    <div class="sub">Công trình xong (built)</div><div id="rbuilt" class="flags"></div>
    <div style="margin-top:8px">
      <button id="rlinks">Liên kết mẫu (L)</button><button id="rclear">Ẩn liên kết (K)</button>
      <button id="rrand">Ngẫu nhiên (R)</button><button id="rover">Toàn cảnh (Esc)</button><button id="rclassic">Classic (M)</button>
    </div>
    <div id="rinfo" class="hint">rê / bấm lên đảo…</div>
    <div class="hint">1–6 chọn vùng · Esc toàn cảnh · L/K liên kết · R ngẫu nhiên · H ẩn bảng</div>`;
  document.body.appendChild(el);

  const tabs = el.querySelector('#rtabs');
  IDS.forEach((id, i) => {
    const b = document.createElement('button');
    b.textContent = `${i + 1}: ${id}`;
    b.dataset.id = id;
    b.onclick = () => select(id);
    tabs.appendChild(b);
  });
  const ind = el.querySelector('#rind');
  for (const k of ['output', 'wellbeing', 'access']) {
    const row = document.createElement('div');
    row.className = 'row';
    row.innerHTML = `<span>${k}</span><input type="range" min="0" max="100" data-k="${k}"><span></span>`;
    row.querySelector('input').oninput = (e) => { regions[current].indicators[k] = Number(e.target.value); row.lastChild.textContent = e.target.value; push(); };
    ind.appendChild(row);
  }
  const svc = el.querySelector('#rsvc');
  for (const s of SERVICES) {
    const l = document.createElement('label');
    l.innerHTML = `<input type="checkbox" data-s="${s}"> ${s}`;
    l.querySelector('input').onchange = (e) => { const set = regions[current].short; e.target.checked ? set.add(s) : set.delete(s); push(); };
    svc.appendChild(l);
  }
  const bl = el.querySelector('#rbuilt');
  for (const k of BUILT) {
    const l = document.createElement('label');
    l.innerHTML = `<input type="checkbox" data-b="${k}"> <span>${k}</span>`;
    l.querySelector('input').onchange = (e) => { const set = regions[current].built; e.target.checked ? set.add(k) : set.delete(k); push(); };
    bl.appendChild(l);
  }
  el.querySelector('#rstatus').onchange = (e) => { regions[current].status = e.target.value; push(); };
  el.querySelector('#rproj').oninput = (e) => { regions[current].projects = Number(e.target.value); el.querySelector('#rprojv').textContent = e.target.value; push(); };
  el.querySelector('#rlinks').onclick = () => links(true);
  el.querySelector('#rclear').onclick = () => links(false);
  el.querySelector('#rrand').onclick = randomize;
  el.querySelector('#rover').onclick = () => select(null);
  el.querySelector('#rclassic').onclick = () => toggle();

  function sync() {
    const r = regions[current] ?? regions.NN;
    tabs.querySelectorAll('button').forEach((b) => b.classList.toggle('on', b.dataset.id === current));
    el.querySelector('#rstatus').value = r.status;
    ind.querySelectorAll('input').forEach((inp) => { inp.value = r.indicators[inp.dataset.k]; inp.parentElement.lastChild.textContent = inp.value; });
    svc.querySelectorAll('input').forEach((inp) => (inp.checked = r.short.has(inp.dataset.s)));
    bl.querySelectorAll('input').forEach((inp) => {
      inp.checked = r.built.has(inp.dataset.b);
      inp.nextElementSibling.style.fontWeight = BUILT_HINT[r.id].includes(inp.dataset.b) ? '600' : '400';
    });
    el.querySelector('#rproj').value = r.projects;
    el.querySelector('#rprojv').textContent = r.projects;
  }

  // RegionView.regions as the sim would send it.
  function view() {
    return IDS.map((id) => {
      const r = regions[id];
      return {
        id, name: r.name, status: r.status, indicators: { ...r.indicators },
        services: SERVICES.map((s) => ({ id: s, status: r.short.has(s) ? 'short' : 'ok' })),
        projects: Array.from({ length: r.projects }, (_, i) => `j${id}${i}`),
        built: [...r.built],
      };
    });
  }
  function push() {
    if (world.mode === 'regions') world.setRegions(view());
  }
  function select(id) {
    if (id) current = id;
    world.selectRegion(id);
    sync();
  }
  function links(on) {
    linksOn = on;
    world.showLinks(on ? SAMPLE_LINKS : []);
  }
  function randomize() {
    for (const id of IDS) {
      const r = regions[id];
      r.status = STATUSES[Math.floor(Math.random() * 4)];
      for (const k of ['output', 'wellbeing', 'access']) r.indicators[k] = Math.round(15 + Math.random() * 80);
      r.short = new Set(SERVICES.filter(() => Math.random() < 0.2));
      r.projects = Math.floor(Math.random() * 3);
      r.built = new Set(BUILT_HINT[id].filter(() => Math.random() < 0.5));
    }
    sync();
    push();
  }
  function toggle() {
    const next = world.mode === 'regions' ? 'classic' : 'regions';
    world.setMode(next);
    el.classList.toggle('hidden', next !== 'regions');
    if (panelEl) panelEl.classList.toggle('hidden', next === 'regions');
    if (next === 'regions') { push(); links(linksOn); }
  }

  const info = el.querySelector('#rinfo');
  let lastHover = null, lastPick = null;
  const showInfo = () => (info.textContent = `hover: ${lastHover ?? '—'} · pick: ${lastPick ?? '—'} · chọn: ${world.selectedRegion ?? 'toàn cảnh'}`);
  bus.on('world:hover', ({ region }) => { lastHover = region; world.hoverRegion(region); showInfo(); });
  bus.on('world:pick', ({ region }) => { lastPick = region; select(region); showInfo(); });

  addEventListener('keydown', (e) => {
    if (e.key === 'm' || e.key === 'M') { toggle(); e.preventDefault(); return; }
    if (world.mode !== 'regions' || e.target.tagName === 'SELECT') return;
    const n = Number(e.key);
    if (n >= 1 && n <= 6) select(IDS[n - 1]);
    else if (e.key === 'Escape' || e.key === '0') select(null);
    else if (e.key === 'l') links(true);
    else if (e.key === 'k') links(false);
    else if (e.key === 'r') randomize();
    else if (e.key === 'h') el.classList.toggle('hidden');
    else return;
    e.preventDefault();
    e.stopImmediatePropagation();
  }, true);

  el.classList.add('hidden');
  sync();
  if (start) toggle();
  return { regions, view, push, select, links, randomize, toggle, sample: SAMPLE_LINKS };
}
