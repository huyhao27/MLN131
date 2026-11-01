import { RULES, METRIC_LABELS } from '../data/config.js';
import { esc, storageGet, storageSet } from './util.js';

const SEEN_KEY = 'tt.tutorial.v1';

export function tutorialSteps(view) {
  const r = RULES;
  if (view.year === 1 && view.phase === 'yearStart') return [
    { title: 'Đây là năm đầu tiên của bạn', target: '.tt-top', text: `Bạn vừa nhận ${view.budgetGain} ngân sách. Mỗi năm có một quyết định chính; đôi khi còn có hệ quả cũ hoặc biến cố. Đọc thông báo đầu năm, rồi bấm Tiếp tục để xem vấn đề cần giải quyết.` },
  ];
  if (view.year === 1 && view.phase === 'event') {
    const weakest = Object.entries(view.metrics).sort((a, b) => a[1] - b[1])[0];
    return [
      { title: 'Chăm lo cả sáu mặt', target: '.tt-metrics', text: `Sản xuất tạo nguồn lực; Đời sống phản ánh phúc lợi. Niềm tin, Pháp quyền, Công bằng và Đoàn kết tạo nền tảng xã hội. Hiện ${METRIC_LABELS[weakest[0]]} thấp nhất: ${weakest[1]}/100. Bấm từng chỉ số khi tự chơi để xem chi tiết.` },
      { title: 'Đọc vấn đề trước khi chọn', target: '.tt-card-scroll', text: 'Công nhân Thiên Hà đang ngừng việc vì thu nhập và điều kiện lao động. Doanh nghiệp cũng chịu áp lực do đơn hàng giảm. Hãy đọc dữ kiện, mâu thuẫn và thông tin còn thiếu: ai được lợi, ai chịu chi phí, điều gì chưa chắc chắn?' },
      { title: 'Cân nhắc chi phí, rồi tự quyết định', target: '.tt-choices', text: `Bạn có ${view.resources.BUDGET} ngân sách. Số dư sau chi không được thấp hơn ${r.minBalance}; phần âm cuối năm chuyển thành nợ với hệ số ×${r.deficitDebtFactor}. Điểm tăng giảm chỉ hiện sau khi chọn. Bấm phương án hoặc phím số bên cạnh; lựa chọn áp dụng ngay.`, last: 'Tôi sẽ tự chọn' },
    ];
  }
  if (view.year === 1 && view.phase === 'result') return [
    { title: 'Bạn vừa đánh đổi điều gì?', target: '.tt-deltas', text: 'Đọc các chỉ số tăng giảm và ngân sách đã chi, rồi xem nhóm nào hưởng lợi hoặc chịu chi phí. Áp lực nợ tăng là bất lợi. Đừng chỉ đếm điểm cộng: vấn đề nào đã được giải quyết, khó khăn nào mới xuất hiện?' },
    { title: 'Chính sách có trí nhớ', target: '.tt-card-scroll', text: view.scheduled?.length ? 'Di sản chính sách ghi lại cách bạn đã xử lý vấn đề. Hệ quả hẹn trước cho biết tác động có thể đến vào năm nào; một số cần điều kiện phù hợp. Hãy nhớ xem lại ở đầu năm sau.' : 'Phương án này không có hệ quả hẹn trước, nhưng di sản chính sách và tình hình hiện tại vẫn có thể thay đổi sự kiện, chi phí hoặc cơ hội sửa sai về sau.', last: 'Đã hiểu' },
  ];
  return [];
}

