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
Skill đầu tiên phải chạy trước mọi skill khác. Kiểm tra FastCode MCP (BẮT BUỘC kết nối thành công), index dự án, phát hiện tech stack, tạo CONTEXT.md + copy rules phù hợp vào .planning/rules/.
</objective>

<guards>
DUNG va huong dan user neu bat ky dieu kien nao that bai:

- [ ] Tham so path hop le (neu co) -> "Path khong ton tai hoac khong phai thu muc."
- [ ] FastCode MCP ket noi thanh cong -> "Kiem tra Docker dang chay va FastCode MCP da duoc cau hinh."
</guards>

<context>
User input: $ARGUMENTS (path dự án, mặc định thư mục hiện tại)

Rules templates: đọc `.pdconfig` → lấy `SKILLS_DIR` → rules nằm tại `[SKILLS_DIR]/commands/pd/rules/`:
- `general.md` — quy tắc chung (luôn copy)
- `nestjs.md` — quy tắc NestJS (chỉ copy nếu có NestJS)
- `nextjs.md` — quy tắc NextJS (chỉ copy nếu có NextJS)
- `wordpress.md` — quy tắc WordPress (chỉ copy nếu có WordPress)
- `solidity.md` — quy tắc Solidity smart contract (chỉ copy nếu có Solidity)
- `flutter.md` — quy tắc Flutter/Dart (chỉ copy nếu có Flutter)
</context>

<execution_context>
@workflows/init.md (required)
</execution_context>

<process>
Thực thi quy trình từ @workflows/init.md từ đầu đến cuối.
Giữ nguyên tất cả các bước kiểm tra, phát hiện tech stack, copy rules, và tạo CONTEXT.md.
</process>

<output>
**Tao/Cap nhat:**
- `.planning/CONTEXT.md` -- project context
- `.planning/rules/*.md` -- framework rules (conditional)

**Buoc tiep theo:** `/pd:scan` hoac `/pd:plan`

**Thanh cong khi:**
- CONTEXT.md co day du thong tin tech stack
- FastCode MCP da xac nhan ket noi

**Loi thuong gap:**
- FastCode MCP khong ket noi -> kiem tra Docker dang chay
- Khong phat hien tech stack -> user can them thong tin thu cong
</output>

<rules>
- Moi output PHAI bang tieng Viet co dau
- PHAI xac nhan FastCode MCP ket noi truoc khi thuc hien bat ky buoc nao
- KHONG duoc thay doi file ngoai .planning/
</rules>
