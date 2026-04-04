---
phase: "92"
name: onboarding-skill-foundation
version: "1.0"
---

# Phase 92 Plan: ONBOARD-01 — Onboarding Skill Foundation

## Goal

Integrate existing `pd:onboard` skill (from Phase 78) with v11.0 infrastructure: state machine, structured logging (LOG-01), and what-next workflow.

## Success Criteria

- [ ] SC-01: State machine updated with `pd:onboard` prerequisites (none — entry point)
- [ ] SC-02: Error handler wired for structured logging to `.planning/logs/agent-errors.jsonl`
- [ ] SC-03: what-next.md suggests `pd:onboard` for new projects (no `.planning/` directory)
- [ ] SC-04: Documentation updated with onboarding integration notes
- [ ] SC-05: Zero regressions in existing init/scan/onboard flows

## Task 1: Update State Machine with Onboard Prerequisites

**Task ID:** P92-T1  
**Priority:** High  
**Est. Time:** 20 minutes

**Description:**
Update `.planning/STATE.md` to include `pd:onboard` in the state machine.

**Steps:**
1. Read current `.planning/STATE.md` structure
2. Add `pd:onboard` to available skills list (Sonnet tier)
3. Add prerequisite mapping: none (entry point skill)
4. Add transition: `(any/no planning)` → `pd:onboard` → `planning-ready`
5. Document that onboard replaces init+scan for new projects

**Acceptance Criteria:**
- STATE.md references `pd:onboard` skill with correct prerequisites
- Clear that onboard has no blocking dependencies
- No breaking changes to existing state machine

**Files Created/Modified:**
- `.planning/STATE.md` (modified)

---

## Task 2: Wire Error Handler for Structured Logging

**Task ID:** P92-T2  
**Priority:** High  
**Est. Time:** 25 minutes

**Description:**
Integrate `pd:onboard` with structured logging infrastructure from Phase 88-89.

**Steps:**
1. Review `commands/pd/onboard.md` current error handling
2. Add error handler script block (follow Phase 89 pattern):
   ```javascript
   const { createEnhancedErrorHandler } = require('../../../bin/lib/enhanced-error-handler');
   const errorHandler = createEnhancedErrorHandler('pd:onboard', '$CURRENT_PHASE', {
     operation: 'onboard'
   });
   module.exports = { errorHandler };
   ```
3. Verify error logs write to `.planning/logs/agent-errors.jsonl`
4. Test error scenarios (invalid path, no git, etc.)

**Acceptance Criteria:**
- Error handler imported and configured
- Errors logged with all 7 fields: timestamp, level, phase, step, agent, error, context
- Follows same pattern as other Sonnet-tier skills
- No breaking changes to onboard functionality

**Files Created/Modified:**
- `commands/pd/onboard.md` (modified — add error handler script)

---

## Task 3: Update what-next.md with Onboard Suggestions

**Task ID:** P92-T3  
**Priority:** High  
**Est. Time:** 30 minutes

**Description:**
Modify `what-next.md` workflow to suggest `pd:onboard` for new projects.

**Steps:**
1. Locate `workflows/what-next.md` file
2. Add detection logic: check if `.planning/` directory exists
3. If NO `.planning/` → suggest `/pd:onboard` as first step
4. If `.planning/` exists but incomplete → suggest `pd:init` or `pd:onboard`
5. Ensure suggestion hierarchy: onboard > init > scan > plan
6. Add example output showing onboarding flow

