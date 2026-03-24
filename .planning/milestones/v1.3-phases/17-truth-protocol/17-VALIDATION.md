---
phase: 17
slug: truth-protocol
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-23
---

# Phase 17 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | node:test (built-in, Node 18+) |
| **Config file** | None (uses built-in runner) |
| **Quick run command** | `node --test test/smoke-plan-checker.test.js` |
| **Full suite command** | `node --test 'test/*.test.js'` |
| **Estimated runtime** | ~665ms (full suite) |

---

## Sampling Rate

- **After every task commit:** Run `node --test test/smoke-plan-checker.test.js`
- **After every plan wave:** Run `node --test 'test/*.test.js'`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** ~665ms

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 17-01-01 | 01 | 1 | TRUTH-01 | unit | `node --test test/smoke-plan-checker.test.js` | Needs new tests | ⬜ pending |
| 17-01-02 | 01 | 1 | TRUTH-01 | unit | `node --test test/smoke-plan-checker.test.js` | ✅ existing 3-col tests | ⬜ pending |
| 17-01-03 | 01 | 1 | TRUTH-02 | integration | `node --test test/smoke-plan-checker.test.js` | ✅ existing CHECK-02 tests | ⬜ pending |
| 17-01-04 | 01 | 1 | TRUTH-03 | unit | `node --test test/smoke-plan-checker.test.js` | Needs update (expects "warn") | ⬜ pending |
| 17-01-05 | 01 | 1 | TRUTH-03 | unit | `node --test test/smoke-plan-checker.test.js` | Needs update | ⬜ pending |
| 17-02-01 | 02 | 2 | ALL | snapshot | `node --test test/smoke-snapshot.test.js` | ✅ existing (48 tests) | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] New test: `parseTruthsV11` with 5-column (v1.3) input returns correct `{ id, description }`
- [ ] New test: `parseTruthsV11` with mixed 3-col and 5-col tables (defensive)
- [ ] Updated test: CHECK-04 Direction 2 (task without truth) expects `status: 'block'` instead of `'warn'`
- [ ] Updated test: CHECK-04 Direction 2 message no longer includes "(co the la infrastructure task)"
- [ ] New test: `checkTruthTaskCoverage` with 5-column plan + tasks -> correct coverage check
- [ ] `makePlanV11` helper extended with `v13` option for 5-column format

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| AI generates correct 5-col Truths from template | TRUTH-01 | Requires AI plan generation | Run `/gsd:plan-phase` on test phase, inspect Truths table format |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 1s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
