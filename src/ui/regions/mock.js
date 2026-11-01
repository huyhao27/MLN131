// Mock RegionViews for ui-regions-demo.html (no sim, no world needed).
// Events follow doc 05: RV01 Hồ xuống thấp, RV05 Được mùa kho đầy, RV07 Đơn hàng lớn,
// H01 Xưởng phải chia ca, RV13 Nhà trẻ hết chỗ, RV20 Kho lạnh, RV04 Sạt lở đường.
// Numbers are illustrative only.

const svc = (id, label, need, have) => ({
  id, label, need, have, status: have >= need ? 'ok' : have >= need * 0.85 ? 'tight' : 'short',
});

function region(id, name, short, status, statusLabel, line, ind, trend, services, problems = [], projects = [], built = []) {
  return {
    id, name, short, status, statusLabel, line,
    indicators: { output: ind[0], wellbeing: ind[1], access: ind[2] },
    trend: { output: trend[0], wellbeing: trend[1], access: trend[2] },
    services, problems, projects, built,
  };
}

const LINKS = [
  { id: 'l1', from: 'VC', to: 'NN', service: 'water', label: 'Nước tưới từ hồ', capacity: 40, load: 34, status: 'ok' },
  { id: 'l2', from: 'VC', to: 'CN', service: 'power', label: 'Điện thủy điện', capacity: 30, load: 30, status: 'tight' },
  { id: 'l3', from: 'NN', to: 'CB', service: 'transport', label: 'Đường nông sản ra cảng', capacity: 25, load: 18, status: 'ok' },
  { id: 'l4', from: 'DC', to: 'CN', service: 'labor', label: 'Tuyến xe đưa đón', capacity: 20, load: 17, status: 'tight' },
  { id: 'l5', from: 'CB', to: 'CN', service: 'parts', label: 'Linh kiện nhập', capacity: 20, load: 12, status: 'ok' },
  { id: 'l6', from: 'TT', to: 'VC', service: 'health', label: 'Khám chữa bệnh', capacity: 10, load: 9, status: 'tight' },
];

// ---------- briefing ----------
const BRIEF_REGIONS = [
  region('CN', 'Công nghiệp Thiên Hà', 'Thiên Hà', 'stable', 'Ổn định', 'Xưởng chạy đủ ca, đơn hàng đều', [55, 50, 52], [0, 0, 0], [svc('power', 'Điện', 30, 31)]),
  region('NN', 'Đồng bằng nông nghiệp', 'Đồng bằng', 'stable', 'Ổn định', 'Lúa đang lên xanh', [52, 48, 46], [0, 0, 0], [svc('water', 'Nước tưới', 35, 36)]),
  region('TT', 'Đô thị trung tâm', 'Trung tâm', 'stable', 'Ổn định', 'Bệnh viện và trường nghề hoạt động bình thường', [50, 56, 64], [0, 0, 0], [svc('health', 'Y tế', 40, 42)]),
  region('DC', 'Khu dân cư', 'Khu dân cư', 'stable', 'Ổn định', 'Nhà trẻ còn ít chỗ trống', [40, 54, 55], [0, 0, 0], [svc('care', 'Chăm sóc trẻ', 20, 21)]),
  region('VC', 'Vùng cao Bản Mây', 'Bản Mây', 'attention', 'Cần quan tâm', 'Nhiều hộ còn xa trạm y tế', [36, 40, 30], [0, 0, 0], [svc('health', 'Y tế', 12, 7)]),
  region('CB', 'Duyên hải và cảng', 'Cảng', 'stable', 'Ổn định', 'Bến tàu hoạt động đều', [54, 50, 50], [0, 0, 0], [svc('port', 'Bến bãi', 25, 27)]),
];

