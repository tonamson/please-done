# Testing Patterns

**Analysis Date:** 2026-04-07

## Test Framework

**Runner:**
- Node.js built-in `node:test` module (no external test framework)
- Config: No separate config file, uses Node.js defaults
- Assertion library: `node:assert/strict`

**Run Commands:**
```bash
npm test                          # Run all tests
npm run test:smoke                # Run smoke tests only
npm run test:integration            # Run integration tests
npm run test:coverage             # Run tests with c8 coverage
npm run test:converters           # smoke-converters.test.js
npm run test:installers           # smoke-installers.test.js
npm run test:utils                # smoke-utils.test.js
npm run test:state                # smoke-state-machine.test.js
npm run test:platforms            # smoke-all-platforms.test.js
```

## Test File Organization

**Location:**
- Primary tests: `test/` directory
- Co-located tests: `bin/lib/*.test.js` (adjacent to source files)
- Pattern: `smoke-{area}.test.js` or `{module-name}.test.js`

**Naming:**
- `smoke-` prefix indicates lightweight verification tests
- `{area}` describes the module/concern being tested
- `.test.js` suffix for Node.js test runner discovery

**Structure:**
```
test/
├── smoke-*.test.js           # Smoke tests
├── *.test.js                 # Module-specific tests
├── integration*.test.js      # Integration tests
├── basic-*.test.js           # Basic functionality tests
├── enhanced-*.test.js        # Enhanced feature tests
├── health-checker.test.js    # Health checker tests
├── stats-*.test.js           # Statistics tests
├── schema-validator.test.js  # Schema validation tests
├── audit-*.test.js           # Audit trail tests
├── log-*.test.js             # Logging tests
├── platform-*.test.js        # Platform tests
├── pd-*.test.js              # PD command integration tests
├── lint-*.test.js            # Lint tracking tests
├── integration/              # Integration test utilities
├── fixtures/                 # Test fixtures
├── workflows/                # Workflow-specific tests
└── generate-snapshots.js     # Snapshot generation utility

bin/lib/
├── *.test.js                 # Co-located tests (e.g., audit-trail.test.js)
```

## Test Structure

**Suite Organization:**
```javascript
'use strict';
const { describe, it, before, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');

describe('Module Name', () => {
  // Optional: setup/teardown
  before(() => {
    // Setup code
  });
  
  after(() => {
    // Cleanup code
  });

  it('should do something specific', () => {
    // Test code
    assert.equal(actual, expected);
  });
});
```

**Patterns:**
- `before`/`after` hooks for setup and teardown
- Temp directories using `os.tmpdir()` for filesystem tests
- Inline fixtures as string constants
- Real repo files for integrity tests

**Assertion Patterns:**
```javascript
assert.equal(frontmatter.name, 'test');
assert.match(body, /Body content/);
assert.ok(result.length > 0);
assert.throws(() => functionThatThrows());
```

## Mocking

**Framework:** None detected — tests use real file operations or inline fixtures

**Patterns:**
- In-memory fixtures: Sample skill content as string constants
- Temp directories: `os.tmpdir()` for tests needing filesystem
- Real repo files: Integrity tests read actual directories

**Example fixture:**
```javascript
const SAMPLE_SKILL = `---
name: test-skill
description: Test skill
allowed-tools: [Read, Write]
---

Skill body content here.
`;
```

## Fixtures and Factories

**Test Data:**
- **Inline fixtures:** Defined as constants in test files
- **Temp directories:** Created with `fs.mkdtempSync()`
- **Real files:** Integrity tests use actual repo structure

**Location:**
- `test/fixtures/` - External fixture files (minimal)
- Inline in test files - Primary pattern

**Example:**
```javascript
// Helper to create temp test directory
function mkp(base, ...segments) {
  const dir = path.join(base, ...segments);
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

// Helper to write test files
function writeFile(base, relPath, content) {
  const full = path.join(base, relPath);
  fs.mkdirSync(path.dirname(full), { recursive: true });
  fs.writeFileSync(full, content, 'utf8');
  return full;
}
```

## Coverage

**Tool:** c8 (devDependency)

**Requirements:** None enforced (no coverage thresholds)

**View Coverage:**
```bash
npm run test:coverage             # Generate text coverage report
```

**Coverage approach:** Smoke-level verification — verifies critical paths work, not exhaustive branch coverage.

## Test Types

