# Phase 76: Lint Recovery & Status Dashboard - Context

**Gathered:** 2026-04-03
**Status:** Ready for planning

<domain>
## Phase Boundary

Two independent improvements shipped together:
1. **LINT-01** — Modify `write-code.md` Step 5 to track lint failures in PROGRESS.md and offer a lint-only resume path when threshold is reached.
2. **STATUS-01** — Add a new `pd:status` skill (read-only Haiku) that prints an 8-field status dashboard.

No new JS modules. No new npm deps. Markdown skill/workflow/template changes only.

</domain>

<decisions>
## Implementation Decisions

### LINT-01: Lint failure tracking

- **D-01:** Add two fields to PROGRESS.md template: `lint_fail_count: 0` and `last_lint_error: ""` — placed in the YAML-like header block alongside `Stage:` and `Updated:`.
- **D-02:** `lint_fail_count` resets per task — PROGRESS.md is created fresh for each task and deleted after successful commit, so reset is automatic. Within a task session, count increments on each consecutive lint failure.
- **D-03:** On the 3rd consecutive lint failure in Step 5: save `lint_fail_count: 3` and `last_lint_error: [error output]` to PROGRESS.md, then STOP with message: "Lint failed 3 times. Run `pd:fix-bug` to resolve, or resume with `pd:write-code` to retry lint only."
- **D-04:** In Step 1.1 recovery table, add a new row: `lint_fail_count >= 3 in PROGRESS.md` → offer user a choice:
  - **Option A: Lint-only resume** — skip code rewrite (Step 2–4), jump directly to Step 5 with the previously written files
  - **Option B: Fresh start** — wipe PROGRESS.md, start from Step 2

### STATUS-01: pd:status dashboard

- **D-05:** New skill file at `commands/pd/status.md`. Model: `haiku`. No arguments. READ ONLY — zero file writes.
- **D-06:** Output exactly these 8 fields in this order:
  1. `Milestone:` v8.0 Developer Experience & Quality Hardening
  2. `Phase:` 76/80 — Lint Recovery & Status Dashboard
  3. `Plan:` 1/2 — writing code (or "Not started")
  4. `Tasks:` 3/5 done
  5. `Bugs:` 2 open
  6. `Lint:` ✓ clean (or "✗ 3 failures — last error: [msg]" if lint_fail_count >= 1)
  7. `Blockers:` None (or list from STATE.md)
  8. `Last commit:` a1b2c3d add user auth module
- **D-07:** Data sources: STATE.md (milestone/phase/status), TASKS.md in current phase (task counts), `.planning/bugs/` glob count (open bugs), PROGRESS.md if exists (lint state), STATE.md blockers section, `git log -1 --format="%h %s"` (last commit).
- **D-08:** If PROGRESS.md does not exist (no active task), Lint field shows "✓ no active task".
- **D-09:** pd:status does NOT suggest next steps — that remains `pd:what-next`'s job.

### Agent's Discretion

- Exact wording/formatting of lint STOP message (keep concise, show error, suggest pd:fix-bug + resume)
- Whether lint-only choice is via numbered prompt or keyword (`lint` / `fresh`)
- PROGRESS.md field placement (agent picks the cleanest spot in the header block)
- pd:status visual alignment (spaces/dashes) — just make it readable in 8-12 lines

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Write-Code Workflow
- `workflows/write-code.md` §Step 1.1 — existing recovery table (Case 0/1/2); add new lint-fail case here
- `workflows/write-code.md` §Step 5 — existing lint/build logic; modify to increment counter and save to PROGRESS.md

### PROGRESS.md Template
- `templates/progress.md` — current schema; add `lint_fail_count` and `last_lint_error` fields

### pd:status comparable skill
- `commands/pd/what-next.md` — READ ONLY reference for skill format, frontmatter pattern, data sources used

### State + Planning Files (pd:status reads these)
- `.planning/STATE.md` — milestone, phase, status, blockers
- `.planning/TASKS.md` (in current phase dir) — task counts
- `.planning/bugs/` — open bug count

### Requirements
- `.planning/REQUIREMENTS.md` §LINT-01, §STATUS-01 — acceptance criteria

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `commands/pd/what-next.md` — identical skill pattern (Haiku, read-only, reads STATE.md + TASKS.md + bugs). Use as template for `pd:status`.
- `templates/progress.md` — existing PROGRESS.md schema to extend.

### Established Patterns
- PROGRESS.md is scoped per task (created at task start, deleted after commit) → lint_fail_count naturally resets per task.
- write-code.md Step 1.1 uses a case table for recovery routing — add a new row for lint-fail case.
- write-code.md Step 5 already has "Max 3 times → STOP" — extend this to also save to PROGRESS.md before stopping.
- All skills use YAML frontmatter (`model:`, `allowed-tools:`, etc.) — follow this pattern for pd:status.

### Integration Points
- `workflows/write-code.md` Step 5 (lint STOP logic) — primary change point for LINT-01
- `workflows/write-code.md` Step 1.1 (recovery table) — add lint-fail recovery row
- `templates/progress.md` — add 2 new fields
- `commands/pd/status.md` — new file (STATUS-01)

</code_context>

<specifics>
## Specific Ideas

- pd:status should work even when there's no active task (no PROGRESS.md) — Lint field shows "✓ no active task" in that case.
- The lint-only resume should clearly skip Steps 2-4 (research, logic-validate, code-write) and jump to Step 5, using the already-committed or in-progress files.
- Status dashboard must never write — even if STATE.md is stale, pd:status just reads and displays.

</specifics>

<deferred>
## Deferred Ideas

- Live-refresh status (like `watch pd:status`) — too complex, not requested
- Lint failure history log (more than just last error) — LOG-01 handles structured logging in Phase 79
- pd:status --json output mode — could be added in v9.0 if needed

</deferred>

---

*Phase: 76-lint-recovery-status-dashboard*
*Context gathered: 2026-04-03*
