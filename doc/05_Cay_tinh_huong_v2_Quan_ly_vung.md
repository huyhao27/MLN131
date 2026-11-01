# Cây tình huống v2 — Quản lý vùng và chuỗi sự kiện liên vùng

Trạng thái: bản thiết kế đề xuất, chưa triển khai trong engine. Dùng cùng `04_Dinh_huong_trai_nghiem_choi.md`. Bản v1 và game hiện hành vẫn chạy theo tám năm; v2 thay thế cấu trúc đó khi triển khai chế độ bản đồ vùng.

Đã xem cây người dùng cung cấp tại `D:\Download\02_Cay_tinh_huong_The_Transition_MLN131.md` và bản trong dự án. Mọi địa danh, quan hệ tác động, thời gian và chi phí trong thiết kế là giả định gameplay cần thử nghiệm.

## 1. Đánh giá cây hiện tại và quyết định thay đổi

| Hiện tại | Tác động đến trải nghiệm | Thay đổi ở v2 |
|---|---|---|
| Y1 → Y8 cố định theo chương | Người chơi đi theo bài học thay vì điều hành bản đồ | Tình huống xuất hiện ở vùng đủ điều kiện; người chơi chọn thứ tự xử lý |
| Tối đa ba R-event mỗi ván | Biến cố là phần phụ | Sự kiện địa phương, cơ hội và hệ quả liên vùng tạo vòng chơi chính |
| Tác động chủ yếu qua delta toàn quốc | Khó thấy nơi nào được giúp, nơi nào đang chịu thiệt | Lưu thay đổi tại vùng, công trình và tuyến liên kết trước khi tổng hợp toàn quốc |
| Nhiều phương án tốt toàn diện đối lập phương án thiếu sót rõ | Dễ đoán ý người viết | Các phương án khả thi cạnh tranh về tiền, thời gian, công suất và rủi ro |
| Hệ quả trễ gắn vào năm cố định | Khó ứng biến khi sự kiện đến ở thứ tự khác | Dùng kỳ tương đối kể từ biến cố/quyết định |
| Đọc dữ kiện và nêu khái niệm trước mỗi quyết định | Ngắt nhịp quản lý | Màn chơi dùng nhu cầu cụ thể; liên hệ môn học nằm ở phần mở rộng và tổng kết |

Mục tiêu: người chơi nhớ “mình cứu vụ mùa nhưng làm xưởng thiếu điện một kỳ”, hiểu tại sao và muốn thử cách khác ở ván sau.

## 2. Bản đồ và mạng liên kết

Sáu vùng dùng chung với tài liệu 04:

| Mã | Vùng | Thứ cung cấp | Thứ phụ thuộc |
|---|---|---|---|
| CN | Công nghiệp Thiên Hà | Hàng hóa, việc làm | Điện, linh kiện, vận tải, lao động |
| NN | Đồng bằng nông nghiệp | Lương thực, nông sản | Nước, đường vận chuyển, kho bảo quản |
| TT | Đô thị trung tâm | Y tế, đào tạo, dịch vụ công | Điện, nguồn cung, nhân lực và khả năng tiếp cận |
| DC | Khu dân cư | Lao động, nhu cầu tiêu dùng | Việc làm, thực phẩm, nhà ở, dịch vụ chăm sóc |
| VC | Vùng cao Bản Mây | Nguồn nước, một phần điện, nông sản vùng cao | Đường kết nối, dịch vụ, sinh kế địa phương |
| CB | Duyên hải và cảng | Xuất nhập hàng, kho vận | Điện, đường kết nối, nhân lực |

Liên kết là dữ liệu gameplay: nguồn → đích, loại dịch vụ, công suất hiện tại, công suất dự phòng, trạng thái hỏng/bảo trì. Một sự kiện chỉ lan đến nơi thực sự phụ thuộc dịch vụ bị thiếu, có xét dự phòng và giải pháp đang hoạt động.

Không bắt mọi biến cố đều lan toàn bản đồ. Sự kiện nhỏ có thể ảnh hưởng một vùng; sự kiện lớn thường có hai hoặc ba vùng liên quan. Liên kết tốt cũng giúp lợi ích lan: kho lạnh hoạt động giúp nông dân giữ hàng và cảng giao hàng ổn định hơn.

## 3. Vòng quản lý và nguồn lực

Prototype đề xuất tám kỳ để so sánh với bản cũ, mỗi kỳ là một giai đoạn quản lý hư cấu, không bắt buộc tương đương một năm. Chưa chốt thời lượng ván.

Đầu kỳ: công trình hoàn tất → tính cung ứng hiện tại → xử lý hệ quả đến hạn → kiểm tra mức nghiêm trọng và thời hạn → tạo sự kiện mới → người chơi tự chọn vùng xử lý → kết thúc kỳ.

