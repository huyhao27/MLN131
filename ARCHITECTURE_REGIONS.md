# Chế độ vùng (v2) — kiến trúc & hợp đồng

Theo `doc/04_Dinh_huong_trai_nghiem_choi.md` và `doc/05_Cay_tinh_huong_v2_Quan_ly_vung.md`.
Đây là chế độ mặc định. Bản 8 năm cũ vẫn chạy ở `?mode=classic` (chế độ trình chiếu đủ chương, hợp đồng ở `ARCHITECTURE.md`). Hai chế độ dùng chung `core/`, `world/`, `ui/` nhưng sim và view khác nhau.

## Thư mục

| Thư mục | Ai làm |
|---|---|
| `src/regions/` | sim vùng (Integrator). Thuần JS, chạy được trong Node. Dữ liệu ở `src/regions/data/`. |
| `src/world/regions.js` (+ chỗ cần sửa trong `world/`) | phòng **Diorama**: ranh giới vùng, chọn vùng, tô trạng thái, tuyến liên kết, công trình |
| `src/ui/regions/` | phòng **UI**: màn bản đồ, nhãn vùng, bảng vùng, bảng sự kiện, tin tức, tổng kết |
| `src/main.js` | Integrator |

Chế độ classic phải tiếp tục chạy y như cũ.

## Vùng (RegionId)

`CN` Công nghiệp Thiên Hà · `NN` Đồng bằng nông nghiệp · `TT` Đô thị trung tâm · `DC` Khu dân cư · `VC` Vùng cao Bản Mây · `CB` Duyên hải và cảng. Thứ tự phím 1–6 theo đúng thứ tự này.

Gợi ý địa lý trên đảo hiện có (toạ độ thế giới: x đông, z nam): CN quanh khu nhà máy (80,−24) và đặc khu công nghệ (40,−50); NN đồng ruộng tây/tây nam (−55,10) và hợp tác xã phía bắc (−5,−55); TT quảng trường + bệnh viện + trường nghề (−6,8)…(−14,44); DC khu chung cư/nhà trẻ (36,28); VC thung lũng + hồ + đập (−84,−42); CB cảng (102,52). Vùng phủ kín đất liền, không chồng nhau.

## Hợp đồng Sim vùng (`src/regions/index.js`)

```js
const game = createRegionGame({ seed: 2026, bus, emit: true });
game.view();            // RegionView (object thuần, serializable)
game.act(action);       // trả RegionView mới; action không hợp lệ -> throw
game.undo(); game.sync(); game.state; game.canUndo;
```
Action: `{ type:'start' }` · `{ type:'choose', problem:<instanceId>, option:<optionId> }` · `{ type:'endPeriod' }` · `{ type:'restart' }`.
Chọn vùng / mở vấn đề **không** phải action (chỉ là trạng thái UI), nên mở bảng, đổi camera, tải lại không rút sự kiện mới.

Bus: `region:view {view}` sau mỗi act; `region:state {regions, links, period}` khi số đổi.

### RegionView
```js
{
  mode: 'regions',
  phase: 'briefing' | 'period' | 'end',
  period: 3, totalPeriods: 8,
  budget: 14, incomeNext: 9, upkeep: 2,          // upkeep: phí duy trì đang trả mỗi kỳ (đã trừ trong incomeNext)
  slots: { used: 1, max: 2 },                    // dự án dài hạn đang thi công
  regions: [{
    id: 'NN', name: 'Đồng bằng nông nghiệp', short: 'Đồng bằng',
    status: 'stable' | 'opportunity' | 'attention' | 'urgent',
    statusLabel: 'Cần quan tâm',
    line: 'Ruộng thiếu nước, vụ mùa có nguy cơ',   // 1 câu tình trạng thực
    indicators: { output: 58, wellbeing: 52, access: 61 },  // 0..100: Sản xuất / Đời sống / Tiếp cận dịch vụ
    trend: { output: -4, wellbeing: 0, access: 2 },          // so với đầu kỳ trước
    services: [{ id:'water', label:'Nước tưới', need: 35, have: 22, status:'short' | 'tight' | 'ok' }],
    problems: ['p7'],                              // instanceId đang mở ở vùng
    projects: ['j2'],                              // công trình đang thi công ở vùng
    built: ['canal'],                              // khoá công trình đã hoàn tất (world vẽ)
  }],
  problems: [{
    instanceId: 'p7', rootId: 'RV01', code: 'RV01',
    origin: 'random' | 'consequence' | 'opportunity',
    region: 'NN', title: 'Hồ xuống thấp', text: '1–2 câu',
    severity: 1 | 2 | 3, status: 'open' | 'working' | 'escalated',
    deadline: 4 | null, deadlineText: 'Còn 1 kỳ' | 'Hết hạn kỳ này' | null,
    affects: ['NN','CN'],
    links: [{ from:'VC', to:'CN', service:'power', kind:'risk' | 'active' | 'benefit', label:'Điện thủy điện' }],
    causes: ['Hồ xuống thấp', 'Điện thiếu'],       // chuỗi nguyên nhân (với consequence)
    options: [{ id:'A', label:'Ưu tiên nước tưới', cost: 3, upkeep: 0, upkeepFor: 0, delay: 0, delayText:'Ngay',
                project: false, preview:'Giữ vụ mùa; Thiên Hà có thể thiếu điện một kỳ',
                disabled: false, reason: null }],
    wait: { preview: 'Kỳ tới: ruộng thiếu nước nếu không có nguồn thay' },
    chosen: null | { option:'A', label, period, completesAt },   // đã chọn, đang chờ hiệu lực (status 'working')
    learn: { topic:'Phối hợp vùng và nguồn lực chung', chapter: 3, note:'1–2 câu' },  // phần mở rộng, không chặn
  }],
  projects: [{ id:'j2', key:'canal', label:'Sửa kênh dẫn', region:'NN', startedAt:3, doneAt:4, doneText:'Hoàn tất kỳ tới', done:false }],
  links: [{ id, from, to, service, label, capacity, load, status:'ok' | 'tight' | 'down' }],   // toàn mạng; chỉ vẽ khi liên quan
  news: [{ period: 3, text: 'Kênh đã thông, ruộng có nước trở lại', tone:'good' | 'bad' | 'neutral', chain:['Hồ xuống thấp','Điện thiếu','Xưởng chia ca'], region:'NN' }],  // mới nhất trước
  national: { output, wellbeing, access, gap, overall },  // gap: chênh lệch đời sống vùng cao nhất − thấp nhất
  // phase 'briefing': title, paragraphs[]
  // phase 'end': summary (dưới)
}
```

