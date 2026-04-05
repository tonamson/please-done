---
phase: 2
slug: cross-skill-deduplication
status: draft
nyquist_compliant: true
wave_0_complete: true
created: 2026-03-22
---

# Phase 2 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Node.js built-in test runner (node:test) |
| **Config file** | `test/` directory — smoke tests |
| **Quick run command** | `node --test test/smoke-integrity.test.js` |
| **Full suite command** | `node --test test/` |
| **Estimated runtime** | ~5 seconds |

---

## Sampling Rate

- **After every task commit:** Run `node --test test/smoke-integrity.test.js`
- **After every plan wave:** Run `node --test test/`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 5 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 02-01-01 | 01 | 1 | TOKN-01 | smoke | `node --test test/smoke-integrity.test.js` | yes | pending |
| 02-01-02 | 01 | 1 | TOKN-01 | unit+converter | `node --test test/smoke-utils.test.js test/smoke-converters.test.js` | yes | pending |
| 02-02-01 | 02 | 2 | TOKN-01 | smoke | `node --test test/smoke-integrity.test.js` | yes | pending |
| 02-02-02 | 02 | 2 | TOKN-01 | smoke+converter | `node --test test/` | yes | pending |

*Status: pending / green / red / flaky*

---

## Wave 0 Requirements

Existing infrastructure covers all phase requirements. `smoke-integrity.test.js` has canonical structure tests. `smoke-utils.test.js` has utility function tests. `smoke-converters.test.js` has converter pipeline tests. All test files exist; new describe blocks are added by plan tasks.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Guard file content matches original inline guard text | TOKN-01 | Semantic equivalence | Compare extracted guard text with original skill guards |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references
- [x] No watch-mode flags
- [x] Feedback latency < 5s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
