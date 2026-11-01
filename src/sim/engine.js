// Pure state machine for The Transition. Every function takes the mutable sim
// state `s` (plain JSON object) and mutates it; no DOM, no three, no globals.
import { mulberry32, fnv1a } from '../core/rng.js';
import {
  INITIAL, RULES, METRIC_KEYS, METRIC_LABELS,
  MAIN_EVENTS, CONSEQUENCES, RANDOM_EVENTS, FINAL_REPAIR,
} from '../data/index.js';
import { check } from './cond.js';

export const MAIN_BY_YEAR = Object.fromEntries(MAIN_EVENTS.map((n) => [n.year, n]));
export const NODES = Object.fromEntries([...MAIN_EVENTS, ...CONSEQUENCES, ...RANDOM_EVENTS].map((n) => [n.id, n]));

export const REPAIR_NODES = {
  institutional: { id: 'FINAL_REPAIR', kind: 'repair', site: 'overview', noAutoFallback: true, ...FINAL_REPAIR.institutional },
  livelihood: { id: 'FINAL_REPAIR', kind: 'repair', site: 'overview', noAutoFallback: true, ...FINAL_REPAIR.livelihood },
};

const clamp = (v, lo, hi) => (v < lo ? lo : v > hi ? hi : v);
const FALLBACK_SUFFIX = '-P';

export function nodeFor(s) {
  if (s.phase === 'finalRepair') return REPAIR_NODES[s.crisis];
  return s.node ? NODES[s.node] : null;
}

// ------------------------------------------------------------------ state

export function initialState(seed, randomEvents) {
  return {
    year: 1,
    phase: 'briefing',
    metrics: { ...INITIAL.metrics },
    resources: { ...INITIAL.resources },
    flags: [],
    counters: { latent_discontent: 0, consecutive_budget_deficit: 0, random_events_seen: 0, crisis_streak: 0 },
    pending_effects: [],
    history: [],
    random_seed: seed,
    settings: { randomEvents: !!randomEvents },
    // internals
    node: null,
    seen: [],
    yearInfo: null,
    presentApplied: [],
    lastResult: null,
    interactiveCYear: 0,
    randomLog: [],
    delayedLog: [],
    timeline: [{ year: 0, metrics: { ...INITIAL.metrics }, resources: { ...INITIAL.resources } }],
    crisis: null,
    repairUsed: false,
    endReason: null,
  };
}

// ------------------------------------------------------------------ effects

function addFlag(s, f) {
  if (!s.flags.includes(f)) s.flags.push(f);
}
function removeFlag(s, f) {
  s.flags = s.flags.filter((x) => x !== f);
}

/** Apply a raw effect map ({PROD:+n, BUDGET:-n, CAPACITY, DEBT}) with clamping; returns actual change. */
export function applyRaw(s, effects = {}) {
  const out = {};
  for (const [k, d] of Object.entries(effects)) {
    if (!d) continue;
    let before, after;
    if (k in s.metrics) {
      before = s.metrics[k];
      after = s.metrics[k] = clamp(before + d, 0, 100);
    } else if (k === 'BUDGET') {
      before = s.resources.BUDGET;
      after = s.resources.BUDGET = before + d;
    } else if (k === 'CAPACITY' || k === 'DEBT') {
      before = s.resources[k];
      after = s.resources[k] = clamp(before + d, 0, 100);
    } else {
      throw new Error(`unknown effect key ${k}`);
    }
    if (after !== before) out[k] = after - before;
  }
  return out;
}

/** Choice after flag-based variant modifiers. Pure. */
export function resolveChoice(choice, s) {
  const r = {
    cost: choice.cost || 0,
    now: { ...(choice.now || {}) },
    cap: choice.cap || 0,
    debt: choice.debt || 0,
    discontent: choice.discontent || 0,
    setFlags: [...(choice.setFlags || [])],
    clearFlags: [...(choice.clearFlags || [])],
    notes: [],
  };
  for (const m of choice.mods || []) {
    if (!check(m.if, s)) continue;
    r.cost += m.cost || 0;
    for (const [k, d] of Object.entries(m.now || {})) r.now[k] = (r.now[k] || 0) + d;
    r.cap += m.cap || 0;
    r.debt += m.debt || 0;
    r.discontent += m.discontent || 0;
    r.setFlags.push(...(m.setFlags || []));
    r.clearFlags.push(...(m.clearFlags || []));
    if (m.note) r.notes.push(m.note);
  }
  r.cost = Math.max(0, r.cost);
  return r;
}

