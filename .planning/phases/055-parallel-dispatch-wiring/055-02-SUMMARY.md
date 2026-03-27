---
phase: 055-parallel-dispatch-wiring
plan: 02
subsystem: parallel-dispatch
tags: [adaptive-parallel, heavy-agent, min-max, backpressure, tdd]
dependency_graph:
  requires: [getAdaptiveParallelLimit-loadAvg]
  provides: [adaptive-dispatch, backpressure-flag]
  affects: [audit-workflow, scanner-dispatch]
tech_stack:
  added: []
  patterns: [adaptive-workers, backpressure-signaling, TDD-red-green]
key_files:
  created: []
  modified:
    - bin/lib/parallel-dispatch.js
    - test/smoke-parallel-dispatch.test.js
decisions:
  - "buildScannerPlan default batchSize=null thay vi 2 — adaptive tu getAdaptiveParallelLimit()"
  - "Heavy agent giam 1 worker nhung khong duoi PARALLEL_MIN — tranh starvation"
  - "Old test batchSize<1 cap nhat cho PARALLEL_MIN clamp thay vi clamp to 1"
metrics:
  duration: 158s
  completed: "2026-03-27T06:17:33Z"
  tasks: 2
  files: 2
---

# Phase 055 Plan 02: Adaptive Dispatch + Backpressure Wiring Summary

Wire getAdaptiveParallelLimit(), isHeavyAgent(), shouldDegrade(), PARALLEL_MIN/MAX vao parallel-dispatch.js — buildScannerPlan dung adaptive workers, merge functions tra backpressure flag.

## Completed Tasks

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | TDD RED — tests cho adaptive, heavy, min/max, backpressure | 67929e1 | test/smoke-parallel-dispatch.test.js |
| 2 | Wire adaptive + heavy + min/max + backpressure | 790c321 | bin/lib/parallel-dispatch.js, test/smoke-parallel-dispatch.test.js |

## Implementation Details

### Task 1: TDD RED — 6 failing tests (5 new features)

Them 5 describe blocks moi vao test file:
- PARA-01: adaptive default (2 tests) — pass vi default 2 nam trong range
- PARA-02: heavy agent check (1 test) — pass vi default 2 nam trong range
- PARA-03: min/max enforce (2 tests) — 1 fail (batchSize=10 chua clamp)
- PARA-04: backpressure cho mergeScannerResults (3 tests) — fail (chua co field)
- PARA-04: backpressure cho mergeParallelResults (2 tests) — fail (chua co field)

Import them `PARALLEL_MIN, PARALLEL_MAX` tu resource-config de dung trong assertions.

### Task 2: GREEN — 5 thay doi trong parallel-dispatch.js

1. **Mo rong import**: them `getAdaptiveParallelLimit, isHeavyAgent, shouldDegrade, PARALLEL_MIN, PARALLEL_MAX`
2. **buildScannerPlan**: default `batchSize=null`, goi `getAdaptiveParallelLimit().workers` khi null, `isHeavyAgent('pd-sec-scanner')` giam 1, `Math.max(PARALLEL_MIN, Math.min(PARALLEL_MAX, batchSize))` enforce range
3. **mergeScannerResults**: them `backpressure` field, set true khi `shouldDegrade(item.error)`
4. **mergeParallelResults**: them `backpressure` field, set true khi `shouldDegrade(error)` trong ca detective va docSpec blocks
5. **buildParallelPlan**: them comment D-02/D-06, khong thay doi logic

Cap nhat old test `batchSize < 1` cho PARALLEL_MIN clamp (2 thay vi 1).

## Verification Results

- `node --test test/smoke-parallel-dispatch.test.js` — 28/28 pass
- `node --test test/smoke-resource-config.test.js` — all pass
- `node --run test` — 1083/1083 pass
- `buildScannerPlan(['xss','auth','secrets'])` — adaptive batch, waves correct
- `mergeScannerResults([{..., error: {code: 'TIMEOUT'}}])` — backpressure: true

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Old test batchSize<1 khong tuong thich voi PARALLEL_MIN clamp**
- **Found during:** Task 2
- **Issue:** Old test ky vong batchSize=0 clamp to 1 (2 waves of 1), nhung PARALLEL_MIN=2 clamp to 2 (1 wave of 2)
- **Fix:** Cap nhat test expectation cho PARALLEL_MIN behavior
- **Files modified:** test/smoke-parallel-dispatch.test.js
- **Commit:** 790c321

## Known Stubs

None.

## Self-Check: PASSED
