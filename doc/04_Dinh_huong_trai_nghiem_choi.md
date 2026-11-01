# The Transition — Điều hành đất nước qua bản đồ vùng

Chi tiết sự kiện và cách ảnh hưởng liên vùng: [Cây tình huống v2](05_Cay_tinh_huong_v2_Quan_ly_vung.md).

Trạng thái: định hướng thiết kế đã sửa theo phản hồi người dùng; chưa triển khai gameplay. Tài liệu này thay thế đề xuất trước đó về token, đội triển khai và chuỗi nhiệm vụ cố định làm lõi.

## 1. Định nghĩa trải nghiệm

Người chơi điều hành một đất nước gồm nhiều vùng có đặc điểm và tình trạng riêng. Theo từng kỳ, các vùng phát sinh vấn đề hoặc cơ hội. Người chơi quan sát bản đồ, chọn vùng cần quan tâm, quyết định cách xử lý và theo dõi sự thay đổi của vùng cũng như tác động đến cả nước.

Vòng chơi chính:

**Quan sát bản đồ → chọn vùng → xem vấn đề → quyết định → thấy vùng thay đổi → sang kỳ tiếp theo.**

Hai lớp quyết định: ưu tiên vùng nào trước, và xử lý vấn đề của vùng đó bằng cách nào. Niềm vui đến từ việc chăm sóc và phát triển một đất nước có diễn biến, có liên kết và mang dấu ấn của người chơi.

## 2. Bản đồ là màn chơi chính

Khi vào game, người chơi thấy toàn cảnh đất nước với các vùng phân biệt rõ bằng ranh giới, địa hình, cụm công trình và tên vùng luôn đọc được. Rê chuột hoặc chọn bằng bàn phím làm nổi vùng; bấm chọn để camera tiến lại và mở bảng thông tin ngắn.

Mỗi vùng cần có:

- Phạm vi chọn rõ ràng, không chỉ một điểm camera hoặc một công trình.
- Đặc trưng nhận diện như ruộng, nhà máy, cảng, khu dân cư, đồi núi.
- Trạng thái hiện tại: ổn định, có cơ hội, cần quan tâm, khẩn cấp; kèm biểu tượng và chữ để không phụ thuộc màu.
- Dấu báo vấn đề gắn tại vùng, kèm nhãn ngắn như “Thiếu nước”, “Thiếu việc làm”.
- Thay đổi trực quan tương ứng với quyết định: đường được nối, dịch vụ mở cửa, ruộng phục hồi, công trình đang thi công.

Không mở nhiều bảng sự kiện che bản đồ. Các dấu báo vẫn ở trên bản đồ để người chơi so sánh và chọn thứ tự xử lý.

## 3. Các vùng đề xuất

Đây là các vùng chức năng trong quốc gia hư cấu, chưa chốt thành ranh giới hành chính. Tận dụng địa điểm hiện có nhưng cần thiết kế lại phạm vi và liên kết địa lý.

| Vùng | Đặc trưng | Vấn đề hoặc cơ hội định kỳ | Đóng góp cho cả nước |
|---|---|---|---|
| Công nghiệp Thiên Hà | Nhà máy, khu lao động | Đơn hàng, điều kiện làm việc, đào tạo, chuyển đổi công nghệ | Sản xuất và việc làm |
| Đồng bằng nông nghiệp | Ruộng, hợp tác xã, thủy lợi | Thiếu nước, đầu ra, vận chuyển nông sản | Lương thực và sinh kế |
| Đô thị trung tâm | Dịch vụ công, bệnh viện, quảng trường | Quá tải dịch vụ, tham vấn, công trình chậm tiến độ | Dịch vụ và năng lực quản trị |
| Khu dân cư | Nhà ở, trường học, dịch vụ chăm sóc | Tiền thuê nhà, thiếu chỗ học, chăm sóc trẻ và người già | Đời sống và khả năng tham gia lao động |
| Vùng cao Bản Mây | Núi, làng, hồ và đường kết nối | Nước sạch, tiếp cận dịch vụ, sinh kế, tham vấn cộng đồng | Cơ hội phát triển và kết nối vùng |
| Duyên hải và cảng | Bến tàu, kho vận, tuyến giao thương | Tắc vận tải, biến động đơn hàng, cơ hội mở tuyến | Lưu thông hàng hóa và giao thương |

Một vùng có thể có nhiều chủ đề. Tôn giáo, gia đình, dân chủ và pháp quyền xuất hiện tại những vùng phù hợp; không biến nhóm dân cư hoặc tín ngưỡng thành một loại vấn đề cố hữu.

## 4. Nhịp thời gian và phát sinh vấn đề