### `view.summary` (phase `end`)
`{ headline, text, before:{RegionId:{output,wellbeing,access}}, after:{…}, improved:[{region,text}], leftBehind:[{region,text}], chains:[{title, steps:[text], period}], openProblems:[{region,title}], topics:[{chapter, topic, seen, via:[text]}], timeline:[{period, national:{output,wellbeing,access,gap}}], decisions:[{period, region, title, option}] }`

## Hợp đồng Diorama cho vùng (bổ sung, không phá API cũ)

```js
world.setMode('regions' | 'classic');
world.setRegions(view.regions);          // tô viền/nền nhẹ theo status; hình ảnh theo indicators/services/built/projects
world.hoverRegion(id | null);            // làm nổi ranh giới
world.selectRegion(id | null);           // camera tiến lại vùng (null = toàn cảnh)
world.showLinks([{from,to,service,kind,label}]);   // vòng cung giữa vùng: 'risk' nét đứt, 'active' nét liền, 'benefit' xanh; [] = ẩn
world.pickRegion(clientX, clientY);      // -> RegionId | null
world.regionAnchors();                   // -> { CN: { x, y, visible }, ... } toạ độ CSS px của tâm nhãn vùng
world.onFrame(fn);                       // fn(anchors) mỗi frame sau render; trả hàm huỷ
```
Bus từ world: `world:hover {region|null}` khi rê chuột trên canvas, `world:pick {region}` khi bấm (không phải kéo). World không vẽ chữ.

## Hợp đồng UI vùng (`src/ui/regions/index.js`)

```js
const ui = createRegionUI(rootEl, { onAction(action), onSelect(regionId|null), onHover(regionId|null), onFocusProblem(problem|null), onUndo });
ui.render(view);              // vẽ lại theo RegionView
ui.setAnchors(anchors);       // vị trí nhãn vùng (từ world.onFrame)
ui.select(regionId|null);     // world báo world:pick
ui.hover(regionId|null);
```
`onFocusProblem(problem)` báo vấn đề đang mở để integrator gọi `world.showLinks(problem.links)`.

Màn chính: bản đồ + nhãn vùng (tên, biểu tượng trạng thái + chữ, dấu báo vấn đề với nhãn ngắn và thời hạn) + thanh trên (kỳ, ngân sách, thu dự kiến, phí duy trì, dự án x/2, nút "Sang kỳ tiếp theo") + tin tức kỳ. Chọn vùng mở **một** bảng vùng bên phải (≤ 40% bề ngang): câu tình trạng, chỉ số vùng, dịch vụ thiếu/đủ, danh sách vấn đề → mở vấn đề hiện 2–3 phương án với chi phí, thời gian, xem trước; dòng "Chờ" báo trước hậu quả; nút về bản đồ. Phần lý luận (`learn`) thu gọn, không chặn.

Phím: `1–6` chọn vùng (CN NN TT DC VC CB), `Esc` về bản đồ / đóng, `Tab` vùng kế, `A/B/C` chọn phương án của vấn đề đang mở, `N` sang kỳ, `F` toàn màn hình, `Ctrl+Z` undo khi `?test=1`.