export const MOCK_BRIEFING = {
  mode: 'regions', phase: 'briefing', period: 0, totalPeriods: 8,
  budget: 12, incomeNext: 8, upkeep: 0, slots: { used: 0, max: 2 },
  title: 'Hòa Minh cần một người điều phối',
  paragraphs: [
    'Đảo Hòa Minh có sáu vùng, mỗi vùng một nhịp sống: xưởng Thiên Hà, đồng bằng lúa, đô thị trung tâm, khu dân cư, vùng cao Bản Mây và bến cảng.',
    'Mỗi kỳ, vài vùng sẽ báo vấn đề hoặc cơ hội. Ngân sách có hạn và chỉ được thi công tối đa hai dự án dài hạn cùng lúc, nên bạn phải chọn ưu tiên.',
    'Quyết định ở vùng này có thể lan sang vùng khác. Hãy để ý các đường nối trên bản đồ.',
  ],
  regions: BRIEF_REGIONS,
  problems: [], projects: [], links: LINKS, news: [],
  national: { output: 48, wellbeing: 50, access: 50, gap: 26, overall: 49 },
};

// ---------- period 1: one mild problem + one opportunity ----------
const P1_PROBLEMS = [
  {
    instanceId: 'p1', rootId: 'RV01', code: 'RV01', origin: 'random', region: 'VC',
    title: 'Hồ xuống thấp', short: 'Hồ xuống thấp',
    text: 'Mùa khô đến sớm, mực nước hồ Bản Mây giảm. Kỳ tới hồ chỉ đủ nước cho một phần ruộng và nhà máy thủy điện.',
    severity: 1, status: 'open', deadline: 2, deadlineText: 'Còn 1 kỳ',
    affects: ['VC', 'NN', 'CN'],
    links: [
      { from: 'VC', to: 'NN', service: 'water', kind: 'risk', label: 'Nước tưới' },
      { from: 'VC', to: 'CN', service: 'power', kind: 'risk', label: 'Điện thủy điện' },
    ],
    causes: [],
    options: [
      { id: 'A', label: 'Ưu tiên nước tưới', cost: 2, upkeep: 0, upkeepFor: 0, delay: 0, delayText: 'Ngay', project: false,
        preview: 'Giữ vụ mùa ở đồng bằng; Thiên Hà có thể thiếu điện một kỳ', disabled: false, reason: null },
      { id: 'B', label: 'Thuê điện tạm, chia nước theo nhu cầu', cost: 5, upkeep: 1, upkeepFor: 2, delay: 0, delayText: 'Ngay', project: false,
        preview: 'Cả ruộng và xưởng đều đủ, nhưng tốn phí duy trì hai kỳ', disabled: false, reason: null },
      { id: 'C', label: 'Tiết kiệm luân phiên', cost: 1, upkeep: 0, upkeepFor: 0, delay: 0, delayText: 'Ngay', project: false,
        preview: 'Mỗi vùng giảm nhẹ công suất; cần theo dõi mực hồ', disabled: false, reason: null },
    ],
    wait: { preview: 'Kỳ tới: đồng bằng thiếu nước tưới và Thiên Hà thiếu điện nếu không có nguồn thay' },
    chosen: null,
    learn: { topic: 'Phối hợp vùng và nguồn lực chung', chapter: 5, note: 'Lợi ích của nông dân và công nhân gắn với nhau qua nguồn nước và điện chung; điều phối là nền của liên minh.' },
  },
  {
    instanceId: 'p2', rootId: 'RV07', code: 'RV07', origin: 'opportunity', region: 'CN',
    title: 'Đơn hàng lớn, hạn giao gần', short: 'Đơn hàng lớn',
    text: 'Một đối tác đặt lô hàng lớn, giao trong hai kỳ. Xưởng có thể nhận, nhưng cần thêm người và vận tải ra cảng.',
    severity: 1, status: 'open', deadline: 2, deadlineText: 'Còn 1 kỳ',
    affects: ['CN', 'CB', 'DC'],
    links: [
      { from: 'CN', to: 'CB', service: 'transport', kind: 'benefit', label: 'Hàng ra cảng' },
      { from: 'DC', to: 'CN', service: 'labor', kind: 'risk', label: 'Thêm lao động' },
    ],
    causes: [],
    options: [
      { id: 'A', label: 'Nhận một phần', cost: 1, upkeep: 0, upkeepFor: 0, delay: 1, delayText: 'Sau 1 kỳ', project: false,
        preview: 'Lợi nhuận vừa, xưởng và cảng không bị quá tải', disabled: false, reason: null },
      { id: 'B', label: 'Nhận đủ, thuê thêm năng lực', cost: 4, upkeep: 0, upkeepFor: 0, delay: 1, delayText: 'Sau 1 kỳ', project: false,
        preview: 'Lợi nhuận cao; cần đủ điện và chỗ ở cho người lao động mới', disabled: false, reason: null },
      { id: 'C', label: 'Thương lượng dời hạn giao', cost: 0, upkeep: 0, upkeepFor: 0, delay: 2, delayText: 'Sau 2 kỳ', project: false,
        preview: 'Lợi nhuận thấp hơn nhưng có thời gian chuẩn bị', disabled: false, reason: null },
    ],
    wait: { preview: 'Bỏ qua: mất cơ hội, không bị phạt' },
    chosen: null,
    learn: { topic: 'Giai cấp công nhân và sản xuất hiện đại', chapter: 2, note: 'Mở rộng sản xuất đi cùng việc bảo đảm điều kiện làm việc, nhà ở và đi lại cho người lao động.' },
  },
];

