---
name: pd:conventions
description: "Analyze the project and create CONVENTIONS.md with project-specific coding conventions (style, naming, patterns)"
model: sonnet
argument-hint: "(no arguments needed)"
allowed-tools:
  - Read
  - Write
  - Edit
  - Bash
  - Glob
  - Grep
  - AskUserQuestion
---

<objective>
Analyze the project, detect coding conventions, ask about user preferences, then create or update `CONVENTIONS.md`.
</objective>

<guards>
There are no strict prerequisites. This skill can be run at any time.

- [ ] The project directory contains source code -> "The directory is empty or contains no source code to analyze."
</guards>

<context>
User input: $ARGUMENTS
</context>

<execution_context>
@workflows/conventions.md (required)
@references/conventions.md (required)
</execution_context>

<process>
Execute @workflows/conventions.md from start to finish.
</process>

<output>
**Create/Update:**
- `CONVENTIONS.md` -- project coding conventions

**Next step:** `/pd:plan` or `/pd:write-code`

**Success when:**
- `CONVENTIONS.md` includes naming conventions, coding style, and active patterns
- The user confirms the content

**Common errors:**
- The project has no source code -> it cannot be analyzed
- The user disagrees -> allow manual editing
</output>

<rules>
- All output MUST be in English
- You MUST ask the user about personal preferences before creating `CONVENTIONS.md`
- `CONVENTIONS.md` MUST reflect the current codebase reality and must not impose new conventions
</rules>

<script type="error-handler">
const { createBasicErrorHandler } = require('../../../bin/lib/basic-error-handler');

// Create error handler for conventions skill
const errorHandler = createBasicErrorHandler('pd:conventions', '$CURRENT_PHASE', {
  operation: 'conventions'
});

// Export for skill executor
module.exports = { errorHandler };
</script>
