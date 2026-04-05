---
phase: 3
slug: prompt-prose-compression
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-22
---

# Phase 3 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | node:test (built-in, Node >=16.7.0) |
| **Config file** | package.json scripts.test |
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
| 03-01-01 | 01 | 1 | TOKN-02-a | script | `node scripts/count-tokens.js` | ❌ W0 | ⬜ pending |
| 03-01-02 | 01 | 1 | TOKN-02-a | script | `node scripts/count-tokens.js --baseline` | ❌ W0 | ⬜ pending |
| 03-02-01 | 02 | 1 | TOKN-02-b | manual+script | Extract behaviors before/after, diff | ❌ W0 | ⬜ pending |
| 03-02-02 | 02 | 1 | TOKN-02-c | integration | `node --test test/smoke-integrity.test.js` | ✅ | ⬜ pending |
| 03-02-03 | 02 | 1 | TOKN-02-d | integration | `node --test test/smoke-converters.test.js` | ✅ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `scripts/count-tokens.js` — baseline token counting script (run before compression, save baseline, run after to compare)
- [ ] `test/baseline-tokens.json` — saved baseline token counts per file
- [ ] Install `js-tiktoken` as devDependency

*Existing test infrastructure covers converter compatibility and skill structure integrity.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Skills produce identical outputs on representative invocations | TOKN-02-e | Requires running actual skills and comparing full interaction outputs | Compare skill invocation outputs before/after compression |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 5s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
