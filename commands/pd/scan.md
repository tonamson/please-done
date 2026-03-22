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
Quét dự án: phân tích cấu trúc code, dependencies, kiến trúc, bảo mật -> tạo báo cáo.
</objective>

<guards>
DUNG va huong dan user neu bat ky dieu kien nao that bai:

@references/guard-context.md
@references/guard-valid-path.md
@references/guard-fastcode.md
</guards>

<context>
User input: $ARGUMENTS
Đọc `.planning/CONTEXT.md` (từ /pd:init). KHÔNG cần rules -- chỉ quét + báo cáo.
</context>

<execution_context>
@workflows/scan.md (required)
</execution_context>

<process>
Thực thi @workflows/scan.md từ đầu đến cuối.
</process>

<output>
**Tao/Cap nhat:**
- Bao cao phan tich du an (man hinh)
- Cap nhat `.planning/CONTEXT.md`

**Buoc tiep theo:** `/pd:plan` hoac `/pd:new-milestone`

**Thanh cong khi:**
- Phan tich day du cau truc, dependencies, kien truc
- Bao cao bao mat (neu co van de)
- CONTEXT.md cap nhat

**Loi thuong gap:**
- FastCode MCP khong ket noi -> kiem tra Docker dang chay
- Du an qua lon -> gioi han pham vi quet theo thu muc
</output>

<rules>
- Moi output PHAI bang tieng Viet co dau
- Chi doc va phan tich -- KHONG duoc thay doi source code cua du an
- Bao cao phai bao gom: cau truc, dependencies, kien truc, bao mat
</rules>
