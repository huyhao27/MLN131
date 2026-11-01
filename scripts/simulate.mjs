#!/usr/bin/env node
// Headless runner for the sim: plays many sessions with scripted strategies,
// prints the ending distribution and asserts gameplay invariants.
//   npm run sim                 -> all strategies, default seed counts
//   npm run sim -- --runs 50    -> fewer runs per strategy
//   npm run sim -- --verbose    -> print one trace per strategy
import { createGame } from '../src/sim/index.js';
import { validateContent } from '../src/sim/validate.js';
import { resolveChoice, NODES, REPAIR_NODES } from '../src/sim/engine.js';
import { RANDOM_EVENTS, METRIC_KEYS, INITIAL, RULES } from '../src/data/index.js';
import { bus } from '../src/core/bus.js';
import { mulberry32 } from '../src/core/rng.js';

const args = process.argv.slice(2);
const arg = (name) => (args.includes(name) ? args[args.indexOf(name) + 1] : undefined);
const RUNS = Number(arg('--runs')) || 300;
const VERBOSE = args.includes('--verbose');
// Tuning overrides (playtest only): --budget <start BUDGET> --income <base income> --chance <random chance>
if (arg('--budget') !== undefined) INITIAL.resources.BUDGET = Number(arg('--budget'));
if (arg('--income') !== undefined) RULES.income.base = Number(arg('--income'));
if (arg('--chance') !== undefined) RULES.random.chance = Number(arg('--chance'));
const ONLY = arg('--only')?.split(',');

let failures = 0;
const failed = new Map();
function assert(cond, msg) {
  if (cond) return;
  failures++;
  failed.set(msg, (failed.get(msg) || 0) + 1);
}

// ------------------------------------------------------------------ strategies

const CHOICE_PHASES = new Set(['event', 'consequence', 'random', 'finalRepair']);

function choiceData(view, optionId) {
  const node = view.phase === 'finalRepair' ? REPAIR_NODES[view.crisis] : NODES[view.code];
  const baseId = optionId.endsWith('-P') ? optionId.slice(0, -2) : optionId;
  return node?.choices?.find((c) => c.id === baseId);
}

/** Score-based chooser. If the best option is disabled, take its fallback.
 *  weights may be a function (state) -> weights; costPenalty may be a function (state, cost) -> penalty. */
function scorer({ weights = {}, styles = {}, costPenalty = 0, repair = 'REPAIR-A' }) {
  return (view, game) => {
    const enabled = view.options.filter((o) => !o.disabled);
    if (!CHOICE_PHASES.has(view.phase) || enabled.length === 1 && !view.options.some((o) => o.disabled)) return enabled[0].id;
    if (view.phase === 'finalRepair') return (view.options.find((o) => o.id === repair && !o.disabled) || enabled[0]).id;
    const st = game.state;
    const w = typeof weights === 'function' ? weights(st) : weights;
    let best = null, bestScore = -Infinity;
    for (const o of view.options) {
      if (o.fallbackFor) continue;
      const c = choiceData(view, o.id);
      if (!c) continue;
      const r = resolveChoice(c, st);
      let sc = (styles[c.style] || 0) - (typeof costPenalty === 'function' ? costPenalty(st, r) : costPenalty * r.cost);
      for (const [k, d] of Object.entries(r.now)) sc += (w[k] ?? 0) * d;
      if (sc > bestScore) { bestScore = sc; best = o; }
    }
    if (!best) return enabled[0].id;
    if (best.disabled) return (view.options.find((o) => o.fallbackFor === best.id) || enabled[0]).id;
    return best.id;
  };
}

const ALL = Object.fromEntries(METRIC_KEYS.map((k) => [k, 1]));

