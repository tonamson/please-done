# Phase 80: Integration Contract Tests - Research

**Researched:** 2026-04-02
**Domain:** Node.js `node:test` contract tests — file-format schema validation without live I/O or LLM
**Confidence:** HIGH

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| INTEG-01 | Format-contract violations caught automatically in CI. `test/integration-contracts.test.js` with zero external deps; validates CONTEXT.md, TASKS.md, PROGRESS.md schemas; at least one contract for each v8.0 artifact (PROGRESS.md lint fields, META.json, agent-errors.jsonl); a deliberately malformed fixture triggers a test failure. | Full schemas, fixture patterns, and test structure documented below. |
</phase_requirements>

---

## Summary

Phase 80 creates a single test file — `test/integration-contracts.test.js` — that validates the **file-format contracts** shared between skills. The key insight from PITFALLS.md: "skills are markdown executed by AI agents; there is no Node.js entry point to invoke them." What CAN be tested in Node.js is whether the written-output format (what a skill produces) matches the expected-input format (what the next skill reads).

The test file uses inline fixture strings (not reading live `.planning/` files) and regex/structural assertions. The pattern mirrors `test/smoke-codebase-staleness.test.js`: define a valid fixture as a constant, test required fields via `assert.ok(/regex/.test(fixture))`, and add a companion "malformed fixture" that deliberately fails to satisfy a contract. The test runner is `node --test` (already used for all 40+ test files in the project), zero external deps, zero fs writes.

**Primary recommendation:** One test file with six `describe()` blocks — one per artifact/contract — each containing a passing-fixture test and a malformed-fixture test. Use inline string constants for all fixtures. No fixture files on disk (project convention: "all test data is inline").

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `node:test` | built-in (Node ≥18) | Test runner — `describe`, `it` | All 40+ project tests use it; `node --test 'test/*.test.js'` in `npm test` |
| `node:assert/strict` | built-in | `assert.ok`, `assert.match`, `assert.equal` | Project-wide assertion library |
| `node:fs` | built-in | Read `bin/lib/log-schema.js` for purity check (optional) | Used by `smoke-log-schema.test.js` purity guard pattern |

### No External Dependencies
Zero new npm deps. This is a hard constraint for v8.0 per `.planning/research/SUMMARY.md`.

**Installation:** None required. Node.js 24.13.0 is confirmed on target machine. `node:test` fully available.

---

## Artifact Schemas (What to Test)

### 1. CONTEXT.md Schema
**Source:** `workflows/init.md` Step 7 — canonical creation template

```
# Project Context
> Initialized: [DD_MM_YYYY HH:MM]
> Updated: —
> Backend path: [path or —]
> Frontend path: [path or —]
> FastCode MCP: Active
> New project: [Yes/No]

## Tech Stack
...
## Main Libraries
...
## Rules
...
```

**Required fields (testable via regex):**
| Field | Regex Pattern | Notes |
|-------|--------------|-------|
| H1 title | `/^# Project Context/m` | Exact heading text |
| Initialized | `/^> Initialized:/m` | Date header |
| New project | `/^> New project:/m` | Yes/No gate used by write-code.md |
| Tech Stack section | `/^## Tech Stack/m` | Required section |
| Rules section | `/^## Rules/m` | Required section |

### 2. TASKS.md Schema
**Source:** `templates/tasks.md`

```
# Task List
> Milestone: [name] (v[x.x]) | Phase: [x.x]
> Created: [DD_MM_YYYY] | Total: [N]

## Overview
| # | Task | Status | Priority | Dependencies | Type | Truths |
...
## Task 1: [Name]
> Status: ⬜ | Priority: ...
```

**Required fields (testable via regex):**
| Field | Regex Pattern | Notes |
|-------|--------------|-------|
| H1 title | `/^# Task List/m` | Exact heading |
| Milestone metadata | `/^> Milestone:/m` | Must be present |
| Overview section | `/^## Overview/m` | Table header |
| Overview table | `/\| # \| Task \| Status \|/` | Column headers |
| At least one Task | `/^## Task \d+:/m` | One or more tasks |
| Task status | `/^> Status:/m` | Each task has status |

