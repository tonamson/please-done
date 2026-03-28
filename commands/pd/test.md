---
name: pd:test
description: Write tests + run verification (NestJS/WordPress/Solidity/Flutter/Frontend), confirm with the user, and report failures
model: sonnet
argument-hint: "[task number | --all]"
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
Write tests based on the stack (Jest/PHPUnit/Hardhat-Foundry/flutter_test). For frontend-only work: provide a manual test checklist plus confirmation.
Test with concrete data, run the tests, get user confirmation, then commit.

**After completion:** `/pd:write-code`, `/pd:fix-bug`, or `/pd:complete-milestone`
</objective>

<guards>
Stop and instruct the user if any of the following conditions fail:

@references/guard-context.md
- [ ] Valid task number or `--all` flag provided -> "Provide a task number or use `--all`."
@references/guard-fastcode.md
@references/guard-context7.md
- [ ] At least one task is in `done` state -> "No completed tasks yet. Run `/pd:write-code` first."
</guards>

<context>
User input: $ARGUMENTS
- Task number -> test only that task (it must already be done)
- `--all` -> full regression across all phases
- No input -> test all done tasks in the current phase

Additional reads:
- `.planning/rules/general.md` -> general rules
- `.planning/rules/{nestjs,wordpress,solidity,flutter}.md` -> build & lint rules (ONLY if they exist)
</context>

<execution_context>
@workflows/test.md (required)
@references/conventions.md (required)
@references/context7-pipeline.md (optional)
</execution_context>

<process>
Execute @workflows/test.md from start to finish.
</process>

<output>
**Create/Update:**
- Test files for each stack (Jest, PHPUnit, Hardhat, `flutter_test`)
- Manual test checklist for frontend-only work
- Update `TASKS.md`

**Next step:** `/pd:write-code`, `/pd:fix-bug`, or `/pd:complete-milestone`

**Success when:**
- Test files were created and run successfully
- The user confirmed the result
- The testing work was committed

**Common errors:**
- Tests fail -> read the failure, fix the test or the code, then run again
- Test framework not found -> check `package.json` and the configuration
- MCP is not connected -> check Docker and configuration
</output>

<rules>
- All output MUST be in English.
- Tests MUST use concrete input data, not vague generic mocks.
- You MUST run the tests and confirm they pass before committing.
- You MUST ask the user for confirmation before finishing.
</rules>
