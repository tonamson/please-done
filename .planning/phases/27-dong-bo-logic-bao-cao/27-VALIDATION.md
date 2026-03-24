---
phase: 27
slug: dong-bo-logic-bao-cao
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-24
---

# Phase 27 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | node:test (built-in) |
| **Config file** | none — uses node --test directly |
| **Quick run command** | `node --test test/smoke-logic-sync.test.js` |
| **Full suite command** | `node --test test/smoke-*.test.js` |
| **Estimated runtime** | ~5 seconds |

---

## Sampling Rate

- **After every task commit:** Run `node --test test/smoke-logic-sync.test.js`
- **After every plan wave:** Run `node --test test/smoke-*.test.js`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 5 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 27-01-01 | 01 | 1 | LOGIC-01 | unit | `node --test test/smoke-logic-sync.test.js` | ❌ W0 | ⬜ pending |
| 27-01-02 | 01 | 1 | RPT-01 | unit | `node --test test/smoke-logic-sync.test.js` | ❌ W0 | ⬜ pending |
| 27-01-03 | 01 | 1 | PM-01 | unit | `node --test test/smoke-logic-sync.test.js` | ❌ W0 | ⬜ pending |
| 27-02-01 | 02 | 2 | LOGIC-01 | snapshot | `node --test test/smoke-snapshot.test.js` | ✅ | ⬜ pending |
| 27-02-02 | 02 | 2 | RPT-01, PM-01 | snapshot | `node --test test/smoke-snapshot.test.js` | ✅ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `test/smoke-logic-sync.test.js` — stubs for LOGIC-01 (detectLogicChange), RPT-01 (updateReport), PM-01 (suggestClaudeRules)

*Existing test infrastructure (node:test, node:assert/strict) covers framework needs.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Heuristic accuracy on real bugs | LOGIC-01 | Needs real git diffs | Run fix-bug on a logic-changing bug, verify CO/KHONG assessment |
| Report update with real Mermaid | RPT-01 | Needs existing management report | Create test report, run fix-bug with logic change, verify diagram updated |
| CLAUDE.md rule proposal UX | PM-01 | Interactive Y/N prompt | Run fix-bug to completion, verify rule proposal shown and append works |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 5s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
