---
name: pd-discover
description: Discover MCP tools and built-in tools across all configured platforms — shows servers, tools, and platform coverage
---
<codex_skill_adapter>
## How to invoke this skill
Skill name: `$pd-discover`
When the user invokes `$pd-discover {{args}}`, execute all instructions below.
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
Discover and inventory MCP tools and built-in tools across all 12 supported platform configurations. READ ONLY. DO NOT edit files.
</objective>
<guards>
Stop and instruct the user if any of the following conditions fail:
- [ ] `.planning/` directory exists -> "The project has not been initialized yet. Run `$pd-init` first."
</guards>
<context>
User input: {{GSD_ARGS}}
- No arguments: Display discovery report as formatted boxed table
- `--json`: Display as machine-readable JSON
- `--verbose`: Include full tool detail in output
No rules or FastCode MCP needed — this is a diagnostic command only.
</context>
<process>
1. Load `PLATFORMS` and `getGlobalDir` from `bin/lib/platforms.js` using require()
2. Load `PLATFORM_CONFIG_SPECS`, `discoverAllTools`, `formatDiscoveryTable`, `formatDiscoveryJson` from `bin/lib/mcp-discovery.js` using require()
3. For each platform in PLATFORM_CONFIG_SPECS:
   a. Resolve config dir using `getGlobalDir(platformKey)` from platforms.js
   b. For platforms with configFormat='none': set content to null
   c. For platforms with configFormat='json' or 'toml':
      - Check if config dir exists using `test -d` via Bash
      - If not exists: set content to null
      - If exists: build full path = `path.join(configDir, spec.configFile)`
      - Check if config file exists via Bash (`test -f`)
      - If not exists: set content to null
      - If exists: Read the file content using Read tool
4. Also scan 5 additional platforms (cline, trae, augment, kilo, antigravity) that are not in PLATFORMS — for these, use known config dir patterns: `~/.{platformName}/` (e.g., `~/.cline/`). These all have configFormat='none' so just check if the dir exists for installed status.
5. Build `configContents` object: `{ [platformKey]: contentOrNull }`
6. Call `discoverAllTools(configContents)` to get discovery data
7. If `--json` flag present: call `formatDiscoveryJson(discovery)` and output via `log.info()`
8. Otherwise: call `formatDiscoveryTable(discovery)` and output via `log.info()`
9. If `--verbose` flag present: also output detailed tool descriptions for each MCP server found
</process>
<output>
**Create/Update:**
- No files are created or modified, read-only only
**Next step:** None — pd:discover shows tool inventory only
**Success when:**
- Discovery report shows MCP servers grouped by name with platform coverage
- Built-in tools per platform listed with platform-specific names
- Zero files were written or modified
**Common errors:**
- `.planning/` does not exist -> run `$pd-init`
- No platforms installed -> report gracefully with "No tools discovered" message
</output>
<rules>
- All output MUST be in English
- READ ONLY. DO NOT edit any files
- DO NOT call FastCode MCP or Context7 MCP
- Load functions from `bin/lib/mcp-discovery.js` using require()
</rules>
<script type="error-handler">
const { createBasicErrorHandler } = require('../../../bin/lib/basic-error-handler');
const errorHandler = createBasicErrorHandler('pd:discover', '$CURRENT_PHASE', {
  operation: 'discover'
});
module.exports = { errorHandler };
</script>
