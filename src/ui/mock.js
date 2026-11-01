// Mock View objects for ui-demo.html, following the shapes in ARCHITECTURE.md.
// Content is taken from doc/02 (Y1, C01, Y2, R02, Y6, Y7, final repair, E5 ending).
// Numbers are illustrative only; the real rules live in src/sim.

const START_M = { PROD: 52, LIFE: 48, TRUST: 54, LAW: 51, EQUITY: 45, COHESION: 57 };
const START_R = { BUDGET: 60, CAPACITY: 50, DEBT: 0 };

let M = { ...START_M };
let R = { ...START_R };
let F = [];
const seq = [];

const clamp = (v) => Math.max(0, Math.min(100, v));
function apply(d = {}, rd = {}) {
  for (const [k, v] of Object.entries(d)) M[k] = clamp(M[k] + v);
  for (const [k, v] of Object.entries(rd)) R[k] = k === 'BUDGET' ? R[k] + v : clamp(R[k] + v);
}
function push(phase, year, site, extra = {}, options = [{ id: 'continue', key: '1', label: 'Tiếp tục' }]) {
  seq.push({
    phase, year, site,
    metrics: { ...M }, resources: { ...R }, flags: [...F],
    warning: null, randomEvents: true,
    options,
    ...extra,
  });
}

// ---------- briefing ----------
push('briefing', 1, 'overview', {
  title: 'Cộng hòa Hòa Minh — 8 năm chuyển đổi',
  paragraphs: [
    'Hòa Minh là một quốc gia hoàn toàn hư cấu: 22 triệu dân, 60% sống ở đô thị, nhiều cộng đồng dân tộc và tín ngưỡng. Nền kinh tế đang chuyển từ nông nghiệp sang công nghiệp và dịch vụ số.',
    'Cả lớp là Hội đồng điều hành. Mỗi năm có một tình huống gốc gắn với một chương MLN131; hãy đọc dữ kiện, tranh luận 30 giây rồi biểu quyết. Hội đồng không đứng trên pháp luật.',
    'Sáu chỉ số bên dưới không phải "điểm chính trị"; chúng là công cụ quan sát đánh đổi. Không có đáp án A/B/C đúng — chỉ có hệ quả, nhóm hưởng lợi và nhóm chịu chi phí.',
  ],
}, [{ id: 'start', key: '1', label: 'Bắt đầu' }]);

// ---------- Y1 event ----------
push('event', 1, 'industrial', {
  code: 'Y1', chapter: 2,
  headline: 'Khu công nghiệp Thiên Hà ngừng máy',
  context: '18.000 người làm trong khu công nghiệp Thiên Hà. Đơn hàng điện tử giảm 12%, lương thực tế bị bào mòn, ca làm kéo dài. Hơn 4.000 người ngừng việc. Doanh nghiệp đề nghị tự động hóa 30% dây chuyền và xin ưu đãi thuế để giữ đơn hàng; tổ chức đại diện người lao động phản ánh thỏa ước tập thể không được thực hiện đầy đủ.',
  facts: [
    'Mức lương hiện tại chưa đủ chi phí thuê nhà quanh khu công nghiệp',
    'Đơn hàng điện tử giảm 12% so với năm trước (số giả định)',
    'Đa số người lao động muốn thương lượng, không muốn đóng nhà máy',
  ],
  conflict: 'Bảo vệ quyền lợi và tiếng nói đại diện của công nhân ↔ duy trì năng lực sản xuất ↔ khả năng cạnh tranh.',
  uncertainty: 'Chưa rõ đơn hàng sẽ phục hồi trong 6 hay 18 tháng; dự báo của doanh nghiệp và của công đoàn khác nhau.',
  stakeholders: ['worker', 'business', 'family', 'intellectual'],
}, [
  { id: 'Y1-A', key: '1', label: 'Lập cơ chế thương lượng ba bên, tăng lương theo 2 kỳ, kiểm tra an toàn lao động và lập quỹ nâng kỹ năng', explanation: 'Chậm hơn nhưng tạo kênh đối thoại lâu dài.', cost: 8 },
  { id: 'Y1-B', key: '2', label: 'Tăng lương bắt buộc 18% ngay, trợ cấp doanh nghiệp 1 năm, chưa có phương án đào tạo lại', explanation: 'Đáp ứng nhanh nhu cầu trước mắt của người lao động.', cost: 13 },
  { id: 'Y1-C', key: '3', label: 'Không can thiệp vào lương, yêu cầu khôi phục sản xuất ngay, hứa xem xét kiến nghị trong 12 tháng', explanation: 'Giữ ngân sách, ưu tiên khôi phục dây chuyền.', cost: 1 },
]);

