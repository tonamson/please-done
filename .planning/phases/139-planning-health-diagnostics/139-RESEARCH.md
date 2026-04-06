# Phase 139: Planning Health Diagnostics — Research

**Researched:** 2026-04-06
**Status:** Complete

## Research Question

What do I need to know to PLAN Phase 139 (Planning Health Diagnostics) well?

---

## Standard Stack

| Component | Technology | Notes |
|-----------|-----------|-------|
| Runtime | Node.js 16.7+ | No build step, pure scripts |
| Module format | CommonJS | `module.exports = {}` per project convention |
| Testing | `node:test` + `node:assert` | No jest/mocha, built-in only |
| Output rendering | Boxed unicode tables | `╔═╗║╚╝` characters, per dashboard-renderer.js/stats-collector.js |
| Terminal colors | `COLORS` from utils.js | red, green, yellow, cyan, dim, reset |
| Logging | `log` object from utils.js | info, success, warn, error, banner |

## Architecture Patterns

### Pure Function Library Pattern (from stats-collector.js)
- All logic as pure functions accepting content strings/directory listings as parameters
- No file I/O in library — the skill file handles reading, passes content to library
- Exception: directory listing functions may need `fs.readdirSync` (acceptable for directory scanning)
- Module structure: `'use strict';` at top, functions, `module.exports = { ... }` at bottom

### Skill File Pattern (from commands/pd/stats.md)
- Frontmatter with name, description, model, argument-hint, allowed-tools
- Inline workflow in `<process>` tag (no separate @workflows file per D-15)
- `<script type="error-handler">` for error handling
- Read-only skill: no file modifications

### Severity Level Pattern (from staleness-detector.js)
- Enum object: `{ CRITICAL: 'critical', WARNING: 'warning', INFO: 'info' }`
- Each level maps to color: critical=red, warning=yellow, info=cyan
- Level determines output formatting and fix suggestion urgency

## Existing Reusable Code

### `bin/lib/schema-validator.js` — Schema Validation
- `validateAgainstSchema(schema, content)` — validates content against schema with required headers/fields/sections/tables
- Pattern: define schema object with `requiredHeaders`, `requiredFields`, `requiredSections`, `requiredTables` arrays
- Returns `{ ok: true }` or `{ ok: false, error: string }`
- **Can extend** for STATE.md validation by defining a STATE_MD_SCHEMA

### `bin/lib/dashboard-renderer.js` — Table Rendering
- `renderTable(data, columns, options)` — generic table rendering
- `padRight(str, length)` — string padding utility
- Boxed table border chars: `╔═╗║╚╝`

### `bin/lib/stats-collector.js` — Pattern Reference
- `parseStateProgress(content)` — parses STATE.md frontmatter for progress fields
- Uses regex-based frontmatter parsing (same pattern can be reused)
- `padRight()` for table formatting
- `formatStatsTable(stats)` — boxed table with sections

### `bin/lib/utils.js` — Shared Utilities
- `parseFrontmatter(content)` — full YAML frontmatter parser → `{ frontmatter, body, raw }`
- `log` object with info/success/warn/error/step/banner
- `colorize(color, text)` with COLORS constants
- `extractXmlSection(content, tagName)` — XML tag extraction

## What to Build

### New File: `bin/lib/health-checker.js`
Pure function library with these exports:
1. `SEVERITY_LEVEL` — enum: CRITICAL, WARNING, INFO
2. `checkMissingFiles(phaseDirs, completedPhases)` — checks completed phases for missing VERIFICATION.md/SUMMARY.md
3. `checkStateMdStructure(content)` — validates STATE.md frontmatter has required fields
4. `checkOrphanedDirs(phaseDirs, roadmapPhases)` — finds phase dirs not in ROADMAP
5. `runAllChecks(planningDir, roadmapContent, stateContent)` — orchestrator that runs all checks
6. `formatHealthReport(issues)` — renders issues as boxed table per category

### New File: `commands/pd/health.md`
Skill definition following stats.md pattern with inline workflow.

### New File: `test/health-checker.test.js`
Unit tests for all pure functions.

## Required Fields for STATE.md Validation (per D-17, D-18)

```yaml
gsd_state_version: string (required)
milestone: string (required, non-empty)
status: string (required, non-empty)
progress:
  total_phases: number (required)
  completed_phases: number (required)
  total_plans: number (required)
  completed_plans: number (required)
  percent: number (required)
```

## Issue Data Model

```javascript
{
  severity: 'critical' | 'warning' | 'info',
  category: 'missing_files' | 'state_schema' | 'orphaned_dirs',
  location: string,    // file path or phase identifier
  issue: string,       // description of the problem
  fix: string          // suggested command or action
}
```

## Common Pitfalls

1. **Don't auto-repair** — D-11 says strictly read-only. No --fix flag.
2. **Don't check cross-file consistency** — D-03 says that's Phase 144's job.
3. **Don't check extended items** — D-02 says no stale maps, empty dirs, orphaned files, checkpoints.
4. **Use module.exports not export** — Project uses CommonJS for bin/lib/ modules (stats-collector, log-reader, schema-validator all use `module.exports`).
5. **Handle missing/empty inputs gracefully** — All functions should handle null/undefined/empty content with safe defaults.

## Validation Architecture

### Dimension 1: Required Artifacts
- `bin/lib/health-checker.js` exists with all 6 exports
- `commands/pd/health.md` exists with correct frontmatter
- `test/health-checker.test.js` exists with comprehensive tests

### Dimension 2: Observable Behavior
- `runAllChecks()` returns array of issue objects when given valid planning directory
- `checkMissingFiles()` identifies phases missing VERIFICATION.md or SUMMARY.md
- `checkStateMdStructure()` reports missing required fields
- `checkOrphanedDirs()` finds directories not in roadmap
- `formatHealthReport()` produces boxed table output grouped by category

### Dimension 3: Edge Cases
- Empty `.planning/` directory → returns critical for missing STATE.md
- STATE.md with all fields present → returns empty issues list for that check
- Phase directory with no artifacts → detects missing files
- Non-existent `.planning/` → graceful error, not crash

---

*Research completed: 2026-04-06*
