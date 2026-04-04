<purpose>
Read planning files and git log to display an 8-field project status dashboard. READ ONLY, DO NOT modify files.
</purpose>

<required_reading>

- @references/conventions.md → status icons, version format
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
   - Missing → tasks = "No tasks (run /pd:plan)"
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
               Run `/pd:fix-bug` if issues persist
  ```

**Map Status format:**
- No META.json or no map:
  ```
  Map:         — No codebase map (run `/pd:map-codebase`)
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
  Map:         ✗ Stale (commit [first 7 chars], [commitDelta] commits behind) — Run /pd:map-codebase
  ```
- Error (map_status === 'error'):
  ```
  Map:         ⚠ Error checking staleness: [error message]
  ```

- Total lines: 8–12 (the 8 fields, plus optional blank lines for readability)
- DO NOT add any suggestions, recommendations, or "next step" advice
- DO NOT add decorative boxes or borders — plain text with aligned colons

</process>

<rules>
- DO NOT call FastCode MCP — use only Read/Glob/Bash
- DO NOT modify files — read and display only
- DO NOT suggest next steps — pd:status is display-only (pd:what-next handles suggestions)
- Missing data → use fallback values, never stop with an error
- Output MUST be in English
- Lint field MUST reflect actual PROGRESS.md state (or "no active task" if missing)
</rules>
