// Public sim API (see ARCHITECTURE.md "Hợp đồng Sim").
//   const game = createGame({ seed: 2026, randomEvents: true });
//   game.view(); game.act(optionId); game.state; game.undo();
import { bus as coreBus } from '../core/bus.js';
import { BRIEFING, RULES } from '../data/index.js';
import {
  initialState, nodeFor, buildChoiceOptions, applyChoice, enterYearStart, pickConsequence,
  enterConsequence, enterEvent, drawRandom, enterRandom, endYear, repairResolved, warningFor,
  MAIN_BY_YEAR, NODES,
} from './engine.js';
import { buildReport } from './report.js';
import { check } from './cond.js';

const clone = (o) => JSON.parse(JSON.stringify(o));
const CONTINUE = [{ id: 'continue', key: '1', label: 'Tiếp tục' }];

export function createGame({ seed = 2026, randomEvents = true, bus = coreBus, emit = true } = {}) {
  let s = initialState(seed, randomEvents);
  let snapshots = [];

  function base(site) {
    return {
      phase: s.phase,
      year: s.year,
      totalYears: RULES.years,
      metrics: { ...s.metrics },
      resources: { ...s.resources },
      flags: [...s.flags],
      warning: warningFor(s),
      site,
      options: [],
    };
  }

  function view() {
    const node = nodeFor(s);
    switch (s.phase) {
      case 'briefing':
        return { ...base('overview'), title: BRIEFING.title, paragraphs: [...BRIEFING.paragraphs], options: [{ id: 'start', key: '1', label: 'Bắt đầu' }] };

      case 'yearStart': {
        const next = MAIN_BY_YEAR[s.year];
        return {
          ...base('overview'),
          budgetGain: s.yearInfo.budgetGain,
          applied: clone(s.yearInfo.applied),
          nextChapter: next.chapter,
          options: CONTINUE,
        };
      }

      case 'consequence': {
        const interactive = !!(node.choices && node.choices.length);
        return {
          ...base(node.site),
          code: node.id,
          headline: node.headline,
          text: node.text,
          facts: [...(node.facts || [])],
          applied: clone(s.presentApplied),
          options: interactive ? buildChoiceOptions(node, s) : CONTINUE,
        };
      }

      case 'event': {
        const variantNotes = (node.variants || []).filter((v) => check(v.if, s)).map((v) => v.text);
        return {
          ...base(node.site),
          code: node.id,
          chapter: node.chapter,
          headline: node.headline,
          context: [...variantNotes, node.context].join(' '),
          variantNotes,
          facts: [...node.facts],
          conflict: node.conflict,
          uncertainty: node.uncertainty,
          stakeholders: [...node.stakeholders],
          applied: clone(s.presentApplied),
          options: buildChoiceOptions(node, s),
        };
      }

      case 'result':
      case 'randomResult':
        return { ...base(siteOf(s.lastResult.code)), ...clone(s.lastResult), options: CONTINUE };

      case 'random':
        return {
          ...base(node.site),
          code: node.id,
          headline: node.headline,
          text: node.text,
          options: buildChoiceOptions(node, s),
        };

      case 'finalRepair':
        return {
          ...base('overview'),
          code: 'FINAL_REPAIR',
          crisis: s.crisis,
          headline: node.headline,
          text: node.text,
          options: buildChoiceOptions(node, s),
        };

      case 'end':
        return { ...base('overview'), ...clone(buildReport(s)), options: [{ id: 'restart', key: '1', label: 'Chơi lại' }] };
    }
    throw new Error(`unknown phase ${s.phase}`);
  }

  const siteOf = (code) => NODES[code]?.site || 'overview';

  function finishYear() {
    const outcome = endYear(s);
    if (outcome === 'next') {
      s.year++;
      enterYearStart(s);
    } else if (outcome === 'end') {
      s.phase = 'end';
      s.node = null;
    }
    // 'repair' -> endYear already switched to finalRepair
  }

  function step(optionId) {
    const node = nodeFor(s);
    switch (s.phase) {
      case 'briefing':
        enterYearStart(s);
        return;
      case 'yearStart': {
        const c = pickConsequence(s);
        if (c) enterConsequence(s, c);
        else enterEvent(s);
        return;
      }
      case 'consequence': {
        if (node.choices && node.choices.length) {
          const res = applyChoice(s, node, optionId);
          enterEvent(s, [{ source: res.choiceId, text: res.outcome, deltas: { ...res.deltas, ...res.resourceDeltas } }]);
        } else {
          enterEvent(s);
        }
        return;
      }
      case 'event':
        s.lastResult = applyChoice(s, node, optionId);
        s.phase = 'result';
        return;
      case 'result': {
        const r = drawRandom(s);
        if (r) enterRandom(s, r);
        else finishYear();
        return;
      }
      case 'random':
        s.lastResult = applyChoice(s, node, optionId);
        s.phase = 'randomResult';
        return;
      case 'randomResult':
        finishYear();
        return;
      case 'finalRepair': {
        applyChoice(s, node, optionId);
        s.repairUsed = true;
        if (!repairResolved(s)) {
          s.endReason = 'crisis';
          s.phase = 'end';
          s.node = null;
          return;
        }
        s.counters.crisis_streak = 0;
        if (s.year >= RULES.years) {
          s.phase = 'end';
          s.node = null;
        } else {
          s.year++;
          enterYearStart(s);
        }
        return;
      }
      case 'end':
        s = initialState(seed, s.settings.randomEvents);
        snapshots = [];
        return;
    }
  }

  const numbers = () => JSON.stringify([s.metrics, s.resources, s.flags, s.year]);

  // Every accepted act moves to a new view, so sim:view is emitted each time;
  // sim:state only when numbers/flags/year changed.
  function publish(prevNumbers, force = false) {
    if (!emit || !bus) return;
    bus.emit('sim:view', { view: view() });
    if (force || numbers() !== prevNumbers) {
      bus.emit('sim:state', { metrics: { ...s.metrics }, resources: { ...s.resources }, flags: [...s.flags], year: s.year });
    }
  }

  const game = {
    view,
    act(optionId) {
      const v = view();
      const opt = v.options.find((o) => o.id === optionId);
      if (!opt) throw new Error(`Invalid option "${optionId}" in phase "${v.phase}"`);
      if (opt.disabled) throw new Error(`Option "${optionId}" is disabled: ${opt.disabledReason || ''}`);
      const prevNumbers = numbers();
      snapshots.push(clone(s));
      step(optionId);
      publish(prevNumbers);
      return view();
    },
    undo() {
      if (!snapshots.length) return view();
      const prevNumbers = numbers();
      s = snapshots.pop();
      publish(prevNumbers);
      return view();
    },
    /** Re-emit sim:view and sim:state (e.g. after listeners subscribe). Not part of the core contract. */
    sync() {
      publish(null, true);
      return view();
    },
    get state() {
      return clone(s);
    },
    get canUndo() {
      return snapshots.length > 0;
    },
    seed,
  };
  return game;
}

