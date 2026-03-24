---
phase: 28-agent-infrastructure-resource-rules
plan: 01
subsystem: infra
tags: [pure-functions, tier-mapping, resource-config, agent-registry, tdd]

# Dependency graph
requires: []
provides:
  - "resource-config.js: pure function module cho tier mapping, parallel limit, heavy lock, degradation"
  - "5 exported functions: getModelForTier, getAgentConfig, getParallelLimit, isHeavyAgent, shouldDegrade"
  - "4 exported constants: TIER_MAP, AGENT_REGISTRY, PARALLEL_LIMIT, HEAVY_TOOL_PATTERNS"
affects: [28-02, 29, 30, 32, 33]

# Tech tracking
tech-stack:
  added: []
  patterns: [pure-function-module, tdd-red-green, zero-dependency-config]

key-files:
  created:
    - bin/lib/resource-config.js
    - test/smoke-resource-config.test.js
  modified: []

key-decisions:
  - "Zero dependencies — khong require bat ky module nao, ke ca fs"
  - "Case-insensitive tier lookup — getModelForTier('SCOUT') hoat dong"
  - "Copy-on-return cho getModelForTier va getAgentConfig — tranh mutation"
  - "isHeavyAgent tra ve false cho agent khong ton tai thay vi throw"
  - "shouldDegrade tra ve false cho null/undefined thay vi throw"

patterns-established:
  - "Pure config module: constants + functions + module.exports, khong co I/O"
  - "Defensive returns: functions tra ve false/default cho input khong ton tai"

requirements-completed: [ORCH-01, ORCH-02, ORCH-03, ORCH-04]

# Metrics
duration: 2min
completed: 2026-03-24
---

# Phase 28 Plan 01: Resource Config Summary

**TDD resource-config.js voi 5 pure functions: tier mapping (scout/haiku, builder/sonnet, architect/opus), parallel limit 2, heavy agent detection qua mcp__fastcode__ pattern, degradation logic cho TIMEOUT/RESOURCE_EXHAUSTED/RATE_LIMIT**

## Performance

- **Duration:** 2 min
- **Started:** 2026-03-24T15:43:17Z
- **Completed:** 2026-03-24T15:45:14Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments
- 29 unit tests viet truoc (RED) cho 5 functions va 4 constants
- resource-config.js voi 5 pure functions pass tat ca 29 tests (GREEN)
- Zero dependencies — module khong require bat ky thu gi
- Tier mapping chuan: scout=haiku/low/15, builder=sonnet/medium/25, architect=opus/high/30

## Task Commits

Each task was committed atomically:

1. **Task 1: RED — Viet tests cho resource-config module** - `e7c5079` (test)
2. **Task 2: GREEN — Implement resource-config.js de pass tat ca tests** - `cca8911` (feat)

_Note: TDD plan — test truoc, implement sau_

## Files Created/Modified
- `test/smoke-resource-config.test.js` — 29 test cases cho 6 describe blocks (getModelForTier, getAgentConfig, getParallelLimit, isHeavyAgent, shouldDegrade, Constants)
- `bin/lib/resource-config.js` — Pure function module: 5 functions, 4 constants, zero I/O

## Decisions Made
- Zero dependencies — module khong import bat ky thu gi, ke ca fs (per D-07)
- Case-insensitive tier lookup — getModelForTier('SCOUT') tra ve haiku, tien loi khi dung tu YAML frontmatter
- Copy-on-return — getModelForTier va getAgentConfig tra ve shallow copy de tranh mutation
- isHeavyAgent va shouldDegrade tra ve false thay vi throw khi input khong hop le — an toan cho orchestrator goi

## Deviations from Plan

None — plan thuc hien dung nhu da viet.

## Issues Encountered
None

## User Setup Required
None — khong can cau hinh dich vu ben ngoai.

## Next Phase Readiness
- resource-config.js san sang lam nen tang cho 28-02 (agent files) va Phase 32 (orchestrator workflow)
- Tat ca 5 agent configs da dinh nghia trong AGENT_REGISTRY, san sang mapping vao agent YAML files
- Parallel limit va degradation logic san sang cho orchestrator tich hop

## Self-Check: PASSED

- [x] test/smoke-resource-config.test.js ton tai
- [x] bin/lib/resource-config.js ton tai
- [x] 28-01-SUMMARY.md ton tai
- [x] Commit e7c5079 ton tai
- [x] Commit cca8911 ton tai
- [x] 29/29 tests pass

---
*Phase: 28-agent-infrastructure-resource-rules*
*Completed: 2026-03-24*
