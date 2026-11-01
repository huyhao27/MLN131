// Display labels (Vietnamese) for ids coming from the sim. Pure data, no DOM.

export const METRICS = [
  { key: 'PROD', name: 'Năng lực sản xuất', short: 'Sản xuất', color: '#8a5523', desc: 'Năng suất, công nghệ, năng lực tạo ra của cải. Sản xuất cao giúp thu ngân sách hằng năm nhiều hơn.' },
  { key: 'LIFE', name: 'Đời sống & an sinh', short: 'Đời sống', color: '#b4492a', desc: 'Thu nhập thực, dịch vụ thiết yếu và phúc lợi mà người dân nhận được.' },
  { key: 'TRUST', name: 'Niềm tin & tham gia', short: 'Niềm tin', color: '#2f6688', desc: 'Mức tin cậy vào thể chế, khả năng người dân tham gia và giám sát quyết định.' },
  { key: 'LAW', name: 'Pháp quyền & liêm chính', short: 'Pháp quyền', color: '#5b4a8e', desc: 'Thực thi luật, trách nhiệm giải trình và kiểm soát quyền lực.' },
  { key: 'EQUITY', name: 'Công bằng cơ hội', short: 'Công bằng', color: '#3b7448', desc: 'Khoảng cách giữa các vùng, các nhóm và khả năng tiếp cận cơ hội.' },
  { key: 'COHESION', name: 'Đoàn kết & ổn định', short: 'Đoàn kết', color: '#9a7614', desc: 'Năng lực giải quyết xung đột xã hội một cách không bạo lực. Ổn định không có nghĩa là cấm phản biện.' },
];
export const METRIC_BY_KEY = Object.fromEntries(METRICS.map((m) => [m.key, m]));

// `bad: true` -> an increase is unfavourable (debt).
export const RESOURCES = [
  { key: 'BUDGET', name: 'Ngân sách', short: 'Ngân sách', desc: 'Đơn vị nguồn lực giả định (không phải tỷ đồng). Mỗi năm có khoản thu cơ sở, thêm khi sản xuất cao, bớt khi nợ cao. Không chọn được phương án nếu số dư sau khi chi xuống dưới −10; ngân sách âm cuối năm sẽ chuyển thành nợ.' },
  { key: 'CAPACITY', name: 'Năng lực thực thi', short: 'Năng lực', desc: 'Năng lực triển khai của bộ máy hành chính (0–100). Dưới 35, mọi tác động tích cực của chính sách phức tạp bị giảm 40%; tác động tiêu cực giữ nguyên.' },
  { key: 'DEBT', name: 'Áp lực nợ', short: 'Nợ', bad: true, desc: 'Áp lực tài khóa tích lũy (0–100). Tăng khi ngân sách âm cuối năm; nợ càng cao thì khoản thu hằng năm càng giảm.' },
];
export const RESOURCE_BY_KEY = Object.fromEntries(RESOURCES.map((r) => [r.key, r]));

// Values below this are tinted as a warning zone on every metric bar.
export const WARN_LEVEL = 35;

export const TOTAL_YEARS = 8;

// Year -> short theme of the mandatory node (GDD §4).
export const YEAR_THEMES = {
  1: 'Công nhân',
  2: 'Quá độ',
  3: 'Dân chủ',
  4: 'Pháp quyền',
  5: 'Liên minh',
  6: 'Dân tộc',
  7: 'Tôn giáo',
  8: 'Gia đình',
};

// Textbook chapter -> topic (doc 02 §2).
export const CHAPTER_TOPICS = {
  1: 'Nhập môn CNXH khoa học',
  2: 'Sứ mệnh lịch sử của giai cấp công nhân',
  3: 'CNXH và thời kỳ quá độ',
  4: 'Dân chủ XHCN & Nhà nước XHCN',
  5: 'Cơ cấu xã hội – giai cấp & liên minh',
  6: 'Dân tộc & tôn giáo trong thời kỳ quá độ',
  7: 'Gia đình trong thời kỳ quá độ',
};

export function chapterLabel(ch) {
  if (ch == null || ch === '') return '';
  const n = typeof ch === 'number' ? ch : /^\d+$/.test(String(ch).trim()) ? Number(ch) : null;
  if (n != null) return CHAPTER_TOPICS[n] ? `Chương ${n} · ${CHAPTER_TOPICS[n]}` : `Chương ${n}`;
  return String(ch);
}

export const STAKEHOLDERS = {
  worker: 'Công nhân',
  farmer: 'Nông dân & HTX',
  platform: 'Lao động nền tảng',
  intellectual: 'Trí thức, kỹ sư',
  business: 'Doanh nghiệp',
  minority: 'Cộng đồng dân tộc',
  faith: 'Cộng đồng tín ngưỡng',
  family: 'Gia đình',
};

