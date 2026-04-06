# Phase 131: Universal Runtime Support (H-07) - Context

**Gathered:** 2026-04-06
**Status:** Ready for planning

<domain>
## Phase Boundary

**Goal:** Implement universal cross-runtime support — create AGENTS.md as source of truth and sync script to maintain agent instructions across 7 runtimes: Claude Code, Codex, Gemini, OpenCode, Copilot, Cursor, Windsurf, Cline, Trae, Augment, Kilo, Antigravity.

</domain>

<decisions>
## Implementation Decisions

### AGENTS.md Structure
- **D-01:** Create `AGENTS.md` as source of truth for cross-runtime agent instructions
- **D-02:** Structure includes: runtime identification, capabilities matrix, installation paths, tool mappings, sync requirements
- **D-03:** Use markdown format with clear sections per runtime

### Sync Script Design
- **D-04:** Create `bin/sync-instructions.js` script to synchronize agent instructions across runtimes
- **D-05:** Script reads AGENTS.md and generates platform-specific instruction files
- **D-06:** Use JSON configuration for runtime-specific mappings (paths, tool names, capabilities)

### Runtime Detection
- **D-07:** Detect available runtimes by checking for existence of their config directories
- **D-08:** Support detection for: Claude (`~/.claude/commands/`), Codex (`~/.codex/commands/`), Gemini (`~/.gemini/commands/`), OpenCode (`~/.opencode/commands/`), Copilot (`~/.copilot/commands/`), Cursor (`~/.cursor/commands/`), Windsurf (`~/.windsurf/commands/`), Cline (`~/.cline/commands/`), Trae (`~/.trae/commands/`), Augment (`~/.augment/commands/`), Kilo (`~/.kilo/commands/`), Antigravity (`~/.antigravity/commands/`)

### Installation Integration
- **D-09:** Integrate sync script into installer (`bin/install.js`) — run after successful installation
- **D-10:** Add sync to `postinstall` script in `package.json` for automatic updates on npm install
- **D-11:** Sync should be idempotent — safe to run multiple times

### Claude's Discretion
- Determine the exact file structure within AGENTS.md (section organization)
- Choose the sync mechanism (push vs pull, file-per-runtime vs centralized)
- Determine conflict resolution if runtime-specific overrides exist

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Requirements & Scope
- `.planning/REQUIREMENTS.md` — H-07 Universal Cross-Runtime Support requirement definition
- `.planning/ROADMAP.md` — Phase 131 scope and success criteria

### Codebase Context
- `.planning/codebase/STACK.md` §AI Coding Platforms Supported — existing 5 platforms (Claude Code, Codex, Gemini, OpenCode, Copilot)
- `.planning/codebase/CONVENTIONS.md` — naming conventions, file structure patterns

### Prior Context
- `.planning/phases/130-project-hygiene-h-06/130-CONTEXT.md` — archive patterns used in project hygiene

</canonical_refs>

<codebase_context>
## Existing Code Insights

### Reusable Assets
- `bin/lib/installers/` — existing installer structure for platform-specific installers
- `commands/pd/agents/` — existing 20 agent definitions in pd-* format
- `package.json` — existing scripts section for postinstall hook

### Established Patterns
- File naming: `lowercase-with-hyphens.js`
- Module structure: `module.exports = { functionName }`
- Installation paths follow pattern: `~/.{runtime}/commands/pd/`
- Platform detection via directory existence checks

### Integration Points
- Installer: `bin/install.js` — add sync call after platform installation
- package.json: `scripts.postinstall` — run sync on npm install
- Agent files: symlink or copy to each runtime's commands directory

</codebase_context>

<specifics>
## Specific Ideas

**Runtimes to support:**
1. Claude Code (primary) — `~/.claude/commands/pd/`
2. Codex CLI — `~/.codex/commands/pd/`
3. Gemini CLI — `~/.gemini/commands/pd/`
4. OpenCode — `~/.opencode/commands/pd/`
5. GitHub Copilot — `~/.copilot/commands/pd/`
6. Cursor — `~/.cursor/commands/pd/`
7. Windsurf — `~/.windsurf/commands/pd/`
8. Cline — `~/.cline/commands/pd/`
9. Trae — `~/.trae/commands/pd/`
10. Augment — `~/.augment/commands/pd/`
11. Kilo — `~/.kilo/commands/pd/`
12. Antigravity — `~/.antigravity/commands/pd/`

**Sync strategy:** Central AGENTS.md source → platform-specific conversion → deploy to each runtime

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

_Phase: 131-universal-runtime-support-h-07_
_Context gathered: 2026-04-06_