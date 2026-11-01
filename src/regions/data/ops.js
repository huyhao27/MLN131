// Small declarative vocabulary for event/option effects. The engine interprets these;
// content never runs arbitrary code except condition functions over a read-only context.
//
// Durations: `n` = number of periods the change is active, counting the period it starts in.

export const mod = (key, v, n = 1, op = 'add', extra = {}) =>
  typeof op === 'object' ? { t: 'mod', key, v, n, op: 'add', ...op } : { t: 'mod', key, v, n, op, ...extra };
export const mul = (key, v, n = 1, extra = {}) => mod(key, v, n, 'mul', extra);
// A change that stays until removed with `untag(name)` (e.g. a broken plant until repaired).
export const until = (name, key, v, op = 'mul') => ({ t: 'mod', key, v, n: 99, op, tag: name });
export const untag = (name) => ({ t: 'untag', name });
export const delta = (region, ind, v) => ({ t: 'delta', region, ind, v });
export const pot = (region, ind, v) => ({ t: 'pot', region, ind, v });
export const res = (key, v) => ({ t: 'res', key, v });
// Lower a stock to at most `v` (e.g. a drought takes the lake down to a low mark).
export const lowerTo = (key, v) => ({ t: 'res', key, v, cap: true });
export const cash = (v) => ({ t: 'cash', v });
export const build = (key) => ({ t: 'build', key });
export const news = (text, tone = 'neutral') => ({ t: 'news', text, tone });
export const flag = (name, n = 99) => mod(`flag.${name}`, 1, n);
export const when = (cond, ops, otherwise = []) => ({ t: 'when', if: cond, ops, otherwise });
// Schedule more ops `inN` periods later (applied at that period's start).
export const later = (inN, ops) => ({ t: 'later', in: inN, ops });
export const spawn = (id, region) => ({ t: 'spawn', id, region });
