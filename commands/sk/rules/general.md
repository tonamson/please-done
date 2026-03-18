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

## Version
- Số thuần trong path (1.0), prefix v khi hiển thị (v1.0)

## Git & Commit
- Kiểm tra project có git không (Bash: `git rev-parse --git-dir 2>/dev/null`). Nếu KHÔNG có git → **BỎ QUA** tất cả bước git add/commit/tag trong mọi skill
- Format: `[TASK-N]`, `[KIỂM THỬ]`, `[LỖI]`, `[PHIÊN BẢN]` - tiếng Việt có dấu

## Bảo mật
- CẤM đọc/ghi/hiển thị nội dung: `.env`, `.env.*` (trừ `.env.example`), `credentials.*`, `*.pem`, `*.key`, `*secret*`
- Chỉ ghi TÊN biến, KHÔNG ghi giá trị

## Kiểm tra phiên bản Skills
Trước khi bắt đầu công việc chính, kiểm tra nhanh (CHỈ 1 lần đầu mỗi conversation, KHÔNG lặp lại):
1. Đọc `.skconfig` (Bash: `cat ~/.claude/commands/sk/.skconfig`) → lấy `SKILLS_DIR`
2. So sánh version: `LOCAL=$(cat [SKILLS_DIR]/VERSION 2>/dev/null)` và `REMOTE=$(cd [SKILLS_DIR] && git fetch origin main --quiet 2>/dev/null && git show origin/main:VERSION 2>/dev/null)`
3. Nếu `REMOTE` khác `LOCAL` và `REMOTE` không rỗng → hiện 1 dòng: `💡 Skills v[REMOTE] đã có. Chạy /sk:update để cập nhật.`
4. Nếu fetch lỗi (không có mạng) hoặc version giống → bỏ qua, KHÔNG thông báo gì
