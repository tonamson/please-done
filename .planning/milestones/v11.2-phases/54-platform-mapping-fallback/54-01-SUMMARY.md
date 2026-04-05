---
phase: 54-platform-mapping-fallback
plan: 01
subsystem: resource-config, platforms
tags: [platform-mapping, fallback, tdd, backward-compatible]
dependency_graph:
  requires: []
  provides: [PLATFORM_MODEL_MAP, FALLBACK_CHAIN, getModelForTier-platform, cursor-platform, windsurf-platform]
  affects: [agent-config-resolution, platform-registry]
tech_stack:
  added: []
  patterns: [platform-model-mapping, fallback-chain, config-driven-resolution]
key_files:
  created:
    - test/platform-models.test.js
  modified:
    - bin/lib/resource-config.js
    - bin/lib/platforms.js
    - test/smoke-utils.test.js
decisions:
  - "PLATFORM_MODEL_MAP keys la generic model names (haiku/sonnet/opus) de match TIER_MAP"
  - "Gemini khong co opus -> fallback tu dong sang builder voi metadata"
  - "Unknown platform tra ve generic tier (khong throw)"
metrics:
  duration: 228s
  completed: 2026-03-27
  tasks: 2
  files: 4
  tests_added: 32
  tests_total_pass: 1070
---

# Phase 54 Plan 01: Platform Model Mapping va Fallback Summary

PLATFORM_MODEL_MAP cho 7 platforms (claude, codex, gemini, opencode, copilot, cursor, windsurf) voi fallback chain tu dong khi platform thieu tier cao, backward compatible 100%.

## Ket qua

| Task | Mo ta | Commit | Files |
|------|-------|--------|-------|
| 1 | TDD RED: 32 test cases cho platform mapping + fallback | 4cd1861 | test/platform-models.test.js |
| 2 | TDD GREEN: PLATFORM_MODEL_MAP, getModelForTier(tier, platform?), cursor/windsurf | 24de6b7 | bin/lib/resource-config.js, bin/lib/platforms.js |

## Chi tiet Implementation

### resource-config.js
- **PLATFORM_MODEL_MAP**: 7 platform entries, moi entry map generic model name sang platform-specific model ID
- **FALLBACK_CHAIN**: `['architect', 'builder', 'scout']` — khi platform thieu tier cao, tu dong ha xuong
- **getModelForTier(tier, platform?)**: Mo rong voi optional platform param. Khong platform = generic (backward compatible). Unknown platform = generic. Fallback co metadata (fallback: true, requestedTier, resolvedTier)

### platforms.js
- **TOOL_MAP**: Them cursor va windsurf (empty — dung Claude native tool names)
- **PLATFORMS**: Them cursor (.cursor, /pd:) va windsurf (.windsurf, /pd:)
- **getGlobalDir()**: Them case cursor va windsurf trong switch

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Cap nhat smoke-utils.test.js platform count tu 5 len 7**
- **Found during:** Task 2 verification
- **Issue:** Test cu assert `runtimes.length === 5`, nay co 7 platforms
- **Fix:** Cap nhat assert len 7, them check cursor va windsurf
- **Files modified:** test/smoke-utils.test.js
- **Commit:** f91d09b

## Verification

- `node --test test/platform-models.test.js` — 32/32 pass
- `node --test test/smoke-resource-config.test.js` — 38/38 pass
- `node --test test/smoke-agent-files.test.js` — 26/26 pass
- `node --test 'test/*.test.js'` — 1070/1070 pass, 0 failures

## Known Stubs

None — tat ca data wired truc tiep, khong co placeholder.
