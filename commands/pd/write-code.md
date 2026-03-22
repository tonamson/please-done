---
name: pd:write-code
description: Viết code theo task đã plan trong TASKS.md, lint, build, commit và báo cáo (yêu cầu có PLAN.md + TASKS.md trước)
model: sonnet
argument-hint: "[task number] [--auto | --parallel]"
allowed-tools:
  - Read
  - Write
  - Edit
  - Bash
  - Glob
  - Grep
  - Agent
  - AskUserQuestion
  - mcp__fastcode__code_qa
  - mcp__context7__resolve-library-id
  - mcp__context7__query-docs
---

<objective>
Viết code theo task từ PLAN.md/TASKS.md, tuân thủ coding style trong `.planning/rules/`, chạy lint + build, commit và tạo báo cáo.

**Chế độ:**
- Mặc định: làm 1 task, dừng hỏi user
- `--auto`: làm tất cả tasks còn lại tuần tự, không hỏi giữa chừng
- `--parallel`: phân tích dependency, nhóm wave, chạy song song tasks độc lập bằng multi-agent

**Khôi phục:** Nếu bị gián đoạn (mất mạng, đóng phiên), tự phát hiện tiến trình đã làm qua PROGRESS.md + kiểm tra đĩa/git, tiếp tục từ chỗ dừng thay vì viết lại từ đầu.

**Sau khi xong:** `/pd:test`, `/pd:plan [phase tiếp]`, hoặc `/pd:complete-milestone`.
</objective>

<guards>
DUNG va huong dan user neu bat ky dieu kien nao that bai:

- [ ] `.planning/CONTEXT.md` ton tai -> "Chay `/pd:init` truoc."
- [ ] Task number hop le hoac co flag --auto/--parallel -> "Cung cap so task hoac flag che do."
- [ ] PLAN.md + TASKS.md ton tai cho phase hien tai -> "Chay `/pd:plan` truoc de tao plan."
- [ ] FastCode MCP ket noi thanh cong -> "Kiem tra Docker dang chay va FastCode MCP da duoc cau hinh."
- [ ] Context7 MCP ket noi thanh cong -> "Kiem tra Context7 MCP da duoc cau hinh."
</guards>

<context>
User input: $ARGUMENTS
- Task number (VD: `3`) → làm task cụ thể
- `--auto` → làm tất cả tasks còn lại tuần tự
- `--parallel` → chạy song song tasks độc lập
- Kết hợp: `3 --auto`, `3 --parallel`
- Không có gì → pick task tiếp theo ⬜, làm xong 1 task thì DỪNG hỏi user

Đọc thêm:
- `.planning/PROJECT.md` (nếu có) → tầm nhìn dự án, ràng buộc
- `.planning/rules/general.md` → quy tắc chung (luôn đọc)
- `.planning/rules/nestjs.md` → quy tắc NestJS (đọc khi task Backend/Fullstack, CHỈ nếu file tồn tại)
- `.planning/rules/nextjs.md` → quy tắc NextJS (đọc khi task Frontend/Fullstack, CHỈ nếu file tồn tại)
- `.planning/rules/wordpress.md` → quy tắc WordPress/PHP (CHỈ nếu file tồn tại)
- `.planning/rules/solidity.md` → quy tắc Solidity (CHỈ nếu file tồn tại)
- `.planning/rules/flutter.md` → quy tắc Flutter/Dart (CHỈ nếu file tồn tại)
</context>

<execution_context>
@workflows/write-code.md (required)
@references/conventions.md (optional)
@references/prioritization.md (optional)
@references/ui-brand.md (optional)
@references/security-checklist.md (optional)
@references/verification-patterns.md (optional)
</execution_context>

<process>
Thực thi quy trình từ @workflows/write-code.md từ đầu đến cuối.
Tất cả logic (chọn task, viết code, lint/build, bảo mật, commit, cập nhật trạng thái) nằm trong workflow — command này chỉ cung cấp context + điểm vào.
</process>

<output>
**Tao/Cap nhat:**
- Source code files theo task
- Test files (neu task yeu cau)
- Cap nhat TASKS.md (trang thai task)
- Cap nhat PROGRESS.md (tien trinh)

**Buoc tiep theo:** `/pd:test`, `/pd:plan [phase tiep]`, hoac `/pd:complete-milestone`

**Thanh cong khi:**
- Code viet xong, lint + build pass
- Task duoc danh dau hoan thanh trong TASKS.md
- Commit duoc tao voi message ro rang

**Loi thuong gap:**
- Lint/build fail -> doc loi, sua code, chay lai
- Task khong ro rang -> hoi user qua AskUserQuestion
- MCP khong ket noi -> kiem tra Docker va cau hinh
</output>

<rules>
- Moi output PHAI bang tieng Viet co dau
- PHAI doc va tuan thu rules trong `.planning/rules/` truoc khi viet code
- PHAI chay lint + build sau khi viet code
- PHAI commit sau moi task hoan thanh
- KHONG duoc thay doi code ngoai pham vi task
</rules>
