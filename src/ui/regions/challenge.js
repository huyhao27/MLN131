import { evaluateBusiness } from '../../regions/challenges.js';

export const BUSINESS_TITLES = {
  thief: 'Ai là kẻ trộm?',
  route: 'Tìm đường đến đích',
  cake: 'Chia bánh làm đôi',
};

const GUIDES = {
  thief: 'So từng hàng với dấu vết ở đầu cột. Vuốt bảng sang ngang nếu thiếu cột. Bạn chỉ được chốt một người.',
  route: 'Ghé trạm 1 rồi trạm 2 trước khi tới cờ đích. Số bước vừa đủ cho đường ngắn nhất. Chọn ô kề hoặc dùng phím mũi tên.',
  cake: 'Chọn hai điểm trên viền để vạch một đường cắt. Bạn cũng có thể chỉnh hai đầu cắt bằng bàn phím. Phần nhỏ hơn phải đạt ít nhất 45%.',
};

function portrait(id) {
  const skin = ['#f5c7a6', '#dc9875', '#a5664a', '#724735', '#c48054', '#edb58c'][id % 6];
  const hair = Math.floor(id / 6) % 8;
  const shirt = ['#296b72', '#973e48', '#7258a1', '#815127', '#326444', '#48587b', '#b45a2f', '#a43d70'][Math.floor(id / 48) % 8];
  const face = Math.floor(id / 384) % 5;
  const accessory = Math.floor(id / 1920) % 4;
  const hairstyles = [
    'M26 44Q24 10 61 16Q83 22 77 44L67 30Q44 40 29 38Z',
    'M24 47Q21 14 53 13Q86 13 79 49L69 31L62 41L50 29L37 39Z',
    'M23 49V34Q24 11 52 11Q79 13 80 35V53L71 49V32H32V49Z',
    'M26 43Q15 18 36 17Q43 5 53 15Q68 6 74 22Q88 25 77 46L70 34Q52 25 29 39Z',
    'M24 43Q24 10 56 13Q80 13 80 47Q68 26 52 29Q37 36 24 43Z',
    'M27 35Q32 20 50 19Q70 19 75 35Q52 26 27 35Z',
    'M22 45Q23 14 54 12Q83 13 81 42L68 36L65 25L54 38L48 31Z',
    'M22 43L26 24Q46 7 75 20L82 39L60 28L56 36L41 32Z',
  ];
  const extras = [
    '',
    '<path d="M30 46h16v10H30zm24 0h16v10H54zM46 50h8" fill="none" stroke="#241e26" stroke-width="2"/>',
    '<circle cx="25" cy="59" r="4" fill="#f5cd59"/>',
    '<path d="M40 67q10 17 20 0l-10 4z" fill="#352a2e"/>',
  ];
  return `<svg class="rg-portrait" viewBox="0 0 100 100" aria-hidden="true">
    <rect width="100" height="100" rx="12" fill="#dfd5ba"/>
    <path d="M10 100Q11 79 40 76H60Q89 79 90 100Z" fill="${shirt}"/>
    <path d="M43 66h14v15q-7 7-14 0z" fill="${skin}"/>
    <ellipse cx="50" cy="49" rx="${21 + face}" ry="${25 - face}" fill="${skin}"/>
    <path d="${hairstyles[hair]}" fill="${hair % 2 ? '#463234' : '#262835'}"/>
    <path d="M38 49h3m18 0h3M45 62q5 ${2 + face} 10 0" stroke="#392931" stroke-width="2" fill="none" stroke-linecap="round"/>
    ${extras[accessory]}
  </svg>`;
}

