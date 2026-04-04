### Project Language Convention
- Use English throughout, with standard grammar and spelling

### Command Reference: pd:status

The `pd:status` skill displays a read-only project status dashboard.

**Usage:**
- `/pd:status` — Display current status
- `/pd:status --auto-refresh` — Enable staleness detection
- `/pd:status --refresh-threshold=5` — Set custom threshold (minutes)

**Output fields:**
- Milestone, Phase, Plan
- Task completion status
- Bug count, Recent errors
- Blocking issues
- Last commit info
- Staleness indicator

**Auto-refresh logic:**
- Default threshold: 10 minutes
- Staleness levels: fresh (<50%), aging (50-100%), stale (>100%)
- Suggests refresh when idle and data is stale
- Respects active tasks (defers refresh when work in progress)
