# Phase 73: Verification & Edge Cases - Research

**Researched:** 2026-04-01
**Domain:** Smoke testing for standalone test mode verification
**Confidence:** HIGH

## Summary

This phase verifies the standalone test flow implemented in Phases 71-72 through automated smoke tests. The testing domain is straightforward: use the existing `node:test` framework (Node.js 24.13.0+), follow the established patterns in `smoke-integrity.test.js` and `smoke-state-machine.test.js`, and verify exactly 7 success criteria from ROADMAP.md.

The key challenge is mocking external dependencies (FastCode/Context7 MCP servers) and filesystem state without affecting the real project structure. The established pattern uses `os.tmpdir()` for temporary directories (per `smoke-state-machine.test.js`), which isolates tests from real `.planning/` state.

**Primary recommendation:** Write a single `test/smoke-standalone.test.js` file with 7 describe blocks (one per success criterion), using temp directories for filesystem fixtures and environment variable stubs for MCP availability simulation.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** Write smoke tests — not manual walkthrough. Tests run with existing `npm test` suite.
- **D-02:** All tests in single file: `test/smoke-standalone.test.js`. No file splitting, no adding to existing files.
- **D-03:** Verify exactly 7 success criteria from ROADMAP.md — no scope expansion.
- **D-04:** FastCode failure in standalone mode → warn + continue with Grep/Read fallback. No blocking.
- **D-05:** Context7 failure in standalone mode → skip completely. Not required in standalone.
- **D-06:** If bugs found during testing → document only, create bug report, no fixes in this phase.

### the agent's Discretion
- Internal structure of `smoke-standalone.test.js` (describe blocks, test order)
- How to mock FastCode/Context7 errors (stub vs env var vs temp file)
- Exact wording of warning message assertions

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope.

</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| All | Cross-cutting verification of TEST-01 through RECOV-01 | Smoke tests verify all prior requirements work together |

</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| node:test | Built-in | Test framework | Project standard (package.json: `node --test`) |
| node:assert/strict | Built-in | Assertions | Project standard (strict mode) |
| node:fs | Built-in | File operations | No external dependencies |
| node:os | Built-in | Temp directories | `os.tmpdir()` pattern from smoke-state-machine.test.js |
| node:path | Built-in | Path manipulation | Cross-platform paths |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| N/A | N/A | N/A | Project uses zero external test dependencies |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| node:test | Jest | Would add external dep; project deliberately uses built-ins only |
| os.tmpdir() | In-memory mocks | Less realistic; temp dirs match smoke-state-machine.test.js pattern |

**Installation:**
```bash
# No installation needed — all built-in modules
```

**Version verification:** Node.js v24.13.0 detected — `node:test` fully supported.

## Architecture Patterns

### Recommended Test File Structure
```
test/
├── smoke-standalone.test.js     # NEW — Phase 73 output
├── smoke-state-machine.test.js  # EXISTING — pattern reference
├── smoke-integrity.test.js      # EXISTING — pattern reference
└── ...
```

### Pattern 1: Temporary Directory Isolation
**What:** Each test creates isolated `.planning/` structure in temp dir
**When to use:** Tests that verify file creation, reading, or presence detection
**Example:**
```javascript
// Source: test/smoke-state-machine.test.js lines 18-36
function mkp(base, ...segments) {
  const dir = path.join(base, ...segments);
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

function writeFile(base, relPath, content) {
  const full = path.join(base, relPath);
  fs.mkdirSync(path.dirname(full), { recursive: true });
  fs.writeFileSync(full, content, 'utf8');
  return full;
}
```

### Pattern 2: State Simulation
**What:** Simulate command outputs without running actual workflows
**When to use:** Test workflow file parsing and pattern matching
**Example:**
```javascript
// Source: test/smoke-state-machine.test.js lines 467-483
function simTest(root, version, phaseNum, results) {
  const phase = `${version}.${phaseNum}`;
  const phaseDir = `.planning/milestones/${version}/phase-${phase}`;
  writeFile(root, `${phaseDir}/TEST_REPORT.md`, `# Test Report
> Date: 21_03_2026 16:00
> Total: ${results.length} tests | ✅ ${results.filter(r => r.pass).length} passed
`);
}
```

### Pattern 3: Bug Version Filtering
**What:** Verify standalone bugs are filtered separately from milestone bugs
**When to use:** Tests for what-next and complete-milestone behavior
**Example:**
```javascript
// Source: test/smoke-state-machine.test.js lines 82-103
function bugBelongsToVersion(patchVersion, milestoneVersion) {
  if (patchVersion === milestoneVersion) return true;
  // Standalone bugs use literal "standalone" — never matches version
  if (patchVersion === 'standalone') return false;
  const parts = patchVersion.split('.');
  if (parts.length === 3) {
    const base = `${parts[0]}.${parts[1]}`;
    return base === milestoneVersion;
  }
  return false;
}
```