**Acceptance Criteria:**
- what-next suggests `pd:onboard` when no `.planning/` directory
- Context-aware (don't suggest if already onboarded)
- Clear distinction between onboard (new project) vs init (existing with planning)
- Example command included

**Files Created/Modified:**
- `workflows/what-next.md` (modified)

---

## Task 4: Create Integration Tests

**Task ID:** P92-T4  
**Priority:** High  
**Est. Time:** 35 minutes

**Description:**
Create integration tests for onboard workflow integration with new infrastructure.

**Steps:**
1. Create `test/pd-onboard-integration.test.js`:
   - Test error handler logs to JSONL correctly
   - Test what-next suggests onboard for new projects
   - Test state machine recognizes onboard skill
   - Test onboard → init → scan chain works
   - Test error scenarios log correctly
2. Mock filesystem scenarios (no .planning/, partial .planning/, complete .planning/)
3. Verify log file appends with correct schema
4. Test no regressions in existing onboard flow

**Acceptance Criteria:**
- All integration tests pass
- Tests cover error logging, what-next detection, state machine
- No regressions in existing tests
- Coverage: 85%+

**Files Created/Modified:**
- `test/pd-onboard-integration.test.js` (new)

---

## Task 5: Update Documentation

**Task ID:** P92-T5  
**Priority:** Medium  
**Est. Time:** 20 minutes

**Description:**
Update project documentation with onboard integration notes.

**Steps:**
1. Update `CLAUDE.md`:
   - Add `pd:onboard` to command reference (if not present)
   - Note: no prerequisites, entry point skill
2. Update `.planning/STATE.md`:
   - Mark ONBOARD-01 state machine integration complete
3. Update `docs/commands/onboard.md` (if exists):
   - Add error logging note
   - Add state machine context

**Acceptance Criteria:**
- All docs reference `pd:onboard` correctly
- Error logging behavior documented
- State prerequisites clear

**Files Created/Modified:**
- `CLAUDE.md` (modified)
- `.planning/STATE.md` (modified)
- `docs/commands/onboard.md` (modified, if exists)

---

## Task 6: Smoke Test and Validation

**Task ID:** P92-T6  
**Priority:** High  
**Est. Time:** 20 minutes

**Description:**
Final validation of onboard workflow integration.

**Steps:**
1. Run full test suite: `npm test`
2. Verify what-next.md output includes onboard suggestion
3. Verify error handler logs correctly (simulate error)
4. Test state machine consistency
5. Check documentation accuracy
6. Run regression tests
7. Verify snapshots still valid

**Acceptance Criteria:**
- All tests pass (target: 1300+ tests)
- what-next suggests onboard appropriately
- Error logs written to correct location
- Zero regressions
- Documentation accurate

**Files Created/Modified:**
- None (validation only)

---

## Execution Order

```
P92-T1 → P92-T2 → P92-T3 → P92-T4 → P92-T5 → P92-T6
   │        │        │        │        │        │
   └────────┴────────┴────────┴────────┴────────┘
                         Sequential
```

All tasks are sequential. T1 (state machine) needed before T3 (what-next). T2 (error handler) independent but should complete before T4 (integration tests).

## Task Summary

| ID | Task | Priority | Est. Time | Dependencies |
|----|------|----------|-----------|--------------|
| P92-T1 | State machine update | High | 20m | None |
| P92-T2 | Error handler wiring | High | 25m | None |
| P92-T3 | what-next suggestions | High | 30m | T1 |
| P92-T4 | Integration tests | High | 35m | T1, T2, T3 |
| P92-T5 | Documentation update | Medium | 20m | T1, T3 |
| P92-T6 | Smoke test | High | 20m | All |

**Total Est. Time:** ~2.5 hours  
**Total Tasks:** 6

## Context

This phase builds on Phase 78 (v8.0) which created the `pd:onboard` skill:
- `commands/pd/onboard.md` — skill definition (Sonnet tier)
- `workflows/onboard.md` — 6-step orchestration

And integrates with Phase 88-89 (LOG-01) structured logging and Phase 90-91 (STATUS-01) state machine infrastructure.

## Notes

- Core onboard workflow from Phase 78 remains unchanged
- This phase only adds integration points (error logging, state machine, what-next)
- No changes to `workflows/onboard.md` — integration happens at skill definition level
