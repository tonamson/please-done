---
phase: 03-prompt-prose-compression
plan: 02
subsystem: workflows
tags: [telegraphic-shorthand, prose-compression, arrow-notation, token-reduction, workflows]

# Dependency graph
requires:
  - phase: 03-01
    provides: "Token counting script and baseline (84,899 total tokens across 39 files)"
provides:
  - "Compressed new-milestone.md workflow (6889 -> 4872 tokens, -29.3%)"
  - "Compressed write-code.md workflow (9424 -> 5191 tokens, -44.9%)"
  - "Compressed plan.md workflow (8709 -> 4795 tokens, -44.9%)"
  - "Compressed fix-bug.md workflow (6501 -> 3909 tokens, -39.9%)"
  - "Total: 31,523 -> 18,767 tokens saved across 4 largest workflows (-12,756 tokens, -40.5%)"
affects: [03-03, 03-04, 03-05, 03-06]

# Tech tracking
tech-stack:
  added: []
  patterns: [telegraphic-shorthand, arrow-notation, table-compression, bullet-compression]

key-files:
  modified:
    - workflows/new-milestone.md
    - workflows/write-code.md
    - workflows/plan.md
    - workflows/fix-bug.md

key-decisions:
  - "write-code.md verification loop (9.5a-f) compressed with table formatting for anti-patterns and clearer sub-step labels"
  - "plan.md Bước 4.5 kept detailed trigger conditions (6 scenarios) since each represents distinct DISCUSS/AUTO behavior"
  - "fix-bug.md Bước 5c stack tracing converted to table format for 5 stacks -- compact but preserves all luong tracing"
  - "Adjusted compression levels iteratively to stay within 25-45% target ceiling per file"

patterns-established:
  - "Table compression for multi-branch conditionals (3+ branches -> table rows)"
  - "Arrow notation for verbose conditionals (X -> khong co -> DUNG)"
  - "Bullet shorthand for explanatory paragraphs"
  - "Purpose line removal or reduction to single mau reference"

requirements-completed: [TOKN-02]

# Metrics
duration: 15min
completed: 2026-03-22
---

# Phase 3 Plan 2: Largest Workflow Compression Summary

**Compressed 4 largest workflow files (61% of workflow content) using telegraphic shorthand, reducing 31,523 -> 18,767 tokens (-40.5%) while preserving all behavioral instructions**

## Performance

- **Duration:** 15 min
- **Started:** 2026-03-22T09:08:07Z
- **Completed:** 2026-03-22T09:23:10Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments
- Compressed new-milestone.md: 667 -> 476 lines, 6889 -> 4872 tokens (-29.3%)
- Compressed write-code.md: 526 -> 341 lines, 9424 -> 5191 tokens (-44.9%)
- Compressed plan.md: 454 -> 324 lines, 8709 -> 4795 tokens (-44.9%)
- Compressed fix-bug.md: 399 -> 302 lines, 6501 -> 3909 tokens (-39.9%)
- All 18 smoke-integrity tests + 34 smoke-converters tests pass
- All behavioral instructions preserved (DUNG/STOP, PHAI/MUST, AskUserQuestion, conditional branches, git commands, step numbers, guard references)

## Task Commits

Each task was committed atomically:

1. **Task 1: Compress new-milestone.md and write-code.md** - `7b2bf2c` (feat)
2. **Task 2: Compress plan.md and fix-bug.md** - `1b427c2` (feat)

## Files Created/Modified
- `workflows/new-milestone.md` - Strategic planning workflow: 667 -> 476 lines (-29.3% tokens)
- `workflows/write-code.md` - Code execution workflow: 526 -> 341 lines (-44.9% tokens)
- `workflows/plan.md` - Technical planning workflow: 454 -> 324 lines (-44.9% tokens)
- `workflows/fix-bug.md` - Bug investigation+fix workflow: 399 -> 302 lines (-39.9% tokens)

## Decisions Made
- Iteratively adjusted compression levels to stay within 25-45% target per file (write-code.md initially at 50.5%, brought back to 44.9% by restoring verification loop detail and parallel mode context)
- Converted multi-branch conditionals to tables (task selection in write-code.md, stack tracing in fix-bug.md, patch version logic in fix-bug.md)
- Preserved AskUserQuestion blocks fully in new-milestone.md and plan.md (label/description/options intact, only shortened descriptions)
- Preserved error recovery steps (Buoc 1.1 pattern in write-code.md) as behavioral, not explanatory
- Preserved DISCUSS_STATE.md and verification_loop sections in plan.md and write-code.md as they contain critical branching logic

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
- write-code.md initial compression was at 50.5% (over 45% ceiling) - iteratively added back context in verification loop and parallel mode sections to bring to 44.9%
- plan.md initial compression was at 51.9% - added back FastCode research detail, Bước 4.5 trigger conditions, and PLAN.md creation guidance to bring to 44.9%

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- 4 largest workflow files compressed, representing 61% of total workflow content
- Remaining 6 workflow files (test, complete-milestone, scan, init, what-next, conventions) ready for next plan
- Token counting infrastructure (scripts/count-tokens.js --compare) operational for tracking ongoing compression

## Self-Check: PASSED

All 4 modified files verified on disk. Both task commits (7b2bf2c, 1b427c2) verified in git log.

---
*Phase: 03-prompt-prose-compression*
*Completed: 2026-03-22*
