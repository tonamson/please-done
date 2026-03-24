---
phase: 17-truth-protocol
plan: 01
subsystem: testing
tags: [plan-checker, regex, markdown-parser, truth-table, enforcement]

# Dependency graph
requires:
  - phase: 16-bug-fixes
    provides: Audited plan-checker with 140+ tests, 448 total tests baseline
provides:
  - 5-column Truths table template (Business Value + Edge Cases)
  - Backward-compatible parseTruthsV11 regex (3-col and 5-col)
  - CHECK-04 Direction 2 BLOCK severity (was WARN)
  - Updated rules spec for v1.3 format
affects: [17-02-plan, 18-logic-first-execution, 20-logic-audit]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Single regex for multi-column markdown table parsing with newline exclusion"
    - "BLOCK severity for all Truth-Task mapping violations"

key-files:
  created: []
  modified:
    - bin/lib/plan-checker.js
    - templates/plan.md
    - references/plan-checker.md
    - test/smoke-plan-checker.test.js

key-decisions:
  - "Used [^|\\n] in regex to prevent cross-line matching in greedy quantifiers"
  - "Merged warnIssues into blockIssues for Direction 2 per D-05/D-06"
  - "Maintained Unicode Vietnamese diacritics in template for consistency"

patterns-established:
  - "parseTruthsV11 handles any column count via (?:\\s*[^|\\n]+\\s*\\|)+ suffix"

requirements-completed: [TRUTH-01, TRUTH-02, TRUTH-03]

# Metrics
duration: 6min
completed: 2026-03-23
---

# Phase 17 Plan 01: Truth Protocol Core Summary

**5-column Truths table with backward-compatible parser, CHECK-04 Direction 2 upgraded to BLOCK severity**

## Performance

- **Duration:** 6 min
- **Started:** 2026-03-23T16:49:05Z
- **Completed:** 2026-03-23T16:55:25Z
- **Tasks:** 1 (TDD: RED + GREEN + verify)
- **Files modified:** 4

## Accomplishments
- parseTruthsV11 handles both 3-col (v1.1) and 5-col (v1.3) Truths tables with single regex
- CHECK-04 Direction 2 now BLOCKs plans where any task has no Truth mapping
- Template expanded with "Gia tri nghiep vu" and "Truong hop bien" columns (Vietnamese)
- Rules spec updated to document v1.3 format and BLOCK severity
- 147 plan-checker tests pass (528 total across all test suites)

## Task Commits

Each task was committed atomically (TDD flow):

1. **Task 1 RED: Write failing tests** - `e8acd4a` (test)
2. **Task 1 GREEN: Implement production code** - `05b9033` (feat)

## Files Created/Modified
- `bin/lib/plan-checker.js` - Updated parseTruthsV11 regex + CHECK-04 Direction 2 BLOCK severity
- `templates/plan.md` - Truths table expanded from 3 to 5 columns with Vietnamese headers
- `references/plan-checker.md` - Rules spec updated for v1.3 format and BLOCK severity
- `test/smoke-plan-checker.test.js` - Added 7 new tests (5-col parsing, BLOCK severity, message validation)

## Decisions Made
- Used `[^|\n]` instead of `[^|]` in regex to prevent greedy cross-line matching (discovered during GREEN phase)
- Maintained Unicode Vietnamese diacritics in template headers (consistent with existing template style)
- parseTruthsV11 return structure unchanged `{ id, description }` -- no downstream code needs business value or edge cases

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed regex greedy cross-line matching**
- **Found during:** Task 1 GREEN phase
- **Issue:** The plan-recommended regex `/\|\s*(T\d+)\s*\|\s*([^|]+)\s*\|(?:\s*[^|]+\s*\|)+/g` matched across newlines because `\s*` includes `\n`, causing the regex to consume multiple table rows in one match
- **Fix:** Changed `[^|]` to `[^|\n]` in all character classes to constrain matching to single lines
- **Files modified:** bin/lib/plan-checker.js
- **Verification:** All 5-col and 3-col parsing tests pass, multi-row tables correctly return all truths
- **Committed in:** 05b9033

---

**Total deviations:** 1 auto-fixed (1 bug)
**Impact on plan:** Essential fix for regex correctness. No scope creep.

## Issues Encountered
- Historical validation tests (D-17 gate, 22 tests) fail in worktree because phase 1-9 plan files are not present. This is an environment issue specific to the worktree, not a code regression. All 147 non-historical plan-checker tests pass.

## User Setup Required
None - no external service configuration required.

## Known Stubs
None - all code is fully wired and functional.

## Next Phase Readiness
- Template + parser + CHECK-04 severity shipped atomically
- Plan 17-02 can now update workflows/plan.md to mention new columns and regenerate snapshots
- Phase 18 (Logic-First Execution) can proceed once Phase 17 completes

---
## Self-Check: PASSED

All files exist, all commits found.

---
*Phase: 17-truth-protocol*
*Completed: 2026-03-23*
