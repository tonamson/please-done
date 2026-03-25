---
phase: 34-fix-integration-wiring
plan: 01
subsystem: workflow-orchestrator
tags: [gap-closure, call-signatures, wiring-fix, enforcement]
dependency_graph:
  requires: []
  provides: [ORCH-03, ORCH-04, PROT-03, PROT-06, PROT-08, FLOW-02, FLOW-05]
  affects: [workflows/fix-bug.md, test/snapshots]
tech_stack:
  added: []
  patterns: [pure-function-call-from-workflow, heavy-lock-check, auto-degrade]
key_files:
  created: []
  modified:
    - workflows/fix-bug.md
    - test/snapshots/codex/fix-bug.md
    - test/snapshots/copilot/fix-bug.md
    - test/snapshots/gemini/fix-bug.md
    - test/snapshots/opencode/fix-bug.md
decisions:
  - "Xoa toan bo fixInstructions/suggestedSteps ke ca trong fallback section (dong 257) de dam bao zero old param names"
metrics:
  duration: 3min
  completed: 2026-03-25T08:06:16Z
  tasks_completed: 2
  files_modified: 5
---

# Phase 34 Plan 01: Sua call signatures va them enforcement points

Sua 4 call signature bugs (mergeParallelResults, buildContinuationContext, prepareSelfFix, prepareFixNow) va them 2 enforcement points (isHeavyAgent, shouldDegrade) vao workflows/fix-bug.md

## Completed Tasks

| Task | Name | Commit | Key Files |
|------|------|--------|-----------|
| 1 | Sua 4 call signature bugs (D-01 den D-04) | ce66be1 | workflows/fix-bug.md |
| 2 | Them isHeavyAgent + shouldDegrade + regenerate snapshots | 8f15faa | workflows/fix-bug.md, 4 snapshot files |

## Changes Made

### Task 1: Sua 4 call signature bugs
- **BUG-1 (D-01):** mergeParallelResults — doi `{ detective: detectiveResult, docSpec: docSpecResult }` thanh `{ detectiveResult, docSpecResult }` de khop voi parallel-dispatch.js dong 66
- **BUG-2 (D-02):** buildContinuationContext — doi positional args `(content, userAnswer, roundNumber)` thanh object `{ evidencePath, userAnswer, sessionDir, currentRound, agentName }` de khop voi checkpoint-handler.js dong 65
- **BUG-3 (D-03):** prepareSelfFix — doi `{ summary, suggestedSteps }` thanh `{ action, sessionUpdate, summary, filesForReview, resumeHint, warnings }` de khop voi outcome-router.js dong 139
- **BUG-4 (D-04):** prepareFixNow — doi `{ fixInstructions, targetFiles, rootCause }` thanh `{ action, reusableModules, evidence, suggestion, commitPrefix, warnings }` de khop voi outcome-router.js dong 79. Cap nhat ca 2 references trong Buoc 5a va 5b.

### Task 2: Them enforcement points + regenerate snapshots
- **D-05:** Them `isHeavyAgent('pd-code-detective')` check tai Buoc 2 step 0, truoc khi spawn Detective
- **D-06:** Them `shouldDegrade(error)` trong error handler khi Detective fail do timeout/spawn error
- Regenerate 48 snapshots (4 platforms x 12 skills)
- 104 tests pass (smoke-integrity + smoke-snapshot)

## Verification Results

- grep old param names (fixInstructions, suggestedSteps, detective:, docSpec:) = 0
- grep detectiveResult, docSpecResult -> dong 134
- grep evidencePath + currentRound + agentName -> dong 233
- grep isHeavyAgent -> dong 106 (Buoc 2)
- grep shouldDegrade -> dong 149 (Buoc 2 error handler)
- node --test smoke-integrity + smoke-snapshot: 104 pass, 0 fail

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing] Xoa fixInstructions trong Architect FAIL fallback (dong 257)**
- **Found during:** Task 1
- **Issue:** Dong 257 con reference "tao fixInstructions thu cong" — acceptance criteria yeu cau zero occurrences
- **Fix:** Doi thanh "tao evidence va suggestion thu cong tu evidence files"
- **Files modified:** workflows/fix-bug.md
- **Commit:** ce66be1

## Known Stubs

None — tat ca call signatures da wired dung voi module definitions.
