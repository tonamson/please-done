# Skill: init

## Purpose

Initialize the GSD planning structure (`.planning/` directory) in an existing codebase to enable milestone planning and phase tracking.

## When to Use

- **New project setup:** Setting up PD/GSD workflow in a project for the first time
- **Fresh start:** First time using planning tools in a codebase
- **Post-clone:** After cloning a repo that doesn't have `.planning/` directory
- **Pre-milestone:** Before creating milestones or phases
- **Tool adoption:** When team decides to adopt structured planning workflow

## Prerequisites

- [ ] Git repository initialized with `git init`
- [ ] Project root directory accessible
- [ ] No existing `.planning/` directory (or use `--force` to overwrite)
- [ ] Write permissions in project directory

## Basic Command

```
/pd:init
```

**Example:**
```
/pd:init
```

**What it creates:**
- `.planning/` directory structure
- `PROJECT.md` — Project vision and scope
- `ROADMAP.md` — Milestone tracking
- `STATE.md` — Current state tracking
- `REQUIREMENTS.md` — Placeholder for requirements

## Common Flags

| Flag | Description | Example |
|------|-------------|---------|
| `--force` | Overwrite existing `.planning/` | `/pd:init --force` |
| `--skip-verify` | Skip verification prompts | `/pd:init --skip-verify` |

## See Also

- [onboard](onboard.md) — Complete project orientation with context
- [new-milestone](new-milestone.md) — Create first milestone after init
- [plan](plan.md) — Create phase plans
- [Getting Started Guide](../workflows/getting-started.md) — Full onboarding workflow
