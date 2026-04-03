# Phase 79: Structured Agent Error Logging - Research

**Researched:** 2025-01-31
**Domain:** Node.js pure-function modules, JSONL file I/O, schema validation
**Confidence:** HIGH

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| LOG-01 | Agent errors are logged as JSONL at `.planning/logs/agent-errors.jsonl` with fields: timestamp, level, phase, step, agent, error, context | Full schema, module patterns, file I/O conventions documented below |
</phase_requirements>

---

## Summary

Phase 79 creates two new files: `bin/lib/log-schema.js` (pure functions, zero `require('fs')`) and `bin/log-writer.js` (thin I/O wrapper). The pattern is identical to the project's established `audit-logger.js` / `generate-pdf-report.js` split — pure logic in `bin/lib/`, I/O in `bin/`.

The 7-field schema (`timestamp`, `level`, `phase`, `step`, `agent`, `error`, `context`) is the **phase-binding** spec. The broader schema in ARCHITECTURE.md has more fields but the LOG-01 requirement explicitly constrains to exactly 7. The planner should lock on the phase spec, not the architecture exploratory schema.

Tests live in `test/smoke-log-schema.test.js` using `node:test` + `node:assert/strict`, matching every other `test/smoke-*.test.js` file in the project.

**Primary recommendation:** Mirror `bin/lib/audit-logger.js` exactly — same `'use strict'`, same JSDoc, same export style, same `REQUIRED_FIELDS` constant pattern. The only difference is the output format (JSONL object vs Markdown table row).

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `node:fs` | built-in | `appendFileSync`, `mkdirSync` in `bin/log-writer.js` ONLY | Project uses zero runtime deps; fs is already used in all bin/*.js wrappers |
| `node:path` | built-in | Resolve `.planning/logs/` path from `process.cwd()` | Already used in `bin/generate-pdf-report.js`, `bin/lib/utils.js` |
| `node:test` | built-in (Node ≥18) | Test runner for `test/smoke-log-schema.test.js` | All project tests use `node --test` |
| `node:assert/strict` | built-in | Test assertions | All project tests use `assert/strict` |

### No External Dependencies
The project enforces **zero new runtime dependencies** (confirmed in SUMMARY.md). `bin/lib/log-schema.js` and `bin/log-writer.js` must use only Node.js built-ins.

**Version verification:** Node.js v24.13.0 confirmed on target machine. `node:test` is available (Node ≥16.7 with `--test` flag; full `describe`/`it` API available Node ≥18).

---

## Architecture Patterns

### Recommended Project Structure
```
bin/
├── lib/
│   ├── log-schema.js    ← NEW: pure functions, zero require('fs')
│   └── audit-logger.js  ← REFERENCE: identical pattern to follow
├── log-writer.js        ← NEW: thin I/O wrapper using require('fs')
└── generate-pdf-report.js  ← REFERENCE: shows bin/ fs pattern

test/
├── smoke-log-schema.test.js  ← NEW: unit tests for log-schema.js
└── smoke-audit-logger.test.js  ← REFERENCE: identical test pattern

.planning/
└── logs/
    └── agent-errors.jsonl  ← NEW: created by log-writer.js (mkdirSync first)
```

### Pattern 1: Pure lib module (bin/lib/log-schema.js)

**What:** Exports `createLogEntry()`, `validateLogEntry()`, `REQUIRED_FIELDS` constant. Zero I/O. Mirrors `bin/lib/audit-logger.js` exactly in structure.

**When to use:** All schema logic lives here. The I/O wrapper (`bin/log-writer.js`) calls these functions and handles all disk writes.

**Example (modeled on audit-logger.js):**
```javascript
// Source: bin/lib/audit-logger.js (existing, verified)
'use strict';

/**
 * Log Schema Module — Pure functions for structured JSONL log entries.
 * No require('fs'), no side effects. Schema validation only.
 */

const REQUIRED_FIELDS = ['timestamp', 'level', 'phase', 'step', 'agent', 'error', 'context'];

const VALID_LEVELS = ['debug', 'info', 'warn', 'error', 'fatal'];

