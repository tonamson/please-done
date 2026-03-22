---
name: pd:what-next
description: Kiểm tra tiến trình dự án, gợi ý lệnh tiếp theo khi quên hoặc bị gián đoạn
model: haiku
argument-hint: "(không cần tham số)"
allowed-tools:
  - Read
  - Glob
  - Grep
  - Bash
---

<objective>
Quét `.planning/` để xác định công việc còn dở và bước tiếp theo, rồi hiển thị tiến trình cùng lệnh gợi ý.
CHỈ ĐỌC, KHÔNG sửa file, KHÔNG gọi FastCode MCP.
</objective>

<guards>
Dừng và hướng dẫn người dùng nếu bất kỳ điều kiện nào sau đây thất bại:

- [ ] Thư mục `.planning/` tồn tại -> "Chưa khởi tạo dự án. Chạy `/pd:init` trước."
</guards>

<context>
Người dùng nhập: $ARGUMENTS (không có tham số)
KHÔNG cần rule hay FastCode MCP -- chỉ đọc các file planning.
</context>

<execution_context>
@workflows/what-next.md (required)
@references/conventions.md (required)
@references/state-machine.md (optional)
</execution_context>

<process>
Thực thi @workflows/what-next.md từ đầu đến cuối.
</process>

<output>
**Tạo/Cập nhật:**
- Không tạo hoặc sửa file nào, chỉ đọc

**Bước tiếp theo:** Lệnh gợi ý dựa trên trạng thái thực tế

**Thành công khi:**
- Hiển thị tiến trình rõ ràng
- Gợi ý đúng lệnh dựa trên trạng thái hiện tại

**Lỗi thường gặp:**
- `.planning/` không tồn tại -> chạy `/pd:init`
- `STATE.md` thiếu hoặc hỏng -> chạy `/pd:new-milestone` để tạo lại
</output>

<rules>
- Mọi output PHẢI bằng tiếng Việt có dấu
- CHỈ ĐỌC, KHÔNG sửa bất kỳ file nào
- KHÔNG gọi FastCode MCP hoặc Context7 MCP
- Lệnh gợi ý PHẢI dựa trên trạng thái thực tế, không đoán
</rules>
