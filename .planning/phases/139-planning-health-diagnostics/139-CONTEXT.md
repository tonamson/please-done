# Phase 139: Planning Health Diagnostics - Context

**Gathered:** 2026-04-06
**Status:** Ready for planning

<domain>
## Phase Boundary

Create a `pd:health` skill that scans `.planning/` directory for structural issues — missing VERIFICATION.md/SUMMARY.md in completed phases, STATE.md required field validation, and orphaned phase directories not listed in ROADMAP. Reports issues with 3-level severity (critical, warning, info) and actionable fix commands. Read-only diagnostic — no state changes or auto-repair.

</domain>

<decisions>
## Implementation Decisions

### Issue Detection Scope
- **D-01:** Run core checks only: missing VERIFICATION.md/SUMMARY.md per completed phase, STATE.md required fields (gsd_state_version, milestone, status, progress), orphaned phase directories not in ROADMAP
- **D-02:** Do NOT include extended checks (stale maps, empty dirs, orphaned files, checkpoints) — those can be added later if needed
- **D-03:** Do NOT include cross-file consistency checks (STATE.md vs ROADMAP.md vs actual dirs) — belongs in Phase 144 schema drift detection

### Severity Classification
- **D-04:** 3 severity levels: critical (blocks workflow — e.g., missing STATE.md), warning (should fix — e.g., missing VERIFICATION.md on completed phase), info (nice to know — e.g., orphaned directory)
- **D-05:** Pattern matches staleness-detector approach (FRESH/AGING/STALE) — familiar level system

### Fix Suggestions
- **D-06:** Each issue includes an actionable command as the fix suggestion (e.g., `Run /gsd-validate-phase 139`, `Delete .planning/phases/old/`)
- **D-07:** When no concrete command applies, provide a descriptive action step

### Output Format
- **D-08:** Summary counts at top (X critical, Y warning, Z info)
- **D-09:** Issues grouped by category (missing files, schema issues, orphaned directories) with boxed table per group
- **D-10:** Use dashboard-renderer.js boxed table pattern (consistent with pd:stats from Phase 138)

### Repair Mode
- **D-11:** Strictly read-only — no --fix flag, no auto-repair. Diagnose and report only
- **D-12:** Consistent with pd:stats pattern (read-only, zero side effects)

### Implementation Structure
- **D-13:** New pure-function library: `bin/lib/health-checker.js` — all checks as pure functions (content/directory listing passed as args, no I/O in library)
- **D-14:** New skill file: `commands/pd/health.md` — skill definition with frontmatter
- **D-15:** Workflow inlined in skill (following pattern for simpler read-only skills like pd:stats)
- **D-16:** New test file: `test/health-checker.test.js` — unit tests for pure functions using `node:test`

### STATE.md Validation Details
- **D-17:** Check YAML frontmatter required fields: gsd_state_version, milestone, status, progress (with sub-fields: total_phases, completed_phases, total_plans, completed_plans, percent)
- **D-18:** Validate field types: gsd_state_version should be string, progress.percent should be numeric, status should be non-empty string

### Agent's Discretion
- Exact table column widths and alignment
- Border style specifics (matching dashboard-renderer)
- Regex patterns for parsing STATE.md frontmatter
- Whether to include `--json` flag for machine-readable output
- Error handling for unreadable or corrupted files

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Existing patterns
- `bin/lib/dashboard-renderer.js` — Boxed table rendering pattern, read-only skill structure (Phase 90)
- `bin/lib/utils.js` — `log` object, `colorize()`, `COLORS` constants for terminal output
- `bin/lib/log-reader.js` — Pattern for reading `.planning/` files safely
- `bin/lib/schema-validator.js` — Schema validation pattern with required headers/fields/sections, `validateAgainstSchema()` reusable
- `bin/lib/staleness-detector.js` — Severity level pattern (FRESH/AGING/STALE), pure function structure

### Planning file formats
- `.planning/ROADMAP.md` — Phase definitions, progress table with `[x]`/`[ ]` checkboxes, completed milestones
- `.planning/STATE.md` — YAML frontmatter with `gsd_state_version`, `milestone`, `status`, `progress`, plus markdown body with status table
- `.planning/REQUIREMENTS.md` — Requirement tracking with checkboxes, traceability table

### Skill definition pattern
- `commands/pd/stats.md` — Recent read-only skill file example (Phase 138), frontmatter format, inline workflow pattern

### Codebase structure
- `.planning/codebase/STRUCTURE.md` — Directory layout, where to add new code
- `.planning/codebase/CONVENTIONS.md` — Naming, exports, error handling, logging patterns
- `.planning/codebase/STACK.md` — Node.js 16.7+, no build step, pure scripts

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `bin/lib/schema-validator.js`: `validateAgainstSchema()` with required headers/fields/sections/tables pattern — can be extended with a STATE.md schema
- `bin/lib/dashboard-renderer.js`: Boxed table rendering — reuse for health report output
- `bin/lib/utils.js`: `log` object with `info`, `success`, `warn`, `error` — use for output
- `bin/lib/utils.js`: `colorize()` + `COLORS` — terminal color constants for severity highlighting
- `bin/lib/staleness-detector.js`: Severity level enum pattern — reference for critical/warning/info

### Established Patterns
- Pure function pattern: No file I/O in library modules — content/directory listings passed as arguments
- Named exports via `module.exports = { fn1, fn2, ... }`
- `node:test` + `node:assert/strict` for testing
- Frontmatter parsing via `parseFrontmatter()` from `utils.js`
- Read-only skills: no --fix, no state changes, safe to run anytime

### Integration Points
- `commands/pd/health.md` — new skill file (follows existing `pd:{name}.md` naming)
- `bin/lib/health-checker.js` — new library module (follows `lowercase-with-hyphens.js` naming)
- `test/health-checker.test.js` — new test (follows `{module}.test.js` pattern)
- No changes to existing files — purely additive feature
- Phase 143 (Scope Reduction Detection) and Phase 144 (Schema Drift Detection) will depend on this module's patterns

</code_context>

<specifics>
## Specific Ideas

- Output should feel like pd:stats — clean boxed tables grouped by category, not raw data dump
- Critical issues should use red coloring, warning yellow, info cyan — using existing COLORS constants
- Each issue row: Severity | Phase/File | Issue | Fix Command
- Summary line at top: "Health check: X issues found (Y critical, Z warning, W info)" or "All checks passed" if clean

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 139-planning-health-diagnostics*
*Context gathered: 2026-04-06*
