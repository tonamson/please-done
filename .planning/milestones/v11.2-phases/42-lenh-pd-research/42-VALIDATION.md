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
| **Framework** | node:test (built-in) |
| **Config file** | none — built-in Node.js test runner |
| **Quick run command** | `node --test test/smoke-research-store.test.js` |
| **Full suite command** | `node --test test/smoke-*.test.js` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `node --test test/smoke-research-store.test.js`
- **After every plan wave:** Run `node --test test/smoke-*.test.js`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 42-01-F1 | 01 | 1 | STORE-04 | unit | `node --test test/smoke-research-store.test.js` | ❌ W0 | ⬜ pending |
| 42-02-T1 | 02 | 1 | AGENT-03 | smoke | `grep -c 'pd:research' commands/pd/research.md` | N/A | ⬜ pending |
| 42-02-T2 | 02 | 1 | AGENT-03, EXTRA-01 | smoke | `grep -c 'pd-evidence-collector' workflows/research.md` | N/A | ⬜ pending |
| 42-03-T1 | 03 | 2 | AGENT-03 | snapshot | `node --test test/smoke-converters.test.js` | ✅ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `test/smoke-research-store.test.js` — add routeQuery test stubs (Plan 01 RED phase)
- Existing infrastructure covers remaining phase requirements.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Cross-validation xung dot | EXTRA-01 | Requires 2 research files cung topic o internal/ va external/ | 1. Tao 2 files cung topic, 2. Chay Fact Checker, 3. Verify section `## Xung dot phat hien` |
| Pipeline orchestration | AGENT-03 | Agent spawning la Claude Code runtime | 1. Chay `/pd:research "topic"`, 2. Verify Evidence Collector output, 3. Verify Fact Checker auto-runs |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
