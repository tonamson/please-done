# Phase 76: Lint Recovery & Status Dashboard - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-03
**Phase:** 76-lint-recovery-status-dashboard
**Areas discussed:** Lint counter reset policy, pd:status fields, Lint-only resume UX
**Mode:** Autonomous (user unavailable — agent selected recommended defaults)

---

## Area A: Lint Counter Reset Policy

| Option | Description | Selected |
|--------|-------------|----------|
| Per task (natural lifecycle) | PROGRESS.md created/deleted per task → count resets automatically | ✓ |
| Per phase (cumulative) | Count accumulates across tasks in same phase | |
| Manual reset only | User must explicitly clear lint_fail_count | |

**Agent's choice:** Per task (natural lifecycle)
**Notes:** PROGRESS.md is already created fresh per task and deleted after successful commit. This makes the reset automatic with no extra logic. Within a task session, the count increments on consecutive lint failures.

---

## Area B: pd:status Exact Fields

| Option | Description | Selected |
|--------|-------------|----------|
| Minimal (4 fields) | milestone, phase, plan, tasks only | |
| Standard (8 fields) | + bugs, lint state, blockers, last commit | ✓ |
| Extended (12 fields) | + recent activity, build status, test coverage | |

**Agent's choice:** Standard 8 fields
**Notes:** 8 fields fits the 8-12 line spec from roadmap. Covers the most common "what's happening?" questions: am I blocked? are there open bugs? did lint pass? what was last committed?

---

## Area C: Lint-Only Resume UX

| Option | Description | Selected |
|--------|-------------|----------|
| Auto-force lint-only | When fail_count >= 3, always skip code rewrite automatically | |
| Offer choice | Present "Lint-only resume" vs "Fresh start" when resuming | ✓ |
| Always fresh start | Reset PROGRESS.md, rewrite from scratch | |

**Agent's choice:** Offer choice
**Notes:** Users may want to retry from scratch if they manually fixed the underlying issue. Forcing lint-only would prevent this. A two-option prompt keeps the user in control while making the efficient path obvious.

---

## Agent's Discretion

- Exact wording of lint STOP message
- Exact lint-only resume prompt wording (keyword vs numbered)
- PROGRESS.md field placement within existing header block
- pd:status visual alignment/formatting

## Deferred Ideas

- Live-refresh `watch pd:status` mode
- Lint failure history log (multiple errors) → Phase 79 (LOG-01)
- pd:status --json output mode → v9.0 backlog
