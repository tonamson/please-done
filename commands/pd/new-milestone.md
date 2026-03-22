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
DỪNG và hướng dẫn user nếu bất kỳ điều kiện nào thất bại:

- [ ] `.planning/CONTEXT.md` tồn tại -> "Chạy `/pd:init` trước."
- [ ] `.planning/rules/general.md` tồn tại -> "Rules bị thiếu. Chạy `/pd:init` để tạo lại."
- [ ] Tên milestone được cung cấp hoặc sẽ hỏi user nếu không có
- [ ] Context7 MCP kết nối thành công (mcp__context7__resolve-library-id)
- [ ] WebSearch khả dụng cho nghiên cứu
</guards>

<context>
Tên milestone: $ARGUMENTS (tùy chọn -- sẽ hỏi nếu không có)

Phân tích tham số:
- `--reset-phase-numbers` -> đánh số phase từ 1 (thay vì tiếp nối milestone trước)
- Phần còn lại = tên milestone hoặc mô tả mục tiêu

Đọc thêm:
- `.planning/PROJECT.md` (nếu có -- lịch sử milestones trước)
- `.planning/rules/general.md` -> ngôn ngữ, ngày tháng, quy cách phiên bản, biểu tượng
</context>

<execution_context>
@workflows/new-milestone.md (required)
@templates/project.md (required)
@templates/requirements.md (required)
@templates/roadmap.md (required)
@templates/state.md (required)
@templates/current-milestone.md (required)
@references/questioning.md (optional)
@references/conventions.md (optional)
@references/ui-brand.md (optional)
@references/prioritization.md (optional)
@references/state-machine.md (optional)
</execution_context>

<process>
Thực thi quy trình từ @workflows/new-milestone.md từ đầu đến cuối.
Giữ nguyên tất cả các cổng kiểm tra (quét dự án, yêu cầu, nghiên cứu, duyệt yêu cầu, duyệt lộ trình, commit).
</process>

<output>
**Tạo/Cập nhật:**
- `.planning/PROJECT.md` -- tầm nhìn dự án + lịch sử milestones
- `.planning/REQUIREMENTS.md` -- danh sách yêu cầu có mã định danh + bảng theo dõi
- `.planning/ROADMAP.md` -- lộ trình các phase
- `.planning/STATE.md` -- trạng thái làm việc (đặt lại cho milestone mới)
- `.planning/CURRENT_MILESTONE.md` -- theo dõi milestone đang chạy
- `.planning/research/` -- nghiên cứu lĩnh vực (tùy chọn, chỉ cho tính năng mới)

**Bước tiếp theo:** `/pd:plan` để bắt đầu triển khai phase đầu tiên

**Thành công khi:**
- ROADMAP.md có đầy đủ phases với mô tả rõ ràng
- REQUIREMENTS.md có mã định danh cho mỗi yêu cầu
- STATE.md được khởi tạo cho milestone mới

**Lỗi thường gặp:**
- Thiếu CONTEXT.md -> chạy `/pd:init` trước
- Rules bị thiếu -> chạy `/pd:init` để tạo lại
- Tên milestone trùng -> đổi tên hoặc dùng version khác
</output>

<rules>
- Mọi output PHẢI bằng tiếng Việt có dấu
- PHẢI hỏi user duyệt requirements trước khi tạo roadmap
- PHẢI hỏi user duyệt roadmap trước khi commit
- Nghiên cứu chỉ bắt buộc cho tính năng mới -- bỏ qua cho refactor/bugfix milestones
</rules>
