# Roadmap: Please-Done Workflow Optimization

## Milestones

- ✅ **v1.0 Workflow Optimization** — Phases 1-9 (shipped 2026-03-22)
- ✅ **v1.1 Plan Checker** — Phases 10-13 (shipped 2026-03-23)
- ✅ **v1.2 Skill Audit & Bug Fixes** — Phases 14-16 (shipped 2026-03-23)
- ✅ **v1.3 Truth-Driven Development** — Phases 17-20 (shipped 2026-03-24)
- ✅ **v1.4 Mermaid Diagrams** — Phases 21-24 (shipped 2026-03-24)
- 🚧 **v1.5 Nang cap Skill Fix-Bug** — Phases 25-27 (in progress)

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

<details>
<summary>✅ v1.2 Skill Audit & Bug Fixes (Phases 14-16) — SHIPPED 2026-03-23</summary>

- [x] Phase 14: Skill & Workflow Audit (3/3 plans) — completed 2026-03-23
- [x] Phase 15: Workflow Verification (3/3 plans) — completed 2026-03-23
- [x] Phase 16: Bug Fixes (5/5 plans) — completed 2026-03-23

Full details: `.planning/milestones/v1.2-ROADMAP.md`

</details>

<details>
<summary>✅ v1.3 Truth-Driven Development (Phases 17-20) — SHIPPED 2026-03-24</summary>

- [x] Phase 17: Truth Protocol (2/2 plans) — completed 2026-03-23
- [x] Phase 18: Logic-First Execution (1/1 plans) — completed 2026-03-24
- [x] Phase 19: Knowledge Correction (1/1 plans) — completed 2026-03-24
- [x] Phase 20: Logic Audit (1/1 plans) — completed 2026-03-24

Full details: `.planning/milestones/v1.3-ROADMAP.md`

</details>

<details>
<summary>✅ v1.4 Mermaid Diagrams (Phases 21-24) — SHIPPED 2026-03-24</summary>

- [x] Phase 21: Mermaid Foundation (2/2 plans) — completed 2026-03-24
- [x] Phase 22: Diagram Generation (2/2 plans) — completed 2026-03-24
- [x] Phase 23: PDF Export (2/2 plans) — completed 2026-03-24
- [x] Phase 24: Workflow Integration (1/1 plan) — completed 2026-03-24

Full details: `.planning/milestones/v1.4-ROADMAP.md`

</details>

### 🚧 v1.5 Nang cap Skill Fix-Bug (In Progress)

**Milestone Goal:** Toi uu hoa do an toan va tu dong hoa dieu tra trong skill fix-bug — them tai hien loi, phan tich hoi quy, don dep log, dong bo business logic, va xuat bao cao PDF.

- [ ] **Phase 25: Dieu tra & Tai hien Loi** — Tao 2 module pure function moi (repro-test-generator, regression-analyzer) va tich hop vao workflow fix-bug
- [ ] **Phase 26: Don dep & An toan** — Tu dong don debug log va lien ket canh bao bao mat cho file bi loi
- [ ] **Phase 27: Dong bo Logic & Bao cao** — Phat hien thay doi business logic, cap nhat Mermaid/PDF, va de xuat post-mortem

## Phase Details

### Phase 25: Dieu tra & Tai hien Loi
**Goal**: AI co the tu dong tao skeleton test tai hien loi va phan tich module phu thuoc bi anh huong truoc khi sua
**Depends on**: Phase 24 (v1.4 hoan thanh)
**Requirements**: REPRO-01, REGR-01
**Success Criteria** (what must be TRUE):
  1. Khi fix bug, AI tao duoc file test skeleton trong `.planning/debug/repro/` tuong ung voi stack (NestJS spec, Flutter test, hoac Generic) voi TODO markers de AI dien logic
  2. Khi fix bug, AI phan tich duoc cac module phu thuoc qua FastCode call chain (hoac fallback BFS) va bao cao toi da 5-10 files bi anh huong trong BUG report
  3. repro-test-generator.js la pure function (nhan content string, tra string, KHONG doc file) voi test file tuong ung pass
  4. regression-analyzer.js la pure function (nhan dependency data, tra danh sach files, KHONG goi MCP) voi test file tuong ung pass
  5. 526 tests hien tai van pass va snapshots da duoc regenerate neu workflow thay doi
