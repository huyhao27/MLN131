#!/usr/bin/env node
// Headless runner for the region mode (doc 05 §12): plays many seeds with scripted
// strategies, checks the rule invariants and prints pacing / balance numbers.
//   npm run sim:regions                 -> all strategies
//   npm run sim:regions -- --runs 50 --verbose
import { createRegionGame } from '../src/regions/index.js';
import { initialState, beginPeriod, endPeriod, choose, openProblem, computeServices, ROOT_EVENTS, EVENT_BY_ID } from '../src/regions/engine.js';
import { businessChallenge, evaluateBusiness, PORTRAIT_COUNT } from '../src/regions/challenges.js';
import { CONFIG, REGION_ORDER } from '../src/regions/data/config.js';
import { EVENTS } from '../src/regions/data/events.js';
import { mulberry32 } from '../src/core/rng.js';

const args = process.argv.slice(2);
const arg = (k) => (args.includes(k) ? args[args.indexOf(k) + 1] : undefined);
const RUNS = Number(arg('--runs')) || 200;
const VERBOSE = args.includes('--verbose');
const ONLY = arg('--only')?.split(',');

let failures = 0;
const failed = new Map();
function assert(cond, msg) {
  if (cond) return;
  failures++;
  failed.set(msg, (failed.get(msg) || 0) + 1);
}

// ------------------------------------------------------------------ strategies
// A strategy returns the list of {problem, option} to take this period (in order).

const enabled = (p) => p.options.filter((o) => !o.disabled);
const pressing = (v) => v.problems.filter((p) => !p.chosen && p.origin !== 'opportunity');
const opps = (v) => v.problems.filter((p) => !p.chosen && p.origin === 'opportunity');

const STRATEGIES = {
  // Never decides anything: everything expires or recovers on its own.
  wait: () => [],
  // Always the cheapest option on every problem and opportunity.
  cheap: (v) => [...pressing(v), ...opps(v)].map((p) => {
    const o = enabled(p).sort((a, b) => a.cost - b.cost)[0];
    return o && { problem: p.instanceId, option: o.id };
  }),
  // Prefers lasting projects when a slot is free, otherwise the cheapest fix.
  builder: (v) => [...pressing(v), ...opps(v)].map((p) => {
    const en = enabled(p);
    const o = en.find((x) => x.project) || en.sort((a, b) => a.cost - b.cost)[0];
    return o && { problem: p.instanceId, option: o.id };
  }),
  // Handles urgent problems first, keeps a reserve, takes cheap opportunities.
  manager: (v) => {
    const out = [];
    let budget = v.budget;
    const order = pressing(v).sort((a, b) => (b.deadlineText === 'Hạn chót kỳ này') - (a.deadlineText === 'Hạn chót kỳ này') || b.severity - a.severity);
    for (const p of order) {
      const en = enabled(p).filter((o) => o.cost <= budget);
      if (!en.length) continue;
      // Mid-priced option: avoid the cheapest shortcut and the most expensive one when short of money.
      const sorted = en.sort((a, b) => a.cost - b.cost);
      const o = budget >= 14 ? (sorted.find((x) => x.project) || sorted[Math.min(1, sorted.length - 1)]) : sorted[Math.min(1, sorted.length - 1)];
      out.push({ problem: p.instanceId, option: o.id });
      budget -= o.cost;
    }
    for (const p of opps(v)) {
      const o = enabled(p).filter((x) => x.cost <= budget - 4).sort((a, b) => a.cost - b.cost)[0];
      if (o) { out.push({ problem: p.instanceId, option: o.id }); budget -= o.cost; }
    }
    return out;
  },
  random: null, // uniform among enabled options or waiting (set per run)
  // One-period look-ahead (tries each option, ends the period, undoes): a skill ceiling.
  lookahead: 'lookahead',
};

