---
name: INTEG-01 Contract Test Foundation Plan
description: Implementation plan for schema validation library
type: plan
phase: 99
version: 1.0
---

# Phase 99 Plan: INTEG-01 — Contract Test Foundation

## Goal
Create `bin/lib/schema-validator.js` with pure functions for validating CONTEXT.md, TASKS.md, and PROGRESS.md artifacts.

## Architecture

```
┌─────────────────────────────────────────┐
│     bin/lib/schema-validator.js         │
│  ┌─────────────────────────────────┐    │
│  │  SCHEMA_DEFINITIONS             │    │
│  │  ├── CONTEXT_SCHEMA             │    │
│  │  ├── TASKS_SCHEMA               │    │
│  │  └── PROGRESS_SCHEMA            │    │
│  └─────────────────────────────────┘    │
│  ┌─────────────────────────────────┐    │
│  │  Validation Functions         │    │
│  │  ├── validateContext(content) │    │
│  │  ├── validateTasks(content)   │    │
│  │  ├── validateProgress(content)│    │
│  │  └── validateArtifact(type, content)│
│  └─────────────────────────────────┘    │
│  ┌─────────────────────────────────┐    │
│  │  Helper Functions               │    │
│  │  ├── hasHeader(pattern)       │    │
│  │  ├── hasField(pattern)        │    │
│  │  └── hasSection(pattern)        │    │
│  └─────────────────────────────────┘    │
└─────────────────────────────────────────┘
```

## Implementation Plan

### Task 1: Create Schema Validator Module

**File:** `bin/lib/schema-validator.js`

**Requirements:**
- Pure functions (no fs imports, no side effects)
- Export schema definitions for 3 artifact types
- Export validation functions
- Return `{ ok: boolean, error?: string }` format

**Schema Definitions:**

```javascript
const CONTEXT_SCHEMA = {
  name: 'CONTEXT.md',
  requiredHeaders: [
    { name: 'Project Context', pattern: /^# Project Context/m }
  ],
  requiredFields: [
    { name: 'Initialized', pattern: /^\u003e Initialized:/m },
    { name: 'New project', pattern: /^\u003e New project:/m },
  ],
  requiredSections: [
    { name: 'Tech Stack', pattern: /^## Tech Stack/m },
    { name: 'Rules', pattern: /^## Rules/m },
  ],
};

const TASKS_SCHEMA = {
  name: 'TASKS.md',
  requiredHeaders: [
    { name: 'Task List', pattern: /^# Task List/m }
  ],
  requiredFields: [
    { name: 'Milestone', pattern: /^\u003e Milestone:/m },
    { name: 'Created', pattern: /^\u003e Created:/m },
  ],
  requiredSections: [
    { name: 'Overview', pattern: /^## Overview/m },
    { name: 'Task sections', pattern: /^## Task \d+:/m },
  ],
  requiredTables: [
    { name: 'Overview table', headers: /\| # \| Task \| Status \|/ },
  ],
};

const PROGRESS_SCHEMA = {
  name: 'PROGRESS.md',
  requiredHeaders: [
    { name: 'Execution Progress', pattern: /^# Execution Progress/m }
  ],
  requiredFields: [
    { name: 'Updated', pattern: /^\u003e Updated:/m },
    { name: 'Task', pattern: /^\u003e Task:/m },
    { name: 'Stage', pattern: /^\u003e Stage:/m },
    { name: 'lint_fail_count', pattern: /^\u003e lint_fail_count:/m },
    { name: 'last_lint_error', pattern: /^\u003e last_lint_error:/m },
  ],
  requiredSections: [
    { name: 'Steps', pattern: /^## Steps/m },
    { name: 'Expected Files', pattern: /^## Expected Files/m },
    { name: 'Files Written', pattern: /^## Files Written/m },
  ],
};
```

**Validation Functions:**