export const MOCK_P1 = {
  mode: 'regions', phase: 'period', period: 1, totalPeriods: 8,
  budget: 12, incomeNext: 8, upkeep: 0, slots: { used: 0, max: 2 },
  regions: [
    region('CN', 'Công nghiệp Thiên Hà', 'Thiên Hà', 'opportunity', 'Có cơ hội', 'Có đơn hàng lớn, xưởng đang cân nhắc', [55, 50, 52], [0, 0, 0],
      [svc('power', 'Điện', 30, 30), svc('labor', 'Lao động', 40, 41)], ['p2']),
    region('NN', 'Đồng bằng nông nghiệp', 'Đồng bằng', 'stable', 'Ổn định', 'Lúa đang lên xanh, kênh còn nước', [52, 48, 46], [0, 0, 0],
      [svc('water', 'Nước tưới', 35, 36), svc('transport', 'Vận chuyển', 20, 22)]),
    BRIEF_REGIONS[2],
    BRIEF_REGIONS[3],
    region('VC', 'Vùng cao Bản Mây', 'Bản Mây', 'attention', 'Cần quan tâm', 'Hồ đang cạn dần, mùa khô đến sớm', [36, 40, 30], [0, 0, 0],
      [svc('reservoir', 'Nước trong hồ', 50, 34), svc('health', 'Y tế', 12, 7)], ['p1']),
    BRIEF_REGIONS[5],
  ],
  problems: P1_PROBLEMS,
  projects: [],
  links: LINKS,
  news: [
    { period: 1, text: 'Mùa khô đến sớm ở Bản Mây, mực hồ giảm', tone: 'bad', chain: [], region: 'VC' },
    { period: 1, text: 'Thiên Hà nhận được lời mời đặt hàng lớn', tone: 'good', chain: [], region: 'CN' },
  ],
  national: { output: 48, wellbeing: 50, access: 50, gap: 26, overall: 49 },
};

