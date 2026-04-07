# Phase 141: MCP Tool Discovery - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-07
**Phase:** 141-mcp-tool-discovery
**Areas discussed:** Discovery scope & source, Output format & detail level, Skill command integration, Platform-aware detection

---

## Discovery Scope & Source

| Option | Description | Selected |
|--------|-------------|----------|
| Platform config scan | Read platform config files to find registered MCP servers and tools | ✓ |
| Runtime introspection only | Query running AI platform's tool list directly | |
| Both: config scan + runtime verify | Config scan finds registered, runtime check verifies working | |

**User's choice:** Platform config scan
**Notes:** Reliable, no runtime dependency. Reuse installer knowledge for config paths.

| Option | Description | Selected |
|--------|-------------|----------|
| All registered platforms | Scan all 12 platform config dirs | ✓ |
| Auto-detect active platform only | Use env vars to detect current platform | |
| Platform flag (--platform) | Default to active, allow specifying which to scan | |

**User's choice:** All registered platforms
**Notes:** Most comprehensive view across all platforms.

| Option | Description | Selected |
|--------|-------------|----------|
| MCP servers only | Focus on MCP-specific tools only | |
| MCP + built-in tools | Show MCP servers AND built-in tools per platform | ✓ |

**User's choice:** MCP + built-in tools
**Notes:** Complete tool inventory view for debugging configuration issues.

---

## Output Format & Detail Level

| Option | Description | Selected |
|--------|-------------|----------|
| Name + description | Tool name and one-line description, full schema via --verbose | ✓ |
| Full schema always | Show name, description, input schema with all parameters | |
| Minimal: names only | Just tool names grouped by server | |

**User's choice:** Name + description
**Notes:** Clean, scannable output matching health/stats patterns. --verbose for details.

| Option | Description | Selected |
|--------|-------------|----------|
| By MCP server then platform | Group tools under each MCP server, show platform coverage | ✓ |
| By platform then server | Show each platform, list its MCP servers and tools | |
| Flat list with status column | One row per tool with server, name, platforms columns | |

**User's choice:** By MCP server then platform
**Notes:** Logical grouping — see tool capabilities first, then where they're available.

---

## Skill Command Integration

| Option | Description | Selected |
|--------|-------------|----------|
| Standalone command only | New pd:discover command, no integration with other commands | ✓ |
| Standalone + health integration | New command + MCP status in pd:health | |
| Standalone + health + stats | New command + integrate into both pd:health and pd:stats | |

**User's choice:** Standalone command only
**Notes:** Focused scope. Library can be consumed by other commands later.

---

## Platform-Aware Detection

| Option | Description | Selected |
|--------|-------------|----------|
| Reuse installer patterns | Use existing installer code knowledge of config paths and formats | ✓ |
| Generic config scan | Scan all config dirs generically for mcpServers keys | |

**User's choice:** Reuse installer patterns
**Notes:** Installers already know each platform's config path and format.

| Option | Description | Selected |
|--------|-------------|----------|
| Configured only | Report what's in config files only | ✓ |
| Show both statuses | Configured from files + attempt runtime verification | |

**User's choice:** Configured only
**Notes:** Matches read-only pattern of stats/health commands. No runtime dependency.

---

## Claude's Discretion

- Exact config file paths per platform (reuse from installers)
- Built-in tool list per platform (derive from converters/tool maps)
- `--json` flag output structure (follow stats/health JSON pattern)
- Library function signatures and test coverage approach

## Deferred Ideas

None — discussion stayed within phase scope
