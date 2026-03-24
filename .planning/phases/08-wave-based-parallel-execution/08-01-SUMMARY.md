---
phase: 08-wave-based-parallel-execution
plan: 01
subsystem: workflow
tags: [parallel-execution, topological-sort, wave-grouping, hotspot-detection, conflict-handling]

# Dependency graph
requires:
  - phase: 05-effort-level-routing
    provides: effort->model routing (simple->haiku, standard->sonnet, complex->opus) reused in wave agent spawning
  - phase: 06-context7-standardization
    provides: context7-pipeline reference pattern for DRY workflow instructions
provides:
  - Kahn's algorithm instructions for topological sort with wave grouping in write-code.md Buoc 1.5
  - Static hotspot patterns table covering 6 framework stacks for shared-file detection
  - Dynamic > Files: cross-reference algorithm for conflict detection
  - Pre-wave auto-serialize logic for conflict handling (not hard-stop)
  - Agent context minimization instructions in Buoc 10 (D-11)
  - 7 smoke tests for wave-based parallel execution verification
affects: [08-02, write-code, plan]

# Tech tracking
tech-stack:
  added: []
  patterns: [kahn-topological-sort, two-layer-conflict-detection, auto-serialize-waves]

key-files:
  created: []
  modified:
    - workflows/write-code.md
    - test/smoke-integrity.test.js

key-decisions:
  - "Kahn's algorithm (BFS-based) chosen for topological sort -- natural wave grouping via in-degree levels"
  - "Two-layer detection: static hotspot patterns + dynamic > Files: cross-reference for shared-file conflicts"
  - "Auto-serialize conflicting tasks to next wave instead of hard-stop (D-05)"
  - "Agent context minimization added to Buoc 10: only task-relevant PLAN.md sections, not full dump (D-11)"

patterns-established:
  - "Hotspot patterns table: framework-specific static list of conflict-prone files"
  - "Auto-serialize: conflict -> move later task to next wave, not stop execution"

requirements-completed: [PARA-01, PARA-02, PARA-03]

# Metrics
duration: 3min
completed: 2026-03-22
---

# Phase 8 Plan 01: Wave-Based Parallel Execution Summary

**Kahn's algorithm topological sort with 6-stack hotspot patterns table, > Files: cross-reference, and auto-serialize conflict handling in write-code.md Buoc 1.5**

## Performance

- **Duration:** 3 min
- **Started:** 2026-03-22T14:47:38Z
- **Completed:** 2026-03-22T14:50:38Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments
- Expanded write-code.md Buoc 1.5 from vague 5-line instructions to explicit 40-line algorithm with Kahn's topological sort, hotspot patterns table, cross-reference detection, and auto-serialize logic
- Added 7 smoke tests verifying all critical parallel execution instructions are present (6/7 pass, 1 deferred to Plan 02)
- Enhanced Buoc 10 agent spawning with context minimization per D-11

## Task Commits

Each task was committed atomically:

1. **Task 1: Add Wave 0 smoke tests for wave-based parallel execution** - `8dea216` (test)
2. **Task 2: Expand write-code.md Buoc 1.5 with topological sort, hotspot patterns, and auto-serialize** - `fca6883` (feat)

_Note: TDD task -- test commit (RED) followed by feat commit (GREEN)_

## Files Created/Modified
- `test/smoke-integrity.test.js` - Added 7 smoke tests for wave-based parallel execution (hotspot, auto-serialize, topological sort, build check, context minimization, cross-reference, plan.md enforcement)
- `workflows/write-code.md` - Expanded Buoc 1.5 with Kahn's algorithm, hotspot patterns table (6 stacks), > Files: cross-reference, auto-serialize logic, wave plan display; enhanced Buoc 10 with agent context minimization

## Decisions Made
- Kahn's algorithm (BFS-based topological sort) chosen for natural wave-level grouping via in-degree computation
- Two-layer conflict detection: static hotspot patterns (known framework files) + dynamic > Files: cross-reference (runtime file overlap)
- Auto-serialize on conflict: move higher-numbered task to next wave, not hard-stop (per D-05)
- Agent context minimization in Buoc 10: send only task-relevant PLAN.md sections, not full dump (per D-11)
- Two existing tests (topological sort, post-wave build check) already passed against current content -- kept as-is

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Critical] Added agent context minimization to Buoc 10**
- **Found during:** Task 2 (expanding write-code.md)
- **Issue:** Test 5 (D-11 agent context minimization) expected "KHONG dump toan bo PLAN" in write-code.md but Buoc 10 lacked this instruction
- **Fix:** Enhanced Buoc 10 agent spawn instructions with explicit context minimization: task detail, relevant PLAN.md sections only, rules, CONTEXT.md path
- **Files modified:** workflows/write-code.md
- **Verification:** Test 5 passes, all 53/54 tests green
- **Committed in:** fca6883 (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (1 missing critical)
**Impact on plan:** Auto-fix necessary for test 5 to pass. Content was already planned for D-11 but unclear whether Plan 01 or 02 scope. Added to Buoc 10 where agent spawning occurs.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Buoc 1.5 complete with topological sort, hotspot patterns, cross-reference, and auto-serialize
- Plan 02 still needed for: Buoc 10 improvements (post-wave safety net, wave summary), plan.md > Files: enforcement (test 7)
- 1 remaining failing test (plan.md > Files: enforcement) will be resolved in Plan 02

## Self-Check: PASSED

- [x] test/smoke-integrity.test.js exists
- [x] workflows/write-code.md exists
- [x] 08-01-SUMMARY.md exists
- [x] Commit 8dea216 exists
- [x] Commit fca6883 exists

---
*Phase: 08-wave-based-parallel-execution*
*Completed: 2026-03-22*
