import { CONFIG, REGION_ORDER } from './config.js';

export const BRIEFING = {
  title: 'Chào mừng, Thủ tướng!',
  paragraphs: [
    `Bạn vừa được bầu làm Thủ tướng Cộng hòa Hòa Minh. Trong ${CONFIG.periods} kỳ tới, bạn sẽ cùng nội các điều hành ${REGION_ORDER.length} vùng của đất nước.`,
    `Các địa phương sẽ gửi việc cần xử lý và cơ hội mới. Bạn quyết định giúp nơi nào trước, chi bao nhiêu và có thể triển khai tối đa ${CONFIG.maxProjects} công trình dài hạn cùng lúc.`,
    'Ví dụ, chuyển xe hàng sang vùng bên có thể giải tỏa nơi này hôm nay nhưng làm ùn bến nơi khác vào kỳ sau. Mỗi kỳ có một lượt kinh doanh để kiếm thêm 2 ngân sách nếu thắng. Hãy cân nhắc dùng tiền xử lý việc gấp hay góp vốn cho các cơ hội ở địa phương.',
  ],
};
