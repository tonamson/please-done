---
phase: 33-resilience-backward-compatibility
plan: 02
subsystem: workflow
tags: [inconclusive-loop, single-agent-fallback, test-fixes, snapshots]

# Dependency graph
requires:
  - phase: 33-resilience-backward-compatibility
    plan: 01
    provides: buildInconclusiveContext(), MAX_INCONCLUSIVE_ROUNDS
  - phase: 32-orchestrator-workflow
    provides: fix-bug.md v2.1 orchestrator workflow
provides:
  - "fix-bug.md: INCONCLUSIVE loop-back flow (max 3 vong, quay lai Buoc 2)"
  - "fix-bug.md: Buoc 0 agent detection + --single fallback sang v1.5"
  - "smoke-integrity.test.js: 2 tests moi cho FLOW-06 va FLOW-07"
  - "Snapshots: 48 snapshots regenerated cho fix-bug.md v2.1"
affects: []

# Tech tracking
tech-stack:
  added: []
  patterns: [agent-detection-at-workflow-start, v1.5-fallback-redirect]

key-files:
  created: []
  modified:
    - workflows/fix-bug.md
    - test/smoke-integrity.test.js
    - test/snapshots/codex/fix-bug.md
    - test/snapshots/copilot/fix-bug.md
    - test/snapshots/gemini/fix-bug.toml
    - test/snapshots/opencode/fix-bug.md

key-decisions:
  - "Buoc 0 dung hardcoded list 5 agent files thay vi glob pattern — de biet chinh xac thieu file nao"
  - "fix-bug.md v2.1 khong con hardcode 'sonnet' — dung agent tiers qua resource-config"
  - "Regex inlineWorkflow ho tro ca Buoc (khong dau) va Buoc (co dau) de backward compat"

patterns-established:
  - "Agent detection: kiem tra 5 files + --single flag tai Buoc 0, truoc moi logic khac"
  - "Fallback redirect: doc content v1.5 workflow thay vi spawn process moi"

requirements-completed: [FLOW-06, FLOW-07]

# Metrics
duration: 4min
completed: 2026-03-25
tasks_completed: 2
tasks_total: 2
files_modified: 6
---

# Phase 33 Plan 02: Workflow Integration — INCONCLUSIVE loop-back va single-agent fallback

Sua fix-bug.md workflow: Buoc 0 agent detection + --single fallback sang v1.5, INCONCLUSIVE loop-back quay lai Buoc 2 toi da 3 vong qua buildInconclusiveContext, fix 3 test failures va regenerate 48 snapshots — 763 tests pass, 0 failures.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Them Buoc 0 agent detection + --single fallback va INCONCLUSIVE loop-back | ec1e32e | workflows/fix-bug.md |
| 2 | Fix 3 test failures, them 2 tests moi, regenerate snapshots | 77cc3f3 | test/smoke-integrity.test.js, test/snapshots/ (4 files) |

## Verification Results

```
node --test 'test/*.test.js'
tests 763, pass 763, fail 0
```

Tat ca 763 tests pass (tang 2 so voi 761 truoc do): 3 tests cu da fix + 2 tests moi.

## Deviations from Plan

None — plan thuc hien dung nhu viet.

## Known Stubs

None.

## Self-Check: PASSED

- Files: 6/6 found (fix-bug.md, smoke-integrity.test.js, 4 snapshot files)
- Commits: 2/2 found (ec1e32e, 77cc3f3)
- Tests: 763 pass, 0 fail
- Acceptance criteria: all met
