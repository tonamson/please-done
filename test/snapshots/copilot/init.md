---
name: pd:init
description: Initialize the workspace, verify FastCode MCP, and create compact context for later skills
---
<objective>
First skill to run. Verify FastCode MCP (REQUIRED), index the project, detect the tech stack, create `CONTEXT.md`, and copy the relevant rules.
</objective>
<guards>
Stop and instruct the user if any of the following conditions fail:
- [ ] Path parameter valid (if provided) -> "Path does not exist or is not a directory."
- [ ] FastCode MCP connected successfully -> "Check that Docker is running and FastCode MCP is configured."
</guards>
<context>
User input: $ARGUMENTS (project path, defaults to the current directory)
Rule templates: `.pdconfig` -> `SKILLS_DIR` -> files at `[SKILLS_DIR]/commands/pd/rules/`:
- `general.md` -- always copy
- `nestjs.md` / `nextjs.md` / `wordpress.md` / `solidity.md` / `flutter.md` -- copy when the corresponding stack is detected
</context>
<process>
## Step 1: Determine project path
- `$ARGUMENTS` has path → use it | No → current directory
- Record absolute path
## Step 2: Check FastCode MCP (REQUIRED)
`fastcode/list_indexed_repos`:
- **SUCCESS** → "FastCode MCP: Active", continue
- **FAILURE** → Warning: "FastCode MCP not active. Code search will use search/read (slower)."
  Continue without FastCode -- basic functionality still works (search/read fallback).
  Display: "Continue without FastCode? (Recommended: Yes)"
## Step 2.5: Check for existing CONTEXT.md
`.planning/CONTEXT.md` already exists → ask: "1. Keep existing 2. Reinitialize"
- Keep → check `.planning/rules/general.md`:
  - MISSING → warn: "Rules missing. Should reinitialize." Ask again.
  - EXISTS → "Keeping existing. Ready." + suggest `/pd:scan`/`/pd:what-next`. DO NOT continue.
- Reinitialize → continue to Step 3
## Step 3: Check if project has code
glob `**/*.{ts,tsx,js,jsx,py,php,sol,dart,html}` (exclude node_modules, .venv, .planning, wp-includes, wp-admin, artifacts, cache, build — NOT including `.json`):
- **HAS code** → `isNewProject = false`, continue to Step 3a
- **NO code** → `isNewProject = true`, jump to Step 4
### Step 3a: Index project with FastCode (ONLY when isNewProject = false)
`fastcode/code_qa` (repos: absolute path): "List modules, tech stack, database type."
Pre-warm index — response discarded. Error → warning, continue to Step 3b.
### Step 3b: Map codebase (ONLY when isNewProject = false)
Check `.planning/codebase/STRUCTURE.md` exists:
- **EXISTS** → "Codebase already mapped. Skipping." Jump to Step 4.
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
Use glob/search/read for quick scan:
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
agent uses `AskUserQuestion` to finalize language strategy for 3 layers:
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
read `.pdconfig` → `SKILLS_DIR`. (Claude Code: `cat ~/.copilot/.pdconfig`)
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
║ Next: /pd:scan or /pd:new-milestone  ║
╚══════════════════════════════════════╝
```
</process>
<output>
**Create/Update:**
- `.planning/CONTEXT.md` -- project context
- `.planning/rules/*.md` -- framework-specific rules
**Next step:** `/pd:scan` or `/pd:plan`
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
