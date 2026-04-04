---
phase: "91"
name: status-workflow-integration
version: "1.0"
---

# Phase 91 Context: STATUS-01 — Workflow Integration

## From ROADMAP.md

**Phase 91: STATUS-01 — Workflow Integration**

**Goal:** Integrate status skill into state machine and add refresh logic.

**Requirements:** STATUS-01

**Success Criteria:**
1. State machine updated with status prerequisites
2. what-next.md suggests `pd:status` when idle
3. Auto-refresh option for staleness detection
4. Documentation updated with status examples

## Background

Phase 90 created the `pd:status` skill with dashboard display. Phase 91 integrates this skill into the broader workflow system:
- State machine recognition
- what-next idle suggestions
- Auto-refresh for stale data
- Documentation completeness

## Dependencies

- Phase 90: STATUS-01 — Status Dashboard Core (must be complete)
- `pd:status` skill implementation
- `dashboard-renderer.js` library

## Technical Context

### State Machine
- File: `.planning/STATE.md`
- Contains: Current phase, milestone, progress, capabilities
- Needs: Reference to pd:status skill

### what-next Workflow
- File: `workflows/what-next.md`
- Contains: Idle detection, next step suggestions
- Needs: Status suggestion logic when idle

### Auto-Refresh
- New module: `bin/lib/refresh-detector.js`
- Threshold: 10 minutes default
- Signals: Task age, phase duration, inactivity

## Constraints

- Read-only operations only (no state changes)
- Backward compatible with existing workflows
- Haiku model for status (fast, cheap)
- Zero regressions

## Reference Pattern

Phase 90 structure:
- `bin/lib/dashboard-renderer.js` — Pure functions
- `commands/pd-status.md` — Skill implementation
- `commands/pd-status.json` — Skill definition
- Tests with 100% function coverage

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Breaking what-next | Low | High | Integration tests |
| Staleness false positives | Medium | Low | Configurable threshold |
| Documentation drift | Low | Medium | Checklist validation |
