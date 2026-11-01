// Eight mandatory year nodes Y1–Y8 (doc 02 §2). Format: see src/sim/README.md.
// All places, numbers and people are fictional gameplay assumptions.

export const MAIN_EVENTS = [
  // ---------------------------------------------------------------- Y1
  {
    id: 'Y1',
    kind: 'main',
    year: 1,
    site: 'industrial',
    tag: 'labor',
    chapter: 2,
    chapterTitle: 'Chương 2 — Giai cấp công nhân',
    headline: 'Khu công nghiệp Thiên Hà ngừng máy',
    context:
      '18.000 người làm việc tại khu công nghiệp Thiên Hà. Đơn hàng điện tử giảm, lương thực tế bị bào mòn, ca làm kéo dài. Hơn 4.000 người ngừng việc. Doanh nghiệp đề nghị tự động hóa 30% dây chuyền và xin ưu đãi thuế để giữ đơn hàng; tổ chức đại diện người lao động phản ánh thỏa ước tập thể không được thực hiện đầy đủ.',
    facts: [
      'Đơn hàng điện tử giảm khoảng 12% (số giả định).',
      'Mức lương hiện tại chưa đủ chi phí thuê nhà gần khu công nghiệp.',
      'Đa số người lao động muốn thương lượng, không muốn nhà máy đóng cửa.',
    ],
    conflict:
      'Bảo vệ quyền lợi và tiếng nói đại diện của công nhân ↔ duy trì năng lực sản xuất ↔ khả năng cạnh tranh của doanh nghiệp.',
    uncertainty: 'Chưa rõ đơn hàng sẽ phục hồi trong bao lâu và tự động hóa sẽ thay thế bao nhiêu vị trí.',
    stakeholders: ['worker', 'business', 'family'],
    variants: [
      {
        if: 'CAPACITY<40',
        text: 'Bộ máy hòa giải lao động đang thiếu người: muốn đối thoại ba bên hiệu quả cần thêm kinh phí đào tạo hòa giải viên.',
      },
    ],
    choices: [
      {
        id: 'Y1-A',
        title: 'Thương lượng ba bên, tăng lương theo lộ trình',
        explanation:
          'Lập cơ chế thương lượng ba bên, tăng lương theo 2 kỳ, kiểm tra an toàn lao động và mở quỹ nâng kỹ năng.',
        outcome:
          'Bàn thương lượng được dựng lên; công nhân trở lại dây chuyền với lộ trình tăng lương và cam kết đào tạo. Tiến độ chậm hơn mong muốn của cả hai phía.',
        style: 'balanced',
        complex: true,
        cost: 8,
        now: { LIFE: 5, TRUST: 7, LAW: 3, COHESION: 6, PROD: -2 },
        cap: 3,
        setFlags: ['LABOR_DIALOGUE'],
        mods: [
          {
            if: 'CAPACITY<40',
            cost: 3,
            note: 'Cần thêm kinh phí nâng năng lực hòa giải để đối thoại có thực chất.',
          },
        ],
        pending: [
          {
            // Doc says Y3; R01 can first appear after the Y3 main event, so the check runs at Y4 start.
            due: 4,
            if: '!seen:R01',
            effects: { TRUST: 3 },
            text: 'Kênh đối thoại lao động giữ được ổn định: niềm tin tăng nếu không có đình công lan rộng.',
          },
        ],
        winners: ['worker', 'family'],
        losers: ['business'],
      },
      {
        id: 'Y1-B',
        title: 'Tăng lương bắt buộc 18% ngay',
        explanation:
          'Tăng lương bắt buộc ngay lập tức, trợ cấp doanh nghiệp một năm nhưng chưa có phương án đào tạo lại.',
        outcome:
          'Thu nhập công nhân tăng ngay, căng thẳng hạ nhiệt. Nhiều doanh nghiệp cắt ca và đẩy nhanh kế hoạch tự động hóa để bù chi phí.',
        style: 'welfare',
        cost: 13,
        now: { LIFE: 9, TRUST: 4, COHESION: 3, PROD: -7 },
        setFlags: ['WAGE_SHOCK'],
        pending: [
          {
            due: 2,
            if: 'PROD<50',
            effects: { PROD: -4, BUDGET: -3 },
            text: 'Chi phí lao động tăng khi năng suất chưa theo kịp: một số dây chuyền tạm dừng.',
          },
          {
            due: 5,
            if: '!AUTOMATION_SKILLS',
            effects: { LIFE: -3, EQUITY: -2 },
            text: 'Tự động hóa không kèm đào tạo lại khiến một phần lao động giản đơn mất việc.',
          },
        ],
        winners: ['worker'],
        losers: ['business'],
      },
      {
        id: 'Y1-C',
        title: 'Ưu tiên khôi phục sản xuất, hoãn kiến nghị',
        explanation:
          'Không can thiệp vào lương, yêu cầu khôi phục sản xuất ngay, hứa xem xét kiến nghị trong 12 tháng.',
        outcome:
          'Dây chuyền chạy lại, nhưng các kiến nghị chưa được trả lời. Bất bình chuyển vào im lặng.',
        style: 'control',
        cost: 1,
        now: { PROD: 3, LIFE: -7, TRUST: -10, LAW: -3, COHESION: -7 },
        cap: -3,
        discontent: 2,
        pending: [
          {
            due: 8,
            if: 'latent_discontent>=2',
            effects: { COHESION: -3, TRUST: -2 },
            text: 'Mâu thuẫn lao động bị trì hoãn từ năm đầu vẫn chưa được giải quyết.',
          },
        ],
        winners: ['business'],
        losers: ['worker', 'family'],
      },
    ],
    academic: {
      chapter: 2,
      chapterTitle: 'Chương 2 — Sứ mệnh lịch sử của giai cấp công nhân',
      topic: 'Giai cấp công nhân: vị trí kinh tế – xã hội, điều kiện khách quan và chủ quan',
      lesson:
        'Phân biệt vị trí kinh tế – xã hội của giai cấp công nhân với điều kiện chủ quan để thực hiện vai trò (tổ chức, ý thức, đại diện). Phát triển công nghiệp không tự động bảo đảm quyền lợi người lao động.',
      debrief:
        '“Sứ mệnh lịch sử” thể hiện ra sao trong tổ chức, năng lực công nghệ và quan hệ với các tầng lớp khác, thay vì chỉ bằng khẩu hiệu?',
    },
  },

  // ---------------------------------------------------------------- Y2
  {
    id: 'Y2',
    kind: 'main',
    year: 2,
    site: 'economy',
    tag: 'economy',
    chapter: 3,
    chapterTitle: 'Chương 3 — CNXH và thời kỳ quá độ',
    headline: 'Tăng trưởng nhanh hay chuyển đổi có kiểm soát?',
    context:
      'Một tổ hợp chế tạo công nghệ cao đề nghị ưu đãi thuế 10 năm đổi lấy 65.000 việc làm dự kiến. Cùng lúc, các hợp tác xã nông nghiệp xin vốn số hóa khâu bảo quản và truy xuất nông sản. Cơ quan kế hoạch cảnh báo tiến độ giải ngân thấp, kiểm toán chưa theo kịp quy mô đầu tư.',
    facts: [
      '65.000 việc làm là con số doanh nghiệp tự dự báo.',
      'Hợp tác xã thiếu vốn cho kho lạnh và truy xuất nguồn gốc.',
      'Năng lực kiểm toán hiện chỉ theo kịp khoảng một nửa số dự án mới.',
    ],
    conflict: 'Tốc độ tăng trưởng ngay ↔ năng lực tổ chức thực hiện và phân bổ lợi ích giữa đô thị và nông thôn.',
    uncertainty: 'Dự báo thị trường thế giới có độ bất định lớn; chưa ai chắc đơn hàng công nghệ cao sẽ ổn định.',
    stakeholders: ['business', 'farmer', 'intellectual', 'worker'],
    variants: [
      {
        if: 'LABOR_DIALOGUE',
        text: 'Kênh thương lượng ba bên từ năm trước sẵn sàng góp ý về kế hoạch đào tạo.',
      },
      {
        if: 'WAGE_SHOCK',
        text: 'Nhà đầu tư lo ngại chi phí lao động tăng đột ngột, đòi thêm ưu đãi.',
      },
    ],
    choices: [
      {
        id: 'Y2-A',
        title: 'Cải cách hai giai đoạn có kiểm toán',
        explanation:
          'Thí điểm vùng công nghiệp, đầu tư đào tạo và hợp tác xã, cạnh tranh minh bạch, kiểm toán hằng năm.',
        outcome:
          'Đặc khu được mở từng phần; ngân sách chia cho trường nghề và hợp tác xã. Tăng trưởng không bùng nổ nhưng nền tảng kỹ năng được đặt xuống.',
        style: 'balanced',
        complex: true,
        cost: 12,
        now: { PROD: 4, LIFE: 2, LAW: 3, EQUITY: 4, TRUST: 2 },
        cap: 4,
        setFlags: ['ECON_BALANCED', 'AUTOMATION_SKILLS'],
        mods: [
          { if: 'LABOR_DIALOGUE', now: { TRUST: 2 }, note: 'Kênh thương lượng ba bên tham gia thiết kế chương trình đào tạo.' },
        ],
        pending: [
          {
            due: 5,
            if: 'CAPACITY>=40',
            effects: { PROD: 7, LIFE: 3 },
            text: 'Lứa học viên đầu tiên ra trường: năng suất tăng nếu bộ máy đủ năng lực triển khai.',
          },
        ],
        winners: ['farmer', 'intellectual', 'worker'],
        losers: ['business'],
      },
      {
        id: 'Y2-B',
        title: 'Duyệt toàn bộ đặc khu, ưu đãi lớn',
        explanation: 'Phê duyệt toàn bộ đặc khu và ưu đãi lớn để hút vốn nhanh, bỏ qua kế hoạch đào tạo cho nông thôn.',
        outcome:
          'Vốn đổ vào nhanh, nhà xưởng mọc lên. Vùng nông thôn đứng ngoài làn sóng đầu tư; kiểm toán chạy theo không kịp.',
        style: 'growth',
        cost: 18,
        now: { PROD: 11, LIFE: 2, EQUITY: -7, LAW: -4 },
        cap: -4,
        debt: 8,
        setFlags: ['ECON_OVERHEAT'],
        mods: [{ if: 'WAGE_SHOCK', cost: 4, note: 'Nhà đầu tư đòi thêm ưu đãi vì chi phí lao động tăng đột ngột.' }],
        pending: [
          {
            due: 4,
            if: 'LAW<55',
            effects: { LAW: -5, TRUST: -3 },
            text: 'Các hợp đồng đặc khu thiếu giám sát bắt đầu lộ sai phạm.',
          },
          {
            due: 5,
            effects: { PROD: 3, EQUITY: -3 },
            text: 'Đặc khu đi vào vận hành: sản lượng tăng, khoảng cách vùng giãn rộng.',
          },
        ],
        winners: ['business', 'intellectual'],
        losers: ['farmer', 'minority'],
      },
      {
        id: 'Y2-C',
        title: 'Đóng băng cải cách, trợ giá đại trà',
        explanation: 'Hoãn công nghệ mới, dùng ngân sách trợ giá đại trà để giữ mức sống.',
        outcome:
          'Giá cả được giữ ổn định, người dân dễ thở hơn. Các dự án công nghệ dừng lại; hợp tác xã vẫn chờ vốn.',
        style: 'welfare',
        cost: 15,
        now: { LIFE: 7, TRUST: 2, PROD: -7 },
        cap: -2,
        debt: 10,
        setFlags: ['STAGNATION', 'WELFARE_UNFUNDED'],
        pending: [
          {
            due: 5,
            effects: { PROD: -6 },
            text: 'Ba năm không đổi mới công nghệ: năng lực sản xuất tụt lại.',
          },
        ],
        winners: ['family', 'worker'],
        losers: ['intellectual', 'business'],
      },
    ],
    academic: {
      chapter: 3,
      chapterTitle: 'Chương 3 — Chủ nghĩa xã hội và thời kỳ quá độ',
      topic: 'Đặc điểm thời kỳ quá độ; phát triển lực lượng sản xuất và tổ chức kinh tế',
      lesson:
        'Thời kỳ quá độ là tiến trình có mâu thuẫn và nhiệm vụ phát triển; cần phân biệt mục tiêu xã hội chủ nghĩa với công cụ, trình tự và năng lực tổ chức thực hiện.',
      debrief: 'Một chính sách thúc đẩy thị trường có thể cùng tồn tại với định hướng xã hội chủ nghĩa trong điều kiện gì?',
    },
  },

  // ---------------------------------------------------------------- Y3
  {
    id: 'Y3',
    kind: 'main',
    year: 3,
    site: 'ringroad',
    tag: 'democracy',
    chapter: 4,
    chapterTitle: 'Chương 4 — Dân chủ XHCN',
    headline: 'Đường vành đai đi qua 6 xã',
    context:
      'Dự án đường vành đai rút ngắn thời gian vận tải nhưng ảnh hưởng 2.300 hộ, gồm nông dân và cư dân lâu năm. Hồ sơ quy hoạch công bố muộn; có hai phương án tuyến với chi phí khác nhau. Chính quyền địa phương đề nghị duyệt gấp để kịp ngân sách; nhóm cư dân trình phương án giảm tái định cư và yêu cầu phản hồi chính thức.',
    facts: [
      '2.300 hộ nằm trong vùng ảnh hưởng (giả định).',
      'Hồ sơ quy hoạch được công bố sau thời hạn lấy ý kiến.',
      'Cư dân đã gửi một phương án tuyến thay thế có bản vẽ.',
    ],
    conflict: 'Quyết định nhanh ↔ quyền tham gia thực chất của người dân ↔ chi phí dự án.',
    uncertainty: 'Chưa có số liệu độc lập so sánh chi phí của hai phương án tuyến.',
    stakeholders: ['farmer', 'family', 'business'],
    variants: [
      {
        if: 'latent_discontent>=2',
        text: 'Nhiều công nhân Thiên Hà sống trong khu tái định cư; đại diện lao động yêu cầu được ngồi vào bàn tham vấn, giọng điệu gay gắt.',
      },
    ],
    choices: [
      {
        id: 'Y3-A',
        title: 'Tham vấn có biên bản và quyền sửa phương án',
        explanation:
          'Công bố dữ liệu, mở tham vấn có biên bản, điều chỉnh tuyến theo tiêu chí minh bạch, có cơ chế khiếu nại độc lập.',
        outcome:
          'Tuyến đường được nắn lại ở hai xã theo đề xuất của cư dân. Dự án chậm vài tháng nhưng có hồ sơ giải trình rõ ràng.',
        style: 'balanced',
        complex: true,
        cost: 8,
        now: { TRUST: 9, LAW: 6, EQUITY: 4, PROD: -2 },
        cap: 2,
        setFlags: ['CONSULT_REAL'],
        mods: [{ if: 'latent_discontent>=2', discontent: -1, note: 'Đại diện lao động được mời vào hội đồng tham vấn.' }],
        pending: [
          { due: 4, effects: { TRUST: 2 }, text: 'Kênh khiếu nại độc lập hoạt động, người dân thấy ý kiến được phản hồi.' },
          {
            due: 7,
            if: '!REGION_TOPDOWN',
            effects: { COHESION: 3 },
            text: 'Kinh nghiệm tham vấn thực chất lan sang các dự án vùng khác.',
          },
        ],
        winners: ['farmer', 'family'],
        losers: ['business'],
      },
      {
        id: 'Y3-B',
        title: 'Họp nhanh, giữ tuyến, công bố “đã đồng thuận”',
        explanation: 'Tổ chức một cuộc họp công khai ngắn, giữ nguyên tuyến đã duyệt và công bố người dân đã đồng thuận.',
        outcome: 'Máy xúc vào công trường đúng hạn. Biên bản ghi “đồng thuận”, nhưng nhiều hộ nói họ chưa từng được hỏi.',
        style: 'control',
        cost: 3,
        now: { PROD: 5, TRUST: -9, LAW: -7, COHESION: -4 },
        cap: -3,
        setFlags: ['CONSULT_TOKEN'],
        mods: [{ if: 'latent_discontent>=2', discontent: 1 }],
        pending: [
          {
            due: 7,
            if: 'REGION_TOPDOWN',
            effects: { COHESION: -5 },
            text: 'Hai dự án liên tiếp bị áp đặt: cộng đồng nghi ngờ mọi cuộc tham vấn.',
          },
        ],
        winners: ['business'],
        losers: ['farmer', 'family'],
      },
      {
        id: 'Y3-C',
        title: 'Tạm dừng 6 tháng để khảo sát thêm',
        explanation: 'Dừng dự án để khảo sát tiếp, hỗ trợ người dân tạm thời, chưa chốt cơ chế tiếp nhận phản hồi.',
        outcome: 'Áp lực giảm tạm thời. Doanh nghiệp vận tải phàn nàn; người dân chưa biết ý kiến của mình sẽ đi đâu.',
        style: 'delay',
        cost: 6,
        now: { TRUST: 2, LIFE: 2, PROD: -6 },
        setFlags: ['CONSULT_DELAY'],
        pending: [
          {
            due: 4,
            if: 'CAPACITY<45',
            effects: { PROD: -2, TRUST: -2 },
            text: 'Khảo sát kéo dài vì thiếu người làm: dự án và niềm tin cùng giậm chân.',
          },
        ],
        winners: ['family'],
        losers: ['business', 'farmer'],
      },
    ],
    academic: {
      chapter: 4,
      chapterTitle: 'Chương 4 — Dân chủ xã hội chủ nghĩa',
      topic: 'Bản chất và thực hành dân chủ XHCN: tham gia, giám sát, quyền làm chủ',
      lesson:
        'Phân biệt thiết chế, tuyên bố dân chủ với cơ chế để người dân thực sự tham gia, được phản hồi, giám sát và yêu cầu giải trình.',
      debrief: 'Thế nào là bằng chứng cho thấy ý kiến người dân đã ảnh hưởng thực chất đến chính sách?',
    },
  },

  // ---------------------------------------------------------------- Y4
  {
    id: 'Y4',
    kind: 'main',
    year: 4,
    site: 'hospital',
    tag: 'law',
    chapter: 4,
    chapterTitle: 'Chương 4 — Nhà nước pháp quyền XHCN (chủ đề lớp: Chương 5)',
    headline: 'Hồ sơ đấu thầu bệnh viện bị rò rỉ',
    context:
      'Thanh tra phát hiện dấu hiệu nâng giá thiết bị y tế tại 5 bệnh viện. Một quan chức cấp cao có quan hệ với nhà thầu; ước tính 15% giá trị gói thầu có nguy cơ thất thoát (tỷ lệ hư cấu). Bệnh viện đang thiếu thiết bị, dừng hợp đồng có thể làm tăng thời gian chờ khám. Không ai bị coi là có tội trước khi có kết luận theo pháp luật.',
    facts: [
      'Dấu hiệu nâng giá xuất hiện ở 5 bệnh viện công.',
      'Một quan chức cấp cao có quan hệ thân thích với nhà thầu.',
      'Danh sách chờ chụp chiếu đã dài gấp đôi năm trước.',
    ],
    conflict: 'Kiểm soát quyền lực và công bằng tố tụng ↔ dịch vụ y tế thiết yếu không được gián đoạn.',
    uncertainty: 'Chưa xác định được vai trò cụ thể của từng người liên quan.',
    stakeholders: ['family', 'business', 'intellectual'],
    variants: [
      {
        if: 'CONSULT_TOKEN',
        text: 'Báo chí đặt câu hỏi: nếu biên bản quy hoạch có thể bị “làm đẹp”, hồ sơ đấu thầu có khác gì?',
      },
      { if: 'ECON_OVERHEAT', text: 'Nhiều nhà thầu của gói bệnh viện cũng đang trúng thầu trong các đặc khu mới.' },
    ],
    choices: [
      {
        id: 'Y4-A',
        title: 'Điều tra độc lập đúng thủ tục',
        explanation:
          'Điều tra độc lập theo thủ tục, công bố phạm vi, bảo vệ người tố giác, mua sắm khẩn cấp theo cơ chế được giám sát.',
        outcome:
          'Cơ quan điều tra độc lập vào cuộc; bệnh viện vẫn nhận thiết bị khẩn cấp qua kênh mua sắm có giám sát. Kết luận chưa có ngay nhưng quy trình được công khai.',
        style: 'balanced',
        complex: true,
        cost: 9,
        now: { LAW: 11, TRUST: 7, LIFE: 2, PROD: -2 },
        cap: 4,
        setFlags: ['ANTI_CORRUPTION_INDEPENDENT'],
        mods: [
          {
            if: 'CONSULT_TOKEN',
            cost: 3,
            now: { TRUST: 2 },
            clearFlags: ['CONSULT_TOKEN'],
            setFlags: ['CONSULT_REDONE'],
            note: 'Kèm cam kết công khai lại kết quả quy hoạch vành đai.',
          },
          {
            if: 'CONSULT_DELAY',
            now: { TRUST: 1 },
            note: 'Nhân dịp này công bố luôn bộ tiêu chí phản hồi cho dự án vành đai đang hoãn.',
          },
        ],
        pending: [
          {
            due: 6,
            effects: { LAW: 3, TRUST: 2 },
            text: 'Kết luận điều tra được công bố đầy đủ, người tố giác được bảo vệ.',
          },
        ],
        winners: ['family', 'intellectual'],
        losers: [],
      },
      {
        id: 'Y4-B',
        title: 'Chỉ xử lý cán bộ cấp dưới để đóng vụ',
        explanation: 'Xử lý nhanh vài cán bộ cấp thấp, giữ nguyên hợp đồng, không kiểm tra vai trò cấp trên.',
        outcome: 'Vụ việc khép lại nhanh, thiết bị vẫn về bệnh viện. Dư luận hỏi: vì sao người ký quyết định không bị xem xét?',
        style: 'control',
        cost: 2,
        now: { PROD: 3, LIFE: 2, LAW: -13, TRUST: -11 },
        cap: -6,
        setFlags: ['ENFORCEMENT_SELECTIVE'],
        pending: [
          {
            due: 6,
            if: '!ENFORCEMENT_REPAIRED',
            effects: { TRUST: -5, COHESION: -3 },
            text: 'Các vụ việc tương tự lặp lại: người dân tin rằng luật chỉ áp dụng với cấp dưới.',
          },
        ],
        winners: ['business'],
        losers: ['family'],
      },
      {
        id: 'Y4-C',
        title: 'Đóng băng mọi hợp đồng chờ điều tra',
        explanation: 'Dừng toàn bộ hợp đồng, chờ điều tra xong mới lập phương án bảo đảm khám chữa bệnh.',
        outcome: 'Không ai còn nghi ngờ hợp đồng được “chạy”, nhưng hàng nghìn bệnh nhân phải chờ máy móc thêm nhiều tháng.',
        style: 'delay',
        cost: 5,
        now: { LAW: 3, TRUST: 1, LIFE: -8, PROD: -4 },
        cap: -2,
        setFlags: ['CASE_DELAY'],
        pending: [
          {
            due: 5,
            effects: { LIFE: -4 },
            text: 'Không có mua sắm thay thế: thiếu thiết bị kéo dài sang năm sau.',
          },
        ],
        winners: [],
        losers: ['family'],
      },
    ],
    academic: {
      chapter: 4,
      chapterTitle: 'Chương 4 — Nhà nước XHCN, nhà nước pháp quyền XHCN (lịch lớp: Chương 5)',
      topic: 'Thượng tôn pháp luật, kiểm soát quyền lực, trách nhiệm giải trình',
      lesson:
        'Nhà nước pháp quyền cần quy tắc áp dụng bình đẳng, bảo vệ quyền lợi hợp pháp của người liên quan và cơ chế kiểm soát quyền lực; chống tham nhũng không thay thế thủ tục pháp luật.',
      debrief: 'Vì sao pháp quyền không thể chỉ đo bằng số vụ bị xử lý?',
    },
  },

  // ---------------------------------------------------------------- Y5
  {
    id: 'Y5',
    kind: 'main',
    year: 5,
    site: 'coalition',
    tag: 'class',
    chapter: 5,
    chapterTitle: 'Chương 5 — Cơ cấu xã hội – giai cấp',
    headline: 'Ai có mặt trong liên minh phát triển?',
    context:
      'Nông dân mất đất sản xuất vì vùng công nghệ; công nhân cần học nghề chuyển đổi; 120.000 lao động nền tảng chưa có mạng lưới an sinh phù hợp; nhóm kỹ sư đề nghị đầu tư nghiên cứu. Ngân sách chỉ đủ 2 trong 4 gói nếu làm toàn diện. Hiệp hội doanh nghiệp lo chi phí tuân thủ tăng.',
    facts: [
      '120.000 lao động nền tảng chưa có bảo hiểm phù hợp (giả định).',
      'Trường nghề, chợ đầu mối và khu nền tảng số đều xin cùng một nguồn vốn.',
      'Hiệp hội doanh nghiệp đề nghị lộ trình tuân thủ ít nhất 2 năm.',
    ],
    conflict: 'Lợi ích công nhân – nông dân – trí thức – lao động nền tảng – doanh nghiệp với một ngân sách hữu hạn.',
    uncertainty: 'Chưa rõ tốc độ tự động hóa sẽ làm thay đổi cơ cấu việc làm nhanh đến đâu.',
    stakeholders: ['worker', 'farmer', 'intellectual', 'platform', 'business'],
    variants: [
      { if: 'LABOR_DIALOGUE', text: 'Kênh thương lượng ba bên đề nghị mở rộng sang lao động nền tảng.' },
      { if: 'STAGNATION', text: 'Sau nhiều năm đóng băng, các ngành công nghệ thiếu nền tảng để bứt phá nhanh.' },
    ],
    choices: [
      {
        id: 'Y5-A',
        title: 'Quỹ chuyển đổi đa nhóm có hội đồng giám sát',
        explanation:
          'Quỹ chuyển đổi kỹ năng, hỗ trợ hợp tác xã, an sinh theo lộ trình cho lao động nền tảng; hội đồng nhiều nhóm cùng giám sát.',
        outcome:
          'Một hội đồng gồm đại diện công nhân, nông dân, kỹ sư và lao động nền tảng cùng phân bổ quỹ. Không nhóm nào được tất cả, nhưng ai cũng có chỗ ngồi.',
        style: 'balanced',
        complex: true,
        cost: 15,
        now: { PROD: 3, LIFE: 5, EQUITY: 8, TRUST: 5, COHESION: 4 },
        cap: 3,
        setFlags: ['COALITION_BUILT'],
        mods: [
          { if: 'ECON_BALANCED', cost: -3, note: 'Trường nghề và hợp tác xã từ cải cách lộ trình giúp giảm chi phí.' },
          { if: 'AUTOMATION_SKILLS', now: { PROD: 4 }, note: 'Học viên đã có kỹ năng tự động hóa được đưa vào quỹ.' },
          { if: 'LABOR_DIALOGUE', now: { TRUST: 2 }, note: 'Kênh ba bên mở rộng sang lao động nền tảng.' },
        ],
        pending: [{ due: 7, effects: { LIFE: 2 }, text: 'Lao động nền tảng bắt đầu được hưởng bảo hiểm theo lộ trình.' }],
        winners: ['worker', 'farmer', 'platform', 'intellectual'],
        losers: ['business'],
      },
      {
        id: 'Y5-B',
        title: 'Ưu tiên công nghiệp công nghệ cao và trí thức',
        explanation: 'Dồn nguồn lực cho ngành công nghệ cao và kỹ sư; chuyển đổi nông thôn và nghề mới để sau.',
        outcome: 'Các phòng thí nghiệm và nhà máy mới chạy hết công suất. Nông dân mất đất và lao động nền tảng chờ đến lượt.',
        style: 'growth',
        cost: 12,
        now: { PROD: 11, EQUITY: -10, LIFE: -3, COHESION: -5 },
        setFlags: ['SECTOR_BIAS'],
        mods: [
          { if: 'STAGNATION', now: { PROD: -5 }, note: 'Thiếu nền tảng công nghệ sau thời gian đóng băng.' },
          { if: 'WAGE_SHOCK', now: { COHESION: -3 }, note: 'Công nhân bị cắt ca sau đợt tăng lương thấy mình bị bỏ lại.' },
        ],
        winners: ['intellectual', 'business'],
        losers: ['farmer', 'platform', 'worker'],
      },
      {
        id: 'Y5-C',
        title: 'Trợ cấp tiền mặt đồng loạt cho 3 nhóm',
        explanation: 'Chuyển tiền mặt cho công nhân, nông dân, lao động nền tảng; chưa thiết kế việc làm, công nghệ hay bảo hiểm dài hạn.',
        outcome: 'Tiền về tài khoản nhanh, ai cũng nhận được. Một năm sau, câu hỏi “tiền ở đâu ra cho năm tới” chưa có lời đáp.',
        style: 'welfare',
        cost: 18,
        now: { LIFE: 8, TRUST: 3, PROD: -5 },
        debt: 12,
        setFlags: ['WELFARE_UNFUNDED'],
        pending: [
          {
            due: 8,
            if: 'PROD<55',
            effects: { LIFE: -5 },
            text: 'Trợ cấp hết hạn khi nền sản xuất chưa đủ mạnh để tạo việc làm thay thế.',
          },
        ],
        winners: ['worker', 'farmer', 'platform', 'family'],
        losers: ['intellectual'],
      },
    ],
    academic: {
      chapter: 5,
      chapterTitle: 'Chương 5 — Cơ cấu xã hội – giai cấp và liên minh',
      topic: 'Biến đổi cơ cấu xã hội – giai cấp; liên minh công nhân – nông dân – trí thức',
      lesson:
        'Cơ cấu giai cấp biến đổi cùng phát triển kinh tế; liên minh dựa trên lợi ích vật chất, chính trị, xã hội cụ thể, không chỉ là việc nhắc tên ba giai cấp, tầng lớp.',
      debrief: 'Lao động nền tảng nên được nhìn từ vị trí trong quan hệ lao động, công nghệ hay nhãn nghề nghiệp?',
    },
  },

  // ---------------------------------------------------------------- Y6
  {
    id: 'Y6',
    kind: 'main',
    year: 6,
    site: 'valley',
    tag: 'ethnic',
    chapter: 6,
    chapterTitle: 'Chương 6 — Vấn đề dân tộc',
    headline: 'Thủy điện và thung lũng Bản Mây',
    context:
      'Dự án thủy điện mang điện cho vùng nghèo nhưng ảnh hưởng 3.600 hộ thuộc 4 cộng đồng dân tộc. Báo cáo kỹ thuật coi một khu đất sinh hoạt văn hóa là “đất bỏ hoang”. Các hộ yêu cầu hồ sơ bằng ngôn ngữ dễ tiếp cận, được tham gia đo đạc và có phương án sinh kế thay thế. Trên mạng có tin xuyên tạc về dự án, nhưng một số kiến nghị của người dân là có cơ sở.',
    facts: [
      '3.600 hộ của 4 cộng đồng có thể phải tái định cư (giả định).',
      'Báo cáo kỹ thuật thiếu đánh giá một không gian văn hóa cộng đồng.',
      'Cộng đồng yêu cầu tham gia đo đạc và xây dựng phương án sinh kế.',
    ],
    conflict: 'Nhu cầu phát triển, điện năng ↔ quyền tham gia, bản sắc và sinh kế của các cộng đồng.',
    uncertainty: 'Chưa phân biệt rõ phần nào trong các phản ánh trên mạng là đúng, phần nào là tin sai.',
    stakeholders: ['minority', 'farmer', 'business'],
    variants: [
      { if: 'CONSULT_REAL', text: 'Cộng đồng yêu cầu áp dụng cơ chế công khai hồ sơ đã dùng ở dự án vành đai.' },
      { if: 'SECTOR_BIAS', text: 'Vùng này bị bỏ lại trong gói ưu tiên ngành năm trước: mọi phương án cần thêm hỗ trợ sinh kế.' },
      { if: 'OVERSIGHT_DEMANDED', text: 'Đại diện cộng đồng chỉ chấp nhận đồng thiết kế nếu có giám sát độc lập.' },
    ],
    choices: [
      {
        id: 'Y6-A',
        title: 'Đồng thiết kế với cộng đồng',
        explanation:
          'Cùng đại diện cộng đồng thiết kế tuyến và bồi thường; đánh giá văn hóa, hồ sơ song ngữ, sinh kế thay thế và kênh khiếu nại.',
        outcome:
          'Bản đồ đo đạc có chữ ký của già làng và kỹ sư. Khu sinh hoạt văn hóa được giữ lại; tiến độ chậm nhưng ít khiếu nại.',
        style: 'balanced',
        complex: true,
        cost: 13,
        now: { EQUITY: 10, TRUST: 7, COHESION: 7, LAW: 4, PROD: -3 },
        cap: 2,
        setFlags: ['REGION_PARTICIPATION'],
        mods: [
          { if: 'OVERSIGHT_TRUSTED', cost: -2, note: 'Cơ chế giám sát sau vụ án được tin cậy, giảm chi phí kiểm tra.' },
          { if: 'OVERSIGHT_DEMANDED', cost: 2, note: 'Phải thuê giám sát độc lập vì niềm tin bị tổn hại.' },
          { if: 'CONSULT_REAL', now: { TRUST: 2 }, note: 'Kế thừa cơ chế tham vấn từ dự án vành đai.' },
          { if: 'SECTOR_BIAS', cost: 2, note: 'Cần bổ sung hỗ trợ sinh kế.' },
        ],
        pending: [
          {
            due: 8,
            if: 'CAPACITY>=40',
            effects: { LIFE: 4, PROD: 3 },
            text: 'Điện về bản cùng mô hình sinh kế mới do cộng đồng đồng thiết kế.',
          },
        ],
        winners: ['minority', 'farmer'],
        losers: ['business'],
      },
      {
        id: 'Y6-B',
        title: 'Áp một mức bồi thường thống nhất',
        explanation: 'Một mức bồi thường cho mọi hộ, triển khai nhanh, không hỏi ý kiến cộng đồng về tái định cư.',
        outcome: 'Đập được khởi công đúng hạn. Khu sinh hoạt văn hóa nằm trong lòng hồ; nhiều hộ chuyển đi với khoản tiền không đủ tái lập sinh kế.',
        style: 'growth',
        cost: 7,
        now: { PROD: 8, EQUITY: -10, TRUST: -8, COHESION: -8 },
        cap: -3,
        setFlags: ['REGION_TOPDOWN'],
        mods: [
          { if: 'CONSULT_TOKEN', now: { TRUST: -3 }, note: 'Lặp lại cách làm của dự án vành đai.' },
          { if: 'SECTOR_BIAS', cost: 2, note: 'Cần bổ sung hỗ trợ sinh kế.' },
        ],
        winners: ['business'],
        losers: ['minority', 'farmer'],
      },
      {
        id: 'Y6-C',
        title: 'Ngừng dự án vô thời hạn',
        explanation: 'Dừng dự án, không lập phương án năng lượng hay việc làm thay thế.',
        outcome: 'Thung lũng giữ nguyên, căng thẳng lắng xuống. Các xã vẫn thiếu điện và người trẻ tiếp tục rời bản.',
        style: 'delay',
        cost: 4,
        now: { TRUST: 2, COHESION: 2, PROD: -9, LIFE: -3 },
        setFlags: ['REGION_DELAY'],
        mods: [{ if: 'SECTOR_BIAS', cost: 2, note: 'Cần bổ sung hỗ trợ sinh kế.' }],
        pending: [{ due: 8, effects: { PROD: -4 }, text: 'Không có nguồn năng lượng thay thế cho vùng.' }],
        winners: ['minority'],
        losers: ['business', 'family'],
      },
    ],
    academic: {
      chapter: 6,
      chapterTitle: 'Chương 6 — Vấn đề dân tộc trong thời kỳ quá độ',
      topic: 'Bình đẳng, đoàn kết, phát triển và tôn trọng bản sắc các dân tộc',
      lesson:
        'Phân biệt bình đẳng dân tộc với đồng nhất hóa bản sắc; gắn quyền, lợi ích, sự tham gia và phát triển cùng nhau. Phản đối, khiếu nại ôn hòa không đồng nghĩa với kích động.',
      debrief: 'Cần xác minh thông tin sai ra sao mà vẫn bảo vệ các phản ánh đúng của người dân?',
    },
  },

  // ---------------------------------------------------------------- Y7
  {
    id: 'Y7',
    kind: 'main',
    year: 7,
    site: 'temple',
    tag: 'religion',
    chapter: 6,
    chapterTitle: 'Chương 6 — Vấn đề tôn giáo',
    headline: 'Trung tâm “chữa bệnh bằng phép lạ”',
    context:
      'Một tổ chức thu tiền với lời hứa “chữa khỏi hoàn toàn”, khuyến khích bệnh nhân bỏ điều trị y khoa; nhiều người khiếu nại. Tổ chức này mượn địa điểm của một cộng đồng tôn giáo hoạt động hợp pháp, khiến tin đồn trên mạng quy kết cả cộng đồng. Cơ quan y tế có bằng chứng về quảng cáo gian dối nhưng chưa xác định mọi người liên quan.',
    facts: [
      'Có bằng chứng quảng cáo y tế gian dối.',
      'Cộng đồng tôn giáo cho mượn địa điểm có đăng ký hợp pháp.',
      'Ít nhất 40 bệnh nhân đã bỏ điều trị (giả định).',
    ],
    conflict: 'Tự do tín ngưỡng của cộng đồng ↔ trách nhiệm pháp lý với hành vi lừa đảo gây hại sức khỏe.',
    uncertainty: 'Chưa xác định được ai trong cộng đồng biết và tham gia vào hoạt động thu tiền.',
    stakeholders: ['faith', 'family'],
    variants: [
      { if: 'ENFORCEMENT_SELECTIVE', text: 'Sau vụ đấu thầu, nhiều người nghi ngờ cơ quan điều tra sẽ lại “chọn người để xử”.' },
      { if: 'REGION_PARTICIPATION', text: 'Các già làng từng đồng thiết kế dự án Bản Mây sẵn sàng làm cầu nối đối thoại.' },
    ],
    choices: [
      {
        id: 'Y7-A',
        title: 'Điều tra hành vi, bảo vệ tự do tín ngưỡng',
        explanation:
          'Điều tra lừa đảo và quảng cáo y tế theo pháp luật, hỗ trợ nạn nhân, truyền thông không quy chụp cộng đồng, bảo đảm sinh hoạt tín ngưỡng hợp pháp.',
        outcome:
          'Những người tổ chức thu tiền bị khởi tố; cộng đồng tôn giáo vẫn sinh hoạt bình thường và cùng cơ quan y tế vận động bệnh nhân quay lại điều trị.',
        style: 'balanced',
        complex: true,
        cost: 7,
        now: { LAW: 9, TRUST: 6, LIFE: 5, COHESION: 6 },
        cap: 2,
        setFlags: ['RELIGION_FAIR_PROCESS'],
        mods: [
          { if: 'ENFORCEMENT_SELECTIVE', cost: 2, note: 'Cần thêm giám sát độc lập để người dân tin quá trình điều tra.' },
          { if: 'REGION_PARTICIPATION', now: { COHESION: 2 }, note: 'Các cầu nối cộng đồng từ Bản Mây giúp đối thoại.' },
        ],
        pending: [{ due: 8, effects: { TRUST: 2 }, text: 'Cách xử lý dựa trên bằng chứng được ghi nhận rộng rãi.' }],
        winners: ['faith', 'family'],
        losers: [],
      },
      {
        id: 'Y7-B',
        title: 'Đình chỉ diện rộng mọi hoạt động liên quan',
        explanation: 'Đình chỉ hoạt động của cả cộng đồng tôn giáo liên quan, kể cả cơ sở không có dấu hiệu vi phạm.',
        outcome: 'Tin đồn lắng xuống trong vài tuần. Hàng nghìn tín đồ không liên quan mất nơi sinh hoạt và cảm thấy bị coi là nghi phạm.',
        style: 'control',
        cost: 4,
        now: { COHESION: 2, LAW: -12, TRUST: -10, EQUITY: -7 },
        cap: -3,
        setFlags: ['RELIGION_BLANKET_RESTRICTION'],
        pending: [
          {
            due: 8,
            effects: { COHESION: -9, TRUST: -5 },
            text: 'Cộng đồng bị đình chỉ oan khiếu nại kéo dài; sự ổn định ban đầu chỉ là bề mặt.',
          },
        ],
        winners: [],
        losers: ['faith', 'family'],
      },
      {
        id: 'Y7-C',
        title: 'Coi là chuyện tín ngưỡng, không xác minh',
        explanation: 'Không xác minh tố giác, coi đây là tranh luận tín ngưỡng, để các gia đình tự chịu trách nhiệm.',
        outcome: 'Nhà nước đứng ngoài. Thêm bệnh nhân bỏ điều trị; các gia đình nạn nhân không biết gõ cửa nơi nào.',
        style: 'neglect',
        cost: 0,
        now: { LAW: -8, LIFE: -10, TRUST: -6 },
        cap: -2,
        setFlags: ['RELIGION_NEGLECT'],
        pending: [{ due: 8, effects: { LIFE: -4 }, text: 'Hệ quả sức khỏe của việc bỏ điều trị bộc lộ rõ.' }],
        winners: [],
        losers: ['family', 'faith'],
      },
    ],
    academic: {
      chapter: 6,
      chapterTitle: 'Chương 6 — Vấn đề tôn giáo trong thời kỳ quá độ',
      topic: 'Tự do tín ngưỡng, không tín ngưỡng và xử lý hành vi vi phạm',
      lesson:
        'Tôn trọng quyền tự do tín ngưỡng và không tín ngưỡng, đồng thời xử lý vi phạm dựa trên hành vi và bằng chứng, không dựa trên định kiến về niềm tin.',
      debrief: 'Những tiêu chí nào phân biệt sinh hoạt tín ngưỡng hợp pháp với trục lợi gây tổn hại?',
    },
  },

  // ---------------------------------------------------------------- Y8
  {
    id: 'Y8',
    kind: 'main',
    year: 8,
    site: 'housing',
    tag: 'family',
    chapter: 7,
    chapterTitle: 'Chương 7 — Gia đình',
    headline: 'Một thế hệ kẹt giữa nuôi con và chăm cha mẹ',
    context:
      'Ở đô thị, gia đình hạt nhân tăng nhanh; người lao động trẻ khó tiếp cận nhà ở và trường mầm non, người cao tuổi thiếu dịch vụ chăm sóc. Phụ nữ gánh phần lớn thời gian chăm sóc không được trả lương. Kinh tế số tạo việc làm linh hoạt nhưng thu nhập bấp bênh.',
    facts: [
      '38% người làm việc toàn thời gian đang chăm sóc người thân (khảo sát giả định).',
      'Danh sách chờ trường mầm non công lập vượt chỉ tiêu nhiều lần.',
      'Phần lớn lao động nền tảng không có chế độ nghỉ chăm sóc.',
    ],
    conflict: 'Ngân sách cho dịch vụ chăm sóc và nhà ở ↔ ưu tiên đầu tư sản xuất; trách nhiệm gia đình ↔ trách nhiệm xã hội.',
    uncertainty: 'Chưa rõ hỗ trợ tiền mặt hay dịch vụ sẽ tác động mạnh hơn tới quyết định làm việc và sinh con.',
    stakeholders: ['family', 'platform', 'worker'],
    variants: [
      { if: 'REGION_TOPDOWN', text: 'Các gia đình di dời từ Bản Mây chưa ổn định sinh kế, nhu cầu chăm sóc dồn lên cao.' },
      { if: 'REGION_PARTICIPATION', text: 'Mạng lưới cộng đồng ở Bản Mây đề nghị mở rộng dịch vụ chăm sóc tới vùng xa.' },
      { if: 'CARE_PILOT', text: 'Mạng lưới chăm sóc thí điểm đầu năm đã có cơ sở để nhân rộng.' },
    ],
    onPresent: [
      {
        if: 'REGION_TOPDOWN',
        effects: { LIFE: -2 },
        text: 'Gia đình tái định cư Bản Mây chịu thêm chi phí chăm sóc.',
      },
    ],
    choices: [
      {
        id: 'Y8-A',
        title: 'Hạ tầng chăm sóc và nhà ở phù hợp thu nhập',
        explanation:
          'Đầu tư nhà ở phù hợp thu nhập, dịch vụ chăm sóc trẻ và người cao tuổi, nghỉ chăm sóc cho cả hai giới, hỗ trợ lao động phi chính thức.',
        outcome:
          'Nhà trẻ phường, trung tâm ban ngày cho người cao tuổi và quỹ nhà ở thuê được mở. Phụ nữ trở lại làm việc toàn thời gian nhiều hơn.',
        style: 'balanced',
        complex: true,
        cost: 17,
        now: { LIFE: 10, EQUITY: 9, TRUST: 6, PROD: 2 },
        cap: 2,
        setFlags: ['CARE_INFRASTRUCTURE'],
        mods: [
          { if: 'COALITION_BUILT', now: { LIFE: 2 }, note: 'Hội đồng liên minh đưa lao động nền tảng vào chương trình.' },
          { if: 'REGION_PARTICIPATION', cost: 2, now: { EQUITY: 3 }, note: 'Mở rộng mạng lưới chăm sóc tới vùng xa.' },
          { if: 'CARE_PILOT', cost: -3, now: { LIFE: 2 }, note: 'Nhân rộng từ mạng lưới thí điểm đã có.' },
        ],
        winners: ['family', 'platform', 'worker'],
        losers: ['business'],
      },
      {
        id: 'Y8-B',
        title: 'Trợ cấp tiền mặt sinh con 2 năm',
        explanation: 'Chỉ trợ cấp tiền mặt khi sinh con trong 2 năm, không mở dịch vụ chăm sóc hay giải quyết nhà ở.',
        outcome: 'Các gia đình trẻ nhận một khoản hỗ trợ. Nhà trẻ vẫn thiếu, người cao tuổi vẫn chờ.',
        style: 'welfare',
        cost: 12,
        now: { LIFE: 5, TRUST: 2, EQUITY: -2, PROD: -2 },
        debt: 5,
        setFlags: ['SHORT_TERM_FAMILY_GRANT'],
        mods: [{ if: 'WELFARE_UNFUNDED', debt: 10, note: 'Lại thêm một khoản chi chưa có nguồn bền vững.' }],
        winners: ['family'],
        losers: ['platform'],
      },
      {
        id: 'Y8-C',
        title: 'Để gia đình tự lo, ưu tiên sản xuất',
        explanation: 'Gia đình tự tổ chức chăm sóc; ngân sách ưu tiên cho ngành sản xuất, không hỗ trợ nhóm yếu thế.',
        outcome: 'Ngân sách đổ vào nhà máy. Nhiều phụ nữ giảm giờ làm hoặc nghỉ việc để chăm người thân.',
        style: 'growth',
        cost: 3,
        now: { PROD: 5, LIFE: -7, EQUITY: -8, TRUST: -5 },
        setFlags: ['CARE_GAP'],
        mods: [{ if: 'LIFE<45', now: { COHESION: -4 } }],
        winners: ['business'],
        losers: ['family', 'platform'],
      },
    ],
    academic: {
      chapter: 7,
      chapterTitle: 'Chương 7 — Gia đình trong thời kỳ quá độ',
      topic: 'Vị trí, chức năng gia đình; cơ sở xây dựng gia đình; biến đổi gia đình hiện đại',
      lesson:
        'Gia đình vừa có chức năng xã hội vừa biến đổi theo điều kiện kinh tế, quan hệ giới và đô thị hóa; cần quan tâm đồng thời điều kiện vật chất và quan hệ tiến bộ, bình đẳng.',
      debrief: 'Chính sách nào tác động vào điều kiện để gia đình thực hiện chức năng, chứ không chỉ xử lý một biểu hiện?',
    },
  },
];
