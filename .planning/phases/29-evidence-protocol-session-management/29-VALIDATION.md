---
phase: 29
slug: evidence-protocol-session-management
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-24
---

# Phase 29 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | node:test (built-in Node.js test runner) |
| **Config file** | none — uses node --test directly |
| **Quick run command** | `node --test test/evidence-protocol.test.js test/session-manager.test.js` |
| **Full suite command** | `node --test test/` |
| **Estimated runtime** | ~5 seconds |

---

## Sampling Rate

- **After every task commit:** Run `node --test test/evidence-protocol.test.js test/session-manager.test.js`
- **After every plan wave:** Run `node --test test/`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 5 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 29-01-01 | 01 | 1 | PROT-02 | unit | `node --test test/evidence-protocol.test.js` | ❌ W0 | ⬜ pending |
| 29-01-02 | 01 | 1 | PROT-05 | unit | `node --test test/evidence-protocol.test.js` | ❌ W0 | ⬜ pending |
| 29-02-01 | 02 | 1 | PROT-01 | unit | `node --test test/session-manager.test.js` | ❌ W0 | ⬜ pending |
| 29-02-02 | 02 | 1 | PROT-07 | unit | `node --test test/session-manager.test.js` | ❌ W0 | ⬜ pending |
| 29-03-01 | 03 | 2 | PROT-07 | manual | Agent file review | N/A | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `test/evidence-protocol.test.js` — stubs for PROT-02, PROT-05
- [ ] `test/session-manager.test.js` — stubs for PROT-01, PROT-07

*Existing test infrastructure (node:test) covers framework needs.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Agent files updated to use session dir | PROT-07 | Agent markdown instructions, not code | Review .claude/agents/*.md for hardcoded paths removed |
| Resume UI displays sessions | PROT-01 | AskUserQuestion UX, not testable in unit | Run pd:fix-bug with existing sessions and verify menu |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 5s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
