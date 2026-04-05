# Phase 94 Context

## Goal
Integrate `pd:onboard` skill into state machine and add end-to-end smoke tests.

## Requirements
- ONBOARD-01: Complete onboarding skill integration

## Current State
- Phase 92: ✅ Onboarding Skill Foundation complete
- Phase 93: ✅ Context Generation & Summary complete
- Phase 94: 📝 Planning complete, ready for execution

## Files to Modify

| File | Purpose |
|------|---------|
| `.planning/STATE.md` | Add onboard to state machine |
| `workflows/what-next.md` | Suggest onboard for new projects |
| `CLAUDE.md` | Update command reference |
| `test/pd-onboard-e2e.smoke.test.js` | Create E2E smoke tests (NEW) |

## State Machine Update

Current transitions (from STATE.md):
```
idle → pd:status (read-only, no state change)
idle → pd:onboard → planning-ready (runs init+scan automatically)
idle → pd:init → planning → pd:plan → ready → pd:write-code → executing → ...
```

## what-next Logic

New condition to add:
```javascript
if (!fs.existsSync('.planning/')) {
  suggest('pd:onboard');
}
```

## Test Coverage

- Existing: 37 integration tests (Phase 93)
- Existing: 12 smoke tests (Phase 93)
- New: E2E chain verification (Task 3)

## Success Criteria

1. ✅ STATE.md documents onboard flow
2. ✅ what-next.md suggests onboard for new projects
3. ✅ Smoke tests verify onboard → init → scan chain
4. ✅ Zero regressions in existing flows
