# General Rules

## Code style (TS/JS)
- Semicolons required, 2-space indent, use single quotes (JSX attributes use double quotes) — PHP follows its own rules in `wordpress.md` (tabs) — Solidity follows its own rules in `solidity.md` — Flutter/Dart follows its own rules in `flutter.md` (file `snake_case`)
- Imports: `@/` cross-module, `./` same module
- Files: kebab-case (create-user.dto.ts, admin-api.ts) | Classes/Components: PascalCase
- Limits: target 300 lines, MUST split >500
- `import type` for type-only imports

## Language
- ENGLISH: reports, JSDoc, logger, commit messages, test descriptions
- English: variable names, functions, classes, files
- Dates: DD_MM_YYYY
- **Error reporting policy:** MUST read `.planning/PROJECT.md` to determine the language for UI, Logs, and Exceptions. DO NOT use a different language than the policy defined in Project.

## Status icons
⬜ Not started | 🔄 In progress | ✅ Completed | ❌ Blocked | 🐛 Has bug

When finding/updating status in ROADMAP.md or TASKS.md:
- Match pattern: `Status: [icon]` (may have `> ` prefix)

## Version and phase numbering conventions
- Display: plain number in path (1.0), prefix v when displaying (v1.0)
- Milestone version: ALWAYS 2 numbers (x.y). E.g.: 1.0, 1.1, 2.0
- Phase number: ALWAYS 2 numbers (x.y). E.g.: 1.1, 1.2, 2.1
- Patch version (bugs): ALWAYS 3 numbers (x.y.z). E.g.: 1.0.1, 1.0.2
- DO NOT use 3-number version for milestone, DO NOT use letters in phase

## Standard format for CURRENT_MILESTONE.md
- milestone: [milestone name]
- version: [x.y] (ALWAYS 2 numbers)
- phase: [x.y] (current phase)
- status: [Not started | In progress | Completed]

## Dependency column format in TASKS.md
- `None` = no task dependency
- `Task N` = depends on 1 task (e.g.: `Task 1`)
- `Task N, Task M` = depends on multiple tasks (e.g.: `Task 1, Task 3`)
- Optional annotation: `Task N (shared file)` — metadata only, parser ignores the parenthetical

## Minimal code writing (KISS + YAGNI)
- **Inline first, extract later** — Do not create helper/utility for logic used only once. 3 lines of repetition is still better than 1 premature abstraction
- **YAGNI** — Only code the current requirement. Do not add configurability, feature flags, extensibility "just in case"
- **Fewest new files possible** — Prefer editing existing files. Only split to a new file when exceeding line limits (see Code style section) or there is a clear architectural reason
- **Use framework built-ins** — Do not reinvent when framework already provides it (NestJS Guard/Pipe/Interceptor, Laravel Policy/Passport, WordPress nonce/capability...). Do not wrap, do not rewrite
- **Check framework docs before writing** — MUST use MCP context7 (`resolve-library-id` → `query-docs`) to check if the framework/library already has a function/class/helper for the task. Only write custom code when confirmed nothing exists
- **Check project code before writing** — MUST use MCP FastCode (`code_qa`) to ask if the project already has a function/util/service doing something similar for reuse, avoiding duplication
- **Count before writing** — 1 small feature needing >2 new files or >3 new functions → stop and simplify
- **Flat over nested** — Early return, guard clauses instead of nested logic then having to extract more functions

## Git & Commit
- Check if project has git (Bash: `git rev-parse --git-dir 2>/dev/null`). If NO git → **SKIP** all git add/commit/tag steps in every skill
- Commit message format (only when git exists): `[TASK-N]`, `[TEST]`, `[BUG]`, `[VERSION]`, `[TRACKING]`, `[AUDIT]` - in English

## Security
- FORBIDDEN to read/write/display contents of: `.env`, `.env.*` (except `.env.example`), `credentials.*`, `*.pem`, `*.key`, `*secret*`, `wp-config.php`
- Only write variable NAME, NOT value
- When code uses a new environment variable → **MUST** add the key to `.env.example` with a placeholder value (e.g.: `DATABASE_URL=postgresql://user:pass@localhost:5432/dbname`)

## Skill version check
Before starting main work, do a quick check (ONLY once at the start of each conversation, DO NOT repeat):
1. Read `.pdconfig` (Bash: `cat ~/.claude/commands/pd/.pdconfig`) → get `SKILLS_DIR` (Claude Code ONLY — other platforms skip if file does not exist)
2. Compare versions: `LOCAL=$(cat [SKILLS_DIR]/VERSION 2>/dev/null)` and `REMOTE=$(cd [SKILLS_DIR] && git fetch origin main --quiet 2>/dev/null && git show origin/main:VERSION 2>/dev/null)`
3. If `REMOTE` differs from `LOCAL` and `REMOTE` is not empty → show 1 line: `💡 Skills v[REMOTE] available. Run /pd:update to update.`
4. If fetch fails (no network) or versions match → skip, DO NOT notify