### Anti-Patterns to Avoid
- **Testing real project files:** Never read/write actual `.planning/` — always use temp dirs
- **External process spawning:** Don't spawn `npm test` or similar — test file parsing and logic directly
- **Flaky time-based tests:** Use fixed timestamps in test fixtures, not `Date.now()`

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Temp dir cleanup | Manual `fs.rmSync` everywhere | `before`/`after` hooks | Consistent cleanup even on failures |
| Pattern matching | Custom regex | Extract from workflow files | Keep tests aligned with source |
| Assertion messages | Inline strings | Template with context | Better debugging on failure |

**Key insight:** Tests should verify behavior patterns from workflow files, not re-implement the workflow logic.

## Common Pitfalls

### Pitfall 1: Testing Implementation Instead of Behavior
**What goes wrong:** Tests become brittle, break on internal refactors
**Why it happens:** Verifying exact file content instead of presence/format
**How to avoid:** Test outcomes (file exists, contains required sections), not exact content
**Warning signs:** Tests fail on whitespace changes, comment updates

### Pitfall 2: Incomplete Temp Dir Cleanup
**What goes wrong:** Tests pass locally, fail in CI due to leftover state
**Why it happens:** Forgetting cleanup on test failures
**How to avoid:** Use `after()` hook unconditionally, not just in success path
**Warning signs:** Intermittent failures, different results between runs

### Pitfall 3: MCP Mock Leakage
**What goes wrong:** Mock affects other tests in the suite
**Why it happens:** Environment variable not restored after test
**How to avoid:** Save/restore pattern in before/after hooks
**Warning signs:** Tests pass in isolation, fail when run together

### Pitfall 4: Hardcoded Timestamps in Assertions
**What goes wrong:** Tests fail when date changes
**Why it happens:** Asserting exact timestamp match
**How to avoid:** Use regex patterns like `\d{8}_\d{6}` for timestamp format validation
**Warning signs:** Tests fail on first day of month, or after midnight

## Code Examples

Verified patterns from existing project tests:

### Test File Boilerplate
```javascript
// Source: test/smoke-integrity.test.js lines 1-12
/**
 * Smoke tests — Standalone Test Flow
 * Verifies standalone mode behavior from Phase 71-72.
 */

'use strict';

const { describe, it, before, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const os = require('os');
```

### Temp Directory Setup
```javascript
// Source: test/smoke-state-machine.test.js lines 17-36
const ROOT = path.join(os.tmpdir(), `smoke-standalone-${Date.now()}`);

before(() => {
  fs.mkdirSync(ROOT, { recursive: true });
});

after(() => {
  fs.rmSync(ROOT, { recursive: true, force: true });
});
```

### Standalone Report Pattern Detection
```javascript
// Pattern from workflows/test.md Step S7 + what-next.md Step 3 sub-step 8
describe('Standalone report detection', () => {
  it('glob finds STANDALONE_TEST_REPORT_*.md in .planning/reports/', () => {
    const reportsDir = path.join(ROOT, '.planning', 'reports');
    fs.mkdirSync(reportsDir, { recursive: true });
    fs.writeFileSync(
      path.join(reportsDir, 'STANDALONE_TEST_REPORT_20260401_143022.md'),
      `# Standalone Test Report\n> Mode: Standalone\n> Target: src/users`
    );
    
    const files = fs.readdirSync(reportsDir)
      .filter(f => f.startsWith('STANDALONE_TEST_REPORT_'));
    assert.equal(files.length, 1);
    assert.match(files[0], /^STANDALONE_TEST_REPORT_\d{8}_\d{6}\.md$/);
  });
});
```

### Standalone Bug Filtering
```javascript
// Pattern from complete-milestone.md Step 3 + what-next.md Step 2
describe('Standalone bug filtering', () => {
  it('standalone bugs have literal "Patch version: standalone"', () => {
    const bugContent = `# Bug Report (from standalone testing)

> Date: 01_04_2026 14:30:00 | Severity: High
> Status: Unresolved | Feature: Auth | Target: src/auth
> Patch version: standalone | Fix attempts: 0
`;
    const patchMatch = bugContent.match(/Patch version:\s*(\S+)/);
    assert.ok(patchMatch);
    assert.equal(patchMatch[1], 'standalone');
  });

  it('standalone bugs do not belong to any milestone version', () => {
    assert.equal(bugBelongsToVersion('standalone', '7.0'), false);
    assert.equal(bugBelongsToVersion('7.0.1', '7.0'), true);
  });
});
```

### Auto-Detection Simulation
```javascript
// Pattern from workflows/test.md Step S2
describe('Stack auto-detection', () => {
  it('detects NestJS from nest-cli.json', () => {
    fs.writeFileSync(path.join(ROOT, 'nest-cli.json'), '{}');
    
    // Simulate detection logic
    const hasNestCli = fs.existsSync(path.join(ROOT, 'nest-cli.json'));
    assert.ok(hasNestCli, 'nest-cli.json should trigger NestJS detection');
  });

  it('detects NestJS from package.json @nestjs/core', () => {
    fs.writeFileSync(path.join(ROOT, 'package.json'), JSON.stringify({
      dependencies: { '@nestjs/core': '^10.0.0' }
    }));
    
    const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8'));
    const hasNestCore = pkg.dependencies?.['@nestjs/core'] || 
                        pkg.devDependencies?.['@nestjs/core'];
    assert.ok(hasNestCore, '@nestjs/core should trigger NestJS detection');
  });
});
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| External test libraries | node:test built-in | Node 18+ | Zero dependencies, faster CI |
| assert module | assert/strict | Always | Stricter equality, better errors |
| Manual cleanup | rmSync recursive | Node 14.14+ | Single-line cleanup |

