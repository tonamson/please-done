# STATE.md Template

> `/pd:new-milestone` creates/resets | `/pd:plan`, `/pd:write-code`, `/pd:complete-milestone` update | `/pd:plan`, `/pd:what-next` read

Current working state: position, last activity, accumulated context, blockers.

- `CURRENT_MILESTONE.md` = small pointer (4 fields) — @templates/current-milestone.md
- `STATE.md` = detailed state + accumulated context

## Template

```markdown
# Working State
> Updated: [DD_MM_YYYY]

## Current Position
- Milestone: v[X.Y] — [Milestone name]
- Phase: [Not started | x.x]
- Plan: [— | Plan complete, ready to code | Coding in progress]
- Status: [Ready to plan | In progress | Milestone v[X.Y] completed]
- Last activity: [DD_MM_YYYY] — [brief description]

## Accumulated Context
[Previous milestone → keep valuable context. First milestone → "No accumulated context yet."]

## Blockers
[None | Blocker description]
```

## Update Rules

| When | Action |
|------|--------|
| Create new milestone | Reset, **KEEP** "Accumulated Context" |
| Start milestone | `Last activity: [date] — Started new milestone` |
| Research complete | `Last activity: [date] — Research completed` |
| Requirements approved | `Last activity: [date] — v[X.Y] requirements approved` |
| Roadmap approved | `Last activity: [date] — v[X.Y] roadmap approved` |
| Phase plan complete | Phase → [x.x], Plan → `ready to code` |
| Start coding | Plan → `Coding in progress` |
| Phase complete | `Last activity: [date] — Phase [x.x] completed` |
| Auto-advance | Phase → [new], Plan → `ready to code` (sync CURRENT_MILESTONE) |
| Close milestone | Status → `Milestone v[X.Y] completed` |

**"Accumulated Context" is NEVER wiped clean** — only appended to or kept as-is.
