# PROJECT.md Template

> `/pd:new-milestone` creates/updates | All commands read (project-level source of truth)

Single source of truth at the project level: vision, audience, constraints, milestone history, lessons learned.

- `ROADMAP.md` = phases/deliverables (changes each milestone)
- `STATE.md` = current state (changes continuously)
- `PROJECT.md` = the big picture (rarely changes)

## Template

```markdown
# [Project Name]
> Created: [DD_MM_YYYY]
> Updated: [DD_MM_YYYY]

## Vision
[1-3 sentences: who the project serves, what problem it solves]

## Target Audience
- [Group 1]: [primary need]
- [Group 2]: [primary need]

## Constraints
[Technical, business, time, legal — or "No special constraints identified."]

## Language & Error Reporting Policy
- **UI:** [e.g., Vietnamese]
- **Logs:** [e.g., English]
- **Exceptions:** [e.g., English]
- **Notes:** [e.g., UI messages should be user-friendly, avoid complex technical jargon]

## Milestone History
| Version | Name | Completion Date | Summary |
|---------|------|-----------------|---------|
| v1.0 | [Name] | DD_MM_YYYY | [1 line: main features] |

## Lessons Learned
- [Lessons that influence future decisions]
```

## Update Rules

| When | Action |
|------|--------|
| Create new milestone | Add just-completed milestone to "History". Update "Vision" if direction changed |
| Close milestone | Add "History" + "Lessons Learned" if any |
| User requests | Update any section |

**DO NOT record:** phase/task details (→ ROADMAP/TASKS), state (→ STATE/CURRENT_MILESTONE), technical details (→ CONTEXT/SCAN_REPORT)
