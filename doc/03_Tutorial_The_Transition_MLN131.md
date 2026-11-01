# Tutorial — The Transition: Thời kỳ quá độ

Bản thiết kế nội dung tutorial, đối chiếu ba tài liệu người dùng cung cấp và mã nguồn hiện tại. Đã tích hợp luồng hướng dẫn năm 1, lựa chọn bỏ qua, hộp Cách chơi và lời nhắc theo tình huống trong `src/ui/tutorial.js`. Bản triển khai dùng hộp thoại từng bước và vùng được làm nổi bật; thao tác mở giải thích chỉ số được giới thiệu bằng nội dung hướng dẫn thay vì bắt buộc thực hiện.

## 1. Người chơi cần hiểu gì?

Sau tutorial, người chơi phải trả lời được: Tôi điều hành ai? Tôi hướng tới kết quả nào? Mỗi năm tôi cần làm gì? Tôi dựa vào đâu để chọn? Tôi xem hậu quả ở đâu?

**Thông điệp xuyên suốt:** “Điều hành Hòa Minh qua 8 năm: đọc tình hình, chọn chính sách trong khả năng ngân sách, theo dõi hệ quả và điều chỉnh ở năm sau.”

Đề xuất hướng dẫn ngay trong năm 1, khoảng 90–120 giây. Mỗi bước chỉ giới thiệu một việc cần làm. Sau năm 1, chỉ nhắc khi người chơi lần đầu gặp cơ chế mới. Không mở đầu bằng một trang dài giải thích mọi luật.

## 2. Phần giới thiệu trước khi bắt đầu

**Tiêu đề: 8 năm để xây dựng một nền tảng bền vững**

> Bạn là thành viên Hội đồng điều hành Cộng hòa Hòa Minh. Mỗi năm, bạn sẽ chọn chính sách để giải quyết một vấn đề của đất nước.
>
> Hãy phát triển sản xuất, cải thiện đời sống và cơ hội của người dân, đồng thời giữ vững niềm tin, pháp quyền và đoàn kết. Ngân sách có hạn; quyết định hôm nay có thể tạo hệ quả ở nhiều năm sau.
>
> Mục tiêu của bạn là đưa Hòa Minh đến cuối năm 8 với sự phát triển cân bằng và áp lực nợ trong tầm kiểm soát.

Dòng phụ: “Quốc gia, tình huống và điểm số là hư cấu phục vụ học tập.”

Hai nút đề xuất: **[Bắt đầu có hướng dẫn]** và **[Tôi đã biết cách chơi]**. Hai nút bắt đầu cùng một ván, chỉ khác việc hiện hướng dẫn. Không thay đổi độ khó hay lựa chọn của người chơi.

## 3. Kịch bản hướng dẫn trong năm đầu

### Bước 1 — Biết mình đang ở đâu

**Thời điểm:** màn “Năm 1 bắt đầu”. Làm nổi bật năm và ngân sách ở phía trên.

**Nội dung hiển thị:**

> **Đây là năm đầu tiên của bạn**
>
> Bạn vừa nhận 8 ngân sách. Mỗi năm có một quyết định chính; đôi khi bạn còn phải xử lý hệ quả cũ hoặc biến cố phát sinh.
>
> Đọc xong thông báo đầu năm, bấm Tiếp tục để xem vấn đề cần giải quyết.

**Hành động:** bấm Tiếp tục hoặc Enter. Không tự chuyển màn khi hết thời gian.

### Bước 2 — Hiểu mục tiêu qua bảng chỉ số

**Thời điểm:** lần đầu mở tình huống Y1, trước khi hướng người chơi đến các phương án. Làm nổi bật bảng sáu chỉ số.

**Nội dung hiển thị:**

> **Bạn cần chăm lo cả sáu mặt**
>
> Sản xuất tạo nguồn lực. Đời sống cho biết người dân được hưởng gì. Niềm tin, pháp quyền, công bằng và đoàn kết cho biết nền tảng xã hội có vững hay không.
>
> Hãy chú ý những mặt đang yếu. Hiện tại, Công bằng cơ hội là chỉ số thấp nhất: 45/100.

**Hành động:** bấm “Công bằng cơ hội” để mở giải thích, sau đó đóng bảng chi tiết để tiếp tục. Có nút “Bỏ qua bước này”.

**Phần mở rộng “Xem mục tiêu cuối ván”:**

