# Report: Tech & kỹ thuật học từ Understory → áp dụng cho game của mình

> Nguồn: repo `huyhao27/under-story-reverse` (reverse-engineer game web **Understory**, Three.js r186 + Vite).
> Mục tiêu tài liệu: chắt lọc **những gì nên học và làm theo** để tự build một game 3D "thuần code, đồ hoạ đẹp, vibe được 100%".
> ⚠️ Chỉ học **kỹ thuật**. Không copy code/asset của Understory vào sản phẩm — tự viết lại theo ý tưởng.

---

## 1. Tóm tắt một đoạn

Understory **không có một file ảnh hay model 3D nào**. Mọi thứ (cây, lá, nhân vật, hiệu ứng, cả texture giấy) được **vẽ bằng Canvas2D lúc load**, gói vào **atlas**, dán lên các **quad phẳng ("card")** nghiêng đúng bằng góc camera, rồi một **shader "world look"** dùng chung (sương, fog, bóng mây) và một **post-process kiểu màu nước** biến cảnh 3D thành tranh vẽ tay. Gameplay là **2D trên mặt XZ, va chạm bằng SDF**, không physics engine. Nhạc cũng **sinh bằng code** (Web Audio).

→ Đây chính xác là mô hình "vibe 100%": toàn bộ là code, AI viết và sửa được hết.

---

## 2. Tech stack

| Thành phần | Understory dùng | Gợi ý cho mình |
|---|---|---|
| Render | Three.js (WebGL2) | Three.js (bản mới nhất) |
| Build | Vite, chia chunk, `import()` lazy | Vite (`npm create vite@latest`, template vanilla JS/TS) |
| Post-process | `EffectComposer` + UnrealBloom tự chỉnh + 1 pass "paint" tự viết | Giống vậy |
| Physics | **Không có** – SDF 2D tự viết | Tự viết SDF (đủ cho top-down) |
| Audio | Web Audio API thuần, nhạc procedural, SFX mp3 | Web Audio hoặc Howler.js cho SFX đơn giản |
| Asset | 0 file ảnh/model, chỉ SFX | Canvas2D procedural + (tuỳ) vài SFX miễn phí |
| Save | `localStorage` + version + sanitize | Giống vậy |

---

## 3. Kiến trúc (nên copy ý tưởng)

### 3.1 Object `game` trung tâm
```js
const game = { engine, scene, camera, renderer, rig, input, bus, level, U /*uniform chung*/,
               world: null, player: null, combat: null, presentation: null };
window.game = game; // debug từ console
```
Các module gắn dần vào `game` khi boot. Mỗi module được bọc `try/catch` → **module nào lỗi thì chỉ module đó mất, game vẫn chạy**.

### 3.2 Engine loop với thứ tự update
- `engine.add(system, order)`; mỗi system có `update(dt, time, realDt)`.
- Thứ tự gợi ý: `director 5 → player 10 → combat 20 → world 30 → particles 40 → camera 50 → UI/audio 60`.
- `dt = Math.min(0.05, frameTime)` (clamp, tránh nhảy khi lag).
- **Hitstop**: khi đánh trúng, `timeScale *= 0.04` trong ~0.06–0.09s → cảm giác "đập" rất mạnh.
- Camera/UI/audio dùng `realDt` (vẫn chạy khi hitstop/pause); gameplay dùng `dt` đã scale.

### 3.3 Event bus
`Map<string, Set<fn>>`, `on()` trả hàm unsubscribe. Gameplay chỉ `emit("player:attack", {...})`; audio, UI, VFX tự nghe. **Gameplay không bao giờ gọi thẳng audio.**

### 3.4 Input
- Action map (WASD/mũi tên, J = attack, Space = dodge…), hỗ trợ gamepad + touch.
- 3 set: `held`, `justPressed`, `justReleased`, xoá just-* cuối frame.
- **Input buffer**: `buffered("attack", 0.24)` — nhấn sớm vẫn ăn → điều khiển "mượt tay".

