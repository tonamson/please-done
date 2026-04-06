# Skill: what-next

## Purpose

Suggest the next logical action based on current project state, available tasks, workflow progress, and pending work. With `--execute`, automatically invoke the suggested command.

## When to Use

- **Unsure:** Unsure what to do next in the workflow
- **Session start:** Starting a new session and need guidance on first action
- **Stuck:** Between tasks or at decision point
- **Workflow:** Need guidance on workflow progression
- **New user:** Learning the command patterns and available options
- **Return after break:** Coming back to project after time away
- **Auto-advance:** Want to immediately execute the next step without manual confirmation

## Prerequisites

- [ ] None — analyzes current state automatically and suggests accordingly

## Basic Command

```
/pd:what-next
```

**Example:**
```
/pd:what-next
```

**What it suggests:**
1. Next task from current plan if available
2. Command to execute with arguments
3. Prerequisites if any are required
4. Alternative actions when blocked
5. Context for making decision

## Auto-Execute Mode

```
/pd:what-next --execute
```

**What it does:**
1. Scans project state (same as advisory mode)
2. Displays progress report for transparency
3. Immediately invokes the suggested command

**Use when:** You want zero-friction workflow advancement — the command decides and acts.

## Common Flags

| Flag | Description | Example |
|------|-------------|---------|
| `--execute` | Auto-execute the suggested command | `/pd:what-next --execute` |
| `--text` | Plain text output without formatting | `/pd:what-next --text` |

## See Also

- [status](status.md) — Check current state before deciding
- [plan](plan.md) — Plan next phase if no tasks available
- [write-code](write-code.md) — Execute current task if one exists
- [Getting Started Guide](../workflows/getting-started.md) — First steps for new users
