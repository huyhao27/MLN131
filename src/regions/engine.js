// Region-mode simulation (doc 04, doc 05). Pure functions over a plain JSON state `s`;
// no DOM, no three. Supply and demand are computed per region and service each period,
// so an event only spreads to regions that really depend on the missing service.
import { mulberry32, fnv1a } from '../core/rng.js';
import { CONFIG, BASE_PARAMS, REGION_ORDER, INDICATORS } from './data/config.js';
import { REGIONS, BUILT, LINKS, TOPICS, serviceLabel } from './data/regions.js';
import { EVENTS, SHORTAGE_PROBLEMS, DIRECT_CONSEQUENCES, OPENING } from './data/events.js';

export const EVENT_BY_ID = Object.fromEntries(
  [...EVENTS, ...SHORTAGE_PROBLEMS, ...Object.values(DIRECT_CONSEQUENCES)].map((e) => [e.id, e]),
);
const SHORTAGE_BY_KEY = Object.fromEntries(SHORTAGE_PROBLEMS.map((e) => [`${e.service}:${e.region}`, e]));

// Delayed op lists live in the static content; the JSON state only stores their id, so
// snapshots (undo) and reloads keep working when they contain condition functions.
const LATER = {};
(function indexLater(node) {
  if (Array.isArray(node)) return node.forEach(indexLater);
  if (!node || typeof node !== 'object') return;
  if (node.t === 'later' && !node.id) {
    node.id = `L${Object.keys(LATER).length + 1}`;
    LATER[node.id] = node.ops;
  }
  for (const v of Object.values(node)) if (v && typeof v === 'object') indexLater(v);
})(Object.values(EVENT_BY_ID));

const clamp = (v, lo, hi) => (v < lo ? lo : v > hi ? hi : v);
const clone = (o) => JSON.parse(JSON.stringify(o));
const round1 = (v) => Math.round(v * 10) / 10;

// ------------------------------------------------------------------ state

export function initialState(seed = 2026) {
  const regions = {};
  for (const id of REGION_ORDER) {
    const b = REGIONS[id].base;
    regions[id] = { ind: { ...b }, pot: { ...b }, prev: { ...b }, lastEvent: -9 };
  }
  return {
    seed,
    phase: 'briefing',
    period: 0,
    total: CONFIG.periods,
    budget: CONFIG.startBudget,
    reservoir: CONFIG.reservoir.start,
    reservoirCause: null,
    stock: BASE_PARAMS.stockMax,
    regions,
    mods: [],
    built: [],
    projects: [],
    problems: [],
    scheduled: [],
    upkeeps: [],
    cooldowns: {},
    news: [],
    decisions: [],
    shortageLog: [],
    timeline: [],
    nextId: 1,
    before: Object.fromEntries(REGION_ORDER.map((id) => [id, { ...REGIONS[id].base }])),
  };
}

// ------------------------------------------------------------------ parameters

function setPath(obj, path, fn) {
  const parts = path.split('.');
  let o = obj;
  for (let i = 0; i < parts.length - 1; i++) o = o[parts[i]] ??= {};
  const k = parts[parts.length - 1];
  o[k] = fn(o[k] ?? 0);
}
function getPath(obj, path) {
  return path.split('.').reduce((o, k) => (o == null ? undefined : o[k]), obj);
}

/** Network parameters this period: base + finished projects + active mods (adds, then multipliers). */
export function params(s) {
  const P = clone(BASE_PARAMS);
  P.flag = {};
  for (const key of s.built) {
    for (const [k, v] of Object.entries(BUILT[key]?.params || {})) setPath(P, k, (x) => x + v);
  }
  const g = Math.max(0, s.period - 1);
  for (const [k, v] of Object.entries(CONFIG.growth)) setPath(P, k, (x) => x + v * g);
  const active = s.mods.filter((m) => m.from <= s.period && m.until >= s.period);
  for (const m of active) if (m.op === 'add') setPath(P, m.key, (x) => x + m.v);
  for (const m of active) if (m.op === 'mul') setPath(P, m.key, (x) => x * m.v);
  return P;
}

// ------------------------------------------------------------------ services

const ratioStatus = (r) => (r < CONFIG.tolerance.short ? 'short' : r < CONFIG.tolerance.tight ? 'tight' : 'ok');

