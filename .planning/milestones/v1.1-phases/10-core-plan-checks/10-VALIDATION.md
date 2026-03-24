---
phase: 10
slug: core-plan-checks
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-22
---

# Phase 10 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | node:test + node:assert/strict (built-in) |
| **Config file** | None — uses `npm test` which runs `node --test 'test/*.test.js'` |
| **Quick run command** | `node --test test/smoke-plan-checker.test.js` |
| **Full suite command** | `npm test` |
| **Estimated runtime** | ~5 seconds |

---

## Sampling Rate

- **After every task commit:** Run `node --test test/smoke-plan-checker.test.js`
- **After every plan wave:** Run `npm test`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 5 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 10-01-01 | 01 | 1 | CHECK-01 | unit | `node --test test/smoke-plan-checker.test.js` | ❌ W0 | ⬜ pending |
| 10-01-02 | 01 | 1 | CHECK-02 | unit | `node --test test/smoke-plan-checker.test.js` | ❌ W0 | ⬜ pending |
| 10-01-03 | 01 | 1 | CHECK-03 | unit | `node --test test/smoke-plan-checker.test.js` | ❌ W0 | ⬜ pending |
| 10-01-04 | 01 | 1 | CHECK-04 | unit | `node --test test/smoke-plan-checker.test.js` | ❌ W0 | ⬜ pending |
| 10-01-05 | 01 | 1 | D-17 | integration | `node --test test/smoke-plan-checker.test.js` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `test/smoke-plan-checker.test.js` — unit + integration tests for all 4 checks + historical validation
- [ ] `bin/lib/plan-checker.js` — the module itself (tested by above)
- [ ] `references/plan-checker.md` — check rules specification (single source of truth)

*Existing test infrastructure (node:test, npm test) covers framework needs.*

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
