---
phase: 87-test-coverage
plan: 02
status: complete
commit: 122d168
---

# Plan 87-02 Summary: smoke-error-handling.test.js + regression (TEST-02/TEST-03)

## What was done
Expanded `test/smoke-error-handling.test.js`:

1. **Split arrays**: `TARGET_FILES` (5 files, bare-catch loop) and `LOG_TARGET_FILES` (3 files, log.warn loop)
2. **Added** `bin/plan-check.js` and `bin/lib/utils.js` to `TARGET_FILES` bare-catch checks (TEST-02)
3. **Excluded** the two new files from `LOG_TARGET_FILES` log.warn loop — they use `PD_DEBUG/console.error` by design (Phase 86 decisions D-01/D-03); comment explains rationale
4. Tests grew from 6 → 8 with 8/8 passing

## Regression
- Full `npm test`: **1232 tests, 0 failures** (TEST-03)
- Baseline was 1224; net new = 8 (6 from smoke-onboard + 2 from smoke-error-handling expansion)

## Committed: `122d168`
