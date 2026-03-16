---
name: sk:fix-bug
description: Debug lỗi, research, báo cáo, fix, commit [LỖI] và xác nhận cho đến khi thành công
---

<objective>
Research lỗi, phân tích nguyên nhân, viết báo cáo, fix code, commit [LỖI], xác nhận với user. Lặp đến khi user xác nhận thành công. Tạo patch version cho milestone đã hoàn tất.
</objective>

<context>
User input: $ARGUMENTS

Đọc `.planning/CONTEXT.md` → tech stack, coding style.
Nếu chưa có → thông báo chạy `/sk:init` trước.
</context>

<process>

## Bước 1: Thu thập ngữ cảnh lỗi
Từ `$ARGUMENTS`: chức năng bị lỗi, mô tả, error message/log, bước tái hiện.
Nếu thiếu thông tin → hỏi user bổ sung.

## Bước 2: Xác định patch version
- Đọc `.planning/CURRENT_MILESTONE.md` → version hiện tại
- Nếu milestone đã hoàn tất → tạo patch: 1.0 → 1.0.1, nếu 1.0.1 có → 1.0.2
- Nếu milestone chưa hoàn tất → dùng version hiện tại
- Tạo thư mục `.planning/milestones/[patch-version]/` nếu cần

## Bước 3: Đọc context kỹ thuật
Dùng **version gốc** (VD: `1.0`) để đọc, KHÔNG dùng patch version (VD: `1.0.1`) — vì PLAN.md nằm ở thư mục version gốc:
- `.planning/milestones/[version-gốc]/PLAN.md` → thiết kế kỹ thuật, API design, database schema
- `.planning/milestones/[version-gốc]/reports/CODE_REPORT_TASK_*.md` → files đã tạo, quyết định kỹ thuật cho chức năng liên quan
- CONTEXT.md đã chứa đầy đủ coding conventions

Đọc context giúp hiểu TẠI SAO code được viết như vậy trước khi tìm lỗi.

## Bước 4: Research files liên quan
Dùng `mcp__fastcode__code_qa` (repos: đường dẫn dự án từ CONTEXT.md):
1. "Files liên quan đến [chức năng bị lỗi]?"
2. "Luồng xử lý từ controller → service → database cho [chức năng]?"

Nếu FastCode MCP lỗi khi gọi → DỪNG, thông báo user chạy `/sk:init` kiểm tra lại.

## Bước 5: Phân tích + xác định nguyên nhân
- Trace luồng request → controller → service → database → response
- Tìm điểm gây lỗi: file + dòng code
- Giải thích tại sao gây lỗi
- Đánh giá ảnh hưởng đến chức năng khác

## Bước 6: Viết Bug Report
Viết `.planning/bugs/BUG_[DD_MM_YYYY_HH_MM_SS].md`:

```markdown
# Báo cáo lỗi
> Ngày: [DD_MM_YYYY HH:MM:SS] | Mức độ: Nghiêm trọng/Trung bình/Nhẹ
> Trạng thái: Đang sửa | Chức năng: [Tên]
> Patch version: [x.x.x] | Lần sửa: 1

## Mô tả lỗi
[Nguyên văn từ user]

## Bước tái hiện
1. → 2. → Lỗi xảy ra

## Phân tích nguyên nhân
### Code TRƯỚC khi sửa:
File: `[path]`
```typescript
[code gây lỗi]
```
### Nguyên nhân: [giải thích]

## Giải pháp
### Code SAU khi sửa:
File: `[path]`
```typescript
[code đã sửa]
```

## Ảnh hưởng
- [Chức năng A]: Không ảnh hưởng / Có ảnh hưởng → [chi tiết]

## Xác nhận
- [ ] Đã áp dụng bản sửa
- [ ] User xác nhận đúng
- [ ] Không phát sinh lỗi mới
```

## Bước 7: Fix code
- Áp dụng fix, tuân thủ quy tắc code trong CONTEXT.md
- Cập nhật JSDoc nếu logic thay đổi (tiếng Việt)
- Chạy lint + build: `npx eslint --fix && npm run build`
- Thêm/cập nhật test case cho bug trong .spec.ts

## Bước 8: Git commit
```
git add [files đã sửa]
git commit -m "[LỖI] Khắc phục [tóm tắt lỗi ngắn gọn]

Nguyên nhân: [nguyên nhân gốc]
Lỗi phát sinh: [mô tả cách lỗi xảy ra]
Files đã sửa:
- [file]: [thay đổi gì]"
```

## Bước 9: Yêu cầu xác nhận
> "Đã sửa lỗi [mô tả]. Vui lòng kiểm tra lại trên giao diện/database và xác nhận."

### User xác nhận ĐÃ FIX:
- Bug report: Trạng thái → Đã giải quyết, tick checklist
- TASKS.md: xóa 🐛, đổi ✅

### User báo CHƯA FIX:
- Thu thập thêm thông tin
- Bug report: tăng "Lần sửa" (2, 3, 4...), thêm section "Lần sửa [N]"
- Quay lại **Bước 5** phân tích lại
- Commit mỗi lần sửa với prefix [LỖI]
- **TIẾP TỤC cho đến khi user xác nhận thành công**
</process>

<rules>
- Tuân thủ quy tắc code trong CONTEXT.md
- PHẢI đọc PLAN.md + CODE_REPORT trước khi fix
- PHẢI research trước khi fix, KHÔNG đoán mò
- PHẢI viết bug report với code TRƯỚC/SAU
- KHÔNG tự đóng bug - PHẢI chờ user xác nhận
- KHÔNG giới hạn số lần fix - lặp đến khi user confirm
- Mỗi lần fix: commit riêng với prefix [LỖI]
- Patch version tăng dần: 1.0 → 1.0.1 → 1.0.2
- Nếu fix ảnh hưởng chức năng khác → THÔNG BÁO user
- Nếu FastCode MCP lỗi → DỪNG, yêu cầu chạy `/sk:init`
</rules>