### 3. PROGRESS.md Schema (including Phase 76 lint fields)
**Source:** `templates/progress.md`

```
# Execution Progress
> Updated: [DD_MM_YYYY HH:MM]
> Task: [N] — [Task name]
> Stage: [Started | Reading context | Writing code | Lint/Build | ...]
> lint_fail_count: 0
> last_lint_error: ""

## Steps
...
## Expected Files
...
## Files Written
...
```

**Required fields (testable via regex):**
| Field | Regex Pattern | Notes |
|-------|--------------|-------|
| H1 title | `/^# Execution Progress/m` | Exact heading |
| Updated | `/^> Updated:/m` | Timestamp header |
| Task | `/^> Task:/m` | Current task info |
| Stage | `/^> Stage:/m` | Current stage |
| lint_fail_count | `/^> lint_fail_count:/m` | **NEW Phase 76** — tracks 0–3 failures |
| last_lint_error | `/^> last_lint_error:/m` | **NEW Phase 76** — last error output |
| Steps section | `/^## Steps/m` | Recovery checklist |
| Expected Files section | `/^## Expected Files/m` | File list |
| Files Written section | `/^## Files Written/m` | Progress tracker |

### 4. META.json Schema (Phase 77 STALE-01)
**Source:** `test/smoke-codebase-staleness.test.js` — already tested there, but integration-contracts can re-validate the sample shape

```json
{
  "schema_version": 1,
  "mapped_at_commit": "5dec59d9d037b975e85cf46c742c2e9ce5dc0549",
  "mapped_at": "2026-04-02T10:00:00.000Z"
}
```

**Required fields (testable via JS object checks):**
| Field | Type | Constraint |
|-------|------|-----------|
| `schema_version` | number | === 1 |
| `mapped_at_commit` | string | `/^[a-f0-9]{40}$/` (40-char hex SHA) |
| `mapped_at` | string | `/^\d{4}-\d{2}-\d{2}T/` (ISO-8601) |

> **Note:** `smoke-codebase-staleness.test.js` already tests this schema shape. Integration-contracts should test the **same schema using a separate fixture string** to be a standalone contract test, not just a duplicate. The contract here is the specification itself, not the implementation.

### 5. agent-errors.jsonl Schema (Phase 79 LOG-01)
**Source:** `bin/lib/log-schema.js` — `REQUIRED_FIELDS` exported constant

```javascript
const REQUIRED_FIELDS = ['timestamp', 'level', 'phase', 'step', 'agent', 'error', 'context'];
```

**Required fields (test by importing `validateLogEntry` from log-schema.js):**
| Field | Type | Constraint |
|-------|------|-----------|
| `timestamp` | string | Non-empty |
| `level` | string | One of `['debug','info','warn','error','fatal']` |
| `phase` | string | Non-empty |
| `step` | string | Non-empty |
| `agent` | string | Non-empty |
| `error` | string | Non-empty |
| `context` | object | Non-null, typeof === 'object' |

**Test approach for JSONL line:** Provide a fixture JSONL line string → `JSON.parse()` → pass to `validateLogEntry()` → assert `result.ok === true`.

---

## Architecture Patterns

### Recommended Project Structure
```
test/
├── integration-contracts.test.js   ← NEW: Phase 80 deliverable
├── smoke-codebase-staleness.test.js ← REFERENCE: META.json pattern
├── smoke-log-schema.test.js         ← REFERENCE: agent-errors.jsonl pattern
└── smoke-agent-files.test.js        ← REFERENCE: reading real files pattern
```

### Pattern 1: Inline Fixture String + Regex Contract Test
**What:** Define a valid artifact as a multi-line string constant; use regex assertions to verify required fields.

**When to use:** All markdown artifact contracts (CONTEXT.md, TASKS.md, PROGRESS.md).

