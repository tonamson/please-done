<purpose>
Scan project, analyze code structure, dependencies, architecture, security checks, generate report.

Note: `~/.claude/` is for Claude Code. The installer converts to platform-appropriate paths.
</purpose>

<conditional_reading>
Read WHEN needed (analyze task description first):
- @references/security-checklist.md -> security checklist — WHEN scan finds dependency vulnerabilities
- @references/conventions.md -> commit conventions, icons — WHEN formatting scan report
</conditional_reading>

<process>

## Step 0: Check codebase map freshness (non-blocking)
- Read `.planning/codebase/META.json` → if file does not exist → skip to Step 1.
- Extract the `mapped_at_commit` field → if missing or empty → skip to Step 1.
- Run: `git rev-list <mapped_at_commit>..HEAD --count 2>/dev/null`
  - If command fails (no git, invalid SHA, shallow clone) → skip silently to Step 1.
- Parse output as integer `N`.
- If `N > 20`:
  > ⚠️ **Codebase map is stale** — generated **N commits ago** (where N is the actual count).
  > Run `/pd:scan` to refresh before continuing for accurate results.
- If `N ≤ 20` → no output, continue silently.
- **Always continue to Step 1 regardless of outcome.**

## Step 1: Determine path
- `$ARGUMENTS` has path → use it | No → current directory
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

<rules>
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
