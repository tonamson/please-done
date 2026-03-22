---
name: pd:init
description: Khởi tạo môi trường làm việc, kiểm tra MCP FastCode, tạo ngữ cảnh gọn cho các skill sau
model: haiku
argument-hint: "[path dự án, mặc định thư mục hiện tại]"
allowed-tools:
  - Read
  - Write
  - Bash
  - Glob
  - Grep
  - AskUserQuestion
  - mcp__fastcode__list_indexed_repos
  - mcp__fastcode__code_qa
---

<objective>
Skill chạy đầu tiên. Kiểm tra FastCode MCP (BẮT BUỘC), index dự án, phát hiện tech stack, tạo `CONTEXT.md` và sao chép các rule phù hợp.
</objective>

<guards>
Dừng và hướng dẫn người dùng nếu bất kỳ điều kiện nào sau đây thất bại:

@references/guard-valid-path.md
@references/guard-fastcode.md
</guards>

<context>
Người dùng nhập: $ARGUMENTS (đường dẫn dự án, mặc định là thư mục hiện tại)

Mẫu quy tắc: `.pdconfig` -> `SKILLS_DIR` -> các file tại `[SKILLS_DIR]/commands/pd/rules/`:
- `general.md` -- luôn sao chép
- `nestjs.md` / `nextjs.md` / `wordpress.md` / `solidity.md` / `flutter.md` -- sao chép nếu phát hiện stack tương ứng
</context>

<execution_context>
@workflows/init.md (required)
</execution_context>

<process>
Thực thi @workflows/init.md từ đầu đến cuối.
</process>

<output>
**Tạo/Cập nhật:**
- `.planning/CONTEXT.md` -- ngữ cảnh dự án
- `.planning/rules/*.md` -- quy tắc theo framework tương ứng

**Bước tiếp theo:** `/pd:scan` hoặc `/pd:plan`

**Thành công khi:**
- `CONTEXT.md` có đầy đủ thông tin về tech stack
- FastCode MCP xác nhận đã kết nối

**Lỗi thường gặp:**
- FastCode MCP không kết nối -> kiểm tra Docker đang chạy
- Không phát hiện được tech stack -> người dùng bổ sung thủ công
</output>

<rules>
- Mọi output PHẢI bằng tiếng Việt có dấu
- PHẢI xác nhận FastCode MCP đã kết nối trước khi thực hiện bất kỳ bước nào
- KHÔNG được thay đổi file ngoài `.planning/`
</rules>
