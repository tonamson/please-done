# Phase 96: LINT-01 — Recovery Workflow & UI - Context

**Gathered:** 2026-04-04
**Status:** Ready for planning
**Mode:** Auto-selected (discuss-phase --auto)

<domain>
## Phase Boundary

Build recovery workflow and UI enhancements for the lint failure tracking system established in Phase 95. This phase adds user-facing recovery features: 3-strike trigger suggestions, resume-only-lint mode, status dashboard integration, and soft guard UX.

Phase 95 built the `progress-tracker.js` utility. This phase wires the UI/UX and workflow integration on top of that foundation.

</domain>

<decisions>
## Implementation Decisions

### Recovery Trigger Design (D-01)

- **D-01:** When `lint_fail_count` reaches 3, display **inline warning + explicit suggestion** in write-code workflow
- **D-02:** Warning format: boxed banner with yellow/caution styling (follow existing `log.banner()` pattern)
- **D-03:** Suggestion text: "3 lint failures detected. Consider running `/pd:fix-bug` to investigate the root cause."
- **D-04:** No automatic redirect — user must actively choose to run `/pd:fix-bug`

### Resume-Only-Lint Mode (D-05 through D-08)

- **D-05:** Extend existing `--resume` flag behavior (don't create new `--lint-only` flag)
- **D-06:** When `--resume` is used AND `lint_fail_count > 0` in PROGRESS.md, automatically detect intent
- **D-07:** Skip to Step 5 (lint/build step) directly, bypassing Steps 1-4 (context, planning, task selection)
- **D-08:** Reset `lint_fail_count` to 0 when lint succeeds in resume mode

### Status Dashboard Integration (D-09 through D-12)

- **D-09:** Add "Lint Status" section to `pd:status` output (prominent placement, after "Current Phase")
- **D-10:** Visual indicators:
  - `lint_fail_count === 0`: Green checkmark (✓) with "No lint failures"
  - `lint_fail_count > 0`: Red cross (✗) with "{count}/3 lint failure(s)"
- **D-11:** When `lint_fail_count > 0`, also display truncated `last_lint_error` (first 100 chars)
- **D-12:** Include suggestion line: "Run `/pd:fix-bug` if lint issues persist"

### Soft Guard UX (D-13 through D-17)

- **D-13:** Soft guard triggers when `lint_fail_count >= 3` BEFORE attempting another lint
- **D-14:** Warning message: "3 lint failures detected. Continuing may compound issues."
- **D-15:** Present 3 choices (similar to plan checker pattern):
  - "Switch to `/pd:fix-bug`" — exit write-code, suggest fix-bug
  - "Continue anyway" — proceed with lint attempt
  - "Stop" — exit workflow, preserve state
- **D-16:** No hard blocks — user can always choose "Continue anyway"
- **D-17:** If user chooses "Continue anyway" and lint fails again, increment count normally (allows >3)

### Integration Points (D-18 through D-20)

- **D-18:** Modify `workflows/write-code.md`:
  - Step 1.1: Check `lint_fail_count` before starting, show soft guard if >= 3
  - Step 5: After lint failure, call `incrementLintFail()` and display recovery suggestion if threshold reached
  - Step 5: After lint success, call `resetLintFail()`
- **D-19:** Modify `commands/pd/write-code.md` skill file to pass `--resume` context to workflow
- **D-20:** Modify `commands/pd/status.md` skill file to display lint status section

### Claude's Discretion

- Exact banner styling (follow existing log patterns from `bin/lib/utils.js`)
- Whether to add a "Reset lint count" manual command (useful for testing)
- Status dashboard layout specifics (table format vs list format)
- Wording of soft guard messages (keep professional but friendly)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase 95 Implementation
- `.planning/phases/95-lint-01-lint-failure-tracking/95-CONTEXT.md` — prior decisions on progress-tracker
- `.planning/phases/95-lint-01-lint-failure-tracking/95-PLAN.md` — implementation plan
- `bin/lib/progress-tracker.js` — utility library (3 primary functions)

### Existing Workflow Integration
- `workflows/write-code.md` — Step 5 lint logic, "Max 3 times" STOP pattern
- `commands/pd/write-code.md` — skill definition for write-code

### Status Skill Reference
- `commands/pd/status.md` — skill definition for status dashboard
- `workflows/what-next.md` — what-next workflow (shows status suggestions)

### Pattern References
- `bin/lib/utils.js` — logging utilities (`log.banner()`, `log.warn()`, `log.error()`)
- `bin/lib/refresh-detector.js` — pure function library pattern (100% test coverage)
- Phase 91-CONTEXT.md — status workflow integration patterns

### Comparable Features
- Plan checker "Fix/Proceed/Cancel" pattern — for soft guard UX reference
- `--resume` flag in write-code — existing flag to extend

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `bin/lib/progress-tracker.js` — `incrementLintFail()`, `getLintFailCount()`, `resetLintFail()`
- `bin/lib/utils.js` — `log.banner()`, `log.warn()`, `log.success()`, `log.error()` for UI patterns
- `commands/pd/status.md` — existing status skill structure

### Established Patterns
- PROGRESS.md location: `.planning/milestones/[version]/phase-[phase]/PROGRESS.md`
- Status dashboard uses pretty-printed table format with colors/symbols
- Soft guard pattern: warning → choices → respect user decision
- Resume flag: `--resume` skips planning, goes straight to execution

### Integration Points
- `workflows/write-code.md` Step 1.1 — add lint_fail_count check before starting
- `workflows/write-code.md` Step 5 — add recovery suggestion after 3rd failure
- `commands/pd/status.md` — add Lint Status section to output
- `commands/pd/write-code.md` — wire `--resume` detection for lint-only mode

</code_context>

<specifics>
## Specific Ideas

- Soft guard message format (boxed with border):
  ```
  ┌─────────────────────────────────────────┐
  │ ⚠️  3 lint failures detected             │
  │                                         │
  │ Continuing may compound issues.         │
  │                                         │
  │ Options:                                │
  │ 1. Switch to `/pd:fix-bug`             │
  │ 2. Continue anyway                      │
  │ 3. Stop and preserve state              │
  └─────────────────────────────────────────┘
  ```

- Status dashboard Lint Status section:
  ```
  Lint Status
  ───────────
  ✗ 2/3 lint failures
  Last error: "ESLint: Unexpected token..."
  Suggestion: Run `/pd:fix-bug` if issues persist
  ```

- Resume detection logic (pseudo-code):
  ```javascript
  if (flags.resume && getLintFailCount() > 0) {
    // Skip to Step 5 (lint)
    currentStep = 5;
  }
  ```

</specifics>

<deferred>
## Deferred Ideas

- Automatic `pd:fix-bug` trigger after 3 failures (user might not want this)
- Configurable threshold (currently hardcoded at 3)
- Cross-task lint history in STATE.md (out of scope)
- Email/notification on repeated failures (out of scope)
- Integration with `pd:test --standalone` mode

</deferred>

---

*Phase: 96-lint-01-recovery-workflow-ui*
*Context gathered: 2026-04-04*
*Auto-selected decisions for all 4 gray areas*
*Recommended next step: /gsd:plan-phase 96*
