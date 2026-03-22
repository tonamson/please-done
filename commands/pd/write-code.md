---
name: pd:write-code
description: Viết code theo task đã plan trong TASKS.md, lint, build, commit và báo cáo (yêu cầu có PLAN.md + TASKS.md trước)
model: sonnet
argument-hint: "[task number] [--auto | --parallel]"
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
Viết code theo task trong `PLAN.md` và `TASKS.md`, tuân thủ `.planning/rules/`, chạy lint + build rồi commit.

**Chế độ:** mặc định 1 task -> dừng hỏi | `--auto` tất cả tuần tự | `--parallel` nhóm wave song song
**Khôi phục:** Tự phát hiện tiến trình qua PROGRESS.md + đĩa/git -> tiếp tục từ chỗ dừng
**Sau khi xong:** `/pd:test`, `/pd:plan [phase tiếp]`, hoặc `/pd:complete-milestone`
</objective>

<guards>
Dừng và hướng dẫn người dùng nếu bất kỳ điều kiện nào sau đây thất bại:

@references/guard-context.md
- [ ] Task number hợp lệ hoặc có cờ `--auto`/`--parallel` -> "Cung cấp số task hoặc cờ chế độ."
- [ ] `PLAN.md` và `TASKS.md` tồn tại cho phase hiện tại -> "Chạy `/pd:plan` trước để tạo plan."
@references/guard-fastcode.md
@references/guard-context7.md
</guards>

<context>
Người dùng nhập: $ARGUMENTS
- Task number (VD: `3`) -> task cụ thể
- `--auto` -> tất cả tuần tự | `--parallel` -> song song | Kết hợp: `3 --auto`
- Không có gì -> chọn task tiếp theo ⬜, xong 1 task thì DỪNG để hỏi người dùng

Đọc thêm:
- `.planning/PROJECT.md` -> tầm nhìn, ràng buộc
- `.planning/rules/general.md` -> quy tắc chung (luôn đọc)
- `.planning/rules/{nestjs,nextjs,wordpress,solidity,flutter}.md` -> theo stack (CHỈ nếu tồn tại)
</context>

<execution_context>
@workflows/write-code.md (required)
@references/conventions.md (required)
@references/prioritization.md (optional)
@references/ui-brand.md (optional)
@references/security-checklist.md (optional)
@references/verification-patterns.md (optional)
</execution_context>

<process>
Thực thi @workflows/write-code.md từ đầu đến cuối. Logic chọn task, viết code, lint/build, bảo mật, commit, cập nhật trạng thái nằm trong workflow.
</process>

<output>
**Tạo/Cập nhật:**
- Source code và file test theo task
- Cập nhật `TASKS.md` và `PROGRESS.md`

**Bước tiếp theo:** `/pd:test`, `/pd:plan [phase tiếp]`, hoặc `/pd:complete-milestone`

**Thành công khi:**
- Code đã viết xong, lint và build đều pass
- Task được đánh dấu hoàn thành trong `TASKS.md`
- Commit có message rõ ràng

**Lỗi thường gặp:**
- Lint hoặc build fail -> đọc lỗi, sửa rồi chạy lại
- Task chưa rõ -> hỏi người dùng qua `AskUserQuestion`
- MCP không kết nối -> kiểm tra Docker và cấu hình
</output>

<rules>
- Mọi output PHẢI bằng tiếng Việt có dấu
- PHẢI đọc và tuân thủ rules trong `.planning/rules/` trước khi viết code
- PHẢI chạy lint và build sau khi viết code
- PHẢI commit sau mỗi task hoàn thành
- KHÔNG được thay đổi code ngoài phạm vi task
</rules>
