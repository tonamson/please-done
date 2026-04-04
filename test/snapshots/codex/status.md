---
name: pd-status
description: Display a read-only project status dashboard showing milestone, phase, tasks, bugs, errors, and blockers with optional staleness detection
---
<codex_skill_adapter>
## How to invoke this skill
Skill name: `$pd-status`
When the user invokes `$pd-status {{args}}`, execute all instructions below.
## Tool mapping
- `AskUserQuestion` → `request_user_input`: When you need to ask the user, use request_user_input instead of AskUserQuestion
- `Task()` → `spawn_agent()`: When you need to spawn a sub-agent, use spawn_agent with fork_context
  - Wait for result: `wait(agent_ids)`
  - End agent: `close_agent()`
## Compatibility fallback
- If `request_user_input` is not available in the current mode, ask the user in plain text with a short question and wait for the user to respond
- Anywhere that says "MUST use `request_user_input`" means: prefer using it when the tool is available; otherwise fall back to plain text questions — never guess on behalf of the user
## Conventions
- `$ARGUMENTS` is equivalent to `{{GSD_ARGS}}` — user input when invoking the skill
- All config paths have been converted to `~/.codex/`
- MCP tools (`mcp__*`) work automatically via config.toml
- Read `~/.codex/.pdconfig` (cat ~/.codex/.pdconfig) → get `SKILLS_DIR`
- References to `[SKILLS_DIR]/templates/*`, `[SKILLS_DIR]/references/*` → read from the corresponding source directory
</codex_skill_adapter>
<objective>
Display an 8-field read-only project status dashboard with optional auto-refresh detection.
READ ONLY. DO NOT edit files. DO NOT call FastCode MCP.
</objective>
<guards>
Stop and instruct the user if any of the following conditions fail:
- [ ] `.planning/` directory exists -> "The project has not been initialized yet. Run `$pd-init` first."
</guards>
<context>
User input: {{GSD_ARGS}}
- No arguments: Display basic status
- `--auto-refresh`: Enable staleness detection and show refresh recommendation
- `--refresh-threshold=N`: Set staleness threshold in minutes (default: 10)
No rules or FastCode MCP needed - only read planning files.
</context>
<required_reading>
Read .pdconfig → get SKILLS_DIR, then read the following files before starting:
(Claude Code: cat ~/.codex/.pdconfig — other platforms: converter auto-converts paths)
- [SKILLS_DIR]/references/conventions.md → status icons, version format
</required_reading>
<process>
## Step 1: Gather data sources
Read each source in order. Missing files → use fallback values (do NOT stop):
1. `.planning/STATE.md` → extract `milestone:`, `milestone_name:`, blockers section
   - Missing → milestone = "Unknown", blockers = "Unknown (STATE.md missing)"
2. `.planning/CURRENT_MILESTONE.md` → extract `version:`, `phase:`, `status:`
   - Missing → fall back to STATE.md `stopped_at:` field for phase info; plan = "Unknown"
3. Derive phase directory: `.planning/milestones/[version]/phase-[phase]/`
4. `TASKS.md` in phase directory → count tasks by status icon (✅ 🔄 ⬜ 🐛 ❌)
   - Missing → tasks = "No tasks (run $pd-plan)"
5. Glob `.planning/bugs/BUG_*.md` → count files where `> Status:` is `Unresolved` or `In progress`
   - No bugs directory or no files → bugs = 0
6. `PROGRESS.md` in phase directory → read `lint_fail_count:` and `last_lint_error:`
   - Extract lint_fail_count (default 0 if missing)
   - Extract last_lint_error, truncate to first 100 chars
7. **Map staleness check:**
   - Read `.planning/codebase/META.json` → extract `mapped_at_commit`
   - **MISSING** → map_status = "no_map"
   - **EXISTS**:
     - Run `node -e "const {detectStaleness} = require('./bin/lib/staleness-detector.js'); console.log(JSON.stringify(detectStaleness('COMMIT_SHA')))"`
     - Parse result to get `level`, `commitDelta`, `currentCommit`, `error`
     - `error !== null` → map_status = "error", store error message
     - `level === 'fresh'` → map_status = "fresh"
     - `level === 'aging'` → map_status = "aging"
     - `level === 'stale'` → map_status = "stale"
8. Run `git log -1 --format="%h %s"` → last commit hash + message
   - Not a git repo or no commits → last_commit = "No git history"
## Step 2: Display dashboard
Print exactly 9 fields in this format (align values with spaces for readability):
```
Milestone:   [milestone_name] ([version])
Phase:       [phase_number] — [phase_name or description]
Plan:        [plan_number] — [status] (or "Not started")
Tasks:       [done]/[total] done (✅ [n]  🔄 [n]  ⬜ [n])
Bugs:        [count] open
Lint:        [lint status - see format below]
Map:         [map status - see format below]
Blockers:    [blockers or "None"]
Last commit: [hash] [message]
```
**Lint Status format:**
- `lint_fail_count === 0` or PROGRESS.md doesn't exist:
  ```
  Lint:        ✓ No lint failures
  ```
- `lint_fail_count > 0`:
  ```
  Lint:        ✗ [count]/3 lint failure(s)
               Last error: [first 100 chars of last_lint_error]
               Run `$pd-fix-bug` if issues persist
  ```
**Map Status format:**
- No META.json or no map:
  ```
  Map:         — No codebase map (run `$pd-map-codebase`)
  ```
- Fresh (map_status === 'fresh'):
  ```
  Map:         ✓ Current (commit [first 7 chars], [commitDelta] commits behind)
  ```
- Aging (map_status === 'aging'):
  ```
  Map:         ~ Aging (commit [first 7 chars], [commitDelta] commits behind) — Consider refresh
  ```
- Stale (map_status === 'stale'):
  ```
  Map:         ✗ Stale (commit [first 7 chars], [commitDelta] commits behind) — Run $pd-map-codebase
  ```
- Error (map_status === 'error'):
  ```
  Map:         ⚠ Error checking staleness: [error message]
  ```
- Total lines: 8–12 (the 8 fields, plus optional blank lines for readability)
- DO NOT add any suggestions, recommendations, or "next step" advice
- DO NOT add decorative boxes or borders — plain text with aligned colons
</process>
<output>
**Create/Update:**
- No files are created or modified, read-only only
**Next step:** None — pd:status does not suggest next steps. Use `$pd-what-next` for suggestions.
**Success when:**
- All 8 dashboard fields are displayed
- Zero files were written or modified
- Output is 8–12 lines of formatted status
- With `--auto-refresh`: Staleness indicator shown
**Common errors:**
- `.planning/` does not exist -> run `$pd-init`
- `STATE.md` is missing or broken -> run `$pd-new-milestone` to recreate it
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
  - Suggests `$pd-fix-bug` when count > 0
- With `--auto-refresh`, append staleness indicator:
  - Fresh: "Data current (X min ago)"
  - Aging: "Data aging (X min ago)"
  - Stale: "⚠ Data stale (X min ago) — Run `$pd-status --auto-refresh`"
- DO NOT call FastCode MCP — use only Read/Glob/Bash
- DO NOT modify files — read and display only
- DO NOT suggest next steps — pd:status is display-only (pd:what-next handles suggestions)
- Missing data → use fallback values, never stop with an error
- Output MUST be in English
- Lint field MUST reflect actual PROGRESS.md state (or "no active task" if missing)
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