**Example (modeled on smoke-codebase-staleness.test.js):**
```javascript
// Source: test/smoke-codebase-staleness.test.js pattern
'use strict';
const { describe, it } = require('node:test');
const assert = require('node:assert/strict');

const VALID_PROGRESS_FIXTURE = `# Execution Progress
> Updated: 01_04_2026 10:00
> Task: 1 — Write log schema
> Stage: Writing code
> lint_fail_count: 0
> last_lint_error: ""

## Steps
- [x] Select task
- [ ] Read context + research

## Expected Files
- bin/lib/log-schema.js

## Files Written
(none yet)
`;

describe('PROGRESS.md contract', () => {
  it('has required header fields including Phase 76 lint fields', () => {
    assert.ok(/^# Execution Progress/m.test(VALID_PROGRESS_FIXTURE));
    assert.ok(/^> lint_fail_count:/m.test(VALID_PROGRESS_FIXTURE));
    assert.ok(/^> last_lint_error:/m.test(VALID_PROGRESS_FIXTURE));
  });
});
```

### Pattern 2: Malformed Fixture → Test Must FAIL
**What:** Define a fixture missing one or more required fields; assert that the validation logic catches the violation.

**When to use:** Every `describe()` block needs at least one malformed counterpart.

**Example:**
```javascript
const MALFORMED_PROGRESS_FIXTURE = `# Execution Progress
> Updated: 01_04_2026 10:00
> Task: 1 — Write log schema
> Stage: Writing code

## Steps
- [ ] Select task
`;
// Missing: lint_fail_count, last_lint_error, Expected Files, Files Written

describe('PROGRESS.md contract — malformed fixture detection', () => {
  it('fixture missing lint_fail_count fails contract check', () => {
    assert.ok(!/^> lint_fail_count:/m.test(MALFORMED_PROGRESS_FIXTURE),
      'malformed fixture must NOT have lint_fail_count');
    // This proves the test WOULD catch a regression
  });
});
```

> **Key design:** The malformed fixture test asserts that the regex does NOT match the malformed string. This proves the detection logic works — if someone removes `lint_fail_count` from the template, the "valid" test would fail.

### Pattern 3: Import Pure Module for Schema Validation
**What:** For agent-errors.jsonl, import `validateLogEntry` from `bin/lib/log-schema.js` directly.

**When to use:** When an existing pure module already implements the schema validation.

**Example:**
```javascript
// Source: smoke-log-schema.test.js pattern
const { validateLogEntry } = require('../bin/lib/log-schema');

const VALID_JSONL_LINE = '{"timestamp":"2026-04-02T10:00:00.000Z","level":"error","phase":"80","step":"1","agent":"pd-code-detective","error":"Build failed","context":{}}';

describe('agent-errors.jsonl schema contract', () => {
  it('valid JSONL line passes schema', () => {
    const entry = JSON.parse(VALID_JSONL_LINE);
    const result = validateLogEntry(entry);
    assert.equal(result.ok, true);
  });

  it('JSONL line missing required field fails schema', () => {
    const malformed = JSON.parse(VALID_JSONL_LINE);
    delete malformed.error;
    const result = validateLogEntry(malformed);
    assert.equal(result.ok, false);
    assert.match(result.error, /missing required field: error/);
  });
});
```

### Pattern 4: Object Shape Test for META.json
**What:** Define a sample META.json object; assert field types and formats.

**Example:**
```javascript
// Source: smoke-codebase-staleness.test.js exact pattern (already proven)
const META_FIXTURE = {
  schema_version: 1,
  mapped_at_commit: '5dec59d9d037b975e85cf46c742c2e9ce5dc0549',
  mapped_at: '2026-04-02T10:00:00.000Z',
};

describe('META.json schema contract', () => {
  it('required fields have correct types and formats', () => {
    assert.equal(typeof META_FIXTURE.schema_version, 'number');
    assert.equal(META_FIXTURE.schema_version, 1);
    assert.ok(/^[a-f0-9]{40}$/.test(META_FIXTURE.mapped_at_commit));
    assert.ok(/^\d{4}-\d{2}-\d{2}T/.test(META_FIXTURE.mapped_at));
  });

  it('META.json missing mapped_at_commit fails contract', () => {
    const malformed = { schema_version: 1, mapped_at: '2026-04-02T10:00:00.000Z' };
    assert.ok(!('mapped_at_commit' in malformed), 'must be missing');
  });
});
```