/** Supply and demand for every region and service. Pure. */
export function computeServices(s, P = params(s)) {
  const svc = Object.fromEntries(REGION_ORDER.map((r) => [r, {}]));
  const set = (r, id, need, have) => {
    const ratio = need > 0 ? have / need : 1;
    svc[r][id] = { need: round1(need), have: round1(have), ratio: Math.round(ratio * 100) / 100, status: ratioStatus(ratio) };
  };
  const ind = (r, k) => s.regions[r].ind[k];

  // Power: hydro (reservoir-dependent) + plant + reserves. Essential users first, industry last.
  const hydro = P.hydroMax * Math.min(1, s.reservoir / 45) * P.hydroMul;
  const plant = P.plant * P.plantMul;
  const powerSupply = hydro + plant + P.reservePower;
  let pool = powerSupply;
  let powerNeed = 0;
  for (const r of ['TT', 'DC', 'CB', 'NN', 'CN']) {
    const need = Math.max(0, P.pwDem[r]);
    const have = Math.min(need, pool);
    pool -= have;
    powerNeed += need;
    if (REGIONS[r].services.includes('power')) set(r, 'power', need, have);
  }

  // Water from the reservoir: drinking water first, irrigation after.
  let water = P.waterBase * Math.min(1, s.reservoir / 50) + P.waterExtra;
  const waterSupply = water;
  for (const r of ['DC', 'VC', 'NN']) {
    const need = Math.max(0, P.wDem[r]);
    const have = Math.min(need, water);
    water -= have;
    set(r, 'water', need, have);
  }

  // Port: components in, then factory exports, then farm produce (only the excess waits).
  const comp = Math.max(0, P.compImport) * P.supplyMul;
  const cnOut = P.cnExport * clamp(ind('CN', 'output') / 60, 0.5, 1.3);
  const cnRoad = 30 * P.bridge;
  const nnShip = Math.min(Math.max(0, P.nnExport), P.roadNNCB);
  const portHave = P.portCap * P.portLabor * P.portStorm;
  const portNeed = comp + Math.min(cnOut, cnRoad) + nnShip;
  let cap = portHave;
  const compArr = Math.min(comp, cap); cap -= compArr;
  const cnShip = Math.min(cnOut, cnRoad, cap); cap -= cnShip;
  const nnPort = Math.min(nnShip, Math.max(0, cap));
  set('CB', 'port', portNeed, portHave);

  set('CN', 'components', Math.max(0, P.compImport), compArr + s.stock);
  set('NN', 'outlet', Math.max(0, P.nnExport), nnPort + P.outletDomestic + P.storage);
  set('CN', 'labor', P.commuters, P.commuteCap);
  set('CB', 'portLabor', P.portWorkers, P.portWorkers * P.portLabor);
  set('DC', 'housing', P.housingNeed, P.housingCap);
  set('DC', 'care', P.careNeed, P.careCap);
  const foodRoute = Math.min(1, (P.roadNNDC * P.bridge) / 16);
  set('DC', 'food', P.foodNeed, P.food * clamp(ind('NN', 'output') / 55, 0.5, 1.2) * foodRoute);
  set('TT', 'health', P.healthNeed, P.healthCap);
  set('VC', 'access', P.vcTrips, P.roadTTVC + P.vcService);

  const links = LINKS.map((l) => {
    let capacity, load;
    switch (l.id) {
      case 'VC-NN-water': capacity = waterSupply; load = Math.max(0, P.wDem.NN); break;
      case 'VC-CN-power': capacity = hydro; load = Math.min(hydro, powerNeed); break;
      case 'CN-TT-power': case 'CN-DC-power': case 'CN-CB-power': capacity = powerSupply; load = powerNeed; break;
      case 'NN-CB-goods': capacity = P.roadNNCB; load = Math.max(0, P.nnExport); break;
      case 'NN-DC-food': capacity = P.roadNNDC * P.bridge; load = P.foodNeed * 0.8; break;
      case 'CB-CN-goods': capacity = portHave; load = comp; break;
      case 'CN-CB-goods': capacity = cnRoad; load = cnOut; break;
      case 'DC-CN-labor': capacity = P.commuteCap; load = P.commuters; break;
      case 'DC-CB-labor': capacity = P.portWorkers * P.portLabor; load = P.portWorkers; break;
      case 'TT-DC-care': capacity = P.healthCap; load = P.healthNeed; break;
      case 'TT-VC-road': capacity = P.roadTTVC; load = P.vcTrips; break;
      default: capacity = 1; load = 0;
    }
    const r = load > 0 ? capacity / load : 9;
    return { ...l, capacity: round1(capacity), load: round1(load), status: capacity <= 0.01 ? 'down' : r < 1 ? 'tight' : 'ok' };
  });

  return { svc, links, compArr, portLoad: portHave > 0 ? portNeed / portHave : 9 };
}

