# Phase 126: Test Infrastructure (C-02) - Context

**Gathered:** 2026-04-06
**Status:** Ready for planning

<domain>
## Phase Boundary

Fix test script for complete coverage — update npm test pattern to catch nested test files, add smoke/integration test scripts, and add c8 coverage tool.
</domain>

<decisions>
## Implementation Decisions

### Test Pattern
- **D-01:** Update `package.json` test script from `'test/*.test.js'` to `'test/**/*.test.js'` to catch files in subdirectories (smoke/, integration/, workflows/)

### Test Scripts
- **D-02:** Add `test:smoke` script running `test/smoke/**/*.test.js`
- **D-03:** Add `test:integration` script running `test/integration/**/*.test.js`

### Coverage
- **D-04:** Add `c8` as devDependency for coverage reporting
- **D-05:** Add `test:coverage` script using c8

### Test Organization (from existing structure)
- **D-06:** Smoke tests in `test/smoke/` directory (already exists)
- **D-07:** Integration tests in `test/integration/` directory (already exists)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Requirements
- `.planning/REQUIREMENTS.md` § Phase 2 (C-02) — test infrastructure requirements

### Project Config
- `package.json` — current test script and existing test structure

### Existing Tests
- `test/smoke/` — existing smoke test directory
- `test/integration/` — existing integration test directory

</canonical_refs>

<codebase>
## Existing Code Insights

### Reusable Assets
- `test/smoke/` directory with existing smoke tests
- `test/integration/` directory with existing integration tests
- `test/workflows/` directory with workflow tests

### Established Patterns
- Node.js native `--test` flag for running tests
- c8 coverage tool pattern (standard for Node.js projects)

### Integration Points
- package.json scripts section for adding new test commands

</codebase>

<specifics>
## Specific Ideas

No specific references or examples — standard Node.js test infrastructure improvements.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 126-test-infrastructure-c-02*
*Context gathered: 2026-04-06*
