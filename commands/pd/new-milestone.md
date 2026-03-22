---
name: pd:new-milestone
description: Lập kế hoạch chiến lược dự án, tạo lộ trình với milestones rõ ràng
model: opus
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
Khởi tạo milestone mới: kiểm tra -> cập nhật dự án -> hỏi -> nghiên cứu (tùy chọn) -> yêu cầu -> lộ trình -> duyệt.
</objective>

<guards>
Dừng và hướng dẫn người dùng nếu bất kỳ điều kiện nào sau đây thất bại:

@references/guard-context.md
- [ ] `.planning/rules/general.md` tồn tại -> "Thiếu rules. Chạy `/pd:init` để tạo lại."
- [ ] Có tên milestone được cung cấp, hoặc sẽ hỏi người dùng nếu chưa có
@references/guard-context7.md
- [ ] WebSearch khả dụng khi cần nghiên cứu
</guards>

<context>
Tên milestone: $ARGUMENTS (tùy chọn -- hỏi nếu không có)
- `--reset-phase-numbers` -> đánh số phase từ 1
- Phần còn lại = tên/mô tả milestone

Đọc thêm:
- `.planning/PROJECT.md` -> lịch sử milestones
- `.planning/rules/general.md` -> ngôn ngữ, ngày tháng, quy cách
</context>

<execution_context>
@workflows/new-milestone.md (required)
@templates/project.md (required)
@templates/requirements.md (required)
@templates/roadmap.md (required)
@templates/state.md (required)
@templates/current-milestone.md (required)
@references/questioning.md (optional)
@references/conventions.md (required)
@references/ui-brand.md (optional)
@references/prioritization.md (optional)
@references/state-machine.md (optional)
</execution_context>

<process>
Thực thi @workflows/new-milestone.md từ đầu đến cuối.
</process>

<output>
**Tạo/Cập nhật:**
- `.planning/PROJECT.md` -- tầm nhìn và lịch sử milestone
- `.planning/REQUIREMENTS.md` -- yêu cầu có mã định danh và bảng theo dõi
- `.planning/ROADMAP.md` -- lộ trình các phase
- `.planning/STATE.md` -- trạng thái làm việc, được đặt lại
- `.planning/CURRENT_MILESTONE.md` -- theo dõi milestone đang chạy
- `.planning/research/` -- tài liệu nghiên cứu nếu cần cho tính năng mới

**Bước tiếp theo:** `/pd:plan`

**Thành công khi:**
- `ROADMAP.md` có đầy đủ phase với mô tả rõ ràng
- `REQUIREMENTS.md` có mã định danh cho từng yêu cầu
- `STATE.md` được khởi tạo cho milestone mới

**Lỗi thường gặp:**
- Thiếu `CONTEXT.md` -> chạy `/pd:init` trước
- Thiếu rules -> chạy `/pd:init` để tạo lại
- Tên milestone bị trùng -> đổi tên hoặc dùng version khác
</output>

<rules>
- Mọi output PHẢI bằng tiếng Việt có dấu
- PHẢI hỏi người dùng duyệt requirements trước khi tạo roadmap
- PHẢI hỏi người dùng duyệt roadmap trước khi commit
- Nghiên cứu chỉ bắt buộc cho tính năng mới, có thể bỏ qua với milestone refactor hoặc bugfix
</rules>
