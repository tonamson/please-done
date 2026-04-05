---
phase: 53
slug: new-agent-files
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-27
---

# Phase 53 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | node:test (built-in) |
| **Config file** | none — uses node --test directly |
| **Quick run command** | `node --test test/smoke-agent-files.test.js` |
| **Full suite command** | `node --test test/smoke-agent-files.test.js test/resource-config.test.js` |
| **Estimated runtime** | ~3 seconds |

---

## Sampling Rate

- **After every task commit:** Run `node --test test/smoke-agent-files.test.js`
- **After every plan wave:** Run `node --test test/smoke-agent-files.test.js test/resource-config.test.js`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 5 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 53-01-01 | 01 | 1 | AGEN-02 | smoke | `node --test test/smoke-agent-files.test.js` | ✅ | ⬜ pending |
| 53-01-02 | 01 | 1 | AGEN-03 | smoke | `node --test test/smoke-agent-files.test.js` | ✅ | ⬜ pending |
| 53-01-03 | 01 | 1 | AGEN-04 | smoke | `node --test test/smoke-agent-files.test.js` | ✅ | ⬜ pending |
| 53-01-04 | 01 | 1 | AGEN-05 | smoke | `node --test test/smoke-agent-files.test.js` | ✅ | ⬜ pending |
| 53-01-05 | 01 | 1 | AGEN-06 | smoke | `node --test test/smoke-agent-files.test.js` | ✅ | ⬜ pending |
| 53-01-06 | 01 | 1 | AGEN-07 | smoke | `node --test test/smoke-agent-files.test.js` | ✅ | ⬜ pending |
| 53-02-01 | 02 | 1 | AGEN-08 | unit | `node --test test/smoke-agent-files.test.js` | ✅ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

Existing infrastructure covers all phase requirements. `test/smoke-agent-files.test.js` already has patterns for agent file validation.

---

## Manual-Only Verifications

All phase behaviors have automated verification.

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 5s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
