---
plan: 86-02
phase: 86-error-handling-hardening
status: complete
commit: 6a4ef99
self_check: PASSED
---

## Summary

Replaced all 6 `process.exit(1)` calls in `bin/lib/installers/claude.js` with `throw new Error(message)`, removing the accompanying `log.error()` calls. Errors now propagate naturally to `main().catch()` in `install.js` which handles display and exit.

## What Was Built

- **bin/lib/installers/claude.js**: 6 sites converted from `log.error() + process.exit(1)` to `throw new Error()`:
  1. Claude CLI not installed check (line ~33)
  2. Python not found check (line ~46)
  3. Python version too old check (line ~55)
  4. Git not installed check (line ~84)
  5. FastCode submodule missing check (line ~99)
  6. Gemini API key not entered check (line ~332) — two log.error messages combined into one throw message
- All intentionally-silent cleanup catch blocks preserved unchanged

## Key Files

key-files:
  modified:
    - bin/lib/installers/claude.js

## Verification

- `grep -c "process.exit" bin/lib/installers/claude.js` → 0 ✓
- `grep -c "throw new Error" bin/lib/installers/claude.js` → 6 ✓
- `grep -c "log.error" bin/lib/installers/claude.js` → 0 ✓
- Cleanup catch blocks with `/* already gone */` and `/* not exists */` preserved ✓
- `node --test test/smoke-error-handling.test.js` → 6/6 pass ✓
- `node --test test/smoke-installers.test.js` → 30/30 pass ✓
- `npm test` → 1224/1224 pass ✓

## Self-Check: PASSED
