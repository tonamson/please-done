---
phase: 31-project-memory-regression-detection
plan: 01
subsystem: bug-memory
tags: [tdd, pure-function, bug-tracking, scoring]
dependency_graph:
  requires: [bin/lib/utils.js]
  provides: [bin/lib/bug-memory.js, test/smoke-bug-memory.test.js]
  affects: []
tech_stack:
  added: []
  patterns: [pure-function, 3-field-scoring, case-insensitive-matching]
key_files:
  created:
    - bin/lib/bug-memory.js
    - test/smoke-bug-memory.test.js
  modified: []
key_decisions:
  - "buildIndex dung bold markdown (**Tong so:**) cho header — nhat quan voi INDEX format"
  - "Error message keyword extraction lay phan truoc dau ':' lam keyword chinh"
  - "searchBugs file/error dung bi-directional substring, function dung exact match — giam false positive"
metrics:
  duration: 3min
  completed: "2026-03-25T05:02:00Z"
  tasks_completed: 1
  tasks_total: 1
  test_count: 23
  lines_added: 538
---

# Phase 31 Plan 01: Bug Memory Core Module Summary

TDD tao module bug-memory.js voi 3 ham pure function — createBugRecord (BUG-{NNN}.md + YAML frontmatter), searchBugs (3-field scoring case-insensitive), buildIndex (4-section INDEX.md).

## Commits

| Hash | Type | Message |
|------|------|---------|
| 13d6d96 | test | add failing tests for bug-memory module (RED) |
| 8e03cc4 | feat | implement bug-memory createBugRecord searchBugs buildIndex (GREEN) |

## Task Results

### Task 1: TDD bug-memory.js (createBugRecord, searchBugs, buildIndex)

**Status:** Hoan tat
**TDD:** RED (13d6d96) -> GREEN (8e03cc4)

**createBugRecord:**
- Tao BUG-{NNN}.md voi YAML frontmatter (6 truong: file, function, error_message, session_id, resolved_date, status)
- Validate bat buoc: file va rootCause (throw Error neu thieu)
- Number logic: max+1 tu existingBugs, khong reuse IDs

**searchBugs:**
- 3-field scoring: file (substring bi-directional), function (exact), error_message (substring bi-directional)
- Case-insensitive tat ca
- Score >= 1 duoc tra ve, sort DESC
- Guard: thieu tat ca tieu chi -> warning, bugRecord khong co frontmatter -> warning

**buildIndex:**
- 4 sections: Theo File, Theo Function, Theo Keyword (Error Message), Tat ca Bugs
- Header voi timestamp va tong so bugs
- Keyword extraction: lay phan truoc ':' tu error message

## Verification

- `node --test test/smoke-bug-memory.test.js`: 23/23 pass
- `grep "require('fs')" bin/lib/bug-memory.js`: chi trong comment, khong co actual require
- `module.exports = { createBugRecord, searchBugs, buildIndex }`: xac nhan
- `require('./utils')`: xac nhan

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Test 19 assertion khong match bold markdown format**
- **Found during:** GREEN phase
- **Issue:** Test kiem tra `'Tong so: 0 bugs'` nhung output la `'**Tong so:** 0 bugs'` (bold markdown)
- **Fix:** Tach assert thanh 2 phan: check `'Tong so:**'` va `'0 bugs'` rieng
- **Files modified:** test/smoke-bug-memory.test.js
- **Commit:** 8e03cc4

## Known Stubs

None — tat ca 3 ham da implement day du, khong co placeholder.

## Self-Check: PASSED