export const affordable = (s, cost) => s.resources.BUDGET - cost >= RULES.minBalance;

export function fallbackCost(s, fullCost) {
  return Math.max(0, Math.min(Math.ceil(fullCost * RULES.fallbackCostFactor), s.resources.BUDGET - RULES.minBalance));
}

export function splitOptionId(optionId) {
  return optionId.endsWith(FALLBACK_SUFFIX)
    ? { baseId: optionId.slice(0, -FALLBACK_SUFFIX.length), fallback: true }
    : { baseId: optionId, fallback: false };
}

/** Option list for a choice node (no deltas, ever). Pure. */
export function buildChoiceOptions(node, s) {
  const opts = [];
  const fallbacks = [];
  for (const choice of node.choices) {
    const r = resolveChoice(choice, s);
    const opt = {
      id: choice.id,
      key: String(opts.length + 1),
      label: choice.title,
      explanation: [choice.explanation, ...r.notes].filter(Boolean).join(' '),
      cost: r.cost,
    };
    if (!affordable(s, r.cost)) {
      opt.disabled = true;
      opt.disabledReason = `Không đủ ngân sách: cần ${r.cost}, chỉ có thể chi tối đa ${s.resources.BUDGET - RULES.minBalance}.`;
      if (!node.noAutoFallback) {
        fallbacks.push({
          id: choice.id + FALLBACK_SUFFIX,
          label: `Thí điểm / phân kỳ: ${choice.title}`,
          explanation: 'Triển khai thu hẹp trong phạm vi ngân sách: chi phí thấp hơn, kết quả tích cực cũng hạn chế hơn; rủi ro đi kèm vẫn giữ nguyên.',
          cost: fallbackCost(s, r.cost),
          fallbackFor: choice.id,
        });
      }
    }
    opts.push(opt);
  }
  for (const f of fallbacks) opts.push({ ...f, key: String(opts.length + 1) });
  return opts;
}

/** Apply a chosen option of a choice node. Returns the result record. */
export function applyChoice(s, node, optionId) {
  const { baseId, fallback } = splitOptionId(optionId);
  const choice = node.choices.find((c) => c.id === baseId);
  if (!choice) throw new Error(`unknown choice ${optionId} in ${node.id}`);
  const r = resolveChoice(choice, s);
  const cost = fallback ? fallbackCost(s, r.cost) : r.cost;
  const capacityCut = !!choice.complex && s.resources.CAPACITY < RULES.lowCapacity;
  const posFactor = (fallback ? RULES.fallbackEffectFactor : 1) * (capacityCut ? RULES.lowCapacityFactor : 1);
  const scalePos = (d) => (d > 0 ? Math.trunc(d * posFactor) : d);

  const metricEff = {};
  for (const [k, d] of Object.entries(r.now)) metricEff[k] = scalePos(d);
  const deltas = applyRaw(s, metricEff);
  const resourceDeltas = applyRaw(s, { BUDGET: -cost, CAPACITY: scalePos(r.cap), DEBT: r.debt });
  if (!('BUDGET' in resourceDeltas)) resourceDeltas.BUDGET = 0;

  if (r.discontent) {
    s.counters.latent_discontent = Math.max(0, s.counters.latent_discontent + r.discontent);
  }
  const flagsSet = [];
  for (const f of r.clearFlags) removeFlag(s, f);
  for (const f of r.setFlags) {
    if (!s.flags.includes(f)) flagsSet.push(f);
    addFlag(s, f);
  }

  const scheduled = [];
  for (const p of choice.pending || []) {
    const due = p.due ?? s.year + (p.in || 1);
    const effects = {};
    for (const [k, d] of Object.entries(p.effects)) {
      // DEBT/BUDGET-negative are costs, not benefits; only scale beneficial metric/capacity effects.
      effects[k] = k === 'DEBT' || k === 'BUDGET' ? d : fallback ? scalePosFallback(d) : d;
    }
    s.pending_effects.push({ due, if: p.if || '', effects, text: p.text, source: optionId, code: node.id, from: s.year });
    scheduled.push({ year: due, text: p.text, conditional: !!p.if });
  }

  const entry = {
    year: s.year,
    code: node.id,
    kind: node.kind,
    choiceId: optionId,
    baseChoiceId: baseId,
    label: choice.title,
    fallback,
    deltas,
    resourceDeltas,
    winners: choice.winners || [],
    losers: choice.losers || [],
    metricsAfter: { ...s.metrics },
    resourcesAfter: { ...s.resources },
  };
  s.history.push(entry);

  return {
    code: node.id,
    headline: node.headline,
    choiceId: optionId,
    choiceLabel: fallback ? `Thí điểm / phân kỳ: ${choice.title}` : choice.title,
    outcome: choice.outcome || '',
    notes: r.notes,
    deltas,
    resourceDeltas,
    flagsSet,
    flagsCleared: r.clearFlags.filter((f) => !s.flags.includes(f)),
    scheduled,
    winners: entry.winners,
    losers: entry.losers,
    academic: node.academic || null,
    capacityCut,
    fallback,
  };
}