export function contextualHints(view) {
  const hints = [];
  const r = RULES;
  const add = (id, title, text) => hints.push({ id, title, text });
  if (view.phase === 'finalRepair') add('repair', 'Cơ hội phục hồi duy nhất', 'Đọc kỹ chi phí và tác dụng. Cứu vãn phải đưa mọi loại khủng hoảng ra khỏi vùng nguy hiểm; thất bại sẽ kết thúc ván.');
  else if (view.warning?.includes('Nguy cơ khủng hoảng')) add('crisis', 'Ưu tiên xử lý nguy cơ', 'Nếu cùng loại khủng hoảng tiếp tục đến cuối năm sau, bạn có thể phải dùng quyền cứu vãn duy nhất. Hãy xem các chỉ số nguy cấp trước khi chọn.');
  if (view.options?.some(o => o.disabled)) add('locked', 'Phương án vượt khả năng chi', `Số dư sau chi không được thấp hơn ${r.minBalance}. Hãy chọn phương án khác hoặc xem lựa chọn thí điểm/phân kỳ nếu được cung cấp.`);
  if (view.options?.some(o => o.fallbackFor)) add('pilot', 'Triển khai nhỏ hơn', `Thí điểm giảm chi phí và lợi ích theo tỷ lệ thực chi, tối đa ${r.fallbackEffectFactor * 100}% lợi ích đầy đủ. Tác động tiêu cực vẫn giữ nguyên.`);
  if (view.resources?.CAPACITY < r.lowCapacity) add('capacity', 'Bộ máy đang quá tải', `Năng lực thực thi dưới ${r.lowCapacity}: chính sách phức tạp chỉ giữ khoảng ${r.lowCapacityFactor * 100}% lợi ích, có làm tròn. Lợi ích trễ cũng chịu giảm; tác động tiêu cực giữ nguyên.`);
  if (view.phase === 'yearStart' && view.warning?.includes('thâm hụt')) add('deficit', 'Thâm hụt đã trở thành nợ', `Mỗi 1 ngân sách âm cuối năm tạo ${r.deficitDebtFactor} áp lực nợ. Hai năm thâm hụt liên tiếp làm giảm Đời sống và Niềm tin ở đầu năm kế tiếp. Nợ cao còn làm giảm nguồn thu.`);
  if (view.phase === 'consequence') add('consequence', 'Quyết định cũ đang quay trở lại', 'Đây là hệ quả của tình hình và chính sách trước đó. Nếu cần chi để xử lý, hãy cân nhắc cả nguồn lực cho quyết định chính của năm.');
  if (view.phase === 'random') add('random', 'Ứng phó thêm một việc trong năm', `Biến cố dùng chung ngân sách với quyết định chính. Một ván có tối đa ${r.random.maxPerSession} biến cố ngẫu nhiên; chính sách cũ và tình hình ảnh hưởng biến cố nào có thể xuất hiện.`);
  if (view.year === 2 && view.phase === 'yearStart') add('handoff', 'Từ đây, bạn tự điều hành', 'Mỗi năm: xem tình hình → đọc bản tin → cân nhắc chi phí → chọn chính sách → đọc hệ quả. Hãy điều chỉnh theo những gì đã xảy ra. Bạn luôn có thể mở Cách chơi.');
  if (view.phase === 'end') add('report', 'Tìm lý do phía sau kết cục', 'Xem mặt nào tiến bộ, mặt nào bị bỏ lại, quyết định bước ngoặt và hệ quả trễ. Chọn một quyết định bạn muốn thay đổi ở lần chơi sau và giải thích vì sao.');
  return hints;
}