// ------------------------------------------------------------------ condition context

/** Read-only helpers for content conditions. */
export function context(s, extra = {}) {
  const P = params(s);
  const S = computeServices(s, P);
  return {
    s, P, svc: S.svc, period: s.period, total: s.total,
    ind: (r, k) => s.regions[r].ind[k],
    built: (k) => s.built.includes(k),
    flag: (n) => (P.flag?.[n] || 0) > 0,
    tagged: (name) => s.mods.some((m) => m.tag === name && m.until >= s.period),
    short: (r, id) => S.svc[r]?.[id]?.status === 'short',
    ratio: (r, id) => S.svc[r]?.[id]?.ratio ?? 1,
    load: (what) => (what === 'port' ? S.portLoad : 0),
    ...extra,
  };
}

// ------------------------------------------------------------------ ops

function pushNews(s, text, tone = 'neutral', extra = {}) {
  s.news.push({ period: s.period, text, tone, ...extra });
}

/** Apply effect ops. `src` = { title, problem (instanceId), depth } of the cause. */
export function applyOps(s, ops = [], src = {}) {
  for (const op of ops) {
    switch (op.t) {
      case 'mod':
        if (op.op !== 'add' && op.op !== 'mul') throw new Error(`bad mod op ${JSON.stringify(op)}`);
        s.mods.push({
          key: op.key, op: op.op, v: op.v, from: s.period, until: s.period + op.n - 1,
          tag: op.tag || null, src: op.src || src.title || null, problem: src.problem ?? null, depth: src.depth ?? 0,
        });
        break;
      case 'untag':
        s.mods = s.mods.filter((m) => m.tag !== op.name);
        break;
      case 'delta': {
        const r = s.regions[op.region];
        r.ind[op.ind] = clamp(r.ind[op.ind] + op.v, 0, 100);
        break;
      }
      case 'pot': {
        const r = s.regions[op.region];
        r.pot[op.ind] = clamp(r.pot[op.ind] + op.v, 0, 100);
        break;
      }
      case 'res':
        if (op.key === 'reservoir') {
          const before = s.reservoir;
          s.reservoir = clamp(op.cap ? Math.min(s.reservoir, op.v) : s.reservoir + op.v, 0, CONFIG.reservoir.max);
          if (s.reservoir < before) s.reservoirCause = { title: src.title, problem: src.problem, depth: src.depth ?? 0 };
        } else if (op.key === 'stock') s.stock = Math.max(0, s.stock + op.v);
        break;
      case 'cash':
        s.budget += op.v;
        break;
      case 'build':
        if (!s.built.includes(op.key)) {
          s.built.push(op.key);
          const b = BUILT[op.key];
          for (const [region, ch] of Object.entries(b?.potential || {})) {
            for (const [k, v] of Object.entries(ch)) {
              s.regions[region].pot[k] = clamp(s.regions[region].pot[k] + v, 0, 100);
              s.regions[region].ind[k] = clamp(s.regions[region].ind[k] + Math.ceil(v / 2), 0, 100);
            }
          }
          pushNews(s, `${b?.label || op.key} đã hoàn tất`, 'good', { region: b?.region });
        }
        break;
      case 'news':
        pushNews(s, op.text, op.tone, { region: src.region });
        break;
      case 'when': {
        const c = context(s);
        applyOps(s, op.if(c) ? op.ops : op.otherwise, src);
        break;
      }
      case 'later':
        s.scheduled.push({ at: s.period + op.in, opsId: op.id, src });
        break;
      case 'spawn': {
        const def = EVENT_BY_ID[op.id];
        if (def && !openOfFamily(s, def.family, op.region || def.region)) {
          openProblem(s, def, { region: op.region, depth: (src.depth ?? 0) + 1, parent: src.problem, causes: def.causes });
        }
        break;
      }
      default:
        throw new Error(`unknown op ${op.t}`);
    }
  }
}

// ------------------------------------------------------------------ problems

