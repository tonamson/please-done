---
phase: 76-lint-recovery-status-dashboard
plan: "01"
subsystem: workflows
tags: [lint, recovery, progress-tracking, write-code]
dependency_graph:
  requires: []
  provides: [lint-failure-tracking, lint-recovery-flow]
  affects: [workflows/write-code.md, templates/progress.md]
tech_stack:
  added: []
  patterns: [3-strike lint counter, PROGRESS.md state persistence, recovery routing]
key_files:
  created: []
  modified:
    - templates/progress.md
    - workflows/write-code.md
decisions:
  - "D-01: Only lint_fail_count and last_lint_error fields added (no resume_mode field)"
  - "D-03: Step 5 expanded with 4-step counter logic — increment, save error, retry-if-<3, STOP-if-=3"
  - "D-04: Lint-fail check inserted as sub-step 1.5 before stage-based routing table in Case 1"
metrics:
  duration: "~10 minutes"
  completed: "2026-04-03T02:26:53Z"
  tasks_completed: 1
  files_modified: 2
---

# Phase 76 Plan 01: Lint Failure Tracking Summary

**One-liner:** 3-strike lint counter with PROGRESS.md persistence, pd:fix-bug escalation, and lint-only/fresh-start recovery options on resume.

## What Was Built

Added lint failure tracking to the `write-code.md` workflow and `templates/progress.md` schema:

### templates/progress.md
- Added `> lint_fail_count: 0` and `> last_lint_error: ""` lines to the template header block (immediately after `> Stage:`)
- Added a Rules bullet explaining the lifecycle of both fields (reset when PROGRESS.md is deleted after successful commit)

### workflows/write-code.md — Step 5
Replaced the one-liner `Max 3 times → STOP` with a 4-step counter protocol:
1. Increment `lint_fail_count` in PROGRESS.md on each failure
2. Save first 500 chars of error output to `last_lint_error` (single line)
3. If `lint_fail_count < 3` → retry fix + rerun
4. If `lint_fail_count` reaches 3 → save PROGRESS.md → **STOP** with message surfacing `/pd:fix-bug` and `/pd:write-code` resume instructions

### workflows/write-code.md — Step 1.1 Case 1
Inserted sub-step **1.5** between "Read PROGRESS.md" and "Verify actual state on disk":
- Reads `lint_fail_count` from PROGRESS.md header
- If `>= 3`: offers **(A) Lint-only resume** (skip Steps 2–4, jump to Step 5) or **(B) Fresh start** (delete PROGRESS.md, go to Step 2)
- If `< 3` or field absent: falls through to standard stage-based routing

## Verification Results

All 6 automated checks passed:
- ✅ `grep -c "lint_fail_count: 0" templates/progress.md` → 1
- ✅ `grep -c "last_lint_error" templates/progress.md` → ≥ 1
- ✅ `grep -c "lint_fail_count" workflows/write-code.md` → ≥ 3
- ✅ `grep -q "Lint-only" workflows/write-code.md`
- ✅ `grep -q "lint_fail_count >= 3" workflows/write-code.md`
- ✅ `grep -q "pd:fix-bug" workflows/write-code.md`

**npm test:** Zero new failures introduced. All pre-existing failures (snapshot tests, guard micro-templates, smoke-security-rules) were present before this plan's changes.

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

None — both modified files are workflow/template documents, not code with data sources.

## Self-Check: PASSED

- `templates/progress.md` modified ✅
- `workflows/write-code.md` modified ✅
- Commit `d2af364` exists ✅
