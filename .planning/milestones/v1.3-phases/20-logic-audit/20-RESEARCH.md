# Phase 20: Logic Audit - Research

**Researched:** 2026-03-24
**Domain:** plan-checker.js refactoring — split CHECK-04, add CHECK-05
**Confidence:** HIGH

## Summary

Phase 20 adds CHECK-05 (`checkLogicCoverage`) to the plan-checker module by splitting the existing CHECK-04 bidirectional check into two separate checks. CHECK-04 retains Direction 1 (Truth without task = BLOCK), while CHECK-05 handles Direction 2 (Task without Truth = configurable severity, default WARN). This is a surgical refactoring of approximately 50 lines of existing code plus adding a new function, updating `runAllChecks()`, exports, and the reference spec.

The existing codebase is well-structured: 987 lines in `plan-checker.js`, 147 passing tests in `node:test` framework, pure function architecture with consistent result format `{ checkId, status, issues[] }`. The split is straightforward because Direction 1 and Direction 2 logic are already clearly separated in the current `checkTruthTaskCoverage()` function (lines 674-696).

**Primary recommendation:** Extract Direction 2 logic (lines 686-696) from `checkTruthTaskCoverage()` into new `checkLogicCoverage()` function with configurable severity, add to `runAllChecks()` array, export, update reference spec and name mapping in `workflows/plan.md`.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** Tach CHECK-04 thanh 2 checks rieng: CHECK-04 giu Direction 1 (Truth khong co task -> BLOCK), CHECK-05 moi lam Direction 2 (Task khong co Truth -> configurable severity)
- **D-02:** CHECK-05 function name: `checkLogicCoverage` (theo AUDIT-01 spec)
- **D-03:** CHECK-04 `checkTruthTaskCoverage()` thu hep scope: chi giu Direction 1 (Truth->Task). Direction 2 code di chuyen sang CHECK-05
- **D-04:** CHECK-05 severity mac dinh WARN — cho phep plan pass voi warning. Task thieu Truths = technical debt, khong block
- **D-05:** CHECK-05 severity configurable: du an strict co the nang len BLOCK qua plan-checker config/parameter. Phase 17 D-05/D-06 tinh than giu nguyen nhung thuc thi linh hoat hon
- **D-06:** Orphan reporting chi trong PASS table — nhat quan voi cac checks khac, khong tao artifact moi. Issues list ghi ro tasks mo coi nao thieu Truth mapping

### Claude's Discretion
- Config mechanism cho severity override (parameter, env var, hoac plan-checker config)
- Test structure va coverage cho CHECK-05
- Cach refactor CHECK-04 code ma khong break existing 147 tests
- Dynamic PASS table name mapping cho CHECK-05

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| AUDIT-01 | plan-checker.js co ham checkLogicCoverage (CHECK-05) — WARN cho tasks thieu Truths, BLOCK cho Truths thieu tasks. Code "mo coi" = Technical Debt | Existing `checkTruthTaskCoverage()` at line 649 contains both Direction 1 and Direction 2 logic. Direction 2 (lines 686-696) extracts cleanly into `checkLogicCoverage()`. CHECK-04 retains Direction 1 (BLOCK). CHECK-05 gets Direction 2 (default WARN, configurable). |
</phase_requirements>

## Architecture Patterns

### Current CHECK-04 Structure (to be split)

```
checkTruthTaskCoverage(planContent, tasksContent)
├── Format detection (v1.0/unknown → graceful PASS)
├── Parse truths via parseTruthsV11(planContent)
├── Parse tasks via parseTaskDetailBlocksV11(tasksContent)
├── Direction 1: Truth without task → BLOCK (lines 674-684)    ← KEEP in CHECK-04
└── Direction 2: Task without Truth → BLOCK (lines 686-696)    ← MOVE to CHECK-05 as WARN
```

### Target Architecture (after split)

```
checkTruthTaskCoverage(planContent, tasksContent)        // CHECK-04 — Direction 1 only
├── Format detection (v1.0/unknown → graceful PASS)
├── Parse truths + tasks (reuse existing parsers)
└── Truth without task → BLOCK

checkLogicCoverage(planContent, tasksContent, options)   // CHECK-05 — Direction 2 only
├── Format detection (v1.0/unknown → graceful PASS)
├── Parse truths + tasks (reuse existing parsers)
├── Task without Truth → severity from options (default 'warn')
└── Return { checkId: 'CHECK-05', status, issues[] }
```