export const isOpen = (p) => p.status !== 'closed';
const openOfFamily = (s, family, region) =>
  s.problems.find((p) => isOpen(p) && EVENT_BY_ID[p.rootId].family === family && (!region || p.region === region));
const openInRegion = (s, region) => s.problems.filter((p) => isOpen(p) && p.region === region);

export function openProblem(s, def, { region, depth = 0, parent = null, causes = null, origin } = {}) {
  const p = {
    instanceId: `p${s.nextId++}`,
    rootId: def.id,
    region: region || def.region,
    origin: origin || def.origin,
    status: 'open',
    openedAt: s.period,
    deadline: def.deadline ? s.period + def.deadline - 1 : null,
    severity: def.severity || 1,
    depth,
    parent,
    causes: causes || [],
    chosen: null,
    outcome: null,
    closedAt: null,
  };
  s.problems.push(p);
  s.regions[p.region].lastEvent = s.period;
  const tone = p.origin === 'opportunity' ? 'good' : p.origin === 'consequence' ? 'bad' : 'neutral';
  const chain = p.causes.length ? [...p.causes, def.title] : null;
  pushNews(s, chain ? `Vì ${chain.join(' → ')}` : `${REGIONS[p.region].short}: ${def.title}`, tone, { region: p.region, chain, problem: p.instanceId });
  applyOps(s, def.onOpen, { title: def.title, problem: p.instanceId, depth, region: p.region });
  return p;
}

function closeProblem(s, p, outcome, text, tone = 'good') {
  p.status = 'closed';
  p.outcome = outcome;
  p.closedAt = s.period;
  const def = EVENT_BY_ID[p.rootId];
  s.cooldowns[`${def.family}:${p.region}`] = s.period + CONFIG.draw.cooldown;
  if (text) pushNews(s, text, tone, { region: p.region, problem: p.instanceId });
}

// ------------------------------------------------------------------ choices

export const slotsUsed = (s) => s.projects.filter((j) => !j.done).length;

/** Options for a problem with availability (no hidden effects beyond the preview). */
export function optionStates(s, p) {
  const def = EVENT_BY_ID[p.rootId];
  const c = context(s, { p });
  return def.options.map((o) => {
    let reason = null;
    if (p.chosen) reason = 'Đã chọn một hướng xử lý';
    else if (o.cost > s.budget) reason = `Không đủ ngân sách: cần ${o.cost}, còn ${s.budget}`;
    else if (o.project && slotsUsed(s) >= CONFIG.maxProjects) reason = `Đã có ${CONFIG.maxProjects} dự án đang thi công`;
    else if (o.project && s.built.includes(o.project)) reason = 'Công trình này đã có';
    else if (o.requires && !o.requires.if(c)) reason = o.requires.reason;
    else if (o.delay && s.period + o.delay > s.total) reason = 'Không kịp hoàn thành trước khi hết nhiệm kỳ';
    return { def: o, disabled: !!reason, reason };
  });
}

export function choose(s, instanceId, optionId) {
  const p = s.problems.find((x) => x.instanceId === instanceId);
  if (!p || !isOpen(p)) throw new Error(`problem ${instanceId} is not open`);
  const st = optionStates(s, p).find((x) => x.def.id === optionId);
  if (!st) throw new Error(`unknown option ${optionId} for ${instanceId}`);
  if (st.disabled) throw new Error(`option ${optionId} unavailable: ${st.reason}`);
  const o = st.def;
  const def = EVENT_BY_ID[p.rootId];
  const src = { title: def.title, problem: p.instanceId, depth: p.depth, region: p.region };

  s.budget -= o.cost;
  if (o.upkeep) s.upkeeps.push({ v: o.upkeep.v, from: s.period, until: s.period + o.upkeep.n - 1, label: o.label });
  const delay = o.delay || 0;
  const maxN = Math.max(0, ...(o.now || []).filter((x) => x.t === 'mod' && !x.tag).map((x) => x.n));
  // Shortage problems close only when the service recovers; others when the option lands.
  p.chosen = { option: o.id, label: o.label, period: s.period, completesAt: s.period + delay, until: s.period + Math.max(delay, maxN - 1), close: o.close || (def.service ? 'when' : 'done') };
  p.status = 'working';
  s.decisions.push({ period: s.period, region: p.region, problem: p.instanceId, rootId: p.rootId, title: def.title, option: o.id, label: o.label, cost: o.cost, topic: def.topic });

  applyOps(s, o.now, src);
  if (o.project) {
    s.projects.push({ id: `j${s.nextId++}`, key: o.project, label: BUILT[o.project]?.label || o.label, region: BUILT[o.project]?.region || p.region, startedAt: s.period, doneAt: s.period + delay, done: false, problem: p.instanceId });
  }
  if (delay === 0) completeChoice(s, p);
  return p;
}

