# Phase 75: Nyquist Validation — Context

**Gathered:** 2026-04-01
**Status:** Ready for planning

<domain>
## Phase Boundary

Complete Nyquist validation for all three v7.0 phases (71, 72, 73) by:
1. Auditing each VALIDATION.md for compliance
2. Running retroactive verification commands
3. Filling structural gaps (Phase 72 per-task map)
4. Marking all sign-off checklists and setting `nyquist_compliant: true`

This phase does NOT add new features, modify workflow logic, or change test files.
</domain>

<decisions>
## Implementation Decisions

### Task Status Updates (⬜ → ✅)
- **D-01:** Run each command in the Per-Task Verification Map retroactively, verify actual output, then mark ✅ green
- **D-02:** Do NOT trust VERIFICATION.md alone — execute the grep/node commands from the table to confirm they pass
- **D-03:** If a command fails (file moved, syntax changed), investigate and document before marking

### Phase 72 Missing Per-Task Map
- **D-04:** Add a proper Per-Task Verification Map section to Phase 72's VALIDATION.md matching the format used in Phases 71 and 73
- **D-05:** Map the existing "What to Validate" rows (SYNC-01, SYNC-02, SYNC-03) into per-task rows with Task ID, Plan, Wave, Requirement, Test Type, Automated Command, File Exists, Status columns
- **D-06:** SYNC-01 maps to Phase 74 execution (state-machine.md), SYNC-02/03 map to Phase 72 execution

### Sign-Off Checklist
- **D-07:** Verify each sign-off item by inspection, not just tick:
  - Sampling continuity: check that no 3 consecutive tasks lack automated verify
  - Wave 0: confirm all Wave 0 dependencies were created before tasks ran
  - Feedback latency: confirm each phase's quick-run command runs in stated time
  - No watch-mode flags: scan VALIDATION.md for any watch flags
- **D-08:** Mark `wave_0_complete: true` for Phase 73 (smoke-standalone.test.js exists, 34 tests pass)
- **D-09:** After all sign-off items verified, set `nyquist_compliant: true` and `status: compliant` in frontmatter

### the agent's Discretion
- Exact task ID format for Phase 72 per-task rows (use `72-XX-YY` pattern matching 71/73)
- Whether to add a "Validation Sign-Off" section to Phase 72 if missing
- Order of phases to process (71 → 72 → 73 is fine)
</decisions>

<specifics>
## Specific Ideas

- Phase 71 VALIDATION.md has 4 tasks (71-01-01 → 71-02-03): grep-based, no runtime
- Phase 72 VALIDATION.md needs a per-task map derived from 3 requirements: SYNC-01, SYNC-02, SYNC-03
- Phase 73 VALIDATION.md has 7 tasks (73-01-01 → 73-01-07): node:test smoke + npm test regression
- All 3 phases are complete with passing VERIFICATION.md (71: 8/8, 72: 6/6, 73: 7/7)
- Phase 74 fixed SYNC-01 (state-machine.md) and SC-4 typo — Phase 72's SYNC-01 verification should now pass
</specifics>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

- `.planning/phases/71-core-standalone-flow/71-VALIDATION.md` — stub to update
- `.planning/phases/72-system-integration-sync/72-VALIDATION.md` — stub to update (add per-task map)
- `.planning/phases/73-verification-edge-cases/73-VALIDATION.md` — stub to update
- `.planning/v7.0-MILESTONE-AUDIT.md` — audit that identified Nyquist as tech_debt
- `.planning/REQUIREMENTS.md` — requirement IDs: TEST-01..03, GUARD-01..03, REPORT-01..02, SYNC-01..03, RECOV-01
- `.planning/ROADMAP.md` — Phase 75 success criteria
</canonical_refs>

<deferred>
## Deferred Ideas

None — scope is narrow and well-defined.
</deferred>
