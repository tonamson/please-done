---
name: pd:fix-bug
description: Tìm và sửa lỗi theo phương pháp khoa học, tìm hiểu, báo cáo, sửa code, commit [LỖI] và xác nhận cho đến khi thành công
argument-hint: "[mô tả lỗi hoặc tên phiên điều tra]"
allowed-tools:
  - Read
  - Write
  - Edit
  - Bash
  - Glob
  - Grep
  - AskUserQuestion
  - mcp__fastcode__code_qa
  - mcp__context7__resolve-library-id
  - mcp__context7__query-docs
---

<objective>
Tìm và sửa lỗi theo phương pháp khoa học: thu thập triệu chứng → phân loại rủi ro → hình thành giả thuyết → kiểm chứng → cổng kiểm tra trước khi sửa → sửa code → xác nhận.
Lưu trạng thái điều tra (.planning/debug/) để tiếp tục khi cuộc hội thoại bị mất.
Lặp đến khi user xác nhận thành công. Tạo patch version cho milestone đã hoàn tất.

**Sau khi xong:** `/pd:what-next` để kiểm tra tiến trình.
</objective>

<execution_context>
@workflows/fix-bug.md
@references/conventions.md
@references/prioritization.md
</execution_context>

<context>
User input: $ARGUMENTS

**Tự kiểm tra trước khi bắt đầu** (DỪNG nếu thiếu):
1. `.planning/CONTEXT.md` → nếu không có → "Chạy `/pd:init` trước."

Đọc thêm:
- `.planning/rules/general.md` → quy tắc chung
- `.planning/rules/nestjs.md` hoặc `nextjs.md` hoặc `wordpress.md` hoặc `solidity.md` hoặc `flutter.md` → theo loại lỗi (CHỈ nếu file tồn tại)
</context>

<process>
Thực thi quy trình từ @workflows/fix-bug.md từ đầu đến cuối.
Giữ nguyên tất cả các bước, phiên điều tra, cổng kiểm tra, phân loại rủi ro, và vòng lặp xác nhận.
</process>
