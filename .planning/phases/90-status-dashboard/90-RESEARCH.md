---
phase: 90
name: status-dashboard
date: 2026-04-04
---

# Phase 90 Research: Status Dashboard

## Existing Patterns

### State Reading Pattern

From `bin/lib/log-reader.js` (Phase 88-89):

```javascript
function readLogs(options = {}) {
  // Pure function: takes file path, returns parsed logs
  // Options: limit, since, level
}
```

### Skill Structure Pattern

From Phase 88-89 skill files:

```json
{
  "name": "pd:status",
  "description": "Show project status dashboard",
  "model": "claude-haiku-4-5-20251001",
  "tool_mode": "read_only",
  "steps": [...]
}
```

### Dashboard UI Pattern

From Phase 89 `what-next` error display:

```javascript
function displayErrors(logs) {
  // Format logs for display
  // Group by level (ERROR, WARN, INFO)
  // Show most recent first
}
```

## Key Libraries

No external dependencies needed — pure Node.js:

- `fs` — Read STATE.md, log files
- `path` — Path resolution
- `readline` or simple string parsing — Parse frontmatter

## State File Format

From `.planning/STATE.md`:

```yaml
---
gsd_state_version: 1.0
milestone: v11.0
status: Phase 89 Complete, ready for Phase 90
stopped_at: Completed Phase 89
last_updated: "2026-04-04T09:30:00.000Z"
progress:
  total_phases: 15
  completed_phases: 2
  total_plans: 2
  completed_plans: 2
---
```

## Log File Format

From `.planning/logs/agent-errors.jsonl`:

```json
{"timestamp":"2026-04-04T09:30:00.000Z","level":"ERROR","phase":"89","step":"1","agent":"log-writer","error":"Failed to rotate logs"}
```

## Prior Art

### Unix `status` Commands

- `git status` — Shows working tree status
- `systemctl status` — Shows service status
- `docker status` — Shows container status

Pattern: Current state + recent activity + actionable items

### Dashboard Tools

- `htop` — System dashboard
- `k9s` — Kubernetes dashboard

Pattern: Live updating, color-coded, scannable

## Decision: Dashboard Rendering

**Option A: Table format (chosen)**
- Easy to scan
- Compact
- Works in all terminals

**Option B: JSON output**
- Machine readable
- Good for piping
- Can be secondary option

**Option C: Rich UI with boxes**
- Visually appealing
- Requires Unicode support
- Can be fragile

## Decision: Error Display

- Show last 5 errors by default
- Support `--limit` flag
- Group by severity (ERROR > WARN > INFO)

## Decision: Task Display

- Read from current phase's TASKS.md
- Show only incomplete tasks
- Sort by priority (high > medium > low)

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| STATE.md format changes | Low | Medium | Version check in parser |
| Log file too large | Medium | Low | Read last N lines only |
| Terminal width issues | Medium | Low | Truncate or wrap gracefully |
| No tasks found | Low | Low | Display "No pending tasks" |

## API Design

```javascript
// dashboard-renderer.js
function renderDashboard(options) {
  // options: { statePath, logPath, limit, format }
  // returns: string (formatted dashboard)
}

function parseState(content) {
  // Parse STATE.md frontmatter and body
  // returns: { milestone, phase, progress, blockers }
}

function parseTasks(tasksContent) {
  // Parse TASKS.md
  // returns: [{ id, title, status, priority }]
}

function formatErrors(logs, limit) {
  // Format logs for display
  // returns: string[]
}
```

## Testing Approach

1. Mock state files for testing
2. Test with actual project STATE.md
3. Snapshot testing for output format
4. Edge case testing (empty logs, missing files)