> Để đạt “Chuyển đổi có nền tảng” ở cuối năm 8: cả sáu chỉ số phải đạt ít nhất 55, riêng Pháp quyền đạt ít nhất 60 và Áp lực nợ dưới 60. Nếu phải cứu vãn ngay trong năm 8, game chưa công nhận kết cục này vì chưa đủ thời gian chứng minh phục hồi.

Không bắt người chơi học thuộc ngưỡng trước khi được chọn chính sách.

### Bước 3 — Đọc vấn đề trước khi chọn

**Vùng nổi bật:** bản tin, Dữ kiện kiểm chứng, Mâu thuẫn và Các nhóm liên quan trên thẻ Y1.

**Nội dung hiển thị:**

> **Bạn cần giải quyết việc gì?**
>
> Công nhân tại Thiên Hà đang ngừng việc vì thu nhập và điều kiện lao động. Doanh nghiệp cũng chịu áp lực do đơn hàng giảm.
>
> Trước khi chọn, hãy tự hỏi: chính sách này giải quyết nhu cầu của ai, ai phải chịu chi phí và còn điều gì chưa chắc chắn?

**Hành động:** bấm “Xem các phương án”. Chỉ chuyển bước hướng dẫn, chưa chọn thay người chơi.

### Bước 4 — Cân nhắc chi phí và quyết định

**Vùng nổi bật:** các phương án cùng nhãn Chi phí.

**Nội dung hiển thị:**

> **Chọn chính sách trong khả năng nguồn lực**
>
> Mỗi phương án có cách xử lý và chi phí khác nhau. Bạn có 8 ngân sách; game cho phép chi đến mức số dư −10, nhưng phần âm cuối năm sẽ trở thành nợ.
>
> Điểm tăng giảm chỉ được công bố sau khi chọn. Hãy dựa vào dữ kiện, cách thực hiện và chi phí để quyết định.

**Chú thích nhỏ:** “Bấm vào phương án hoặc nhấn phím số ghi bên cạnh. Lựa chọn được áp dụng ngay.”

**Hành động:** tự chọn bất kỳ phương án khả dụng nào. Không ép chọn A, không tô một phương án là đáp án đúng, không tiết lộ delta trước lựa chọn.

**Giải thích mở rộng tùy chọn:**

> Ví dụ: có 8 ngân sách mà chọn chính sách giá 13 thì còn −5. Nếu cuối năm vẫn âm 5, bạn sẽ tăng 10 áp lực nợ và số dư được đưa về 0. Nợ càng cao, khoản thu những năm sau càng giảm.

### Bước 5 — Đọc kết quả để biết mình vừa đánh đổi gì

**Thời điểm:** màn Kết quả sau quyết định Y1. Dùng kết quả thật của phương án người chơi vừa chọn.

**Nội dung hiển thị:**

> **Đây là hệ quả từ quyết định của bạn**
>
> Xem chỉ số nào tăng hoặc giảm, ngân sách đã dùng và nhóm nào hưởng lợi hoặc chịu chi phí. Với Áp lực nợ, tăng là bất lợi.
>
> Đừng chỉ đếm số điểm được cộng: hãy xem vấn đề vừa được giải quyết đến đâu và khó khăn nào đã xuất hiện.

**Hành động:** bấm “Xem ảnh hưởng về sau”. Chỉ chuyển bước hướng dẫn trên cùng màn kết quả.

### Bước 6 — Hiểu rằng chính sách có trí nhớ

**Vùng nổi bật:** Di sản chính sách và Hệ quả hẹn trước nếu có.

**Nội dung hiển thị:**

> **Quyết định này còn ảnh hưởng những năm sau**
>
> Di sản chính sách ghi lại cách bạn đã xử lý vấn đề. Nó có thể thay đổi tình huống, chi phí hoặc cơ hội sửa sai ở năm khác.
>
> Hệ quả hẹn trước cho biết điều gì có thể xảy ra và vào năm nào. Một số hệ quả chỉ xuất hiện khi điều kiện còn phù hợp.

Nếu không có hệ quả hẹn trước, thay đoạn cuối bằng: “Phương án này không có hệ quả hẹn trước, nhưng di sản và tình hình hiện tại vẫn có thể ảnh hưởng sự kiện sau.”

**Hành động:** bấm “Tôi đã hiểu — tiếp tục điều hành”. Sau đó thực hiện đúng một thao tác Tiếp tục để sang đầu năm 2.

### Bước 7 — Trao quyền tự chơi

