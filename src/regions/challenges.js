import { makeRng } from '../core/rng.js';

const KINDS = ['thief', 'route', 'cake'];
const LOCATIONS = ['Kho hàng', 'Bến xe', 'Nhà máy', 'Chợ', 'Bến cảng', 'Hợp tác xã'];
const TIMES = ['06:00', '09:00', '12:00', '15:00', '18:00', '21:00'];
export const PORTRAIT_COUNT = 6 * 8 * 8 * 5 * 4;

function thief(seed, period, rng) {
  const portraits = makeRng(`${seed}:portraits`);
  const offset = portraits.int(0, PORTRAIT_COUNT - 1);
  // This stride is coprime with the pool size, so each index gets a different portrait.
  const first = Math.floor((period - 1) / KINDS.length) * 6;
  const culprit = rng.int(0, 5);
  const location = rng.int(0, 5);
  const time = rng.int(0, 5);
  const suspects = Array.from({ length: 6 }, (_, id) => {
    const relative = (id - culprit + 6) % 6;
    return {
      id,
      portrait: (offset + (first + id) * 317) % PORTRAIT_COUNT,
      location: LOCATIONS[(location + (relative >= 3 ? rng.int(1, 5) : 0)) % 6],
      time: TIMES[(time + (relative > 0 && relative <= 3 ? rng.int(1, 5) : 0)) % 6],
    };
  });
  return { kind: 'thief', suspects, location: LOCATIONS[location], time: TIMES[time] };
}

function neighbors(tile, size) {
  const x = tile % size;
  const y = Math.floor(tile / size);
  return [x > 0 && tile - 1, x < size - 1 && tile + 1, y > 0 && tile - size, y < size - 1 && tile + size]
    .filter(n => n !== false);
}

function route(rng) {
  const size = 7;
  const start = 0;
  const goal = size * size - 1;
  // Backtracking over logical cells leaves one route between any two open tiles.
  // Keep the lower-left corner as a reachable dead end off the goal route.
  const deadEnd = size * (size - 1);
  const open = new Set([start, deadEnd, deadEnd + 1]);
  const path = [start];
  let solution;
  while (path.length) {
    const tile = path.at(-1);
    const next = rng.pick(neighbors(tile, size)
      .flatMap(mid => {
        const dest = mid + (mid - tile);
        return neighbors(mid, size).includes(dest) && !open.has(mid) && !open.has(dest) ? [[mid, dest]] : [];
      }));
    if (!next) {
      path.pop();
      path.pop();
      continue;
    }
    for (const step of next) {
      open.add(step);
      path.push(step);
    }
    if (next[1] === goal) solution = [...path];
  }
  return {
    kind: 'route', size, start, goal,
    blocked: Array.from({ length: size * size }, (_, i) => i).filter(i => !open.has(i)),
    limit: solution.length + 1,
  };
}

export function businessChallenge(seed, period) {
  const kind = KINDS[(period - 1) % KINDS.length];
  const rng = makeRng(`${seed}:${period}:business`);
  if (kind === 'thief') return thief(seed, period, rng);
  if (kind === 'route') return route(rng);
  return { kind: 'cake' };
}

export function evaluateBusiness(challenge, submission) {
  if (challenge.kind === 'thief') {
    const suspect = challenge.suspects.find(s => s.id === submission);
    return suspect ? { solved: suspect.location === challenge.location && suspect.time === challenge.time } : null;
  }
  if (challenge.kind === 'route') {
    if (!Array.isArray(submission) || submission.length > challenge.limit) return null;
    let tile = challenge.start;
    for (const next of submission) {
      if (tile === challenge.goal || !neighbors(tile, challenge.size).includes(next) || challenge.blocked.includes(next)) return null;
      tile = next;
    }
    return { solved: tile === challenge.goal, tile };
  }
  if (!Array.isArray(submission) || submission.length !== 2 || !submission.every(p =>
    Array.isArray(p) && p.length === 2 && p.every(Number.isFinite) && Math.abs(Math.hypot(...p) - 1) < 1e-6)) return null;
  const [[ax, ay], [bx, by]] = submission;
  const length = Math.hypot(ax - bx, ay - by);
  if (length < 1e-6) return null;
  const distance = Math.min(1, Math.abs(ax * by - ay * bx) / length);
  const share = (Math.acos(distance) - distance * Math.sqrt(1 - distance ** 2)) / Math.PI;
  return { solved: share >= 0.45 - 1e-12, share };
}

