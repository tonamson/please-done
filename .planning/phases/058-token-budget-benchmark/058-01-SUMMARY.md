---
phase: "058"
plan: "01"
subsystem: "resource-config, benchmark"
tags: [token-budget, benchmark, tier-map, baseline]
dependency_graph:
  requires: []
  provides: [TOKEN_BUDGET, tokenBudget-in-TIER_MAP, baseline-v5.0, BENCHMARK_RESULTS.md]
  affects: [resource-config.js, smoke-resource-config.test.js, baseline-tokens.json]
tech_stack:
  added: []
  patterns: [TDD-red-green, derived-constant-pattern]
key_files:
  created: []
  modified: [bin/lib/resource-config.js, test/smoke-resource-config.test.js, test/baseline-tokens.json, BENCHMARK_RESULTS.md]
decisions:
  - id: D-01
    summary: "tokenBudget field truc tiep trong TIER_MAP — single source of truth"
  - id: D-02
    summary: "TOKEN_BUDGET derived tu TIER_MAP — dam bao nhat quan tu dong"
metrics:
  duration: "214s"
  completed: "2026-03-27"
  tasks_completed: 2
  tasks_total: 2
  files_modified: 4
  tests_added: 4
  tests_total: 45
---

# Phase 058 Plan 01: Token Budget Benchmark Summary

TOKEN_BUDGET constant (scout=4000, builder=8000, architect=12000) voi baseline v5.0 (86,305 tokens / 48 files) va BENCHMARK_RESULTS.md chua bang before/after, per-tier compliance.

## Tasks Completed

| Task | Name | Commit | Key Files |
|------|------|--------|-----------|
| 1 | tokenBudget vao TIER_MAP + TOKEN_BUDGET export (TDD) | 341874e (RED), 5fbf6e1 (GREEN) | bin/lib/resource-config.js, test/smoke-resource-config.test.js |
| 2 | Capture baseline + BENCHMARK_RESULTS.md | ad229bb | test/baseline-tokens.json, BENCHMARK_RESULTS.md |

## Decisions Made

- **D-01:** tokenBudget la field truc tiep trong TIER_MAP, khong tach constant rieng — single source of truth cho tier config.
- **D-02:** TOKEN_BUDGET derived tu TIER_MAP (TOKEN_BUDGET.scout = TIER_MAP.scout.tokenBudget) — dam bao nhat quan tu dong, khong can sync thu cong.

## Key Results

### Token Budget Values
- Scout: 4,000 tokens (workflow max: 2,241 — scan.md/init.md)
- Builder: 8,000 tokens (workflow max: 6,970 — write-code.md)
- Architect: 12,000 tokens (workflow max: 7,305 — plan.md)

### Baseline Comparison (v1.0 vs v5.0)
- Total: 84,899 -> 86,305 (+1.7%, +1,406 tokens)
- Files: 39 -> 48 (+9 files moi)
- workflows giam 1,767 tokens (-3.5%)
- commands/pd giam 645 tokens (-5.8%)
- references tang 4,437 tokens (+31.6%) do gop va them files moi
- templates giam 619 tokens (-7.3%)

### Per-Tier Compliance
Tat ca 3 tiers deu trong budget. Scout du room 1,759 tokens. Builder du room 1,030 tokens. Architect du room 4,695 tokens.

## Deviations from Plan

None — plan thuc thi dung nhu thiet ke.

## Verification

- 45/45 smoke tests pass (bao gom 4 TOKEN_BUDGET tests moi)
- `node scripts/count-tokens.js --compare` chay thanh cong
- BENCHMARK_RESULTS.md ton tai voi du sections

## Known Stubs

None — khong co stub nao.
