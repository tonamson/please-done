---
name: pd:fix-bug
description: Find and fix bugs using a scientific method, investigate, report, patch the code, create a [BUG] commit, and confirm until resolved
argument-hint: "[bug description or investigation session name]"
allowed-tools:
  - Read
  - Write
  - Edit
  - Bash
  - Glob
  - Grep
  - AskUserQuestion
  - mcp__fastcode__code_qa
  - mcp__context7__resolve-library-id
  - mcp__context7__query-docs
---

<objective>
Fix bugs through a clear process: symptom -> risk classification -> hypothesis -> verification -> gate check -> fix -> confirmation.
Store the investigation state in `.planning/debug/` so it can be resumed after session loss.
Repeat until the user confirms success. Create a patch version for completed milestones.

**After completion:** `/pd:what-next`
</objective>

<guards>
Stop and instruct the user if any of the following conditions fail:

@references/guard-context.md
- [ ] A bug description was provided -> "Please provide a bug description or investigation session name."
@references/guard-fastcode.md
@references/guard-context7.md
</guards>

<context>
User input: $ARGUMENTS

Additional reads:
- `.planning/rules/general.md` -> general rules
- `.planning/rules/{nestjs,nextjs,wordpress,solidity,flutter}.md` -> rules for the bug type (ONLY if they exist)
</context>

<execution_context>
@workflows/fix-bug.md (required)
@references/conventions.md (required)
@CONVENTIONS.md (optional)
<!-- If CONVENTIONS.md exists at project root, read it before writing code to follow project-specific conventions -->
@references/prioritization.md (optional)
@references/context7-pipeline.md (optional)
</execution_context>

<process>
Execute @workflows/fix-bug.md from start to finish.
</process>

<output>
**Create/Update:**
- Fixed source code
- `.planning/debug/` -- investigation session state
- Update `TASKS.md` if relevant

**Next step:** `/pd:what-next`

**Success when:**
- The user confirms the bug is fixed
- Related tests pass if they exist
- A `[BUG]` commit was created

**Common errors:**
- The bug cannot be reproduced -> ask the user for more information
- The issue is in a dependency -> update the package and verify the version
- MCP is not connected -> check Docker and configuration
</output>

<rules>
- All output MUST be in English.
- You MUST store investigation state in `.planning/debug/` for recovery.
- You MUST pass the gate check before changing code.
- You MUST repeat the loop until the user confirms success.
- You MUST NOT change code unrelated to the bug.
</rules>