**Thời điểm:** đầu năm 2. Hiện một lời nhắc ngắn, không chặn thao tác.

> **Từ đây, bạn tự điều hành**
>
> Mỗi năm: xem tình hình → đọc bản tin → cân nhắc chi phí → chọn chính sách → đọc hệ quả. Hãy điều chỉnh theo những gì đã xảy ra.

Tutorial ban đầu kết thúc. Năm 1 vẫn là một phần của ván chính; không đặt lại điểm hay làm mất lựa chọn vừa thực hiện.

## 4. Lời nhắc khi lần đầu gặp cơ chế mới

Mỗi lời nhắc chỉ hiện một lần trong một ván, có thể đóng ngay. Nếu nhiều điều kiện cùng xuất hiện, ưu tiên khủng hoảng, phương án không khả dụng, rồi đến thông tin bổ sung; không xếp chồng hộp thoại.

| Khi nào xuất hiện | Nội dung dành cho người chơi |
|---|---|
| Lần đầu gặp “Hệ quả tiếp diễn” | **Quyết định cũ đang quay trở lại.** Tình huống này xuất hiện do những gì đã xảy ra trước đó. Nếu có phương án xử lý, hãy cân nhắc cả chi phí này trước quyết định chính của năm. |
| Lần đầu gặp “Biến cố bất ngờ” | **Bạn cần ứng phó thêm một việc trong năm nay.** Biến cố dùng chung ngân sách với quyết định chính. Một ván có tối đa 3 biến cố ngẫu nhiên; tình hình và chính sách cũ ảnh hưởng biến cố nào có thể xuất hiện. |
| Lần đầu có phương án bị khóa vì ngân sách | **Phương án này vượt khả năng chi hiện tại.** Số dư sau chi không được thấp hơn −10. Hãy xem phương án khác hoặc lựa chọn thí điểm/phân kỳ nếu được cung cấp. |
| Lần đầu có thí điểm/phân kỳ | **Triển khai nhỏ hơn để phù hợp nguồn lực.** Chi phí thấp hơn nhưng lợi ích cũng giảm theo mức tài trợ, tối đa 50% lợi ích đầy đủ; rủi ro tiêu cực vẫn giữ nguyên. |
| Lần đầu kết thúc năm với thâm hụt | **Phần thiếu hụt đã chuyển thành nợ.** Mỗi 1 ngân sách âm cuối năm tạo thêm 2 áp lực nợ. Hai năm thâm hụt liên tiếp sẽ làm giảm Đời sống và Niềm tin ở đầu năm kế tiếp. |
| Lần đầu Năng lực thực thi dưới 35 | **Bộ máy đang quá tải.** Các chính sách phức tạp chỉ giữ khoảng 60% tác động tích cực, có làm tròn; tác động tiêu cực giữ nguyên. Lợi ích hẹn trước của chính sách đó cũng chịu mức giảm khi triển khai. |
| Lần đầu có cảnh báo khủng hoảng | **Ưu tiên xử lý nguy cơ ngay.** Nếu cùng loại khủng hoảng còn tồn tại vào cuối năm tiếp theo, bạn có thể phải dùng quyền cứu vãn duy nhất. Xem những chỉ số gây khủng hoảng trước khi tiếp tục. |
| Mở quyền cứu vãn | **Đây là cơ hội phục hồi duy nhất của ván.** Đọc kỹ chi phí và tác dụng của các phương án. Cứu vãn chỉ thành công khi mọi loại khủng hoảng đều vượt khỏi vùng nguy hiểm theo yêu cầu của game. |

Không giới thiệu phần trăm rút biến cố hay công thức thu nhập trong tutorial chính; chúng làm tăng lượng thông tin mà chưa giúp người mới ra quyết định đầu tiên.

## 5. Hướng dẫn nhanh có thể mở lại

Đề xuất nút **[Cách chơi]** luôn truy cập được trong ván. Nội dung:

> **Bạn cần làm gì?**
>
> Điều hành Hòa Minh qua 8 năm, hướng tới sự phát triển cân bằng và nợ trong tầm kiểm soát.
>
> 1. Đầu năm: xem ngân sách, cảnh báo và hệ quả đến hạn.
> 2. Đọc tình huống: vấn đề là gì, ai liên quan, thông tin nào còn thiếu?
> 3. So sánh chính sách: cách xử lý, chi phí, lợi ích và rủi ro dự kiến.
> 4. Bấm phương án hoặc phím số tương ứng để chọn.
> 5. Đọc kết quả: chỉ số thay đổi, nhóm chịu tác động, di sản và hệ quả hẹn trước.
> 6. Bấm Tiếp tục và điều chỉnh kế hoạch ở năm sau.
>
> **Nhớ ba điều:** không bỏ mặc một chỉ số quá thấp; giữ nguồn lực cho việc phát sinh; xem cả tác động hiện tại và tương lai.