// GDD §2.2: what each group cares about and where conflicts can arise.
export const STAKEHOLDER_INFO = {
  worker: { concern: 'Lương thực tế, an toàn lao động, tiếng nói đại diện, kỹ năng', conflict: 'Lợi nhuận ngắn hạn, tự động hóa' },
  farmer: { concern: 'Đất đai, đầu ra, tín dụng, hạ tầng', conflict: 'Đô thị hóa, nguy cơ mất sinh kế' },
  platform: { concern: 'Bảo hiểm, hợp đồng, tính linh hoạt', conflict: 'Chi phí của nền tảng so với bảo đảm quyền lợi' },
  intellectual: { concern: 'Giáo dục, nghiên cứu, cơ hội sáng tạo', conflict: 'Đầu tư dài hạn so với ngân sách hiện tại' },
  business: { concern: 'Quy tắc ổn định, vốn, năng suất', conflict: 'Chi phí tuân thủ so với phúc lợi' },
  minority: { concern: 'Tiếng nói, hạ tầng, văn hóa, cơ hội', conflict: 'Phân bổ nguồn lực không đồng đều' },
  faith: { concern: 'Bình đẳng, tự do tín ngưỡng, xử lý công bằng', conflict: 'Lạm dụng quyền lực, lợi dụng tôn giáo' },
  family: { concern: 'Nhà ở, việc làm, chăm sóc trẻ em và người già', conflict: 'Căng thẳng việc – nhà, khác biệt vùng miền' },
};

// tone: good | bad | mixed — only colours the chip; never a "right answer" marker.
export const FLAGS = {
  LABOR_DIALOGUE: { label: 'Có kênh thương lượng lao động', tone: 'good' },
  WAGE_SHOCK: { label: 'Sốc tăng lương đột ngột', tone: 'mixed' },
  AUTOMATION_SKILLS: { label: 'Nâng kỹ năng cho tự động hóa', tone: 'good' },
  ECON_BALANCED: { label: 'Chuyển đổi kinh tế có lộ trình', tone: 'good' },
  ECON_OVERHEAT: { label: 'Kinh tế tăng nóng', tone: 'bad' },
  STAGNATION: { label: 'Đình trệ cải cách', tone: 'bad' },
  WELFARE_UNFUNDED: { label: 'Phúc lợi thiếu nguồn bền vững', tone: 'bad' },
  CONSULT_REAL: { label: 'Tham vấn thực chất', tone: 'good' },
  CONSULT_TOKEN: { label: 'Tham vấn hình thức', tone: 'bad' },
  CONSULT_DELAY: { label: 'Trì hoãn chốt tham vấn', tone: 'mixed' },
  ANTI_CORRUPTION_INDEPENDENT: { label: 'Điều tra độc lập, đúng thủ tục', tone: 'good' },
  ENFORCEMENT_SELECTIVE: { label: 'Xử lý chọn lọc', tone: 'bad' },
  CASE_DELAY: { label: 'Đóng băng hợp đồng chờ điều tra', tone: 'mixed' },
  COALITION_BUILT: { label: 'Liên minh phát triển được xây dựng', tone: 'good' },
  SECTOR_BIAS: { label: 'Thiên lệch ngành dẫn dắt', tone: 'bad' },
  REGION_PARTICIPATION: { label: 'Cộng đồng vùng được tham gia', tone: 'good' },
  REGION_TOPDOWN: { label: 'Áp đặt từ trên xuống ở vùng', tone: 'bad' },
  REGION_DELAY: { label: 'Hoãn dự án vùng vô thời hạn', tone: 'mixed' },
  RELIGION_FAIR_PROCESS: { label: 'Xử lý tín ngưỡng công bằng, theo hành vi', tone: 'good' },
  RELIGION_BLANKET_RESTRICTION: { label: 'Hạn chế tín ngưỡng diện rộng', tone: 'bad' },
  RELIGION_NEGLECT: { label: 'Bỏ mặc hành vi gây hại', tone: 'bad' },
  CARE_INFRASTRUCTURE: { label: 'Hạ tầng chăm sóc gia đình', tone: 'good' },
  SHORT_TERM_FAMILY_GRANT: { label: 'Trợ cấp gia đình ngắn hạn', tone: 'mixed' },
  CARE_GAP: { label: 'Khoảng trống chăm sóc', tone: 'bad' },
};

