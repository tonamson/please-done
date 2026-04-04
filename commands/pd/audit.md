---
name: pd:audit
description: OWASP security audit - dispatch 13 scanners in parallel and consolidate the report
model: opus
argument-hint: "[path] [--full|--only cat1,cat2|--poc|--auto-fix]"
allowed-tools:
  - Read
  - Write
  - Edit
  - Bash
  - Glob
  - Grep
  - mcp__fastcode__code_qa
  - SubAgent
---

<objective>
Run a comprehensive security audit based on the OWASP Top 10. Dispatch 13 scanners in parallel (2 per wave), consolidate the report, and perform cross-analysis.
</objective>

<guards>
Automatically detect the operating mode BEFORE running guards:

1. Check whether `.planning/PROJECT.md` exists (use Bash: `test -f .planning/PROJECT.md`)
2. Exists -> mode = "integrated": run all 3 guards below
3. Missing -> mode = "standalone": skip guard-context and run only the remaining 2 guards (guard-valid-path, guard-fastcode)

Stop and instruct the user if any guard fails:

@references/guard-context.md (integrated mode only)
@references/guard-valid-path.md
@references/guard-fastcode.md
</guards>

<context>
User input: $ARGUMENTS
</context>

<execution_context>
@workflows/audit.md (required)
</execution_context>

<process>
Execute @workflows/audit.md from start to finish. Pass $ARGUMENTS to the workflow.
</process>

<output>
**Create:**
- SECURITY_REPORT.md (location depends on mode: standalone -> `./`, integrated -> `.planning/audit/`)
- Evidence files in a temp directory

**Next step:** Read SECURITY_REPORT.md to review the results

**Success when:**
- All scanners were dispatched and returned a result (or inconclusive)
- SECURITY_REPORT.md was created in the correct location

**Common errors:**
- FastCode MCP is not connected -> check that Docker is running
- SubAgent is unavailable -> check tool configuration for SubAgent access
</output>

<rules>
- All output MUST be in English.
- DO NOT modify project code - only scan and report.
- When `--poc` is passed: pass the `--poc` flag to the scanner in the B5 dispatch prompt.
- When `--auto-fix` is passed: report "Not supported in this version yet" and continue.
</rules>

<script type="error-handler">
const { createAuditErrorHandler } = require('../../../bin/lib/enhanced-error-handler');

// Create error handler for audit skill
const errorHandler = createAuditErrorHandler('$CURRENT_PHASE', {
  auditType: 'security',
  scannersUsed: [],
  findingsCount: 0,
  sessionDelta: null
});

// Export for skill executor
module.exports = { errorHandler };
</script>
