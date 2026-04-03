---
name: pd-scan
description: Scan the entire project, analyze structure, libraries, security, and generate a report
---
<codex_skill_adapter>
## How to invoke this skill
Skill name: `$pd-scan`
When the user invokes `$pd-scan {{args}}`, execute all instructions below.
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
Scan the project: analyze code structure, dependencies, architecture, and security to produce a report.
</objective>
<guards>
Stop and instruct the user if any of the following conditions fail:
- [ ] `.planning/CONTEXT.md` exists -> "Run `$pd-init` first."
- [ ] Path parameter valid (if provided) -> "Path does not exist or is not a directory."
- [ ] FastCode MCP connected and available (soft check) → If unavailable: warn "FastCode unavailable — using Grep/Read fallback (slower)." **Do NOT stop — continue with fallback.**
</guards>
<context>
User input: {{GSD_ARGS}}
Read `.planning/CONTEXT.md` (from $pd-init). No rules are needed here - only scanning and reporting.
</context>
<process>
## Step 0: Check codebase map freshness (non-blocking)
- Read `.planning/codebase/META.json` → if file does not exist → skip to Step 1.
- Extract the `mapped_at_commit` field → if missing or empty → skip to Step 1.
- Run: `git rev-list <mapped_at_commit>..HEAD --count 2>/dev/null`
  - If command fails (no git, invalid SHA, shallow clone) → skip silently to Step 1.
- Parse output as integer `N`.
- If `N > 20`:
  > ⚠️ **Codebase map is stale** — generated **N commits ago** (where N is the actual count).
  > Run `$pd-scan` to refresh before continuing for accurate results.
- If `N ≤ 20` → no output, continue silently.
- **Always continue to Step 1 regardless of outcome.**
## Step 1: Determine path
- `{{GSD_ARGS}}` has path → use it | No → current directory
- Create `.planning/scan/` if not exists
## Step 2: Check if project has code
Glob `**/*.{ts,tsx,js,jsx,py,php,sol,dart,html}` (exclude node_modules, .venv, .planning, wp-includes, wp-admin, artifacts, cache, build — NOT including .json/.css):
(.json excluded from code detection because config files do not indicate active source code. .css excluded because styling does not indicate code logic.)
- **NO source files** → jump to **Step 5** create minimal scan report: "New project, no code yet. Expected tech stack: [from CONTEXT.md]". DO NOT run Steps 3, 4, 6.
- **HAS code** → continue
## Step 2a: Scan structure with built-in tools
- **Glob** find files: `**/*.ts`, `**/*.tsx`, `**/*.json`, `**/*.prisma`, `**/*.sol`, `**/Dockerfile`
- **Read** config: `package.json`, `tsconfig.json`, `nest-cli.json`, `next.config.*`, `prisma/schema.prisma`
- **Grep** patterns:
| Stack | Detect condition | Grep patterns |
|-------|-----------------|---------------|
| NestJS | — | `@Module`, `@Controller`, `@Injectable`, `@Entity`, `@Guard`, `@Get/@Post/@Put/@Patch/@Delete` (*.ts) |
| NextJS | `next.config.*` exists | Pages `**/app/**/page.tsx`, Components `**/components/**/*.tsx`, `'use client'`, Stores `**/stores/use*.{ts,tsx}`, Hooks `**/hooks/use*.{ts,tsx}`, API `**/lib/api.ts`, Types `**/types/*.ts` |
| WordPress | `**/wp-config.php` / `**/wp-content/plugins/*/` / `**/wp-content/themes/*/style.css` | Plugins, Themes, `dbDelta\|\$wpdb->prefix`, `register_rest_route`, `add_action\|add_filter` (*.php) |
| Solidity | `**/hardhat.config.*` / `**/foundry.toml` / `**/contracts/**/*.sol` | Contracts, `import.*@openzeppelin`, `interface\s+`, `event `, `modifier\s+\w+`, `nonReentrant\|whenNotPaused\|onlyOwner` (*.sol) |
| Flutter | `**/pubspec.yaml` + `flutter` dependency | Screens `**/modules/**/*_view.dart`, `extends GetxController`, `GetPage\(`, `fromJson\|toJson`, `pubspec.yaml` packages |
## Step 3: Supplement with FastCode MCP (ONLY when code exists)
Validate CONTEXT.md path matches `pwd`. Different → warn user.
`mcp__fastcode__code_qa` (repos: path from CONTEXT.md):
- "Analyze project structure, list modules, services, controllers, routes, models, utilities."
FastCode MCP error → write warning in report, continue with Step 2a. DO NOT STOP.
## Step 4: Check dependency security (ONLY when package.json exists)
Detect: `yarn.lock` → yarn | `pnpm-lock.yaml` → pnpm | default → npm.
```bash
# npm:  cd [dir] && npm audit --omit=dev 2>&1 | tail -30
# yarn: cd [dir] && yarn audit --groups production 2>&1 | tail -30
# pnpm: cd [dir] && pnpm audit --prod 2>&1 | tail -30
```
Audit fail (not vulnerabilities) → write "Audit command failed". List vulnerabilities by severity + backend/frontend.
## Step 5: Generate report
Write `.planning/scan/SCAN_REPORT.md`:
```markdown
# Project Scan Report
> Scan date: [DD_MM_YYYY HH:MM] | Project: [name] | Path: [path]
## Overview
## Directory Structure
## Libraries (Dependencies / DevDependencies)
## Security Warnings
## Backend Analysis (NestJS: Modules | Controllers & Routes | Services | Entities | Guards & Middleware)
## Frontend Analysis (NextJS: Pages & Routing | Components | State Management | API Layer | UI Framework | SEO)
## WordPress Analysis (Plugins | Themes | Custom Tables | REST API | Hooks)
## Solidity Analysis (Contracts | OZ Imports | Security Modifiers | Events)
## Flutter Analysis (Screens & Navigation | State Management | Packages)
## Database
## Authentication & Authorization
## Completion Status
## Issues & Recommendations
```
**ONLY create sections with data.** Omit empty sections.
## Step 6: Update CONTEXT.md + Rules
**ONLY when code exists. New project → skip.**
1. **Re-detect tech stack** (same pattern as init.md): NestJS `nest-cli.json` → `app.module.ts` → `main.ts`+`NestFactory` | NextJS `next.config.*` | WordPress `wp-config.php`/`wp-content/` | Solidity `hardhat.config.*`/`foundry.toml`/`contracts/**/*.sol` | Flutter `pubspec.yaml`+`flutter`
2. **Update CONTEXT.md** (keep original format, UNDER 50 lines):
   - `New project: No` (if has source). Update `> Updated:`, Tech Stack, Main libraries (max 20 lines, exclude devDeps), Rules files
