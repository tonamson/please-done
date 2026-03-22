---
name: pd:conventions
description: "Phân tích dự án và tạo CLAUDE.md chứa quy ước code riêng (phong cách code, đặt tên, patterns)"
model: sonnet
argument-hint: "(khong can tham so)"
allowed-tools:
  - Read
  - Write
  - Edit
  - Bash
  - Glob
  - Grep
  - AskUserQuestion
---

<objective>
Phân tích dự án hiện tại, phát hiện coding conventions, hỏi user về ưu tiên cá nhân, và tạo/cập nhật file CLAUDE.md.
</objective>

<guards>
Khong co dieu kien tien quyet nghiem ngat. Skill nay co the chay bat ky luc nao.

- [ ] Thu muc du an co source code -> "Thu muc trong hoac khong co source code de phan tich."
</guards>

<context>
User input: $ARGUMENTS
</context>

<execution_context>
@workflows/conventions.md (required)
@references/conventions.md (optional)
</execution_context>

<process>
Thực thi quy trình từ @workflows/conventions.md từ đầu đến cuối.
</process>

<output>
**Tao/Cap nhat:**
- `CLAUDE.md` -- quy uoc code cua du an

**Buoc tiep theo:** Tiep tuc phat trien voi `/pd:plan` hoac `/pd:write-code`

**Thanh cong khi:**
- CLAUDE.md bao gom: naming conventions, code style, patterns
- User da xac nhan noi dung

**Loi thuong gap:**
- Du an khong co source code -> khong the phan tich conventions
- User khong dong y voi conventions -> cho phep chinh sua thu cong
</output>

<rules>
- Moi output PHAI bang tieng Viet co dau
- PHAI hoi user ve uu tien ca nhan truoc khi tao CLAUDE.md
- CLAUDE.md PHAI phan anh thuc te code hien tai, khong ap dat quy uoc moi
</rules>