function completeChoice(s, p) {
  const def = EVENT_BY_ID[p.rootId];
  const o = def.options.find((x) => x.id === p.chosen.option);
  applyOps(s, o.done, { title: def.title, problem: p.instanceId, depth: p.depth, region: p.region });
  for (const j of s.projects) if (j.problem === p.instanceId && !j.done) j.done = true;
  p.chosen.completed = true;
  if (p.chosen.close === 'done') {
    closeProblem(s, p, 'resolved', p.chosen.completesAt > p.chosen.period ? `${REGIONS[p.region].short}: ${o.label.toLowerCase()} đã có tác dụng` : null);
  }
}

// ------------------------------------------------------------------ period cycle

export function income(s) {
  const { base, pivot, step, min } = CONFIG.income;
  const avgOut = REGION_ORDER.reduce((a, r) => a + s.regions[r].ind.output, 0) / REGION_ORDER.length;
  return Math.max(min, base + Math.floor((avgOut - pivot) / step));
}
export const upkeepNow = (s) => s.upkeeps.filter((u) => u.from <= s.period && u.until >= s.period).reduce((a, u) => a + u.v, 0);

// Shortage penalties (fraction f short, once per service and region per period).
const PENALTY = {
  'power:CN': (f) => [['CN', 'output', 28 * f], ['CN', 'wellbeing', f > 0.2 ? 1 : 0]],
  'power:TT': (f) => [['TT', 'access', 20 * f]],
  'power:DC': (f) => [['DC', 'wellbeing', 20 * f]],
  'power:CB': (f) => [['CB', 'output', 20 * f]],
  'water:NN': (f) => [['NN', 'output', 26 * f], ['NN', 'wellbeing', 8 * f]],
  'water:DC': (f) => [['DC', 'wellbeing', 20 * f]],
  'water:VC': (f) => [['VC', 'wellbeing', 15 * f]],
  'outlet:NN': (f) => [['NN', 'output', 14 * f], ['NN', 'wellbeing', 12 * f]],
  'port:CB': (f) => [['CB', 'output', 24 * f]],
  'components:CN': (f) => [['CN', 'output', 26 * f], ['DC', 'wellbeing', 6 * f]],
  'labor:CN': (f) => [['CN', 'output', 18 * f], ['DC', 'wellbeing', 8 * f]],
  'portLabor:CB': (f) => [['CB', 'output', 14 * f], ['CB', 'wellbeing', 8 * f]],
  'housing:DC': (f) => [['DC', 'wellbeing', 20 * f]],
  'care:DC': (f) => [['DC', 'wellbeing', 14 * f], ['CN', 'output', 6 * f], ['TT', 'access', 5 * f]],
  'food:DC': (f) => [['DC', 'wellbeing', 16 * f]],
  'health:TT': (f) => [['TT', 'access', 14 * f], ['DC', 'wellbeing', 6 * f], ['VC', 'access', 6 * f]],
  'access:VC': (f) => [['VC', 'access', 22 * f], ['VC', 'output', 10 * f], ['VC', 'wellbeing', 8 * f]],
};