const STRATEGIES = {
  // Maximise production; prefers the "growth" style.
  growth: scorer({ weights: { PROD: 3, LIFE: 0.2, TRUST: 0.2, LAW: 0.2, EQUITY: 0.2, COHESION: 0.2 }, styles: { growth: 30 } }),
  // Maximise living standards right now; prefers cash / subsidy style.
  welfare: scorer({ weights: { LIFE: 3, EQUITY: 1, TRUST: 0.5 }, styles: { welfare: 30 } }),
  // Order first: surface stability and output, accountability ignored; likes administrative fixes.
  control: scorer({ weights: { COHESION: 2, PROD: 1, LIFE: 0.5 }, styles: { control: 6 } }),
  // Naive reformer: always the participatory / rule-of-law option ("A"), whatever the budget.
  reformer: scorer({ weights: ALL, styles: { balanced: 100 } }),
  // All-round optimiser: values weak metrics more than strong ones and avoids deficits.
  balanced: scorer({
    weights: (s) => Object.fromEntries(METRIC_KEYS.map((k) => {
      const target = k === 'LAW' ? 64 : 59;
      return [k, s.metrics[k] < target ? 1.5 : 0.15];
    })),
    costPenalty: (s, r) => {
      const after = s.resources.BUDGET - r.cost;
      return 0.2 * r.cost + (after < 0 ? 1.2 * -after : 0) + 0.6 * (r.debt || 0) + 0.3 * s.resources.DEBT / 10 * r.cost / 5;
    },
  }),
  // Deliberately drives LAW/TRUST down to trigger the early crisis; refuses the full repair.
  crisis: scorer({ weights: { LAW: -3, TRUST: -3, LIFE: -1, PROD: -1, COHESION: -0.5 }, repair: 'REPAIR-B' }),
  random: null, // uniform among enabled options (set per run)
};

// ------------------------------------------------------------------ invariants

const OPTION_KEYS = new Set(['id', 'key', 'label', 'explanation', 'cost', 'disabled', 'disabledReason', 'fallbackFor']);
const PHASES = new Set(['briefing', 'yearStart', 'consequence', 'event', 'result', 'random', 'randomResult', 'finalRepair', 'end']);

function checkView(v, ctx) {
  assert(PHASES.has(v.phase), `unknown phase ${v.phase}`);
  assert(JSON.stringify(JSON.parse(JSON.stringify(v))) === JSON.stringify(v), 'view not serializable');
  for (const k of METRIC_KEYS) {
    const x = v.metrics[k];
    assert(Number.isInteger(x) && x >= 0 && x <= 100, `metric ${k} out of range (${x}) ${ctx}`);
  }
  const { BUDGET, CAPACITY, DEBT } = v.resources;
  assert(CAPACITY >= 0 && CAPACITY <= 100, `CAPACITY out of range ${ctx}`);
  assert(DEBT >= 0 && DEBT <= 100, `DEBT out of range ${ctx}`);
  assert(BUDGET >= -10, `BUDGET below -10 (${BUDGET}) ${ctx}`);
  assert(typeof v.site === 'string', 'site missing');
  assert(typeof v.randomEvents === 'boolean', `randomEvents flag missing ${ctx}`);
  if (v.phase === 'event') assert(Number.isInteger(v.chapter), `event chapter must be a number ${ctx}`);
  if (v.phase === 'result' || v.phase === 'randomResult') {
    assert(typeof v.code === 'string' && /^[YRC]\d+-/.test(v.code), `result code must be the choice id ${ctx}`);
    assert(Number.isInteger(v.academic?.chapter), `academic.chapter must be a number ${ctx}`);
    assert(v.flagsSet.every((f) => typeof f === 'string' || (f.id && f.removed === true)), `flagsSet shape ${ctx}`);
    assert(v.scheduled.every((x) => Number.isInteger(x.year) && typeof x.text === 'string'), `scheduled shape ${ctx}`);
  }
  if (v.phase === 'finalRepair') assert(v.headline && v.text, `finalRepair text ${ctx}`);
  assert(Array.isArray(v.options) && v.options.length > 0, `no options ${ctx}`);
  assert(v.options.some((o) => !o.disabled), `no enabled option ${ctx}`);
  const keys = v.options.map((o) => o.key);
  assert(new Set(keys).size === keys.length, `duplicate option keys ${ctx}`);
  const ids = v.options.map((o) => o.id);
  assert(new Set(ids).size === ids.length, `duplicate option ids ${ctx}`);

  if (CHOICE_PHASES.has(v.phase)) {
    // Never expose deltas before the choice.
    assert(!('deltas' in v) && !('resourceDeltas' in v), `pre-choice view exposes deltas ${ctx}`);
    for (const o of v.options) {
      for (const k of Object.keys(o)) assert(OPTION_KEYS.has(k), `option field ${k} leaks ${ctx}`);
      if (o.disabled && v.phase !== 'finalRepair') {
        const fb = v.options.find((f) => f.fallbackFor === o.id);
        assert(fb && !fb.disabled, `unaffordable ${o.id} without enabled fallback ${ctx}`);
      }
      if (!o.disabled && typeof o.cost === 'number') {
        assert(v.resources.BUDGET - o.cost >= -10, `enabled ${o.id} not affordable ${ctx}`);
      }
    }
  }
}

