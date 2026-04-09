# Agent Instructions — Universal Cross-Runtime Support

**Version:** 1.0.0
**Last Synced:** 2026-04-06
**Source:** This file is the authoritative source. Runtime-specific files are generated.

---

## Runtime Identification

| Runtime | Environment Variable | Config Path |
|---------|---------------------|-------------|
| Claude Code | `CLAUDE_CODE` | `~/.claude/commands/pd/` |
| Codex CLI | `CODEX_CLI` | `~/.codex/commands/pd/` |
| Gemini CLI | `GEMINI_CLI` | `~/.gemini/commands/pd/` |
| OpenCode | `OPENCODE` | `~/.opencode/commands/pd/` |
| Copilot | `GITHUB_COPILOT` | `~/.copilot/commands/pd/` |
| Cursor | `CURSOR` | `~/.cursor/commands/pd/` |
| Windsurf | `WINDSURF` | `~/.windsurf/commands/pd/` |
| Cline | `CLINE` | `~/.cline/commands/pd/` |
| Trae | `TRAE` | `~/.trae/commands/pd/` |
| Augment | `AUGMENT` | `~/.augment/commands/pd/` |
| Kilo | `KILO` | `~/.kilo/commands/pd/` |
| Antigravity | `ANTIGRAVITY` | `~/.antigravity/commands/pd/` |

---

## Core Agent Commands

### Project Management

| Command | Description | Syntax |
|---------|-------------|--------|
| pd:onboard | Onboard current directory | `/pd:onboard [path]` |
| pd:init | Initialize PD planning structure | `/pd:init` |
| pd:scan | Scan codebase structure | `/pd:scan` |
| pd:new-milestone | Create new milestone | `/pd:new-milestone v1.0` |
| pd:plan | Create phase plan | `/pd:plan --auto 1.1` |
| pd:execute-phase | Execute all plans in phase | `/pd:execute-phase 1` |
| pd:complete-milestone | Finalize milestone | `/pd:complete-milestone` |
| pd:status | Display project status | `/pd:status` |
| pd:what-next | Check progress + auto-execute next step | `/pd:what-next [--execute]` |
| pd:progress | Show progress | `/pd:progress` |

### Planning & Research

| Command | Description | Syntax |
|---------|-------------|--------|
| pd:discuss-phase | Gather context before planning | `/pd:discuss-phase 1` |
| pd:research | Research technical approaches | `/pd:research "topic"` |
| pd:plan-phase | Create detailed plan | `/pd:plan-phase 1 --auto` |
| pd:plan-milestone-gaps | Plan gap closure | `/pd:plan-milestone-gaps` |

### Execution & Verification

| Command | Description | Syntax |
|---------|-------------|--------|
| pd:execute-phase | Execute phase plans | `/pd:execute-phase 1 --auto` |
| pd:test | Run tests with verification | `/pd:test --coverage` |
| pd:verify-work | Conversational UAT | `/pd:verify-work` |
| pd:fix-bug | Systematic bug fixing | `/pd:fix-bug "description"` |

### Debugging & Audit

| Command | Description | Syntax |
|---------|-------------|--------|
| pd:debug | Systematic debugging | `/pd:debug` |
| pd:audit-milestone | Milestone completion audit | `/pd:audit-milestone` |
| pd:validate-phase | Retroactive validation | `/pd:validate-phase 1` |
| pd:secure-phase | Threat mitigation verification | `/pd:secure-phase 1` |

### Workflow & Management

| Command | Description | Syntax |
|---------|-------------|--------|
| pd:ship | Create PR and prepare merge | `/pd:ship` |
| pd:review | Cross-AI peer review | `/pd:review --phase 1` |
| pd:list-workspaces | List workspaces | `/pd:list-workspaces` |

### Utilities

| Command | Description | Syntax |
|---------|-------------|--------|
| pd:note | Capture idea | `/pd:note "idea"` |
| pd:add-todo | Add todo | `/pd:add-todo "task"` |
| pd:check-todos | List todos | `/pd:check-todos` |
| pd:stats | Project statistics | `/pd:stats` |
| pd:session-report | Session report | `/pd:session-report` |

---

## Capabilities Matrix

| Runtime | Commands | MCP Servers | Auto-Execute | Wave-Parallel |
|---------|----------|-------------|--------------|---------------|
| Claude Code | Full | Yes | Yes | Yes |
| Codex CLI | Full | No | Yes | Yes |
| Gemini CLI | Full | No | Yes | Limited |
| OpenCode | Full | No | Yes | Yes |
| Copilot | Full | No | Yes | Yes |
| Cursor | Full | No | Yes | Limited |
| Windsurf | Full | No | Yes | Limited |
| Cline | Full | No | Yes | Yes |
| Trae | Full | No | Yes | Limited |
| Augment | Full | No | Yes | Limited |
| Kilo | Full | No | Yes | Limited |
| Antigravity | Full | No | Yes | Limited |

---

## Installation Paths

Each runtime expects agent files at a specific path:

- Claude Code: `~/.claude/commands/pd/AGENTS.md`
- Codex CLI: `~/.codex/commands/pd/AGENTS.md`
- Gemini CLI: `~/.gemini/commands/pd/AGENTS.md`
- OpenCode: `~/.opencode/commands/pd/AGENTS.md`
- GitHub Copilot: `~/.copilot/commands/pd/AGENTS.md`
- Cursor: `~/.cursor/commands/pd/AGENTS.md`
- Windsurf: `~/.windsurf/commands/pd/AGENTS.md`
- Cline: `~/.cline/commands/pd/AGENTS.md`
- Trae: `~/.trae/commands/pd/AGENTS.md`
- Augment: `~/.augment/commands/pd/AGENTS.md`
- Kilo: `~/.kilo/commands/pd/AGENTS.md`
- Antigravity: `~/.antigravity/commands/pd/AGENTS.md`

---

## Sync Requirements

1. **Source of Truth:** `AGENTS.md` in project root
2. **Sync Trigger:** `bin/sync-instructions.js` reads source, generates per-runtime files
3. **Idempotency:** Safe to run multiple times
4. **Integration:** Runs after `bin/install.js` and on `npm postinstall`
5. **Verification:** Each runtime's file contains same content, verified by checksum

---

## Tool Mappings

### File Operations

| Standard | Claude Code | Codex | Gemini | OpenCode | Copilot |
|----------|-------------|-------|--------|----------|---------|
| Read | `Read` | `Read` | `Read` | `Read` | `Read` |
| Write | `Write` | `Write` | `Write` | `Write` | `Write` |
| Edit | `Edit` | `Edit` | `Edit` | `Edit` | `Edit` |
| Bash | `Bash` | `Bash` | `Bash` | `Bash` | `Bash` |

### Search & Navigation

| Standard | Claude Code | Codex | Gemini | OpenCode | Copilot |
|----------|-------------|-------|--------|----------|---------|
| Grep | `Grep` | `Grep` | `Grep` | `Grep` | `Grep` |
| Glob | `Glob` | `Glob` | `Glob` | `Glob` | `Glob` |

---

*Auto-generated from source. Do not edit runtime-specific files directly.*