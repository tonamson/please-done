# v12.3 Requirements: Installation & Documentation UX

**Milestone:** v12.3  
**Goal:** Make it possible for a new user to install and understand pd commands in under 5 minutes.  
**Defined:** 2026-04-07

---

## v1 Requirements

### Installation UX

- [x] **INSTALL-01**: User sees clear progress steps during installation
  - Each step has a label (e.g., "Installing Claude Code skills…")
  - Per-step success/failure indicator (✓ / ✗)
  - No silent operations — every action is announced

- [ ] **INSTALL-02**: When installation fails, user knows the reason and how to fix it
  - Actionable error messages replace raw stack traces
  - Each error category (missing deps, permission, platform) has a specific fix hint
  - Exit code is non-zero on failure

- [x] **INSTALL-03**: Running the installer again does not break an existing install
  - Already-installed files show "already installed" status, not errors
  - Re-run updates only changed files
  - Version upgrade path is handled gracefully

- [ ] **INSTALL-04**: Interactive platform selector is intuitive
  - Arrow-key navigation (or numbered choice fallback for non-TTY)
  - Each platform shows a one-line description
  - Selected platform is confirmed before proceeding

### Documentation

- [ ] **DOCS-01**: README quick start reflects current command set
  - Commands match v12.2 feature set (no stale commands)
  - New commands (pd:stats, pd:health, pd:discover, pd:audit, pd:sync-version) included
  - Version badge updated to current version

- [ ] **DOCS-02**: docs/cheatsheet.md covers all 21 current commands
  - Adds pd:stats, pd:health, pd:discover, pd:audit, pd:sync-version sections
  - Each command has usage + one-line description
  - Removes or marks deprecated commands

- [ ] **DOCS-03**: docs/COMMAND_REFERENCE.md is rewritten as concise per-command reference
  - Each command: purpose (1 sentence) + syntax + real example
  - Inline — no links to missing commands/ subdirectory
  - Scannable at a glance (table format preferred)

- [ ] **DOCS-04**: docs/WORKFLOW_OVERVIEW.md is rewritten — short and flow-focused
  - Maximum 60 lines
  - Answers: "when do I use which command?"
  - Simple flow diagram (ASCII or Mermaid) showing the lifecycle

- [ ] **DOCS-05**: docs/GETTING_STARTED.md exists and guides a new user to first phase completion
  - Step-by-step: install → onboard → first plan → first phase done
  - Estimated time for each step
  - Common pitfalls called out inline

---

## Future Requirements (Deferred)

- Wave Execution (parallel plans within a phase) — M-01
- Verification Debt Tracking — M-07
- Ship Command (PR creation + review) — M-08
- Context Window Monitoring — M-05

---

## Out of Scope

- Vietnamese (vi) translations of new docs — translation pass is a separate milestone
- New CLI flags or command behavior changes — docs-only milestone
- Rewriting existing skill files — installation UX is limited to bin/install.js UX layer

---

## Traceability

| REQ-ID     | Phase | Status      |
|------------|-------|-------------|
| INSTALL-01 | 146   | Not started |
| INSTALL-02 | 147   | Not started |
| INSTALL-03 | 146   | Not started |
| INSTALL-04 | 145   | Not started |
| DOCS-01    | 150   | Not started |
| DOCS-02    | 148   | Not started |
| DOCS-03    | 148   | Not started |
| DOCS-04    | 149   | Not started |
| DOCS-05    | 149   | Not started |