### 3.5 Scripting màn chơi bằng async/await ("kit")
```js
kit.zone("boss", ZONES.arena, null, async () => {
  await kit.cutscene(async () => { kit.shot("boss", 2); await kit.wait(1.5); });
  await combat.startBoss();
  await kit.event("boss:defeated");
  kit.checkpoint("after-boss");
});
```
API gợi ý: `wait, until, event, shot, narrate, hint, fade, cutscene, zone, line, checkpoint, flags`. Đây là cách viết cốt truyện/tutorial gọn nhất.

---

## 4. Đồ hoạ — phần đáng học nhất

### 4.1 Pipeline tổng
```
Canvas2D painters ─► atlas canvas ─► CanvasTexture
                                       ▼
Scene: ground plane (shader) + card InstancedMesh + ribbon + points
                                       ▼ (render target HDR, MSAA)
EffectComposer: RenderPass → Bloom → PaintPass → màn hình
```

### 4.2 Camera cố định góc
- Perspective **FOV 30** (tele, gần orthographic), **pitch 52°, không yaw, không roll**.
- Vị trí: `(x, sin(pitch)*d, z + cos(pitch)*d)`, follow bằng `lerp` mũ `1 - exp(-k*dt)`.
- "Shot" theo ngữ cảnh: `explore 96, combat 74, boss 118, close 38` (khoảng cách), blend easeInOutCubic.
- Shake kiểu **trauma²** (trauma giảm dần theo thời gian, offset = trauma² × noise).
- **Hệ quả quan trọng**: vì camera không xoay, mọi card chỉ cần xoay `-pitch` một lần → **billboard không cần update mỗi frame** và instance được hết.

### 4.3 Vẽ procedural bằng Canvas2D
- **RNG có seed** (Mulberry32) + hash chuỗi (FNV-1a) → cùng seed ra cùng hình, không cần lưu PNG.
- **Value noise + fBm** (fade quintic) cho jitter, vân, mây.
- **Palette nhỏ (~40 màu)** cho cả game → mọi thứ ăn tông. Bóng pha về màu "ink" (xanh-đen), không pha đen thuần.
- Hướng sáng cố định (trên-trái) cho mọi painter.
- Primitive cần tự viết:
  - `lobedBlob` — polygon toạ độ cực có thuỳ + noise (tán lá, bụi, đá).
  - `tracePath` — nối điểm bằng `quadraticCurveTo` qua trung điểm → đường cong mượt.
  - `brushStroke` — nét thuôn 2 đầu, dày mỏng theo noise (như bút lông).
  - `DabBatch` — gom hàng nghìn "vệt cọ" elip theo màu → 1 `fill()` mỗi màu (nhanh).
  - `edgeDabs` — rải vệt dọc mép blob → mép nham nhở tự nhiên.
- **Một cây** = thân (spine cong) → cành → blob nền tán → nhiều "cụm lá" sort theo y → gradient sáng/tối → wash + grain giấy.
- **Một cụm lá** = shadow blob → clip → dab tối → body lệch về phía sáng → highlight → viền sáng **chỉ phía đón nắng**.

### 4.4 Card + atlas + instancing
- `CanvasTexture` với `premultiplyAlpha`, mipmap, anisotropy 4.
- **Shelf packer**: sort theo chiều cao, xếp hàng vào canvas 2048/4096, padding 10–12px.
- **1 `InstancedMesh` cho cả rừng**, mỗi instance có attribute `aUvRect` chọn ô atlas (patch shader bằng `onBeforeCompile`/string replace).
- Cây dùng **alpha cutout + `alphaToCoverage`** + depthWrite → không cần sort, MSAA làm mịn mép.

