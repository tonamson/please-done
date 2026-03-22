---
name: pd:fix-bug
description: Tìm và sửa lỗi theo phương pháp khoa học, tìm hiểu, báo cáo, sửa code, commit [LỖI] và xác nhận cho đến khi thành công
model: sonnet
argument-hint: "[mô tả lỗi hoặc tên phiên điều tra]"
allowed-tools:
  - Read
  - Write
  - Edit
  - Bash
  - Glob
  - Grep
  - AskUserQuestion
  - mcp__fastcode__code_qa
  - mcp__context7__resolve-library-id
  - mcp__context7__query-docs
---

<objective>
Tìm và sửa lỗi theo phương pháp khoa học: thu thập triệu chứng → phân loại rủi ro → hình thành giả thuyết → kiểm chứng → cổng kiểm tra trước khi sửa → sửa code → xác nhận.
Lưu trạng thái điều tra (.planning/debug/) để tiếp tục khi cuộc hội thoại bị mất.
Lặp đến khi user xác nhận thành công. Tạo patch version cho milestone đã hoàn tất.

**Sau khi xong:** `/pd:what-next` để kiểm tra tiến trình.
</objective>

<guards>
DUNG va huong dan user neu bat ky dieu kien nao that bai:

@references/guard-context.md
- [ ] Mo ta loi duoc cung cap -> "Cung cap mo ta loi hoac ten phien dieu tra."
@references/guard-fastcode.md
@references/guard-context7.md
</guards>

<context>
User input: $ARGUMENTS

Đọc thêm:
- `.planning/rules/general.md` → quy tắc chung
- `.planning/rules/nestjs.md` hoặc `nextjs.md` hoặc `wordpress.md` hoặc `solidity.md` hoặc `flutter.md` → theo loại lỗi (CHỈ nếu file tồn tại)
</context>

<execution_context>
@workflows/fix-bug.md (required)
@references/conventions.md (optional)
@references/prioritization.md (optional)
</execution_context>

<process>
Thực thi quy trình từ @workflows/fix-bug.md từ đầu đến cuối.
Giữ nguyên tất cả các bước, phiên điều tra, cổng kiểm tra, phân loại rủi ro, và vòng lặp xác nhận.
</process>

<output>
**Tao/Cap nhat:**
- Source code files da sua loi
- `.planning/debug/` -- trang thai phien dieu tra
- Cap nhat TASKS.md (neu lien quan den task)

**Buoc tiep theo:** `/pd:what-next` de kiem tra tien trinh

**Thanh cong khi:**
- Loi da duoc xac nhan sua thanh cong boi user
- Test lien quan pass (neu co)
- Commit [LOI] duoc tao

**Loi thuong gap:**
- Khong tai hien duoc loi -> yeu cau user cung cap them thong tin
- Loi o dependency -> cap nhat package, kiem tra version
- MCP khong ket noi -> kiem tra Docker va cau hinh
</output>

<rules>
- Moi output PHAI bang tieng Viet co dau
- PHAI luu trang thai dieu tra vao `.planning/debug/` de phuc hoi
- PHAI qua cong kiem tra (gate check) truoc khi sua code
- PHAI lap lai vong lua den khi user xac nhan thanh cong
- KHONG duoc sua code khong lien quan den loi
</rules>
