---
phase: 8
slug: wave-based-parallel-execution
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-22
---

# Phase 8 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | node:test (built-in) |
| **Config file** | none — existing test setup |
| **Quick run command** | `node --test test/smoke-integrity.test.js` |
| **Full suite command** | `node --test test/smoke-integrity.test.js test/smoke-utils.test.js` |
| **Estimated runtime** | ~3 seconds |

---

## Sampling Rate

- **After every task commit:** Run `node --test test/smoke-integrity.test.js`
- **After every plan wave:** Run `node --test test/smoke-integrity.test.js test/smoke-utils.test.js`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 5 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 08-01-01 | 01 | 1 | PARA-03 | content | `grep -c "hotspot\|barrel\|config" workflows/write-code.md` | ❌ W0 | ⬜ pending |
| 08-01-02 | 01 | 1 | PARA-02 | content | `grep -c "auto-serialize\|dời.*wave" workflows/write-code.md` | ❌ W0 | ⬜ pending |
| 08-02-01 | 02 | 1 | PARA-01 | content | `grep -c "> Files:" workflows/plan.md` | ❌ W0 | ⬜ pending |
| 08-02-02 | 02 | 1 | PARA-01 | smoke | `node --test test/smoke-integrity.test.js` | ✅ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `test/smoke-integrity.test.js` — add tests for hotspot patterns + parallel instructions presence
- [ ] Existing infrastructure covers remaining phase requirements

*Existing test framework (node:test) already installed and configured.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Wave execution produces 50%+ speedup | PARA-01 SC4 | Requires actual parallel agent spawning | Run `/pd:write-code --parallel` on a plan with 4+ independent tasks, compare wall-clock time vs sequential |
| Agent results correctly merged post-wave | PARA-01 SC5 | Requires runtime orchestration | Verify TASKS.md updated correctly after parallel wave completes |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 5s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
