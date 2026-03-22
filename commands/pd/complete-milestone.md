---
name: pd:complete-milestone
description: Hoàn tất milestone, commit, tạo git tag, báo cáo tổng kết
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
Kiểm tra bugs đã đóng, tạo báo cáo tổng kết, commit, git tag, cập nhật tracking, chuyển milestone tiếp.
Chỉ cho phép đóng khi tất cả tasks hoàn thành + bugs đã giải quyết.
</objective>

<guards>
DUNG va huong dan user neu bat ky dieu kien nao that bai:

@references/guard-context.md
- [ ] Tat ca tasks trong milestone co status hoan thanh -> "Con tasks chua xong. Hoan thanh truoc khi dong milestone."
- [ ] Khong co bugs mo chua giai quyet -> "Con bugs mo. Chay `/pd:fix-bug` de sua truoc."
</guards>

<context>
User input: $ARGUMENTS (khong dung -- version tu dong tu CURRENT_MILESTONE.md)

Đọc thêm:
- `.planning/PROJECT.md` -> cập nhật lịch sử milestones
- `.planning/rules/general.md` -> ngôn ngữ, ngày tháng, version/commit format
</context>

<execution_context>
@workflows/complete-milestone.md (required)
@references/conventions.md (required)
@references/state-machine.md (optional)
@references/ui-brand.md (optional)
@references/verification-patterns.md (optional)
@templates/current-milestone.md (optional)
@templates/state.md (optional)
</execution_context>

<process>
Thực thi @workflows/complete-milestone.md từ đầu đến cuối.
</process>

<output>
**Tao/Cap nhat:**
- Bao cao tong ket milestone
- Git tag cho version
- `.planning/PROJECT.md` -- cap nhat lich su milestones
- `.planning/STATE.md` -- dat lai cho milestone tiep
- `.planning/CURRENT_MILESTONE.md` -- danh dau hoan thanh

**Buoc tiep theo:** `/pd:scan` hoac `/pd:new-milestone`

**Thanh cong khi:**
- Tat ca tasks hoan thanh, khong con bugs mo
- Git tag dung version
- PROJECT.md cap nhat ket qua milestone

**Loi thuong gap:**
- Con tasks chua xong -> hoan thanh truoc
- Git conflict -> giai quyet thu cong
- Bugs mo -> chay `/pd:fix-bug` truoc
</output>

<rules>
- Moi output PHAI bang tieng Viet co dau
- KHONG dong milestone neu con tasks chua hoan thanh
- KHONG dong milestone neu con bugs mo
- PHAI tao git tag sau khi commit thanh cong
- PHAI hoi user xac nhan truoc khi dong milestone
</rules>
