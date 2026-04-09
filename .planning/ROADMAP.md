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
- 🔵 **v12.5 Installer UX & Runtime Expansion** — Phases 153-154 (active)

## Progress

24 milestones total. 152 phases completed. v12.5 active (phases 153-154).

---

## Active Milestone: v12.5 Installer UX & Runtime Expansion

### Phases

- [x] **Phase 153: Installer UX Polish** — ASCII banner, colorized help, progress steps with ✓/✗ (completed 2026-04-09)
- [ ] **Phase 154: Runtime Expansion** — 6 new runtimes + --config-dir + --force-statusline

### Phase Details

#### Phase 153: Installer UX Polish
**Goal**: Users see a polished, professional installer experience with visual feedback
**Depends on**: Nothing (first phase of v12.5)
**Requirements**: UX-01, UX-02, UX-03
**Success Criteria** (what must be TRUE):
  1. User sees styled ASCII art banner in cyan at installer startup (TTY only)
  2. User running `--help` sees colorized output with all 11 runtimes, flags, and examples
  3. User sees numbered progress steps `[1/N]` with ✓/✗ outcomes during install
  4. User sees final summary showing file count and destination path
**Plans**: TBD

#### Phase 154: Runtime Expansion
**Goal**: Users can install skills to 6 additional AI coding runtimes with flexible config
**Depends on**: Phase 153
**Requirements**: RT-01, RT-02, RT-03, RT-04, RT-05, RT-06, CFG-01, CFG-02
**Success Criteria** (what must be TRUE):
  1. User can install to Kilo (`~/.config/kilo/`) via `--kilo` flag
  2. User can install to Antigravity (`~/.gemini/antigravity/`) via `--antigravity` flag
  3. User can install to Cursor (`~/.cursor/`) via `--cursor` flag
  4. User can install to Windsurf (`~/.codeium/windsurf/`) via `--windsurf` flag
  5. User can install to Augment (`~/.augment/`) via `--augment` flag
  6. User can install to Trae (`~/.trae/`) via `--trae` flag
  7. User can override default config directory with `--config-dir <path>` / `-c`
  8. User can force statusline replacement in IDE editors with `--force-statusline`
  9. All 6 new runtimes appear in `--all` and interactive menu
**Plans**: TBD

### Progress Table

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 153. Installer UX Polish | 1/1 | Complete   | 2026-04-09 |
| 154. Runtime Expansion | 0/? | Not started | - |

---

## Backlog

> Parking lot for unsequenced improvement ideas.

*(Backlog is empty)*

---

## Completed Milestones

See `.planning/milestones/` for archived milestone details:
- [v12.4 Convention-Aware Skill Execution](milestones/v12.4-ROADMAP.md) — 2 phases, 2 plans (CONVENTIONS.md migration, skill injection for write-code/fix-bug/plan)
- [v12.3 Installation & Documentation UX](milestones/v12.3-ROADMAP.md) — 6 phases, 14 plans (prompt-ux, reliability, error-messages, cheatsheet, command-reference, workflow-overview, getting-started, readme-update)
- [v12.2 Developer Experience Improvements](milestones/v12.2-ROADMAP.md) — 8 phases, 9 plans (stats, health, version-sync, mcp-discovery, audit-trail, scope-checker, drift-detector)
- [v12.1 Quality Hardening](milestones/v12.1-ROADMAP.md) — 12 phases, 12 plans (command fixes, test infra, catch blocks, AGENTS.md)
- [v12.0 Pentest & Red Team Enhancement](milestones/v12.0-ROADMAP.md) — 13 phases, 47 requirements (PTES, RECON, OSINT, PAYLOAD, TOKEN, POST, LIB, AGENT, DATA, INT)
- [v11.1 Documentation Improvements](milestones/v11.1-ROADMAP.md) — 6 phases, 6 requirements (DOC-01 to DOC-06)

---

<!-- v12.3 details archived → .planning/milestones/v12.3-ROADMAP.md -->

