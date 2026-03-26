---
phase: 42
slug: lenh-pd-research
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-26
---

# Phase 42 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | jest 29.x |
| **Config file** | jest.config.js |
| **Quick run command** | `npx jest test/smoke-research-store.test.js --no-coverage` |
| **Full suite command** | `npx jest --no-coverage` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx jest test/smoke-research-store.test.js --no-coverage`
- **After every plan wave:** Run `npx jest --no-coverage`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 42-01-01 | 01 | 1 | STORE-04 | unit | `npx jest test/smoke-research-store.test.js -t "routeQuery"` | ❌ W0 | ⬜ pending |
| 42-01-02 | 01 | 1 | AGENT-03 | integration | `npx jest test/smoke-integrity.test.js` | ✅ | ⬜ pending |
| 42-02-01 | 02 | 2 | EXTRA-01 | manual | See manual verifications | N/A | ⬜ pending |
| 42-02-02 | 02 | 2 | STORE-04 | snapshot | `npx jest test/smoke-converters.test.js` | ✅ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `test/smoke-research-store.test.js` — add routeQuery test stubs
- Existing infrastructure covers remaining phase requirements.

*If none: "Existing infrastructure covers all phase requirements."*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Cross-validation xung dot | EXTRA-01 | Requires 2 research files cung topic o internal/ va external/ | 1. Tao 2 files cung topic, 2. Chay Fact Checker, 3. Verify section `## Xung dot phat hien` |
| Pipeline orchestration | AGENT-03 | Agent spawning la Claude Code runtime | 1. Chay `/pd:research "topic"`, 2. Verify Evidence Collector output, 3. Verify Fact Checker auto-runs |

*If none: "All phase behaviors have automated verification."*

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
