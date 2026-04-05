# Phase 94: ONBOARD-01 — Workflow Integration & Testing

## Goal

Integrate onboard into state machine and test end-to-end.

## Requirements

- ONBOARD-01: Complete onboarding skill with state machine integration and smoke tests

## Success Criteria

1. State machine updated with onboard flow
2. what-next.md suggests onboard for new projects
3. Smoke tests verify onboard → init → scan chain
4. Zero regressions in existing init/scan flows

## Plan 94.1: Wire onboard into workflows and add tests

### Task 1: Update STATE.md with onboard state machine transitions

**File:** `.planning/STATE.md`

**Actions:**
- Add onboard flow to state machine transitions
- Document prerequisite: None (entry point skill)
- Add onboard to Available Skills table
- Update state transition diagram

### Task 2: Update what-next.md to suggest onboard for new projects

**File:** `workflows/what-next.md`

**Actions:**
- Add detection logic for new projects (no .planning/ directory)
- Suggest `pd:onboard` as first command for new projects
- Add message: "New project detected. Run /pd:onboard to initialize"

### Task 3: Create smoke tests for onboard → init → scan chain

**File:** `test/pd-onboard-e2e.smoke.test.js`

**Actions:**
- Test onboard command orchestrates init workflow
- Test onboard command triggers scan workflow
- Test onboard generates CONTEXT.md
- Test onboard displays summary output
- Test zero .planning/ → onboard suggested
- Cleanup: Remove temporary test directories

### Task 4: Verify zero regressions in existing flows

**Actions:**
- Run existing init tests: `npm test -- init`
- Run existing scan tests: `npm test -- scan`
- Verify no changes to init/scan behavior
- Regenerate snapshots if needed

### Task 5: Update CLAUDE.md with onboard state machine reference

**File:** `CLAUDE.md`

**Actions:**
- Add onboard to state machine transitions section
- Document: idle → pd:onboard → planning-ready
- Update Available Skills table

### Task 6: Integration verification

**Actions:**
- Test onboard skill from clean directory
- Verify all 3 workflows chained: onboard → init → scan
- Verify CONTEXT.md generated correctly
- Verify summary displayed in terminal

## Dependencies

- Phase 92: Onboarding Skill Foundation (complete)
- Phase 93: Context Generation & Summary (complete)

## Estimated Effort

Small (6 tasks, ~3 files modified, 1 file created)

## Test Strategy

- Unit tests: None (covered in Phase 92-93)
- Integration tests: State machine transitions
- Smoke tests: End-to-end onboard flow
- Regression tests: Existing init/scan flows

## Verification

- [ ] STATE.md updated with onboard flow
- [ ] what-next.md suggests onboard for new projects
- [ ] Smoke tests pass (6 scenarios)
- [ ] Zero regressions in existing flows
- [ ] Snapshots regenerated (if needed)
