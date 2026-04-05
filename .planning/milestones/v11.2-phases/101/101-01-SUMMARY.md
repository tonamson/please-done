---
phase: 101
plan: 01
name: DOC-02 — Command Cheat Sheet
milestone: v11.1
requirement: DOC-02
completed: "2026-04-04"
duration: "15 minutes"
tasks: 7
files_created: 1
lines_of_code: 201
---

# Phase 101 Plan 01: DOC-02 — Command Cheat Sheet Summary

## Overview

Created a comprehensive command cheat sheet for all 16 Please Done skills, organized by category with command | usage | example format.

## Deliverables

### Primary Output

- **File**: `docs/cheatsheet.md`
- **Lines**: 201 lines of markdown documentation
- **Format**: Printable markdown with clean tables

### Content Structure

| Section | Commands | Description |
|---------|----------|-------------|
| Project | 5 | onboard, init, scan, new-milestone, complete-milestone |
| Planning | 1 | plan |
| Execution | 2 | write-code, test |
| Debug | 3 | fix-bug, audit, research |
| Utility | 5 | status, conventions, fetch-doc, update, what-next |
| **Total** | **16** | Complete command reference |

## Command Documentation Summary

### Project Commands (5)

| Command | Key Flags | Purpose |
|---------|-----------|---------|
| `/pd:onboard` | `[path]` | Initialize project with full analysis |
| `/pd:init` | `[--force]` | Create .planning/ directory |
| `/pd:scan` | `[--deep]` | Analyze codebase structure |
| `/pd:new-milestone` | `[version]` | Define milestone requirements |
| `/pd:complete-milestone` | — | Finalize and archive milestone |

### Planning Commands (1)

| Command | Key Flags | Purpose |
|---------|-----------|---------|
| `/pd:plan` | `[--auto \| --discuss] [phase]` | Technical planning + tasks |

### Execution Commands (2)

| Command | Key Flags | Purpose |
|---------|-----------|---------|
| `/pd:write-code` | `[--wave N] [--skip-verify]` | Execute planned tasks |
| `/pd:test` | `[--coverage] [--watch]` | Run test suite |

### Debug Commands (3)

| Command | Key Flags | Purpose |
|---------|-----------|---------|
| `/pd:fix-bug` | `[description]` | Scientific bug investigation |
| `/pd:audit` | `[--security] [--performance]` | Code quality audit |
| `/pd:research` | `[topic]` | Deep research on technologies |

### Utility Commands (5)

| Command | Key Flags | Purpose |
|---------|-----------|---------|
| `/pd:status` | `[--auto-refresh]` | Project status dashboard |
| `/pd:conventions` | `[language]` | Show coding conventions |
| `/pd:fetch-doc` | `[library]` | Fetch library documentation |
| `/pd:update` | `[--check]` | Update PD tooling |
| `/pd:what-next` | — | Suggest next actions |

## Popular Flags Documented

The cheat sheet includes a reference table of 16 popular flags:

| Flag | Commands | Description |
|------|----------|-------------|
| `--auto` | plan, write-code | Auto-execute without prompts |
| `--discuss` | plan | Interactive discussion mode |
| `--wave N` | write-code | Execute specific wave |
| `--skip-research` | plan, write-code | Skip research phase |
| `--skip-verify` | write-code | Skip verification steps |
| `--parallel` | write-code | Parallel execution |
| `--resume` | write-code | Resume from interruption |
| `--auto-refresh` | status | Enable auto-refresh |
| `--refresh-threshold` | status | Set custom threshold |
| `--coverage` | test | Generate coverage report |
| `--watch` | test | Watch mode testing |
| `--security` | audit | Security audit |
| `--performance` | audit | Performance audit |
| `--force` | init | Force without prompts |
| `--deep` | scan | Deep analysis |
| `--check` | update | Check for updates |

## Additional Sections

1. **Legend** — Explains flag notation: `[--flag]` = optional, `--flag value` = required
2. **Command Count Summary** — Table showing commands per category
3. **Value Types Reference** — Common argument patterns explained
4. **Usage Examples** — Practical examples for each command

## Verification Results

| Check | Expected | Actual | Status |
|-------|----------|--------|--------|
| File exists | docs/cheatsheet.md | ✓ | ✅ |
| Total commands | 16 | 16 | ✅ |
| Categories | 5 | 5 | ✅ |
| Table format | command \| usage \| example | ✓ | ✅ |
| Popular flags | Included | 16 flags | ✅ |
| Legend | Present | ✓ | ✅ |
| Line count | >100 | 201 | ✅ |

## Files Created

```
docs/cheatsheet.md     201 lines    Command reference with tables
```

## Deviations from Plan

**None** — Plan executed exactly as written.

All 7 tasks completed in a single commit since the work was cohesive and all files were created at once.

## Self-Check

- [x] File created: docs/cheatsheet.md
- [x] All 16 commands documented
- [x] 5 categories present (Project, Planning, Execution, Debug, Utility)
- [x] Format: command | usage | example tables
- [x] Popular flags included
- [x] Legend explaining flag notation
- [x] Printable format (clean markdown, no external dependencies)
- [x] Committed with proper message format

## Commits

| Hash | Message | Files |
|------|---------|-------|
| 7b51b56 | docs(101): add Command Cheat Sheet | docs/cheatsheet.md |

## Requirement Link

- **DOC-02**: Command Cheat Sheet — ✅ COMPLETE
  - File exists at docs/cheatsheet.md
  - 16 commands documented across 5 categories
  - Printable format with markdown tables

## Next Steps

The cheat sheet is ready for use. Consider:
1. Linking from README.md for discoverability
2. Printing for team reference
3. Updating when new commands are added
