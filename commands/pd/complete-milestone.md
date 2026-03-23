---
name: pd:complete-milestone
description: Hoàn tất milestone, commit, tạo git tag, báo cáo tổng kết
model: sonnet
argument-hint: "(không cần tham số)"
allowed-tools:
  - Read
  - Write
  - Edit
  - Bash
  - Glob
  - Grep
  - AskUserQuestion
---

<objective>
Kiểm tra các lỗi đã đóng, tạo báo cáo tổng kết, commit, tạo git tag, cập nhật theo dõi và chuyển sang milestone tiếp theo.
Chỉ cho phép hoàn tất khi tất cả công việc đã hoàn thành và mọi lỗi đã được xử lý.
</objective>

<guards>
Dừng và hướng dẫn người dùng nếu bất kỳ điều kiện nào sau đây thất bại:

@references/guard-context.md
- [ ] Tất cả task trong milestone có trạng thái hoàn thành -> "Còn task chưa xong. Hãy hoàn thành trước khi đóng milestone."
- [ ] Không còn lỗi mở chưa được xử lý -> "Còn lỗi chưa xử lý. Chạy `/pd:fix-bug` để sửa trước."
</guards>

<context>
Người dùng nhập: $ARGUMENTS (không dùng, vì version tự động lấy từ CURRENT_MILESTONE.md)

Đọc thêm:
- `.planning/PROJECT.md` -> cập nhật lịch sử milestones
- `.planning/rules/general.md` -> ngôn ngữ, ngày tháng, định dạng version/commit
</context>

<execution_context>
@workflows/complete-milestone.md (required)
@references/conventions.md (required)
@references/state-machine.md (optional)
@references/ui-brand.md (optional)
@references/verification-patterns.md (optional)
@templates/current-milestone.md (optional)
@templates/state.md (optional)
@templates/verification-report.md (optional)
</execution_context>

<process>
Thực thi @workflows/complete-milestone.md từ đầu đến cuối.
</process>

<output>
**Tạo/Cập nhật:**
- Báo cáo tổng kết milestone
- Git tag cho phiên bản
- `.planning/PROJECT.md` -- cập nhật lịch sử milestone
- `.planning/STATE.md` -- đặt lại cho milestone tiếp theo
- `.planning/CURRENT_MILESTONE.md` -- đánh dấu hoàn thành

**Bước tiếp theo:** `/pd:scan` hoặc `/pd:new-milestone`

**Thành công khi:**
- Tất cả task đã hoàn thành, không còn lỗi mở
- Git tag đúng phiên bản
- PROJECT.md đã cập nhật kết quả milestone

**Lỗi thường gặp:**
- Còn task chưa xong -> hoàn thành trước
- Git conflict -> giải quyết thủ công
- Còn lỗi mở -> chạy `/pd:fix-bug` trước
</output>

<rules>
- Mọi output PHẢI bằng tiếng Việt có dấu
- KHÔNG đóng milestone nếu còn task chưa hoàn thành
- KHÔNG đóng milestone nếu còn lỗi mở
- PHẢI tạo git tag sau khi commit thành công
- PHẢI hỏi người dùng xác nhận trước khi đóng milestone
</rules>
