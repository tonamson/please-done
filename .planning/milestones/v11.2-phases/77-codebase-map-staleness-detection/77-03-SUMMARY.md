---
phase: 77-codebase-map-staleness-detection
plan: "03"
subsystem: test
tags: [tdd, smoke-test, stale-detection, wave-0]
dependency_graph:
  requires: []
  provides: [smoke-codebase-staleness-test-scaffold]
  affects: [test/smoke-codebase-staleness.test.js]
tech_stack:
  added: []
  patterns: [node:test, node:assert/strict, readFileSync prose contract]
key_files:
  created:
    - test/smoke-codebase-staleness.test.js
  modified: []
decisions:
  - "Wave 0 TDD: tests intentionally RED for mapper/scan contracts; GREEN only for fixture suites"
  - "11 test cases across 4 describe blocks covering all STALE-01 acceptance criteria"
metrics:
  duration: "3m"
  completed: "2026-04-03T02:47:00Z"
  tasks_completed: 1
  files_changed: 1
---

# Phase 77 Plan 03: Smoke-Codebase-Staleness Test Scaffold Summary

TDD Wave 0 test scaffold for STALE-01 staleness detection — 11 test cases in `test/smoke-codebase-staleness.test.js` that are intentionally RED for prose-contract suites until Plans 01+02 modify the target markdown files.

## What Was Built

Created `test/smoke-codebase-staleness.test.js` (109 lines, 11 test cases) following the project pattern from `test/smoke-session-delta.test.js` using `node:test` + `node:assert/strict`.

### Test Suites (4 describe blocks, 11 tests)

| Suite | Tests | State |
|-------|-------|-------|
| `META.json schema contract` | 1 | ✅ GREEN (fixture data) |
| `pd-codebase-mapper.md contains META.json write step` | 4 | 🔴 RED until Plan 01 |
| `scan.md contains Step 0 staleness check` | 5 | 🔴 RED until Plan 02 |
| `git rev-list command syntax` | 1 | ✅ GREEN (fixture data) |

### GREEN Tests (Pass Now)

1. **META.json schema**: sample object with `schema_version=1`, 40-char hex `mapped_at_commit`, ISO-8601 `mapped_at`
2. **mapper file exists**: `fs.existsSync` check on `commands/pd/agents/pd-codebase-mapper.md`
3. **scan.md file exists**: `fs.existsSync` check on `workflows/scan.md`
4. **git rev-list command syntax**: fixture string validates `git rev-list <sha>..HEAD --count 2>/dev/null`

### RED Tests (Fail Until Wave 1)

**Mapper tests (Plan 01 will turn GREEN):**
5. `contains META.json write instruction` — asserts `content.includes('META.json')`
6. `references git rev-parse HEAD for SHA capture` — asserts `content.includes('git rev-parse HEAD')`
7. `specifies mapped_at_commit field` — asserts `content.includes('mapped_at_commit')`

**Scan.md tests (Plan 02 will turn GREEN):**
8. `contains Step 0` — asserts `content.includes('Step 0')`
9. `reads META.json for staleness check` — asserts `content.includes('META.json')`
10. `uses git rev-list for commit delta counting` — asserts `content.includes('git rev-list')`
11. `specifies threshold of 20 commits and prompts pd:scan` — asserts `/\b20\b/` and `/pd:scan/`

## Verification

```
node -c test/smoke-codebase-staleness.test.js  → SYNTAX OK (exit 0)
wc -l test/smoke-codebase-staleness.test.js    → 109 lines (≥ 60 required)
node --test test/smoke-codebase-staleness.test.js → 4 pass, 7 fail (expected TDD RED)
```

## Deviations from Plan

None — plan executed exactly as written. The 7 failing tests are the intended TDD RED state for Wave 0.

## Self-Check: PASSED

- [x] `test/smoke-codebase-staleness.test.js` exists (109 lines)
- [x] Commit `691d488` exists
- [x] Syntax check passes (`node -c`)
- [x] Fixture suites GREEN (4 pass)
- [x] Prose-contract suites RED (7 fail) — correct for Wave 0
