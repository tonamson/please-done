---
name: pd:plan
description: Lập kế hoạch kỹ thuật + chia danh sách công việc cho milestone hiện tại
model: opus
argument-hint: "[--auto | --discuss] [phase cụ thể, VD: '1.2']"
allowed-tools:
  - Read
  - Write
  - Edit
  - Bash
  - Glob
  - Grep
  - Agent
  - AskUserQuestion
  - mcp__fastcode__code_qa
  - mcp__context7__resolve-library-id
  - mcp__context7__query-docs
---

<objective>
Research dự án, thiết kế giải pháp kỹ thuật, chia thành danh sách công việc cụ thể.
Hỗ trợ 2 chế độ:
- `--auto` (mặc định): Claude tự quyết định toàn bộ thiết kế, tính năng, giải pháp kỹ thuật
- `--discuss`: Thảo luận tương tác — Claude liệt kê các vấn đề cần quyết định, user chọn

**Tạo:**
- `.planning/milestones/[version]/phase-[phase]/RESEARCH.md` — kết quả nghiên cứu
- `.planning/milestones/[version]/phase-[phase]/PLAN.md` — thiết kế kỹ thuật
- `.planning/milestones/[version]/phase-[phase]/TASKS.md` — danh sách công việc

**Sau khi xong:** `/pd:write-code` để bắt đầu viết code.
</objective>

<execution_context>
@workflows/plan.md
@templates/plan.md
@templates/tasks.md
@templates/research.md
@references/questioning.md
@references/conventions.md
@references/prioritization.md
@references/ui-brand.md
</execution_context>

<context>
User input: $ARGUMENTS

Phân tích tham số:
- `--discuss` → chế độ DISCUSS
- Mặc định hoặc `--auto` → chế độ AUTO
- Cả hai → ưu tiên `--discuss`
- Phần còn lại = thông tin phase/deliverable

**Tự kiểm tra trước khi bắt đầu** (DỪNG nếu thiếu):
1. `.planning/CONTEXT.md` → nếu không có → "Chạy `/pd:init` trước."
2. `.planning/ROADMAP.md` → nếu không có → "Chạy `/pd:new-milestone` trước."
3. `.planning/CURRENT_MILESTONE.md` → nếu không có → "Thiếu CURRENT_MILESTONE.md. Chạy `/pd:new-milestone` để tạo."

Đọc thêm:
- `.planning/PROJECT.md` (nếu có) → tầm nhìn dự án, ràng buộc
- `.planning/rules/general.md` → quy tắc chung
- `.planning/rules/nestjs.md` và/hoặc `.planning/rules/nextjs.md` và/hoặc `.planning/rules/wordpress.md` và/hoặc `.planning/rules/solidity.md` và/hoặc `.planning/rules/flutter.md` → theo stack có trong project
</context>

<process>
Thực thi quy trình từ @workflows/plan.md từ đầu đến cuối.
Giữ nguyên tất cả các bước, chế độ DISCUSS/AUTO, và cổng kiểm tra.
</process>
