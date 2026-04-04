---
name: pd:research
description: Automated research - classify internal vs external, collect evidence, verify, and cross-validate
model: sonnet
argument-hint: "[research topic]"
allowed-tools:
  - Read
  - Write
  - Edit
  - Bash
  - Glob
  - Grep
  - Agent
  - mcp__context7__resolve-library-id
  - mcp__context7__query-docs
---

<objective>
Research a single topic automatically: classify it as internal/external, run the Evidence Collector -> Fact Checker pipeline, and cross-validate when both types exist. After completion: display a summary of the results.

**After completion:** `/pd:what-next`
</objective>

<guards>
Stop and instruct the user if any of the following conditions fail:

@references/guard-context.md

- [ ] A research topic was provided -> "Please provide a topic to research."
      </guards>

<context>
User input: $ARGUMENTS
</context>

<execution_context>
@workflows/research.md (required)
@references/conventions.md (required)
</execution_context>

<process>
Execute @workflows/research.md from start to finish.
</process>

<output>
**Create/Update:**
- Research file in `.planning/research/internal/` or `external/`
- Verification file from Fact Checker
- `INDEX.md` updated
- `AUDIT_LOG.md` updated

**Next step:** `/pd:what-next`

**Success when:**

- The research file has complete frontmatter
- Fact Checker has verified the findings
- A summary is shown to the user

**Common errors:**

- The topic cannot be classified -> default to external
- Evidence Collector cannot find sources -> continue with confidence LOW
- MCP is not connected -> check configuration
  </output>

<rules>
- All output MUST be in English
- You MUST run the full pipeline: route -> collect -> verify
- DO NOT skip Fact Checker when Collector fails - run it with confidence LOW
</rules>

<script type="error-handler">
const { createBasicErrorHandler } = require('../../../bin/lib/basic-error-handler');

// Create error handler for research skill
const errorHandler = createBasicErrorHandler('pd:research', '$CURRENT_PHASE', {
  operation: 'research'
});

// Export for skill executor
module.exports = { errorHandler };
</script>
