---
phase: 85-language-content-cleanup
plan: 01
subsystem: testing
tags: [workflows, conventions, legacy, mermaid, snapshots]

requires: []
provides:
  - English-only commit message convention in write-code.md
  - fix-bug-v1.5.md archived to workflows/legacy/
  - fix-bug.md updated to reference legacy path
  - All 4 snapshot files regenerated with new legacy path
  - mermaid-rules.md wiring confirmed

affects: []

tech-stack:
  added: []
  patterns:
    - "Deprecated workflows go to workflows/legacy/"

key-files:
  created:
    - workflows/legacy/fix-bug-v1.5.md
  modified:
    - workflows/write-code.md
    - workflows/fix-bug.md
    - test/snapshots/gemini/fix-bug.md
    - test/snapshots/copilot/fix-bug.md
    - test/snapshots/codex/fix-bug.md
    - test/snapshots/opencode/fix-bug.md
    - test/baseline-tokens.json

key-decisions:
  - "CLEAN-01 closed as 'already wired' — mermaid-rules.md confirmed active in validator, tests, and templates with no changes needed"
  - "Legacy directory established at workflows/legacy/ for deprecated workflow versions"

patterns-established:
  - "Deprecated workflow versions live in workflows/legacy/ not workflows/"

requirements-completed: [LANG-01, CLEAN-01, CLEAN-02]

duration: 5min
completed: 2026-04-03
---

# Phase 85: Language & Content Cleanup Summary

**Vietnamese commit convention replaced with English, fix-bug-v1.5.md archived to workflows/legacy/, and mermaid-rules.md wiring confirmed — 1224 tests passing**

## Performance

- **Duration:** ~5 min
- **Started:** 2026-04-03T13:20:00Z
- **Completed:** 2026-04-03T13:25:00Z
- **Tasks:** 3
- **Files modified:** 7

## Accomplishments
- Replaced "message in Vietnamese with diacritics" with "message in English following conventions.md prefixes" in write-code.md (LANG-01)
- Confirmed mermaid-rules.md is actively wired to validator, tests, and templates — no changes needed (CLEAN-01)
- Moved fix-bug-v1.5.md to workflows/legacy/, updated fix-bug.md reference, regenerated all 4 snapshots, removed stale baseline-tokens entry (CLEAN-02)

## Task Commits

1. **Task 1: Fix Vietnamese language reference** - `a7cf9a3` (fix)
2. **Task 2: Verify mermaid wiring** - no commit needed (verification only)
3. **Task 3: Archive fix-bug-v1.5.md** - `f3ffd4e` (refactor)

## Files Created/Modified
- `workflows/write-code.md` — Line 471: English commit convention
- `workflows/legacy/fix-bug-v1.5.md` — Archived deprecated workflow (moved from workflows/)
- `workflows/fix-bug.md` — Updated single-agent fallback path to legacy location
- `test/snapshots/gemini/fix-bug.md` — Regenerated with new legacy path
- `test/snapshots/copilot/fix-bug.md` — Regenerated with new legacy path
- `test/snapshots/codex/fix-bug.md` — Regenerated with new legacy path
- `test/snapshots/opencode/fix-bug.md` — Regenerated with new legacy path
- `test/baseline-tokens.json` — Removed stale `workflows/fix-bug-v1.5.md` entry

## Decisions Made
- CLEAN-01 closed as "already wired" — mermaid-rules.md referenced in mermaid-validator.js, smoke test, and management-report template. No code changes needed.
- Legacy directory pattern established: `workflows/legacy/` for deprecated workflow versions.

## Deviations from Plan

None — plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness
- Phase 86 (Error Handling Hardening) is independent and ready to plan/execute.
- 1224 tests pass, 0 regressions.

---
*Phase: 85-language-content-cleanup*
*Completed: 2026-04-03*
