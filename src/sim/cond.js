// Tiny condition language used by the content data.
//   'WAGE_SHOCK && PROD<50'   'latent_discontent>=2 || !CONSULT_REAL'   '(A || B) && CAPACITY>=40'
// Identifiers:
//   PROD LIFE TRUST LAW EQUITY COHESION      -> metric value
//   BUDGET CAPACITY DEBT                      -> resource value
//   YEAR, latent_discontent, ...counters      -> number
//   seen:R01                                  -> node R01 has been shown this session
//   chose:Y1-A                                -> option Y1-A was chosen
//   true / false                              -> literals
//   anything else (UPPER_CASE)                -> flag is set
import { METRIC_KEYS, RESOURCE_KEYS, COUNTER_KEYS } from '../data/config.js';

const NUMERIC = new Set([...METRIC_KEYS, ...RESOURCE_KEYS, ...COUNTER_KEYS, 'YEAR']);
const TOKEN = /\s*(&&|\|\||>=|<=|==|!=|>|<|!|\(|\)|-?\d+(?:\.\d+)?|[A-Za-z_][\w:.-]*)/y;

function tokenize(src) {
  const out = [];
  TOKEN.lastIndex = 0;
  let m;
  while (TOKEN.lastIndex < src.length) {
    const start = TOKEN.lastIndex;
    m = TOKEN.exec(src);
    if (!m) {
      if (/^\s*$/.test(src.slice(start))) break;
      throw new Error(`cond: bad token near "${src.slice(start)}" in "${src}"`);
    }
    out.push(m[1]);
  }
  return out;
}

function parse(src) {
  const toks = tokenize(src);
  let i = 0;
  const peek = () => toks[i];
  const next = () => toks[i++];
  const expect = (t) => {
    if (next() !== t) throw new Error(`cond: expected "${t}" in "${src}"`);
  };

  function operand() {
    const t = next();
    if (t === undefined) throw new Error(`cond: unexpected end in "${src}"`);
    if (/^-?\d/.test(t)) return { k: 'num', v: Number(t) };
    if (t === 'true' || t === 'false') return { k: 'bool', v: t === 'true' };
    if (t.startsWith('seen:')) return { k: 'seen', v: t.slice(5) };
    if (t.startsWith('chose:')) return { k: 'chose', v: t.slice(6) };
    if (NUMERIC.has(t)) return { k: 'var', v: t };
    if (/^[A-Z][A-Z0-9_]*$/.test(t)) return { k: 'flag', v: t };
    throw new Error(`cond: unknown identifier "${t}" in "${src}"`);
  }
  function primary() {
    if (peek() === '(') {
      next();
      const e = orExpr();
      expect(')');
      return e;
    }
    const a = operand();
    const op = peek();
    if (['>=', '<=', '==', '!=', '>', '<'].includes(op)) {
      next();
      return { k: 'cmp', op, a, b: operand() };
    }
    return a;
  }
  function unary() {
    if (peek() === '!') {
      next();
      return { k: 'not', e: unary() };
    }
    return primary();
  }
  function andExpr() {
    let e = unary();
    while (peek() === '&&') {
      next();
      e = { k: 'and', a: e, b: unary() };
    }
    return e;
  }
  function orExpr() {
    let e = andExpr();
    while (peek() === '||') {
      next();
      e = { k: 'or', a: e, b: andExpr() };
    }
    return e;
  }
  const ast = orExpr();
  if (i !== toks.length) throw new Error(`cond: trailing tokens in "${src}"`);
  return ast;
}

function value(n, s) {
  switch (n.k) {
    case 'num':
    case 'bool':
      return n.v;
    case 'var':
      if (n.v === 'YEAR') return s.year;
      if (n.v in s.metrics) return s.metrics[n.v];
      if (n.v in s.resources) return s.resources[n.v];
      return s.counters[n.v] ?? 0;
    case 'flag':
      return s.flags.includes(n.v);
    case 'seen':
      return s.seen.includes(n.v);
    case 'chose':
      return s.history.some((h) => h.choiceId === n.v || h.baseChoiceId === n.v);
    default:
      return evalAst(n, s);
  }
}

function evalAst(n, s) {
  switch (n.k) {
    case 'and':
      return !!evalAst(n.a, s) && !!evalAst(n.b, s);
    case 'or':
      return !!evalAst(n.a, s) || !!evalAst(n.b, s);
    case 'not':
      return !evalAst(n.e, s);
    case 'cmp': {
      const a = value(n.a, s), b = value(n.b, s);
      switch (n.op) {
        case '>=': return a >= b;
        case '<=': return a <= b;
        case '>': return a > b;
        case '<': return a < b;
        case '==': return a === b;
        case '!=': return a !== b;
      }
      return false;
    }
    default:
      return !!value(n, s);
  }
}

const cache = new Map();
function compiled(src) {
  let ast = cache.get(src);
  if (!ast) cache.set(src, (ast = parse(src)));
  return ast;
}

/** Evaluate a condition string against a sim state. Empty/undefined -> true. */
export function check(src, state) {
  if (src === undefined || src === null || src === '') return true;
  return !!evalAst(compiled(src), state);
}

/** Flags referenced by a condition (for validation). */
export function flagsIn(src) {
  if (!src) return [];
  const out = [];
  const walk = (n) => {
    if (!n) return;
    if (n.k === 'flag') out.push(n.v);
    walk(n.a); walk(n.b); walk(n.e);
  };
  walk(compiled(src));
  return out;
}

/** Throws on a syntax error. */
export function assertValid(src) {
  if (src) compiled(src);
}
