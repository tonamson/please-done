---
description: Check project progress and suggest the next command when work is interrupted or forgotten
tools:
  - Read
  - Glob
  - Grep
  - Bash
  - SlashCommand
---
<objective>
Scan `.planning/` to determine unfinished work and the next logical step, then display progress with a suggested command.
With `--execute` flag, automatically invoke the suggested command instead of just displaying it.
READ ONLY (advisory mode). EXECUTES COMMANDS (with --execute).
</objective>
<guards>
Stop and instruct the user if any of the following conditions fail:
- [ ] `.planning/` directory exists -> "The project has not been initialized yet. Run `/pd-init` first."
      </guards>
<context>
User input: $ARGUMENTS
- No arguments: Display progress and suggest next command (advisory mode, READ ONLY)
- `--execute`: Auto-detect state and invoke the suggested command immediately
</context>
<required_reading>
Read .pdconfig → get SKILLS_DIR, then read the following files before starting:
(Claude Code: cat ~/.config/opencode/.pdconfig — other platforms: converter auto-converts paths)
- [SKILLS_DIR]/references/conventions.md → status icons, version filtering
</required_reading>
<conditional_reading>
Read ONLY WHEN needed (analyze task description first):
- [SKILLS_DIR]/references/state-machine.md -- WHEN task relates to milestone state transitions
</conditional_reading>
<process>
## Step 1: Check foundation
Read in order (stop at first MISSING):
1. `.planning/` directory → not found → suggest `/pd-onboard` (new project — runs init+scan automatically), **STOP**
2. `.planning/CONTEXT.md` → not found → suggest `/pd-init`, **STOP**
   1.5. `.planning/PROJECT.md` (if exists) → vision + milestone history
3. `.planning/scan/SCAN_REPORT.md` → not found → note (secondary suggestion Step 5), DO NOT STOP
4. `.planning/ROADMAP.md` → not found → suggest `/pd-new-milestone`, **STOP**
5. `.planning/CURRENT_MILESTONE.md` → `version`, `phase`, `status`
   - status = `All completed` → "All milestones completed!", **STOP**
6. `.planning/REQUIREMENTS.md` (if exists) → coverage statistics
7. `.planning/STATE.md` (if exists) → blocking issues, context, last activity
## Step 2: Check open bugs
Glob `.planning/bugs/BUG_*.md` → grep `> Status:` (Unresolved/In progress) + `> Patch version:` → filter current milestone per [SKILLS_DIR]/references/conventions.md → "Version filtering"
- HAS open bugs → note
- Bugs from other milestones → note separately, secondary suggestion
- Standalone bugs: match `> Patch version: standalone` → count separately, note: "Standalone bugs: [N] (not blocking milestone)."
## Step 3: Check phase progress
1. Glob `.planning/milestones/[version]/phase-[phase]/TASKS.md` → not found → suggest `/pd-plan`, **STOP**
2. Read TASKS.md → count: 🔄 ⬜ 🐛 ✅ ❌. Empty TASKS.md (0 tasks) → "TASKS.md empty, run `/pd-plan` again." **STOP**
3. Glob `phase-[phase]/reports/CODE_REPORT_TASK_*.md` → count
4. ROADMAP.md → remaining phases in milestone
5. `phase-[phase]/TEST_REPORT.md` exists?
6. **Scan untested old phases**: each `milestones/[version]/phase-*/` → ALL tasks ✅ + NO TEST_REPORT → note (Priority 5.6)
7. `VERIFICATION_REPORT.md` exists? → `Passed`/`Has gaps`/`Needs manual testing`
8. **Scan standalone reports**: Glob `.planning/reports/STANDALONE_TEST_REPORT_*.md` → count reports, check for failures → note (Priority 5.7)
## Step 3.5: Display recent errors from logs
Read `.planning/logs/agent-errors.jsonl` → parse last 10 entries via `readJsonlLastN(filePath, 10)` from `bin/lib/log-reader.js` → if errors exist → display error dashboard:
```
╔══════════════════════════════════════╗
║      RECENT ERRORS (Last 10)         ║
╠══════════════════════════════════════╣
║ Error count by skill:                ║
║   pd:fix-bug    [N] errors           ║
║   pd:write-code [N] errors           ║
║   pd:test       [N] errors           ║
║   ...                                 ║
║                                       ║
║ Most recent error:                   ║
║   [timestamp] [skill] [error]        ║
║   Run `/pd-fix-bug` to investigate   ║
╚══════════════════════════════════════╝
```
If NO errors in last 24h → omit error dashboard, show: "✓ No recent errors (last 24h)"
## Step 4: Analyze + suggest (1 main action, priority order)
| Priority | Condition                                                | Suggestion                                                                       |
| -------- | -------------------------------------------------------- | -------------------------------------------------------------------------------- |
| 1        | Open bugs                                                | `/pd-fix-bug`                                                                    |
| 2        | Task 🔄 (check PROGRESS.md if exists)                    | `/pd-write-code [N]` continue                                                    |
| 3        | Task 🐛 (check corresponding bug report)                 | `/pd-fix-bug`                                                                    |
| 4        | Remaining tasks ⬜                                       | `/pd-write-code` or `--parallel`                                                 |
| 5        | All remaining ❌/🐛                                      | `/pd-fix-bug` or check blocking reason                                           |
| 5.5      | VERIFICATION_REPORT `Has gaps`                           | `/pd-fix-bug` or `/pd-write-code` re-verify                                      |
| 5.6      | Completed old phase not tested                           | `/pd-test` (auto-detect phase)                                                   |
| 5.7      | Standalone reports with failures or open standalone bugs | `/pd-fix-bug` — standalone                                                       |
| 6        | All ✅, not tested/test fail                             | `/pd-test` or `/pd-fix-bug`                                                      |
| 7        | Phase complete, more phases ahead                        | `/pd-plan [y.y]`                                                                 |
| 7.5      | All phases ✅ + no `.planning/audit/SECURITY_REPORT.md`  | `/pd-audit` — "No security audit yet. Run `/pd-audit` before closing milestone." |
| 8        | All phases completed                                     | `/pd-complete-milestone`                                                         |
| 9        | No active task/progress for >10 minutes (idle)           | `/pd-status` — "Check current status with auto-refresh"                            |
**Idle Detection Logic:**
- Check STATE.md `last_updated` timestamp vs current time
- If >10 minutes elapsed and no tasks in progress (no 🔄 tasks) → idle state
- Suggest `/pd-status` with optional `--auto-refresh` flag
## Step 4.5: Execute (if --execute flag)
If `$ARGUMENTS` contains `--execute`:
1. Take the `SUGGESTION` determined in Step 4
2. Display the progress report (Step 5) FIRST — user needs to see state before execution
3. Immediately invoke the suggested command via skill:
   - Extract command name and arguments from the suggestion
   - Execute: `skill(command)`
   - Do NOT ask for confirmation — the `--execute` flag IS the confirmation
