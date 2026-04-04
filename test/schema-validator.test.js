/**
 * Schema Validator Tests
 * Unit tests for artifact validation functionality
 */

'use strict';

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const {
  SCHEMA_DEFINITIONS,
  CONTEXT_SCHEMA,
  TASKS_SCHEMA,
  PROGRESS_SCHEMA,
  validateContext,
  validateTasks,
  validateProgress,
  validateArtifact,
} = require('../bin/lib/schema-validator');

// ─── Inline Fixtures ────────────────────────────────────────

const VALID_CONTEXT = `# Project Context
> Initialized: 01_04_2026 10:00
> Updated: —
> Backend path: src/
> Frontend path: —
> FastCode MCP: Active
> New project: No

## Tech Stack
- Node.js 24

## Main Libraries
- (none)

## Rules
- Follow existing patterns
`;

const VALID_TASKS = `# Task List
> Milestone: v8.0 (v8.0) | Phase: 80
> Created: 01_04_2026 | Total: 1

## Overview
| # | Task | Status | Priority | Dependencies | Type | Truths |
|---|------|--------|----------|-------------|------|--------|
| 1 | Write tests | ⬜ | P0 | — | code | T-01 |

## Task 1: Write integration contract tests
> Status: ⬜ | Priority: P0
> Type: code | Dependencies: —
> Files: test/schema-validator.test.js
`;

const VALID_PROGRESS = `# Execution Progress
> Updated: 01_04_2026 10:00
> Task: 1 — Write schema validator
> Stage: Writing code
> lint_fail_count: 0
> last_lint_error: ""

## Steps
- [x] Select task
- [ ] Read context + research
- [ ] Write code
- [ ] Lint + Build
- [ ] Create report
- [ ] Commit

## Expected Files
- bin/lib/schema-validator.js

## Files Written
(none yet)
`;

const INVALID_CONTEXT_MISSING_HEADER = `## Tech Stack
- Node.js

## Rules
- Follow patterns
`;

const INVALID_CONTEXT_MISSING_FIELD = `# Project Context
> Initialized: 01_04_2026

## Tech Stack
- Node.js

## Rules
- Follow patterns
`;

const INVALID_CONTEXT_MISSING_SECTION = `# Project Context
> Initialized: 01_04_2026
> New project: No

## Rules
- Follow patterns
`;

const INVALID_TASKS_MISSING_TABLE = `# Task List
> Milestone: v1.0
> Created: 01_04_2026

## Overview
| # | Task |
| 1 | Test |

## Task 1: Test
> Status: ⬜
`;

const INVALID_PROGRESS_MISSING_LINT = `# Execution Progress
> Updated: 01_04_2026
> Task: 1 — Test
> Stage: Writing

## Steps
- [ ] Step 1

## Expected Files
- test.js

## Files Written
(none)
`;

// ─── Schema Definition Tests ────────────────────────────────

describe('SCHEMA_DEFINITIONS', () => {
  it('exports context schema', () => {
    assert.ok(SCHEMA_DEFINITIONS.context);
    assert.strictEqual(SCHEMA_DEFINITIONS.context.name, 'CONTEXT.md');
  });

  it('exports tasks schema', () => {
    assert.ok(SCHEMA_DEFINITIONS.tasks);
    assert.strictEqual(SCHEMA_DEFINITIONS.tasks.name, 'TASKS.md');
  });

  it('exports progress schema', () => {
    assert.ok(SCHEMA_DEFINITIONS.progress);
    assert.strictEqual(SCHEMA_DEFINITIONS.progress.name, 'PROGRESS.md');
  });
});

describe('CONTEXT_SCHEMA', () => {
  it('has required headers', () => {
    assert.ok(CONTEXT_SCHEMA.requiredHeaders);
    assert.ok(CONTEXT_SCHEMA.requiredHeaders.length > 0);
  });

  it('has required fields', () => {
    assert.ok(CONTEXT_SCHEMA.requiredFields);
    assert.ok(CONTEXT_SCHEMA.requiredFields.some(f => f.name === 'Initialized'));
    assert.ok(CONTEXT_SCHEMA.requiredFields.some(f => f.name === 'New project'));
  });

  it('has required sections', () => {
    assert.ok(CONTEXT_SCHEMA.requiredSections);
    assert.ok(CONTEXT_SCHEMA.requiredSections.some(s => s.name === 'Tech Stack'));
    assert.ok(CONTEXT_SCHEMA.requiredSections.some(s => s.name === 'Rules'));
  });
});

