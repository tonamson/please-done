---
phase: 141-mcp-tool-discovery
plan: 01
subsystem: tooling
tags: [mcp, discovery, diagnostics, toml, json, platform-config]

# Dependency graph
requires:
  - phase: 139
    provides: health-checker.js pure function pattern, boxed table formatting
provides:
  - mcp-discovery.js pure function library for MCP tool discovery
  - pd:discover skill file for MCP tool inventory
  - parseJsonMcpConfig and parseTomlMcpConfig for config parsing
  - discoverAllTools for cross-platform aggregation
  - formatDiscoveryTable and formatDiscoveryJson for output formatting
affects: [tooling, diagnostics, platform-config]

# Tech tracking
tech-stack:
  added: []
  patterns: [pure-functions, zero-fs-imports, regex-toml-parsing, boxed-table-format]

key-files:
  created:
    - bin/lib/mcp-discovery.js
    - bin/lib/mcp-discovery.test.js
    - commands/pd/discover.md
  modified: []

key-decisions:
  - "Regex-based TOML parsing instead of full TOML parser — avoids dependency, handles MCP sections only"
  - "12 platform specs hardcoded in PLATFORM_CONFIG_SPECS — covers all supported runtimes"
  - "Known MCP tools derived from command patterns — fastcode/context7 auto-detected"

patterns-established:
  - "Pure function library with zero fs imports — all content passed as parameters"
  - "Standalone test runner with assert() function — consistent with flag-parser.test.js pattern"
  - "Read-only skill file pattern — haiku model, no Write in allowed-tools"

requirements-completed: [L-05]

# Metrics
duration: 17min
completed: 2026-04-07
---

# Phase 141 Plan 01: MCP Tool Discovery Summary

**Pure function library and pd:discover skill for auto-discovering MCP tools across 12 platform configurations with JSON/TOML config parsing**

## Performance

- **Duration:** 17 min
- **Started:** 2026-04-07T09:01:51Z
- **Completed:** 2026-04-07T09:19:04Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments
- Created mcp-discovery.js with 6 pure functions (parseJsonMcpConfig, parseTomlMcpConfig, getBuiltinTools, discoverAllTools, formatDiscoveryTable, formatDiscoveryJson) and zero fs imports
- All 16 tests pass covering JSON parsing, TOML regex parsing, built-in tool resolution per platform, discovery aggregation with cross-platform grouping, boxed table output, and JSON output
- Created pd:discover skill file following health.md pattern — read-only, haiku model, error-handler script

## Task Commits

Each task was committed atomically:

1. **Task 1 (RED): Failing tests for MCP discovery** - `dbe1b01` (test)
2. **Task 1 (GREEN): Implement MCP discovery library** - `702b12f` (feat)
3. **Task 2: Create pd:discover skill file** - `004bbe6` (feat)

## Files Created/Modified
- `bin/lib/mcp-discovery.js` - Pure function library for MCP tool discovery (8 exports)
- `bin/lib/mcp-discovery.test.js` - 16 test cases with standalone runner
- `commands/pd/discover.md` - pd:discover skill file (read-only diagnostic)

## Decisions Made
- **Regex-based TOML parsing:** Used `/\[mcp_servers\.(\w+)\]\s*\n([\s\S]*?)(?=\n\[mcp_servers\.|$)/g` regex to parse TOML MCP sections — avoids adding a TOML dependency, handles only the MCP server sections needed
- **12 platform specs in PLATFORM_CONFIG_SPECS:** Covers claude, codex, gemini (JSON/TOML configs) plus opencode, copilot, cursor, windsurf, cline, trae, augment, kilo, antigravity (no MCP config)
- **Known tool derivation:** fastcode and context7 tools auto-detected from command patterns; unknown servers show "(tools discovered at runtime)" placeholder

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed TOML regex failing on brackets in args**
- **Found during:** Task 1 (TDD GREEN phase)
- **Issue:** Original regex `(?:[^\[]|\n)*?` excluded `[` from matching, causing parse failure on TOML args like `["mcp_server.py"]`
- **Fix:** Changed to `[\s\S]*?` with lookahead `(?=\n\[mcp_servers\.|$)` to capture section content until next MCP section or end of string
- **Files modified:** bin/lib/mcp-discovery.js
- **Verification:** All 16 tests pass including Test 5 (TOML sections) and Test 12 (discoverAllTools)
- **Committed in:** 702b12f (Task 1 GREEN commit)

---

**Total deviations:** 1 auto-fixed (1 bug)
**Impact on plan:** Minimal — fixed regex to handle real TOML content with bracket-enclosed array values.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- MCP discovery library complete with tests, ready for integration
- pd:discover skill file ready for runtime invocation
- Phase 141 complete, ready for next phase in v12.2

---
*Phase: 141-mcp-tool-discovery*
*Completed: 2026-04-07*