function tileButtons(challenge, moves) {
  const state = evaluateBusiness(challenge, moves);
  return Array.from({ length: challenge.size ** 2 }, (_, i) => {
    const blocked = challenge.blocked.includes(i);
    const checkpoint = challenge.checkpoints.indexOf(i);
    const marker = blocked ? 'is-wall' : state.tile === i ? 'is-car' : checkpoint === state.visited ? 'is-target' :
      checkpoint >= 0 ? (checkpoint < state.visited ? 'is-visited' : 'is-checkpoint') : i === challenge.goal ? 'is-finish' : '';
    const glyph = state.tile === i ? '🚚' : blocked ? '' : i === challenge.goal ? '🏁' :
      checkpoint >= 0 ? (checkpoint < state.visited ? '✓' : checkpoint + 1) : '';
    const enabled = !blocked && evaluateBusiness(challenge, [...moves, i]);
    const label = `Hàng ${Math.floor(i / challenge.size) + 1}, cột ${i % challenge.size + 1}${state.tile === i ? ', vị trí xe' : ''}${blocked ? ', có rào' : i === challenge.goal ? ', đích' : checkpoint >= 0 ? ', trạm ' + (checkpoint + 1) : ''}`;
    return `<button type="button" class="rg-game-tile ${marker}" data-move="${i}" aria-label="${label}" ${enabled ? '' : 'disabled'}>${glyph}</button>`;
  }).join('');
}

function cakePoint(degrees) {
  const angle = degrees * Math.PI / 180;
  return [Math.cos(angle), Math.sin(angle)];
}

