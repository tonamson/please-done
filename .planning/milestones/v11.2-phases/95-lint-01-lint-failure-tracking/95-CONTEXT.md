# Phase 95: LINT-01 — Lint Failure Tracking - Context

**Gathered:** 2026-04-04
**Status:** Ready for planning

<domain>
## Phase Boundary

Create `bin/lib/progress-tracker.js` utility library to manage lint failure tracking in PROGRESS.md. Wire this utility into skills that encounter lint failures.

Phase 76 established the PROGRESS.md schema with `lint_fail_count` and `last_lint_error` fields. This phase implements the actual utility library and integrates it into skills.

</domain>

<decisions>
## Implementation Decisions

### API Design (D-01 through D-03)

- **D-01:** Use simple counter function pattern — `incrementLintFail(errorMsg)` returns `{count: number, thresholdReached: boolean, lastError: string}`
- **D-02:** Expose three primary functions:
  - `incrementLintFail(errorMsg)` — increments counter, saves to PROGRESS.md, returns status object
  - `getLintFailCount()` — reads current count from PROGRESS.md (returns 0 if file doesn't exist)
  - `resetLintFail()` — sets count to 0, clears last_lint_error (called after successful lint)
- **D-03:** Threshold is hardcoded at 3 (matches existing "Max 3 times" logic in write-code.md)

### Integration Points (D-04)

- **D-04:** Wire progress-tracker into 2 skills:
  - `write-code` — Step 5 lint logic (primary integration point)
  - `fix-bug` — optionally reset lint count when bug fix resolves lint issues
  - [Claude's discretion] `test` — if test command includes lint step

### Storage Scope (D-05)

- **D-05:** Store lint_fail_count in PROGRESS.md only (per-task scope)
- Counter resets naturally when PROGRESS.md is deleted after successful commit
- No cross-task history tracking in STATE.md (out of scope for this phase)

### Threshold Signaling (D-06)

- **D-06:** Utility returns status object, not throwing:
  ```javascript
  {
    count: 3,           // current failure count (1-3)
    thresholdReached: true,  // true when count >= 3
    lastError: "..."    // error message saved
  }
  ```
- Caller (skill) decides whether to STOP, suggest fix-bug, or continue

### Error Handling (D-07)

- **D-07:** Graceful degradation — if PROGRESS.md doesn't exist, return `{count: 0, thresholdReached: false, lastError: ""}`
- **D-08:** Pure functions where possible — `getLintFailCount()` reads file, doesn't cache
- **D-09:** Use existing file utilities from `bin/lib/utils.js` for file operations

### Claude's Discretion

- Function naming conventions (follow existing `bin/lib/*.js` patterns like `log-writer.js`)
- Whether to expose `setLintFailCount(n)` for testing purposes
- Exact error message format stored in `last_lint_error` (truncate if too long)
- Whether to add DEBUG logging calls (follow pattern from `log-writer.js`)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### PROGRESS.md Schema
- `templates/progress.md` — existing schema with `lint_fail_count` and `last_lint_error` fields

### Write-Code Workflow
- `workflows/write-code.md` §Step 5 — existing lint logic with "Max 3 times" STOP

### Phase 76 Context
- `.planning/phases/76-lint-recovery-status-dashboard/76-CONTEXT.md` — prior decisions on lint recovery

### Existing Utility Libraries (as patterns)
- `bin/lib/log-writer.js` — pure function pattern with write/append operations
- `bin/lib/utils.js` — file reading utilities
- `bin/lib/refresh-detector.js` — pure function library with 100% test coverage

### Comparable Skills
- `commands/pd/write-code.md` — where lint tracking will be integrated
- `commands/pd/fix-bug.md` — optional reset integration

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `bin/lib/utils.js` — contains file reading helpers, can reuse for PROGRESS.md parsing
- `bin/lib/log-writer.js` — pure function pattern to follow (write functions that don't mutate external state)
- Existing YAML-like header parsing logic exists in various workflow files

### Established Patterns
- PROGRESS.md uses YAML-like frontmatter (not strict YAML) — parse with regex, not YAML parser
- File operations in `bin/lib/` use synchronous methods (`readFileSync`, `writeFileSync`) for simplicity
- Error handling: return safe defaults instead of throwing on file not found
- All library files in `bin/lib/` should have corresponding test files in `test/`

### Integration Points
- `workflows/write-code.md` Step 5 — where `incrementLintFail()` will be called
- `workflows/write-code.md` Step 1.1 — where `getLintFailCount()` will be checked for recovery
- `commands/pd/write-code.md` — skill file that calls the workflow

</code_context>

<specifics>
## Specific Ideas

- Follow `refresh-detector.js` pattern: pure functions, 100% test coverage, clear JSDoc
- PROGRESS.md path: `.planning/milestones/[version]/phase-[phase]/PROGRESS.md` (from template)
- Utility should handle missing PROGRESS.md gracefully (new task, no progress yet)
- Consider exposing a `saveLintFail(count, errorMsg)` for direct setting if needed

</specifics>

<deferred>
## Deferred Ideas

- Cross-task lint history tracking (STATE.md integration) — out of scope
- Configurable threshold (currently hardcoded at 3) — can be added later if needed
- Integration with `pd:test` skill beyond basic wiring
- Integration with `pd:audit` or other skills that don't directly encounter lint

</deferred>

---

*Phase: 95-lint-01-lint-failure-tracking*
*Context gathered: 2026-04-04*
*Auto-selected decisions for all 4 gray areas*
