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
- 🚧 **v12.3 Installation & Documentation UX** — Phases 145-150 (in progress)

## Progress

21 milestones completed. 144 phases completed. v12.3 in progress (0/6 phases).

---

## Backlog

> Parking lot for unsequenced improvement ideas.

*(Backlog is empty)*

---

## Completed Milestones

See `.planning/milestones/` for archived milestone details:
- [v12.2 Developer Experience Improvements](milestones/v12.2-ROADMAP.md) — 8 phases, 9 plans (stats, health, version-sync, mcp-discovery, audit-trail, scope-checker, drift-detector)
- [v12.1 Quality Hardening](milestones/v12.1-ROADMAP.md) — 12 phases, 12 plans (command fixes, test infra, catch blocks, AGENTS.md)
- [v12.0 Pentest & Red Team Enhancement](milestones/v12.0-ROADMAP.md) — 13 phases, 47 requirements (PTES, RECON, OSINT, PAYLOAD, TOKEN, POST, LIB, AGENT, DATA, INT)
- [v11.1 Documentation Improvements](milestones/v11.1-ROADMAP.md) — 6 phases, 6 requirements (DOC-01 to DOC-06)

---

## v12.3 Installation & Documentation UX — Phases 145-150

**Goal:** Make it possible for a new user to install and understand pd commands in under 5 minutes.

### Phases

- [x] **Phase 145: Installer Prompt UX** — Extract prompt module, add TTY guard, numbered platform selector with descriptions (completed 2026-04-07)
- [x] **Phase 146: Installer Reliability** — Progress step labels throughout install + idempotent re-run detection (completed 2026-04-08)
- [ ] **Phase 147: Installer Error Messages** — Actionable error catalog replacing raw stack traces
- [ ] **Phase 148: Documentation Core** — Cheatsheet update (21 commands) + COMMAND_REFERENCE full rewrite
- [ ] **Phase 149: Documentation Flow** — WORKFLOW_OVERVIEW rewrite (Mermaid, ≤60 lines) + new GETTING_STARTED guide
- [ ] **Phase 150: README Update** — Surgical README fixes: version badge, command counts, new commands

### Progress

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 145. Installer Prompt UX | 4/4 | Complete   | 2026-04-07 |
| 146. Installer Reliability | 3/3 | Complete   | 2026-04-08 |
| 147. Installer Error Messages | 0/1 | Not started | - |
| 148. Documentation Core | 0/1 | Not started | - |
| 149. Documentation Flow | 0/1 | Not started | - |
| 150. README Update | 0/1 | Not started | - |

### Phase Details

#### Phase 145: Installer Prompt UX
**Goal**: Users choosing a runtime platform see numbered options with one-line descriptions and a printed confirmation; non-TTY environments get an explicit announcement instead of a silent default.
**Depends on**: Nothing (first phase)
**Requirements**: INSTALL-04
**Success Criteria** (what must be TRUE):
  1. Running the installer in a TTY displays numbered choices with platform descriptions (e.g., `1. Claude Code — AI-powered dev assistant`) rather than bare platform keys
  2. The selected platform is printed back to the user as a confirmation line before installation proceeds
  3. Running in non-TTY mode (piped stdin / CI) prints a message like "Non-interactive mode: installing globally" rather than silently defaulting
  4. Piped installer output contains zero raw ANSI escape sequences (`\x1b`) — TTY guard is active
**Plans**: 4 plans
  - [x] 145-01-PLAN.md — TTY guard on colorize() in utils.js
  - [x] 145-02-PLAN.md — Add description field to all 7 platforms
  - [x] 145-03-PLAN.md — Extract prompt.js module, add non-TTY handling, confirmation line
  - [x] 145-04-PLAN.md — Smoke tests for prompt UX improvements

---