// ---------- Y1 result (B) ----------
apply({ LIFE: 9, TRUST: 4, COHESION: 3, PROD: -7 }, { BUDGET: -13 });
F.push('WAGE_SHOCK');
push('result', 1, 'industrial', {
  code: 'Y1-B',
  choiceLabel: 'Tăng lương bắt buộc 18% ngay, trợ cấp doanh nghiệp 1 năm',
  deltas: { LIFE: 9, TRUST: 4, COHESION: 3, PROD: -7 },
  resourceDeltas: { BUDGET: -13 },
  flagsSet: ['WAGE_SHOCK'],
  scheduled: [
    { year: 2, text: 'Nếu năng lực sản xuất dưới 50: sản xuất tiếp tục giảm, ngân sách hụt thêm' },
    { year: 5, text: 'Rủi ro mất việc khi tự động hóa mà chưa có đào tạo lại' },
  ],
  winners: ['worker', 'family'],
  losers: ['business'],
  academic: {
    chapter: 2,
    topic: 'Sứ mệnh lịch sử của giai cấp công nhân',
    lesson: 'Phân biệt vị trí kinh tế – xã hội của giai cấp công nhân với điều kiện chủ quan để thực hiện vai trò (tổ chức, ý thức, đại diện). Phát triển công nghiệp không tự động bảo đảm quyền lợi lao động.',
    debrief: 'Đáp ứng nhu cầu trước mắt có làm suy giảm việc làm dài hạn? "Sứ mệnh lịch sử" thể hiện ra sao ngoài khẩu hiệu?',
  },
});

// ---------- Y2 yearStart ----------
apply({ PROD: -4 }, { BUDGET: 11 - 3 });
push('yearStart', 2, 'economy', {
  budgetGain: 11,
  applied: [
    { source: 'Y1-B', text: 'Đơn hàng giảm khi năng suất chưa theo kịp mức lương mới; ba nhà máy cắt ca.', deltas: { PROD: -4 }, resourceDeltas: { BUDGET: -3 } },
  ],
  warning: 'Năng lực sản xuất đang dưới 50 — các ngành xuất khẩu nhạy cảm với cú sốc đơn hàng.',
});

// ---------- C01 consequence ----------
push('consequence', 2, 'industrial', {
  code: 'C01',
  headline: 'Đơn hàng giảm, nguy cơ mất việc',
  text: 'Ba nhà máy báo giảm ca, tỷ lệ nghỉ việc tăng. Việc tăng lương tức thời không đi kèm giải pháp nâng năng suất.',
  facts: ['Cờ kế thừa: Sốc tăng lương đột ngột', 'Năng lực sản xuất hiện dưới ngưỡng 50'],
  warning: 'Năng lực sản xuất đang dưới 50 — các ngành xuất khẩu nhạy cảm với cú sốc đơn hàng.',
}, [
  { id: 'C01-A', key: '1', label: 'Dùng quỹ đào tạo để nâng kỹ năng cho người lao động bị giảm ca', cost: 4 },
  { id: 'C01-B', key: '2', label: 'Hỗ trợ tiền mặt ngắn hạn cho người bị giảm ca', cost: 3 },
]);

