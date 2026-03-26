---
phase: 49
slug: session-delta
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-26
---

# Phase 49 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | jest 29.x (via vitest pattern) or plain node:test |
| **Config file** | none — pure function tests run directly |
| **Quick run command** | `node --test bin/lib/__tests__/session-delta.test.js` |
| **Full suite command** | `node --test bin/lib/__tests__/session-delta.test.js` |
| **Estimated runtime** | ~2 seconds |

---

## Sampling Rate

- **After every task commit:** Run `node --test bin/lib/__tests__/session-delta.test.js`
- **After every plan wave:** Run full suite
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 3 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 49-01-01 | 01 | 1 | DELTA-01 | unit | `node --test bin/lib/__tests__/session-delta.test.js` | ❌ W0 | ⬜ pending |
| 49-01-02 | 01 | 1 | DELTA-02 | unit | `node --test bin/lib/__tests__/session-delta.test.js` | ❌ W0 | ⬜ pending |
| 49-02-01 | 02 | 1 | DELTA-03 | unit | `node --test bin/lib/__tests__/session-delta.test.js` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `bin/lib/__tests__/session-delta.test.js` — stubs for DELTA-01, DELTA-02, DELTA-03
- [ ] Test fixtures: sample evidence content strings, changedFiles arrays

*Existing infrastructure covers test runner (node:test).*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Audit history appended correctly across sessions | DELTA-03 | Requires multi-session simulation | Run audit twice, verify table grows |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 3s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
