---
phase: 01-skill-structure-normalization
plan: 03
subsystem: skill-structure
tags: [markdown, normalization, canonical-structure, guards, output, rules, frontmatter]

# Dependency graph
requires:
  - phase: 01-01
    provides: "Canonical structure enforcement test suite (5 test cases)"
provides:
  - "6 normalized skill files: plan, new-milestone, complete-milestone, what-next, fetch-doc, update"
  - "All 12 skills now pass canonical structure smoke tests"
  - "fetch-doc and update section order fixed (objective before execution_context)"
  - "update inline process (117 lines) preserved unchanged"
affects: [02-token-budget-compression, 04-cross-platform-lazy-loading]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Canonical section order enforced: objective, guards, context, execution_context, process, output, rules"
    - "Empty execution_context uses explicit 'Khong co' message instead of empty tags"
    - "Guard checklist format: '- [ ] Condition -> Error message'"

key-files:
  created: []
  modified:
    - "commands/pd/plan.md"
    - "commands/pd/new-milestone.md"
    - "commands/pd/complete-milestone.md"
    - "commands/pd/what-next.md"
    - "commands/pd/fetch-doc.md"
    - "commands/pd/update.md"

key-decisions:
  - "fetch-doc and update empty execution_context replaced with 'Khong co -- skill nay xu ly truc tiep, khong dung workflow rieng.'"
  - "update inline process kept exactly as-is (117 lines) -- no extraction to workflow"
  - "argument-hint added to what-next and complete-milestone as '(khong can tham so)'"
  - "ALLOWED_NO_WORKFLOW remains unchanged -- fetch-doc and update still correctly whitelisted"

patterns-established:
  - "All 12 skills follow identical structure: frontmatter(5 fields) + 7 sections in canonical order"
  - "execution_context references tagged (required) or (optional)"
  - "Skills without workflow use explicit 'Khong co' in execution_context"

requirements-completed: [READ-01, READ-02]

# Metrics
duration: 5min
completed: 2026-03-22
---

# Phase 1 Plan 03: Batch 2 Skill Normalization Summary

**6 complex/divergent skills (plan, new-milestone, complete-milestone, what-next, fetch-doc, update) normalized to canonical structure with fixed section order, guards extraction, and output sections**

## Performance

- **Duration:** 5 min
- **Started:** 2026-03-22T06:12:04Z
- **Completed:** 2026-03-22T06:17:55Z
- **Tasks:** 2
- **Files modified:** 6

## Accomplishments
- Normalized all 6 remaining complex skills to canonical structure (objective, guards, context, execution_context, process, output, rules)
- Fixed section order for fetch-doc and update (execution_context was before objective -- now corrected)
- Replaced empty execution_context tags in fetch-doc and update with explicit "Khong co" message
- Preserved update's 117-line inline process without modification
- Added missing argument-hint to what-next and complete-milestone
- All 189 tests pass (including all 5 canonical structure tests and 4 converter tests)
- All 12 skills across Plans 02+03 now structurally identical

## Task Commits

Each task was committed atomically:

1. **Task 1: Normalize plan, new-milestone, complete-milestone** - `eee0667` (feat)
2. **Task 2: Normalize what-next, fetch-doc, update** - `1b9c287` (feat)

## Files Created/Modified
- `commands/pd/plan.md` - Added guards (5 checks), output, rules; tagged 8 execution_context refs as required/optional
- `commands/pd/new-milestone.md` - Added guards (5 checks), output, rules; tagged 11 execution_context refs
- `commands/pd/complete-milestone.md` - Added guards (3 checks), output, rules, argument-hint; tagged 7 execution_context refs
- `commands/pd/what-next.md` - Added guards (1 check), output, rules, argument-hint; tagged 3 execution_context refs
- `commands/pd/fetch-doc.md` - Fixed section order; added guards (3 checks), output; kept existing rules; replaced empty execution_context
- `commands/pd/update.md` - Fixed section order; added guards (2 checks), output; kept existing rules; replaced empty execution_context; 117-line process preserved

## Decisions Made
- fetch-doc and update: Used "Khong co -- skill nay xu ly truc tiep, khong dung workflow rieng." as explicit execution_context content (per Research recommendation)
- update: Kept inline process unchanged -- extracting to workflow is out of scope per plan
- Guards follow checklist format with "DUNG va huong dan user" preamble for consistency
- Replaced Unicode box-drawing characters in update.md process section with ASCII equivalents for cross-platform compatibility

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- All 12 skills now follow identical canonical structure
- Phase 1 normalization complete (pending Plan 02 if not yet executed by parallel agent)
- Full test suite green (189/189) -- converters, inline workflows, and structure tests all pass
- Ready for Phase 2 (token budget compression) which depends on stabilized skill format

## Self-Check: PASSED

- [x] commands/pd/plan.md exists and has canonical structure
- [x] commands/pd/new-milestone.md exists and has canonical structure
- [x] commands/pd/complete-milestone.md exists and has canonical structure
- [x] commands/pd/what-next.md exists and has canonical structure
- [x] commands/pd/fetch-doc.md exists and has canonical structure
- [x] commands/pd/update.md exists and has canonical structure
- [x] Commit eee0667 exists in git log
- [x] Commit 1b9c287 exists in git log
- [x] All 189 tests pass

---
*Phase: 01-skill-structure-normalization*
*Completed: 2026-03-22*
