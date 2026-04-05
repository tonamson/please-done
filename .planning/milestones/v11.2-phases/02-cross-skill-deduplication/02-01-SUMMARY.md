---
phase: 02-cross-skill-deduplication
plan: 01
subsystem: tooling
tags: [guard-templates, inlineGuardRefs, utils, converters, tdd]

# Dependency graph
requires:
  - phase: 01-skill-structure-normalization
    provides: Canonical skill structure with consistent guards section ordering and non-diacritical Vietnamese
provides:
  - 4 guard micro-template files in references/ (guard-context, guard-fastcode, guard-context7, guard-valid-path)
  - inlineGuardRefs function in utils.js for resolving @references/guard-*.md to file content
  - inlineWorkflow wired to call inlineGuardRefs first, ensuring all converters expand guard refs automatically
  - TDD tests for guard deduplication verification (1 GREEN, 2 RED awaiting Plan 02)
  - Unit tests for inlineGuardRefs (5 tests)
  - Converter guard-expansion tests (4 tests, one per platform)
affects: [02-02-PLAN, converters, skill-files]

# Tech tracking
tech-stack:
  added: []
  patterns: [guard-micro-template-pattern, inlineGuardRefs-before-workflow-check]

key-files:
  created:
    - references/guard-context.md
    - references/guard-fastcode.md
    - references/guard-context7.md
    - references/guard-valid-path.md
  modified:
    - bin/lib/utils.js
    - test/smoke-integrity.test.js
    - test/smoke-utils.test.js
    - test/smoke-converters.test.js

key-decisions:
  - "inlineGuardRefs called BEFORE workflowMatch check in inlineWorkflow -- ensures guard expansion for ALL skills including those without @workflows/ (fetch-doc, update)"
  - "Guard regex matches only ^@references/guard-*.md$ standalone lines -- avoids affecting non-guard @references/"
  - "Missing guard file gracefully keeps original line unchanged rather than erroring"

patterns-established:
  - "Guard micro-template: single checklist line per file, no frontmatter, no XML tags"
  - "Guard inlining: inlineGuardRefs(body, skillsDir) resolves guard refs to file content at conversion time"
  - "Wiring pattern: new preprocessing in inlineWorkflow before the early return for workflow-less skills"

requirements-completed: [TOKN-01]

# Metrics
duration: 4min
completed: 2026-03-22
---

# Phase 2 Plan 1: Guard Infrastructure Summary

**4 guard micro-templates + inlineGuardRefs function wired into converter pipeline via inlineWorkflow, with TDD tests for Plan 02 skill updates**

## Performance

- **Duration:** 4 min
- **Started:** 2026-03-22T06:53:46Z
- **Completed:** 2026-03-22T06:57:43Z
- **Tasks:** 2
- **Files modified:** 8

## Accomplishments
- Created 4 guard micro-template files with non-diacritical Vietnamese content (guard-context, guard-fastcode, guard-context7, guard-valid-path)
- Implemented inlineGuardRefs function that resolves @references/guard-*.md lines to file content
- Wired inlineGuardRefs as first line of inlineWorkflow, before the early return for skills without @workflows/ references
- Added 13 new tests across 3 test files (3 integrity, 6 utils, 4 converters), all passing except 1 expected TDD RED

## Task Commits

Each task was committed atomically:

1. **Task 1: Create guard micro-templates and write failing deduplication tests** - `918515d` (test)
2. **Task 2: Add inlineGuardRefs function, wire into inlineWorkflow, add converter guard-expansion test** - `4b0fd40` (feat)

## Files Created/Modified
- `references/guard-context.md` - CONTEXT.md existence check guard template
- `references/guard-fastcode.md` - FastCode MCP connectivity check guard template
- `references/guard-context7.md` - Context7 MCP connectivity check guard template
- `references/guard-valid-path.md` - Path parameter validation guard template
- `bin/lib/utils.js` - Added inlineGuardRefs function, wired into inlineWorkflow, exported
- `test/smoke-integrity.test.js` - Added 3 guard deduplication tests (1 GREEN, 2 RED for Plan 02)
- `test/smoke-utils.test.js` - Added 5 inlineGuardRefs unit tests + 1 inlineWorkflow guard-expansion test
- `test/smoke-converters.test.js` - Added 4 converter guard-expansion tests with SAMPLE_SKILL_WITH_GUARDS

## Decisions Made
- inlineGuardRefs placed BEFORE workflowMatch early return in inlineWorkflow -- this ensures guard expansion works for all 12 skills, including fetch-doc and update which have no @workflows/ reference
- Guard regex uses `^@references/(guard-[a-z0-9_-]+\.md)$` with gm flags -- only matches standalone guard lines, not arbitrary @references/ paths
- Missing guard files keep original @references/ line rather than throwing error -- graceful degradation

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed OpenCode converter test call signature**
- **Found during:** Task 2 (converter guard-expansion tests)
- **Issue:** Plan suggested `opencode.convertSkill(SAMPLE_SKILL_WITH_GUARDS, 'guard-test', skillsDir)` but OpenCode's convertSkill signature is `(content, skillsDir)` -- no skillName parameter
- **Fix:** Changed test to `opencode.convertSkill(SAMPLE_SKILL_WITH_GUARDS, skillsDir)`
- **Files modified:** test/smoke-converters.test.js
- **Verification:** All 4 converter tests pass
- **Committed in:** 4b0fd40 (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (1 bug)
**Impact on plan:** Minor signature mismatch in test code. No scope creep.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Guard infrastructure complete -- Plan 02 can now update all 12 skill files to reference @references/guard-*.md
- Plan 02 will make the TDD RED test "guard micro-templates duoc tham chieu dung trong skills" turn GREEN
- All 4 converters confirmed to expand guard refs in their output

## Self-Check: PASSED

- All 8 files verified present
- Both task commits (918515d, 4b0fd40) verified in git log
- Test suite: 201 pass, 1 expected TDD RED fail

---
*Phase: 02-cross-skill-deduplication*
*Completed: 2026-03-22*
