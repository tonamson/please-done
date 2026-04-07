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
- ✅ **v12.0 Pentest & Red Team Enhancement** — Phases 112-124 ([shipped 2026-04-06](milestones/v12.0-ROADMAP.md))
- ✅ **v12.1 Quality Hardening** — Phases 125-136 ([shipped 2026-04-06](milestones/v12.1-ROADMAP.md))

## Progress

20 milestones completed. 136 phases completed.

---

## 🔄 v12.2 Developer Experience Improvements (In Progress)

**Goal:** Enhance workflow tooling with stats, health checks, automation commands, and detection features.

**Requirements:** L-01, L-02, L-03, L-04, L-05, L-06, L-07, L-08

**Phases:** 8 phases (137-144) | **Estimated Plans:** 8 plans

## Phases

- [x] **Phase 137: Workflow Command Merge** — Merge pd:next into pd:what-next with auto-execute (completed 2026-04-06)
- [x] **Phase 138: Project Statistics Command** — pd:stats for phase/plan/requirement metrics (completed 2026-04-06)
- [x] **Phase 139: Planning Health Diagnostics** — pd:health for directory issue diagnosis (completed 2026-04-06)
- [x] **Phase 140: Version Badge Automation** — Sync version across docs on milestone completion (completed 2026-04-07)
- [x] **Phase 141: MCP Tool Discovery** — Auto-discover and inventory available MCP tools (completed 2026-04-07)
- [x] **Phase 142: Discussion Audit Trail** — Track conversation context across sessions (completed 2026-04-07)
- [x] **Phase 143: Scope Reduction Detection** — Warn when plan scope shrinks during execution (completed 2026-04-07)
- [ ] **Phase 144: Schema Drift Detection** — Detect and report planning file schema changes

## Phase Details

### Phase 137: Workflow Command Merge
**Goal**: Users get a unified next-action command that can show suggestions or auto-execute the appropriate workflow step
**Depends on**: Nothing (first phase)
**Requirements**: L-02
**Success Criteria** (what must be TRUE):
  1. Running `pd:what-next` shows current project state and recommended next action without executing
  2. Running `pd:what-next --execute` automatically detects state and runs the recommended command
  3. Advisory mode (default) preserves existing behavior — shows suggestion, waits for user confirmation
  4. All pd:next behavior is fully subsumed — no functionality lost
**Plans**: 1 plan
- [x] 137-01-PLAN.md — Merge auto-execute from pd:next into pd:what-next with --execute flag

### Phase 138: Project Statistics Command
**Goal**: Users can view comprehensive project statistics from the command line for quick status assessment
**Depends on**: Nothing
**Requirements**: L-03
**Success Criteria** (what must be TRUE):
  1. `pd:stats` displays phase count, plan count, requirement count, and milestone progress as a readable table
  2. Output includes timeline with milestone start/completion dates
  3. `--json` flag produces machine-readable JSON output with all metrics
  4. LOC counts and file counts are included in the statistics summary
**Plans**: 1 plan
- [x] 138-01-PLAN.md — Create stats-collector library and pd:stats skill with table/JSON output

### Phase 139: Planning Health Diagnostics
**Goal**: Users can diagnose and fix planning directory issues without manual investigation
**Depends on**: Nothing
**Requirements**: L-04
**Success Criteria** (what must be TRUE):
  1. `pd:health` scans `.planning/` directory and reports missing files (VERIFICATION.md, SUMMARY.md)
  2. Issues are classified with severity levels (critical, warning, info) for prioritization
  3. Each issue includes a suggested fix command or concrete remediation action
  4. STATE.md structure validation confirms all required fields are present and valid
**Plans**: 1 plan
- [x] 139-01-PLAN.md — Create health-checker library, tests, and pd:health skill file

### Phase 140: Version Badge Automation
**Goal**: Version numbers stay synchronized across all project files without manual updates
**Depends on**: Nothing
**Requirements**: L-01
**Success Criteria** (what must be TRUE):
  1. Version in README.md, CLAUDE.md, and package.json is kept in sync automatically
  2. `--check` flag validates version consistency across files without making changes
  3. Version mismatches are detected and reported with specific file locations and expected vs actual values
  4. Sync triggers on milestone completion to update all version references
