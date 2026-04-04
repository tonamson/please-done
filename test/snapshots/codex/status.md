---
name: pd-status
description: Display a read-only project status dashboard showing milestone, phase, tasks, bugs, lint state, and blockers
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
Display an 8-field read-only project status dashboard.
READ ONLY. DO NOT edit files. DO NOT call FastCode MCP.
</objective>
<guards>
Stop and instruct the user if any of the following conditions fail:
- [ ] `.planning/` directory exists -> "The project has not been initialized yet. Run `$pd-init` first."
</guards>
<context>
User input: {{GSD_ARGS}} (no arguments)
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
6. `PROGRESS.md` in phase directory → read `> lint_fail_count:` and `> last_lint_error:`
   - PROGRESS.md exists + `lint_fail_count >= 1` → lint = "✗ [N] failure(s) — last error: [msg]"
   - PROGRESS.md exists + `lint_fail_count: 0` or field missing → lint = "✓ clean"
   - PROGRESS.md does NOT exist → lint = "✓ no active task"
7. Run `git log -1 --format="%h %s"` → last commit hash + message
   - Not a git repo or no commits → last_commit = "No git history"
## Step 2: Display dashboard
Print exactly 8 fields in this format (align values with spaces for readability):
```
Milestone:   [milestone_name] ([version])
Phase:       [phase_number] — [phase_name or description]
Plan:        [plan_number] — [status] (or "Not started")
Tasks:       [done]/[total] done (✅ [n]  🔄 [n]  ⬜ [n])
Bugs:        [count] open
Lint:        [lint status from Step 1.6]
Blockers:    [blockers or "None"]
Last commit: [hash] [message]
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
**Common errors:**
- `.planning/` does not exist -> run `$pd-init`
- `STATE.md` is missing or broken -> run `$pd-new-milestone` to recreate it
</output>
<rules>
- All output MUST be in English
- READ ONLY. DO NOT edit any files
- DO NOT call FastCode MCP or Context7 MCP
- DO NOT suggest next steps — that is pd:what-next's job
- Display exactly 8 fields in order: Milestone, Phase, Plan, Tasks, Bugs, Lint, Blockers, Last commit
- If PROGRESS.md does not exist → Lint field shows "✓ no active task"
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
