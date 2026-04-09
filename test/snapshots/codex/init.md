---
name: pd-init
description: Initialize the workspace, verify FastCode MCP, and create compact context for later skills
---
<codex_skill_adapter>
## How to invoke this skill
Skill name: `$pd-init`
When the user invokes `$pd-init {{args}}`, execute all instructions below.
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
First skill to run. Verify FastCode MCP (REQUIRED), index the project, detect the tech stack, create `CONTEXT.md`, and copy the relevant rules.
</objective>
<guards>
Stop and instruct the user if any of the following conditions fail:
- [ ] Path parameter valid (if provided) -> "Path does not exist or is not a directory."
- [ ] FastCode MCP connected and available (soft check) → If unavailable: warn "FastCode unavailable — using Grep/Read fallback (slower)." **Do NOT stop — continue with fallback.**
</guards>
<context>
User input: {{PD_ARGS}} (project path, defaults to the current directory)
Rule templates: `.pdconfig` -> `SKILLS_DIR` -> files at `[SKILLS_DIR]/commands/pd/rules/`:
- `general.md` -- always copy
- `nestjs.md` / `nextjs.md` / `wordpress.md` / `solidity.md` / `flutter.md` -- copy when the corresponding stack is detected
</context>
<process>
## Step 1: Determine project path
- `{{PD_ARGS}}` has path → use it | No → current directory
- Record absolute path
## Step 2: Check FastCode MCP (REQUIRED)
`mcp__fastcode__list_indexed_repos`:
- **SUCCESS** → "FastCode MCP: Active", continue
- **FAILURE** → Warning: "FastCode MCP not active. Code search will use Grep/Read (slower)."
  Continue without FastCode -- basic functionality still works (Grep/Read fallback).
  Display: "Continue without FastCode? (Recommended: Yes)"
## Step 2.5: Check for existing CONTEXT.md
`.planning/CONTEXT.md` already exists → ask: "1. Keep existing 2. Reinitialize"
- Keep → check `.planning/rules/general.md`:
  - MISSING → warn: "Rules missing. Should reinitialize." Ask again.
  - EXISTS → "Keeping existing. Ready." + suggest `$pd-scan`/`$pd-what-next`. DO NOT continue.
- Reinitialize → continue to Step 3
## Step 3: Check if project has code
Glob `**/*.{ts,tsx,js,jsx,py,php,sol,dart,html}` (exclude node_modules, .venv, .planning, wp-includes, wp-admin, artifacts, cache, build — NOT including `.json`):
- **HAS code** → `isNewProject = false`, continue to Step 3a
- **NO code** → `isNewProject = true`, jump to Step 4
### Step 3a: Index project with FastCode (ONLY when isNewProject = false)
`mcp__fastcode__code_qa` (repos: absolute path): "List modules, tech stack, database type."
Pre-warm index — response discarded. Error → warning, continue to Step 3b.
### Step 3b: Map codebase (ONLY when isNewProject = false)
#### Step 3b.1: Check map staleness
Read `.planning/codebase/META.json`:
- **EXISTS**:
  - Extract `mapped_at_commit` (40-character SHA)
  - Run `node -e "const {detectStaleness} = require('./bin/lib/staleness-detector.js'); console.log(JSON.stringify(detectStaleness('COMMIT_SHA')))"`
  - Parse result to get `level` and `commitDelta`
  - If `level === 'aging'` or `level === 'stale'`:
    - request_user_input: "Codebase map is [level] ([commitDelta] commits behind). Refresh now?"
    - Options: ["Yes, refresh now", "Skip this time"]
    - **"Yes" selected**: Remove `STRUCTURE.md` check constraint (proceed to mapping)
    - **"Skip" selected**: Continue to Step 3b.2
  - If `level === 'fresh'`: "Map is current ([commitDelta] commits behind). Skipping map." Jump to Step 4.