// ---------- period 4: several open problems, a consequence, a working project ----------
export const MOCK_P4 = {
  mode: 'regions', phase: 'period', period: 4, totalPeriods: 8,
  budget: 7, incomeNext: 6, upkeep: 2, slots: { used: 2, max: 2 },
  regions: [
    region('CN', 'Công nghiệp Thiên Hà', 'Thiên Hà', 'attention', 'Cần quan tâm', 'Thiếu điện, xưởng phải chia ca', [49, 47, 52], [-6, -2, 0],
      [svc('power', 'Điện', 32, 24), svc('labor', 'Lao động', 44, 43), svc('parts', 'Linh kiện', 20, 22)], ['p3'], ['j2']),
    region('NN', 'Đồng bằng nông nghiệp', 'Đồng bằng', 'opportunity', 'Có cơ hội', 'Được mùa lớn nhưng kho chỉ giữ thêm một kỳ', [68, 58, 47], [9, 4, 0],
      [svc('water', 'Nước tưới', 35, 35), svc('storage', 'Kho bảo quản', 30, 18), svc('transport', 'Vận chuyển', 24, 22)], ['p4'], [], ['canal']),
    region('TT', 'Đô thị trung tâm', 'Trung tâm', 'stable', 'Ổn định', 'Dịch vụ công hoạt động đều', [51, 57, 65], [1, 1, 0],
      [svc('health', 'Y tế', 42, 43), svc('training', 'Đào tạo nghề', 20, 21)]),
    region('DC', 'Khu dân cư', 'Khu dân cư', 'urgent', 'Khẩn cấp', 'Nhà trẻ hết chỗ, nhiều phụ huynh phải nghỉ làm', [41, 46, 49], [0, -5, -3],
      [svc('care', 'Chăm sóc trẻ', 28, 19), svc('housing', 'Nhà ở', 40, 37), svc('transport', 'Xe đưa đón', 20, 17)], ['p5']),
    region('VC', 'Vùng cao Bản Mây', 'Bản Mây', 'attention', 'Cần quan tâm', 'Đường lên bản đang gia cố, xe tải đi chậm', [37, 42, 31], [1, 1, 1],
      [svc('reservoir', 'Nước trong hồ', 50, 41), svc('road', 'Đường kết nối', 15, 9), svc('health', 'Y tế', 12, 8)], ['p6'], ['j1']),
    region('CB', 'Duyên hải và cảng', 'Cảng', 'opportunity', 'Có cơ hội', 'Có nhà đầu tư muốn làm kho lạnh', [56, 51, 50], [2, 0, 0],
      [svc('port', 'Bến bãi', 26, 27), svc('power', 'Điện', 12, 12)], ['p7']),
  ],
  problems: [
    {
      instanceId: 'p3', rootId: 'RV01', code: 'H01', origin: 'consequence', region: 'CN',
      title: 'Xưởng phải chia ca', short: 'Xưởng chia ca',
      text: 'Kỳ trước nước được ưu tiên cho ruộng, thủy điện giảm. Xưởng thiếu 8 phần điện nên phải chia ca, một số đơn bị chậm.',
      severity: 2, status: 'open', deadline: 5, deadlineText: 'Còn 1 kỳ',
      affects: ['CN', 'DC', 'VC'],
      links: [
        { from: 'VC', to: 'CN', service: 'power', kind: 'active', label: 'Điện thủy điện thiếu' },
        { from: 'DC', to: 'CN', service: 'labor', kind: 'risk', label: 'Lịch xe đưa đón' },
      ],
      causes: ['Hồ xuống thấp', 'Điện thiếu'],
      options: [
        { id: 'A', label: 'Thuê nguồn điện tạm', cost: 3, upkeep: 1, upkeepFor: 2, delay: 0, delayText: 'Ngay', project: false,
          preview: 'Xưởng chạy lại đủ ca; tốn phí hai kỳ, chưa giải quyết gốc', disabled: false, reason: null },
        { id: 'B', label: 'Thỏa thuận lịch sản xuất mới', cost: 1, upkeep: 0, upkeepFor: 0, delay: 0, delayText: 'Ngay', project: false,
          preview: 'Ít tốn; khu dân cư cần đổi giờ xe đưa đón cho khớp ca', disabled: false, reason: null },
        { id: 'C', label: 'Giảm nhận đơn kỳ này', cost: 0, upkeep: 0, upkeepFor: 0, delay: 0, delayText: 'Ngay', project: false,
          preview: 'Không tốn ngân sách; thu nhập công nhân giảm một kỳ', disabled: false, reason: null },
      ],
      wait: { preview: 'Kỳ tới: sản lượng Thiên Hà giảm thêm, khu dân cư mất một phần thu nhập' },
      chosen: null,
      learn: { topic: 'Điều kiện làm việc của giai cấp công nhân', chapter: 2, note: 'Thay đổi ca làm cần thỏa thuận với người lao động và tính đến việc đi lại, chăm sóc gia đình.' },
    },
    {
      instanceId: 'p4', rootId: 'RV05', code: 'RV05', origin: 'random', region: 'NN',
      title: 'Được mùa, kho đã đầy!', short: 'Kho đã đầy',
      text: 'Vụ này được mùa, nhưng kho chỉ giữ thêm một kỳ. Đẩy hết ra cảng lúc này có thể làm ùn hàng.',
      severity: 2, status: 'open', deadline: 5, deadlineText: 'Còn 1 kỳ',
      affects: ['NN', 'CB', 'DC'],
      links: [
        { from: 'NN', to: 'CB', service: 'transport', kind: 'risk', label: 'Dồn xe ra cảng' },
        { from: 'NN', to: 'DC', service: 'food', kind: 'benefit', label: 'Thực phẩm rẻ cho khu ở' },
      ],
      causes: [],
      options: [
        { id: 'A', label: 'Thuê kho tạm', cost: 2, upkeep: 1, upkeepFor: 1, delay: 0, delayText: 'Ngay', project: false,
          preview: 'Mua thêm một kỳ để bán dần', disabled: false, reason: null },
        { id: 'B', label: 'Chuyển một phần đến khu dân cư', cost: 1, upkeep: 0, upkeepFor: 0, delay: 0, delayText: 'Ngay', project: false,
          preview: 'Khu dân cư có thực phẩm rẻ; nông dân bán giá thấp hơn', disabled: false, reason: null },
        { id: 'C', label: 'Đầu tư kho bảo quản', cost: 6, upkeep: 0, upkeepFor: 0, delay: 2, delayText: 'Sau 2 kỳ', project: true,
          preview: 'Giữ được các vụ sau; vụ này vẫn cần phương án tạm', disabled: true, reason: 'Đã đủ 2 dự án đang thi công' },
      ],
      wait: { preview: 'Kỳ tới: một phần nông sản hỏng, giá lúa giảm' },
      chosen: null,
      learn: { topic: 'Liên minh công – nông – trí thức', chapter: 5, note: 'Đầu ra cho nông sản phụ thuộc vận tải, kho và thị trường của các vùng khác.' },
    },
    {
      instanceId: 'p5', rootId: 'RV13', code: 'RV13', origin: 'random', region: 'DC',
      title: 'Nhà trẻ hết chỗ', short: 'Nhà trẻ hết chỗ',
      text: 'Lao động mới chuyển đến làm ở Thiên Hà, nhà trẻ đã kín. Nhiều phụ huynh phải xin nghỉ để trông con.',
      severity: 3, status: 'open', deadline: 4, deadlineText: 'Hết hạn kỳ này',
      affects: ['DC', 'CN', 'TT'],
      links: [
        { from: 'DC', to: 'CN', service: 'labor', kind: 'active', label: 'Thiếu người đi làm' },
        { from: 'DC', to: 'TT', service: 'labor', kind: 'risk', label: 'Nhân viên dịch vụ nghỉ' },
      ],
      causes: ['Đơn hàng lớn', 'Lao động mới chuyển đến'],
      options: [
        { id: 'A', label: 'Mở thêm lớp ở trường đủ điều kiện', cost: 3, upkeep: 1, upkeepFor: 0, delay: 1, delayText: 'Sau 1 kỳ', project: false,
          preview: 'Thêm chỗ từ kỳ tới, có phí duy trì lâu dài', disabled: false, reason: null },
        { id: 'B', label: 'Hỗ trợ đưa trẻ đến nơi còn chỗ', cost: 1, upkeep: 0, upkeepFor: 0, delay: 0, delayText: 'Ngay', project: false,
          preview: 'Giải tỏa ngay một phần; phụ thuộc xe đưa đón đang sát tải', disabled: false, reason: null },
        { id: 'C', label: 'Xây điểm chăm sóc mới', cost: 6, upkeep: 0, upkeepFor: 0, delay: 2, delayText: 'Sau 2 kỳ', project: true,
          preview: 'Đủ chỗ lâu dài; trong lúc chờ vẫn cần hỗ trợ', disabled: true, reason: 'Đã đủ 2 dự án đang thi công' },
      ],
      wait: { preview: 'Kỳ tới: Thiên Hà và Trung tâm thiếu người; đời sống khu dân cư giảm' },
      chosen: null,
      learn: { topic: 'Gia đình và dịch vụ chăm sóc', chapter: 7, note: 'Dịch vụ chăm sóc trẻ giúp gia đình thực hiện chức năng nuôi dạy mà vẫn tham gia lao động.' },
    },
    {
      instanceId: 'p6', rootId: 'RV04', code: 'RV04', origin: 'random', region: 'VC',
      title: 'Sạt lở đường lên bản', short: 'Sạt lở đường',
      text: 'Mưa lớn làm sạt một đoạn đường. Bạn đã chọn sửa và gia cố; xe vẫn đi chậm cho tới khi xong.',
      severity: 2, status: 'working', deadline: null, deadlineText: null,
      affects: ['VC', 'TT'],
      links: [{ from: 'TT', to: 'VC', service: 'health', kind: 'active', label: 'Khám chữa bệnh đi chậm' }],
      causes: [],
      options: [
        { id: 'A', label: 'Mở tuyến tạm', cost: 3, upkeep: 0, upkeepFor: 0, delay: 1, delayText: 'Sau 1 kỳ', project: false, preview: 'Đi lại được nhưng tải thấp', disabled: false, reason: null },
        { id: 'B', label: 'Sửa và gia cố', cost: 6, upkeep: 0, upkeepFor: 0, delay: 2, delayText: 'Sau 2 kỳ', project: true, preview: 'Bền hơn, ít sạt lại', disabled: false, reason: null },
        { id: 'C', label: 'Chở hàng thiết yếu chuyên biệt', cost: 2, upkeep: 1, upkeepFor: 2, delay: 0, delayText: 'Ngay', project: false, preview: 'Chỉ cứu trợ, chưa khôi phục buôn bán', disabled: false, reason: null },
      ],
      wait: { preview: '' },
      chosen: { option: 'B', label: 'Sửa và gia cố', period: 3, completesAt: 5 },
      learn: { topic: 'Tham vấn cộng đồng khi làm hạ tầng', chapter: 6, note: 'Công trình ở vùng cao cần lắng nghe cộng đồng địa phương về tuyến đường và đất canh tác.' },
    },
    {
      instanceId: 'p7', rootId: 'RV20', code: 'RV20', origin: 'opportunity', region: 'CB',
      title: 'Có đề nghị đầu tư kho lạnh', short: 'Kho lạnh',
      text: 'Một doanh nghiệp muốn cùng làm kho lạnh ở cảng. Nông sản đồng bằng sẽ ít hỏng hơn, nhưng lưới điện phải gánh thêm tải.',
      severity: 1, status: 'open', deadline: 6, deadlineText: 'Còn 2 kỳ',
      affects: ['CB', 'NN', 'CN'],
      links: [
        { from: 'CB', to: 'NN', service: 'storage', kind: 'benefit', label: 'Giữ nông sản lâu hơn' },
        { from: 'CN', to: 'CB', service: 'power', kind: 'risk', label: 'Thêm tải điện' },
      ],
      causes: [],
      options: [
        { id: 'A', label: 'Làm kho nhỏ trước', cost: 4, upkeep: 0, upkeepFor: 0, delay: 1, delayText: 'Sau 1 kỳ', project: true,
          preview: 'Đỡ hỏng hàng một phần, tải điện tăng ít', disabled: true, reason: 'Đã đủ 2 dự án đang thi công' },
        { id: 'B', label: 'Kho lớn kèm nâng cấp điện', cost: 9, upkeep: 0, upkeepFor: 0, delay: 2, delayText: 'Sau 2 kỳ', project: true,
          preview: 'Lợi ích lớn, không gây thiếu điện', disabled: true, reason: 'Cần 9, ngân sách còn 7' },
        { id: 'C', label: 'Thuê dịch vụ bảo quản', cost: 1, upkeep: 1, upkeepFor: 0, delay: 0, delayText: 'Ngay', project: false,
          preview: 'Không có tài sản mới; phí trả mỗi kỳ', disabled: false, reason: null },
      ],
      wait: { preview: 'Bỏ qua: cơ hội hết hạn sau kỳ 6, không bị phạt' },
      chosen: null,
      learn: { topic: 'Kinh tế nhiều thành phần trong thời kỳ quá độ', chapter: 3, note: 'Hợp tác công – tư cần quy định rõ quyền tiếp cận và lợi ích cho nông dân.' },
    },
  ],
  projects: [
    { id: 'j1', key: 'road_vc', label: 'Gia cố đường lên bản', region: 'VC', startedAt: 3, doneAt: 5, doneText: 'Hoàn tất kỳ tới', done: false },
    { id: 'j2', key: 'grid_cn', label: 'Nâng cấp trạm điện', region: 'CN', startedAt: 3, doneAt: 6, doneText: 'Còn 2 kỳ', done: false },
    { id: 'j0', key: 'canal', label: 'Sửa kênh dẫn', region: 'NN', startedAt: 2, doneAt: 3, doneText: 'Đã xong ở kỳ 3', done: true },
  ],
  links: LINKS,
  news: [
    { period: 4, text: 'Xưởng Thiên Hà phải chia ca vì thiếu điện', tone: 'bad', chain: ['Hồ xuống thấp', 'Điện thiếu', 'Xưởng chia ca'], region: 'CN' },
    { period: 4, text: 'Kênh đã thông, ruộng có nước trở lại và được mùa lớn', tone: 'good', chain: ['Sửa kênh dẫn', 'Ruộng đủ nước', 'Được mùa'], region: 'NN' },
    { period: 4, text: 'Nhà trẻ khu dân cư đã kín chỗ', tone: 'bad', chain: ['Đơn hàng lớn', 'Lao động mới chuyển đến', 'Nhà trẻ hết chỗ'], region: 'DC' },
    { period: 3, text: 'Đơn hàng lớn đã giao đúng hạn', tone: 'good', chain: [], region: 'CN' },
  ],
  national: { output: 50, wellbeing: 50, access: 49, gap: 27, overall: 49 },
};

