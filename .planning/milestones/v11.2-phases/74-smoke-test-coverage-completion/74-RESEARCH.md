# Phase 74: Smoke Test Coverage Completion - Research

**Researched:** 2026-04-01
**Domain:** Test coverage gaps / Node.js test framework (node:test)
**Confidence:** HIGH

## Summary

Phase 74 closes smoke test coverage gaps identified in the v7.0 Milestone Audit. Two requirements (RECOV-01, SYNC-01) have working implementations but lack test assertions — this phase adds those tests. Additionally, a cosmetic typo in SC-4 test #2 description needs correction.

All changes are constrained to a single file: `test/smoke-standalone.test.js`. The existing test patterns use Node.js built-in test runner (`node:test`) with `node:assert/strict`. No external test libraries are required.

**Primary recommendation:** Add 2 new tests (RECOV-01 recovery logic, SYNC-01 prerequisites row), fix 1 test description typo. Run `node --test test/smoke-standalone.test.js` to verify all 33 tests pass.

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| RECOV-01 | Step S0.5 recovery logic must be tested | Exact strings identified: `KEEP`, `NEW`, `REWRITE` prompt patterns in workflows/test.md lines 32-41 |
| SYNC-01 | state-machine.md standalone prerequisites row must be tested | Exact pattern: `\`/pd:test --standalone\`` with `—` in Required/If-missing columns (line 53) |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| node:test | 22.x (built-in) | Test runner | Node.js native, zero dependencies |
| node:assert/strict | 22.x (built-in) | Assertions | Strict equality by default |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| fs | built-in | File reading | Read workflow files for pattern assertions |
| path | built-in | Path resolution | Build absolute paths to workflow files |
| os | built-in | Temp directories | Create isolated test fixtures |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| node:test | Jest/Mocha | Extra dependency — project already uses node:test exclusively |

**Verification:** The project already uses `node:test` in all `test/*.test.js` files. No installation needed.

## Architecture Patterns

### Existing Test Structure in smoke-standalone.test.js
```
test/smoke-standalone.test.js
├── Helpers (mkp, writeFile, fileExists, bugBelongsToVersion)
├── Path constants (REPO_ROOT, TEST_WORKFLOW, WHAT_NEXT_WORKFLOW, COMPLETE_MILESTONE_WORKFLOW)
├── Setup/Teardown (before/after hooks)
├── describe('SC-1: Standard flow routing')       — 3 tests
├── describe('SC-2: Standalone report creation')  — 5 tests
├── describe('SC-3: Auto-detect stack...')        — 6 tests
├── describe('SC-4: FastCode/Context7...')        — 3 tests  ← TYPO FIX HERE
├── describe('SC-5: what-next shows...')          — 3 tests
├── describe('SC-6: complete-milestone skips...') — 6 tests
└── describe('SC-7: Existing tests...')           — 5 tests
```

### Pattern 1: Workflow File Assertion
**What:** Read a markdown workflow file and assert a string/pattern exists
**When to use:** Verifying that workflow prose contains required instructions
**Example from SC-1:**
```javascript
it('standard flow guard: workflow routes via --standalone flag detection', () => {
  const content = fs.readFileSync(TEST_WORKFLOW, 'utf8');
  assert.ok(
    content.includes('--standalone'),
    'test.md must contain --standalone routing logic'
  );
});
```

### Pattern 2: Reference File Assertion
**What:** Read a reference markdown file (like state-machine.md) and assert table row content
**When to use:** Verifying cross-system wiring in reference documentation
**Example (new for SYNC-01):**
```javascript
it('state-machine.md has standalone prerequisites row with no requirements', () => {
  const content = fs.readFileSync(STATE_MACHINE_REF, 'utf8');
  // Line: | `/pd:test --standalone`  | —                | — |
  assert.ok(
    content.includes('/pd:test --standalone'),
    'state-machine.md must list /pd:test --standalone in prerequisites table'
  );
  // Verify "— / —" pattern (no prerequisites, no fallback)
  const lines = content.split('\n');
  const standaloneRow = lines.find(l => l.includes('/pd:test --standalone'));
  assert.ok(standaloneRow, 'standalone prerequisites row must exist');
  const dashCount = (standaloneRow.match(/—/g) || []).length;
  assert.ok(dashCount >= 2, 'standalone row must have at least 2 em-dashes (—) indicating no prerequisites');
});
```

### Anti-Patterns to Avoid
- **Testing implementation instead of behavior:** Don't check line numbers or exact whitespace — check semantic content
- **Over-specifying:** Don't require exact match of entire row — check key markers (`/pd:test --standalone`, `—`)

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Test framework | Custom assertion library | node:test + node:assert/strict | Built-in, zero deps, project standard |
| File reading | Complex parsing | fs.readFileSync + string includes | Simple pattern matching sufficient |

**Key insight:** Smoke tests verify wiring exists, not correctness of behavior. String presence checks are intentionally shallow.

## Common Pitfalls

### Pitfall 1: Test description doesn't match test logic
**What goes wrong:** SC-4 test #2 says "absent" but test asserts the pattern IS present
**Why it happens:** Copy-paste error or logic changed without updating description
**How to avoid:** Always read the assertion logic when writing the description
**Warning signs:** `assert.ok(X)` with description saying "X absent"

### Pitfall 2: Overly brittle string matching
**What goes wrong:** Test breaks when whitespace or formatting changes
**Why it happens:** Using exact string match instead of semantic markers
**How to avoid:** Use `.includes()` for key terms, not exact line matches
**Warning signs:** Tests failing after cosmetic markdown reformatting