// Accepts 'FLAG', '-FLAG' / '!FLAG' (removed) or { id, removed }.
// What each policy legacy means in Hòa Minh (doc 02). Plain description, never a verdict.
export const FLAG_DESC = {
  LABOR_DIALOGUE: 'Đã có cơ chế thương lượng ba bên giữa người lao động, doanh nghiệp và Nhà nước; các xung đột lao động sau này dễ đối thoại hơn.',
  WAGE_SHOCK: 'Lương bị nâng gấp mà chưa có phương án đào tạo lại; đời sống cải thiện nhanh nhưng sản xuất và việc làm dễ bị sức ép về sau.',
  AUTOMATION_SKILLS: 'Người lao động được đào tạo để đi cùng tự động hóa thay vì bị thay thế.',
  ECON_BALANCED: 'Chuyển đổi kinh tế nhiều thành phần theo lộ trình, có kiểm soát và bảo vệ nhóm yếu thế.',
  ECON_OVERHEAT: 'Tăng trưởng nhanh nhưng thiếu kiểm soát; rủi ro bất bình đẳng và đầu cơ cao.',
  STAGNATION: 'Cải cách bị trì hoãn; nền sản xuất thiếu động lực đổi mới.',
  WELFARE_UNFUNDED: 'Phúc lợi được mở rộng nhưng chưa có nguồn thu bền vững đi kèm.',
  CONSULT_REAL: 'Người dân được tham vấn thực chất; ý kiến có thể làm thay đổi phương án.',
  CONSULT_TOKEN: 'Tham vấn chỉ mang tính thủ tục; người dân cảm thấy tiếng nói không được lắng nghe.',
  CONSULT_DELAY: 'Việc chốt phương án sau tham vấn bị kéo dài, dự án chậm lại.',
  ANTI_CORRUPTION_INDEPENDENT: 'Vụ việc được điều tra độc lập, đúng thủ tục và công khai kết quả.',
  ENFORCEMENT_SELECTIVE: 'Luật được thực thi có chọn lọc; niềm tin vào sự công bằng của pháp luật bị tổn hại.',
  CASE_DELAY: 'Hợp đồng bị đóng băng để chờ kết quả điều tra; dịch vụ công bị gián đoạn.',
  COALITION_BUILT: 'Liên minh công nhân – nông dân – trí thức được xây dựng qua lợi ích và chương trình chung.',
  SECTOR_BIAS: 'Một ngành dẫn dắt được ưu tiên, các nhóm và vùng khác bị để lại phía sau.',
  REGION_PARTICIPATION: 'Cộng đồng vùng được tham gia thiết kế dự án và chia sẻ lợi ích.',
  REGION_TOPDOWN: 'Dự án vùng được áp đặt từ trên xuống, thiếu tiếng nói của cộng đồng tại chỗ.',
  REGION_DELAY: 'Dự án vùng bị hoãn vô thời hạn; vấn đề hạ tầng và sinh kế chưa được giải quyết.',
  RELIGION_FAIR_PROCESS: 'Vụ việc liên quan tín ngưỡng được xử lý theo hành vi cụ thể và pháp luật, không quy chụp cả cộng đồng.',
  RELIGION_BLANKET_RESTRICTION: 'Hạn chế diện rộng đối với hoạt động tín ngưỡng; người không vi phạm cũng chịu thiệt.',
  RELIGION_NEGLECT: 'Hành vi gây hại núp bóng tín ngưỡng không được xử lý.',
  CARE_INFRASTRUCTURE: 'Đầu tư nhà trẻ, chăm sóc người già và hỗ trợ việc – nhà lâu dài.',
  SHORT_TERM_FAMILY_GRANT: 'Trợ cấp tiền mặt ngắn hạn cho gia đình; hiệu quả nhanh nhưng không bền.',
  CARE_GAP: 'Gánh nặng chăm sóc dồn lên từng gia đình, nhất là phụ nữ và nhóm yếu thế.',
};

export function flagInfo(f) {
  let id = typeof f === 'string' ? f : f?.id ?? f?.flag ?? '';
  let removed = typeof f === 'object' && f ? !!f.removed : false;
  if (/^[-!]/.test(id)) { removed = true; id = id.slice(1); }
  const known = FLAGS[id];
  const label = (typeof f === 'object' && f?.label) || known?.label || humanize(id);
  return { id, label, tone: known?.tone ?? 'mixed', removed, desc: FLAG_DESC[id] ?? '' };
}

function humanize(id) {
  return String(id).toLowerCase().replace(/_/g, ' ').replace(/^\w/, (c) => c.toUpperCase());
}

export const ENDING_TONES = { E1: 'good', E2: 'mixed', E3: 'mixed', E4: 'mixed', E5: 'neutral', E6: 'bad' };

export const PHASE_TAGS = {
  briefing: 'Giới thiệu',
  yearStart: 'Đầu năm',
  consequence: 'Hệ quả tiếp diễn',
  event: 'Tình huống chính',
  result: 'Kết quả',
  random: 'Biến cố',
  randomResult: 'Kết quả biến cố',
  finalRepair: 'Quyền cứu vãn',
  end: 'Tổng kết',
};