### Pattern: Pure Function with Result Object
**What:** Every check function is pure — receives content strings, returns result object.
**Established pattern from all 7 existing checks:**
```javascript
// Source: bin/lib/plan-checker.js line 650 (CHECK-04 pattern)
function checkFunctionName(planContent, tasksContent) {
  const result = { checkId: 'CHECK-XX', status: 'pass', issues: [] };
  const format = detectPlanFormat(planContent);

  // Graceful PASS for v1.0/unknown
  if (format === 'v1.0' || format === 'unknown') return result;
  if (!tasksContent) return result;

  // Parse inputs
  const truths = parseTruthsV11(planContent);
  const tasks = parseTaskDetailBlocksV11(tasksContent);

  // Check logic...
  // Push to result.issues

  result.status = result.issues.length > 0 ? 'block' : 'pass';
  return result;
}
```

### Pattern: Configurable Severity (Claude's Discretion)
**Recommendation:** Add optional `options` parameter with `severity` field.

```javascript
// CHECK-05: checkLogicCoverage with configurable severity
function checkLogicCoverage(planContent, tasksContent, options = {}) {
  const severity = options.severity || 'warn';  // default WARN per D-04
  const result = { checkId: 'CHECK-05', status: 'pass', issues: [] };
  const format = detectPlanFormat(planContent);

  if (format === 'v1.0' || format === 'unknown') return result;
  if (!tasksContent) return result;

  const tasks = parseTaskDetailBlocksV11(tasksContent);

  for (const task of tasks) {
    if (task.truths.length === 0) {
      result.issues.push({
        message: `Task ${task.id} khong co Truth nao map — technical debt`,
        location: `TASKS.md Task ${task.id}`,
        fixHint: `Them > Truths: [TX] vao metadata cua Task ${task.id}`
      });
    }
  }

  result.status = result.issues.length > 0 ? severity : 'pass';
  return result;
}
```

**Why `options` parameter:** Consistent with JavaScript patterns. `runAllChecks()` can pass severity from config/env. No breaking change to existing call sites (none yet for new function).

### Pattern: runAllChecks Integration
**What:** Add CHECK-05 to the checks array in `runAllChecks()`.

```javascript
// Source: bin/lib/plan-checker.js line 936
function runAllChecks({ planContent, tasksContent, requirementIds, checkOptions }) {
  const checks = [
    checkRequirementCoverage(planContent, requirementIds),
    checkTaskCompleteness(planContent, tasksContent),
    checkDependencyCorrectness(planContent, tasksContent),
    checkTruthTaskCoverage(planContent, tasksContent),           // CHECK-04 (Direction 1 only)
    checkLogicCoverage(planContent, tasksContent, checkOptions),  // CHECK-05 (Direction 2)
    checkKeyLinks(planContent, tasksContent),
    checkScopeThresholds(planContent, tasksContent),
    checkEffortClassification(planContent, tasksContent),
  ];
  // ... rest unchanged
}
```

**Consideration:** `runAllChecks` currently takes `{ planContent, tasksContent, requirementIds }`. Adding `checkOptions` (or a narrower `check05Severity`) keeps backward compatibility since it is optional.

### Anti-Patterns to Avoid
- **Breaking CHECK-04 test expectations:** Current tests expect CHECK-04 to BLOCK on Direction 2. After split, those tests must be updated to test CHECK-05 instead, and CHECK-04 tests must only check Direction 1.
- **Duplicating parse logic:** Both CHECK-04 and CHECK-05 call `parseTruthsV11()` and `parseTaskDetailBlocksV11()`. This is acceptable (pure functions, cheap). Do NOT try to share parsed state between checks — it breaks the pure function pattern.
- **Hardcoding severity:** D-05 says configurable. Do not hardcode 'warn' — accept it as parameter with 'warn' default.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Truth parsing | New parser | `parseTruthsV11()` (line 125) | Already tested, handles v1.1 and v1.3 table formats |
| Task parsing | New parser | `parseTaskDetailBlocksV11()` (line 144) | Already tested, extracts truths refs |
| Truth ref parsing | New parser | `parseTruthRefs()` (line 191) | Already used by parseTaskDetailBlocksV11 |
| Format detection | New detector | `detectPlanFormat()` (line 416) | Already handles v1.0/v1.1/unknown |

