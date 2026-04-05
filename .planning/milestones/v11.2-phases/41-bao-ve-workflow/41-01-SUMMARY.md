---
phase: 41-bao-ve-workflow
plan: 01
subsystem: plan-checker
tags: [check-06, check-07, research-backing, hedging-language, pure-function]
dependency_graph:
  requires: [plan-checker.js (8 checks hien co)]
  provides: [checkResearchBacking, checkHedgingLanguage, 10-check runAllChecks]
  affects: [bin/plan-check.js CLI, workflow plan-checking pipeline]
tech_stack:
  added: []
  patterns: [pure-function check pattern voi configurable severity]
key_files:
  created: []
  modified:
    - bin/lib/plan-checker.js
    - bin/plan-check.js
    - test/smoke-plan-checker.test.js
decisions:
  - "CHECK-06 PASS khi khong co research files (tranh false positive cho projects chua co research)"
  - "Hedging patterns regex case-insensitive voi 6 patterns tieng Viet"
  - "CHECK-06 va CHECK-07 chen truoc ADV checks trong runAllChecks array"
metrics:
  duration: 211s
  completed: "2026-03-25T23:38:26Z"
  tasks: 2
  files: 3
---

# Phase 41 Plan 01: CHECK-06 Research Backing va CHECK-07 Hedging Language

Them 2 pure function checks vao plan-checker.js — CHECK-06 phat hien plan thieu research backing, CHECK-07 phat hien ngon ngu mo ho (>= 2 hedging patterns). Ca 2 severity WARN default, configurable WARN/BLOCK/OFF.

## Tong quan

Plan-checker truoc do co 8 checks. Plan nay them 2 checks moi de bao ve workflow:
- **CHECK-06 (Research Backing)**: Khi project co research files nhung plan khong reference chung -> WARN
- **CHECK-07 (Hedging Language)**: Khi plan co >= 2 hedging patterns (chua ro, can tim hieu, khong chac...) -> WARN goi y `pd research`

## Ket qua theo Task

### Task 1: checkResearchBacking + checkHedgingLanguage + tests (TDD)

**Commit:** f96c867

- Them `checkResearchBacking(planContent, options)` — pure function, PASS khi khong co research files (tranh false positive)
- Them `checkHedgingLanguage(planContent, options)` — 6 hedging patterns tieng Viet, threshold 2
- Cap nhat `runAllChecks` tu 8 len 10 checks, them `check06Options` va `check07Severity` params
- Cap nhat module.exports voi 2 functions moi
- Them 11 tests moi (5 CHECK-06 + 6 CHECK-07), cap nhat 4 assertions tu `checks.length === 8` thanh `10`
- 165 tests pass bao gom historical validation D-17 (22 plans v1.0 van PASS)

### Task 2: Cap nhat bin/plan-check.js CLI

**Commit:** dc2b58a

- Kiem tra research files trong `internal/` va `external/` directories
- Doc `config.json` cho severity overrides (`checks.research_backing.severity`, `checks.hedging_language.severity`)
- Truyen `check06Options` va `check07Severity` vao `runAllChecks`

## Deviations from Plan

None — plan executed exactly as written.

## Decisions Made

1. **CHECK-06 PASS khi khong co research files** — Tranh false positive cho projects chua co research directory. Chi check khi `hasResearchFiles=true`.
2. **Hedging patterns case-insensitive** — 6 patterns: `chua ro`, `can tim hieu`, `co the...hoac`, `khong chac`, `chua xac dinh`, `can nghien cuu`.
3. **CHECK-06/07 chen truoc ADV checks** — Giu checkId ordering nhat quan: CHECK-01..07, ADV-01..03.

## Known Stubs

None — tat ca functions da duoc wire day du.

## Verification

```
node --test test/smoke-plan-checker.test.js
  165 tests pass, 0 fail
  Bao gom: 11 tests moi (CHECK-06 + CHECK-07) + 4 updated assertions (checks.length === 10)
  Historical validation D-17: 22 plans v1.0 van zero blocks
```

## Self-Check: PASSED
