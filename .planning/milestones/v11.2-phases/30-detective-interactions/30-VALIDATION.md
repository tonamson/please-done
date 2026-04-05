---
phase: 30
slug: detective-interactions
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-25
---

# Phase 30 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Node.js built-in test runner (node:test + node:assert/strict) |
| **Config file** | none — dung `npm test` |
| **Quick run command** | `node --test test/smoke-outcome-router.test.js` |
| **Full suite command** | `node --test 'test/*.test.js'` |
| **Estimated runtime** | ~5 seconds |

---

## Sampling Rate

- **After every task commit:** Run `node --test test/smoke-{module}.test.js`
- **After every plan wave:** Run `node --test 'test/*.test.js'`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 5 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 30-01-01 | 01 | 0 | PROT-03 | unit stub | `node --test test/smoke-outcome-router.test.js` | ❌ W0 | ⬜ pending |
| 30-01-02 | 01 | 0 | PROT-04,PROT-06 | unit stub | `node --test test/smoke-checkpoint-handler.test.js` | ❌ W0 | ⬜ pending |
| 30-01-03 | 01 | 0 | PROT-08 | unit stub | `node --test test/smoke-parallel-dispatch.test.js` | ❌ W0 | ⬜ pending |
| 30-02-01 | 02 | 1 | PROT-03 | unit | `node --test test/smoke-outcome-router.test.js` | ❌ W0 | ⬜ pending |
| 30-02-02 | 02 | 1 | PROT-03 | unit | `node --test test/smoke-outcome-router.test.js` | ❌ W0 | ⬜ pending |
| 30-03-01 | 03 | 1 | PROT-04 | unit | `node --test test/smoke-checkpoint-handler.test.js` | ❌ W0 | ⬜ pending |
| 30-03-02 | 03 | 1 | PROT-06 | unit | `node --test test/smoke-checkpoint-handler.test.js` | ❌ W0 | ⬜ pending |
| 30-04-01 | 04 | 1 | PROT-08 | unit | `node --test test/smoke-parallel-dispatch.test.js` | ❌ W0 | ⬜ pending |
| 30-04-02 | 04 | 1 | PROT-08 | unit | `node --test test/smoke-parallel-dispatch.test.js` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `test/smoke-outcome-router.test.js` — stubs for PROT-03 (buildRootCauseMenu, prepareFixNow, prepareFixPlan, prepareSelfFix)
- [ ] `test/smoke-checkpoint-handler.test.js` — stubs for PROT-04, PROT-06 (extractCheckpointQuestion, buildContinuationContext, MAX_CONTINUATION_ROUNDS)
- [ ] `test/smoke-parallel-dispatch.test.js` — stubs for PROT-08 (buildParallelPlan, mergeParallelResults — 3 scenarios: both success, DocSpec fail, Detective fail)

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| AskUserQuestion menu hien dung 3 lua chon | PROT-03 | AskUserQuestion la Claude Code tool, khong the automate | Chay pd:fix-bug, khi ROOT CAUSE found — kiem tra menu hien 3 options |
| Continuation Agent nhan context dung | PROT-06 | Spawn agent qua Claude Code runtime | Tao evidence voi CHECKPOINT, tra loi — verify agent moi nhan dung 4 params |
| Detective + DocSpec chay song song | PROT-08 | Phu thuoc vao Claude Code parallel agent spawning | Chay pd:fix-bug voi ca 2 agents — kiem tra ca 2 output files |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 5s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
