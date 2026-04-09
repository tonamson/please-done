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
- ✅ **v12.4 Convention-Aware Skill Execution** — Phases 151-152 ([shipped 2026-04-08](milestones/v12.4-ROADMAP.md))
- ✅ **v12.5 Installer UX & Runtime Expansion** — Phases 153-154 ([shipped 2026-04-09](milestones/v12.5-ROADMAP.md))
- 🚧 **v12.6 GSD Independence Cleanup** — Phase 155 (active)

## Progress

26 milestones total (25 shipped, 1 active). 154 phases completed.

---

## Active Milestone

**v12.6 GSD Independence Cleanup** — Phase 155

| # | Phase | Goal | Requirements |
|---|-------|------|--------------|
| 155 | GSD Independence Audit & Cleanup | Remove all GSD references from repo source, verify skills are standalone, confirm tests pass | GSDC-01, GSDC-02, GSDC-03 |

### Phase 155: GSD Independence Audit & Cleanup
Goal: Audit every non-.planning file for GSD references, remove any found, update codebase architecture docs, and run full test suite to confirm no regressions.
Requirements: GSDC-01, GSDC-02, GSDC-03
Success criteria:
1. Zero GSD/get-shit-done references found in bin/, commands/, test/, docs/, templates/, scripts/, root files
2. All tests that were passing before v12.6 still pass after cleanup
3. Architecture docs describe pd as standalone (no GSD framing)

---

## Backlog

> Parking lot for unsequenced improvement ideas.

*(Backlog is empty)*

---

## Completed Milestones

See `.planning/milestones/` for archived milestone details:
- [v12.5 Installer UX & Runtime Expansion](milestones/v12.5-ROADMAP.md) — 2 phases, 2 plans (ASCII banner, colorized help, 11 runtimes)
- [v12.4 Convention-Aware Skill Execution](milestones/v12.4-ROADMAP.md) — 2 phases, 2 plans (CONVENTIONS.md migration, skill injection for write-code/fix-bug/plan)
- [v12.3 Installation & Documentation UX](milestones/v12.3-ROADMAP.md) — 6 phases, 14 plans (prompt-ux, reliability, error-messages, cheatsheet, command-reference, workflow-overview, getting-started, readme-update)
- [v12.2 Developer Experience Improvements](milestones/v12.2-ROADMAP.md) — 8 phases, 9 plans (stats, health, version-sync, mcp-discovery, audit-trail, scope-checker, drift-detector)
- [v12.1 Quality Hardening](milestones/v12.1-ROADMAP.md) — 12 phases, 12 plans (command fixes, test infra, catch blocks, AGENTS.md)
- [v12.0 Pentest & Red Team Enhancement](milestones/v12.0-ROADMAP.md) — 13 phases, 47 requirements (PTES, RECON, OSINT, PAYLOAD, TOKEN, POST, LIB, AGENT, DATA, INT)
- [v11.1 Documentation Improvements](milestones/v11.1-ROADMAP.md) — 6 phases, 6 requirements (DOC-01 to DOC-06)

---

<!-- v12.5 details archived → .planning/milestones/v12.5-ROADMAP.md -->

