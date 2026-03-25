# Roadmap: Please-Done Workflow Optimization

## Milestones

- ✅ **v1.0 Workflow Optimization** — Phases 1-9 (shipped 2026-03-22)
- ✅ **v1.1 Plan Checker** — Phases 10-13 (shipped 2026-03-23)
- ✅ **v1.2 Skill Audit & Bug Fixes** — Phases 14-16 (shipped 2026-03-23)
- ✅ **v1.3 Truth-Driven Development** — Phases 17-20 (shipped 2026-03-24)
- ✅ **v1.4 Mermaid Diagrams** — Phases 21-24 (shipped 2026-03-24)
- ✅ **v1.5 Nang cap Skill Fix-Bug** — Phases 25-27 (shipped 2026-03-24)
- **v2.1 Detective Orchestrator** — Phases 28-33 (in progress)

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

<details>
<summary>✅ v1.5 Nang cap Skill Fix-Bug (Phases 25-27) — SHIPPED 2026-03-24</summary>

- [x] Phase 25: Dieu tra & Tai hien Loi (4/4 plans) — completed 2026-03-24
- [x] Phase 26: Don dep & An toan (2/2 plans) — completed 2026-03-24
- [x] Phase 27: Dong bo Logic & Bao cao (2/2 plans) — completed 2026-03-24

Full details: `.planning/milestones/v1.5-ROADMAP.md`

</details>

### v2.1 Detective Orchestrator (Dang thuc hien)

**Muc tieu Milestone:** Bien `pd:fix-bug` thanh he thong dieu phoi da Agent (Task Force), tich hop tinh hoa gsd:debug va suc manh MCP cua please-done.

- [x] **Phase 28: Agent Infrastructure & Resource Rules** (2/2 plans) — completed 2026-03-24
- [x] **Phase 29: Evidence Protocol & Session Management** (3 plans) (completed 2026-03-25)
  - [x] 29-01-PLAN.md — TDD evidence-protocol.js (3 outcome types, validation, parsing)
  - [x] 29-02-PLAN.md — TDD session-manager.js (session CRUD, folder-based structure)
  - [x] 29-03-PLAN.md — Cap nhat 5 agent files bo hardcode paths, them session-based evidence format
- [x] **Phase 30: Detective Interactions** (3 plans) (completed 2026-03-25)
  - [x] 30-01-PLAN.md — outcome-router.js (ROOT CAUSE 3 lua chon, FIX-PLAN template)
  - [x] 30-02-PLAN.md — checkpoint-handler.js (CHECKPOINT flow, Continuation Agent max 2 vong)
  - [x] 30-03-PLAN.md — parallel-dispatch.js (Detective+DocSpec song song, partial failure)
- [ ] **Phase 31: Project Memory & Regression Detection** (2 plans)
  - [ ] 31-01-PLAN.md — TDD bug-memory.js (createBugRecord, searchBugs, buildIndex)
  - [ ] 31-02-PLAN.md — Cap nhat agent prompts (Janitor ghi "Bug tuong tu", Architect kiem tra regression)
- [ ] **Phase 32: Orchestrator Workflow** - 5-buoc execution loop tich hop tat ca agents va evidence
- [ ] **Phase 33: Resilience & Backward Compatibility** - Loop-back khi INCONCLUSIVE, single-agent fallback, converter pipeline

## Phase Details

### Phase 28: Agent Infrastructure & Resource Rules
**Goal**: 5 agent chay duoc voi dung model, orchestrator kiem soat tai nguyen (parallel limit, heavy lock, ha cap tu dong)
**Depends on**: Nothing (nen tang cho toan bo v2.1)
**Requirements**: ORCH-01, ORCH-02, ORCH-03, ORCH-04
**Status**: Complete (2026-03-24)

### Phase 29: Evidence Protocol & Session Management
**Goal**: Moi agent giao tiep qua evidence files voi format chuan, user co the tiep tuc phien debug cu
**Depends on**: Phase 28
**Requirements**: PROT-01, PROT-02, PROT-05, PROT-07
**Plans**: 3 plans
**Success Criteria** (what must be TRUE):
  1. User thay danh sach phien debug danh so khi khoi dong `pd:fix-bug`, co the chon tiep tuc hoac tao moi
  2. Moi agent tra ket qua theo dung 1 trong 3 outcomes: ROOT CAUSE FOUND, CHECKPOINT REACHED, hoac INVESTIGATION INCONCLUSIVE
  3. Khi INCONCLUSIVE, evidence file chua Elimination Log liet ke files/logic da kiem tra va xac nhan binh thuong
  4. Evidence file tu agent truoc la input chinh thuc cua agent sau — agent khong doc lai toan bo codebase ma doc evidence

