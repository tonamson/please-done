# Phase 142: Discussion Audit Trail - Context

**Gathered:** 2026-04-07
**Status:** Ready for planning

<domain>
## Phase Boundary

Auto-store distilled discussion summaries to `.planning/contexts/` at the end of each discuss-phase session. Provide a `pd:audit` command for listing, searching, and viewing stored summaries. Summaries are markdown with YAML frontmatter, named by phase + date. Read-only access command — no edits or deletes.

</domain>

<decisions>
## Implementation Decisions

### Storage Format
- **D-01:** Markdown files with YAML frontmatter — consistent with all other `.planning/` files, human-readable, grep-friendly.
- **D-02:** Filename convention: `{phase}-{YYYY-MM-DD}.md` (e.g., `142-2026-04-07.md`) — locatable by phase number or date in a single ls/grep.
- **D-03:** Content: distilled summary only — key decisions, 10-15 lines, stripped of Q&A noise. The full Q&A remains in phase dir as `{phase}-DISCUSSION-LOG.md`. Contexts are for resume, not audit.

### Capture Mechanism
- **D-04:** Auto-generated at end of discuss-phase workflow — the workflow writes a context summary to `.planning/contexts/` automatically during the `write_context` step. Zero friction — no manual step.
- **D-05:** Distilled content includes: phase number, phase name, date, key decisions (one line each), and the "next step" ready to run. NOT the full question/answer log.

### Resume Interface
- **D-06:** New `pd:audit` command — dedicated skill file at `commands/pd/audit.md`. Does NOT modify `pd:what-next` in this phase.
- **D-07:** Three modes:
  - Default (no args): list recent sessions, most recent first, show phase + date + decision count
  - `--search "keyword"` or `--phase 142`: filter/search by keyword (grep decisions text) or exact phase number
  - `--view 142`: display full summary for a specific phase entry

### Search Scope
- **D-08:** Three filter types supported: keyword (substring match in decisions text), phase number (exact match on frontmatter `phase:` field), date range (`--from` / `--to` in ISO date format).
- **D-09:** Multiple filters can be combined — `pd:audit --phase 142 --from 2026-04-01` narrows by both.

### Agent's Discretion
- Exact YAML frontmatter fields (phase, date, decisions count, next_step, tags)
- Boxed table column layout for list view (follow stats/health pattern)
- `--json` flag for machine-readable output (follow stats/health pattern)
- Library file structure and function signatures
- Whether to support `--limit N` for list truncation

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Existing Patterns to Follow
- `bin/lib/stats-collector.js` — Pure function pattern: no file I/O, content passed as arguments
- `bin/lib/health-checker.js` — Pure function pattern with severity classification, boxed table output
- `commands/pd/stats.md` — Skill file structure for read-only diagnostic commands
- `commands/pd/health.md` — Skill file structure with --json flag and boxed output pattern
- `commands/pd/discover.md` — Most recent skill file (read-only, no --fix, Bash + Read tools)

### Capture Integration Point
- `~/.copilot/get-shit-done/workflows/discuss-phase.md` §write_context — Where the auto-capture hook must be inserted (after CONTEXT.md is written, before git commit)

### Planning Files Structure
- `.planning/phases/141-mcp-tool-discovery/141-DISCUSSION-LOG.md` — Example of existing DISCUSSION-LOG format (source data for distillation)
- `.planning/REQUIREMENTS.md` §L-06 — Acceptance criteria for this phase

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `bin/lib/health-checker.js`: Pure function library pattern — content passed as params, named exports, zero fs imports. Directly reusable as structural template for `audit-trail.js`.
- `bin/lib/dashboard-renderer.js`: Boxed table and summary formatting utilities used by stats and health. Reuse for `pd:audit` list/view output.
- `bin/lib/flag-parser.js`: Already handles `--flag value` parsing — reuse for `--search`, `--phase`, `--from`, `--to`, `--view`, `--json` flags.

### Established Patterns
- Pure function pattern: All library modules use `module.exports = { fn1, fn2 }` with content/paths passed as arguments, never direct `fs.readFile` inside library
- TDD: Tests in `bin/lib/{name}.test.js`, `node:test` + `node:assert/strict`, run with `node bin/lib/{name}.test.js`
- Skill file `allowed-tools`: Read + Bash for read-only commands (no Write)

### Integration Points
- `commands/pd/audit.md` — New skill file (follows `pd:{name}.md` naming)
- `bin/lib/audit-trail.js` — New library (follows `bin/lib/{name}.js` naming, pure functions)
- `.planning/contexts/` — New directory, created on first auto-capture
- `~/.copilot/get-shit-done/workflows/discuss-phase.md` §write_context — Capture hook injection point

</code_context>

<specifics>
## Specific Ideas

- "Auto-generated at end of discuss-phase" — zero friction is the key requirement. User should never have to remember to save context.
- Distilled format means: a human can read the summary in 30 seconds and know exactly what was decided and what to do next.
- `pd:audit` should feel like browsing git log — familiar, chronological, filterable.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 142-discussion-audit-trail*
*Context gathered: 2026-04-07*
