---
name: Phase 89 - LOG-01 Integration & Workflow Wiring Plan
description: Executable plan for wiring log-writer into all skills and workflows
version: 1.0
requires_verification: true
nyquist_compliant: true
---

# Phase 89: LOG-01 — Integration & Workflow Wiring

## Goal
Wire log-writer into all 16 skills and update state machine to enable structured error logging across the GSD workflow.

## Requirements
- LOG-01: Structured error logging infrastructure

## Success Criteria
1. ✅ All 16 skills call log-writer on caught errors
2. ✅ State machine updated with logging prerequisites
3. ✅ what-next.md shows recent errors from logs
4. ✅ Zero regressions in existing error handling

## Implementation Strategy

### Phase 1: Framework Integration (2 tasks)
Integrate log-writer at the framework level to automatically catch and log errors from all skills.

### Phase 2: Skill-Specific Enhancements (3 tasks)
Enhance individual skills with context-rich error logging for better debugging.

### Phase 3: State Machine Updates (2 tasks)
Update state management to include logging readiness checks.

### Phase 4: What-Next Integration (1 task)
Add error display functionality to what-next workflow.

### Phase 5: Testing & Verification (2 tasks)
Comprehensive testing to ensure zero regressions.

## Task Breakdown

### Task 89.1.1: Create Skill Execution Wrapper with Logging
**Goal**: Create a centralized skill execution wrapper that automatically catches errors and logs them using log-writer.

**Steps**:
1. Create `bin/lib/skill-executor.js` with wrapper function
2. Import log-writer utilities
3. Wrap skill execution in try-catch
4. Log errors with context: phase, skill name, error details
5. Re-throw errors to maintain existing behavior
6. Add unit tests for the wrapper

**Files to Create/Modify**:
- `bin/lib/skill-executor.js` (new)
- `test/skill-executor.test.js` (new)

**Success Criteria**:
- Wrapper successfully catches and logs errors
- Errors are re-thrown without modification
- Log entries contain all required fields
- Unit tests pass with 90%+ coverage

**Estimated Effort**: Small (1-2 hours)

---

### Task 89.1.2: Integrate Wrapper into GSD Framework
**Goal**: Wire the skill executor wrapper into the GSD skill execution framework.

**Steps**:
1. Locate skill execution entry point in GSD framework
2. Import skill-executor wrapper
3. Wrap all skill executions with logging
4. Ensure phase information is passed to wrapper
5. Test with a sample skill execution
6. Verify logs are written correctly

**Files to Modify**:
- GSD framework execution files (need to locate)
- May require modifications to skill loading mechanism

**Success Criteria**:
- All skill executions go through wrapper
- Errors from any skill are logged
- Phase information is correctly captured
- No change in skill execution behavior

**Estimated Effort**: Medium (2-3 hours)

---

### Task 89.2.1: Enhance Error Context in Critical Skills
**Goal**: Add rich context to error logs in 5 most critical skills for better debugging.

**Critical Skills**:
1. `pd:fix-bug` - Most complex workflow
2. `pd:plan` - Technical planning
3. `pd:write-code` - Code generation
4. `pd:test` - Testing workflows
5. `pd:audit` - Project auditing

**Steps**:
1. For each skill, identify key error points
2. Add context objects with relevant data:
   - For fix-bug: bug description, current step, evidence collected
   - For plan: phase number, requirements being addressed
   - For write-code: file being modified, code snippet
   - For test: test name, assertion details
   - For audit: audit type, findings
3. Use log-writer builder pattern for structured context
4. Test each enhanced skill

**Files to Modify**:
- `commands/pd/fix-bug.md`
- `commands/pd/plan.md`
- `commands/pd/write-code.md`
- `commands/pd/test.md`
- `commands/pd/audit.md`

**Success Criteria**:
- All 5 skills include rich error context
- Context helps identify root cause quickly
- No performance impact
- Tests verify context is logged correctly

**Estimated Effort**: Medium (3-4 hours)

---

### Task 89.2.2: Add Logging to Remaining Skills
**Goal**: Add basic error logging to the remaining 11 skills.

**Skills**:
- pd:complete-milestone
- pd:conventions
- pd:fetch-doc
- pd:init
- pd:new-milestone
- pd:onboard
- pd:research
- pd:scan
- pd:status
- pd:update
- pd:what-next

**Steps**:
1. For each skill, add try-catch where needed
2. Log errors with basic context (skill name, phase)
3. Use simple log-writer calls
4. Ensure errors are still displayed to user
5. Test each skill for proper error logging

**Files to Modify**:
- All remaining skill files in `commands/pd/`

**Success Criteria**:
- All skills log errors appropriately
- No skill loses error information
- User still sees errors in console
- Log files contain all errors

**Estimated Effort**: Small (2-3 hours)

---

### Task 89.2.3: Create Error Recovery Guide
**Goal**: Document common errors and recovery steps for each skill.

**Steps**:
1. Analyze error patterns from testing
2. Create `docs/error-recovery.md`
3. Document common errors per skill
4. Provide recovery steps
5. Link to relevant documentation
6. Include example log entries

**Files to Create**:
- `docs/error-recovery.md` (new)

**Success Criteria**:
- Guide covers top 80% of errors
- Recovery steps are actionable
- Users can self-serve error resolution
- Guide is easy to navigate