Dùng ngân sách chung và tối đa hai dự án dài hạn đang thi công cùng lúc làm ràng buộc ban đầu. Giải pháp hỗ trợ ngắn hạn dùng tiền nhưng không chiếm chỗ dự án. Không giới hạn số quyết định bằng số lần bấm; quyết định bị giới hạn bởi chi phí, điều kiện và năng lực triển khai.

Để đọc bảng sự kiện: chi phí **thấp/vừa/cao** là tương quan trong thiết kế; bản triển khai phải hiện số tiền chính xác. **Ngay** là có hiệu lực khi xác nhận, **+1/+2** là sau một/hai lần sang kỳ. Mỗi phương án trả chi phí một lần; phí duy trì nếu có phải ghi riêng. Mỗi sự kiện có lựa chọn chờ và hậu quả được báo trước.

## 4. Cấu trúc một sự kiện

Mỗi sự kiện có nơi khởi phát, tín hiệu trực quan, điều kiện rút, thay đổi tại chỗ, quy tắc lan, thời hạn, phương án và cách phục hồi.

Chu trình: **được báo → đang mở → đang xử lý/đang chờ → ổn định hoặc leo thang → kết thúc → thời gian nghỉ**. Bắt đầu dự án chưa đồng nghĩa vấn đề đã được giải quyết. Một sự kiện chỉ kết thúc khi điều kiện phục hồi đạt hoặc thiệt hại cuối đã được ghi nhận; vấn đề con có vòng đời riêng.

Ba loại nguồn gốc phải hiển thị khác nhau:

- **Ngẫu nhiên:** một biến cố mới được rút có điều kiện.
- **Hệ quả:** xảy ra vì trạng thái cung ứng hoặc quyết định trước; ghi rõ nguyên nhân.
- **Cơ hội:** có hạn sử dụng; bỏ qua thường mất cơ hội, không tự gây hình phạt.

## 5. Danh mục 24 sự kiện mới

Các mã RV độc lập với R01–R08 cũ. “Lan” bên dưới là điều kiện thiết kế bắt buộc phải kiểm tra, không phải delta tự động lên tất cả vùng được nhắc tới.

### Nước, điện và thời tiết

| ID / nơi | Bản tin và điều kiện xuất hiện | Lan sang vùng khác nếu không ứng phó | Các hướng xử lý và đánh đổi |
|---|---|---|---|
| RV01 / VC | **Hồ xuống thấp.** Rút khi mùa khô hoặc dự trữ thấp; cảnh mực nước giảm | +1: NN thiếu tưới nếu không có nguồn thay; CN thiếu điện nếu thủy điện không đủ và không có dự phòng | A. Ưu tiên tưới: thấp/ngay, giảm rủi ro mất mùa nhưng điện cấp CN giảm một kỳ. B. Bổ sung điện tạm và phân phối nước theo nhu cầu: cao/ngay, có phí duy trì và kéo dài hữu hạn. C. Tiết kiệm luân phiên: thấp/ngay, mỗi vùng chịu giảm công suất nhẹ, cần theo dõi dự trữ |
| RV02 / CB | **Bão vào bến.** Có cảnh báo trước một kỳ | Cảng đóng khi bão đến; +1 CN thiếu linh kiện nếu tồn kho cạn, NN mất đầu ra nếu không có kho | A. Gia cố và đưa hàng vào kho: vừa/+1, tốn tiền trước khi biết mức thiệt hại. B. Chuyển hàng qua đường bộ: cao/ngay, chiếm công suất tuyến. C. Đóng bến có kế hoạch: thấp/ngay, giảm thiệt hại thiết bị nhưng chấp nhận trễ hàng |
| RV03 / CN | **Trạm điện gặp sự cố.** Rủi ro cao hơn khi tải kéo dài vượt công suất | TT và DC cùng tuyến điện có thể gián đoạn; tuyến có dự phòng không bị ảnh hưởng | A. Sửa khẩn: cao/+1, ưu tiên điện cho dịch vụ thiết yếu trong lúc sửa. B. Thuê nguồn tạm: vừa/ngay và phí duy trì, chưa sửa nguyên nhân. C. Giảm tải sản xuất để sửa thường: thấp/+2, giảm việc làm/đầu ra tạm thời |
| RV04 / VC | **Sạt lở đường lên bản.** Cần tuyến đường đang hoạt động, có mưa lớn | VC khó tiếp cận TT; NN thiếu nông sản vùng cao nếu có hợp đồng cung ứng đang chạy | A. Mở tuyến tạm: vừa/+1, tải thấp. B. Sửa và gia cố: cao/+2, bền hơn. C. Vận chuyển hàng thiết yếu chuyên biệt: vừa/ngay, chỉ cứu trợ tiếp cận, chưa khôi phục thương mại |

### Hàng hóa, thị trường và giao thông

