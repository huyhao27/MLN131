// Ending classification (GDD §7.2) and final report data.
import { INITIAL, RULES, METRIC_KEYS, METRIC_LABELS, STAKEHOLDERS, ENDINGS, E5_VARIANTS, SECONDARY_NOTES, WHAT_IF } from '../data/index.js';
import { NODES } from './engine.js';

/** Which ending conditions hold for the current metrics. */
export function endingConditions(s) {
  const m = s.metrics, r = s.resources;
  return {
    E2: m.PROD >= 65 && (m.LIFE < 45 || m.EQUITY < 40),
    E3: m.LIFE >= 55 && (m.PROD < 40 || r.DEBT >= 75),
    E4: m.COHESION >= 55 && (m.LAW < 35 || m.TRUST < 35),
    E1: METRIC_KEYS.every((k) => m[k] >= 55) && m.LAW >= 60 && m.LIFE >= 55 && r.DEBT < 60,
  };
}

// Tie-break order when two imbalance endings are equally severe (old fixed priority).
const PRIORITY = ['E2', 'E3', 'E4', 'E1'];
const IMBALANCES = ['E2', 'E3', 'E4'];

/** How far past its thresholds each imbalance ending is (0 when it does not hold).
 *  Measured as the depth of the shortfall in metric points, so the three compare
 *  on one scale without hand-picked weights; ties keep the GDD order. */
export function endingSeverity(s) {
  const m = s.metrics, r = s.resources;
  const c = endingConditions(s);
  return {
    E2: c.E2 ? Math.max(45 - m.LIFE, 40 - m.EQUITY) : 0,
    E3: c.E3 ? Math.max(40 - m.PROD, r.DEBT - 75) : 0,
    E4: c.E4 ? Math.max(35 - m.LAW, 35 - m.TRUST) : 0,
  };
}

/** Points still missing for E1 (0 = all E1 thresholds met). */
export function e1Shortfall(s) {
  const m = s.metrics, r = s.resources;
  let gap = 0;
  for (const k of METRIC_KEYS) gap += Math.max(0, 55 - m[k]);
  gap += Math.max(0, 60 - Math.max(m.LAW, 55)); // LAW needs 60, the 55 part is counted above
  gap += Math.max(0, r.DEBT - 59);
  return gap;
}

/** E5 sub-state: 'near' (a few points from E1), 'uneven' (some metric left far behind), 'stalled'. */
export function e5Variant(s) {
  if (e1Shortfall(s) <= RULES_E5.nearGap) return 'near';
  if (METRIC_KEYS.some((k) => s.metrics[k] < 40)) return 'uneven';
  return 'stalled';
}
const RULES_E5 = { nearGap: 6 };

export function classifyEnding(s) {
  if (s.endReason === 'crisis') return { id: 'E6', secondary: [] };
  const conds = endingConditions(s);
  // A repair in the final year has not shown lasting recovery yet.
  const lateRepair = s.repairUsed && s.repairYear >= RULES.years;
  if (lateRepair) conds.E1 = false;

  const sev = endingSeverity(s);
  const worst = IMBALANCES.filter((k) => conds[k]).sort((a, b) => sev[b] - sev[a] || PRIORITY.indexOf(a) - PRIORITY.indexOf(b))[0];
  const id = worst || (conds.E1 ? 'E1' : 'E5');
  const variant = id === 'E5' ? e5Variant(s) : null;

  // secondary[]: { id, title } — other ending conditions that also hold, plus notes.
  const secondary = PRIORITY.filter((k) => k !== id && conds[k]).map((k) => ({ id: k, title: SECONDARY_NOTES[k] }));
  if (s.repairUsed) secondary.push({ id: 'REPAIR', title: lateRepair ? SECONDARY_NOTES.REPAIR_LATE : SECONDARY_NOTES.REPAIR });
  if (s.flags.includes('LABOR_UNRESOLVED') || s.counters.latent_discontent >= 2) {
    secondary.push({ id: 'LABOR_UNRESOLVED', title: SECONDARY_NOTES.LABOR_UNRESOLVED });
  }
  if (s.resources.DEBT >= 50) secondary.push({ id: 'DEBT', title: SECONDARY_NOTES.DEBT });
  return { id, variant, secondary, severity: sev };
}

const magnitude = (d) => Object.values(d || {}).reduce((a, v) => a + Math.abs(v), 0);

function metricLine(k, from, to) {
  const diff = to - from;
  return `${METRIC_LABELS[k]}: ${from} → ${to} (${diff >= 0 ? '+' : ''}${diff})`;
}