**Estimated Effort**: Small (1-2 hours)

---

### Task 89.3.1: Update State Machine Prerequisites
**Goal**: Add logging readiness checks to the state machine.

**Steps**:
1. Locate state machine implementation
2. Add log directory existence check
3. Add log-writer import verification
4. Create logging readiness flag
5. Update state transitions to include logging check
6. Test state machine with logging disabled/enabled

**Files to Modify**:
- State machine files (need to locate)
- May require new state definitions

**Success Criteria**:
- State machine checks logging readiness
- Clear error if logging not available
- State transitions work correctly
- No impact on non-logging workflows

**Estimated Effort**: Medium (2-3 hours)

---

### Task 89.3.2: Add Log Directory Management
**Goal**: Ensure log directory exists and manage log file rotation.

**Steps**:
1. Create `bin/lib/log-manager.js`
2. Add directory creation on startup
3. Implement log rotation (keep last 10 logs)
4. Add log size limits (10MB per log)
5. Create cleanup utility
6. Add tests for log management

**Files to Create/Modify**:
- `bin/lib/log-manager.js` (new)
- `test/log-manager.test.js` (new)
- Integration with GSD startup

**Success Criteria**:
- Log directory auto-created
- Log rotation works correctly
- Old logs are cleaned up
- No disk space issues
- Tests verify rotation logic

**Estimated Effort**: Small (2-3 hours)

---

### Task 89.4.1: Enhance What-Next with Error Display
**Goal**: Modify what-next.md to display recent errors from logs.

**Steps**:
1. Read `agent-errors.jsonl` in what-next skill
2. Parse last 10 error entries
3. Display error summary in dashboard format
4. Show error count by skill
5. Suggest `pd:fix-bug` when errors present
6. Add option to view full error details

**Files to Modify**:
- `commands/pd/what-next.md`
- May need new utility for log parsing

**Success Criteria**:
- what-next shows recent errors
- Error display is clear and actionable
- Suggests appropriate next steps
- Does not slow down what-next execution

**Estimated Effort**: Small (2-3 hours)

---

### Task 89.5.1: Integration Testing
**Goal**: Test complete integration across all skills and workflows.

**Steps**:
1. Create integration test suite
2. Test each skill with error scenarios
3. Verify logs are written correctly
4. Test state machine with logging
5. Test what-next error display
6. Run full workflow tests

**Files to Create**:
- `test/integration/logging-integration.test.js` (new)
- Test scenarios for each skill

**Success Criteria**:
- All skills log errors correctly
- Integration tests pass
- No regressions in existing tests
- Performance impact < 5%

**Estimated Effort**: Medium (3-4 hours)

---

### Task 89.5.2: Documentation Update
**Goal**: Update all relevant documentation with logging information.

**Steps**:
1. Update `COMMANDS.md` with logging details
2. Update `INTEGRATION_GUIDE.md`
3. Add logging section to `README.md`
4. Document log file format
5. Add troubleshooting guide
6. Update inline code comments

**Files to Modify**:
- `COMMANDS.md`
- `INTEGRATION_GUIDE.md`
- `README.md`
- `docs/logging.md` (new)

**Success Criteria**:
- All docs mention logging feature
- Log format is documented
- Troubleshooting guide is helpful
- Users understand how to use logs

**Estimated Effort**: Small (2-3 hours)

---

## Verification Criteria

### Nyquist Compliance
- ✅ Clear goal and requirements
- ✅ Measurable success criteria
- ✅ Task-level verification steps
- ✅ Documentation updates included
- ✅ Testing strategy defined

### Integration Verification
- ✅ All 16 skills integrated
- ✅ State machine updated
- ✅ What-next enhanced
- ✅ Zero regressions confirmed

### Quality Gates
- All unit tests pass (>90% coverage)
- All integration tests pass
- No performance degradation
- Documentation complete and accurate

## Dependencies

### Internal
- Phase 88 completion (log-writer) ✅
- Understanding of GSD framework architecture
- Access to all skill files

### External
- None - internal tooling only

## Risk Mitigation

### Risk: Framework integration complexity
**Mitigation**: Start with simple wrapper, iterate based on testing

### Risk: Performance impact
**Mitigation**: Measure baseline performance, optimize if needed

### Risk: Breaking existing error handling
**Mitigation**: Maintain console.error output, extensive testing

### Risk: Log file bloat
**Mitigation**: Implement rotation and size limits

## Rollout Plan

1. **Phase A**: Implement skill executor wrapper (Tasks 89.1.1-89.1.2)
2. **Phase B**: Enhance critical skills (Task 89.2.1)
3. **Phase C**: Update remaining skills (Task 89.2.2)
4. **Phase D**: State machine updates (Tasks 89.3.1-89.3.2)
5. **Phase E**: What-next integration (Task 89.4.1)
6. **Phase F**: Testing and docs (Tasks 89.5.1-89.5.2)

## Success Metrics

- ✅ All 16 skills log errors to agent-errors.jsonl
- ✅ State machine includes logging prerequisites
- ✅ what-next displays recent errors
- ✅ Zero test regressions (1232 tests pass)
- ✅ Performance impact < 5%
- ✅ Documentation complete
