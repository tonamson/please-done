---
name: pd:health
description: Diagnose planning directory issues — missing files, STATE.md validation, orphaned directories
model: haiku
argument-hint: "[--json]"
allowed-tools:
  - Read
  - Glob
  - Bash
---

<objective>
Diagnose planning directory issues and report with severity-classified, actionable output. READ ONLY. DO NOT edit files.
</objective>

<guards>
Stop and instruct the user if any of the following conditions fail:

- [ ] `.planning/` directory exists -> "The project has not been initialized yet. Run `/pd:init` first."
</guards>

<context>
User input: $ARGUMENTS
- No arguments: Display health report as formatted boxed table
- `--json`: Display as machine-readable JSON

No rules or FastCode MCP needed - only read planning files.
</context>

<process>
1. Read `.planning/ROADMAP.md` → extract completed phase numbers (phases with `[x]` checkbox) and all phase numbers from the progress table
2. Glob `.planning/phases/*/` → get all phase directories
3. For each phase directory: Glob `.planning/phases/{dirname}/*` → get file list for each directory
4. Read `.planning/STATE.md` → pass content to `checkStateMdStructure()` from `bin/lib/health-checker.js`
5. Build data structures:
   - `phaseDirs`: array of `{ name: string, files: string[] }` for each subdirectory found
   - `completedPhases`: array of phase numbers marked complete in roadmap
   - `roadmapPhases`: array of all phase numbers from roadmap
   - `dirNames`: array of directory name strings
   - `stateContent`: raw STATE.md file content
6. Call `runAllChecks({ phaseDirs, completedPhases, roadmapPhases, dirNames, stateContent })` from `bin/lib/health-checker.js`
7. **Scope reduction check** (load `checkScopeReductions` and `formatScopeReport` from `bin/lib/scope-checker.js`):
   - For each phase directory that has both a PLAN.md (`*-PLAN.md`) and a SUMMARY.md (`*-SUMMARY.md`):
     - Read the PLAN.md and SUMMARY.md file contents
     - Build a pair: `{ planContent, summaryContent, label: "Phase {N}" }`
   - Call `checkScopeReductions(pairs)` — returns `scopeIssues` in health-checker issue format
   - Keep `scopeIssues` **separate** from the health issues list — do NOT merge them
8. If `--json` flag present: output `JSON.stringify({ healthIssues: issues, scopeIssues }, null, 2)` via `log.info()`
9. Otherwise:
   - Call `formatHealthReport(issues)` and output via `log.info()`
   - Call `formatScopeReport(scopeIssues)` and output via `log.info()`
</process>

<output>
**Create/Update:**
- No files are created or modified, read-only only

**Next step:** None — pd:health diagnoses issues only

**Success when:**

- Health report is displayed with all 3 check categories (missing files, state schema, orphaned dirs)
- Zero files were written or modified

**Common errors:**

- `.planning/` does not exist -> run `/pd:init`
- `STATE.md` is missing or broken -> run `/pd:new-milestone` to recreate it
</output>

<rules>
- All output MUST be in English
- READ ONLY. DO NOT edit any files
- DO NOT call FastCode MCP or Context7 MCP
- No --fix flag — strictly read-only (D-11)
- Load health functions from `bin/lib/health-checker.js` using require()
- Load scope functions from `bin/lib/scope-checker.js` using require() — `checkScopeReductions`, `formatScopeReport`
</rules>

<script type="error-handler">
const { createBasicErrorHandler } = require('../../../bin/lib/basic-error-handler');

const errorHandler = createBasicErrorHandler('pd:health', '$CURRENT_PHASE', {
  operation: 'health'
});

module.exports = { errorHandler };
</script>
