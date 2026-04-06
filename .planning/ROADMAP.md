# Roadmap: Please-Done Workflow Optimization

## Milestones

- ✅ **v1.0 Workflow Optimization** — Phases 1-9 (shipped 2026-03-22)
- ✅ **v1.1 Plan Checker** — Phases 10-13 (shipped 2026-03-23)
- ✅ **v1.2 Skill Audit & Bug Fixes** — Phases 14-16 (shipped 2026-03-23)
- ✅ **v1.3 Truth-Driven Development** — Phases 17-20 (shipped 2026-03-24)
- ✅ **v1.4 Mermaid Diagrams** — Phases 21-24 (shipped 2026-03-24)
- ✅ **v1.5 Nang cap Skill Fix-Bug** — Phases 25-27 (shipped 2026-03-24)
- ✅ **v2.1 Detective Orchestrator** — Phases 28-37 (shipped 2026-03-25)
- ✅ **v3.0 Research Squad** — Phases 38-45 (shipped 2026-03-26)
- ✅ **v4.0 OWASP Security Audit** — Phases 46-51 (shipped 2026-03-27)
- ✅ **v5.0 Repo Optimization** — Phases 52-59 (shipped 2026-03-27)
- ✅ **v5.1 Agent Sync & Reference Update** — Phases 60-64 (shipped 2026-03-27)
- ✅ **v6.0 Vietnamese → English Migration** — Phases 65-70 (shipped 2026-03-29)
- ✅ **v7.0 Standalone Test Mode** — Phases 71-75 (shipped 2026-04-02)
- ✅ **v9.0 Bug Audit & Robustness** — Phases 81-82 (shipped 2026-04-03)
- ✅ **v10.0 Skill Repo Audit Fixes** — Phases 84-87 (complete)
- ✅ **v11.0 Developer Tooling & Observability** — Phases 88-99 (shipped 2026-04-04)
- ✅ **v11.1 Documentation Improvements** — Phases 100-105 ([shipped 2026-04-04](milestones/v11.1-ROADMAP.md))
- ✅ **v12.0 Pentest & Red Team Enhancement** — Phases 112-124 (shipped 2026-04-06)
- 🔄 **v12.1 Quality Hardening** — Phases 125-135 (in progress)

## Progress

19 milestones defined. 124 phases completed.

## Phases

---

## v12.1 Quality Hardening (In Progress)

**Goal:** Fix critical bugs and improve developer experience

**Requirements:** C-01, C-02, C-04, H-01, H-02, H-03, H-06, H-07

**Phases:** 8 phases | **Estimated Plans:** 8 plans

### Phase 125: Command Reference Fixes (C-01)

**Goal:** Fix 5 broken command references in CLAUDE.md
**Depends on:** Nothing
**Requirements:** C-01

**Plans:**
- [x] 125-01-PLAN.md — Fix broken command references

### Phase 126: Test Infrastructure (C-02)

**Goal:** Fix test script for complete coverage
**Depends on:** Nothing
**Requirements:** C-02

**Plans:**
- [ ] 126-01-PLAN.md — Fix test script and add coverage

### Phase 127: Documentation Updates (C-04, H-03)

**Goal:** Update CHANGELOG and create missing command docs
**Depends on:** Nothing
**Requirements:** C-04, H-03

**Plans:**
- [x] 127-01-PLAN.md — Update CHANGELOG
- [x] 127-02-PLAN.md — Create missing command docs

### Phase 128: Code Quality - Catch Blocks (H-01)

**Goal:** Fix bare catch blocks with proper logging
**Depends on:** Nothing
**Requirements:** H-01

**Plans:**
- [ ] 128-01-PLAN.md — Fix catch blocks with log.warn

### Phase 129: Installer Refactor (H-02)

**Goal:** Refactor process.exit(1) in claude.js installer
**Depends on:** Nothing
**Requirements:** H-02

**Plans:**
- [ ] 129-01-PLAN.md — Replace process.exit with throw

### Phase 130: Project Hygiene (H-06)

**Goal:** Cleanup orphaned files
**Depends on:** Nothing
**Requirements:** H-06

**Plans:**
- [x] 130-01-PLAN.md — Archive and cleanup orphaned files

### Phase 131: Universal Runtime Support (H-07)

**Goal:** Implement universal cross-runtime support
**Depends on:** Nothing
**Requirements:** H-07

**Plans:**
- [ ] 131-01-PLAN.md — Create AGENTS.md and sync script

### Phase 132: Complete H-01 Catch Block Implementation