**Unit Tests:**
- Scope: Individual functions/modules
- Approach: Test functions in isolation with fixtures
- Location: `bin/lib/*.test.js`, `test/smoke-*.test.js`

**Integration Tests:**
- Scope: Multi-module interactions
- Approach: Test full workflows and state management
- Location: `test/*integration*.test.js`, `test/pd-*.test.js`

**E2E Tests:**
- Scope: Full skill execution
- Approach: Simulate complete skill workflows
- Location: `test/smoke-state-machine.test.js` (simulates full lifecycle)

**Smoke Tests:**
- Scope: Critical path verification
- Approach: Quick sanity checks
- Pattern: `test/smoke-*.test.js`

## Common Patterns

**Async Testing:**
```javascript
it('async operation works', async () => {
  const result = await asyncFunction();
  assert.equal(result.status, 'success');
});
```

**Error Testing:**
```javascript
assert.throws(() => {
  functionThatShouldThrow();
}, /Expected error message/);
```

**File System Testing:**
```javascript
let tempDir;

before(() => {
  tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'test-prefix-'));
});

after(() => {
  fs.rmSync(tempDir, { recursive: true, force: true });
});

it('creates files', () => {
  fs.writeFileSync(path.join(tempDir, 'test.txt'), 'content');
  assert.ok(fs.existsSync(path.join(tempDir, 'test.txt')));
});
```

**State Machine Testing:**
```javascript
// Simulators for state transitions
function simInit(root) { /* ... */ }
function simPlan(root, version, phaseNum, tasks) { /* ... */ }
function simWriteCodeTask(root, version, phaseNum, taskNum) { /* ... */ }

// Test full lifecycle
describe('State Machine', () => {
  let root;
  before(() => { root = fs.mkdtempSync(...); });
  after(() => { fs.rmSync(root, { recursive: true }); });
  
  it('completes full lifecycle', () => {
    simInit(root);
    simPlan(root, '1.0', 1, [{ name: 'Task 1' }]);
    simWriteCodeTask(root, '1.0', 1, 1);
    // Assertions...
  });
});
```

## Eval Framework

**Purpose:** Prompt quality evaluation (separate from unit tests)

**Location:** `evals/`

**Run Commands:**
```bash
npm run eval              # Standard eval run
npm run eval:trigger      # Trigger-specific eval
npm run eval:full         # Full evaluation suite
npm run eval:compare      # Compare results
npm run eval:view         # Open promptfoo viewer
npm run eval:filter       # Filter by pattern
```

**Tool:** PromptFoo (external)
- Config: `promptfooconfig.yaml`
- Wrapper: `evals/run.js`

## Benchmark Framework

**Purpose:** Performance benchmarking

**Location:** `test/benchmark.js`

**Run:** Manual execution (not part of test suite)

**Baseline:** `test/baseline-tokens.json` - Token usage baselines

## Key Test Files

| Test File | Purpose | Coverage |
|-----------|---------|----------|
| `smoke-integrity.test.js` | Repo integrity | Consistency between commands/workflows/templates/references |
| `smoke-converters.test.js` | Converter output | 4 converters (codex, copilot, gemini, opencode) |
| `smoke-installers.test.js` | Installer behavior | Platform-specific installation logic |
| `smoke-utils.test.js` | Utility functions | frontmatter, XML, hashing, platforms, manifest |
| `smoke-state-machine.test.js` | State machine | Full lifecycle via `.planning/` files |
| `smoke-all-platforms.test.js` | Cross-platform | End-to-end across all platforms |
| `audit-trail.test.js` | Audit trail | Comprehensive audit logging |
| `health-checker.test.js` | Health checking | GSD health validation |
| `schema-validator.test.js` | Schema validation | CONTEXT.md, TASKS.md, PROGRESS.md |
| `parallel-dispatch.test.js` | Parallel execution | Wave-based task dispatch |

## Test Maintenance

**Adding New Tests:**
1. Create `test/smoke-{area}.test.js` or `bin/lib/{module}.test.js`
2. Follow existing import pattern (`node:test`, `node:assert/strict`)
3. Use `describe`/`it` for organization
4. Add to `npm test` pattern if needed

**Test Data:**
- Prefer inline fixtures over external files
- Use temp directories for filesystem tests
- Clean up temp directories in `after` hooks

---

*Testing analysis: 2026-04-07*
