---
phase: 31
slug: project-memory-regression-detection
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-25
---

# Phase 31 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | node:test (built-in) |
| **Config file** | none — uses node:test built-in |
| **Quick run command** | `node --test test/bug-memory.test.js` |
| **Full suite command** | `node --test test/` |
| **Estimated runtime** | ~5 seconds |

---

## Sampling Rate

- **After every task commit:** Run `node --test test/bug-memory.test.js`
- **After every plan wave:** Run `node --test test/`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 5 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 31-01-01 | 01 | 1 | MEM-01, MEM-04 | unit | `node --test test/bug-memory.test.js` | ❌ W0 | ⬜ pending |
| 31-01-02 | 01 | 1 | MEM-02 | unit | `node --test test/bug-memory.test.js` | ❌ W0 | ⬜ pending |
| 31-02-01 | 02 | 2 | MEM-01 | unit | `node --test test/bug-memory.test.js` | ❌ W0 | ⬜ pending |
| 31-02-02 | 02 | 2 | MEM-03 | unit | `node --test test/bug-memory.test.js` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `test/bug-memory.test.js` — stubs for MEM-01, MEM-02, MEM-03, MEM-04

*Existing infrastructure covers test framework — only test file needs creation.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Agent prompt update | MEM-01 | Agent prompt changes need manual review | Verify pd-bug-janitor.md contains "Bug tuong tu" section instructions |
| Agent prompt update | MEM-03 | Agent prompt changes need manual review | Verify pd-fix-architect.md contains related bugs context instructions |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 5s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
