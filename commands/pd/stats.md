---
name: pd:stats
description: Display comprehensive project statistics including phases, plans, requirements, milestones, timeline, and file counts
model: haiku
argument-hint: "[--json]"
allowed-tools:
  - Read
  - Glob
  - Bash
---

<objective>
Display comprehensive project statistics from `.planning/` files and git history. READ ONLY. DO NOT edit files. DO NOT call FastCode MCP.
</objective>

<guards>
Stop and instruct the user if any of the following conditions fail:

- [ ] `.planning/` directory exists -> "The project has not been initialized yet. Run `/pd:init` first."
</guards>

<context>
User input: $ARGUMENTS
- No arguments: Display stats as formatted boxed table
- `--json`: Display stats as machine-readable JSON

No rules or FastCode MCP needed - only read planning files.
</context>

<execution_context>
No external workflow needed — pd:stats executes inline using bin/lib/stats-collector.js.
</execution_context>

<process>
1. Read `.planning/STATE.md` → pass content to `parseStateProgress()` from `bin/lib/stats-collector.js`
2. Read `.planning/ROADMAP.md` → pass content to `parseRoadmapPhases()`
3. Read `.planning/REQUIREMENTS.md` → pass content to `parseRequirements()`
4. Run `git log --oneline` via Bash → pass output + milestones to `extractTimeline()`
5. Call `countProjectFiles()` with project root directory (detected from `.planning/` location — go up one level)
6. Assemble stats object: `{ state, phases, requirements, files, timeline }`
7. If `--json` flag present: call `formatStatsJson(stats)` and output via `log.info()`
8. Otherwise: call `formatStatsTable(stats)` and output via `log.info()`
</process>

<output>
**Create/Update:**
- No files are created or modified, read-only only

**Next step:** None — pd:stats shows statistics only

**Success when:**

- Statistics are displayed clearly with all 4 sections (Overview, Milestone Progress, Timeline, File Stats)
- Zero files were written or modified

**Common errors:**

- `.planning/` does not exist -> run `/pd:init`
- `STATE.md` is missing or broken -> run `/pd:new-milestone` to recreate it
</output>

<rules>
- All output MUST be in English
- READ ONLY. DO NOT edit any files
- DO NOT call FastCode MCP or Context7 MCP
- DO NOT suggest next steps — that is pd:what-next's job
- Load functions from `bin/lib/stats-collector.js` using require()
</rules>

<script type="error-handler">
const { createBasicErrorHandler } = require('../../../bin/lib/basic-error-handler');

const errorHandler = createBasicErrorHandler('pd:stats', '$CURRENT_PHASE', {
  operation: 'stats'
});

module.exports = { errorHandler };
</script>
