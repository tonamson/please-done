---
phase: 66-workflow-translation
plan: 01
subsystem: workflows
tags: [translation, i18n, workflows, english]

requires:
  - phase: 65-skills-config-foundation
    provides: Translation patterns and terminology standardization
provides:
  - 7 smaller workflow files translated to English
  - Test assertions updated for translated content
affects: [66-02, 69-test-synchronization]

tech-stack:
  added: []
  patterns: [temp-file-rename for safe large file replacement]

key-files:
  created: []
  modified:
    - workflows/init.md
    - workflows/scan.md
    - workflows/conventions.md
    - workflows/what-next.md
    - workflows/research.md
    - workflows/complete-milestone.md
    - workflows/test.md
    - test/smoke-integrity.test.js

key-decisions:
  - "Added Step to regex alternation (Step|Bước|Buoc) temporarily for Plan 02 compatibility"
  - "Preserved all XML tags, placeholders, and cross-references verbatim"

patterns-established:
  - "Temp file strategy: create .tmp then mv for safe large file replacement"

requirements-completed: []

duration: 8min
completed: 2026-03-28
---

# Phase 66 Plan 01: Translate 7 Smaller Workflow Files

**Translated 7 workflow files (1,058 lines) from Vietnamese to English with zero diacritics remaining and all 56 smoke tests passing.**

## Performance

- **Duration:** ~8 min
- **Tasks:** 2 completed
- **Files modified:** 8

## Accomplishments
- Translated init.md, scan.md, conventions.md, what-next.md, research.md, complete-milestone.md, test.md to English
- All "Bước X" references converted to "Step X" with sub-numbering preserved
- Updated smoke-integrity.test.js assertions that referenced translated content
- All 56 smoke-integrity tests pass

## Task Commits

1. **Task 1: Translate 7 smaller workflow files** - `e6543ee` (feat)
2. **Task 2: Update test assertions for translated workflows** - `aa077f0` (test)

## Files Created/Modified
- `workflows/init.md` - Project initialization workflow (168 lines)
- `workflows/scan.md` - Project scanning workflow (108 lines)
- `workflows/conventions.md` - Coding conventions detection (81 lines)
- `workflows/what-next.md` - Progress check and suggestion (91 lines)
- `workflows/research.md` - Research pipeline orchestration (91 lines)
- `workflows/complete-milestone.md` - Milestone completion workflow (272 lines)
- `workflows/test.md` - Test writing and execution workflow (247 lines)
- `test/smoke-integrity.test.js` - Updated regex alternation and effort routing assertion

## Decisions Made
- Added "Step" to process regex alternation as temporary measure (Step|Bước|Buoc) — Plan 02 will finalize to Step-only
- Changed "Effort routing cho test" → "Effort routing for test" to match translated test.md

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None.

## Self-Check: PASSED
- All 7 files: 0 Vietnamese diacritics (grep verified)
- All 7 files: 0 "Bước" occurrences (grep verified)
- All 7 files: Step numbering present (grep verified)
- XML tags preserved in all files
- smoke-integrity.test.js: 56/56 tests pass