```javascript
/**
 * Validate CONTEXT.md content
 * @param {string} content - File content
 * @returns {{ ok: true } | { ok: false, error: string }}
 */
function validateContext(content) {}

/**
 * Validate TASKS.md content
 * @param {string} content - File content
 * @returns {{ ok: true } | { ok: false, error: string }}
 */
function validateTasks(content) {}

/**
 * Validate PROGRESS.md content
 * @param {string} content - File content
 * @returns {{ ok: true } | { ok: false, error: string }}
 */
function validateProgress(content) {}

/**
 * Validate artifact by type
 * @param {'context'|'tasks'|'progress'} type
 * @param {string} content
 * @returns {{ ok: true } | { ok: false, error: string }}
 */
function validateArtifact(type, content) {}
```

### Task 2: Create Unit Tests

**File:** `test/schema-validator.test.js`

**Test Coverage:**
- [ ] validateContext - valid fixture passes
- [ ] validateContext - missing header fails
- [ ] validateContext - missing field fails
- [ ] validateContext - missing section fails
- [ ] validateTasks - valid fixture passes
- [ ] validateTasks - missing header fails
- [ ] validateTasks - missing table fails
- [ ] validateTasks - missing task section fails
- [ ] validateProgress - valid fixture passes
- [ ] validateProgress - missing lint_fail_count fails
- [ ] validateProgress - missing section fails
- [ ] validateArtifact - delegates to correct validator
- [ ] validateArtifact - invalid type returns error
- [ ] Error messages are descriptive

**Fixtures:**
- Inline fixtures like `integration-contracts.test.js`
- Valid CONTEXT.md, TASKS.md, PROGRESS.md fixtures
- Malformed versions for negative tests

### Task 3: Update Integration Contracts Test

**File:** `test/integration-contracts.test.js`

**Modifications:**
- Import validators from `../bin/lib/schema-validator.js`
- Replace regex assertions with `validateXxx()` calls
- Keep existing test structure
- Add ESM import support if needed

**New Tests:**
- [ ] CONTEXT.md fixture passes `validateContext()`
- [ ] TASKS.md fixture passes `validateTasks()`
- [ ] PROGRESS.md fixture passes `validateProgress()`
- [ ] Malformed PROGRESS fails `validateProgress()`

### Task 4: Update CLAUDE.md Documentation

**File:** `CLAUDE.md`

Add section under References:

```markdown
### Schema Validation

The `bin/lib/schema-validator.js` module validates artifact files:

**Functions:**
- `validateContext(content)` - Validate CONTEXT.md
- `validateTasks(content)` - Validate TASKS.md
- `validateProgress(content)` - Validate PROGRESS.md
- `validateArtifact(type, content)` - Generic validation

**Return format:**
- Success: `{ ok: true }`
- Failure: `{ ok: false, error: 'Missing field: X' }`

**Usage:**
```javascript
const { validateContext } = require('./bin/lib/schema-validator');
const result = validateContext(content);
if (!result.ok) {
  console.error(result.error);
}
```
```

## Success Criteria

1. ✅ `bin/lib/schema-validator.js` exports 4 validation functions
2. ✅ All 3 artifact schemas defined with patterns
3. ✅ Unit tests achieve 90%+ coverage (14 tests)
4. ✅ Integration contracts test updated
5. ✅ Documentation updated in CLAUDE.md
6. ✅ All tests pass
7. ✅ Zero external dependencies

## Test Commands

```bash
# Run unit tests
npm test -- test/schema-validator.test.js

# Run integration contracts
npm test -- test/integration-contracts.test.js

# Run all tests
npm test
```

## Dependencies

- Existing pattern: `bin/lib/log-schema.js`
- Existing tests: `test/integration-contracts.test.js`
- Requirements: `.planning/REQUIREMENTS.md` section INTEG-01

## Notes

- Follow existing code style from `log-schema.js`
- Use strict mode
- No async/await needed (pure synchronous functions)
- Keep error messages actionable
- Inline fixtures avoid test file dependencies
