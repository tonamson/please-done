---
name: pd:what-next
description: Kiểm tra tiến trình dự án, gợi ý command tiếp theo khi quên hoặc bị gián đoạn
model: haiku
allowed-tools:
  - Read
  - Glob
  - Grep
  - Bash
---

<objective>
Quét trạng thái toàn bộ .planning/ để xác định công việc đang dở hoặc bước tiếp theo. Hiển thị tiến trình + gợi ý chính xác command cần chạy.
Skill này CHỈ ĐỌC, KHÔNG sửa file, KHÔNG gọi FastCode MCP.
</objective>

<execution_context>
@workflows/what-next.md
@references/conventions.md
@references/state-machine.md
</execution_context>

<context>
User input: $ARGUMENTS (không cần)

Skill này KHÔNG cần đọc rules — chỉ đọc trạng thái planning files.
Skill này KHÔNG gọi FastCode MCP — chỉ dùng built-in tools (Read, Glob, Bash cho version check).
</context>

<process>
Thực thi quy trình từ @workflows/what-next.md từ đầu đến cuối.
Giữ nguyên tất cả các bước kiểm tra, thứ tự ưu tiên gợi ý, và format báo cáo.
</process>
