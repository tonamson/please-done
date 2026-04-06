# Phase 135: Fix Traceability Table - Context

**Gathered:** 2026-04-06
**Status:** Ready for planning

<domain>
## Phase Boundary

Fix traceability misalignments in REQUIREMENTS.md — correct requirement-to-phase mappings and coverage section to match ROADMAP.md and actual phase deliveries.

**Gap Closure:** Fixes H-02→86, H-03→127, H-06→130, H-07→131 phase mapping errors and updates coverage range from Phases 125-132 to Phases 125-135.

</domain>

<decisions>
## Implementation Decisions

### Coverage Section Fix
- **D-01:** Update coverage section to show `Phases: 125-132 (8 phases)` → `Phases: 125-135 (9 phases)` — matching ROADMAP.md phase range
- **D-02:** Update unmapped count to show 0 (all requirements correctly mapped in traceability table)
- **D-03:** Remove duplicate coverage section (lines 115-118 in REQUIREMENTS.md) — single canonical source

### Traceability Table
- **D-04:** Keep the requirement→phase mapping table (lines 99-108) as-is — mappings are already correct:
  - C-01 → Phase 125 ✓
  - C-02 → Phase 126 ✓
  - C-04 → Phase 127 ✓
  - H-01 → Phase 132 ✓
  - H-02 → Phase 86 ✓
  - H-03 → Phase 127 ✓
  - H-06 → Phase 130 ✓
  - H-07 → Phase 131 ✓

### Verification Phases
- **D-05:** Phases 133-135 are gap-closure phases (VERIFICATION.md additions and template upgrades)
- **D-06:** No new requirements introduced in 133-135 — these phases fix documentation quality, not add features

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Requirements & Scope
- `.planning/REQUIREMENTS.md` — Current v12.1 requirements with traceability table (lines 99-123)
- `.planning/ROADMAP.md` — Phase 135 scope showing 9 phases (125-135) for v12.1
- `.planning/PROJECT.md` — v12.1 milestone overview with all requirement completions

### Prior Phases
- `.planning/phases/126-test-infrastructure-c-02/126-CONTEXT.md` — Documentation style context
- `.planning/phases/127-documentation-updates-c-04-h-03/127-CONTEXT.md` — CHANGELOG and docs context
- `.planning/phases/133-add-missing-verification/133-CONTEXT.md` — VERIFICATION.md gap closure
- `.planning/phases/134-upgrade-verification-templates/134-CONTEXT.md` — Template upgrade context

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- REQUIREMENTS.md structure: metadata header, requirement sections, traceability table, coverage summary
- Standard coverage format: `**Coverage:**` followed by bullet points showing phase range and unmapped count

### Established Patterns
- Traceability table format: `| Requirement | Phase | Status |` with requirement IDs in order
- Coverage summary: lists total requirements, phase range, unmapped count
- Planning documents use markdown with consistent heading hierarchy

### Integration Points
- `.planning/REQUIREMENTS.md` lines 110-113 — first coverage section (needs update)
- `.planning/REQUIREMENTS.md` lines 115-118 — duplicate coverage section (remove)
- Traceability table lines 99-108 already correct

</code_context>

<specifics>
## Specific Ideas

**The misalignment:**
1. ROADMAP.md shows Phases 125-135 (9 phases) for v12.1
2. REQUIREMENTS.md coverage section shows Phases: 125-132 (8 phases) — missing 133-135
3. REQUIREMENTS.md has duplicate coverage section at end of file
4. Traceability table (lines 99-108) is already correct — no mapping fixes needed

**Correct coverage:**
- v12.1 requirements: 8 total (C-01, C-02, C-04, H-01, H-02, H-03, H-06, H-07)
- Phases: 125-135 (9 phases: 125, 126, 127, 128, 129, 130, 131, 132, 133, 134, 135)
- Unmapped: 0

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 135-fix-traceability-table*
*Context gathered: 2026-04-06*