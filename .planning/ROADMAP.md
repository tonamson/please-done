# Roadmap: Please-Done Workflow Optimization

## Milestones

- ✅ **v1.0 Workflow Optimization** — Phases 1-9 (shipped 2026-03-22)
- ✅ **v1.1 Plan Checker** — Phases 10-13 (shipped 2026-03-23)
- 🚧 **v1.2 Skill Audit & Bug Fixes** — Phases 14-16 (in progress)

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

<details>
<summary>✅ v1.1 Plan Checker (Phases 10-13) — SHIPPED 2026-03-23</summary>

- [x] Phase 10: Core Plan Checks (2/2 plans) — completed 2026-03-23
- [x] Phase 11: Workflow Integration (1/1 plan) — completed 2026-03-23
- [x] Phase 12: Advanced Checks (2/2 plans) — completed 2026-03-23
- [x] Phase 13: Display Fix (1/1 plan) — completed 2026-03-23

Full details: `.planning/milestones/v1.1-ROADMAP.md`

</details>

### 🚧 v1.2 Skill Audit & Bug Fixes (In Progress)

**Milestone Goal:** Audit toan dien bo skill/workflow hien tai, tim va fix loi tiem an, verify logic gaps trong cac workflow chinh

- [x] **Phase 14: Skill & Workflow Audit** — Scan 12 skills, 10 workflows, va 48 converter snapshots tim logic gaps va sync issues (completed 2026-03-23)
- [x] **Phase 15: Workflow Verification** — Deep verify 3 workflow chinh (new-milestone, write-code, fix-bug) end-to-end (completed 2026-03-23)
- [x] **Phase 16: Bug Fixes** — Fix tat ca bugs phat hien tu Phase 14 va Phase 15 (completed 2026-03-23)

## Phase Details

### Phase 14: Skill & Workflow Audit
**Goal**: Moi skill, workflow, va converter snapshot duoc scan ky luong — tat ca logic gaps, dead code, outdated references, va sync issues duoc ghi nhan day du
**Depends on**: Phase 13 (v1.1 complete)
**Requirements**: AUDIT-01, AUDIT-02, AUDIT-03
**Success Criteria** (what must be TRUE):
  1. Tat ca 12 skill files da duoc scan va moi logic gap, dead code, outdated reference duoc ghi nhan trong audit report
  2. Tat ca 10 workflow files da duoc scan va moi logic gap, missing error handling, stale instruction, broken step reference duoc ghi nhan
  3. Tat ca 48 converter snapshots da duoc verify match voi source files hien tai — moi mismatch duoc ghi nhan cu the (file, line, diff)
  4. Audit report ton tai voi danh sach day du cac issues phat hien, phan loai theo severity (critical/warning/info)
**Plans**: 3 plans

Plans:
- [x] 14-01: Scan 12 skills, 13 references, 10 templates — tim logic gaps va dead code
- [x] 14-02: Scan 10 workflows va 15 JS modules — tim logic gaps va sync issues
- [x] 14-03: Verify 48 converter snapshots va consolidate audit report

### Phase 15: Workflow Verification
**Goal**: 3 workflow chinh (new-milestone, write-code, fix-bug) duoc verify end-to-end — moi buoc logic duoc kiem tra, moi gap duoc ghi nhan
**Depends on**: Phase 14
**Requirements**: WFLOW-01, WFLOW-02, WFLOW-03
**Success Criteria** (what must be TRUE):
  1. Workflow new-milestone da duoc trace end-to-end: init context -> questioning -> research spawn -> requirements definition -> roadmap creation -> state updates — moi buoc logic verified hoac gap ghi nhan
  2. Workflow write-code da duoc trace end-to-end: plan reading -> task execution -> effort routing -> Context7 pipeline -> commit flow -> verification — moi buoc logic verified hoac gap ghi nhan
  3. Workflow fix-bug da duoc trace end-to-end: bug reproduction -> diagnosis -> fix application -> test verification -> commit flow — moi buoc logic verified hoac gap ghi nhan
  4. Verification report ton tai voi ket qua cua tung workflow, list ro cac logic gaps can fix
**Plans**: 3 plans

Plans:
- [x] 15-01-PLAN.md — Trace fix-bug (WFLOW-03): tao report skeleton + verify workflow don gian nhat
- [x] 15-02-PLAN.md — Trace new-milestone (WFLOW-01): verify 14 references, 2 approval gates, data flow
- [x] 15-03-PLAN.md — Trace write-code (WFLOW-02): verify 3 modes + hoan tat report (Executive Summary, Issue Registry)

### Phase 16: Bug Fixes
**Goal**: Tat ca bugs phat hien tu audit (Phase 14) va verification (Phase 15) duoc fix — khong con known issues nao bi bo qua
**Depends on**: Phase 14, Phase 15
**Requirements**: BFIX-01, BFIX-02, BFIX-03
**Success Criteria** (what must be TRUE):
  1. Tat ca logic gaps tu skill audit (AUDIT-01, AUDIT-02) da duoc fix — code thuc te da thay doi, khong chi la report
  2. Tat ca converter snapshot sync issues (AUDIT-03) da duoc fix — chay lai snapshot verification cho ket qua 48/48 match
  3. Tat ca logic gaps tu workflow verification (WFLOW-01, WFLOW-02, WFLOW-03) da duoc fix — workflow logic da duoc sua trong source files
  4. Existing test suites (443+ tests) van pass sau khi fix — khong co regression
**Plans**: TBD

Plans:
- [ ] 16-01: TBD
- [ ] 16-02: TBD
- [ ] 16-03: TBD

## Progress

**Execution Order:**
Phases execute in numeric order: 14 -> 15 -> 16

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
| 10. Core Plan Checks | v1.1 | 2/2 | Complete | 2026-03-23 |
| 11. Workflow Integration | v1.1 | 1/1 | Complete | 2026-03-23 |
| 12. Advanced Checks | v1.1 | 2/2 | Complete | 2026-03-23 |
| 13. Display Fix | v1.1 | 1/1 | Complete | 2026-03-23 |
| 14. Skill & Workflow Audit | v1.2 | 3/3 | Complete    | 2026-03-23 |
| 15. Workflow Verification | v1.2 | 3/3 | Complete | 2026-03-23 |
| 16. Bug Fixes | v1.2 | 0/? | Not started | - |
