---
name: pd-stats
description: Display comprehensive project statistics including phases, plans, requirements, milestones, timeline, and file counts
---
<codex_skill_adapter>
## How to invoke this skill
Skill name: `$pd-stats`
When the user invokes `$pd-stats {{args}}`, execute all instructions below.
## Tool mapping
- `AskUserQuestion` → `request_user_input`: When you need to ask the user, use request_user_input instead of AskUserQuestion
- `Task()` → `spawn_agent()`: When you need to spawn a sub-agent, use spawn_agent with fork_context
  - Wait for result: `wait(agent_ids)`
  - End agent: `close_agent()`
## Compatibility fallback
- If `request_user_input` is not available in the current mode, ask the user in plain text with a short question and wait for the user to respond
- Anywhere that says "MUST use `request_user_input`" means: prefer using it when the tool is available; otherwise fall back to plain text questions — never guess on behalf of the user
## Conventions
- `$ARGUMENTS` is equivalent to `{{PD_ARGS}}` — user input when invoking the skill
- All config paths have been converted to `~/.codex/`
- MCP tools (`mcp__*`) work automatically via config.toml
- Read `~/.codex/.pdconfig` (cat ~/.codex/.pdconfig) → get `SKILLS_DIR`
- References to `[SKILLS_DIR]/templates/*`, `[SKILLS_DIR]/references/*` → read from the corresponding source directory
</codex_skill_adapter>
<objective>
Display comprehensive project statistics from `.planning/` files and git history. READ ONLY. DO NOT edit files. DO NOT call FastCode MCP.
</objective>
<guards>
Stop and instruct the user if any of the following conditions fail:
- [ ] `.planning/` directory exists -> "The project has not been initialized yet. Run `$pd-init` first."
</guards>
<context>
User input: {{PD_ARGS}}
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
- `.planning/` does not exist -> run `$pd-init`
- `STATE.md` is missing or broken -> run `$pd-new-milestone` to recreate it
</output>
<rules>
- All output MUST be in English
- READ ONLY. DO NOT edit any files
- DO NOT call FastCode MCP or Context7 MCP
- DO NOT suggest next steps — that is pd:what-next's job
- Load functions from `bin/lib/stats-collector.js` using require()
</rules>
