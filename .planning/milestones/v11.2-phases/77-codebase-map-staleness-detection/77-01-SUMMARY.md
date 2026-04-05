---
phase: 77-codebase-map-staleness-detection
plan: "01"
subsystem: codebase-mapper
tags: [staleness-detection, codebase-map, meta-json, git]
dependency_graph:
  requires: [77-03]
  provides: [META.json write instructions in pd-codebase-mapper.md]
  affects: [.planning/codebase/META.json, 77-02-PLAN.md]
tech_stack:
  added: []
  patterns: [agent-instruction-markdown, git-sha-capture]
key_files:
  modified:
    - commands/pd/agents/pd-codebase-mapper.md
decisions:
  - "Step 6 skips silently (no error) when git rev-parse HEAD returns non-zero exit or empty output"
  - "META.json is only written when a valid 40-char SHA is available — never written with null commit"
  - "schema_version: 1 field included for future-proofing"
metrics:
  duration: "2 minutes"
  completed: "2026-04-03T02:49:30Z"
  tasks_completed: 1
  files_modified: 1
---

# Phase 77 Plan 01: Append Step 6 (META.json writer) to pd-codebase-mapper Summary

**One-liner:** Appended Step 6 to pd-codebase-mapper.md so every mapper run writes `.planning/codebase/META.json` with the current 40-char git SHA and ISO-8601 timestamp, gracefully skipping when git is unavailable.

## What Was Done

Added Step 6 to `commands/pd/agents/pd-codebase-mapper.md` — the "writer" half of STALE-01. This instructs the mapper agent to:

1. Run `git rev-parse HEAD 2>/dev/null` after completing Steps 1–5
2. If the command exits 0 and returns a valid SHA → write `.planning/codebase/META.json`
3. If git is unavailable or returns non-zero → skip silently, do NOT write META.json

### Exact Text Added

```markdown
6. **Write META.json.** Record the current git commit SHA for staleness detection:
   - Run `git rev-parse HEAD 2>/dev/null` — if the command fails (no git repo), skip this step entirely. Do NOT write META.json without a valid SHA.
   - If the command succeeds, write `.planning/codebase/META.json`:
     ```json
     {
       "schema_version": 1,
       "mapped_at_commit": "<output of git rev-parse HEAD>",
       "mapped_at": "<current ISO-8601 timestamp>"
     }
     ```
   - The `mapped_at_commit` value MUST be the full 40-character SHA hex string.
   - The `mapped_at` value MUST be an ISO-8601 timestamp (e.g., `2026-04-02T10:00:00.000Z`).
```

Inserted between Step 5's list and the `</process>` closing tag (line 39 → line 40 in original).

## Tests Turned GREEN

All 4 mapper contract tests in `test/smoke-codebase-staleness.test.js`:

| # | Test Name | Status |
|---|-----------|--------|
| 1 | META.json schema contract → sample META.json has required fields | ✔ GREEN |
| 2 | pd-codebase-mapper.md contains META.json write step → mapper file exists | ✔ GREEN |
| 3 | pd-codebase-mapper.md contains META.json write step → contains META.json write instruction | ✔ GREEN |
| 4 | pd-codebase-mapper.md contains META.json write step → references git rev-parse HEAD for SHA capture | ✔ GREEN |
| 5 | pd-codebase-mapper.md contains META.json write step → specifies mapped_at_commit field | ✔ GREEN |

*(scan.md tests remain failing — expected, those are Plan 02's scope)*

## Commits

| Hash | Message |
|------|---------|
| ce8017f | feat(77-01): write META.json after pd-codebase-mapper run |

## Deviations from Plan

None — plan executed exactly as written.

## Self-Check: PASSED

- [x] `commands/pd/agents/pd-codebase-mapper.md` — modified, contains Step 6
- [x] Commit `ce8017f` exists
- [x] All 4 mapper smoke tests GREEN