### 4.5 Shader card (vertex + fragment)
- **Sway gió**: `wp.x += sin(time*speed + phase(worldPos)) * sway * uv.y²` (gốc đứng yên, ngọn lắc).
- **Mist theo độ cao** (chân cây chìm sương) + **fog bắt đầu từ mặt phẳng nhân vật** → nhân vật luôn nét, xa mờ (DOF giả).
- **Fade cây che nhân vật**: card đứng trước hero và gần hero trên màn hình → dither Bayer 4×4 discard.
- Ánh sáng toàn cục chỉ là **1 màu nhân** — không có light thật trong scene.

### 4.6 "World map" texture (SDF) dùng chung CPU + GPU
Một `DataTexture` RGBA phủ cả map (1 texel = 2m):
- **R** = SDF vùng đi được, **G** = khoảng cách tới suối, **B** = mức "blight", **A** = SDF lối mòn.
- GPU: shader mặt đất, cây, cỏ đều đọc → biết mình đang ở đường/suối/vùng hỏng.
- CPU: giữ mảng float để va chạm & rải cây.

### 4.7 Mặt đất
- **Một plane khổng lồ** + fragment shader: đọc map → màu theo biome → texture nét cọ 2 lớp → posterize 4 bậc (`ramp4`) cho cảm giác gouache.
- **Shadow map vẽ tay**: canvas cộng dồn (`lighter`) radial gradient dưới mỗi cây → R = bóng tán, G = AO gốc cây, B = vệt nắng. Không cần shadow map thật.
- Đốm nắng lay theo gió, bóng mây trôi (noise domain-warp).

### 4.8 Bake noise vào texture
Texture 128² RGBA, 4 kênh fBm độc lập, tile liền mạch → shader chỉ cần **1 lần `texture2D`** thay vì tính fBm nhiều octave.

### 4.9 Post-processing "màu nước" (tạo 50% chất lượng hình)
Thứ tự trong PaintPass:
1. **Line boil** — lệch UV nguyên pixel ~10 lần/s → viền "rung" như hoạt hình vẽ tay.
2. Chromatic aberration nhẹ ở mép.
3. **Pigment pooling** — tối phía tối của cạnh (mép màu nước đọng).
4. + Bloom (chỉ phần HDR > 1 mới bloom).
5. **Grade**: lift/gamma/gain, contrast S-curve, saturation **bảo vệ màu accent** (khăn đỏ không bị nhạt), split-tone.
6. **Texture giấy** cố định theo màn hình: grain + granulation + wash tần thấp.
7. Light leak ấm góc trên-trái, vignette, letterbox mép cọ.
8. **Dither ±1 LSB** chống banding.

Grade preset theo vùng (`forest, glade, boss…`), `setGrade(name, duration)` lerp mọi tham số.

### 4.10 Nhân vật & hiệu ứng
- **Hero**: skeleton 3D đơn giản (~30 tham số pose) → chiếu ra 2D → **vẽ lại Canvas2D mỗi frame** (272×240) → dán lên card. Cel shading bằng **offset fill** (fill base lệch ±vài px tạo dải sáng/tối) — không cần normal.
- **Khăn/đuôi**: Verlet 13 node, fixed step 1/120s, Catmull-Rom subdivide → triangle strip.
- **Boss**: vẽ 9 góc nhìn (−90°..+90°) vào atlas, mirror cho phía sau, crossfade bằng dither; chân dùng **IK 2 xương** (định lý cos).
- **Particle**: pool CPU + `Points` với atlas 2×2 (dot/smoke/streak/star), size theo world unit.
- **Không khí** (đom đóm, phấn hoa, lá rơi, mưa): **chuyển động hoàn toàn trong vertex shader** theo `uTime` — không tốn CPU.
- **Telegraph đòn boss**: quad nằm trên đất + SDF shader (zone/wave/lane/sector).
- **Lửa**: hoàn toàn procedural trong fragment shader (2 noise cuộn lên + hình giọt nước).
- **Chém**: mesh strip + shader `uReveal`/`uAge` dissolve theo noise, intensity > 1 để bloom.

---

## 5. Gameplay

