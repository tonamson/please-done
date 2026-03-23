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
  - AskUserQuestion
  - mcp__fastcode__code_qa
  - mcp__context7__resolve-library-id
  - mcp__context7__query-docs
---

<objective>
Nghiên cứu dự án, thiết kế giải pháp kỹ thuật và phân chia công việc cụ thể.
`--auto` (mặc định): AI tự quyết định toàn bộ | `--discuss`: thảo luận tương tác, người dùng chọn phương án.
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
Dữ liệu nhập: $ARGUMENTS
- `--discuss` -> Chế độ thảo luận | mặc định/`--auto` -> Chế độ tự động | cả hai -> ưu tiên thảo luận.
- Phần còn lại = thông tin giai đoạn (phase)/kết quả bàn giao (deliverable).

Đọc thêm:
- `.planning/PROJECT.md` -> tầm nhìn, ràng buộc dự án.
- `.planning/rules/general.md` -> quy tắc chung.
- `.planning/rules/{nestjs,nextjs,wordpress,solidity,flutter}.md` -> theo công nghệ (CHỈ nếu tồn tại).
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
@references/plan-checker.md (optional)
@references/context7-pipeline.md (optional)
</execution_context>

<process>
Thực hiện quy trình @workflows/plan.md từ đầu đến cuối.
</process>

<output>
**Tạo/Cập nhật:**
- `.planning/milestones/[version]/phase-[phase]/RESEARCH.md`
- `.planning/milestones/[version]/phase-[phase]/PLAN.md`
- `.planning/milestones/[version]/phase-[phase]/TASKS.md`

**Bước tiếp theo:** `/pd:write-code`

**Thành công khi:**
- Kế hoạch bao phủ tất cả yêu cầu của giai đoạn.
- Các công việc (tasks) đủ cụ thể để thực hiện.
- Phần nghiên cứu cung cấp đủ bối cảnh cho việc triển khai.

**Lỗi thường gặp:**
- FastCode MCP không kết nối -> kiểm tra dịch vụ đang chạy.
- Thiếu `ROADMAP.md` -> chạy `/pd:new-milestone` trước.
- Giai đoạn không tồn tại trong `ROADMAP` -> kiểm tra lại số thứ tự phase.
</output>

<rules>
- Mọi kết quả đầu ra PHẢI bằng tiếng Việt có dấu.
- Tuân thủ chế độ `--auto`/`--discuss`: `auto` không hỏi, `discuss` liệt kê lựa chọn cho người dùng.
- KHÔNG viết mã nguồn trong bước lập kế hoạch, chỉ thiết kế và phân chia công việc.
- Phần nghiên cứu PHẢI kiểm tra thư viện hiện có trước khi đề xuất thêm thành phần phụ thuộc (dependency) mới.
</rules>
