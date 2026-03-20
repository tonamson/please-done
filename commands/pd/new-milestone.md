---
name: pd:new-milestone
description: Lập kế hoạch chiến lược dự án, tạo lộ trình với milestones rõ ràng
argument-hint: "[tên milestone, VD: 'v1.1 Thông báo'] [--reset-phase-numbers]"
allowed-tools:
  - Read
  - Write
  - Edit
  - Bash
  - Glob
  - Grep
  - Agent
  - AskUserQuestion
  - WebSearch
  - mcp__context7__resolve-library-id
  - mcp__context7__query-docs
---

<objective>
Khởi tạo milestone mới: kiểm tra → cập nhật dự án → hỏi → nghiên cứu (tùy chọn) → yêu cầu → lộ trình → duyệt.

**Tạo/Cập nhật:**
- `.planning/PROJECT.md` — tầm nhìn dự án + lịch sử milestones (nguồn sự thật cấp dự án)
- `.planning/REQUIREMENTS.md` — danh sách yêu cầu có mã định danh + bảng theo dõi
- `.planning/ROADMAP.md` — lộ trình các phase
- `.planning/STATE.md` — trạng thái làm việc (đặt lại cho milestone mới)
- `.planning/CURRENT_MILESTONE.md` — theo dõi milestone đang chạy
- `.planning/research/` — nghiên cứu lĩnh vực (tùy chọn, chỉ cho tính năng mới)

**Sau khi xong:** `/pd:plan` để bắt đầu triển khai phase đầu tiên.
</objective>

<execution_context>
@workflows/new-milestone.md
@templates/project.md
@templates/requirements.md
@templates/roadmap.md
@templates/state.md
@templates/current-milestone.md
@references/questioning.md
@references/conventions.md
@references/ui-brand.md
@references/prioritization.md
@references/state-machine.md
</execution_context>

<context>
Tên milestone: $ARGUMENTS (tùy chọn — sẽ hỏi nếu không có)

Phân tích tham số:
- `--reset-phase-numbers` → đánh số phase từ 1 (thay vì tiếp nối milestone trước)
- Phần còn lại = tên milestone hoặc mô tả mục tiêu

**Tự kiểm tra trước khi bắt đầu** (DỪNG nếu thiếu):
1. `.planning/CONTEXT.md` → nếu không có → "Chạy `/pd:init` trước."
2. `.planning/rules/general.md` → nếu không có → "Rules bị thiếu. Chạy `/pd:init` để tạo lại."

Đọc thêm:
- `.planning/PROJECT.md` (nếu có — lịch sử milestones trước)
- `.planning/rules/general.md` → ngôn ngữ, ngày tháng, quy cách phiên bản, biểu tượng
</context>

<process>
Thực thi quy trình từ @workflows/new-milestone.md từ đầu đến cuối.
Giữ nguyên tất cả các cổng kiểm tra (quét dự án, yêu cầu, nghiên cứu, duyệt yêu cầu, duyệt lộ trình, commit).
</process>
