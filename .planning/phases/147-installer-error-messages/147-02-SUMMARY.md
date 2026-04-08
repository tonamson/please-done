---
phase: 147
plan: "02"
subsystem: installer-error-messages
tags: [error-handling, classification, testing]
dependency_graph:
  requires: [147-01]
  provides: [D-07, D-08, D-09, D-10, D-11]
  affects: [bin/install.js, test/smoke-errors.test.js]
tech_stack:
  added: []
  patterns: [lazy-require, node:test, classifyError]
key_files:
  created:
    - test/smoke-errors.test.js
  modified:
    - bin/install.js
decisions:
  - "Lazy require of error-classifier inside catch callback — only loaded on failure path"
  - "Used assert.ok(hint.includes(...)) instead of assert.equal for hint assertions — matches actual 'Install via: URL' format from classifier"
metrics:
  duration: "~8 minutes"
  completed: "2025-01-30"
  tasks_completed: 3
  files_modified: 2
---

# Phase 147 Plan 02: Wire classifier into install.js + smoke tests Summary

## One-liner
Removed duplicate `log.error` from `install()` catch, wired `classifyError` into `main().catch()` for category+hint output, and added 4-test smoke suite covering all error categories.

## What Was Changed

### Task A — Remove double-log from install() Step 2 catch (`c9263fc`)
- **File:** `bin/install.js` (line ~186)
- Removed `log.error(\`Installation failed: ${err.message}\`)` before `throw err`
- The `MODULE_NOT_FOUND` guard and `throw err` remain unchanged (D-09)
- Before: error was logged twice — once here, once in `main().catch()`
- After: single clean output path via `main().catch()` only

### Task B — Wire classifyError into main().catch() (`cd84cb3`)
- **File:** `bin/install.js` (lines ~379-385)
- Replaced `log.error(err.message)` with full classifier-based output
- Format: `log.error(category + ': ' + message)` + `log.info('  Hint: ' + hint)` (D-07)
- Lazy `require('./lib/error-classifier')` inside catch — only loaded on failure path
- `PD_DEBUG=1` stack trace preserved (D-08)

### Task C — Create test/smoke-errors.test.js (`fcef956`)
- **File:** `test/smoke-errors.test.js` (new, 50 lines)
- 4 test cases covering all classifier categories:
  - `PERMISSION`: EACCES + path → sudo chown hint with path
  - `MISSING_DEP`: message with URL → hint includes URL
  - `PLATFORM_UNSUPPORTED`: MODULE_NOT_FOUND → "not yet supported" hint
  - `GENERIC`: unknown error → category GENERIC, message passthrough

## Test Results

```
node --test test/smoke-errors.test.js
✔ PERMISSION: classifies EACCES with path → PASS
✔ MISSING_DEP: classifies 'not installed' message with URL → PASS
✔ PLATFORM_UNSUPPORTED: classifies MODULE_NOT_FOUND → PASS
✔ GENERIC: classifies unknown errors → PASS
tests 4 | pass 4 | fail 0

node --test test/smoke-install.test.js
✔ returns upToDate false with no manifest → PASS
✔ returns upToDate true when version matches → PASS
✔ returns upToDate false when version differs → PASS
✔ outputs [N/M] format → PASS
✔ logs 'Already at v' when up-to-date → PASS
tests 5 | pass 5 | fail 0
```

## Commits

| Task | Commit | Message |
|------|--------|---------|
| A    | `c9263fc` | `fix(147): remove double-log from install() Step 2 catch` |
| B    | `cd84cb3` | `feat(147): wire classifyError into main().catch() — category + hint output` |
| C    | `fcef956` | `test(147): smoke-errors.test.js — 4 tests for all error categories` |

## Verification Checks

1. `grep -n "Installation failed" bin/install.js` → no output ✅
2. `grep -n "classifyError" bin/install.js` → line 379 ✅
3. `grep -n "throw err" bin/install.js` → present ✅
4. `node --test test/smoke-errors.test.js` → 4/4 pass ✅

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] MISSING_DEP hint assert adjusted for actual classifier output**
- **Found during:** Task C test writing
- **Issue:** Plan's full file used `assert.equal(result.hint, 'https://python.org/downloads')` but classifier returns `'Install via: https://python.org/downloads'`
- **Fix:** Used `assert.ok(result.hint.includes("https://python.org/download"))` per the prompt's test code (which was correct for the classifier behavior)
- **Files modified:** `test/smoke-errors.test.js`

## Self-Check: PASSED
