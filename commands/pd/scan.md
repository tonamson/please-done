---
name: pd:scan
description: Scan the entire project, analyze structure, libraries, security, and generate a report
model: haiku
argument-hint: "[project path, defaults to current directory]"
allowed-tools:
  - Read
  - Write
  - Edit
  - Bash
  - Glob
  - Grep
  - mcp__fastcode__code_qa
---

<objective>
Scan the project: analyze code structure, dependencies, architecture, and security to produce a report.
</objective>

<guards>
Stop and instruct the user if any of the following conditions fail:

@references/guard-context.md
@references/guard-valid-path.md
@references/guard-fastcode.md
</guards>

<context>
User input: $ARGUMENTS
Read `.planning/CONTEXT.md` (from /pd:init). No rules are needed here - only scanning and reporting.
</context>

<execution_context>
@workflows/scan.md (required)
</execution_context>

<process>
Execute @workflows/scan.md from start to finish.
</process>

<output>
**Create/Update:**
- Project analysis report on screen
- Update `.planning/CONTEXT.md`

**Next step:** `/pd:plan` or `/pd:new-milestone`

**Success when:**
- Structure, dependencies, and architecture are fully analyzed
- A security report is included if issues are detected
- `CONTEXT.md` has been updated

**Common errors:**
- FastCode MCP is not connected -> check that Docker is running
- The project is too large -> limit the scan scope by directory
</output>

<rules>
- All output MUST be in English
- Only read and analyze, DO NOT change project source code
- The report must include: structure, dependencies, architecture, and security
</rules>

<script type="error-handler">
const { createBasicErrorHandler } = require('../../../bin/lib/basic-error-handler');

// Create error handler for scan skill
const errorHandler = createBasicErrorHandler('pd:scan', '$CURRENT_PHASE', {
  operation: 'scan'
});

// Export for skill executor
module.exports = { errorHandler };
</script>