### 5.1 Va chạm bằng SDF (không physics engine)
```
sdf(x,z) = max(path, clearings)          // hợp vùng đi được
         ∩ trừ suối, trừ hố
         ∪ walkable tạm (lily pad)
         ∩ trừ collider tròn (cây, đá, boss)
```
`resolve(x, z, r)`: lặp ≤ 4 lần, nếu `sdf - r < 0` → lấy gradient (sai phân trung tâm) và đẩy ra theo pháp tuyến. Player, enemy đều gọi đúng 1 hàm.
`lockTo(clearing)` = thay SDF bằng ellipse arena → tạo đấu trường kín.

### 5.2 Level data viết tay
```js
{ PATH: [[x, z, width], ...], CLEARINGS: {name:{x,z,rx,rz}}, STREAM, GAPS, ZONES, BOUNDS }
```
PATH còn dùng để đo **tiến độ** (0..1), tìm điểm respawn, đặt checkpoint.

### 5.3 Player state machine
`idle/run → dodge → attack (windup/active/recover) → hurt → dead`
- Dodge có **i-frames** 0.3s; attack combo 3 đòn, dodge-cancel trong windup/recover.
- Aim assist hình nón. Di chuyển: steer vận tốc bằng `lerp` mũ (accel/decel khác nhau).

### 5.4 Combat
- Hit test: **quạt vs tròn** (khoảng cách + góc).
- **Attack token**: tối đa 2 enemy tấn công cùng lúc → công bằng, dễ đọc.
- Enemy: `rise → stalk → windup (telegraph) → lunge → recover`, có poise/stagger.
- Boss: vòng `while(true)` async: chọn đòn có trọng số theo khoảng cách, tránh lặp → `await this[attack]()`. Flow huỷ được khi boss chết.
- Juice: **hitstop + shake + camera kick** mỗi lần trúng, mức light/heavy/kill khác nhau.

### 5.5 Save
`localStorage` key có version, schema rõ ràng, **sanitize** mọi field khi đọc, version khác → giữ settings, bỏ tiến trình. Autosave mỗi 20s + khi `pagehide`.

---

## 6. World generation

- **Seed cố định** → thế giới giống nhau mỗi lần (procedural để đỡ công vẽ, không phải roguelike). Mỗi lớp (cây, cỏ, hoa) **RNG riêng** → thêm lớp không làm xáo lớp khác.
- **Rải cây = lưới jitter** (ô 5.2m) + lọc theo SDF (cách đường ≥ 1.6m, cách suối…), chọn loài theo noise/vùng.
- **Fit test**: chiếu hình sprite xuống đất theo góc camera, kiểm tra không đè lối đi; không vừa thì thu nhỏ ×0.84 thử lại → **cây không bao giờ che đường**. Ý tưởng rất đáng học.
- **Cỏ/bụi = Poisson dart-throwing** + spatial hash, mật độ là hàm của SDF × noise.
- Tint cây theo độ sâu → "atmospheric perspective".

---

## 7. Audio

- **Bảng slot dữ liệu**: mỗi âm có `variants[], vol, pitch[lo,hi], volJitter, max voice, gap, spatial`.
- **Shuffle-bag** chọn variant (không lặp liền nhau), random pitch/vol → tiếng bước chân không bao giờ "máy móc".
- Spatial rẻ: suy giảm `near/(near+(d-near)*0.9)` + pan theo `dx`.
- **Audio router**: `bus.on("player:step") → chọn âm theo mặt đất (đá/gỗ/đất/ướt)`.
- **Fallback synth**: thiếu file thì tổng hợp bằng oscillator/noise → game không bao giờ câm.
- **Nhạc procedural**: sequencer 16-step lookahead 180ms theo `audioCtx.currentTime` ("A Tale of Two Clocks"); mood = `{tempo, scale, chords, layers}`; đổi mood = crossfade gain từng layer. Nhạc cụ = tổng hợp cộng tính (kalimba, harp, bell).
- **Bảo vệ NaN**: một sample NaN có thể làm cả audio graph câm vĩnh viễn → watchdog kiểm tra và dựng lại master bus.

