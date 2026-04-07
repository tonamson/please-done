# Phase 141: MCP Tool Discovery - Research

**Researched:** 2026-04-07
**Domain:** MCP server/tool config discovery across AI coding platforms
**Confidence:** HIGH

## Summary

This phase creates a read-only diagnostic command (`pd:discover`) that scans all 12 supported platform config directories to find registered MCP servers and built-in tools, then reports them grouped by MCP server with platform coverage visibility. The implementation follows the established pattern from `stats-collector.js` and `health-checker.js`: pure function library with no `fs` imports in check functions, content passed as parameters.

**Primary recommendation:** Create `bin/lib/mcp-discovery.js` as a pure function library that parses platform config content (JSON/TOML) to extract MCP server definitions and built-in tool lists. The skill file `commands/pd/discover.md` orchestrates file reading and passes content to library functions. Group output by MCP server (FastCode, Context7, custom), then list platform coverage per server.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** Use platform config file scanning — read each platform's config file to find registered MCP servers and their tools. No runtime introspection.
- **D-02:** Scan all 12 registered platform config dirs (Claude, Codex, Gemini, OpenCode, Copilot, Cursor, Windsurf, Cline, Trae, Augment, Kilo, Antigravity) regardless of which is currently active.
- **D-03:** Include both MCP server tools AND built-in tools (Read, Write, Bash, Grep, Glob, etc.) per platform in the inventory. Complete tool visibility.
- **D-04:** Default output shows tool name + one-line description per tool, grouped by MCP server then by platform coverage. Matches health/stats boxed table pattern.
- **D-05:** Use `--verbose` flag to optionally show full parameter schemas for each tool.
- **D-06:** Group output by MCP server (FastCode, Context7, custom), then show which platforms have that server configured under each group. Built-in tools listed per-platform separately.
- **D-07:** Create as standalone `pd:discover` command only. No integration into pd:health or pd:stats in this phase. Library can be consumed later if needed.
- **D-08:** Reuse installer patterns — the existing installer code in `bin/lib/installers/` already knows each platform's config path and format. Extract MCP config reading into the discovery library.
- **D-09:** Report "configured" status only (what's in config files). No runtime/running verification. Matches read-only pattern of stats/health commands.

### Claude's Discretion
- Exact config file paths per platform (reuse from installers)
- Built-in tool list per platform (derive from converters/tool maps)
- `--json` flag output structure (follow stats/health JSON pattern)
- Library file structure and function signatures
- Test coverage approach

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| L-05 | Auto-discover available MCP tools; list tools with descriptions and capabilities; identify which tools are configured vs available; output tool inventory for debugging | Config parsing functions extract MCP servers from JSON/TOML; built-in tool maps from `platforms.js` TOOL_MAP; grouped output by server → platform coverage; `--verbose` for full schemas |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| (none) | — | Pure Node.js | No external dependencies needed — uses only `fs`, `path`, JSON.parse, and regex for TOML parsing |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `bin/lib/platforms.js` | existing | Config dir resolution, TOOL_MAP, platform registry | Reuse `getGlobalDir()` and `PLATFORMS` for all 7 primary platforms |
| `bin/lib/utils.js` | existing | `log.info()`, boxed table formatting | Output formatting follows established pattern |
| `bin/lib/resource-config.js` | existing | MCP tool name patterns (`mcp__fastcode__*`, `mcp__context7__*`), AGENT_REGISTRY | Reference for known MCP tool names and heavy tool patterns |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Custom TOML parser | `@iarna/toml` npm package | Custom regex sufficient — only parsing `[mcp_servers.*]` sections, not full TOML |

**Installation:**
```bash
# No new dependencies needed
```

## Architecture Patterns

### Recommended Project Structure
```
bin/lib/
├── mcp-discovery.js          # NEW: Pure function library for MCP tool discovery
├── mcp-discovery.test.js     # NEW: Tests for discovery functions
├── platforms.js              # EXISTING: Platform registry (reuse)
├── resource-config.js        # EXISTING: Known MCP tool name patterns (reference)
├── stats-collector.js        # EXISTING: Pattern reference for read-only commands
└── health-checker.js         # EXISTING: Pattern reference for pure function libraries
commands/pd/
└── discover.md               # NEW: Skill file for pd:discover command
```

### Pattern 1: Pure Function Library (from health-checker.js)
**What:** Library module has zero `fs` imports — all file content is passed as parameters
**When to use:** All read-only diagnostic libraries
**Example:**
```javascript
// Source: [VERIFIED: bin/lib/health-checker.js pattern]
/**
 * Parse MCP servers from Claude settings.json content.
 * @param {string} content - settings.json file content
 * @returns {object} - { servers: [{ name, command, args, platforms: [] }] }
 */
function parseClaudeMcpConfig(content) {
  if (!content || typeof content !== 'string') return { servers: [] };
  try {
    const settings = JSON.parse(content);
    const servers = [];
    if (settings.mcpServers) {
      for (const [name, config] of Object.entries(settings.mcpServers)) {
        servers.push({ name, command: config.command, args: config.args || [] });
      }
    }
    return { servers };
  } catch {
    return { servers: [] };
  }
}
```

### Pattern 2: Skill File with YAML Frontmatter (from health.md/stats.md)
**What:** Skill file uses YAML frontmatter with `model: haiku`, `allowed-tools: [Read, Glob, Bash]`, argument hint
**When to use:** All read-only diagnostic commands
**Example:**
```yaml
---
name: pd:discover
description: Discover MCP tools and built-in tools across all configured platforms
model: haiku
argument-hint: "[--verbose] [--json]"
allowed-tools:
  - Read
  - Glob
  - Bash
---
```

### Pattern 3: Config Format Per Platform
**What:** Each platform stores MCP config in a different format at a different path
**When to use:** When scanning platform config directories

| Platform | Config Path | Config Format | MCP Key |
|----------|-------------|---------------|---------|
| Claude | `~/.claude/settings.json` | JSON | `mcpServers` key [VERIFIED: checked on live system, key exists but may be empty] |
| Codex | `~/.codex/config.toml` | TOML | `[mcp_servers.*]` sections [VERIFIED: bin/lib/converters/codex.js `generateMcpToml()`] |
| Gemini | `~/.gemini/settings.json` | JSON | `mcpServers` key [VERIFIED: bin/lib/installers/gemini.js line 114] |
| OpenCode | `~/.config/opencode/` | — | No explicit MCP config in installer [VERIFIED: bin/lib/installers/opencode.js has no MCP setup] |
| Copilot | `~/.copilot/` | — | No MCP config — uses tool name mapping [VERIFIED: bin/lib/installers/copilot.js has no MCP setup] |
| Cursor | `~/.cursor/` | — | Uses Claude native tool names [VERIFIED: bin/lib/platforms.js TOOL_MAP.cursor = {}] |
| Windsurf | `~/.windsurf/` | — | Uses Claude native tool names [VERIFIED: bin/lib/platforms.js TOOL_MAP.windsurf = {}] |
| Cline–Antigravity | (5 platforms) | — | Listed in AGENTS.md only, no installers yet [VERIFIED: bin/lib/installers/ only has 5 files] |

### Anti-Patterns to Avoid
- **Do NOT import `fs` in mcp-discovery.js:** Use the pure function pattern — content is passed as parameters. [VERIFIED: bin/lib/health-checker.js has zero fs imports]
- **Do NOT call `claude mcp list` at runtime:** D-01 says config file scanning only, no runtime introspection
- **Do NOT try to detect "running" MCP servers:** D-09 says configured status only
- **Do NOT add this to pd:health or pd:stats:** D-07 says standalone command only in this phase

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Platform config dir resolution | Custom path logic | `platforms.js` `getGlobalDir()` | Already handles env vars, XDG, and per-platform paths |
| Built-in tool names per platform | Hardcoded tool lists | `platforms.js` `TOOL_MAP` | Already maps Read→read_file (Gemini), Read→read (Copilot), etc. |
| Boxed table formatting | Custom format functions | Pattern from `stats-collector.js` `formatStatsTable()` | Consistent UI across all diagnostic commands |
| MCP tool name patterns | Guessing tool names | `resource-config.js` `HEAVY_TOOL_PATTERNS` and `AGENT_REGISTRY` | Already contains `mcp__fastcode__*`, `mcp__context7__*` patterns |
| TOML section parsing | Full TOML parser | Regex for `[mcp_servers.*]` sections | Only need to extract server name, command, args — not full TOML |

**Key insight:** The codebase already has all the building blocks — `platforms.js` for paths, `TOOL_MAP` for built-in tools, installer patterns for config formats. Discovery is assembling existing knowledge, not creating new parsing infrastructure.

## Common Pitfalls

### Pitfall 1: Claude MCP Config Not In File
**What goes wrong:** Claude Code registers MCP servers via `claude mcp add --scope user` CLI command, but the `mcpServers` key in `~/.claude/settings.json` may be empty even when servers are registered.
**Why it happens:** Claude stores MCP server configs in its internal data structures that may not be reflected in `settings.json`.
**How to avoid:** Check if `claude mcp list` CLI output can be parsed, OR report that Claude MCP detection is config-file-based (showing only what's in `settings.json`). Per D-01, we scan config files only — if the data isn't there, report "no MCP servers found in config".
**Warning signs:** `settings.json` has `mcpServers: {}` but `claude mcp list` shows servers.

### Pitfall 2: Missing Config Files For Uninstalled Platforms
**What goes wrong:** 12 platforms are listed in AGENTS.md, but only 5 have installers. The remaining 7 (Cline, Trae, Augment, Kilo, Antigravity) and partially supported ones (Cursor, Windsurf) may have no config dirs on disk.
**Why it happens:** Platforms not installed = no config directory to scan.
**How to avoid:** Gracefully handle missing directories — report platform as "not installed" rather than erroring. The skill file should check `fs.existsSync()` before reading.
**Warning signs:** `ENOENT` errors when scanning uninstalled platform config dirs.

### Pitfall 3: TOML Parsing Without Full Parser
**What goes wrong:** Codex uses TOML format (`config.toml`) for MCP server blocks. Regex parsing may miss edge cases (inline tables, multiline values).
**Why it happens:** TOML is complex — full grammar has nested tables, arrays of tables, inline tables.
**How to avoid:** Keep parsing simple — only look for `[mcp_servers.SERVERNAME]` section headers followed by `command = "..."` and `args = [...]` lines. Skip sections that don't match this pattern. The installer generates a known format, so we know the exact structure.
**Warning signs:** Incomplete server lists from Codex config.

### Pitfall 4: Built-in Tool Lists Incomplete
**What goes wrong:** `TOOL_MAP` in `platforms.js` only maps tools that differ from Claude's names. Platforms with empty tool maps (Claude, Codex, Cursor, Windsurf) still have built-in tools, just with the same names.
**Why it happens:** `TOOL_MAP` is a diff map, not a complete inventory.
**How to avoid:** Define a `BUILTIN_TOOLS` constant listing all standard built-in tools (Read, Write, Edit, Bash, Glob, Grep, WebFetch, WebSearch, Agent/Task), then resolve per-platform names using `TOOL_MAP`. Empty tool map = use Claude names directly.
**Warning signs:** Output shows zero built-in tools for Claude, Codex, Cursor, Windsurf.

### Pitfall 5: Grouping By Server Instead Of Flat List
**What goes wrong:** Output becomes hard to read if tools are listed flat instead of grouped.
**Why it happens:** D-06 requires grouping by MCP server first, then platform coverage.
**How to avoid:** Use a two-level data structure: `{ servers: { fastcode: { tools: [...], platforms: [...] }, context7: {...} }, builtins: { claude: [...], codex: [...] } }`. Format output with boxed table sections per server.
**Warning signs:** Output is a long flat list instead of grouped sections.

## Code Examples

### Parsing MCP Servers from Gemini/Claude JSON Config
```javascript
// Source: [VERIFIED: bin/lib/installers/gemini.js line 114, bin/lib/converters/gemini.js generateMcpConfig()]
function parseJsonMcpConfig(content, platformName) {
  if (!content || typeof content !== 'string') return { servers: [] };
  try {
    const config = JSON.parse(content);
    const servers = [];
    const mcpServers = config.mcpServers || {};
    for (const [name, def] of Object.entries(mcpServers)) {
      servers.push({
        name,
        command: def.command || '',
        args: def.args || [],
        platform: platformName,
      });
    }
    return { servers };
  } catch {
    return { servers: [] };
  }
}
```

### Parsing MCP Servers from Codex TOML Config
```javascript
// Source: [VERIFIED: bin/lib/converters/codex.js generateMcpToml() defines the exact format]
function parseTomlMcpConfig(content, platformName) {
  if (!content || typeof content !== 'string') return { servers: [] };
  const servers = [];
  // Match [mcp_servers.SERVERNAME] sections
  const sectionRegex = /\[mcp_servers\.(\w+)\]\s*\n((?:[^\[]|\n)*?)(?=\n\[|\n*$)/g;
  let match;
  while ((match = sectionRegex.exec(content)) !== null) {
    const name = match[1];
    const section = match[2];
    const commandMatch = section.match(/command\s*=\s*"([^"]+)"/);
    const argsMatch = section.match(/args\s*=\s*\[([^\]]*)\]/);
    if (commandMatch) {
      servers.push({
        name,
        command: commandMatch[1],
        args: argsMatch ? argsMatch[1].split(',').map(s => s.trim().replace(/"/g, '')).filter(Boolean) : [],
        platform: platformName,
      });
    }
  }
  return { servers };
}
```

### Resolving Built-in Tools Per Platform
```javascript
// Source: [VERIFIED: bin/lib/platforms.js TOOL_MAP]
const BUILTIN_TOOLS = ['Read', 'Write', 'Edit', 'Bash', 'Glob', 'Grep', 'WebFetch', 'WebSearch'];

function getBuiltinTools(platformName) {
  const { TOOL_MAP } = require('./platforms');
  const toolMap = TOOL_MAP[platformName] || {};
  return BUILTIN_TOOLS.map(tool => ({
    claudeName: tool,
    platformName: toolMap[tool] || tool,
  }));
}
```

### Formatting Discovery Output (Boxed Table)
```javascript
// Source: [VERIFIED: bin/lib/stats-collector.js formatStatsTable() pattern]
function formatDiscoveryTable(discovery) {
  const W = 70;
  const lines = [];

  // Section per MCP server
  for (const server of discovery.servers) {
    lines.push(`╔${'═'.repeat(W)}╗`);
    lines.push(`║ MCP Server: ${server.name}${' '.repeat(W - 14 - server.name.length)}║`);
    lines.push(`║ ${'─'.repeat(W - 2)}║`);
    lines.push(`║   Command: ${server.command}${' '.repeat(W - 13 - server.command.length)}║`);
    lines.push(`║   Platforms: ${server.platforms.join(', ')}${' '.repeat(W - 15 - server.platforms.join(', ').length)}║`);
    for (const tool of server.tools) {
      lines.push(`║   • ${tool.name} — ${tool.description}${' '.repeat(W - 8 - (tool.name + ' — ' + tool.description).length)}║`);
    }
    lines.push(`╚${'═'.repeat(W)}╝`);
    lines.push('');
  }

  return lines.join('\n');
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| MCP tools were hardcoded in skill files | MCP config stored per-platform in JSON/TOML | v12.0 | Discovery must read config files, not hardcode |
| 3 supported platforms | 12 listed platforms (5 with installers) | v12.1+ | Must handle uninstalled platforms gracefully |

**Deprecated/outdated:**
- `SKILLS_DIR` path from `.pdconfig` used to contain `FASTCODE_DIR` — no longer the canonical source for MCP tool discovery

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Claude Code stores MCP server registrations in `~/.claude/settings.json` under `mcpServers` key | Architecture Patterns | Discovery can't find Claude's MCP servers — would need `claude mcp list` CLI fallback |
| A2 | Platforms without installers (Cline, Trae, Augment, Kilo, Antigravity) have no local config to scan | Architecture Patterns | May miss valid config files if those platforms are independently installed |
| A3 | Codex TOML format is always `[mcp_servers.NAME]\ncommand = "..."` as generated by `generateMcpToml()` | Code Examples | Manual TOML edits may have different formatting that regex misses |
| A4 | `WebFetch` and `WebSearch` are available built-in tools on all platforms | Code Examples | Some platforms may not support web tools — output would show tools that aren't actually available |

## Open Questions (RESOLVED)

1. **Claude MCP server storage location — RESOLVED: Read settings.json first; if empty, note in output. Per D-01 config-file-only scanning.**
   - What we know: `claude mcp add --scope user` registers servers, `settings.json` has a `mcpServers` key but it's empty on the test machine
   - What's unclear: Where does Claude actually persist the MCP server config? May be in an internal database, not a readable file
   - Recommendation: Attempt to read `settings.json` first; if empty, note "Claude MCP: check via `claude mcp list`" in output. D-01 says config file scanning only, so this is acceptable.

2. **Cline/Trae/Augment/Kilo/Antigravity config locations — RESOLVED: Report as not installed if dir missing. No installers exist.**
   - What we know: Listed in AGENTS.md with `~/.{name}/commands/pd/` paths
   - What's unclear: Do these platforms have MCP config files? What format?
   - Recommendation: Report as "not installed" if config dir doesn't exist. These platforms don't have installers yet.

## Environment Availability

Step 2.6: SKIPPED (no external dependencies identified — pure code/config scanning with Node.js built-ins only)

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Node.js built-in assert pattern (no test runner) |
| Config file | none — standalone test files |
| Quick run command | `node bin/lib/mcp-discovery.test.js` |
| Full suite command | `node bin/lib/mcp-discovery.test.js` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| L-05-a | Parse MCP servers from JSON config (Gemini/Claude) | unit | `node bin/lib/mcp-discovery.test.js` | ❌ Wave 0 |
| L-05-b | Parse MCP servers from TOML config (Codex) | unit | `node bin/lib/mcp-discovery.test.js` | ❌ Wave 0 |
| L-05-c | Resolve built-in tools per platform using TOOL_MAP | unit | `node bin/lib/mcp-discovery.test.js` | ❌ Wave 0 |
| L-05-d | Group tools by MCP server with platform coverage | unit | `node bin/lib/mcp-discovery.test.js` | ❌ Wave 0 |
| L-05-e | Format discovery output as boxed table | unit | `node bin/lib/mcp-discovery.test.js` | ❌ Wave 0 |
| L-05-f | Handle missing/invalid config files gracefully | unit | `node bin/lib/mcp-discovery.test.js` | ❌ Wave 0 |

### Sampling Rate
- **Per task commit:** `node bin/lib/mcp-discovery.test.js`
- **Per wave merge:** `node bin/lib/mcp-discovery.test.js`
- **Phase gate:** All tests green before `/gsd-verify-work`

### Wave 0 Gaps
- [ ] `bin/lib/mcp-discovery.test.js` — covers all L-05 unit tests
- [ ] `bin/lib/mcp-discovery.js` — library implementation
- [ ] `commands/pd/discover.md` — skill file

## Project Constraints (from AGENTS.md)

| Directive | Impact on This Phase |
|-----------|---------------------|
| `'use strict';` in all modules | Include in `mcp-discovery.js` |
| `module.exports = { ... }` named exports | Export all discovery functions as named exports |
| No ESLint/Prettier | Hand-format following existing patterns |
| 2-space indentation | Follow throughout |
| Comments in Vietnamese acceptable | Section headers use `// ─── Section ────` pattern |
| Custom `log` object for output | Use `log.info()` for console output, not `console.log()` |
| Pure functions for library code | `mcp-discovery.js` has zero `fs` imports |
| Error handler pattern in skill files | Include `<script type="error-handler">` block in `discover.md` |

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | no | Read-only command, no auth |
| V3 Session Management | no | No sessions |
| V4 Access Control | no | No privileged operations |
| V5 Input Validation | yes | Validate parsed config content (malformed JSON/TOML) |
| V6 Cryptography | no | No crypto operations |

### Known Threat Patterns for Config Scanning

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Path traversal in config dir | Tampering | Use `getGlobalDir()` which returns safe paths |
| Malformed JSON/TOML injection | Tampering | Try-catch around all `JSON.parse()` calls |
| Information disclosure via output | Information Disclosure | Only show tool names/descriptions, not sensitive config values |

## Sources

### Primary (HIGH confidence)
- `bin/lib/platforms.js` — Platform registry, TOOL_MAP, config dir resolution [VERIFIED: read in full]
- `bin/lib/resource-config.js` — MCP tool patterns, AGENT_REGISTRY [VERIFIED: read in full]
- `bin/lib/health-checker.js` — Pure function library pattern [VERIFIED: read in full]
- `bin/lib/stats-collector.js` — Read-only diagnostic pattern, boxed table formatting [VERIFIED: read in full]
- `bin/lib/installers/claude.js` — Claude config path and MCP registration [VERIFIED: read in full]
- `bin/lib/installers/codex.js` — Codex config.toml format [VERIFIED: read in full]
- `bin/lib/installers/gemini.js` — Gemini settings.json format [VERIFIED: read in full]
- `bin/lib/converters/codex.js` — TOML MCP config generation [VERIFIED: read in full]
- `bin/lib/converters/gemini.js` — JSON MCP config generation [VERIFIED: read in full]
- `bin/lib/converters/copilot.js` — MCP tool name conversion patterns [VERIFIED: read in full]
- `commands/pd/stats.md` — Skill file pattern for read-only commands [VERIFIED: read in full]
- `commands/pd/health.md` — Skill file pattern with --json flag [VERIFIED: read in full]

### Secondary (MEDIUM confidence)
- Live system config inspection: `~/.claude/settings.json` has `mcpServers: {}`, `~/.codex/config.toml` has no MCP sections, `~/.gemini/settings.json` has `mcpServers: {}` [VERIFIED: checked on live system]

### Tertiary (LOW confidence)
- Claude Code internal MCP server storage location [ASSUMED: based on settings.json key existing but being empty]
- Cline/Trae/Augment/Kilo/Antigravity MCP config formats [ASSUMED: no installers exist, no config to scan]

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — no new dependencies, reuses existing codebase modules
- Architecture: HIGH — follows established patterns from health-checker and stats-collector
- Pitfalls: MEDIUM — Claude MCP storage location uncertain (A1)
- Config formats: HIGH — verified from installer source code and live system

**Research date:** 2026-04-07
**Valid until:** 2026-05-07 (stable — config formats don't change frequently)