**Deprecated/outdated:**
- N/A — project uses modern Node.js built-ins only

## Open Questions

1. **How to mock FastCode/Context7 unavailability?**
   - What we know: Tests need to verify fallback behavior when MCPs fail
   - What's unclear: Whether to use env vars, function stubs, or file flags
   - Recommendation: Use function extraction pattern — read workflow logic into testable functions, call with mock data. Don't try to mock actual MCP calls.

2. **Integration vs Unit scope?**
   - What we know: Phase 73 tests are "smoke tests" — verify workflows work together
   - What's unclear: How deep to test each workflow
   - Recommendation: Test file presence and format patterns, not workflow execution logic. Scope to "can I detect this state correctly?" not "does the workflow run correctly?"

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | node:test (built-in, Node 24.13.0) |
| Config file | None — uses `node --test` glob |
| Quick run command | `node --test test/smoke-standalone.test.js` |
| Full suite command | `npm test` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| SC-1 | Standard flow with ✅ task works | smoke | `node --test test/smoke-standalone.test.js` | ❌ Wave 0 |
| SC-2 | Standalone creates report, handles errors | smoke | `node --test test/smoke-standalone.test.js` | ❌ Wave 0 |
| SC-3 | Auto-detect stack when no CONTEXT.md | smoke | `node --test test/smoke-standalone.test.js` | ❌ Wave 0 |
| SC-4 | FastCode/Context7 soft fallback | smoke | `node --test test/smoke-standalone.test.js` | ❌ Wave 0 |
| SC-5 | what-next shows standalone reports/bugs | smoke | `node --test test/smoke-standalone.test.js` | ❌ Wave 0 |
| SC-6 | complete-milestone skips standalone bugs | smoke | `node --test test/smoke-standalone.test.js` | ❌ Wave 0 |
| SC-7 | Existing tests still pass | regression | `npm test` | ✅ Existing |

### Sampling Rate
- **Per task commit:** `node --test test/smoke-standalone.test.js`
- **Per wave merge:** `npm test`
- **Phase gate:** Full suite green before `/gsd-verify-work`

### Wave 0 Gaps
- [ ] `test/smoke-standalone.test.js` — covers all 7 success criteria (this phase's main deliverable)

*(Framework install not needed — node:test is built-in)*

## Sources

### Primary (HIGH confidence)
- `test/smoke-integrity.test.js` — Existing test pattern, lines 1-150
- `test/smoke-state-machine.test.js` — Temp dir pattern, state simulation, lines 1-500
- `workflows/test.md` — Standalone flow Steps S0-S8, lines 17-512
- `workflows/what-next.md` — Priority 5.7, standalone detection, lines 1-107
- `workflows/complete-milestone.md` — Bug filtering Step 3, lines 1-100
- `.planning/phases/71-core-standalone-flow/71-CONTEXT.md` — D-06, D-07, D-11, D-13
- `.planning/phases/72-system-integration-sync/72-CONTEXT.md` — D-04, D-08/D-09

### Secondary (MEDIUM confidence)
- Node.js v24.13.0 docs — node:test API (verified via `node --version`)

### Tertiary (LOW confidence)
- None

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all built-in modules, verified in package.json and existing tests
- Architecture: HIGH — directly extracted from smoke-state-machine.test.js patterns
- Pitfalls: HIGH — based on actual project test failures and established patterns

**Research date:** 2026-04-01
**Valid until:** 2026-05-01 (30 days — stable test patterns, Node.js built-ins)
