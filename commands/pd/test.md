---
name: pd:test
description: Viết test + kiểm thử (NestJS/WordPress/Solidity/Flutter/Frontend), xác nhận với user, báo cáo lỗi
model: sonnet
argument-hint: "[task number | --all]"
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
Viết test theo stack (Jest/PHPUnit/Hardhat-Foundry/flutter_test). Frontend-only: danh sách kiểm thử thủ công + xác nhận.
Test với dữ liệu cụ thể, chạy kiểm thử, để người dùng xác nhận rồi commit.

**Sau khi xong:** `/pd:write-code`, `/pd:fix-bug`, hoặc `/pd:complete-milestone`
</objective>

<guards>
Dừng và hướng dẫn người dùng nếu bất kỳ điều kiện nào sau đây thất bại:

@references/guard-context.md
- [ ] Task number hợp lệ hoặc có cờ `--all` -> "Cung cấp số task hoặc dùng `--all`."
@references/guard-fastcode.md
@references/guard-context7.md
- [ ] Có ít nhất 1 task ở trạng thái `done` -> "Chưa có task nào hoàn thành. Chạy `/pd:write-code` trước."
</guards>

<context>
Người dùng nhập: $ARGUMENTS
- Task number -> test riêng task đó (phải done)
- `--all` -> regression toàn bộ phases
- Không có gì -> test tất cả tasks done trong phase hiện tại

Đọc thêm:
- `.planning/rules/general.md` -> quy tắc chung
- `.planning/rules/{nestjs,wordpress,solidity,flutter}.md` -> Build & Lint (CHỈ nếu tồn tại)
</context>

<execution_context>
@workflows/test.md (required)
@references/conventions.md (required)
@references/context7-pipeline.md (optional)
</execution_context>

<process>
Thực thi @workflows/test.md từ đầu đến cuối.
</process>

<output>
**Tạo/Cập nhật:**
- File test theo từng stack (Jest, PHPUnit, Hardhat, `flutter_test`)
- Danh sách kiểm thử thủ công cho frontend-only
- Cập nhật `TASKS.md`

**Bước tiếp theo:** `/pd:write-code`, `/pd:fix-bug`, hoặc `/pd:complete-milestone`

**Thành công khi:**
- File test đã được tạo và chạy thành công
- Người dùng xác nhận kết quả
- Phần test đã được commit

**Lỗi thường gặp:**
- Test fail -> đọc lỗi, sửa test hoặc code rồi chạy lại
- Không tìm thấy test framework -> kiểm tra `package.json` và cấu hình
- MCP không kết nối -> kiểm tra Docker và cấu hình
</output>

<rules>
- Mọi output PHẢI bằng tiếng Việt có dấu
- Test PHẢI dùng dữ liệu đầu vào cụ thể, không dùng mock chung chung
- PHẢI chạy test và xác nhận pass trước khi commit
- PHẢI yêu cầu người dùng xác nhận trước khi hoàn tất
</rules>