// ---------- Y2 event ----------
apply({ PROD: 2 }, { BUDGET: -4 });
push('event', 2, 'economy', {
  code: 'Y2', chapter: 3,
  headline: 'Tăng trưởng nhanh hay chuyển đổi có kiểm soát?',
  context: 'Tổ hợp chế tạo công nghệ cao đề nghị ưu đãi thuế 10 năm đổi lấy 65.000 việc làm dự kiến. Đồng thời, các hợp tác xã muốn vốn số hóa bảo quản và truy xuất nông sản; cơ quan kế hoạch cảnh báo tiến độ giải ngân thấp, kiểm toán chưa theo kịp quy mô đầu tư.',
  facts: [
    '65.000 việc làm dự kiến nếu duyệt toàn bộ đặc khu',
    'Hợp tác xã thiếu vốn số hóa và kho lạnh',
    'Kiểm toán chưa theo kịp quy mô đầu tư công',
  ],
  conflict: 'Tốc độ tăng trưởng ↔ năng lực tổ chức thực hiện ↔ phân bổ lợi ích giữa đô thị và nông thôn.',
  uncertainty: 'Dự báo thị trường cho ngành chế tạo có độ bất định lớn; con số 65.000 việc làm chưa được kiểm chứng độc lập.',
  stakeholders: ['business', 'farmer', 'intellectual', 'worker'],
}, [
  { id: 'Y2-A', key: '1', label: 'Chia 2 giai đoạn: thử nghiệm vùng công nghiệp, đầu tư đào tạo và hợp tác xã, cạnh tranh minh bạch, kiểm toán hằng năm', cost: 12 },
  { id: 'Y2-B', key: '2', label: 'Phê duyệt toàn bộ đặc khu và ưu đãi lớn để hút vốn nhanh, bỏ qua thiết kế đào tạo vùng nông thôn', cost: 22, explanation: 'Chi phí tăng thêm 4 do sốc tăng lương năm trước.' },
  { id: 'Y2-C', key: '3', label: 'Đóng băng cải cách, trợ giá đại trà để giữ mức sống, hoãn công nghệ mới', cost: 15 },
]);

// ---------- Y2 result (A) ----------
apply({ PROD: 4, LIFE: 2, LAW: 3, EQUITY: 4, TRUST: 2 }, { BUDGET: -12, CAPACITY: 4 });
F.push('ECON_BALANCED', 'AUTOMATION_SKILLS');
push('result', 2, 'economy', {
  code: 'Y2-A',
  choiceLabel: 'Chuyển đổi 2 giai đoạn, đầu tư đào tạo và hợp tác xã, kiểm toán hằng năm',
  deltas: { PROD: 4, LIFE: 2, LAW: 3, EQUITY: 4, TRUST: 2 },
  resourceDeltas: { BUDGET: -12, CAPACITY: 4 },
  flagsSet: ['ECON_BALANCED', 'AUTOMATION_SKILLS'],
  scheduled: [{ year: 5, text: 'Năng suất +7, đời sống +3 nếu năng lực thực thi còn từ 40 trở lên' }],
  winners: ['farmer', 'intellectual', 'worker'],
  losers: ['business'],
  academic: {
    chapter: 3,
    topic: 'Đặc điểm thời kỳ quá độ lên CNXH',
    lesson: 'Thời kỳ quá độ là tiến trình có mâu thuẫn và nhiệm vụ phát triển; cần phân biệt mục tiêu với công cụ, trình tự và năng lực tổ chức thực hiện.',
    debrief: 'Một chính sách thúc đẩy thị trường có thể cùng tồn tại với định hướng xã hội chủ nghĩa trong điều kiện gì?',
  },
});

// ---------- R02 random ----------
push('random', 2, 'port', {
  code: 'R02',
  headline: 'Cú sốc xuất khẩu',
  text: 'Thị trường quốc tế hủy 20% đơn hàng của ngành mũi nhọn (giả định). Hàng nằm ở cảng, doanh nghiệp vừa và nhỏ trong chuỗi cung ứng báo khó khăn dòng tiền.',
  stakeholders: ['business', 'worker'],
}, [
  { id: 'R02-A', key: '1', label: 'Lập quỹ thích nghi và hỗ trợ chuyển ngành có điều kiện', cost: 6 },
  { id: 'R02-B', key: '2', label: 'Cứu một doanh nghiệp lớn mà không kiểm tra điều kiện', cost: 8 },
]);

