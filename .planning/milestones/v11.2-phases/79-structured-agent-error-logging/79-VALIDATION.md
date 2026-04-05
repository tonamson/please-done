---
phase: 79
slug: structured-agent-error-logging
status: complete
nyquist_compliant: true
wave_0_complete: true
created: 2026-04-03
---

# Phase 79 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Node.js built-in test runner (node:test) |
| **Config file** | `package.json` → `"test": "node --test test/**/*.test.js"` |
| **Quick run command** | `node --test test/smoke-log-schema.test.js test/smoke-log-writer.test.js` |
| **Full suite command** | `npm test` |
| **Estimated runtime** | ~3 seconds |

---

## Sampling Rate

- **After every task commit:** Run `node --test test/smoke-log-schema.test.js test/smoke-log-writer.test.js`
- **After every plan wave:** Run `npm test`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 5 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 79-03-01 | 03 | 1 | LOG-01 | syntax | `node -c test/smoke-log-schema.test.js && node -c test/smoke-log-writer.test.js` | ❌ new | ⬜ pending |
| 79-01-01 | 01 | 2 | LOG-01 | unit | `node --test test/smoke-log-schema.test.js` | ❌ new | ⬜ pending |
| 79-02-01 | 02 | 3 | LOG-01 | unit | `node --test test/smoke-log-writer.test.js` | ❌ new | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `test/smoke-log-schema.test.js` — RED stubs for createLogEntry + validateLogEntry (SC1, SC3, SC4)
- [ ] `test/smoke-log-writer.test.js` — RED stubs for appendLogEntry JSONL write + rejection gate (SC2, SC4)

These are created by **Plan 79-03 (Wave 1)** before any implementation files.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Actual JSONL line appended on real agent error | LOG-01 | Requires live agent invocation producing an error | Manually call appendLogEntry() with a real entry; verify .planning/logs/agent-errors.jsonl |
| Directory auto-created if .planning/logs/ absent | LOG-01 | Requires filesystem state management | Delete .planning/logs/ then call appendLogEntry(); confirm dir + file created |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references
- [x] No watch-mode flags
- [x] Feedback latency < 5s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** ✅ approved — all checks pass, phase verified
