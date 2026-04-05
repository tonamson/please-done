# Phase 72: System Integration Sync - Research

**Researched:** 2026-03-30
**Domain:** Markdown workflow/reference file updates
**Confidence:** HIGH

## Summary

Phase 72 updates three markdown files (`state-machine.md`, `what-next.md`, `complete-milestone.md`) so the rest of the please-done system recognizes standalone test mode introduced in Phase 71. All changes are additive — existing content remains untouched, only new rows/sections/lines are inserted.

The phase is low-risk: each file has clear insertion points, well-defined patterns to follow, and existing test infrastructure that validates structure. The primary concern is snapshot test synchronization — 4 platform snapshots for `what-next.md` and `complete-milestone.md` must be updated to match, plus `smoke-security-wire.test.js` may need new assertions for standalone wiring.

**Primary recommendation:** Treat each file as an independent task. Follow existing table/section patterns exactly. Regenerate snapshots after edits.

<user_constraints>

## User Constraints (from CONTEXT.md)

### Locked Decisions

- **D-01:** Add a new row to the Prerequisites table for `/pd:test --standalone` with "Required to exist" = `—` (no prerequisites) and "If missing" = `—` (always runnable). Standalone mode works without CONTEXT.md, PLAN.md, TASKS.md, or any `.planning/` files.
- **D-02:** Add `/pd:test --standalone` as a side branch in the "Side branches" section — it can run anytime, even without `/pd:init`. Format: `- /pd:test --standalone → standalone test (no prerequisites)`.
- **D-03:** The existing `/pd:test` Prerequisites row remains unchanged (still requires `CONTEXT.md + PLAN.md + TASKS.md (≥1 task ✅)`). Only a NEW row is added for the standalone variant.
- **D-04:** Add standalone detection at Priority 5.7 (after untested phases at 5.6, before "All ✅, not tested" at 6). Condition: `STANDALONE_TEST_REPORT_*.md exists in .planning/reports/` with failed tests or open standalone bugs.
- **D-05:** Detect standalone reports via glob: `.planning/reports/STANDALONE_TEST_REPORT_*.md`. Count reports and check for failures.
- **D-06:** In Step 2 (Check open bugs), filter standalone bugs separately by matching `> Patch version: standalone` in bug file headers. Show them as a separate note: "Standalone bugs: [N] (not blocking milestone)."
- **D-07:** Add display line in Step 5 report: `Standalone tests: [N] report(s) | Standalone bugs: [M] open` — only when standalone reports or bugs exist.
- **D-08:** In Step 3 (Check bugs), identify standalone bugs by matching `> Patch version: standalone` in the bug file header line. These bugs are excluded from the milestone blocker count.
- **D-09:** Log skipped standalone bugs: "Skipped [N] standalone bug(s) — not tied to milestone v[x.x]." This is informational only, does not block completion.
- **D-10:** Standalone bugs do NOT appear in the MILESTONE_COMPLETE.md "Fixed Bugs" table — they are outside milestone scope.

### Claude's Discretion

- Exact wording of the standalone side branch description in state-machine diagram
- Whether to show standalone bug details or just count in what-next display
- Formatting of the standalone line in the what-next progress report

### Deferred Ideas (OUT OF SCOPE)

None — discussion stayed within phase scope.

</user_constraints>

<phase_requirements>

## Phase Requirements

