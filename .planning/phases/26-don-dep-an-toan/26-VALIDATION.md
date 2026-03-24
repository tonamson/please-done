---
phase: 26
slug: don-dep-an-toan
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-24
---

# Phase 26 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | node:test (built-in) |
| **Config file** | none — uses node --test directly |
| **Quick run command** | `node --test test/smoke-debug-cleanup.test.js` |
| **Full suite command** | `node --test test/smoke-*.test.js` |
| **Estimated runtime** | ~5 seconds |

---

## Sampling Rate

- **After every task commit:** Run `node --test test/smoke-debug-cleanup.test.js`
- **After every plan wave:** Run `node --test test/smoke-*.test.js`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 5 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 26-01-01 | 01 | 1 | CLEAN-01 | unit | `node --test test/smoke-debug-cleanup.test.js` | ❌ W0 | ⬜ pending |
| 26-01-02 | 01 | 1 | SEC-01 | unit | `node --test test/smoke-debug-cleanup.test.js` | ❌ W0 | ⬜ pending |
| 26-02-01 | 02 | 2 | CLEAN-01 | snapshot | `node --test test/snapshot-*.test.js` | ✅ | ⬜ pending |
| 26-02-02 | 02 | 2 | SEC-01 | snapshot | `node --test test/snapshot-*.test.js` | ✅ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `test/smoke-debug-cleanup.test.js` — stubs for CLEAN-01 (scanDebugMarkers) and SEC-01 (matchSecurityWarnings)

*Existing test infrastructure (node:test, node:assert/strict) covers framework needs.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| User confirmation UX (Y/N prompt) | CLEAN-01 | Requires interactive workflow execution | Run /pd:fix-bug with [PD-DEBUG] lines in staged files, verify prompt appears |
| Security warning display | SEC-01 | Requires SCAN_REPORT.md with real data | Create test SCAN_REPORT.md, run fix-bug workflow, verify warnings shown |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 5s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
