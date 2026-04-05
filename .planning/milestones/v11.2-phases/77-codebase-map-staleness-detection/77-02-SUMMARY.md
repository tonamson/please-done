---
phase: 77-codebase-map-staleness-detection
plan: "02"
subsystem: workflows
tags: [staleness-detection, scan, workflow, codebase-map]
dependency_graph:
  requires: [77-03]
  provides: [scan.md Step 0 staleness check]
  affects: [workflows/scan.md]
tech_stack:
  added: []
  patterns: [non-blocking guard step, graceful fallback, informational warning]
key_files:
  modified:
    - workflows/scan.md
decisions:
  - "Step 0 is purely non-blocking — every code path ends with 'continue to Step 1'"
  - "2>/dev/null suppresses git errors (shallow clone, missing SHA, no git)"
  - "Exact commit count N required in warning (not vague 'may be stale')"
  - "Threshold is 20 commits; N ≤ 20 produces no output"
  - "Prompt is /pd:scan specifically (not /pd:init or other variants)"
metrics:
  duration_seconds: 60
  completed_date: "2026-04-03T02:49:50Z"
  tasks_completed: 1
  files_modified: 1
---

# Phase 77 Plan 02: Staleness Check Step 0 in scan.md Summary

**One-liner:** Non-blocking Step 0 inserted into scan.md reads META.json mapped_at_commit, runs `git rev-list <sha>..HEAD --count`, and warns when > 20 commits behind.

## What Was Built

Inserted **Step 0: Check codebase map freshness (non-blocking)** into `workflows/scan.md` immediately before existing Step 1. The step:

1. Reads `.planning/codebase/META.json` — silently skips to Step 1 if absent
2. Extracts `mapped_at_commit` — silently skips if missing/empty
3. Runs `git rev-list <mapped_at_commit>..HEAD --count 2>/dev/null` — skips on any git error
4. If `N > 20`: emits a blockquote warning with the exact count and `/pd:scan` prompt
5. If `N ≤ 20`: produces no output
6. **Always continues to Step 1** — purely informational, never blocks scan

## Exact Text Inserted

```markdown
## Step 0: Check codebase map freshness (non-blocking)
- Read `.planning/codebase/META.json` → if file does not exist → skip to Step 1.
- Extract the `mapped_at_commit` field → if missing or empty → skip to Step 1.
- Run: `git rev-list <mapped_at_commit>..HEAD --count 2>/dev/null`
  - If command fails (no git, invalid SHA, shallow clone) → skip silently to Step 1.
- Parse output as integer `N`.
- If `N > 20`:
  > ⚠️ **Codebase map is stale** — generated **N commits ago** (where N is the actual count).
  > Run `/pd:scan` to refresh before continuing for accurate results.
- If `N ≤ 20` → no output, continue silently.
- **Always continue to Step 1 regardless of outcome.**
```

## Tests Turned GREEN

All 5 `scan.md` smoke tests in `test/smoke-codebase-staleness.test.js`:

| Test | Status |
|------|--------|
| `scan.md file exists` | ✔ GREEN |
| `contains Step 0` | ✔ GREEN |
| `reads META.json for staleness check` | ✔ GREEN |
| `uses git rev-list for commit delta counting` | ✔ GREEN |
| `specifies threshold of 20 commits and prompts pd:scan` | ✔ GREEN |

Full suite: **11/11 pass** (including pre-existing mapper and schema tests).

## Commits

| Hash | Description |
|------|-------------|
| 39ab3b8 | feat(77-02): add staleness check Step 0 to scan.md |

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

None.

## Self-Check: PASSED
- `workflows/scan.md` modified ✔
- All grepped patterns present ✔
- Commit `39ab3b8` exists ✔
- 11/11 tests pass ✔
