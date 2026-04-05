---
phase: 09
slug: converter-pipeline-optimization
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-22
---

# Phase 09 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | jest 29.x (vitest compatible) |
| **Config file** | tests/smoke-integrity.test.js, tests/smoke-utils.test.js |
| **Quick run command** | `npm test` |
| **Full suite command** | `npm test` |
| **Estimated runtime** | ~5 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npm test`
- **After every plan wave:** Run `npm test`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 5 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 09-01-01 | 01 | 1 | INST-01 | snapshot | `npm test` | ❌ W0 | ⬜ pending |
| 09-01-02 | 01 | 1 | INST-01 | unit | `npm test` | ❌ W0 | ⬜ pending |
| 09-02-01 | 02 | 1 | INST-01 | snapshot | `npm test` | ✅ | ⬜ pending |
| 09-02-02 | 02 | 1 | INST-02 | unit | `npm test` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `tests/snapshot-converters.test.js` — snapshot comparison for all 4 converters × 12 skills
- [ ] `tests/error-propagation.test.js` — verify silent catches are replaced with proper error handling

*Existing smoke-integrity.test.js and smoke-utils.test.js cover structural validation.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Cross-platform output correctness | INST-01 | Requires actual platform CLI | Install on each platform and verify skill invocation works |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 5s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