const score = (v) => v.national.overall * 2 - Math.max(0, v.national.gap - 12) * 0.5 + v.budget * 0.05;
function lookaheadPicks(g, v) {
  const out = [];
  for (let guard = 0; guard < 6; guard++) {
    const cur = g.view();
    const todo = cur.problems.filter((p) => !p.chosen && p.options.some((o) => !o.disabled));
    if (!todo.length) break;
    const p = todo[0];
    g.act({ type: 'endPeriod' });
    let best = { id: null, sc: score(g.view()) };
    g.undo();
    for (const o of p.options.filter((x) => !x.disabled)) {
      g.act({ type: 'choose', problem: p.instanceId, option: o.id });
      g.act({ type: 'endPeriod' });
      const sc = score(g.view());
      g.undo(); g.undo();
      if (sc > best.sc + 0.01) best = { id: o.id, sc };
    }
    if (!best.id) break;
    g.act({ type: 'choose', problem: p.instanceId, option: best.id });
    out.push(1);
  }
  return out;
}

// ------------------------------------------------------------------ invariants

function checkView(v, ctx) {
  assert(v.mode === 'regions', `mode ${ctx}`);
  assert(JSON.stringify(JSON.parse(JSON.stringify(v))) === JSON.stringify(v), `view not serializable ${ctx}`);
  assert(v.regions.length === 6, `6 regions ${ctx}`);
  for (const r of v.regions) {
    for (const k of ['output', 'wellbeing', 'access']) {
      const x = r.indicators[k];
      assert(Number.isInteger(x) && x >= 0 && x <= 100, `indicator ${r.id}.${k}=${x} ${ctx}`);
    }
    assert(['stable', 'opportunity', 'attention', 'urgent'].includes(r.status), `status ${ctx}`);
    assert(typeof r.line === 'string' && r.line.length > 0, `line ${ctx}`);
  }
  assert(v.slots.used <= v.slots.max, `project slots exceeded ${ctx}`);
  assert(v.budget >= 0, `budget negative (${v.budget}) ${ctx}`);
  const ids = new Set();
  for (const p of v.problems) {
    assert(!ids.has(p.instanceId), `duplicate problem id ${ctx}`);
    ids.add(p.instanceId);
    assert(p.options.length >= 2 && p.options.length <= 3, `2–3 options ${p.code} ${ctx}`);
    assert(p.title && p.text, `problem text ${p.code} ${ctx}`);
    if (!p.chosen && p.origin !== 'opportunity') {
      // doc 05 §12: at least one feasible response, even on a low budget (waiting counts only with a preview).
      assert(p.options.some((o) => !o.disabled) || p.wait, `no feasible response ${p.code} ${ctx}`);
    }
    for (const o of p.options) assert(typeof o.cost === 'number' && o.preview, `option shape ${p.code}-${o.id} ${ctx}`);
  }
  // No duplicate open problem of the same family in the same region.
  const fam = v.problems.map((p) => `${EVENT_BY_ID[p.rootId].family}:${p.region}`);
  assert(new Set(fam).size === fam.length, `duplicate family open ${ctx}`);
  for (const r of REGION_ORDER) {
    const roots = v.problems.filter((p) => p.region === r && p.origin !== 'consequence').length;
    assert(roots <= CONFIG.draw.perRegion, `more than ${CONFIG.draw.perRegion} root items in ${r} ${ctx}`);
  }
}

// ------------------------------------------------------------------ runner

