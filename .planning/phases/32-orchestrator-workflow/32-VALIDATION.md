---
phase: 32
slug: orchestrator-workflow
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-25
---

# Phase 32 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | jest 29.x (existing) |
| **Config file** | `jest.config.js` |
| **Quick run command** | `npx jest --testPathPattern="bin/lib" --no-coverage` |
| **Full suite command** | `npx jest --no-coverage` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx jest --testPathPattern="bin/lib" --no-coverage`
- **After every plan wave:** Run `npx jest --no-coverage`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 32-01-01 | 01 | 1 | FLOW-01 | integration | `npx jest --testPathPattern="orchestrator" --no-coverage` | ❌ W0 | ⬜ pending |
| 32-01-02 | 01 | 1 | FLOW-02 | integration | `npx jest --testPathPattern="orchestrator" --no-coverage` | ❌ W0 | ⬜ pending |
| 32-01-03 | 01 | 1 | FLOW-03 | integration | `npx jest --testPathPattern="orchestrator" --no-coverage` | ❌ W0 | ⬜ pending |
| 32-01-04 | 01 | 1 | FLOW-04 | integration | `npx jest --testPathPattern="orchestrator" --no-coverage` | ❌ W0 | ⬜ pending |
| 32-01-05 | 01 | 1 | FLOW-05 | integration | `npx jest --testPathPattern="orchestrator" --no-coverage` | ❌ W0 | ⬜ pending |
| 32-01-06 | 01 | 1 | FLOW-08 | integration | `npx jest --testPathPattern="orchestrator" --no-coverage` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `tests/orchestrator-workflow.test.js` — integration tests for 5-step orchestrator flow
- [ ] Test stubs for each FLOW requirement (FLOW-01 through FLOW-08)

*Existing infrastructure (jest) covers framework needs. Only test files needed.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Progressive disclosure banners | FLOW-08 | Visual output formatting | Run pd:fix-bug, verify milestone banners appear at each step |
| Agent spawn hiding | FLOW-08 | Claude Code Agent tool behavior | Verify agent details hidden, only results shown |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