export function openChallenge(root, challenge, finish) {
  const dialog = document.createElement('dialog');
  dialog.className = 'rg-challenge rg-' + challenge.kind + '-dialog';
  dialog.setAttribute('aria-label', BUSINESS_TITLES[challenge.kind]);
  root.append(dialog);
  const moves = [];
  const angles = [33, 252];
  let endpoint = 0;
  let submitted = false;
  let suspect;

  function submit(value) {
    if (submitted) return;
    submitted = true;
    dialog.close();
    finish(value);
  }

  function renderRoute() {
    dialog.querySelector('.rg-game-board').innerHTML = tileButtons(challenge, moves);
    const { visited } = evaluateBusiness(challenge, moves);
    dialog.querySelector('.rg-game-status').textContent = `Còn ${challenge.limit - moves.length} bước · Tiếp theo: ${visited < 2 ? 'Trạm ' + (visited + 1) : 'Về đích'}`;
  }

  function renderCut() {
    const [a, b] = angles.map(cakePoint);
    const line = dialog.querySelector('line');
    for (const [index, [x, y]] of [a, b].entries()) {
      line.setAttribute('x' + (index + 1), 100 + 84 * x);
      line.setAttribute('y' + (index + 1), 100 + 84 * y);
      dialog.querySelectorAll('[data-endpoint]')[index].value = angles[index];
    }
  }

  const boards = {
    thief: () => `<div class="rg-case-table" tabindex="0" role="region" aria-label="Bảng đối chiếu nghi phạm">
      <table>
        <thead><tr><th scope="col">Nghi phạm</th>${challenge.clues.map(({ label, allowed }) =>
          `<th scope="col"><b>${label}</b><small>${allowed.join('<br>hoặc ')}</small></th>`).join('')}</tr></thead>
        <tbody>${challenge.suspects.map(s => `<tr><th scope="row">
          <button type="button" class="rg-case-suspect" data-move="${s.id}" aria-pressed="false">
            ${portrait(s.portrait)}<span>Số ${s.id + 1}</span>
          </button></th>${s.evidence.map(value => `<td>${value}</td>`).join('')}</tr>`).join('')}</tbody>
      </table></div>`,
    route: () => `<p class="rg-game-status" aria-live="polite"></p>
      <div class="rg-game-board is-route" role="group" aria-label="Mê cung, dùng phím mũi tên hoặc chọn ô kề" tabindex="0"></div>`,
    cake: () => `<svg class="rg-cake" viewBox="0 0 200 200" aria-hidden="true">
      <circle cx="100" cy="100" r="84" fill="#c6844f"/>
      <circle cx="100" cy="100" r="78" fill="#f2c58e" stroke="#fff0c8" stroke-width="5" stroke-dasharray="3 8"/>
      <line stroke="#694338" stroke-width="3" stroke-linecap="round"/>
      </svg><div class="rg-cake-controls">
        <label>Đầu cắt 1 <input type="range" min="0" max="359" data-endpoint></label>
        <label>Đầu cắt 2 <input type="range" min="0" max="359" data-endpoint></label>
      </div>`,
  };

  dialog.innerHTML = `<div class="rg-game-kicker">Giả lập kinh doanh · Một lượt</div>
    <h2>${BUSINESS_TITLES[challenge.kind]}</h2><p>${GUIDES[challenge.kind]}</p>
    ${boards[challenge.kind]()}
    <div class="rg-game-actions">
      ${challenge.kind === 'cake' ? '<button type="button" class="rg-btn is-primary" data-game="cut">Chốt đường cắt</button>' : ''}
      ${challenge.kind === 'thief' ? '<span class="rg-case-selection" aria-live="polite">Chưa chọn nghi phạm</span><button type="button" class="rg-btn is-primary" data-game="accuse" disabled>Chốt nghi phạm</button>' : ''}
      <button type="button" class="rg-btn" data-game="quit">Bỏ lượt</button>
    </div>`;

  if (challenge.kind === 'route') renderRoute();
  if (challenge.kind === 'cake') {
    renderCut();
    dialog.querySelectorAll('[data-endpoint]').forEach((input, i) => {
      input.addEventListener('input', () => { angles[i] = Number(input.value); renderCut(); });
    });
    dialog.querySelector('.rg-cake').addEventListener('click', e => {
      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left - rect.width / 2;
      const y = e.clientY - rect.top - rect.height / 2;
      if (Math.hypot(x, y) < rect.width / 8) return;
      angles[endpoint] = (Math.round(Math.atan2(y, x) * 180 / Math.PI) + 360) % 360;
      endpoint = 1 - endpoint;
      renderCut();
    });
  }

  dialog.addEventListener('click', e => {
    const button = e.target.closest('button') || e.target.closest('.rg-case-table tbody tr')?.querySelector('button');
    if (!button) return;
    if (button.dataset.game === 'quit') return quit();
    if (button.dataset.game === 'accuse') return submit(suspect);
    if (button.dataset.game === 'cut') return submit(angles.map(cakePoint));
    if (button.dataset.move === undefined) return;
    const i = Number(button.dataset.move);
    if (challenge.kind === 'thief') {
      suspect = i;
      const previous = dialog.querySelector('[aria-pressed="true"]');
      previous?.setAttribute('aria-pressed', 'false');
      previous?.closest('tr').classList.remove('is-picked');
      button.setAttribute('aria-pressed', 'true');
      button.closest('tr').classList.add('is-picked');
      dialog.querySelector('.rg-case-selection').textContent = 'Đã chọn số ' + (i + 1);
      dialog.querySelector('[data-game="accuse"]').disabled = false;
      return;
    }
    move(i);
  });

  function move(i) {
    const result = evaluateBusiness(challenge, [...moves, i]);
    if (!result) return;
    moves.push(i);
    if (result.solved || moves.length === challenge.limit) return submit(moves);
    renderRoute();
    dialog.querySelector('.is-route').focus({ preventScroll: true });
  }

  function quit() {
    if (challenge.kind !== 'route' || window.confirm('Bỏ lượt lái xe kỳ này?')) submit(null);
  }

  if (challenge.kind === 'route') {
    dialog.addEventListener('keydown', e => {
      const offsets = { ArrowUp: -challenge.size, ArrowDown: challenge.size, ArrowLeft: -1, ArrowRight: 1 };
      const offset = offsets[e.key];
      if (!offset) return;
      e.preventDefault();
      if (e.repeat) return;
      move(evaluateBusiness(challenge, moves).tile + offset);
    });
  }
  dialog.addEventListener('cancel', e => { e.preventDefault(); quit(); });
  dialog.addEventListener('close', () => dialog.remove(), { once: true });
  dialog.showModal();
  dialog.querySelector('.is-route')?.focus({ preventScroll: true });
}
