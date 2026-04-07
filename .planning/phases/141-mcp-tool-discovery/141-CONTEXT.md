# Phase 141: MCP Tool Discovery - Context

**Gathered:** 2026-04-07
**Status:** Ready for planning

<domain>
## Phase Boundary

Auto-discover and inventory MCP tools and built-in tools across all 12 supported platform configurations. Report which tools are configured, grouped by MCP server, with platform coverage visibility. Read-only diagnostic command — no file modifications.

</domain>

<decisions>
## Implementation Decisions

### Discovery Scope & Source
- **D-01:** Use platform config file scanning — read each platform's config file to find registered MCP servers and their tools. No runtime introspection.
- **D-02:** Scan all 12 registered platform config dirs (Claude, Codex, Gemini, OpenCode, Copilot, Cursor, Windsurf, Cline, Trae, Augment, Kilo, Antigravity) regardless of which is currently active.
- **D-03:** Include both MCP server tools AND built-in tools (Read, Write, Bash, Grep, Glob, etc.) per platform in the inventory. Complete tool visibility.

### Output Format & Detail Level
- **D-04:** Default output shows tool name + one-line description per tool, grouped by MCP server then by platform coverage. Matches health/stats boxed table pattern.
- **D-05:** Use `--verbose` flag to optionally show full parameter schemas for each tool.
- **D-06:** Group output by MCP server (FastCode, Context7, custom), then show which platforms have that server configured under each group. Built-in tools listed per-platform separately.

### Skill Command Integration
- **D-07:** Create as standalone `pd:discover` command only. No integration into pd:health or pd:stats in this phase. Library can be consumed later if needed.

### Platform-Aware Detection
- **D-08:** Reuse installer patterns — the existing installer code in `bin/lib/installers/` already knows each platform's config path and format. Extract MCP config reading into the discovery library.
- **D-09:** Report "configured" status only (what's in config files). No runtime/running verification. Matches read-only pattern of stats/health commands.

### Claude's Discretion
- Exact config file paths per platform (reuse from installers)
- Built-in tool list per platform (derive from converters/tool maps)
- `--json` flag output structure (follow stats/health JSON pattern)
- Library file structure and function signatures
- Test coverage approach

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Existing Patterns
- `bin/lib/stats-collector.js` — Pure function pattern for read-only diagnostic libraries
- `bin/lib/health-checker.js` — Pure function pattern with severity classification
- `commands/pd/stats.md` — Skill file structure for read-only diagnostic commands
- `commands/pd/health.md` — Skill file structure with --json flag pattern

### Platform Config Knowledge
- `bin/lib/installers/claude.js` — Claude Code config path and MCP registration (claude mcp add/remove)
- `bin/lib/installers/codex.js` — Codex CLI config.toml format with MCP blocks
- `bin/lib/installers/gemini.js` — Gemini CLI settings.json with mcpServers key
- `bin/lib/converters/copilot.js` — Copilot MCP tool name mapping patterns
- `bin/lib/converters/gemini.js` — Gemini MCP tool filtering and config generation
- `bin/lib/converters/codex.js` — Codex TOML config parsing and generation

### Tool & Resource Mapping
- `bin/lib/resource-config.js` — Existing MCP tool name patterns (mcp__fastcode__*, mcp__context7__*)
- `bin/lib/platforms.js` — Platform config directory resolution

### Project Context
- `.planning/ROADMAP.md` §Phase 141 — Phase goal and success criteria
- `.planning/REQUIREMENTS.md` §L-05 — Requirement specification
- `.planning/codebase/CONVENTIONS.md` — Pure function patterns, naming conventions
- `.planning/codebase/STACK.md` §AI Coding Platforms — All 12 platform config paths

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `bin/lib/installers/*.js` — Each installer knows its platform's config path, format, and MCP registration patterns. Key source for config discovery logic.
- `bin/lib/resource-config.js` — Already maps MCP tool name patterns (`mcp__fastcode__*`, `mcp__context7__*`) and has `HEAVY_TOOL_PATTERNS`. Contains known tool names.
- `bin/lib/platforms.js` — `getConfigDir()` method resolves per-platform config directories.
- `bin/lib/converters/copilot.js` — `mcpToolConvert` maps MCP tool names across platforms.
- `bin/lib/converters/gemini.js` — Filters MCP tools (`mcp__*`) and generates MCP config JSON.

### Established Patterns
- Pure functions for library code (no fs imports in check functions — content passed as params)
- Read-only diagnostic commands: `model: haiku`, no file edits, `--json` flag support
- Boxed table output via `log.info()` from `bin/lib/utils.js`
- Skill files use YAML frontmatter with `allowed-tools: [Read, Glob, Bash]`

### Integration Points
- New skill file: `commands/pd/discover.md`
- New library: `bin/lib/mcp-discovery.js` (pure functions)
- New test: `bin/lib/mcp-discovery.test.js`
- Uses `bin/lib/platforms.js` for config dir resolution
- Uses `bin/lib/installers/*.js` patterns for config format knowledge

</code_context>

<specifics>
## Specific Ideas

- Group output by MCP server (FastCode → tools, Context7 → tools, Custom → tools), with platform coverage listed per server
- Include built-in tools section showing which core tools (Read, Write, Bash, Grep, Glob) are available per platform
- `--verbose` flag shows full tool schemas with input parameters
- Follow the established `--json` flag pattern for machine-readable output

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 141-mcp-tool-discovery*
*Context gathered: 2026-04-07*
