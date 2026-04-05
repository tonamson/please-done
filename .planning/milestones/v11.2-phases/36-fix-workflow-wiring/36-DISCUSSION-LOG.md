# Phase 36: Fix Workflow Wiring - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-03-25
**Phase:** 36-fix-workflow-wiring
**Areas discussed:** INT-07 fix approach, INT-08 fix approach, Test/snapshot strategy
**Mode:** --auto (all decisions auto-selected)

---

## INT-07 Fix Approach

| Option | Description | Selected |
|--------|-------------|----------|
| Construct new {evidenceContent} objects | Per audit: build correct shape when calling mergeParallelResults | ✓ |
| Modify mergeParallelResults to accept validateEvidence result | Would require module changes — violates established pattern | |

**User's choice:** [auto] Construct new {evidenceContent} objects (recommended default)
**Notes:** Consistent with Phase 34 pattern — only fix caller, never modify pure function modules

---

## INT-08 Fix Approach

| Option | Description | Selected |
|--------|-------------|----------|
| Fix destructuring to match actual return shape | Doi thanh {logicResult, reportResult, rulesResult, warnings} | ✓ |
| Modify runLogicSync to return old shape | Would require module changes — violates established pattern | |

**User's choice:** [auto] Fix destructuring to match actual return shape (recommended default)
**Notes:** Per audit fix description — access logicResult.hasLogicChange, reportResult !== null, rulesResult.suggestions

---

## Test/Snapshot Strategy

| Option | Description | Selected |
|--------|-------------|----------|
| Verify existing + regenerate snapshots | Modules already tested, just fix workflow text | ✓ |
| Add new integration tests | Over-engineering for 2 text edits | |

**User's choice:** [auto] Verify existing + regenerate snapshots (recommended default)
**Notes:** Consistent with Phase 34/35 pattern

---

## Claude's Discretion

- Plan count and task breakdown
- Commit message style

## Deferred Ideas

None — gap closure phase, scope fixed by milestone audit
