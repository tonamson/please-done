---
name: pd:plan
description: Technical planning + task breakdown for the current milestone
model: opus
argument-hint: "[--auto | --discuss] [specific phase, e.g. '1.2']"
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
Research the project, design the technical solution, and break the work into concrete tasks.
`--auto` (default): AI decides everything | `--discuss`: interactive discussion where the user chooses the approach.
</objective>

<guards>
Stop and instruct the user if any of the following conditions fail:

@references/guard-context.md
- [ ] `.planning/ROADMAP.md` exists -> "Run `/pd:new-milestone` first."
- [ ] `.planning/CURRENT_MILESTONE.md` exists -> "CURRENT_MILESTONE.md is missing. Run `/pd:new-milestone` to create it."
@references/guard-fastcode.md
@references/guard-context7.md
</guards>

<context>
User input: $ARGUMENTS
- `--discuss` -> discussion mode | default/`--auto` -> automatic mode | if both are provided -> discussion takes priority.
- Remaining input = phase/deliverable information.

Additional reads:
- `.planning/PROJECT.md` -> project vision and constraints.
- `.planning/rules/general.md` -> general rules.
- `.planning/rules/{nestjs,nextjs,wordpress,solidity,flutter}.md` -> technology-specific rules (ONLY if they exist).
</context>

<execution_context>
@workflows/plan.md (required)
@templates/plan.md (required)
@templates/tasks.md (required)
@templates/research.md (required)
@references/questioning.md (optional)
@references/conventions.md (required)
@CONVENTIONS.md (optional)
<!-- If CONVENTIONS.md exists at project root, read it before writing code to follow project-specific conventions -->
@references/prioritization.md (optional)
@references/ui-brand.md (optional)
@references/verification.md (optional)
@references/context7-pipeline.md (optional)
</execution_context>

<process>
Execute @workflows/plan.md from start to finish.
</process>

<output>
**Create/Update:**
- `.planning/milestones/[version]/phase-[phase]/RESEARCH.md`
- `.planning/milestones/[version]/phase-[phase]/PLAN.md`
- `.planning/milestones/[version]/phase-[phase]/TASKS.md`

**Next step:** `/pd:write-code`

**Success when:**
- The plan covers all requirements for the phase.
- The tasks are specific enough to execute.
- The research section provides enough context for implementation.

**Common errors:**
- FastCode MCP is not connected -> check that the service is running.
- Missing `ROADMAP.md` -> run `/pd:new-milestone` first.
- The phase does not exist in `ROADMAP` -> check the phase number.
</output>

<rules>
- All output MUST be in English.
- Follow the `--auto`/`--discuss` mode strictly: `auto` does not ask questions, `discuss` lists options for the user.
- DO NOT write source code during the planning step, only design and task breakdown.
- The research section MUST check existing libraries before proposing any new dependency.
</rules>

<script type="error-handler">
const { createPlanErrorHandler } = require('../../../bin/lib/enhanced-error-handler');

// Create error handler for plan skill
const errorHandler = createPlanErrorHandler('$CURRENT_PHASE', {
  phaseNumber: typeof $ARGUMENTS !== 'undefined' ? $ARGUMENTS : 'unknown',
  requirements: [],
  researchComplete: false
});

// Export for skill executor
module.exports = { errorHandler };
</script>
