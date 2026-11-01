# Sim engine and content format

`src/sim/` is pure JS (no DOM, no three) and runs in Node. Public API and View
shapes are in `ARCHITECTURE.md`. Content lives in `src/data/` as JS modules.

```
src/data/config.js        initial state, rules/tunables (budget, thresholds, random chances), labels
src/data/main.js          Y1–Y8 mandatory year events
src/data/consequences.js  C01–C05 consequence / repair nodes
src/data/randoms.js       R01–R08 conditional random events
src/data/endings.js       briefing, FINAL_REPAIR, endings E1–E6, secondary notes
src/data/flags.js         display labels for flags
src/sim/cond.js           condition mini-language
src/sim/engine.js         state machine steps, effects, budget, random draw, crisis
src/sim/report.js         ending classification + final report
src/sim/validate.js       static content validation (run by `npm run sim`)
src/sim/index.js          createGame(): views, act(), undo(), bus events
scripts/simulate.mjs      headless runner (`npm run sim`)
```

## Conditions

Strings such as `'WAGE_SHOCK && PROD<50'`, `'latent_discontent>=2 || !CONSULT_REAL'`.
Operators: `&& || ! ( ) >= <= > < == !=`. Identifiers:

| identifier | meaning |
|---|---|
| `PROD LIFE TRUST LAW EQUITY COHESION` | metric value |
| `BUDGET CAPACITY DEBT` | resource value |
| `YEAR`, `latent_discontent`, `consecutive_budget_deficit`, `random_events_seen` | numbers |
| `seen:R01` | node was shown this session |
| `chose:Y1-A` | option was chosen (fallback `-P` counts too) |
| `true` / `false` | literals |
| any other `UPPER_CASE` | flag is set |

## Choice (used by Y, C, R and FINAL_REPAIR)

```js
{
  id: 'Y1-A',                 // stable id; fallback option id is 'Y1-A-P'
  title, explanation,         // pre-choice text: never numbers/deltas (validator checks)
  outcome,                    // short narrative shown on the result screen
  style: 'balanced'|'growth'|'welfare'|'control'|'delay'|'neglect', // for simulate.mjs only
  complex: true,              // CAPACITY<35 cuts its positive effects by 40% (trunc toward 0)
  cost: 8,                    // budget cost (negative = saves money)
  now: { LIFE: 5, PROD: -2 }, // immediate metric deltas
  cap: 3, debt: 8,            // CAPACITY / DEBT deltas
  discontent: 2,              // latent_discontent delta
  setFlags: [], clearFlags: [],
  mods: [ { if, cost, now, cap, debt, discontent, setFlags, clearFlags, note } ],
                              // flag variants, resolved when the option is shown/applied;
                              // `note` is appended to the explanation (no numbers)
  pending: [ { due: 5 | in: 1, if: 'CAPACITY>=40', effects: { PROD: 7, BUDGET: -3 }, text } ],
                              // delayed effects, applied at the start of year `due`
                              // (or current year + `in`) if `if` holds then
  winners: ['worker'], losers: ['business'], // stakeholder ids
}
```

## Nodes

- **Main (Y)**: `id, kind:'main', year, site, tag, chapter (number), chapterTitle, headline, context, facts[], conflict, uncertainty, stakeholders[], variants:[{if, text}] (prepended to context), onPresent:[{if, effects, text}] (applied when shown), choices[3], academic:{chapter, chapterTitle, topic, lesson, debrief}`.
- **Consequence (C)**: `id, year, priority, trigger, headline, text, facts[]`, and either `choices[2]` or `info:[{if, effects, setFlags, text}]` (notice; effects apply when shown). Max one C per year (highest `priority`), shown before the main event.
- **Random (R)**: `id, years:[from,to], tag, precondition, illustrates, weight, weightMods:[{if, mul}], headline, text, choices[2]`.

## Rules implemented (GDD §3, §5, §6, §7)

- Year start: pending effects due → income `max(5, base + round((PROD-50)/15) - round(DEBT/15))` (rounded, so there is no cliff at DEBT 0→1) → if 2+ consecutive deficit years, `LIFE-2 TRUST-2`.
- An option is enabled only if `BUDGET - cost >= -10`. Disabled options get a fallback “Thí điểm / phân kỳ” option (`<id>-P`): cost ×0.5 (capped by what is affordable); positive effects × `min(0.5, actualCost/fullCost)` so a pilot paid with 1 of 20 gets ~1/20 of the benefit; negative effects unchanged.
- Implementation quality (fallback ratio × low-capacity 0.6) is stored with the choice and also scales its *delayed* positive effects.
- End of year: `BUDGET<0` → `DEBT += 2×|BUDGET|`, `BUDGET = 0` (deficit financed by borrowing); clamp; crisis check.
- Random events: from year 2, after the main result, max 3/session, each once, not the same tag as last year's random, not in a year where an interactive C node was shown. Events whose `illustrates` holds are drawn first (chance 0.70), else chance 0.35 among all eligible. RNG = `mulberry32(seed ^ (year+1)·0x9e3779b1)`: the draw depends only on seed + state, so undo/redo never rerolls.
- Early crisis: `LAW<=15 && TRUST<=15` (institutional) or `LIFE<=12 && PROD<=15` (livelihood). Streaks are counted **per type** (`state.crisisStreak`); the same type at two consecutive year ends → `finalRepair` (once). Resolved only if **every** crisis type is out of the zone by a margin of 3; otherwise E6. After a successful repair the game continues; E1 stays possible unless the repair happened in the final year.
- Endings at year 8: E6 if the crisis was not overcome; else among E2/E3/E4 that hold, the **most severe** (deepest shortfall in metric points, ties in GDD order) is primary and the others become `ending.secondary`; else E1; else E5 with `ending.variant` = `near` (≤6 points from E1), `uneven` (some metric < 40) or `stalled`.

## Balancing checks

- `npm run test:sim` — boundary tests (income steps, fallback ratio, capacity 34/35 incl. delayed effects, per-type crisis streaks, E1/E5 thresholds, mixed endings).
- `npm run sim` — boundary tests + Monte Carlo over 8 strategies (incl. `crisisRepair`) with design-target assertions.
- `npm run exhaustive` — every decision path with random events off (~20k paths), ending shares and share by Y1 choice.

## Deviations from the docs (all documented in data comments)

- Start `BUDGET=0`, base income 8, debt step 15 (docs: 60 / 12 / 25) — tuned so the budget binds and blind always-A does not beat a budget-aware player.
- Expedient choices (Y1-C, Y2-B, Y2-C, Y3-B, Y4-B, Y4-C, Y6-B, Y7-B, Y7-C, C02-B, R03-B, R04-B, R06-B) carry small negative `cap`, otherwise CAPACITY could never fall below 35.
- Pending effects the doc dates to the same year as the flag they depend on are moved one year later (Y1-A → Y4, Y3-A/B → Y7).
- C05 trigger drops `CARE_GAP` (only settable in Y8 itself).
- Paid variants (“trừ khi cấp thêm cost”) are applied automatically as a higher cost with a note.