function play(name, seed, { trace = false } = {}) {
  const g = createRegionGame({ seed, emit: false });
  const rng = mulberry32(seed * 7919 + 3);
  let v = g.act({ type: 'start' });
  const stats = { attention: [], open: [], roots: 0, cons: 0, opps: 0, big: 0, small: 0, decisions: 0, minBudget: 99, maxBudget: 0, shortages: 0 };
  let guard = 0;
  while (v.phase !== 'end' && guard++ < 40) {
    const ctx = `[${name} seed=${seed} k=${v.period}]`;
    checkView(v, ctx);
    stats.attention.push(v.regions.filter((r) => r.status === 'attention' || r.status === 'urgent').length);
    stats.open.push(v.problems.length);
    stats.minBudget = Math.min(stats.minBudget, v.budget);
    stats.maxBudget = Math.max(stats.maxBudget, v.budget);
    if (name === 'lookahead') {
      stats.decisions += lookaheadPicks(g, v).length;
      v = g.view();
    }
    const picks = name === 'lookahead' ? [] : name === 'random'
      ? v.problems.filter((p) => !p.chosen).map((p) => {
        const en = enabled(p);
        const i = Math.floor(rng() * (en.length + 1));
        return i < en.length ? { problem: p.instanceId, option: en[i].id } : null;
      })
      : STRATEGIES[name](v);
    for (const a of picks.filter(Boolean)) {
      const p = v.problems.find((x) => x.instanceId === a.problem);
      const o = p?.options.find((x) => x.id === a.option);
      if (!p || p.chosen || !o || o.disabled) continue;
      if (trace) console.log(`   k${v.period} ${p.region} ${p.code.padEnd(4)} ${p.title.padEnd(40)} -> ${o.id} ${o.label} (${o.cost})`);
      v = g.act({ type: 'choose', problem: a.problem, option: a.option });
      stats.decisions++;
    }
    if (trace) {
      console.log(`  k${v.period} budget=${v.budget} next=${v.incomeNext} nat=${JSON.stringify(v.national)}`);
      for (const n of v.news.filter((x) => x.period === v.period && x.chain)) console.log(`     ${n.text}`);
    }
    v = g.act({ type: 'endPeriod' });
  }
  assert(v.phase === 'end', `did not reach end [${name} ${seed}]`);
  const s = g.state;
  for (const p of s.problems) {
    const def = EVENT_BY_ID[p.rootId];
    if (p.origin === 'consequence') stats.cons++;
    else if (p.origin === 'opportunity') stats.opps++;
    else if (def.severity >= 2) stats.big++;
    else stats.small++;
    if (p.origin !== 'consequence') stats.roots++;
  }
  stats.shortages = s.shortageLog.length;
  // doc 05 §12 rules on the final state.
  const depthOk = s.problems.every((p) => p.depth <= CONFIG.maxDepth);
  assert(depthOk, `problem deeper than ${CONFIG.maxDepth} [${name} ${seed}]`);
  const sum = v.summary;
  assert(sum && sum.headline && sum.chains.length >= 1 && sum.topics.length === 8, `summary [${name} ${seed}]`);
  assert(sum.timeline.length === CONFIG.periods + 1, `timeline length [${name} ${seed}]`);
  if (trace) console.log(`  => ${sum.headline} | overall ${v.national.overall} gap ${v.national.gap}`);
  return { v, s, stats };
}

// ------------------------------------------------------------------ rule tests (doc 05 §12)

function solveBusiness(challenge) {
  if (challenge.kind === 'cake') return [[1, 0], [-1, 0]];
  if (challenge.kind === 'thief') return challenge.suspects.find(p => evaluateBusiness(challenge, p.id)?.solved)?.id;
  const queue = [{ tile: challenge.start, visited: 0, path: [] }];
  const seen = new Set();
  for (const { tile, visited, path } of queue) {
    const size = challenge.size;
    for (const next of [tile - 1, tile + 1, tile - size, tile + size]) {
      const distance = Math.abs(tile % size - next % size) + Math.abs(Math.floor(tile / size) - Math.floor(next / size));
      if (distance !== 1 || next < 0 || next >= size ** 2 || challenge.blocked.includes(next)) continue;
      const progress = visited + Number(next === challenge.checkpoints[visited]);
      const key = next + ':' + progress;
      if (seen.has(key)) continue;
      const moves = [...path, next];
      if (next === challenge.goal && progress === challenge.checkpoints.length) return moves;
      seen.add(key);
      queue.push({ tile: next, visited: progress, path: moves });
    }
  }
  return null;
}

