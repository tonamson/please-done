---
phase: 66-workflow-translation
plan: 02
subsystem: workflows
tags: [translation, i18n, workflows, english]

requires:
  - phase: 66-workflow-translation/01
    provides: 7 smaller workflows translated, temp-file pattern established
provides:
  - 6 larger workflow files translated to English
  - Test assertions finalized for all 13 translated workflows
affects: [69-test-synchronization]

tech-stack:
  added: []
  patterns: [temp-file-rename for safe large file replacement]

key-files:
  created: []
  modified:
    - workflows/write-code.md
    - workflows/fix-bug.md
    - workflows/fix-bug-v1.5.md
    - workflows/plan.md
    - workflows/new-milestone.md
    - workflows/audit.md
    - test/smoke-integrity.test.js

key-decisions:
  - "Finalized Step regex: removed Bước/Buoc alternation, all 13 workflows now English-only"
  - "Non-diacritical Vietnamese in fix-bug.md fully translated despite zero diacritic grep matches"
  - "Updated 6 regex patterns in tests (including classification table pattern)"
  - "50 pre-existing failures in smoke-snapshot/security-rules/utils confirmed unchanged"

patterns-established:
  - "Non-diacritical Vietnamese requires full file read, not just diacritic grep"

requirements-completed:
  - TRANS-03

duration: 12min
completed: 2026-03-28
---

# Phase 66 Plan 02: Translate 6 Larger Workflow Files

**Translated 6 larger workflow files (2,552 lines) from Vietnamese to English. All 56 smoke-integrity tests pass. TRANS-03 complete — all 13 workflow files now English.**

## Performance

- **Duration:** ~12 min (across 2 sessions)
- **Tasks:** 2 completed
- **Files modified:** 7

## Accomplishments

- Translated write-code.md, fix-bug.md, fix-bug-v1.5.md, plan.md, new-milestone.md, audit.md to English
- Handled non-diacritical Vietnamese in fix-bug.md (408 lines without diacritics)
- Plan.md (524 lines) — largest file — classification table "Files sửa/tạo" → "Files modified/created"
- write-code.md — "DỪNG" → "STOP", "KHÔNG dump toàn bộ" → "DO NOT dump the entire"
- Finalized all smoke-integrity regex patterns: removed all Vietnamese alternations
- All 56 smoke-integrity tests pass

## Task Commits

1. **Task 1: Translate 6 larger workflow files** - `70655d7` (feat)
2. **Task 2: Finalize test assertions** - `7da4f33` (test)

## Files Modified

- `workflows/write-code.md` - Code execution workflow (~471 lines)
- `workflows/fix-bug.md` - Bug investigation pipeline (~408 lines, non-diacritical Vietnamese)
- `workflows/fix-bug-v1.5.md` - Enhanced bug investigation v1.5 (~438 lines)
- `workflows/plan.md` - Phase planning workflow (~524 lines, largest)
- `workflows/new-milestone.md` - Milestone initialization workflow (~404 lines)
- `workflows/audit.md` - Security audit workflow (~307 lines)
- `test/smoke-integrity.test.js` - 6 regex assertions updated

## Notes

- 50 pre-existing test failures in smoke-snapshot (48), smoke-security-rules (1), smoke-utils (1) confirmed unchanged by this plan
- Snapshot regeneration deferred to separate task/phase
