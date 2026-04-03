---
plan: 86-01
phase: 86-error-handling-hardening
status: complete
commit: e274400
self_check: PASSED
---

## Summary

Fixed bare `catch {}` blocks in `bin/plan-check.js` and `bin/lib/utils.js` to produce observable debug output under `PD_DEBUG=1`. Aligned `bin/install.js` to use `PD_DEBUG` (was `DEBUG`) for consistency.

## What Was Built

- **bin/install.js** (line 396): Changed `process.env.DEBUG` → `process.env.PD_DEBUG` for stack trace logging in main().catch handler
- **bin/plan-check.js**: Fixed 2 bare `catch {}` blocks — research dir read (line 66) and config.json parse (line 76) — both now log `[plan-check]` context + error under PD_DEBUG=1
- **bin/lib/utils.js**: Fixed bare `catch {}` in `fileHash` function — now names error variable and logs `[fileHash]` under PD_DEBUG=1; `commandExists` and `isWSL` catch blocks intentionally unchanged (D-03b)

## Key Files

key-files:
  modified:
    - bin/install.js
    - bin/plan-check.js
    - bin/lib/utils.js

## Verification

- `grep "process.env.PD_DEBUG" bin/install.js` → 1 match ✓
- `grep -c "catch {}" bin/plan-check.js` → 0 ✓
- `grep -c "PD_DEBUG" bin/plan-check.js` → 2 ✓
- `grep -n "} catch {" bin/lib/utils.js` → exactly 2 (commandExists + isWSL) ✓
- `node --test test/smoke-plan-checker.test.js` → 165/165 pass ✓
- `node --test test/smoke-utils.test.js` → 36/36 pass ✓

## Self-Check: PASSED
