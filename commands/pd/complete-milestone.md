---
name: pd:complete-milestone
description: Hoàn tất milestone, commit, tạo git tag, báo cáo tổng kết
model: sonnet
allowed-tools:
  - Read
  - Write
  - Edit
  - Bash
  - Glob
  - Grep
  - AskUserQuestion
---

<objective>
Kiểm tra bugs đã đóng, tạo báo cáo tổng kết, commit, tạo git tag, cập nhật tracking files, chuyển milestone tiếp theo.
Chỉ cho phép đóng khi tất cả tasks ✅ và bugs đã giải quyết.

**Sau khi xong:** `/pd:scan` để cập nhật báo cáo kiến trúc, hoặc `/pd:new-milestone` cho milestone tiếp.
</objective>

<execution_context>
@workflows/complete-milestone.md
@references/conventions.md
@references/state-machine.md
@references/ui-brand.md
@references/verification-patterns.md
@templates/current-milestone.md
@templates/state.md
</execution_context>

<context>
User input: $ARGUMENTS (không dùng - version tự động từ CURRENT_MILESTONE.md)

**Tự kiểm tra trước khi bắt đầu** (DỪNG nếu thiếu):
1. `.planning/CONTEXT.md` → nếu không có → "Chạy `/pd:init` trước."

Đọc thêm:
- `.planning/PROJECT.md` (nếu có) → cập nhật lịch sử milestones khi đóng
- `.planning/rules/general.md` → ngôn ngữ, ngày tháng, version format, commit message format
</context>

<process>
Thực thi quy trình từ @workflows/complete-milestone.md từ đầu đến cuối.
Giữ nguyên tất cả các bước, cross-checks, cổng kiểm tra bugs, và git operations.
</process>
