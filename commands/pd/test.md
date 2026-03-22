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
Viết test cho project theo stack (Jest cho NestJS, PHPUnit cho WordPress, Hardhat/Foundry cho Solidity, flutter_test cho Flutter). Frontend-only: tạo danh sách kiểm thử thủ công + xác nhận.
Test với dữ liệu đầu vào cụ thể, kiểm tra đầu ra đúng logic.
Chạy test, yêu cầu user xác nhận, commit test files.

**Sau khi xong:** `/pd:write-code` (tiếp tasks), `/pd:fix-bug` (nếu có lỗi), hoặc `/pd:complete-milestone`.
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
- Task number → test riêng task đó (phải done)
- `--all` → chạy test regression toàn bộ phases
- Không có gì → test tất cả tasks done trong phase hiện tại

Đọc thêm:
- `.planning/rules/general.md` → quy tắc chung
- `.planning/rules/nestjs.md` → quy tắc NestJS + Build & Lint (CHỈ nếu file tồn tại)
- `.planning/rules/wordpress.md` → quy tắc WordPress + Build & Lint (CHỈ nếu file tồn tại)
- `.planning/rules/solidity.md` → quy tắc Solidity + Build & Lint (CHỈ nếu file tồn tại)
- `.planning/rules/flutter.md` → quy tắc Flutter + Build & Lint (CHỈ nếu file tồn tại)
</context>

<execution_context>
@workflows/test.md (required)
@references/conventions.md (optional)
</execution_context>

<process>
Thực thi quy trình từ @workflows/test.md từ đầu đến cuối.
Giữ nguyên tất cả các bước, stack-specific test flows, và cổng kiểm tra.
</process>

<output>
**Tao/Cap nhat:**
- Test files theo stack (Jest, PHPUnit, Hardhat, flutter_test)
- Danh sach kiem thu thu cong (Frontend-only)
- Cap nhat TASKS.md (trang thai test)

**Buoc tiep theo:** `/pd:write-code` (tiep tasks), `/pd:fix-bug` (neu co loi), hoac `/pd:complete-milestone`

**Thanh cong khi:**
- Test files duoc tao va chay thanh cong
- User xac nhan ket qua test
- Test files duoc commit

**Loi thuong gap:**
- Test fail -> doc loi, sua test hoac code, chay lai
- Khong tim thay test framework -> kiem tra package.json hoac cau hinh
- MCP khong ket noi -> kiem tra Docker va cau hinh
</output>

<rules>
- Moi output PHAI bang tieng Viet co dau
- Test PHAI dung du lieu dau vao cu the, khong dung mock chung chung
- PHAI chay test va xac nhan pass truoc khi commit
- PHAI yeu cau user xac nhan truoc khi hoan tat
</rules>
