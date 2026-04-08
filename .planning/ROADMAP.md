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
- ✅ **v12.2 Developer Experience Improvements** — Phases 137-144 ([shipped 2026-04-07](milestones/v12.2-ROADMAP.md))
- ✅ **v12.3 Installation & Documentation UX** — Phases 145-150 ([shipped 2026-04-08](milestones/v12.3-ROADMAP.md))
- 🚧 **v12.4 Convention-Aware Skill Execution** — Phases 151-152 (active)

## Progress

22 milestones completed. 150 phases completed. v12.4 in progress.

---

## v12.4 Convention-Aware Skill Execution

### Phases

- [ ] **Phase 151: Convention File Migration** - Replace CLAUDE.md with universal CONVENTIONS.md
- [ ] **Phase 152: Skill Injection** - Update code-writing skills to read CONVENTIONS.md

### Phase Details

#### Phase 151: Convention File Migration
**Goal**: Project uses universal CONVENTIONS.md instead of Claude-specific CLAUDE.md
**Depends on**: Nothing (first phase of v12.4)
**Requirements**: CONV-01, CONV-02
**Success Criteria** (what must be TRUE):
  1. Running `pd:conventions` creates/updates `CONVENTIONS.md` at project root
  2. `CONVENTIONS.md` contains the same content format as previous CLAUDE.md (naming, style, patterns)
  3. Project no longer has a `CLAUDE.md` file (removed or replaced)
**Plans**: TBD

#### Phase 152: Skill Injection
**Goal**: Code-writing skills explicitly read CONVENTIONS.md so any AI model follows project conventions
**Depends on**: Phase 151
**Requirements**: CONV-03, CONV-04, CONV-05
**Success Criteria** (what must be TRUE):
  1. `pd:write-code` prompt includes instruction to read `CONVENTIONS.md` if it exists before writing code
  2. `pd:fix-bug` prompt includes instruction to read `CONVENTIONS.md` if it exists before fixing code
  3. `pd:plan` prompt includes instruction to read `CONVENTIONS.md` if it exists when structuring tasks
  4. Any AI model (not just Claude) following the skill prompts will see and apply project conventions
**Plans**: TBD

### v12.4 Progress

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 151. Convention File Migration | 0/? | Not started | - |
| 152. Skill Injection | 0/? | Not started | - |

---

## Backlog

> Parking lot for unsequenced improvement ideas.

*(Backlog is empty)*

---

## Completed Milestones

See `.planning/milestones/` for archived milestone details:
- [v12.3 Installation & Documentation UX](milestones/v12.3-ROADMAP.md) — 6 phases, 14 plans (prompt-ux, reliability, error-messages, cheatsheet, command-reference, workflow-overview, getting-started, readme-update)
- [v12.2 Developer Experience Improvements](milestones/v12.2-ROADMAP.md) — 8 phases, 9 plans (stats, health, version-sync, mcp-discovery, audit-trail, scope-checker, drift-detector)
- [v12.1 Quality Hardening](milestones/v12.1-ROADMAP.md) — 12 phases, 12 plans (command fixes, test infra, catch blocks, AGENTS.md)
- [v12.0 Pentest & Red Team Enhancement](milestones/v12.0-ROADMAP.md) — 13 phases, 47 requirements (PTES, RECON, OSINT, PAYLOAD, TOKEN, POST, LIB, AGENT, DATA, INT)
- [v11.1 Documentation Improvements](milestones/v11.1-ROADMAP.md) — 6 phases, 6 requirements (DOC-01 to DOC-06)

---

<!-- v12.3 details archived → .planning/milestones/v12.3-ROADMAP.md -->

