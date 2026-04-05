---
phase: 90
name: status-dashboard
requirement: STATUS-01
goal: Create pd:status dashboard skill for viewing current phase, plan, pending tasks, blockers at a glance
milestone: v11.0
---

# Phase 90 Context: STATUS-01 — Status Dashboard

## Goal

Create a `pd:status` skill that provides a read-only dashboard view of the current project state, including:
- Current phase and plan progress
- Pending tasks
- Blockers and concerns
- Recent errors from agent logs

## Requirements from PROJECT.md

**STATUS-01**: `pd:status` dashboard — view current phase, plan, pending tasks, blockers at a glance (read-only Haiku skill)

## Success Criteria

1. ✅ Skill `pd:status` can be invoked and displays current project state
2. ✅ Shows current phase number and name
3. ✅ Shows plan progress (completed/total tasks)
4. ✅ Lists pending tasks with priorities
5. ✅ Shows any blockers or concerns
6. ✅ Displays recent errors from `.planning/logs/agent-errors.jsonl`
7. ✅ Read-only operation (no state changes)
8. ✅ Uses Haiku model (lightweight, fast)

## Technical Context

### Existing Log Infrastructure (from Phase 88-89)

- Log file: `.planning/logs/agent-errors.jsonl`
- Log format: JSONL with fields `timestamp`, `level`, `phase`, `step`, `agent`, `error`
- Log reader: `bin/lib/log-reader.js` with `readLogs()` function
- Log manager: `bin/lib/log-manager.js` for rotation and cleanup

### State File

- `.planning/STATE.md` — contains current phase, milestone, progress stats

### Task Tracking

- Tasks tracked in individual phase directories (e.g., `TASKS.md`)
- GSD Task system for active work

## Integration Points

1. Read from `.planning/STATE.md` for high-level status
2. Read from `.planning/logs/agent-errors.jsonl` for recent errors
3. Read from active phase's `TASKS.md` for pending tasks
4. Optional: Read from GSD Task system if available

## Output Format

Dashboard should display:

```
┌─────────────────────────────────────────┐
│  pd:status — Project Dashboard          │
├─────────────────────────────────────────┤
│ Phase: 90 — Status Dashboard            │
│ Milestone: v11.0                        │
│                                         │
│ Progress: 2/15 phases (13%)            │
│ Plans: 2/2 complete (100%)              │
│                                         │
│ Pending Tasks:                          │
│ • P90-T1: Create skill file (high)     │
│ • P90-T2: Add state parsing (medium)   │
│                                         │
│ Recent Errors (last 5):                 │
│ [WARN] Phase 89 — log-manager timeout    │
│ [INFO] Phase 88 — log rotation done    │
│                                         │
│ Blockers: None                          │
└─────────────────────────────────────────┘
```

## Dependencies

- Phase 88-89: Log infrastructure in place
- STATE.md: Current project state tracking

## Files to Create/Modify

### New Files
- `commands/pd-status.json` — Skill definition
- `commands/pd-status.md` — Skill implementation (read-only)
- `bin/lib/dashboard-renderer.js` — Pure function for rendering dashboard
- `test/dashboard-renderer.test.js` — Unit tests

### Modified Files
- `CLAUDE.md` — Add skill documentation
- `README.md` — Add skill to command list
- `.planning/STATE.md` — Update with new skill info

## Testing Strategy

1. Unit tests for dashboard-renderer.js
2. Integration test with actual STATE.md and log files
3. End-to-end test: invoke pd:status and verify output

## Notes

- Keep read-only — this skill only displays information
- Use Haiku model for speed (configured in skill definition)
- Consider supporting `--json` flag for machine-readable output
- Consider supporting `--watch` flag for live updates (future)