| ID      | Description                                                                        | Research Support                                                                                                     |
| ------- | ---------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| SYNC-01 | `state-machine.md` updated with standalone prerequisites row + side branch         | Prerequisites table row pattern (D-01, D-03) + side branch bullet pattern (D-02) documented in Architecture Patterns |
| SYNC-02 | `what-next.md` detects standalone test reports and standalone bugs                 | Step 2 bug filtering pattern + Priority table insertion point + Step 5 report display documented                     |
| SYNC-03 | `complete-milestone.md` skips standalone bugs (doesn't block milestone completion) | Step 3 bug filtering pattern + `Patch version:` grep documented                                                      |

</phase_requirements>

## Project Constraints (from CLAUDE.md)

- Use English throughout, with standard grammar and spelling

## Standard Stack

No external libraries or packages — this phase modifies only markdown files.

| Asset                             | Purpose                                | Location                          |
| --------------------------------- | -------------------------------------- | --------------------------------- |
| `references/state-machine.md`     | Prerequisites table + side branches    | `references/state-machine.md`     |
| `workflows/what-next.md`          | Progress scanner with priority table   | `workflows/what-next.md`          |
| `workflows/complete-milestone.md` | Milestone completion with bug checking | `workflows/complete-milestone.md` |
| `references/conventions.md`       | Version filtering rules, status icons  | `references/conventions.md`       |

## Architecture Patterns

### Task 1: state-machine.md — Two Insertion Points

**Point A — Prerequisites table (line ~47):** Insert new row after the existing `/pd:test` row.

Current `/pd:test` row:

```markdown
| `/pd:test` | CONTEXT.md + PLAN.md + TASKS.md (≥1 task ✅) | "Run `/pd:write-code` first" |
```

New row to add (D-01):

```markdown
| `/pd:test --standalone` | — | — |
```

**Point B — Side branches section (line ~18):** Append bullet to existing side branches list.

Current list:

```markdown
**Side branches** (anytime after init):

- `/pd:fix-bug` → investigate + fix bug
- `/pd:what-next` → check progress
- `/pd:fetch-doc` → cache documentation
- `/pd:update` → update skills
- `/pd:audit` → security audit milestone
```

New bullet to add (D-02):

```markdown
- `/pd:test --standalone` → standalone test (no prerequisites)
```

### Task 2: what-next.md — Three Insertion Points

**Point A — Step 2 (Check open bugs):** After the milestone bug filtering, add standalone bug detection.

Current Step 2:

```markdown
## Step 2: Check open bugs

Glob `.planning/bugs/BUG_*.md` → grep `> Status:` (Unresolved/In progress) + `> Patch version:` → filter current milestone per @references/conventions.md → "Version filtering"

- HAS open bugs → note
- Bugs from other milestones → note separately, secondary suggestion
```

Add after existing content (D-06):

```markdown
- Standalone bugs: match `> Patch version: standalone` → count separately, note: "Standalone bugs: [N] (not blocking milestone)."
```

**Point B — Step 4 priority table:** Insert Priority 5.7 row between 5.6 and 6.

Current rows:

```markdown
| 5.6 | Completed old phase not tested | `/pd:test` (auto-detect phase) |
| 6 | All ✅, not tested/test fail | `/pd:test` or `/pd:fix-bug` |
```

Insert between them (D-04, D-05):

```markdown
| 5.7 | Standalone reports with failures or open standalone bugs | `/pd:fix-bug` — standalone |
```

**Point C — Step 5 display report:** Add standalone line to the report box (D-07).

Current report:

```
║ Requirements: [X]/[Y] | Open bugs: [N] ║
```

Add line (only when standalone data exists):

```
║ Standalone tests: [N] report(s) | Standalone bugs: [M] open ║
```

**Point D — Step 3 sub-step 6 (untested old phases):** Add sub-step 8 for standalone report scanning.

Current sub-step 6:

```markdown
6. **Scan untested old phases**: each `milestones/[version]/phase-*/` → ALL tasks ✅ + NO TEST_REPORT → note (Priority 5.6)
```

Add sub-step 8 (D-05):

```markdown
8. **Scan standalone reports**: Glob `.planning/reports/STANDALONE_TEST_REPORT_*.md` → count reports, check for failures → note (Priority 5.7)
```

### Task 3: complete-milestone.md — Single Insertion Point

**Step 3 (Check bugs):** Add standalone bug filtering before the milestone blocker check.

Current Step 3:

```markdown
## Step 3: Check bugs

Scan `.planning/bugs/BUG_*.md` → line `> Status:`.
Match rules: see @references/conventions.md → "Version filtering"

- Skip bugs from other milestones
- Has **Unresolved/In progress** → **BLOCK**: "Still [X] unresolved bugs for v[x.x]. Run `/pd:fix-bug`."
- All **Resolved** → allow
```

Add after "Skip bugs from other milestones" (D-08, D-09, D-10):

```markdown
- Skip standalone bugs: match `> Patch version: standalone` → exclude from milestone blocker count. Log: "Skipped [N] standalone bug(s) — not tied to milestone v[x.x]."
```

### Anti-Patterns to Avoid

- **Modifying existing rows/logic:** Only ADD new rows/lines. Never change the existing `/pd:test` prerequisites row or current bug filtering logic.
- **Forgetting snapshot updates:** The `test/snapshots/{codex,copilot,gemini,opencode}/what-next.md` and `complete-milestone.md` files contain converted snapshots of these workflows. Changes to the source workflow files require regenerating these snapshots.

## Don't Hand-Roll

| Problem                  | Don't Build               | Use Instead                                            | Why                                                                                               |
| ------------------------ | ------------------------- | ------------------------------------------------------ | ------------------------------------------------------------------------------------------------- |
| Standalone bug detection | Custom detection logic    | Existing `Patch version:` grep pattern                 | Same grep pattern used across all bugs, just match literal `standalone` instead of version number |
| Version filtering        | New filter for standalone | Existing convention: "Skip bugs from other milestones" | Standalone is just another case of "not this milestone"                                           |

## Common Pitfalls

### Pitfall 1: Snapshot Desync

**What goes wrong:** Tests fail because `test/snapshots/{platform}/what-next.md` and `test/snapshots/{platform}/complete-milestone.md` don't reflect new content.
**Why it happens:** `smoke-security-wire.test.js` reads snapshots and asserts content presence. The inline workflow conversion (`inlineWorkflow()`) produces snapshots from skill files that include workflow content.
**How to avoid:** After editing workflow source files, regenerate all 4 platform snapshots for each changed file. Run `npm test` to verify.
**Warning signs:** `smoke-security-wire.test.js` or `smoke-integrity.test.js` failures.

### Pitfall 2: Incorrect Priority Table Ordering

**What goes wrong:** Priority 5.7 inserted at wrong position, breaking priority sequence.
**Why it happens:** The priority table uses ascending numeric order. Inserting at wrong line breaks the scan logic.
**How to avoid:** Insert the 5.7 row directly between the 5.6 row and the 6 row.
**Warning signs:** `what-next` suggestions in wrong priority order.

### Pitfall 3: Standalone Bug Matching False Positives

**What goes wrong:** Non-standalone bugs accidentally matched or standalone bugs counted as milestone blockers.
**Why it happens:** Using substring match instead of exact match on `Patch version: standalone`.
**How to avoid:** Match the exact literal string `Patch version: standalone` — not just `standalone` substring.
**Warning signs:** Milestone blocked by standalone bugs, or standalone bugs appearing in milestone reports.

### Pitfall 4: Existing smoke-security-wire.test.js assertions

**What goes wrong:** New standalone content needs corresponding test assertions, but existing assertions (WIRE-01 through WIRE-03b) check for security audit wiring.
**Why it happens:** The test file verifies that cross-file references are wired correctly.
**How to avoid:** The planner should consider whether new assertions for standalone wiring are needed in `smoke-security-wire.test.js` or a new test file.
**Warning signs:** No test coverage for the new standalone content.

## Code Examples

### Example: Existing side branch format in state-machine.md

```markdown
**Side branches** (anytime after init):

- `/pd:fix-bug` → investigate + fix bug
- `/pd:what-next` → check progress
- `/pd:fetch-doc` → cache documentation
- `/pd:update` → update skills
- `/pd:audit` → security audit milestone
```

### Example: Existing prerequisites row format

```markdown
| `/pd:test` | CONTEXT.md + PLAN.md + TASKS.md (≥1 task ✅) | "Run `/pd:write-code` first" |
```

### Example: Existing priority table row format in what-next.md

```markdown
| 5.6 | Completed old phase not tested | `/pd:test` (auto-detect phase) |
```

### Example: Existing bug filtering in complete-milestone.md Step 3

```markdown
- Skip bugs from other milestones
- Has **Unresolved/In progress** → **BLOCK**: ...
```

### Example: Bug file header with standalone version (from Phase 71 D-13)

```markdown
> Patch version: standalone
```

## State of the Art

No external technology changes — this phase is internal markdown maintenance.

| Phase 71 Output                                 | Phase 72 Integration                                                           |
| ----------------------------------------------- | ------------------------------------------------------------------------------ |
| `STANDALONE_TEST_REPORT_[timestamp].md` reports | `what-next.md` scans for these reports (D-05)                                  |
| `Patch version: standalone` bugs                | `what-next.md` filters separately (D-06), `complete-milestone.md` skips (D-08) |
| `/pd:test --standalone` command                 | `state-machine.md` documents prerequisites (D-01) and side branch (D-02)       |

## Validation Architecture

### Test Framework

| Property           | Value                                          |
| ------------------ | ---------------------------------------------- |
| Framework          | Node.js built-in test runner (node:test)       |
| Config file        | None — uses `node --test` directly             |
| Quick run command  | `node --test test/smoke-security-wire.test.js` |
| Full suite command | `npm test`                                     |

### Phase Requirements → Test Map

| Req ID  | Behavior                                                        | Test Type                | Automated Command                              | File Exists?              |
| ------- | --------------------------------------------------------------- | ------------------------ | ---------------------------------------------- | ------------------------- |
| SYNC-01 | state-machine.md has standalone prerequisites row + side branch | smoke (string assertion) | `node --test test/smoke-security-wire.test.js` | ✅ (needs new assertions) |
| SYNC-02 | what-next.md detects standalone reports + bugs separately       | smoke (string assertion) | `node --test test/smoke-security-wire.test.js` | ✅ (needs new assertions) |
| SYNC-03 | complete-milestone.md skips standalone bugs                     | smoke (string assertion) | `node --test test/smoke-security-wire.test.js` | ✅ (needs new assertions) |

### Sampling Rate

- **Per task commit:** `node --test test/smoke-security-wire.test.js`
- **Per wave merge:** `npm test`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps

- [ ] New assertions in `test/smoke-security-wire.test.js` for standalone wiring (SYNC-01: state-machine has standalone row + side branch, SYNC-02: what-next has Priority 5.7 + standalone display, SYNC-03: complete-milestone has standalone skip)
- [ ] Snapshot regeneration for `test/snapshots/{codex,copilot,gemini,opencode}/what-next.md` and `test/snapshots/{codex,copilot,gemini,opencode}/complete-milestone.md`

## Open Questions

1. **Snapshot regeneration method**
   - What we know: Snapshots exist at `test/snapshots/{platform}/{workflow}.md` for 4 platforms. `smoke-security-wire.test.js` reads these and asserts content.
   - What's unclear: Exact command/script to regenerate snapshots (may be manual copy or automated converter).
   - Recommendation: Run existing converter scripts or manually regenerate after editing. Check `package.json` scripts and `bin/` for converter tools.

## Sources

### Primary (HIGH confidence)

- `references/state-machine.md` — read directly, full file structure analyzed
- `workflows/what-next.md` — read directly, all steps/priorities mapped
- `workflows/complete-milestone.md` — read directly, Steps 1–10 including bug filtering
- `references/conventions.md` — read directly, version filtering and `Patch version:` format
- `.planning/phases/71-core-standalone-flow/71-CONTEXT.md` — Phase 71 decisions (D-11, D-13)
- `test/smoke-security-wire.test.js` — read directly, existing wire integration test patterns
- `test/smoke-state-machine.test.js` — read directly, state machine test patterns

## Metadata

**Confidence breakdown:**

- Standard stack: HIGH — all target files read and analyzed directly
- Architecture: HIGH — insertion points identified precisely with line-level context
- Pitfalls: HIGH — test infrastructure analyzed, snapshot requirements documented

**Research date:** 2026-03-30
**Valid until:** No expiry — internal project files, no external dependencies
