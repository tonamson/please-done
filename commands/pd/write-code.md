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
Viết code theo task từ PLAN.md/TASKS.md, tuân thủ coding style trong `.planning/rules/`, chạy lint + build, commit và tạo báo cáo.

**Chế độ:**
- Mặc định: làm 1 task, dừng hỏi user
- `--auto`: làm tất cả tasks còn lại tuần tự, không hỏi giữa chừng
- `--parallel`: phân tích dependency, nhóm wave, chạy song song tasks độc lập bằng multi-agent

**Khôi phục:** Nếu bị gián đoạn (mất mạng, đóng phiên), tự phát hiện tiến trình đã làm qua PROGRESS.md + kiểm tra đĩa/git, tiếp tục từ chỗ dừng thay vì viết lại từ đầu.

**Sau khi xong:** `/pd:test`, `/pd:plan [phase tiếp]`, hoặc `/pd:complete-milestone`.
</objective>

<execution_context>
@workflows/write-code.md
@references/conventions.md
@references/prioritization.md
@references/ui-brand.md
@references/security-checklist.md
@references/verification-patterns.md
</execution_context>

<context>
User input: $ARGUMENTS
- Task number (VD: `3`) → làm task cụ thể
- `--auto` → làm tất cả tasks còn lại tuần tự
- `--parallel` → chạy song song tasks độc lập
- Kết hợp: `3 --auto`, `3 --parallel`
- Không có gì → pick task tiếp theo ⬜, làm xong 1 task thì DỪNG hỏi user

**Tự kiểm tra trước khi bắt đầu** (DỪNG nếu thiếu):
1. `.planning/CONTEXT.md` → nếu không có → "Chạy `/pd:init` trước."

Đọc thêm:
- `.planning/PROJECT.md` (nếu có) → tầm nhìn dự án, ràng buộc
- `.planning/rules/general.md` → quy tắc chung (luôn đọc)
- `.planning/rules/nestjs.md` → quy tắc NestJS (đọc khi task Backend/Fullstack, CHỈ nếu file tồn tại)
- `.planning/rules/nextjs.md` → quy tắc NextJS (đọc khi task Frontend/Fullstack, CHỈ nếu file tồn tại)
- `.planning/rules/wordpress.md` → quy tắc WordPress/PHP (CHỈ nếu file tồn tại)
- `.planning/rules/solidity.md` → quy tắc Solidity (CHỈ nếu file tồn tại)
- `.planning/rules/flutter.md` → quy tắc Flutter/Dart (CHỈ nếu file tồn tại)
</context>

<process>
Thực thi quy trình từ @workflows/write-code.md từ đầu đến cuối.
Tất cả logic (chọn task, viết code, lint/build, bảo mật, commit, cập nhật trạng thái) nằm trong workflow — command này chỉ cung cấp context + điểm vào.
</process>
