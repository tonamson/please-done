---
phase: "91"
name: status-workflow-integration
version: "1.0"
---

# Phase 91 Plan: STATUS-01 — Workflow Integration

## Goal

Integrate `pd:status` skill into the state machine and workflow system, enabling what-next suggestions and auto-refresh for staleness detection.

## Success Criteria

- [ ] SC-01: State machine updated with status prerequisites
- [ ] SC-02: what-next.md suggests `pd:status` when idle
- [ ] SC-03: Auto-refresh option implemented for staleness detection
- [ ] SC-04: Documentation updated with status examples
- [ ] SC-05: Zero regressions in existing workflows

## Task 1: Update State Machine with Status Prerequisites

**Task ID:** P91-T1  
**Priority:** High  
**Est. Time:** 25 minutes

**Description:**
Update `.planning/STATE.md` to include status skill in the state machine.

**Steps:**
1. Read current `.planning/STATE.md` structure
2. Add `pd:status` to available skills list
3. Add prerequisite mapping: status can run anytime (no blocking deps)
4. Update "Current Capabilities" section with status command
5. Add transition: idle → status (read-only, no state change)

**Acceptance Criteria:**
- STATE.md references pd:status skill
- No breaking changes to existing state machine
- Clear documentation of status command usage

**Files Created/Modified:**
- `.planning/STATE.md` (modified)

---

## Task 2: Update what-next.md with Status Suggestions

**Task ID:** P91-T2  
**Priority:** High  
**Est. Time:** 30 minutes

**Description:**
Modify `what-next.md` workflow to suggest `pd:status` command.

**Steps:**
1. Locate `workflows/what-next.md` file
2. Add logic: when no active phase/plan in progress → suggest `pd:status`
3. Add logic: when idle for >10 minutes → suggest checking status
4. Add example output showing status dashboard
5. Ensure suggestion appears after init/onboard workflow

**Acceptance Criteria:**
- what-next suggests `pd:status` when idle
- Context-aware suggestions (only when appropriate)
- Example command included in output

**Files Created/Modified:**
- `workflows/what-next.md` (modified)

---

## Task 3: Implement Auto-Refresh Logic

**Task ID:** P91-T3  
**Priority:** Medium  
**Est. Time:** 40 minutes

**Description:**
Create auto-refresh option for staleness detection in status display.

**Steps:**
1. Create `bin/lib/refresh-detector.js` with:
   - `checkStaleness(lastUpdate, threshold)` — Compare timestamp vs threshold
   - `shouldAutoRefresh(state)` — Determine if refresh needed
   - `getRefreshRecommendation(state)` — Return refresh suggestion message
2. Threshold: 10 minutes default, configurable via `--refresh-threshold`
3. Staleness signals: task age, phase duration, no recent activity
4. Unit tests for all functions
5. Integrate into `pd:status` skill with `--auto-refresh` flag

**Acceptance Criteria:**
- Pure functions with no side effects
- Configurable threshold parameter
- Returns clear refresh recommendation
- Unit tests with 90%+ coverage

**Files Created/Modified:**
- `bin/lib/refresh-detector.js` (new)
- `test/refresh-detector.test.js` (new)
- `commands/pd-status.md` (modified)

---

## Task 4: Update Documentation with Status Examples

**Task ID:** P91-T4  
**Priority:** Medium  
**Est. Time:** 25 minutes

**Description:**
Update project documentation with status command examples.

**Steps:**
1. Update `CLAUDE.md`:
   - Add `pd:status` to command reference
   - Add usage examples with flags
2. Update `README.md`:
   - Add to quick reference section
   - Include sample output screenshot/description
3. Update `docs/` (if exists):
   - Add status.md with detailed examples
4. Update `.planning/STATE.md`:
   - Mark STATUS-01 workflow integration complete

**Acceptance Criteria:**
- All docs reference pd:status correctly
- Usage examples provided
- Flag documentation complete

**Files Created/Modified:**
- `CLAUDE.md` (modified)
- `README.md` (modified)
- `docs/pd-status.md` (new, if docs dir exists)
- `.planning/STATE.md` (modified)

---

## Task 5: Create Integration Tests

**Task ID:** P91-T5  
**Priority:** High  
**Est. Time:** 35 minutes

**Description:**
Create integration tests for status workflow integration.

**Steps:**
1. Create `test/pd-status-workflow.integration.test.js`:
   - Test what-next suggests status when idle
   - Test state machine recognizes status skill
   - Test auto-refresh detection triggers correctly
   - Test no regressions in existing workflow
2. Mock state files for different scenarios
3. Test with actual STATE.md if available
4. Verify zero side effects (read-only)

**Acceptance Criteria:**
- All integration tests pass
- Tests cover idle detection, staleness, suggestions
- No regressions in existing tests
- Coverage: 85%+

**Files Created/Modified:**
- `test/pd-status-workflow.integration.test.js` (new)

---

## Task 6: Update Skill Registry

**Task ID:** P91-T6  
**Priority:** Medium  
**Est. Time:** 15 minutes

**Description:**
Ensure pd:status is registered in the skill system.

**Steps:**
1. Check `commands/pd-status.json` exists (from Phase 90)
2. Verify skill is in registry/index
3. Test skill discovery: `/pd:status --help`
4. Update AGENT_REGISTRY if applicable

**Acceptance Criteria:**
- Skill is discoverable
- Help text accurate
- No duplicate entries

**Files Created/Modified:**
- `AGENT_REGISTRY` or skill index (modified if needed)

---

## Task 7: Smoke Test and Validation

**Task ID:** P91-T7  
**Priority:** High  
**Est. Time:** 20 minutes

**Description:**
Final validation of workflow integration.

**Steps:**
1. Run full test suite: `npm test`
2. Verify what-next.md output includes status suggestion
3. Test `/pd:status` command end-to-end
4. Test auto-refresh with different thresholds
5. Verify state machine consistency
6. Check documentation accuracy
7. Run regression tests

**Acceptance Criteria:**
- All tests pass (target: 1300+ tests)
- what-next suggests status appropriately
- Auto-refresh works as expected
- Zero regressions
- Documentation accurate

**Files Created/Modified:**
- None (validation only)

---

## Execution Order

```
P91-T1 → P91-T2 → P91-T3 → P91-T4 → P91-T5 → P91-T6 → P91-T7
   │        │        │        │        │        │        │
   └────────┴────────┴────────┴────────┴────────┴────────┘
                              Sequential
```

All tasks are sequential due to dependencies (state machine update needed before what-next, refresh logic needed before integration tests).

## Task Summary

| ID | Task | Priority | Est. Time | Dependencies |
|----|------|----------|-----------|--------------|
| P91-T1 | State machine update | High | 25m | None |
| P91-T2 | what-next suggestions | High | 30m | T1 |
| P91-T3 | Auto-refresh logic | Medium | 40m | None |
| P91-T4 | Documentation update | Medium | 25m | T1, T2 |
| P91-T5 | Integration tests | High | 35m | T1, T2, T3 |
| P91-T6 | Skill registry | Medium | 15m | T1 |
| P91-T7 | Smoke test | High | 20m | All |

**Total Est. Time:** ~3 hours
**Total Tasks:** 7