/**
 * Create a validated log entry object.
 * @param {object} fields
 * @param {string} fields.timestamp  - ISO-8601 string
 * @param {string} fields.level      - 'debug'|'info'|'warn'|'error'|'fatal'
 * @param {string} fields.phase      - Phase number or 'standalone'
 * @param {string} fields.step       - Step within workflow or 'unknown'
 * @param {string} fields.agent      - Agent name or 'orchestrator'
 * @param {string} fields.error      - Error message (human-readable)
 * @param {object} fields.context    - Additional structured data (plain object)
 * @returns {{ ok: true, entry: object } | { ok: false, error: string }}
 */
function createLogEntry(fields) {
  if (!fields || typeof fields !== 'object') {
    return { ok: false, error: 'fields must be a non-null object' };
  }
  for (const f of REQUIRED_FIELDS) {
    if (fields[f] === undefined || fields[f] === null || fields[f] === '') {
      return { ok: false, error: `missing required field: ${f}` };
    }
  }
  return {
    ok: true,
    entry: {
      timestamp: fields.timestamp,
      level: fields.level,
      phase: String(fields.phase),
      step: String(fields.step),
      agent: fields.agent,
      error: fields.error,
      context: fields.context,
    },
  };
}

/**
 * Validate an existing log entry object.
 * @param {object} entry
 * @returns {{ ok: true } | { ok: false, error: string }}
 */
function validateLogEntry(entry) {
  if (!entry || typeof entry !== 'object') {
    return { ok: false, error: 'entry must be a non-null object' };
  }
  for (const f of REQUIRED_FIELDS) {
    if (entry[f] === undefined || entry[f] === null || entry[f] === '') {
      return { ok: false, error: `missing required field: ${f}` };
    }
  }
  return { ok: true };
}

module.exports = { REQUIRED_FIELDS, VALID_LEVELS, createLogEntry, validateLogEntry };
```

### Pattern 2: Thin I/O wrapper (bin/log-writer.js)

**What:** Requires `bin/lib/log-schema.js` for validation, uses `fs.appendFileSync` and `fs.mkdirSync`. Modeled on `bin/generate-pdf-report.js` for directory creation and `bin/route-query.js` for the minimal-CLI wrapper style.

**When to use:** Any code that needs to write JSONL entries to disk calls this module.

**Example (modeled on generate-pdf-report.js):**
```javascript
// Source: bin/generate-pdf-report.js lines ~30-50 (verified)
'use strict';

const fs = require('fs');
const path = require('path');
const { validateLogEntry } = require('./lib/log-schema');

const LOG_DIR = path.join(process.cwd(), '.planning', 'logs');
const LOG_FILE = path.join(LOG_DIR, 'agent-errors.jsonl');

/**
 * Append a validated log entry to .planning/logs/agent-errors.jsonl.
 * Creates the directory if it doesn't exist.
 * Returns { ok: true } or { ok: false, error: string } — never throws.
 *
 * @param {object} entry - A log entry object
 * @returns {{ ok: true } | { ok: false, error: string }}
 */
function appendLogEntry(entry) {
  const validation = validateLogEntry(entry);
  if (!validation.ok) {
    return { ok: false, error: `validation failed: ${validation.error}` };
  }
  try {
    fs.mkdirSync(LOG_DIR, { recursive: true });
    fs.appendFileSync(LOG_FILE, JSON.stringify(entry) + '\n', 'utf8');
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err.message };
  }
}