| ID / nơi | Bản tin và điều kiện xuất hiện | Lan sang vùng khác nếu không ứng phó | Các hướng xử lý và đánh đổi |
|---|---|---|---|
| RV05 / NN | **Được mùa, kho đã đầy!** Cần sản lượng cao hơn sức chứa | +1: CB dồn xe nếu xuất hết cùng lúc; DC có thể nhận thực phẩm rẻ nếu có kênh phân phối | A. Thuê kho tạm: vừa/ngay, mua thời gian và có phí. B. Chia hàng cho thị trường trong nước: thấp/ngay, cần tuyến đến DC và giá bán thấp hơn. C. Làm kho bảo quản: cao/+2, vụ hiện tại vẫn cần phương án tạm |
| RV06 / CB | **Tàu đến cùng một lúc.** Cần lưu lượng gần ngưỡng cảng | +1 CN thiếu linh kiện, NN giao chậm khi hàng tương ứng thực sự bị kẹt | A. Xếp lại lịch giao nhận: thấp/ngay, một số đơn đến trễ. B. Thuê bãi và thiết bị: vừa/ngay, chi phí tăng. C. Nâng bến: cao/+2, thi công làm giảm công suất trước khi tăng |
| RV07 / CN | **Đơn hàng lớn, hạn giao gần.** Cơ hội, cần xưởng có năng lực tối thiểu | Nhận đơn tăng tải CB và nhu cầu lao động DC; không nhận không gây phạt | A. Nhận một phần: lợi nhuận vừa, tải dễ chịu. B. Nhận đủ và thuê năng lực bổ sung: chi cao, cần điện/vận tải đáp ứng. C. Chuyển kỳ giao qua thương lượng: lợi nhuận thấp hơn nhưng có thời gian chuẩn bị |
| RV08 / CB | **Linh kiện nhập về chậm.** Cần CN đang dùng chuỗi nhập khẩu | +1 CN giảm sản lượng khi tồn kho hết; +2 DC giảm thu nhập nếu xưởng cắt ca | A. Mua nguồn khác: cao/+1, cần kiểm tra phù hợp. B. Chia tồn kho cho dây chuyền thiết yếu: thấp/ngay, giảm đầu ra khác. C. Phát triển nhà cung ứng nội địa: cao/+2, không cứu ngay đơn đang thiếu |
| RV09 / NN | **Sâu bệnh ở một cụm ruộng.** Cần diện tích canh tác đang hoạt động | DC tăng áp lực giá nếu mất mùa và dự trữ lương thực không đủ; chỉ lan dịch sang ruộng có kết nối phù hợp | A. Xử lý đúng khu phát hiện: vừa/+1, cần theo dõi. B. Khoanh vùng vụ này và bù sinh kế: cao/ngay, mất một phần sản lượng có kiểm soát. C. Chuyển cây trồng phù hợp: vừa/+2, chậm thu hoạch |
| RV10 / TT | **Cầu cần đóng để sửa.** Xác suất tăng khi bảo trì bị trì hoãn | CN ↔ CB chậm hàng, NN ↔ DC chậm thực phẩm nếu đi qua cầu đó | A. Sửa từng làn: vừa/+2, vẫn đi chậm. B. Đóng và sửa nhanh: cao/+1, cần tuyến vòng. C. Tăng tải tuyến vòng và hỗ trợ vận chuyển: vừa/ngay, cầu vẫn cần dự án sửa |

### Lao động, nhà ở và dịch vụ

