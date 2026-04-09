<!-- generated-by: gsd-doc-writer -->
# Configuration Reference

This document covers all configuration options for **please-done**: installation flags, environment variables, platform-specific install paths, template customization, and project-level convention setup.

---

## Table of Contents

1. [Installation Flags](#installation-flags)
2. [Environment Variables](#environment-variables)
3. [Runtime-Specific Install Paths](#runtime-specific-install-paths)
4. [Template Customization](#template-customization)
5. [CONVENTIONS.md — Project-Specific Rules](#conventionsmd--project-specific-rules)

---

## Installation Flags

Run the installer via `npx please-done [options]` or the global `please-done` binary after `npm install -g please-done`.

### Platform Flags

Exactly one (or more) platform flag must be provided, or the installer runs in interactive mode.

| Flag | Description |
|------|-------------|
| `--claude` | Install skills for **Claude Code** |
| `--codex` | Install skills for **Codex CLI** |
| `--gemini` | Install skills for **Gemini CLI** |
| `--opencode` | Install skills for **OpenCode** |
| `--copilot` | Install skills for **GitHub Copilot** |
| `--cursor` | Install skills for **Cursor** |
| `--windsurf` | Install skills for **Windsurf** (Codeium) |
| `--kilo` | Install skills for **Kilo** |
| `--antigravity` | Install skills for **Antigravity** |
| `--augment` | Install skills for **Augment** |
| `--trae` | Install skills for **Trae** (ByteDance) |
| `--all` | Install skills for **all** supported platforms at once |

Multiple platform flags can be combined:

```bash
npx please-done --claude --gemini
```

### Scope Flags

| Flag | Alias | Default | Description |
|------|-------|---------|-------------|
| `--global` | `-g` | ✓ (default) | Install into the user-level config directory (`~/.claude`, `~/.codex`, etc.) |
| `--local` | `-l` | — | Install into the current project directory (`./.claude`, `./.codex`, etc.) |

### Other Flags

| Flag | Alias | Description |
|------|-------|-------------|
| `--config-dir <path>` | `-c <path>` | Override the target directory. The installer writes files to `<path>` instead of the default global or local location. Takes precedence over all env vars. |
| `--uninstall` | `-u` | Remove previously installed skills from the target platform directory. |
| `--force-statusline` | — | Replace an existing statusline config if one is already present. (Reserved; not yet fully implemented in this version.) |
| `--help` | `-h` | Print the usage summary and exit. |

### Examples

```bash
# Interactive — prompts for platform and scope
npx please-done

# Install for Claude Code (global)
npx please-done --claude

# Install for all platforms, global
npx please-done --all --global

# Install into a specific directory
npx please-done --claude --config-dir /path/to/custom/dir

# Uninstall from Codex CLI
npx please-done --uninstall --codex

# Uninstall from all platforms
npx please-done --uninstall --all
```

---

## Environment Variables

### API / Model Configuration

These variables configure the underlying AI model used by the Gemini CLI adapter. Copy `env.example` to `.env` and populate the values.

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `OPENAI_API_KEY` | **Required** (Gemini) | — | Your Gemini API key. Despite the name, this is the OpenAI-compatible key issued by Google AI Studio. |
| `BASE_URL` | Optional | `https://generativelanguage.googleapis.com/v1beta/openai` | OpenAI-compatible endpoint for Gemini. Override to point to a proxy or a different API version. |
| `MODEL` | Optional | `gemini-2.5-flash-lite` | The model identifier to use. Switch to a larger model (e.g., `gemini-2.5-pro`) for heavier tasks. |

> **Note:** `OPENAI_API_KEY` and `BASE_URL` are used by the Gemini CLI runtime. Claude Code, Codex, and other runtimes use their own native credential mechanisms and are not affected by these variables.

### Platform Config Directory Overrides

Each platform reads an optional environment variable to override its default config directory. These are checked before falling back to the default `~/.<platform>` path.

| Variable | Platform | Example |
|----------|----------|---------|
| `CLAUDE_CONFIG_DIR` | Claude Code | `export CLAUDE_CONFIG_DIR=/custom/claude` |
| `CODEX_HOME` | Codex CLI | `export CODEX_HOME=/custom/codex` |
| `GEMINI_CONFIG_DIR` | Gemini CLI | `export GEMINI_CONFIG_DIR=/custom/gemini` |
| `OPENCODE_CONFIG_DIR` | OpenCode | `export OPENCODE_CONFIG_DIR=/custom/opencode` |
| `COPILOT_CONFIG_DIR` | GitHub Copilot | `export COPILOT_CONFIG_DIR=/custom/copilot` |
| `CURSOR_CONFIG_DIR` | Cursor | `export CURSOR_CONFIG_DIR=/custom/cursor` |
| `WINDSURF_CONFIG_DIR` | Windsurf | `export WINDSURF_CONFIG_DIR=/custom/windsurf` |
| `KILO_CONFIG_DIR` | Kilo | `export KILO_CONFIG_DIR=/custom/kilo` |
| `ANTIGRAVITY_CONFIG_DIR` | Antigravity | `export ANTIGRAVITY_CONFIG_DIR=/custom/antigravity` |
| `AUGMENT_CONFIG_DIR` | Augment | `export AUGMENT_CONFIG_DIR=/custom/augment` |
| `TRAE_CONFIG_DIR` | Trae | `export TRAE_CONFIG_DIR=/custom/trae` |

Priority order for target directory resolution:

1. `--config-dir <path>` CLI flag (highest priority)
2. Platform environment variable (e.g., `CLAUDE_CONFIG_DIR`)
3. Default OS path (see [Runtime-Specific Install Paths](#runtime-specific-install-paths))

### XDG Base Directory

| Variable | Affects | Description |
|----------|---------|-------------|
| `XDG_CONFIG_HOME` | OpenCode, Kilo | Overrides the XDG base directory. Defaults to `~/.config` when unset. |

### Debugging and CI

| Variable | Description |
|----------|-------------|
| `PD_DEBUG` | Set to any value to print full error stack traces on install failure. |
| `NO_COLOR` | Set to any value to disable ANSI color output in the installer. |
| `PD_TEST_MODE` | Internal — used by the test suite to export `parseArgs`, `install`, and `uninstall` from `install.js`. Do not set in production. |

---

## Runtime-Specific Install Paths

### Global Install (default)

Skills are installed into the user's home directory config folder. The exact subdirectory depends on the platform's skill format.

| Platform | Global Base Path | Skills Subdirectory | Skill Format |
|----------|-----------------|---------------------|--------------|
| Claude Code | `~/.claude/` | `commands/pd/*.md` | `nested` |
| Codex CLI | `~/.codex/` | `skills/pd-*/SKILL.md` | `skill-dir` |
| Gemini CLI | `~/.gemini/` | `commands/pd/*.toml` | `nested` (TOML) |
| OpenCode | `~/.config/opencode/` ¹ | `command/pd-*.md` | `flat` |
| GitHub Copilot | `~/.copilot/` | `skills/pd-*/SKILL.md` | `skill-dir` |
| Cursor | `~/.cursor/` | `commands/pd/*.md` | `nested` |
| Windsurf | `~/.codeium/windsurf/` | `commands/pd/*.md` | `nested` |
| Kilo | `~/.config/kilo/` ¹ | `commands/pd/*.md` | `nested` |
| Antigravity | `~/.gemini/antigravity/` | `commands/pd/*.md` | `nested` |
| Augment | `~/.augment/` | `commands/pd/*.md` | `nested` |
| Trae | `~/.trae/` | `commands/pd/*.md` | `nested` |

¹ Uses `$XDG_CONFIG_HOME` when set; otherwise falls back to `~/.config`.

### Local Install (`--local`)

Skills are installed into the current working directory using the same subdirectory structure as the global install, but rooted at the project folder:

```
<project-root>/.claude/commands/pd/*.md      # Claude Code
<project-root>/.codex/skills/pd-*/SKILL.md  # Codex CLI
<project-root>/.gemini/commands/pd/*.toml    # Gemini CLI
```

Use `--local` when you want skills scoped to a single repository and tracked in version control.

### Custom Directory (`--config-dir`)

Pass `--config-dir <path>` to write skills to any arbitrary directory. The installer creates the platform's subdirectory structure under `<path>`:

```bash
npx please-done --claude --config-dir ~/dotfiles/claude
# writes to ~/dotfiles/claude/commands/pd/
```

---

## Template Customization

The `templates/` directory contains Markdown templates that the `/pd:*` skills use when generating planning documents. These files are **read by the AI agent at runtime**, not processed at install time.

### Available Templates

| Template File | Generated Document | Description |
|---------------|--------------------|-------------|
| `templates/project.md` | `PROJECT.md` | Project vision, audience, constraints, milestone history |
| `templates/context-template.md` | `CONTEXT.md` | Tech stack, key files, framework patterns |
| `templates/plan.md` | `PLAN.md` | Milestone plan structure |
| `templates/roadmap.md` | `ROADMAP.md` | Phase/deliverable roadmap |
| `templates/tasks.md` | `TASKS.md` | Task breakdown |
| `templates/state.md` | `STATE.md` | Current project state |
| `templates/progress.md` | `PROGRESS.md` | Progress tracking |
| `templates/requirements.md` | `REQUIREMENTS.md` | Requirements document |
| `templates/research.md` | `RESEARCH.md` | Research notes |
| `templates/current-milestone.md` | `CURRENT_MILESTONE.md` | Active milestone detail |
| `templates/security-fix-phase.md` | Security fix section | Security remediation template |
| `templates/verification-report.md` | Verification report | QA/verification output |
| `templates/management-report.md` | Management report | Stakeholder summary |

### Customizing Templates

Templates use standard Markdown with placeholder tokens in `[brackets]` or `{braces}`. To customize a template for your project:

1. Edit the relevant file in `templates/` directly in the please-done installation, **or**
2. After running `/pd:onboard`, edit the generated `.planning/` files — changes there affect only your project.

> **Tip:** Templates are the _default shape_ an AI agent uses when creating a new document. If you want the AI to follow a different structure for `TASKS.md`, edit `templates/tasks.md` before running `/pd:init`.

---

## CONVENTIONS.md — Project-Specific Rules

`CONVENTIONS.md` is a project-level file (placed at your repository root) that tells the AI agent about project-specific coding conventions it cannot infer from the codebase alone.

### How It Is Used

Three skills automatically read `CONVENTIONS.md` when it is present:

| Skill | When `CONVENTIONS.md` Is Read |
|-------|-------------------------------|
| `/pd:write-code` | Before writing any code — ensures generated code follows project conventions |
| `/pd:fix-bug` | Before patching — ensures fixes are consistent with project style |
| `/pd:plan` | Before creating a plan — ensures planning reflects architecture conventions |

The file is declared as an optional context import in each skill (`@CONVENTIONS.md (optional)`), so the skills work without it but produce more project-aware output when it is present.

### Creating CONVENTIONS.md

Run the dedicated skill:

```
/pd:conventions
```

The skill will:
1. Scan the codebase for detectable patterns (naming conventions, import style, linting config, state management, etc.).
2. Show the detected patterns and ask for your preferences on things it could not detect automatically (commit message style, communication language, known AI pitfalls for this project).
3. Create or update `CONVENTIONS.md` at the project root.

### CONVENTIONS.md Format

The file follows a concise Markdown structure (**under 50 lines** by convention — only project-specific rules, never framework knowledge):

```markdown
# Project Conventions

## Code Style
- 2-space indentation, semicolons required
- `'use strict';` in every module

## Naming
- Files: kebab-case (e.g., `my-module.js`)
- Functions: camelCase
- Constants: UPPER_CASE

## Architecture
- One installer per platform in `bin/lib/installers/`
- Converters live in `bin/lib/converters/`

## Do / Don't
- DO: Add a JSDoc comment to every exported function
- DON'T: Introduce new npm runtime dependencies

## Build & Testing
- Run `npm test` before committing
- Smoke tests live in `test/smoke/`
```

### Updating Conventions

Re-run `/pd:conventions` at any time. The skill merges new findings with the existing file and removes duplicates. You can also edit `CONVENTIONS.md` directly — it is a plain Markdown file.

### Scope

`CONVENTIONS.md` is project-scoped. It lives in your repository root and is read by the AI agent when it has access to that working directory. It does not affect other projects and is not installed by the please-done installer.
