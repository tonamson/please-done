---
name: pd:test
description: Viết test + kiểm thử (NestJS/WordPress/Solidity/Flutter/Frontend), xác nhận với user, báo cáo lỗi
model: sonnet
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
Viết test theo stack (Jest/PHPUnit/Hardhat-Foundry/flutter_test). Frontend-only: danh sách kiểm thử thủ công + xác nhận.
Test với dữ liệu cụ thể, chạy, user xác nhận, commit.

**Sau khi xong:** `/pd:write-code`, `/pd:fix-bug`, hoặc `/pd:complete-milestone`
</objective>

<guards>
DUNG va huong dan user neu bat ky dieu kien nao that bai:

@references/guard-context.md
- [ ] Task number hop le hoac co flag --all -> "Cung cap so task hoac dung `--all`."
@references/guard-fastcode.md
@references/guard-context7.md
- [ ] Co it nhat 1 task voi trang thai done -> "Chua co task nao hoan thanh. Chay `/pd:write-code` truoc."
</guards>

<context>
User input: $ARGUMENTS
- Task number -> test riêng task đó (phải done)
- `--all` -> regression toàn bộ phases
- Không có gì -> test tất cả tasks done trong phase hiện tại

Đọc thêm:
- `.planning/rules/general.md` -> quy tắc chung
- `.planning/rules/{nestjs,wordpress,solidity,flutter}.md` -> Build & Lint (CHỈ nếu tồn tại)
</context>

<execution_context>
@workflows/test.md (required)
@references/conventions.md (optional)
</execution_context>

<process>
Thực thi @workflows/test.md từ đầu đến cuối.
</process>

<output>
**Tao/Cap nhat:**
- Test files theo stack (Jest, PHPUnit, Hardhat, flutter_test)
- Danh sach kiem thu thu cong (Frontend-only)
- Cap nhat TASKS.md

**Buoc tiep theo:** `/pd:write-code`, `/pd:fix-bug`, hoac `/pd:complete-milestone`

**Thanh cong khi:**
- Test files tao va chay thanh cong
- User xac nhan ket qua
- Test files commit

**Loi thuong gap:**
- Test fail -> doc loi, sua test/code, chay lai
- Khong tim thay test framework -> kiem tra package.json/cau hinh
- MCP khong ket noi -> kiem tra Docker va cau hinh
</output>

<rules>
- Moi output PHAI bang tieng Viet co dau
- Test PHAI dung du lieu dau vao cu the, khong dung mock chung chung
- PHAI chay test va xac nhan pass truoc khi commit
- PHAI yeu cau user xac nhan truoc khi hoan tat
</rules>