**Plans**: 1 plan
- [x] 140-01-PLAN.md — TDD library + skill file + complete-milestone integration for version sync

### Phase 141: MCP Tool Discovery
**Goal**: Users can see which MCP tools are available, configured, and functional in their environment
**Depends on**: Nothing
**Requirements**: L-05
**Success Criteria** (what must be TRUE):
  1. Available MCP tools are auto-discovered and listed with names and descriptions
  2. Configured tools are distinguished from merely available ones in the output
  3. Tool inventory includes capability descriptions for debugging configuration
  4. Output clearly shows which tools are ready to use vs missing setup
**Plans**: 1 plan
- [ ] 141-01-PLAN.md — TDD library + skill file for MCP tool discovery across 12 platforms

### Phase 142: Discussion Audit Trail
**Goal**: Conversation context persists across sessions so users can seamlessly resume paused work
**Depends on**: Nothing
**Requirements**: L-06
**Success Criteria** (what must be TRUE):
  1. Discussion summaries are automatically stored in `.planning/contexts/` directory
  2. Paused work can be resumed with full context restoration from stored summaries
  3. Past discussions are searchable by keyword or date range
  4. Session history tracks key decisions and outcomes across multiple conversation instances
**Plans**: 1 plan
- [x] 142-01-PLAN.md — TDD library + pd:audit skill file for context parsing and search

### Phase 143: Scope Reduction Detection
**Goal**: Users are proactively warned when plan scope shrinks unexpectedly during execution, preventing silent requirement loss
**Depends on**: Phase 139 (health check patterns)
**Requirements**: L-07
**Success Criteria** (what must be TRUE):
  1. Task counts between plan and execution are compared automatically to detect reduction
  2. Dropped requirements mid-milestone trigger a visible warning with specific requirement IDs
  3. Scope changes appear in milestone audit output with before/after comparison
  4. Warning message includes specifics on what was removed or reduced, not just a generic alert
**Plans**: TBD

### Phase 144: Schema Drift Detection
**Goal**: Planning file schema changes are detected early so users can migrate before data loss or corruption
**Depends on**: Phase 139 (health check patterns)
**Requirements**: L-08
**Success Criteria** (what must be TRUE):
  1. STATE.md structure is validated against the expected schema with field-level comparison
  2. `gsd_state_version` is checked against supported versions and outdated versions are flagged
  3. Migration requirements are reported when drift is detected, including which fields changed
  4. Detection can run standalone or as part of health check diagnostics
**Plans**: TBD

---

## Progress Table

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 137. Workflow Command Merge | 1/1 | Complete    | 2026-04-06 |
| 138. Project Statistics Command | 1/1 | Complete    | 2026-04-06 |
| 139. Planning Health Diagnostics | 1/1 | Complete    | 2026-04-06 |
| 140. Version Badge Automation | 1/1 | Complete    | 2026-04-07 |
| 141. MCP Tool Discovery | 1/1 | Complete    | 2026-04-07 |
| 142. Discussion Audit Trail | 2/2 | Complete    | 2026-04-07 |
| 143. Scope Reduction Detection | 1/1 | Complete    | 2026-04-07 |
| 144. Schema Drift Detection | 0/1 | Planned    |  |

---

## Backlog

> Parking lot for unsequenced improvement ideas.

*(Backlog is empty)*

---

## Completed Milestones

See `.planning/milestones/` for archived milestone details:
- [v12.1 Quality Hardening](milestones/v12.1-ROADMAP.md) — 12 phases, 12 plans (command fixes, test infra, catch blocks, AGENTS.md)
- [v12.0 Pentest & Red Team Enhancement](milestones/v12.0-ROADMAP.md) — 13 phases, 47 requirements (PTES, RECON, OSINT, PAYLOAD, TOKEN, POST, LIB, AGENT, DATA, INT)
- [v11.1 Documentation Improvements](milestones/v11.1-ROADMAP.md) — 6 phases, 6 requirements (DOC-01 to DOC-06)
