# Phase 58: Token Budget & Benchmark - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-03-27
**Phase:** 058-token-budget-benchmark
**Areas discussed:** Token budget thresholds, Benchmark scope, Conditional reading expansion, Eval quality metrics
**Mode:** --auto (all decisions auto-selected)

---

## Token Budget Thresholds

| Option | Description | Selected |
|--------|-------------|----------|
| REQUIREMENTS values as enforcement caps | Scout ≤ 4K, Builder ≤ 8K, Architect ≤ 12K — enforce in resource-config.js | ✓ |
| Adaptive based on benchmark | Measure first, set caps later based on actual usage | |
| Documentation only | Document targets without runtime enforcement | |

**User's choice:** [auto] REQUIREMENTS values as enforcement caps, benchmark to validate
**Notes:** Caps are warning-level (log khi vượt, không hard fail) — cho phép flexibility trong edge cases

---

## Benchmark Scope & Methodology

| Option | Description | Selected |
|--------|-------------|----------|
| New baseline from current state | Capture fresh baseline post-v5.0, compare per-tier | ✓ |
| Compare against v1.0 baseline | Use existing baseline-tokens.json from 2026-03-22 | |
| Dual comparison | Both v1.0 baseline and new baseline | |

**User's choice:** [auto] New baseline from current state, per-tier comparison
**Notes:** baseline-tokens.json cũ (v1.0) vẫn giữ lại để tham khảo, nhưng benchmark chính dùng baseline mới

---

## Conditional Reading Expansion

| Option | Description | Selected |
|--------|-------------|----------|
| Scan all, prioritize by token count | Find workflows without conditional_reading, sort by savings potential | ✓ |
| Target specific workflows | Hand-pick 2-3 workflows to expand | |
| Full coverage | Add conditional_reading to every workflow | |

**User's choice:** [auto] Scan all, prioritize by token count — minimum 2 new workflows
**Notes:** Giữ nguyên XML tag format hiện có

---

## Eval Quality Metrics

| Option | Description | Selected |
|--------|-------------|----------|
| Use existing promptfoo suite | Run eval:full before/after, track pass rate + tokens | ✓ |
| Add new test cases | Expand promptfooconfig.yaml with tier-specific tests | |
| Custom quality scoring | Build new quality metric beyond pass/fail | |

**User's choice:** [auto] Use existing promptfoo suite — verify it runs, don't expand
**Notes:** promptfooconfig.yaml đã có đủ coverage cho 11 skills

---

## Claude's Discretion

- BENCHMARK_RESULTS.md format and layout
- Workflow scan ordering for conditional_reading expansion
- TOKEN_BUDGET enforcement level (warning vs log vs metric)

## Deferred Ideas

None — discussion stayed within phase scope.
