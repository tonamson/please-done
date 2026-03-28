# TASKS.md Template

> `/pd:plan` creates | `/pd:write-code`, `/pd:test`, `/pd:fix-bug`, `/pd:what-next`, `/pd:complete-milestone` read

Task list for 1 phase: overview table + detail for each task.

Status icons: @references/conventions.md

## Template

```markdown
# Task List
> Milestone: [name] (v[x.x]) | Phase: [x.x]
> Created: [DD_MM_YYYY] | Total: [N]

## Overview
| # | Task | Status | Priority | Dependencies | Type | Truths |
|---|------|--------|----------|--------------|------|--------|

---
## Task 1: [Name]
> Status: ⬜ | Priority: High | Dependencies: None | Type: Backend | Effort: standard
> Files: [list of expected files]
> Truths: [T1, T2] ← traces back to PLAN.md Success Criteria

### Description
[Work to be done]

### Acceptance Criteria
- [ ] [Criterion 1 — related to Truths]
- [ ] [Criterion 2]

### Technical Notes
[Only when necessary]
```

## Task Types

`Backend` | `Frontend` | `Fullstack` | `WordPress` | `Solidity` | `Flutter` | `[Other stack]`

## Effort Level

`simple` | `standard` | `complex`

Default: `standard`. See @references/conventions.md → 'Effort level'.

## Truths (goal-backward traceability)

Column `Truths` + field `> Truths:` = Truth IDs from PLAN.md "Success Criteria → Required Truths".
- Each task MUST serve ≥1 Truth
- Each Truth MUST be covered by ≥1 task
- Truth not covered by any task → gap → add task or fix plan

## Dependencies

| Type | Format | Parallel-safe? |
|------|--------|----------------|
| Code | `Task A` | No — B uses function A creates |
| Design | `None` | Yes — uses response shape from PLAN.md |
| File | `Task A (shared file)` | No — modifying the same file |

## Status Updates

- Update BOTH: Overview table + task detail `> Status:`
- Update `> Files:` if actual differs from plan
- Only ✅ AFTER successful git commit (@references/conventions.md)
