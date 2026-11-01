// Briefing, FINAL_REPAIR and the six endings (GDD §7, doc 02 §7).

export const BRIEFING = {
  title: 'The Transition — Thời kỳ quá độ',
  paragraphs: [
    'Cả lớp là Hội đồng điều hành Cộng hòa Hòa Minh — một quốc gia hoàn toàn hư cấu với 22 triệu dân, nhiều cộng đồng dân tộc và tín ngưỡng, đang trong thời kỳ quá độ lên chủ nghĩa xã hội.',
    'Trong 8 năm, mỗi năm có một tình huống gắn với một chủ đề MLN131: giai cấp công nhân, thời kỳ quá độ, dân chủ, pháp quyền, cơ cấu giai cấp, dân tộc, tôn giáo và gia đình.',
    'Nhiệm vụ không phải chỉ giữ ghế hay chỉ tăng GDP: cần phát triển lực lượng sản xuất, nâng đời sống, giữ niềm tin, pháp quyền, công bằng và đoàn kết — với ngân sách và năng lực thực thi hữu hạn.',
    'Mỗi lựa chọn có người hưởng lợi, người chịu chi phí và có thể tạo hệ quả nhiều năm sau. Điểm số chỉ hiện sau khi biểu quyết. Không có đáp án “đúng” đánh dấu sẵn.',
    'Lưu ý: quốc gia, số liệu, nhân vật và hệ số tác động đều là giả định để mô phỏng, không mô tả hay đánh giá bất kỳ quốc gia có thật nào.',
  ],
};

export const FINAL_REPAIR = {
  institutional: {
    headline: 'Khủng hoảng thể chế kéo dài',
    text: 'Pháp quyền và niềm tin đã ở mức rất thấp suốt hai năm. Bộ máy không còn được tin để thực thi quyết định. Hội đồng có một cơ hội cuối để tái lập cơ chế giám sát — với cái giá phải công khai.',
    choices: [
      {
        id: 'REPAIR-A',
        title: 'Tái lập cơ chế giám sát, công khai đánh đổi',
        explanation: 'Mời cơ quan giám sát độc lập, công khai sai phạm, cứu trợ tối thiểu; chấp nhận chậm tăng trưởng và vay thêm.',
        outcome: 'Hội đồng công khai danh sách sai phạm và lộ trình sửa chữa. Tăng trưởng chậm lại, nhưng bộ máy bắt đầu được tin trở lại.',
        cost: 10,
        now: { LAW: 8, TRUST: 5, LIFE: 5, PROD: -5 },
        cap: 5,
        debt: 5,
        setFlags: ['FINAL_REPAIR_USED'],
      },
      {
        id: 'REPAIR-B',
        title: 'Phân kỳ: sửa từng phần',
        explanation: 'Chỉ khắc phục một phần trong khả năng ngân sách hiện có.',
        outcome: 'Một số cơ chế giám sát được khôi phục; phần lớn vấn đề vẫn còn.',
        cost: 3,
        now: { LAW: 3, TRUST: 2 },
        setFlags: ['FINAL_REPAIR_USED'],
      },
    ],
  },
  livelihood: {
    headline: 'Khủng hoảng sinh kế kéo dài',
    text: 'Đời sống và năng lực sản xuất đã ở mức rất thấp suốt hai năm. Dịch vụ thiết yếu có nguy cơ gián đoạn. Hội đồng có một cơ hội cuối để cứu trợ và tái cấu trúc.',
    choices: [
      {
        id: 'REPAIR-A',
        title: 'Cứu trợ khẩn cấp và tái cấu trúc sản xuất',
        explanation: 'Cứu trợ tối thiểu cho mọi hộ, tái cấu trúc doanh nghiệp then chốt, công khai khoản vay.',
        outcome: 'Bếp ăn, thuốc men và việc làm công ích được bảo đảm; khoản nợ mới được công khai trước dân.',
        cost: 10,
        now: { LIFE: 8, PROD: 5, TRUST: 2 },
        cap: 3,
        debt: 8,
        setFlags: ['FINAL_REPAIR_USED'],
      },
      {
        id: 'REPAIR-B',
        title: 'Phân kỳ: cứu trợ từng phần',
        explanation: 'Chỉ cứu trợ trong khả năng ngân sách hiện có.',
        outcome: 'Một phần hộ gia đình được hỗ trợ; nền sản xuất vẫn trì trệ.',
        cost: 3,
        now: { LIFE: 4, PROD: 2 },
        setFlags: ['FINAL_REPAIR_USED'],
      },
    ],
  },
};

