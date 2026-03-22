# Quy tắc chung

## Phong cách code (TS/JS)
- Có dấu chấm phẩy, indent 2 spaces, dùng nháy đơn (thuộc tính JSX dùng nháy kép) — PHP theo quy tắc riêng trong `wordpress.md` (tabs) — Solidity theo quy tắc riêng trong `solidity.md` — Flutter/Dart theo quy tắc riêng trong `flutter.md` (file `snake_case`)
- Import: `@/` cross-module, `./` cùng module
- File: kebab-case (create-user.dto.ts, admin-api.ts) | Class/Component: PascalCase
- Giới hạn: mục tiêu 300 dòng, BẮT BUỘC tách >500
- `import type` cho type-only imports

## Ngôn ngữ
- TIẾNG VIỆT CÓ DẤU: báo cáo, JSDoc, logger, commit message, test descriptions
- Tiếng Anh: tên biến, function, class, file
- Ngày tháng: DD_MM_YYYY

## Biểu tượng trạng thái
⬜ Chưa bắt đầu | 🔄 Đang thực hiện | ✅ Hoàn tất | ❌ Bị chặn | 🐛 Có lỗi

Khi tìm/cập nhật trạng thái trong ROADMAP.md hoặc TASKS.md:
- Match pattern: `Trạng thái: [icon]` (có thể có `> ` prefix)

## Quy ước đánh số version và phase
- Hiển thị: số thuần trong path (1.0), prefix v khi hiển thị (v1.0)
- Milestone version: LUÔN 2 số (x.y). VD: 1.0, 1.1, 2.0
- Phase number: LUÔN 2 số (x.y). VD: 1.1, 1.2, 2.1
- Patch version (bugs): LUÔN 3 số (x.y.z). VD: 1.0.1, 1.0.2
- KHÔNG dùng version 3 số cho milestone, KHÔNG dùng chữ cái trong phase

## Định dạng chuẩn của CURRENT_MILESTONE.md
- milestone: [tên milestone]
- version: [x.y] (LUÔN 2 số)
- phase: [x.y] (phase hiện tại)
- status: [Chưa bắt đầu | Đang thực hiện | Hoàn tất]

## Định dạng cột Phụ thuộc trong TASKS.md
- `Không` = không phụ thuộc task nào
- `Task N` = phụ thuộc 1 task (VD: `Task 1`)
- `Task N, Task M` = phụ thuộc nhiều tasks (VD: `Task 1, Task 3`)
- Annotation optional: `Task N (shared file)` — chỉ là metadata, parse bỏ qua phần trong ngoặc

## Viết code tối giản (KISS + YAGNI)
- **Inline trước, extract sau** — Không tạo helper/utility cho logic chỉ dùng 1 lần. 3 dòng lặp vẫn tốt hơn 1 premature abstraction
- **YAGNI** — Chỉ code đúng requirement hiện tại. Không thêm configurability, feature flag, extensibility "phòng xa"
- **Ít file mới nhất có thể** — Ưu tiên sửa file hiện có. Chỉ tách file mới khi vượt giới hạn dòng (xem mục Phong cách code) hoặc có lý do kiến trúc rõ ràng
- **Dùng đúng built-in của framework** — Không tự chế khi framework đã có sẵn (NestJS Guard/Pipe/Interceptor, Laravel Policy/Passport, WordPress nonce/capability...). Không wrap, không viết lại
- **Tra docs framework trước khi viết** — BẮT BUỘC dùng MCP context7 (`resolve-library-id` → `query-docs`) tra xem framework/library đã có hàm/class/helper cho việc đó chưa. Chỉ tự viết khi xác nhận không có sẵn
- **Tra code project trước khi viết** — BẮT BUỘC dùng MCP FastCode (`code_qa`) hỏi xem project đã có hàm/util/service nào làm việc tương tự chưa để tái sử dụng, tránh viết trùng lặp
- **Đếm trước khi viết** — 1 feature nhỏ mà cần >2 file mới hoặc >3 function mới → dừng lại đơn giản hóa
- **Flat hơn nested** — Early return, guard clause thay vì nested logic rồi phải extract thêm function

## Git & Commit
- Kiểm tra project có git không (Bash: `git rev-parse --git-dir 2>/dev/null`). Nếu KHÔNG có git → **BỎ QUA** tất cả bước git add/commit/tag trong mọi skill
- Commit message format (chỉ khi git tồn tại): `[TASK-N]`, `[KIỂM THỬ]`, `[LỖI]`, `[PHIÊN BẢN]`, `[TRACKING]`, `[AUDIT]` - tiếng Việt có dấu

## Bảo mật
- CẤM đọc/ghi/hiển thị nội dung: `.env`, `.env.*` (trừ `.env.example`), `credentials.*`, `*.pem`, `*.key`, `*secret*`, `wp-config.php`
- Chỉ ghi TÊN biến, KHÔNG ghi giá trị
- Khi code sử dụng biến môi trường mới → **BẮT BUỘC** thêm key đó vào `.env.example` với giá trị placeholder (VD: `DATABASE_URL=postgresql://user:pass@localhost:5432/dbname`)

## Kiểm tra phiên bản bộ kỹ năng
Trước khi bắt đầu công việc chính, kiểm tra nhanh (CHỈ 1 lần đầu mỗi conversation, KHÔNG lặp lại):
1. Đọc `.pdconfig` (Bash: `cat ~/.claude/commands/pd/.pdconfig`) → lấy `SKILLS_DIR` (CHỈ Claude Code — platform khác bỏ qua nếu file không tồn tại)
2. So sánh version: `LOCAL=$(cat [SKILLS_DIR]/VERSION 2>/dev/null)` và `REMOTE=$(cd [SKILLS_DIR] && git fetch origin main --quiet 2>/dev/null && git show origin/main:VERSION 2>/dev/null)`
3. Nếu `REMOTE` khác `LOCAL` và `REMOTE` không rỗng → hiện 1 dòng: `💡 Skills v[REMOTE] đã có. Chạy /pd:update để cập nhật.`
4. Nếu fetch lỗi (không có mạng) hoặc version giống → bỏ qua, KHÔNG thông báo gì