**Plans:** 4 plans

Plans:
- [ ] 25-01-PLAN.md — Shared helper truths-parser.js + refactor generate-diagrams.js
- [ ] 25-02-PLAN.md — Module repro-test-generator.js (REPRO-01)
- [ ] 25-03-PLAN.md — Module regression-analyzer.js (REGR-01)
- [ ] 25-04-PLAN.md — Workflow integration + snapshot regeneration

### Phase 26: Don dep & An toan
**Goal**: AI tu dong don dep debug log tam thoi va hien thi canh bao bao mat lien quan truoc khi user commit ban sua
**Depends on**: Phase 25
**Requirements**: CLEAN-01, SEC-01
**Success Criteria** (what must be TRUE):
  1. AI scan duoc cac dong co marker `[PD-DEBUG]` trong staged files, hien thi danh sach cho user va CHI xoa khi user dong y
  2. AI lien ket duoc canh bao bao mat tu pd:scan report cho file bi loi (toi da 3 canh bao, freshness 7 ngay), hien thi non-blocking trong workflow
  3. Auto cleanup KHONG xoa bat ky dong nao khong co marker `[PD-DEBUG]` — production logs, audit logs duoc bao toan
  4. Tat ca tests hien tai van pass va snapshots cap nhat
**Plans**: TBD

### Phase 27: Dong bo Logic & Bao cao
**Goal**: AI phat hien khi ban sua thay doi business logic, tu dong cap nhat bao cao quan ly voi Mermaid diagram moi, va de xuat rule cho CLAUDE.md
**Depends on**: Phase 26
**Requirements**: LOGIC-01, RPT-01, PM-01
**Success Criteria** (what must be TRUE):
  1. AI danh gia duoc ban sua co thay doi business logic/kien truc khong bang heuristics (condition/arithmetic/endpoint signals) va ghi ket qua CO/KHONG vao BUG report
  2. Khi LOGIC-01 = CO, AI tu dong cap nhat Mermaid diagram trong management report co san (KHONG tao report moi) va hoi user co muon re-render PDF khong
  3. AI de xuat 1-2 rule moi cho CLAUDE.md sau khi fix xong, hien thi de xuat va CHI append khi user xac nhan
  4. Pipeline cap nhat report la non-blocking — loi o bat ky sub-step nao chi tao warning, khong chan workflow fix-bug
  5. Tat ca tests hien tai van pass, snapshots cap nhat, workflow fix-bug hoan chinh voi tat ca 7 tinh nang moi
**Plans**: TBD

## Progress

**Execution Order:**
Phases execute in numeric order: 25 → 26 → 27

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
| 14. Skill & Workflow Audit | v1.2 | 3/3 | Complete | 2026-03-23 |
| 15. Workflow Verification | v1.2 | 3/3 | Complete | 2026-03-23 |
| 16. Bug Fixes | v1.2 | 5/5 | Complete | 2026-03-23 |
| 17. Truth Protocol | v1.3 | 2/2 | Complete | 2026-03-23 |
| 18. Logic-First Execution | v1.3 | 1/1 | Complete | 2026-03-24 |
| 19. Knowledge Correction | v1.3 | 1/1 | Complete | 2026-03-24 |
| 20. Logic Audit | v1.3 | 1/1 | Complete | 2026-03-24 |
| 21. Mermaid Foundation | v1.4 | 2/2 | Complete | 2026-03-24 |
| 22. Diagram Generation | v1.4 | 2/2 | Complete | 2026-03-24 |
| 23. PDF Export | v1.4 | 2/2 | Complete | 2026-03-24 |
| 24. Workflow Integration | v1.4 | 1/1 | Complete | 2026-03-24 |
| 25. Dieu tra & Tai hien Loi | v1.5 | 0/4 | Planning | - |
| 26. Don dep & An toan | v1.5 | 0/0 | Not started | - |
| 27. Dong bo Logic & Bao cao | v1.5 | 0/0 | Not started | - |
