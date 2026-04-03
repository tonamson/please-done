---
phase: 86
slug: error-handling-hardening
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-03
---

# Phase 86 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Node.js built-in test runner |
| **Config file** | package.json (`"test": "node --test test/"`) |
| **Quick run command** | `npm test -- --test-name-pattern "smoke-error"` |
| **Full suite command** | `npm test` |
| **Estimated runtime** | ~1 second (quick) / ~1 second (full) |

---

## Sampling Rate

- **After every task commit:** Run `npm test`
- **After every plan wave:** Run `npm test`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** ~5 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 86-01-01 | 01 | 1 | ERR-01 | grep | `grep -c "catch {}" bin/plan-check.js` → 0 | ✅ | ⬜ pending |
| 86-01-02 | 01 | 1 | ERR-02 | grep | `grep -c "catch {" bin/lib/utils.js` → filtered per D-03b | ✅ | ⬜ pending |
| 86-01-03 | 01 | 1 | ERR-03 | grep | `grep -c "process.exit" bin/lib/installers/claude.js` → 0 | ✅ | ⬜ pending |
| 86-01-04 | 01 | 1 | ERR-01/02 | functional | `PD_DEBUG=1 node bin/plan-check.js 2>&1 \| grep -i "debug\|error"` | ✅ | ⬜ pending |
| 86-01-05 | 01 | 1 | ERR-01/02/03 | regression | `npm test` — 1224 tests pass, 0 fail | ✅ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

*Existing infrastructure covers all phase requirements. No new test stubs needed — changes are grep-verifiable and smoke tests exist in `test/smoke-error-handling.test.js`.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| PD_DEBUG=1 reveals fileHash errors | ERR-02 | Requires triggering file read failure | Delete a temp file, run plan-check with PD_DEBUG=1, observe stderr output |
| Missing prerequisite in claude installer surfaces user-readable error | ERR-03 | Requires missing claude/python/git | Remove command from PATH temporarily, verify error message shown once |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 5s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
