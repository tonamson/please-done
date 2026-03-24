---
phase: 16-bug-fixes
plan: 01
subsystem: core-modules
tags: [utils, plan-checker, codex, cli, dead-code, unicode, vietnamese]

# Dependency graph
requires:
  - phase: 14-audit
    provides: "Audit findings W6-W8, I5, I6, C1, D-09"
provides:
  - "Clean utils.js exports without dead code (W6-W8)"
  - "Accurate plan-checker.js header comment (I6)"
  - "Readable Vietnamese UTF-8 in codex.js (I5)"
  - "bin/plan-check.js CLI wrapper for plan quality checks (C1)"
  - "Updated plan.md Step 8.1 with CLI instruction (D-09)"
affects: [workflows, converters, plan-checker]

# Tech tracking
tech-stack:
  added: []
  patterns: ["CLI wrapper pattern for library modules"]

key-files:
  created:
    - "bin/plan-check.js"
  modified:
    - "bin/lib/utils.js"
    - "bin/lib/plan-checker.js"
    - "bin/lib/converters/codex.js"
    - "workflows/plan.md"

key-decisions:
  - "Replace Unicode escapes only in generateSkillAdapter function (lines 16-39), not box-drawing chars elsewhere"
  - "CLI wrapper reads ROADMAP.md for requirement IDs relative to plan directory"

patterns-established:
  - "CLI wrapper pattern: library module with pure functions + CLI file handling I/O"

requirements-completed: [BFIX-01]

# Metrics
duration: 4min
completed: 2026-03-23
---

# Phase 16 Plan 01: JS Module Bug Fixes Summary

**Removed 4 dead exports from utils.js, fixed stale plan-checker header, replaced Unicode escapes in codex.js with UTF-8 Vietnamese, created plan-check.js CLI wrapper, and updated plan.md to use CLI**

## Performance

- **Duration:** ~4 min
- **Started:** 2026-03-23T10:04:00Z
- **Completed:** 2026-03-23T10:08:00Z
- **Tasks:** 2
- **Files modified:** 5 (+ 28 snapshot files regenerated)

## Accomplishments
- Removed COLORS, colorize, assembleMd, CONDITIONAL_LOADING_MAP from utils.js module.exports (W6-W8) -- internal-only functions no longer exposed
- Updated plan-checker.js header from "4 structural validators" to "7 checks (4 core + 3 advanced)" with per-check IDs (I6)
- Replaced all Unicode escape sequences in codex.js generateSkillAdapter with actual Vietnamese UTF-8 characters (I5)
- Created bin/plan-check.js CLI wrapper that runs runAllChecks and outputs JSON + human-readable summary (C1)
- Updated workflows/plan.md Step 8.1 to instruct agents to run CLI instead of importing plan-checker inline (D-09)

## Task Commits

Each task was committed atomically:

1. **Task 1: Fix JS module issues (W6-W8, I5, I6)** - `a510b62` (fix)
2. **Task 2: Create bin/plan-check.js CLI wrapper and update plan.md Step 8.1** - `5741799` (feat)
3. **Snapshot regeneration** - `7409d70` (chore) -- deviation auto-fix

## Files Created/Modified
- `bin/lib/utils.js` - Removed 4 dead exports from module.exports
- `bin/lib/plan-checker.js` - Updated header comment to reflect 7 checks
- `bin/lib/converters/codex.js` - Replaced Unicode escapes with UTF-8 Vietnamese
- `bin/plan-check.js` - NEW: CLI wrapper for plan quality checking
- `workflows/plan.md` - Updated Step 8.1 to use CLI command
- `test/snapshots/**/*.md` - 28 snapshot files regenerated

## Decisions Made
- Replaced Unicode escapes only in generateSkillAdapter function scope, not box-drawing characters (\u2500) used elsewhere in codex.js
- CLI wrapper resolves ROADMAP.md path relative to plan directory (3 levels up) for requirement ID parsing

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Regenerated 48 converter snapshots**
- **Found during:** Task 2 (after modifying codex.js and plan.md)
- **Issue:** Snapshot tests (28 files across 4 platforms) failed because codex adapter output changed (UTF-8 chars) and plan.md content changed (Step 8.1)
- **Fix:** Ran `node test/generate-snapshots.js` to regenerate all 48 snapshots
- **Files modified:** test/snapshots/{codex,copilot,gemini,opencode}/*.md (28 files)
- **Verification:** `node --test test/smoke-snapshot.test.js` passes with 0 failures
- **Committed in:** `7409d70`

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** Snapshot regeneration is standard procedure after modifying converter source or workflow files. No scope creep.

## Issues Encountered
- 1 pre-existing test failure in `Repo integrity -- effort-level routing` suite (`fix-bug workflow co effort routing tu bug classification`) -- NOT caused by our changes. Verified by running tests before our changes (same failure exists). This is tracked for a later plan.

## User Setup Required
None - no external service configuration required.

## Known Stubs
None - all code is fully functional with no placeholder values.

## Next Phase Readiness
- Core JS module issues resolved, test suite healthy (448 pass, 1 pre-existing failure)
- bin/plan-check.js CLI ready for use by plan workflow
- Ready for 16-02 plan execution

## Self-Check: PASSED

- All 5 key files verified present on disk
- All 3 task commits verified in git log: a510b62, 5741799, 7409d70

---
*Phase: 16-bug-fixes*
*Completed: 2026-03-23*
