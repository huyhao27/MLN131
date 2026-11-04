import { playChallenge } from '../../regions/challenges.js';

const guides = {
  route: ['Luồn xe qua phố', 'Đưa xe đến cờ đích trong 8 bước. Chỉ đi sang ô kề cạnh và tránh rào chắn.'],
  cargo: ['Chốt chuyến hàng', 'Chọn đúng 3 kiện có tổng cân nặng bằng tải mục tiêu. Bấm lại kiện để bỏ chọn.'],
  switches: ['Bật đèn cả dãy', 'Bật sáng cả 5 đèn trong 3 lượt. Mỗi nút đảo đèn của nó và hai đèn kế bên.'],
};

function routeTiles(challenge, state, moves) {
  return Array.from({ length: 16 }, (_, i) => {
    const blocked = challenge.blocked.includes(i);
    const glyph = state.tile === i ? '🚚' : blocked ? '🚧' : i === 15 ? '🏁' : '·';
    const enabled = playChallenge(challenge, [...moves, i]);
    const label = `Hàng ${Math.floor(i / 4) + 1}, cột ${i % 4 + 1}${blocked ? ', có rào' : i === 15 ? ', đích' : ''}`;
    return `<button type="button" class="rg-game-tile" data-move="${i}" aria-label="${label}" ${enabled ? '' : 'disabled'}>${glyph}</button>`;
  }).join('');
}

export function openChallenge(root, challenge, confirm) {
  const dialog = document.createElement('dialog');
  dialog.className = 'rg-challenge';
  dialog.setAttribute('aria-label', guides[challenge.kind][0]);
  root.append(dialog);
  let moves = [];

  function render(focus) {
    const state = playChallenge(challenge, moves);
    let tiles, status;
    if (challenge.kind === 'route') {
      tiles = routeTiles(challenge, state, moves);
      status = `Còn ${challenge.limit - moves.length} bước`;
    } else if (challenge.kind === 'cargo') {
      tiles = challenge.weights.map((weight, i) => {
        const picked = moves.includes(i);
        return `<button type="button" class="rg-game-tile" data-move="${i}" aria-pressed="${picked}" ${moves.length === 3 && !picked ? 'disabled' : ''}>📦 ${weight}</button>`;
      }).join('');
      status = `Đã chọn ${moves.length}/3 kiện · ${state.total} / ${challenge.target} kg`;
    } else {
      tiles = state.board.map((on, i) => `<button type="button" class="rg-game-tile" data-move="${i}" aria-label="Đèn ${i + 1}, ${on ? 'sáng' : 'tắt'}" aria-pressed="${on}" ${state.solved || moves.length === challenge.limit ? 'disabled' : ''}>${on ? '💡' : '⚫'}</button>`).join('');
      status = `Còn ${challenge.limit - moves.length} lượt bật`;
    }
    const [title, guide] = guides[challenge.kind];
    dialog.innerHTML = `
      <div class="rg-game-kicker">🎮 Việc nhanh tại hiện trường</div>
      <h2>${title}</h2>
      <p>${guide}</p>
      <div class="rg-game-board is-${challenge.kind}">${tiles}</div>
      <p class="rg-game-status" aria-live="polite">${state.solved ? 'Xong rồi! Áp dụng phương án và tiết kiệm 1 ngân sách.' : status}</p>
      <div class="rg-game-actions">
        ${state.solved ? '<button type="button" class="rg-btn is-primary" data-game="apply">Áp dụng và nhận thưởng</button>' : ''}
        <button type="button" class="rg-btn" data-game="reset">Chơi lại</button>
        <button type="button" class="rg-btn" data-game="skip">Áp dụng luôn</button>
        <button type="button" class="rg-btn" data-game="cancel">Quay lại</button>
      </div>`;
    if (focus) {
      const next = dialog.querySelector('[data-game="apply"]') || dialog.querySelector(`[data-move="${focus}"]:not(:disabled)`) ||
        dialog.querySelector('[data-move]:not(:disabled)') || dialog.querySelector('[data-game="reset"]');
      next.focus();
    }
  }

  dialog.addEventListener('click', (e) => {
    const button = e.target.closest('button');
    if (!button) return;
    if (button.dataset.move !== undefined) {
      const i = Number(button.dataset.move);
      const next = challenge.kind === 'cargo' && moves.includes(i) ? moves.filter(n => n !== i) : [...moves, i];
      if (playChallenge(challenge, next)) { moves = next; render(String(i)); }
      return;
    }
    switch (button.dataset.game) {
      case 'reset': moves = []; render('0'); break;
      case 'apply':
        if (playChallenge(challenge, moves)?.solved) { dialog.close(); confirm(moves); }
        break;
      case 'skip': dialog.close(); confirm(); break;
      case 'cancel': dialog.close(); break;
    }
  });
  dialog.addEventListener('close', () => dialog.remove(), { once: true });
  render();
  dialog.showModal();
}