function checkEnd(v, s, ctx) {
  assert(v.phase === 'end', `did not reach end ${ctx}`);
  assert(/^E[1-6]$/.test(v.ending?.id), `bad ending ${ctx}`);
  const rs = s.seen.filter((id) => /^R\d/.test(id));
  assert(new Set(rs).size === rs.length, `random event repeated ${ctx}`);
  assert(rs.length <= 3, `more than 3 random events ${ctx}`);
  assert(s.counters.random_events_seen === rs.length, `random counter mismatch ${ctx}`);
  for (let i = 1; i < s.randomLog.length; i++) {
    const a = s.randomLog[i - 1], b = s.randomLog[i];
    assert(!(b.year === a.year + 1 && b.tag === a.tag), `same random tag two years running ${ctx}`);
    assert(b.year !== a.year, `two random events in one year ${ctx}`);
  }
  for (const r of s.randomLog) {
    const def = RANDOM_EVENTS.find((e) => e.id === r.id);
    assert(r.year >= def.years[0] && r.year <= def.years[1], `random ${r.id} outside its years ${ctx}`);
  }
  const cs = s.seen.filter((id) => /^C\d/.test(id));
  const cYears = s.history.filter((h) => h.kind === 'consequence').map((h) => h.year);
  assert(new Set(cYears).size === cYears.length, `more than one C node in a year ${ctx}`);
  assert(new Set(cs).size === cs.length, `C node repeated ${ctx}`);
  if (v.ending.id !== 'E6') {
    for (let y = 1; y <= 8; y++) assert(s.seen.includes(`Y${y}`), `main event Y${y} skipped ${ctx}`);
  }
  assert(Array.isArray(v.turningPoints) && v.turningPoints.length <= 3, `turning points ${ctx}`);
  assert(Array.isArray(v.history) && v.history.length >= 1, `history ${ctx}`);
  assert(Array.isArray(v.delayed) && Array.isArray(v.stakeholders), `report fields ${ctx}`);
  assert(METRIC_KEYS.every((k) => Number.isInteger(v.initialMetrics?.[k])), `initialMetrics ${ctx}`);
  assert(v.turningPoints.every((x) => Number.isInteger(x.year) && x.code && x.label && x.text), `turningPoints shape ${ctx}`);
  assert(v.delayed.every((x) => Number.isInteger(x.fromYear) && Number.isInteger(x.year) && x.text), `delayed shape ${ctx}`);
  assert(v.stakeholders.every((x) => x.id && ['gain', 'loss', 'mixed'].includes(x.tone) && x.text), `stakeholders shape ${ctx}`);
  assert(v.ending.secondary.every((x) => x.id && x.title), `secondary shape ${ctx}`);
  assert(v.history.every((h) => Number.isInteger(h.year) && h.code && 'choiceId' in h && h.label && h.metricsAfter), `history shape ${ctx}`);
  const rInHistory = v.history.filter((h) => /^R/.test(h.code)).length;
  assert(rInHistory === s.randomLog.length, `history must include R entries ${ctx}`);
  assert(s.pending_effects.every((p) => p.due > s.year) || v.ending.id === 'E6', `pending effects left unapplied ${ctx}`);
}

