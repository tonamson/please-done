---
phase: 35-fix-evidence-encoding-critical-wiring
plan: 02
subsystem: workflow-wiring
tags: [bug-fix, integration, wiring, requirements]
dependency_graph:
  requires: [35-01]
  provides: [complete-v2.1-wiring]
  affects: [workflows/fix-bug.md, bin/lib/outcome-router.js, REQUIREMENTS.md]
tech_stack:
  added: []
  patterns: [Read-updateSession-Write pattern, existingBugs param forwarding]
key_files:
  created: []
  modified:
    - bin/lib/outcome-router.js
    - test/smoke-outcome-router.test.js
    - workflows/fix-bug.md
    - .planning/REQUIREMENTS.md
    - test/snapshots/codex/fix-bug.md
    - test/snapshots/copilot/fix-bug.md
    - test/snapshots/gemini/fix-bug.md
    - test/snapshots/opencode/fix-bug.md
decisions:
  - "prepareFixPlan planPath dung template literal ${sessionDir}/FIX-PLAN.md thay vi bare filename"
  - "roundNumber = 1 init truoc CHECKPOINT block, tang len 1 khi quay lai Buoc 4"
  - "existingBugs truyen tu Glob result, bugRecord.content/fileName thay vi bugRecordMd"
  - "Read->updateSession->Write pattern day du tai isHeavyAgent warning va Repro FAIL"
metrics:
  duration: 4min
  completed: 2026-03-25
  tasks: 3
  files: 8
---

# Phase 35 Plan 02: Fix Wiring Bugs va Cap nhat Requirements Summary

Fix 4 integration wiring bugs (INT-02, INT-03, INT-04, INT-05) trong workflow va modules, cap nhat 16 REQUIREMENTS.md checkboxes va Traceability table sang Complete.

## Completed Tasks

| Task | Name | Commit | Key Changes |
|------|------|--------|-------------|
| 1 | Fix prepareFixPlan planPath (INT-03) | f3791c7 | outcome-router.js planPath dung `${sessionDir}/FIX-PLAN.md`, test cap nhat |
| 2 | Fix roundNumber, createBugRecord, write-back (INT-02, INT-04, INT-05) | 2e1a073 | roundNumber init, existingBugs truyen dung, Read->updateSession->Write day du |
| 3 | Cap nhat REQUIREMENTS.md (D-07) | b8d86e5 | 16 checkboxes [x], 16 Traceability Complete, 4 platform snapshots regen |

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Regenerate converter snapshots**
- **Found during:** Task 3
- **Issue:** Thay doi fix-bug.md lam snapshot tests fail (expected behavior)
- **Fix:** Chay `node test/generate-snapshots.js` de regenerate 4 platform snapshots
- **Files modified:** test/snapshots/{codex,copilot,gemini,opencode}/fix-bug.md
- **Commit:** b8d86e5

### Pre-existing Issues (Out of Scope)

- `test/smoke-parallel-dispatch.test.js` co 1 test failure pre-existing (khong lien quan toi thay doi cua plan nay)

## Verification Results

- `node --test test/smoke-outcome-router.test.js` — 15/15 PASS
- `grep "roundNumber = 1" workflows/fix-bug.md` — co ket qua (1)
- `grep "existingBugs" workflows/fix-bug.md` — co ket qua (2)
- `grep "bugRecord.content" workflows/fix-bug.md` — co ket qua (1)
- `grep "[x] **ORCH-01**" .planning/REQUIREMENTS.md` — co ket qua (1)
- `grep "[x] **MEM-04**" .planning/REQUIREMENTS.md` — co ket qua (1)
- `grep "[x] **FLOW-05**" .planning/REQUIREMENTS.md` — co ket qua (1)
- 149 tests pass (outcome-router + snapshot + evidence-protocol + integrity), 0 fail

## Known Stubs

None — plan chi fix wiring bugs va cap nhat documentation, khong co stubs.

## Self-Check: PASSED
