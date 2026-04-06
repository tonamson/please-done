<!-- Source version: 4.0.0 -->

[![English](https://img.shields.io/badge/lang-English-blue.svg)](conventions.md)
[![Tiếng Việt](https://img.shields.io/badge/lang-Tiếng%20Việt-red.svg)](conventions.vi.md)

# Skill: conventions

## Purpose

Show coding conventions and patterns for the current codebase to ensure your code matches existing style and patterns.

## When to Use

- **Style guide:** Need to understand code style before writing
- **Contributing:** Contributing to unfamiliar codebase
- **New code:** Writing new code to match existing patterns
- **Code review:** Reviewing code for consistency with conventions
- **Team onboarding:** Learning project conventions as new team member
- **Refactoring:** Ensuring refactored code follows conventions

## Prerequisites

- [ ] Codebase analyzed (run scan or onboard first)
- [ ] `.planning/` directory exists
- [ ] Read access to existing code

## Basic Command

```
/pd:conventions
```

**Example:**
```
/pd:conventions --pattern naming
```

**What it shows:**
1. Naming conventions used in the project
2. Code structure patterns and organization
3. Import/require patterns for dependencies
4. Error handling patterns and approaches
5. Testing conventions and expectations

## Common Flags

| Flag | Description | Example |
|------|-------------|---------|
| `--pattern <type>` | Show specific pattern type | `/pd:conventions --pattern functions` |
| `--rules` | Show all rules | `/pd:conventions --rules` |

## See Also

- [onboard](onboard.md) — Get full project context
- [scan](scan.md) — Analyze codebase patterns
- [write-code](write-code.md) — Apply conventions when writing
