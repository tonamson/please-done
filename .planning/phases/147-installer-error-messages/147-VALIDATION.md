---
phase: 147
slug: installer-error-messages
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-08
---

# Phase 147 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Node.js built-in test runner (`node:test`) |
| **Config file** | None — uses `package.json` scripts |
| **Quick run command** | `node --test test/smoke-errors.test.js` |
| **Full suite command** | `npm test` |
| **Estimated runtime** | ~3 seconds |

---

## Sampling Rate

- **After every task commit:** Run `node --test test/smoke-errors.test.js`
- **After Wave 1 (147-01):** `node -e "const {classifyError}=require('./bin/lib/error-classifier'); console.log(classifyError({code:'EACCES',message:'permission denied',path:'/home/x'}))"` — verify category, message, hint
- **After Wave 2 (147-02):** Full smoke test suite — 4/4 must pass

---

## Truth Table (Nyquist)

| # | Input | Expected output | Covered by |
|---|-------|-----------------|------------|
| T1 | `err.code='EACCES', err.path='/home/x'` | category=PERMISSION, hint includes "sudo chown" + path | smoke-errors T1 |
| T2 | `err.message='Python not installed. Install first: https://...'` | category=MISSING_DEP, hint includes URL | smoke-errors T2 |
| T3 | `err.code='MODULE_NOT_FOUND'` | category=PLATFORM_UNSUPPORTED, hint mentions "not yet supported" | smoke-errors T3 |
| T4 | Generic `new Error('unexpected')` | category=GENERIC, message passed through | smoke-errors T4 |
| T5 | `main().catch()` receives EACCES | Terminal shows `✗ PERMISSION: …` + Hint line, no stack trace | manual / integration |
| T6 | All error paths | `process.exit(1)` called | verified in install.js code inspection |

---

## Plans → Test Coverage

| Plan | Test file | Coverage |
|------|-----------|----------|
| 147-01 (error-classifier.js) | test/smoke-errors.test.js | T1–T4 |
| 147-02 (wire + tests) | test/smoke-errors.test.js | T1–T4 created here |
