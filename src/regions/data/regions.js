// The six functional regions (doc 04 §3, doc 05 §2) and the service links between them.

export const REGIONS = {
  CN: {
    name: 'Công nghiệp Thiên Hà', short: 'Thiên Hà', role: 'Hàng hóa, việc làm',
    base: { output: 60, wellbeing: 50, access: 56 },
    calm: ['Nhà máy chạy đều ca', 'Xưởng giữ nhịp sản xuất ổn định'],
    services: ['power', 'components', 'labor'],
  },
  NN: {
    name: 'Đồng bằng nông nghiệp', short: 'Đồng bằng', role: 'Lương thực, nông sản',
    base: { output: 55, wellbeing: 50, access: 48 },
    calm: ['Ruộng đủ nước, hợp tác xã vào vụ', 'Đồng ruộng xanh, đầu ra thông suốt'],
    services: ['water', 'outlet'],
  },
  TT: {
    name: 'Đô thị trung tâm', short: 'Trung tâm', role: 'Y tế, đào tạo, dịch vụ công',
    base: { output: 55, wellbeing: 56, access: 64 },
    calm: ['Bệnh viện và trường nghề làm việc bình thường', 'Dịch vụ công vận hành đều'],
    services: ['power', 'health'],
  },
  DC: {
    name: 'Khu dân cư', short: 'Khu dân cư', role: 'Lao động, đời sống gia đình',
    base: { output: 45, wellbeing: 52, access: 56 },
    calm: ['Khu phố yên ả, trẻ đến lớp đúng giờ', 'Chợ đông, giá cả ổn định'],
    services: ['power', 'water', 'housing', 'care', 'food'],
  },
  VC: {
    name: 'Vùng cao Bản Mây', short: 'Bản Mây', role: 'Nguồn nước, điện, nông sản vùng cao',
    base: { output: 38, wellbeing: 42, access: 34 },
    calm: ['Đường lên bản thông, chợ phiên họp đều', 'Bản Mây yên bình bên hồ'],
    services: ['access', 'water'],
  },
  CB: {
    name: 'Duyên hải và cảng', short: 'Cảng', role: 'Xuất nhập hàng, kho vận',
    base: { output: 58, wellbeing: 50, access: 50 },
    calm: ['Tàu ra vào đúng lịch', 'Bến bãi thông thoáng'],
    services: ['power', 'port', 'portLabor'],
  },
};

export const SERVICE_LABELS = {
  power: 'Điện',
  water: 'Nước',
  'water:NN': 'Nước tưới',
  'water:DC': 'Nước sinh hoạt',
  'water:VC': 'Nước sinh hoạt',
  outlet: 'Đầu ra nông sản',
  port: 'Công suất bến',
  components: 'Linh kiện',
  labor: 'Lao động đi ca',
  housing: 'Chỗ ở',
  care: 'Chăm sóc trẻ',
  food: 'Thực phẩm',
  health: 'Khám chữa bệnh',
  access: 'Đường ra trung tâm',
  portLabor: 'Nhân lực bến',
};

export const serviceLabel = (service, region) => SERVICE_LABELS[`${service}:${region}`] || SERVICE_LABELS[service] || service;

// Network links (doc 05 §2). capacity/load are filled in by the engine each period.
export const LINKS = [
  { id: 'VC-NN-water', from: 'VC', to: 'NN', service: 'water', label: 'Kênh tưới từ hồ Bản Mây' },
  { id: 'VC-CN-power', from: 'VC', to: 'CN', service: 'power', label: 'Điện thủy điện' },
  { id: 'CN-TT-power', from: 'CN', to: 'TT', service: 'power', label: 'Lưới điện trung tâm' },
  { id: 'CN-DC-power', from: 'CN', to: 'DC', service: 'power', label: 'Lưới điện khu dân cư' },
  { id: 'CN-CB-power', from: 'CN', to: 'CB', service: 'power', label: 'Lưới điện cảng' },
  { id: 'NN-CB-goods', from: 'NN', to: 'CB', service: 'transport', label: 'Đường nông sản ra cảng' },
  { id: 'NN-DC-food', from: 'NN', to: 'DC', service: 'food', label: 'Thực phẩm vào khu dân cư' },
  { id: 'CB-CN-goods', from: 'CB', to: 'CN', service: 'goods', label: 'Linh kiện nhập khẩu' },
  { id: 'CN-CB-goods', from: 'CN', to: 'CB', service: 'transport', label: 'Hàng xuất ra cảng' },
  { id: 'DC-CN-labor', from: 'DC', to: 'CN', service: 'labor', label: 'Xe đưa đón đi ca' },
  { id: 'DC-CB-labor', from: 'DC', to: 'CB', service: 'labor', label: 'Nhân lực bến' },
  { id: 'TT-DC-care', from: 'TT', to: 'DC', service: 'health', label: 'Y tế, đào tạo' },
  { id: 'TT-VC-road', from: 'TT', to: 'VC', service: 'access', label: 'Đường lên bản' },
];

