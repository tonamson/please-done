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
Research dự án, thiết kế giải pháp kỹ thuật, chia tasks cụ thể.
`--auto` (mặc định): Claude tự quyết | `--discuss`: thảo luận tương tác, user chọn
</objective>

<guards>
DUNG va huong dan user neu bat ky dieu kien nao that bai:

@references/guard-context.md
- [ ] `.planning/ROADMAP.md` ton tai -> "Chay `/pd:new-milestone` truoc."
- [ ] `.planning/CURRENT_MILESTONE.md` ton tai -> "Thieu CURRENT_MILESTONE.md. Chay `/pd:new-milestone` de tao."
@references/guard-fastcode.md
@references/guard-context7.md
</guards>

<context>
User input: $ARGUMENTS
- `--discuss` -> DISCUSS | mặc định/`--auto` -> AUTO | cả hai -> ưu tiên `--discuss`
- Phần còn lại = thông tin phase/deliverable

Đọc thêm:
- `.planning/PROJECT.md` -> tầm nhìn, ràng buộc
- `.planning/rules/general.md` -> quy tắc chung
- `.planning/rules/{nestjs,nextjs,wordpress,solidity,flutter}.md` -> theo stack (CHỈ nếu tồn tại)
</context>

<execution_context>
@workflows/plan.md (required)
@templates/plan.md (required)
@templates/tasks.md (required)
@templates/research.md (required)
@references/questioning.md (optional)
@references/conventions.md (optional)
@references/prioritization.md (optional)
@references/ui-brand.md (optional)
</execution_context>

<process>
Thực thi @workflows/plan.md từ đầu đến cuối.
</process>

<output>
**Tao/Cap nhat:**
- `.planning/milestones/[version]/phase-[phase]/RESEARCH.md`
- `.planning/milestones/[version]/phase-[phase]/PLAN.md`
- `.planning/milestones/[version]/phase-[phase]/TASKS.md`

**Buoc tiep theo:** `/pd:write-code`

**Thanh cong khi:**
- Plan bao phu tat ca requirements cua phase
- Tasks cu the, co the thuc hien tung cai
- Research du context cho implementation

**Loi thuong gap:**
- FastCode MCP khong ket noi -> kiem tra Docker dang chay
- Thieu ROADMAP.md -> chay `/pd:new-milestone` truoc
- Phase khong ton tai trong ROADMAP -> kiem tra lai so phase
</output>

<rules>
- Moi output PHAI bang tieng Viet co dau
- Ton trong che do --auto/--discuss: auto khong hoi, discuss liet ke options
- KHONG viet code trong buoc plan -- chi thiet ke va chia tasks
- Research PHAI kiem tra thu vien hien co truoc khi de xuat them dependency moi
</rules>
