---
phase: 20
slug: logic-audit
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-24
---

# Phase 20 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Node.js built-in test runner (`node --test`) |
| **Config file** | none — existing infrastructure |
| **Quick run command** | `node --test test/smoke-plan-checker.test.js` |
| **Full suite command** | `node --test 'test/*.test.js'` |
| **Estimated runtime** | ~2 seconds |

---

## Sampling Rate

- **After every task commit:** Run `node --test test/smoke-plan-checker.test.js`
- **After every plan wave:** Run `node --test 'test/*.test.js'`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 3 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 20-01-01 | 01 | 1 | AUDIT-01 | unit | `node --test test/smoke-plan-checker.test.js` | ✅ | ⬜ pending |
| 20-01-02 | 01 | 1 | AUDIT-01 | unit | `node --test test/smoke-plan-checker.test.js` | ✅ | ⬜ pending |
| 20-01-03 | 01 | 1 | AUDIT-01 | snapshot | `node --test test/smoke-snapshot.test.js` | ✅ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

Existing infrastructure covers all phase requirements.

---

## Manual-Only Verifications

All phase behaviors have automated verification.

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 3s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
