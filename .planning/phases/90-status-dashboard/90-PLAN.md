---
phase: "90"
name: status-dashboard
version: "1.0"
---

# Phase 90 Plan: STATUS-01 — Status Dashboard

## Goal

Create `pd:status` skill that displays a read-only dashboard view of current project state including phase progress, pending tasks, blockers, and recent errors.

## Success Criteria

- [ ] SC-01: `pd:status` skill can be invoked and displays current project state
- [ ] SC-02: Shows current phase number, name, and milestone
- [ ] SC-03: Shows plan progress (completed/total tasks)
- [ ] SC-04: Lists pending tasks with priorities
- [ ] SC-05: Shows any blockers or concerns
- [ ] SC-06: Displays recent errors from `agent-errors.jsonl`
- [ ] SC-07: Read-only operation (no state changes)
- [ ] SC-08: Uses Haiku model configuration

## Task 1: Create dashboard-renderer.js Library

**Task ID:** P90-T1  
**Priority:** High  
**Est. Time:** 30 minutes

**Description:**
Create pure function library for rendering dashboard output.

**Steps:**
1. Create `bin/lib/dashboard-renderer.js` with:
   - `parseState(content)` — Parse STATE.md frontmatter
   - `parseTasks(content)` — Parse TASKS.md for pending tasks
   - `formatErrors(logs, limit)` — Format log entries for display
   - `renderDashboard(options)` — Main render function
   - `renderTable(data, columns)` — Table formatting helper
2. Handle edge cases: missing files, empty state, malformed data
3. Support configurable limits (errors, tasks)

**Acceptance Criteria:**
- All functions are pure (no side effects)
- Returns formatted string for terminal display
- Handles missing/empty files gracefully
- Table format is aligned and readable

**Files Created/Modified:**
- `bin/lib/dashboard-renderer.js` (new)

---

## Task 2: Create Unit Tests for dashboard-renderer

**Task ID:** P90-T2  
**Priority:** High  
**Est. Time:** 45 minutes

**Description:**
Create comprehensive unit tests for dashboard renderer.

**Steps:**
1. Create `test/dashboard-renderer.test.js`
2. Test `parseState()` with valid STATE.md content
3. Test `parseState()` with missing/empty content
4. Test `parseTasks()` with various task formats
5. Test `formatErrors()` with different log levels
6. Test `renderDashboard()` integration
7. Test edge cases: very long text, Unicode, special chars
8. Snapshot tests for output format

**Acceptance Criteria:**
- 100% function coverage
- All edge cases tested
- Snapshots for output format
- Tests pass: `npm test -- test/dashboard-renderer.test.js`

**Files Created/Modified:**
- `test/dashboard-renderer.test.js` (new)

---

## Task 3: Create pd:status Skill Definition

**Task ID:** P90-T3  
**Priority:** High  
**Est. Time:** 20 minutes

**Description:**
Create skill definition file with Haiku model configuration.

**Steps:**
1. Create `commands/pd-status.json`:
   - Name: `pd:status`
   - Model: `claude-haiku-4-5-20251001` (read-only, fast)
   - Description: "Show project status dashboard"
   - Tool mode: `read_only`
   - Parameters: `--limit`, `--format`
2. Add to skill registry if applicable

**Acceptance Criteria:**
- Valid JSON schema
- Correct model specified
- Read-only mode set
- Parameters documented

**Files Created/Modified:**
- `commands/pd-status.json` (new)

---

## Task 4: Create pd:status Skill Implementation

**Task ID:** P90-T4  
**Priority:** High  
**Est. Time:** 30 minutes

**Description:**
Create skill implementation that reads state and renders dashboard.

**Steps:**
1. Create `commands/pd-status.md` with:
   - Read `.planning/STATE.md`
   - Read current phase's `TASKS.md` (if exists)
   - Read `.planning/logs/agent-errors.jsonl` (last N entries)
   - Call `dashboard-renderer.js` functions
   - Display formatted output
