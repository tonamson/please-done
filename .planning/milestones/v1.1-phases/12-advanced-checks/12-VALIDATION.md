---
phase: 12
slug: advanced-checks
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-23
---

# Phase 12 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | node:test (built-in) |
| **Config file** | None — direct `node --test` invocation |
| **Quick run command** | `node --test test/smoke-plan-checker.test.js` |
| **Full suite command** | `node --test 'test/*.test.js'` |
| **Estimated runtime** | ~3 seconds |

---

## Sampling Rate

- **After every task commit:** Run `node --test test/smoke-plan-checker.test.js`
- **After every plan wave:** Run `node --test 'test/*.test.js'`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 5 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 12-01-01 | 01 | 1 | ADV-01 | unit | `node --test test/smoke-plan-checker.test.js` | ✅ Extend existing | ⬜ pending |
| 12-01-02 | 01 | 1 | ADV-01 | unit | `node --test test/smoke-plan-checker.test.js` | ✅ Extend existing | ⬜ pending |
| 12-01-03 | 01 | 1 | ADV-01 | unit | `node --test test/smoke-plan-checker.test.js` | ✅ Extend existing | ⬜ pending |
| 12-01-04 | 01 | 1 | ADV-01 | unit | `node --test test/smoke-plan-checker.test.js` | ✅ Extend existing | ⬜ pending |
| 12-02-01 | 02 | 1 | ADV-02 | unit | `node --test test/smoke-plan-checker.test.js` | ✅ Extend existing | ⬜ pending |
| 12-02-02 | 02 | 1 | ADV-02 | unit | `node --test test/smoke-plan-checker.test.js` | ✅ Extend existing | ⬜ pending |
| 12-02-03 | 02 | 1 | ADV-02 | unit | `node --test test/smoke-plan-checker.test.js` | ✅ Extend existing | ⬜ pending |
| 12-02-04 | 02 | 1 | ADV-02 | unit | `node --test test/smoke-plan-checker.test.js` | ✅ Extend existing | ⬜ pending |
| 12-02-05 | 02 | 1 | ADV-02 | unit | `node --test test/smoke-plan-checker.test.js` | ✅ Extend existing | ⬜ pending |
| 12-03-01 | 03 | 1 | ADV-03 | unit | `node --test test/smoke-plan-checker.test.js` | ✅ Extend existing | ⬜ pending |
| 12-03-02 | 03 | 1 | ADV-03 | unit | `node --test test/smoke-plan-checker.test.js` | ✅ Extend existing | ⬜ pending |
| 12-03-03 | 03 | 1 | ADV-03 | unit | `node --test test/smoke-plan-checker.test.js` | ✅ Extend existing | ⬜ pending |
| 12-03-04 | 03 | 1 | ADV-03 | unit | `node --test test/smoke-plan-checker.test.js` | ✅ Extend existing | ⬜ pending |
| 12-ALL-01 | ALL | 1 | ALL | unit | `node --test test/smoke-plan-checker.test.js` | ✅ Extend existing | ⬜ pending |
| 12-ALL-02 | ALL | 1 | ALL | integration | `node --test test/smoke-plan-checker.test.js` | ✅ Extend existing | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

None — existing test infrastructure covers all phase requirements. Tests extend `test/smoke-plan-checker.test.js` using established `makePlanV10()`, `makePlanV11()`, `makeTasksV11()` helpers.

New test helper needed: `makePlanV11WithKeyLinks()` — extend `makePlanV11()` to optionally include a Key Links section.

*Existing infrastructure covers all phase requirements.*

---

## Manual-Only Verifications

*All phase behaviors have automated verification.*

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 5s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
