---
phase: 143-scope-reduction-detection
reviewed: 2025-07-17T00:00:00Z
depth: standard
files_reviewed: 3
files_reviewed_list:
  - bin/lib/scope-checker.js
  - commands/pd/health.md
  - test/scope-checker.test.js
findings:
  critical: 0
  warning: 3
  info: 2
  total: 5
status: issues_found
---

# Phase 143: Code Review Report

**Reviewed:** 2025-07-17  
**Depth:** standard  
**Files Reviewed:** 3  
**Status:** issues_found

## Summary

All 25 tests pass and the module structure correctly follows the health-checker pattern.
Two issues require attention before this module is relied on in production: a logic bug in
artifact path matching causes silent false negatives (real scope reductions are missed), and
a documentation conflict in `health.md` will cause scope issues to be double-counted in
`--json` output mode. A third warning addresses the `Fix: undefined` rendering path exposed
to direct callers of `formatScopeReport`.

---

## Warnings

### WR-01: Bidirectional Path Matching Hides Real Scope Reductions

**File:** `bin/lib/scope-checker.js:137-139`

**Issue:** `detectReductions` uses a bidirectional substring check to decide whether a plan
artifact was mentioned in the summary:

```js
return !(summary.deliveredPaths || []).some(
  delivered => delivered.includes(path) || path.includes(delivered)
);
```

The second branch — `path.includes(delivered)` — means a *shorter* delivered token can
clear a *longer* plan artifact path. Confirmed failure cases:

- Summary mentions `` `scope-checker.js` `` → `deliveredPaths = ['scope-checker.js']`  
  `'bin/lib/scope-checker.js'.includes('scope-checker.js')` → `true` → artifact **silently not flagged**

- Summary mentions `` `bin/lib` `` → `deliveredPaths = ['bin/lib']`  
  Every artifact under `bin/lib/...` is cleared by a single directory token.

These are false negatives — exactly the failures the module exists to catch. The test suite
never exercises this direction of the check, so it would not catch a regression here.

**Fix:** Remove the `path.includes(delivered)` direction. Only allow the delivered path to
be *at least as specific* as the plan path:

```js
// Before
delivered => delivered.includes(path) || path.includes(delivered)

// After — delivered must contain the full plan path (or be equal to it)
delivered => delivered.includes(path) || delivered === path
```

If partial-filename matching is intentionally desired (e.g. `scope-checker.js` should match
`bin/lib/scope-checker.js`), use a stricter suffix check instead:

```js
delivered => delivered.includes(path) || path.endsWith('/' + delivered) || path === delivered
```

---

### WR-02: Scope Issues Double-Counted in `--json` Output

**File:** `commands/pd/health.md:47-48`

**Issue:** The process steps are contradictory about where scope issues live in JSON mode:

- **Step 7:** "Append scope issues to the health issues list" — scope issues go into `issues`
- **Step 8:** `JSON.stringify({ healthIssues: issues, scopeIssues }, null, 2)` — scope issues
  are emitted *again* as a separate `scopeIssues` key

If a code agent follows both instructions literally, every scope issue will appear twice in
the JSON output: once inside `healthIssues` and once inside `scopeIssues`.

**Fix:** Choose one of two consistent designs and update both steps to match:

**Option A — Unified list (simpler):**
```
Step 7: Collect scope issues into a separate `scopeIssues` array (do NOT append to `issues`).
Step 8: JSON.stringify({ healthIssues: issues, scopeIssues }, null, 2)
```

**Option B — Single flat list:**
```
Step 7: Append scope issues to the health issues list.
Step 8: JSON.stringify({ issues }, null, 2)  // one unified array
```

---

### WR-03: `Fix: undefined` Rendered in Report When `fix` Field Is Absent

**File:** `bin/lib/scope-checker.js:200`

**Issue:** `formatScopeReport` renders the `fix` field with a bare template literal:

```js
lines.push(`║ ${padRight(truncate(`    Fix: ${issue.fix}`, W - 1), W - 1)}║`);
```

If a caller passes an issue object without a `fix` property (e.g. issues surfaced from an
external source or a future check that omits it), the rendered output shows:

```
    Fix: undefined
```

`formatHealthReport` in `health-checker.js` has the same pattern, but the health-checker
issue objects are all generated internally so it never fires in practice. `formatScopeReport`
is a public API and its callers (including `pd:health`) merge issues from multiple sources.

**Fix:** Coerce with a fallback at render time:

```js
lines.push(`║ ${padRight(truncate(`    Fix: ${issue.fix || '(no fix provided)'}`, W - 1), W - 1)}║`);
```

---

## Info

### IN-01: Grammar Error in Summary Line — "warning" Never Pluralized

**File:** `bin/lib/scope-checker.js:189`

**Issue:** The summary line always uses the singular noun "warning" regardless of count:

```js
lines.push(`Scope check: ${issues.length} issue(s) found (${warningCount} warning)`);
//                                                                           ↑ wrong when > 1
```

Output when two issues are found: `Scope check: 2 issue(s) found (2 warning)`

**Fix:**
```js
const wLabel = warningCount === 1 ? 'warning' : 'warnings';
lines.push(`Scope check: ${issues.length} issue(s) found (${warningCount} ${wLabel})`);
```

---

### IN-02: No Test Coverage for the False-Negative Path (WR-01)

**File:** `test/scope-checker.test.js`

**Issue:** The test for "returns no issues when all requirements are mentioned in summary"
uses `deliveredPaths: ['bin/lib/foo.js']` (exact match), which only exercises the
`delivered.includes(path)` direction. No test passes a shorter token like `foo.js` to
verify behaviour of `path.includes(delivered)`. The bug in WR-01 is completely invisible to
the test suite as written.

**Fix:** Add a regression test for the false-negative scenario once WR-01 is resolved:

```js
test('does not clear artifact when summary only mentions a short filename token', () => {
  const plan = {
    requirements: [], truths: [], phase: '143',
    artifacts: [{ path: 'bin/lib/scope-checker.js' }],
  };
  const summary = {
    mentionedReqs: [], status: 'completed', phase: '143',
    deliveredPaths: ['scope-checker.js'],  // short token — should NOT clear full path
  };
  const result = detectReductions(plan, summary);
  assert.strictEqual(result.droppedArtifacts.length, 1, 'Short token must not clear full artifact path');
});
```

---

_Reviewed: 2025-07-17_  
_Reviewer: gsd-code-reviewer_  
_Depth: standard_
