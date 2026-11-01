// Ending classification (GDD §7.2) and final report data.
import { INITIAL, METRIC_KEYS, METRIC_LABELS, STAKEHOLDERS, ENDINGS, SECONDARY_NOTES, WHAT_IF } from '../data/index.js';
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

// Priority: E6 -> E2 -> E3 -> E4 -> E1 -> E5.
const PRIORITY = ['E2', 'E3', 'E4', 'E1'];

export function classifyEnding(s) {
  if (s.endReason === 'crisis') return { id: 'E6', secondary: [] };
  const conds = endingConditions(s);
  if (s.repairUsed) conds.E1 = false;
  const id = PRIORITY.find((k) => conds[k]) || 'E5';
  const secondary = PRIORITY.filter((k) => k !== id && conds[k]).map((k) => SECONDARY_NOTES[k]);
  if (s.repairUsed) secondary.push(SECONDARY_NOTES.REPAIR);
  if (s.flags.includes('LABOR_UNRESOLVED') || s.counters.latent_discontent >= 2) secondary.push(SECONDARY_NOTES.LABOR_UNRESOLVED);
  if (s.resources.DEBT >= 50) secondary.push(SECONDARY_NOTES.DEBT);
  return { id, secondary };
}

const magnitude = (d) => Object.values(d || {}).reduce((a, v) => a + Math.abs(v), 0);

function metricLine(k, from, to) {
  const diff = to - from;
  return `${METRIC_LABELS[k]}: ${from} → ${to} (${diff >= 0 ? '+' : ''}${diff})`;
}

export function buildReport(s) {
  const { id, secondary } = classifyEnding(s);
  const base = ENDINGS[id];

  const changes = METRIC_KEYS.map((k) => ({ k, from: INITIAL.metrics[k], to: s.metrics[k], diff: s.metrics[k] - INITIAL.metrics[k] }));
  const sorted = [...changes].sort((a, b) => b.diff - a.diff);
  const progress = sorted.slice(0, 2).map((c) => metricLine(c.k, c.from, c.to));
  const challenges = sorted.slice(-2).reverse().map((c) => metricLine(c.k, c.from, c.to));

  const history = s.history
    .filter((h) => h.choiceId)
    .map((h) => ({
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
    .map((h) => ({
      year: h.year,
      code: h.code,
      choiceId: h.choiceId,
      label: h.label,
      headline: NODES[h.code]?.headline || '',
      impact: magnitude(h.deltas) + (delayedBySource[h.choiceId] || 0),
      deltas: h.deltas,
    }))
    .sort((a, b) => b.impact - a.impact)
    .slice(0, 3)
    .sort((a, b) => a.year - b.year);

  const delayed = s.delayedLog
    .filter((d) => d.triggered && magnitude(d.deltas) > 0)
    .map((d) => ({ year: d.year, from: d.from, source: d.source, code: d.code, text: d.text, deltas: d.deltas }))
    .sort((a, b) => magnitude(b.deltas) - magnitude(a.deltas));

  const tally = Object.fromEntries(Object.keys(STAKEHOLDERS).map((k) => [k, { gains: 0, losses: 0 }]));
  for (const h of s.history) {
    for (const w of h.winners || []) tally[w] && tally[w].gains++;
    for (const l of h.losers || []) tally[l] && tally[l].losses++;
  }
  const stakeholders = Object.entries(tally)
    .map(([sid, t]) => ({ id: sid, label: STAKEHOLDERS[sid], gains: t.gains, losses: t.losses, net: t.gains - t.losses }))
    .sort((a, b) => b.net - a.net || b.gains - a.gains);

  return {
    ending: { ...base, secondary, progress, challenges, whatIf: WHAT_IF },
    history,
    turningPoints,
    delayed,
    stakeholders,
    timeline: s.timeline,
  };
}