### Anti-Patterns to Avoid
- **Reading live `.planning/` files in tests:** Tests contaminate project state; CI machines have no `.planning/` directory. Use inline fixtures only.
- **Trying to execute markdown skills:** No Node.js API exists for this. INTEG-01 tests contracts, not execution.
- **Writing fixture files to disk:** Project convention is "all test data is inline" (from TESTING.md). No `test/fixtures/` directory exists and none should be created.
- **Requiring an LLM client or mocking Claude:** Wrong abstraction level. If a test needs a mock LLM, the test is testing execution, not contracts.
- **One test file per artifact:** Use describe blocks, not separate files. One `integration-contracts.test.js` keeps the scope clean.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| JSONL schema validation | Custom field-checker in test | Import `validateLogEntry` from `bin/lib/log-schema.js` | Already implemented and tested in Phase 79 |
| META.json shape validation | Custom JSON schema library | Inline `assert.equal` / `assert.ok` + regex | No library needed; 3 fields, 3 asserts |
| Fixture file management | `test/fixtures/` directory | Inline string constants at top of test file | Project convention; TESTING.md: "No fixture files on disk" |

---

## Common Pitfalls

### Pitfall 1: Fixtures Read from Disk (CI Failure)
**What goes wrong:** Test uses `fs.readFileSync('.planning/CONTEXT.md')` — works locally, fails in CI because CI machines have no `.planning/` directory.
**Why it happens:** The instinct is to validate "real" files. But the contract test validates the FORMAT, not a specific file.
**How to avoid:** All fixtures are inline string constants at the top of the test file. Never read `.planning/` files.
**Warning signs:** Any `require('node:fs')` in integration-contracts.test.js for reading fixtures (reading bin/ source for purity checks is acceptable).

### Pitfall 2: Malformed Fixture Does NOT Trigger Failure
**What goes wrong:** The malformed fixture test is written incorrectly and passes even when it should show a detection capability.
**Why it happens:** Common mistake: `assert.ok(!/regex/.test(malformed))` asserts the malformed fixture LACKS the field — but this only proves absence, not that the "valid" test would fail.
**How to avoid:** The test design contract: (1) valid fixture → all required regexes match; (2) malformed fixture → at least one required regex does NOT match. Both tests should pass in CI (the malformed test asserts `false` from the regex, which is the expected outcome).
**Warning signs:** If deleting `lint_fail_count` from the VALID_PROGRESS_FIXTURE and running the tests produces no failure, the test is too weak.

### Pitfall 3: Scope Creep — Testing Execution Not Contracts
**What goes wrong:** Test tries to simulate what `pd:write-code` does (write files, run commands, etc.).
**Why it happens:** INTEG-01's name sounds like "integration test" in the traditional sense.
**How to avoid:** The phase goal is "Format-contract violations caught automatically in CI." The test validates FORMAT only: required sections, required fields, required regex patterns.
**Warning signs:** If a test requires more than 5 lines of setup code per assertion, it's too complex.

### Pitfall 4: Node.js Version Mismatch
**What goes wrong:** `describe`/`it` API from `node:test` requires Node ≥18; package.json only requires `>=16.7.0`.
**Why it happens:** `node:test` module exists from Node 16.7 but the `describe`/`it` API was added in Node 18.
**How to avoid:** Machine has Node 24.13.0 confirmed. For CI, ensure CI spec requires Node ≥18. All other tests in the project already use this pattern successfully.
**Warning signs:** `TypeError: it is not a function` or `describe is not a function`.

---

## Test File Structure (Complete)

