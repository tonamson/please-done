<!-- Source version: 4.0.0 -->

[![English](https://img.shields.io/badge/lang-English-blue.svg)](onboard.md)
[![Tiếng Việt](https://img.shields.io/badge/lang-Tiếng%20Việt-red.svg)](onboard.vi.md)

# Skill: onboard

## Purpose

Orient AI to an unfamiliar codebase in a single command by analyzing project structure, tech stack, and key files to generate comprehensive context.

## When to Use

- **New codebase:** Starting work on a project you've just cloned or downloaded
- **Context refresh:** Returning to a project after a long break and need to recall structure
- **Multi-project switching:** Moving between multiple projects and need quick orientation
- **Pre-planning:** Before creating plans when you're unsure of project architecture
- **Team handoff:** Understanding a project maintained by another team

## Prerequisites

- [ ] Git repository initialized (detects `.git/` directory)
- [ ] Codebase has recognizable files (package.json, README, Cargo.toml, etc.)
- [ ] Project has source files to analyze

## Basic Command

```
/pd:onboard
```

**Example:**
```
/pd:onboard /path/to/project
```

**What it does:**
1. Analyzes directory structure (up to 3 levels deep)
2. Detects tech stack from config files
3. Identifies entry points (main, bin, exports)
4. Generates `.planning/CONTEXT.md` with findings
5. Displays formatted summary with next steps

## Common Flags

| Flag | Description | Example |
|------|-------------|---------|
| (path) | Optional path to project directory | `/pd:onboard ./my-project` |

## See Also

- [init](init.md) — Initialize new project structure
- [scan](scan.md) — Analyze codebase manually
- [status](../CLAUDE.md#pdstatus) — Check project status
- [Getting Started Guide](../workflows/getting-started.md) — First-time user workflow
