---
name: pd:test
description: Viết test + kiểm thử (NestJS/WordPress/Solidity/Flutter/Frontend), xác nhận với user, báo cáo lỗi
argument-hint: "[task number | --all]"
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
Viết test cho project theo stack (Jest cho NestJS, PHPUnit cho WordPress, Hardhat/Foundry cho Solidity, flutter_test cho Flutter). Frontend-only: tạo danh sách kiểm thử thủ công + xác nhận.
Test với dữ liệu đầu vào cụ thể, kiểm tra đầu ra đúng logic.
Chạy test, yêu cầu user xác nhận, commit test files.

**Sau khi xong:** `/pd:write-code` (tiếp tasks), `/pd:fix-bug` (nếu có lỗi), hoặc `/pd:complete-milestone`.
</objective>

<execution_context>
@workflows/test.md
@references/conventions.md
</execution_context>

<context>
User input: $ARGUMENTS
- Task number → test riêng task đó (phải ✅)
- `--all` → chạy test regression toàn bộ phases
- Không có gì → test tất cả tasks ✅ trong phase hiện tại

**Tự kiểm tra trước khi bắt đầu** (DỪNG nếu thiếu):
1. `.planning/CONTEXT.md` → nếu không có → "Chạy `/pd:init` trước."

Đọc thêm:
- `.planning/rules/general.md` → quy tắc chung
- `.planning/rules/nestjs.md` → quy tắc NestJS + Build & Lint (CHỈ nếu file tồn tại)
- `.planning/rules/wordpress.md` → quy tắc WordPress + Build & Lint (CHỈ nếu file tồn tại)
- `.planning/rules/solidity.md` → quy tắc Solidity + Build & Lint (CHỈ nếu file tồn tại)
- `.planning/rules/flutter.md` → quy tắc Flutter + Build & Lint (CHỈ nếu file tồn tại)
</context>

<process>
Thực thi quy trình từ @workflows/test.md từ đầu đến cuối.
Giữ nguyên tất cả các bước, stack-specific test flows, và cổng kiểm tra.
</process>
