---
name: pd:fix-bug
description: Tìm và sửa lỗi theo phương pháp khoa học, tìm hiểu, báo cáo, sửa code, commit [LỖI] và xác nhận cho đến khi thành công
model: sonnet
argument-hint: "[mô tả lỗi hoặc tên phiên điều tra]"
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
Sửa lỗi theo quy trình rõ ràng: triệu chứng -> phân loại rủi ro -> giả thuyết -> kiểm chứng -> cổng kiểm tra -> sửa -> xác nhận.
Lưu trạng thái điều tra vào `.planning/debug/` để có thể phục hồi khi mất phiên.
Lặp lại cho đến khi người dùng xác nhận. Tạo patch version cho milestone đã hoàn tất.

**Sau khi xong:** `/pd:what-next`
</objective>

<guards>
Dừng và hướng dẫn người dùng nếu bất kỳ điều kiện nào sau đây thất bại:

@references/guard-context.md
- [ ] Có mô tả lỗi được cung cấp -> "Hãy cung cấp mô tả lỗi hoặc tên phiên điều tra."
@references/guard-fastcode.md
@references/guard-context7.md
</guards>

<context>
Người dùng nhập: $ARGUMENTS

Đọc thêm:
- `.planning/rules/general.md` -> quy tắc chung
- `.planning/rules/{nestjs,nextjs,wordpress,solidity,flutter}.md` -> theo loại lỗi (CHỈ nếu tồn tại)
</context>

<execution_context>
@workflows/fix-bug.md (required)
@references/conventions.md (required)
@references/prioritization.md (optional)
</execution_context>

<process>
Thực thi @workflows/fix-bug.md từ đầu đến cuối.
</process>

<output>
**Tạo/Cập nhật:**
- Source code đã sửa lỗi
- `.planning/debug/` -- trạng thái phiên điều tra
- Cập nhật `TASKS.md` nếu liên quan

**Bước tiếp theo:** `/pd:what-next`

**Thành công khi:**
- Người dùng xác nhận đã sửa thành công
- Các test liên quan chạy thành công nếu có
- Commit `[LỖI]` đã được tạo

**Lỗi thường gặp:**
- Không tái hiện được lỗi -> yêu cầu người dùng cung cấp thêm thông tin
- Lỗi nằm ở dependency -> cập nhật package, kiểm tra phiên bản
- MCP không kết nối -> kiểm tra Docker và cấu hình
</output>

<rules>
- Mọi output PHẢI bằng tiếng Việt có dấu
- PHẢI lưu trạng thái điều tra vào `.planning/debug/` để phục hồi
- PHẢI qua cổng kiểm tra (gate check) trước khi sửa code
- PHẢI lặp lại vòng lặp cho đến khi người dùng xác nhận thành công
- KHÔNG được sửa code không liên quan đến lỗi
</rules>
