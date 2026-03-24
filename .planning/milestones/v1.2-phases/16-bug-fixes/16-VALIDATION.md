---
phase: 16
slug: bug-fixes
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-23
---

# Phase 16 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | node --test (built-in Node.js test runner) |
| **Config file** | none — existing test infrastructure |
| **Quick run command** | `node --test test/smoke-*.test.js` |
| **Full suite command** | `node --test test/` |
| **Estimated runtime** | ~1 second |

---

## Sampling Rate

- **After every task commit:** Run `node --test test/smoke-*.test.js`
- **After every plan wave:** Run `node --test test/`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 1 second

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 16-01-01 | 01 | 1 | BFIX-03 | regression | `node --test test/` | ✅ | ⬜ pending |
| 16-02-01 | 02 | 1 | BFIX-01 | regression | `node --test test/` | ✅ | ⬜ pending |
| 16-03-01 | 03 | 2 | BFIX-01 | unit+regression | `node --test test/smoke-plan-checker.test.js` | ✅ | ⬜ pending |
| 16-04-01 | 04 | 3 | BFIX-02 | snapshot | `node --test test/smoke-snapshot.test.js` | ✅ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

Existing infrastructure covers all phase requirements. 448 tests already in place with <1s runtime.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| CLI plan-check output format | BFIX-01 (C1) | New CLI entry point needs manual invocation test | Run `node bin/plan-check.js test/fixtures/*.md` and verify JSON + human-readable output |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 1s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