// ---------- R02 result ----------
apply({ PROD: -2 }, { BUDGET: -6 });
push('randomResult', 2, 'port', {
  code: 'R02-A',
  choiceLabel: 'Quỹ thích nghi và hỗ trợ chuyển ngành',
  deltas: { PROD: -2 },
  resourceDeltas: { BUDGET: -6 },
  flagsSet: [],
  scheduled: [{ year: 3, text: 'Sản xuất +5, đời sống +2 khi doanh nghiệp chuyển sang thị trường mới' }],
  winners: ['worker'],
  losers: [],
});

// ---------- jump to Y6 (years 3–5 omitted in the demo) ----------
M = { PROD: 58, LIFE: 51, TRUST: 41, LAW: 47, EQUITY: 49, COHESION: 50 };
R = { BUDGET: 2, CAPACITY: 47, DEBT: 14 };
F = ['WAGE_SHOCK', 'ECON_BALANCED', 'AUTOMATION_SKILLS', 'CONSULT_TOKEN', 'ANTI_CORRUPTION_INDEPENDENT', 'COALITION_BUILT'];
push('yearStart', 6, 'valley', {
  budgetGain: 12,
  applied: [
    { source: 'Y3-B', text: 'Tham vấn hình thức ở dự án vành đai khiến cộng đồng vùng cao nghi ngờ các hồ sơ mới.', deltas: { TRUST: -3 } },
    { source: 'Y4-A', text: 'Điều tra độc lập vụ đấu thầu bệnh viện được công bố đầy đủ; uy tín cơ quan thanh tra tăng.', deltas: { LAW: 3, TRUST: 2 } },
  ],
  warning: 'Niềm tin dưới 45: tin giả dễ lan rộng hơn trong năm nay.',
});
apply({ TRUST: -1, LAW: 3 }, { BUDGET: 0 });

push('event', 6, 'valley', {
  code: 'Y6', chapter: 6,
  headline: 'Thủy điện và thung lũng Bản Mây',
  context: 'Dự án thủy điện mang điện cho vùng nghèo nhưng ảnh hưởng 3.600 hộ thuộc 4 cộng đồng dân tộc. Báo cáo kỹ thuật coi một khu đất sinh hoạt văn hóa là đất bỏ hoang. Các hộ yêu cầu hồ sơ bằng ngôn ngữ dễ tiếp cận, được tham gia đo đạc và có phương án sinh kế thay thế.\n\nMột nhóm trên mạng tung tin xuyên tạc về dự án; đồng thời một số kiến nghị của người dân là có cơ sở. Cộng đồng nhắc lại việc biên bản tham vấn đường vành đai năm 3 từng ghi "đồng thuận tuyệt đối".',
  facts: [
    '3.600 hộ có thể phải tái định cư (giả định)',
    'Báo cáo kỹ thuật thiếu đánh giá một không gian văn hóa',
    'Cộng đồng yêu cầu tham gia đo đạc và xây dựng phương án sinh kế',
    'Một phần thông tin lan truyền trên mạng là sai sự thật, một phần kiến nghị là đúng',
  ],
  conflict: 'Nhu cầu năng lượng và phát triển vùng ↔ quyền tham gia, bản sắc văn hóa và sinh kế của cộng đồng.',
  uncertainty: 'Chưa xác minh được nguồn gốc của các bài đăng xuyên tạc; số hộ bị ảnh hưởng có thể thay đổi sau đo đạc lại.',
  stakeholders: ['minority', 'farmer', 'family', 'business', 'intellectual'],
  warning: 'Niềm tin dưới 45: tin giả dễ lan rộng hơn trong năm nay.',
}, [
  { id: 'Y6-A', key: '1', label: 'Đồng thiết kế tuyến và bồi thường với đại diện cộng đồng; đánh giá văn hóa, hỗ trợ song ngữ, sinh kế và cơ chế khiếu nại', cost: 13, disabled: true, disabledReason: 'Không đủ ngân sách: còn 2, sau khi chi sẽ âm 11 (giới hạn −10)' },
  { id: 'Y6-B', key: '2', label: 'Áp dụng một mức bồi thường thống nhất, triển khai nhanh, không hỏi cộng đồng về phương án tái định cư', cost: 7 },
  { id: 'Y6-C', key: '3', label: 'Ngừng vô thời hạn dự án, không lập phương án năng lượng hoặc việc làm thay thế', cost: 4 },
  { id: 'Y6-A-PILOT', key: '4', label: 'Thí điểm đồng thiết kế ở 1 xã trước, phân kỳ phần còn lại sang năm sau', explanation: 'Phương án phân kỳ khi không đủ ngân sách cho chính sách toàn diện.', cost: 6 },
]);

