<purpose>
Scan .planning/ → determine pending/next work. Display progress + suggest command. READ ONLY, DO NOT modify files.
</purpose>

<required_reading>

- @references/conventions.md → status icons, version filtering
  </required_reading>

<conditional_reading>
Read ONLY WHEN needed:

- @references/state-machine.md -> prerequisites, state flow -- WHEN need to understand state transitions
  </conditional_reading>

<process>

## Step 1: Check foundation

Read in order (stop at first MISSING):

1. `.planning/CONTEXT.md` → not found → suggest `/pd:init`, **STOP**
   1.5. `.planning/PROJECT.md` (if exists) → vision + milestone history
2. `.planning/scan/SCAN_REPORT.md` → not found → note (secondary suggestion Step 5), DO NOT STOP
3. `.planning/ROADMAP.md` → not found → suggest `/pd:new-milestone`, **STOP**
4. `.planning/CURRENT_MILESTONE.md` → `version`, `phase`, `status`
   - status = `All completed` → "All milestones completed!", **STOP**
5. `.planning/REQUIREMENTS.md` (if exists) → coverage statistics
6. `.planning/STATE.md` (if exists) → blocking issues, context, last activity

## Step 2: Check open bugs

Glob `.planning/bugs/BUG_*.md` → grep `> Status:` (Unresolved/In progress) + `> Patch version:` → filter current milestone per @references/conventions.md → "Version filtering"

- HAS open bugs → note
- Bugs from other milestones → note separately, secondary suggestion
- Standalone bugs: match `> Patch version: standalone` → count separately, note: "Standalone bugs: [N] (not blocking milestone)."

## Step 3: Check phase progress

1. Glob `.planning/milestones/[version]/phase-[phase]/TASKS.md` → not found → suggest `/pd:plan`, **STOP**
2. Read TASKS.md → count: 🔄 ⬜ 🐛 ✅ ❌. Empty TASKS.md (0 tasks) → "TASKS.md empty, run `/pd:plan` again." **STOP**
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
║   Run `/pd:fix-bug` to investigate   ║
╚══════════════════════════════════════╝
```

If NO errors in last 24h → omit error dashboard, show: "✓ No recent errors (last 24h)"

## Step 4: Analyze + suggest (1 main action, priority order)

| Priority | Condition                                                | Suggestion                                                                       |
| -------- | -------------------------------------------------------- | -------------------------------------------------------------------------------- |
| 1        | Open bugs                                                | `/pd:fix-bug`                                                                    |
| 2        | Task 🔄 (check PROGRESS.md if exists)                    | `/pd:write-code [N]` continue                                                    |
| 3        | Task 🐛 (check corresponding bug report)                 | `/pd:fix-bug`                                                                    |
| 4        | Remaining tasks ⬜                                       | `/pd:write-code` or `--parallel`                                                 |
| 5        | All remaining ❌/🐛                                      | `/pd:fix-bug` or check blocking reason                                           |
| 5.5      | VERIFICATION_REPORT `Has gaps`                           | `/pd:fix-bug` or `/pd:write-code` re-verify                                      |
| 5.6      | Completed old phase not tested                           | `/pd:test` (auto-detect phase)                                                   |
| 5.7      | Standalone reports with failures or open standalone bugs | `/pd:fix-bug` — standalone                                                       |
| 6        | All ✅, not tested/test fail                             | `/pd:test` or `/pd:fix-bug`                                                      |
| 7        | Phase complete, more phases ahead                        | `/pd:plan [y.y]`                                                                 |
| 7.5      | All phases ✅ + no `.planning/audit/SECURITY_REPORT.md`  | `/pd:audit` — "No security audit yet. Run `/pd:audit` before closing milestone." |
| 8        | All phases completed                                     | `/pd:complete-milestone`                                                         |

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

Missing SCAN_REPORT → secondary suggestion `/pd:scan`

## Step 6: Check Skills version

If already checked in conversation → skip.

`.pdconfig` → `SKILLS_DIR`. Check `git rev-parse --git-dir` in SKILLS_DIR → not git → skip.
`LOCAL=$(cat [SKILLS_DIR]/VERSION)` vs `REMOTE=$(cd [SKILLS_DIR] && git fetch origin main --quiet && git show origin/main:VERSION)` → semver compare → REMOTE newer → "Skills v[REMOTE] available. Run `/pd:update`."
Fetch error/same version → skip.

</process>

<rules>
- DO NOT call FastCode MCP — use only Read/Glob (Bash for version check Step 6)
- DO NOT modify files — read and report only
- Missing CONTEXT.md → `/pd:init` then **STOP**
- Only 1 main suggestion (highest priority), with secondary suggestions
- Task 🔄 display number + specific name
- Open bugs display brief description
- Date format DD_MM_YYYY
- Output MUST be in English
</rules>
