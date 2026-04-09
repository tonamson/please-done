<!-- generated-by: gsd-doc-writer -->
# Development Guide

This guide covers everything a contributor needs to develop, test, and extend **please-done** — the cross-platform AI coding skills CLI.

---

## Table of Contents

1. [Local Setup](#local-setup)
2. [Project Structure](#project-structure)
3. [Build Commands](#build-commands)
4. [Adding a New Skill](#adding-a-new-skill)
5. [Adding a New Runtime Platform](#adding-a-new-runtime-platform)
6. [Running Tests](#running-tests)
7. [Code Style and Conventions](#code-style-and-conventions)
8. [Version Bumping](#version-bumping)
9. [Branch and PR Workflow](#branch-and-pr-workflow)

---

## Local Setup

### Prerequisites

- **Node.js** `>= 16.7.0` (check with `node --version`)
- **npm** (bundled with Node.js)
- At least one supported AI runtime installed locally to test installs against (Claude Code, Codex CLI, Gemini CLI, etc.)

### Clone and Install

```bash
git clone https://github.com/tonamson/please-done.git
cd please-done
npm install
```

### Run the Installer Locally

Use `node bin/install.js` directly with any platform flag instead of `npx please-done`. This runs from source without packaging.

```bash
# Install skills for Claude Code (from local source)
node bin/install.js --claude

# Install for Codex CLI
node bin/install.js --codex

# Install for all platforms at once
node bin/install.js --all

# Install to the current project directory only (instead of global ~/)
node bin/install.js --claude --local

# Uninstall from a platform
node bin/install.js --uninstall --gemini
```

The corresponding `npm run` aliases also work and invoke the same entry point:

```bash
npm run install:claude
npm run install:codex
npm run install:all
```

---

## Project Structure

```
please-done/
├── bin/
│   ├── install.js              # CLI entry point — arg parsing, orchestration
│   ├── sync-instructions.js    # Syncs AGENTS.md across runtime formats (postinstall)
│   ├── log-writer.js           # Standalone log writer binary
│   ├── route-query.js          # Query router binary
│   └── lib/
│       ├── platforms.js        # Platform registry (PLATFORMS map, getGlobalDir, etc.)
│       ├── utils.js            # Shared utilities: frontmatter parsing, file hashing, logging
│       ├── manifest.js         # Install manifest read/write and version tracking
│       ├── prompt.js           # Interactive prompts for runtime/location selection
│       ├── error-classifier.js # Error classification and messaging
│       ├── installers/         # Per-platform install logic
│       │   ├── claude.js
│       │   ├── codex.js
│       │   ├── gemini.js
│       │   ├── opencode.js
│       │   └── copilot.js
│       ├── converters/         # Skill transpilers: Claude → each platform format
│       │   ├── base.js         # Shared conversion pipeline
│       │   ├── codex.js
│       │   ├── gemini.js
│       │   ├── opencode.js
│       │   └── copilot.js
│       └── ...                 # Other lib modules (health-checker, log-manager, etc.)
├── commands/
│   └── pd/                     # All skill definitions (source of truth — Claude format)
│       ├── init.md
│       ├── fix-bug.md
│       ├── write-code.md
│       ├── ...
│       ├── agents/             # Sub-agent skill definitions
│       └── rules/              # Stack-specific coding rules (nestjs.md, nextjs.md, etc.)
├── workflows/                  # Workflow files referenced by skills via @workflows/
├── references/                 # Guard and reference files cited inside skill bodies
├── templates/                  # Template files used during install
├── lib/                        # Root-level helper modules (doc-link-mapper, etc.)
├── scripts/                    # Developer utility scripts (count-tokens.js, etc.)
├── test/                       # All tests
│   ├── smoke/                  # Smoke tests — fast, no network, test module contracts
│   ├── integration/            # Integration tests — multi-module workflows
│   └── *.test.js               # Top-level test files
├── evals/                      # Evaluation suite (promptfoo-based)
├── docs/                       # Project documentation
├── VERSION                     # Single source of truth for current version string
├── CHANGELOG.md                # Release history (manual, per bump guide)
└── package.json
```

### Key Architectural Principle

Skills are **written once in Claude Code format** (`commands/pd/*.md`) and **transpiled at install time** into each platform's native format. The converter pipeline in `bin/lib/converters/base.js` handles YAML/TOML frontmatter reformatting, tool name remapping, and command reference rewriting.

---

## Build Commands

| Command | Description |
|---------|-------------|
| `npm run install:claude` | Install skills for Claude Code |
| `npm run install:codex` | Install skills for Codex CLI |
| `npm run install:gemini` | Install skills for Gemini CLI |
| `npm run install:opencode` | Install skills for OpenCode |
| `npm run install:copilot` | Install skills for GitHub Copilot |
| `npm run install:all` | Install for all platforms |
| `npm run uninstall:claude` | Uninstall from Claude Code |
| `npm run sync` | Sync AGENTS.md across runtimes (runs automatically on `npm install`) |
| `npm test` | Run the full test suite |
| `npm run test:smoke` | Run smoke tests only |
| `npm run test:integration` | Run integration tests only |
| `npm run test:coverage` | Run tests with c8 coverage report |
| `npm run eval` | Run the promptfoo evaluation suite |

---

## Adding a New Skill

Skills live in `commands/pd/` as Markdown files with YAML frontmatter. All skills are authored in Claude Code format and automatically transpiled to other platforms at install time.

### Step 1 — Create the skill file

Create `commands/pd/my-skill.md`:

```markdown
---
name: pd:my-skill
description: One-line description shown in the runtime's command palette
model: sonnet
argument-hint: "[optional argument description]"
allowed-tools:
  - Read
  - Write
  - Bash
  - Glob
  - Grep
---

<objective>
What this skill achieves in plain language.
</objective>

<guards>
Stop and instruct the user if any of the following conditions fail:

- [ ] `.planning/` directory exists -> "Run /pd:init first."
</guards>

<context>
User input: $ARGUMENTS
</context>

<process>
Step-by-step instructions for the AI agent.
</process>

<output>
What the skill produces and where it writes it.
</output>
```

**Frontmatter fields:**

| Field | Required | Description |
|-------|----------|-------------|
| `name` | Yes | Command identifier, always prefixed `pd:` |
| `description` | Yes | Shown in command palette; keep under 80 chars |
| `model` | Yes | `haiku` (fast, read-only tasks), `sonnet` (most tasks) |
| `argument-hint` | No | Displayed to user as usage hint |
| `allowed-tools` | Yes | Explicit tool allowlist — only list what the skill needs |

### Step 2 — Verify transpilation

Run the all-platforms smoke test to confirm the new skill installs correctly across every runtime:

```bash
node --test test/smoke-all-platforms.test.js
```

### Step 3 — Update AGENTS.md

Add the new command to the relevant table in `AGENTS.md` so it appears in runtime-synced instruction files.

---

## Adding a New Runtime Platform

Supporting a new AI runtime requires changes in four places.

### 1 — Register in `bin/lib/platforms.js`

Add a `TOOL_MAP` entry (if the platform uses non-standard tool names) and a `PLATFORMS` entry:

```js
// In TOOL_MAP:
mynewruntime: {
  Read: 'read_file',     // map only tools whose names differ from Claude
  Bash: 'run_command',
  // ... omit tools that match Claude names exactly
},

// In PLATFORMS:
mynewruntime: {
  name: 'My New Runtime',
  description: 'Short description',
  dirName: '.mynewruntime',           // config directory name under ~/
  commandPrefix: '/pd:',              // how skills are invoked
  commandSeparator: ':',
  envVar: 'MYNEWRUNTIME_CONFIG_DIR',  // env var to override install dir
  skillFormat: 'nested',             // 'nested' | 'flat' | 'skill-dir'
  frontmatterFormat: 'yaml',         // 'yaml' | 'toml'
  toolMap: TOOL_MAP.mynewruntime,
},
```

Also add a `case 'mynewruntime':` branch in `getGlobalDir()` with the default install path.

**`skillFormat` values:**

| Value | Output layout |
|-------|---------------|
| `nested` | `commands/pd/*.md` (mirrors Claude format) |
| `flat` | `command/pd-*.md` (flat file per skill) |
| `skill-dir` | `skills/pd-[name]/SKILL.md` (one directory per skill) |

### 2 — Create an installer in `bin/lib/installers/mynewruntime.js`

Follow the pattern of an existing installer (e.g., `opencode.js`). The installer must:

- Accept `(skillsDir, targetDir, options)` as its `install(...)` signature
- Use `log.step(N, TOTAL, msg)` for progress output
- Copy or convert skill files using the converter for this runtime
- Write a manifest with `writeManifest(targetDir, version, files)` on success

### 3 — Create a converter in `bin/lib/converters/mynewruntime.js`

Delegate to the shared pipeline in `base.js`:

```js
'use strict';
const { convertSkill: baseConvert } = require('./base');

function convertSkill(content, skillsDir) {
  return baseConvert(content, {
    runtime: 'mynewruntime',
    skillsDir,
    // Override specific pipeline steps as needed:
    // buildFrontmatter, postProcess, mcpToolConvert, etc.
  });
}

module.exports = { convertSkill };
```

### 4 — Wire into `bin/install.js`

Add the new runtime's `case` to the `switch` statement in `install.js` that dispatches to the correct installer module.

### 5 — Add smoke tests

Create `test/smoke-installers.test.js` coverage for the new platform (or extend the existing file) following the pattern in `test/smoke-all-platforms.test.js`.

---

## Running Tests

The project uses Node.js's built-in **`node:test`** runner (no external test framework). Tests use `node:assert/strict` for assertions and `c8` for coverage.

### Run all tests

```bash
npm test
# expands to: node --test 'test/**/*.test.js'
```

### Run a specific subset

```bash
# Smoke tests only (fast, no network)
npm run test:smoke

# Integration tests only
npm run test:integration

# Single named file
node --test test/smoke-all-platforms.test.js
node --test test/smoke-converters.test.js
node --test test/smoke-utils.test.js
node --test test/smoke-state-machine.test.js
```

### Run with coverage

```bash
npm run test:coverage
# Uses c8 to report lines/branches/functions/statements
```

### Test file naming conventions

| Pattern | Location | Purpose |
|---------|----------|---------|
| `smoke-*.test.js` | `test/` | Module-level smoke tests; fast, self-contained |
| `*.integration.test.js` | `test/` | Multi-module workflow tests |
| `test/smoke/` | subdirectory | Additional smoke test groupings |
| `test/integration/` | subdirectory | Additional integration test groupings |

Tests use `tmp` directories under `os.tmpdir()` for file system isolation and clean up after themselves.

**No coverage thresholds are configured.** Run `npm run test:coverage` to view current numbers.

---

## Code Style and Conventions

No automated linter or formatter is configured in the repository. The codebase follows these conventions consistently:

### General

- **`"use strict";`** at the top of every `.js` file (no exceptions)
- **CommonJS modules** throughout — use `require()` / `module.exports`, not ES module `import`/`export`
- **Node.js built-in modules only** for the installer and lib code — no third-party runtime dependencies
- **JSDoc block comments** on exported functions:

```js
/**
 * Brief description of what the function does.
 *
 * @param {string} content — raw skill markdown
 * @param {object} options — configuration object
 * @returns {string} converted skill content
 */
function convertSkill(content, options) { ... }
```

### Section dividers

Use the dash-line comment style to visually separate logical sections inside a file:

```js
// ─── Section title ───────────────────────────────────────
```

### Error handling

- **Never** use bare `catch` blocks that swallow errors silently
- **Never** use `process.exit(1)` in library modules — throw `new Error(message)` instead
- Use `process.exit(1)` only in top-level CLI entry points (`bin/install.js`)
- Use `PD_DEBUG` env var gating for verbose diagnostic output:

```js
if (process.env.PD_DEBUG) console.error('[debug]', err);
```

### File and directory naming

- Source modules: `kebab-case.js` (e.g., `error-classifier.js`)
- Test files: `smoke-[module-name].test.js` or `[module-name].integration.test.js`
- Skill files: `kebab-case.md` (e.g., `fix-bug.md`)
- Skill names in frontmatter: `pd:[kebab-case]` (e.g., `pd:fix-bug`)

---

## Version Bumping

Versioning follows **Semantic Versioning** (`MAJOR.MINOR.PATCH`). The current version is stored in the `VERSION` file (single source of truth) and must be kept in sync across multiple files.

### When to bump

| Bump type | When |
|-----------|------|
| `PATCH` | Bug fixes, wording adjustments, converter/installer fixes, guard rail additions |
| `MINOR` | New skill, new platform support, new stack rules, new workflows — backward compatible |
| `MAJOR` | Command renames, changed install structure, output format breaking changes, removed platform |

### Files to sync on every bump

1. `VERSION` — the plain text version string
2. `package.json` — `"version"` field
3. `package-lock.json` — regenerate with `npm install --package-lock-only`
4. `README.md` — version badge and "Current version" line
5. `CHANGELOG.md` — new entry at the top

### Step-by-step process

```bash
# 1. Edit VERSION and package.json with the new version string

# 2. Regenerate lockfile
npm install --package-lock-only

# 3. Update README.md version references (badge + inline mentions)

# 4. Add a new entry to CHANGELOG.md (see format below)

# 5. Run tests
npm test

# 6. Create a git tag
git tag v12.4.0

# 7. Push tag when ready to release
git push origin v12.4.0
```

### CHANGELOG entry format

```markdown
## [12.4.0] - DD_MM_YYYY
### Added
- Description of what was added

### Fixed
- Description of what was fixed

### Changed
- Description of what changed (MINOR/MAJOR only)

### Breaking changes
- Migration instructions (MAJOR only)
```

See `VERSION_BUMP_GUIDE.md` in the project root for the full checklist and additional detail.

---

## Branch and PR Workflow

No branch naming convention is formally documented in this repository. The following guidance reflects the conventions visible in the project history:

- Use descriptive branch names that indicate the type of change, for example:
  - `feat/add-trae-platform`
  - `fix/gemini-toml-conversion`
  - `docs/update-getting-started`
- Keep branches focused on a single concern
- Before opening a PR, run the full test suite locally:

```bash
npm test
```

- Update `CHANGELOG.md` and version files as described in [Version Bumping](#version-bumping) before merging features or fixes
- If the change affects a skill's behavior, re-run `test/smoke-all-platforms.test.js` to verify cross-platform transpilation is intact

No `.github/PULL_REQUEST_TEMPLATE.md` or `.github/workflows/` CI configuration was found in the repository at time of writing.
