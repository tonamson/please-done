---
phase: 02-cross-skill-deduplication
plan: 02
subsystem: tooling
tags: [guard-deduplication, cross-skill, non-diacritical-normalization, references]

# Dependency graph
requires:
  - phase: 02-cross-skill-deduplication
    plan: 01
    provides: 4 guard micro-template files and inlineGuardRefs function for resolving @references/guard-*.md
provides:
  - All 12 skill files deduplicated -- shared guards replaced with @references/guard-*.md
  - All 12 skill files use non-diacritical Vietnamese in guards sections
  - Single-source guard maintenance (changing 1 guard file updates all referencing skills)
  - guard-context.md referenced by 8 skills, guard-fastcode.md by 6, guard-context7.md by 5, guard-valid-path.md by 2
affects: [converters, skill-files, future-guard-additions]

# Tech tracking
tech-stack:
  added: []
  patterns: [guard-reference-deduplication, non-diacritical-guard-normalization]

key-files:
  created: []
  modified:
    - commands/pd/init.md
    - commands/pd/scan.md
    - commands/pd/write-code.md
    - commands/pd/test.md
    - commands/pd/fix-bug.md
    - commands/pd/plan.md
    - commands/pd/new-milestone.md
    - commands/pd/complete-milestone.md
    - commands/pd/fetch-doc.md
    - commands/pd/what-next.md
    - commands/pd/update.md

key-decisions:
  - "conventions.md left unchanged -- its only guard is unique (no shared guards to deduplicate)"
  - "what-next.md checks .planning/ directory (not .planning/CONTEXT.md) -- kept as unique guard, not replaced with guard-context.md"
  - "update.md has no shared guards (pdconfig + network checks are unique) -- only normalized to non-diacritical"
  - "Diacritical Vietnamese in non-guards sections (process, output, rules, context) preserved as-is per plan instruction"

patterns-established:
  - "Guard deduplication: shared guard checklist lines replaced with @references/guard-*.md standalone line"
  - "Non-diacritical convention: all guards sections use non-diacritical Vietnamese consistently"

requirements-completed: [TOKN-01]

# Metrics
duration: 3min
completed: 2026-03-22
---

# Phase 2 Plan 2: Guard Deduplication Summary

**Replaced inline guard text in 11 skill files with @references/guard-*.md references, completing cross-skill guard deduplication with non-diacritical normalization**

## Performance

- **Duration:** 3 min
- **Started:** 2026-03-22T07:01:44Z
- **Completed:** 2026-03-22T07:04:55Z
- **Tasks:** 2
- **Files modified:** 11

## Accomplishments
- Deduplicated guard text in 5 non-diacritical skills (init, scan, write-code, test, fix-bug) with direct @references/ swap
- Normalized and deduplicated guard text in 6 diacritical skills (plan, new-milestone, complete-milestone, fetch-doc, what-next, update)
- TDD RED tests from Plan 01 now all pass GREEN (202 total tests, 0 failures)
- Verified reference counts: guard-context=8, guard-fastcode=6, guard-context7=5, guard-valid-path=2

## Task Commits

Each task was committed atomically:

1. **Task 1: Deduplicate guards in batch 1 (non-diacritical skills)** - `4bf1f5e` (feat)
2. **Task 2: Deduplicate guards in batch 2 (diacritical skills)** - `823a52c` (feat)

## Files Created/Modified
- `commands/pd/init.md` - guard-valid-path + guard-fastcode refs
- `commands/pd/scan.md` - guard-context + guard-valid-path + guard-fastcode refs
- `commands/pd/write-code.md` - guard-context + guard-fastcode + guard-context7 refs (2 unique guards kept)
- `commands/pd/test.md` - guard-context + guard-fastcode + guard-context7 refs (2 unique guards kept)
- `commands/pd/fix-bug.md` - guard-context + guard-fastcode + guard-context7 refs (1 unique guard kept)
- `commands/pd/plan.md` - guard-context + guard-fastcode + guard-context7 refs + normalized preamble (2 unique guards kept)
- `commands/pd/new-milestone.md` - guard-context + guard-context7 refs + normalized preamble (3 unique guards kept)
- `commands/pd/complete-milestone.md` - guard-context ref + normalized preamble (2 unique guards kept)
- `commands/pd/fetch-doc.md` - guard-context ref + normalized preamble (2 unique guards kept)
- `commands/pd/what-next.md` - normalized preamble + unique guard (no shared guards)
- `commands/pd/update.md` - normalized preamble + unique guards (no shared guards)

## Decisions Made
- conventions.md left unchanged -- its only guard ("Thu muc du an co source code") is unique, no shared guards to deduplicate
- what-next.md checks `.planning/` directory existence (different from guard-context.md which checks `.planning/CONTEXT.md`) -- kept as unique inline guard
- update.md has no shared guards (pdconfig and network checks are unique to update) -- only normalized to non-diacritical
- Diacritical Vietnamese in non-guards sections (process, output, rules, context, objective) preserved as-is per plan instruction

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Phase 02 (Cross-Skill Deduplication) fully complete
- All 12 skills have deduplicated, non-diacritical guards
- Updating any shared guard requires changing exactly 1 file
- All 4 converters expand guard refs automatically via inlineGuardRefs
- Ready for Phase 03 and beyond

## Self-Check: PASSED

- All 11 modified skill files verified present
- SUMMARY.md verified present
- Both task commits (4bf1f5e, 823a52c) verified in git log
- Test suite: 202 pass, 0 fail

---
*Phase: 02-cross-skill-deduplication*
*Completed: 2026-03-22*