| ID / nơi | Bản tin và điều kiện xuất hiện | Lan sang vùng khác nếu không ứng phó | Các hướng xử lý và đánh đổi |
|---|---|---|---|
| RV11 / CN | **Máy mới về, người chưa được đào tạo.** Cần dự án chuyển đổi công nghệ | DC mất thu nhập nếu chuyển đổi làm giảm vị trí cũ; TT tăng nhu cầu đào tạo | A. Đào tạo theo ca: vừa/+2, giữ một phần sản xuất. B. Thuê chuyên gia và kèm cặp: cao/+1, nhanh hơn nhưng đắt. C. Chuyển đổi từng dây chuyền: thấp/+2, chậm tăng năng suất |
| RV12 / DC | **Tiền thuê nhà tăng nhanh.** Cần việc làm tăng nhanh hơn chỗ ở | +1 CN/CB khó giữ lao động nếu thời gian đi lại và giá thuê vượt khả năng; TT tăng nhu cầu hỗ trợ | A. Hỗ trợ thuê có thời hạn: vừa/ngay, có phí đến hạn. B. Cải tạo nhà trống phù hợp: cao/+2. C. Tăng xe kết nối khu ở xa: vừa/+1, phụ thuộc đường và vẫn mất thời gian đi lại |
| RV13 / DC | **Nhà trẻ hết chỗ.** Cần nhu cầu chăm sóc vượt khả năng phục vụ | +1 CN/TT thiếu nhân lực nếu hộ gia đình không có giải pháp chăm sóc khác | A. Mở thêm lớp ở cơ sở đủ điều kiện: vừa/+1. B. Hỗ trợ tiếp cận cơ sở còn chỗ: thấp/ngay, cần khả năng đi lại. C. Xây điểm chăm sóc mới: cao/+2; trong lúc chờ vẫn cần hỗ trợ |
| RV14 / TT | **Bệnh viện đông hơn dự kiến.** Rút khi nhu cầu vượt công suất, không dùng yếu tố dân tộc/tín ngưỡng làm nguyên nhân | DC và VC kéo dài thời gian tiếp cận nếu dùng bệnh viện đó; lao động các vùng có thể phải nghỉ chăm thân nhân | A. Mở ca khám bổ sung có giới hạn: vừa/ngay, tăng tải nhân viên. B. Bổ sung điểm khám địa phương: cao/+2, giảm nhu cầu đi xa. C. Điều phối sang cơ sở còn chỗ và hỗ trợ đi lại: thấp/ngay, chỉ hiệu quả nếu có công suất thực |
| RV15 / CN | **Xe đưa đón không theo kịp ca làm.** Cần lượng lao động đi lại cao | DC tăng thời gian đi lại; CB tắc xe nếu dùng chung tuyến đang quá tải | A. Lệch giờ ca qua thỏa thuận: thấp/ngay, cần phù hợp lịch chăm sóc. B. Tăng tuyến xe: vừa/+1. C. Mở tuyến kết nối mới: cao/+2, bớt tắc lâu dài |
| RV16 / CB | **Lịch làm việc ở cảng chưa được thống nhất.** Cần ca tăng hoặc thay đổi hợp đồng | Nếu chưa đạt thỏa thuận và công suất giảm: CN trễ linh kiện, NN trễ giao hàng tùy tồn kho | A. Thương lượng lịch, thu nhập và nghỉ ngơi: vừa/+1. B. Giảm lượng nhận để giữ lịch hiện tại: thấp/ngay, giảm doanh thu. C. Tuyển và đào tạo bổ sung với thỏa thuận chuyển tiếp: cao/+2, cần phương án một kỳ chờ |

### Cơ hội phát triển và đời sống trên bản đồ

| ID / nơi | Bản tin và điều kiện xuất hiện | Tác động liên vùng | Các hướng xử lý và đánh đổi |
|---|---|---|---|
| RV17 / VC | **Mùa hội Bản Mây.** Cơ hội, có năng lực cộng đồng tổ chức và đồng thuận | Khách tăng tạo nhu cầu đi lại TT–VC và lưu trú; NN có đầu ra sản phẩm địa phương | A. Quy mô nhỏ do cộng đồng tổ chức: thấp, lợi ích vừa. B. Tăng quy mô cùng hạ tầng tạm: cao, cần đường và dịch vụ. C. Dời kỳ tổ chức: mất một phần khách, thêm thời gian chuẩn bị |
| RV18 / TT | **Phiên chợ cuối tuần được hưởng ứng.** Cơ hội, cần tuyến đi lại khả dụng | NN có đầu ra, DC tiếp cận hàng; CN/CB chịu tắc nếu chợ dùng chung tuyến giờ cao điểm | A. Chợ gần khu ở: vừa, cần chỗ phù hợp. B. Chợ tại đầu mối giao thông: thấp, phải bố trí lệch giờ. C. Nhiều điểm nhỏ: cao hơn về điều phối, giảm tập trung xe |
| RV19 / TT | **Trường nghề mở khóa học mới.** Cơ hội, cần cơ sở đào tạo và chỗ học | Có thể nâng kỹ năng CN hoặc vận hành kho CB hoặc bảo quản NN; chọn nhóm ưu tiên quyết định vùng hưởng lợi trước | A. Ưu tiên ngành đang thiếu người: lợi ích sớm, vùng khác phải chờ. B. Chia đợt đào tạo: lợi ích rộng nhưng chậm. C. Phối hợp doanh nghiệp cùng đầu tư: giảm chi công, cần cam kết thời gian và quyền tiếp cận rõ |
| RV20 / CB | **Có đề nghị đầu tư kho lạnh.** Cơ hội, cần nguồn hàng NN và điện khả dụng | NN giảm hỏng hàng; CN/TT có thể chịu thiếu điện nếu lưới không được nâng theo tải mới | A. Làm kho nhỏ trước: vừa/+1. B. Kho lớn kèm nâng cấp điện: cao/+2. C. Thuê dịch vụ bảo quản: phí định kỳ, không có tài sản mới |
| RV21 / CN | **Có thể tận dụng nhiệt thải nhà máy.** Cơ hội, cần nguồn nhiệt phù hợp và khoảng cách kết nối hợp lệ | NN giảm chi phí sấy; đường thi công có thể làm CB giao hàng chậm một kỳ | A. Thí điểm công suất nhỏ: vừa/+1, lợi ích giới hạn. B. Xây kết nối đầy đủ: cao/+2, cần điều phối thi công. C. Khảo sát thêm: thấp, cơ hội có thể hết hạn |
| RV22 / DC | **Khu đất trống, nhiều đề xuất.** Cơ hội, cần khu đất sử dụng hợp lệ và tham vấn | Nhà ở hỗ trợ lao động CN; dịch vụ chăm sóc hỗ trợ DC/TT; công viên tạo không gian sinh hoạt | A. Nhà ở phù hợp nhu cầu: cao/+2. B. Điểm chăm sóc: vừa/+1. C. Không gian xanh công cộng: thấp/+1. Mỗi lựa chọn dùng cùng khu đất, không cộng cả ba lợi ích |
| RV23 / TT | **Thiết bị mua về chưa dùng được.** Cần dự án mua sắm mới và thiếu khâu kiểm tra tương thích | DC/VC tiếp tục chờ dịch vụ nếu thiết bị dành cho bệnh viện; CN chậm nâng kỹ năng nếu dành cho trường nghề | A. Đổi thiết bị theo hợp đồng: vừa/+1, cần điều kiện đổi. B. Nâng phần phụ trợ phù hợp: cao/+2. C. Thuê thiết bị tạm và làm rõ trách nhiệm theo quy trình: có phí duy trì, chưa khép vụ việc; không suy đoán có tội từ sự cố kỹ thuật |
| RV24 / NN | **Tuyến bán hàng mới lan truyền mạnh.** Cơ hội, cần sản phẩm và kênh giao hàng | NN tăng đơn; CB tăng tải; DC có thể bị giao chậm nếu giao vận dùng hết công suất | A. Nhận đơn theo sức giao: lợi ích vừa, ổn định. B. Hợp tác logistics: vừa/+1, cần công suất thật. C. Mở rộng nhanh kèm kho/xe thuê: cao/ngay và phí duy trì, rủi ro khi lượng mua giảm |

