---
phase: 130
plan: 01
name: Project Hygiene (H-06)
subsystem: project-maintenance
tags: [hygiene, cleanup, archival]
dependency_graph:
  requires: []
  provides: []
  affects: [workflows, docs]
tech_stack:
  added: []
  patterns: [git-mv-preservation]
key_files:
  created:
    - .planning/milestones/archive/fix-bug-v1.5.md
    - docs/notes/N_FIGMA_TO_HTML_NOTES.md
  modified: []
decisions:
  - "Archived fix-bug-v1.5.md to .planning/milestones/archive/ per D-01 legacy workflow archival"
  - "Moved N_FIGMA_TO_HTML_NOTES.md to docs/notes/ per D-04 loose file organization"
  - "No action on mermaid-rules.md (already wired), de_xuat_cai_tien.md (already gone), INTEGRATION_GUIDE.md (already exists and linked)"
metrics:
  duration: ~1 minute
  completed: 2026-04-06
---

# Phase 130 Plan 01: Project Hygiene (H-06) Summary

## One-liner

Archived legacy fix-bug-v1.5.md workflow and organized loose N_FIGMA_TO_HTML_NOTES.md notes file.

## Tasks Completed

| # | Task | Status | Commit |
|---|------|--------|--------|
| 1 | Archive fix-bug-v1.5.md to .planning/milestones/archive/ | ✅ Done | 73ba5c6 |
| 2 | Move N_FIGMA_TO_HTML_NOTES.md to docs/notes/ | ✅ Done | 73ba5c6 |

## Must-Haves Verification

- [x] `workflows/legacy/fix-bug-v1.5.md` archived to `.planning/milestones/archive/` (D-01)
- [x] `references/mermaid-rules.md` confirmed wired - NO ACTION needed (D-02)
- [x] `de_xuat_cai_tien.md` confirmed missing - NO ACTION needed (D-03)
- [x] `N_FIGMA_TO_HTML_NOTES.md` moved to `docs/notes/` (D-04)
- [x] `INTEGRATION_GUIDE.md` confirmed exists and referenced - NO ACTION needed (D-05)

## Files Changed

| File | Action |
|------|--------|
| `.planning/milestones/archive/fix-bug-v1.5.md` | Archived (git mv) |
| `docs/notes/N_FIGMA_TO_HTML_NOTES.md` | Moved (git mv) |
| `workflows/legacy/fix-bug-v1.5.md` | Removed (original location) |
| `N_FIGMA_TO_HTML_NOTES.md` | Removed (original location) |

## Deviations from Plan

None - plan executed exactly as written.

## Commits

- `73ba5c6` feat(130-h-06): archive orphaned files and organize loose notes

---

## Self-Check: PASSED

- [x] Commit exists: 73ba5c6
- [x] Archived file exists: .planning/milestones/archive/fix-bug-v1.5.md
- [x] Moved file exists: docs/notes/N_FIGMA_TO_HTML_NOTES.md
- [x] Original locations cleared
