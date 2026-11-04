import { makeRng } from '../core/rng.js';

export function challengeFor(seed, problem, option, kind) {
  if (!kind) return null;
  const rng = makeRng(`${seed}:${problem}:${option}:challenge`);
  if (kind === 'route') {
    // Keep a guaranteed path, then scatter roadblocks on the other tiles.
    const path = [0];
    let x = 0, y = 0;
    while (x + y < 6) {
      if (y === 3 || (x < 3 && rng() < 0.5)) x++;
      else y++;
      path.push(y * 4 + x);
    }
    return { kind, blocked: Array.from({ length: 16 }, (_, i) => i).filter(i => !path.includes(i) && rng() < 0.65), limit: 8 };
  }
  if (kind === 'cargo') {
    const weights = Array.from({ length: 6 }, () => rng.int(1, 8));
    const indices = weights.map((_, i) => i);
    const target = Array.from({ length: 3 }, () => weights[indices.splice(rng.int(0, indices.length - 1), 1)[0]]).reduce((a, b) => a + b, 0);
    return { kind, weights, target, limit: 3 };
  }
  const board = Array(5).fill(true);
  const first = rng.int(0, 4);
  const second = (first + rng.int(1, 4)) % 5;
  toggle(board, first);
  toggle(board, second);
  return { kind, board, limit: 3 };
}

function toggle(board, index) {
  for (const n of [index - 1, index, index + 1]) {
    if (n >= 0 && n < board.length) board[n] = !board[n];
  }
}

export function playChallenge(challenge, moves = []) {
  if (!challenge || !Array.isArray(moves) || moves.length > challenge.limit || !moves.every(Number.isInteger)) return null;
  if (challenge.kind === 'route') {
    let tile = 0;
    for (const next of moves) {
      const distance = Math.abs(tile % 4 - next % 4) + Math.abs(Math.floor(tile / 4) - Math.floor(next / 4));
      if (tile === 15 || next < 0 || next > 15 || distance !== 1 || challenge.blocked.includes(next)) return null;
      tile = next;
    }
    return { tile, solved: tile === 15 };
  }
  if (challenge.kind === 'cargo') {
    if (new Set(moves).size !== moves.length || moves.some(i => i < 0 || i >= challenge.weights.length)) return null;
    const total = moves.reduce((sum, i) => sum + challenge.weights[i], 0);
    return { total, solved: moves.length === 3 && total === challenge.target };
  }
  const board = [...challenge.board];
  for (const i of moves) {
    if (i < 0 || i >= board.length || board.every(Boolean)) return null;
    toggle(board, i);
  }
  return { board, solved: board.every(Boolean) };
}
