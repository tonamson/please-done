---
name: pd:new-milestone
description: Lập kế hoạch chiến lược dự án, tạo lộ trình với milestones rõ ràng
model: opus
argument-hint: "[tên milestone, VD: 'v1.1 Thông báo'] [--reset-phase-numbers]"
allowed-tools:
  - Read
  - Write
  - Edit
  - Bash
  - Glob
  - Grep
  - Agent
  - AskUserQuestion
  - WebSearch
  - mcp__context7__resolve-library-id
  - mcp__context7__query-docs
---

<objective>
Khởi tạo milestone mới: kiểm tra -> cập nhật dự án -> hỏi -> nghiên cứu (tùy chọn) -> yêu cầu -> lộ trình -> duyệt.
</objective>

<guards>
DUNG va huong dan user neu bat ky dieu kien nao that bai:

@references/guard-context.md
- [ ] `.planning/rules/general.md` ton tai -> "Rules bi thieu. Chay `/pd:init` de tao lai."
- [ ] Ten milestone duoc cung cap hoac se hoi user neu khong co
@references/guard-context7.md
- [ ] WebSearch kha dung cho nghien cuu
</guards>

<context>
Tên milestone: $ARGUMENTS (tùy chọn -- hỏi nếu không có)
- `--reset-phase-numbers` -> đánh số phase từ 1
- Phần còn lại = tên/mô tả milestone

Đọc thêm:
- `.planning/PROJECT.md` -> lịch sử milestones
- `.planning/rules/general.md` -> ngôn ngữ, ngày tháng, quy cách
</context>

<execution_context>
@workflows/new-milestone.md (required)
@templates/project.md (required)
@templates/requirements.md (required)
@templates/roadmap.md (required)
@templates/state.md (required)
@templates/current-milestone.md (required)
@references/questioning.md (optional)
@references/conventions.md (required)
@references/ui-brand.md (optional)
@references/prioritization.md (optional)
@references/state-machine.md (optional)
</execution_context>

<process>
Thực thi @workflows/new-milestone.md từ đầu đến cuối.
</process>

<output>
**Tao/Cap nhat:**
- `.planning/PROJECT.md` -- tam nhin + lich su milestones
- `.planning/REQUIREMENTS.md` -- yeu cau co ma dinh danh + bang theo doi
- `.planning/ROADMAP.md` -- lo trinh cac phase
- `.planning/STATE.md` -- trang thai lam viec (dat lai)
- `.planning/CURRENT_MILESTONE.md` -- theo doi milestone dang chay
- `.planning/research/` -- nghien cuu (tuy chon, chi cho tinh nang moi)

**Buoc tiep theo:** `/pd:plan`

**Thanh cong khi:**
- ROADMAP.md day du phases voi mo ta ro rang
- REQUIREMENTS.md co ma dinh danh moi yeu cau
- STATE.md khoi tao cho milestone moi

**Loi thuong gap:**
- Thieu CONTEXT.md -> chay `/pd:init` truoc
- Rules thieu -> chay `/pd:init` de tao lai
- Ten milestone trung -> doi ten hoac dung version khac
</output>

<rules>
- Moi output PHAI bang tieng Viet co dau
- PHAI hoi user duyet requirements truoc khi tao roadmap
- PHAI hoi user duyet roadmap truoc khi commit
- Nghien cuu chi bat buoc cho tinh nang moi -- bo qua cho refactor/bugfix milestones
</rules>
