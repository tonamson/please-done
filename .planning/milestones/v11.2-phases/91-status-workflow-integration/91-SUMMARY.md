---
phase: "91"
name: status-workflow-integration
version: "1.0"
subsystem: workflow
plan: "91"
tags: [status, workflow, integration, auto-refresh, staleness-detection]
dependency_graph:
  requires: ["90"]
  provides: ["pd:status skill integration", "auto-refresh detection", "what-next suggestions"]
  affects: ["STATE.md", "what-next.md", "pd:status command", "docs"]
tech_stack:
  added:
    - refresh-detector.js (pure function library)
    - refresh-detector.test.js (32 unit tests)
    - pd-status-workflow.integration.test.js (17 integration tests)
key_files:
  created:
    - bin/lib/refresh-detector.js
    - test/refresh-detector.test.js
    - test/pd-status-workflow.integration.test.js
  modified:
    - .planning/STATE.md
    - workflows/what-next.md
    - README.md
    - CLAUDE.md
    - docs/commands/status.md
    - commands/pd/status.md
    - test/snapshots/*/status.md (4 platforms)
    - test/snapshots/*/what-next.md (4 platforms)
decisions:
  - "Default staleness threshold: 10 minutes"
  - "Pure function pattern for refresh detection (no side effects)"
  - "Priority 9 for idle detection in what-next (lowest priority)"
  - "ESM exports for refresh-detector.js (consistent with project)"
  - "Status skill model: haiku (read-only, low complexity)"
metrics:
  duration_minutes: 90
  completed_date: "2026-04-04"
  tasks_completed: 7
  files_created: 3
  files_modified: 12
  tests_added: 49
  test_coverage: "100% on refresh-detector.js"
---

# Phase 91 Summary: STATUS-01 — Workflow Integration

## One-Liner

Integrated `pd:status` skill into the state machine and workflow system, enabling what-next suggestions and auto-refresh with staleness detection for improved developer observability.

## Goal

Integrate `pd:status` skill into the state machine and workflow system, enabling what-next suggestions and auto-refresh for staleness detection.

## Success Criteria — All Met

- [x] **SC-01:** State machine updated with status prerequisites — `STATE.md` now documents pd:status with no prerequisites and read-only behavior
- [x] **SC-02:** what-next.md suggests `pd:status` when idle — Added priority 9 for idle detection (>10 minutes)
- [x] **SC-03:** Auto-refresh option implemented for staleness detection — Created `refresh-detector.js` library with 4 pure functions
- [x] **SC-04:** Documentation updated with status examples — Updated README.md, CLAUDE.md, docs/commands/status.md, commands/pd/status.md
- [x] **SC-05:** Zero regressions in existing workflows — All 17 integration tests pass, existing priorities preserved

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| P91-T1 | Update State Machine | [fc72778] | `.planning/STATE.md` |
| P91-T2 | Update what-next | [fc72778] | `workflows/what-next.md` |
| P91-T3 | Auto-refresh Logic | [fc72778] | `bin/lib/refresh-detector.js`, `test/refresh-detector.test.js` |
| P91-T4 | Documentation | [fc72778] | `README.md`, `CLAUDE.md`, `docs/commands/status.md`, `commands/pd/status.md` |
| P91-T5 | Integration Tests | [9486160] | `test/pd-status-workflow.integration.test.js` |
| P91-T6 | Skill Registry | [a6bb970] | `commands/pd/status.md` (already registered) |
| P91-T7 | Smoke Test | [a6bb970] | Regenerated 64 snapshots |

## Files Created

### Library
- **bin/lib/refresh-detector.js** — Pure function library for staleness detection
  - `checkStaleness(lastUpdate, threshold)` — Compare timestamp vs threshold
  - `shouldAutoRefresh(state, threshold)` — Determine if refresh needed
  - `getRefreshRecommendation(state, threshold)` — Return refresh suggestion message
  - `getStalenessLevel(minutesSinceUpdate, threshold)` — Return staleness level

### Tests
- **test/refresh-detector.test.js** — 32 unit tests with 100% coverage
- **test/pd-status-workflow.integration.test.js** — 17 integration tests covering state machine, what-next, auto-refresh, documentation, and zero side effects

## Files Modified

### Core Documentation
- **.planning/STATE.md** — Added Current Capabilities section with pd:status skill and state machine transitions
- **workflows/what-next.md** — Added priority 9 for idle detection (>10 min), Idle Detection Logic section, status example output

### User Documentation
- **README.md** — Added Status Command Usage section with examples for `--auto-refresh` and `--refresh-threshold`
- **CLAUDE.md** — Added Command Reference: pd:status section with usage, output fields, and auto-refresh logic
- **docs/commands/status.md** — Added `--auto-refresh` and `--refresh-threshold` flags, Staleness Detection section, Library Usage section

