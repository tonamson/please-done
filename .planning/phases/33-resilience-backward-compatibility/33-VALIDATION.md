---
phase: 33
slug: resilience-backward-compatibility
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-25
---

# Phase 33 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | jest 29.x |
| **Config file** | jest.config.js |
| **Quick run command** | `npx jest --testPathPattern="smoke-outcome-router"` |
| **Full suite command** | `npx jest` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx jest --testPathPattern="smoke-outcome-router"`
- **After every plan wave:** Run `npx jest`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 33-01-01 | 01 | 1 | FLOW-06 | unit | `npx jest --testPathPattern="smoke-outcome-router"` | ✅ | ⬜ pending |
| 33-01-02 | 01 | 1 | FLOW-06 | integration | `npx jest --testPathPattern="smoke-outcome-router"` | ✅ | ⬜ pending |
| 33-02-01 | 02 | 1 | FLOW-07 | unit | `npx jest --testPathPattern="smoke-integrity"` | ✅ | ⬜ pending |
| 33-02-02 | 02 | 1 | FLOW-07 | integration | `npx jest` | ✅ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

*Existing infrastructure covers all phase requirements.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| INCONCLUSIVE loop-back UX flow | FLOW-06 | Requires AskUserQuestion interaction | Chay pd:fix-bug, trigger INCONCLUSIVE, verify banner + Elimination Log display |
| --single flag fallback | FLOW-07 | Requires CLI argument parsing | Chay pd:fix-bug --single, verify v1.5 workflow activates |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