2. Handle `--limit` flag for error count
3. Handle `--format=json` for machine-readable output
4. Add error handling for missing files

**Acceptance Criteria:**
- Successfully reads and displays state
- Shows phase, milestone, progress
- Shows pending tasks
- Shows recent errors
- Supports `--limit` flag
- Supports `--format=json` flag

**Files Created/Modified:**
- `commands/pd-status.md` (new)

---

## Task 5: Create Integration Tests

**Task ID:** P90-T5  
**Priority:** Medium  
**Est. Time:** 30 minutes

**Description:**
Create integration tests for end-to-end skill invocation.

**Steps:**
1. Create `test/pd-status.integration.test.js`
2. Test with actual project STATE.md
3. Test with mock log files
4. Test command-line invocation
5. Test with various flag combinations
6. Test error handling (missing STATE.md)

**Acceptance Criteria:**
- E2E tests pass
- Works with actual project files
- Handles edge cases gracefully
- Tests pass: `npm test -- test/pd-status.integration.test.js`

**Files Created/Modified:**
- `test/pd-status.integration.test.js` (new)

---

## Task 6: Update Documentation

**Task ID:** P90-T6  
**Priority:** Medium  
**Est. Time:** 20 minutes

**Description:**
Update project documentation with new skill.

**Steps:**
1. Update `CLAUDE.md`:
   - Add `pd:status` to skill list
   - Add usage example
2. Update `README.md`:
   - Add to command reference
   - Add example output
3. Update `.planning/STATE.md`:
   - Mention new skill availability
4. Create `docs/pd-status.md` if docs directory exists

**Acceptance Criteria:**
- All documentation references new skill
- Usage examples provided
- Cross-references correct

**Files Created/Modified:**
- `CLAUDE.md` (modified)
- `README.md` (modified)
- `.planning/STATE.md` (modified)

---

## Task 7: Update State Machine

**Task ID:** P90-T7  
**Priority:** Medium  
**Est. Time:** 10 minutes

**Description:**
Update state machine to reflect new skill.

**Steps:**
1. Update `.planning/STATE.md`:
   - Mark STATUS-01 as complete (or in progress)
   - Update progress metrics
2. Add entry to "Key Features" section

**Acceptance Criteria:**
- State file reflects current status
- Progress metrics accurate

**Files Created/Modified:**
- `.planning/STATE.md` (modified)

---

## Task 8: Smoke Test and Validation

**Task ID:** P90-T8  
**Priority:** High  
**Est. Time:** 15 minutes

**Description:**
Final validation before completion.

**Steps:**
1. Run all tests: `npm test`
2. Test skill invocation: `/pd:status`
3. Verify output format
4. Test with `--limit` and `--format=json`
5. Check documentation accuracy
6. Verify no regressions

**Acceptance Criteria:**
- All tests pass (target: 1289+ tests)
- Skill invocation works
- Output format correct
- No regressions

**Files Created/Modified:**
- None (validation only)

---

## Execution Order

```
P90-T1 → P90-T2 → P90-T3 → P90-T4 → P90-T5 → P90-T6 → P90-T7 → P90-T8
   │        │        │        │        │        │        │        │
   └────────┴────────┴────────┴────────┴────────┴────────┴────────┘
                              Sequential
```

All tasks are sequential due to dependencies (need library before tests, need skill definition before implementation).

## Task Summary

| ID | Task | Priority | Est. Time | Dependencies |
|----|------|----------|-----------|--------------|
| P90-T1 | dashboard-renderer.js | High | 30m | None |
| P90-T2 | Unit tests | High | 45m | T1 |
| P90-T3 | Skill definition | High | 20m | None |
| P90-T4 | Skill implementation | High | 30m | T1, T3 |
| P90-T5 | Integration tests | Medium | 30m | T1, T4 |
| P90-T6 | Documentation | Medium | 20m | T4 |
| P90-T7 | State machine | Medium | 10m | T4 |
| P90-T8 | Smoke test | High | 15m | All |

**Total Est. Time:** ~3.5 hours
**Total Tasks:** 8
