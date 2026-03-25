---
phase: 32-orchestrator-workflow
plan: 02
subsystem: workflow-orchestrator
tags: [fix-bug, orchestrator, outcome-routing, bug-memory, session-lifecycle]
dependency_graph:
  requires: [32-01]
  provides: [complete-orchestrator-workflow]
  affects: [workflows/fix-bug.md, test/snapshots/]
tech_stack:
  added: []
  patterns: [agent-spawn, fail-forward, progressive-disclosure, outcome-routing, session-lifecycle]
key_files:
  created: []
  modified:
    - workflows/fix-bug.md
    - test/snapshots/codex/fix-bug.md
    - test/snapshots/copilot/fix-bug.md
    - test/snapshots/gemini/fix-bug.md
    - test/snapshots/opencode/fix-bug.md
decisions:
  - "Buoc 3 spawn pd-repro-engineer voi fail-forward — Repro la bo sung, khong block workflow"
  - "Buoc 4 3-way outcome routing: root_cause (3 lua chon), checkpoint (max 2 vong), inconclusive (2 lua chon)"
  - "Buoc 5 session lifecycle: fix commit -> user verify -> createBugRecord -> buildIndex -> updateSession(resolved) — per D-10/D-11"
  - "Tat ca v1.5 module calls wrap trong try/catch — loi chi tao WARNING, khong block"
  - "Regenerate 4x12 converter snapshots sau rewrite fix-bug.md"
metrics:
  duration: 6min
  completed: 2026-03-25T06:11:00Z
  tasks: 2
  files: 9
requirements: [FLOW-03, FLOW-04, FLOW-05]
---

# Phase 32 Plan 02: Hoan thanh Orchestrator Workflow (Buoc 3-5 + Rules + Success Criteria) Summary

Hoan thanh nua sau cua orchestrator workflow fix-bug.md — tu Repro Engineer (Buoc 3) den Fix+Commit+Post-fix (Buoc 5), voi 10 module tich hop, 3-way outcome routing, session lifecycle day du, va 15 rules moi.

## Ket qua

### Task 1: Viet Buoc 3 (Repro Engineer) va Buoc 4 (Fix Architect + Outcome Routing)
**Commit:** cb4f448

- Buoc 3: spawn `pd-repro-engineer`, doc evidence_janitor.md + evidence_code.md, ghi evidence_repro.md
- Buoc 3 fail-forward: agent fail chi WARNING, tiep tuc Buoc 4 (Repro la bo sung)
- Buoc 4: spawn `pd-fix-architect`, doc tat ca evidence files, ghi evidence_architect.md
- Buoc 4 outcome routing voi `validateEvidence()` va `parseEvidence()`:
  - **root_cause**: `buildRootCauseMenu()` -> 3 lua chon (fix_now/fix_plan/self_fix)
  - **checkpoint**: `extractCheckpointQuestion()` + `buildContinuationContext()` max 2 vong
  - **inconclusive**: hien Elimination Log, 2 lua chon (bo sung thong tin / dung)
- Architect fail: hien evidence truc tiep cho user tu quyet dinh

### Task 2: Viet Buoc 5 (Fix+Commit+Post-fix), rules, va success_criteria
**Commit:** ebc8dc2

- Buoc 5a: regression analysis voi `analyzeFromCallChain()` / `analyzeFromSourceFiles()` (try/catch)
- Buoc 5b: sua code theo fixInstructions, retry toi da 3 lan
- Buoc 5c: `scanDebugMarkers()` + `matchSecurityWarnings()` truoc commit (try/catch, non-blocking)
- Buoc 5d: commit format `fix([LOI]): mo ta` per D-08
- Buoc 5e: user verify -> `createBugRecord()` -> `buildIndex()` -> `updateSession(resolved)` per D-10/D-11
- Buoc 5f: `runLogicSync()` non-blocking sau verify (try/catch)
- 15 rules moi cho orchestrator mode
- 12 success criteria phu 5 buoc orchestrator
- Cap nhat 48 converter snapshots (4 platforms x 12 skills)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Cherry-pick Plan 01 commits**
- **Found during:** Initialization
- **Issue:** Plan 02 depends on Plan 01 (32-01) output. Plan 01 was executed on a different worktree branch and its commits were not available.
- **Fix:** Cherry-picked 2 code commits (c793f3a, e3dfb4c) from Plan 01 to get the rewritten fix-bug.md base. Skipped the docs commit (3eb7104) due to merge conflicts in STATE.md/ROADMAP.md (docs will be created fresh by this plan).
- **Files modified:** workflows/fix-bug.md, workflows/fix-bug-v1.5.md

**2. [Rule 1 - Bug] Regenerate converter snapshots**
- **Found during:** Task 2 verification
- **Issue:** 48 snapshot tests (4 platforms x 12 skills) were failing because fix-bug.md content changed significantly from v1.5 to orchestrator format. Snapshots still reflected v1.5 content.
- **Fix:** Ran `node test/generate-snapshots.js` to regenerate all snapshots. 48/48 snapshot tests now pass.
- **Files modified:** test/snapshots/{codex,copilot,gemini,opencode}/fix-bug.md

## Deferred Issues

4 test failures are PRE-EXISTING from Plan 01's rewrite (not caused by Plan 02):
1. `inlineWorkflow xu ly duoc moi command co workflow` — workflow format changed from v1.5
2. `fix-bug workflow co effort routing tu bug classification` — effort routing removed per v2.1 design
3. `executor workflows co backward compat default sonnet` — old pattern
4. `workflows co tham chieu context7-pipeline` — context7 reference not in orchestrator format

These tests need updating to match the new orchestrator workflow structure. Logged to deferred-items.md.

## Known Stubs

None — workflow is complete with all 5 steps, rules, and success criteria.

## Self-Check: PASSED
