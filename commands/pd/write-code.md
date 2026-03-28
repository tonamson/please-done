---
name: pd:write-code
description: Write code for tasks already planned in TASKS.md, lint, build, commit, and report back (requires PLAN.md + TASKS.md first)
model: sonnet
argument-hint: "[task number] [--auto | --parallel]"
allowed-tools:
  - Read
  - Write
  - Edit
  - Bash
  - Glob
  - Grep
  - Agent
  - AskUserQuestion
  - mcp__fastcode__code_qa
  - mcp__context7__resolve-library-id
  - mcp__context7__query-docs
---
<!-- Audit 2026-03-23: Intentional -- Agent tool required for --parallel mode multi-agent execution. See Phase 14 Audit I4. -->

<objective>
Write source code according to the tasks in `PLAN.md` and `TASKS.md`, follow `.planning/rules/`, run lint + build, then commit.

**Modes:** By default, execute one task then stop and ask | `--auto`: execute all tasks sequentially | `--parallel`: execute in waves using multiple agents.
**Recovery:** Automatically detect progress from `PROGRESS.md` + file/git state and continue from the interruption point.
**After completion:** Run `/pd:test`, `/pd:plan [next phase]`, or `/pd:complete-milestone`.
</objective>

<guards>
Stop and instruct the user if any of the following conditions fail:

@references/guard-context.md
- [ ] Valid task number or `--auto`/`--parallel` flag provided -> "Provide a task number or a mode flag."
- [ ] `PLAN.md` and `TASKS.md` exist for the current phase -> "Run `/pd:plan` first to create the plan."
@references/guard-fastcode.md
@references/guard-context7.md
</guards>

<context>
User input: $ARGUMENTS
- Task number (e.g. `3`) -> execute that specific task.
- `--auto` -> execute sequentially | `--parallel` -> execute in parallel | Combination example: `3 --auto`.
- No input -> choose the next unchecked task, and after finishing one task, STOP to ask the user.

Additional reads:
- `.planning/PROJECT.md` -> project vision and constraints.
- `.planning/rules/general.md` -> general rules (always read).
- `.planning/rules/{nestjs,nextjs,wordpress,solidity,flutter}.md` -> technology-specific rules (ONLY if they exist).
</context>

<execution_context>
@workflows/write-code.md (required)
@references/conventions.md (required)
@references/prioritization.md (optional)
@references/ui-brand.md (optional)
@references/security-checklist.md (optional)
@references/verification.md (optional)
@templates/progress.md (optional)
@references/context7-pipeline.md (optional)
</execution_context>

<process>
Execute @workflows/write-code.md from start to finish. Task selection, coding, validation, security checks, commits, and status updates are defined inside that workflow.
</process>

<output>
**Create/Update:**
- Source code and test files for the task.
- Update `TASKS.md` and `PROGRESS.md`.

**Next step:** `/pd:test`, `/pd:plan [next phase]`, or `/pd:complete-milestone`.

**Success when:**
- The code is complete and both lint and build pass.
- The task is marked complete in `TASKS.md`.
- A clear commit message was created.

**Common errors:**
- Lint or build fails -> read the error, fix the code, then run again.
- The task is unclear -> ask the user via `AskUserQuestion`.
- MCP is not connected -> check the service and configuration.
</output>

<rules>
- All output MUST be in English.
- You MUST read and follow the rules in `.planning/rules/` before writing code.
- You MUST run lint and build after writing code.
- You MUST commit after finishing each task.
- You MUST NOT change source code outside the scope of the current task.
</rules>