## 6. Ba cây liên vùng viết chi tiết

### Chuỗi A — Hồ cạn, cứu ruộng hay giữ công suất?

1. Kỳ K, RV01 phát sinh tại VC. Hiện đường nối tới NN và CN; người chơi biết nước dự trữ chỉ đáp ứng hạn chế trong kỳ tới.
2. Chọn ưu tiên tưới: NN tránh thiếu nước vụ hiện tại. Phần điện thiếu tại CN được tính sau khi trừ nguồn dự phòng.
3. Nếu CN thiếu điện ròng, K+1 tạo hậu quả H01 “Xưởng phải chia ca”. Không bốc lại ngẫu nhiên H01 và không áp thêm một lần phạt mất điện trùng với RV01.
4. Tại CN có thể thuê nguồn điện tạm, chia lịch sản xuất qua thỏa thuận hoặc giảm nhận đơn. Chia lịch có thể tạo nhu cầu điều chỉnh xe tại DC nếu khung giờ cũ không phù hợp.
5. Nếu DC có tuyến linh hoạt, không tạo vấn đề xe. Nếu chưa có, H02 cho phép chỉnh lịch xe hoặc hỗ trợ đi lại.
6. Khi hồ phục hồi hoặc nguồn bổ sung đáp ứng nhu cầu, gỡ hạn chế cung ứng; thiệt hại đã xảy ra vẫn lưu trong lịch sử. Có thể đầu tư dự phòng để giảm rủi ro ở ván sau.

**Điều thú vị:** cứu được mùa là thành quả thật, nhưng cần quản lý công suất và lịch sinh hoạt ở nơi khác. Không có một nút giải quyết toàn chuỗi với giá rẻ.

### Chuỗi B — Được mùa là tin vui, nhưng chưa có kho

1. RV05 tại NN: lượng hàng vượt sức chứa; hiển thị số kỳ còn có thể giữ trước hỏng, không tự mất ngay khi sự kiện xuất hiện.
2. Chọn xuất nhanh qua CB: kiểm tra công suất tuyến NN–CB và sức chứa cảng trước khi xác nhận; báo trước lượng hàng có nguy cơ chậm.
3. Nếu tổng hàng vượt công suất, K+1 tạo H03 “Hàng chờ ở bến”. Chỉ phần vượt ngưỡng bị chậm. Nếu linh kiện nhập CN dùng bãi riêng còn trống, CN không bị phạt.
4. Có thể đổi lịch, thuê kho hoặc chuyển một phần hàng sang DC nếu tuyến và nhu cầu còn khả dụng. Chuyển hàng trong nước giảm áp lực cảng và giá thực phẩm, nhưng doanh thu xuất khẩu thấp hơn.
5. Kho lạnh hoàn tất ở kỳ sau giảm hỏng hàng cho các vụ tiếp theo, đồng thời tăng tải điện. Chỉ phát sinh thiếu điện khi phần tải tăng vượt dự phòng.

