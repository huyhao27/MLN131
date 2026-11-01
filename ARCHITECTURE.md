# The Transition — kiến trúc & hợp đồng giữa các module

Game: mô phỏng điều hành 8 năm theo `doc/01_GDD_The_Transition_MLN131.md` và `doc/02_Cay_tinh_huong_The_Transition_MLN131.md`.
Stack: Vite + JS thuần (ES modules) + Three.js. Không framework UI. Chạy offline, 1 người dẫn (presenter) bấm phím 1/2/3.

## Thư mục và chủ sở hữu

| Thư mục | Ai làm | Phụ thuộc |
|---|---|---|
| `src/core/` | dùng chung (bus, rng, math) — **không sửa** trừ khi thêm hàm mới | — |
| `src/sim/` | phòng **Engine** | `core/` thôi. **Không DOM, không three.** Chạy được trong Node. |
| `src/data/` | phòng **Engine** (nội dung JSON/JS từ file 02) | — |
| `src/world/` | phòng **Diorama** | `three`, `core/` |
| `src/ui/` | phòng **UI** | `core/`, chỉ đọc view từ sim qua hợp đồng dưới |
| `src/main.js`, `index.html` | **Integrator** (session chính) | tất cả |
| `scripts/` | Engine (simulate), ai cũng có thể thêm script riêng | |

Mỗi phòng chỉ sửa trong thư mục của mình. Cần đổi hợp đồng → ghi vào mục "Đề xuất thay đổi" cuối file này trong branch của mình, integrator sẽ quyết.

## Hợp đồng Sim (src/sim/index.js)

```js
import { createGame } from './sim/index.js';
const game = createGame({ seed: 2026, randomEvents: true }); // randomEvents=false: giảng viên tắt mini-event
game.view();        // -> View của phase hiện tại (object thuần, serializable)
game.act(optionId); // chọn phương án/tiếp tục; trả về View mới. optionId không hợp lệ -> throw
game.state;         // snapshot state theo GDD §5.1 (chỉ đọc)
game.undo();        // quay lại View trước (chỉ dùng chế độ thử nghiệm)
```

Sim tự emit trên `bus` (src/core/bus.js) sau mỗi act:
- `sim:view` `{ view }` — mỗi khi phase đổi
- `sim:state` `{ metrics, resources, flags, year }` — mỗi khi số thay đổi

### View — mọi view có
```js
{ phase, year, metrics:{PROD,LIFE,TRUST,LAW,EQUITY,COHESION}, resources:{BUDGET,CAPACITY,DEBT},
  flags:[...], warning: string|null, site: SiteId, options:[Option] }
```
`Option = { id, key: '1'|'2'|'3'|..., label, explanation?, cost?, disabled?:bool, disabledReason?:string }`
— **không bao giờ chứa delta trước khi chọn** (GDD §4.2).

### Các phase (theo thứ tự trong 1 năm)
| phase | thêm field | options |
|---|---|---|
| `briefing` | `title, paragraphs[]` (giới thiệu Hòa Minh, luật) | `[{id:'start',key:'1',label:'Bắt đầu'}]` |
| `yearStart` | `budgetGain, applied:[{source, text, deltas}]` (hệ quả trễ vừa áp dụng) | `continue` |
| `consequence` | node `Cxx`: `code, headline, text, facts[]` | 2 lựa chọn (hoặc `continue` nếu C03 chỉ thông báo) |
| `event` | node `Yx`: `code, chapter, headline, context, facts[], conflict, uncertainty, stakeholders[]` | 3 lựa chọn A/B/C (+ fallback "thí điểm" nếu không đủ ngân sách) |
| `result` | `choiceLabel, deltas:{metric:±n}, resourceDeltas, flagsSet[], scheduled:[{year,text}], winners[], losers[], academic:{chapter, topic, lesson, debrief}` | `continue` |
| `random` | node `Rxx`: `code, headline, text` | 2 phản ứng |
| `randomResult` | giống `result` (gọn hơn) | `continue` |
| `finalRepair` | `text` | 2 lựa chọn cứu vãn |
| `end` | `ending:{id:'E1'..'E6', title, text, question, secondary[]}`, `history:[{year,code,choiceId,label,metricsAfter}]`, `turningPoints[]`, `delayed[]`, `stakeholders[]` | `restart` |

`stakeholders[]`/`winners[]`/`losers[]` dùng id: `worker, farmer, platform, intellectual, business, minority, faith, family` (bảng GDD §2.2).

### SiteId (để Diorama biết lia camera tới đâu)
`overview` (briefing/end), `industrial` (Y1), `economy` (Y2 – đặc khu + HTX), `ringroad` (Y3), `hospital` (Y4), `coalition` (Y5 – trường nghề/chợ/khu nền tảng), `valley` (Y6 – thủy điện Bản Mây), `temple` (Y7), `housing` (Y8). Random/consequence dùng site gần nhất hợp lý (R01 cảng → `port`, R05 → `valley`, nếu không có thì `overview`). Thêm `port`.

## Hợp đồng Diorama (src/world/index.js)

```js
import { createDiorama } from './world/index.js';
const world = createDiorama(canvas);   // tự chạy render loop
world.focus(siteId, { instant?:bool }); // camera lia tới địa điểm
world.setState({ metrics, flags, year }); // thế giới đổi theo chỉ số (khói nhà máy, ruộng, đèn...)
world.pulse(kind);  // hiệu ứng ngắn: 'good' | 'bad' | 'neutral'
world.setQuality('low'|'high');
```
Diorama tự lắng nghe `sim:view`/`sim:state` nếu được gọi `world.bindBus(bus)`. Không vẽ UI chữ.

