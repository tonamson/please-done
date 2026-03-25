# Testing

## Framework

- **Test runner:** Node.js built-in `node:test` (no external test framework)
- **Assertions:** `node:assert/strict`
- **No devDependencies** — zero external test dependencies
- **Node requirement:** `>=16.7.0`

## Running Tests

```bash
# All tests
npm test                          # node --test 'test/*.test.js'

# Individual suites
npm run test:converters           # smoke-converters.test.js
npm run test:installers           # smoke-installers.test.js
npm run test:utils                # smoke-utils.test.js
npm run test:state                # smoke-state-machine.test.js
npm run test:platforms            # smoke-all-platforms.test.js
```

## Test Structure

All tests are in `test/` directory with `smoke-` prefix:

| File | Purpose | What it tests |
|------|---------|---------------|
| `smoke-integrity.test.js` | Repo integrity | Consistency between commands/workflows/templates/references; converter handles all real skills |
| `smoke-converters.test.js` | Converter output | 4 converters (codex, copilot, gemini, opencode) — path conversion, skill references, tool name mapping, frontmatter |
| `smoke-installers.test.js` | Installer behavior | Platform-specific installation logic |
| `smoke-utils.test.js` | Utility functions | `parseFrontmatter`, `buildFrontmatter`, `extractXmlSection`, `extractReadingRefs`, `inlineWorkflow`, `listSkillFiles`, `fileHash`, `platforms`, `manifest` |
| `smoke-state-machine.test.js` | State machine | Planning state interactions across full lifecycle via `.planning/` files |
| `smoke-all-platforms.test.js` | Cross-platform | End-to-end tests across all supported platforms |

## Test Patterns

### Import Style
```javascript
'use strict';
const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
```

### Test Organization
- Tests grouped by `describe()` blocks per function/module
- Individual tests via `it()` with Vietnamese description strings
- Sample data defined as constants at top of file

### Fixture Strategy
- **In-memory fixtures:** Sample skill content as string constants (e.g., `SAMPLE_SKILL`)
- **Temp directories:** `os.tmpdir()` for tests needing filesystem (state machine tests)
- **Real repo files:** Integrity tests read actual `commands/`, `workflows/`, `templates/` directories
- No fixture files on disk — all test data is inline

### Assertion Style
```javascript
assert.equal(frontmatter.name, 'test');
assert.match(body, /Body content/);
assert.ok(result.length > 0);
```

### Cleanup
- State machine tests use `before`/`after` hooks with temp directories
- No global setup/teardown needed

## Eval Framework

Separate from unit tests — `evals/` directory for prompt quality evaluation:

```bash
npm run eval              # Standard eval run
npm run eval:trigger      # Trigger-specific eval
npm run eval:full         # Full evaluation suite
npm run eval:compare      # Compare results
npm run eval:view         # Open promptfoo viewer
npm run eval:filter       # Filter by pattern
```

Uses `promptfoo` (external tool) with `promptfooconfig.yaml` for configuration.

## Benchmark

`test/benchmark.js` — performance benchmarking (not part of test suite, run manually).

## Coverage

No coverage tooling configured. Tests are smoke-level — they verify critical paths work, not exhaustive branch coverage.

## Test Naming Convention

Pattern: `smoke-{area}.test.js`
- `smoke-` prefix indicates lightweight verification tests
- `{area}` describes the module/concern being tested
- `.test.js` suffix for Node.js test runner discovery