function ruleTests() {
  assert(ROOT_EVENTS.length >= 3 * 28, 'root catalogue has tripled');
  // Same local breakdown, different decisions: only transferring or ignoring it
  // creates the linked job, and it changes the recipient's actual supply.
  {
    const outcomes = {};
    for (const choice of ['A', 'B', 'wait']) {
      const s = initialState(4242);
      s.phase = 'period'; s.period = 3;
      const root = openProblem(s, EVENT_BY_ID.RV40); // spoiled vegetables, reduced food supply
      if (choice !== 'wait') choose(s, root.instanceId, choice);
      endPeriod(s);
      const linked = s.problems.find(p => p.rootId === 'LV40');
      outcomes[choice] = computeServices(s).svc.DC.food.have;
      assert(!!linked === (choice !== 'A'), `RV40 ${choice} determines if a linked job appears`);
      if (linked) {
        assert(linked.region === 'DC' && linked.parent === root.instanceId && linked.causes.includes(EVENT_BY_ID.RV40.title), 'linked job has the actual parent and destination');
        if (choice === 'B') {
          choose(s, linked.instanceId, 'A');
          assert(computeServices(s).svc.DC.food.have > outcomes.B, 'resolving the linked job restores food supply');
        }
      }
    }
    assert(outcomes.A > outcomes.B && outcomes.A > outcomes.wait, 'linked job lowers food available in the affected region');
  }
  for (let seed = 1; seed <= 100; seed++) {
    const portraits = new Set();
    const g = createRegionGame({ seed, emit: false });
    let v = g.act({ type: 'start' });
    for (let period = 1; period <= CONFIG.periods; period++) {
      const { challenge } = v.business;
      assert(challenge.kind === ['thief', 'route', 'cake'][(period - 1) % 3], 'fixed rotation');
      const submission = solveBusiness(challenge);
      assert(evaluateBusiness(challenge, submission)?.solved, 'each challenge has a legal solution');
      if (challenge.kind === 'route') {
        assert(submission.length === challenge.limit, 'route budget equals the shortest route with ordered checkpoints');
        assert(evaluateBusiness(challenge, submission).visited === 2, 'both route checkpoints are required');
      }
      if (challenge.kind === 'thief') {
        assert(challenge.suspects.length === 12 && challenge.clues.length === 5, 'full deduction board');
        for (const [i] of challenge.clues.entries()) {
          assert(challenge.suspects.filter(p => challenge.clues.every(({ allowed }, j) =>
            i === j || allowed.includes(p.evidence[j]))).length >= 2, 'every clue is needed to eliminate a decoy');
        }
        const matches = challenge.suspects.filter(p => evaluateBusiness(challenge, p.id)?.solved);
        assert(matches.length === 1, 'exactly one suspect matches the evidence');
        for (const { portrait } of challenge.suspects) {
          assert(portrait >= 0 && portrait < PORTRAIT_COUNT && !portraits.has(portrait), 'unique campaign portraits');
          portraits.add(portrait);
        }
      }
      const budget = v.budget;
      g.act({ type: 'businessStart', period });
      const interrupted = createRegionGame({ seed, savedState: g.state, emit: false });
      assert(interrupted.view().business.status === 'lost', 'reload consumes an interrupted attempt');
      const won = g.act({ type: 'businessFinish', period, submission });
      assert(won.business.status === 'won' && won.budget === budget + CONFIG.businessReward, 'one capped reward');
      assert(g.undo().budget === won.budget, 'undo cannot restore a spent attempt');
      const loaded = createRegionGame({ seed, savedState: g.state, emit: false });
      for (const replay of [g, loaded]) {
        try {
          replay.act({ type: 'businessStart', period });
          assert(false, 'duplicate start rejected');
        } catch {}
        try {
          replay.act({ type: 'businessFinish', period, submission });
          assert(false, 'duplicate reward rejected');
        } catch {}
        assert(replay.view().budget === won.budget, 'duplicate requests never change the budget');
      }
      v = g.act({ type: 'endPeriod' });
    }
  }
  {
    const cake = businessChallenge(1, 3);
    const cut = d => [[d, -Math.sqrt(1 - d * d)], [d, Math.sqrt(1 - d * d)]];
    let lo = 0, hi = 1;
    for (let i = 0; i < 55; i++) {
      const d = (lo + hi) / 2;
      if (evaluateBusiness(cake, cut(d)).share > 0.45) lo = d;
      else hi = d;
    }
    assert(evaluateBusiness(cake, cut(hi)).solved, '45/55 boundary is inclusive');
    assert(!evaluateBusiness(cake, cut(hi + 0.00001)).solved, 'a cut outside 45/55 earns nothing');
    assert(evaluateBusiness(cake, [[1, 0], [1, 0]]) === null, 'degenerate cut is invalid');
  }
  {
    const s = initialState(2026);
    s.period = 2;
    const p = openProblem(s, EVENT_BY_ID['INV-NN']);
    const before = s.regions.NN.pot.output;
    s.budget = 3;
    try {
      choose(s, p.instanceId, 'B');
      assert(false, 'investment requires sufficient funds');
    } catch {}
    s.budget += CONFIG.businessReward;
    choose(s, p.instanceId, 'A');
    assert(s.budget === 0 && s.regions.NN.pot.output === before + 5, 'business income funds a durable local improvement');
  }
  // Same seed + same decisions -> same story.
  const a = play('manager', 4242).v, b = play('manager', 4242).v;
  assert(JSON.stringify(a) === JSON.stringify(b), 'same seed must replay identically');
  // Reading the view does not draw anything.
  const g = createRegionGame({ seed: 5, emit: false });
  g.act({ type: 'start' });
  const v1 = JSON.stringify(g.view());
  for (let i = 0; i < 5; i++) g.view();
  assert(JSON.stringify(g.view()) === v1, 'view() must not change state');
  // Undo restores exactly.
  const before = JSON.stringify(g.view());
  g.act({ type: 'endPeriod' });
  assert(JSON.stringify(g.undo()) === before, 'undo restores the view');
  // Enough reserve power: a plant fault must not open a power shortage.
  {
    const s = initialState(1);
    s.phase = 'period'; s.period = 3; s.built.push('power_reserve');
    s.mods.push({ key: 'plantMul', op: 'mul', v: 0.6, from: 3, until: 99, tag: 'plant_fault', src: 'Trạm điện gặp sự cố', problem: null, depth: 0 });
    const S = computeServices(s);
    assert(S.svc.CN.power.status !== 'short', 'reserve power covers a plant fault');
  }
  // Two causes of one power shortage -> one problem, one penalty per period.
  {
    const s = initialState(2);
    s.phase = 'period'; s.period = 3;
    s.mods.push({ key: 'plantMul', op: 'mul', v: 0.6, from: 3, until: 99, tag: 'plant_fault', src: 'Trạm điện gặp sự cố', problem: null, depth: 0 });
    s.mods.push({ key: 'hydroMul', op: 'mul', v: 0.5, from: 3, until: 9, src: 'Hồ xuống thấp', problem: null, depth: 0 });
    s.period = 4; s.problems = [];
    beginPeriod(s);
    const power = s.problems.filter((p) => p.rootId === 'H01');
    assert(power.length === 1, 'two causes of a power shortage open one problem');
  }
  // An open event is never drawn twice.
  {
    let dup = 0;
    for (let seed = 1; seed <= 60; seed++) {
      const r = play('wait', seed);
      const open = new Map();
      for (const p of r.s.problems) {
        const fam = `${EVENT_BY_ID[p.rootId].family}:${p.region}`;
        const prev = open.get(fam);
        if (prev && prev.end >= p.openedAt) dup++;
        open.set(fam, { end: p.closedAt ?? 99 });
      }
    }
    assert(dup === 0, 'an open family is never opened again while open');
  }
  // Every event can appear and every option is reachable by data.
  for (const e of EVENTS) {
    assert(e.options.length >= 2 && e.options.length <= 3, `${e.id} option count`);
    assert(e.options.some((o) => o.cost <= 3) || e.origin === 'opportunity', `${e.id} needs a low-budget response`);
    assert(e.learn?.note && e.topic, `${e.id} learning note/topic`);
  }
}

