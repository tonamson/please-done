---
phase: 137-workflow-command-merge
plan: 01
subsystem: workflow
tags: [what-next, auto-execute, slashcommand, command-merge]

# Dependency graph
requires: []
provides:
  - "pd:what-next --execute flag for auto-execution of suggested commands"
  - "Step 4.5 execute branch in what-next workflow"
  - "SlashCommand tool added to what-next command"
  - "pd:next functionality merged into pd:what-next"
affects: [138, 139, 140, 141, 142, 143, 144]

# Tech tracking
tech-stack:
  added: []
  patterns: ["Flag-based mode switching: advisory (default) vs auto-execute (--execute)"]

key-files:
  created: []
  modified:
    - commands/pd/what-next.md
    - workflows/what-next.md
    - docs/skills/what-next.md
    - docs/skills/what-next.vi.md
    - test/snapshots/opencode/what-next.md
    - test/snapshots/gemini/what-next.md
    - test/snapshots/copilot/what-next.md
    - test/snapshots/codex/what-next.md
    - AGENTS.md

key-decisions:
  - "Advisory mode preserved as default (no flag) — backward compatible"
  - "SlashCommand invoked only with --execute flag — security boundary maintained"
  - "pd:next removed from AGENTS.md — fully subsumed by pd:what-next --execute"

patterns-established:
  - "Flag-based command mode: single command with --execute flag toggles between advisory and auto-execute"

requirements-completed: [L-02]

# Metrics
duration: 12min
completed: 2026-04-06
---

# Phase 137 Plan 01: Workflow Command Merge Summary

**Merged pd:next auto-execute behavior into pd:what-next with --execute flag, preserving backward-compatible advisory mode as default**

## Performance

- **Duration:** 12 min
- **Started:** 2026-04-06T13:47:08Z
- **Completed:** 2026-04-06T13:59:18Z
- **Tasks:** 2
- **Files modified:** 9

## Accomplishments
- Added --execute flag to pd:what-next command with SlashCommand tool support
- Added Step 4.5 execute branch in workflow for auto-invocation after suggestion display
- Updated all 4 platform test snapshots (opencode, gemini, copilot, codex) with --execute support
- Updated English and Vietnamese documentation with Auto-Execute Mode section
- Removed pd:next from AGENTS.md (merged into what-next)

## Task Commits

Each task was committed atomically:

1. **Task 1: Update command definition and workflow with --execute flag** - `6d67c31` (feat)
2. **Task 2: Update documentation, test snapshots, and AGENTS.md** - `152f792` (docs)

## Files Created/Modified
- `commands/pd/what-next.md` - Added SlashCommand tool, --execute argument-hint, updated objective/context/process/output/rules
- `workflows/what-next.md` - Added Step 4.5 execute branch with SlashCommand invocation logic, updated rules
- `docs/skills/what-next.md` - Added --execute flag docs, Auto-Execute Mode section, updated flags table
- `docs/skills/what-next.vi.md` - Vietnamese translation of --execute docs with Auto-Execute section
- `test/snapshots/opencode/what-next.md` - Updated with SlashCommand, Step 4.5, --execute context
- `test/snapshots/gemini/what-next.md` - Updated with Step 4.5, --execute context, SlashCommand
- `test/snapshots/copilot/what-next.md` - Updated with Step 4.5, --execute context, SlashCommand
- `test/snapshots/codex/what-next.md` - Updated with Step 4.5, --execute context, SlashCommand
- `AGENTS.md` - Removed pd:next row, updated pd:what-next with --execute flag

## Decisions Made
- **Advisory mode as default (no flag):** Preserves existing behavior exactly — no breaking changes for users who run `/pd:what-next` without flags
- **SlashCommand only with --execute:** Security boundary — commands only invoked when user explicitly passes the flag
- **pd:next fully removed:** No stub remaining — all functionality subsumed by pd:what-next --execute
- **Step 4.5 before Step 5:** When --execute is set, report displays first (transparency) then SlashCommand fires

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- pd:what-next now fully supports both advisory and auto-execute modes
- All platform snapshots updated and in sync
- Ready for remaining v12.2 phases (138-144)

---
*Phase: 137-workflow-command-merge*
*Completed: 2026-04-06*

## Self-Check: PASSED

All 9 modified files verified present. Both task commits (6d67c31, 152f792) verified in git history. SUMMARY.md created successfully.
