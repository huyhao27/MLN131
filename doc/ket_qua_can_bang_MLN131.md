# KẾT QUẢ CÂN BẰNG LẠI – THE TRANSITION (MLN131)

**Dựa trên:** `phan_tich_game_balancing_MLN131.md`
**Cách đo:** `npm run sim` (Monte Carlo 300 ván/chiến lược, random 900 ván) và `npm run exhaustive` (duyệt mọi đường quyết định khi tắt biến cố ngẫu nhiên). Mọi con số dưới đây đo được từ đúng phiên bản mã trong repo; chạy lại được bằng các lệnh trên.

## 1. Sửa logic (P0)

| Vấn đề trong phân tích | Đã sửa |
|---|---|
| Bộ đếm khủng hoảng dùng chung | `crisisStreak` riêng cho **thể chế** và **sinh kế**. Thể chế năm trước + sinh kế năm sau không còn tính là “kéo dài 2 năm”. |
| Cứu vãn chỉ kiểm tra một loại | Cứu vãn chỉ thành công khi **mọi** loại khủng hoảng đã ra khỏi vùng nguy hiểm (biên 3 điểm). |
| Fallback chi 1 nhận 50% lợi ích | Tác động tích cực = `min(0,5; chi thực / chi gốc)`. Chi 1/20 → nhận khoảng 1/20. Tác động tiêu cực giữ nguyên. |
| Hiệu ứng trễ không chịu năng lực thực thi | Lưu `chất lượng triển khai` (tỷ lệ fallback × 0,6 nếu CAPACITY < 35) và áp cho cả lợi ích trễ. |
| Điểm gãy thu nhập (nợ 0→1 mất ngay 1 đơn vị) | Thu nhập dùng làm tròn: `max(5, 8 + round((PROD−50)/15) − round(DEBT/15))`. |
| Ending ưu tiên cứng E2 → E3 → E4 | Chọn ending chính theo **mức nghiêm trọng** (độ sâu vượt ngưỡng, đơn vị điểm chỉ số); hòa thì theo thứ tự GDD; các ending khác vẫn hiện ở “chú giải phụ”. |
| E1 loại tuyệt đối khi đã cứu vãn | Cứu vãn sớm và phục hồi được → vẫn có thể đạt E1 (kèm chú giải hành trình phục hồi). Cứu vãn ở **năm cuối** → không đạt E1 (“mới thoát nguy cấp, chưa chứng minh phục hồi bền vững”). |
| E5 quá rộng, thiếu 1 điểm LAW rơi khỏi E1 | E5 chia 3 trạng thái: **cận thành công** (thiếu ≤ 6 điểm so với E1), **phát triển không đồng đều** (có chỉ số < 40), **giậm chân**. |

## 2. Thông số sau khi chỉnh

| Tham số | Trước | Sau | Lý do |
|---|---:|---:|---|
| Ngân sách khởi điểm | 0 | 0 | Thử 0/4/8: 4–8 làm chiến lược cân bằng đạt E1 90–100% (quá dễ). |
| Thu nhập cơ bản | 8 | 8 | Thử 8/9/10: 9–10 cũng làm E1 gần như chắc chắn. |
| Bậc nợ trong công thức thu nhập | 25 (ceil) | 15 (round) | Bậc 25 làm “luôn chọn A” vượt người chơi biết tính ngân sách (77% vs 53%). |
| Xác suất biến cố nền | 42% | 35% | Giảm nhiễu do seed khi dùng trên lớp. |
| Xác suất biến cố hệ quả | 75% | 70% | Như trên, vẫn giữ ưu tiên biến cố minh họa hậu quả quyết định. |

## 3. Kết quả đo

### Monte Carlo (có biến cố ngẫu nhiên)

| Chiến lược | E1 | E2 | E3 | E4 | E5 | E6 | Mục tiêu trong phân tích |
|---|---:|---:|---:|---:|---:|---:|---|
| Tăng trưởng | 0% | 100% | 0% | 0% | 0% | 0% | khác biệt rõ |
| Phúc lợi | 0% | 0% | 100% | 0% | 0% | 0% | khác biệt rõ |
| Kiểm soát | 0% | 0% | 0% | 100% | 0% | 0% | khác biệt rõ |
| Luôn chọn A | 41% | 0% | 5% | 0% | 54% | 0% | không vượt người biết tính |
| **Cân bằng (biết tính ngân sách)** | **44%** | 0% | 1% | 0% | 55% | 0% | **40–60% ✓** |
| **Cố ý khủng hoảng, từ chối cứu vãn** | 0% | 0% | 0% | 0% | 0% | **100%** | E6 |
| Cố ý khủng hoảng rồi cứu vãn đầy đủ và điều hành lại | 0% | 26% | 0% | 1% | 6% | 66% | phục hồi phải khả dĩ ✓ |
| Ngẫu nhiên | 1% | 20% | 17% | 6% | 54% | 2% | 5–15% ✗ (xem mục 4) |

### Exhaustive search (tắt biến cố, ~19.900 đường đi)

E1 0,7% · E2 15,7% · E3 18,3% · E4 4,9% · E5 cận thành công 1,0% · E5 không đồng đều 47,0% · E5 giậm chân 9,8% · E6 2,6%.
Không lựa chọn năm 1 nào khóa hẳn E1 (Y1-A 2%, Y1-C vẫn còn đường tới E1) — đúng nguyên tắc “đường sửa sai”.

## 4. Những điểm cố ý giữ / chưa đạt

- **E1 khi chọn ngẫu nhiên ~1–2%** thấp hơn mục tiêu 5–15%. Lưới tham số cho thấy tỷ lệ này hầu như **không đổi** khi tăng ngân sách hay thu nhập: E1 đòi hỏi nhiều quyết định nhất quán (dân chủ thực chất, pháp quyền, liên minh), nên chọn bừa hiếm khi đạt. Nâng lên 5–15% sẽ phải làm các phương án B/C “tốt” hơn, đi ngược trụ cột “trade-off có căn cứ”. Thay vào đó, các ván suýt đạt nay được ghi nhận là **E5 – cận thành công**.
- Chiến lược “cố ý khủng hoảng” vẫn ra E6 100% vì nó **từ chối** nút cứu vãn; khi chấp nhận cứu vãn và điều hành lại, 34% ván thoát được E6.
- Các con số là giả định thiết kế, không phải đo lường chính trị thực tế (GDD §3.3).

## 5. Kiểm thử tự động

- `npm run test:sim` — test ngưỡng: PROD 64/65, DEBT 0/1, CAPACITY 34/35 (cả hiệu ứng trễ), fallback chi 1/20, khủng hoảng đồng thời và xen kẽ, LAW 59/60, DEBT 60, cứu vãn sớm/muộn, ending trùng điều kiện, các trạng thái E5.
- `npm run sim` — test ngưỡng + Monte Carlo + các khẳng định mục tiêu (cân bằng 35–65% E1; luôn-A không vượt cân bằng quá 5 điểm; phục hồi sau cứu vãn khả dĩ; mọi ending và mọi biến cố đều xuất hiện). CI chạy lệnh này trước mỗi lần deploy.
- `npm run exhaustive` — duyệt toàn bộ cây quyết định khi tắt random.
