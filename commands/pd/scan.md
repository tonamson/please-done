---
name: pd:scan
description: Quét toàn bộ dự án, phân tích cấu trúc, thư viện, bảo mật và tạo báo cáo
model: haiku
argument-hint: "[path dự án, mặc định thư mục hiện tại]"
allowed-tools:
  - Read
  - Write
  - Edit
  - Bash
  - Glob
  - Grep
  - mcp__fastcode__code_qa
---

<objective>
Quét dự án: phân tích cấu trúc code, dependency, kiến trúc và bảo mật để tạo báo cáo.
</objective>

<guards>
Dừng và hướng dẫn người dùng nếu bất kỳ điều kiện nào sau đây thất bại:

@references/guard-context.md
@references/guard-valid-path.md
@references/guard-fastcode.md
</guards>

<context>
Người dùng nhập: $ARGUMENTS
Đọc `.planning/CONTEXT.md` (từ /pd:init). KHÔNG cần rules -- chỉ quét + báo cáo.
</context>

<execution_context>
@workflows/scan.md (required)
</execution_context>

<process>
Thực thi @workflows/scan.md từ đầu đến cuối.
</process>

<output>
**Tạo/Cập nhật:**
- Báo cáo phân tích dự án trên màn hình
- Cập nhật `.planning/CONTEXT.md`

**Bước tiếp theo:** `/pd:plan` hoặc `/pd:new-milestone`

**Thành công khi:**
- Phân tích đầy đủ cấu trúc, dependency và kiến trúc
- Có báo cáo bảo mật nếu phát hiện vấn đề
- `CONTEXT.md` đã được cập nhật

**Lỗi thường gặp:**
- FastCode MCP không kết nối -> kiểm tra Docker đang chạy
- Dự án quá lớn -> giới hạn phạm vi quét theo thư mục
</output>

<rules>
- Mọi output PHẢI bằng tiếng Việt có dấu
- Chỉ đọc và phân tích, KHÔNG được thay đổi source code của dự án
- Báo cáo phải bao gồm: cấu trúc, dependency, kiến trúc và bảo mật
</rules>
