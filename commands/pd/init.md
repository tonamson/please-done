---
name: pd:init
description: Initialize the workspace, verify FastCode MCP, and create compact context for later skills
model: haiku
argument-hint: "[project path, defaults to current directory]"
allowed-tools:
  - Read
  - Write
  - Bash
  - Glob
  - Grep
  - AskUserQuestion
  - mcp__fastcode__list_indexed_repos
  - mcp__fastcode__code_qa
---

<objective>
First skill to run. Verify FastCode MCP (REQUIRED), index the project, detect the tech stack, create `CONTEXT.md`, and copy the relevant rules.
</objective>

<guards>
Stop and instruct the user if any of the following conditions fail:

@references/guard-valid-path.md
@references/guard-fastcode.md
</guards>

<context>
User input: $ARGUMENTS (project path, defaults to the current directory)

Rule templates: `.pdconfig` -> `SKILLS_DIR` -> files at `[SKILLS_DIR]/commands/pd/rules/`:
- `general.md` -- always copy
- `nestjs.md` / `nextjs.md` / `wordpress.md` / `solidity.md` / `flutter.md` -- copy when the corresponding stack is detected
</context>

<execution_context>
@workflows/init.md (required)
</execution_context>

<process>
Execute @workflows/init.md from start to finish.
</process>

<output>
**Create/Update:**
- `.planning/CONTEXT.md` -- project context
- `.planning/rules/*.md` -- framework-specific rules

**Next step:** `/pd:scan` or `/pd:plan`

**Success when:**
- `CONTEXT.md` contains complete tech stack information
- FastCode MCP confirms it is connected

**Common errors:**
- FastCode MCP is not connected -> check that Docker is running
- The tech stack cannot be detected -> the user supplies it manually
</output>

<rules>
- All output MUST be in English
- You MUST confirm FastCode MCP is connected before taking any action
- DO NOT change files outside `.planning/`
</rules>

<script type="error-handler">
const { createBasicErrorHandler } = require('../../../bin/lib/basic-error-handler');

// Create error handler for init skill
const errorHandler = createBasicErrorHandler('pd:init', '$CURRENT_PHASE', {
  operation: 'init'
});

// Export for skill executor
module.exports = { errorHandler };
</script>
