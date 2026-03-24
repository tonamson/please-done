---
phase: 22-diagram-generation
plan: 01
subsystem: diagrams
tags: [mermaid, flowchart, truths, business-logic, tdd]

# Dependency graph
requires:
  - phase: 21-mermaid-foundation
    provides: "mermaid-validator.js pure function, mermaid-rules.md spec"
provides:
  - "generateBusinessLogicDiagram() pure function — Truths table to Mermaid flowchart"
  - "7 unit tests for Business Logic diagram generation"
affects: [22-diagram-generation-plan-02, 24-workflow-integration]

# Tech tracking
tech-stack:
  added: []
  patterns: ["inline regex reuse from plan-checker (avoid circular deps)", "validateAndRetry pattern with mermaid-validator"]

key-files:
  created:
    - bin/lib/generate-diagrams.js
    - test/smoke-generate-diagrams.test.js
  modified: []

key-decisions:
  - "Inline parseTruthsV11 regex instead of requiring plan-checker.js — avoids circular dependency"
  - "Subgraph splitting threshold at 15 Truths (matching MAX_NODES from mermaid-rules.md)"
  - "Vietnamese labels sanitized: < > & replaced with Vietnamese equivalents"

patterns-established:
  - "validateAndRetry: generate Mermaid text, validate, auto-fix, retry (max 2)"
  - "Flat vs subgraph mode based on truth count threshold"

requirements-completed: [DIAG-01]

# Metrics
duration: 3min
completed: 2026-03-24
---

# Phase 22 Plan 01: Business Logic Diagram Summary

**generateBusinessLogicDiagram() pure function — Truths table to Mermaid flowchart TD with auto subgraph splitting, cross-plan arrows from depends_on, Vietnamese labels, mermaidValidator retry**

## Performance

- **Duration:** 3 min
- **Started:** 2026-03-24T07:58:35Z
- **Completed:** 2026-03-24T08:01:22Z
- **Tasks:** 2 (TDD: RED + GREEN)
- **Files modified:** 2

## Accomplishments
- TDD RED: 7 failing tests covering single plan, multi-plan, subgraphs, validation, Vietnamese labels
- TDD GREEN: Full implementation passing all 7 tests plus 16 existing mermaid-validator tests
- Pure function with zero file I/O — content passed as args, validated by mermaidValidator()

## Task Commits

Each task was committed atomically:

1. **Task 1: RED — Write failing tests** - `3fa68a4` (test)
2. **Task 2: GREEN — Implement generateBusinessLogicDiagram** - `d2c2542` (feat)

_TDD plan: RED phase created stub + 7 failing tests, GREEN phase implemented full function._

## Files Created/Modified
- `bin/lib/generate-diagrams.js` - generateBusinessLogicDiagram() pure function with parseTruthsFromContent, parseDependsOnFromFrontmatter, sanitizeLabel, validateAndRetry helpers
- `test/smoke-generate-diagrams.test.js` - 7 test cases with makePlanContent helper for realistic PLAN.md content

## Decisions Made
- Inlined parseTruthsV11 regex from plan-checker.js instead of requiring it — avoids circular dependency risk
- Used parseFrontmatter from utils.js for frontmatter parsing — reuses existing proven utility
- Subgraph labels use Vietnamese ("Ke hoach 01") per project convention (D-09 from Phase 21)
- Start/End nodes use stadium shape with Vietnamese labels: "Bat dau" / "Hoan thanh"

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- generateBusinessLogicDiagram() ready for Plan 02 (generateArchitectureDiagram in same module)
- Module exports pattern ready for workflow integration (Phase 24)
- 23 total tests (7 new + 16 existing) provide regression safety

---
*Phase: 22-diagram-generation*
*Completed: 2026-03-24*
