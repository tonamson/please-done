# Phase 130: Project Hygiene (H-06) - Context

**Gathered:** 2026-04-06
**Status:** Ready for planning

<domain>
## Phase Boundary

**Goal:** Cleanup orphaned files — archive legacy files, wire or remove dangling references, and organize loose files.

</domain>

<decisions>
## Implementation Decisions

### Orphaned File Handling
- **D-01:** Archive `workflows/legacy/fix-bug-v1.5.md` to `.planning/milestones/archive/`
- **D-02:** Wire or remove `references/mermaid-rules.md` — if referenced, migrate content; if not, archive
- **D-03:** Archive `de_xuat_cai_tien.md` to `.planning/milestones/archive/`
- **D-04:** Move `N_FIGMA_TO_HTML_NOTES.md` to `docs/notes/`
- **D-05:** Create or remove `INTEGRATION_GUIDE.md` reference — if referenced in any doc, update ref; if not, remove

### Archive Pattern
- Use `.planning/milestones/archive/` for archived planning artifacts
- Preserve file history via git (do not delete, only move)

### Claude's Discretion
- Determine whether each file is actually orphaned (unreferenced) before archiving
- Choose archive destination: `.planning/milestones/archive/` vs `docs/archive/`

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

No external specs — requirements fully captured in decisions above.

### Existing Context
- `.planning/REQUIREMENTS.md` — H-06 requirement definition
- `.planning/ROADMAP.md` — Phase 130 scope

</canonical_refs>

<codebase_context>
## Existing Code Insights

### Reusable Assets
- None needed for cleanup task

### Established Patterns
- Archive pattern: files moved to `.planning/milestones/archive/` with git history preserved

### Integration Points
- References may exist in: `CLAUDE.md`, `docs/`, `.planning/` artifact files

</codebase_context>

<specifics>
## Specific Ideas

**Files to investigate:**
1. `workflows/legacy/fix-bug-v1.5.md` — legacy workflow, appears unused
2. `references/mermaid-rules.md` — check if any docs reference this
3. `de_xuat_cai_tien.md` — Vietnamese improvement proposal, archived
4. `N_FIGMA_TO_HTML_NOTES.md` — loose notes file
5. `INTEGRATION_GUIDE.md` — check if exists and if referenced

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

_Phase: 130-project-hygiene-h-06_
_Context gathered: 2026-04-06_