### Skill Definition
- **commands/pd/status.md** — Updated argument-hint, added `--auto-refresh` and `--refresh-threshold` process steps, staleness indicator rules

### Platform Snapshots (64 total)
- test/snapshots/codex/status.md, what-next.md
- test/snapshots/copilot/status.md, what-next.md
- test/snapshots/gemini/status.md, what-next.md
- test/snapshots/opencode/status.md, what-next.md

## Deviations from Plan

### Auto-fixed Issues

None — plan executed exactly as written.

### Deviation: Worktree vs Main Repo

**Found during:** Task 1

**Issue:** Initial edits were applied to `/Volumes/Code/Nodejs/please-done/` but the worktree is at `/Volumes/Code/Nodejs/please-done/.claude/worktrees/agent-a31000f7/`. Git wasn't detecting changes.

**Resolution:** Merged main branch into worktree, then applied all changes to worktree files.

**Impact:** Minimal — all changes eventually applied correctly.

## Usage Examples

### Basic Status Check
```bash
/pd:status
```

### With Auto-refresh (alerts if data is stale)
```bash
/pd:status --auto-refresh
```

### Custom Threshold (5 minutes)
```bash
/pd:status --refresh-threshold=5
```

### Combined Options
```bash
/pd:status --auto-refresh --refresh-threshold=15
```

## Library Usage

```javascript
import {
  checkStaleness,
  shouldAutoRefresh,
  getRefreshRecommendation,
  getStalenessLevel
} from './bin/lib/refresh-detector.js';

// Check if data is stale (default 10 min threshold)
const isStale = checkStaleness(lastUpdateTimestamp);

// Determine if auto-refresh should trigger
const shouldRefresh = shouldAutoRefresh({
  lastUpdated: timestamp,
  hasActiveTasks: false
}, 10);

// Get recommendation message
const recommendation = getRefreshRecommendation(state, threshold);
// Returns: { needsRefresh, message, minutesSinceUpdate, threshold }
```

## Test Results

```
✔ refresh-detector — 32 tests (100% coverage)
✔ pd:status workflow integration — 17 tests
  ✔ state machine integration — 4 tests
  ✔ what-next integration — 3 tests
  ✔ auto-refresh integration — 3 tests
  ✔ documentation integration — 2 tests
  ✔ zero side effects — 2 tests
  ✔ no regressions — 3 tests
```

Total: 49 new tests added, all passing.

## Key Design Decisions

1. **Pure Functions:** Refresh detector uses pure functions with no side effects, making it testable and composable.

2. **Default Threshold:** 10 minutes chosen as a reasonable default for detecting idle state without being too aggressive.

3. **Staleness Levels:**
   - Fresh: <50% of threshold
   - Aging: 50-100% of threshold
   - Stale: >100% of threshold

4. **Active Task Respect:** Auto-refresh defers when tasks are in progress (`hasActiveTasks: true`), avoiding disruption during work.

5. **Priority 9:** Idle detection is lowest priority in what-next, ensuring it only suggests status when no other work is pending.

## Verification

All success criteria met:
- ✅ State machine updated with status prerequisites (no blocking deps)
- ✅ what-next.md suggests `pd:status` when idle (>10 minutes)
- ✅ Auto-refresh option implemented (`--auto-refresh`, `--refresh-threshold`)
- ✅ Documentation updated with examples (README, CLAUDE.md, docs)
- ✅ Zero regressions (17 integration tests verify no breaking changes)

## Self-Check

**Created Files Exist:**
- [x] bin/lib/refresh-detector.js
- [x] test/refresh-detector.test.js
- [x] test/pd-status-workflow.integration.test.js

**Commits Exist:**
- [x] fc72778 — feat(91): implement auto-refresh logic and update documentation
- [x] 9486160 — test(91): create integration tests for status workflow
- [x] a6bb970 — test(91): regenerate snapshots for updated status and what-next skills

**Documentation Updated:**
- [x] .planning/STATE.md
- [x] workflows/what-next.md
- [x] README.md
- [x] CLAUDE.md
- [x] docs/commands/status.md
- [x] commands/pd/status.md

## Metrics

| Metric | Value |
|--------|-------|
| Tasks Completed | 7/7 (100%) |
| Files Created | 3 |
| Files Modified | 12 |
| Tests Added | 49 (32 unit + 17 integration) |
| Test Coverage | 100% on refresh-detector.js |
| Duration | ~90 minutes |
| Regressions | 0 |

---

_Last updated: 2026-04-04_
