---
phase: 37
slug: fix-workflow-prose-gaps
status: draft
nyquist_compliant: true
wave_0_complete: true
created: 2026-03-25
---

# Phase 37 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | node --test (built-in) |
| **Config file** | none — built-in |
| **Quick run command** | `node --test test/smoke-bug-memory.test.js test/smoke-session-manager.test.js` |
| **Full suite command** | `node --test test/*.test.js` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `node --test test/smoke-bug-memory.test.js test/smoke-session-manager.test.js`
- **After every plan wave:** Run `node --test test/*.test.js`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 37-01-01 | 01 | 1 | MEM-04 | smoke | `grep "parseFrontmatter" workflows/fix-bug.md` | ✅ | ⬜ pending |
| 37-01-02 | 01 | 1 | FLOW-06 | smoke | `grep "Round.*INCONCLUSIVE" workflows/fix-bug.md` | ✅ | ⬜ pending |
| 37-01-03 | 01 | 1 | MEM-04, FLOW-06 | regression | `node --test test/*.test.js` | ✅ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

Existing infrastructure covers all phase requirements. No new test files needed.

---

## Manual-Only Verifications

All phase behaviors have automated verification.

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references
- [x] No watch-mode flags
- [x] Feedback latency < 15s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** approved 2026-03-25
