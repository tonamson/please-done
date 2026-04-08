---
phase: 146
slug: installer-reliability
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-07
---

# Phase 146 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Node.js built-in test runner (`node:test`) |
| **Config file** | None — uses `package.json` scripts |
| **Quick run command** | `node --test test/smoke-install.test.js` |
| **Full suite command** | `npm test` |
| **Estimated runtime** | ~5 seconds |

---

## Sampling Rate

- **After every task commit:** Run `node --test test/smoke-install.test.js`
- **After every plan wave:** Run `npm test`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 10 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------------|-----------|-------------------|-------------|--------|
| 146-01-01 | 01 | 1 | INSTALL-03 | N/A | unit | `node --test test/smoke-install.test.js` | ❌ Wave 0 | ⬜ pending |
| 146-02-01 | 02 | 2 | INSTALL-01 | N/A | smoke | `node --test test/smoke-install.test.js` | ❌ Wave 0 | ⬜ pending |
| 146-03-01 | 03 | 3 | INSTALL-01, INSTALL-03 | N/A | smoke | `node --test test/smoke-install.test.js` | ❌ Wave 0 | ⬜ pending |
| 146-03-01 | 03 | 3 | INSTALL-01, INSTALL-03 | N/A | smoke | `node --test test/smoke-install.test.js` | ❌ Wave 0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `test/smoke-install.test.js` — 5 tests covering INSTALL-01 + INSTALL-03 (created in plan 03)

*Wave 0 test file is created by plan 146-03 (test plan). Plans 146-01 through 146-02 reference it but it is created in the last plan/wave.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| "Already at vX.Y, no changes needed" visible in real terminal | INSTALL-03 | Requires actual TTY + real install state | Run installer twice with same version, observe output |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 10s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
