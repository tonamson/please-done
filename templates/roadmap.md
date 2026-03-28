# ROADMAP.md Template

> `/pd:new-milestone` creates/updates | `/pd:plan`, `/pd:write-code`, `/pd:complete-milestone`, `/pd:what-next` read

## Template

```markdown
# Project Roadmap
> Project: [name]
> Created: [DD_MM_YYYY]
> Last updated: [DD_MM_YYYY]

## Project Goal
[Brief description — copy from PROJECT.md "Vision"]

## Milestones

### Milestone 1: [Name] (v1.0)
> Status: ⬜ | Priority: Critical

#### Phase 1.1: [Name]
- [ ] Deliverable 1
- [ ] Deliverable 2
- Requirements: AUTH-01, AUTH-02
- Success Criteria:
  1. [User can... → observable result]
  2. [User can... → observable result]
- Dependencies: None

#### Phase 1.2: [Name]
- [ ] Deliverable 1
- Requirements: PROF-01, PROF-02
- Success Criteria:
  1. [observable criterion]
- Dependencies: Phase 1.1

### Milestone 2: [Name] (v1.1)
> Status: ⬜ | Priority: High
...

## Strategic Decisions
| # | Issue | Decision | Reason | Alternatives Rejected |
|---|-------|----------|--------|-----------------------|

## Risks & Notes
```

## Phase Rules

Each phase MUST have: Goal (1 sentence), Deliverables (checkboxes), Requirement IDs (from REQUIREMENTS.md), Success Criteria (2-5), Dependencies.

## Versioning Rules

| Type | When |
|------|------|
| Major | Complete new feature set (1.0 → 2.0) |
| Minor | Additional features (1.0 → 1.1) |

Record reasoning in the Strategic Decisions table.

## Priority Rules

Critical (won't work without it) | High (needed for minimum experience) | Medium (improvement, can be deferred) | Low (enhancement)

## OVERWRITE vs APPEND

**OVERWRITE:** Write everything from scratch.
**APPEND:** Keep existing milestones unchanged → add new AFTER the last milestone → update `Last updated`.

## Coverage Check (REQUIRED)

ALL v1 requirements MUST be mapped to **exactly 1 phase**. Unmapped = error → STOP and fix. 1 requirement mapped to 2+ phases = error → choose primary phase.
Append: new milestone versions MUST NOT duplicate existing milestones.
