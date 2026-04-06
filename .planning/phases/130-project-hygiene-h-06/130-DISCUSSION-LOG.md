# Phase 130: Project Hygiene (H-06) - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-06
**Phase:** 130-project-hygiene-h-06
**Areas discussed:** Orphaned File Handling, Archive Pattern

---

## Orphaned File Handling

| Option | Description | Selected |
|--------|-------------|----------|
| Archive all listed files | Move each file to archive location | ✓ |
| Review each file first | Investigate references before archiving | |
| Skip ambiguous files | Leave files that are unclear | |

**User's choice:** Auto-captured via --auto mode
**Notes:** H-06 defines specific files to handle

---

## Archive Pattern

| Option | Description | Selected |
|--------|-------------|----------|
| `.planning/milestones/archive/` | For archived planning artifacts | ✓ |
| `docs/archive/` | For user-facing documentation | |
| Delete (not recommended) | Lose git history | |

**User's choice:** Auto-captured via --auto mode
**Notes:** Preserve history via git

---

## Claude's Discretion

- Determine whether each file is actually orphaned (unreferenced) before archiving
- Choose archive destination based on file type

## Deferred Ideas

None.
