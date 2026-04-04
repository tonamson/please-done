# Command `pd status`

## Purpose

Display a read-only 8-field project status dashboard. Does not modify any files or suggest next steps — purely informational.

## Arguments

| Argument | Required | Description |
|----------|----------|-------------|
| (none) | — | Display basic dashboard |
| `--auto-refresh` | No | Enable staleness detection alerts |
| `--refresh-threshold=N` | No | Set staleness threshold in minutes (default: 10) |

## How It Works

1. **Read planning files:** Load STATE.md, CURRENT_MILESTONE.md, TASKS.md, PROGRESS.md
2. **Check git log:** Get last commit hash and message
3. **Count bugs:** Glob `.planning/bugs/BUG_*.md` for unresolved issues
4. **Check staleness:** Compare last activity timestamp vs threshold
5. **Display dashboard:** Print 8 fields in formatted output with refresh recommendation

## When to run this command?

- Quick check of project state without suggestions
- Before starting work to see current milestone/phase
- After completing tasks to verify progress recorded
- When you need status without the overhead of `what-next`
- When idle for >10 minutes to check if data is stale

## Output

- No files created or modified (read-only command)
- 8-line formatted dashboard displayed to console:
  1. **Milestone** — Current milestone name
  2. **Phase** — Current phase number and name
  3. **Plan** — Current plan being executed
  4. **Tasks** — Task completion status (e.g., 2/5)
  5. **Bugs** — Count of unresolved bugs
  6. **Errors** — Recent error count from logs
  7. **Blockers** — Any blocking issues
  8. **Last commit** — Most recent commit hash and message
- **Staleness indicator** — Shows data age and refresh recommendation

## Examples

```bash
# Basic status check
pd status

# With auto-refresh (alerts if data is stale)
pd status --auto-refresh

# Set custom staleness threshold (in minutes)
pd status --refresh-threshold=5

# Combined options
pd status --auto-refresh --refresh-threshold=15
```

## Staleness Detection

The refresh detector uses pure functions to determine if status data may be outdated:

- **Fresh:** Data is current (<50% of threshold)
- **Aging:** Data is getting old (50-100% of threshold)
- **Stale:** Data is outdated (>100% of threshold)

When `--auto-refresh` is enabled and data is stale, the command suggests re-running with refresh options.

## Library Usage

The refresh detector can be imported as a library:

```javascript
import {
  checkStaleness,
  shouldAutoRefresh,
  getRefreshRecommendation
} from './bin/lib/refresh-detector.js';

const isStale = checkStaleness(lastUpdate, 10); // 10 min threshold
const shouldRefresh = shouldAutoRefresh(state, 10);
const recommendation = getRefreshRecommendation(state, 10);
```

***

**Next step:** [pd what-next](what-next.md) for actionable suggestions based on current status.