## Hợp đồng UI (src/ui/index.js)

```js
import { createUI } from './ui/index.js';
const ui = createUI(rootEl, { onAct: (optionId) => {}, onUndo, onToggleRandom });
ui.render(view);   // vẽ lại overlay theo view
```
Phím: `1/2/3/4` chọn, `Enter/Space` tiếp tục, `P` presenter mode (ẩn/hiện chú thích), `S` bỏ qua hoạt ảnh, `Ctrl+Z` undo (chỉ khi bật chế độ thử nghiệm qua `?test=1`), `F` fullscreen.
Màn hình chiếu: chữ lớn (≥ 20px thân), tương phản cao, bố cục 16:9, overlay bán trong suốt bên phải/dưới để diorama vẫn thấy.
Không dùng quốc kỳ, biểu tượng, lãnh đạo thật. Icon nhóm xã hội: SVG đơn giản trung tính.

## Quy ước chung
- Tiếng Việt cho mọi chữ hiển thị; code/comment tiếng Anh.
- Commit nhỏ, message tiếng Anh, **không thêm dòng Co-Authored-By**.
- Không thêm thư viện ngoài `three`, `vite` (chart vẽ bằng SVG/Canvas tay).

## Đề xuất thay đổi

### Từ Integrator (đã áp dụng trong `sim-engine`)
1. View `end` có thêm `initialMetrics` (giá trị năm 0).
2. Hình dạng:
   - `turningPoints[]`: `{year, code, label, text}` (kèm `choiceId`, `impact`)
   - `delayed[]`: `{fromYear, year, text}` (kèm `source`, `deltas`)
   - `stakeholders[]` (end): `{id, tone:'gain'|'loss'|'mixed', text}` (kèm `gains`, `losses`)
   - `ending.secondary[]`: `{id, title}` (`id` là `E1..E4` hoặc ghi chú `REPAIR`/`LABOR_UNRESOLVED`/`DEBT`)
3. View `result` và `randomResult` có `code` = id lựa chọn (vd `'Y1-B'`); id node nằm ở `nodeCode`. `finalRepair` có `headline` và `text`.
4. Cờ bị xóa bởi lựa chọn xuất hiện trong `flagsSet` dạng `{id, removed:true}`; cờ mới đặt vẫn là chuỗi id.
5. Mọi view có `randomEvents: boolean`. Thêm `game.setRandomEvents(bool)` và `game.toggleRandomEvents()` (trả về giá trị mới).
6. `chapter` (view `event`, `academic.chapter`) là số; nhãn chữ ở `chapterTitle`. `scheduled[].text` là câu tiếng Việt đọc được (`"Năm 5: ..."`).
7. `history[]` (end) gồm cả mục Y, C và R: `{year, code, choiceId, label, metricsAfter}` (C chỉ thông báo có `choiceId: null`).

### Từ Engine (bổ sung, không phá hợp đồng)
- Mọi view có `totalYears`. `event` có `chapterTitle`, `variantNotes[]`, `applied[]` (hệ quả vừa áp dụng ngay trước lựa chọn: hiệu ứng `onPresent` hoặc kết quả lựa chọn C). `consequence` có `applied[]` cho nút C chỉ thông báo (C03, C04). `yearStart` có `nextChapter`, `nextChapterTitle`.
- `result` có thêm `outcome` (đoạn tường thuật), `notes[]`, `capacityCut` (bị giảm 40% do CAPACITY<35), `fallback`.
- Option dự phòng khi không đủ ngân sách: id `'<id gốc>-P'` (vd `'Y8-A-P'`), có `fallbackFor`.
- `end` có thêm `ending.progress[]`, `ending.challenges[]`, `ending.whatIf`, `timeline[]` (chỉ số cuối mỗi năm, năm 0 = khởi điểm).
- `createGame({ seed, randomEvents, bus, emit })`: `emit:false` cho chạy headless. `game.sync()` phát lại `sim:view`/`sim:state` (dùng sau khi đăng ký listener). `game.canUndo`.
- Số khởi điểm đã chỉnh qua playtest (`src/data/config.js`): `BUDGET=0`, thu cơ sở `8`/năm (GDD: 60 và 12 làm ngân sách không bao giờ ràng buộc).

### Từ Diorama (bổ sung, không phá hợp đồng)
- `world.resetView()`: đưa camera về khung hình của địa điểm hiện tại. Người xem có thể kéo (chuột trái / chạm) để lia, lăn chuột / chụm hai ngón để thu phóng, kéo chuột phải để xoay nhẹ, nhấp đúp để về khung hình. `focus()` sang địa điểm mới sẽ lấy lại camera; `focus()` cùng địa điểm giữ nguyên góc nhìn người xem chọn. Diorama không nghe phím nào.
- `world.validateLayout(state?)` trả `{ overlaps, counts }` (bố cục chồng lấn: vật trên đường, trong nước, chồng nhau; xe ngoài làn; người đi qua nhà). `'all'` = mọi vật có thể xuất hiện. Kiểm bằng `node scripts/validate-world.mjs`; bản đồ debug ở `world-map.html`, lớp phủ debug trong `world-demo.html` (phím D).