**Goal:** Fix bare catch blocks with proper logging
**Depends on:** Nothing
**Requirements:** H-01
**Gap Closure:** Closes H-01 requirement (Phase 128 context gathered but never executed)

### Phase 133: Add Missing VERIFICATION.md

**Goal:** Add gsd-verifier format verification for completed phases
**Depends on:** Nothing
**Requirements:** C-01, C-02
**Gap Closure:** Adds VERIFICATION.md for Phases 125 and 126

### Phase 134: Upgrade VERIFICATION.md Templates

**Goal:** Migrate simple templates to gsd-verifier format
**Depends on:** Nothing
**Requirements:** H-06, H-07
**Gap Closure:** Upgrades Phases 130-131 verification to full gsd-verifier format

### Phase 135: Fix Traceability Table

**Goal:** Correct REQUIREMENTS.md traceability misalignments
**Depends on:** Nothing
**Gap Closure:** Fixes H-02→86, H-03→127, H-06→130, H-07→131 phase mappings

<details>
<summary>✅ v1.0 Workflow Optimization (Phases 1-9) — SHIPPED 2026-03-22</summary>

- [x] Phase 1: Foundation (3/3 plans) — completed 2026-03-22
- [x] Phase 2: Authentication (2/2 plans) — completed 2026-03-22
- [x] Phase 3: Core Features (6/6 plans) — completed 2026-03-22
- [x] Phase 4: Conditional Context Loading (2/2 plans) — completed 2026-03-22
- [x] Phase 5: Effort-Level Routing (2/2 plans) — completed 2026-03-22
- [x] Phase 6: Context7 Standardization (2/2 plans) — completed 2026-03-22
- [x] Phase 7: Library Fallback (1/1 plan) — completed 2026-03-22
- [x] Phase 8: Wave-Based Parallel Execution (2/2 plans) — completed 2026-03-22
- [x] Phase 9: Converter Pipeline Optimization (2/2 plans) — completed 2026-03-22

Full details: `.planning/milestones/v1.0-ROADMAP.md`

</details>

*(Các milestones v1.1-v11.0 được archive tương tự — xem `.planning/milestones/`)*

<details>
<summary>✅ v11.0 Developer Tooling & Observability (Phases 88-99) — SHIPPED 2026-04-04</summary>

- [x] Phase 88: LOG-01 — Agent Error Logging Foundation
- [x] Phase 89: LOG-01 — Integration & Workflow Wiring
- [x] Phase 90: STATUS-01 — Status Dashboard Core
- [x] Phase 91: STATUS-01 — Workflow Integration
- [x] Phase 92: ONBOARD-01 — Onboarding Skill Foundation
- [x] Phase 93: ONBOARD-01 — Context Generation & Summary
- [x] Phase 94: ONBOARD-01 — Workflow Integration & Testing
- [x] Phase 95: LINT-01 — Lint Failure Tracking
- [x] Phase 96: LINT-01 — Recovery Workflow & UI
- [x] Phase 97: STALE-01 — Staleness Detection Core
- [x] Phase 98: STALE-01 — Map Metadata & Refresh
- [x] Phase 99: INTEG-01 — Contract Test Foundation

Full details: `.planning/milestones/v11.0-ROADMAP.md`

</details>

---

## 🔄 v11.2 Vietnamese Documentation (In Progress)

**Goal:** Tạo phiên bản song ngữ Anh-Việt cho toàn bộ tài liệu hướng dẫn.

**Requirements:** I18N-01, I18N-02, I18N-03, I18N-04, I18N-05, I18N-06

**Phases:** 6 phases | **Estimated Plans:** 6 plans

### Phase 106: I18N-01 — README Song Ngữ ✅
**Status:** Complete | **Plans:** 1 plan
**Date:** 2026-04-04
**Goal:** Tạo phiên bản README tiếng Việt song song với bản tiếng Anh.
**Success Criteria:**
1. ✅ File `README.vi.md` với nội dung đầy đủ (758 lines)
2. ✅ Liên kết chuyển đổi ngôn ngữ ở đầu mỗi file
3. ✅ Giữ nguyên cấu trúc và format

**Plans:**
- [x] 106-01-PLAN.md — Create README.vi.md with full Vietnamese translation and language switcher

### Phase 107: I18N-02 — CLAUDE.md Song Ngữ
**Status:** Planned | **Plans:** 1/1 plans complete
**Goal:** Tạo phiên bản CLAUDE.md tiếng Việt.
**Success Criteria:**
1. File `CLAUDE.vi.md` với toàn bộ nội dung
2. Dịch chuẩn xác các thuật ngữ kỹ thuật
3. Giữ nguyên tất cả ví dụ và workflow