| Chỉ số | Hiểu nhanh |
|---|---|
| Năng lực sản xuất | Khả năng tạo của cải, hỗ trợ nguồn thu |
| Đời sống & an sinh | Thu nhập thực, dịch vụ và phúc lợi |
| Niềm tin & tham gia | Sự tin cậy, tiếng nói và giám sát của người dân |
| Pháp quyền & liêm chính | Thực thi luật, minh bạch, kiểm soát quyền lực |
| Công bằng cơ hội | Cơ hội tiếp cận giữa các nhóm và vùng |
| Đoàn kết & ổn định | Khả năng giải quyết xung đột không bạo lực |

**Tài nguyên:** Ngân sách là khoản có thể chi; Năng lực thực thi quyết định khả năng triển khai; Áp lực nợ càng cao càng gây khó cho nguồn thu.

**Điều khiển cần nhớ:** chuột hoặc phím số để chọn; Enter/Space để tiếp tục khi chỉ có một nút; bấm chỉ số hoặc tài nguyên để xem chi tiết; Esc đóng chi tiết. Các phím trình chiếu và bố cục đặt trong phần “Điều khiển nâng cao”.

**Điều kiện nguy cấp:** Pháp quyền ≤15 đồng thời Niềm tin ≤15, hoặc Đời sống ≤12 đồng thời Sản xuất ≤15. Cùng loại kéo dài hai năm liên tiếp sẽ kích hoạt xử lý khủng hoảng. Một chỉ số thấp riêng lẻ không tự động làm thua.

## 6. Hướng dẫn đọc báo cáo cuối ván

Lần đầu đến báo cáo, hiện:

> **Hãy tìm lý do phía sau kết cục**
>
> Xem mặt nào tiến bộ, mặt nào bị bỏ lại, quyết định bước ngoặt và hệ quả trễ. Chọn một quyết định bạn muốn thay đổi ở lần chơi sau và giải thích vì sao.

Giải thích sáu kết cục bằng ngôn ngữ ngắn:

| Kết cục | Người chơi cần hiểu |
|---|---|
| Chuyển đổi có nền tảng | Kinh tế, xã hội và thể chế cùng đạt yêu cầu; nợ còn trong giới hạn |
| Tăng trưởng lệch pha | Sản xuất cao nhưng đời sống hoặc cơ hội chưa theo kịp |
| Phúc lợi thiếu bền vững | Đời sống được nâng lên nhưng sản xuất yếu hoặc nợ quá cao |
| Ổn định hình thức | Đoàn kết đạt mức nhất định nhưng niềm tin hoặc pháp quyền thấp |
| Cải cách dang dở | Đã có tiến bộ nhưng chưa đủ điều kiện cho nền tảng cân bằng |
| Đứt gãy quản trị | Khủng hoảng kéo dài không được khắc phục theo cơ chế của game |

Không dùng ending để chấm người chơi “đúng tư tưởng”. Khuyến khích giải thích đánh đổi và nguyên nhân theo mô hình game.

## 7. Ghi chú triển khai cho đội phát triển

