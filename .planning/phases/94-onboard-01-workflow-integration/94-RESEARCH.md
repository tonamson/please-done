# Phase 94 Research: Workflow Integration & Testing

## Context

Phase 94 integrates the `pd:onboard` skill (completed in Phases 92-93) into the state machine and workflow system.

## Current State

### Phase 92 Delivered:
- State machine updated with onboard prerequisites (none)
- Error handler wired for structured logging
- Integration tests for state machine, logging, what-next

### Phase 93 Delivered:
- CONTEXT.md generation with tech stack detection
- Documentation link mapper with 35 technology mappings
- Key file selector algorithm
- Summary output module with formatted terminal display
- Integration tests for context generation
- Smoke tests for end-to-end onboard flow

## Integration Points

### 1. STATE.md Updates Needed

Location: `.planning/STATE.md`

Current state machine:
```
idle → pd:onboard → planning-ready (runs init+scan automatically)
idle → pd:init → planning → pd:plan → ready → pd:write-code → executing → ...
```

Need to ensure onboard is documented as entry point with no prerequisites.

### 2. what-next.md Updates Needed

Location: `workflows/what-next.md`

Current logic suggests commands based on state. Need to add:
- Detection of new projects (no .planning/ directory)
- Suggestion: "New project detected. Run /pd:onboard to initialize"

### 3. Smoke Tests

Build on existing tests from Phase 93:
- `test/pd-onboard-integration.test.js` (37 tests)
- `test/smoke/onboard-smoke.test.js` (12 tests)

New E2E test file needed to verify full chain: onboard → init → scan.

## Existing Test Infrastructure

From Phase 93:
- `test/pd-onboard-integration.test.js` - Integration tests
- `test/smoke/onboard-smoke.test.js` - Smoke tests
- Test patterns established for temp directory creation/cleanup

## Dependencies

No external dependencies. All building blocks complete from Phases 92-93.

## Risk Assessment

Low risk - small integration phase building on completed work.

## References

- Phase 92: `.planning/phases/92-onboarding-skill-foundation/`
- Phase 93: `.planning/phases/93-onboard-01-context/`
- ROADMAP.md Phase 94 requirements