describe('TASKS_SCHEMA', () => {
  it('has required headers', () => {
    assert.ok(TASKS_SCHEMA.requiredHeaders);
    assert.ok(TASKS_SCHEMA.requiredHeaders.length > 0);
  });

  it('has required tables', () => {
    assert.ok(TASKS_SCHEMA.requiredTables);
    assert.ok(TASKS_SCHEMA.requiredTables.some(t => t.name === 'Overview table'));
  });
});

describe('PROGRESS_SCHEMA', () => {
  it('has lint_fail_count field', () => {
    assert.ok(PROGRESS_SCHEMA.requiredFields);
    assert.ok(PROGRESS_SCHEMA.requiredFields.some(f => f.name === 'lint_fail_count'));
    assert.ok(PROGRESS_SCHEMA.requiredFields.some(f => f.name === 'last_lint_error'));
  });
});

// ─── Validation Function Tests ─────────────────────────────

describe('validateContext', () => {
  it('returns ok: true for valid CONTEXT.md', () => {
    const result = validateContext(VALID_CONTEXT);
    assert.strictEqual(result.ok, true);
  });

  it('returns ok: false for missing header', () => {
    const result = validateContext(INVALID_CONTEXT_MISSING_HEADER);
    assert.strictEqual(result.ok, false);
    assert.ok(result.error.includes('missing required header'));
  });

  it('returns ok: false for missing field', () => {
    const result = validateContext(INVALID_CONTEXT_MISSING_FIELD);
    assert.strictEqual(result.ok, false);
    assert.ok(result.error.includes('missing required field'));
  });

  it('returns ok: false for missing section', () => {
    const result = validateContext(INVALID_CONTEXT_MISSING_SECTION);
    assert.strictEqual(result.ok, false);
    assert.ok(result.error.includes('missing required section'));
  });

  it('returns ok: false for empty content', () => {
    const result = validateContext('');
    assert.strictEqual(result.ok, false);
    assert.ok(result.error.includes('content must be a non-empty string'));
  });

  it('returns ok: false for null content', () => {
    const result = validateContext(null);
    assert.strictEqual(result.ok, false);
    assert.ok(result.error.includes('content must be a non-empty string'));
  });
});

describe('validateTasks', () => {
  it('returns ok: true for valid TASKS.md', () => {
    const result = validateTasks(VALID_TASKS);
    assert.strictEqual(result.ok, true);
  });

  it('returns ok: false for missing table', () => {
    const result = validateTasks(INVALID_TASKS_MISSING_TABLE);
    assert.strictEqual(result.ok, false);
    assert.ok(result.error.includes('missing required table'));
  });

  it('returns ok: false for empty content', () => {
    const result = validateTasks('');
    assert.strictEqual(result.ok, false);
  });
});

describe('validateProgress', () => {
  it('returns ok: true for valid PROGRESS.md', () => {
    const result = validateProgress(VALID_PROGRESS);
    assert.strictEqual(result.ok, true);
  });

  it('returns ok: false for missing lint_fail_count', () => {
    const result = validateProgress(INVALID_PROGRESS_MISSING_LINT);
    assert.strictEqual(result.ok, false);
    assert.ok(result.error.includes('missing required field'));
    assert.ok(result.error.includes('lint_fail_count'));
  });

  it('returns ok: false for empty content', () => {
    const result = validateProgress('');
    assert.strictEqual(result.ok, false);
  });
});

describe('validateArtifact', () => {
  it('delegates to validateContext for type "context"', () => {
    const result = validateArtifact('context', VALID_CONTEXT);
    assert.strictEqual(result.ok, true);
  });

  it('delegates to validateTasks for type "tasks"', () => {
    const result = validateArtifact('tasks', VALID_TASKS);
    assert.strictEqual(result.ok, true);
  });

  it('delegates to validateProgress for type "progress"', () => {
    const result = validateArtifact('progress', VALID_PROGRESS);
    assert.strictEqual(result.ok, true);
  });

  it('returns error for invalid type', () => {
    const result = validateArtifact('invalid', VALID_CONTEXT);
    assert.strictEqual(result.ok, false);
    assert.ok(result.error.includes('Invalid artifact type'));
  });

  it('returns error for empty type', () => {
    const result = validateArtifact('', VALID_CONTEXT);
    assert.strictEqual(result.ok, false);
  });
});

// ─── Error Message Tests ───────────────────────────────────

describe('Error messages', () => {
  it('includes artifact name in error', () => {
    const result = validateContext('invalid');
    assert.ok(result.error.includes('CONTEXT.md'));
  });

  it('includes missing element type in error', () => {
    const result = validateContext(INVALID_CONTEXT_MISSING_HEADER);
    assert.ok(result.error.includes('missing required header'));
  });

  it('includes missing element name in error', () => {
    const result = validateContext(INVALID_CONTEXT_MISSING_SECTION);
    assert.ok(result.error.includes('Tech Stack'));
  });
});
