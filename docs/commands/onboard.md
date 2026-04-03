# Command `pd onboard`

## Purpose

Orient AI to an unfamiliar codebase with a single command — initialize planning structure, scan code, analyze git history, and create a ready-to-use `.planning/` directory. Fully automated with no user prompts.

## Arguments

| Argument | Required | Description |
|----------|----------|-------------|
| `path` | No | Project path to onboard (default: current directory) |

## How It Works

1. **Run init:** Call `/pd:init` internally to create `.planning/` structure and detect tech stack
2. **Run scan:** Call `/pd:scan` internally to analyze codebase and create scan report
3. **Analyze git history:** Extract project vision and patterns from commit history
4. **Create PROJECT.md:** Generate project baseline with vision, tech stack, language policy
5. **Create planning files:** Set up ROADMAP.md, STATE.md, REQUIREMENTS.md with initial templates

## When to run this command?

- First time working with a new codebase
- After cloning a repo that doesn't have `.planning/`
- To quickly orient AI before starting development
- When you want init + scan + project setup in one command

## Output

- `.planning/CONTEXT.md` — Project context (via init)
- `.planning/rules/*.md` — Framework-specific rules (via init)
- `.planning/scan/SCAN_REPORT.md` — Code analysis report (via scan)
- `.planning/PROJECT.md` — Vision, tech stack, language policy
- `.planning/ROADMAP.md` — Initial roadmap with v1.0 placeholder
- `.planning/CURRENT_MILESTONE.md` — Pointer to v1.0
- `.planning/STATE.md` — Initial working state
- `.planning/REQUIREMENTS.md` — Requirements placeholder

## Examples

```bash
pd onboard                  # Onboard current directory
pd onboard ~/projects/myapp # Onboard specific project
```

***

**Next step:** [pd new-milestone](new-milestone.md) to define v1.0 requirements, or [pd plan](plan.md) if requirements are already known.
