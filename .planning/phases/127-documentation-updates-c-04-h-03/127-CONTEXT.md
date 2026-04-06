# Phase 127: Documentation Updates (C-04, H-03) - Context

**Gathered:** 2026-04-06
**Status:** Ready for planning

<domain>
## Phase Boundary

Update CHANGELOG and create 4 missing command docs for the please-done skill framework.
</domain>

<decisions>
## Implementation Decisions

### CHANGELOG Update (C-04)
- **D-01:** Unfreeze CHANGELOG.md or auto-generate from MILESTONES.md
- **D-02:** Document v3.0 through v12.0 milestones

### Missing Command Docs (H-03)
- **D-03:** Create `docs/skills/audit.md` — documentation for pd:audit skill
- **D-04:** Create `docs/skills/conventions.md` — documentation for conventions skill
- **D-05:** Create `docs/skills/onboard.md` — documentation for pd:onboard skill
- **D-06:** Create `docs/skills/status.md` — documentation for pd:status skill

### Documentation Format
- **D-07:** Follow existing docs/skills/*.md format and structure
- **D-08:** Include language switcher (English/Vietnamese) at top of each file

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Requirements
- `.planning/REQUIREMENTS.md` § Phase 3 (C-04, H-03) — documentation requirements

### Existing Docs
- `docs/skills/` — existing skill documentation (use as template)
- `CHANGELOG.md` — current CHANGELOG (frozen)
- `.planning/MILESTONES.md` — milestone data for auto-generation

### Templates
- `templates/context.md` — context template used in earlier phases

</canonical_refs>

<codebase>
## Existing Code Insights

### Reusable Assets
- Existing skill docs in `docs/skills/` for format reference
- CHANGELOG.md frozen at v2.x — needs update for v3.0-v12.0

### Established Patterns
- English-only docs with Vietnamese translations in *.vi.md files
- Standard skill doc structure: description, usage, examples

### Integration Points
- docs/skills/ directory for new skill docs
- CHANGELOG.md at project root

</codebase>

<specifics>
## Specific Ideas

No specific references — standard documentation updates.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 127-documentation-updates-c-04-h-03*
*Context gathered: 2026-04-06*
