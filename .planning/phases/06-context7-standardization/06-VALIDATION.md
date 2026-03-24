---
phase: 6
slug: context7-standardization
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-22
---

# Phase 6 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Node.js built-in test runner (node:test) |
| **Config file** | None — runs via `node --test` |
| **Quick run command** | `node --test test/smoke-integrity.test.js` |
| **Full suite command** | `npm test` |
| **Estimated runtime** | ~5 seconds |

---

## Sampling Rate

- **After every task commit:** Run `node --test test/smoke-integrity.test.js`
- **After every plan wave:** Run `npm test`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 5 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 06-01-01 | 01 | 1 | LIBR-01a | unit | `node --test test/smoke-integrity.test.js` | ❌ W0 | ⬜ pending |
| 06-01-02 | 01 | 1 | LIBR-01b | unit | `node --test test/smoke-integrity.test.js` | ✅ partial | ⬜ pending |
| 06-01-03 | 01 | 1 | LIBR-01c | unit | `node --test test/smoke-integrity.test.js` | ❌ W0 | ⬜ pending |
| 06-01-04 | 01 | 1 | LIBR-01d | unit | `node --test test/smoke-integrity.test.js` | ❌ W0 | ⬜ pending |
| 06-01-05 | 01 | 1 | LIBR-01e | unit | `node --test test/smoke-integrity.test.js` | ❌ W0 | ⬜ pending |
| 06-01-06 | 01 | 1 | LIBR-01f | unit | `node --test test/smoke-integrity.test.js` | ❌ W0 | ⬜ pending |
| 06-01-07 | 01 | 1 | LIBR-01g | unit | `node --test test/smoke-integrity.test.js` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] New `describe('Repo integrity -- context7 standardization')` block in `test/smoke-integrity.test.js` — covers LIBR-01a through LIBR-01g
- No new test files needed — extend existing smoke-integrity.test.js

*Existing infrastructure covers test framework — only new test cases needed.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Context7 resolves "react" successfully | LIBR-01 (D-09) | Requires live MCP connection | Run guard-context7 check, verify "react" resolves |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 5s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