### Phase 30: Detective Interactions
**Goal**: User tuong tac voi orchestrator qua 3 nhanh ket qua (ROOT CAUSE, CHECKPOINT, parallel dispatch) mot cach tu nhien
**Depends on**: Phase 29
**Requirements**: PROT-03, PROT-04, PROT-06, PROT-08
**Plans**: 3 plans
**Success Criteria** (what must be TRUE):
  1. Khi ROOT CAUSE duoc tim thay, user duoc hien 3 lua chon: Sua ngay, Len ke hoach, Tu sua — va orchestrator hanh dong dung theo lua chon
  2. Khi agent ghi CHECKPOINT REACHED, orchestrator hien cau hoi cho user va truyen cau tra loi cho agent tiep theo
  3. Khi user tra loi CHECKPOINT, orchestrator spawn Continuation Agent moi tiep nhan context tu evidence files truoc do
  4. Code Detective va Doc Specialist chay song song thanh cong, ca 2 doc evidence_janitor.md ma khong xung dot file

### Phase 31: Project Memory & Regression Detection
**Goal**: He thong nho lich su bug va canh bao regression truoc khi fix, giam lap lai cung loi
**Depends on**: Phase 29
**Requirements**: MEM-01, MEM-02, MEM-03, MEM-04
**Success Criteria** (what must be TRUE):
  1. Janitor tu dong tim bug tuong tu tu `.planning/bugs/` bang keyword matching va ghi ket qua vao evidence
  2. Khi loi hien tai khop >= 2/3 tieu chi (file, function, error message) voi bug cu, orchestrator hien canh bao regression ro rang
  3. Fix Architect kiem tra fix moi khong pha vo cac fix cu lien quan truoc khi ra phan quyet cuoi cung
  4. `.planning/bugs/INDEX.md` duoc tu dong tao va cap nhat, liet ke tat ca bug theo file/function/keyword
**Plans**: 2 plans

Plans:
- [ ] 31-01-PLAN.md — TDD bug-memory.js (createBugRecord, searchBugs, buildIndex)
- [ ] 31-02-PLAN.md — Cap nhat agent prompts (Janitor ghi "Bug tuong tu", Architect kiem tra regression)

### Phase 32: Orchestrator Workflow
**Goal**: 5-buoc execution loop hoan chinh: Janitor -> Detective+DocSpec -> Repro -> Architect -> Fix+Commit
**Depends on**: Phase 28, Phase 29, Phase 30, Phase 31
**Requirements**: FLOW-01, FLOW-02, FLOW-03, FLOW-04, FLOW-05, FLOW-08
**Success Criteria** (what must be TRUE):
  1. Buoc 1: Janitor agent (scout/haiku) duoc spawn, thu thap trieu chung va kiem tra session cu, ghi evidence_janitor.md
  2. Buoc 2: Code Detective (builder/sonnet) va Doc Specialist (scout/haiku) duoc spawn song song sau khi Janitor hoan tat
  3. Buoc 3: Repro Engineer (builder/sonnet) tao Red Test tu evidence Buoc 2, tai su dung repro-test-generator.js
  4. Buoc 4: Fix Architect (architect/opus) tong hop evidence va ra phan quyet, tai su dung regression-analyzer.js
  5. Buoc 5: Orchestrator truc tiep sua code, chay test, commit voi tag [LOI], goi debug-cleanup.js va logic-sync.js tu v1.5
**Plans**: TBD

### Phase 33: Resilience & Backward Compatibility
**Goal**: Workflow xu ly duoc moi truong hop loi va tuong thich nguoc voi v1.5 single-agent mode
**Depends on**: Phase 32
**Requirements**: FLOW-06, FLOW-07
**Success Criteria** (what must be TRUE):
  1. Khi INCONCLUSIVE o Buoc 4, orchestrator quay lai Buoc 2 voi Elimination Log va thong tin moi tu user (toi da 3 vong)
  2. User co the chay `pd:fix-bug --single` hoac khi khong co agent configs, workflow tu dong dung v1.5 single-agent mode
  3. Orchestrator an chi tiet agent spawning, chi hien ket qua cuoi cung va milestones chinh cho user (progressive disclosure)
  4. Toan bo 601+ tests hien tai van pass, converter pipeline xu ly agent files moi, snapshots duoc cap nhat
**Plans**: TBD

## Progress

**Thu tu thuc hien:** Phase 28 -> 29 -> 30 (song song voi 31) -> 32 -> 33

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
| 25. Dieu tra & Tai hien Loi | v1.5 | 4/4 | Complete | 2026-03-24 |
| 26. Don dep & An toan | v1.5 | 2/2 | Complete | 2026-03-24 |
| 27. Dong bo Logic & Bao cao | v1.5 | 2/2 | Complete | 2026-03-24 |
| 28. Agent Infrastructure & Resource Rules | v2.1 | 2/2 | Complete | 2026-03-24 |
| 29. Evidence Protocol & Session Management | v2.1 | 3/3 | Complete    | 2026-03-25 |
| 30. Detective Interactions | v2.1 | 3/3 | Complete    | 2026-03-25 |
| 31. Project Memory & Regression Detection | v2.1 | 0/2 | Not started | - |
| 32. Orchestrator Workflow | v2.1 | 0/? | Not started | - |
| 33. Resilience & Backward Compatibility | v2.1 | 0/? | Not started | - |