apply({ EQUITY: 5, TRUST: 4, COHESION: 3, LAW: 2, PROD: -1 }, { BUDGET: -6, CAPACITY: 1 });
F.push('REGION_PARTICIPATION');
push('result', 6, 'valley', {
  code: 'Y6-A-PILOT',
  choiceLabel: 'Thí điểm đồng thiết kế ở 1 xã, phân kỳ phần còn lại',
  deltas: { EQUITY: 5, TRUST: 4, COHESION: 3, LAW: 2, PROD: -1 },
  resourceDeltas: { BUDGET: -6, CAPACITY: 1 },
  flagsSet: ['REGION_PARTICIPATION', '-CONSULT_TOKEN'],
  scheduled: [
    { year: 7, text: 'Mở rộng mô hình sang 3 xã còn lại nếu ngân sách cho phép' },
    { year: 8, text: 'Đời sống +4, sản xuất +3 nếu năng lực thực thi từ 40 trở lên' },
  ],
  winners: ['minority', 'farmer', 'family'],
  losers: ['business'],
  academic: {
    chapter: 6,
    topic: 'Vấn đề dân tộc trong thời kỳ quá độ lên chủ nghĩa xã hội',
    lesson: 'Phân biệt bình đẳng dân tộc với đồng nhất hóa bản sắc; gắn quyền, lợi ích, sự tham gia và phát triển cùng nhau. Bình đẳng theo một quy tắc và bình đẳng cơ hội thực tế có thể khác nhau.',
    debrief: 'Cần xác minh thông tin sai ra sao mà vẫn bảo vệ các phản ánh đúng của người dân?',
  },
});

// ---------- Y7 event (long content stress test) ----------
apply({}, { BUDGET: 12 });
push('event', 7, 'temple', {
  code: 'Y7', chapter: 6,
  headline: 'Trung tâm "chữa bệnh bằng phép lạ"',
  context: 'Một tổ chức nhận tiền "chữa bệnh khỏi hoàn toàn", khuyến khích bệnh nhân bỏ điều trị y khoa; nhiều người khiếu nại. Tổ chức này mượn địa điểm sinh hoạt của một cộng đồng tôn giáo có hoạt động hợp pháp, khiến tin đồn trên mạng quy kết cả cộng đồng.\n\nCơ quan y tế có bằng chứng về quảng cáo gian dối, nhưng chưa xác định mọi thành viên liên quan. Một số gia đình nạn nhân yêu cầu xử lý nhanh; đại diện cộng đồng tôn giáo đề nghị cơ quan chức năng phân biệt rõ hành vi của tổ chức trục lợi với sinh hoạt tín ngưỡng thường ngày của họ.\n\nTruyền thông địa phương đang chia rẽ: một bên kêu gọi "đóng cửa tất cả", một bên cho rằng mọi can thiệp đều là xâm phạm tự do tín ngưỡng.',
  facts: [
    '27 đơn khiếu nại về việc bệnh nhân bỏ điều trị (số giả định)',
    'Có bằng chứng quảng cáo dịch vụ y tế gian dối',
    'Cộng đồng tôn giáo cho mượn địa điểm có đăng ký hoạt động hợp pháp',
    'Chưa xác định được toàn bộ người điều hành tổ chức',
    'Tin đồn trên mạng quy kết toàn bộ cộng đồng tín ngưỡng',
  ],
  conflict: 'Bảo vệ sức khỏe và quyền lợi nạn nhân ↔ bảo đảm quyền tự do tín ngưỡng, không tín ngưỡng ↔ chống quy chụp cả một cộng đồng.',
  uncertainty: 'Chưa rõ mức độ liên quan của từng cá nhân; điều tra đầy đủ có thể mất nhiều tháng.',
  stakeholders: ['faith', 'family', 'minority', 'intellectual'],
}, [
  { id: 'Y7-A', key: '1', label: 'Điều tra hành vi lừa đảo và quảng cáo y tế theo pháp luật, bảo vệ nạn nhân, truyền thông không quy chụp cộng đồng, bảo đảm hoạt động tín ngưỡng hợp pháp', explanation: 'Xử lý dựa trên hành vi và bằng chứng, không dựa trên niềm tin.', cost: 7 },
  { id: 'Y7-B', key: '2', label: 'Đình chỉ trên diện rộng các hoạt động của cộng đồng tôn giáo liên quan, kể cả cơ sở không có dấu hiệu vi phạm', explanation: 'Tạo cảm giác xử lý nhanh, dứt điểm.', cost: 4 },
  { id: 'Y7-C', key: '3', label: 'Không xác minh nội dung tố giác, coi đây chỉ là tranh luận tín ngưỡng và để các gia đình tự chịu trách nhiệm', explanation: 'Không tốn ngân sách, tránh can thiệp.', cost: 0 },
]);