---

## 8. Hiệu năng

1. **Instancing** mọi thứ lặp lại (rừng = 1–2 draw call).
2. **1 atlas** cho mọi loài cây.
3. **Cutout + alphaToCoverage** thay vì transparent sort.
4. **Uniform dùng chung theo reference** — set 1 lần/frame cho hàng trăm material.
5. **Bake noise/SDF/shadow vào texture**.
6. **Quality tier tự động**: pixel ratio 1.25–1.5 × scale (1/0.8/0.62), MSAA 4/2/0, tự hạ khi frame time cao, nhớ vào `localStorage`.
7. **Time-sliced painting**: painter viết dạng generator (`function*` + `yield`), chạy theo ngân sách ms mỗi frame.
8. **Không cấp phát trong vòng lặp nóng** (Float32Array dùng lại).
9. `dt` clamp 0.05, cap 60fps trên màn 120Hz.

---

## 9. Lộ trình áp dụng cho game của mình

Làm theo thứ tự, mỗi bước chơi được ngay:

| # | Mốc | Nội dung | Kết quả |
|---|---|---|---|
| 1 | **Khung** | Vite + Three.js, `Engine` (loop, dt clamp, system order), `Input` (action map + buffer), `bus`, `window.game` | Màn hình xanh, log input |
| 2 | **Camera + mặt đất** | Camera pitch 52° FOV 30 follow, ground plane + shader màu đơn giản | Có "sân khấu" |
| 3 | **Level + SDF** | Layout viết tay (PATH, CLEARINGS), `sdf()`, `resolve()`, player hình viên thuốc di chuyển được | Đi lại, va tường |
| 4 | **Canvas painter v1** | RNG seed, noise, palette, `lobedBlob`, `brushStroke`; vẽ 1 loại cây + 1 bụi → card | Cây đầu tiên |
| 5 | **Atlas + instancing** | Shelf packer, InstancedMesh + `aUvRect`, rải cây bằng jitter grid + lọc SDF | Có rừng |
| 6 | **World look** | Map texture SDF, ground shader đọc map (đường/cỏ), sway gió, fog/mist, shadow canvas | Bắt đầu "đẹp" |
| 7 | **Post-process** | EffectComposer: bloom + paint pass (grain giấy, vignette, grade, dither) | Look tranh vẽ |
| 8 | **Nhân vật** | Hero vẽ Canvas2D theo pose, state machine (run/dodge/attack), khăn Verlet | Có nhân vật sống |
| 9 | **Combat** | Enemy đơn giản, hit test quạt, token, hitstop + shake, particle | Có "juice" |
| 10 | **Kit + script** | `wait/event/zone/cutscene/checkpoint`, save `localStorage` | Có màn chơi |
| 11 | **Audio** | Bus → SFX (shuffle-bag), ambience; tuỳ chọn nhạc procedural | Có âm thanh |
| 12 | **Polish** | Quality tier, boss, thêm biome/grade preset | Hoàn thiện |

**Nguyên tắc khi vibe:**
- Mỗi bước giữ `window.game` để debug, đọc **state thật** thay vì nhìn screenshot.
- Tham số (tuning, palette, grade, shot) để thành **object dữ liệu** riêng → chỉnh nhanh, AI dễ sửa.
- Module bọc `try/catch` + log có tag (`[world]`, `[audio]`) → lỗi không làm sập cả game.

---

## 10. Tham khảo chi tiết

Các ghi chú gốc (dẫn `file:line` vào code đã unminify) trong repo `under-story-reverse`:
- `notes/01-method.md` — phương pháp reverse một web game
- `notes/02-rendering.md` — rendering/art chi tiết
- `notes/03-gameplay.md` — kiến trúc, loop, input, player, combat, scripting, save
- `notes/04-audio-worldgen.md` — audio & world generation