export function createTutorial(ui, { guardInput, onStart }) {
  const tools = document.createElement('nav');
  tools.className = 'tt-help-tools';
  tools.setAttribute('aria-label', 'Hướng dẫn chơi');
  tools.innerHTML = '<button type="button" data-help>Cách chơi</button>';
  const dialog = document.createElement('dialog');
  dialog.className = 'tt-tutorial';
  dialog.setAttribute('aria-labelledby', 'tt-tutorial-title');
  const hint = document.createElement('aside');
  hint.className = 'tt-tutorial-hint';
  hint.hidden = true;
  hint.setAttribute('aria-label', 'Gợi ý cách chơi');
  ui.append(tools, dialog, hint);
  let view, guided = false, steps = [], index = 0, mode = '', opener;
  let seenPhases = new Set(), seenHints = new Set();

  function clearHighlight() {
    ui.querySelectorAll('.tt-tutorial-target').forEach(el => el.classList.remove('tt-tutorial-target'));
  }
  function close() {
    dialog.close();
    clearHighlight();
    guardInput();
    if (opener?.isConnected && !opener.closest('[inert]')) opener.focus();
    else ui.querySelector('.tt-choice:not(.is-disabled), .tt-continue, [data-help]')?.focus();
  }
  function show(html) {
    if (!dialog.open) opener = document.activeElement;
    dialog.innerHTML = html;
    if (!dialog.open) dialog.showModal();
    dialog.querySelector('button')?.focus();
  }
  function drawStep() {
    const step = steps[index];
    clearHighlight();
    ui.querySelector(step.target)?.classList.add('tt-tutorial-target');
    show(`<p class="tt-eyebrow">Hướng dẫn năm 1 · ${index + 1}/${steps.length}</p><h2 id="tt-tutorial-title">${esc(step.title)}</h2><p>${esc(step.text)}</p><div class="tt-tutorial-actions"><button type="button" data-next>${esc(index < steps.length - 1 ? 'Tiếp theo' : step.last || 'Đã hiểu')}</button><button type="button" data-skip>Bỏ qua hướng dẫn</button></div>`);
  }
  function help() {
    mode = 'help';
    clearHighlight();
    show(`<p class="tt-eyebrow">The Transition · 8 năm điều hành</p><h2 id="tt-tutorial-title">Bạn cần làm gì?</h2>
      <p>Điều hành Hòa Minh qua 8 năm, hướng tới phát triển cân bằng và nợ trong tầm kiểm soát.</p>
      <ol><li>Đầu năm: xem ngân sách, cảnh báo và hệ quả đến hạn.</li><li>Đọc tình huống: vấn đề gì, ai liên quan, thông tin nào còn thiếu?</li><li>So sánh cách xử lý, chi phí, lợi ích và rủi ro dự kiến.</li><li>Bấm phương án hoặc phím số tương ứng để quyết định.</li><li>Đọc kết quả, nhóm chịu tác động, di sản và hệ quả hẹn trước.</li><li>Bấm Tiếp tục và điều chỉnh ở năm sau.</li></ol>
      <details><summary>Mục tiêu cuối ván và sáu chỉ số</summary><p>Để đạt Chuyển đổi có nền tảng: cả sáu chỉ số ≥55, riêng Pháp quyền ≥60, Áp lực nợ &lt;60. Cứu vãn trong năm 8 chưa đủ thời gian chứng minh phục hồi để đạt kết cục này.</p><p>Sản xuất tạo của cải; Đời sống phản ánh an sinh; Niềm tin phản ánh tham gia, giám sát; Pháp quyền phản ánh liêm chính và thực thi luật; Công bằng phản ánh cơ hội giữa các nhóm; Đoàn kết phản ánh khả năng giải quyết xung đột không bạo lực.</p></details>
      <details><summary>Ngân sách, nợ và năng lực</summary><p>Không được chi để số dư thấp hơn ${RULES.minBalance}. Cuối năm, mỗi 1 ngân sách âm tạo ${RULES.deficitDebtFactor} áp lực nợ; nợ cao làm giảm thu. Hai năm thâm hụt liên tiếp ảnh hưởng Đời sống và Niềm tin. Năng lực dưới ${RULES.lowCapacity} làm giảm lợi ích chính sách phức tạp còn khoảng ${RULES.lowCapacityFactor * 100}%.</p></details>
      <details><summary>Khi nào có nguy cơ kết thúc sớm?</summary><p>Pháp quyền ≤${RULES.crisis.institutional.LAW} đồng thời Niềm tin ≤${RULES.crisis.institutional.TRUST}, hoặc Đời sống ≤${RULES.crisis.livelihood.LIFE} đồng thời Sản xuất ≤${RULES.crisis.livelihood.PROD}. Cùng loại khủng hoảng kéo dài hai năm sẽ cần xử lý; chỉ có một quyền cứu vãn.</p></details>
      <details><summary>Điều khiển</summary><p>Chuột hoặc phím số: chọn. Enter/Space: tiếp tục khi chỉ có một nút. Bấm chỉ số, tài nguyên hoặc di sản: xem chi tiết. Esc: đóng chi tiết. P: trình chiếu; S: bật/tắt hoạt ảnh; F: toàn màn hình; L: đặt lại bố cục.</p></details>
      <p class="tt-note">Quốc gia, tình huống và điểm số là hư cấu phục vụ học tập. Hãy giải thích đánh đổi phía sau kết quả.</p>
      <div class="tt-tutorial-actions"><button type="button" data-close>Trở lại game</button></div>`);
  }
  function showHints() {
    const candidates = contextualHints(view).filter(h => !seenHints.has(h.id));
    hint.hidden = !candidates.length;
    if (!candidates.length) return;
    const h = candidates[0];
    hint.innerHTML = `<h3>${esc(h.title)}</h3><p>${esc(h.text)}</p><button type="button" data-dismiss>Đã hiểu</button>`;
    hint.querySelector('button').onclick = () => { seenHints.add(h.id); showHints(); };
  }
  tools.querySelector('button').onclick = help;
  dialog.addEventListener('cancel', e => {
    e.preventDefault();
    if (mode === 'tour') guided = false;
    close();
  });
  dialog.addEventListener('click', e => {
    const button = e.target.closest('button');
    if (!button) return;
    if (button.hasAttribute('data-guide') || button.hasAttribute('data-alone')) {
      guided = button.hasAttribute('data-guide');
      storageSet(SEEN_KEY, '1');
      close();
      onStart();
    } else if (button.hasAttribute('data-next')) {
      if (++index < steps.length) drawStep();
      else close();
    } else if (button.hasAttribute('data-skip')) { guided = false; close(); }
    else if (button.hasAttribute('data-close')) close();
  });
  // Stop game shortcuts while retaining native Tab, Enter and Space in the dialog.
  dialog.addEventListener('keydown', e => e.stopPropagation());

  return {
    get blocking() { return dialog.open; },
    render(next) {
      const restarting = next.phase === 'briefing' && view?.phase !== 'briefing';
      view = next;
      if (restarting) {
        guided = false;
        seenPhases = new Set();
        seenHints = new Set();
        if (dialog.open) close();
      }
      if (view.phase === 'briefing') {
        hint.hidden = true;
        // Existing players can opt in again without resetting the simulation.
        if (!storageGet(SEEN_KEY) && !dialog.open) {
          mode = 'welcome';
          show('<p class="tt-eyebrow">Chào mừng đến Hòa Minh</p><h2 id="tt-tutorial-title">8 năm để xây dựng nền tảng bền vững</h2><p>Bạn là thành viên Hội đồng điều hành. Mỗi năm, hãy chọn chính sách để phát triển sản xuất, cải thiện đời sống và cơ hội, giữ vững niềm tin, pháp quyền và đoàn kết.</p><p>Ngân sách có hạn. Quyết định hôm nay có thể tạo hệ quả nhiều năm sau.</p><p class="tt-note">Quốc gia, tình huống và điểm số là hư cấu phục vụ học tập.</p><div class="tt-tutorial-actions"><button type="button" data-guide>Hướng dẫn tôi</button><button type="button" data-alone>Tôi đã biết cách chơi</button></div>');
        }
        return;
      }
      showHints();
      const key = `${view.year}:${view.phase}`;
      if (guided && !seenPhases.has(key)) {
        steps = tutorialSteps(view);
        if (steps.length) {
          seenPhases.add(key);
          index = 0;
          mode = 'tour';
          drawStep();
        }
      }
    },
    startGuided(value) { guided = value; storageSet(SEEN_KEY, '1'); },
    help,
    destroy() { dialog.close(); tools.remove(); dialog.remove(); hint.remove(); clearHighlight(); },
  };
}
