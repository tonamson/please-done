---
name: Phase 97 Tasks
description: Execution tasks for STALE-01 Staleness Detection Core
phase: 97
---

# Task List: Phase 97 — STALE-01 Staleness Detection Core

> Milestone: v11.0 Developer Tooling & Observability
> Phase: 97
> Status: Complete

## Overview

| Metric | Value |
|--------|-------|
| Total Tasks | 2 |
| Completed | 2 |
| Success Rate | 100% |

## Tasks

### Task 1: Create Staleness Detector Module

**Status:** Complete
**Assigned:** Claude Code
**Started:** 2026-04-04
**Completed:** 2026-04-04

**Description:**
Create `bin/lib/staleness-detector.js` with pure function for detecting codebase map staleness.

**Deliverables:**
- `bin/lib/staleness-detector.js` with:
  - `detectStaleness(lastMappedCommit, options)` function
  - Helper functions: `getCurrentCommit()`, `countCommitsSince()`, `calculateLevel()`, `generateRecommendation()`
  - Default threshold: 20 commits
  - Three staleness levels: fresh, aging, stale
  - Structured result object with all required fields

**Verification:**
- Function exports correctly
- Returns correct staleness level based on commit delta
- Handles errors gracefully

---

### Task 2: Create Unit Tests

**Status:** Complete
**Assigned:** Claude Code
**Started:** 2026-04-04
**Completed:** 2026-04-04

**Description:**
Create comprehensive unit tests for staleness detector module.

**Deliverables:**
- `test/staleness-detector.test.js` with 23 tests covering:
  - Constants validation
  - `calculateLevel()` boundary tests
  - `generateRecommendation()` message tests
  - `detectStaleness()` input validation
  - `getCurrentCommit()` integration
  - `countCommitsSince()` error handling
  - End-to-end integration tests

**Verification:**
```bash
$ node --test test/staleness-detector.test.js
✔ staleness-detector (643ms)
ℹ tests 23
ℹ pass 23
ℹ fail 0
```

---

## Notes

- Followed existing pattern from `bin/lib/progress-tracker.js`
- Used synchronous API with `child_process.execSync`
- Pure function design - no side effects
- No external dependencies added
- Ready for Phase 98 (metadata integration)
