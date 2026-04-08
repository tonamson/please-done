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

- [Project Commands](#project-commands) — 6 commands for project lifecycle
- [Planning Commands](#planning-commands) — 4 commands for technical planning and research
- [Execution Commands](#execution-commands) — 2 commands for coding and testing
- [Debug Commands](#debug-commands) — 3 commands for debugging and analysis
- [Utility Commands](#utility-commands) — 5 commands for status and helpers
- [Popular Flags Reference](#popular-flags-reference) — Quick lookup of common flags
- [Legend](#legend) — Flag notation explained

---

## Project Commands

Manage project lifecycle from initialization to completion.

| Command | Usage | Example |
|---------|-------|---------|
| `/pd:onboard` | `/pd:onboard [path]` | `/pd:onboard ./my-project` |
| `/pd:init` | `/pd:init [project path]` | `/pd:init` |
| `/pd:scan` | `/pd:scan [project path]` | `/pd:scan` |
| `/pd:new-milestone` | `/pd:new-milestone [milestone name] [--reset-phase-numbers]` | `/pd:new-milestone v2.0` |
| `/pd:complete-milestone` | `/pd:complete-milestone` | `/pd:complete-milestone` |
| `/pd:sync-version` | `/pd:sync-version [--check]` | `/pd:sync-version` |

**Notes:**
- `onboard`: Orient AI to unfamiliar codebase — creates `.planning/` with PROJECT.md, SCAN_REPORT.md, CONTEXT.md
- `init`: Initialize planning directory structure (onboard runs this internally)
- `scan`: Analyze codebase structure and create SCAN_REPORT.md
- `new-milestone`: Define requirements and create ROADMAP.md with phases
- `complete-milestone`: Finalize milestone and archive to `.planning/archive/`
- `sync-version`: Sync version from package.json across README badges and doc headers

---

## Planning Commands

Technical planning, research, and documentation before writing code.

| Command | Usage | Example |
|---------|-------|---------|
| `/pd:plan` | `/pd:plan [--auto \| --discuss] [phase]` | `/pd:plan --auto 1.2` |
| `/pd:research` | `/pd:research [research topic]` | `/pd:research "React Server Components"` |
| `/pd:fetch-doc` | `/pd:fetch-doc <URL> [custom-name]` | `/pd:fetch-doc https://docs.nestjs.com/guards` |
| `/pd:update` | `/pd:update [--check \| --apply]` | `/pd:update --apply` |

**Notes:**
- `plan`: Creates RESEARCH.md, PLAN.md, and TASKS.md for the specified phase
  - `--auto`: AI decides approach automatically (default)
  - `--discuss`: Interactive discussion where user chooses approach
  - Phase format: `1.2` = milestone 1, phase 2
- `research`: Deep research on libraries, patterns, or technologies — creates RESEARCH.md
- `fetch-doc`: Download documentation from a URL and cache locally in `.planning/docs/`
  - Requires a valid `http://` or `https://` URL
  - Optional `[custom-name]` sets the output filename
- `update`: Check for a new version of the skill set on GitHub
  - `--check`: Check for updates without installing
  - `--apply`: Download and apply the update

---

## Execution Commands

Write code and run tests according to the plan.

| Command | Usage | Example |
|---------|-------|---------|
| `/pd:write-code` | `/pd:write-code [task number] [--auto \| --parallel \| --resume]` | `/pd:write-code --auto` |
| `/pd:test` | `/pd:test [--all \| --standalone [path]]` | `/pd:test --all` |

**Notes:**
- `write-code`: Execute tasks from TASKS.md — requires PLAN.md and TASKS.md
  - `[task number]`: Execute a specific task only
  - `--auto`: Execute all tasks sequentially
  - `--parallel`: Execute tasks in parallel using multiple agents
  - `--resume`: Resume from interruption point
- `test`: Write and run tests for the current stack (Jest/PHPUnit/Hardhat/Flutter)
  - `--all`: Run the full test suite
  - `--standalone [path]`: Run tests for a specific file or directory

---

## Debug Commands

Investigate bugs, view discussion history, and analyze code conventions.

| Command | Usage | Example |
|---------|-------|---------|
| `/pd:fix-bug` | `/pd:fix-bug [description]` | `/pd:fix-bug "login fails with 500 error"` |
| `/pd:audit` | `/pd:audit [--phase N] [--search keyword] [--view N]` | `/pd:audit --phase 145` |
| `/pd:conventions` | `/pd:conventions` | `/pd:conventions` |

**Notes:**
- `fix-bug`: Scientific bug investigation with hypothesis verification
  - Creates BUG_REPORT.md with reproduction steps and fix plan
- `audit`: View and search discussion context audit trail (read-only)
  - `--phase N`: Show contexts for a specific phase
  - `--search keyword`: Filter by keyword in decisions
  - `--view N`: Display full context summary for phase N
- `conventions`: Analyze the project and create CLAUDE.md with project-specific coding conventions

---

## Utility Commands

Check status and get suggestions.

| Command | Usage | Example |
|---------|-------|---------|
| `/pd:status` | `/pd:status [--auto-refresh] [--refresh-threshold=N]` | `/pd:status --auto-refresh` |
| `/pd:what-next` | `/pd:what-next [--execute]` | `/pd:what-next` |
| `/pd:stats` | `/pd:stats [--json]` | `/pd:stats` |
| `/pd:health` | `/pd:health [--json]` | `/pd:health` |
| `/pd:discover` | `/pd:discover [--verbose] [--json]` | `/pd:discover` |

**Notes:**
- `status`: Display project dashboard (milestone, phase, tasks, bugs)
  - `--auto-refresh`: Enable staleness detection
  - `--refresh-threshold=N`: Set custom threshold in minutes (default: 10)
- `what-next`: Suggest next actions based on project state
  - `--execute`: Automatically execute the suggested next step
- `stats`: Comprehensive project statistics (phases, plans, requirements, timeline)
- `health`: Diagnose planning directory issues — missing files, STATE.md validation
- `discover`: Discover MCP tools and built-in tools across configured platforms

---

## Popular Flags Reference

Quick lookup of flags that work across multiple commands.

| Flag | Description | Commands |
|------|-------------|----------|
| `--auto` | Auto-execute without prompts (AI decides) | `plan`, `write-code` |
| `--discuss` | Interactive mode with user decisions | `plan` |
| `--skip-research` | Skip research phase | `plan` |
| `--auto-refresh` | Enable auto-refresh detection | `status` |
| `--refresh-threshold=N` | Set staleness threshold (minutes) | `status` |
| `--resume` | Resume from interruption point | `write-code` |
| `--parallel` | Execute tasks in parallel | `write-code` |
| `--all` | Run full test suite | `test` |
| `--check` | Check only, don't apply changes | `update`, `sync-version` |
| `--apply` | Download and apply changes | `update` |
| `--reset-phase-numbers` | Reset phase numbers on new milestone | `new-milestone` |
| `--json` | Output as machine-readable JSON | `stats`, `health`, `discover`, `audit` |
| `--verbose` | Detailed output | `discover` |
| `--execute` | Auto-execute the suggested next step | `what-next` |

---

## Legend

Understanding the flag notation used in the Usage column:

- `[--flag]` — **Optional flag**: Square brackets indicate the flag is optional
- `--flag value` — **Required value**: The flag requires a value after it
- `[value]` — **Optional argument**: The argument can be omitted
- `<value>` — **Required argument**: Angle brackets indicate the argument is required
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
| `[N]` | Number (e.g., phase number) | `/pd:audit --phase 145` |
| `[description]` | Text description | `/pd:fix-bug "error message"` |
| `[topic]` | Research topic | `/pd:research "React hooks"` |
| `<URL>` | Required URL (must include http/https) | `/pd:fetch-doc https://docs.nestjs.com` |

---

## Command Count Summary

| Category | Commands | Count |
|----------|----------|-------|
| Project | onboard, init, scan, new-milestone, complete-milestone, sync-version | 6 |
| Planning | plan, research, fetch-doc, update | 4 |
| Execution | write-code, test | 2 |
| Debug | fix-bug, audit, conventions | 3 |
| Utility | status, what-next, stats, health, discover | 5 |
| **Total** | | **20** |

---

*Last updated: 2026-04-08*
