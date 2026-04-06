# Phase 138: Project Statistics Command - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-06
**Phase:** 138-project-statistics-command
**Areas discussed:** Data Sources, Output Format, LOC/File Counting, Implementation Structure, Timeline Extraction
**Mode:** --auto (all decisions auto-selected)

---

## Data Sources

| Option | Description | Selected |
|--------|-------------|----------|
| ROADMAP.md + STATE.md + REQUIREMENTS.md + git log + filesystem | Comprehensive — reads all planning files plus git history and filesystem | ✓ |
| ROADMAP.md + STATE.md only | Minimal — limited stats | |
| GSD tools state command output | Reuse existing `gsd-tools state` output | |

**User's choice:** Auto-selected: "ROADMAP.md + STATE.md + REQUIREMENTS.md + git log + filesystem" (recommended — comprehensive stats matching requirements)
**Notes:** Aligns with Phase 90 pattern of reading multiple data sources for dashboard display.

---

## Output Format

| Option | Description | Selected |
|--------|-------------|----------|
| Boxed table with unicode borders | Consistent with dashboard-renderer.js (Phase 90) | ✓ |
| Plain markdown table | Simpler but less visual | |
| Key-value list | Minimal formatting | |

**User's choice:** Auto-selected: "Boxed table with unicode borders" (recommended — matches established dashboard pattern)
**Notes:** `--json` flag already required by success criteria for machine-readable output.

---

## LOC and File Counting

| Option | Description | Selected |
|--------|-------------|----------|
| Node.js fs-based line counting | Pure Node.js, no external deps | ✓ |
| Shell out to `cloc` tool | More accurate but adds dependency | |
| Shell out to `wc -l` | Fast but platform-dependent | |

**User's choice:** Auto-selected: "Node.js fs-based line counting" (recommended — consistent with pure Node.js pattern, no build deps)
**Notes:** Exclude node_modules, .git, FastCode, archived milestones, and test snapshots from counts.

---

## Implementation Structure

| Option | Description | Selected |
|--------|-------------|----------|
| New bin/lib/stats-collector.js + commands/pd/stats.md + inline workflow | Standard pattern, pure functions | ✓ |
| Single skill file with inline logic | Simpler but less testable | |
| Extend dashboard-renderer.js | Reuse existing but bloats that module | |

**User's choice:** Auto-selected: "New bin/lib/stats-collector.js + commands/pd/stats.md + inline workflow" (recommended — follows established pure function pattern)
**Notes:** Test file `test/stats-collector.test.js` using `node:test`.

---

## Timeline Extraction

| Option | Description | Selected |
|--------|-------------|----------|
| Parse git log for milestone commits + ROADMAP.md fallback | Most accurate, graceful degradation | ✓ |
| ROADMAP.md only | Simple but dates may be missing | |
| STATE.md milestone history only | Limited data | |

**User's choice:** Auto-selected: "Parse git log for milestone commits + ROADMAP.md fallback" (recommended — most accurate timeline data)
**Notes:** Fallback to ROADMAP.md ensures stats work even without git history.

---

## Agent's Discretion

- Exact table column widths and alignment
- Border style specifics (matching dashboard-renderer vs custom)
- Error handling for missing/corrupted files
- Git log parsing regex pattern
- Whether to include `--verbose` flag for extended metrics

## Deferred Ideas

None — discussion stayed within phase scope.