module.exports = { appendLogEntry, LOG_FILE, LOG_DIR };
```

### Anti-Patterns to Avoid

- **`require('fs')` in log-schema.js:** The architectural rule is absolute — all `bin/lib/*.js` modules are pure functions with zero I/O. Putting `fs` in log-schema.js violates this and breaks testability.
- **Throwing on invalid entry:** `audit-logger.js` throws for format errors, but `log-writer.js` should RETURN `{ ok: false }` instead of throwing — a logging write failing should never crash the caller.
- **`JSON.parse` validation in log-schema.js:** validateLogEntry takes an object, not a string. The JSONL serialization (`JSON.stringify`) happens in log-writer.js only.
- **Hardcoding absolute log path:** Always use `path.join(process.cwd(), '.planning', 'logs', 'agent-errors.jsonl')` — same pattern as `generate-pdf-report.js` uses for `.planning/reports/`.
- **createLogEntry throwing instead of returning error shape:** Return `{ ok: false, error: '...' }` so callers can handle gracefully (consistent with validateLogEntry).

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| JSONL serialization | Custom serializer | `JSON.stringify(entry) + '\n'` | JSONL is just one JSON object per line — standard JS handles it |
| Directory creation | Custom mkdir recursion | `fs.mkdirSync(dir, { recursive: true })` | Already used in `generate-pdf-report.js` — proven pattern |
| Schema validation | External JSON Schema library | Simple `for...of` loop over `REQUIRED_FIELDS` | Matches project zero-dep constraint; `audit-logger.js` uses this exact pattern |
| Test framework | Jest, mocha | `node --test` with `node:assert/strict` | All 30+ existing tests use this — non-negotiable |

---

## Log Entry Schema (7 Required Fields)

> **Binding spec:** Phase requirement LOG-01 specifies exactly 7 fields. The ARCHITECTURE.md exploratory schema has more fields but is NOT binding for this phase.

| Field | Type | Required | Description | Example |
|-------|------|----------|-------------|---------|
| `timestamp` | `string` | YES | ISO-8601 with ms | `"2026-04-02T12:34:56.789Z"` |
| `level` | `string` | YES | `debug`\|`info`\|`warn`\|`error`\|`fatal` | `"error"` |
| `phase` | `string` | YES | Phase number or `"standalone"` | `"79"` |
| `step` | `string` | YES | Step within workflow or `"unknown"` | `"3"` |
| `agent` | `string` | YES | Agent name or `"orchestrator"` | `"pd-code-detective"` |
| `error` | `string` | YES | Human-readable error message | `"FastCode MCP timeout after 30s"` |
| `context` | `object` | YES | Catch-all for additional structured data | `{ "task_id": "TASK-02" }` |

**JSONL line example:**
```json
{"timestamp":"2026-04-02T12:34:56.789Z","level":"error","phase":"79","step":"3","agent":"pd-code-detective","error":"FastCode MCP timeout after 30s","context":{"task_id":"TASK-02","workflow":"fix-bug"}}
```

**Schema reconciliation note:** ARCHITECTURE.md defines a richer exploratory schema with `session_id`, `event`, `severity`, `tool_called`, `error_code`, etc. The phase spec LOG-01 constrains to 7 fields only. Future phases may extend the schema, but this phase ships exactly: `timestamp`, `level`, `phase`, `step`, `agent`, `error`, `context`.

---

## Function Signatures

### `createLogEntry(fields)` in `bin/lib/log-schema.js`

```javascript
/**
 * @param {object} fields - All 7 required fields
 * @returns {{ ok: true, entry: object } | { ok: false, error: string }}
 */
function createLogEntry(fields)
```

- **Valid input:** Returns `{ ok: true, entry: { timestamp, level, phase, step, agent, error, context } }`
- **Missing field:** Returns `{ ok: false, error: "missing required field: <fieldname>" }`
- **Null/non-object input:** Returns `{ ok: false, error: "fields must be a non-null object" }`
- **Never throws** — always returns the result shape

### `validateLogEntry(entry)` in `bin/lib/log-schema.js`

```javascript
/**
 * @param {object} entry - A log entry object to validate
 * @returns {{ ok: true } | { ok: false, error: string }}
 */
function validateLogEntry(entry)
```

- **Valid entry (all 7 fields present and non-empty):** Returns `{ ok: true }`
- **Missing field:** Returns `{ ok: false, error: "missing required field: <fieldname>" }`
- **Null/non-object:** Returns `{ ok: false, error: "entry must be a non-null object" }`
- **Purpose:** Guards `appendLogEntry` in log-writer.js — invalid entries are NEVER written to disk

---

## bin/log-writer.js Architecture

```
appendLogEntry(entry):
  1. Call validateLogEntry(entry) from log-schema.js
  2. If !validation.ok → return { ok: false, error: `validation failed: ${validation.error}` }
  3. fs.mkdirSync(LOG_DIR, { recursive: true })   ← idempotent, safe on every call
  4. fs.appendFileSync(LOG_FILE, JSON.stringify(entry) + '\n', 'utf8')
  5. return { ok: true }
  6. Catch any fs error → return { ok: false, error: err.message }

