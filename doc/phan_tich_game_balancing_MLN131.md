# PHÂN TÍCH GAME BALANCING – THE TRANSITION (MLN131)

**Game:** [The Transition – Thời kỳ quá độ](https://huyhao27.github.io/MLN131/)  
**Mục tiêu:** Đánh giá độ cân bằng lựa chọn, kinh tế, biến cố, khủng hoảng và sáu ending; đề xuất kiểm thử và điều chỉnh.

> **Giới hạn kiểm chứng:** Tài liệu tổng hợp phần phân tích mã nguồn và suy luận đã trình bày trong cuộc trao đổi. Chưa thực thi exhaustive search hay Monte Carlo trên toàn repository. Các tỷ lệ mục tiêu phía dưới là **đề xuất thiết kế**, không phải số liệu đo được. Các ví dụ giả định không được coi là một lượt chơi thực tế.

## 1. Tóm tắt phát hiện

1. **Ngưỡng kinh tế tạo các điểm gãy:** Sản xuất và nợ có tác động bậc thang tới thu nhập; chênh 1 điểm ở sát ngưỡng có thể đáng giá hơn nhiều điểm ở nơi khác.
2. **Fallback có thể tạo hiệu suất chi phí bất thường:** Giá thực tế có thể bị hạ thấp hơn nhiều so với 50% trong khi tác dụng tích cực vẫn gần 50%.
3. **Hiệu ứng trễ và năng lực thực thi có thể chưa đối xứng:** Hiệu quả tức thời bị giảm khi năng lực thấp, nhưng hiệu ứng trễ chưa luôn chịu cùng hệ số.
4. **Kết thúc dựa trên ngưỡng cứng:** Chênh 1 điểm có thể chuyển E1 thành E5; E5 bao phủ nhiều trạng thái quá khác nhau.
5. **Xử lý khủng hoảng cần kiểm thử trường hợp đồng thời:** Bộ đếm dùng chung có thể khiến hai loại khủng hoảng khác nhau bị coi là kéo dài liên tục.
6. **Mức ngẫu nhiên cần được kiểm soát khi dùng game trong lớp:** Phải phân biệt đóng góp của quyết định với ảnh hưởng do seed và bộ sự kiện hợp lệ.

## 2. Kinh tế và độ khó

### 2.1. Thông số được xác định từ phiên bản mã nguồn đã phân tích

| Tham số | Giá trị |
|---|---:|
| Thời gian | 8 năm |
| Ngân sách đầu kỳ | 0 |
| Thu nhập cơ bản | 8/năm |
| Giới hạn ngân sách âm | -10 |
| Hệ số chuyển thâm hụt thành nợ | ×2 |
| Năng lực thực thi ban đầu | 50 |
| Ngưỡng suy giảm năng lực | Dưới 35 |
| Hệ số tác động khi năng lực thấp | 0,6 |
| Hệ số hiệu quả tích cực fallback danh nghĩa | 0,5 |
| Số biến cố ngẫu nhiên tối đa | 3 |

Công thức thu nhập:

```text
income = max(5, 8 + floor((PROD - 50) / 15) - ceil(DEBT / 25))
```

**Hệ quả:**
- Nợ từ 0 lên 1 làm giảm ngay 1 đơn vị thu nhập, trong khi từ 1 đến 25 không tạo thêm một nấc giảm.
- PROD tăng từ 52 đến 64 chưa nâng thu nhập theo thành phần sản xuất; từ 64 lên 65 mới nhảy nấc.
- Vì thế, tối ưu hóa mốc chỉ số có thể quan trọng hơn cải thiện liên tục.

### 2.2. Ví dụ tác động của vay nợ

Nếu ngân sách cuối năm âm 8, mức nợ tăng `8 × 2 = 16`. Khi nợ chuyển từ 0 lên 16, thu nhập năm sau giảm 1 đơn vị (nếu các yếu tố còn lại giữ nguyên). Vì vậy, chi phí thực của một chính sách tài trợ bằng thâm hụt gồm chi phí năm hiện tại và áp lực lên khả năng chi tiêu trong tương lai.

### 2.3. Minh họa chính sách năm 1

Trạng thái đầu: `PROD=52, LIFE=48, TRUST=54, LAW=51, EQUITY=45, COHESION=57`; ngân sách sau thu nhập là 8.

| Chỉ tiêu | A | B thu hẹp (minh họa) | C |
|---|---:|---:|---:|
| Chi phí | 8 | 7 | 1 |
| PROD | -2 | -7 | +3 |
| LIFE | +5 | +4 | -7 |
| TRUST | +7 | +2 | -10 |
| LAW | +3 | 0 | -3 |
| COHESION | +6 | +1 | -7 |
| CAPACITY | +3 | 0 | -3 |

**Lưu ý quan trọng:** B thu hẹp trong bảng chỉ nhằm so sánh logic fallback. Trong trạng thái năm 1, phương án **B đầy đủ giá 13 vẫn có thể chọn**, vì ngân sách được phép xuống -10. Nếu chọn B đầy đủ: ngân sách = `8 - 13 = -5`, nợ tăng 10, PROD giảm từ 52 xuống 45, LIFE tăng từ 48 lên 57; theo công thức, thu nhập năm sau là `max(5, 8 + floor(-5/15) - ceil(10/25)) = 6`.

**Kết luận:** A có ưu thế mạnh khi hướng tới E1; B đẩy nhanh phúc lợi nhưng tạo sức ép lên sản xuất và nợ; C rẻ, tăng sản xuất nhưng gây tổn hại lớn các chỉ số xã hội. Cần so sánh thêm tác dụng trễ và biến cố, không chỉ cộng tổng delta tức thời.

## 3. Fallback và năng lực thực thi

### 3.1. Lỗ hổng tiềm năng của giá fallback

Công thức được phân tích:

```text
fallbackCost = min(ceil(0.5 * originalCost), budget + 10)
```

Nếu ngân sách còn -9, lựa chọn gốc có giá 20 thì fallback có thể chỉ tốn 1. Trong khi đó, tác dụng tích cực bị giảm khoảng 50% thay vì theo tỷ lệ `1/20`.

**Ví dụ giả định:** Chính sách giá 20 tăng TRUST +8; bản thu hẹp giá 1 tăng TRUST +4. Hiệu quả điểm/chi phí lần lượt là `0,4` và `4,0`, tức chênh 10 lần. Không phải mọi fallback đều mạnh vì phần tác dụng tiêu cực có thể giữ nguyên, nhưng công thức cho phép trường hợp bất thường.

**Đề xuất:** Gắn mức tác động với tỷ lệ ngân sách thực chi:

```text
fundingRatio = actualCost / originalCost
scaledPositiveEffect = originalPositiveEffect * fundingRatio
```

Có thể thêm hiệu ứng tối thiểu cho thí điểm nếu thiết kế nội dung giải thích rõ phạm vi, nhưng không nên tự động cho 50% lợi ích khi chỉ chi 5% ngân sách.

### 3.2. Tác dụng trễ

Nếu chính sách phức tạp bị giảm tác dụng ngay lúc CAPACITY <35, các tác dụng trễ nên cùng chịu một biến `implementationQuality` đã lưu lúc thực hiện, hoặc chịu hàm phụ thuộc cả chất lượng thực hiện ban đầu và năng lực vào thời điểm tác dụng phát sinh. Điều này tránh trạng thái triển khai yếu nhưng nhận toàn bộ lợi ích trễ.

## 4. Khủng hoảng và cứu vãn

| Loại | Điều kiện kích hoạt theo logic đã phân tích |
|---|---|
| Thể chế | LAW ≤15 và TRUST ≤15 |
| Sinh kế | LIFE ≤12 và PROD ≤15 |

### Các lỗi hoặc tình huống cần tái hiện

- **Bộ đếm chung:** Khủng hoảng thể chế năm trước và sinh kế năm sau có thể cộng thành 2 năm khủng hoảng liên tiếp dù không cùng loại.
- **Cứu vãn không toàn diện:** Kiểm tra khủng hoảng ban đầu có thể bỏ sót loại khủng hoảng khác còn tồn tại.
- **Ưu tiên phân loại:** Nếu cả hai loại cùng xảy ra, logic ưu tiên thể chế có thể che khuất sinh kế.
- **Năm cuối:** Cứu vãn ngay trước ending chưa chứng minh khả năng phục hồi lâu dài.

**Đề xuất cấu trúc trạng thái:**

```js
crisisStreak: {
  institutional: 0,
  livelihood: 0
}
```

Kiểm tra cả hai loại sau cứu vãn và phân biệt “đã thoát nguy cấp” với “phục hồi bền vững”.

## 5. Ending balancing

### 5.1. Sáu loại ending

| Ending | Logic khái quát | Điểm cần xem lại |
|---|---|---|
| E1 – Chuyển đổi có nền tảng | Sáu chỉ số ≥55, LAW ≥60, DEBT <60, chưa dùng cứu vãn | Cứng nhắc với người chơi đã cứu vãn thành công |
| E2 – Tăng trưởng lệch pha | PROD ≥65; LIFE <45 hoặc EQUITY <40 | Có thể đồng thời thỏa E3/E4 |
| E3 – Phúc lợi thiếu bền vững | LIFE ≥55; PROD <40 hoặc DEBT ≥75 | Đánh giá sức bền qua ngưỡng tĩnh |
| E4 – Ổn định hình thức | COHESION ≥55; LAW hoặc TRUST <35 | Cần thêm lịch sử chính sách để suy ra “im lặng” |
| E5 – Cải cách dang dở | Trường hợp còn lại | Phạm vi trạng thái quá rộng |
| E6 – Đứt gãy quản trị | Khủng hoảng kéo dài, cứu vãn thất bại | Cần kiểm thử đường đến E6 |

### 5.2. Trùng điều kiện

- E1 không đồng thời thỏa E2, E3 hoặc E4 vì các ngưỡng xung đột.
- E2, E3 và E4 **có thể đồng thời đúng**.
- Logic đang ưu tiên phân loại theo thứ tự `E6 → E2 → E3 → E4 → E1 → E5`, dẫn tới việc một vấn đề có thể che mất vấn đề nghiêm trọng khác.

**Ví dụ:** `PROD=75, LIFE=60, TRUST=25, LAW=30, EQUITY=30, COHESION=65, DEBT=85` đồng thời phù hợp E2, E3 và E4; tiêu đề ending chính phụ thuộc thứ tự xét.

**Đề xuất:** Tính mức độ nghiêm trọng từng nhóm mâu thuẫn, chọn ending chính theo điểm rủi ro, và hiện các ending phụ với giải thích rõ ràng. Điểm rủi ro phải được hiệu chuẩn, tránh thay một thứ tự cứng bằng các trọng số tùy ý.

### 5.3. E1 và E5 có ngưỡng quá gắt

Ví dụ `PROD=70, LIFE=60, TRUST=60, LAW=59, EQUITY=60, COHESION=65, DEBT=0`: thiếu đúng 1 điểm LAW so với E1 và rơi vào E5.

**Đề xuất:** Giữ ngưỡng học thuật nhưng bổ sung cấp độ “cận thành công”, thay vì thay đổi đột ngột toàn bộ thông điệp. Không nên tuyệt đối loại E1 chỉ vì đã dùng cứu vãn; có thể bổ sung chú thích hành trình phục hồi.

## 6. Ngẫu nhiên và công bằng

Các thông số đã phân tích: biến cố nền khoảng 42% mỗi năm đủ điều kiện; biến cố hệ quả khoảng 75%; bắt đầu từ năm 2; tối đa 3 biến cố.

Trong mô hình **đơn giản hóa** gồm 7 cơ hội độc lập, mỗi cơ hội có xác suất `p=0,42`:

```text
X ~ Binomial(n=7, p=0.42)
P(X >= 3) = 1 - sum[k=0..2] C(7,k)*0.42^k*0.58^(7-k)
```

Kết quả này **không** phải xác suất game thực tế có 3 biến cố, vì game còn phụ thuộc flags, pool sự kiện đủ điều kiện, ưu tiên biến cố hệ quả và giới hạn tổng số.

**Đề xuất:**
- Chế độ lớp học: cùng seed cho các nhóm để so sánh, đồng thời báo cáo rõ việc pool sự kiện có thể khác khi trạng thái khác.
- Chế độ trải nghiệm: seed khác nhau, nhưng báo cáo ending phân biệt hệ quả từ lựa chọn và biến cố ngoại sinh.
- Khi A/B test phiên bản game, dùng cùng danh sách seed và kiểm tra độ nhạy với random.

## 7. Phương pháp kiểm thử đầy đủ

### 7.1. Không gian lựa chọn

Chỉ riêng tám quyết định có ba lựa chọn đã tạo `3^8 = 6.561` chuỗi. Con số này **chưa bao gồm** nhánh điều kiện, hiệu ứng trễ, fallback, biến cố, cứu vãn và các quyết định bổ sung; vì vậy không thể coi 6.561 là toàn bộ không gian trạng thái.

### 7.2. Bốn lớp kiểm thử

1. **Unit/boundary tests:** Thử các ngưỡng `PROD 64/65`, `DEBT 0/1/25/26`, `LAW 59/60`, `CAPACITY 34/35`, giới hạn ngân sách âm và tình trạng khủng hoảng đồng thời.
2. **Exhaustive search khi tắt random:** Duyệt mọi nhánh hợp lệ, dùng memoization dựa trên toàn bộ trạng thái (chỉ số, budget, debt, capacity, flags, counters, pending effects, năm, khủng hoảng).
3. **Monte Carlo:** Chạy hàng chục nghìn ván mỗi chiến lược và mỗi cấu hình, báo cáo khoảng tin cậy thay vì một tỷ lệ đơn lẻ.
4. **Counterfactual testing:** Giữ kịch bản ngoại sinh ổn định nhất có thể, thay một lựa chọn để đo tác động thực; tránh giả định cùng seed luôn cho cùng biến cố hợp lệ.

### 7.3. Các chiến lược thử nghiệm

Growth, Welfare, Control, Reformer, Balanced, Crisis, Random, cộng thêm chiến lược tối ưu có xét tác dụng trễ và một chiến lược khai thác fallback. Các chiến lược heuristic đơn giản không đủ để chứng minh tối ưu toàn cục.

### 7.4. Chỉ số cần xuất trong báo cáo

| Nhóm | Chỉ số |
|---|---|
| Ending | Tỷ lệ E1–E6 theo chiến lược, seed, mức khó |
| Kinh tế | Ngân sách, nợ, thâm hụt, thu nhập theo năm |
| Lựa chọn | Tần suất chọn A/B/C/fallback, chính sách bị áp đảo |
| Trạng thái | Phân phối 6 chỉ số và CAPACITY từng năm |
| Công bằng | Độ biến thiên kết quả theo seed, tỷ lệ cùng quyết định khác ending |
| Phục hồi | Tần suất khủng hoảng, cứu vãn thành công/thất bại |
| Trải nghiệm học tập | Tỷ lệ người chơi hiểu vì sao thắng/thua qua báo cáo ending |

## 8. Gói cân chỉnh để A/B test

> Không đổi mọi tham số cùng lúc. Sửa logic trước, giữ một baseline cố định, sau đó mới thử từng nhóm biến.

| Hệ thống | Hiện tại | Cấu hình thử nghiệm |
|---|---|---|
| Ngân sách khởi điểm | 0 | 0, 4, 8 |
| Thu nhập cơ bản | 8 | 8, 9, 10 |
| Thâm hụt → nợ | ×2 | Giữ ×2 trước, thử ×1,5 riêng |
| Fallback | Hiệu quả tích cực ~50% | Theo tỷ lệ thực chi |
| CAPACITY thấp | <35 | Giữ ngưỡng; đồng bộ hiệu ứng trễ |
| Random nền | 42% | 30%, 35%, 42% |
| Random hệ quả | 75% | 60%, 70%, 75% |
| E1 | Không cứu vãn | Cân nhắc bỏ loại trừ tuyệt đối |
| E5 | Một kết thúc chung | 2–3 trạng thái phụ |
| Crisis streak | Một bộ đếm | Riêng từng loại |

**Mục tiêu tỷ lệ tham khảo (không phải kết quả chạy):**
- Chiến lược cân bằng có hiểu biết đạt E1: thử mục tiêu 40–60%.
- Chiến lược ngẫu nhiên đạt E1: thử mục tiêu 5–15%.
- Chiến lược cố ý gây khủng hoảng dẫn đến E6: thử mục tiêu 70–90%.

Các mức trên chỉ có ý nghĩa nếu phù hợp mục tiêu sư phạm và không làm giảm sự đa dạng của ending.

## 9. Thứ tự ưu tiên sửa

**P0 – Tính đúng:**
- Sửa bộ đếm khủng hoảng theo loại, kiểm tra mọi khủng hoảng sau cứu vãn.
- Sửa khả năng khai thác giá fallback và kiểm tra lại hiệu ứng trễ.
- Viết bộ test ở các điểm ngưỡng.

**P1 – Tính công bằng:**
- Chạy exhaustive search không random để tìm đường thắng/thua và phương án áp đảo.
- Chạy Monte Carlo có phân tầng theo chiến lược và seed.

**P2 – Khó nhưng giải thích được:**
- Chỉnh kinh tế, sự kiện, khả năng phục hồi sau khi đã có số đo.
- Giữ các đánh đổi rõ ràng và đưa dự báo chi phí dài hạn vào giao diện.

**P3 – Giá trị học tập:**
- Cá nhân hóa ending theo quyết định, mâu thuẫn còn tồn đọng và mức độ bền vững.
- Thêm lý do kết quả, không chỉ nêu điểm cuối.

## 10. Kết luận

Game có hệ thống khá phong phú cho học phần MLN131, nhưng balancing không thể chỉ được đánh giá bằng số điểm cộng/trừ hay tỷ lệ E1. Một thiết kế cân bằng cần bảo đảm: (1) mỗi lựa chọn có đánh đổi thực chất; (2) không có lỗ hổng kỹ thuật làm sai lệch hiệu quả; (3) kết quả phụ thuộc đáng kể vào chất lượng quyết định; (4) khủng hoảng và hồi phục nhất quán; (5) người chơi giải thích được **vì sao** mình nhận ending đó.

**Bước tiếp theo cần có để kết luận định lượng:** tải và chạy đúng phiên bản repository, tạo bộ exhaustive/Monte Carlo có thể tái lập, rồi xuất bảng tỷ lệ ending và các đường đi phản ví dụ. Không nên đưa ra con số về “tỷ lệ thắng thực tế” trước bước này.

## Tài liệu/mã nguồn tham chiếu

- [Trang chơi game](https://huyhao27.github.io/MLN131/)
- [Repository MLN131](https://github.com/huyhao27/MLN131)
- [Cấu hình – config.js](https://github.com/huyhao27/MLN131/blob/main/src/data/config.js)
- [Logic game – engine.js](https://github.com/huyhao27/MLN131/blob/main/src/sim/engine.js)
- [Ending – report.js](https://github.com/huyhao27/MLN131/blob/main/src/sim/report.js)
- [Script mô phỏng – simulate.mjs](https://github.com/huyhao27/MLN131/blob/main/scripts/simulate.mjs)
- [Cây tình huống](https://github.com/huyhao27/MLN131/blob/main/doc/02_Cay_tinh_huong_The_Transition_MLN131.md)
