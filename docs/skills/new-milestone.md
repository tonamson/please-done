# Skill: new-milestone

## Purpose

Create a new milestone with REQUIREMENTS.md and update ROADMAP.md to track work toward a specific version or release goal.

## When to Use

- **Version planning:** Starting a new version or release cycle (e.g., v2.0)
- **Feature kickoff:** Beginning a major feature or epic
- **Milestone transition:** After completing current milestone
- **Scope change:** When work shifts to new set of requirements
- **Release prep:** Planning for upcoming product release

## Prerequisites

- [ ] `.planning/` directory initialized with `init`
- [ ] ROADMAP.md exists (created by init)
- [ ] Clear understanding of milestone goals and scope
- [ ] Optional: PRD or requirements document

## Basic Command

```
/pd:new-milestone <version>
```

**Example:**
```
/pd:new-milestone v2.0
```

**What it creates:**
- `REQUIREMENTS.md` with milestone template
- Updates `ROADMAP.md` with new milestone entry
- Updates `CURRENT_MILESTONE.md` with active status
- Initializes phase tracking in `STATE.md`

## Common Flags

| Flag | Description | Example |
|------|-------------|---------|
| `--template` | Use template for requirements | `/pd:new-milestone v2.0 --template feature` |
| `--from-requirements <file>` | Import from requirements file | `/pd:new-milestone v2.0 --from-requirements prd.md` |

## See Also

- [complete-milestone](complete-milestone.md) — Finalize current milestone
- [plan](plan.md) — Create phase plans for milestone
- [status](status.md) — Check milestone progress
