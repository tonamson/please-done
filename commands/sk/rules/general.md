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

## Commit message
- Format: `[TASK-N]`, `[KIỂM THỬ]`, `[LỖI]`, `[PHIÊN BẢN]` - tiếng Việt có dấu

## Bảo mật
- CẤM đọc/ghi/hiển thị nội dung: `.env`, `.env.*` (trừ `.env.example`), `credentials.*`, `*.pem`, `*.key`, `*secret*`
- Chỉ ghi TÊN biến, KHÔNG ghi giá trị
