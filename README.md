# Please Done — Cross-Platform AI Coding Skills

[![Version](https://img.shields.io/badge/version-4.0.0-blue.svg)](https://github.com/tonamson/please-done/releases)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![Node](https://img.shields.io/badge/node-%3E%3D16-brightgreen.svg)](https://nodejs.org)
[![Platforms](https://img.shields.io/badge/platforms-Claude%20Code%20%7C%20Codex%20%7C%20Gemini%20%7C%20OpenCode%20%7C%20Copilot-purple.svg)](#supported-platforms)

Please Done is a skills suite (`/pd:*`) for AI coding CLIs — a structured development workflow, from initialization to release.

> Please Done is a fork and refinement of [GSD / get-shit-done](https://github.com/gsd-build/get-shit-done). This version aims to make the workflow more accessible for beginners, reduce complexity when getting started, and prioritize a pragmatic installation/operation experience across multiple CLIs.
>
> If you are already familiar with agentic coding workflows and want the full feature set, the original work rhythm, and the fastest upstream updates, [GSD](https://github.com/gsd-build/get-shit-done) is still the better choice.

**Current version: v4.0.0**

## Table of Contents

- [Supported Platforms](#supported-platforms)
- [Requirements](#requirements)
- [Installation](#installation)
- [Uninstallation](#uninstallation)
- [Updating Please Done](#updating-please-done)
- [After Installation](#after-installation)
- [Skills List](#skills-list)
- [`.planning/` Structure](#planning-structure)
- [Cross-Platform Architecture](#cross-platform-architecture)
- [MCP Servers](#mcp-servers)
- [Security](#security)
- [Commit Conventions](#commit-conventions)
- [Status Icons](#status-icons)
- [Supported Tech Stacks](#supported-tech-stacks)
- [Evaluation Suite (Promptfoo)](#evaluation-suite-promptfoo)
- [Additional Documentation](#additional-documentation)
- [License](#license)

## Supported Platforms


| Platform           | Skill invocation syntax    | Global skills location          | Local skills location           |
| ------------------ | ------------------------- | ------------------------------- | ------------------------------- |
| **Claude Code**    | `/pd:init`, `/pd:plan`... | `~/.claude/commands/pd/`      | `.claude/commands/pd/`        |
| **Codex CLI**      | `$pd-init`, `$pd-plan`... | `~/.codex/skills/pd-*/`       | —                             |
| **Gemini CLI**     | `/pd:init`, `/pd:plan`... | `~/.gemini/commands/pd/`      | —                             |
| **OpenCode**       | `/pd-init`, `/pd-plan`... | `~/.config/opencode/command/` | —                             |
| **GitHub Copilot** | `/pd:init`, `/pd:plan`... | `~/.copilot/skills/pd-*/`     | `.github/skills/pd-*/`        |


Architecture: Write once (Claude Code) → Convert on install → Run natively on each platform.

## Requirements

- Node.js 16+ (`node --version`)
- Python 3.12+ (`python3 --version`)
- Git (`git --version`)
- At least 1 AI coding CLI installed:
  - [Claude Code](https://docs.anthropic.com/en/docs/claude-code)
  - [Codex CLI](https://github.com/openai/codex)
  - [Gemini CLI](https://github.com/google-gemini/gemini-cli)
  - [OpenCode](https://github.com/opencode-ai/opencode)
  - [GitHub Copilot](https://github.com/features/copilot)

## Installation

```bash
git clone https://github.com/tonamson/please-done.git
cd please-done
```

```bash
# Interactive — choose platform
node bin/install.js

# Install for a specific platform
node bin/install.js --claude
node bin/install.js --codex
node bin/install.js --gemini
node bin/install.js --opencode
node bin/install.js --copilot

# Install all platforms
node bin/install.js --all

# Local install (current project only)
node bin/install.js --claude --local
```

### What the installer does

**Claude Code** — full setup (6 steps):

| Step | Description                                                              |
| ---- | ------------------------------------------------------------------------ |
| 1    | Check prerequisites (python 3.12+, uv, git)                             |
| 2    | Initialize FastCode submodule                                            |
| 3    | Create Python venv + install dependencies                                |
| 4    | Configure Gemini API Key (required for FastCode MCP)                     |
| 5    | Symlink skills into `~/.claude/commands/pd/`                             |
| 6    | Register MCP servers (FastCode + Context7) via `claude mcp add`          |

**Codex / Gemini / OpenCode / Copilot** — convert + install skills only (3-4 steps):

| Step | Description                                                              |
| ---- | ------------------------------------------------------------------------ |
| 1    | Convert skills to platform format (tool names, command syntax, paths)    |
| 2    | Copy skills + rules into config directory                                |
| 3    | Save `.pdconfig` (points back to source directory)                       |
| 4    | Write MCP config to platform config file (Codex: `config.toml`, Gemini: `settings.json`, Copilot: `copilot-instructions.md`) |

> **Note:** Non-Claude platforms do **not** auto-setup Python/venv/Gemini API Key. Their MCP config points to `FastCode/.venv/bin/python` — you need to install Claude first (or set up FastCode manually) for MCP to work.

### Getting a Gemini API Key (required for FastCode MCP)

FastCode MCP uses Gemini API to index and analyze code:

1. Visit [https://aistudio.google.com/apikey](https://aistudio.google.com/apikey)
2. Create a new API key
3. Paste the key when the Claude installer prompts, or manually write it to `FastCode/.env` if installing another platform first

### Context7 MCP (auto-installed)

Context7 looks up version-accurate API documentation for libraries in use. The installer automatically registers it if `npx` is available.

## Uninstallation

```bash
# Uninstall per platform
node bin/install.js --uninstall --claude
node bin/install.js --uninstall --codex
node bin/install.js --uninstall --gemini
node bin/install.js --uninstall --opencode
node bin/install.js --uninstall --copilot

# Uninstall all
node bin/install.js --uninstall --all
```

Uninstall only removes artifacts created/managed by Please Done (skill files, symlinks, rules, `.pdconfig`, MCP config entries) — it does not touch other user configurations/files.

## Updating Please Done

When a new version is available, the status bar will show:

```
⬆ Please Done v[x.x.x] — /pd:update or $pd-update
```

Update with:

```bash
# Claude Code, Gemini CLI, GitHub Copilot
/pd:update
/pd:update --apply

# Codex CLI
$pd-update
$pd-update --apply

# OpenCode
/pd-update
/pd-update --apply
```

After updating → exit the CLI → restart to load the new Please Done version.

## After Installation

```bash
# 1. Restart the CLI to load the new Please Done
# 2. Open any project
cd /path/to/your/project

# 3. Run the first skill
/pd:init        # Claude Code, Gemini, Copilot
$pd-init        # Codex
/pd-init        # OpenCode
```

## Skills List

### Main Workflow (in order)


| #   | Skill                | Description                                                                                                       | Prerequisite   |
| --- | -------------------- | ----------------------------------------------------------------------------------------------------------------- | -------------- |
| 1   | `init`               | Check FastCode MCP, index project, detect tech stack, create CONTEXT.md + copy rules                              | -              |
| 2   | `scan`               | Scan code structure, dependencies, architecture, security checks, create SCAN_REPORT                              | init           |
| 3   | `new-milestone`      | Plan milestones + phases + dependencies                                                                           | init, scan (*) |
| 4   | `plan`               | Research project, create technical design, split task list for phase                                               | new-milestone  |
| 5   | `write-code`         | Execute tasks from TASKS.md, lint check, build, commit `[TASK-N]`                                                 | plan           |
| 6   | `test`               | Write tests (Jest/Supertest, PHPUnit, Hardhat/Foundry, flutter_test), run, request confirmation                   | write-code     |
| 7   | `fix-bug`            | Research bug, analyze, fix, commit `[BUG]`, loop until user confirms                                              | init           |
| 8   | `complete-milestone` | Check for errors, summarize, commit `[VERSION]`, create git tag                                                   | all tasks ✅   |


(*) New project without code: `new-milestone` allows skipping scan.

### Utilities


| Skill         | Description                                                                         |
| ------------- | ----------------------------------------------------------------------------------- |
| `what-next`   | Scan .planning/ status, show progress, suggest next command                         |
| `conventions` | Analyze code, detect patterns, ask user → create project-specific CLAUDE.md         |
| `fetch-doc`   | Download documentation from URL, save markdown locally with version + section TOC   |
| `update`      | Check + update skills from GitHub, show changelog, suggest restart                  |


### Convention System (Rules + CLAUDE.md)

Please Done uses **2 complementary convention layers**:

| Layer | Source | Scope | Applied |
| --- | --- | --- | --- |
| **Rules** (`commands/pd/rules/`) | Included in skills suite | Common to all projects with same stack | Automatically on `/pd:init` |
| **CLAUDE.md** (project root) | Created by `/pd:conventions` or manually | Per-project specific | Automatically each conversation |

**Why both?**

- **Rules** contain technical config that workflows need: build/lint commands, detection patterns for stack identification, framework-specific security rules. If you fork Please Done, edit the rules to match your conventions — every time `/pd:init` runs, your conventions are automatically applied to all projects with the same stack without re-declaring.
- **CLAUDE.md** contains per-project specific conventions (coding style, architecture decisions, do/don't) that generic rules cannot cover.

#### Rules (coding conventions)


| File                    | Applied when | Main content                                                                  |
| ----------------------- | ------------ | ----------------------------------------------------------------------------- |
| `rules/general.md`     | Always       | Code style, language, icons, version format, git, security                    |
| `rules/nestjs.md`      | Has NestJS   | Specific conventions: MongoDB prefix, DTO, pagination format, error language  |
| `rules/nextjs.md`      | Has NextJS   | Specific conventions: Ant Design v6, Zustand, native fetch, admin permissions |
| `rules/wordpress.md`   | Has WordPress| Specific conventions: WP coding standards, sanitize/escape, $wpdb, REST API  |
| `rules/solidity.md`    | Has Solidity | Specific conventions: OZ v5, SafeERC20, security modifiers, signature, gas   |
| `rules/solidity-refs/` | Has Solidity | Contract templates + audit checklist (2 files)                                |
| `rules/flutter.md`     | Has Flutter  | Specific conventions: Logic+State architecture, design tokens, Dio, manual fromJson |


Rules are automatically copied to `.planning/rules/` by `init` based on detected tech stack. Rules only contain **specific conventions** — standard framework knowledge is looked up via Context7 MCP when needed. The `plan`, `write-code`, `test`, and `fix-bug` skills read rules from there when writing code.

> **Customize rules for yourself**: Fork the Please Done repo → edit files in `commands/pd/rules/` to match your personal conventions → install skills from your fork. Every time `/pd:init` runs, your conventions are automatically applied without re-declaring. See [INTEGRATION_GUIDE.md](INTEGRATION_GUIDE.md) for how to add new stacks or edit rules.

#### Per-Project Conventions (CLAUDE.md)

In addition to built-in rules, each project should have a `CLAUDE.md` file at the root containing project-specific conventions. Claude Code automatically reads this file each conversation.

**Run `/pd:conventions`** to auto-analyze code + create CLAUDE.md, or write it manually:

```markdown
# Project Conventions

## Code Style
- Semicolons, single quotes, 2 spaces indent
- Import alias: @/ for cross-module

## Architecture
- State management: Zustand (not Redux)
- CSS: Tailwind only
- API: native fetch (not axios)

## Do / Don't
- Commit messages in English, conventional commits
- Don't mock database in tests
- Don't create new files if you can edit existing ones
```

Benefits:
- **0 token cost from skills** — Claude Code auto-loads it
- **Different per project** — different conventions
- **Easy to edit** — edit the file directly, no need to touch skills

### Plan Options


| Command              | Behavior                                                                                          |
| -------------------- | ------------------------------------------------------------------------------------------------- |
| `plan`               | **AUTO** mode — assistant decides everything, records all decisions + reasoning for user review    |
| `plan --discuss`     | **DISCUSS** mode — interactive feature discussion with the user                                   |
| `plan 1.2`           | Plan for a specific phase                                                                         |
| `plan 1.2 --discuss` | Plan phase 1.2 with discussion                                                                   |


#### DISCUSS Mode (`--discuss`)

The assistant analyzes deliverables, lists issues requiring decisions → user selects using arrow keys if the platform supports it, or answers in plain text if no selection UI → the assistant provides options for each issue:

- User selects issues to discuss (multiSelect — select multiple at once)
- Each issue shows a list of options — the first option is always the recommendation (labeled "Recommended")
- Select "Other" to describe a custom approach, type `back` to return to the previous issue, `cancel` to cancel discussion
- After finalizing → summary table → option to "Discuss more issues" (assistant presents new issues)
- Decisions are saved to PLAN.md under "Design Decisions" → `write-code` follows them

### Write-Code Options


| Command                    | Behavior                                                    |
| ------------------------- | ----------------------------------------------------------- |
| `write-code`              | Pick next ⬜ task, complete it, **stop and ask**             |
| `write-code --auto`       | Complete **all** ⬜ tasks in phase **sequentially**          |
| `write-code --parallel`   | Analyze dependencies, group waves, run independent tasks **in parallel** |
| `write-code 3`            | Complete task 3, then stop                                  |
| `write-code 3 --auto`     | Start from task 3, run all remaining sequentially           |
| `write-code 3 --parallel` | Start from task 3, run independent tasks in parallel        |


#### Parallel Mode (`--parallel`)

Analyzes the dependency graph between tasks → groups into **waves** → independent tasks in the same wave run in parallel using **multi-agent**:

```
Wave 1 (parallel):
  🔀 Agent A: Task 1 (Backend) — create users API
  🔀 Agent B: Task 2 (Frontend) — users page (uses response structure from PLAN.md)
Wave 2 (sequential — depends on Wave 1):
  → Task 3: Connect validation (needs code from Task 1)
```

## `.planning/` Structure

When running skills in a project, the `.planning/` directory is created with this structure:

```
.planning/
├── CONTEXT.md                    # Tech stack, libraries, points to rules (< 50 lines)
├── ROADMAP.md                    # Milestones + phases + deliverables
├── CURRENT_MILESTONE.md          # Tracks current version/phase/status
├── CHANGELOG.md                  # Change log (created on complete-milestone)
├── scan/
│   └── SCAN_REPORT.md            # Project scan report + dependency security check
├── docs/                         # Cached docs (fetch-doc) + solidity refs
│   └── solidity/                 # Contract templates + audit checklist (if Solidity)
├── bugs/
│   └── BUG_*.md                  # Bug reports (before/after code, patch version)
├── rules/                        # Coding rules (copied from Please Done repo by stack)
│   ├── general.md                # General rules (always present)
│   ├── nestjs.md                 # NestJS conventions (if NestJS detected)
│   ├── nextjs.md                 # NextJS conventions (if NextJS detected)
│   ├── wordpress.md              # WordPress conventions (if WordPress detected)
│   ├── solidity.md               # Solidity conventions (if Solidity detected)
│   └── flutter.md                # Flutter conventions (if Flutter detected)
└── milestones/[version]/
    ├── MILESTONE_COMPLETE.md     # Milestone summary (created on completion)
    └── phase-[x.x]/
        ├── PLAN.md               # Technical design + API + database + decisions
        ├── TASKS.md              # Task list + status
        ├── TEST_REPORT.md        # Test results (NestJS/WordPress/Solidity/Flutter)
        └── reports/
            └── CODE_REPORT_TASK_[N].md  # Per-task report
```

## Cross-Platform Architecture

```
Source (Claude Code original)       Converter on install             Target platform
┌──────────────────────┐            ┌──────────────────┐            ┌─────────────────┐
│ commands/pd/*.md     │            │                  │──────────→ │ Claude Code     │
│ workflows/*.md       │            │                  │──────────→ │ Codex CLI       │
│ references/*.md      │───────────→│  bin/install.js  │──────────→ │ Gemini CLI      │
│ templates/*.md       │            │  (Node.js, 0 dep)│──────────→ │ OpenCode        │
│ commands/pd/rules/*  │            │                  │──────────→ │ GitHub Copilot  │
│ VERSION, CHANGELOG   │            └──────────────────┘            └─────────────────┘
└──────────────────────┘
```

**Principles:**

- Skills are written once in Claude Code format
- The installer converts to native format for each platform
- No runtime dependencies (Node.js stdlib only)
- SHA256 manifest tracking — auto-backup user-modified files before reinstall
- Leaked path scanning — verifies no `~/.claude/` paths remain in non-Claude platform output

### Per-Platform Conversion


| Component          | Claude Code       | Codex                  | Gemini                                   | OpenCode       | Copilot                 |
| ------------------- | ----------------- | ---------------------- | ---------------------------------------- | -------------- | ----------------------- |
| **Tool names**     | Read, Write, Bash | Unchanged              | read_file, write_file, run_shell_command | Unchanged      | read, write, execute    |
| **Command prefix** | /pd:              | $pd-                   | /pd:                                     | /pd-           | /pd:                    |
| **Skill format**   | Nested .md        | SKILL.md + XML adapter | Nested .md                               | pd-*.md flat   | SKILL.md                |
| **MCP config**     | settings.json     | config.toml (TOML)     | settings.json                            | Custom config  | copilot-instructions.md |


## MCP Servers


| MCP          | Role                                                  | Required             |
| ------------ | ----------------------------------------------------- | -------------------- |
| **FastCode** | Index + analyze project code (uses Gemini API)        | Yes (init stops on error; other skills fallback to Grep/Read) |
| **Context7** | Look up version-accurate library API documentation    | No (but recommended) |


Please Done automatically calls FastCode to research existing code and Context7 to look up library documentation. If FastCode MCP fails: `init` will stop (successful connection required); other skills (`scan`, `plan`, `write-code`, `test`, `fix-bug`) automatically fall back to Grep/Read with a warning — still works but less accurate.

## Security

### Built-in Protection in Skills

All skills follow security rules in `rules/general.md`:


| Rule                          | Description                                                                       |
| ----------------------------- | --------------------------------------------------------------------------------- |
| **FORBIDDEN to read/display** | `.env`, `.env.*`, `credentials.*`, `*.pem`, `*.key`, `*secret*`, `wp-config.php`  |
| **Log key names only**        | When scanning/reporting encounters env variables → log key name, NOT value        |
| **Require `.env.example`**    | When code uses a new env variable → add key to `.env.example` with sample value   |


This is an **in-prompt** defense layer — skills refuse to read sensitive files even if the user requests it.

### Platform-Level Protection (recommended)

The in-prompt defense layer can be bypassed. Add a **platform-level** deny list for full blocking:

**Claude Code** — `.claude/settings.json`:

```json
{
  "permissions": {
    "deny": [
      "Read(.env)", "Read(.env.*)",
      "Read(**/secrets/*)", "Read(**/*credential*)",
      "Read(**/*.pem)", "Read(**/*.key)"
    ]
  }
}
```

**Codex CLI** — add to `~/.codex/instructions.md`:

```
NEVER read files matching: .env, .env.*, *.pem, *.key, *credential*, secrets/*
```

**Gemini CLI** — `~/.gemini/settings.json`:

```json
{
  "blocked_file_patterns": [
    ".env", ".env.*", "*.pem", "*.key", "*credential*", "secrets/**"
  ]
}
```

**OpenCode / Copilot** — add to `.gitignore` (already present) + platform instruction file with similar content to Codex.

> [!IMPORTANT]
> Defense in depth is always better: **Layer 1** — Platform deny list prevents file reads. **Layer 2** — Skills refuse to read/display sensitive content. **Layer 3** — `.gitignore` prevents committing secret files.

## Commit Conventions

Please Done auto-commits with prefixes (skipped if the project has no git):


| Prefix        | Skill              | When                                                                    |
| ------------- | ------------------ | ----------------------------------------------------------------------- |
| `[TASK-N]`    | write-code         | Completed 1 task                                                        |
| `[TEST]`      | test               | Added test files (`.spec.ts`, `test-*.php`, `test/*.ts`, `test/*.t.sol`, `test/**/*_test.dart`) |
| `[BUG]`       | fix-bug            | Each bug fix (may be multiple per bug)                                  |
| `[TRACKING]`  | write-code         | Phase completed all tasks (separate tracking commit)                    |
| `[VERSION]`   | complete-milestone | Close milestone + create git tag                                        |
| `[AUDIT]`     | manual             | Fix discovered from audit + patch bump + git tag                        |


## Status Icons


| Icon | Meaning        |
| ---- | -------------- |
| ⬜    | Not started    |
| 🔄   | In progress    |
| ✅    | Completed      |
| ❌    | Blocked        |
| 🐛   | Has bug        |


## Supported Tech Stacks


| Type       | Framework                  | Database                          | Detected by                                              |
| ---------- | -------------------------- | --------------------------------- | -------------------------------------------------------- |
| Backend    | NestJS                     | MongoDB/Mongoose, TypeORM, Prisma | `nest-cli.json`, `app.module.ts`                         |
| Backend    | Express                    | -                                 | `app.js`/`app.ts` + `express` in package.json            |
| Frontend   | NextJS App Router          | -                                 | `next.config.`*                                          |
| Frontend   | Vite/React                 | -                                 | `vite.config.`*, many `.tsx/.jsx` files                  |
| CMS        | WordPress                  | MySQL (wp-config.php)             | `wp-config.php`, `wp-content/`                           |
| Blockchain | Solidity (Hardhat/Foundry) | On-chain (EVM)                    | `hardhat.config.*`, `foundry.toml`, `contracts/**/*.sol` |
| Mobile     | Flutter (Dart + GetX)      | Local (Hive/SQLite)               | `pubspec.yaml` + `flutter`, `lib/main.dart`              |


NestJS, NextJS, WordPress, Solidity, and Flutter have rules + detailed analysis. Other stacks are detected but only list files, applying `general.md`.

**Extending with a new stack**: Add a `commands/pd/rules/[stack].md` file + detection patterns in `workflows/init.md` Step 4.

## Evaluation Suite (Promptfoo)

Prompt quality evaluation suite following [Anthropic best practices](https://claude.com/blog/improving-skill-creator-test-measure-and-refine-agent-skills). All skills are classified as **Encoded Preference** — evaluation focuses on process compliance accuracy.

### Running Evaluations

```bash
# Setup: create .env with ANTHROPIC_API_KEY
# Install promptfoo: npm install -g promptfoo

npm run eval            # 58 workflow compliance tests
npm run eval:trigger    # 19 trigger accuracy tests
npm run eval:full       # Both + save benchmark history
npm run eval:compare    # Compare benchmarks over time
npm run eval:view       # View results in browser
npm run eval:filter -- "pd:init"  # Run for a single skill
```

### Current Results


| Test suite              | Count    |
| ---------------------- | -------- |
| Workflow compliance    | 58       |
| Trigger accuracy       | 19       |


## Additional Documentation


| File                                          | Content                                                                 |
| --------------------------------------------- | ----------------------------------------------------------------------- |
| [INTEGRATION_GUIDE.md](INTEGRATION_GUIDE.md)  | Integration guide: anchor patterns, cross-references between skills     |
| [CHANGELOG.md](CHANGELOG.md)                  | Detailed changelog per version                                          |


## License

[MIT](LICENSE) - See the LICENSE file for details.