// ------------------------------------------------------------------ runner

function play(strategyName, seed, { randomEvents = true, undoCheck = false, trace = false } = {}) {
  const game = createGame({ seed, randomEvents, emit: false });
  const pickRng = mulberry32(seed * 7919 + 13);
  const pick = STRATEGIES[strategyName] ||
    ((v) => { const en = v.options.filter((o) => !o.disabled); return en[Math.floor(pickRng() * en.length)].id; });
  let v = game.view();
  let steps = 0;
  const ctx = () => `[${strategyName} seed=${seed} y=${v.year} ${v.phase} ${v.code || ''}]`;
  while (v.phase !== 'end' && steps++ < 120) {
    checkView(v, ctx());
    const id = pick(v, game);
    if (trace && CHOICE_PHASES.has(v.phase)) {
      console.log(`  Y${v.year} ${v.code.padEnd(12)} -> ${id.padEnd(9)} B=${v.resources.BUDGET} CAP=${v.resources.CAPACITY} DEBT=${v.resources.DEBT} ${METRIC_KEYS.map((k) => k[0] + k[1] + '=' + v.metrics[k]).join(' ')}`);
    }
    if (undoCheck && pickRng() < 0.3) {
      const before = JSON.stringify(v);
      game.act(id);
      const back = game.undo();
      assert(JSON.stringify(back) === before, `undo did not restore view ${ctx()}`);
    }
    v = game.act(id);
  }
  checkView(v, ctx());
  const s = game.state;
  checkEnd(v, s, ctx());
  if (trace) console.log(`  => ${v.ending.id} ${v.ending.title} | ${METRIC_KEYS.map((k) => k + '=' + v.metrics[k]).join(' ')} DEBT=${v.resources.DEBT}`);
  return { ending: v.ending.id, metrics: v.metrics, resources: v.resources, randoms: s.randomLog.map((r) => r.id), state: s, view: v };
}

// 1. Static content validation.
const contentErrors = validateContent();
for (const e of contentErrors) console.error('content:', e);
assert(contentErrors.length === 0, 'content validation');

// 2. API contract spot checks.
{
  const g = createGame({ seed: 1, emit: false });
  let threw = false;
  try { g.act('nope'); } catch { threw = true; }
  assert(threw, 'act() with invalid id must throw');
  assert(g.view().phase === 'briefing', 'first view is briefing');
  // Bus emission.
  const seen = { view: 0, state: 0 };
  const off1 = bus.on('sim:view', () => seen.view++);
  const off2 = bus.on('sim:state', () => seen.state++);
  const g2 = createGame({ seed: 3 });
  g2.act('start');
  g2.act('continue');
  off1(); off2();
  assert(seen.view === 2, 'sim:view emitted per act');
  assert(seen.state >= 1, 'sim:state emitted when numbers change');
  // Determinism.
  const a = play('random', 4242), b = play('random', 4242);
  assert(JSON.stringify(a.view) === JSON.stringify(b.view), 'same seed must replay identically');
  // Random-event toggle.
  const gt = createGame({ seed: 5, emit: false });
  assert(gt.setRandomEvents(false) === false && gt.view().randomEvents === false, 'setRandomEvents(false)');
  assert(gt.toggleRandomEvents() === true && gt.view().randomEvents === true, 'toggleRandomEvents()');
  // Restart.
  const g3 = createGame({ seed: 9, emit: false });
  let v = g3.view();
  while (v.phase !== 'end') v = g3.act(v.options.find((o) => !o.disabled).id);
  v = g3.act('restart');
  assert(v.phase === 'briefing' && v.year === 1, 'restart returns to briefing');
}

