---
phase: 37-fix-workflow-prose-gaps
plan: 01
subsystem: workflows
tags: [gap-closure, workflow-prose, integration-fix]
dependency_graph:
  requires: []
  provides: [INT-09-fix, INT-10-fix]
  affects: [workflows/fix-bug.md, test/snapshots]
tech_stack:
  added: []
  patterns: [workflow-only-edit, snapshot-regeneration]
key_files:
  created: []
  modified:
    - workflows/fix-bug.md
    - test/snapshots/codex/fix-bug.md
    - test/snapshots/copilot/fix-bug.md
    - test/snapshots/gemini/fix-bug.md
    - test/snapshots/opencode/fix-bug.md
    - test/smoke-integrity.test.js
decisions:
  - "INT-09: Buoc 5e chi ro parseFrontmatter() call va {id, frontmatter} object construction truoc khi goi buildIndex()"
  - "INT-10: Doi tu grep inconclusive_rounds sang dem ## Round headings + 1"
  - "INT-10 write: Ghi ## Round N: INCONCLUSIVE heading thay vi append inconclusive_rounds"
metrics:
  duration: 2min
  completed: 2026-03-25
---

# Phase 37 Plan 01: Fix Workflow Prose Gaps Summary

Dong 2 integration gaps cuoi cung cua v2.1 milestone: INT-09 buildIndex param shape va INT-10 round counter, chi sua prose trong fix-bug.md

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Fix INT-09 va INT-10 prose trong fix-bug.md | df36459 | workflows/fix-bug.md |
| 2 | Regenerate snapshots va verify tests | 1a024c3 | test/snapshots/*/fix-bug.md, test/smoke-integrity.test.js |

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Cap nhat integrity test regex cho INT-10 pattern moi**
- **Found during:** Task 2
- **Issue:** smoke-integrity.test.js dong 472 dung regex `/inconclusive_rounds/` de kiem tra fix-bug.md, nhung INT-10 fix da doi pattern sang `## Round N: INCONCLUSIVE`
- **Fix:** Doi regex sang `/## Round.*INCONCLUSIVE/` de match pattern moi
- **Files modified:** test/smoke-integrity.test.js
- **Commit:** 1a024c3

## Decisions Made

1. INT-09: Buoc 5e them instruction cu the goi parseFrontmatter(content) tu bin/lib/utils.js, construct {id, frontmatter} objects, truyen array cho buildIndex()
2. INT-10 read: Doi tu grep "inconclusive_rounds:" sang dem so "## Round" headings + 1 trong SESSION.md body
3. INT-10 write: Ghi "## Round N: INCONCLUSIVE" heading thay vi append "- inconclusive_rounds: N"

## Verification Results

- parseFrontmatter(content) co trong fix-bug.md: OK
- Construct object {id, frontmatter} co trong fix-bug.md: OK
- dem ## Round headings co trong fix-bug.md: OK
- ## Round INCONCLUSIVE write co trong fix-bug.md: OK
- inconclusive_rounds: pattern cu da bi xoa hoan toan: OK
- 763/763 tests pass: OK

## Known Stubs

None.
