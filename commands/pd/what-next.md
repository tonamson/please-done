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
Quét .planning/ -> xác định công việc dở/bước tiếp -> hiển thị tiến trình + gợi ý command.
CHỈ ĐỌC, KHÔNG sửa file, KHÔNG gọi FastCode MCP.
</objective>

<guards>
DUNG va huong dan user neu bat ky dieu kien nao that bai:

- [ ] Thu muc `.planning/` ton tai -> "Chua khoi tao du an. Chay `/pd:init` truoc."
</guards>

<context>
User input: $ARGUMENTS (khong can)
KHÔNG cần rules hay FastCode MCP -- chỉ đọc planning files.
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
**Tao/Cap nhat:**
- Khong tao/sua file (chi doc)

**Buoc tiep theo:** Command goi y dua tren trang thai

**Thanh cong khi:**
- Hien thi tien trinh ro rang
- Goi y dung command dua tren trang thai

**Loi thuong gap:**
- .planning/ khong ton tai -> chay `/pd:init`
- STATE.md thieu/hong -> chay `/pd:new-milestone` de tao lai
</output>

<rules>
- Moi output PHAI bang tieng Viet co dau
- CHI DOC -- KHONG sua bat ky file nao
- KHONG goi FastCode MCP hoac Context7 MCP
- Goi y command PHAI dua tren trang thai thuc te, khong doan
</rules>
