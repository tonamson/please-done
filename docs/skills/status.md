<!-- Source version: 4.0.0 -->

[![English](https://img.shields.io/badge/lang-English-blue.svg)](status.md)
[![Tiếng Việt](https://img.shields.io/badge/lang-Tiếng%20Việt-red.svg)](status.vi.md)

# Skill: status

## Purpose

Display read-only project status dashboard showing current phase, tasks, and next actions without modifying any files.

## When to Use

- **Quick overview:** Check current project state quickly without side effects
- **Decision making:** Before deciding next action, understand current context
- **No-op check:** Quick status check without modifying anything
- **Session start:** After returning from break to understand where you left off
- **Progress tracking:** Monitor milestone progress and task completion

## Prerequisites

- [ ] None — can run anytime, even without `.planning/` directory

## Basic Command

```
/pd:status
```

**Example:**
```
/pd:status --auto-refresh
```

**What it displays:**
1. Current milestone and active phase
2. Task completion status (X/Y completed)
3. Bug count and recent errors if any
4. Blocking issues that need attention
5. Last commit information
6. Staleness indicator for data freshness

## Common Flags

| Flag | Description | Example |
|------|-------------|---------|
| `--auto-refresh` | Enable staleness detection | `/pd:status --auto-refresh` |
| `--refresh-threshold N` | Set threshold in minutes | `/pd:status --refresh-threshold 5` |

## See Also

- [what-next](what-next.md) — Get suggested next action
- [onboard](onboard.md) — Re-orient to project if status shows new project
- [plan](plan.md) — Create new plan if no active phase
