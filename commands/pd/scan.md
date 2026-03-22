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
Quét toàn bộ dự án, phân tích cấu trúc code, dependencies, kiến trúc, kiểm tra bảo mật và tạo báo cáo.
</objective>

<execution_context>
@workflows/scan.md
</execution_context>

<context>
User input: $ARGUMENTS

Đọc `.planning/CONTEXT.md` (đã tạo bởi /pd:init).
Nếu chưa có CONTEXT.md → thông báo chạy `/pd:init` trước.
(Scan KHÔNG cần đọc rules files — chỉ quét và báo cáo, không viết code.)
</context>

<process>
Thực thi quy trình từ @workflows/scan.md từ đầu đến cuối.
Giữ nguyên tất cả các bước quét, phân tích, báo cáo, và cập nhật CONTEXT.md.
</process>