**Key insight:** CHECK-05 reuses 100% of existing parsers. The only new code is the check function itself and the severity config pass-through.

## Common Pitfalls

### Pitfall 1: Breaking Direction 1 Tests When Splitting CHECK-04
**What goes wrong:** Existing CHECK-04 tests for "Task has no Truth mapping -> block" will fail because that behavior moves to CHECK-05.
**Why it happens:** 3 specific tests in the `CHECK-04: truthTaskCoverage` describe block test Direction 2 behavior:
- `'v1.1 Task has no Truth mapping -> block (not warn)'` (line 697) — must move to CHECK-05 section and change expected severity
- `'v1.1 Direction 2 message does NOT contain "(co the la infrastructure task)"'` (line 713) — must move to CHECK-05 section
- The "block (not warn)" test will become "warn (default)" in CHECK-05
**How to avoid:** Identify all Direction 2 tests before code changes. Move them to a new `describe('CHECK-05: logicCoverage')` block. Update expected `checkId` to `'CHECK-05'` and expected `status` to `'warn'`.
**Warning signs:** Tests referencing `Task N khong co Truth nao map` under CHECK-04 describe block.

### Pitfall 2: runAllChecks Combined Result Count Changes
**What goes wrong:** Tests that assert `result.checks.length === 7` will fail when CHECK-05 makes it 8.
**Why it happens:** `runAllChecks` returns all check results. Adding CHECK-05 increases array length.
**How to avoid:** Search for assertions on checks array length or checks count. Update from 7 to 8.
**Warning signs:** Grep for `.length === 7` or `checks.length` in test file.

### Pitfall 3: PASS Table Name Mapping Not Updated
**What goes wrong:** Workflow displays CHECK-05 without a human-readable name.
**Why it happens:** `workflows/plan.md` line 330-337 has hardcoded name mapping. Missing CHECK-05 entry means agents display raw checkId.
**How to avoid:** Add `- CHECK-05 = Logic Coverage` to the mapping list.
**Warning signs:** Plan checker passes but workflow output shows "CHECK-05" instead of "CHECK-05: Logic Coverage".

### Pitfall 4: Severity Override Not Reaching CHECK-05
**What goes wrong:** Even when severity is configured as BLOCK, CHECK-05 still returns 'warn'.
**Why it happens:** `runAllChecks()` doesn't pass options through to `checkLogicCoverage()`.
**How to avoid:** Ensure `runAllChecks` signature accepts and forwards severity configuration.
**Warning signs:** Integration tests pass CHECK-05 options but function ignores them.

## Code Examples

### Example 1: Refactored CHECK-04 (Direction 1 only)

```javascript
// Source: derived from bin/lib/plan-checker.js line 649
function checkTruthTaskCoverage(planContent, tasksContent) {
  const result = { checkId: 'CHECK-04', status: 'pass', issues: [] };
  const format = detectPlanFormat(planContent);

  if (format === 'v1.0' || format === 'unknown') return result;
  if (!tasksContent) return result;

  const truths = parseTruthsV11(planContent);
  const tasks = parseTaskDetailBlocksV11(tasksContent);

  if (truths.length === 0) return result;

  // Collect all truth refs from all tasks
  const coveredTruths = new Set();
  for (const task of tasks) {
    for (const truthRef of task.truths) {
      coveredTruths.add(truthRef);
    }
  }

  // Direction 1 ONLY: Truth without any task -> BLOCK
  for (const truth of truths) {
    if (!coveredTruths.has(truth.id)) {
      result.issues.push({
        message: `Truth ${truth.id} "${truth.description}" khong co task nao map`,
        location: `PLAN.md Truths table`,
        fixHint: `Them ${truth.id} vao Truths metadata cua mot task trong TASKS.md`
      });
    }
  }

  result.status = result.issues.length > 0 ? 'block' : 'pass';
  return result;
}
```

### Example 2: New CHECK-05 checkLogicCoverage