// ------------------------------------------------------------------ main

ruleTests();
const results = {};
const drawn = {};
for (const name of Object.keys(STRATEGIES).filter((n) => !ONLY || ONLY.includes(n))) {
  if (VERBOSE) {
    console.log(`\n--- trace ${name} (seed 2026)`);
    play(name, 2026, { trace: true });
  }
  const agg = { runs: RUNS, overall: 0, gap: 0, headlines: {}, attention: 0, open: 0, maxOpen: 0, roots: 0, cons: 0, opps: 0, big: 0, small: 0, decisions: 0, minBudget: 0, maxBudget: 0, shortages: 0, worstRegion: {} };
  for (let i = 0; i < RUNS; i++) {
    const { v, s, stats } = play(name, 1000 + i * 13);
    agg.overall += v.national.overall / RUNS;
    agg.gap += v.national.gap / RUNS;
    agg.headlines[v.summary.headline] = (agg.headlines[v.summary.headline] || 0) + 1;
    agg.attention += stats.attention.reduce((a, b) => a + b, 0) / stats.attention.length / RUNS;
    agg.open += stats.open.reduce((a, b) => a + b, 0) / stats.open.length / RUNS;
    agg.maxOpen = Math.max(agg.maxOpen, ...stats.open);
    for (const k of ['roots', 'cons', 'opps', 'big', 'small', 'decisions', 'shortages']) agg[k] += stats[k] / RUNS;
    agg.minBudget += stats.minBudget / RUNS;
    agg.maxBudget += stats.maxBudget / RUNS;
    const worst = REGION_ORDER.slice().sort((a, b) => sc(v, a) - sc(v, b))[0];
    agg.worstRegion[worst] = (agg.worstRegion[worst] || 0) + 1;
    for (const p of s.problems) drawn[p.rootId] = (drawn[p.rootId] || 0) + 1;
  }
  results[name] = agg;
}
function sc(v, r) {
  const x = v.regions.find((y) => y.id === r).indicators;
  return x.output + x.wellbeing + x.access;
}

