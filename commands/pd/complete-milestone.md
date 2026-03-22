---
name: pd:complete-milestone
description: Hoàn tất milestone, commit, tạo git tag, báo cáo tổng kết
model: sonnet
argument-hint: "(khong can tham so)"
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
Kiểm tra bugs đã đóng, tạo báo cáo tổng kết, commit, tạo git tag, cập nhật tracking files, chuyển milestone tiếp theo.
Chỉ cho phép đóng khi tất cả tasks đã hoàn thành và bugs đã giải quyết.
</objective>

<guards>
DUNG va huong dan user neu bat ky dieu kien nao that bai:

@references/guard-context.md
- [ ] Tat ca tasks trong milestone co status hoan thanh -> "Con tasks chua xong. Hoan thanh truoc khi dong milestone."
- [ ] Khong co bugs mo chua giai quyet -> "Con bugs mo. Chay `/pd:fix-bug` de sua truoc."
</guards>

<context>
User input: $ARGUMENTS (không dùng - version tự động từ CURRENT_MILESTONE.md)

Đọc thêm:
- `.planning/PROJECT.md` (nếu có) -> cập nhật lịch sử milestones khi đóng
- `.planning/rules/general.md` -> ngôn ngữ, ngày tháng, version format, commit message format
</context>

<execution_context>
@workflows/complete-milestone.md (required)
@references/conventions.md (optional)
@references/state-machine.md (optional)
@references/ui-brand.md (optional)
@references/verification-patterns.md (optional)
@templates/current-milestone.md (optional)
@templates/state.md (optional)
</execution_context>

<process>
Thực thi quy trình từ @workflows/complete-milestone.md từ đầu đến cuối.
Giữ nguyên tất cả các bước, cross-checks, cổng kiểm tra bugs, và git operations.
</process>

<output>
**Tạo/Cập nhật:**
- Báo cáo tổng kết milestone
- Git tag cho version
- `.planning/PROJECT.md` -- cập nhật lịch sử milestones
- `.planning/STATE.md` -- đặt lại cho milestone tiếp theo
- `.planning/CURRENT_MILESTONE.md` -- đánh dấu hoàn thành

**Bước tiếp theo:** `/pd:scan` để cập nhật báo cáo kiến trúc, hoặc `/pd:new-milestone` cho milestone tiếp

**Thành công khi:**
- Tất cả tasks hoàn thành, không còn bugs mở
- Git tag được tạo đúng version
- PROJECT.md được cập nhật với kết quả milestone

**Lỗi thường gặp:**
- Còn tasks chưa xong -> hoàn thành tasks trước
- Git conflict khi commit -> giải quyết conflict thủ công
- Bugs mở chưa giải quyết -> chạy `/pd:fix-bug` trước
</output>

<rules>
- Mọi output PHẢI bằng tiếng Việt có dấu
- KHÔNG đóng milestone nếu còn tasks chưa hoàn thành
- KHÔNG đóng milestone nếu còn bugs mở
- PHẢI tạo git tag sau khi commit thành công
- PHẢI hỏi user xác nhận trước khi đóng milestone
</rules>