export function buildReport(s) {
  const { id, variant, secondary } = classifyEnding(s);
  const base = variant ? { ...ENDINGS[id], ...E5_VARIANTS[variant], variant } : ENDINGS[id];

  const changes = METRIC_KEYS.map((k) => ({ k, from: INITIAL.metrics[k], to: s.metrics[k], diff: s.metrics[k] - INITIAL.metrics[k] }));
  const sorted = [...changes].sort((a, b) => b.diff - a.diff);
  const progress = sorted.slice(0, 2).map((c) => metricLine(c.k, c.from, c.to));
  const challenges = sorted.slice(-2).reverse().map((c) => metricLine(c.k, c.from, c.to));

  // history[]: every Y, C and R entry (C notices have choiceId null).
  const history = s.history.map((h) => ({
    year: h.year,
    code: h.code,
    kind: h.kind,
    choiceId: h.choiceId,
    label: h.label,
    fallback: !!h.fallback,
    deltas: h.deltas,
    metricsAfter: h.metricsAfter,
  }));

  // Turning points: the three main/consequence decisions with the largest total
  // realised impact (immediate + delayed effects that actually triggered).
  const delayedBySource = {};
  for (const d of s.delayedLog) if (d.triggered) delayedBySource[d.source] = (delayedBySource[d.source] || 0) + magnitude(d.deltas);
  const turningPoints = s.history
    .filter((h) => h.choiceId && (h.kind === 'main' || h.kind === 'consequence' || h.kind === 'repair'))
    .map((h) => ({ h, impact: magnitude(h.deltas) + (delayedBySource[h.choiceId] || 0) }))
    .sort((a, b) => b.impact - a.impact)
    .slice(0, 3)
    .sort((a, b) => a.h.year - b.h.year)
    .map(({ h, impact }) => ({
      year: h.year,
      code: h.code,
      choiceId: h.choiceId,
      label: h.label,
      impact,
      text: turningText(h, delayedBySource[h.choiceId] || 0),
    }));

  // delayed[]: { fromYear, year, text } — delayed effects that actually triggered, biggest first.
  const delayed = s.delayedLog
    .filter((d) => d.triggered && magnitude(d.deltas) > 0)
    .sort((a, b) => magnitude(b.deltas) - magnitude(a.deltas))
    .map((d) => ({ fromYear: d.from, year: d.year, source: d.source, text: `${d.text} (${deltaText(d.deltas)})`, deltas: d.deltas }));

  const tally = Object.fromEntries(Object.keys(STAKEHOLDERS).map((k) => [k, { gains: 0, losses: 0 }]));
  for (const h of s.history) {
    for (const w of h.winners || []) tally[w] && tally[w].gains++;
    for (const l of h.losers || []) tally[l] && tally[l].losses++;
  }
  // stakeholders[]: { id, tone: 'gain'|'loss'|'mixed', text }
  const stakeholders = Object.entries(tally)
    .filter(([, t]) => t.gains + t.losses > 0)
    .map(([sid, t]) => ({
      id: sid,
      tone: t.gains > t.losses ? 'gain' : t.losses > t.gains ? 'loss' : 'mixed',
      text: `${STAKEHOLDERS[sid]}: hưởng lợi từ ${t.gains} quyết định, chịu chi phí từ ${t.losses} quyết định.`,
      gains: t.gains,
      losses: t.losses,
    }))
    .sort((a, b) => b.gains - b.losses - (a.gains - a.losses) || b.gains - a.gains);

  return {
    ending: { ...base, secondary, progress, challenges, whatIf: WHAT_IF },
    initialMetrics: { ...INITIAL.metrics },
    history,
    turningPoints,
    delayed,
    stakeholders,
    timeline: s.timeline,
  };
}

function deltaText(d) {
  return Object.entries(d)
    .map(([k, v]) => `${METRIC_LABELS[k] || k} ${v > 0 ? '+' : ''}${v}`)
    .join(', ');
}

function turningText(h, delayedImpact) {
  const headline = NODES[h.code]?.headline || (h.kind === 'repair' ? 'Nút cứu vãn cuối' : '');
  const main = Object.entries(h.deltas || {})
    .filter(([k]) => METRIC_LABELS[k])
    .sort((a, b) => Math.abs(b[1]) - Math.abs(a[1]))
    .slice(0, 3);
  const eff = main.length ? deltaText(Object.fromEntries(main)) : 'tác động chủ yếu qua hệ quả trễ';
  return `Năm ${h.year} — ${headline}: ${eff}${delayedImpact ? '; còn để lại hệ quả trễ ở các năm sau' : ''}.`;
}
