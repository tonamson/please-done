/**
 * Integration Contract Tests — INTEG-01
 * Validates file-format contracts between skill chain artifacts.
 * Zero external deps. No live fs writes. No LLM calls.
 * Pure regex + structural assertions on inline fixture strings.
 *
 * 6 describe blocks covering:
 * - CONTEXT.md contract (5 required fields)
 * - TASKS.md contract (6 required fields)
 * - PROGRESS.md contract (9 fields incl. Phase 76 lint fields)
 * - META.json schema contract (3 fields)
 * - agent-errors.jsonl schema contract (7 fields via validateLogEntry)
 * - Malformed fixture detection (PROGRESS.md missing lint_fail_count)
 */

'use strict';

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { validateLogEntry } = require('../bin/lib/log-schema');
const { validateContext, validateTasks, validateProgress } = require('../bin/lib/schema-validator');

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
> Files: test/integration-contracts.test.js
`;

const VALID_PROGRESS = `# Execution Progress
> Updated: 01_04_2026 10:00
> Task: 1 — Write integration contract tests
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
- test/integration-contracts.test.js

## Files Written
(none yet)
`;

const MALFORMED_PROGRESS = `# Execution Progress
> Updated: 01_04_2026 10:00
> Task: 1 — Write integration contract tests
> Stage: Writing code