export const ENDINGS = {
  E1: {
    id: 'E1',
    title: 'Chuyển đổi có nền tảng',
    text: 'Kinh tế, xã hội và thể chế cùng tiến bộ. Năng lực sản xuất tăng đi cùng đời sống, pháp quyền và niềm tin. Thách thức vẫn còn — thành quả này cần được duy trì bằng thiết chế, không phải bằng may mắn.',
    question: 'Đặc trưng và điều kiện thực hiện mục tiêu xã hội chủ nghĩa là gì?',
  },
  E2: {
    id: 'E2',
    title: 'Tăng trưởng lệch pha',
    text: 'Khả năng sản xuất cao, nhưng phân phối lợi ích và cơ hội tiếp cận chưa tương xứng. Nhiều nhóm đứng ngoài thành quả tăng trưởng.',
    question: 'Lực lượng sản xuất phát triển có tự động giải quyết các quan hệ xã hội không?',
  },
  E3: {
    id: 'E3',
    title: 'Phúc lợi thiếu bền vững',
    text: 'Mức sống được nâng đỡ, nhưng nguồn lực tạo ra chưa đủ để duy trì. Nợ hoặc nền sản xuất yếu đe dọa chính những thành quả đã có.',
    question: 'Mối quan hệ giữa phát triển kinh tế và tiến bộ xã hội là gì?',
  },
  E4: {
    id: 'E4',
    title: 'Ổn định hình thức',
    text: 'Bề mặt ít xung đột công khai, nhưng niềm tin hoặc pháp quyền ở mức thấp. Sự yên ổn này dựa trên im lặng hơn là đồng thuận.',
    question: 'Dân chủ thực chất khác dân chủ hình thức ra sao?',
  },
  E5: {
    id: 'E5',
    title: 'Cải cách dang dở',
    text: 'Có những thành tựu thật, song năng lực thực thi và liên minh xã hội chưa đồng đều. Con đường còn dài và nhiều mâu thuẫn.',
    question: 'Vì sao thời kỳ quá độ có thể phức tạp, kéo dài và chứa nhiều mâu thuẫn?',
  },
  E6: {
    id: 'E6',
    title: 'Đứt gãy quản trị',
    text: 'Theo mô hình của trò chơi, bộ máy không còn đủ năng lực bảo đảm dịch vụ tối thiểu và giữ được niềm tin. Nút cứu vãn cuối cùng không đủ để vượt qua khủng hoảng.',
    question: 'Thiết chế, pháp luật, kinh tế và niềm tin đóng vai trò gì trong quản trị?',
  },
};

// Short notes shown when a non-primary ending condition also holds (GDD §7.2: keep the paradox visible).
export const SECONDARY_NOTES = {
  E1: 'Đồng thời đạt nhiều tiêu chí của chuyển đổi có nền tảng.',
  E2: 'Có dấu hiệu tăng trưởng lệch pha: sản xuất cao nhưng đời sống hoặc công bằng tụt lại.',
  E3: 'Có dấu hiệu phúc lợi thiếu bền vững: mức sống dựa vào nguồn lực chưa vững.',
  E4: 'Có dấu hiệu ổn định hình thức: ít xung đột bề mặt nhưng niềm tin hoặc pháp quyền thấp.',
  REPAIR: 'Hội đồng đã phải dùng nút cứu vãn cuối: chuyển đổi có nền tảng không còn khả dĩ trong nhiệm kỳ này.',
  LABOR_UNRESOLVED: 'Mâu thuẫn lao động từ những năm đầu vẫn chưa được giải quyết.',
  DEBT: 'Áp lực nợ cao sẽ thu hẹp lựa chọn của nhiệm kỳ sau.',
};

export const WHAT_IF = 'Nếu chọn khác ở Y3 (dân chủ) và Y6 (dân tộc) thì kết cục sẽ thay đổi thế nào? Điều kiện khách quan và chủ quan nào đã quyết định kết quả?';
