# Phase 138: Project Statistics Command - Context

**Gathered:** 2026-04-06
**Status:** Ready for planning

<domain>
## Phase Boundary

Create a `pd:stats` skill that reads `.planning/` files and git history to display comprehensive project statistics: phase counts, plan counts, requirement counts, milestone progress, timeline, LOC counts, and file counts. Output as a readable table (default) or JSON (`--json` flag). Read-only — no state changes.

</domain>

<decisions>
## Implementation Decisions

### Data Sources
- **D-01:** Read `ROADMAP.md` for phase definitions, milestone list, and progress table
- **D-02:** Read `STATE.md` for current milestone, phase position, and progress percentages
- **D-03:** Read `REQUIREMENTS.md` for requirement tracking (total, completed, active counts)
- **D-04:** Parse `git log` for milestone start/completion dates (commit messages containing milestone names)
- **D-05:** Scan project filesystem for LOC and file counts (`.js` files in `bin/`, `commands/`, `workflows/`, `templates/`, `references/`, `test/`)

### Output Format
- **D-06:** Default output uses boxed table with unicode border characters (consistent with `dashboard-renderer.js` from Phase 90)
- **D-07:** `--json` flag produces machine-readable JSON with all metrics as structured data
- **D-08:** Output sections: Overview (phases/plans/requirements counts), Milestone Progress (current + history table), Timeline (dates), File Stats (LOC + file counts by directory)

### LOC and File Counting
- **D-09:** Use Node.js `fs` module for line counting — no external tools like `cloc` or `wc`
- **D-10:** Count `.js` files in project source directories: `bin/`, `commands/`, `workflows/`, `templates/`, `references/`, `test/`
- **D-11:** Exclude `node_modules/`, `.git/`, `FastCode/`, `.planning/milestones/` (archived), `test/snapshots/` from counts
- **D-12:** Report total LOC, total files, and per-directory breakdown

### Implementation Structure
- **D-13:** New pure-function library: `bin/lib/stats-collector.js` — all data collection and formatting as pure functions (content passed as args, no I/O)
- **D-14:** New skill file: `commands/pd/stats.md` — skill definition with frontmatter
- **D-15:** Workflow inlined in skill (following pattern for simpler read-only skills, not a separate `workflows/stats.md`)
- **D-16:** New test file: `test/stats-collector.test.js` — unit tests for pure functions using `node:test`

### Timeline Extraction
- **D-17:** Parse `git log --oneline` for commits containing milestone identifiers (e.g., "v12.1", "complete-milestone") to extract completion dates
- **D-18:** Fallback to ROADMAP.md completed milestone entries if git log is unavailable or empty
- **D-19:** Display timeline as a table: Milestone | Start Date | Completion Date | Phases | Plans

### Agent's Discretion
- Exact table column widths and alignment
- Border style specifics (matching dashboard-renderer vs custom)
- Error handling for missing/corrupted files
- Git log parsing regex pattern
- Whether to include `--verbose` flag for extended metrics

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Existing patterns
- `bin/lib/dashboard-renderer.js` — Boxed table rendering pattern, read-only skill structure (Phase 90)
- `bin/lib/utils.js` — `log` object, `colorize()`, `COLORS` constants for terminal output
- `bin/lib/log-reader.js` — Pattern for reading `.planning/` files safely

### Planning file formats
- `.planning/ROADMAP.md` — Phase definitions, milestone progress table, completed milestones section
- `.planning/STATE.md` — YAML frontmatter with `gsd_state_version`, `milestone`, `progress`, plus markdown body with status table
- `.planning/REQUIREMENTS.md` — Requirement tracking with checkboxes, traceability table

### Skill definition pattern
- `commands/pd/what-next.md` — Recent skill file example (Phase 137), frontmatter format, inline workflow pattern

### Codebase structure
- `.planning/codebase/STRUCTURE.md` — Directory layout, where to add new code
- `.planning/codebase/CONVENTIONS.md` — Naming, exports, error handling, logging patterns
- `.planning/codebase/STACK.md` — Node.js 16.7+, no build step, pure scripts

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `bin/lib/dashboard-renderer.js`: Boxed table rendering — can reuse or adapt the border-drawing logic for stats output
- `bin/lib/utils.js`: `log` object with `info`, `success`, `warn`, `error`, `step`, `banner` — use for output
- `bin/lib/utils.js`: `colorize()` + `COLORS` — terminal color constants already defined
- `bin/lib/log-reader.js`: `readLogs()` — pattern for safely reading `.planning/` files

### Established Patterns
- Pure function pattern: No file I/O in library modules — content passed as arguments, return structured data
- Named exports via `module.exports = { fn1, fn2, ... }`
- `node:test` + `node:assert/strict` for testing
- Synchronous `fs.readFileSync()` for reading files in CLI context
- Frontmatter parsing via `parseFrontmatter()` from `utils.js`

### Integration Points
- `commands/pd/stats.md` — new skill file (follows existing naming `pd:{name}.md`)
- `bin/lib/stats-collector.js` — new library module (follows existing `lowercase-with-hyphens.js`)
- `test/stats-collector.test.js` — new test (follows `smoke-{area}.test.js` or `{module}.test.js` pattern)
- No changes to existing files — this is a purely additive feature

</code_context>

<specifics>
## Specific Ideas

- Output should feel like the Phase 90 dashboard — clean boxed table, not raw data dump
- JSON output should be flat and easy to parse (no deeply nested structures)
- Read-only skill — zero side effects, safe to run anytime

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 138-project-statistics-command*
*Context gathered: 2026-04-06*
