---
name: pd:new-milestone
description: Strategic project planning with a clear roadmap and milestones
model: opus
argument-hint: "[milestone name, e.g. 'v1.1 Notifications'] [--reset-phase-numbers]"
allowed-tools:
  - Read
  - Write
  - Edit
  - Bash
  - Glob
  - Grep
  - AskUserQuestion
  - WebSearch
  - mcp__context7__resolve-library-id
  - mcp__context7__query-docs
---

<objective>
Initialize a new milestone: check -> update the project -> ask questions -> research (optional) -> requirements -> roadmap -> approval.
</objective>

<guards>
Stop and instruct the user if any of the following conditions fail:

@references/guard-context.md
- [ ] `.planning/rules/general.md` exists -> "Rules are missing. Run `/pd:init` to recreate them."
- [ ] A milestone name is provided, or the user will be asked if it is missing
@references/guard-context7.md
- [ ] WebSearch is available when research is needed -> "WebSearch is unavailable. Check the network connection."
</guards>

<context>
Milestone name: $ARGUMENTS (optional -- ask if missing)
- `--reset-phase-numbers` -> renumber phases starting from 1
- Remaining input = milestone name/description

Additional reads:
- `.planning/PROJECT.md` -> milestone history
- `.planning/rules/general.md` -> language, dates, conventions
</context>

<execution_context>
@workflows/new-milestone.md (required)
@templates/project.md (required)
@templates/requirements.md (required)
@templates/roadmap.md (required)
@templates/state.md (required)
@templates/current-milestone.md (required)
@references/questioning.md (optional)
@references/conventions.md (required)
@references/ui-brand.md (optional)
@references/prioritization.md (optional)
@references/state-machine.md (optional)
</execution_context>

<process>
Execute @workflows/new-milestone.md from start to finish.
</process>

<output>
**Create/Update:**
- `.planning/PROJECT.md` -- project vision and milestone history
- `.planning/REQUIREMENTS.md` -- requirements with IDs and tracking table
- `.planning/ROADMAP.md` -- phase roadmap
- `.planning/STATE.md` -- reset working state
- `.planning/CURRENT_MILESTONE.md` -- track the active milestone
- `.planning/research/` -- research material if needed for new features

**Next step:** `/pd:plan`

**Success when:**
- `ROADMAP.md` contains all phases with clear descriptions
- `REQUIREMENTS.md` contains IDs for each requirement
- `STATE.md` is initialized for the new milestone

**Common errors:**
- Missing `CONTEXT.md` -> run `/pd:init` first
- Missing rules -> run `/pd:init` to recreate them
- Duplicate milestone name -> rename it or use a different version
</output>

<rules>
- All output MUST be in English.
- You MUST ask the user to approve the requirements before creating the roadmap.
- You MUST ask the user to approve the roadmap before committing.
- Research is required only for new features, and may be skipped for refactor or bugfix milestones.
</rules>

<script type="error-handler">
const { createBasicErrorHandler } = require('../../../bin/lib/basic-error-handler');

// Create error handler for new-milestone skill
const errorHandler = createBasicErrorHandler('pd:new-milestone', '$CURRENT_PHASE', {
  operation: 'new-milestone'
});

// Export for skill executor
module.exports = { errorHandler };
</script>
