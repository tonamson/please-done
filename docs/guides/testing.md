<!-- generated-by: gsd-doc-writer -->
# Testing Guide

This guide covers the full testing strategy for **please-done** — from running the unit and
integration test suite to executing the AI-output evaluation suite that verifies skill workflow
fidelity across Claude, Codex, Gemini, OpenCode, and Copilot.

---

## Test Framework and Setup

please-done uses the **Node.js built-in test runner** (`node:test`), available in Node.js ≥ 18,
with **`c8`** for coverage reporting. There are no external testing frameworks (no Jest, Mocha,
or Vitest) — only the native runner and the standard `node:assert` module.

**Required Node.js version:** `>= 16.7.0` (as specified in `package.json` `engines`), though
`node:test` requires Node ≥ 18 in practice. Run `node --version` to verify.

**Install dependencies before testing:**

```bash
npm install
```

No additional test-specific setup is required for the unit/smoke/integration suites. The
evaluation suite requires an `ANTHROPIC_API_KEY` (see [Evals Suite](#evals-suite) below).

---

## Running Tests

### Full test suite

```bash
npm test
```

This runs every `*.test.js` file under `test/` recursively using `node --test`.

### Subsets by category

```bash
# Smoke tests only (fast — pure logic, no I/O side-effects)
npm run test:smoke

# Integration tests only
npm run test:integration

# Specific subsystems
npm run test:converters      # Platform converter logic
npm run test:installers      # Installer reliability
npm run test:utils           # Shared utility functions
npm run test:state           # State machine
npm run test:platforms       # Cross-platform model resolution
```

### With coverage

```bash
npm run test:coverage
```

Uses `c8` with text reporter. Coverage output prints to stdout — no threshold is currently
enforced, but this command is useful for spotting uncovered branches before opening a PR.

---

## Test Directory Structure

```
test/
├── smoke/                         # smoke subdir (used by test:smoke)
│   └── onboard-smoke.test.js
├── integration/                   # integration subdir (used by test:integration)
│   ├── logging-integration.test.js
│   ├── osint-workflow.test.js
│   └── recon-workflow.test.js
├── fixtures/                      # static input data for converter tests (currently empty)
├── snapshots/                     # pre-computed converter output (regression baseline)
│   ├── codex/
│   ├── copilot/
│   ├── gemini/
│   └── opencode/
├── smoke-*.test.js                # 40+ smoke test files at root level
├── *.integration.test.js          # integration test files at root level
├── *.test.js                      # unit test files at root level
├── baseline-tokens.json           # token count baselines for drift detection
├── generate-snapshots.js          # one-time snapshot generation utility
└── benchmark.js                   # installation performance benchmark
```

> **Note:** `npm run test:smoke` targets `test/smoke/**/*.test.js` (the subdirectory only).
> The many `smoke-*.test.js` files at the root of `test/` are included when running the full
> `npm test` suite but are not scoped by the `:smoke` script.

---

## Unit vs Integration vs Smoke Tests

### Unit / smoke tests (`test/smoke-*.test.js`, `test/*.test.js`)

These are the largest category (~70 files). They test pure functions and module behaviour with
no external I/O. Examples:

| File | What it tests |
|------|---------------|
| `smoke-converters.test.js` | Path, tool-name, and frontmatter transforms for all 4 converters |
| `smoke-utils.test.js` | `parseFrontmatter`, `buildFrontmatter`, `extractXmlSection`, manifest helpers |
| `smoke-installers.test.js` | Installer idempotency, step labels, `checkUpToDate` |
| `platform-models.test.js` | `PLATFORM_MODEL_MAP`, `getModelForTier`, fallback chain |
| `smoke-state-machine.test.js` | State parsing and task state transitions |
| `smoke-integrity.test.js` | File hash and manifest integrity checks |
| `drift-detector.test.js` | Token drift detection against `baseline-tokens.json` |
| `smoke-snapshot.test.js` | Converter output regression against `test/snapshots/` |

Tests use `describe` / `it` blocks from `node:test` and `assert.strictEqual` /
`assert.deepStrictEqual` from `node:assert/strict`.

### Integration tests (`test/integration/`, `test/*.integration.test.js`)

Integration tests exercise multi-module workflows and may create temporary files on disk:

| File | What it tests |
|------|---------------|
| `logging-integration.test.js` | Full error-logging pipeline (write → rotate → read → filter) |
| `osint-workflow.test.js` | OSINT skill end-to-end workflow orchestration |
| `recon-workflow.test.js` | Recon skill end-to-end workflow orchestration |
| `lint-failure-tracking.integration.test.js` | Lint error logging lifecycle |
| `lint-recovery.integration.test.js` | Lint recovery workflow |
| `staleness-workflow.integration.test.js` | Codebase staleness detection pipeline |
| `pd-status-workflow.integration.test.js` | `pd:status` end-to-end flow |

Integration tests may write to `.planning/logs/` in the project directory. They clean up after
themselves via `beforeEach`/`afterEach` hooks.

---

## Snapshot Tests

Snapshot tests catch regressions in the platform converters (Codex, Copilot, Gemini, OpenCode).

**How they work:**

1. `test/generate-snapshots.js` generates baseline output for all 4 platforms × all skills.
2. `test/smoke-snapshot.test.js` (and similar) re-runs converters and compares against saved
   snapshots in `test/snapshots/`.

**Regenerating snapshots** after an intentional converter change:

```bash
node test/generate-snapshots.js
```

Commit the updated snapshot files alongside the converter change so the diff is explicit and
reviewable.

---

## Evals Suite

The `evals/` suite uses **[promptfoo](https://promptfoo.dev)** to evaluate AI output quality —
specifically, whether Claude follows each skill's workflow correctly when invoked.

### What it tests

Two evaluation configs exist:

| Config | Purpose |
|--------|---------|
| `promptfooconfig.yaml` | **Workflow fidelity** — does Claude execute the correct steps in the correct order for each `pd:*` skill? Uses `llm-rubric` and `contains` assertions. |
| `evals/trigger-config.yaml` | **Trigger accuracy** — does a natural-language request route to the right skill? Tests true-positive and false-negative trigger cases. |

All 11 skills (`pd:init`, `pd:scan`, `pd:new-milestone`, `pd:plan`, `pd:write-code`, `pd:test`,
`pd:fix-bug`, `pd:complete-milestone`, `pd:what-next`, `pd:fetch-doc`, `pd:update`) are
classified as **Encoded Preference** skills, so evals focus on workflow step ordering and
output format consistency.

### Prerequisites

The eval suite calls the Anthropic API. Add your key to a `.env` file at the project root:

```bash
ANTHROPIC_API_KEY=sk-ant-...
```

Install `promptfoo` globally if not already present:

```bash
npm install -g promptfoo
```

### Running evals

```bash
# Workflow fidelity eval (default)
npm run eval

# Trigger accuracy eval only
npm run eval:trigger

# Full suite: workflow + trigger + save benchmark history
npm run eval:full

# Compare with saved benchmark history
npm run eval:compare

# Filter to a specific skill
npm run eval:filter -- "pd:init"

# Open the promptfoo web UI to browse results
npm run eval:view
```

### Benchmark history

`npm run eval:full` saves results to `evals/benchmarks/` with timestamped filenames. Use
`npm run eval:compare` to diff pass rates between runs — useful for tracking regressions when
skill files change.

---

## Writing New Tests

### For a new utility or library module

1. Create `test/smoke-<module-name>.test.js` (or `test/<module-name>.test.js`).
2. Follow the existing pattern — `require('node:test')` and `require('node:assert/strict')`:

```js
'use strict';

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { myFunction } = require('../bin/lib/my-module');

describe('myFunction', () => {
  it('returns expected value for valid input', () => {
    const result = myFunction('input');
    assert.equal(result, 'expected');
  });

  it('throws on invalid input', () => {
    assert.throws(() => myFunction(null), /expected error message/);
  });
});
```

3. Run your new test in isolation:

```bash
node --test test/smoke-my-module.test.js
```

### For a new platform converter

1. Add fixture input to `test/fixtures/<platform>/`.
2. Add assertions to `test/smoke-converters.test.js` (or a dedicated `smoke-<platform>.test.js`).
3. After verifying the converter output is correct, regenerate snapshots:

```bash
node test/generate-snapshots.js
```

### For a new `pd:*` skill

1. Add a new test case block to `promptfooconfig.yaml` following the existing pattern:

```yaml
- description: "pd:my-skill — describe the scenario"
  vars:
    skill_file: commands/pd/my-skill.md
    scenario: |
      <describe tool call results and project state>
  assert:
    - type: llm-rubric
      value: |
        Check that the response follows the correct workflow:
        1. MUST do step one
        2. MUST do step two
        ...
    - type: contains
      value: "expected_string"
```

2. Run `npm run eval:filter -- "pd:my-skill"` to validate the new test case before committing.

### For an integration workflow

1. Create `test/integration/<workflow-name>.test.js` or `test/<name>.integration.test.js`.
2. Use `beforeEach`/`afterEach` to clean up any files written to disk.
3. Import the modules under test directly — avoid spawning child processes unless testing the
   CLI binary itself.

---

## Test Environment Notes

- **Node.js built-in runner:** The `node --test` runner outputs TAP-compatible results. No
  test runner binary needs to be installed.
- **No CI pipeline detected** in this repository (no `.github/workflows/` directory). Tests
  are run locally before commits. If you set up CI, the recommended commands are `npm test`
  for the full suite and `npm run test:coverage` for coverage reporting.
- **Eval suite requires API key:** The `npm run eval*` commands call the Anthropic API and
  will fail with an explicit error if `ANTHROPIC_API_KEY` is not set. Do not run evals in
  environments without API access.
- **Temporary files:** Integration tests write to `.planning/logs/` inside the project root.
  These are cleaned up by test teardown hooks but may linger if a test run is interrupted.
  Safe to delete manually: `rm -rf .planning/logs/`.
- **Token baseline drift:** `test/drift-detector.test.js` compares converter output token
  counts against `test/baseline-tokens.json`. If skill content changes cause token counts to
  shift significantly, update the baseline file and commit it with a justification comment.
