#!/usr/bin/env node
// Unit/boundary tests for the economy, fallback, capacity, crisis and ending
// rules (balancing review §7.2 layer 1).   npm run test:sim
import { initialState, income, applyChoice, endYear, repairResolved, crisisTypes, fallbackCost } from '../src/sim/engine.js';
import { classifyEnding, e5Variant } from '../src/sim/report.js';
import { RULES } from '../src/data/index.js';

let fails = 0;
function eq(actual, expected, msg) {
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  if (!ok) { fails++; console.error(`FAIL ${msg}: got ${JSON.stringify(actual)}, want ${JSON.stringify(expected)}`); }
}
const mk = (metrics = {}, resources = {}) => {
  const s = initialState(1, false);
  Object.assign(s.metrics, metrics);
  Object.assign(s.resources, resources);
  return s;
};

// ---- income steps
{
  const base = RULES.income.base;
  const inc = (PROD, DEBT) => income(mk({ PROD }, { DEBT }));
  eq(inc(50, 0), base, 'income at pivot');
  eq(inc(64, 0) <= inc(65, 0), true, 'income monotone in PROD');
  eq(inc(50, 0) >= inc(50, 1), true, 'income monotone in DEBT');
  eq(inc(50, 1), base, 'DEBT=1 must not cut income (no cliff at 0/1)');
  eq(inc(0, 100), RULES.income.min, 'income floor');
}

// ---- fallback is proportional to money actually spent
{
  const node = {
    id: 'T', kind: 'main', choices: [{ id: 'T-A', title: 't', cost: 20, now: { TRUST: 8, LAW: -2 } }],
  };
  const s = mk({}, { BUDGET: -9 });
  eq(fallbackCost(s, 20), 1, 'fallback cost capped by budget room');
  const r = applyChoice(s, node, 'T-A-P');
  eq(r.deltas.TRUST ?? 0, 0, 'fallback paying 1/20 gets ~1/20 of the benefit');
  eq(r.deltas.LAW, -2, 'fallback keeps negative effects');
  const s2 = mk({}, { BUDGET: 0 });
  const r2 = applyChoice(s2, node, 'T-A-P');
  eq(r2.deltas.TRUST, 4, 'normal fallback (half cost) keeps half the benefit');
}

// ---- low capacity scales delayed effects too
{
  const node = {
    id: 'T', kind: 'main',
    choices: [{ id: 'T-A', title: 't', cost: 0, complex: true, now: { PROD: 10 }, pending: [{ in: 1, effects: { PROD: 10 }, text: 'x' }] }],
  };
  const lo = mk({}, { CAPACITY: 34 });
  applyChoice(lo, node, 'T-A');
  eq(lo.pending_effects[0].effects.PROD, 6, 'CAPACITY 34 cuts delayed benefit to 60%');
  const hi = mk({}, { CAPACITY: 35 });
  applyChoice(hi, node, 'T-A');
  eq(hi.pending_effects[0].effects.PROD, 10, 'CAPACITY 35 keeps full delayed benefit');
}

// ---- crisis streak per type
{
  const s = mk({ LAW: 10, TRUST: 10 });
  s.year = 3;
  eq(endYear(s), 'next', 'one institutional year is not yet a prolonged crisis');
  Object.assign(s.metrics, { LAW: 50, TRUST: 50, LIFE: 5, PROD: 5 });
  s.year = 4;
  eq(endYear(s), 'next', 'institutional then livelihood must not count as 2 years');
  s.year = 5;
  eq(endYear(s), 'repair', 'two livelihood years trigger the repair');
  eq(s.crisis, 'livelihood', 'repair addresses the prolonged crisis');

  const both = mk({ LAW: 10, TRUST: 10, LIFE: 5, PROD: 5 });
  eq(crisisTypes(both), ['institutional', 'livelihood'], 'both crises detected at once');
  Object.assign(both.metrics, { LAW: 40, TRUST: 40 });
  eq(repairResolved(both), false, 'repair not resolved while the other crisis remains');
  Object.assign(both.metrics, { LIFE: 40, PROD: 40 });
  eq(repairResolved(both), true, 'repair resolved when every crisis is cleared');
}

// ---- endings
{
  const end = (m, r = {}, extra = {}) => classifyEnding(Object.assign(mk(m, r), extra));
  const allGood = { PROD: 70, LIFE: 60, TRUST: 60, LAW: 60, EQUITY: 60, COHESION: 65 };
  eq(end(allGood).id, 'E1', 'E1 at thresholds');
  eq(end({ ...allGood, LAW: 59 }).id, 'E5', 'LAW 59 falls to E5');
  eq(end({ ...allGood, LAW: 59 }).variant, 'near', '...but as near-success');
  eq(end(allGood, { DEBT: 60 }).id, 'E5', 'DEBT 60 blocks E1');
  eq(end(allGood, {}, { repairUsed: true, repairYear: 5 }).id, 'E1', 'early successful repair keeps E1 possible');
  eq(end(allGood, {}, { repairUsed: true, repairYear: 8 }).id, 'E5', 'repair in final year blocks E1');
  // E2+E3+E4 all hold (review §5.2 example): the most severe wins, others listed.
  const mixed = end({ PROD: 75, LIFE: 60, TRUST: 15, LAW: 30, EQUITY: 30, COHESION: 65 }, { DEBT: 85 });
  eq(mixed.id, 'E4', 'most severe imbalance is primary (TRUST 20 below 35 beats EQUITY/DEBT 10)');
  eq(mixed.secondary.filter((x) => /^E/.test(x.id)).map((x) => x.id).sort(), ['E2', 'E3'], 'other imbalances kept as secondary');
  eq(e5Variant(mk({ PROD: 50, LIFE: 50, TRUST: 50, LAW: 50, EQUITY: 30, COHESION: 50 })), 'uneven', 'E5 uneven');
  eq(e5Variant(mk({ PROD: 48, LIFE: 48, TRUST: 48, LAW: 48, EQUITY: 48, COHESION: 48 })), 'stalled', 'E5 stalled');
}

if (fails) { console.error(`\n${fails} boundary test(s) failed`); process.exit(1); }
console.log('All boundary tests pass.');
