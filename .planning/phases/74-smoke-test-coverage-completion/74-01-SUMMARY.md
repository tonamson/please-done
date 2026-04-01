---
plan: 74-01
phase: 74-smoke-test-coverage-completion
status: complete
completed: 2026-04-01
requirements-completed: [RECOV-01, SYNC-01]
---

# Plan 74-01 Summary: Smoke Test Coverage Completion

## What was built

Closed 3 tech-debt items from the v7.0 milestone audit in `test/smoke-standalone.test.js`:

1. **RECOV-01 test** (SC-1 block) — asserts Step S0.5 recovery logic exists in test.md with KEEP/NEW/REWRITE options
2. **SYNC-01 tests** (new SC-8 block) — asserts state-machine.md has `/pd:test --standalone` prerequisites table row with `—` em-dashes
3. **SC-4 typo fix** — test #2 description: "absent" → "present" (cosmetic)

## Key files

### Modified
- `test/smoke-standalone.test.js` — +43 lines, 31 → 34 tests, SC-8 block added

## Test results

| Suite | Tests | Pass | Fail |
|-------|-------|------|------|
| smoke-standalone.test.js | 34 | 34 | 0 |

## Deviations

- **SC-8 test fix during implementation:** Initial regex `lines.find(l => l.includes('/pd:test --standalone'))` matched the side-branch bullet (line 27) instead of the table row (line 53). Fixed to `l.includes('/pd:test --standalone') && l.includes('|')` to target the table row specifically.

## Self-Check: PASSED

- ✅ `grep "Step S0.5" test/smoke-standalone.test.js` → 4 lines (RECOV-01 test)
- ✅ `grep "SYNC-01" test/smoke-standalone.test.js` → 1 line
- ✅ `grep "STATE_MACHINE_REF" test/smoke-standalone.test.js` → constant defined
- ✅ `grep "present for FastCode" test/smoke-standalone.test.js` → 1 line (typo fixed)
- ✅ `grep "absent for FastCode" test/smoke-standalone.test.js` → 0 lines
- ✅ `node --test test/smoke-standalone.test.js` → 34/34 pass, exit 0
