---
phase: 36-fix-workflow-wiring
plan: 01
subsystem: workflow-wiring
tags: [gap-closure, INT-07, INT-08, fix-bug-workflow]
dependency_graph:
  requires: [parallel-dispatch, logic-sync, evidence-protocol]
  provides: [fix-bug-workflow-v2.1-wired]
  affects: [workflows/fix-bug.md, 4-platform-snapshots]
tech_stack:
  patterns: [optional-chaining, shape-construction]
key_files:
  modified:
    - workflows/fix-bug.md
    - test/snapshots/codex/fix-bug.md
    - test/snapshots/copilot/fix-bug.md
    - test/snapshots/gemini/fix-bug.md
    - test/snapshots/opencode/fix-bug.md
decisions:
  - "Rename validateEvidence result thanh detectiveValidation/docSpecValidation de tranh nham voi detectiveResult shape cho mergeParallelResults"
  - "Dung optional chaining (logicResult?.hasLogicChange, rulesResult?.suggestions?.length) de an toan voi null returns"
metrics:
  duration: ~1min
  completed: 2026-03-25
  tasks: 2
  files: 5
---

# Phase 36 Plan 01: Fix Workflow Wiring Summary

**Fix 2 wiring bugs trong fix-bug.md: detectiveResult shape mismatch (INT-07) va runLogicSync return destructuring sai (INT-08) — gap closure cuoi cung cua v2.1**

## Tong quan

Plan nay dong 2 integration gaps con lai tu v2.1 milestone audit:

- **INT-07 (P1)**: `mergeParallelResults()` nhan `validateEvidence()` result thay vi `{ evidenceContent }` object — khien Detective luon bi danh gia FAILED gia vi `detectiveResult?.evidenceContent` la undefined.
- **INT-08 (P2)**: `runLogicSync()` return duoc destructure thanh `{ hasLogicChange, signals, diagramUpdated, rulesSuggested }` — khong khop voi actual return `{ logicResult, reportResult, rulesResult, warnings }`. Khien PDF update va CLAUDE.md rule suggestion KHONG BAO GIO fire.

## Cac thay doi

### Task 1: Fix 2 call sites trong fix-bug.md (4a48d92)

**INT-07 fix (dong 125-135):**
- Rename `validateEvidence(detectiveContent) -> detectiveResult` thanh `-> detectiveValidation`
- Them dong: `Construct detectiveResult: { evidenceContent: detectiveContent }`
- Tuong tu cho DocSpec: rename `-> docSpecResult` thanh `-> docSpecValidation`, construct `{ evidenceContent: docSpecContent }`
- Ket qua: `mergeParallelResults({ detectiveResult, docSpecResult })` nhan dung shape, `allSucceeded` phan anh dung trang thai

**INT-08 fix (dong 357-363):**
- Doi destructuring tu `{ hasLogicChange, signals, diagramUpdated, rulesSuggested }` thanh `{ logicResult, reportResult, rulesResult, warnings }`
- PDF check: `logicResult?.hasLogicChange = true va reportResult !== null`
- CLAUDE.md check: `rulesResult?.suggestions?.length > 0`

### Task 2: Regenerate snapshots va verify (efa4e61)

- 4 platform snapshots (codex, copilot, gemini, opencode) regenerated
- 763/763 tests pass, 0 failures, 0 regressions

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

None.

## Self-Check: PASSED

- All 5 modified files verified on disk
- Commit 4a48d92 (Task 1) verified in git log
- Commit efa4e61 (Task 2) verified in git log
- 763/763 tests pass
