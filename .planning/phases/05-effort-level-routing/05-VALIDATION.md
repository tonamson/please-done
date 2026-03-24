---
phase: 5
slug: effort-level-routing
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-22
---

# Phase 5 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Node.js built-in test runner (node:test) |
| **Config file** | none — uses package.json `test` script |
| **Quick run command** | `node --test test/smoke-integrity.test.js` |
| **Full suite command** | `node --test 'test/*.test.js'` |
| **Estimated runtime** | ~5 seconds |

---

## Sampling Rate

- **After every task commit:** Run `node --test test/smoke-integrity.test.js`
- **After every plan wave:** Run `node --test 'test/*.test.js'`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 5 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 05-01-01 | 01 | 1 | TOKN-04a | unit | `node --test test/smoke-integrity.test.js` | Needs update | ⬜ pending |
| 05-01-02 | 01 | 1 | TOKN-04b | unit | `node --test test/smoke-integrity.test.js` | Needs update | ⬜ pending |
| 05-01-03 | 01 | 1 | TOKN-04c | unit | `node --test test/smoke-integrity.test.js` | Needs update | ⬜ pending |
| 05-01-04 | 01 | 1 | TOKN-04d | unit | `node --test test/smoke-integrity.test.js` | Needs update | ⬜ pending |
| 05-01-05 | 01 | 1 | TOKN-04e | unit | `node --test test/smoke-integrity.test.js` | Needs update | ⬜ pending |
| 05-01-06 | 01 | 1 | TOKN-04f | unit | `node --test test/smoke-utils.test.js` | Needs new test | ⬜ pending |
| 05-01-07 | 01 | 1 | TOKN-04g | integration | `node --test test/smoke-converters.test.js` | ✅ Exists | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `test/smoke-integrity.test.js` — add tests for Effort field presence in templates and effort→model mapping presence in workflows
- [ ] `test/smoke-utils.test.js` — add test for effort field parsing/default behavior from task metadata line

*Existing infrastructure covers converter tests (smoke-converters.test.js).*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Routing decisions visible in plan output | TOKN-04 SC4 | Requires reviewing generated PLAN.md from planner agent | Generate a test plan and verify effort field appears in task frontmatter |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 5s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
