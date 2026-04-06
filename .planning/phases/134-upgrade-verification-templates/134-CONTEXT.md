# Phase 134: Upgrade VERIFICATION.md Templates - Context

**Gathered:** 2026-04-06
**Status:** Ready for planning

<domain>
## Phase Boundary

Migrate Phases 130-131 verification templates from simple format to full gsd-verifier format. Both phases completed successfully and have VERIFICATION.md files, but they use a simpler format that predates the gsd-verifier standard introduced in Phase 127 (documentation updates) and refined through Phases 128-132.

**Gap Closure:** Upgrades Phases 130-131 verification to match the consistent gsd-verifier format used across v12.1 milestone phases.

</domain>

<decisions>
## Implementation Decisions

### Migration Approach
- **D-01:** Use hybrid approach — preserve existing verification content, enhance structure with all gsd-verifier sections
- **D-02:** Keep Observable Truths, Required Artifacts, Behavioral Spot-Checks tables where they already exist
- **D-03:** Add missing gsd-verifier standard sections: Key Link Verification, Data-Flow Trace (where applicable), Requirements Coverage, Anti-Patterns Found, Human Verification Required, Gaps Summary
- **D-04:** Preserve existing verification evidence (commands, results) — don't re-run unless gsd-verifier format requires

### Evidence Sources
- **D-05:** Trust SUMMARY.md claims as primary evidence foundation
- **D-06:** Add gsd-verifier sections with re-executed verification commands from PLAN.md where missing
- **D-07:** Include Behavioral Spot-Checks with original command outputs where available
- **D-08:** Extract Requirements Coverage from REQUIREMENTS.md mapping

### Verification Level
- **D-09:** Phase 130 uses Level 2 verification (Observable Truths) — file moves are simple, verifiable outcomes
- **D-10:** Phase 131 uses Level 2+ with partial Level 4 — sync script has data flow (Source: AGENTS.md → sync-instructions.js → 12 runtime paths), but file creation doesn't warrant full data-flow trace analysis
- **D-11:** Include Key Link Verification for both phases to show integration points
- **D-12:** Skip Data-Flow Trace for Phase 130 (simple file operations)
- **D-13:** Include minimal Data-Flow Trace for Phase 131 (sync script flow: source → script → destination paths)

### Scope Boundary
- **D-14:** Single plan for both phases — similar work (upgrading existing verification to standard format), small phases, identical upgrade pattern
- **D-15:** Create 2 VERIFICATION.md files: 130-VERIFICATION.md (enhanced), 131-VERIFICATION.md (enhanced)
- **D-16:** Use Phase 127 and 132 VERIFICATION.md as format templates (both are gsd-verifier compliant)

### Template Standards
- **D-17:** Follow gsd-verifier frontmatter: phase, verified, status, score, gaps, deferred
- **D-18:** Include standard sections in order: Goal Achievement (with Observable Truths table), Required Artifacts, Key Link Verification, Data-Flow Trace (Level 4 only), Behavioral Spot-Checks, Requirements Coverage, Anti-Patterns Found, Human Verification Required, Gaps Summary
- **D-19:** Preserve existing PASS/FAIL status indicators where present
- **D-20:** Add Anti-Patterns Found section with explicit "None detected" when applicable

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Source Phase Files
- `.planning/phases/130-project-hygiene-h-06/130-01-PLAN.md` — Phase 130 plan with verification commands
- `.planning/phases/130-project-hygiene-h-06/130-01-SUMMARY.md` — Phase 130 execution summary
- `.planning/phases/130-project-hygiene-h-06/130-VERIFICATION.md` — Phase 130 current verification (to be upgraded)
- `.planning/phases/131-universal-runtime-support-h-07/131-01-PLAN.md` — Phase 131 plan with acceptance criteria
- `.planning/phases/131-universal-runtime-support-h-07/131-01-SUMMARY.md` — Phase 131 execution summary
- `.planning/phases/131-universal-runtime-support-h-07/131-VERIFICATION.md` — Phase 131 current verification (to be upgraded)

### Format Templates
- `.planning/phases/127-documentation-updates-c-04-h-03/127-VERIFICATION.md` — Documentation verification template (gsd-verifier format)
- `.planning/phases/132-complete-h-01-catch-block/132-VERIFICATION.md` — Code changes verification template (gsd-verifier format with behavioral spot-checks)

### Project Files
- `.planning/REQUIREMENTS.md` — Requirements traceability for H-06 and H-07
- `AGENTS.md` — Phase 131 output file (source for verification)
- `bin/sync-instructions.js` — Phase 131 sync script (source for verification)

</canonical_refs>

<code_context>
## Existing Code Insights

### Phase 130 - Project Hygiene
- **Files affected:** `workflows/legacy/fix-bug-v1.5.md` (archived to `.planning/milestones/archive/`), `N_FIGMA_TO_HTML_NOTES.md` (moved to `docs/notes/`)
- **Operation type:** File archival and reorganization
- **Current verification format:** Simple table-based verification commands with expected/actual results
- **Complexity:** Low — file operations, git history checks
- **gsd-verifier gap:** Missing Key Link Verification, Anti-Patterns Found, Human Verification Required, Gaps Summary sections

### Phase 131 - Universal Runtime Support
- **Files created:** `AGENTS.md` (project root), `bin/sync-instructions.js` (sync script)
- **Operation type:** File creation with sync script execution
- **Current verification format:** Acceptance criteria tables with sync verification
- **Complexity:** Low-medium — file creation, script validation, multi-runtime sync
- **gsd-verifier gap:** Missing frontmatter standard, Key Link Verification, Data-Flow Trace, Anti-Patterns Found, Human Verification Required, Gaps Summary sections
- **Data flow:** AGENTS.md (source) → sync-instructions.js (processor) → 12 runtime destination paths

### gsd-verifier Format Standards
All compliant verification files (127, 128, 132, 133) include:
1. YAML frontmatter with phase, verified, status, score fields
2. Goal Achievement section with Observable Truths table
3. Required Artifacts table
4. Key Link Verification (where applicable)
5. Data-Flow Trace (Level 4 only)
6. Behavioral Spot-Checks table (for executable validations)
7. Requirements Coverage table
8. Anti-Patterns Found section
9. Human Verification Required assessment
10. Gaps Summary

### Existing Patterns
- Phase 130 has Must-Haves Status table — can be converted to Observable Truths
- Phase 131 has Acceptance Criteria Verification — can be converted to Observable Truths + Required Artifacts
- Both phases have Behavioral Spot-Checks implicitly (verification commands) — format to standard table

</code_context>

<specifics>
## Specific Ideas

None — standard verification template migration following established patterns.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 134-upgrade-verification-templates*
*Context gathered: 2026-04-06*