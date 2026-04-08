---
phase: 148
name: Documentation Core
milestone: v12.3
status: discussed
mode: auto
created: 2026-04-08
---

# Phase 148 Context — Documentation Core

## Phase Goal
The cheatsheet and command reference accurately and concisely cover all current commands with no stale counts, broken links, or missing entries.

## Requirements Coverage
- **DOCS-02**: docs/cheatsheet.md covers all current commands (add stats, health, discover, sync-version)
- **DOCS-03**: docs/COMMAND_REFERENCE.md rewritten as concise per-command reference (inline, no links)

---

## Decisions

### D-01: Actual command count
**Decision**: 20 commands (verified from `commands/pd/*.md`). The REQUIREMENTS.md and ROADMAP.md say "21" — this appears to be a documentation inconsistency (audit is listed as both "in cheatsheet" and "missing"). Authoritative source = filesystem: 20 .md files in `commands/pd/`.
**Action**: Update cheatsheet header to "20 commands", not "21".
**Commands verified (20)**:
audit, complete-milestone, conventions, discover, fetch-doc, fix-bug, health, init, new-milestone, onboard, plan, research, scan, stats, status, sync-version, test, update, what-next, write-code

### D-02: cheatsheet.md approach
**Decision**: Surgical update — do NOT rewrite; make targeted changes only:
1. Line 6: `"16 Please Done (PD) commands"` → `"20 Please Done (PD) commands"`
2. Table of Contents: update Utility count (5 → 9) to reflect 4 new commands
3. Utility Commands table: add 4 missing rows (discover, health, stats, sync-version)
4. Remove stale footer: `*For detailed documentation on each command, see the \`commands/pd/\` directory...*`
**Rationale**: 200+ line file is well-structured; surgical edits are safer and faster than rewrite

### D-03: New command category placement
**Decision**: All 4 missing commands go in **Utility Commands** section:
- `pd:stats` — "Display project statistics: phases, plans, requirements, and milestones"
- `pd:health` — "Diagnose planning directory issues: missing files, validation errors"
- `pd:discover` — "Discover MCP tools and built-in tools across all configured platforms"
- `pd:sync-version` — "Sync version from package.json across README badges and doc headers"
**Rationale**: These are non-workflow utility commands matching the existing Utility category pattern; no new categories needed

### D-04: COMMAND_REFERENCE.md approach
**Decision**: Full rewrite — current file is 34 lines with broken `(commands/*.md)` links and only partial coverage. Rewrite inline with per-command blocks per DOCS-03 spec.
**Target size**: ~150–200 lines (20 commands × ~8–10 lines each)

### D-05: COMMAND_REFERENCE format
**Decision**: Section header per command with compact 3-field layout:
```markdown
### `pd:command`
**Purpose**: One sentence.
**Syntax**: `/pd:command [--flag] [arg]`
**Example**: `/pd:command --flag value`
```
**Rationale**: "Scannable at a glance" (DOCS-03 requirement); table format was considered but inline blocks are more readable for multi-line syntax; no links to `commands/` subdirectory

### D-06: COMMAND_REFERENCE grouping
**Decision**: Group by category matching cheatsheet:
- Project Commands (6): onboard, init, scan, new-milestone, complete-milestone, sync-version
- Planning Commands (4): plan, research, fetch-doc, update
- Execution Commands (2): write-code, test
- Debug Commands (3): fix-bug, audit, conventions
- Utility Commands (5): status, what-next, stats, health, discover
**Rationale**: Consistent with cheatsheet; sync-version grouped with Project (version management is project-level)

### D-07: Example accuracy
**Decision**: Use realistic illustrative examples derived from command `.md` frontmatter `argument-hint` field. Do not fabricate terminal output. Note at top: "Examples show typical usage."
**Rationale**: SC-4 says "real usage example that matches v12.2 output" — since we cannot run commands in CI, use realistic representative syntax

### D-08: Vietnamese cheatsheet (cheatsheet.vi.md)
**Decision**: Defer — update cheatsheet.vi.md in a separate translation pass. Out of scope for DOCS-02/DOCS-03.

### D-09: Footer removal
**Decision**: Remove the final 2 lines of cheatsheet.md:
```
*For detailed documentation on each command, see the `commands/pd/` directory or run `/pd:status` to check project state.*
```
**Rationale**: This link is stale (the directory has per-command .md files but they are not published docs); the COMMAND_REFERENCE.md replaces this need

### D-10: COMMAND_REFERENCE header
**Decision**: Replace current header with:
```markdown
# PD Command Reference

Quick reference for all 20 PD commands. Each entry: purpose, syntax, and one example.
```
No links to workflow overview or commands/ directory.