function scalePosFallback(d) {
  return d > 0 ? Math.trunc(d * RULES.fallbackEffectFactor) : d;
}

// ------------------------------------------------------------------ year cycle

export function income(s) {
  const { base, prodPivot, prodStep, debtStep, min } = RULES.income;
  return Math.max(
    min,
    base + Math.floor((s.metrics.PROD - prodPivot) / prodStep) - Math.ceil(s.resources.DEBT / debtStep),
  );
}

export function enterYearStart(s) {
  s.phase = 'yearStart';
  s.node = null;
  s.lastResult = null;
  s.presentApplied = [];
  const applied = [];

  const due = s.pending_effects.filter((p) => p.due <= s.year);
  s.pending_effects = s.pending_effects.filter((p) => p.due > s.year);
  for (const p of due) {
    if (!check(p.if, s)) {
      s.delayedLog.push({ year: s.year, source: p.source, code: p.code, text: p.text, deltas: {}, triggered: false });
      continue;
    }
    const deltas = applyRaw(s, p.effects);
    applied.push({ source: p.source, text: p.text, deltas });
    s.delayedLog.push({ year: s.year, from: p.from, source: p.source, code: p.code, text: p.text, deltas, triggered: true });
  }

  const gain = income(s);
  s.resources.BUDGET += gain;

  if (s.counters.consecutive_budget_deficit >= 2) {
    const deltas = applyRaw(s, RULES.deficitPenalty);
    applied.push({
      source: 'DEFICIT',
      text: 'Ngân sách thâm hụt hai năm liên tiếp: dịch vụ công bị cắt giảm, người dân mất kiên nhẫn.',
      deltas,
    });
  }
  s.yearInfo = { budgetGain: gain, applied };
}

export function pickConsequence(s) {
  const cands = CONSEQUENCES.filter((c) => c.year === s.year && !s.seen.includes(c.id) && check(c.trigger, s));
  if (!cands.length) return null;
  cands.sort((a, b) => (b.priority || 0) - (a.priority || 0));
  return cands[0]; // max one C node per year
}

export function enterConsequence(s, c) {
  s.phase = 'consequence';
  s.node = c.id;
  s.seen.push(c.id);
  s.presentApplied = [];
  if (c.choices && c.choices.length) {
    s.interactiveCYear = s.year;
    return;
  }
  for (const info of c.info || []) {
    if (!check(info.if, s)) continue;
    const deltas = applyRaw(s, info.effects);
    for (const f of info.setFlags || []) addFlag(s, f);
    s.presentApplied.push({ source: c.id, text: info.text, deltas });
  }
  s.history.push({
    year: s.year, code: c.id, kind: 'consequence', choiceId: null, baseChoiceId: null,
    label: c.headline, deltas: mergeDeltas(s.presentApplied.map((a) => a.deltas)), resourceDeltas: {},
    winners: [], losers: [], metricsAfter: { ...s.metrics }, resourcesAfter: { ...s.resources },
  });
}

function mergeDeltas(list) {
  const out = {};
  for (const d of list) for (const [k, v] of Object.entries(d)) out[k] = (out[k] || 0) + v;
  return out;
}

export function enterEvent(s, carried = []) {
  const node = MAIN_BY_YEAR[s.year];
  s.phase = 'event';
  s.node = node.id;
  s.seen.push(node.id);
  s.presentApplied = [...carried];
  for (const pre of node.onPresent || []) {
    if (!check(pre.if, s)) continue;
    const deltas = applyRaw(s, pre.effects);
    s.presentApplied.push({ source: node.id, text: pre.text, deltas });
  }
}

