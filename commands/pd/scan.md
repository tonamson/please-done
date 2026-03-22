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

<guards>
DUNG va huong dan user neu bat ky dieu kien nao that bai:

- [ ] `.planning/CONTEXT.md` ton tai -> "Chay `/pd:init` truoc."
- [ ] Tham so path hop le (neu co) -> "Path khong ton tai hoac khong phai thu muc."
- [ ] FastCode MCP ket noi thanh cong -> "Kiem tra Docker dang chay va FastCode MCP da duoc cau hinh."
</guards>

<context>
User input: $ARGUMENTS

Đọc `.planning/CONTEXT.md` (đã tạo bởi /pd:init).
(Scan KHÔNG cần đọc rules files — chỉ quét và báo cáo, không viết code.)
</context>

<execution_context>
@workflows/scan.md (required)
</execution_context>

<process>
Thực thi quy trình từ @workflows/scan.md từ đầu đến cuối.
Giữ nguyên tất cả các bước quét, phân tích, báo cáo, và cập nhật CONTEXT.md.
</process>

<output>
**Tao/Cap nhat:**
- Bao cao phan tich du an (in ra man hinh)
- Cap nhat `.planning/CONTEXT.md` voi thong tin moi

**Buoc tiep theo:** `/pd:plan` hoac `/pd:new-milestone`

**Thanh cong khi:**
- Phan tich day du cau truc code, dependencies, kien truc
- Bao cao bao mat duoc tao (neu co van de)
- CONTEXT.md duoc cap nhat

**Loi thuong gap:**
- FastCode MCP khong ket noi -> kiem tra Docker dang chay
- Du an qua lon -> gioi han pham vi quet theo thu muc
</output>

<rules>
- Moi output PHAI bang tieng Viet co dau
- Chi doc va phan tich -- KHONG duoc thay doi source code cua du an
- Bao cao phai bao gom: cau truc, dependencies, kien truc, bao mat
</rules>