export function endPeriod(s) {
  const P = params(s);
  const S = computeServices(s, P);
  const hit = new Set();
  for (const r of REGION_ORDER) {
    for (const [id, x] of Object.entries(S.svc[r])) {
      if (x.status !== 'short') continue;
      const f = Math.min(0.7, 1 - x.ratio);
      const pen = PENALTY[`${id}:${r}`];
      if (!pen) continue;
      for (const [rr, k, v] of pen(f)) {
        const d = Math.ceil(v);
        if (d <= 0) continue;
        s.regions[rr].ind[k] = clamp(s.regions[rr].ind[k] - d, 0, 100);
        hit.add(`${rr}.${k}`);
      }
      s.shortageLog.push({ period: s.period, region: r, service: id, ratio: x.ratio });
    }
  }
  // Recovery toward each region's potential where nothing pulled the indicator down;
  // calm, well-served regions develop.
  const shortIn = new Set(s.shortageLog.filter((x) => x.period === s.period).map((x) => x.region));
  for (const r of REGION_ORDER) {
    const R = s.regions[r];
    const undecided = s.problems.some((p) => isOpen(p) && p.region === r && !p.chosen && p.origin !== 'opportunity');
    if (!shortIn.has(r) && !undecided) {
      for (const k of INDICATORS) R.pot[k] = Math.min(CONFIG.develop.cap, Math.max(R.pot[k], R.pot[k] + CONFIG.develop[k]));
    }
    for (const k of INDICATORS) {
      if (hit.has(`${r}.${k}`)) continue;
      const diff = R.pot[k] - R.ind[k];
      if (diff >= 1) R.ind[k] += Math.min(CONFIG.recovery, Math.floor(diff));
      else if (diff < -3) R.ind[k] -= 1; // one-off boosts fade slowly above potential
    }
  }
  // Inventory and reservoir.
  s.stock = clamp(s.stock + S.compArr - Math.max(0, P.compImport), 0, P.stockMax);
  if (!(P.flag?.dry > 0)) s.reservoir = Math.min(CONFIG.reservoir.max, s.reservoir + CONFIG.reservoir.rain);
  if (s.reservoir >= 50) s.reservoirCause = null;

  // Deadlines: an undecided problem expires once at the end of its last period.
  for (const p of s.problems.filter((x) => isOpen(x) && !x.chosen && x.deadline === s.period)) {
    const def = EVENT_BY_ID[p.rootId];
    applyOps(s, def.onExpire, { title: def.title, problem: p.instanceId, depth: p.depth, region: p.region });
    if (p.origin === 'opportunity') closeProblem(s, p, 'expired', `${REGIONS[p.region].short}: cơ hội "${def.title}" đã qua`, 'neutral');
    else if (def.closeWhen || def.service) {
      p.status = 'escalated';
      p.severity = Math.min(3, p.severity + 1);
      p.deadline = null;
      pushNews(s, `${REGIONS[p.region].short}: "${def.title}" chưa được xử lý, tình hình xấu đi`, 'bad', { region: p.region, problem: p.instanceId });
    } else closeProblem(s, p, 'expired', `${REGIONS[p.region].short}: "${def.title}" qua hạn, thiệt hại đã ghi nhận`, 'bad');
  }

  s.budget += income(s) - upkeepNow(s);
  s.timeline.push({ period: s.period, national: national(s) });

  if (s.period >= s.total) {
    s.phase = 'end';
    return 'end';
  }
  s.period += 1;
  beginPeriod(s);
  return 'next';
}

/** Start of a period: due effects, finished work, recovery checks, consequences, new events. */
export function beginPeriod(s) {
  for (const r of REGION_ORDER) s.regions[r].prev = { ...s.regions[r].ind };
  s.mods = s.mods.filter((m) => m.until >= s.period);
  s.upkeeps = s.upkeeps.filter((u) => u.until >= s.period);

  const due = s.scheduled.filter((x) => x.at <= s.period);
  s.scheduled = s.scheduled.filter((x) => x.at > s.period);
  for (const x of due) applyOps(s, LATER[x.opsId], x.src);

  for (const p of s.problems.filter((x) => x.status === 'working' && !x.chosen.completed && x.chosen.completesAt <= s.period)) {
    completeChoice(s, p);
  }

  // Close what recovered; reopen problems whose temporary fix ran out.
  let c = context(s);
  for (const p of s.problems.filter(isOpen)) {
    const def = EVENT_BY_ID[p.rootId];
    if (def.service) {
      if (!c.short(p.region, def.service)) closeProblem(s, p, p.chosen ? 'resolved' : 'recovered', `${REGIONS[p.region].short}: ${serviceLabel(def.service, p.region).toLowerCase()} đã đủ trở lại`);
      else if (p.chosen && p.chosen.completed && s.period > p.chosen.until) reopen(s, p);
      continue;
    }
    if (def.closeWhen && def.closeWhen({ ...c, p })) {
      closeProblem(s, p, p.chosen ? 'resolved' : 'recovered', `${REGIONS[p.region].short}: "${def.title}" đã ổn định`);
      continue;
    }
    if (p.status === 'working' && p.chosen.completed && p.chosen.close === 'when' && s.period > p.chosen.until) reopen(s, p);
  }

  // Shortages open consequence problems (deduplicated by service and region).
  c = context(s);
  let created = 0;
  for (const r of REGION_ORDER) {
    for (const [id, x] of Object.entries(c.svc[r])) {
      if (x.status !== 'short') continue;
      if (id === 'outlet' && c.short('CB', 'port')) continue; // same cause as the port backlog
      const def = SHORTAGE_BY_KEY[`${id}:${r}`];
      if (!def || openOfFamily(s, def.family, r)) continue;
      const cause = shortageCause(s, id, r);
      if (cause.depth + 1 > CONFIG.maxDepth) {
        pushNews(s, `Vì ${[...cause.chain, `${serviceLabel(id, r)} ở ${REGIONS[r].short} thiếu`].join(' → ')}`, 'bad', { region: r, chain: cause.chain });
        continue;
      }
      openProblem(s, def, { region: r, depth: cause.depth + 1, parent: cause.problem, causes: [...cause.chain, `${serviceLabel(id, r)} thiếu`] });
      created++;
    }
  }

  if (s.period === 1) openingEvents(s);
  else if (created < CONFIG.draw.maxConsequencesBeforeSkip) {
    drawRoot(s, 'draw');
    const roots = s.problems.filter((p) => isOpen(p) && p.origin !== 'consequence').length;
    if (created === 0 && roots <= CONFIG.draw.calmOpen) drawRoot(s, 'draw2', CONFIG.draw.secondChance);
  }
}

