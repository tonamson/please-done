---
name: pd-health
description: Diagnose planning directory issues — missing files, STATE.md validation, orphaned directories
---
<codex_skill_adapter>
## How to invoke this skill
Skill name: `$pd-health`
When the user invokes `$pd-health {{args}}`, execute all instructions below.
## Tool mapping
- `AskUserQuestion` → `request_user_input`: When you need to ask the user, use request_user_input instead of AskUserQuestion
- `Task()` → `spawn_agent()`: When you need to spawn a sub-agent, use spawn_agent with fork_context
  - Wait for result: `wait(agent_ids)`
  - End agent: `close_agent()`
## Compatibility fallback
- If `request_user_input` is not available in the current mode, ask the user in plain text with a short question and wait for the user to respond
- Anywhere that says "MUST use `request_user_input`" means: prefer using it when the tool is available; otherwise fall back to plain text questions — never guess on behalf of the user
## Conventions
- `$ARGUMENTS` is equivalent to `{{GSD_ARGS}}` — user input when invoking the skill
- All config paths have been converted to `~/.codex/`
- MCP tools (`mcp__*`) work automatically via config.toml
- Read `~/.codex/.pdconfig` (cat ~/.codex/.pdconfig) → get `SKILLS_DIR`
- References to `[SKILLS_DIR]/templates/*`, `[SKILLS_DIR]/references/*` → read from the corresponding source directory
</codex_skill_adapter>
<objective>
Diagnose planning directory issues and report with severity-classified, actionable output. READ ONLY. DO NOT edit files.
</objective>
<guards>
Stop and instruct the user if any of the following conditions fail:
- [ ] `.planning/` directory exists -> "The project has not been initialized yet. Run `$pd-init` first."
</guards>
<context>
User input: {{GSD_ARGS}}
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
   - Compute `planReqCount` = total count of requirements across all plans (sum of `plan.requirements.length` per parsed pair)
   - Compute `summaryReqCount` = total count of mentioned req IDs across all summaries (sum of `summary.mentionedReqs.length` per parsed pair)
   - Keep `scopeIssues` **separate** from the health issues list — do NOT merge them
8. **Schema drift check** (load `detectSchemaDrift` and `formatDriftReport` from `bin/lib/drift-detector.js`):
   - Call `detectSchemaDrift(stateContent)` → `driftIssues`
   - Keep `driftIssues` **separate** from both `issues` and `scopeIssues` — do NOT merge
9. If `--json` flag present: output `JSON.stringify({ healthIssues: issues, scopeIssues, driftIssues }, null, 2)` via `log.info()`
10. Otherwise:
   - Call `formatHealthReport(issues)` and output via `log.info()`
   - Call `formatScopeReport(scopeIssues, { planReqCount, summaryReqCount })` and output via `log.info()`
   - Call `formatDriftReport(driftIssues)` and output via `log.info()`
</process>
<output>
**Create/Update:**
- No files are created or modified, read-only only
**Next step:** None — pd:health diagnoses issues only
**Success when:**
- Health report is displayed with all 5 check categories (missing files, state schema, orphaned dirs, scope reductions, schema drift)
- Zero files were written or modified
**Common errors:**
- `.planning/` does not exist -> run `$pd-init`
- `STATE.md` is missing or broken -> run `$pd-new-milestone` to recreate it
</output>
<rules>
- All output MUST be in English
- READ ONLY. DO NOT edit any files
- DO NOT call FastCode MCP or Context7 MCP
- No --fix flag — strictly read-only (D-11)
- Load health functions from `bin/lib/health-checker.js` using require()
- Load scope functions from `bin/lib/scope-checker.js` using require() — `checkScopeReductions`, `formatScopeReport`
- Load drift functions from `bin/lib/drift-detector.js` using require() — `detectSchemaDrift`, `formatDriftReport`
</rules>
<script type="error-handler">
const { createBasicErrorHandler } = require('../../../bin/lib/basic-error-handler');
const errorHandler = createBasicErrorHandler('pd:health', '$CURRENT_PHASE', {
  operation: 'health'
});
module.exports = { errorHandler };
</script>
