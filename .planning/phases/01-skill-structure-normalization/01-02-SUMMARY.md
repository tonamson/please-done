---
phase: 01-skill-structure-normalization
plan: 02
subsystem: skill-files
tags: [markdown, xml-sections, frontmatter, guards, output, canonical-structure]

# Dependency graph
requires:
  - phase: 01-01
    provides: "Canonical structure enforcement test suite (5 test cases)"
provides:
  - "6 normalized skill files: init, scan, write-code, test, fix-bug, conventions"
  - "2 of 5 canonical structure tests now pass (frontmatter fields, execution_context tagging)"
affects: [01-03]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Canonical section order applied: objective, guards, context, execution_context, process, output, rules"
    - "Guard checklist format: DUNG va huong dan user neu bat ky dieu kien nao that bai"
    - "Output section format: Tao/Cap nhat, Buoc tiep theo, Thanh cong khi, Loi thuong gap"
    - "Reference tagging: (required) for workflows, (optional) for reference docs"

key-files:
  created: []
  modified:
    - "commands/pd/init.md"
    - "commands/pd/scan.md"
    - "commands/pd/write-code.md"
    - "commands/pd/test.md"
    - "commands/pd/fix-bug.md"
    - "commands/pd/conventions.md"

key-decisions:
  - "Guards use Vietnamese non-diacritical for checklist items (consistent with test assertions)"
  - "conventions.md gets argument-hint: (khong can tham so) for consistency"
  - "Minimal rules extracted from existing process content -- no behavioral changes"

patterns-established:
  - "Guard extraction: move prereq checks from <context> to <guards> as checklist"
  - "Output section: 4 subsections (Tao/Cap nhat, Buoc tiep theo, Thanh cong khi, Loi thuong gap)"
  - "Rules section: minimal constraints (Vietnamese output, skill-specific invariants)"

requirements-completed: [READ-01, READ-02]

# Metrics
duration: 3min
completed: 2026-03-22
---

# Phase 1 Plan 02: Batch 1 Skill Normalization Summary

**6 skill files (init, scan, write-code, test, fix-bug, conventions) normalized to canonical 7-section structure with guards, output, and rules sections added**

## Performance

- **Duration:** 3 min
- **Started:** 2026-03-22T06:12:16Z
- **Completed:** 2026-03-22T06:16:03Z
- **Tasks:** 2
- **Files modified:** 6

## Accomplishments
- Normalized 6 skill files to identical canonical section order (objective, guards, context, execution_context, process, output, rules)
- Added guards sections with prerequisite checklists extracted from context
- Added output sections with 4 standard subsections (files created, next step, success criteria, common errors)
- Added rules sections with minimal constraints from existing process content
- Tagged all execution_context references as (required) or (optional)
- Added missing argument-hint to conventions skill
- 2 of 5 canonical structure tests now pass (frontmatter fields, execution_context tagging)
- All 10 pre-existing smoke tests remain green
- Full test suite: 186/189 pass (3 failures are for remaining 6 un-normalized skills -- Plan 03's scope)

## Task Commits

Each task was committed atomically:

1. **Task 1: Normalize init, scan, write-code** - `ec1cb55` (feat)
2. **Task 2: Normalize test, fix-bug, conventions** - `cf0e8ee` (feat)

## Files Created/Modified
- `commands/pd/init.md` - Added guards (path + FastCode), output, rules sections
- `commands/pd/scan.md` - Added guards (CONTEXT.md + path + FastCode), output, rules sections
- `commands/pd/write-code.md` - Added guards (CONTEXT.md + task + PLAN.md + MCPs), output, rules sections
- `commands/pd/test.md` - Added guards (CONTEXT.md + task + MCPs + done tasks), output, rules sections
- `commands/pd/fix-bug.md` - Added guards (CONTEXT.md + bug desc + MCPs), output, rules sections
- `commands/pd/conventions.md` - Added guards (source code check), output, rules, argument-hint

## Decisions Made
- Guards use non-diacritical Vietnamese for checklist items (consistent with smoke test assertions)
- conventions.md gets `argument-hint: "(khong can tham so)"` rather than empty string for consistency
- Minimal rules extracted from existing process/context content -- strictly no behavioral rewrites
- Content moved between sections, never rewritten (structural changes only)

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- 6 of 12 skills now follow canonical structure
- Plan 03 will normalize the remaining 6 skills (plan, what-next, new-milestone, complete-milestone, fetch-doc, update)
- After Plan 03, all 5 canonical structure tests should pass (TDD GREEN phase complete)
- Converter pipeline verified intact -- all 4 converters still produce correct output

## Self-Check: PASSED

- [x] commands/pd/init.md exists and has all 7 sections
- [x] commands/pd/scan.md exists and has all 7 sections
- [x] commands/pd/write-code.md exists and has all 7 sections
- [x] commands/pd/test.md exists and has all 7 sections
- [x] commands/pd/fix-bug.md exists and has all 7 sections
- [x] commands/pd/conventions.md exists and has all 7 sections
- [x] Commit ec1cb55 exists in git log
- [x] Commit cf0e8ee exists in git log

---
*Phase: 01-skill-structure-normalization*
*Completed: 2026-03-22*