// 3. Strategies over many seeds.
const results = {};
for (const name of Object.keys(STRATEGIES).filter((n) => !ONLY || ONLY.includes(n))) {
  const runs = name === 'random' ? RUNS * 3 : RUNS;
  const dist = {};
  const rcount = {};
  let sumRandoms = 0;
  const avg = Object.fromEntries([...METRIC_KEYS, 'DEBT'].map((k) => [k, 0]));
  if (VERBOSE) {
    console.log(`\n--- trace: ${name} (seed 2026)`);
    play(name, 2026, { trace: true });
  }
  for (let i = 0; i < runs; i++) {
    const seed = 1000 + i * 17;
    const r = play(name, seed, { undoCheck: i % 10 === 0, randomEvents: i % 25 !== 24 });
    dist[r.ending] = (dist[r.ending] || 0) + 1;
    for (const id of r.randoms) rcount[id] = (rcount[id] || 0) + 1;
    sumRandoms += r.randoms.length;
    for (const k of METRIC_KEYS) avg[k] += r.metrics[k] / runs;
    avg.DEBT += r.resources.DEBT / runs;
  }
  results[name] = { runs, dist, rcount, avgRandoms: sumRandoms / runs, avg };
}

// ------------------------------------------------------------------ report

const pct = (n, d) => `${((100 * (n || 0)) / d).toFixed(0)}%`.padStart(5);
console.log('\nEnding distribution per strategy (E1 nền tảng, E2 lệch pha, E3 phúc lợi thiếu bền vững, E4 ổn định hình thức, E5 dang dở, E6 đứt gãy)');
console.log('strategy   runs |   E1    E2    E3    E4    E5    E6 | rnd/run | avg PROD LIFE TRUST LAW EQ COH DEBT');
for (const [name, r] of Object.entries(results)) {
  const row = ['E1', 'E2', 'E3', 'E4', 'E5', 'E6'].map((e) => pct(r.dist[e], r.runs)).join(' ');
  const a = r.avg;
  console.log(
    `${name.padEnd(10)} ${String(r.runs).padStart(4)} | ${row} | ${r.avgRandoms.toFixed(2).padStart(7)} |     ` +
      [a.PROD, a.LIFE, a.TRUST, a.LAW, a.EQUITY, a.COHESION, a.DEBT].map((x) => x.toFixed(0).padStart(4)).join(' '),
  );
}
const allR = {};
for (const r of Object.values(results)) for (const [k, n] of Object.entries(r.rcount)) allR[k] = (allR[k] || 0) + n;
console.log('\nRandom events drawn (all runs):', Object.keys(allR).sort().map((k) => `${k}=${allR[k]}`).join(' '));

if (ONLY) process.exit(failures ? 1 : 0);
// Design targets (GDD §12 "kiểm thử bắt buộc"): strategies should diverge, E1 reachable but not trivial.
const top = (name) => Object.entries(results[name].dist).sort((a, b) => b[1] - a[1])[0][0];
const share = (name, e) => (results[name].dist[e] || 0) / results[name].runs;
assert(share('crisis', 'E6') > 0.5, 'crisis-on-purpose should mostly end in E6');
assert(share('balanced', 'E1') > 0, 'E1 must be reachable by the balanced strategy');
assert(share('random', 'E1') < 0.25, 'E1 must not be trivial for random play');
assert(new Set(['growth', 'welfare', 'control', 'balanced', 'crisis'].map(top)).size >= 4, 'strategies should reach different endings');
const everEnding = new Set(Object.values(results).flatMap((r) => Object.keys(r.dist)));
for (const e of ['E1', 'E2', 'E3', 'E4', 'E5', 'E6']) assert(everEnding.has(e), `ending ${e} never reached by any strategy`);
for (const r of RANDOM_EVENTS) assert(allR[r.id] > 0, `random event ${r.id} never drawn`);

if (failures) {
  console.error(`\nFAILED: ${failures} assertion failures`);
  for (const [m, n] of failed) console.error(`  ${n}x ${m}`);
  process.exit(1);
}
console.log('\nAll invariants hold.');
