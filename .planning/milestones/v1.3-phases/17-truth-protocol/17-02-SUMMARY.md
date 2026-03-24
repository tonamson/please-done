---
phase: 17-truth-protocol
plan: 02
subsystem: testing
tags: [truths, workflow, snapshots, converters, plan-quality]

# Dependency graph
requires:
  - phase: 17-01
    provides: "5-column Truths template + parseTruthsV11 backward-compat + CHECK-04 BLOCK"
provides:
  - "Updated planner workflow with 5-column Truths instruction in Buoc 4.3"
  - "4 regenerated plan.md converter snapshots reflecting new workflow content"
affects: [plan, converters, snapshots]

# Tech tracking
tech-stack:
  added: []
  patterns: ["5-column Truths instruction propagated through converter pipeline"]

key-files:
  created: []
  modified:
    - workflows/plan.md
    - test/snapshots/codex/plan.md
    - test/snapshots/gemini/plan.md
    - test/snapshots/copilot/plan.md
    - test/snapshots/opencode/plan.md

key-decisions:
  - "Surgical edits: only Tang 1 section and rules summary line modified in workflows/plan.md"

patterns-established:
  - "Workflow instruction mirrors template format: when template changes, workflow must update correspondingly"

requirements-completed: [TRUTH-01]

# Metrics
duration: 2min
completed: 2026-03-24
---

# Phase 17 Plan 02: Workflow Truths Instruction + Snapshot Regeneration Summary

**Planner workflow updated with 5-column Truths instruction (Gia tri nghiep vu + Truong hop bien) and 4 converter snapshots regenerated**

## Performance

- **Duration:** 2 min
- **Started:** 2026-03-23T17:01:16Z
- **Completed:** 2026-03-23T17:04:01Z
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments
- workflows/plan.md Buoc 4.3 Tang 1 now explicitly instructs AI to produce 5-column Truths table with business value and edge cases
- Rules section updated to reference "Truths 5 cot" format
- All 4 plan.md converter snapshots regenerated and verified to contain "Gia tri nghiep vu"
- 48/48 snapshot tests pass, 429/455 total tests pass (26 failures are pre-existing worktree-only issues)

## Task Commits

Each task was committed atomically:

1. **Task 1: Update workflows/plan.md Buoc 4.3 with 5-column Truths instruction** - `e6f68fc` (feat)
2. **Task 2: Regenerate converter snapshots and verify full test suite** - `acc2494` (chore)

## Files Created/Modified
- `workflows/plan.md` - Updated Buoc 4.3 Tang 1 with 5-column format instruction and rules section
- `test/snapshots/codex/plan.md` - Regenerated snapshot with 5-column Truths content
- `test/snapshots/gemini/plan.md` - Regenerated snapshot with 5-column Truths content
- `test/snapshots/copilot/plan.md` - Regenerated snapshot with 5-column Truths content
- `test/snapshots/opencode/plan.md` - Regenerated snapshot with 5-column Truths content

## Decisions Made
- Surgical edits only: changed 2 areas in workflows/plan.md (Tang 1 body + rules summary line), no other sections touched
- Sub-bullets added under the "5 cot" instruction to explain Gia tri nghiep vu and Truong hop bien columns with examples

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
- 26 test failures in "Historical v1.0 plan validation" suite are pre-existing in worktree context (`.planning/phases/` directory from v1.0-v1.1 phases not present in worktree). These pass in the main repo. Not caused by this plan's changes.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Workflow and template are now aligned on 5-column Truths format
- Plan checker from 17-01 already validates the new format
- Ready for next plans in phase 17

## Self-Check: PASSED

All files exist and all commits verified:
- workflows/plan.md: FOUND
- test/snapshots/codex/plan.md: FOUND
- test/snapshots/gemini/plan.md: FOUND
- test/snapshots/copilot/plan.md: FOUND
- test/snapshots/opencode/plan.md: FOUND
- 17-02-SUMMARY.md: FOUND
- Commit e6f68fc: FOUND
- Commit acc2494: FOUND

---
*Phase: 17-truth-protocol*
*Completed: 2026-03-24*
