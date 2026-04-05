---
phase: 04
slug: conditional-context-loading
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-22
---

# Phase 04 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | node:test (built-in) |
| **Config file** | package.json scripts.test |
| **Quick run command** | `node --test test/smoke-utils.test.js` |
| **Full suite command** | `node --test 'test/*.test.js'` |
| **Estimated runtime** | ~5 seconds |

---

## Sampling Rate

- **After every task commit:** Run `node --test test/smoke-utils.test.js`
- **After every plan wave:** Run `node --test 'test/*.test.js'`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 5 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 04-01-01 | 01 | 1 | TOKN-03a | unit | `node --test test/smoke-utils.test.js` | ❌ W0 | ⬜ pending |
| 04-01-02 | 01 | 1 | TOKN-03b | unit | `node --test test/smoke-utils.test.js` | ❌ W0 | ⬜ pending |
| 04-01-03 | 01 | 1 | TOKN-03c | unit | `node --test test/smoke-utils.test.js` | ❌ W0 | ⬜ pending |
| 04-02-01 | 02 | 2 | TOKN-03d | integration | `node --test test/smoke-integrity.test.js` | ❌ W0 | ⬜ pending |
| 04-02-02 | 02 | 2 | TOKN-03e | integration | `node --test test/smoke-integrity.test.js` | ❌ W0 | ⬜ pending |
| 04-03-01 | 03 | 3 | TOKN-03f | manual | `node scripts/count-tokens.js --compare` | ✅ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `test/smoke-utils.test.js` — add tests for `classifyRefs()` function
- [ ] `test/smoke-utils.test.js` — update `inlineWorkflow()` tests for `<conditional_reading>` output
- [ ] `test/smoke-integrity.test.js` — add test verifying optional refs not in `<required_reading>` after inline
- [ ] `test/smoke-integrity.test.js` — add test verifying `<conditional_reading>` present for skills with optional refs
- [ ] `test/smoke-integrity.test.js` — add test verifying conventions.md is `(required)` in all skills that reference it

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Token savings measured | TOKN-03f | Requires before/after comparison across all skills | Run `node scripts/count-tokens.js --compare` and verify 2000-3200 token reduction per invocation |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 5s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
