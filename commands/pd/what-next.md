---
name: pd:what-next
description: Check project progress and suggest the next command when work is interrupted or forgotten
model: haiku
argument-hint: "(no arguments needed)"
allowed-tools:
  - Read
  - Glob
  - Grep
  - Bash
---

<objective>
Scan `.planning/` to determine unfinished work and the next logical step, then display progress with a suggested command.
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
@workflows/what-next.md (required)
@references/conventions.md (required)
@references/state-machine.md (optional)
</execution_context>

<process>
Execute @workflows/what-next.md from start to finish.
</process>

<output>
**Create/Update:**
- No files are created or modified, read-only only

**Next step:** Suggested command based on the actual state

**Success when:**

- Progress is displayed clearly
- The suggested command matches the real current state

**Common errors:**

- `.planning/` does not exist -> run `/pd:init`
- `STATE.md` is missing or broken -> run `/pd:new-milestone` to recreate it
  </output>

<rules>
- All output MUST be in English
- READ ONLY. DO NOT edit any files
- DO NOT call FastCode MCP or Context7 MCP
- The suggested command MUST be based on the actual current state, never guessed
</rules>
