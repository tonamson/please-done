---
phase: 055-parallel-dispatch-wiring
plan: 01
subsystem: resource-config
tags: [loadAvg, adaptive-parallel, graceful-degradation, tdd]
dependency_graph:
  requires: []
  provides: [getAdaptiveParallelLimit-loadAvg]
  affects: [parallel-dispatch]
tech_stack:
  added: []
  patterns: [os.loadavg, TDD-red-green]
key_files:
  created: []
  modified:
    - bin/lib/resource-config.js
    - test/smoke-resource-config.test.js
decisions:
  - "loadAvg > 0 check de skip tren Windows (loadavg tra ve 0)"
  - "Giam dung 1 worker khi overloaded — khong giam nhieu hon de tranh starvation"
metrics:
  duration: 77s
  completed: "2026-03-27T06:13:21Z"
  tasks: 2
  files: 2
---

# Phase 055 Plan 01: loadAvg Extension cho getAdaptiveParallelLimit Summary

Mo rong getAdaptiveParallelLimit() them os.loadavg()[0] check va loadAvg field trong return object — graceful degradation giam 1 worker khi system load vuot CPU count.

## Completed Tasks

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Them loadAvg tests (TDD RED) | f65e2a3 | test/smoke-resource-config.test.js |
| 2 | Mo rong getAdaptiveParallelLimit() | 5574cd5 | bin/lib/resource-config.js |

## Implementation Details

### Task 1: TDD RED — 3 failing tests

Them describe block `getAdaptiveParallelLimit — loadAvg extension` voi 3 tests:
- `loadAvg` field la number
- `loadAvg >= 0`
- backward compat (workers, reason, cpu, freeMemGB van co)

2/3 tests fail (RED) vi `loadAvg` chua co trong return object.

### Task 2: GREEN — Implementation

1. Them `const loadAvg = os.loadavg()[0]` sau freeMemGB calculation
2. Them loadAvg degradation check: `loadAvg > 0 && loadAvg > cpuCount && workers > PARALLEL_MIN` giam 1 worker
3. Append loadAvg info vao reason string khi degradation xay ra
4. Them `loadAvg` field vao return object
5. Update JSDoc @returns

## Verification Results

- `node --test test/smoke-resource-config.test.js` — 41/41 pass
- `node --run test` — 1073/1073 pass (backward compat)
- `node -e "...getAdaptiveParallelLimit()"` — output co field loadAvg

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

None.

## Self-Check: PASSED
