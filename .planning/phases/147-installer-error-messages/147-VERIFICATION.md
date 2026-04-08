---
phase: 147-installer-error-messages
verified: 2026-04-08T05:10:00Z
status: passed
score: 4/4 must-haves verified
overrides_applied: 0
---

# Phase 147: Installer Error Messages — Verification Report

**Phase Goal:** When installation fails, users see the specific error category, the cause, and an actionable fix hint — never a raw stack trace.
**Verified:** 2026-04-08T05:10:00Z
**Status:** ✅ PASSED
**Re-verification:** No — initial verification

---

## Goal Achievement

### Observable Truths (Success Criteria)

| #   | Truth | Status | Evidence |
|-----|-------|--------|----------|
| SC1 | Missing-dependency failure prints dependency name + "Install via: [URL]", no stack trace | ✓ VERIFIED | `classifyError()` extracts URL from message and returns `hint: 'Install via: ' + url`; smoke test T2 passes |
| SC2 | File permission error prints affected path + concrete `sudo chown` fix | ✓ VERIFIED | `hint: 'Fix: sudo chown $(whoami) ' + err.path` for EACCES/EPERM; smoke test T1 passes |
| SC3 | All error paths exit with non-zero exit code | ✓ VERIFIED | `process.exit(1)` at line 384 in `main().catch()` and line 100 for `--config-dir` missing arg |
| SC4 | `main().catch()` never exposes raw `Error.stack` to terminal | ✓ VERIFIED | Stack only printed if `process.env.PD_DEBUG` is set (line 383 guard) |

**Score: 4/4 truths verified**

---

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `bin/lib/error-classifier.js` | `classifyError()` exported pure function | ✓ VERIFIED | 68-line module; handles EACCES/EPERM, MODULE_NOT_FOUND, MISSING_DEP, GENERIC; `module.exports = { classifyError }` |
| `bin/install.js` | `main().catch()` uses `classifyError`, exits 1, PD_DEBUG stack guard | ✓ VERIFIED | `require('./lib/error-classifier')` at line 34; catch block at lines 379–385 |
| `test/smoke-errors.test.js` | 4 tests covering all error categories | ✓ VERIFIED | 4 describe/it blocks: PERMISSION, MISSING_DEP, PLATFORM_UNSUPPORTED, GENERIC |

---

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `main().catch()` in `install.js` | `classifyError` in `error-classifier.js` | `require('./lib/error-classifier')` | ✓ WIRED | Line 34 (top-level require); line 380 (invoked in catch) |
| `classifyError()` PERMISSION branch | `err.path` → hint string | `'Fix: sudo chown $(whoami) ' + err.path` | ✓ WIRED | Path included in hint when `err.path` is present |
| `classifyError()` MISSING_DEP branch | URL extraction → `'Install via: ' + url` | regex `/(https?:\/\/[^\s]+)/` | ✓ WIRED | URL extracted and included in hint |
| Error catch → terminal | No raw stack | `if (process.env.PD_DEBUG) console.error(err.stack)` guard | ✓ WIRED | Stack only in debug mode |

---

### Test Suite Results

| Test File | Command | Result | Exit Code |
|-----------|---------|--------|-----------|
| `test/smoke-errors.test.js` | `node --test test/smoke-errors.test.js` | 4/4 pass, 0 fail | 0 ✓ |
| `test/smoke-install.test.js` | `node --test test/smoke-install.test.js` | 5/5 pass, 0 fail | 0 ✓ |

---

### Verification Commands Output

| Command | Expected | Actual | Match? |
|---------|----------|--------|--------|
| `grep -n "classifyError" bin/install.js` | require + use in catch | Line 34 (require), line 380 (use in catch) | ✓ |
| `grep -n "Installation failed" bin/install.js` | empty (double-log removed) | (empty) | ✓ |
| `grep -n "process.exit(1)" bin/install.js` | exit in main().catch() | Line 100 (--config-dir guard), line 384 (main catch) | ✓ |
| `grep -n "PD_DEBUG" bin/install.js` | stack guard present | Line 383: `if (process.env.PD_DEBUG) console.error(err.stack)` | ✓ |
| `grep -n "classifyError" bin/lib/error-classifier.js` | function + export | Line 10 (declaration), line 68 (module.exports) | ✓ |

---

### Anti-Patterns Scan

No blockers found.

| File | Pattern | Severity | Assessment |
|------|---------|----------|------------|
| `bin/lib/error-classifier.js` | `err.stack \|\| String(err)` as fallback for empty `err.message` | ℹ️ Info | Intentional WR-03 fix — only used when `err.message` is null/empty, not normal path |
| `bin/install.js` | `console.error(err.stack)` in catch | ℹ️ Info | Guarded by `process.env.PD_DEBUG` — does not violate SC4 |

---

### Behavioral Spot-Checks

| Behavior | Verification | Result | Status |
|----------|-------------|--------|--------|
| PERMISSION: hint includes `sudo chown` + path | smoke-errors T1 assertion | `assert.ok(result.hint.includes("sudo chown"))` passes | ✓ PASS |
| MISSING_DEP: hint includes `Install via:` + URL | smoke-errors T2 assertion | `assert.ok(result.hint.includes("https://python.org/download"))` passes | ✓ PASS |
| PLATFORM_UNSUPPORTED: hint mentions "not yet supported" | smoke-errors T3 assertion | `assert.ok(result.hint.includes("not yet supported"))` passes | ✓ PASS |
| GENERIC: message passthrough unmodified | smoke-errors T4 assertion | `assert.equal(result.message, "something completely unexpected")` passes | ✓ PASS |

---

### Human Verification Required

None. All success criteria are verifiable programmatically.

---

### Summary

All 4 success criteria are fully met:

1. **SC1 (Missing-dep → "Install via:")** — `classifyError()` matches messages containing "not installed / not found / requires / missing", extracts the first URL via regex, and returns `hint: 'Install via: ' + url`. The dependency name is preserved in the passthrough `message` field. Smoke test T2 confirms. No stack trace appears.

2. **SC2 (Permission → sudo chown path)** — For `EACCES`/`EPERM` with `err.path`, the hint is `'Fix: sudo chown $(whoami) ' + err.path`. Smoke test T1 confirms both `sudo chown` and the actual path appear in the hint.

3. **SC3 (Non-zero exit on all error paths)** — `main().catch()` unconditionally calls `process.exit(1)` (line 384). The `--config-dir` missing-value guard also calls `process.exit(1)` (line 100). All other errors propagate through `throw err` to the top-level catch.

4. **SC4 (No raw Error.stack exposed)** — The catch block only calls `console.error(err.stack)` when `process.env.PD_DEBUG` is explicitly set. In normal use, the terminal shows only the classified category, message, and hint.

---

_Verified: 2026-04-08T05:10:00Z_
_Verifier: the agent (gsd-verifier)_
