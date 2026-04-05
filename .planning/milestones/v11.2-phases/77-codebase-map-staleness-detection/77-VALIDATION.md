---
phase: 77
slug: codebase-map-staleness-detection
status: complete
nyquist_compliant: true
wave_0_complete: true
created: 2026-04-03
---

# Phase 77 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Node.js built-in test runner (node:test) |
| **Config file** | `package.json` → `"test": "node --test test/**/*.test.js"` |
| **Quick run command** | `node --test test/smoke-codebase-staleness.test.js` |
| **Full suite command** | `npm test` |
| **Estimated runtime** | ~3 seconds |

---

## Sampling Rate

- **After every task commit:** Run `node --test test/smoke-codebase-staleness.test.js`
- **After every plan wave:** Run `npm test`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 5 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 77-01-01 | 01 | 1 | STALE-01-A | grep | `grep -n "mapped_at_commit" commands/pd/agents/pd-codebase-mapper.md` | ✅ | ✅ green |
| 77-02-01 | 02 | 2 | STALE-01-B | grep | `grep -n "git rev-list" workflows/scan.md` | ✅ | ✅ green |
| 77-03-01 | 03 | 2 | STALE-01-C/D | unit | `node --test test/smoke-codebase-staleness.test.js` | ✅ | ✅ green |

---

## Wave 0 Requirements

All files existed prior to phase start. No Wave 0 stubs needed.

- `commands/pd/agents/pd-codebase-mapper.md` — already existed, Step 6 added
- `workflows/scan.md` — already existed, Step 0 prepended
- `test/smoke-codebase-staleness.test.js` — new test file (created in Plan 77-03)

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Live staleness warning displays N commit count correctly | STALE-01-C | Requires live git repo + META.json with old SHA | Create META.json with a commit from 21+ commits ago; run `/pd:scan` to confirm warning text shows exact N |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references
- [x] No watch-mode flags
- [x] Feedback latency < 5s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** ✅ approved — 11 contract tests pass, VERIFICATION.md score 4/4
