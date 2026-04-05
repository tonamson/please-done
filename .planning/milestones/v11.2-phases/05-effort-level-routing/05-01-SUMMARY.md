---
phase: 05-effort-level-routing
plan: 01
subsystem: workflow
tags: [effort-routing, model-selection, haiku, sonnet, opus, TOKN-04]

# Dependency graph
requires:
  - phase: 03-token-compression
    provides: compressed workflow files as base for effort routing additions
provides:
  - effort field in TASKS.md template metadata line
  - effort level enum and classification signals in conventions.md
  - effort classification guidelines in planner workflow (Buoc 5)
  - effort-to-model routing in write-code workflow (Buoc 1 + Buoc 10)
  - effort-from-risk routing in fix-bug workflow (Buoc 6a.1)
  - effort mirroring in test workflow (Buoc 1)
affects: [05-02, write-code, fix-bug, test, plan]

# Tech tracking
tech-stack:
  added: []
  patterns: [effort-level classification at planning time, per-task model routing via Agent tool model param]

key-files:
  created: []
  modified:
    - templates/tasks.md
    - templates/plan.md
    - references/conventions.md
    - workflows/plan.md
    - workflows/write-code.md
    - workflows/fix-bug.md
    - workflows/test.md

key-decisions:
  - "Effort field added to existing metadata line (not new XML attribute) for minimal template change"
  - "Classification signals table duplicated in both conventions.md and plan.md for planner self-containment"
  - "fix-bug derives effort from risk classification rather than TASKS.md (fix-bug operates on bug reports, not plan tasks)"

patterns-established:
  - "Effort metadata: | Effort: {simple|standard|complex} appended to task metadata line in TASKS.md"
  - "Model resolution: inline 3-row table in workflow instructions (not external config)"
  - "Logging: Thong bao spawning message required in all 3 executor workflows per D-11"

requirements-completed: [TOKN-04]

# Metrics
duration: 3min
completed: 2026-03-22
---

# Phase 05 Plan 01: Effort-Level Routing Summary

**Effort field (simple/standard/complex) added to task templates, conventions reference, and 4 workflow files enabling per-task model routing (haiku/sonnet/opus)**

## Performance

- **Duration:** 3 min
- **Started:** 2026-03-22T12:10:24Z
- **Completed:** 2026-03-22T12:13:20Z
- **Tasks:** 2
- **Files modified:** 7

## Accomplishments
- TASKS.md template now includes Effort field in task metadata line with enum section
- conventions.md documents effort level enum with model mapping table and classification signals
- Planner workflow (plan.md) has effort classification guidelines with signals table in Buoc 5
- All 3 executor workflows (write-code, fix-bug, test) have effort-to-model routing with backward compat defaults and logging

## Task Commits

Each task was committed atomically:

1. **Task 1: Add effort field to templates and conventions reference** - `8b4bc3e` (feat)
2. **Task 2: Add effort routing to planner and executor workflows** - `ee17efe` (feat)

## Files Created/Modified
- `templates/tasks.md` - Added Effort: field to metadata line template + new Effort level section
- `templates/plan.md` - Added Effort requirement note in Thu tu thuc hien section
- `references/conventions.md` - Added Effort level section with model mapping and classification signals before Bao mat
- `workflows/plan.md` - Added effort classification guidelines with signals table as rule 11 in Buoc 5
- `workflows/write-code.md` - Added effort-to-model lookup in Buoc 1 + model param in Buoc 10 parallel spawning
- `workflows/fix-bug.md` - Added effort routing from bug risk classification in Buoc 6a.1
- `workflows/test.md` - Added effort mirroring from task metadata in Buoc 1

## Decisions Made
- Effort field added to existing metadata line (appended as `| Effort: standard`) rather than new structure
- Classification signals table duplicated in both conventions.md and plan.md for planner self-containment
- fix-bug derives effort from risk classification (not TASKS.md) since it operates on bug reports

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Effort routing instructions are in place across all 7 files
- Plan 05-02 can proceed to add integration tests or further refinements
- All 213 existing tests pass with 0 failures (no regression)

---
*Phase: 05-effort-level-routing*
*Completed: 2026-03-22*
