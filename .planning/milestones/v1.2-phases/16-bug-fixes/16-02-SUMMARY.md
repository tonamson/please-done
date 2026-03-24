---
phase: 16-bug-fixes
plan: 02
subsystem: workflows
tags: [fix-bug, new-milestone, write-code, complete-milestone, scan, init, workflow-logic]

# Dependency graph
requires:
  - phase: 14-skill-workflow-audit
    provides: Issue identification (C2, V1, V2, V3, W3, W9, W11, W12, W14, W15)
  - phase: 15-workflow-verification
    provides: Verification report confirming issues and resolution strategies
provides:
  - Generic stack trace fallback in fix-bug workflow
  - Cleaned effort routing (sonnet-only note) in fix-bug workflow
  - Resolved AskUserQuestion fallback conflict in new-milestone workflow
  - Explicit parallel degradation warnings in write-code workflow
  - Verification tool failure fallback in complete-milestone workflow
  - JSON exclusion rationale in scan workflow
  - FastCode bypass option in init workflow
affects: [16-04-PLAN (snapshot regeneration needed)]

# Tech tracking
tech-stack:
  added: []
  patterns: []

key-files:
  created: []
  modified:
    - workflows/fix-bug.md
    - workflows/new-milestone.md
    - workflows/write-code.md
    - workflows/complete-milestone.md
    - workflows/scan.md
    - workflows/init.md
    - commands/pd/new-milestone.md

key-decisions:
  - "Effort routing table removed from fix-bug.md -- fix-bug always runs with sonnet per skill file"
  - "AskUserQuestion conflict resolved: try text first, auto-backup only on no response"
  - "FastCode hard STOP replaced with bypass option using Grep/Read fallback"

patterns-established:
  - "Guard error message pattern: condition -> error message"
  - "Workflow fallback chain: tool -> text fallback -> auto-action with note"

requirements-completed: [BFIX-03]

# Metrics
duration: 3min
completed: 2026-03-23
---

# Phase 16 Plan 02: Workflow Text Fixes Summary

**Fixed 8 workflow logic issues across 6 files: generic stack fallback, effort routing cleanup, AskUserQuestion conflict resolution, parallel degradation warnings, verification fallback, JSON exclusion rationale, and FastCode bypass option**

## Performance

- **Duration:** 3 min
- **Started:** 2026-03-23T10:03:56Z
- **Completed:** 2026-03-23T10:07:04Z
- **Tasks:** 2
- **Files modified:** 7

## Accomplishments
- Fixed Critical C2/V1: Added Generic/Khac row to stack trace table and fallback text for unknown stacks in fix-bug.md
- Fixed V2: Removed aspirational effort routing table, replaced with sonnet-only note in fix-bug.md
- Fixed V3/W12: Resolved AskUserQuestion fallback conflict -- text first, auto-backup on no response, with logging
- Fixed W3: Added error message pattern to WebSearch guard in commands/pd/new-milestone.md
- Fixed V5/W9: Added explicit CANH BAO RO RANG warning for tasks missing > Files: metadata + post-wave review sub-step b2
- Fixed W11: Added verification tool failure fallback instruction in complete-milestone.md
- Fixed W14: Added JSON/CSS exclusion rationale comment in scan.md
- Fixed W15: Replaced FastCode hard STOP with bypass option (Grep/Read fallback) in init.md

## Task Commits

Each task was committed atomically:

1. **Task 1: Fix Critical + Warning-High workflow issues (C2/V1, V2, V3/W12, W3)** - `707d7b3` (fix)
2. **Task 2: Fix remaining Warning workflow issues (V5/W9, W11, W14, W15)** - `6331b56` (fix)

## Files Created/Modified
- `workflows/fix-bug.md` - Added Generic/Khac stack + fallback, removed effort routing table, added sonnet note
- `workflows/new-milestone.md` - Resolved AskUserQuestion fallback conflict with text-first approach
- `commands/pd/new-milestone.md` - Added WebSearch guard error message pattern
- `workflows/write-code.md` - Added explicit parallel degradation warning + post-wave review sub-step
- `workflows/complete-milestone.md` - Added verification tool failure fallback instruction
- `workflows/scan.md` - Added JSON/CSS exclusion rationale comment
- `workflows/init.md` - Replaced FastCode hard STOP with bypass option

## Decisions Made
- Effort routing table removed entirely from fix-bug.md since fix-bug always runs with sonnet per the skill file (commands/pd/fix-bug.md line 4: model: sonnet). The table was aspirational and never enforced.
- AskUserQuestion conflict resolved with a 3-step cascade: (1) try text question per rules, (2) auto-backup if no response, (3) log the auto-backup action.
- FastCode hard STOP replaced with a bypass option -- basic functionality still works via Grep/Read fallback, which is more user-friendly than blocking init entirely.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
- Snapshot tests fail after workflow file changes. This is expected per D-17/D-18/D-20: snapshot regeneration is planned as a one-shot operation in plan 16-04 AFTER all code fixes complete. The workflow text changes themselves are correct.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- All 8 workflow text issues resolved
- Snapshot regeneration needed in plan 16-04 to sync converter snapshots with updated source files
- No blockers for remaining plans (16-03, 16-04)

## Self-Check: PASSED

- All 7 modified files exist on disk
- Commit 707d7b3 (Task 1) found in git log
- Commit 6331b56 (Task 2) found in git log
- SUMMARY.md created at .planning/phases/16-bug-fixes/16-02-SUMMARY.md

---
*Phase: 16-bug-fixes*
*Completed: 2026-03-23*
