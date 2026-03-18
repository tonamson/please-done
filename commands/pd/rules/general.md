# Quy tắc chung

## Code style
- Có semicolons, 2 spaces indent, single quotes (JSX attributes dùng double quotes)
- Import: `@/` cross-module, `./` cùng module
- File: kebab-case (create-user.dto.ts, admin-api.ts) | Class/Component: PascalCase
- Giới hạn: mục tiêu 300 dòng, BẮT BUỘC tách >500
- `import type` cho type-only imports

## Ngôn ngữ
- TIẾNG VIỆT CÓ DẤU: báo cáo, JSDoc, logger, commit message, test descriptions
- Tiếng Anh: tên biến, function, class, file
- Ngày tháng: DD_MM_YYYY

## Icons trạng thái
⬜ Chưa bắt đầu | 🔄 Đang thực hiện | ✅ Hoàn tất | ❌ Bị chặn | 🐛 Có lỗi

## Trạng thái icons — pattern matching
Khi tìm/cập nhật trạng thái trong ROADMAP.md hoặc TASKS.md:
- Match pattern: `Trạng thái: [icon]` (có thể có `> ` prefix)
- Icons: ⬜ (chưa), 🔄 (đang), ✅ (xong), 🐛 (bug), ❌ (lỗi)

## Version
- Số thuần trong path (1.0), prefix v khi hiển thị (v1.0)

## Phase & Version numbering
- Milestone version: LUÔN 2 số (x.y). VD: 1.0, 1.1, 2.0
- Phase number: LUÔN 2 số (x.y). VD: 1.1, 1.2, 2.1
- Patch version (bugs): LUÔN 3 số (x.y.z). VD: 1.0.1, 1.0.2
- KHÔNG dùng version 3 số cho milestone, KHÔNG dùng chữ cái trong phase

## Format chuẩn CURRENT_MILESTONE.md
- milestone: [tên milestone]
- version: [x.y] (LUÔN 2 số)
- phase: [x.y] (phase hiện tại)
- status: [Chưa bắt đầu | Đang thực hiện | Hoàn tất toàn bộ]

## Format cột Phụ thuộc trong TASKS.md
- `Không` = không phụ thuộc task nào
- `Task N` = phụ thuộc 1 task (VD: `Task 1`)
- `Task N, Task M` = phụ thuộc nhiều tasks (VD: `Task 1, Task 3`)
- Annotation optional: `Task N (shared file)` — chỉ là metadata, parse bỏ qua phần trong ngoặc

## Git & Commit
- Kiểm tra project có git không (Bash: `git rev-parse --git-dir 2>/dev/null`). Nếu KHÔNG có git → **BỎ QUA** tất cả bước git add/commit/tag trong mọi skill
- Format: `[TASK-N]`, `[KIỂM THỬ]`, `[LỖI]`, `[PHIÊN BẢN]` - tiếng Việt có dấu

## Bảo mật
- CẤM đọc/ghi/hiển thị nội dung: `.env`, `.env.*` (trừ `.env.example`), `credentials.*`, `*.pem`, `*.key`, `*secret*`
- Chỉ ghi TÊN biến, KHÔNG ghi giá trị
- Khi code sử dụng biến môi trường mới → **BẮT BUỘC** thêm key đó vào `.env.example` với giá trị placeholder (VD: `DATABASE_URL=postgresql://user:pass@localhost:5432/dbname`)

## Kiểm tra phiên bản Skills
Trước khi bắt đầu công việc chính, kiểm tra nhanh (CHỈ 1 lần đầu mỗi conversation, KHÔNG lặp lại):
1. Đọc `.pdconfig` (Bash: `cat ~/.claude/commands/pd/.pdconfig`) → lấy `SKILLS_DIR`
2. So sánh version: `LOCAL=$(cat [SKILLS_DIR]/VERSION 2>/dev/null)` và `REMOTE=$(cd [SKILLS_DIR] && git fetch origin main --quiet 2>/dev/null && git show origin/main:VERSION 2>/dev/null)`
3. Nếu `REMOTE` khác `LOCAL` và `REMOTE` không rỗng → hiện 1 dòng: `💡 Skills v[REMOTE] đã có. Chạy /pd:update để cập nhật.`
4. Nếu fetch lỗi (không có mạng) hoặc version giống → bỏ qua, KHÔNG thông báo gì
