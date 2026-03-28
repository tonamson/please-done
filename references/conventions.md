# General Project Conventions

> Used by: all commands and workflows
> Single source of truth for shared patterns/conventions

## Task Status Icons

| Icon | Meaning | Description |
|------|---------|-------------|
| ⬜ | Not started | Task has not been picked up |
| 🔄 | In progress | Task is being coded |
| ✅ | Completed | Task coded + built + committed successfully |
| ❌ | Blocked | Task blocked by dependency or other issue |
| 🐛 | Has bug | Task has failing tests or discovered bug |

**Update rules:**
- Update BOTH: (1) overview table (Status column), (2) task detail block (`> Status:`)
- Mark ✅ BEFORE commit. Commit fails → revert to 🔄, fix then retry
(Applies to /pd:write-code. Other workflows (fix-bug) have their own logic — e.g. fix-bug updates TASKS.md after user confirms.)
- 🐛 only when there are failing tests or open bug reports

## Version Rules

### Patch version
Format: `[major].[minor].[patch]` — e.g.: `1.0.1`

**Determining new patch:**
1. Glob `.planning/bugs/BUG_*.md`
2. Grep `Patch version:` → filter `[base-version].N` (3 numbers)
3. Find highest patch
4. None found → `[base-version].1`
5. Already exists → increment: `1.0.1` → `1.0.2`

**Bug belongs to current version:** Patch = `[version].0`. Already exists → find highest, +1.

### Version filtering

Bug belongs to milestone if `Patch version` matches:
- Exact `[version]` or starts with `[version].[digit]`
- DOES NOT match: `1.1`, `1.10`, `10.0`, `2.0`

```
Grep `Patch version: [version]` in .planning/bugs/BUG_*.md
→ filter: only match EXACTLY `[version]` or `[version].[digit]`
→ MUST use word boundary — NO substring match
→ Safe approach: read value, split by dot,
  compare [major].[minor] numerically (e.g.: "1.0.2" → major=1, minor=0 → matches "1.0")
```

## Commit prefixes

| Prefix | Skill | Description |
|--------|-------|-------------|
| `[TASK-N]` | write-code | Completed task N |
| `[TEST]` | test | Added test files |
| `[BUG]` | fix-bug | Fixed bug |
| `[TRACKING]` | write-code | Phase completed |
| `[VERSION]` | complete-milestone | Closed milestone |

## Date format

- File names: `DD_MM_YYYY_HH_MM_SS`
- Display: `DD_MM_YYYY` or `DD_MM_YYYY HH:MM`
- DO NOT use other formats (ISO, US, etc.)

## Language

- Output/reports/comments/JSDoc: English
- Variable/function/class/file names: English
- Commit messages: English
- Exception: Solidity NatSpec uses English

## Effort level

| Effort | Model | Examples |
|--------|-------|---------|
| simple | haiku | rename variable, add import, fix typo, update config |
| standard | sonnet | create new component, API endpoint, unit test suite |
| complex | opus | refactor multiple files, architectural decisions, integration |

Default: `standard` (sonnet). Task missing Effort field → treat as `standard`.

Classification:
| Signal | simple | standard | complex |
|--------|--------|----------|---------|
| Files modified/created | 1-2 | 3-4 | 5+ |
| Number of Truths | 1 | 2-3 | 4+ |
| Dependencies | 0 | 1-2 | 3+ |
| Multi-domain | no | no | yes |

Planner MAY override guidelines based on context understanding.
User override: edit `Effort:` directly in TASKS.md before running.

## Security — Forbidden files

FORBIDDEN to read/display contents: `.env`, `.env.*` (except `.env.example`), `credentials.*`, `*.pem`, `*.key`, `*secret*`, `wp-config.php`

Only write variable names, NEVER write values.