- **MISSING**: Continue to Step 3b.2 (normal mapping flow)
**Error handling:** If staleness detection fails (not git repo, invalid SHA), log warning and continue to Step 3b.2 — DO NOT block init.
#### Step 3b.2: Check for existing map and spawn mapper
Check `.planning/codebase/STRUCTURE.md` exists:
- **EXISTS** (and user didn't choose "Yes" in 3b.1) → "Codebase already mapped. Skipping." Jump to Step 4.
- **NOT EXISTS** → Create directory and spawn mapper:
```bash
mkdir -p .planning/codebase
```
Spawn pd-codebase-mapper agent:
```
Task(prompt="
Map codebase of the project at current path.
Create output files in .planning/codebase/:
- STRUCTURE.md — directory structure
- TECH_STACK.md — tech stack
- ENTRY_POINTS.md — entry points
- DEPENDENCIES.md — dependency graph
", subagent_type="pd-codebase-mapper", model="haiku", description="Map codebase structure")
```
- **SUCCESS** → "Codebase mapped: .planning/codebase/"
- **FAILURE** → Warning: "Mapper failed. Continuing without codebase map." Continue to Step 4 — DO NOT block init.
## Step 4: Detect tech stack
### isNewProject = false:
Use Glob/Grep/Read for quick scan:
| Detection | Condition | Flag |
|-----------|-----------|------|
| NestJS | `**/nest-cli.json` → fallback `**/app.module.ts` → fallback `**/main.ts` + grep `NestFactory` | hasNestJS |
| Backend generic | `**/app.js`/`**/app.ts` + `express` in package.json | hasBackend (general.md only) |
| NextJS | `**/next.config.*` | hasNextJS |
| Frontend generic | `**/vite.config.*` or >5 `.tsx/.jsx` | hasFrontend (general.md only) |
| DB type | `**/*.module.ts` → grep `MongooseModule\|TypeOrmModule\|PrismaService` | — |
| WordPress | `**/wp-config.php` → fallback `**/wp-content/plugins/*/` or `themes/*/style.css` | hasWordPress |
| Solidity | `**/hardhat.config.*` → fallback `**/foundry.toml` → fallback `**/contracts/**/*.sol` | hasSolidity |
| Flutter | `**/pubspec.yaml` + grep `flutter` → fallback `**/lib/main.dart` | hasFlutter |
- WordPress/Solidity/Flutter: keep other flags (can combine)
- Stack with no rules file → "Detected [stack] but no rules template exists. general.md only."
Quick read: `package.json`, `.planning/CURRENT_MILESTONE.md`, `.planning/ROADMAP.md` (if exists)
### isNewProject = true:
Ask: "New project with no code. What do you want to build?" → record. All flags = false.
## Step 4.5: Discuss Language & Error Reporting Policy [NEW]
Agent uses `request_user_input` to finalize language strategy for 3 layers:
1. **UI:** Error/success messages for end users.
2. **Logs:** Developer debug notes.
3. **Internal (Exceptions):** Error codes and messages in code.
**Suggest common choices:**
- **Standard (Recommended):** UI (Vietnamese), Logs/Exceptions (English).
- **International:** All in English.
- **Local:** All in Vietnamese.
Discussion results will be written to `PROJECT.md` immediately after the file is created in later steps.
## Step 5: Create .planning/ structure
```bash
mkdir -p .planning/scan .planning/docs .planning/bugs .planning/rules .planning/docs/solidity
```
## Step 6: Copy rules to .planning/rules/
Read `.pdconfig` → `SKILLS_DIR`. (Claude Code: `cat ~/.codex/.pdconfig`)
Not found → **STOP**: "Cannot find .pdconfig. Run `node bin/install.js` again."
Delete ONLY template files: `general.md`, `nestjs.md`, `nextjs.md`, `wordpress.md`, `solidity.md`, `flutter.md`. Keep custom files.
Copy from `[SKILLS_DIR]/commands/pd/rules/` → `.planning/rules/`:
- **Always**: `general.md`
- hasNestJS → `nestjs.md`
- hasNextJS → `nextjs.md`
- hasWordPress → `wordpress.md`
- hasSolidity → `solidity.md` + copy `solidity-refs/` → `.planning/docs/solidity/`
- hasFlutter → `flutter.md`
- New project/other stack → ONLY `general.md`
## Step 7: Create CONTEXT.md (UNDER 50 lines)
```markdown
# Project Context
> Initialized: [DD_MM_YYYY HH:MM]
> Updated: —
> Backend path: [path or —]
> Frontend path: [path or —]
> FastCode MCP: Active
> New project: [Yes/No]
## Tech Stack
(ONLY detected stacks — new project records user description)
- [stack]: [framework] | Directory: [dir]
- Database: [type] (if any)
## Main Libraries
| Name | Version |
(main dependencies, exclude devDeps, max 20 lines — omit section if new project)
## Rules
`.planning/rules/`: (ONLY copied files)
## Current Milestone
(if exists from previous session)
```
## Step 8: Notification
```
╔══════════════════════════════════════╗
║     Initialization complete!         ║
╠══════════════════════════════════════╣
║ Project: [name]                      ║
║ Tech:  [stacks]                      ║
║ MCP:   ✅ Active                     ║
║ Context: .planning/CONTEXT.md        ║
║ Rules: .planning/rules/              ║
║ Docs:  .planning/docs/ (if any)      ║
╠══════════════════════════════════════╣
║ Next: $pd-scan or $pd-new-milestone  ║
╚══════════════════════════════════════╝
```
</process>
<output>
**Create/Update:**
- `.planning/CONTEXT.md` -- project context
- `.planning/rules/*.md` -- framework-specific rules
**Next step:** `$pd-scan` or `$pd-plan`
**Success when:**
- `CONTEXT.md` contains complete tech stack information
- FastCode MCP confirms it is connected
**Common errors:**
- FastCode MCP is not connected -> check that Docker is running
- The tech stack cannot be detected -> the user supplies it manually
</output>
<rules>
- All output MUST be in English
- You MUST confirm FastCode MCP is connected before taking any action
- DO NOT change files outside `.planning/`
- CONTEXT.md UNDER 50 lines — project info only
- Coding rules in separate `.planning/rules/*.md` — copy from `[SKILLS_DIR]/commands/pd/rules/` (path from `.pdconfig`)
- Only copy rules matching tech stack (hasNestJS/hasNextJS/hasWordPress/hasSolidity/hasFlutter)
- New project: skip FastCode indexing, ask for description, copy only general.md
- FastCode MCP MUST connect successfully → STOP if fails
- DO NOT read/display `.env`, `.env.*` (except `.env.example`), `credentials.*`, `*.pem`, `*.key`, `*secret*`, `wp-config.php`
- Existing CONTEXT.md → ask keep/reinitialize
</rules>
<script type="error-handler">
const { createBasicErrorHandler } = require('../../../bin/lib/basic-error-handler');
// Create error handler for init skill
const errorHandler = createBasicErrorHandler('pd:init', '$CURRENT_PHASE', {
  operation: 'init'
});
// Export for skill executor
module.exports = { errorHandler };
</script>
