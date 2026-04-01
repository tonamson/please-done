---
phase: 74
slug: smoke-test-coverage-completion
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-01
---

# Phase 74 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | node:test (built-in) |
| **Config file** | none — node:test has no config file |
| **Quick run command** | `node --test test/smoke-standalone.test.js` |
| **Full suite command** | `npm test` |
| **Estimated runtime** | ~5 seconds (smoke-standalone only) |

---

## Sampling Rate

- **After every task commit:** Run `node --test test/smoke-standalone.test.js`
- **After every plan wave:** Run `npm test` (check no regressions)
- **Before `/gsd-verify-work`:** smoke-standalone must be green (31+N/31+N)
- **Max feedback latency:** ~5 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 74-01-01 | 01 | 1 | RECOV-01, SYNC-01 | smoke | `node --test test/smoke-standalone.test.js` | ✅ | ⬜ pending |
| 74-01-02 | 01 | 1 | all | smoke | `node --test test/smoke-standalone.test.js` | ✅ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

*Existing infrastructure covers all phase requirements.* `node:test` is built into Node.js, no installation needed. `test/smoke-standalone.test.js` already exists with 31 passing tests.

---

## Manual-Only Verifications

*All phase behaviors have automated verification.* Adding tests to smoke-standalone.test.js is fully verifiable by running `node --test test/smoke-standalone.test.js` and checking pass count increases from 31 to 33.

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 5s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