// ---------- end summary ----------
export const MOCK_END = {
  mode: 'regions', phase: 'end', period: 8, totalPeriods: 8,
  budget: 5, incomeNext: 0, upkeep: 1, slots: { used: 0, max: 2 },
  regions: MOCK_P4.regions,
  problems: [], projects: MOCK_P4.projects, links: LINKS, news: [],
  national: { output: 58, wellbeing: 56, access: 55, gap: 21, overall: 56 },
  summary: {
    headline: 'Đồng bằng no đủ, Thiên Hà vững lại, Bản Mây vẫn đi chậm',
    text: 'Bạn cứu vụ mùa ngay kỳ đầu, chấp nhận để xưởng chia ca một thời gian rồi xử lý bằng thỏa thuận lịch làm. Khu dân cư có thêm chỗ chăm sóc trẻ, nhưng vùng cao mới có đường, dịch vụ y tế chưa theo kịp.',
    before: {
      CN: { output: 55, wellbeing: 50, access: 52 }, NN: { output: 52, wellbeing: 48, access: 46 },
      TT: { output: 50, wellbeing: 56, access: 64 }, DC: { output: 40, wellbeing: 54, access: 55 },
      VC: { output: 36, wellbeing: 40, access: 30 }, CB: { output: 54, wellbeing: 50, access: 50 },
    },
    after: {
      CN: { output: 63, wellbeing: 57, access: 55 }, NN: { output: 71, wellbeing: 62, access: 50 },
      TT: { output: 54, wellbeing: 60, access: 67 }, DC: { output: 46, wellbeing: 61, access: 63 },
      VC: { output: 41, wellbeing: 44, access: 36 }, CB: { output: 62, wellbeing: 53, access: 51 },
    },
    improved: [
      { region: 'NN', text: 'Kênh dẫn và kho bảo quản giữ được hai vụ mùa' },
      { region: 'DC', text: 'Điểm chăm sóc mới giúp phụ huynh đi làm trở lại' },
      { region: 'CN', text: 'Trạm điện nâng cấp, xưởng không còn chia ca' },
    ],
    leftBehind: [
      { region: 'VC', text: 'Đường đã thông nhưng trạm y tế vẫn xa; tiếp cận dịch vụ thấp nhất đảo' },
    ],
    chains: [
      { title: 'Cứu ruộng, xưởng chia ca', period: 1, steps: ['Hồ Bản Mây xuống thấp', 'Bạn ưu tiên nước tưới', 'Thủy điện giảm, Thiên Hà thiếu điện', 'Xưởng thỏa thuận lịch ca mới', 'Trạm điện nâng cấp ở kỳ 6'] },
      { title: 'Được mùa nhưng kho đầy', period: 4, steps: ['Kênh dẫn hoàn tất, ruộng đủ nước', 'Được mùa lớn, kho chỉ giữ một kỳ', 'Chuyển một phần đến khu dân cư', 'Khu dân cư có thực phẩm rẻ hơn'] },
      { title: 'Xưởng lớn lên, nhà trẻ chật', period: 2, steps: ['Nhận đủ đơn hàng lớn', 'Lao động mới chuyển đến khu dân cư', 'Nhà trẻ hết chỗ', 'Hỗ trợ đưa trẻ tới nơi còn chỗ', 'Điểm chăm sóc mới mở ở kỳ 7'] },
    ],
    openProblems: [
      { region: 'VC', title: 'Trạm y tế còn xa' },
      { region: 'CB', title: 'Tàu đến cùng một lúc' },
    ],
    topics: [
      { chapter: 2, topic: 'Giai cấp công nhân và điều kiện làm việc', seen: true, via: ['Xưởng phải chia ca → Thỏa thuận lịch sản xuất mới', 'Đơn hàng lớn → Nhận đủ, thuê thêm năng lực'] },
      { chapter: 3, topic: 'Kinh tế nhiều thành phần trong thời kỳ quá độ', seen: true, via: ['Kho lạnh → Thuê dịch vụ bảo quản'] },
      { chapter: 5, topic: 'Liên minh công – nông – trí thức', seen: true, via: ['Hồ xuống thấp → Ưu tiên nước tưới', 'Được mùa, kho đã đầy → Chuyển một phần đến khu dân cư'] },
      { chapter: 6, topic: 'Tham vấn cộng đồng vùng cao', seen: true, via: ['Sạt lở đường lên bản → Sửa và gia cố'] },
      { chapter: 7, topic: 'Gia đình và dịch vụ chăm sóc', seen: true, via: ['Nhà trẻ hết chỗ → Hỗ trợ đưa trẻ đến nơi còn chỗ'] },
      { chapter: 4, topic: 'Dân chủ cơ sở và quyền tham gia', seen: false, via: [] },
    ],
    timeline: [
      { period: 1, national: { output: 48, wellbeing: 50, access: 50, gap: 26 } },
      { period: 2, national: { output: 50, wellbeing: 50, access: 50, gap: 27 } },
      { period: 3, national: { output: 49, wellbeing: 51, access: 50, gap: 28 } },
      { period: 4, national: { output: 50, wellbeing: 50, access: 49, gap: 27 } },
      { period: 5, national: { output: 53, wellbeing: 52, access: 51, gap: 25 } },
      { period: 6, national: { output: 55, wellbeing: 54, access: 52, gap: 24 } },
      { period: 7, national: { output: 57, wellbeing: 55, access: 54, gap: 22 } },
      { period: 8, national: { output: 58, wellbeing: 56, access: 55, gap: 21 } },
    ],
    decisions: [
      { period: 1, region: 'VC', title: 'Hồ xuống thấp', option: 'Ưu tiên nước tưới' },
      { period: 1, region: 'CN', title: 'Đơn hàng lớn, hạn giao gần', option: 'Nhận đủ, thuê thêm năng lực' },
      { period: 2, region: 'NN', title: 'Ruộng thiếu nước', option: 'Sửa kênh dẫn' },
      { period: 3, region: 'VC', title: 'Sạt lở đường lên bản', option: 'Sửa và gia cố' },
      { period: 4, region: 'CN', title: 'Xưởng phải chia ca', option: 'Thỏa thuận lịch sản xuất mới' },
      { period: 4, region: 'NN', title: 'Được mùa, kho đã đầy!', option: 'Chuyển một phần đến khu dân cư' },
      { period: 4, region: 'DC', title: 'Nhà trẻ hết chỗ', option: 'Hỗ trợ đưa trẻ đến nơi còn chỗ' },
      { period: 5, region: 'DC', title: 'Nhà trẻ hết chỗ', option: 'Xây điểm chăm sóc mới' },
    ],
  },
};

export const MOCK_VIEWS = [MOCK_BRIEFING, MOCK_P1, MOCK_P4, MOCK_END];
export const MOCK_LABELS = ['Giới thiệu', 'Kỳ 1 · nhẹ + cơ hội', 'Kỳ 4 · nhiều việc', 'Tổng kết'];

// Fake anchors as fractions of the viewport, roughly following the island layout
// (x east, z south): VC north-west, NN west, TT centre, DC centre-south-east, CN north-east, CB south-east.
export const MOCK_ANCHORS = {
  CN: { x: 0.70, y: 0.36 },
  NN: { x: 0.24, y: 0.58 },
  TT: { x: 0.46, y: 0.55 },
  DC: { x: 0.58, y: 0.66 },
  VC: { x: 0.17, y: 0.30 },
  CB: { x: 0.82, y: 0.78 },
};
