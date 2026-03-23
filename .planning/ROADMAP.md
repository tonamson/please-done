# Roadmap: Please-Done Workflow Optimization

## Milestones

- ✅ **v1.0 Workflow Optimization** — Phases 1-9 (shipped 2026-03-22)
- 🚧 **v1.1 Plan Checker** — Phases 10-12 (in progress)

## Phases

<details>
<summary>✅ v1.0 Workflow Optimization (Phases 1-9) — SHIPPED 2026-03-22</summary>

- [x] Phase 1: Skill Structure Normalization (3/3 plans) — completed 2026-03-22
- [x] Phase 2: Cross-Skill Deduplication (2/2 plans) — completed 2026-03-22
- [x] Phase 3: Prompt Prose Compression (6/6 plans) — completed 2026-03-22
- [x] Phase 4: Conditional Context Loading (2/2 plans) — completed 2026-03-22
- [x] Phase 5: Effort-Level Routing (2/2 plans) — completed 2026-03-22
- [x] Phase 6: Context7 Standardization (2/2 plans) — completed 2026-03-22
- [x] Phase 7: Library Fallback and Version Detection (1/1 plan) — completed 2026-03-22
- [x] Phase 8: Wave-Based Parallel Execution (2/2 plans) — completed 2026-03-22
- [x] Phase 9: Converter Pipeline Optimization (2/2 plans) — completed 2026-03-22

Full details: `.planning/milestones/v1.0-ROADMAP.md`

</details>

### 🚧 v1.1 Plan Checker (In Progress)

**Milestone Goal:** Thêm bước kiểm tra plan tự động sau khi `/pd:plan` hoàn tất, đảm bảo plan đủ chất lượng trước khi execute

- [x] **Phase 10: Core Plan Checks** - Spec + module với 4 structural validators cho requirement coverage, task completeness, dependency correctness, Truth-Task coverage (completed 2026-03-23)
- [x] **Phase 11: Workflow Integration** - Report format PASS/ISSUES FOUND với actionable fix hints + tự động chạy sau Step 8 trong plan.md (completed 2026-03-23)
- [ ] **Phase 12: Advanced Checks** - Key Links verification, scope threshold warnings, effort classification validation

## Phase Details

### Phase 10: Core Plan Checks
**Goal**: Plan checker module có thể kiểm tra 4 structural properties của PLAN.md + TASKS.md và trả kết quả structured
**Depends on**: Phase 9 (v1.0 complete)
**Requirements**: CHECK-01, CHECK-02, CHECK-03, CHECK-04
**Success Criteria** (what must be TRUE):
  1. Plan checker phát hiện requirement trong ROADMAP.md không có task nào cover và báo đúng requirement ID bị thiếu
  2. Plan checker phát hiện task thiếu required fields (description, criteria, Truths, Files, Effort) và liệt kê field nào thiếu ở task nào
  3. Plan checker phát hiện circular dependency và reference tới task không tồn tại trong TASKS.md
  4. Plan checker phát hiện Truth không có task nào map và task không có Truth nào map — cả hai chiều
  5. Tất cả 4 checks chạy trên 22 historical v1.0 plans với zero false positives
**Plans**: 2 plans
Plans:
- [x] 10-01-PLAN.md — Rules specification + plan-checker.js module with 4 checks
- [x] 10-02-PLAN.md — Unit tests + historical validation (22 plans, zero false positives)

### Phase 11: Workflow Integration
**Goal**: Plan checker chạy tự động trong plan workflow và trả kết quả actionable cho user
**Depends on**: Phase 10
**Requirements**: INTG-01, INTG-02
**Success Criteria** (what must be TRUE):
  1. Khi plan pass tất cả checks, user thấy "PASS" với summary ngắn gọn — workflow tiếp tục git commit bình thường
  2. Khi plan có issues, user thấy "ISSUES FOUND" với danh sách blockers/warnings kèm fix hints cụ thể cho từng issue
  3. Plan checker tự động chạy sau Step 8 (tracking update) và trước git commit trong plan.md — không cần user invoke riêng
  4. User có thể chọn Fix / Proceed with warning / Cancel khi gặp issues — matching existing workflow choice patterns
**Plans**: 1 plan
Plans:
- [x] 11-01-PLAN.md — Step 8.1 integration: report format + user choices + fix loop + STATE.md audit

### Phase 12: Advanced Checks
**Goal**: Plan checker phát hiện thêm 3 loại vấn đề nâng cao để tăng chất lượng plan
**Depends on**: Phase 11
**Requirements**: ADV-01, ADV-02, ADV-03
**Success Criteria** (what must be TRUE):
  1. Plan checker kiểm tra Key Links trong PLAN.md thực sự xuất hiện trong task descriptions — không chỉ liệt kê mà không dùng
  2. Plan checker cảnh báo khi số tasks/phase hoặc files/task vượt scope thresholds hợp lý — giúp user nhận biết plan quá phình
  3. Plan checker so sánh effort classification (simple/standard/complex) với scope thực tế của task (số files, số Truths, dependencies) và cảnh báo mismatch
**Plans**: 2 plans
Plans:
- [ ] 12-01-PLAN.md — 3 check functions (checkKeyLinks, checkScopeThresholds, checkEffortClassification) + rules spec update
- [ ] 12-02-PLAN.md — Unit tests + historical validation (22 plans, zero false positives with 7 checks)

## Progress

**Execution Order:**
Phases execute in numeric order: 10 → 11 → 12

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 1. Skill Structure Normalization | v1.0 | 3/3 | Complete | 2026-03-22 |
| 2. Cross-Skill Deduplication | v1.0 | 2/2 | Complete | 2026-03-22 |
| 3. Prompt Prose Compression | v1.0 | 6/6 | Complete | 2026-03-22 |
| 4. Conditional Context Loading | v1.0 | 2/2 | Complete | 2026-03-22 |
| 5. Effort-Level Routing | v1.0 | 2/2 | Complete | 2026-03-22 |
| 6. Context7 Standardization | v1.0 | 2/2 | Complete | 2026-03-22 |
| 7. Library Fallback and Version Detection | v1.0 | 1/1 | Complete | 2026-03-22 |
| 8. Wave-Based Parallel Execution | v1.0 | 2/2 | Complete | 2026-03-22 |
| 9. Converter Pipeline Optimization | v1.0 | 2/2 | Complete | 2026-03-22 |
| 10. Core Plan Checks | v1.1 | 2/2 | Complete    | 2026-03-23 |
| 11. Workflow Integration | v1.1 | 1/1 | Complete    | 2026-03-23 |
| 12. Advanced Checks | v1.1 | 0/2 | Not started | - |