function reopen(s, p) {
  const def = EVENT_BY_ID[p.rootId];
  p.status = 'open';
  p.chosen = null;
  p.deadline = s.period + (def.deadline || 2) - 1;
  pushNews(s, `${REGIONS[p.region].short}: giải pháp tạm cho "${def.title}" đã hết tác dụng`, 'bad', { region: p.region, problem: p.instanceId });
}

// Keys whose change makes a service worse: + on need keys, − on have keys.
const SERVICE_KEYS = {
  power: { need: ['pwDem'], have: ['plantMul', 'hydroMul', 'reservePower'], reservoir: true },
  water: { need: ['wDem'], have: ['waterExtra'], reservoir: true },
  port: { need: ['cnExport', 'nnExport', 'compImport'], have: ['portCap', 'portLabor', 'portStorm'] },
  components: { need: [], have: ['supplyMul', 'portCap', 'portStorm', 'portLabor'] },
  outlet: { need: ['nnExport'], have: ['storage', 'outletDomestic', 'roadNNCB', 'portCap', 'portStorm'] },
  labor: { need: ['commuters'], have: ['commuteCap'] },
  portLabor: { need: [], have: ['portLabor'] },
  housing: { need: ['housingNeed'], have: ['housingCap'] },
  care: { need: ['careNeed'], have: ['careCap'] },
  food: { need: ['foodNeed'], have: ['food', 'roadNNDC', 'bridge'] },
  health: { need: ['healthNeed'], have: ['healthCap'] },
  access: { need: ['vcTrips'], have: ['roadTTVC', 'vcService'] },
};

/** Why is this service short? The deepest active cause, as a readable chain. */
export function shortageCause(s, service, region) {
  const keys = SERVICE_KEYS[service] || { need: [], have: [] };
  const hurts = (m) => {
    const base = m.key.split('.')[0];
    if (keys.need.includes(base)) return m.op === 'add' ? m.v > 0 : m.v > 1;
    if (keys.have.includes(base)) return m.op === 'add' ? m.v < 0 : m.v < 1;
    return false;
  };
  const causes = s.mods.filter((m) => m.from <= s.period && m.until >= s.period && hurts(m) && m.src);
  if (keys.reservoir && s.reservoirCause && s.reservoir < 50) causes.push({ src: s.reservoirCause.title, problem: s.reservoirCause.problem, depth: s.reservoirCause.depth });
  if (!causes.length) return { chain: [], depth: 0, problem: null };
  causes.sort((a, b) => (b.depth || 0) - (a.depth || 0));
  const top = causes[0];
  const p = s.problems.find((x) => x.instanceId === top.problem);
  const chain = p && p.causes.length ? [...p.causes.slice(0, -1), top.src] : [top.src];
  return { chain: dedupe(chain), depth: top.depth || 0, problem: top.problem };
}
const dedupe = (arr) => arr.filter((x, i) => x && arr.indexOf(x) === i);

