// Static content validation (doc 02 §8 "Validation bắt buộc trước xuất bản").
// Returns a list of error strings; empty = valid.
import {
  MAIN_EVENTS, CONSEQUENCES, RANDOM_EVENTS, FINAL_REPAIR, ENDINGS,
  METRIC_KEYS, STAKEHOLDERS, RULES,
} from '../data/index.js';
import { flagsIn, assertValid } from './cond.js';

export const SITE_IDS = ['overview', 'industrial', 'economy', 'ringroad', 'hospital', 'coalition', 'valley', 'temple', 'housing', 'port'];
const EFFECT_KEYS = new Set([...METRIC_KEYS, 'BUDGET', 'CAPACITY', 'DEBT']);
// Pre-choice text must not leak numbers that look like deltas or metric keys.
const LEAK = /([+−-]\s?\d+\b)|\b(PROD|LIFE|TRUST|LAW|EQUITY|COHESION|CAPACITY|DEBT)\b/;

// Time inside a year at which things happen (pending at 0, C at .2, main at .5, random at .8).
const T = { pending: 0, consequence: 0.2, main: 0.5, random: 0.8 };

export function validateContent() {
  const errors = [];
  const err = (m) => errors.push(m);
  const ids = new Set();
  const uniq = (id, where) => {
    if (ids.has(id)) err(`duplicate id ${id} (${where})`);
    ids.add(id);
  };

  // flag -> earliest time it can be set
  const setAt = {};
  const markSet = (flags, t) => {
    for (const f of flags || []) setAt[f] = Math.min(setAt[f] ?? Infinity, t);
  };
  // [flag, time it is read, where]
  const uses = [];
  const markUse = (cond, t, where) => {
    try {
      assertValid(cond);
    } catch (e) {
      err(`${where}: ${e.message}`);
      return;
    }
    for (const f of flagsIn(cond)) uses.push([f, t, where]);
  };

  const checkEffects = (eff, where) => {
    for (const k of Object.keys(eff || {})) if (!EFFECT_KEYS.has(k)) err(`${where}: unknown effect key ${k}`);
  };
  const checkAcademic = (node) => {
    const a = node.academic;
    if (!a || !a.chapter || !a.topic || !a.lesson || !a.debrief) err(`${node.id}: missing academic {chapter, topic, lesson, debrief}`);
  };
  const checkSite = (node) => {
    if (!SITE_IDS.includes(node.site)) err(`${node.id}: bad site ${node.site}`);
  };

  const checkChoice = (c, node, useT, maxYear) => {
    uniq(c.id, node.id);
    if (!c.title) err(`${c.id}: missing title`);
    if (!c.explanation) err(`${c.id}: missing explanation`);
    if (LEAK.test(c.title) || LEAK.test(c.explanation || '')) err(`${c.id}: pre-choice text leaks a delta`);
    checkEffects(c.now, c.id);
    for (const s of [...(c.winners || []), ...(c.losers || [])]) if (!(s in STAKEHOLDERS)) err(`${c.id}: unknown stakeholder ${s}`);
    for (const m of c.mods || []) {
      markUse(m.if, useT, `${c.id} mod`);
      checkEffects(m.now, `${c.id} mod`);
      if (m.note && LEAK.test(m.note)) err(`${c.id}: mod note leaks a delta`);
    }
    for (const p of c.pending || []) {
      const due = p.due ?? maxYear + (p.in || 1);
      if (due > RULES.years) err(`${c.id}: pending due year ${due} > ${RULES.years}`);
      if (p.due !== undefined && p.due <= Math.floor(useT)) err(`${c.id}: pending due ${p.due} not after its node`);
      if (!p.text) err(`${c.id}: pending without text`);
      checkEffects(p.effects, `${c.id} pending`);
      markUse(p.if, due + T.pending, `${c.id} pending`);
    }
  };

  // Pass 1: collect flag set times.
  for (const n of MAIN_EVENTS) for (const c of n.choices) markSet([...(c.setFlags || []), ...(c.mods || []).flatMap((m) => m.setFlags || [])], n.year + T.main);
  for (const n of CONSEQUENCES) {
    for (const c of n.choices || []) markSet(c.setFlags, n.year + T.consequence);
    for (const i of n.info || []) markSet(i.setFlags, n.year + T.consequence);
  }
  for (const n of RANDOM_EVENTS) for (const c of n.choices) markSet(c.setFlags, n.years[0] + T.random);

  // Pass 2: structure + uses.
  const years = MAIN_EVENTS.map((n) => n.year).sort((a, b) => a - b);
  if (years.join() !== '1,2,3,4,5,6,7,8') err(`main events must cover years 1..8, got ${years}`);
  for (const n of MAIN_EVENTS) {
    uniq(n.id, 'main');
    checkAcademic(n);
    checkSite(n);
    if (n.choices.length !== 3) err(`${n.id}: needs 3 choices`);
    for (const s of n.stakeholders) if (!(s in STAKEHOLDERS)) err(`${n.id}: unknown stakeholder ${s}`);
    const t = n.year + T.main;
    for (const v of n.variants || []) markUse(v.if, t, `${n.id} variant`);
    for (const p of n.onPresent || []) markUse(p.if, t, `${n.id} onPresent`);
    for (const c of n.choices) checkChoice(c, n, t, n.year);
  }
  for (const n of CONSEQUENCES) {
    uniq(n.id, 'consequence');
    checkAcademic(n);
    checkSite(n);
    const t = n.year + T.consequence;
    markUse(n.trigger, t, `${n.id} trigger`);
    for (const i of n.info || []) {
      markUse(i.if, t, `${n.id} info`);
      checkEffects(i.effects, `${n.id} info`);
    }
    if (!(n.choices && n.choices.length) && !(n.info && n.info.length)) err(`${n.id}: needs choices or info`);
    for (const c of n.choices || []) checkChoice(c, n, t, n.year);
  }
  for (const n of RANDOM_EVENTS) {
    uniq(n.id, 'random');
    checkAcademic(n);
    checkSite(n);
    if (n.choices.length !== 2) err(`${n.id}: needs 2 responses`);
    const t = n.years[1] + T.random; // usable if the flag can exist by the last eligible year
    markUse(n.precondition, t, `${n.id} precondition`);
    markUse(n.illustrates, t, `${n.id} illustrates`);
    for (const m of n.weightMods || []) markUse(m.if, t, `${n.id} weight`);
    for (const c of n.choices) checkChoice(c, n, t, n.years[1]);
  }
  for (const [type, r] of Object.entries(FINAL_REPAIR)) {
    if (r.choices.length !== 2) err(`FINAL_REPAIR.${type}: needs 2 choices`);
    for (const c of r.choices) checkEffects(c.now, `FINAL_REPAIR.${type}`);
  }
  for (const e of ['E1', 'E2', 'E3', 'E4', 'E5', 'E6']) {
    if (!ENDINGS[e]?.title || !ENDINGS[e]?.text || !ENDINGS[e]?.question) err(`ending ${e} incomplete`);
  }

  for (const [f, t, where] of uses) {
    if (!(f in setAt)) err(`${where}: flag ${f} is never set`);
    else if (setAt[f] >= t) err(`${where}: flag ${f} used at ${t} but first settable at ${setAt[f]}`);
  }
  return errors;
}
