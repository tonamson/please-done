---
phase: 7
slug: library-fallback-and-version-detection
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-22
---

# Phase 7 — Validation Strategy

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
| 07-01-01 | 01 | 1 | LIBR-02a | unit | `node --test test/smoke-integrity.test.js` | ❌ W0 | ⬜ pending |
| 07-01-02 | 01 | 1 | LIBR-02b | unit | `node --test test/smoke-integrity.test.js` | ❌ W0 | ⬜ pending |
| 07-01-03 | 01 | 1 | LIBR-02c | unit | `node --test test/smoke-integrity.test.js` | ❌ W0 | ⬜ pending |
| 07-01-04 | 01 | 1 | LIBR-02d | unit | `node --test test/smoke-integrity.test.js` | ❌ W0 | ⬜ pending |
| 07-01-05 | 01 | 1 | LIBR-02e | unit | `node --test test/smoke-integrity.test.js` | ❌ W0 | ⬜ pending |
| 07-01-06 | 01 | 1 | LIBR-03a | unit | `node --test test/smoke-integrity.test.js` | ❌ W0 | ⬜ pending |
| 07-01-07 | 01 | 1 | LIBR-03b | unit | `node --test test/smoke-integrity.test.js` | ❌ W0 | ⬜ pending |
| 07-01-08 | 01 | 1 | LIBR-03c | unit | `node --test test/smoke-integrity.test.js` | ❌ W0 | ⬜ pending |
| 07-01-09 | 01 | 1 | LIBR-03d | unit | `node --test test/smoke-integrity.test.js` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] New `describe('Repo integrity -- library fallback and version detection')` block in `test/smoke-integrity.test.js` — covers LIBR-02a through LIBR-03d
- No new test files needed — extend existing smoke-integrity.test.js

*Existing infrastructure covers test framework — only new test cases needed.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Fallback chain activates when Context7 is down | LIBR-02 | Requires live MCP disconnection | Disable Context7 MCP, run a write-code task, verify fallback activates |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 5s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