Constants:
  LOG_DIR  = path.join(process.cwd(), '.planning', 'logs')
  LOG_FILE = path.join(LOG_DIR, 'agent-errors.jsonl')

Exports: { appendLogEntry, LOG_FILE, LOG_DIR }
```

**Key decisions:**
- `mkdirSync` on every call (idempotent via `{ recursive: true }`) — no separate "init" step needed
- `appendFileSync` not `writeFileSync` — JSONL is append-only by design
- Never throw — returns `{ ok: false }` on fs errors so callers degrade gracefully
- `LOG_FILE` and `LOG_DIR` exported as constants for tests to reference

---

## Common Pitfalls

### Pitfall 1: require('fs') in log-schema.js
**What goes wrong:** Tests can't import the module cleanly; architectural rule violated.
**Why it happens:** Temptation to put `mkdirSync`/`appendFileSync` in the "schema" module for convenience.
**How to avoid:** `log-schema.js` exports zero I/O. Every `fs.*` call lives in `bin/log-writer.js` only.
**Warning signs:** Any `require('fs')` line in `bin/lib/log-schema.js`.

### Pitfall 2: validateLogEntry throws instead of returns
**What goes wrong:** Caller's try/catch doesn't match the expected return shape; inconsistent API.
**Why it happens:** `audit-logger.js` uses `throw` for `formatLogEntry` — temptation to copy that pattern.
**How to avoid:** `validateLogEntry` RETURNS `{ ok: false, error }`, never throws. The phase spec says "rejects entries missing required fields — never written to disk" — "rejects" means returns falsy, not throws.
**Warning signs:** `throw new Error(...)` inside `validateLogEntry`.

### Pitfall 3: .planning/logs/ directory not created before appendFileSync
**What goes wrong:** `ENOENT: no such file or directory` on first write.
**Why it happens:** The directory doesn't exist in a fresh repo (confirmed — `.planning/logs/` does NOT exist).
**How to avoid:** Always call `fs.mkdirSync(LOG_DIR, { recursive: true })` before `appendFileSync`.
**Warning signs:** Missing `mkdirSync` call in `appendLogEntry`.

### Pitfall 4: Writing invalid entries to disk
**What goes wrong:** Corrupt JSONL file that breaks downstream `jq` parsing.
**Why it happens:** Skipping `validateLogEntry` call in `appendLogEntry`.
**How to avoid:** Validation is mandatory gate in `appendLogEntry` — if `!validation.ok`, return early without writing.

### Pitfall 5: Using absolute path for log file
**What goes wrong:** Tests run from different directories; path breaks.
**Why it happens:** Hardcoding `/Volumes/Code/...` or `__dirname`-relative path.
**How to avoid:** `path.join(process.cwd(), '.planning', 'logs', 'agent-errors.jsonl')` — same as `generate-pdf-report.js` uses for `.planning/reports/`.

---

## Code Examples

### Existing bin/lib/ module header pattern
```javascript
// Source: bin/lib/audit-logger.js (verified)
/**
 * [Module Name] — [one-line description].
 *
 * Pure functions: does NOT read files, does NOT require('fs'), NO side effects.
 * Content passed via parameters, returns string/object.
 */

'use strict';

// ─── Constants ────────────────────────────────────────────
```

### Existing test file header pattern
```javascript
// Source: test/smoke-audit-logger.test.js (verified)
/**
 * [Module] Tests
 * [One-line description of what's tested].
 */

"use strict";

const { describe, it } = require("node:test");
const assert = require("node:assert/strict");