**Điều thú vị:** cơ hội thành công tạo bài toán quản lý mới; kế hoạch có chuẩn bị giúp tận dụng chuỗi lợi ích thay vì chỉ tránh khủng hoảng.

### Chuỗi C — Nhà máy lớn lên, khu ở chưa kịp lớn

1. RV07 tại CN, người chơi nhận đơn lớn và tăng nhu cầu lao động.
2. Sau một kỳ, chỉ khi nhu cầu chỗ ở vượt cung mới kích hoạt H04 “Chỗ ở gần xưởng không đủ”; không tự động rút RV12 thêm một lần cho cùng nguyên nhân.
3. Chọn phát triển nhà ở mới: hai kỳ chờ. Trong lúc chờ có thể hỗ trợ thuê hoặc kết nối khu ở còn chỗ; chi phí hỗ trợ kết thúc đúng thời hạn đã công bố.
4. Nếu tăng xe nhưng tuyến DC–CN gần đầy, hiển thị nguy cơ tắc; chọn lệch giờ có thể tránh vấn đề mới, với điều kiện lịch chăm sóc phù hợp.
5. Dịch vụ chăm sóc mở thêm ở DC giúp cả lao động CN và nhân viên TT. Đây là lợi ích lan có thể quan sát qua khả năng đi làm và tiếp cận dịch vụ.

**Điều thú vị:** người chơi xây được một khu vực thành công và phải chủ động chuẩn bị hệ thống hỗ trợ quanh nó.

## 7. Quy tắc rút ngẫu nhiên và chống quá tải

Thông số dưới đây là giả thuyết prototype, không phải cân bằng đã kiểm chứng:

- Kỳ đầu chỉ có một vấn đề nhẹ và một cơ hội, hướng dẫn bằng thao tác chọn vùng.
- Từ kỳ hai, xét rút tối đa một sự kiện gốc mới mỗi kỳ; xác suất thử ban đầu 70% khi bản đồ còn chỗ cho diễn biến mới.
- Chỉ rút sự kiện có điều kiện hợp lệ, đủ thời gian để ít nhất một phương án có tác dụng trước hết ván, và có một cách ứng phó phù hợp khả năng hiện tại.
- Đặt ngân sách chú ý khoảng bốn vấn đề/cơ hội chưa giải quyết trên bản đồ, tối đa hai mục ở một vùng. Đang chờ hoàn tất dự án vẫn tính là chưa giải quyết; có thể gộp các mục cùng nguyên nhân vào một cụm.
- Hệ quả đến hạn được xử lý trước; khi nhiều hệ quả cùng đến, dừng rút sự kiện gốc. Không xóa hậu quả để giữ hạn mức, không trì hoãn thời hạn đã hứa với người chơi.
- Một gốc chỉ tạo tối đa hai tầng vấn đề cần người chơi ra quyết định. Hệ quả sâu hơn cập nhật tình trạng và bản tin, không tự sinh chuỗi hộp thoại vô hạn.
- Sự kiện gốc cùng loại nghỉ ít nhất ba kỳ sau khi kết thúc; sự kiện còn mở không được rút bản sao.
- Tăng trọng số vùng ít có diễn biến, giảm trọng số vùng vừa trải qua khủng hoảng. Mục tiêu là phân bố hoạt động, không trừng phạt vùng đang yếu.
- Điều kiện rủi ro chỉ điều chỉnh xác suất trong giới hạn, không biến sự kiện thành chắc chắn trừ khi đó là hệ quả đã báo trước.
- Kho sự kiện thử nghiệm hướng đến khoảng một phần ba cơ hội, một phần ba vấn đề nhỏ và một phần ba áp lực lớn. Không ép tỷ lệ này cho từng ván ngắn; theo dõi phân bố thực tế qua nhiều seed.
- Seed được dùng cho điều kiện rút, chọn sự kiện và mức độ; mở/đóng bảng, đổi camera hay tải lại không tạo lần rút mới.

Nếu có nhiều vấn đề nghiêm trọng đồng thời, ưu tiên bảo toàn các diễn biến đã công bố và cho khả năng điều chỉnh/ứng cứu. Vấn đề chưa giải quyết hết cuối ván được phản ánh ở tổng kết thay vì phạt như đã hết thời hạn khi chưa đến hạn.

## 8. Quy tắc lan truyền có thể kiểm tra

Mỗi tác động phải ghi: nguyên nhân, vùng nguồn, vùng đích, loại dịch vụ, mức thay đổi, độ trễ, điều kiện, cách chặn và điều kiện phục hồi.

