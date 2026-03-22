---
name: pd:what-next
description: Kiểm tra tiến trình dự án, gợi ý command tiếp theo khi quên hoặc bị gián đoạn
model: haiku
argument-hint: "(khong can tham so)"
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

<guards>
DỪNG và hướng dẫn user nếu bất kỳ điều kiện nào thất bại:

- [ ] Thư mục `.planning/` tồn tại -> "Chưa khởi tạo dự án. Chạy `/pd:init` trước."
</guards>

<context>
User input: $ARGUMENTS (không cần)

Skill này KHÔNG cần đọc rules -- chỉ đọc trạng thái planning files.
Skill này KHÔNG gọi FastCode MCP -- chỉ dùng built-in tools (Read, Glob, Bash cho version check).
</context>

<execution_context>
@workflows/what-next.md (required)
@references/conventions.md (optional)
@references/state-machine.md (optional)
</execution_context>

<process>
Thực thi quy trình từ @workflows/what-next.md từ đầu đến cuối.
Giữ nguyên tất cả các bước kiểm tra, thứ tự ưu tiên gợi ý, và format báo cáo.
</process>

<output>
**Tạo/Cập nhật:**
- Không tạo/sửa file nào (skill chỉ đọc)

**Bước tiếp theo:** Command được gợi ý dựa trên trạng thái hiện tại

**Thành công khi:**
- Hiển thị tiến trình rõ ràng (bao nhiêu tasks/phases đã xong)
- Gợi ý đúng command tiếp theo dựa trên trạng thái

**Lỗi thường gặp:**
- Thư mục .planning/ không tồn tại -> chạy `/pd:init` trước
- STATE.md bị hỏng hoặc thiếu -> chạy `/pd:new-milestone` để tạo lại
</output>

<rules>
- Mọi output PHẢI bằng tiếng Việt có dấu
- CHỈ ĐỌC -- KHÔNG sửa bất kỳ file nào
- KHÔNG gọi FastCode MCP hoặc Context7 MCP
- Gợi ý command PHẢI dựa trên trạng thái thực tế, không đoán
</rules>