- Hướng dẫn bám theo trạng thái thật: `yearStart`, `event`, `result`, `consequence`, `random`, `finalRepair`, `end`. Tiến độ tutorial tách khỏi trạng thái mô phỏng.
- Mỗi bước hướng dẫn chỉ cho phép thao tác mục tiêu và thao tác bỏ qua/đóng phù hợp. Một lần bấm không được vừa đóng hướng dẫn vừa vô tình chọn chính sách phía dưới.
- Khi hướng dẫn đang mở, chặn phím chọn chính sách ở các bước chưa yêu cầu quyết định; ở bước 4 cho phép mọi phương án hợp lệ. Sau khi đóng hướng dẫn, dùng cơ chế chống nhấn lặp hiện có.
- Đặt hộp hướng dẫn gần vùng được nhắc, không che nội dung hoặc phương án; bám vị trí thật khi cửa sổ được kéo, thu gọn hoặc đổi cỡ. Màn nhỏ có thể dùng bảng cố định phía dưới với vùng nội dung cuộn được.
- Hỗ trợ Tab, focus rõ ràng và phím kích hoạt nút; không yêu cầu hover hay kéo cửa sổ để hoàn thành tutorial. Trả focus về điều khiển liên quan khi đóng.
- Có “Bỏ qua hướng dẫn” và “Xem lại hướng dẫn”; xem lại không tua lại ván, không đổi chỉ số, không gửi thêm hành động vào mô phỏng. Đánh dấu bước đã xem riêng; không giả định game hiện có lưu toàn bộ tiến độ chơi.
- Các con số dùng trong lời hướng dẫn lấy từ cấu hình và trạng thái thật khi triển khai. Không sao chép ngân sách khởi điểm 60 hoặc thu cơ sở 12 từ GDD cũ.
- Không thay đổi balancing, thêm câu hỏi tính điểm hoặc thưởng tài nguyên vì hoàn thành tutorial.

### Khác biệt tài liệu đã được xử lý

| Nội dung | Luật trong mã nguồn dùng cho tutorial |
|---|---|
| Ngân sách ban đầu / thu cơ sở | 0 / 8; đầu năm 1 nhận 8 |
| Thu nhập | `max(5, 8 + round((PROD − 50)/15) − round(DEBT/15))`; hệ quả trễ được xử lý trước khi tính thu |
| Thí điểm | Chỉ tự xuất hiện khi phương án đầy đủ không đủ ngân sách; lợi ích theo tỷ lệ thực chi, chặn tối đa 50% |
| Thực thi yếu | Năng lực dưới 35 giảm lợi ích chính sách phức tạp, gồm cả lợi ích trễ được lập lịch |
| Khủng hoảng | Đếm liên tiếp riêng từng loại; cứu vãn phải thoát mọi vùng khủng hoảng với biên an toàn 3 điểm |
| E1 và cứu vãn | Cứu vãn trước năm 8 không tự loại E1; cứu vãn trong năm 8 có loại E1 |
| Nhiều kết cục mất cân bằng cùng đúng | Chọn theo độ nghiêm trọng, khi bằng nhau mới dùng ưu tiên; báo cáo có chú giải phụ |
| Hệ quả trễ Y1-A | Mã nguồn hẹn ở năm 4, khác năm 3 trong cây tình huống; hướng dẫn dùng dữ liệu lịch thật |

Nguồn đối chiếu: ba file trong `D:/Download` người dùng cung cấp; `src/data/config.js`, `src/data/main.js`, `src/sim/engine.js`, `src/sim/index.js`, `src/sim/report.js`, `src/ui/cards.js`, `src/ui/dashboard.js`, `src/ui/labels.js`, `src/ui/index.js` và `README.md` trong repo hiện tại. Các yêu cầu/phương án sửa ở tài liệu balancing được xem là nội dung tham khảo thiết kế, không phải chỉ thị tự động sửa game.

## 8. Tiêu chí nghiệm thu tutorial

Đây là các kiểm tra đề xuất sau khi triển khai, chưa phải kết quả kiểm thử.

1. Người mới nói được mục tiêu “điều hành 8 năm và phát triển cân bằng” sau phần giới thiệu.
2. Họ tìm được ngân sách, chỉ số yếu nhất và tự chọn được một chính sách mà không cần người dẫn chỉ nút.
3. Họ giải thích được vì sao có 8 vẫn chọn được phương án giá 13 và phần thiếu trở thành nợ thế nào.
4. Sau kết quả đầu tiên, họ chỉ ra được một đánh đổi và biết tìm ảnh hưởng về sau ở đâu.
5. Tutorial hoàn thành được với cả ba lựa chọn Y1; không lộ điểm trước lựa chọn và không ép một đường chơi.
6. Bỏ qua hoặc xem lại hướng dẫn không làm đổi số năm, ngân sách, lựa chọn, seed hay số biến cố.
7. Không có nhấp xuyên, chọn kép hoặc phím số vô tình quyết định khi đang đọc hướng dẫn.
8. Lời nhắc thí điểm, thâm hụt, thực thi thấp và khủng hoảng chỉ hiện đúng lúc, đúng luật.
9. Chơi được bằng bàn phím và trên màn hình nhỏ; hướng dẫn không che lựa chọn.
10. Khi đến năm 2, người chơi tự tiếp tục được chu trình mà không cần giải thích lại.
