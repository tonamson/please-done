# Skill: plan

## Purpose

Create executable phase plans with tasks, dependencies, and verification criteria that guide implementation from requirements to completion.

## When to Use

- **Implementation planning:** Starting implementation of a new requirement or feature
- **Task breakdown:** Breaking down a feature into actionable, trackable tasks
- **Clarification needed:** Need clear roadmap for execution with specific steps
- **Post-research:** After research phase to formalize technical approach
- **Complex features:** When requirements need detailed implementation planning

## Prerequisites

- [ ] Milestone defined with REQUIREMENTS.md
- [ ] Context gathered via discuss-phase or --prd
- [ ] Understanding of scope and constraints
- [ ] Research completed (if needed)

## Basic Command

```
/pd:plan --auto <phase_number>
```

**Example:**
```
/pd:plan --auto 1.1
```

**What it creates:**
1. RESEARCH.md (if --research flag used)
2. PLAN.md with tasks and dependencies
3. TASKS.md with executable checklist
4. Plan-check report for verification

## Common Flags

| Flag | Description | Example |
|------|-------------|---------|
| `--auto` | AI decides approach automatically | `/pd:plan --auto 1.1` |
| `--discuss` | Interactive discussion mode | `/pd:plan --discuss 1.1` |
| `--research` | Include research phase | `/pd:plan --research 1.1` |
| `--skip-research` | Skip research phase | `/pd:plan --skip-research 1.1` |

## See Also

- [write-code](write-code.md) — Execute planned tasks
- [research](research.md) — Research before planning
- [new-milestone](new-milestone.md) — Create milestone first
