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

<rules>
- DO NOT call FastCode MCP — use only Read/Glob/Bash
- DO NOT modify files — read and display only
- DO NOT suggest next steps — pd:status is display-only (pd:what-next handles suggestions)
- Missing data → use fallback values, never stop with an error
- Output MUST be in English
- Lint field MUST reflect actual PROGRESS.md state (or "no active task" if missing)
</rules>
