# Command `pd status`

## Purpose

Display a read-only 8-field project status dashboard. Does not modify any files or suggest next steps — purely informational.

## Arguments

| Argument | Required | Description |
|----------|----------|-------------|
| (none) | — | No arguments needed |

## How It Works

1. **Read planning files:** Load STATE.md, CURRENT_MILESTONE.md, TASKS.md, PROGRESS.md
2. **Check git log:** Get last commit hash and message
3. **Count bugs:** Glob `.planning/bugs/BUG_*.md` for unresolved issues
4. **Display dashboard:** Print 8 fields in formatted output

## When to run this command?

- Quick check of project state without suggestions
- Before starting work to see current milestone/phase
- After completing tasks to verify progress recorded
- When you need status without the overhead of `what-next`

## Output

- No files created or modified (read-only command)
- 8-line formatted dashboard displayed to console:
  1. **Milestone** — Current milestone name
  2. **Phase** — Current phase number and name
  3. **Plan** — Current plan being executed
  4. **Tasks** — Task completion status (e.g., 2/5)
  5. **Bugs** — Count of unresolved bugs
  6. **Lint** — Lint status or "✓ no active task"
  7. **Blockers** — Any blocking issues
  8. **Last commit** — Most recent commit hash and message

## Examples

```bash
pd status                   # Display 8-field dashboard
```

***

**Next step:** [pd what-next](what-next.md) for actionable suggestions based on current status.