4. STOP — the invoked command takes over from here
If `$ARGUMENTS` does NOT contain `--execute`:
- Skip this step entirely
- Continue to Step 5 (display report) and Step 6 (version check) as normal
## Step 5: Display report
```
╔══════════════════════════════════════╗
║         PROJECT PROGRESS             ║
╠══════════════════════════════════════╣
║ Project/Vision (from PROJECT.md)    ║
║ Milestone: [name] (v[x.x])         ║
║ Phase: [x.x]                        ║
║ Status: ✅[N] 🔄[N] ⬜[N] 🐛[N] ❌[N] ║
║ Requirements: [X]/[Y] | Open bugs: [N] ║
║ Standalone tests: [N] report(s) | Standalone bugs: [M] open ║
║ Blocking issues: [from STATE.md]    ║
╠══════════════════════════════════════╣
║ SUGGESTION: [command] — [reason]    ║
╚══════════════════════════════════════╝
```
Missing SCAN_REPORT → secondary suggestion `/pd-scan`
**Status Suggestion Example (when idle):**
```
╔══════════════════════════════════════╗
║         IDLE DETECTED                ║
╠══════════════════════════════════════╣
║ No activity for 12 minutes           ║
║                                       ║
║ Quick status check:                 ║
║   /pd-status                        ║
║                                       ║
║ With auto-refresh (stale data alert): ║
║   /pd-status --auto-refresh         ║
║                                       ║
║ Set custom threshold (minutes):       ║
║   /pd-status --refresh-threshold=5  ║
╚══════════════════════════════════════╝
```
## Step 6: Check Skills version
If already checked in conversation → skip.
`.pdconfig` → `SKILLS_DIR`. Check `git rev-parse --git-dir` in SKILLS_DIR → not git → skip.
`LOCAL=$(cat [SKILLS_DIR]/VERSION)` vs `REMOTE=$(cd [SKILLS_DIR] && git fetch origin main --quiet && git show origin/main:VERSION)` → semver compare → REMOTE newer → "Skills v[REMOTE] available. Run `/pd-update`."
Fetch error/same version → skip.
</process>
<output>
**Create/Update:**
- No files are created or modified (advisory mode)
- Commands may be invoked (with --execute flag)
**Next step:** Suggested command based on the actual state (advisory mode) or auto-executed (--execute)
**Success when:**
- Progress is displayed clearly
- The suggested command matches the real current state
**Common errors:**
- `.planning/` does not exist -> run `/pd-init`
- `STATE.md` is missing or broken -> run `/pd-new-milestone` to recreate it
  </output>
<rules>
- All output MUST be in English
- Without --execute: READ ONLY. DO NOT edit any files
- With --execute: Invokes the suggested command via skill after displaying the suggestion
- DO NOT call FastCode MCP or Context7 MCP
- The suggested command MUST be based on the actual current state, never guessed
- DO NOT call FastCode MCP — use only Read/Glob (Bash for version check Step 6)
- DO NOT modify files — read and report only
- With --execute flag: Invokes skill after displaying suggestion
- Without --execute flag: READ ONLY — no file modifications, no command execution
- Missing CONTEXT.md → `/pd-init` then **STOP**
- Only 1 main suggestion (highest priority), with secondary suggestions
- Task 🔄 display number + specific name
- Open bugs display brief description
- Date format DD_MM_YYYY
- Output MUST be in English
</rules>
<script type="error-handler">
const { createBasicErrorHandler } = require('../../../bin/lib/basic-error-handler');
// Create error handler for what-next skill
const errorHandler = createBasicErrorHandler('pd:what-next', '$CURRENT_PHASE', {
  operation: 'what-next'
});
// Export for skill executor
module.exports = { errorHandler };
</script>