```javascript
// New function — CHECK-05: Logic Coverage (Direction 2)
function checkLogicCoverage(planContent, tasksContent, options = {}) {
  const severity = options.severity || 'warn';
  const result = { checkId: 'CHECK-05', status: 'pass', issues: [] };
  const format = detectPlanFormat(planContent);

  if (format === 'v1.0' || format === 'unknown') return result;
  if (!tasksContent) return result;

  const tasks = parseTaskDetailBlocksV11(tasksContent);

  // Direction 2: Task without any Truth -> configurable severity
  for (const task of tasks) {
    if (task.truths.length === 0) {
      result.issues.push({
        message: `Task ${task.id} khong co Truth nao map — technical debt`,
        location: `TASKS.md Task ${task.id}`,
        fixHint: `Them > Truths: [TX] vao metadata cua Task ${task.id}`
      });
    }
  }

  result.status = result.issues.length > 0 ? severity : 'pass';
  return result;
}
```

### Example 3: Updated runAllChecks

```javascript
function runAllChecks({ planContent, tasksContent, requirementIds, check05Severity }) {
  const checks = [
    checkRequirementCoverage(planContent, requirementIds),
    checkTaskCompleteness(planContent, tasksContent),
    checkDependencyCorrectness(planContent, tasksContent),
    checkTruthTaskCoverage(planContent, tasksContent),
    checkLogicCoverage(planContent, tasksContent, { severity: check05Severity }),
    checkKeyLinks(planContent, tasksContent),
    checkScopeThresholds(planContent, tasksContent),
    checkEffortClassification(planContent, tasksContent),
  ];

  const hasBlock = checks.some(c => c.status === 'block');
  const hasWarn = checks.some(c => c.status === 'warn');
  const overall = hasBlock ? 'block' : hasWarn ? 'warn' : 'pass';

  return { overall, checks };
}
```

## Files Inventory

