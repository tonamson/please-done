<!-- generated-by: gsd-doc-writer -->
# Getting Started with Please Done

> **Difficulty:** 🟢 Beginner  
> **Time:** ~10–15 minutes  
> **Result:** Skills installed, first project onboarded, and your first plan generated.

Please Done (`/pd:*`) is a structured AI coding skills suite that works across 11 AI coding runtimes. This guide takes you from zero to your first working session.

---

## Table of Contents

1. [Prerequisites](#1-prerequisites)
2. [Installation](#2-installation)
3. [Verify the Installation](#3-verify-the-installation)
4. [First Use: Onboard a Project](#4-first-use-onboard-a-project)
5. [Core Workflow](#5-core-workflow)
6. [Common First-Time Issues](#6-common-first-time-issues)
7. [Next Steps](#7-next-steps)

---

## 1. Prerequisites

Check each item before starting. The installer will also verify these, but catching them early saves time.

| Requirement | Check command | Minimum version |
|-------------|--------------|-----------------|
| **Node.js** | `node --version` | `>= 16.7.0` |
| **Python** | `python3 --version` | `>= 3.12` |
| **Git** | `git --version` | any recent version |
| **AI CLI** | see below | — |

**You need at least one AI coding CLI installed and authenticated:**

- [Claude Code](https://docs.anthropic.com/en/docs/claude-code) ← recommended for first-time setup
- [Codex CLI](https://github.com/openai/codex), [Gemini CLI](https://github.com/google-gemini/gemini-cli), [OpenCode](https://github.com/opencode-ai/opencode), [GitHub Copilot](https://github.com/features/copilot), [Cursor](https://cursor.com), [Windsurf](https://codeium.com/windsurf), [Kilo](https://kilocode.ai), [Antigravity](https://antigravity.dev), [Augment](https://augmentcode.com), [Trae](https://trae.ai)

**Gemini API Key** (required for FastCode MCP, used by all skills):

1. Visit [https://aistudio.google.com/apikey](https://aistudio.google.com/apikey)
2. Create a free key — the installer will prompt you for it during Claude Code setup.

> **If you're not using Claude Code first:** FastCode MCP requires a one-time Claude Code setup (or manual Python/venv setup). The installer will explain this if needed.

---

## 2. Installation

Please Done installs by cloning the repo and running the installer. Pick the method that fits your setup.

### Option A — Clone and install (recommended)

```bash
# 1. Clone the repository
git clone https://github.com/tonamson/please-done.git
cd please-done

# 2. Run the installer — interactive, lets you choose your platform
node bin/install.js
```

### Option B — Install directly with npx (no clone needed)

```bash
npx please-done
```

### Specifying your platform

If you already know which CLI you use, pass a flag to skip the interactive prompt:

```bash
# Claude Code
node bin/install.js --claude

# Codex CLI
node bin/install.js --codex

# Gemini CLI
node bin/install.js --gemini

# OpenCode
node bin/install.js --opencode

# GitHub Copilot
node bin/install.js --copilot

# Cursor / Windsurf / Kilo / Antigravity / Augment / Trae
node bin/install.js --cursor
node bin/install.js --windsurf
node bin/install.js --kilo
node bin/install.js --antigravity
node bin/install.js --augment
node bin/install.js --trae

# Install for all platforms at once
node bin/install.js --all
```

Or with npx:

```bash
npx please-done --claude
npx please-done --all
```

### Global vs. local install

By default, skills are installed **globally** (available in every project). Use `--local` to install them only for the current project:

```bash
node bin/install.js --claude --local
```

### What the installer does

**For Claude Code** — full setup (6 steps):

1. Checks prerequisites (Python 3.12+, git)
2. Initializes the FastCode submodule
3. Creates a Python venv and installs dependencies
4. Prompts for your Gemini API Key (saved for FastCode MCP)
5. Symlinks skills into `~/.claude/commands/pd/`
6. Registers MCP servers (FastCode + Context7) via `claude mcp add`

**For all other platforms** — convert + install (3–4 steps):

1. Converts skills to the platform's native format (tool names, command syntax)
2. Copies skills and rules to the platform's config directory
3. Saves `.pdconfig` pointing back to the source directory
4. Writes MCP config to the platform's config file

> **Tip:** After installation, **restart your AI CLI** so it picks up the new skills.

---

## 3. Verify the Installation

After restarting your CLI, confirm the skills are available by running:

```
/pd:init        # Claude Code, Gemini CLI, Copilot, Cursor, Windsurf, Kilo, Antigravity, Augment, Trae
$pd-init        # Codex CLI
/pd-init        # OpenCode
```

You should see Please Done analyze your environment and report MCP status. A successful output looks like:

```
✓ FastCode MCP: connected
✓ Context7 MCP: connected
✓ Tech stack detected: [your stack]
✓ Created CONTEXT.md
Please Done v12.3.0 ready.
```

If MCP shows as disconnected, see [Common First-Time Issues](#6-common-first-time-issues) below.

---

## 4. First Use: Onboard a Project

Every project needs to be onboarded once. Open a terminal inside the project you want to work on (it must have a `git` repo), then run these two commands in your AI CLI:

### Step 1 — Onboard the codebase

```
/pd:onboard
```

This scans your codebase, reads git history, and creates the `.planning/` directory with:

- `CONTEXT.md` — detected tech stack and project context
- `STATE.md` — current phase and task tracking
- `CONVENTIONS.md` — code style and naming conventions

> **Requires a git repo.** If the project doesn't have one yet, run `git init && git add . && git commit -m "init"` first.

### Step 2 — Initialize Please Done for the project

```
/pd:init
```

This verifies MCP connectivity, confirms tech stack detection, and ensures `.planning/` is fully set up. Run this after every `git clone` of a project that already uses Please Done.

---

## 5. Core Workflow

Once a project is onboarded, this is the repeating loop you'll use:

```
/pd:onboard → /pd:init → /pd:new-milestone → /pd:plan → /pd:write-code → /pd:status
```

### Quick reference

| Step | Command | What it does |
|------|---------|--------------|
| 1 | `/pd:onboard` | Orient AI to your codebase, analyze git history |
| 2 | `/pd:init` | Check MCP, detect tech stack, confirm `.planning/` setup |
| 3 | `/pd:new-milestone "v1.0"` | Define a deliverable milestone and its phases |
| 4 | `/pd:plan` | Research and generate a PLAN.md for the current phase |
| 5 | `/pd:write-code` | Execute tasks from the plan, lint, build, auto-commit |
| 6 | `/pd:what-next` | Show current progress and recommend the next command |
| 7 | `/pd:status` | Dashboard view: tasks, bugs, blockers, last commit |

### Typical first session

```bash
# In your project directory, inside your AI CLI:

/pd:onboard                    # ~ 2 min — scans codebase
/pd:init                       # ~ 1 min — verifies environment
/pd:new-milestone "v1.0 MVP"   # ~ 1 min — creates ROADMAP.md
/pd:plan                       # ~ 2 min — generates PLAN.md for Phase 1
/pd:write-code                 # ~ 5 min — executes first task, commits
/pd:what-next                  # shows next task or phase complete
/pd:status                     # full project dashboard
```

### Continuing a session

When you return to a project, you don't need to re-onboard. Just run:

```
/pd:what-next
```

This checks your `.planning/` state and tells you exactly where to pick up.

### Completing a phase

After all tasks in a phase are done:

```
/pd:plan          # plans the next phase
/pd:write-code    # executes it
```

### Completing a milestone

When all phases in a milestone are done:

```
/pd:complete-milestone
```

---

## 6. Common First-Time Issues

### Skills not found after install

**Symptom:** Your CLI doesn't recognize `/pd:init` or similar commands.

**Fix:** Restart the AI CLI completely (close and reopen the terminal or the application). Skills are loaded at startup.

---

### FastCode MCP is not connected

**Symptom:** `/pd:init` reports `FastCode MCP: not connected`.

**Causes and fixes:**

| Cause | Fix |
|-------|-----|
| Python venv not set up (non-Claude platforms) | Run Claude Code installer first: `node bin/install.js --claude` |
| Gemini API key missing or invalid | Re-run `node bin/install.js --claude` and enter a valid key from [aistudio.google.com](https://aistudio.google.com/apikey) |
| MCP not registered | Check `claude mcp list` — if missing, re-run the installer |

> **Note:** Skills degrade gracefully when MCP is unavailable — they use `Grep` and `Read` as fallback. You can still work, but code indexing will be slower.

---

### `git: command not found` during install

**Fix:** Install git for your OS:
- macOS: `xcode-select --install` or `brew install git`
- Ubuntu/Debian: `sudo apt install git`
- Windows: [git-scm.com/download/win](https://git-scm.com/download/win)

---

### `/pd:onboard` fails with "not a git repository"

**Fix:** Initialize git in your project first:

```bash
git init
git add .
git commit -m "chore: initial commit"
```

Then re-run `/pd:onboard`.

---

### Wrong tech stack detected by `/pd:init`

**Fix:** Edit `.planning/CONTEXT.md` directly after onboarding. The file is plain Markdown — correct the `Tech Stack` section and save. All subsequent skills will read from this file.

---

### Node version too old

**Symptom:** Installer exits with `Error: Please Done requires Node.js >= 16.7.0`.

**Fix:** Update Node.js. Use [nvm](https://github.com/nvm-sh/nvm) for easy version management:

```bash
nvm install 20
nvm use 20
```

---

### `.planning/` already exists from a previous session

**Symptom:** `/pd:onboard` warns that `.planning/` already exists.

**Fix:** This is normal. `/pd:onboard` will update existing files rather than overwrite them. If you want a clean slate:

```bash
rm -rf .planning/
/pd:onboard
```

---

## 7. Next Steps

You're up and running. Here's where to go from here:

- **[Command Cheat Sheet](../cheatsheet.md)** — all 20 `/pd:*` commands at a glance
- **[Configuration Reference](configuration.md)** — installation flags, environment variables, platform paths
- **[Workflow Guides](../workflows/)** — in-depth guides for bug fixing, milestone management, and more
- **[Error Troubleshooting](../error-troubleshooting.md)** — detailed fixes for every known error code
- **[Architecture Overview](../architecture/overview.md)** — how Please Done works under the hood

**Lost at any point?** Run `/pd:what-next` — it reads your project state and tells you the exact command to run next.

---

*Please Done v12.3.0 — [GitHub](https://github.com/tonamson/please-done) · [License: MIT](../../LICENSE)*