#### Phase 146: Installer Reliability
**Goal**: Users see a labeled progress step for every outer install action, and re-running the installer on an up-to-date system exits cleanly without errors or duplicate work.
**Depends on**: Phase 145
**Requirements**: INSTALL-01, INSTALL-03
**Success Criteria** (what must be TRUE):
  1. Each outer install step prints a `[N/4]` label (e.g., `[1/4] Backing up locally modified files…`) — no silent operations
  2. Each completed step shows a ✓ or ✗ outcome indicator
  3. Re-running after a clean same-version install prints "Already at vX.Y, no changes needed" and exits 0
  4. Re-running after a version change logs an upgrade notice and proceeds normally (no errors or aborts)
**Plans**: 3 plans
  - [x] 146-01-PLAN.md — Add checkUpToDate utility to manifest.js, change log.step color to cyan
  - [x] 146-02-PLAN.md — Add step labels [1/4]-[4/4] and idempotent check to install()
  - [x] 146-03-PLAN.md — Smoke tests for checkUpToDate and step labels

---

#### Phase 147: Installer Error Messages
**Goal**: When installation fails, users see the specific error category, the cause, and an actionable fix hint — never a raw stack trace.
**Depends on**: Phase 145
**Requirements**: INSTALL-02
**Success Criteria** (what must be TRUE):
  1. A missing-dependency failure prints the dependency name and "Install via: [specific command]" — no stack trace
  2. A file permission error prints the affected path and a concrete fix suggestion (e.g., `sudo chown …`)
  3. All error paths exit with a non-zero exit code
  4. `main().catch()` never exposes raw `Error.stack` output to the terminal
**Plans**: TBD

---

#### Phase 148: Documentation Core
**Goal**: The cheatsheet and command reference accurately and concisely cover all 21 current commands with no stale counts, broken links, or missing entries.
**Depends on**: Nothing (independent of installer phases)
**Requirements**: DOCS-02, DOCS-03
**Success Criteria** (what must be TRUE):
  1. `docs/cheatsheet.md` contains entries for all 21 commands including `pd:stats`, `pd:health`, `pd:discover`, `pd:audit`, and `pd:sync-version`
  2. The cheatsheet intro paragraph says "21 commands" (no stale "16 commands" reference remains)
  3. `docs/COMMAND_REFERENCE.md` has a per-command block (purpose + syntax + example) for each of the 21 commands with no links to the `commands/` subdirectory
  4. Every command entry in COMMAND_REFERENCE includes a real usage example that matches v12.2 output
**Plans**: TBD
**UI hint**: yes

---

#### Phase 149: Documentation Flow
**Goal**: A new user can follow a visual lifecycle overview and a step-by-step guide from installation to completing their first phase.
**Depends on**: Phase 148 (GETTING_STARTED.md links to COMMAND_REFERENCE, which must exist first)
**Requirements**: DOCS-04, DOCS-05
**Success Criteria** (what must be TRUE):
  1. `docs/WORKFLOW_OVERVIEW.md` is ≤60 lines and contains a Mermaid `flowchart TD` diagram that answers "when do I use which command?"
  2. `docs/GETTING_STARTED.md` exists with 5 numbered steps (install → onboard → first plan → execute → done) each including an estimated time range
  3. Common pitfalls are called out inline in GETTING_STARTED.md (at least 3 pitfall callouts)
  4. All command references in GETTING_STARTED.md correspond to commands documented in COMMAND_REFERENCE.md
**Plans**: TBD
**UI hint**: yes

---

#### Phase 150: README Update
**Goal**: The README quick start is accurate for v12.3 — correct version badge, correct command count, and all five new commands visible in the skills reference.
**Depends on**: Phase 148, Phase 149 (README links to all other docs, which must exist first)
**Requirements**: DOCS-01
**Success Criteria** (what must be TRUE):
  1. The version badge in README.md reflects the current version (v12.3 or later — not a stale v4.0.0 or prior value)
  2. All five new commands (`pd:stats`, `pd:health`, `pd:discover`, `pd:audit`, `pd:sync-version`) appear in the README Skills Reference section
  3. Every "16 commands" or similarly stale count reference is replaced with "21 commands"
  4. The quick start section contains no commands that don't exist in the v12.2 command set
**Plans**: TBD
