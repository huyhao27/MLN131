import { makeRng } from '../core/rng.js';

const KINDS = ['thief', 'route', 'cake'];
const EVIDENCE = [
  ['Nơi xuất hiện', ['Kho hàng', 'Bến xe', 'Nhà máy', 'Chợ', 'Bến cảng', 'Hợp tác xã']],
  ['Giờ ghi nhận', ['17:40', '17:50', '18:00', '18:10', '18:20', '18:30']],
  ['Phương tiện', ['Xe đạp', 'Xe máy', 'Xe tải', 'Xe buýt', 'Đi bộ', 'Xe kéo']],
  ['Dấu niêm phong', ['Tròn', 'Vuông', 'Tam giác', 'Ngôi sao', 'Bán nguyệt', 'Chữ thập']],
  ['Vật mang theo', ['Ống đựng bản đồ', 'Hộp dụng cụ', 'Túi vải', 'Thùng gỗ', 'Ba lô', 'Giỏ đan']],
];
const SUSPECT_COUNT = 12;
export const PORTRAIT_COUNT = 6 * 8 * 8 * 5 * 4;

function thief(seed, period, rng) {
  const portraits = makeRng(`${seed}:portraits`);
  const offset = portraits.int(0, PORTRAIT_COUNT - 1);
  const first = Math.floor((period - 1) / KINDS.length) * SUSPECT_COUNT;
  const clues = EVIDENCE.map(([label, values]) => {
    const a = rng.int(0, values.length - 1);
    const b = (a + rng.int(1, values.length - 1)) % values.length;
    return { label, allowed: [values[a], values[b]].sort(), excluded: values.filter((_, i) => i !== a && i !== b) };
  });
  // Exactly one card fits. Each clue has a decoy that passes every other clue.
  const culprit = rng.int(0, SUSPECT_COUNT - 1);
  const suspects = Array.from({ length: SUSPECT_COUNT }, (_, id) => {
    const relative = (id - culprit + SUSPECT_COUNT) % SUSPECT_COUNT;
    const wrong = (relative - 1) % clues.length;
    const second = (wrong + rng.int(1, clues.length - 1)) % clues.length;
    return {
      id,
      portrait: (offset + (first + id) * 317) % PORTRAIT_COUNT,
      evidence: clues.map(({ allowed, excluded }, i) =>
        rng.pick(i === wrong || (relative > clues.length && i === second) ? excluded : allowed)),
    };
  });
  return { kind: 'thief', suspects, clues: clues.map(({ label, allowed }) => ({ label, allowed })) };
}

function neighbors(tile, size) {
  const x = tile % size;
  const y = Math.floor(tile / size);
  return [x > 0 && tile - 1, x < size - 1 && tile + 1, y > 0 && tile - size, y < size - 1 && tile + size]
    .filter(n => n !== false);
}

function route(rng) {
  const size = 13;
  const start = 0;
  let longest = [start];
  const open = new Set([start]);
  // Grow a maze tree from the start, with walls between logical cells.
  const path = [start];
  while (path.length) {
    const tile = path.at(-1);
    const next = rng.pick(neighbors(tile, size).flatMap(mid => {
      const dest = mid + (mid - tile);
      return neighbors(mid, size).includes(dest) && !open.has(dest) ? [[mid, dest]] : [];
    }));
    if (!next) {
      path.pop();
      path.pop();
      continue;
    }
    open.add(next[0]);
    open.add(next[1]);
    path.push(...next);
    if (path.length > longest.length) longest = [...path];
  }
  // A farthest leaf is the finish. Both stops lie on its unique path from the start.
  const limit = longest.length - 1;
  const goal = longest.at(-1);
  const checkpoints = [longest[Math.floor(limit / 3)], longest[Math.floor(2 * limit / 3)]];
  return {
    kind: 'route', size, start, goal, checkpoints, limit,
    blocked: Array.from({ length: size * size }, (_, i) => i).filter(i => !open.has(i)),
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
    return suspect ? { solved: challenge.clues.every(({ allowed }, i) => allowed.includes(suspect.evidence[i])) } : null;
  }
  if (challenge.kind === 'route') {
    if (!Array.isArray(submission) || submission.length > challenge.limit) return null;
    let tile = challenge.start;
    let visited = 0;
    for (const next of submission) {
      if ((tile === challenge.goal && visited === challenge.checkpoints.length) || !neighbors(tile, challenge.size).includes(next) || challenge.blocked.includes(next)) return null;
      if (next === challenge.goal && visited !== challenge.checkpoints.length) return null;
      tile = next;
      if (tile === challenge.checkpoints[visited]) visited++;
    }
    return { solved: tile === challenge.goal && visited === challenge.checkpoints.length, tile, visited };
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