const { createLogEntry, validateLogEntry, REQUIRED_FIELDS } = require("../bin/lib/log-schema");
```

### fs.mkdirSync + appendFileSync pattern
```javascript
// Source: bin/generate-pdf-report.js lines ~65-67 (verified)
const reportsDir = path.join(process.cwd(), '.planning', 'reports');
fs.mkdirSync(reportsDir, { recursive: true });
// then write to file inside that dir
```

### Existing module.exports style
```javascript
// Source: bin/lib/audit-logger.js (verified) — named exports, no default
module.exports = {
  AUDIT_LOG_TITLE,
  TABLE_HEADER,
  TABLE_SEPARATOR,
  REQUIRED_ENTRY_FIELDS,
  VALID_ACTIONS,
  createAuditLog,
  formatLogEntry,
  parseAuditLog,
  appendLogEntry,
};
```

---

## Environment Availability

Step 2.6: No external dependencies — this phase is purely code creation using Node.js built-ins. **SKIPPED.**

---

## Validation Architecture

> `workflow.nyquist_validation` is `true` in `.planning/config.json` — this section is required.

### Test Framework
| Property | Value |
|----------|-------|
| Framework | `node:test` + `node:assert/strict` (built-in, Node v24.13.0) |
| Config file | None — tests discovered by `node --test 'test/*.test.js'` |
| Quick run command | `node --test test/smoke-log-schema.test.js` |
| Full suite command | `node --test 'test/*.test.js'` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| LOG-01 | `createLogEntry()` returns `{ ok: true, entry }` for valid 7-field input | unit | `node --test test/smoke-log-schema.test.js` | ❌ Wave 0 |
| LOG-01 | `createLogEntry()` returns `{ ok: false }` when any required field is missing | unit | `node --test test/smoke-log-schema.test.js` | ❌ Wave 0 |
| LOG-01 | `validateLogEntry()` returns `{ ok: true }` for valid entry | unit | `node --test test/smoke-log-schema.test.js` | ❌ Wave 0 |
| LOG-01 | `validateLogEntry()` returns `{ ok: false }` for entry missing any of 7 fields | unit | `node --test test/smoke-log-schema.test.js` | ❌ Wave 0 |
| LOG-01 | `validateLogEntry(null)` returns `{ ok: false }` | unit | `node --test test/smoke-log-schema.test.js` | ❌ Wave 0 |
| LOG-01 | `bin/lib/log-schema.js` has zero `require('fs')` | unit | `node -e "require('./bin/lib/log-schema')"` (passes) + grep check | ❌ Wave 0 |
| LOG-01 | Entry has exactly 7 fields: timestamp, level, phase, step, agent, error, context | unit | `node --test test/smoke-log-schema.test.js` | ❌ Wave 0 |
| LOG-01 | `appendLogEntry` writes JSONL line to `.planning/logs/agent-errors.jsonl` | integration | `node --test test/smoke-log-writer.test.js` | ❌ Wave 0 |
| LOG-01 | `appendLogEntry` rejects (returns `{ ok: false }`) invalid entry — nothing written | integration | `node --test test/smoke-log-writer.test.js` | ❌ Wave 0 |

### Key Test Assertions (for Wave 0 test scaffolding)

```javascript
// test/smoke-log-schema.test.js

// createLogEntry — valid
const validFields = {
  timestamp: '2026-01-01T00:00:00.000Z',
  level: 'error',
  phase: '79',
  step: '3',
  agent: 'pd-code-detective',
  error: 'Something failed',
  context: { task_id: 'TASK-01' },
};
const result = createLogEntry(validFields);
assert.equal(result.ok, true);
assert.deepEqual(Object.keys(result.entry).sort(), REQUIRED_FIELDS.slice().sort());

// createLogEntry — missing field
const result2 = createLogEntry({ timestamp: '...', level: 'error' }); // missing 5 fields
assert.equal(result2.ok, false);
assert.match(result2.error, /missing required field/);

// validateLogEntry — valid
assert.deepEqual(validateLogEntry(validFields), { ok: true });

// validateLogEntry — null
assert.equal(validateLogEntry(null).ok, false);

// validateLogEntry — missing 'error' field
const noError = { ...validFields, error: '' };
assert.equal(validateLogEntry(noError).ok, false);
assert.match(validateLogEntry(noError).error, /missing required field: error/);

// REQUIRED_FIELDS has exactly 7 entries
assert.equal(REQUIRED_FIELDS.length, 7);
assert.ok(REQUIRED_FIELDS.includes('timestamp'));
assert.ok(REQUIRED_FIELDS.includes('level'));
assert.ok(REQUIRED_FIELDS.includes('phase'));
assert.ok(REQUIRED_FIELDS.includes('step'));
assert.ok(REQUIRED_FIELDS.includes('agent'));
assert.ok(REQUIRED_FIELDS.includes('error'));
assert.ok(REQUIRED_FIELDS.includes('context'));
```

```javascript
// test/smoke-log-writer.test.js — integration (needs temp dir)
const os = require('os');
const fs = require('fs');

