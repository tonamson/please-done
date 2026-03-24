---
phase: 11
slug: workflow-integration
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-23
---

# Phase 11 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Node.js built-in test runner (node:test) |
| **Config file** | none — uses `node --test 'test/*.test.js'` |
| **Quick run command** | `node --test 'test/smoke-plan-checker.test.js'` |
| **Full suite command** | `node --test 'test/*.test.js'` |
| **Estimated runtime** | ~5 seconds |

---

## Sampling Rate

- **After every task commit:** Run `node --test 'test/smoke-plan-checker.test.js'`
- **After every plan wave:** Run `node --test 'test/*.test.js'`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 5 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 11-01-01 | 01 | 1 | INTG-01 | manual | N/A — workflow markdown output | N/A | ⬜ pending |
| 11-01-02 | 01 | 1 | INTG-02 | manual | N/A — workflow markdown instructions | N/A | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

*Existing infrastructure covers all phase requirements.*

Phase 11 modifies `workflows/plan.md` (markdown instructions), not JavaScript code. The plan-checker module is already tested by 60 test cases in Phase 10.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| PASS report shows summary table with 4 check statuses | INTG-01 | Workflow output is Claude's text rendering, not testable code | Run `/pd:plan` on a valid phase, verify table with CHECK-01 ✅ through CHECK-04 ✅ appears |
| ISSUES FOUND report grouped by check with max 10 issues | INTG-01 | Same — workflow text formatting | Run `/pd:plan` on a phase with intentionally incomplete TASKS.md, verify grouped issues display |
| Step 8.1 runs automatically between Step 8 and Step 8.5 | INTG-02 | Workflow step ordering is markdown prose, not executable | Run `/pd:plan` end-to-end, verify checker runs after tracking update and before git commit |
| Fix/Proceed/Cancel choice appears on issues | INTG-02 | AskUserQuestion invocation in workflow markdown | Run `/pd:plan` with issues, verify choice prompt with 3 options |
| BLOCK proceed requires explicit confirmation | INTG-02 | User interaction pattern | Trigger BLOCK issue, select Proceed, verify "Force proceed" confirmation step |
| Cancel preserves files + writes STATE.md note | INTG-02 | STATE.md write is workflow instruction | Trigger issues, select Cancel, verify files kept and STATE.md updated |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 5s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
