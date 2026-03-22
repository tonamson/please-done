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
Viết code theo task từ PLAN.md/TASKS.md, tuân thủ `.planning/rules/`, lint + build, commit.

**Chế độ:** mặc định 1 task -> dừng hỏi | `--auto` tất cả tuần tự | `--parallel` nhóm wave song song
**Khôi phục:** Tự phát hiện tiến trình qua PROGRESS.md + đĩa/git -> tiếp tục từ chỗ dừng
**Sau khi xong:** `/pd:test`, `/pd:plan [phase tiếp]`, hoặc `/pd:complete-milestone`
</objective>

<guards>
DUNG va huong dan user neu bat ky dieu kien nao that bai:

@references/guard-context.md
- [ ] Task number hop le hoac co flag --auto/--parallel -> "Cung cap so task hoac flag che do."
- [ ] PLAN.md + TASKS.md ton tai cho phase hien tai -> "Chay `/pd:plan` truoc de tao plan."
@references/guard-fastcode.md
@references/guard-context7.md
</guards>

<context>
User input: $ARGUMENTS
- Task number (VD: `3`) -> task cụ thể
- `--auto` -> tất cả tuần tự | `--parallel` -> song song | Kết hợp: `3 --auto`
- Không có gì -> pick task tiếp theo ⬜, xong 1 task -> DỪNG hỏi user

Đọc thêm:
- `.planning/PROJECT.md` -> tầm nhìn, ràng buộc
- `.planning/rules/general.md` -> quy tắc chung (luôn đọc)
- `.planning/rules/{nestjs,nextjs,wordpress,solidity,flutter}.md` -> theo stack (CHỈ nếu tồn tại)
</context>

<execution_context>
@workflows/write-code.md (required)
@references/conventions.md (optional)
@references/prioritization.md (optional)
@references/ui-brand.md (optional)
@references/security-checklist.md (optional)
@references/verification-patterns.md (optional)
</execution_context>

<process>
Thực thi @workflows/write-code.md từ đầu đến cuối. Logic chọn task, viết code, lint/build, bảo mật, commit, cập nhật trạng thái nằm trong workflow.
</process>

<output>
**Tao/Cap nhat:**
- Source code + test files theo task
- Cap nhat TASKS.md + PROGRESS.md

**Buoc tiep theo:** `/pd:test`, `/pd:plan [phase tiep]`, hoac `/pd:complete-milestone`

**Thanh cong khi:**
- Code viet xong, lint + build pass
- Task danh dau hoan thanh trong TASKS.md
- Commit voi message ro rang

**Loi thuong gap:**
- Lint/build fail -> doc loi, sua, chay lai
- Task khong ro -> hoi user qua AskUserQuestion
- MCP khong ket noi -> kiem tra Docker va cau hinh
</output>

<rules>
- Moi output PHAI bang tieng Viet co dau
- PHAI doc va tuan thu rules trong `.planning/rules/` truoc khi viet code
- PHAI chay lint + build sau khi viet code
- PHAI commit sau moi task hoan thanh
- KHONG duoc thay doi code ngoai pham vi task
</rules>