3. **Re-copy rules if tech stack changed**:
   Compare new stack vs old → DIFFERENT → read `.pdconfig` → `SKILLS_DIR` → delete template files (`general.md`, `nestjs.md`, `nextjs.md`, `wordpress.md`, `solidity.md`, `flutter.md`) keep custom → re-copy as appropriate. hasSolidity changed → copy/delete `solidity-refs/` ↔ `.planning/docs/solidity/`. No `.pdconfig` → skip, warning.
   Stack SAME → do not re-copy.
## Step 7: Notification
Summarize results. If CONTEXT.md/rules updated → notify clearly.
</process>
<output>
**Create/Update:**
- Project analysis report on screen
- Update `.planning/CONTEXT.md`
**Next step:** `$pd-plan` or `$pd-new-milestone`
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
- Follow `.planning/rules/general.md` (language, dates, security)
- Do not modify code, only scan and report
- New project → minimal scan report, DO NOT call FastCode, DO NOT npm audit
- ONLY sections with data, omit empty
- "Completion Status" REQUIRED
- MUST list libraries + run audit IF package.json exists
- DO NOT read/display `.env`, `.env.*` (except `.env.example`), `credentials.*`, `*.pem`, `*.key`, `*secret*`, `wp-config.php` — only note filename
- Frontend ONLY when framework detected (NextJS `next.config.*`, Vite `vite.config.*`, or >5 `.tsx/.jsx`). Non-NextJS: only list files
- WordPress ONLY when `wp-config.php`/`wp-content/` detected
- Solidity ONLY when `hardhat.config.*`/`foundry.toml`/`contracts/**/*.sol` detected
- Flutter ONLY when `pubspec.yaml` + `flutter` detected
- Backend ONLY when framework detected (NestJS `nest-cli.json`/`app.module.ts`, Express `app.js`/`app.ts`+`express`). Non-NestJS: only list files
- FastCode error → warning, continue with built-in tools
- MUST update CONTEXT.md after scan
- Tech stack changed → MUST re-copy rules
</rules>
