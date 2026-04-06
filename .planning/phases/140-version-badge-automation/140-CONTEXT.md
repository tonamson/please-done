# Phase 140: Version Badge Automation - Context

**Gathered:** 2026-04-06
**Status:** Ready for planning

<domain>
## Phase Boundary

Create a `pd:sync-version` tool (and optional `pd:version` alias) that reads the version from `package.json` and syncs it across README.md badge URL, version text line, and doc files with `<!-- Source version: X.Y.Z -->` comment headers. Default mode syncs files; `--check` flag validates without writing. Non-blocking integration with complete-milestone workflow.

</domain>

<decisions>
## Implementation Decisions

### Version Source
- **D-01:** `package.json` is the single source of truth for the current version number
- **D-02:** Read version via JSON parse of `package.json` — no git tag parsing

### Target Files
- **D-03:** Sync README.md: version badge (shields.io URL pattern `version-X.Y.Z-blue`) and version text line (`**Current version: vX.Y.Z**`)
- **D-04:** Sync doc files with `<!-- Source version: X.Y.Z -->` comment headers: `docs/skills/*.md`, `docs/workflows/*.md`, `CLAUDE.vi.md`, `CLAUDE.md` (if it has the header)
- **D-05:** Do NOT sync `.planning/` files — those have their own versioning semantics

### Check vs Sync Mode
- **D-06:** Default behavior: sync — actually update all files to match `package.json` version
- **D-07:** `--check` flag: validation-only — report mismatches without modifying files
- **D-08:** Output mismatches as a table: File | Current | Expected | Status

### Milestone Integration
- **D-09:** complete-milestone workflow calls sync-version after archiving
- **D-10:** Sync is non-blocking — failures produce warnings, do not halt milestone completion

### Implementation Structure
- **D-11:** New pure-function library: `bin/lib/version-sync.js` — all version reading/comparison/formatting as pure functions (content passed as args, no I/O in library)
- **D-12:** New skill file: `commands/pd/sync-version.md` — skill definition with frontmatter
- **D-13:** Workflow inlined in skill (following pattern for simpler tools)
- **D-14:** New test file: `test/version-sync.test.js` — unit tests for pure functions using `node:test`

### Agent's Discretion
- Exact regex patterns for version extraction from each file type
- Error handling for unreadable or missing target files
- Whether to include `--verbose` flag
- Whether to add a `pd:version` alias command

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Existing patterns
- `bin/lib/stats-collector.js` — CommonJS pure function pattern, padRight, formatStatsTable
- `bin/lib/health-checker.js` — SEVERITY_LEVEL pattern, boxed table output, pure functions
- `bin/lib/utils.js` — `log` object, `colorize()`, `COLORS` constants

### Version locations in codebase
- `package.json` line 3: `"version": "4.0.0"`
- `README.md` line 3: `[![Version](https://img.shields.io/badge/version-4.0.0-blue.svg)]`
- `README.md` line 16: `**Current version: v4.0.0**`
- `CLAUDE.vi.md` line 2: `<!-- Source version: 4.0.0 -->`
- `docs/skills/status.md` line 1: `<!-- Source version: 4.0.0 -->`
- `docs/workflows/getting-started.md` line 2: `<!-- Source version: 4.0.0 -->`

### Skill definition pattern
- `commands/pd/stats.md` — Read-only skill file example, frontmatter format
- `commands/pd/health.md` — Read-only diagnostic skill (Phase 139)

### Codebase structure
- `.planning/codebase/STRUCTURE.md` — Directory layout
- `.planning/codebase/CONVENTIONS.md` — Naming, exports, error handling, logging patterns

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `bin/lib/utils.js`: `log` object with `info`, `success`, `warn`, `error` — use for output
- `bin/lib/utils.js`: `colorize()` + `COLORS` — terminal color constants
- `bin/lib/health-checker.js`: Boxed table rendering pattern, severity classification

### Established Patterns
- Pure function pattern: No file I/O in library modules — content passed as arguments
- Named exports via `module.exports = { fn1, fn2, ... }`
- `node:test` + `node:assert/strict` for testing
- Frontmatter parsing via `parseFrontmatter()` from `utils.js`

### Integration Points
- `commands/pd/sync-version.md` — new skill file
- `bin/lib/version-sync.js` — new library module
- `test/version-sync.test.js` — new test file
- No changes to existing library files — purely additive
- Future: complete-milestone workflow will call this tool (non-blocking)

</code_context>

<specifics>
## Specific Ideas

- `--check` output should look like pd:health — clean boxed table with pass/fail per file
- Sync output should show each file updated: "Updated README.md: 3.9.0 → 4.0.0"
- README badge pattern: `version-X.Y.Z-blue` in shields.io URL
- Doc header pattern: `<!-- Source version: X.Y.Z -->`

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 140-version-badge-automation*
*Context gathered: 2026-04-06*