// ------------------------------------------------------------------ drawing events

const rngFor = (s, salt) => mulberry32((fnv1a(`${s.seed}:${s.period}:${salt}`)) >>> 0);

function eligibleRoots(s, list) {
  const c = context(s);
  return list
    .map((id) => EVENT_BY_ID[id] || id)
    .filter((e) => {
      if (!e || e.origin === 'consequence') return false;
      if (openOfFamily(s, e.family)) return false;
      if ((s.cooldowns[`${e.family}:${e.region}`] ?? -9) > s.period) return false;
      if (openInRegion(s, e.region).length >= CONFIG.draw.perRegion) return false;
      const minDelay = Math.min(...e.options.map((o) => o.delay || 0));
      if (s.period + minDelay > s.total) return false;
      return e.eligible ? e.eligible(c) : true;
    });
}

function pickWeighted(rng, list, weightOf) {
  const w = list.map(weightOf);
  const total = w.reduce((a, b) => a + b, 0);
  let x = rng() * total;
  for (let i = 0; i < list.length; i++) if ((x -= w[i]) < 0) return list[i];
  return list[list.length - 1];
}

function openingEvents(s) {
  const rng = rngFor(s, 'opening');
  const mild = eligibleRoots(s, OPENING.mild);
  if (mild.length) openProblem(s, pickWeighted(rng, mild, () => 1));
  const opp = eligibleRoots(s, OPENING.opportunity).filter((e) => !openInRegion(s, e.region).length);
  if (opp.length) openProblem(s, pickWeighted(rng, opp, () => 1));
}

export function drawRoot(s, salt = 'draw', chance = CONFIG.draw.chance) {
  const cfg = CONFIG.draw;
  if (s.period < cfg.firstPeriod) return null;
  const openRoots = s.problems.filter((p) => isOpen(p) && p.origin !== 'consequence').length;
  if (openRoots >= cfg.attention) return null;
  const rng = rngFor(s, salt);
  if (rng() >= chance) return null;
  const pool = eligibleRoots(s, EVENTS);
  if (!pool.length) return null;
  const urgent = new Set(REGION_ORDER.filter((r) => regionStatus(s, r).status === 'urgent'));
  const e = pickWeighted(rng, pool, (ev) => {
    let w = ev.weight || 1;
    if (s.period - s.regions[ev.region].lastEvent > 2) w *= cfg.quietBoost;
    if (urgent.has(ev.region)) w *= cfg.crisisDamp;
    return w;
  });
  return openProblem(s, e);
}

// ------------------------------------------------------------------ status & summary

export function national(s) {
  const m = (k) => Math.round(REGION_ORDER.reduce((a, r) => a + s.regions[r].ind[k], 0) / REGION_ORDER.length);
  const wb = REGION_ORDER.map((r) => s.regions[r].ind.wellbeing);
  const out = { output: m('output'), wellbeing: m('wellbeing'), access: m('access') };
  out.gap = Math.max(...wb) - Math.min(...wb);
  out.overall = Math.round((out.output + out.wellbeing + out.access) / 3);
  return out;
}

export const regionScore = (ind) => Math.round((ind.output + ind.wellbeing + ind.access) / 3);

export function regionStatus(s, r) {
  const c = context(s);
  const probs = openInRegion(s, r);
  const pressing = probs.filter((p) => p.origin !== 'opportunity');
  const undecided = pressing.filter((p) => !p.chosen);
  const shortages = Object.entries(c.svc[r]).filter(([, x]) => x.status === 'short');
  const low = INDICATORS.some((k) => s.regions[r].ind[k] < 25);
  if (undecided.some((p) => p.severity >= 3 || p.deadline === s.period || p.status === 'escalated') || low) {
    return { status: 'urgent', statusLabel: 'Khẩn cấp' };
  }
  if (undecided.length || shortages.length) return { status: 'attention', statusLabel: 'Cần quan tâm' };
  if (pressing.length) return { status: 'attention', statusLabel: 'Đang xử lý' };
  if (probs.some((p) => p.origin === 'opportunity' && !p.chosen)) return { status: 'opportunity', statusLabel: 'Có cơ hội' };
  return { status: 'stable', statusLabel: 'Ổn định' };
}

export { TOPICS, REGIONS, BUILT };
