---
name: pd-sync-version
description: Sync version from package.json across README badges, version text, and doc file headers
---
<codex_skill_adapter>
## How to invoke this skill
Skill name: `$pd-sync-version`
When the user invokes `$pd-sync-version {{args}}`, execute all instructions below.
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
Sync version from package.json to all project files. Default mode updates files. --check mode validates without writing.
</objective>
<guards>
Stop and instruct the user if any of the following conditions fail:
- [ ] `package.json` exists -> "No package.json found. Run from project root."
- [ ] `.planning/` directory exists -> "The project has not been initialized yet. Run `$pd-init` first."
</guards>
<context>
User input: {{PD_ARGS}}
- No arguments: sync mode — update all files to match package.json version
- `--check`: validation-only — report mismatches without modifying files
No rules or FastCode MCP needed.
</context>
<execution_context>
No external workflow needed — pd:sync-version executes inline using bin/lib/version-sync.js.
</execution_context>
<process>
1. Read `package.json` → pass content to `extractPackageVersion()` from `bin/lib/version-sync.js`. If null → STOP: "Could not read version from package.json."
2. Read `README.md` → extract badge version via `extractBadgeVersion()` and text version via `extractTextVersion()`. Store results.
3. Read `README.vi.md` → extract badge version via `extractBadgeVersion()` and doc version via `extractDocVersion()`. Store results.
4. Glob `docs/skills/*.md` and `docs/workflows/*.md` → for each file: read content, extract version via `extractDocVersion()`. Store results. IMPORTANT: exclude any path containing `.planning/` (D-05).
5. Glob `CLAUDE.vi.md` and `docs/*.vi.md` and `docs/*.md` files at root → extract doc versions. Exclude `.planning/` paths.
6. Call `compareVersions(packageVersion, allResults)` → get structured results array.
7. If `--check` flag present:
   - Call `formatVersionCheck(results, packageVersion)` → output via `log.info()`
   - Report total files checked, matches, and mismatches
8. If sync mode (default, no --check):
   - Call `formatVersionCheck(results, packageVersion)` → output via `log.info()` first (show what will change)
   - For each mismatched result:
     - README.md badge mismatch → use `replaceBadgeVersion(readmeContent, packageVersion)`, write via Edit tool
     - README.md text mismatch → use `replaceTextVersion(readmeContent, packageVersion)`, write via Edit tool
     - README.vi.md badge mismatch → use `replaceBadgeVersion(content, packageVersion)`, write via Edit tool
     - Any doc file mismatch → use `replaceDocVersion(content, packageVersion)`, write via Edit tool
   - Output summary: "Updated X files: file1 (old → new), file2 (old → new)"
   - Wrap sync in try/catch — if any file fails, log warning via `log.warn()` and continue (D-10 non-blocking)
</process>
<output>
**Create/Update:**
- --check: No files modified, only report displayed
- Sync mode: Updates all files with mismatched versions
**Next step:** None — pd:sync-version updates version references only
**Success when:**
- --check: Version status displayed for all target files
- Sync mode: All files updated to match package.json version
**Common errors:**
- `package.json` does not exist -> run from project root
- `.planning/` does not exist -> run `$pd-init`
</output>
<rules>
- All output MUST be in English
- DO NOT sync files in `.planning/` directory (D-05)
- DO NOT call FastCode MCP or Context7 MCP
- Sync is non-blocking — failures produce warnings, do not halt (D-10)
- Load functions from `bin/lib/version-sync.js` using require()
</rules>
