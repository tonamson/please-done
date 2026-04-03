# Command `pd conventions`

## Purpose

Analyze the project codebase to detect coding conventions, ask about user preferences, and create or update `CLAUDE.md` with project-specific style guidelines.

## Arguments

| Argument | Required | Description |
|----------|----------|-------------|
| (none) | — | No arguments needed |

## How It Works

1. **Scan codebase:** Analyze source files to detect existing patterns (naming, formatting, imports)
2. **Identify conventions:** Extract coding style, architecture patterns, and common practices
3. **Ask user preferences:** Prompt for preferences not detectable from code (e.g., commit message style)
4. **Generate CLAUDE.md:** Create or update the conventions file at repo root

## When to run this command?

- When starting work on an existing codebase
- After onboarding to capture project conventions
- When team conventions have changed and need documentation
- Before `/pd:plan` to ensure code follows project style

## Output

- `CLAUDE.md` — Project coding conventions file at repo root
  - Code Style section (formatting, quotes, indentation)
  - Architecture section (state management, CSS approach, API patterns)
  - Do / Don't section (project-specific recommendations)

## Examples

```bash
pd conventions              # Analyze project and create CLAUDE.md
```

***

**Next step:** [pd plan](plan.md) or [pd write-code](write-code.md) to start coding with detected conventions.