// ---------- final repair (hypothetical crisis branch) ----------
M = { PROD: 31, LIFE: 33, TRUST: 13, LAW: 14, EQUITY: 30, COHESION: 38 };
R = { BUDGET: 9, CAPACITY: 31, DEBT: 58 };
push('finalRepair', 7, 'overview', {
  headline: 'Khủng hoảng thể chế kéo dài hai năm',
  text: 'Pháp quyền và niềm tin đều ở mức 15 trở xuống trong hai năm liên tiếp. Dịch vụ công tối thiểu bắt đầu gián đoạn, nhiều kiến nghị không được tiếp nhận. Hội đồng có một quyền cứu vãn duy nhất — mọi đánh đổi phải được công khai.',
  facts: ['Pháp quyền 14, Niềm tin 13 (ngưỡng khủng hoảng: 15)', 'Năng lực thực thi 31 làm giảm hiệu quả các chính sách phức tạp'],
  warning: 'Khủng hoảng thể chế: nếu không phục hồi sẽ dẫn tới kết cục Đứt gãy quản trị.',
}, [
  { id: 'REPAIR-A', key: '1', label: 'Tái lập cơ chế giám sát độc lập và cứu trợ tối thiểu, công khai toàn bộ đánh đổi', cost: 10, disabled: true, disabledReason: 'Không đủ ngân sách: còn 9, cần 10 và giữ số dư trên −10 sau nợ' },
  { id: 'REPAIR-B', key: '2', label: 'Phương án phân kỳ: khôi phục giám sát ở các cơ quan trọng yếu trước', cost: 3, explanation: 'Chỉ giải quyết một phần.' },
]);