/** Seeded, state-dependent draw: same seed + same state -> same result (never rerolls). */
export function drawRandom(s) {
  const cfg = RULES.random;
  if (!s.settings.randomEvents) return null;
  if (s.counters.random_events_seen >= cfg.maxPerSession) return null;
  if (s.year < cfg.firstYear) return null;
  if (s.interactiveCYear === s.year) return null; // a C node already used this year's extra screen
  const lastTag = s.randomLog.find((r) => r.year === s.year - 1)?.tag;
  const eligible = RANDOM_EVENTS.filter(
    (r) =>
      !s.seen.includes(r.id) &&
      s.year >= r.years[0] &&
      s.year <= r.years[1] &&
      r.tag !== lastTag &&
      check(r.precondition, s),
  );
  if (!eligible.length) return null;
  const illustrative = eligible.filter((r) => r.illustrates && check(r.illustrates, s));
  const pool = illustrative.length ? illustrative : eligible;
  const chance = illustrative.length ? cfg.consequenceChance : cfg.chance;

  const seed = typeof s.random_seed === 'string' ? fnv1a(s.random_seed) : s.random_seed >>> 0;
  const rng = mulberry32((seed ^ Math.imul(s.year + 1, 0x9e3779b1)) >>> 0);
  if (rng() >= chance) return null;
  const weights = pool.map((r) => {
    let w = r.weight;
    for (const m of r.weightMods || []) if (check(m.if, s)) w *= m.mul;
    return w;
  });
  const total = weights.reduce((a, b) => a + b, 0);
  let x = rng() * total;
  for (let i = 0; i < pool.length; i++) {
    x -= weights[i];
    if (x < 0) return pool[i];
  }
  return pool[pool.length - 1];
}

export function enterRandom(s, r) {
  s.phase = 'random';
  s.node = r.id;
  s.seen.push(r.id);
  s.counters.random_events_seen++;
  s.randomLog.push({ year: s.year, id: r.id, tag: r.tag });
}

export function crisisType(s, margin = 0) {
  const { institutional: I, livelihood: L } = RULES.crisis;
  const m = s.metrics;
  if (m.LAW <= I.LAW + margin && m.TRUST <= I.TRUST + margin) return 'institutional';
  if (m.LIFE <= L.LIFE + margin && m.PROD <= L.PROD + margin) return 'livelihood';
  return null;
}

/** End-of-year bookkeeping. Returns 'next' | 'repair' | 'end'. */
export function endYear(s) {
  const B = s.resources.BUDGET;
  if (B < 0) {
    applyRaw(s, { DEBT: -B * RULES.deficitDebtFactor });
    s.resources.BUDGET = 0;
    s.counters.consecutive_budget_deficit++;
  } else {
    s.counters.consecutive_budget_deficit = 0;
  }
  s.timeline.push({ year: s.year, metrics: { ...s.metrics }, resources: { ...s.resources } });

  const type = crisisType(s);
  s.counters.crisis_streak = type ? s.counters.crisis_streak + 1 : 0;
  if (s.counters.crisis_streak >= 2) {
    if (!s.repairUsed) {
      s.crisis = type;
      s.phase = 'finalRepair';
      s.node = 'FINAL_REPAIR';
      return 'repair';
    }
    s.endReason = 'crisis';
    return 'end';
  }
  return s.year >= RULES.years ? 'end' : 'next';
}

/** After FINAL_REPAIR: resolved only if out of the crisis zone by the recovery margin. */
export function repairResolved(s) {
  return crisisType(s, RULES.crisis.recoveryMargin) !== s.crisis;
}

export function warningFor(s) {
  const m = s.metrics, r = s.resources, c = s.counters;
  if (c.crisis_streak >= 1) {
    return 'Nguy cơ khủng hoảng: nếu tình trạng này kéo dài thêm một năm, Hội đồng chỉ còn một cơ hội cứu vãn.';
  }
  if (r.CAPACITY < RULES.lowCapacity) return 'Năng lực thực thi thấp: tác động tích cực của các chính sách phức tạp bị giảm mạnh.';
  if (c.consecutive_budget_deficit >= 1) return 'Năm trước ngân sách thâm hụt: thêm một năm âm sẽ ảnh hưởng đời sống và niềm tin.';
  if (r.DEBT >= 60) return 'Áp lực nợ cao: nguồn thu hằng năm đang bị bào mòn.';
  const low = METRIC_KEYS.filter((k) => m[k] <= 25);
  if (low.length) return `${METRIC_LABELS[low[0]]} đang ở mức rất thấp.`;
  if (c.latent_discontent >= 2) return 'Bất mãn âm ỉ trong lực lượng lao động chưa được giải quyết.';
  return null;
}
