---
name: pd:conventions
description: "Phân tích dự án và tạo CLAUDE.md chứa quy ước code riêng (phong cách code, đặt tên, patterns)"
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
Phân tích dự án, phát hiện quy ước code, hỏi ưu tiên của người dùng, rồi tạo hoặc cập nhật `CLAUDE.md`.
</objective>

<guards>
Không có điều kiện tiên quyết nghiêm ngặt. Skill này có thể chạy bất kỳ lúc nào.

- [ ] Thư mục dự án có source code -> "Thư mục trống hoặc không có source code để phân tích."
</guards>

<context>
Người dùng nhập: $ARGUMENTS
</context>

<execution_context>
@workflows/conventions.md (required)
@references/conventions.md (required)
</execution_context>

<process>
Thực thi @workflows/conventions.md từ đầu đến cuối.
</process>

<output>
**Tạo/Cập nhật:**
- `CLAUDE.md` -- quy ước code của dự án

**Bước tiếp theo:** `/pd:plan` hoặc `/pd:write-code`

**Thành công khi:**
- `CLAUDE.md` bao gồm quy ước đặt tên, phong cách code và pattern đang dùng
- Người dùng xác nhận nội dung

**Lỗi thường gặp:**
- Dự án không có source code -> không thể phân tích
- Người dùng không đồng ý -> cho phép chỉnh sửa thủ công
</output>

<rules>
- Mọi output PHẢI bằng tiếng Việt có dấu
- PHẢI hỏi người dùng về ưu tiên cá nhân trước khi tạo `CLAUDE.md`
- `CLAUDE.md` PHẢI phản ánh thực tế code hiện tại, không áp đặt quy ước mới
</rules>
