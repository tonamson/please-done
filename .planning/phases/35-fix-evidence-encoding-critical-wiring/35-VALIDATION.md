---
phase: 35
slug: fix-evidence-encoding-critical-wiring
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-25
---

# Phase 35 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | jest 29.x |
| **Config file** | jest.config.js |
| **Quick run command** | `npx jest --testPathPattern="evidence-protocol\|checkpoint-handler\|outcome-router\|bug-memory\|session-manager" --no-coverage` |
| **Full suite command** | `npx jest --no-coverage` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx jest --testPathPattern="evidence-protocol\|checkpoint-handler\|outcome-router\|bug-memory\|session-manager" --no-coverage`
- **After every plan wave:** Run `npx jest --no-coverage`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 35-01-01 | 01 | 1 | PROT-02, FLOW-01..05 | unit | `npx jest evidence-protocol --no-coverage` | ✅ | ⬜ pending |
| 35-01-02 | 01 | 1 | PROT-02, PROT-03 | unit | `npx jest outcome-router --no-coverage` | ✅ | ⬜ pending |
| 35-02-01 | 02 | 1 | PROT-04, PROT-06 | unit | `npx jest checkpoint-handler --no-coverage` | ✅ | ⬜ pending |
| 35-02-02 | 02 | 1 | PROT-03 | manual | grep FIX-PLAN workflow | N/A | ⬜ pending |
| 35-02-03 | 02 | 1 | MEM-04 | unit | `npx jest bug-memory --no-coverage` | ✅ | ⬜ pending |
| 35-02-04 | 02 | 1 | ORCH-03, FLOW-03 | manual | grep SESSION.md workflow | N/A | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

Existing infrastructure covers all phase requirements. Test files already exist:
- `test/evidence-protocol.test.js`
- `test/checkpoint-handler.test.js`
- `test/outcome-router.test.js`
- `test/bug-memory.test.js`
- `test/session-manager.test.js`

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| FIX-PLAN.md path in workflow | PROT-03 | Workflow text change, not JS | grep `session_dir.*FIX-PLAN` workflows/fix-bug.md |
| SESSION.md write-back at 2 locations | ORCH-03, FLOW-03 | Workflow text change | grep `updateSession` near isHeavyAgent and Repro FAIL in fix-bug.md |
| REQUIREMENTS.md checkboxes | Doc sync | Manual doc update | Verify [x] on ORCH-01/02, MEM-01..04 |

*All JS module behaviors have automated verification via existing tests.*

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
