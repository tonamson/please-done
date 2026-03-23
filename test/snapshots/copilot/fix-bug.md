---
name: pd:fix-bug
description: Tìm và sửa lỗi theo phương pháp khoa học, tìm hiểu, báo cáo, sửa code, commit [LỖI] và xác nhận cho đến khi thành công
---
<objective>
Sửa lỗi theo quy trình rõ ràng: triệu chứng -> phân loại rủi ro -> giả thuyết -> kiểm chứng -> cổng kiểm tra -> sửa -> xác nhận.
Lưu trạng thái điều tra vào `.planning/debug/` để có thể phục hồi khi mất phiên.
Lặp lại cho đến khi người dùng xác nhận. Tạo patch version cho milestone đã hoàn tất.
**Sau khi xong:** `/pd:what-next`
</objective>
<guards>
Dừng và hướng dẫn người dùng nếu bất kỳ điều kiện nào sau đây thất bại:
- [ ] `.planning/CONTEXT.md` ton tai -> "Chay `/pd:init` truoc."
- [ ] Có mô tả lỗi được cung cấp -> "Hãy cung cấp mô tả lỗi hoặc tên phiên điều tra."
- [ ] FastCode MCP ket noi thanh cong -> "Kiem tra Docker dang chay va FastCode MCP da duoc cau hinh."
- [ ] Context7 MCP ket noi thanh cong -> "Kiem tra Context7 MCP da duoc cau hinh."
- [ ] Context7 MCP hoat dong (thu resolve-library-id "react") -> "Context7 khong phan hoi. Kiem tra ket noi MCP."
</guards>
<context>
Người dùng nhập: $ARGUMENTS
Đọc thêm:
- `.planning/rules/general.md` -> quy tắc chung
- `.planning/rules/{nestjs,nextjs,wordpress,solidity,flutter}.md` -> theo loại lỗi (CHỈ nếu tồn tại)
</context>
<required_reading>
Đọc .pdconfig → lấy SKILLS_DIR, rồi đọc các files sau trước khi bắt đầu:
(Claude Code: cat ~/.copilot/.pdconfig — nền tảng khác: converter tự chuyển đổi đường dẫn)
Đọc trước khi bắt đầu:
- [SKILLS_DIR]/references/conventions.md → version matching, patch version, biểu tượng, commit prefixes
</required_reading>
<conditional_reading>
Đọc CHỈ KHI cần (phân tích mô tả task trước):
- [SKILLS_DIR]/references/prioritization.md -- KHI task ordering/ranking nhieu tasks hoac triage
</conditional_reading>
<process>
## Bước 0.5: Phân tích bug -- quyết định tài liệu tham khảo
- Nhiều bugs cần ưu tiên? → đọc [SKILLS_DIR]/references/prioritization.md
Nếu chỉ có 1 bug → BỎ QUA.
## Bước 1: Kiểm tra phiên điều tra + thu thập triệu chứng
`git rev-parse --git-dir 2>/dev/null` → lưu `HAS_GIT`
`mkdir -p .planning/debug`
### 1a. Kiểm tra phiên điều tra đang mở
glob `.planning/debug/SESSION_*.md` → search `> Trạng thái:` → lọc **có thể tiếp tục**:
- `Đang điều tra`, `Điểm dừng`, `Chờ quyết định`, `Tạm dừng`
Trạng thái **KHÔNG tự liệt kê** (chỉ mở khi user nêu rõ):
- `Đã tìm nguyên nhân`, `Đã giải quyết`, `Chưa kết luận` (→ nhảy **Bước 5c** với thông tin mới)
- Có phiên tiếp tục được VÀ không có $ARGUMENTS → liệt kê (trạng thái + giả thuyết + việc tiếp):
  - `Đang điều tra` / `Tạm dừng` → **Bước 5c**
  - `Điểm dừng` → hiển thị câu hỏi, chờ trả lời → **Bước 5c**
  - `Chờ quyết định` → hiển thị phương án, chờ chọn → **Bước 6b** rồi **6c**