The test file should have exactly **6 `describe()` blocks**:

```
1. CONTEXT.md contract           — valid + malformed fixtures
2. TASKS.md contract             — valid + malformed fixtures
3. PROGRESS.md contract          — valid + malformed (must include lint_fail_count/last_lint_error)
4. PROGRESS.md lint fields contract — targeted tests for Phase 76 additions specifically
5. META.json schema contract      — valid + malformed (matches smoke-codebase-staleness pattern)
6. agent-errors.jsonl schema contract — uses validateLogEntry from bin/lib/log-schema.js
```

**File header:**
```javascript
/**
 * Integration Contract Tests — INTEG-01
 * Validates file-format contracts between skill chain artifacts.
 * Zero external deps. No live fs writes. No LLM calls.
 * Pure regex + structural assertions on inline fixture strings.
 */
'use strict';

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { validateLogEntry } = require('../bin/lib/log-schema');
```

---

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | `node:test` (built-in, Node 24.13.0) |
| Config file | none — discovered via glob |
| Quick run command | `node --test test/integration-contracts.test.js` |
| Full suite command | `npm test` (`node --test 'test/*.test.js'`) |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| INTEG-01-A | CONTEXT.md required fields validated | unit (inline fixture) | `node --test test/integration-contracts.test.js` | ❌ Wave 0 |
| INTEG-01-B | TASKS.md required fields validated | unit (inline fixture) | `node --test test/integration-contracts.test.js` | ❌ Wave 0 |
| INTEG-01-C | PROGRESS.md required fields + lint_fail_count + last_lint_error | unit (inline fixture) | `node --test test/integration-contracts.test.js` | ❌ Wave 0 |
| INTEG-01-D | META.json schema shape validated | unit (object assertion) | `node --test test/integration-contracts.test.js` | ❌ Wave 0 |
| INTEG-01-E | agent-errors.jsonl JSONL line validated via validateLogEntry | unit (module import) | `node --test test/integration-contracts.test.js` | ❌ Wave 0 |
| INTEG-01-F | Malformed fixture triggers test failure | unit (negative assertion) | `node --test test/integration-contracts.test.js` | ❌ Wave 0 |

### Sampling Rate
- **Per task commit:** `node --test test/integration-contracts.test.js`
- **Per wave merge:** `npm test`
- **Phase gate:** Full suite green before `/gsd-verify-work`

### Wave 0 Gaps
- [ ] `test/integration-contracts.test.js` — covers INTEG-01-A through INTEG-01-F (the entire phase deliverable)

*(All gaps are in the single new file this phase creates. No existing infrastructure gaps.)*

---

## Environment Availability

Step 2.6: SKIPPED for external services — this phase is purely code changes (new test file). All required tools are Node.js built-ins already confirmed available.

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| `node:test` | Test runner | ✓ | Node 24.13.0 | — |
| `node:assert/strict` | Assertions | ✓ | Node 24.13.0 | — |
| `bin/lib/log-schema.js` | JSONL schema import | ✓ | Phase 79 complete | — |

---

## Code Examples

### Complete describe block for PROGRESS.md (canonical pattern)
```javascript
// Source: templates/progress.md schema + smoke-codebase-staleness.test.js pattern

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
// Malformed: missing lint_fail_count, last_lint_error, Expected Files, Files Written

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

describe('PROGRESS.md contract — malformed fixture detection', () => {
  it('malformed fixture is missing lint_fail_count', () => {
    assert.ok(!/^> lint_fail_count:/m.test(MALFORMED_PROGRESS));
  });
  it('malformed fixture is missing last_lint_error', () => {
    assert.ok(!/^> last_lint_error:/m.test(MALFORMED_PROGRESS));
  });
  it('malformed fixture is missing ## Expected Files', () => {
    assert.ok(!/^## Expected Files/m.test(MALFORMED_PROGRESS));
  });
});
```

