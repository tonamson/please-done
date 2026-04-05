---
phase: 04-conditional-context-loading
plan: 01
subsystem: workflow-engine
tags: [conditional-loading, inlineWorkflow, classifyRefs, token-optimization, lazy-loading]

# Dependency graph
requires:
  - phase: 01-structure-normalization
    provides: "(required)/(optional) tags on execution_context refs"
  - phase: 03-skill-compression
    provides: "Compressed skill files with stable format"
provides:
  - "classifyRefs() function separating required/optional refs"
  - "CONDITIONAL_LOADING_MAP with 8 loading conditions"
  - "inlineWorkflow() producing <conditional_reading> for optional refs"
  - "conventions.md promoted to (required) in all 8 skills"
affects: [04-02-PLAN, converters, workflow-files]

# Tech tracking
tech-stack:
  added: []
  patterns: ["conditional_reading XML section for lazy-loaded references", "CONDITIONAL_LOADING_MAP lookup pattern"]

key-files:
  created: []
  modified:
    - "bin/lib/utils.js"
    - "test/smoke-utils.test.js"
    - "commands/pd/write-code.md"
    - "commands/pd/plan.md"
    - "commands/pd/new-milestone.md"
    - "commands/pd/complete-milestone.md"
    - "commands/pd/fix-bug.md"
    - "commands/pd/test.md"
    - "commands/pd/what-next.md"
    - "commands/pd/conventions.md"

key-decisions:
  - "classifyRefs() uses strict regex on (required)/(optional) tags, excluding workflow refs"
  - "CONDITIONAL_LOADING_MAP includes 2 templates alongside 6 references for milestone state management"
  - "Optional refs filtered from workflow required_reading using Set-based line matching"
  - "conventions.md promoted to (required) per D-13 -- always needed, only 76 lines"

patterns-established:
  - "Optional ref detection: (optional) tag in execution_context -> classifyRefs() -> filtered from required_reading"
  - "Conditional loading block: <conditional_reading> section with file paths and Vietnamese loading conditions"

requirements-completed: [TOKN-03]

# Metrics
duration: 4min
completed: 2026-03-22
---

# Phase 04 Plan 01: Conditional Context Loading Engine Summary

**classifyRefs() + CONDITIONAL_LOADING_MAP + inlineWorkflow() modification to produce <conditional_reading> for optional refs, with conventions.md promoted to (required) in all 8 skills**

## Performance

- **Duration:** 4 min
- **Started:** 2026-03-22T11:20:30Z
- **Completed:** 2026-03-22T11:24:36Z
- **Tasks:** 2
- **Files modified:** 10

## Accomplishments
- Added classifyRefs() to separate (required)/(optional) tagged refs from execution_context, exported from utils.js
- Added CONDITIONAL_LOADING_MAP with 8 entries (6 references + 2 templates) mapping ref paths to Vietnamese loading conditions
- Modified inlineWorkflow() to exclude optional refs from <required_reading> and produce <conditional_reading> block with file paths and loading conditions
- Promoted conventions.md from (optional) to (required) in all 8 skill files that reference it

## Task Commits

Each task was committed atomically:

1. **Task 1: classifyRefs, CONDITIONAL_LOADING_MAP, conditional_reading (TDD)** - `6c1914f` (test: RED) -> `36db850` (feat: GREEN)
2. **Task 2: Promote conventions.md to (required)** - `dc66154` (feat)

_TDD task had separate RED/GREEN commits_

## Files Created/Modified
- `bin/lib/utils.js` - Added classifyRefs(), CONDITIONAL_LOADING_MAP, modified inlineWorkflow() to produce conditional_reading
- `test/smoke-utils.test.js` - Added 7 new tests for classifyRefs and conditional_reading output
- `commands/pd/write-code.md` - conventions.md (optional) -> (required)
- `commands/pd/plan.md` - conventions.md (optional) -> (required)
- `commands/pd/new-milestone.md` - conventions.md (optional) -> (required)
- `commands/pd/complete-milestone.md` - conventions.md (optional) -> (required)
- `commands/pd/fix-bug.md` - conventions.md (optional) -> (required)
- `commands/pd/test.md` - conventions.md (optional) -> (required)
- `commands/pd/what-next.md` - conventions.md (optional) -> (required)
- `commands/pd/conventions.md` - conventions.md (optional) -> (required)

## Decisions Made
- Used strict regex pattern `^@(references|templates)/X.md (required|optional)$` for classifyRefs -- excludes workflows and untagged lines
- Included templates (current-milestone.md, state.md) in CONDITIONAL_LOADING_MAP for complete-milestone.md support
- Used Set-based line filtering to exclude optional refs from required_reading output (matches against [SKILLS_DIR]-transformed paths)
- Adjusted TDD test for "no conditional_reading" to use synthetic body rather than test.md (which had conventions.md as optional before Task 2)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Adjusted TDD test for pre-Task-2 state**
- **Found during:** Task 1 (GREEN phase)
- **Issue:** Test 7 ("no conditional_reading for skills without optional refs") used test.md directly, but test.md still had conventions.md as (optional) before Task 2 promotion
- **Fix:** Changed test to use synthetic body with only (required) refs instead of reading test.md file
- **Files modified:** test/smoke-utils.test.js
- **Verification:** All 32 tests pass
- **Committed in:** 36db850 (Task 1 GREEN commit)

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** Necessary fix for correct TDD ordering -- test file state changed in Task 2, test written in Task 1. No scope creep.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- classifyRefs() and CONDITIONAL_LOADING_MAP ready for Plan 04-02 (workflow file modifications and token measurement)
- All 4 converters automatically benefit from inlineWorkflow() changes (no converter modifications needed)
- Existing test infrastructure extended -- 209 total tests passing

---
## Self-Check: PASSED

All 10 modified files exist, all 3 commits verified, SUMMARY.md present.

---
*Phase: 04-conditional-context-loading*
*Completed: 2026-03-22*
