# Phase 72: System Integration Sync - Context

**Gathered:** 2026-03-30
**Status:** Ready for planning

<domain>
## Phase Boundary

Update cross-referenced system files (`state-machine.md`, `what-next.md`, `complete-milestone.md`) so the rest of the please-done system recognizes standalone mode — prerequisites, progress detection, and bug filtering.

</domain>

<decisions>
## Implementation Decisions

### State-Machine Prerequisites

- **D-01:** Add a new row to the Prerequisites table for `/pd:test --standalone` with "Required to exist" = `—` (no prerequisites) and "If missing" = `—` (always runnable). Standalone mode works without CONTEXT.md, PLAN.md, TASKS.md, or any `.planning/` files.
- **D-02:** Add `/pd:test --standalone` as a side branch in the "Side branches" section — it can run anytime, even without `/pd:init`. Format: `- /pd:test --standalone → standalone test (no prerequisites)`.
- **D-03:** The existing `/pd:test` Prerequisites row remains unchanged (still requires `CONTEXT.md + PLAN.md + TASKS.md (≥1 task ✅)`). Only a NEW row is added for the standalone variant.

### what-next Standalone Detection

- **D-04:** Add standalone detection at Priority 5.7 (after untested phases at 5.6, before "All ✅, not tested" at 6). Condition: `STANDALONE_TEST_REPORT_*.md exists in .planning/reports/` with failed tests or open standalone bugs.
- **D-05:** Detect standalone reports via glob: `.planning/reports/STANDALONE_TEST_REPORT_*.md`. Count reports and check for failures.
- **D-06:** In Step 2 (Check open bugs), filter standalone bugs separately by matching `> Patch version: standalone` in bug file headers. Show them as a separate note: "Standalone bugs: [N] (not blocking milestone)."
- **D-07:** Add display line in Step 5 report: `Standalone tests: [N] report(s) | Standalone bugs: [M] open` — only when standalone reports or bugs exist.

### complete-milestone Bug Filtering

- **D-08:** In Step 3 (Check bugs), identify standalone bugs by matching `> Patch version: standalone` in the bug file header line. These bugs are excluded from the milestone blocker count.
- **D-09:** Log skipped standalone bugs: "Skipped [N] standalone bug(s) — not tied to milestone v[x.x]." This is informational only, does not block completion.
- **D-10:** Standalone bugs do NOT appear in the MILESTONE_COMPLETE.md "Fixed Bugs" table — they are outside milestone scope.

### Agent's Discretion

- Exact wording of the standalone side branch description in state-machine diagram
- Whether to show standalone bug details or just count in what-next display
- Formatting of the standalone line in the what-next progress report

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Primary Target Files

- `references/state-machine.md` — Prerequisites table and side branches; Task 1 modifies this
- `workflows/what-next.md` — Progress scanner and suggestion engine; Task 2 modifies this
- `workflows/complete-milestone.md` — Milestone completion with bug checking; Task 3 modifies this

### Phase 71 Context (locked decisions)

- `.planning/phases/71-core-standalone-flow/71-CONTEXT.md` — D-11 (report filename format), D-13 (Patch version: standalone), D-06 (guard bypass)

### Supporting References

- `references/conventions.md` — Status icons, version filtering rules, commit prefixes
- `.planning/REQUIREMENTS.md` — SYNC-01, SYNC-02, SYNC-03 acceptance criteria

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets

- `references/state-machine.md` Prerequisites table: Markdown table format with 3 columns — new row follows same pattern
- `workflows/what-next.md` Step 2: Bug scanning with glob + grep pattern — reusable for standalone bug detection
- `workflows/what-next.md` Step 4: Priority table — new Priority 5.7 inserted between 5.6 and 6
- `workflows/complete-milestone.md` Step 3: Bug scanning with `Patch version:` grep — filter logic extends naturally

### Established Patterns

- Bug version filtering: `> Patch version:` header line in bug files, matched against current milestone version (see `references/conventions.md` → "Version filtering")
- Side branches in state-machine: simple bullet list format under "Side branches" heading
- what-next priority table: ascending numeric priority, each row = condition + suggestion

### Integration Points

- `references/state-machine.md` Prerequisites table: Insert new row after `/pd:test` row
- `references/state-machine.md` Side branches section: Append new bullet
- `workflows/what-next.md` Step 2: Add standalone bug filtering after milestone bug filtering
- `workflows/what-next.md` Step 4: Insert Priority 5.7 row
- `workflows/what-next.md` Step 5: Add standalone line to display report
- `workflows/complete-milestone.md` Step 3: Add standalone bug skip logic before blocker check

</code_context>

<specifics>
## Specific Ideas

- Standalone bugs are identified by literal string `Patch version: standalone` — this is NOT a version number, it's a mode tag (per Phase 71 D-13)
- The what-next Priority 5.7 should suggest `/pd:fix-bug` for failed standalone tests, similar to Priority 1 for regular bugs
- State-machine side branch for standalone should make clear that no `/pd:init` is needed — this is the key differentiator

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 72-system-integration-sync*
*Context gathered: 2026-03-30*
