---
phase: 15
slug: workflow-verification
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-23
---

# Phase 15 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | node --test (built-in Node.js test runner) |
| **Config file** | none — Phase 15 la analysis phase, khong tao test files moi |
| **Quick run command** | `node --test test/smoke-*.test.js` |
| **Full suite command** | `node --test test/` |
| **Estimated runtime** | ~5 seconds |

---

## Sampling Rate

- **After every task commit:** Run `node --test test/smoke-*.test.js`
- **After every plan wave:** Run `node --test test/`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 5 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 15-01-01 | 01 | 1 | WFLOW-01 | analysis | grep-verify report sections | N/A (analysis) | ⬜ pending |
| 15-02-01 | 02 | 1 | WFLOW-02 | analysis | grep-verify report sections | N/A (analysis) | ⬜ pending |
| 15-03-01 | 03 | 1 | WFLOW-03 | analysis | grep-verify report sections | N/A (analysis) | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

Existing infrastructure covers all phase requirements. Phase 15 la analysis phase — output la verification report, khong tao code hoac test files moi. Existing test suite (443+ tests) duoc chay de confirm khong co regression.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Verification report quality | WFLOW-01/02/03 | Report content requires human review for completeness | Review 15-VERIFICATION-REPORT.md — check all steps traced, all gaps documented |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 5s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
