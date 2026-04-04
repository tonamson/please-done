---
name: pd:complete-milestone
description: Complete the milestone, commit, create a git tag, and generate a completion report
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
Check closed issues, generate a completion report, commit, create a git tag, update tracking files, and move to the next milestone.
Only allow completion when all work is finished and every bug has been handled.
</objective>

<guards>
Stop and instruct the user if any of the following conditions fail:

@references/guard-context.md
- [ ] All milestone tasks are complete -> "There are unfinished tasks. Complete them before closing the milestone."
- [ ] No unresolved open bugs remain -> "There are still unresolved bugs. Run `/pd:fix-bug` first."
</guards>

<context>
User input: $ARGUMENTS (not used, because the version is taken automatically from CURRENT_MILESTONE.md)

Additional reads:
- `.planning/PROJECT.md` -> update milestone history
- `.planning/rules/general.md` -> language, dates, version format, commit format
</context>

<execution_context>
@workflows/complete-milestone.md (required)
@references/conventions.md (required)
@references/state-machine.md (optional)
@references/ui-brand.md (optional)
@references/verification.md (optional)
@templates/current-milestone.md (optional)
@templates/state.md (optional)
@templates/verification-report.md (optional)
</execution_context>

<process>
Execute @workflows/complete-milestone.md from start to finish.
</process>

<output>
**Create/Update:**
- Milestone completion report
- Git tag for the version
- `.planning/PROJECT.md` -- update milestone history
- `.planning/STATE.md` -- reset for the next milestone
- `.planning/CURRENT_MILESTONE.md` -- mark completed

**Next step:** `/pd:scan` or `/pd:new-milestone`

**Success when:**
- All tasks are complete and no open bugs remain
- The git tag matches the version
- PROJECT.md records the milestone outcome

**Common errors:**
- Unfinished tasks remain -> complete them first
- Git conflict -> resolve manually
- Open bugs remain -> run `/pd:fix-bug` first
</output>

<rules>
- All output MUST be in English.
- DO NOT close the milestone if any task is unfinished.
- DO NOT close the milestone if any open bug remains.
- You MUST create the git tag after the commit succeeds.
- You MUST ask the user for confirmation before closing the milestone.
</rules>

<script type="error-handler">
const { createBasicErrorHandler } = require('../../../bin/lib/basic-error-handler');

// Create error handler for complete-milestone skill
const errorHandler = createBasicErrorHandler('pd:complete-milestone', '$CURRENT_PHASE', {
  operation: 'complete-milestone'
});

// Export for skill executor
module.exports = { errorHandler };
</script>
