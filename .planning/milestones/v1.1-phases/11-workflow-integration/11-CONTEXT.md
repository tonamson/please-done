# Phase 11: Workflow Integration - Context

**Gathered:** 2026-03-23
**Status:** Ready for planning

<domain>
## Phase Boundary

Plan checker chạy tự động trong plan workflow (plan.md) và trả kết quả actionable cho user. Chạy sau Step 8 (tracking update), trước Step 8.5 (git commit). User thấy report và chọn hành động khi có issues. Module plan-checker.js (Phase 10) đã có — phase này chỉ integrate vào workflow + format output.

</domain>

<decisions>
## Implementation Decisions

### Report display format
- **D-01:** Khi PASS — hiển thị summary table liệt kê từng check với status icon: CHECK-01 ✅, CHECK-02 ✅, CHECK-03 ✅, CHECK-04 ✅
- **D-02:** Khi ISSUES FOUND — grouped theo check: mỗi check failed hiển thị header + danh sách issues bên dưới
- **D-03:** Issues chỉ hiển thị message — không hiện fixHint inline (fixHint dùng internal khi Claude auto-fix)
- **D-04:** Max 10 issues hiển thị, vượt quá thì ghi "+N more issues" ở cuối

### Fix action behavior
- **D-05:** Khi user chọn Fix — giữ nguyên PLAN.md + TASKS.md, Claude đọc issues + fixHint và tự sửa trực tiếp vào file
- **D-06:** Sau mỗi lần fix, tự động re-run checker — loop cho đến khi pass hoặc user chọn Proceed/Cancel
- **D-07:** WARN-only (không có BLOCK) vẫn hỏi user choice — không auto-proceed

### User choice pattern
- **D-08:** Choice options khi có issues: Fix (Đề xuất) / Proceed with warnings / Cancel
- **D-09:** BLOCK issues: cho phép Proceed nhưng KHÔNG mặc định — cần user xác nhận explicit riêng (VD: "Force proceed" với confirm step thêm)
- **D-10:** BLOCK proceed phải lưu audit rõ ràng — ghi vào STATE.md những BLOCK nào user đã override

### Cancel behavior
- **D-11:** Khi Cancel — giữ PLAN.md + TASKS.md trên disk (không xóa), ghi note vào STATE.md rằng plan bị cancel kèm lý do (issues found)

### Proceed-with-warnings tracking
- **D-12:** Warnings đã acknowledged ghi vào STATE.md → Accumulated Context section — để session sau biết plan có known issues
- **D-13:** Cảnh báo tích lũy nhẹ khi user liên tục proceed qua warnings ở nhiều plans (VD: "Lưu ý: 3 plans gần đây đều có warnings"), nhưng mỗi plan vẫn là đơn vị quyết định chính — không block dựa trên lịch sử

### Claude's Discretion
- Re-plan flow (Step 1.5 interaction): Claude quyết định behavior tối ưu khi checker chạy trên plan đã re-plan
- Report formatting chi tiết (spacing, icons, markdown style)
- fixHint parsing logic để auto-fix
- Số lần max re-run loop trước khi suggest Cancel
- Exact wording của cumulative warning message

</decisions>

<specifics>
## Specific Ideas

- Workflow plan.md hiện có Steps: 1 → 1.4 → 1.5 → 2 → 3 → 3.5 → 4 → 4.3 → 4.5 → 5 → 6 → 7 → 8 → 8.5 → 9
- Insertion point: new Step 8.1 giữa Step 8 (tracking update) và Step 8.5 (git commit)
- Choice pattern existing: `AskUserQuestion` với `multiSelect: false`, options có label + description, first option "(Đề xuất)"
- Existing choice example trong workflows/new-milestone.md lines 77-104
- `runAllChecks({ planContent, tasksContent, requirementIds })` là main entry point — pure function, không I/O
- Requirement IDs cần parse từ ROADMAP.md field `Requirements:` per phase
- ROADMAP.md Phase 11 ghi `Requirements: INTG-01, INTG-02`

</specifics>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Workflow to modify
- `workflows/plan.md` — Full plan workflow: Steps 1-9, insertion point between Step 8 and Step 8.5

### Plan checker API
- `bin/lib/plan-checker.js` — Module exports: `runAllChecks()`, `detectPlanFormat()`, 4 individual check functions, 12 helpers
- `references/plan-checker.md` — Rules spec: 4 checks, severity mapping, expected behaviors

### Choice pattern reference
- `workflows/new-milestone.md` §Lines 77-104 — AskUserQuestion pattern with single-select, "(Đề xuất)" label convention

### Data structures (from Phase 10)
- Phase 10 CONTEXT.md D-13/D-14/D-15 — Check result structure: `{ checkId, status, issues: [{ message, location, fixHint }] }`, combined result: `{ overall, checks }`

### State tracking
- `.planning/STATE.md` — Accumulated Context section where warnings/audit entries should be written

### Requirements
- `.planning/REQUIREMENTS.md` — INTG-01 (report format), INTG-02 (auto-run in workflow)
- `.planning/ROADMAP.md` — Phase 11 success criteria and requirement IDs per phase

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `runAllChecks({ planContent, tasksContent, requirementIds })` — main API, pure function, returns `{ overall, checks }`
- `detectPlanFormat(planContent)` — returns 'v1.0' | 'v1.1' | 'unknown', useful for format-aware reporting
- AskUserQuestion pattern from new-milestone.md — single-select with label + description format

### Established Patterns
- Workflow steps numbered incrementally (8, 8.1, 8.5, 9) — decimal steps for insertions
- Choice options: first option marked "(Đề xuất)", max 3-4 options
- STATE.md Accumulated Context: Decisions list + Pending Todos + Blockers/Concerns sections
- Git commit pattern: `git add` specific files → `git commit -m "docs: ..."`

### Integration Points
- Step 8 output: PLAN.md + TASKS.md paths known, tracking files updated
- Step 8.5 input: expects files ready to commit — checker sits between these
- STATE.md: write audit entries (D-10, D-12) to Accumulated Context
- ROADMAP.md: read `Requirements:` field per phase to extract requirement IDs for CHECK-01

</code_context>

<deferred>
## Deferred Ideas

- Key Links verification — Phase 12 (ADV-01)
- Scope threshold warnings — Phase 12 (ADV-02)
- Effort classification validation — Phase 12 (ADV-03)
- Standalone `/pd:check-plan` command — Out of Scope per REQUIREMENTS.md

</deferred>

---

*Phase: 11-workflow-integration*
*Context gathered: 2026-03-23*
