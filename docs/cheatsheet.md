# Please Done Command Cheat Sheet

[![English](https://img.shields.io/badge/lang-English-blue.svg)](cheatsheet.md)
[![Tiếng Việt](https://img.shields.io/badge/lang-Tiếng%20Việt-red.svg)](cheatsheet.vi.md)

Quick reference for all 20 Please Done (PD) commands. Each command follows the `/pd:command` syntax with optional flags and arguments.

## How to Read This Cheat Sheet

- Commands are organized by category (Project, Planning, Execution, Debug, Utility)
- **Usage** column shows the syntax with optional `[--flags]` and required `--flag value` patterns
- **Example** column shows practical usage examples
- See [Legend](#legend) at the bottom for flag notation explanation

## Table of Contents

- [Project Commands](#project-commands) — 5 commands for project lifecycle
- [Planning Commands](#planning-commands) — 1 command for technical planning
- [Execution Commands](#execution-commands) — 2 commands for coding and testing
- [Debug Commands](#debug-commands) — 3 commands for debugging and analysis
- [Utility Commands](#utility-commands) — 9 commands for status and helpers
- [Popular Flags Reference](#popular-flags-reference) — Quick lookup of common flags
- [Legend](#legend) — Flag notation explained

---

## Project Commands

Manage project lifecycle from initialization to completion.

| Command | Usage | Example |
|---------|-------|---------|
| `/pd:onboard` | `/pd:onboard [path]` | `/pd:onboard ./my-project` |
| `/pd:init` | `/pd:init [--force]` | `/pd:init` |
| `/pd:scan` | `/pd:scan [--deep]` | `/pd:scan` |
| `/pd:new-milestone` | `/pd:new-milestone [version]` | `/pd:new-milestone v2.0` |
| `/pd:complete-milestone` | `/pd:complete-milestone` | `/pd:complete-milestone` |

**Notes:**
- `onboard`: Orient AI to unfamiliar codebase — creates `.planning/` with PROJECT.md, SCAN_REPORT.md, CONTEXT.md
- `init`: Initialize planning directory structure (onboard runs this internally)
- `scan`: Analyze codebase structure and create SCAN_REPORT.md
- `new-milestone`: Define requirements and create ROADMAP.md with phases
- `complete-milestone`: Finalize milestone and archive to `.planning/archive/`

---

## Planning Commands

Technical planning and research before writing code.

| Command | Usage | Example |
|---------|-------|---------|
| `/pd:plan` | `/pd:plan [--auto \| --discuss] [phase]` | `/pd:plan --auto 1.2` |

**Notes:**
- Creates RESEARCH.md, PLAN.md, and TASKS.md for the specified phase
- `--auto`: AI decides approach automatically (default)
- `--discuss`: Interactive discussion where user chooses approach
- Phase format: `1.2` = milestone 1, phase 2

---

## Execution Commands

Write code and run tests according to the plan.

| Command | Usage | Example |
|---------|-------|---------|
| `/pd:write-code` | `/pd:write-code [--wave N] [--skip-verify] [--auto \| --parallel]` | `/pd:write-code --wave 2` |
| `/pd:test` | `/pd:test [--coverage] [--watch]` | `/pd:test --coverage` |

**Notes:**
- `write-code`: Execute tasks from TASKS.md — requires PLAN.md and TASKS.md
  - `--wave N`: Execute only wave N of parallel tasks
  - `--skip-verify`: Skip verification steps
  - `--auto`: Execute all tasks sequentially
  - `--parallel`: Execute tasks in parallel using multiple agents
- `test`: Run test suite with optional coverage report
  - `--coverage`: Generate coverage report
  - `--watch`: Watch mode for continuous testing

---

## Debug Commands

Investigate bugs, audit code quality, and research solutions.

| Command | Usage | Example |
|---------|-------|---------|
| `/pd:fix-bug` | `/pd:fix-bug [description]` | `/pd:fix-bug "login fails with 500 error"` |
| `/pd:audit` | `/pd:audit [--security] [--performance]` | `/pd:audit --security` |
| `/pd:research` | `/pd:research [topic]` | `/pd:research "React Server Components"` |

**Notes:**
- `fix-bug`: Scientific bug investigation with hypothesis verification
  - Creates BUG_REPORT.md with reproduction steps and fix plan
- `audit`: Code quality and security analysis
  - `--security`: Security-focused audit with OWASP checks
  - `--performance`: Performance-focused audit
- `research`: Deep research on libraries, patterns, or technologies
  - Creates RESEARCH.md with findings and recommendations

---

## Utility Commands

Check status, view conventions, fetch docs, and get suggestions.

| Command | Usage | Example |
|---------|-------|---------|
| `/pd:status` | `/pd:status [--auto-refresh] [--refresh-threshold=N]` | `/pd:status --auto-refresh` |
| `/pd:conventions` | `/pd:conventions [language]` | `/pd:conventions typescript` |
| `/pd:fetch-doc` | `/pd:fetch-doc [library]` | `/pd:fetch-doc react` |
| `/pd:update` | `/pd:update [--check]` | `/pd:update` |
| `/pd:what-next` | `/pd:what-next` | `/pd:what-next` |
| `/pd:stats` | `/pd:stats [--json]` | `/pd:stats` |
| `/pd:health` | `/pd:health [--json]` | `/pd:health` |
| `/pd:discover` | `/pd:discover [--verbose] [--json]` | `/pd:discover` |
| `/pd:sync-version` | `/pd:sync-version [--check]` | `/pd:sync-version` |

**Notes:**
- `status`: Display project dashboard (milestone, phase, tasks, bugs)
  - `--auto-refresh`: Enable staleness detection
  - `--refresh-threshold=N`: Set custom threshold in minutes (default: 10)
- `conventions`: Show coding conventions for language or framework
- `fetch-doc`: Fetch current documentation for libraries (uses Context7 MCP)
- `update`: Update Please Done tooling to latest version
  - `--check`: Check for updates without installing
- `what-next`: Suggest next actions based on project state

---

## Popular Flags Reference

Quick lookup of flags that work across multiple commands.

| Flag | Description | Commands |
|------|-------------|----------|
| `--auto` | Auto-execute without prompts (AI decides) | `plan`, `write-code` |
| `--discuss` | Interactive mode with user decisions | `plan` |
| `--wave N` | Execute specific wave only | `write-code` |
| `--skip-research` | Skip research phase | `plan`, `write-code` |
| `--skip-verify` | Skip verification steps | `write-code` |
| `--parallel` | Execute tasks in parallel | `write-code` |
| `--resume` | Resume from interruption point | `write-code` |
| `--auto-refresh` | Enable auto-refresh detection | `status` |
| `--refresh-threshold=N` | Set staleness threshold (minutes) | `status` |
| `--coverage` | Generate coverage report | `test` |
| `--watch` | Watch mode for continuous testing | `test` |
| `--security` | Security-focused audit | `audit` |
| `--performance` | Performance-focused audit | `audit` |
| `--force` | Force operation without prompts | `init` |
| `--deep` | Deep analysis mode | `scan` |
| `--check` | Check only, don't apply changes | `update` |

---

## Legend

Understanding the flag notation used in the Usage column:

- `[--flag]` — **Optional flag**: Square brackets indicate the flag is optional
- `--flag value` — **Required value**: The flag requires a value after it
- `[value]` — **Optional argument**: The argument can be omitted
- `\|` — **Or**: Pipe character separates mutually exclusive options
- `command \| command` — Choose one of the options (e.g., `--auto \| --discuss`)

### Common Patterns

```
/pd:plan [--auto \| --discuss] [phase]
         ^^^^^^^^^^^^^^^^^^^^^  ^^^^^^
         Optional flags           Optional argument
         (choose one or none)     (defaults to current phase)
```

### Value Types

| Pattern | Meaning | Example |
|---------|---------|---------|
| `[path]` | Optional path to project directory | `/pd:onboard ./my-project` |
| `[version]` | Version string (e.g., v2.0) | `/pd:new-milestone v2.0` |
| `[phase]` | Phase identifier (e.g., 1.2) | `/pd:plan 2.1` |
| `[N]` | Number (e.g., wave number) | `/pd:write-code --wave 2` |
| `[description]` | Text description | `/pd:fix-bug "error message"` |
| `[topic]` | Research topic | `/pd:research "React hooks"` |
| `[language]` | Programming language | `/pd:conventions typescript` |
| `[library]` | Library or framework name | `/pd:fetch-doc react` |

---

## Command Count Summary

| Category | Commands | Count |
|----------|----------|-------|
| Project | onboard, init, scan, new-milestone, complete-milestone | 5 |
| Planning | plan | 1 |
| Execution | write-code, test | 2 |
| Debug | fix-bug, audit, research | 3 |
| Utility | status, conventions, fetch-doc, update, what-next, stats, health, discover, sync-version | 9 |
| **Total** | | **20** |

---

*Last updated: 2026-04-04*
