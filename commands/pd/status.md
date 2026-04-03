---
name: pd:status
description: Display a read-only project status dashboard showing milestone, phase, tasks, bugs, lint state, and blockers
model: haiku
argument-hint: "(no arguments needed)"
allowed-tools:
  - Read
  - Glob
  - Bash
---

<objective>
Display an 8-field read-only project status dashboard.
READ ONLY. DO NOT edit files. DO NOT call FastCode MCP.
</objective>

<guards>
Stop and instruct the user if any of the following conditions fail:

- [ ] `.planning/` directory exists -> "The project has not been initialized yet. Run `/pd:init` first."
</guards>

<context>
User input: $ARGUMENTS (no arguments)
No rules or FastCode MCP needed - only read planning files.
</context>

<execution_context>
@workflows/status.md (required)
@references/conventions.md (required)
</execution_context>

<process>
Execute @workflows/status.md from start to finish.
</process>

<output>
**Create/Update:**
- No files are created or modified, read-only only

**Next step:** None — pd:status does not suggest next steps. Use `/pd:what-next` for suggestions.

**Success when:**

- All 8 dashboard fields are displayed
- Zero files were written or modified
- Output is 8–12 lines of formatted status

**Common errors:**

- `.planning/` does not exist -> run `/pd:init`
- `STATE.md` is missing or broken -> run `/pd:new-milestone` to recreate it
</output>

<rules>
- All output MUST be in English
- READ ONLY. DO NOT edit any files
- DO NOT call FastCode MCP or Context7 MCP
- DO NOT suggest next steps — that is pd:what-next's job
- Display exactly 8 fields in order: Milestone, Phase, Plan, Tasks, Bugs, Lint, Blockers, Last commit
- If PROGRESS.md does not exist → Lint field shows "✓ no active task"
</rules>
