---
phase: 059-integration-wiring-verification
plan: 01
subsystem: resource-config, parallel-dispatch, agent-files
tags: [integration, platform-mapping, agent-wiring]
dependency_graph:
  requires: [054-platform-mapping-fallback, 053-new-agent-files]
  provides: [getAgentConfig-platform-wiring, pd-sec-scanner-agent-file]
  affects: [bin/lib/resource-config.js, bin/lib/parallel-dispatch.js, .claude/agents/pd-sec-scanner.md]
tech_stack:
  added: []
  patterns: [platform-param-passthrough, tier-to-model-delegation]
key_files:
  created:
    - .claude/agents/pd-sec-scanner.md
  modified:
    - bin/lib/resource-config.js
    - bin/lib/parallel-dispatch.js
    - test/smoke-resource-config.test.js
    - test/smoke-agent-files.test.js
decisions:
  - D-01: Wire platform thong qua getAgentConfig (khong thay doi caller interface)
  - D-02: getModelForTier(tier, undefined) backward compatible — khong break caller nao
  - D-03: buildParallelPlan la production caller dau tien truyen platform param
  - D-05: Giu nguyen file goc pd-sec-scanner tai commands/pd/agents/
metrics:
  duration: 225s
  completed: "2026-03-27T11:45:35Z"
---

# Phase 59 Plan 01: Integration Wiring — Platform Param + pd-sec-scanner Summary

Wire getAgentConfig(name, platform) goi getModelForTier thay vi truy cap TIER_MAP truc tiep, buildParallelPlan truyen platform xuong, pd-sec-scanner.md chuyen sang .claude/agents/ voi format moi

## Ket qua

### Task 1: Wire platform param vao getAgentConfig() + buildParallelPlan()

- `getAgentConfig(agentName, platform)` — them platform param, goi `getModelForTier(tier, platform)` thay vi `TIER_MAP[tier]`
- `buildParallelPlan(sessionDir, janitarEvidencePath, platform)` — truyen platform xuong 2 getAgentConfig calls
- Them 2 test cases: platform-specific model va backward compat
- **Commit:** `802fc7e`

### Task 2: Copy pd-sec-scanner sang .claude/agents/ + cap nhat smoke test

- Tao `.claude/agents/pd-sec-scanner.md` voi format moi: tools (comma-separated), model: haiku, maxTurns: 15, effort: low
- Giu nguyen noi dung body (objective, process, rules) tu file goc
- Them `pd-sec-scanner` vao AGENT_NAMES (14 agents)
- File goc tai `commands/pd/agents/pd-sec-scanner.md` van con nguyen
- **Commit:** `f85b4a0`

## Kiem chung

- `node --test test/smoke-resource-config.test.js test/smoke-agent-files.test.js test/platform-models.test.js` — 105 tests pass, 0 fail
- `grep -n 'function getAgentConfig' bin/lib/resource-config.js` → co `(agentName, platform)`
- `grep -n 'function buildParallelPlan' bin/lib/parallel-dispatch.js` → co `(sessionDir, janitarEvidencePath, platform)`
- `.claude/agents/pd-sec-scanner.md` ton tai voi format moi
- `commands/pd/agents/pd-sec-scanner.md` van con nguyen

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

None.
