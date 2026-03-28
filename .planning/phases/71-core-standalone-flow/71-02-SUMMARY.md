---
phase: 71-core-standalone-flow
plan: 02
subsystem: testing
tags: [standalone, workflow, auto-detect, tech-stack, recovery, report]

requires:
  - phase: 71-01-PLAN
    provides: Conditional guard logic and argument-hint in skill file
provides:
  - Step 0 mode router (standalone vs standard)
  - Step S0.5 recovery check for interrupted sessions
  - Steps S1-S8 complete standalone test flow
  - Auto-detection of NestJS/WordPress/Solidity/Flutter/Frontend stacks
  - Standalone test report format (STANDALONE_TEST_REPORT_*.md)
  - Bug report with Patch version: standalone
affects: [72-standalone-ux-polish, 73-standalone-docs]

tech-stack:
  added: []
  patterns: [step-0-router, standalone-flow-numbering, insertion-only-workflow-extension]

key-files:
  created: []
  modified: [workflows/test.md]

key-decisions:
  - "D-01: Insertion-only strategy — standard flow Steps 1-10 completely unmodified"
  - "D-05: Step 0 routes by --standalone flag presence"
  - "D-06: Auto-detect priority: NestJS > WordPress > Solidity > Flutter > Frontend > error"
  - "D-11: Recovery check detects existing reports and uncommitted test files"
  - "D-13: Patch version: standalone is literal string, not numbered version"

patterns-established:
  - "Step 0 router pattern: dual-mode workflow via routing step before Step 1"
  - "S-numbered steps: standalone flow uses Step S1-S8 to avoid collision with standard Steps 1-10"
  - "Insertion-only extension: new features added without modifying existing workflow content"

requirements-completed: [TEST-01, TEST-02, TEST-03, GUARD-01, REPORT-01, REPORT-02, RECOV-01]

duration: 8min
completed: 2025-07-15
---

# Phase 71 Plan 02: Standalone Test Workflow Flow Summary

**Step 0 router + S0.5 recovery + S1-S8 standalone flow with auto-detection for 5 tech stacks, report generation, and bug tracking**

## Performance

- **Duration:** ~8 min
- **Tasks:** 3 (2 content insertions + 1 verification)
- **Files modified:** 1

## Accomplishments
- Step 0 routing: `--standalone` → S0.5 recovery → S1; non-standalone → Step 1
- Recovery check: detects existing reports and uncommitted test files, offers resume/rewrite
- S1: Parse standalone arguments (path, --all, or prompt)
- S2: Auto-detect tech stack from file markers (NestJS → WordPress → Solidity → Flutter → Frontend)
- S3: Check test infrastructure per detected stack
- S4: Read target code (FastCode with Grep fallback, Context7 optional)
- S5: Write test files per stack conventions
- S6: Run tests + display results table
- S7: Create `STANDALONE_TEST_REPORT_[YYYYMMDD_HHMMSS].md` in `.planning/reports/`
- S8: Bug report with `Patch version: standalone` + git commit

## Task Commits

1. **Task 1: Add Step 0 + S0.5 before Step 1** - `8beff11` (feat)
2. **Task 2: Add Steps S1-S8 after Step 10** - `8beff11` (feat)
3. **Task 3: Verify standard flow unchanged** - verification only (0 deleted lines, all Steps 1-10 present)

## Files Created/Modified
- `workflows/test.md` - Step 0 router, S0.5 recovery, Steps S1-S8 standalone flow (insertion-only)

## Decisions Made
None - followed plan as specified.

## Deviations from Plan
None - plan executed exactly as written.

## Issues Encountered
None.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Core standalone flow complete — `pd:test --standalone [path]` fully operational
- Phase 72 can add UX polish (progress indicators, error messages)
- Phase 73 can add documentation and examples

---
*Phase: 71-core-standalone-flow*
*Completed: 2025-07-15*
