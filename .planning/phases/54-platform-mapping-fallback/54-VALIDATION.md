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
| **Framework** | jest 29.x (via node --experimental-vm-modules) |
| **Config file** | `jest.config.js` (if exists) or inline --testPathPattern |
| **Quick run command** | `node --experimental-vm-modules node_modules/.bin/jest --testPathPattern platform-models` |
| **Full suite command** | `node --experimental-vm-modules node_modules/.bin/jest` |
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
| 54-01-01 | 01 | 1 | PLAT-01 | unit | `jest --testPathPattern platform-models` | ❌ W0 | ⬜ pending |
| 54-01-02 | 01 | 1 | PLAT-01 | unit | `jest --testPathPattern platform-models` | ❌ W0 | ⬜ pending |
| 54-01-03 | 01 | 1 | PLAT-02 | unit | `jest --testPathPattern platform-models` | ❌ W0 | ⬜ pending |
| 54-02-01 | 02 | 1 | PLAT-01 | integration | `jest --testPathPattern resource-config` | ✅ | ⬜ pending |
| 54-02-02 | 02 | 1 | PLAT-01 | smoke | `jest --testPathPattern smoke-agent` | ✅ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `test/platform-models.test.js` — stubs for PLAT-01, PLAT-02 platform×tier combinations and fallback tests

*Existing infrastructure (jest, resource-config.test.js, smoke-agent-files.test.js) covers integration and regression.*

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
