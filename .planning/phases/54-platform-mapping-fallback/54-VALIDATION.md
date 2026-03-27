---
phase: 54
slug: platform-mapping-fallback
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-27
---

# Phase 54 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | node:test (built-in, không cần install) |
| **Config file** | none — node:test dùng inline test files |
| **Quick run command** | `node --test test/platform-models.test.js` |
| **Full suite command** | `node --test test/platform-models.test.js && node --test test/smoke-resource-config.test.js && node --test test/smoke-agent-files.test.js` |
| **Estimated runtime** | ~5 seconds |

---

## Sampling Rate

- **After every task commit:** Run quick run command (platform-models tests)
- **After every plan wave:** Run full suite command
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 5 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 54-01-T1 | 01 | 1 | PLAT-01, PLAT-02 | unit (TDD red) | `node --test test/platform-models.test.js` | ❌ W0 | ⬜ pending |
| 54-01-T2 | 01 | 1 | PLAT-01, PLAT-02 | unit + smoke (TDD green) | `node --test test/platform-models.test.js && node --test test/smoke-resource-config.test.js && node --test test/smoke-agent-files.test.js` | ✅ (after T1) | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `test/platform-models.test.js` — stubs for PLAT-01, PLAT-02 platform×tier combinations and fallback tests

*Existing infrastructure (node:test, smoke-resource-config.test.js, smoke-agent-files.test.js) covers integration and regression.*

---

## Manual-Only Verifications

*All phase behaviors have automated verification.*

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 5s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