Prototype dùng từng kỳ có nút “Sang kỳ tiếp theo”. Bản đồ tạm dừng để người chơi đọc và quyết định; không gây áp lực bằng thời gian thực. Độ dài mỗi kỳ và tổng số kỳ cần thử nghiệm, chưa buộc phải giữ tám lượt bằng tám năm.

Đầu kỳ:

1. Hoàn tất các công trình và hệ quả đến hạn.
2. Cập nhật tình trạng từng vùng và nguồn lực chung.
3. Kiểm tra các vấn đề mới theo lịch, trạng thái địa phương và quyết định trước đó.
4. Hiện dấu báo tại những vùng có diễn biến mới.
5. Người chơi tự chọn thứ tự ghé vùng và xử lý trong nguồn lực cho phép.

Định kỳ không có nghĩa mọi vùng đều báo động mỗi kỳ. Mục tiêu ban đầu là khoảng 2–3 vùng cần chú ý cùng lúc, sau đó điều chỉnh qua playtest. Có thời gian nghỉ sau khi xử lý để người chơi cảm nhận tiến bộ.

Mỗi vấn đề có điều kiện phát sinh, thời hạn nếu có, mức độ, phương án và quy tắc kết thúc. Vấn đề chưa xử lý tồn tại qua kỳ sau; không tự biến mất hoặc tự rút lại ngẫu nhiên. Vấn đề tái phát cần có nguyên nhân, chẳng hạn giải pháp tạm thời đã hết tác dụng.

Biến cố ngẫu nhiên có seed; ưu tiên nguyên nhân dễ hiểu hơn việc liên tục rút sự kiện bất ngờ.

## 5. Khi chọn một vùng

Bảng vùng chỉ cần trả lời:

- Đây là vùng nào và đang diễn ra chuyện gì?
- Việc gì cần xử lý, có thể chờ đến khi nào?
- Có thể làm gì, tốn bao nhiêu, bao lâu có tác dụng?
- Ai hoặc vùng nào khác bị ảnh hưởng?

Mỗi vấn đề có 2–3 cách xử lý với tên hành động ngắn. Ví dụ “Cấp nước tạm thời”, “Sửa kênh dẫn”, “Phối hợp điều tiết hồ”. Chi phí chắc chắn và thời gian thực hiện phải thấy trước khi xác nhận; hệ quả dài hạn mô tả định tính khi còn bất định.

Có thể quay lại bản đồ trước khi chọn để so sánh ưu tiên. Cho phép chủ động chờ với hậu quả được báo rõ; hạn chế nguồn lực cần tạo đánh đổi thực chất giữa các vùng.

Không mặc định thêm token hay thao tác kéo thả. Chọn vùng và quyết định chính sách đã là tương tác lõi của hướng này.

## 6. Ví dụ một kỳ chơi

Trên bản đồ, đồng bằng báo “Thiếu nước”, Thiên Hà báo “Thiếu lao động có kỹ năng”, cảng báo “Cơ hội mở tuyến hàng”.

Người chơi bấm đồng bằng: ruộng khô, kênh dẫn gián đoạn. Cấp nước tạm thời giúp giữ vụ hiện tại nhưng vấn đề có thể quay lại. Sửa kênh tốn hơn và cần một kỳ, có thể cải thiện nguồn cung lâu dài. Điều tiết hồ cần phối hợp vùng cao và đánh giá nhu cầu nước tại đó.

Sau quyết định sửa kênh, công trình hiện trên bản đồ với nhãn “Hoàn tất kỳ tới”. Vùng vẫn còn cảnh báo thiếu nước trong thời gian chờ; không lập tức chuyển xanh khi giải pháp chưa có tác dụng.

Ngân sách còn lại khiến người chơi phải cân nhắc đào tạo ở Thiên Hà hoặc tận dụng cơ hội tại cảng. Sang kỳ, kênh hoàn tất, ruộng phục hồi nếu điều kiện phù hợp. Nông sản tăng làm nhu cầu vận chuyển đến cảng tăng: một quyết định tạo diễn biến tiếp theo ở vùng khác.

Các chi phí, thời gian và quan hệ tác động ở ví dụ này là giả định thiết kế cần cân bằng, không phải số liệu thực nghiệm.

## 7. Phát triển cả nước từ các vùng

Mỗi vùng giữ trạng thái địa phương và danh sách vấn đề riêng. Hệ thống quốc gia vẫn theo dõi nguồn lực chung và các kết quả tổng thể, nhưng không áp trực tiếp một chỉ số toàn quốc để mọi vùng cùng tốt hoặc xấu như nhau.

Liên kết đề xuất:

