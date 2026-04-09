# Phase 155: GSD Independence Audit & Cleanup - Context

**Gathered:** 2026-04-09
**Status:** Ready for planning (work already complete — context captured post-execution)

<domain>
## Phase Boundary

Audit every non-.planning file for GSD references, remove any found, update the test suite to confirm no regressions, and ensure pd skills describe themselves as a standalone suite. Does NOT touch `.planning/` contents (internal planning artifacts).

</domain>

<decisions>
## Implementation Decisions

### GSD reference scan approach
- **D-01:** Case-sensitive grep only (`GSD`, `get-shit-done`, `gsd-*`) — avoids false positives from substring matches (e.g. `logsDir` contains `gsd` case-insensitively but is unrelated)
- **D-02:** Scan scope: all files outside `.planning/` directory
- **D-03:** Result: zero genuine GSD references found — prior commit `e29895f` already handled all removal

### Test suite fix scope
- **D-04:** Fix all stale tests that were pre-existing failures unrelated to GSD removal
- **D-05:** Platform count: updated 7 → 11 (Kilo, Antigravity, Augment, Trae added in v12.5)
- **D-06:** Windsurf dirName: updated `.windsurf` → `.codeium/windsurf` (changed in v12.5)
- **D-07:** Plan checker historical paths: `.planning/phases/` → `.planning/milestones/v11.2-phases/` (after milestone archiving)
- **D-08:** Pre-existing integration failures (logging env, network, STATE.md) are NOT in scope — do not fix

### Skill structure fixes
- **D-09:** Add missing `<execution_context>` section to `discover`, `health`, `stats`, `sync-version` skills (required by canonical structure test)
- **D-10:** Expand `ALLOWED_NO_WORKFLOW` whitelist to include `audit`, `discover`, `health`, `stats`, `sync-version` — these are utility/inline skills with no dedicated workflow file
- **D-11:** Remove orphaned `workflows/audit.md` — `pd:audit` was repurposed to audit-trail viewer; old security scan workflow was unreferenced by any command

### Snapshots
- **D-12:** Regenerate converter snapshots for all 4 platforms × 4 affected skills (discover, health, stats, sync-version) after adding `<execution_context>` sections

### the agent's Discretion
- Exact wording of `<execution_context>` content for inline skills

</decisions>

<specifics>
## Specific Ideas

- Work was executed inline this session without formal plan files
- Test failures: 127 pre-existing → 21 remaining (all integration/env failures outside scope)
- Commits pushed: `34cf195` (milestone init), `fbbc74f` (fixes)

</specifics>

<canonical_refs>
## Canonical References

### Skill structure requirements
- `test/smoke-integrity.test.js` — Canonical skill structure validator; defines `REQUIRED_SECTIONS` order and `ALLOWED_NO_WORKFLOW` whitelist
- `test/smoke-snapshot.test.js` — Converter output snapshot tests; regenerated via `node test/generate-snapshots.js`

### Platform definitions
- `bin/lib/platforms.js` — Source of truth for 11 platforms; windsurf at `.codeium/windsurf`

### Historical plan paths
- `.planning/milestones/v11.2-phases/` — Location of archived v11.2 phase plans (moved from `.planning/phases/`)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `bin/lib/utils.js` — `inlineWorkflow()`, `parseFrontmatter()`, `listSkillFiles()` used by tests
- `test/generate-snapshots.js` — Snapshot regeneration script, run after any skill content changes

### Established Patterns
- All inline skills (no external workflow) must include `<execution_context>` stating "No external workflow needed"
- Skills referencing `@workflows/X.md` must have workflow inlined at planning time

### Integration Points
- `workflows/` dir ↔ `commands/pd/` dir: names must match for inline test to trigger
- `test/snapshots/` dir: auto-generated, must be regenerated after skill changes

</code_context>

<deferred>
## Deferred Ideas

- Pre-existing integration test failures (logging, pd-onboard, pd-status-workflow, recon) — separate investigation task if needed

</deferred>

---

*Phase: 155-gsd-independence-audit-cleanup*
*Context gathered: 2026-04-09*