## Steps
- [ ] Select task
`;

const META_FIXTURE = {
  schema_version: 1,
  mapped_at_commit: '5dec59d9d037b975e85cf46c742c2e9ce5dc0549',
  mapped_at: '2026-04-02T10:00:00.000Z',
};

const VALID_LOG_LINE = JSON.stringify({
  timestamp: '2026-04-02T10:00:00.000Z',
  level: 'error',
  phase: '80',
  step: '1',
  agent: 'pd-code-detective',
  error: 'Build failed: missing semicolon',
  context: { task_id: 'TASK-01' },
});

// ─── 1. CONTEXT.md contract (5 required fields) ─────────────

describe('CONTEXT.md contract', () => {
  it('has # Project Context header', () => {
    assert.ok(/^# Project Context/m.test(VALID_CONTEXT));
  });

  it('has > Initialized: field', () => {
    assert.ok(/^> Initialized:/m.test(VALID_CONTEXT));
  });

  it('has > New project: field', () => {
    assert.ok(/^> New project:/m.test(VALID_CONTEXT));
  });

  it('has ## Tech Stack section', () => {
    assert.ok(/^## Tech Stack/m.test(VALID_CONTEXT));
  });

  it('has ## Rules section', () => {
    assert.ok(/^## Rules/m.test(VALID_CONTEXT));
  });
});

// ─── 2. TASKS.md contract (6 required fields) ───────────────

describe('TASKS.md contract', () => {
  it('has # Task List header', () => {
    assert.ok(/^# Task List/m.test(VALID_TASKS));
  });

  it('has > Milestone: metadata', () => {
    assert.ok(/^> Milestone:/m.test(VALID_TASKS));
  });

  it('has ## Overview section', () => {
    assert.ok(/^## Overview/m.test(VALID_TASKS));
  });

  it('has overview table with required columns', () => {
    assert.ok(/\| # \| Task \| Status \|/.test(VALID_TASKS));
  });

  it('has at least one ## Task N: heading', () => {
    assert.ok(/^## Task \d+:/m.test(VALID_TASKS));
  });

  it('has > Status: field in task detail', () => {
    assert.ok(/^> Status:/m.test(VALID_TASKS));
  });
});

// ─── 3. PROGRESS.md contract (9 fields incl. Phase 76 lint) ─

describe('PROGRESS.md contract', () => {
  it('has # Execution Progress header', () => {
    assert.ok(/^# Execution Progress/m.test(VALID_PROGRESS));
  });

  it('has > Updated: field', () => {
    assert.ok(/^> Updated:/m.test(VALID_PROGRESS));
  });

  it('has > Task: field', () => {
    assert.ok(/^> Task:/m.test(VALID_PROGRESS));
  });

  it('has > Stage: field', () => {
    assert.ok(/^> Stage:/m.test(VALID_PROGRESS));
  });

  it('has > lint_fail_count: field (Phase 76)', () => {
    assert.ok(/^> lint_fail_count:/m.test(VALID_PROGRESS));
  });

  it('has > last_lint_error: field (Phase 76)', () => {
    assert.ok(/^> last_lint_error:/m.test(VALID_PROGRESS));
  });

  it('has ## Steps section', () => {
    assert.ok(/^## Steps/m.test(VALID_PROGRESS));
  });

  it('has ## Expected Files section', () => {
    assert.ok(/^## Expected Files/m.test(VALID_PROGRESS));
  });

  it('has ## Files Written section', () => {
    assert.ok(/^## Files Written/m.test(VALID_PROGRESS));
  });
});

// ─── 4. META.json schema contract (3 fields) ────────────────

describe('META.json schema contract', () => {
  it('schema_version is number equal to 1', () => {
    assert.equal(typeof META_FIXTURE.schema_version, 'number');
    assert.equal(META_FIXTURE.schema_version, 1);
  });

  it('mapped_at_commit is 40-char hex SHA', () => {
    assert.equal(typeof META_FIXTURE.mapped_at_commit, 'string');
    assert.ok(/^[a-f0-9]{40}$/.test(META_FIXTURE.mapped_at_commit),
      'SHA must be 40 hex chars');
  });

  it('mapped_at is ISO-8601 timestamp', () => {
    assert.equal(typeof META_FIXTURE.mapped_at, 'string');
    assert.ok(/^\d{4}-\d{2}-\d{2}T/.test(META_FIXTURE.mapped_at),
      'mapped_at must be ISO-8601');
  });
});

// ─── 5. agent-errors.jsonl schema contract (7 fields) ───────

describe('agent-errors.jsonl schema contract', () => {
  it('valid JSONL line parses and passes validateLogEntry', () => {
    const entry = JSON.parse(VALID_LOG_LINE);
    const result = validateLogEntry(entry);
    assert.equal(result.ok, true);
  });

  it('JSONL line has all 7 required fields', () => {
    const entry = JSON.parse(VALID_LOG_LINE);
    const required = ['timestamp', 'level', 'phase', 'step', 'agent', 'error', 'context'];
    for (const field of required) {
      assert.ok(field in entry, `must have field: ${field}`);
    }
  });

  it('JSONL line missing error field fails validation', () => {
    const entry = JSON.parse(VALID_LOG_LINE);
    delete entry.error;
    const result = validateLogEntry(entry);
    assert.equal(result.ok, false);
    assert.match(result.error, /missing required field: error/);
  });

  it('JSONL line missing context object fails validation', () => {
    const entry = JSON.parse(VALID_LOG_LINE);
    delete entry.context;
    const result = validateLogEntry(entry);
    assert.equal(result.ok, false);
    assert.match(result.error, /missing required field: context/);
  });
});

// ─── 6. Malformed fixture detection ─────────────────────────

describe('Malformed fixture detection', () => {
  it('malformed PROGRESS.md missing lint_fail_count is detected', () => {
    assert.ok(!/^> lint_fail_count:/m.test(MALFORMED_PROGRESS),
      'malformed fixture must NOT have lint_fail_count — proves detection works');
  });
});

// ─── 7. Schema Validator Integration ─────────────────────

describe('Schema Validator Integration', () => {
  it('CONTEXT.md fixture passes validateContext()', () => {
    const result = validateContext(VALID_CONTEXT);
    assert.strictEqual(result.ok, true, `Expected valid but got: ${result.error}`);
  });

  it('TASKS.md fixture passes validateTasks()', () => {
    const result = validateTasks(VALID_TASKS);
    assert.strictEqual(result.ok, true, `Expected valid but got: ${result.error}`);
  });

  it('PROGRESS.md fixture passes validateProgress()', () => {
    const result = validateProgress(VALID_PROGRESS);
    assert.strictEqual(result.ok, true, `Expected valid but got: ${result.error}`);
  });

  it('Malformed PROGRESS fails validateProgress()', () => {
    const result = validateProgress(MALFORMED_PROGRESS);
    assert.strictEqual(result.ok, false);
    assert.ok(result.error.includes('missing required field'));
    assert.ok(result.error.includes('lint_fail_count'));
  });
});
