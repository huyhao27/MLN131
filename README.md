# The Transition — Thời kỳ quá độ (MLN131)

Game mô phỏng điều hành 8 năm cho môn MLN131 — Chủ nghĩa xã hội khoa học. Cả lớp là Hội đồng điều hành Cộng hòa Hòa Minh (hư cấu); người dẫn bấm phím theo biểu quyết của lớp.

**Chơi online:** https://huyhao27.github.io/MLN131/

## Điều khiển (người dẫn)
| Phím | Tác dụng |
|---|---|
| `1` `2` `3` (`4`) | Chọn phương án |
| `Enter` / `Space` | Tiếp tục |
| `P` | Presenter mode (ẩn/hiện chú thích) |
| `S` | Bật/tắt hoạt ảnh |
| `F` | Toàn màn hình |
| `R` | Bật/tắt biến cố ngẫu nhiên |
| `Ctrl+Z` | Hoàn tác (chỉ khi mở với `?test=1`) |

Tham số URL: `?seed=2026` (cùng seed → cùng biến cố, để 2 lớp so sánh), `?random=0` (tắt biến cố ngẫu nhiên), `?test=1`.

## Chạy local
```bash
npm install
npm run dev      # http://localhost:5173
npm run sim      # chạy thử hàng nghìn ván, kiểm tra cân bằng
npm run build    # xuất dist/ (static, deploy ở đâu cũng được)
```
Trang thử riêng: `/world-demo.html` (diorama 3D), `/ui-demo.html` (giao diện).

## Tài liệu
- `doc/` — GDD và cây tình huống
- `ARCHITECTURE.md` — kiến trúc, hợp đồng giữa sim / world / ui
- `src/sim/README.md` — định dạng dữ liệu nội dung, cách sửa tình huống
- `src/data/config.js` — các con số cân bằng
- `report.md` — kỹ thuật đồ hoạ tham khảo

Quốc gia, nhân vật, số liệu là hư cấu phục vụ mô phỏng, không phải mô tả hay đánh giá thực tế.