const f = (x, d = 1) => x.toFixed(d).padStart(5);
console.log('\nRegion mode — pacing and outcomes per strategy (means over seeds)');
console.log('strategy  overall  gap | attn open maxOpen | roots small  big opps cons | decis short | budget min/max | headlines');
for (const [n, r] of Object.entries(results)) {
  const heads = Object.entries(r.headlines).sort((a, b) => b[1] - a[1]).map(([h, c]) => `${h} ${Math.round((100 * c) / r.runs)}%`).join('; ');
  console.log(`${n.padEnd(9)} ${f(r.overall)} ${f(r.gap)} | ${f(r.attention)} ${f(r.open)} ${String(r.maxOpen).padStart(6)} | ${f(r.roots)} ${f(r.small)} ${f(r.big)} ${f(r.opps)} ${f(r.cons)} | ${f(r.decisions)} ${f(r.shortages)} | ${f(r.minBudget)} ${f(r.maxBudget)} | ${heads}`);
}
console.log('\nEvents drawn (all runs):', Object.entries(drawn).sort().map(([k, n]) => `${k}=${n}`).join(' '));
const never = ROOT_EVENTS.map((e) => e.id).filter((id) => !drawn[id]);
if (never.length) console.log('Never drawn:', never.join(' '));

if (!ONLY) {
  const R = results;
  assert(R.manager.overall > R.wait.overall + 3, 'deciding well must beat waiting');
  assert(R.manager.overall >= R.cheap.overall - 1, 'a thoughtful manager should not lose to always-cheapest');
  assert(R.manager.attention >= 1.2 && R.manager.attention <= 3.6, `about 2–3 regions need attention (got ${R.manager.attention.toFixed(2)})`);
  assert(R.manager.maxOpen <= 8, 'attention budget keeps the map readable');
  assert(never.length === 0, `every event appears in some run (${never.join(',')})`);
  const best = (n) => (R[n].headlines['Phát triển đồng đều hơn'] || 0) / R[n].runs;
  assert(best('wait') === 0, 'never deciding must not reach the best ending');
  assert(best('builder') >= 0.3, `the best ending is reachable by investing (got ${best('builder')})`);
  assert(best('random') < best('builder'), 'random play must not beat a deliberate investor');
}

if (failures) {
  console.error(`\nFAILED: ${failures} assertion failures`);
  for (const [m, n] of failed) console.error(`  ${n}x ${m}`);
  process.exit(1);
}
console.log('\nAll region invariants hold.');
