---
phase: 48
slug: evidence-smart-selection
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-26
---

# Phase 48 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | jest 29.x |
| **Config file** | `jest.config.js` |
| **Quick run command** | `npx jest --testPathPattern="smart-selection\|function-checklist\|reporter" --no-coverage` |
| **Full suite command** | `npx jest --no-coverage` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx jest --testPathPattern="smart-selection\|function-checklist\|reporter" --no-coverage`
- **After every plan wave:** Run `npx jest --no-coverage`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 48-01-01 | 01 | 1 | SMART-01 | unit | `npx jest smart-selection` | ❌ W0 | ⬜ pending |
| 48-01-02 | 01 | 1 | SMART-02 | unit | `npx jest smart-selection` | ❌ W0 | ⬜ pending |
| 48-01-03 | 01 | 1 | SMART-03 | unit | `npx jest smart-selection` | ❌ W0 | ⬜ pending |
| 48-02-01 | 02 | 1 | EVID-01 | unit | `npx jest function-checklist` | ❌ W0 | ⬜ pending |
| 48-02-02 | 02 | 1 | EVID-02 | unit | `npx jest function-checklist` | ❌ W0 | ⬜ pending |
| 48-03-01 | 03 | 2 | AGENT-03 | unit | `npx jest reporter` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `tests/smart-selection.test.js` — stubs for SMART-01, SMART-02, SMART-03
- [ ] `tests/function-checklist.test.js` — stubs for EVID-01, EVID-02
- [ ] `tests/reporter.test.js` — stubs for AGENT-03

*Existing jest infrastructure covers framework needs.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| User confirm prompt khi < 2 match | SMART-03 | Interactive TUI prompt | Run `pd:audit` trên project nhỏ, verify prompt xuất hiện |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
