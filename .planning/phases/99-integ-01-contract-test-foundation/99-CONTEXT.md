---
name: INTEG-01 Contract Test Foundation
description: Create schema validation for CONTEXT.md/TASKS.md/PROGRESS.md artifacts
type: context
phase: 99
---

# Phase 99: INTEG-01 — Contract Test Foundation

## Goal
Create a reusable schema validation library (`bin/lib/schema-validator.js`) that validates the three core artifact types produced by the skill chain: CONTEXT.md, TASKS.md, and PROGRESS.md.

## Gray Areas Decided

### Validation Approach
**Decision:** Use pure JavaScript functions with regex patterns, NOT JSON Schema.

- **Rationale:** 
  - JSON Schema adds external dependency
  - Regex patterns are sufficient for markdown validation
  - Follows existing pattern from `log-schema.js`
  - Easier to maintain and extend

### Schema Definition Pattern
**Decision:** Export schema definitions as objects with required fields and regex patterns.

```javascript
const CONTEXT_SCHEMA = {
  requiredHeaders: ['# Project Context'],
  requiredFields: [
    { name: 'Initialized', pattern: /^> Initialized:/m },
    { name: 'New project', pattern: /^> New project:/m },
  ],
  requiredSections: [
    { name: 'Tech Stack', pattern: /^## Tech Stack/m },
    { name: 'Rules', pattern: /^## Rules/m },
  ],
};
```

### Return Format
**Decision:** Follow existing `{ ok: boolean, error?: string }` pattern from `log-schema.js`.

```javascript
// Success
{ ok: true }

// Failure
{ ok: false, error: 'Missing required field: Initialized' }
```

### Validation Scope
**Decision:** Validate structure and required fields, NOT content semantics.

- **In scope:** Headers, field presence, section presence, table structure
- **Out of scope:** Validating dates, path correctness, task dependencies
- **Rationale:** Contract tests verify format, not business logic

### Three Artifact Types
**Decision:** Support CONTEXT.md, TASKS.md, PROGRESS.md in single module.

| Artifact | Key Validations |
|----------|-----------------|
| CONTEXT.md | `# Project Context` header, `> Initialized:`, `> New project:`, `## Tech Stack`, `## Rules` |
| TASKS.md | `# Task List` header, `> Milestone:`, `## Overview` table, `## Task N:` sections |
| PROGRESS.md | `# Execution Progress` header, `> Updated:`, `> Task:`, `> Stage:`, `> lint_fail_count:`, `> last_lint_error:`, sections |

### Testing Strategy
**Decision:** Unit tests with inline fixtures (like integration-contracts.test.js).

- Mock fixtures for valid/invalid cases
- Test each validation function independently
- 90%+ coverage target
- No filesystem reads (pure functions)

## Implementation Boundaries

### In Scope
1. `bin/lib/schema-validator.js` with validation functions
2. Schema definitions for 3 artifact types
3. `validateContext()`, `validateTasks()`, `validateProgress()` functions
4. `validateArtifact(type, content)` generic function
5. Unit tests with fixtures
6. Integration with existing `integration-contracts.test.js`

### Out of Scope (Phase 100)
- Cross-skill contract tests (testing actual skill output)
- CI/pre-commit hook integration
- Automatic schema fixing/suggestions
- File system watching

## Constraints
- Pure functions only (no fs reads)
- Zero external dependencies
- Follow existing `log-schema.js` patterns
- Synchronous API
- TypeJSDoc comments

## Deferred Ideas
- JSON Schema export for external tools
- Strict mode vs lenient mode
- Partial validation (only check specific sections)
- Auto-fix capability

## References
- Existing pattern: `bin/lib/log-schema.js`
- Existing tests: `test/integration-contracts.test.js`
- Requirements: `.planning/REQUIREMENTS.md` section INTEG-01
- ROADMAP: Phase 99, 100
