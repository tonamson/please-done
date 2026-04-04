# Skill: write-code

## Purpose

Execute all tasks in a phase plan with atomic commits, verification loops, and deviation handling to implement the planned changes.

## When to Use

- **Plan ready:** PLAN.md is ready and tasks need implementation
- **Tasks defined:** Tasks are clearly defined in TASKS.md with acceptance criteria
- **Implementation phase:** Ready to write code according to specifications
- **Specific wave:** Need to execute only a specific wave of tasks
- **Staged execution:** Breaking large phase into manageable execution chunks

## Prerequisites

- [ ] PLAN.md exists for the phase
- [ ] TASKS.md with defined tasks and acceptance criteria
- [ ] Context.md or research complete
- [ ] Git working tree clean (or committed)

## Basic Command

```
/pd:write-code
```

**Example:**
```
/pd:write-code --wave 2
```

**What it does:**
1. Loads PLAN.md and TASKS.md
2. Groups tasks into waves by dependencies
3. Executes tasks with atomic commits
4. Handles deviations with user confirmation
5. Updates task status as completed
6. Runs verification after each task

## Common Flags

| Flag | Description | Example |
|------|-------------|---------|
| `--wave N` | Execute only wave N | `/pd:write-code --wave 1` |
| `--skip-verify` | Skip verification step | `/pd:write-code --skip-verify` |
| `--task <id>` | Execute specific task | `/pd:write-code --task 3` |

## See Also

- [plan](plan.md) — Create the plan first
- [test](test.md) — Verify implementation
- [fix-bug](fix-bug.md) — Fix issues after writing