- Nông nghiệp cung cấp lương thực; giao thông và cảng hỗ trợ đầu ra.
- Công nghiệp tạo việc làm, đồng thời tăng nhu cầu nhà ở và dịch vụ.
- Dịch vụ giáo dục, chăm sóc và y tế hỗ trợ các vùng sản xuất.
- Hạ tầng kết nối giúp vùng cao tiếp cận cơ hội, đồng thời có chi phí và tác động địa phương cần tham vấn.

Hiển thị liên kết khi liên quan một quyết định, tránh vẽ toàn bộ mạng lưới chằng chịt thường trực. Kết quả toàn quốc phản ánh cả mức phát triển và chênh lệch giữa vùng; không chỉ cộng số công trình hoặc lấy trung bình để che vùng bị bỏ lại.

## 8. Giảm chữ và số bằng cách thay đổi cách quan sát

Màn chính: bản đồ, tên vùng, dấu báo, kỳ hiện tại và nguồn lực còn lại. Các chỉ số học thuật chi tiết nằm trong bảng mở rộng.

Mỗi vùng có lời mô tả ngắn theo tình trạng thực: “Nhiều hộ chưa tiếp cận nước sạch”, “Dịch vụ đã hoạt động”, “Cần thêm một kỳ để hoàn thành”. Khi xử lý xong, phản hồi cho biết việc gì đã cải thiện và việc gì còn tồn tại.

Hình ảnh phải bám trạng thái gameplay: thay đổi ruộng, hoạt động nhà máy, tuyến xe hoặc công trình; tránh chỉ đổi màu và tăng điểm. Cảnh báo có chữ và biểu tượng; hỗ trợ chọn vùng bằng bàn phím và giảm chuyển động.

## 9. Gắn nội dung môn học

Các chủ đề đi vào nguyên nhân, lựa chọn và hệ quả của vấn đề ở vùng. Người chơi có thể gặp vấn đề lao động tại Thiên Hà, tham vấn khi làm đường ở Bản Mây, hoặc dịch vụ chăm sóc tại khu dân cư.

Để bảo đảm độ phủ kiến thức, dùng danh mục chủ đề đã gặp và các mốc phát sinh có điều kiện. Không ép quay lại lịch “mỗi năm một chương” bất kể vùng đang ra sao. Phần tổng kết liên hệ các quyết định thực sự đã chơi với nội dung môn học; nếu phiên ngắn chưa đủ chủ đề, ghi rõ thay vì giả định đã học đủ.

## 10. Phạm vi prototype

Bắt đầu với ba vùng: công nghiệp, nông nghiệp và dân cư. Làm rõ ranh giới và thao tác chọn; mỗi vùng có trạng thái riêng, một chuỗi vấn đề qua nhiều kỳ và ít nhất một liên kết với vùng khác.

Prototype cần chứng minh:

- Nhìn bản đồ biết nơi nào đang cần quan tâm.
- Chọn được vùng bất kỳ và quay lại so sánh trước khi quyết định.
- Vấn đề tồn tại, tiến triển hoặc được giải quyết qua kỳ đúng quy tắc.
- Quyết định thay đổi vùng bằng phản hồi quan sát được.
- Hạn chế nguồn lực tạo ra lựa chọn ưu tiên giữa các vùng.
- Ít nhất một hệ quả lan từ vùng được xử lý sang vùng khác.

Sau khi vòng này đủ rõ và thú vị mới mở rộng sáu vùng, hệ thống vấn đề và nội dung học tập.

## 11. Hệ quả với kiến trúc và tài liệu hiện tại

Đây là đổi mô hình gameplay, không chỉ đổi giao diện. Hiện tại các site là điểm lấy khung hình camera; cần thêm định nghĩa vùng có phạm vi chọn, trạng thái địa phương và liên kết. Các zone tô nền hiện tại cũng chưa phải vùng gameplay.

Sim cần bổ sung vùng, vấn đề đang tồn tại, tiến độ giải pháp và thao tác kết thúc kỳ. UI chuyển từ tự trình tình huống năm hiện tại sang mở vấn đề theo vùng được chọn. World phản ánh tình trạng từng vùng, gửi yêu cầu chọn về UI/sim và không tự sửa trạng thái mô phỏng.

Giữ hạ tầng seed, bus và lịch sử khi phù hợp. Các nhánh, điều kiện, cân bằng và kết cục phụ thuộc thứ tự tám năm phải được rà soát lại trước khi chuyển sang mô hình nhiều vấn đề đồng thời.

Sau khi chốt prototype, viết lại GDD, cây tình huống và tutorial theo vùng và kỳ. Các tài liệu cũ vẫn mô tả bản hiện hành; tài liệu này là định hướng thay thế để tránh hiểu nhầm tính năng đã có.
