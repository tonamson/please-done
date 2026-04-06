# Phase 129: Installer Refactor (H-02) - Context

**Gathered:** 2026-04-06
**Status:** Ready for planning (NOTE: Work may be complete - see below)

<domain>
## Phase Boundary

Refactor `process.exit(1)` in claude.js installer to use `throw new Error()` instead, letting `bin/install.js` handle exit.

**H-02 Requirements:**
- Replace `process.exit(1)` with `throw new Error()`
- Let `bin/install.js` handle exit

</domain>

<decisions>
## Implementation Decisions

### Error Handling Pattern
- **D-01:** Replace `log.error(msg); process.exit(1)` with `throw new Error(msg)`
- **D-02:** Remove duplicate `log.error()` calls since `install.js` main().catch() handles display
- **D-03:** Centralized exit handling in `bin/install.js` — no wiring changes needed

### Important Note
- **D-04:** This work was ALREADY COMPLETED in Phase 86 (ERR-03). Current claude.js has:
  - 0 `process.exit(1)` calls
  - 6 `throw new Error()` calls
  - 0 `log.error()` calls
  - Propagation chain verified: claude.js → install.js main().catch()

### Verification Required
- **D-05:** Planner should verify the current state and either:
  1. Confirm work is complete and close this phase
  2. Identify any remaining gaps if H-02 truly needs work

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Prior Work
- `.planning/milestones/v11.2-phases/86-error-handling-hardening/86-VERIFICATION.md` — Prior ERR-03 verification showing claude.js refactor complete
- `.planning/milestones/v11.2-phases/86-error-handling-hardening/86-CONTEXT.md` — Original H-02 context

### Code Files
- `bin/lib/installers/claude.js` — The installer file (currently has 0 process.exit calls)
- `bin/install.js` — Main installer entry point with main().catch() exit handling

</canonical_refs>

<codebase>
## Existing Code Insights

### Current State of claude.js
- Uses `throw new Error()` for all error conditions (6 sites)
- No `process.exit(1)` calls
- No `log.error()` calls at throw sites
- Errors propagate to install.js main().catch()

### Propagation Chain
- claude.js `install()` throws → install.js line 213 catch → re-throw line 218 → main().catch line 394 → log.error + process.exit(1)

</codebase>

<specifics>
## Specific Ideas

Duplicate requirement flagged. H-02 was implemented as ERR-03 in Phase 86.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 129-installer-refactor-h-02*
*Context gathered: 2026-04-06*