// Override LOG_FILE to a temp path for testing
// OR: test by calling appendLogEntry and reading back the file

// appendLogEntry — valid entry written
const { appendLogEntry } = require('../bin/log-writer');
// Note: test must handle that LOG_FILE is process.cwd()-relative
// Solution: run test from project root, or mock path (implementation detail for Wave 0)
```

### Sampling Rate
- **Per task commit:** `node --test test/smoke-log-schema.test.js`
- **Per wave merge:** `node --test 'test/*.test.js'`
- **Phase gate:** Full suite green before `/gsd-verify-work`

### Wave 0 Gaps
- [ ] `test/smoke-log-schema.test.js` — pure unit tests for `createLogEntry`, `validateLogEntry`, `REQUIRED_FIELDS`
- [ ] `test/smoke-log-writer.test.js` — integration tests for `appendLogEntry` (validates JSONL write + rejection behavior)
- [ ] `bin/lib/log-schema.js` — the module under test (doesn't exist yet)
- [ ] `bin/log-writer.js` — I/O wrapper (doesn't exist yet)
- [ ] `.planning/logs/` — directory (doesn't exist; created by `mkdirSync` at runtime)

---

## State of the Art

| Old Approach | Current Approach | Impact |
|--------------|------------------|--------|
| Agent emitting JSON directly in markdown instructions | Pure JS wrapper enforces schema; agents write free-text | Reliable, testable, deterministic |
| `fs.appendFileSync` without mkdir guard | `mkdirSync({ recursive: true })` before every write | Safe on fresh repos where `.planning/logs/` doesn't exist |

**Deprecated/outdated:**
- "Ask agents to output JSON" — confirmed anti-pattern in PITFALLS.md. Schema enforcement must be in JS, not markdown instructions.

---

## Open Questions

1. **log-writer.js test isolation (temp directory)**
   - What we know: `LOG_FILE` is computed from `process.cwd()` — writes to real `.planning/logs/agent-errors.jsonl` during tests
   - What's unclear: Should the test clean up after itself, or use a temp dir override?
   - Recommendation: Write test to use `os.tmpdir()` for the log path — either inject via constructor arg or use a testable `appendLogEntry(entry, logFilePath)` overload. Check how `smoke-audit-logger.test.js` handles (it's pure, no cleanup needed — the I/O wrapper test is the harder case). Planner should add a task to decide: exported constant + env var override, OR function signature with optional path param.

2. **`context` field type for validateLogEntry**
   - What we know: `context` is `object` in the schema
   - What's unclear: Should `validateLogEntry` accept `context: {}` (empty object) as valid, or require at least one key?
   - Recommendation: Accept empty object — `{}` is valid. A non-null object satisfies the requirement. Reject only `null`, `undefined`, `""`, and non-objects.

---

## Sources

### Primary (HIGH confidence)
- `bin/lib/audit-logger.js` — direct source read; definitive pattern reference for log-schema.js
- `bin/generate-pdf-report.js` — direct source read; definitive fs pattern for log-writer.js
- `test/smoke-audit-logger.test.js` — direct source read; definitive test pattern
- `test/smoke-utils.test.js` — direct source read; confirms `node:test` + `node:assert/strict` pattern
- `.planning/REQUIREMENTS.md` — LOG-01 requirement text, confirmed field list
- `.planning/research/SUMMARY.md` — LOG-01 implementation approach, stack constraints
- `.planning/research/ARCHITECTURE.md` — component table, log entry schema, integration points

### Secondary (MEDIUM confidence)
- `.planning/research/PITFALLS.md` — LOG-01 specific pitfalls (agents can't emit JSON directly)

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — verified from package.json, existing source files, confirmed Node v24.13.0
- Architecture: HIGH — pattern directly observed in audit-logger.js / generate-pdf-report.js
- Schema: HIGH — field names from REQUIREMENTS.md (binding), cross-checked with ARCHITECTURE.md
- Pitfalls: HIGH — sourced from project's own PITFALLS.md + confirmed by direct code inspection

**Research date:** 2025-01-31
**Valid until:** 2025-03-03 (30 days — stable domain)