### Pitfall 3: Missing path constant
**What goes wrong:** New workflow file not defined in path constants section
**Why it happens:** Forgetting to add `STATE_MACHINE_REF` constant before use
**How to avoid:** Add path constant at top of file with other workflow paths
**Warning signs:** `ReferenceError: STATE_MACHINE_REF is not defined`

## Code Examples

### RECOV-01: Step S0.5 Recovery Logic Test
```javascript
// Source: workflows/test.md lines 28-43
// Content to assert exists in test.md:
//   "Step S0.5: Standalone recovery check"
//   "1. KEEP — view and stop | 2. NEW — create a fresh test run"
//   "1. KEEP — run tests only (skip writing) | 2. REWRITE from scratch"

it('Step S0.5 recovery check defines KEEP/NEW and KEEP/REWRITE options', () => {
  const content = fs.readFileSync(TEST_WORKFLOW, 'utf8');
  assert.ok(
    content.includes('Step S0.5') || content.includes('Step S0.5:'),
    'test.md must define Step S0.5 for recovery check'
  );
  // Check for recovery prompt patterns
  assert.ok(
    content.includes('KEEP') && content.includes('NEW'),
    'Step S0.5 must offer KEEP/NEW choice for existing reports'
  );
  assert.ok(
    content.includes('REWRITE'),
    'Step S0.5 must offer REWRITE choice for uncommitted test files'
  );
});
```

### SYNC-01: State-Machine Prerequisites Row Test
```javascript
// Source: references/state-machine.md line 53
// Content: | `/pd:test --standalone`  | —     | —   |
// The em-dash (—) indicates "no prerequisites" and "always runnable"

const STATE_MACHINE_REF = path.join(REPO_ROOT, 'references', 'state-machine.md');

it('state-machine.md has standalone prerequisites row with no requirements', () => {
  const content = fs.readFileSync(STATE_MACHINE_REF, 'utf8');
  assert.ok(
    content.includes('/pd:test --standalone'),
    'state-machine.md must list /pd:test --standalone in prerequisites table'
  );
  // Find the row and verify it has em-dashes for "no prerequisites"
  const lines = content.split('\n');
  const row = lines.find(l => l.includes('/pd:test --standalone'));
  assert.ok(row, 'standalone prerequisites row must exist');
  // Row should contain em-dashes (—) indicating no requirements
  assert.ok(
    row.includes('—'),
    'standalone row must have em-dash (—) indicating no prerequisites'
  );
});
```

### SC-4 Typo Fix
```javascript
// BEFORE (line 241):
it('FastCode failure must not block flow — DO NOT STOP pattern absent for FastCode', () => {

// AFTER:
it('FastCode failure must not block flow — DO NOT STOP pattern present for FastCode', () => {
```

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | node:test (Node.js 22.x built-in) |
| Config file | none — uses Node.js defaults |
| Quick run command | `node --test test/smoke-standalone.test.js` |
| Full suite command | `node --test 'test/*.test.js'` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| RECOV-01 | Step S0.5 recovery prompt logic | smoke | `node --test test/smoke-standalone.test.js` | ❌ Add to SC-1 |
| SYNC-01 | state-machine.md prerequisites row | smoke | `node --test test/smoke-standalone.test.js` | ❌ Add new SC-8 |

### Exact Strings to Assert

**RECOV-01 (workflows/test.md lines 28-43):**
- `Step S0.5` — section header
- `KEEP` — recovery option keyword
- `NEW` — recovery option keyword (for existing reports)
- `REWRITE` — recovery option keyword (for uncommitted test files)

**SYNC-01 (references/state-machine.md line 53):**
- `/pd:test --standalone` — command in prerequisites table
- `—` (em-dash) — appears at least twice indicating "no prerequisites" and "always runnable"

### Where to Add New Tests

| Requirement | Recommended Location | Rationale |
|-------------|---------------------|-----------|
| RECOV-01 | Inside `describe('SC-1: Standard flow routing')` | Recovery is part of routing logic (Step S0.5 routes to S1) |
| SYNC-01 | New `describe('SC-8: state-machine.md prerequisites')` | Separate file (state-machine.md), distinct from workflow tests |

**Alternative for SYNC-01:** Could add to SC-1 since it's "routing-adjacent", but a separate SC-8 block keeps concerns cleanly separated and matches the pattern of one SC-* per behavior domain.

### SC-4 Typo Location
- **File:** `test/smoke-standalone.test.js`
- **Line:** 241
- **Current:** `it('FastCode failure must not block flow — DO NOT STOP pattern absent for FastCode', () => {`
- **Correct:** `it('FastCode failure must not block flow — DO NOT STOP pattern present for FastCode', () => {`

### Sampling Rate
- **Per task commit:** `node --test test/smoke-standalone.test.js`
- **Per wave merge:** `node --test 'test/*.test.js'`
- **Phase gate:** Full suite green before `/gsd-verify-work`

### Wave 0 Gaps
None — existing test infrastructure covers all phase requirements. Only new test cases needed.

## Sources

### Primary (HIGH confidence)
- `test/smoke-standalone.test.js` — current test patterns (31 tests, 7 describe blocks)
- `workflows/test.md` lines 28-43 — Step S0.5 recovery logic (exact strings)
- `references/state-machine.md` line 53 — standalone prerequisites row (exact pattern)
- `.planning/v7.0-MILESTONE-AUDIT.md` — gap identification source

### Secondary (MEDIUM confidence)
- Node.js documentation for `node:test` module

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — project already uses node:test exclusively
- Architecture: HIGH — patterns directly observed in existing file
- Pitfalls: HIGH — typo already identified, patterns are straightforward

**Research date:** 2026-04-01
**Valid until:** 2026-05-01 (stable — test patterns unlikely to change)
