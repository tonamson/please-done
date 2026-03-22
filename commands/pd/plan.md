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
Nghiên cứu dự án, thiết kế giải pháp kỹ thuật và chia task cụ thể.
`--auto` (mặc định): Claude tự quyết | `--discuss`: thảo luận tương tác, user chọn
</objective>

<guards>
Dừng và hướng dẫn người dùng nếu bất kỳ điều kiện nào sau đây thất bại:

@references/guard-context.md
- [ ] `.planning/ROADMAP.md` tồn tại -> "Chạy `/pd:new-milestone` trước."
- [ ] `.planning/CURRENT_MILESTONE.md` tồn tại -> "Thiếu CURRENT_MILESTONE.md. Chạy `/pd:new-milestone` để tạo."
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
@references/conventions.md (required)
@references/prioritization.md (optional)
@references/ui-brand.md (optional)
</execution_context>

<process>
Thực thi @workflows/plan.md từ đầu đến cuối.
</process>

<output>
**Tạo/Cập nhật:**
- `.planning/milestones/[version]/phase-[phase]/RESEARCH.md`
- `.planning/milestones/[version]/phase-[phase]/PLAN.md`
- `.planning/milestones/[version]/phase-[phase]/TASKS.md`

**Bước tiếp theo:** `/pd:write-code`

**Thành công khi:**
- Kế hoạch bao phủ tất cả requirement của phase
- Các task đủ cụ thể để thực hiện từng phần
- Phần nghiên cứu đủ ngữ cảnh cho triển khai

**Lỗi thường gặp:**
- FastCode MCP không kết nối -> kiểm tra Docker đang chạy
- Thiếu `ROADMAP.md` -> chạy `/pd:new-milestone` trước
- Phase không tồn tại trong `ROADMAP` -> kiểm tra lại số phase
</output>

<rules>
- Mọi output PHẢI bằng tiếng Việt có dấu
- Tôn trọng chế độ `--auto`/`--discuss`: `auto` không hỏi, `discuss` liệt kê lựa chọn
- KHÔNG viết code trong bước plan, chỉ thiết kế và chia task
- Phần nghiên cứu PHẢI kiểm tra thư viện hiện có trước khi đề xuất thêm dependency mới
</rules>
