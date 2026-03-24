# Phase 19: Knowledge Correction - Context

**Gathered:** 2026-03-24
**Status:** Ready for planning

<domain>
## Phase Boundary

Khi bug do logic sai, AI phải sửa PLAN.md (cập nhật Truth) trước khi sửa code — thông qua Bước 6.5 "Logic Update" trong fix-bug workflow. Đồng thời, ghi lại các thay đổi nghiệp vụ phát sinh trong quá trình làm qua mục "Logic Changes" trong PROGRESS.md (áp dụng cả write-code và fix-bug).

Requirements: CORR-01, CORR-02

</domain>

<decisions>
## Implementation Decisions

### Logic Bug Detection (D-01, D-02, D-03)
- **D-01:** AI tự phân loại sau Bước 6b (Đánh giá kết quả) — nếu nguyên nhân liên quan đến Truth/business logic → trigger Bước 6.5. Bug code đơn thuần (typo, off-by-one, import thiếu) → skip 6.5.
- **D-02:** Khi AI phân loại là logic bug, thông báo + hỏi user confirm trước khi sửa Truth: "Bug này do Truth [TX] sai → cần sửa PLAN.md. Đồng ý?"
- **D-03:** Nếu user bác phân loại ("không phải logic bug"), skip Bước 6.5, tiếp tục Bước 7. Ghi note vào SESSION: "User bác phân loại logic bug".

### PLAN.md Update Scope (D-04, D-05, D-06)
- **D-04:** Chỉ sửa cột liên quan trong bảng Truths 5 cột — AI tự đánh giá cột nào cần thay đổi dựa trên nguyên nhân bug (có thể là Sự thật, Trường hợp biên, Cách kiểm chứng, hoặc nhiều cột).
- **D-05:** Chỉ sửa Truth hiện có, KHÔNG thêm Truth mới. Logic thiếu hoàn toàn = scope lớn hơn, ghi Deferred.
- **D-06:** Giá trị cũ (before) được ghi trong BUG_*.md (phần "Phân tích nguyên nhân"). PLAN.md chỉ chứa giá trị mới.

### Bước 6.5 Flow (D-07, D-08, D-09, D-10)
- **D-07:** Bước 6.5 nằm sau 6c (Cổng kiểm tra đạt), trước 7 (Báo cáo). Lúc này đã xác định nguyên nhân + đủ bằng chứng. Sửa Truth TRƯỚC khi sửa code.
- **D-08:** Commit riêng cho PLAN.md thay đổi với prefix [LỖI]. Tách biệt rõ: sửa tài liệu logic trước, sửa code sau.
- **D-09:** Không tìm thấy PLAN.md → skip Bước 6.5, ghi vào BUG report: "Không có PLAN.md để cập nhật Truth". Tiếp tục sửa code.
- **D-10:** Chỉ sửa PLAN.md (bảng Truths), KHÔNG sửa TASKS.md. Task vẫn cùng Truth ID, chỉ nội dung Truth thay đổi.

### Logic Changes in PROGRESS.md (D-11, D-12, D-13, D-14)
- **D-11:** Áp dụng cả write-code và fix-bug workflow — ghi lại logic changes bất cứ khi nào phát sinh.
- **D-12:** Format bảng: `| Truth ID | Thay đổi | Lý do |`. Gọn, trùng với Truths format đang dùng, dễ trace.
- **D-13:** Xóa cùng PROGRESS.md sau commit thành công. BUG report và git diff đã lưu lại lịch sử.
- **D-14:** Không có logic change → không tạo section "Logic Changes" trong PROGRESS.md. Giữ template gọn.

### Claude's Discretion
- Wording chính xác của prompt Bước 6.5 trong fix-bug.md
- Logic phân loại chi tiết (keywords, heuristics) để xác định bug do logic sai
- Format câu hỏi confirm "Bug này do Truth [TX] sai" (plain text hay AskUserQuestion)
- Cách tìm PLAN.md liên quan (grep strategy, phase matching)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Workflows
- `workflows/fix-bug.md` — Workflow chính cần thêm Bước 6.5 Logic Update. Hiện có Bước 6a→6b→6c→7→8→9→10
- `workflows/write-code.md` — Cần thêm Logic Changes vào PROGRESS.md flow (Bước liên quan đến PROGRESS)

### Templates
- `templates/progress.md` — Template PROGRESS.md cần thêm section "Logic Changes" (conditional)
- `templates/plan.md` — Bảng Truths 5 cột (target sửa trong Bước 6.5)
- `templates/tasks.md` — Trường Truths trong task metadata (KHÔNG sửa, chỉ reference)

### Prior Phase Work
- `.planning/phases/17-truth-protocol/17-CONTEXT.md` — Quyết định về format 5 cột, CHECK-04 BLOCK
- `.planning/phases/18-logic-first-execution/18-CONTEXT.md` — Bước 1.7 Re-validate Logic, Evidence types

### Requirements
- `.planning/REQUIREMENTS.md` — CORR-01, CORR-02 definitions

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `workflows/fix-bug.md` Bước 6a→6c flow — insertion point rõ ràng cho 6.5 (sau 6c, trước 7)
- `templates/progress.md` — template đơn giản, dễ thêm conditional section
- `workflows/write-code.md` — đã có PROGRESS.md create/update logic, cần extend

### Established Patterns
- Workflow steps đánh số: Bước X.Y — 6.5 khớp convention
- Confirmation pattern: write-code đã có "Logic đúng chưa? (Y/n)" ở Bước 1.7 — có thể tái sử dụng pattern cho 6.5
- Commit prefix [LỖI] đã có trong fix-bug workflow
- BUG report đã có section "Phân tích nguyên nhân" — nơi tự nhiên để ghi giá trị cũ của Truth
- PROGRESS.md lifecycle: tạo → cập nhật → xóa sau commit — Logic Changes follow cùng lifecycle

### Integration Points
- `workflows/fix-bug.md` Bước 6c → **[NEW: Bước 6.5]** → Bước 7: Insertion point
- `templates/progress.md` → `workflows/write-code.md` + `workflows/fix-bug.md`: Cả hai workflow tạo/đọc PROGRESS.md
- `workflows/fix-bug.md` Bước 3 đã Grep PLAN.md — cùng logic tìm PLAN.md dùng cho Bước 6.5

</code_context>

<specifics>
## Specific Ideas

Format mong muốn cho Bước 6.5 output:
```
Bug này do Truth sai — cần cập nhật PLAN.md:

| Truth | Hiện tại | Sửa thành |
|-------|---------|-----------|
| T2 | Sai password 3 lần → khóa | Sai password 5 lần → khóa 15 phút |

Đồng ý sửa PLAN.md? (Y/n)
```

Format mong muốn cho Logic Changes trong PROGRESS.md:
```
## Logic Changes
| Truth ID | Thay đổi | Lý do |
|----------|---------|-------|
| T2 | Sửa ngưỡng khóa: 3→5 lần, thêm thời gian 15 phút | Bug #BUG_24_03_2026: logic cũ không match yêu cầu bảo mật mới |
```

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 19-knowledge-correction*
*Context gathered: 2026-03-24*