Tính thiếu hụt trên từng vùng/dịch vụ theo nhu cầu thực, nguồn cung còn lại và dự phòng. Gộp nhiều nguồn cùng ảnh hưởng trước khi tạo vấn đề thiếu hụt. Không dùng “cảng trễ” rồi trừ việc làm ở mọi vùng không xét tồn kho hoặc tuyến đi.

- Một cặp nguyên nhân–tác động chỉ áp dụng một lần mỗi kỳ. Nếu nhiều kỳ thiếu cung, tác động định kỳ phải khai báo rõ.
- Khóa bản sao theo mã chuỗi, loại vấn đề và vùng đích; các nguyên nhân mới được thêm vào vấn đề hiện có để người chơi thấy vì sao nó kéo dài.
- Tại đầu kỳ, dùng trạng thái cung ứng đã tính để quyết định các hậu quả đến hạn. Hệ quả mới lập lịch sớm nhất kỳ sau; tránh lan vô hạn trong một lần cập nhật.
- Phục hồi nguồn không tự xóa mọi vấn đề con: hết mất điện khác với đã bù được đơn hàng trễ. Hệ thống kiểm tra điều kiện đóng riêng cho từng mục.
- Dự án chưa hoàn thành không cung cấp lợi ích hoàn chỉnh. Hủy hoặc đổi dự án có quy tắc hoàn tiền và phần công việc đã làm rõ ràng.
- Lợi ích lan cũng có giới hạn công suất: đường mở chỉ giúp lượng hàng thực sự đi được qua đường đó.
- Nhật ký ghi chuỗi gốc và quyết định để UI hiện được “Vì hồ xuống thấp → điện thiếu → xưởng chia ca”.

## 9. Giao diện sự kiện: ít đọc, nhiều quản lý

Mỗi dấu báo trên vùng cho biết biểu tượng vấn đề, nhãn ngắn và thời hạn nếu có. Chọn dấu báo làm nổi những tuyến và vùng chịu ảnh hưởng; đường lan nét đứt cho rủi ro chưa xảy ra, nét liền cho tác động hiện tại, kèm chữ mô tả.

Bảng mở chỉ hiện tiêu đề, một hoặc hai câu mô tả, các vùng liên quan, 2–3 phương án cùng chi phí/thời gian, nút quay lại bản đồ. Chi tiết lý luận không chặn thao tác.

Ví dụ văn bản:

> **Nông sản chất đầy kho!**
> Vụ này được mùa, nhưng kho chỉ giữ thêm một kỳ. Đẩy hết ra cảng lúc này có thể làm ùn hàng.
> Thuê kho tạm · Chuyển một phần đến khu dân cư · Đầu tư kho bảo quản

Kết quả dùng biến đổi trên bản đồ, tiến độ và một câu bản tin: “Kênh đã thông, ruộng có nước trở lại”. Ghi rõ vấn đề còn tồn tại để người chơi quyết định tiếp.

Âm thanh và chuyển động nhẹ báo hoàn tất, tàu đến hoặc sự kiện mới; có thể tắt. Hài hước dùng trong lời thoại sinh hoạt, tên bản tin và chi tiết đời sống, tránh lấy khó khăn của nhóm dân cư làm trò cười.

## 10. Chuyển nội dung cũ sang bản đồ

| Nội dung v1 | Xử lý ở v2 |
|---|---|
| Y1, R01 | Chuỗi lao động tại CN/CB; phụ thuộc hợp đồng và thay đổi ca, liên kết việc làm–nhà ở–vận tải |
| Y2, Y5, C03 | Các cơ hội đầu tư, công nghệ, đào tạo và phát triển chuỗi cung ứng; lợi ích theo dự án thực tế |
| Y3, C02, R03 | Vấn đề quy hoạch tại vùng có dự án tác động cư dân; quyền tham gia là một phần quy trình quyết định |
| Y4, C04, R04 | Chuỗi mua sắm và kiểm tra công trình tại nơi có dự án; theo dõi dịch vụ thay thế trong lúc xử lý |
| Y6, R05 | Dự án VC, nước và kết nối NN/CN; tham vấn tác động trước thay đổi phân bổ |
| Y7, R06, R07 | Sự kiện dịch vụ hành chính, thông tin và không gian sinh hoạt; giải quyết nhu cầu cụ thể và bình đẳng |
| Y8, C05, R08 | Nhà ở, chăm sóc và khả năng đi làm tại DC, liên kết các vùng sản xuất/dịch vụ |
| R02 | Sốc đơn hàng/linh kiện ở CB và CN, có tồn kho và nguồn thay thế |

Loại phương án “rõ ràng tệ” làm đối trọng cho đáp án tốt toàn diện. Các cách chơi hợp lệ cần khác nhau về ưu tiên và mức rủi ro; quyền cơ bản và quy trình công bằng là điều kiện của phương án, không phải món nâng cấp mua bằng điểm.

