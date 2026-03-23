---
phase: 12-advanced-checks
plan: 01
subsystem: validation
tags: [plan-checker, key-links, scope-thresholds, effort-classification, quality-gate]

# Dependency graph
requires:
  - phase: 10-core-plan-checks
    provides: plan-checker.js module with 4 checks + 12 helpers + runAllChecks
  - phase: 11-workflow-integration
    provides: Step 8.1 plan checker integration in workflows/plan.md
provides:
  - 3 advanced check functions (checkKeyLinks, checkScopeThresholds, checkEffortClassification)
  - 5 new helpers (parseKeyLinksV11, normalizeKeyLinkPath, countFilesInString, detectMultiDomain, computeActualEffort)
  - Updated rules spec with ADV-01, ADV-02, ADV-03 documentation
affects: [12-02-PLAN (tests)]

# Tech tracking
tech-stack:
  added: []
  patterns: [key-links-verification, scope-threshold-warnings, effort-classification-validation, multi-domain-detection]

key-files:
  created: []
  modified:
    - bin/lib/plan-checker.js
    - references/plan-checker.md
    - test/smoke-plan-checker.test.js

key-decisions:
  - "ADV-01 uses BLOCK severity for Key Links violations (D-04)"
  - "ADV-02 uses WARN severity for scope thresholds (D-06)"
  - "ADV-03 uses WARN severity for effort mismatch (D-11)"
  - "v1.0 graceful PASS for ADV-01 and ADV-03 (D-12), ADV-02 applies to v1.0 (D-13)"
  - "Highest signal wins for effort computation (D-08 conservative approach)"

patterns-established:
  - "Key Links path normalization: strip parenthetical suffixes, substring containment matching"
  - "Effort computation from 4 signals: files, truths, dependencies, multi-domain"
  - "Multi-domain detection via top-level directory comparison"

requirements-completed: [ADV-01, ADV-02, ADV-03]

# Metrics
duration: 5min
completed: 2026-03-23
---

# Phase 12 Plan 01: Advanced Checks Summary

**3 advanced check functions (Key Links, Scope Thresholds, Effort Classification) with 5 helpers extending plan-checker.js to 7 total checks, plus rules spec updated to v1.1**

## Performance

- **Duration:** 5 min
- **Started:** 2026-03-23T04:52:08Z
- **Completed:** 2026-03-23T04:57:00Z
- **Tasks:** 2 (1 TDD + 1 auto)
- **Files modified:** 3

## Accomplishments
- Implemented checkKeyLinks (ADV-01) with Key Links table parsing, path normalization, both-ends verification, and BLOCK severity for broken links
- Implemented checkScopeThresholds (ADV-02) working with both v1.0 and v1.1 formats, checking 4 dimensions (tasks>6, files/task>7, total files>25, truths>6) with WARN severity
- Implemented checkEffortClassification (ADV-03) detecting effort mismatches in both directions (underestimate/overestimate) based on 4 signals from conventions.md
- Added 5 pure helper functions: parseKeyLinksV11 (diacritics-aware), normalizeKeyLinkPath, countFilesInString, detectMultiDomain, computeActualEffort
- Extended runAllChecks to return 7 checks, all 121 tests pass including 22 historical plan zero-false-positive gate

## Task Commits

Each task was committed atomically:

1. **Task 1: Add 3 check functions + helpers to plan-checker.js** - TDD
   - RED: `f48f83b` (test) - 25+ failing tests for ADV checks + helpers
   - GREEN: `94f9aa0` (feat) - Implementation passing all 121 tests
2. **Task 2: Update references/plan-checker.md with 3 new rule sections** - `72295f9` (docs)

**Plan metadata:** committed with SUMMARY.md

## Files Created/Modified
- `bin/lib/plan-checker.js` - 3 new check functions + 5 new helpers + runAllChecks updated (26 total exports)
- `references/plan-checker.md` - 3 new ADV sections + severity table extended + version bumped to v1.1
- `test/smoke-plan-checker.test.js` - 25+ new test cases for ADV checks, updated runAllChecks assertions

## Decisions Made
- ADV-01 Key Links verification uses BLOCK severity (per D-04) since broken links mean Truths cannot be achieved
- ADV-02 Scope thresholds apply to v1.0 format too (per D-13) unlike ADV-01/ADV-03 which graceful PASS for v1.0
- ADV-03 Effort classification uses highest signal wins (conservative per D-08) with multi-domain detection via top-level directory comparison (per D-09)
- All functions kept pure (no file I/O), consistent with existing plan-checker.js pattern

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Phase 12 Plan 02 (test expansion) can proceed: all 3 ADV checks are implemented and exported
- The 25+ tests added in this plan provide basic coverage; Plan 02 will add comprehensive edge cases and historical validation

## Self-Check: PASSED
- bin/lib/plan-checker.js: FOUND
- references/plan-checker.md: FOUND
- test/smoke-plan-checker.test.js: FOUND
- 12-01-SUMMARY.md: FOUND
- Commit f48f83b (test RED): FOUND
- Commit 94f9aa0 (feat GREEN): FOUND
- Commit 72295f9 (docs): FOUND

---
*Phase: 12-advanced-checks*
*Completed: 2026-03-23*
