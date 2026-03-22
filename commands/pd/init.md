---
name: pd:init
description: Khởi tạo môi trường làm việc, kiểm tra MCP FastCode, tạo context gọn cho các skill sau
model: haiku
argument-hint: "[path dự án, mặc định thư mục hiện tại]"
allowed-tools:
  - Read
  - Write
  - Bash
  - Glob
  - Grep
  - AskUserQuestion
  - mcp__fastcode__list_indexed_repos
  - mcp__fastcode__code_qa
---

<objective>
Skill chạy đầu tiên. Kiểm tra FastCode MCP (BẮT BUỘC), index dự án, phát hiện tech stack, tạo CONTEXT.md + copy rules phù hợp.
</objective>

<guards>
DUNG va huong dan user neu bat ky dieu kien nao that bai:

@references/guard-valid-path.md
@references/guard-fastcode.md
</guards>

<context>
User input: $ARGUMENTS (path dự án, mặc định thư mục hiện tại)

Rules templates: `.pdconfig` -> `SKILLS_DIR` -> rules tại `[SKILLS_DIR]/commands/pd/rules/`:
- `general.md` -- luôn copy
- `nestjs.md` / `nextjs.md` / `wordpress.md` / `solidity.md` / `flutter.md` -- copy nếu phát hiện stack tương ứng
</context>

<execution_context>
@workflows/init.md (required)
</execution_context>

<process>
Thực thi @workflows/init.md từ đầu đến cuối.
</process>

<output>
**Tao/Cap nhat:**
- `.planning/CONTEXT.md` -- project context
- `.planning/rules/*.md` -- framework rules (conditional)

**Buoc tiep theo:** `/pd:scan` hoac `/pd:plan`

**Thanh cong khi:**
- CONTEXT.md day du thong tin tech stack
- FastCode MCP xac nhan ket noi

**Loi thuong gap:**
- FastCode MCP khong ket noi -> kiem tra Docker dang chay
- Khong phat hien tech stack -> user them thong tin thu cong
</output>

<rules>
- Moi output PHAI bang tieng Viet co dau
- PHAI xac nhan FastCode MCP ket noi truoc khi thuc hien bat ky buoc nao
- KHONG duoc thay doi file ngoai .planning/
</rules>
