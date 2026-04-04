---
name: pd:status
description: Display a read-only project status dashboard showing milestone, phase, tasks, bugs, errors, and blockers with optional staleness detection
model: haiku
argument-hint: "[--auto-refresh] [--refresh-threshold=MINUTES]"
allowed-tools:
  - Read
  - Glob
  - Bash
---

<objective>
Display an 8-field read-only project status dashboard with optional auto-refresh detection.
READ ONLY. DO NOT edit files. DO NOT call FastCode MCP.
</objective>

<guards>
Stop and instruct the user if any of the following conditions fail:

- [ ] `.planning/` directory exists -> "The project has not been initialized yet. Run `/pd:init` first."
</guards>

<context>
User input: $ARGUMENTS
- No arguments: Display basic status
- `--auto-refresh`: Enable staleness detection and show refresh recommendation
- `--refresh-threshold=N`: Set staleness threshold in minutes (default: 10)

No rules or FastCode MCP needed - only read planning files.
</context>

<execution_context>
@workflows/status.md (required)
@references/conventions.md (required)
</execution_context>

<process>
Execute @workflows/status.md from start to finish.

**If `--auto-refresh` flag is set:**
1. Load `refresh-detector.js` library
2. Check `STATE.md` `last_updated` timestamp
3. Determine staleness level (fresh/aging/stale)
4. Display staleness indicator in dashboard
5. Show refresh recommendation if stale

**If `--refresh-threshold` flag is set:**
1. Parse threshold value (must be positive integer)
2. Use custom threshold instead of default (10 minutes)
3. Apply to staleness detection
</process>

<output>
**Create/Update:**
- No files are created or modified, read-only only

**Next step:** None — pd:status does not suggest next steps. Use `/pd:what-next` for suggestions.

**Success when:**

- All 8 dashboard fields are displayed
- Zero files were written or modified
- Output is 8–12 lines of formatted status
- With `--auto-refresh`: Staleness indicator shown

**Common errors:**

- `.planning/` does not exist -> run `/pd:init`
- `STATE.md` is missing or broken -> run `/pd:new-milestone` to recreate it
- Invalid threshold value -> use positive integer (e.g., `--refresh-threshold=5`)
</output>

<rules>
- All output MUST be in English
- READ ONLY. DO NOT edit any files
- DO NOT call FastCode MCP or Context7 MCP
- DO NOT suggest next steps — that is pd:what-next's job
- Display exactly 8 fields in order: Milestone, Phase, Plan, Tasks, Bugs, Lint, Blockers, Last commit
- **Lint field** shows lint_fail_count from PROGRESS.md:
  - ✓ No lint failures (count = 0 or no PROGRESS.md)
  - ✗ [count]/3 lint failure(s) (count > 0)
  - Includes last error message (first 100 chars) when count > 0
  - Suggests `/pd:fix-bug` when count > 0
- With `--auto-refresh`, append staleness indicator:
  - Fresh: "Data current (X min ago)"
  - Aging: "Data aging (X min ago)"
  - Stale: "⚠ Data stale (X min ago) — Run `/pd:status --auto-refresh`"
</rules>

<script type="error-handler">
const { createBasicErrorHandler } = require('../../../bin/lib/basic-error-handler');

// Create error handler for status skill
const errorHandler = createBasicErrorHandler('pd:status', '$CURRENT_PHASE', {
  operation: 'status'
});

// Export for skill executor
module.exports = { errorHandler };
</script>