// ---------- end (E5) ----------
M = { PROD: 63, LIFE: 56, TRUST: 50, LAW: 58, EQUITY: 54, COHESION: 52 };
R = { BUDGET: 11, CAPACITY: 55, DEBT: 22 };
const H = [
  { year: 1, code: 'Y1', choiceId: 'Y1-B', label: 'Tăng lương bắt buộc 18% ngay', metricsAfter: { PROD: 45, LIFE: 57, TRUST: 58, LAW: 51, EQUITY: 45, COHESION: 60 } },
  { year: 2, code: 'C01', choiceId: 'C01-A', label: 'Dùng quỹ đào tạo', metricsAfter: { PROD: 43, LIFE: 57, TRUST: 58, LAW: 51, EQUITY: 45, COHESION: 60 } },
  { year: 2, code: 'Y2', choiceId: 'Y2-A', label: 'Chuyển đổi 2 giai đoạn', metricsAfter: { PROD: 47, LIFE: 59, TRUST: 60, LAW: 54, EQUITY: 49, COHESION: 60 } },
  { year: 2, code: 'R02', choiceId: 'R02-A', label: 'Quỹ thích nghi', metricsAfter: { PROD: 45, LIFE: 59, TRUST: 60, LAW: 54, EQUITY: 49, COHESION: 60 } },
  { year: 3, code: 'Y3', choiceId: 'Y3-B', label: 'Họp công khai ngắn, giữ nguyên tuyến', metricsAfter: { PROD: 55, LIFE: 61, TRUST: 51, LAW: 47, EQUITY: 49, COHESION: 56 } },
  { year: 4, code: 'Y4', choiceId: 'Y4-A', label: 'Điều tra độc lập đúng thủ tục', metricsAfter: { PROD: 53, LIFE: 63, TRUST: 58, LAW: 58, EQUITY: 49, COHESION: 56 } },
  { year: 5, code: 'Y5', choiceId: 'Y5-A', label: 'Quỹ chuyển đổi kỹ năng và an sinh theo lộ trình', metricsAfter: { PROD: 60, LIFE: 54, TRUST: 44, LAW: 44, EQUITY: 46, COHESION: 50 } },
  { year: 6, code: 'Y6', choiceId: 'Y6-A-PILOT', label: 'Thí điểm đồng thiết kế ở 1 xã', metricsAfter: { PROD: 57, LIFE: 51, TRUST: 44, LAW: 52, EQUITY: 54, COHESION: 53 } },
  { year: 7, code: 'Y7', choiceId: 'Y7-A', label: 'Điều tra theo pháp luật, không quy chụp', metricsAfter: { PROD: 57, LIFE: 56, TRUST: 50, LAW: 61, EQUITY: 54, COHESION: 59 } },
  { year: 8, code: 'Y8', choiceId: 'Y8-B', label: 'Trợ cấp tiền mặt sinh con 2 năm', metricsAfter: { ...M } },
];
push('end', 8, 'overview', {
  initialMetrics: { ...START_M },
  ending: {
    id: 'E5',
    title: 'Cải cách dang dở',
    text: 'Hòa Minh có thành tựu thật: sản xuất phục hồi, pháp quyền được củng cố sau vụ đấu thầu bệnh viện. Nhưng năng lực thực thi và liên minh xã hội chưa đồng đều — vùng cao vẫn chờ phần còn lại của phương án thủy điện, còn gia đình trẻ mới nhận trợ cấp ngắn hạn thay vì dịch vụ chăm sóc.',
    question: 'Thời kỳ quá độ có thể phức tạp, kéo dài và chứa nhiều mâu thuẫn như thế nào?',
    secondary: ['Gần ngưỡng E1 Chuyển đổi có nền tảng (Niềm tin 50 < 55)'],
  },
  history: H,
  turningPoints: [
    { year: 1, code: 'Y1-B', label: 'Tăng lương bắt buộc 18% ngay', text: 'Đời sống tăng nhanh nhưng sản xuất hụt hơi, mở ra chuỗi hệ quả C01 ở năm 2.' },
    { year: 3, code: 'Y3-B', label: 'Họp công khai ngắn, giữ nguyên tuyến', text: 'Cờ "tham vấn hình thức" kéo niềm tin xuống và theo Hòa Minh tới tận dự án thủy điện năm 6.' },
    { year: 4, code: 'Y4-A', label: 'Điều tra độc lập vụ đấu thầu bệnh viện', text: 'Pháp quyền tăng mạnh; giám sát dự án sau đó đáng tin hơn.' },
  ],
  delayed: [
    { fromYear: 2, year: 5, text: 'Đầu tư đào tạo từ năm 2 giúp 1.200 học viên chuyển việc khi tự động hóa ở năm 5.' },
    { fromYear: 3, year: 6, text: 'Tham vấn hình thức ở năm 3 khiến cộng đồng Bản Mây đòi giám sát độc lập, niềm tin −3.' },
  ],
  stakeholders: [
    { id: 'worker', tone: 'gain', text: 'Lương thực tế và kỹ năng đều tăng sau 8 năm, dù năm 2 có giảm ca.' },
    { id: 'minority', tone: 'mixed', text: 'Được tham gia đồng thiết kế ở 1 xã; 3 xã còn lại vẫn chờ.' },
    { id: 'family', tone: 'loss', text: 'Trợ cấp ngắn hạn chưa giải quyết nhà ở và dịch vụ chăm sóc.' },
  ],
}, [{ id: 'restart', key: '1', label: 'Chơi lại' }]);

export const MOCK_VIEWS = seq;

export const MOCK_LABELS = seq.map((v, i) => `${i + 1}. ${v.phase}${v.code ? ` · ${v.code}` : ''} (Năm ${v.year})`);
