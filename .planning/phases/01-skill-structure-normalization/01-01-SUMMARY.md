---
phase: 01-skill-structure-normalization
plan: 01
subsystem: testing
tags: [node-test, smoke-test, tdd, xml-sections, frontmatter]

# Dependency graph
requires: []
provides:
  - "Canonical structure enforcement test suite (5 test cases)"
  - "REQUIRED_SECTIONS constant defining section order"
  - "REQUIRED_FM_FIELDS constant defining frontmatter contract"
affects: [01-02, 01-03]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "TDD contract-first: write failing tests before normalizing skill files"
    - "extractXmlSection-based structure validation"

key-files:
  created: []
  modified:
    - "test/smoke-integrity.test.js"

key-decisions:
  - "Tests define the target structure contract; Plans 02/03 implement the GREEN phase"
  - "5 separate test cases for granular failure reporting rather than 1 monolithic test"
  - "Vietnamese test names and error messages consistent with existing test style"

patterns-established:
  - "Canonical section order: objective, guards, context, execution_context, process, output, rules"
  - "Required frontmatter fields: name, description, model, argument-hint, allowed-tools"
  - "execution_context references must be tagged (required) or (optional)"

requirements-completed: [READ-01, READ-02]

# Metrics
duration: 2min
completed: 2026-03-22
---

# Phase 1 Plan 01: Smoke Test Contract Summary

**TDD RED phase: 5 canonical structure enforcement tests defining section order, frontmatter fields, guards separation, output subsections, and reference tagging**

## Performance

- **Duration:** 2 min
- **Started:** 2026-03-22T06:07:03Z
- **Completed:** 2026-03-22T06:09:03Z
- **Tasks:** 1
- **Files modified:** 1

## Accomplishments
- Added 5 test cases to smoke-integrity.test.js defining the canonical skill structure contract
- Tests enforce: section order, frontmatter completeness, guards separation, output subsections, reference tagging
- All 5 new tests intentionally FAIL on current codebase (defining the target for Plans 02/03)
- All 10 existing tests remain green (no regressions)

## Task Commits

Each task was committed atomically:

1. **Task 1: Add canonical structure enforcement tests** - `7ed9bf5` (test)

_Note: TDD RED phase only -- GREEN will be satisfied by Plans 02 and 03 normalizing skill files._

## Files Created/Modified
- `test/smoke-integrity.test.js` - Added describe block "Repo integrity -- canonical skill structure" with 5 test cases and REQUIRED_SECTIONS/REQUIRED_FM_FIELDS constants

## Decisions Made
- Tests define the contract first (TDD RED); Plans 02/03 will make them pass (GREEN)
- Used 5 separate test cases instead of a monolithic test for granular failure diagnostics
- Vietnamese test names and error messages maintain consistency with existing test style
- Output section validation uses regex matching both diacritical and non-diacritical Vietnamese

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Test contract is in place; Plans 02 and 03 can now normalize skill files with automated verification
- Running `node --test test/smoke-integrity.test.js` after each skill modification will show progress toward full compliance
- Current failure count: 5/5 new tests fail (all 12 skills need normalization)

## Self-Check: PASSED

- [x] test/smoke-integrity.test.js exists
- [x] 01-01-SUMMARY.md exists
- [x] Commit 7ed9bf5 exists in git log

---
*Phase: 01-skill-structure-normalization*
*Completed: 2026-03-22*