| File | Action | Lines Affected |
|------|--------|----------------|
| `bin/lib/plan-checker.js` | Refactor CHECK-04 (remove Direction 2), add CHECK-05 function, update `runAllChecks()`, update exports, update module comment | ~50 lines changed/added |
| `test/smoke-plan-checker.test.js` | Split CHECK-04 tests, add CHECK-05 test suite, update runAllChecks tests | ~40-60 lines changed/added |
| `references/plan-checker.md` | Add CHECK-05 rule section, update CHECK-04 section, update severity table | ~30 lines added/changed |
| `workflows/plan.md` | Add CHECK-05 to name mapping | 1 line added |
| Snapshot files (test/snapshots/*/plan.md) | Update name mapping if present | 1 line per snapshot |

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | node:test (built-in, Node.js) |
| Config file | none (built-in) |
| Quick run command | `node --test test/smoke-plan-checker.test.js` |
| Full suite command | `node --test 'test/*.test.js'` |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| AUDIT-01a | CHECK-05 returns WARN for task without Truth (default severity) | unit | `node --test test/smoke-plan-checker.test.js` | Needs new tests in existing file |
| AUDIT-01b | CHECK-05 returns BLOCK when severity overridden | unit | `node --test test/smoke-plan-checker.test.js` | Needs new tests in existing file |
| AUDIT-01c | CHECK-04 retains Direction 1 BLOCK behavior | unit | `node --test test/smoke-plan-checker.test.js` | Existing tests (modify expectations) |
| AUDIT-01d | CHECK-04 no longer BLOCKs on Direction 2 | unit | `node --test test/smoke-plan-checker.test.js` | Existing tests (update from CHECK-04 to CHECK-05) |
| AUDIT-01e | runAllChecks includes CHECK-05 in result | unit | `node --test test/smoke-plan-checker.test.js` | Existing tests (update count 7->8) |
| AUDIT-01f | v1.0/unknown format graceful PASS for CHECK-05 | unit | `node --test test/smoke-plan-checker.test.js` | Needs new test |
| AUDIT-01g | Orphan issues include task ID in message | unit | `node --test test/smoke-plan-checker.test.js` | Needs new test |

### Sampling Rate
- **Per task commit:** `node --test test/smoke-plan-checker.test.js`
- **Per wave merge:** `node --test 'test/*.test.js'`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] New `describe('CHECK-05: logicCoverage')` test block in `test/smoke-plan-checker.test.js` -- covers AUDIT-01a,b,f,g
- [ ] Updated `describe('CHECK-04: truthTaskCoverage')` -- covers AUDIT-01c,d (Direction 2 tests removed/moved)
- [ ] Updated `describe('runAllChecks')` -- covers AUDIT-01e (checks count 7->8)

No new framework install needed. Existing test infrastructure covers all requirements.

## Existing Test Inventory (CHECK-04 tests that need splitting)

Tests to KEEP in CHECK-04 (Direction 1):
1. `'v1.0 -> auto pass'` (line 665) -- KEEP unchanged
2. `'v1.1 all Truths covered by tasks and vice versa -> pass'` (line 672) -- KEEP unchanged
3. `'v1.1 Truth T3 not in any task -> block'` (line 682) -- KEEP unchanged (Direction 1)
4. `'5-col plan + valid tasks -> CHECK-04 status pass'` (line 729) -- KEEP unchanged
5. `'unknown format -> pass'` (line 739) -- KEEP unchanged

Tests to MOVE to CHECK-05 (Direction 2):
1. `'v1.1 Task has no Truth mapping -> block (not warn)'` (line 697) -- MOVE, change expected status from 'block' to 'warn', checkId to 'CHECK-05'
2. `'v1.1 Direction 2 message does NOT contain "(co the la infrastructure task)"'` (line 713) -- MOVE, update checkId to 'CHECK-05'

Tests to ADD for CHECK-05:
1. `'v1.0 -> auto pass'` -- graceful PASS for v1.0 format
2. `'unknown format -> pass'` -- graceful PASS for unknown format
3. `'severity override to block'` -- options.severity = 'block' makes status 'block'
4. `'default severity is warn'` -- no options, orphan task results in 'warn'
5. `'issue message contains task ID and technical debt'` -- message quality check
6. `'all tasks have truths -> pass'` -- happy path

## Snapshot Files Impact

Name mapping appears in workflow plan.md which has snapshots.

```
test/snapshots/opencode/plan.md
test/snapshots/copilot/plan.md
test/snapshots/gemini/plan.md
```

These snapshots contain the "Check name mapping" section and must be updated to include `CHECK-05 = Logic Coverage`.

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| CHECK-04 Direction 2: WARN | CHECK-04 Direction 2: BLOCK | Phase 17 (D-05) | All tasks required Truth mapping |
| CHECK-04 bidirectional | CHECK-04 (Dir 1) + CHECK-05 (Dir 2) | Phase 20 (this phase) | Decoupled severity, configurable |

**Context:** Phase 17 upgraded Direction 2 from WARN to BLOCK (D-05/D-06). Phase 20 now decouples this into a separate CHECK-05 with configurable severity, restoring WARN as default while allowing strict projects to configure BLOCK.

## Open Questions

1. **Caller sites of runAllChecks**
   - What we know: `runAllChecks()` is called from workflows via plan-checker. The `{ planContent, tasksContent, requirementIds }` signature is established.
   - What's unclear: Whether any caller currently destructures or relies on specific checks array position.
   - Recommendation: Adding `check05Severity` as optional parameter is safe. Check callers pass keyword args, not positional.

2. **Snapshot regeneration**
   - What we know: `test/snapshots/*/plan.md` files contain name mapping copies.
   - What's unclear: Whether snapshots are auto-generated or manually maintained.
   - Recommendation: Check if there's a snapshot generation script. If manual, update inline.

## Sources

### Primary (HIGH confidence)
- `bin/lib/plan-checker.js` — full source code read, 987 lines, all check patterns analyzed
- `test/smoke-plan-checker.test.js` — 1427 lines, 147 tests, all CHECK-04 tests identified
- `references/plan-checker.md` — complete rules spec, 295 lines
- `workflows/plan.md` — PASS table name mapping at lines 330-337
- `.planning/phases/17-truth-protocol/17-CONTEXT.md` — D-05/D-06 severity history

### Secondary (MEDIUM confidence)
- `.planning/phases/20-logic-audit/20-CONTEXT.md` — all decisions locked, canonical refs verified against source

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - pure Node.js, no external dependencies, existing codebase patterns
- Architecture: HIGH - exact line numbers verified, function signatures confirmed, test patterns established
- Pitfalls: HIGH - identified specific test lines that need changing, verified current test count (147)

**Research date:** 2026-03-24
**Valid until:** 2026-04-24 (stable codebase, no external dependencies)
