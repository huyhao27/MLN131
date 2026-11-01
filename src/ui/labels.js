// Display labels (Vietnamese) for ids coming from the sim. Pure data, no DOM.

export const METRICS = [
  { key: 'PROD', name: 'Năng lực sản xuất', short: 'Sản xuất', color: '#8a5523' },
  { key: 'LIFE', name: 'Đời sống & an sinh', short: 'Đời sống', color: '#b4492a' },
  { key: 'TRUST', name: 'Niềm tin & tham gia', short: 'Niềm tin', color: '#2f6688' },
  { key: 'LAW', name: 'Pháp quyền & liêm chính', short: 'Pháp quyền', color: '#5b4a8e' },
  { key: 'EQUITY', name: 'Công bằng cơ hội', short: 'Công bằng', color: '#3b7448' },
  { key: 'COHESION', name: 'Đoàn kết & ổn định', short: 'Đoàn kết', color: '#9a7614' },
];
export const METRIC_BY_KEY = Object.fromEntries(METRICS.map((m) => [m.key, m]));

// `bad: true` -> an increase is unfavourable (debt).
export const RESOURCES = [
  { key: 'BUDGET', name: 'Ngân sách', short: 'Ngân sách' },
  { key: 'CAPACITY', name: 'Năng lực thực thi', short: 'Năng lực' },
  { key: 'DEBT', name: 'Áp lực nợ', short: 'Nợ', bad: true },
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
export function flagInfo(f) {
  let id = typeof f === 'string' ? f : f?.id ?? f?.flag ?? '';
  let removed = typeof f === 'object' && f ? !!f.removed : false;
  if (/^[-!]/.test(id)) { removed = true; id = id.slice(1); }
  const known = FLAGS[id];
  const label = (typeof f === 'object' && f?.label) || known?.label || humanize(id);
  return { id, label, tone: known?.tone ?? 'mixed', removed };
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