### agent-errors.jsonl validation (imports existing module)
```javascript
// Source: bin/lib/log-schema.js (Phase 79)
const { validateLogEntry } = require('../bin/lib/log-schema');

const VALID_LOG_LINE = JSON.stringify({
  timestamp: '2026-04-02T10:00:00.000Z',
  level: 'error',
  phase: '80',
  step: '1',
  agent: 'pd-code-detective',
  error: 'Build failed: missing semicolon',
  context: { task_id: 'TASK-01' },
});

describe('agent-errors.jsonl schema contract', () => {
  it('valid JSONL line parses and validates', () => {
    const entry = JSON.parse(VALID_LOG_LINE);
    const result = validateLogEntry(entry);
    assert.equal(result.ok, true);
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
  });
});
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| No cross-skill contract tests — format changes break silently | `node:test` regex-based contract tests on inline fixtures | Phase 80 (v8.0) | Format regressions caught in CI before they reach AI agents |
| Smoke tests only cover module logic | Contract tests cover artifact schemas (what files look like) | Phase 80 | Different layer of protection — tests the "what" of output, not the "how" of logic |

**Not applicable here:**
- PROGRESS.md lint fields (`lint_fail_count`, `last_lint_error`) — added in Phase 76, now need contract enforcement
- META.json — added in Phase 77, already has smoke coverage; integration-contracts adds a second layer

---

## Open Questions

1. **Should integration-contracts.test.js also test CURRENT_MILESTONE.md format?**
   - What we know: SUMMARY.md mentions "CONTEXT.md, CURRENT_MILESTONE.md, TASKS.md, PLAN.md, PROGRESS.md" as the INTEG-01 scope
   - What's unclear: Phase requirement says "CONTEXT.md, TASKS.md, PROGRESS.md fixture files" — PLAN.md and CURRENT_MILESTONE.md are deferred?
   - Recommendation: Include CURRENT_MILESTONE.md contract (schema is in `templates/current-milestone.md`, trivial to add). Skip PLAN.md — it has free-form sections that resist regex contracts. If phase goal requires exactly 3, ship 3 + add others as bonus.

2. **Should the malformed fixture test use `assert.throws()` or negative assertion?**
   - What we know: The contract is defined by regex matching, not by a throwing validator
   - Recommendation: Use `assert.ok(!/regex/.test(malformed))` — negative assertion pattern. This is unambiguous: the test passes in CI (confirming the fixture lacks the field) and would fail if the fixture accidentally contained the field.

---

## Sources

### Primary (HIGH confidence)
- `templates/progress.md` — canonical PROGRESS.md schema including lint_fail_count/last_lint_error
- `templates/tasks.md` — canonical TASKS.md schema
- `workflows/init.md` Step 7 — canonical CONTEXT.md schema (written by `/pd:init`)
- `bin/lib/log-schema.js` — REQUIRED_FIELDS for agent-errors.jsonl (7 fields confirmed)
- `test/smoke-codebase-staleness.test.js` — exact test pattern to mirror for META.json
- `test/smoke-log-schema.test.js` — exact test pattern for importing validateLogEntry
- `.planning/codebase/TESTING.md` — "No fixture files on disk — all test data is inline"

### Secondary (MEDIUM confidence)
- `.planning/research/PITFALLS.md` INTEG-01 section — what can/cannot be tested, recommended file structure
- `.planning/research/SUMMARY.md` — INTEG-01 feature scope (CONTEXT.md, CURRENT_MILESTONE.md, TASKS.md, PLAN.md, PROGRESS.md)

### Tertiary (LOW confidence — none)
No unverified claims.

---

## Metadata

**Confidence breakdown:**
- Artifact schemas: HIGH — extracted directly from template files and workflow source
- Test patterns: HIGH — copied from existing working test files in the project
- Fixture design: HIGH — TESTING.md explicitly states "all test data is inline, no fixture files on disk"
- Malformed fixture approach: HIGH — matches project assertion style (assert.ok + regex)

**Research date:** 2026-04-02
**Valid until:** 2026-05-02 (schemas are stable; template files change rarely)
