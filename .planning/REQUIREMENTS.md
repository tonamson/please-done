# Requirements: Developer Experience & Quality Hardening

**Defined:** 2026-04-02
**Core Value:** Every workflow step must produce the highest quality code output while consuming the minimum tokens and time

## v8.0 Requirements

Requirements for implementing all 9 improvement proposals from de_xuat_cai_tien.md.

### New Skills

- [ ] **ONBOARD-01**: User can run `pd:onboard` to auto-orient the AI to an unfamiliar codebase before any workflow step (calls init+scan internally, creates PROJECT.md baseline)

### Developer Experience

- [x] **LINT-01**: When lint fails 3 times, the workflow saves the fail count to PROGRESS.md, suggests `pd:fix-bug`, and supports resume-only-lint mode
- [ ] **STATUS-01**: User can run `pd:status` to view current phase, plan, pending tasks, and blockers at a glance (read-only, Haiku skill)

### Quality & Observability

- [ ] **STALE-01**: Codebase mapper auto-detects staleness via git commit-delta (>20 commits since last map) and prompts refresh; maps store `Mapped at commit: [sha]`
- [ ] **INTEG-01**: Integration tests verify format contracts between skill chain artifacts (CONTEXT.md, TASKS.md, PROGRESS.md schemas) — not agent execution tests
- [ ] **LOG-01**: Agent errors are logged as JSONL at `.planning/logs/agent-errors.jsonl` with fields: timestamp, level, phase, step, agent, error, context

## Future Requirements (v9.0)

- **REPLAY-01**: `pd:replay [phase]` — re-run a failed phase with full context. *Deferred: requires LOG-01 stable for ≥1 milestone first.*
- **DIFF-01**: `pd:diff-milestone [v1] [v2]` — compare two milestone archives. *Deferred: requires milestone archive format definition first.*
- **HOTREL-01**: Workflow reloads config.json changes without restart. *Deferred: already ~80% free per invocation; zero documented user blockers.*
- Replay for mid-phase interruptions (not just phase-level)
- Visual diff for milestone outputs (HTML rendering)

## Out of Scope

- New platform targets — focus on workflow quality, not new platforms
- Breaking changes to existing skill invocation patterns
- LLM-as-judge review — circular
- New framework rules (NestJS/WP/Flutter etc.) — out of scope for DX milestone
- Agent execution integration tests — CI-hostile, requires live LLM; use format-contract tests instead

## Traceability

| Requirement | Phase | Status  |
|-------------|-------|---------|
| LINT-01     | TBD   | Complete |
| STATUS-01   | TBD   | pending |
| STALE-01    | TBD   | pending |
| ONBOARD-01  | TBD   | pending |
| LOG-01      | TBD   | pending |
| INTEG-01    | TBD   | pending |
