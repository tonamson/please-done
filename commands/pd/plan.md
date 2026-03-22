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
</objective>

<guards>
DỪNG và hướng dẫn user nếu bất kỳ điều kiện nào thất bại:

- [ ] `.planning/CONTEXT.md` tồn tại -> "Chạy `/pd:init` trước."
- [ ] `.planning/ROADMAP.md` tồn tại -> "Chạy `/pd:new-milestone` trước."
- [ ] `.planning/CURRENT_MILESTONE.md` tồn tại -> "Thiếu CURRENT_MILESTONE.md. Chạy `/pd:new-milestone` để tạo."
- [ ] FastCode MCP kết nối thành công (mcp__fastcode__code_qa)
- [ ] Context7 MCP kết nối thành công (mcp__context7__resolve-library-id)
</guards>

<context>
User input: $ARGUMENTS

Phân tích tham số:
- `--discuss` -> chế độ DISCUSS
- Mặc định hoặc `--auto` -> chế độ AUTO
- Cả hai -> ưu tiên `--discuss`
- Phần còn lại = thông tin phase/deliverable

Đọc thêm:
- `.planning/PROJECT.md` (nếu có) -> tầm nhìn dự án, ràng buộc
- `.planning/rules/general.md` -> quy tắc chung
- `.planning/rules/nestjs.md` và/hoặc `.planning/rules/nextjs.md` và/hoặc `.planning/rules/wordpress.md` và/hoặc `.planning/rules/solidity.md` và/hoặc `.planning/rules/flutter.md` -> theo stack có trong project
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
Thực thi quy trình từ @workflows/plan.md từ đầu đến cuối.
Giữ nguyên tất cả các bước, chế độ DISCUSS/AUTO, và cổng kiểm tra.
</process>

<output>
**Tạo/Cập nhật:**
- `.planning/milestones/[version]/phase-[phase]/RESEARCH.md` -- kết quả nghiên cứu
- `.planning/milestones/[version]/phase-[phase]/PLAN.md` -- thiết kế kỹ thuật
- `.planning/milestones/[version]/phase-[phase]/TASKS.md` -- danh sách công việc

**Bước tiếp theo:** `/pd:write-code` để bắt đầu viết code

**Thành công khi:**
- Plan bao phủ tất cả requirements của phase
- Tasks cụ thể, có thể thực hiện từng cái một
- Research có đủ context cho implementation

**Lỗi thường gặp:**
- FastCode MCP không kết nối -> kiểm tra Docker đang chạy
- Thiếu ROADMAP.md -> chạy `/pd:new-milestone` trước
- Phase không tồn tại trong ROADMAP -> kiểm tra lại số phase
</output>

<rules>
- Mọi output PHẢI bằng tiếng Việt có dấu
- Tôn trọng chế độ --auto/--discuss: auto không hỏi, discuss liệt kê options
- KHÔNG viết code trong bước plan -- chỉ thiết kế và chia tasks
- Research PHẢI kiểm tra thư viện hiện có trước khi đề xuất thêm dependency mới
</rules>