// Finished projects: permanent parameter changes and regional potential (doc 05 §8:
// a project gives its full benefit only once complete).
export const BUILT = {
  canal: { label: 'Kênh dẫn mới', region: 'NN', params: { waterBase: 10 }, potential: { NN: { output: 6 } } },
  power_reserve: { label: 'Nguồn điện dự phòng', region: 'CN', params: { reservePower: 12 } },
  cold_storage: { label: 'Kho lạnh', region: 'CB', params: { storage: 12, 'pwDem.NN': 4 }, potential: { NN: { output: 5, wellbeing: 3 } } },
  cold_small: { label: 'Kho lạnh nhỏ', region: 'CB', params: { storage: 6, 'pwDem.NN': 2 }, potential: { NN: { output: 2 } } },
  housing: { label: 'Khu nhà ở mới', region: 'DC', params: { housingCap: 18 }, potential: { DC: { wellbeing: 6 } } },
  care_center: { label: 'Điểm chăm sóc mới', region: 'DC', params: { careCap: 10 }, potential: { DC: { wellbeing: 5 } } },
  care_point: { label: 'Điểm chăm sóc trên khu đất trống', region: 'DC', params: { careCap: 7 }, potential: { DC: { wellbeing: 3 } } },
  green_space: { label: 'Không gian xanh công cộng', region: 'DC', params: {}, potential: { DC: { wellbeing: 6 } } },
  clinic: { label: 'Điểm khám địa phương', region: 'VC', params: { healthNeed: -8, vcService: 2 }, potential: { VC: { access: 9 }, DC: { access: 3 } } },
  road_vc: { label: 'Đường lên bản gia cố', region: 'VC', params: { roadTTVC: 6 }, potential: { VC: { access: 12, output: 6 } } },
  berth: { label: 'Bến mở rộng', region: 'CB', params: { portCap: 15 }, potential: { CB: { output: 6 } } },
  bridge: { label: 'Cầu sửa xong', region: 'TT', params: {}, potential: { TT: { access: 3 } } },
  bus_line: { label: 'Tuyến xe kết nối mới', region: 'DC', params: { commuteCap: 10 }, potential: { DC: { access: 6 } } },
  supplier: { label: 'Nhà cung ứng nội địa', region: 'CN', params: { compImport: -5, stockMax: 6 }, potential: { CN: { output: 3 } } },
  training: { label: 'Chương trình đào tạo theo ca', region: 'CN', params: {}, potential: { CN: { output: 8, wellbeing: 3 } } },
  heat_link: { label: 'Đường nhiệt thải sang lò sấy', region: 'CN', params: {}, potential: { NN: { output: 6 }, CN: { wellbeing: 2 } } },
  heat_pilot: { label: 'Thí điểm nhiệt thải', region: 'CN', params: {}, potential: { NN: { output: 3 } } },
  community_road: { label: 'Đường lên bản đồng thiết kế', region: 'VC', params: { roadTTVC: 6 }, potential: { VC: { access: 12, output: 6, wellbeing: 5 } } },
  market: { label: 'Chợ phiên', region: 'TT', params: { outletDomestic: 3 }, potential: { DC: { wellbeing: 3 } } },
};

// MLN131 topics (doc 04 §9). The end report lists which were met through real decisions.
export const TOPICS = {
  labor: { chapter: 2, topic: 'Giai cấp công nhân: điều kiện lao động, đại diện, kỹ năng' },
  transition: { chapter: 3, topic: 'Thời kỳ quá độ: phát triển lực lượng sản xuất có kế hoạch' },
  democracy: { chapter: 4, topic: 'Dân chủ XHCN: tham vấn, tiếng nói và giám sát của người dân' },
  law: { chapter: 4, topic: 'Nhà nước pháp quyền: thủ tục, trách nhiệm giải trình' },
  alliance: { chapter: 5, topic: 'Cơ cấu xã hội – giai cấp, liên minh công – nông – trí thức' },
  ethnic: { chapter: 6, topic: 'Vấn đề dân tộc: bình đẳng và phát triển vùng' },
  religion: { chapter: 6, topic: 'Vấn đề tôn giáo: tự do tín ngưỡng, xử lý theo hành vi' },
  family: { chapter: 7, topic: 'Gia đình: chăm sóc, nhà ở, bình đẳng trong gia đình' },
};
