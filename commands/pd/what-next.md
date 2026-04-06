---
name: pd:what-next
description: Check project progress and suggest the next command when work is interrupted or forgotten
model: haiku
argument-hint: "[--execute]"
allowed-tools:
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

- [ ] `.planning/` directory exists -> "The project has not been initialized yet. Run `/pd:init` first."
      </guards>

<context>
User input: $ARGUMENTS
- No arguments: Display progress and suggest next command (advisory mode, READ ONLY)
- `--execute`: Auto-detect state and invoke the suggested command immediately
</context>

<execution_context>
@workflows/what-next.md (required)
@references/conventions.md (required)
@references/state-machine.md (optional)
</execution_context>

<process>
Execute @workflows/what-next.md from start to finish.

**If `--execute` flag is set:**
After determining the suggested command in Step 4, immediately invoke it via SlashCommand.
The advisory display is still shown (for transparency) before execution.
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

- `.planning/` does not exist -> run `/pd:init`
- `STATE.md` is missing or broken -> run `/pd:new-milestone` to recreate it
  </output>

<rules>
- All output MUST be in English
- Without --execute: READ ONLY. DO NOT edit any files
- With --execute: Invokes the suggested command via SlashCommand after displaying the suggestion
- DO NOT call FastCode MCP or Context7 MCP
- The suggested command MUST be based on the actual current state, never guessed
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