Trong chế độ quản lý, không bắt đủ tám chương theo thứ tự. Nếu cần chế độ trình chiếu đủ nội dung môn học, thiết kế riêng kịch bản có độ phủ, ghi rõ khác biệt với chế độ quản lý tự do.

## 11. Hợp đồng dữ liệu đề xuất

Đây là schema mới để thiết kế engine vùng, không phải JSON có thể nạp trực tiếp vào `src/data/randoms.js` hiện tại.

```yaml
id: RV01
origin: random
region: VC
family: water_supply
unique_while_open: true
cooldown_after_close: 3
eligibility: dry_period && reservoir_low && !active_water_crisis
weight: 3
notice: "Hồ xuống thấp"
initial_effects:
  - target: VC
    service: available_water
    operation: reduce_supply
propagation:
  - id: water_to_farms
    target: NN
    via: irrigation_network
    delay: 1
    if: unmet_irrigation_demand
    problem: H_WATER_SHORTAGE
    recovery: irrigation_demand_met
  - id: power_to_industry
    target: CN
    via: electricity_network
    delay: 1
    if: unmet_power_demand_after_reserves
    problem: H_POWER_SHORTAGE
    recovery: power_demand_met
choices:
  - id: irrigation_priority
    label: "Ưu tiên nước tưới"
    exact_cost: TBD
    completion_delay: 0
    effect: redistribute_water_with_lower_hydropower
    preview: "Giữ vụ mùa; có nguy cơ thiếu điện ở Thiên Hà"
wait:
  preview: "Kỳ tới kiểm tra thiếu tưới và thiếu điện theo nguồn dự phòng"
close_when: reservoir_recovered_or_supply_replaced
learning_tags: [regional_coordination, shared_resources]
```

Trước triển khai phải thay mọi TBD bằng giá trị đã cân bằng, khai báo giới hạn công suất, chi phí duy trì, hạn tác dụng và đường phục hồi. Engine nên validate điều kiện và biểu thức, không thực thi chuỗi mã tùy ý trong nội dung sự kiện.

State mới cần: `regions`, `links`, `activeProblems`, `projects`, `scheduledImpacts`, `cooldowns`, `eventHistory`, `rngState`, `period`. Mỗi vấn đề có `instanceId`, `rootId`, `causes`, `region`, `status`, `deadline`, `severity`, `appliedEffects`. Lưu cả tiến độ và lịch rút để tải lại không nhân đôi tác động.

## 12. Triển khai và nghiệm thu

Lát cắt đầu: ba vùng NN–CN–DC, nguồn điện/nước VC thể hiện như đầu mối phụ thuộc; chạy chuỗi RV01 và một cơ hội RV07 qua nhiều kỳ. Tiếp theo bổ sung CB để kiểm tra chuỗi được mùa–vận tải, rồi mở đầy đủ VC/TT. Bản đầu chưa có đủ bản đồ vẫn phải chỉ rõ phạm vi tương tác.

Các kiểm tra cần có khi lập trình:

- Cùng seed và cùng quyết định cho cùng diễn biến; mở bảng hoặc tải lại không rút lại.
- Hai nguồn cùng làm thiếu điện không tạo hai khoản phạt trùng cho một thiếu hụt.
- Có nguồn dự phòng đủ thì không tạo vấn đề thiếu cung.
- Hết hạn/chậm giải quyết chỉ diễn tiến một lần mỗi kỳ; sự kiện còn mở không bị rút bản sao.
- Nguồn phục hồi gỡ đúng hạn chế, nhưng không xóa thiệt hại lịch sử hay đóng sai vấn đề con.
- Sự kiện mới được chặn khi có nhiều hậu quả đến hạn; hậu quả đã hứa vẫn được thực hiện.
- Mỗi tình huống có ít nhất một đường ứng phó khả thi, kể cả ngân sách thấp; hỗ trợ tối thiểu có đánh đổi rõ, không đồng nghĩa phục hồi miễn phí toàn bộ.
- Mỗi seed có thể khác nhau nhưng không tạo thế thua bắt buộc ngay từ đầu, không lặp cùng loại sự kiện ở một vùng liên tục.

Playtest hỏi người chơi: “Vì sao vùng này gặp vấn đề?”, “Bạn đã ưu tiên nơi nào?”, “Phương án khác sẽ giúp hoặc làm khó vùng nào?”. Quan sát họ có quay lại bản đồ để so sánh, có nhận ra tiến bộ và muốn thử ván khác hay không. Đồng thời đo lượng đọc, số vấn đề đang mở, thời gian chờ và mức quá tải để chỉnh nhịp.

Kết thúc ván cho xem bản đồ trước–sau, các vùng đã cải thiện, nơi bị bỏ lại, ba chuỗi quyết định đáng nhớ và vấn đề đang tiếp tục. Bảng số liệu và kiến thức vẫn có thể mở, không chiếm phần kể lại thành quả quản lý của người chơi.
