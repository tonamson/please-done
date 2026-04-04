# Skill Reference Cards

Quick reference cards for all 16 Please Done skills with concise, scannable documentation.

Each card includes: **Purpose** → **When to use** → **Prerequisites** → **Basic command** → **Common flags** → **See also**

---

## Core Skills

Entry points for orienting AI and setting up planning structure. Use these to get started with a codebase.

| Skill | Description | Quick Command |
|-------|-------------|---------------|
| [onboard](onboard.md) | Orient AI to codebase | `/pd:onboard` |
| [init](init.md) | Initialize planning structure | `/pd:init` |
| [scan](scan.md) | Analyze codebase | `/pd:scan` |
| [plan](plan.md) | Create phase plans | `/pd:plan --auto 1.1` |

---

## Project Skills

Lifecycle management for milestones and code execution. Use these to plan, execute, and complete work.

| Skill | Description | Quick Command |
|-------|-------------|---------------|
| [new-milestone](new-milestone.md) | Create milestone | `/pd:new-milestone v2.0` |
| [write-code](write-code.md) | Execute tasks | `/pd:write-code` |
| [test](test.md) | Run tests | `/pd:test --coverage` |
| [fix-bug](fix-bug.md) | Debug and fix | `/pd:fix-bug "issue"` |
| [complete-milestone](complete-milestone.md) | Finalize milestone | `/pd:complete-milestone` |

---

## Debug Skills

Investigation and research capabilities. Use these to understand code, find bugs, and research technologies.

| Skill | Description | Quick Command |
|-------|-------------|---------------|
| [audit](audit.md) | Security/code audits | `/pd:audit --security` |
| [research](research.md) | Technical research | `/pd:research "topic"` |

---

## Utility Skills

Status, conventions, and maintenance tools. Use these for quick checks and maintenance.

| Skill | Description | Quick Command |
|-------|-------------|---------------|
| [status](status.md) | Project status | `/pd:status` |
| [what-next](what-next.md) | Suggest next action | `/pd:what-next` |
| [conventions](conventions.md) | Code patterns | `/pd:conventions` |
| [fetch-doc](fetch-doc.md) | Get documentation | `/pd:fetch-doc lib` |
| [update](update.md) | Update tooling | `/pd:update` |

---

## Full Documentation

- [Command Reference](../CLAUDE.md) — Complete command documentation
- [Cheatsheet](../cheatsheet.md) — Quick command reference
- [Workflow Guides](../workflows/) — Step-by-step workflows
- [Error Troubleshooting](../error-troubleshooting.md) — Debug common errors

---

## Common Usage Pattern

```
# Start here — orient to codebase
/pd:onboard

# Check status anytime — read-only, safe
/pd:status

# Get guidance when unsure
/pd:what-next

# Plan and execute work
/pd:plan --auto 1.1
/pd:write-code

# Verify and complete
/pd:test
/pd:complete-milestone
```

---

## Skill Categories by Use Case

**Getting Started:** onboard → init → scan → new-milestone  
**Daily Development:** status → what-next → plan → write-code → test  
**Debugging:** fix-bug → test → audit  
**Research:** research → fetch-doc → plan  
**Maintenance:** update → conventions → audit