- Có $ARGUMENTS → tiếp tục thu thập mới
Có báo cáo lỗi mở (`.planning/bugs/BUG_*.md` → search `Trạng thái: (Chưa xử lý|Đang sửa)`):
- Liệt kê → user chọn → đọc báo cáo → điền triệu chứng → nhảy Bước 3
### 1b. Thu thập triệu chứng (lỗi mới)
Thu đủ 5 thông tin — từ $ARGUMENTS hoặc hỏi:
1. **Mong đợi** — Lẽ ra thế nào?
2. **Thực tế** — Xảy ra gì?
3. **Thông báo lỗi** — Log/error cụ thể?
4. **Dòng thời gian** — Khi nào? Trước đó bình thường? Thay đổi gần đây?
5. **Tái hiện** — Làm gì để lỗi xảy ra lại?
$ARGUMENTS đủ → KHÔNG hỏi thêm, tự trích xuất.
Thiếu (#2, #5) → hỏi bổ sung.
Hỏi kèm gợi ý đáp án phổ biến + cho phép tự nhập.
Sau 5 triệu chứng vẫn thiếu context → linh hoạt hỏi thêm (route, payload, log...).
## Bước 2: Xác định patch version
Xem [SKILLS_DIR]/references/conventions.md → 'Patch version'.
- `.planning/CURRENT_MILESTONE.md` → version hiện tại
- Không tồn tại → hỏi user version, bỏ qua logic so sánh
- So sánh version lỗi với hiện tại:
| Trường hợp | Patch version |
|-----------|---------------|
| Lỗi version CŨ (milestone hoàn tất) | glob bugs/ → search patch version → tìm cao nhất → +1 hoặc `[version-gốc].1` |
| Lỗi version HIỆN TẠI | `[version].0` hoặc tìm cao nhất → +1 |
- User không chỉ rõ version → hỏi
- `.planning/milestones/[version-gốc]/` không tồn tại → "Kiểm tra version." → **DỪNG**
## Bước 3: Đọc tài liệu kỹ thuật (CHỈ PHẦN LIÊN QUAN)
Dùng **version gốc** (KHÔNG dùng patch version):
**Tìm phase liên quan TRƯỚC:**
1. search chức năng lỗi trong `.planning/milestones/[version-gốc]/phase-*/PLAN.md`
2. CHỈ đọc PLAN.md + CODE_REPORT của phase(s) liên quan
3. search không khớp → mở rộng tìm tất cả PLAN.md
- PLAN.md → thiết kế, API, database
- CODE_REPORT → files đã tạo, quyết định kỹ thuật
- `.planning/rules/` → quy ước code
## Bước 4: Tìm hiểu files liên quan
`fastcode/code_qa`:
1. Files liên quan [chức năng lỗi]?
2. Backend: luồng controller → service → database?
3. Frontend: components, stores, API calls?
FastCode lỗi → search/read. Cảnh báo: "FastCode không khả dụng."
**Lỗi liên quan thư viện** → Thực hiện theo [SKILLS_DIR]/references/context7-pipeline.md
## Bước 5: Phân tích theo phương pháp khoa học
### 5a. Tạo/cập nhật phiên điều tra
`.planning/debug/SESSION_[tên-tắt].md`
**Tên-tắt**: viết thường, gạch ngang, tối đa 30 ký tự (VD: `login-timeout`, `cart-empty`)
```markdown
# Phiên điều tra: [tên-tắt]
> Bắt đầu: [DD_MM_YYYY HH:MM] | Trạng thái: Đang điều tra
> Phân loại: [🟢/🟡/🟠/🔴/🔵 — xem Bước 6a]
> Báo cáo lỗi: BUG_[timestamp].md (liên kết sau Bước 7)
## Triệu chứng
- **Mong đợi:** [...]
- **Thực tế:** [...]
- **Thông báo lỗi:** [...]
- **Dòng thời gian:** [...]
- **Tái hiện:** [...]
## Tái hiện tối giản (nếu cần)
## Giả thuyết
### GT1: [mô tả]
- **Kiểm tra bằng:** [...]
- **Bằng chứng:** [...]
- **Kết quả:** ✅ Đúng / ❌ Sai / ⏳ Chưa kiểm tra
## Files đã kiểm tra
- `[file:dòng]`: [phát hiện]
## Kết luận
```
### 5b. Tái hiện tối giản (cho lỗi khó)
**Khi cần:** bước tái hiện không rõ, lúc có lúc không, hoặc 5+ bước.
Tìm đường ngắn nhất → loại yếu tố nhiễu → ghi SESSION → dùng làm cơ sở giả thuyết.
Lỗi rõ ràng (thông báo chỉ thẳng file/dòng) → bỏ qua.
### 5c. Hình thành + kiểm chứng giả thuyết
CONTEXT.md → stack → đọc `.planning/rules/[stack].md` → truy vết luồng:
Khong xac dinh duoc stack tu CONTEXT.md → dung luong truy vet generic: entry point → handler → business logic → data layer → response. Ghi note: "Stack khong xac dinh, dung luong generic."
| Stack | Luồng |
|-------|-------|
| NestJS | request → controller → service → database → response |
| NextJS | page/component → store → API call → hiển thị |
| WordPress | hook/action → callback → $wpdb → output |
| Solidity | function → require → state change → external → events |
| Flutter | View (Obx) → Logic (GetxController) → Repository → API → Response |
| Generic/Khac | entry point → handler → business logic → data layer → response |
**Quy trình:**
1. Triệu chứng + truy vết → 1-3 giả thuyết
2. Mỗi GT: xác định cách kiểm tra → thu thập bằng chứng → ✅ Đúng (nguyên nhân gốc) / ❌ Sai (loại, ghi lý do)
3. Cập nhật SESSION sau mỗi GT
4. Tất cả sai → mở rộng phạm vi, giả thuyết mới
**Điểm dừng** (cần user xác minh):
- SESSION: `> Trạng thái: Điểm dừng`
- Thêm section `## Điểm dừng [N]` (Loại, Câu hỏi, Trả lời)
- User trả lời → cập nhật → `Đang điều tra` → tiếp tục
**Chung:** tìm file + dòng gây lỗi, giải thích tại sao, đánh giá ảnh hưởng.
## Bước 6: Đánh giá kết quả điều tra
### 6a. Phân loại rủi ro
Phân loại theo [SKILLS_DIR]/references/prioritization.md → 'Phân loại rủi ro bug'. Cập nhật SESSION.
Ảnh hưởng: format báo cáo (Bước 7), mức kiểm thử (Bước 8), chiến lược commit (Bước 9).
### 6a.1. Effort routing cho fix-bug
fix-bug luon chay voi sonnet (theo skill file `commands/pd/fix-bug.md` line 4: `model: sonnet`). Effort routing khong ap dung cho fix-bug -- agent da duoc spawn voi model co dinh truoc khi workflow chay.
### 6b. Đánh giá kết quả
**✅ Tìm được nguyên nhân, cách sửa rõ** → SESSION `Đã tìm nguyên nhân` + điền Kết luận → Bước 6c
**⚠️ Tìm được nhưng CẦN USER QUYẾT ĐỊNH** (di chuyển dữ liệu, logic auth/thanh toán/contract, phá API cũ, nhiều cách sửa):
- SESSION `Chờ quyết định`
- Trình bày: nguyên nhân + phương án A/B (ưu/nhược)
- User chọn → Bước 6c
**❌ Không tìm được** → SESSION `Chưa kết luận`:
- Báo: "[N] giả thuyết đã kiểm tra, chưa xác định nguyên nhân."
- Gợi ý: (1) Bổ sung thông tin, (2) Mở rộng phạm vi, (3) Thêm log tạm
- User bổ sung → cập nhật SESSION → **Bước 5c**
- User dừng → SESSION `Tạm dừng`
- KHÔNG tạo BUG_*.md khi chưa tìm nguyên nhân
### 6c. Cổng kiểm tra trước khi sửa
**3 điều kiện BẮT BUỘC:**
1. Đã tái hiện HOẶC bằng chứng thay thế đủ mạnh (log rõ ràng, lỗi logic hiển nhiên, dấu vết chỉ thẳng dòng)
2. Đã xác định file + logic cụ thể
3. Đã có kế hoạch kiểm tra sau sửa
Thiếu điều kiện → quay Bước 5b/5c. Đủ → Bước 7.
## Bước 7: Viết báo cáo lỗi
`.planning/bugs/BUG_[DD_MM_YYYY_HH_MM_SS].md`:
```markdown
# Báo cáo lỗi
> Ngày: [DD_MM_YYYY HH:MM:SS] | Mức độ: Nghiêm trọng/Cao/Trung bình/Nhẹ
> Trạng thái: Đang sửa | Chức năng: [Tên] | Task: [N] (nếu biết)
> Patch version: [x.x.x] | Lần sửa: 1
> Phân loại: [🟢/🟡/🟠/🔴/🔵 tên loại]
> Phiên điều tra: SESSION_[tên-tắt].md
## Mô tả lỗi
## Triệu chứng
- **Mong đợi:** | **Thực tế:** | **Dòng thời gian:**
## Bước tái hiện
1. → 2. → Lỗi
## Phân tích nguyên nhân
### Giả thuyết đã kiểm tra:
- GT1: [mô tả] → ❌ Loại bỏ vì [lý do]
- GT2: [mô tả] → ✅ **Nguyên nhân gốc**
### [Phần code/thay đổi — TÙY phân loại]:
🟢🟡🟠🔴 Lỗi code → Code TRƯỚC/SAU (file, code gốc → nguyên nhân, code sửa)
🔵 Hạ tầng/cấu hình → Tóm tắt (file, giá trị cũ → mới, lý do)
## Ảnh hưởng
## Kế hoạch kiểm tra
## Xác nhận
- [ ] Đã áp dụng bản sửa
- [ ] User xác nhận đúng
- [ ] Không phát sinh lỗi mới
```
Cập nhật liên kết trong SESSION file.
## Bước 8: Sửa code
- Áp dụng bản sửa, tuân thủ `.planning/rules/`
- Cập nhật JSDoc nếu logic thay đổi (tiếng Việt)
- Lint + build đúng thư mục (xem rules/[stack].md → **Build & Lint**)
**Kiểm thử theo phân loại:**
| Phân loại | Yêu cầu |
|-----------|---------|
| 🟢 Sửa nhanh | lint + build qua đủ |
| 🟡 Lỗi logic | PHẢI thêm/cập nhật test |
| 🟠 Lỗi dữ liệu | sao lưu trước, kiểm tra toàn vẹn sau |
| 🔴 Bảo mật | test BẮT BUỘC + xác nhận user trước áp dụng |
| 🔵 Hạ tầng | kiểm tra cấu hình đúng môi trường |
## Bước 9: Git commit (CHỈ HAS_GIT = true)
**Commit theo phân loại:**
- 🟢🟡🔵: sửa code + báo cáo + phiên điều tra trong 1 commit
- 🟠: commit riêng cho migration/sửa dữ liệu, commit riêng sửa code
- 🔴: commit riêng, KHÔNG gộp thay đổi không liên quan
```
git add [files sửa] .planning/bugs/BUG_[...].md .planning/debug/SESSION_[...].md
git commit -m "[LỖI] Khắc phục [tóm tắt]
Phân loại: [🟢/🟡/🟠/🔴/🔵]
Nguyên nhân: [...]
Files: [file]: [thay đổi]"
```
## Bước 10: Yêu cầu xác nhận
> "Đã sửa [mô tả]. Vui lòng kiểm tra và xác nhận."
### User xác nhận ĐÃ SỬA:
- Báo cáo: Trạng thái → Đã giải quyết, tick checklist
- Phiên điều tra: `Đã giải quyết`
- TASKS.md: dùng version GỐC (KHÔNG version hiện tại) → glob `.planning/milestones/[version-gốc]/phase-*/TASKS.md` → search task → 🐛 → ✅ CẢ HAI nơi (bảng + detail)
- HAS_GIT:
```
git add .planning/bugs/BUG_[...].md .planning/debug/SESSION_[...].md .planning/milestones/[...]/TASKS.md
git commit -m '[LỖI] Xác nhận đã khắc phục [tóm tắt]'
```
### User báo CHƯA SỬA:
- Thu thập thêm (triệu chứng mới?)
- Báo cáo: tăng "Lần sửa", thêm section "Lần sửa [N]"
- Phiên điều tra: giả thuyết mới, bằng chứng mới
- Quay **Bước 5c** — giả thuyết mới từ bằng chứng mới
- Mỗi lần sửa commit [LỖI]
- 3+ lần → gợi ý: phân tích lại, thay đổi cách tiếp cận, thêm log tạm
- **TIẾP TỤC cho đến khi user xác nhận**
</process>
<output>
**Tạo/Cập nhật:**
- Source code đã sửa lỗi
- `.planning/debug/` -- trạng thái phiên điều tra
- Cập nhật `TASKS.md` nếu liên quan
**Bước tiếp theo:** `/pd:what-next`
**Thành công khi:**
- Người dùng xác nhận đã sửa thành công
- Các test liên quan chạy thành công nếu có
- Commit `[LỖI]` đã được tạo
**Lỗi thường gặp:**
- Không tái hiện được lỗi -> yêu cầu người dùng cung cấp thêm thông tin
- Lỗi nằm ở dependency -> cập nhật package, kiểm tra phiên bản
- MCP không kết nối -> kiểm tra Docker và cấu hình
</output>
<rules>
- Mọi output PHẢI bằng tiếng Việt có dấu
- PHẢI lưu trạng thái điều tra vào `.planning/debug/` để phục hồi
- PHẢI qua cổng kiểm tra (gate check) trước khi sửa code
- PHẢI lặp lại vòng lặp cho đến khi người dùng xác nhận thành công
- KHÔNG được sửa code không liên quan đến lỗi
- Tuân thủ `.planning/rules/` (general + stack-specific)
- CẤM đọc/hiển thị file nhạy cảm (`.env`, `credentials.*`, `*.pem`, `*.key`, `*secret*`, `wp-config.php`)
- PHẢI đọc PLAN.md + CODE_REPORT trước khi sửa (CHỈ phase liên quan)
- PHẢI tìm hiểu trước khi sửa — KHÔNG đoán mò
- PHẢI hình thành giả thuyết trước khi sửa — KHÔNG sửa mò
- PHẢI qua cổng kiểm tra (tái hiện/bằng chứng + file/logic cụ thể + kế hoạch kiểm tra) trước khi sửa
- PHẢI phân loại rủi ro → quyết định kiểm thử + commit strategy
- PHẢI viết báo cáo lỗi: code TRƯỚC/SAU (lỗi code) hoặc tóm tắt (hạ tầng)
- PHẢI duy trì phiên điều tra (.planning/debug/) — cập nhật sau mỗi bước
- KHÔNG tạo BUG_*.md khi chưa qua cổng kiểm tra
- KHÔNG tự đóng lỗi — PHẢI chờ user xác nhận
- KHÔNG giới hạn lần sửa — lặp đến khi xác nhận
- Mỗi lần sửa: commit riêng [LỖI]
- Patch version tăng dần: 1.0 → 1.0.1 → 1.0.2
- Sửa ảnh hưởng chức năng khác → THÔNG BÁO user
- 🔴 bảo mật: PHẢI có user đồng ý trước áp dụng
- ⚠️ đánh đổi: PHẢI trình bày phương án + ưu/nhược, chờ chọn
- FastCode lỗi → search/read, KHÔNG DỪNG
- Tiếp tục phiên → đọc SESSION TRƯỚC, không bắt đầu lại
</rules>