**Plans:**
- [x] 107-01-PLAN.md — Create CLAUDE.vi.md with full Vietnamese translation and language switcher

### Phase 108: I18N-03 — Command Cheat Sheet Tiếng Việt
**Status:** Planned | **Plans:** 1/1 plans complete
**Goal:** Tạo cheat sheet tiếng Việt.
**Success Criteria:**
1. File `docs/cheatsheet.vi.md`
2. Dịch descriptions và explanations
3. Giữ nguyên commands và flags

**Plans:**
- [x] 108-01-PLAN.md — Create docs/cheatsheet.vi.md with full Vietnamese translation and language switchers

### Phase 109: I18N-04 — Workflow Guides Tiếng Việt
**Goal:** Dịch các workflow guides sang tiếng Việt.
**Success Criteria:**
1. `docs/workflows/getting-started.vi.md`
2. `docs/workflows/bug-fixing.vi.md`
3. `docs/workflows/milestone-management.vi.md`

### Phase 110: I18N-05 — Skill Reference Cards Tiếng Việt
**Goal:** Dịch 16 skill cards sang tiếng Việt.
**Success Criteria:**
1. 16 files `docs/skills/*.vi.md`
2. Index `docs/skills/index.vi.md`
3. Cấu trúc giống bản gốc
**Plans:** 4/4 plans complete

**Plan List:**
- [x] 110-01-PLAN.md — Translate index, onboard, init, scan (Wave 1: Core Skills)
- [x] 110-02-PLAN.md — Translate plan, write-code, test, new-milestone (Wave 2: Project Skills)
- [x] 110-03-PLAN.md — Translate fix-bug, complete-milestone, audit, research (Wave 3: Debug + Complete)
- [x] 110-04-PLAN.md — Translate what-next, status, conventions, fetch-doc, update (Wave 4: Utility Skills)

### Phase 111: I18N-06 — Error Troubleshooting Tiếng Việt
**Status:** Planned | **Plans:** 1/1 plans complete
**Goal:** Dịch error troubleshooting guide.
**Success Criteria:**
1. `docs/error-troubleshooting.vi.md`
2. Dịch error messages và suggested actions
3. Giữ nguyên commands

**Plans:**
- [x] 111-01-PLAN.md — Create docs/error-troubleshooting.vi.md with full Vietnamese translation and language switcher

---

<details>
<summary>✅ v12.0 Pentest & Red Team Enhancement (Phases 112-124) — SHIPPED 2026-04-06</summary>

- [x] Phase 112: PTES Foundation (2/2 plans) — completed 2026-04-05
- [x] Phase 113: Intelligence Gathering Core (2/2 plans) — completed 2026-04-06
- [x] Phase 114: Intelligence Gathering Extended (2/2 plans) — completed 2026-04-06
- [x] Phase 115: Advanced Reconnaissance (3/3 plans) — completed 2026-04-06
- [x] Phase 116: OSINT Intelligence (2/2 plans) — completed 2026-04-06
- [x] Phase 117: Payload Development (2/2 plans) — completed 2026-04-06
- [x] Phase 118: Token Analysis (2/2 plans) — completed 2026-04-06
- [x] Phase 119: Post-Exploitation (2/2 plans) — completed 2026-04-06
- [x] Phase 120: Code Libraries (2/2 plans) — completed 2026-04-06
- [x] Phase 121: AI Agents (2/2 plans) — completed 2026-04-06
- [x] Phase 122: Data Files (2/2 plans) — completed 2026-04-06
- [x] Phase 123: Integration (2/2 plans) — completed 2026-04-06
- [x] Phase 124: Testing & Documentation (2/2 plans) — completed 2026-04-06

Full details: `.planning/milestones/v12.0-ROADMAP.md`

</details>

---

## Backlog

> Parking lot for unsequenced improvement ideas.

*(Backlog hiện trống)*

---

## Completed Milestones

See `.planning/milestones/` for archived milestone details:
- [v12.0 Pentest & Red Team Enhancement](milestones/v12.0-ROADMAP.md) — 13 phases, 47 requirements (PTES, RECON, OSINT, PAYLOAD, TOKEN, POST, LIB, AGENT, DATA, INT)
- [v11.1 Documentation Improvements](milestones/v11.1-ROADMAP.md) — 6 phases, 6 requirements (DOC-01 to DOC-06)
