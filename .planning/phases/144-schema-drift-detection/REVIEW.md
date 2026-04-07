---
phase: 144-schema-drift-detection
reviewed: 2025-01-31T00:00:00Z
depth: standard
files_reviewed: 3
files_reviewed_list:
  - bin/lib/drift-detector.js
  - commands/pd/health.md
  - test/drift-detector.test.js
findings:
  critical: 2
  warning: 2
  info: 3
  total: 7
status: issues_found
---

# Phase 144: Code Review Report — Schema Drift Detection

**Reviewed:** 2025-01-31  
**Depth:** standard  
**Files Reviewed:** 3  
**Status:** issues_found

## Summary

`drift-detector.js` is well-structured, follows the `scope-checker.js` pattern faithfully, and the pure-function design is clean. All 31 tests pass. However two confirmed logic bugs were found via runtime probing that the test suite silently misses:

1. A **double-issue emission** when `gsd_state_version` is absent — users see two CRITICALs for one missing field.
2. A **silent 5-CRITICAL explosion** when `progress:` is present in frontmatter but has no sub-fields (YAML null) — no parent diagnostic is emitted, making the output confusing.

Both bugs exist in production-path code and affect real output.

---

## Critical Issues

### CR-01: Double-reporting when `gsd_state_version` is absent

**File:** `bin/lib/drift-detector.js:132–154`

**Issue:** When `gsd_state_version` is absent from STATE.md, `detectSchemaDrift` emits **two separate CRITICAL issues** for the same single root cause:

1. `"Missing required field: gsd_state_version"` — from step 3 (line 133–141)
2. `"Unsupported gsd_state_version: (missing) (expected one of 1.0)"` — from step 3.5 (line 146–154)

`checkVersionSupport(null)` is called unconditionally even when `version` is `null` solely because the field does not exist. Confirmed by runtime probe:

```
MISSING_VERSION issue count: 2
  [0] critical | Missing required field: gsd_state_version
  [1] critical | Unsupported gsd_state_version: (missing) (expected one of 1.0)
```

The "unsupported version" issue is a false alarm — the version is not present at all, not present-but-wrong. This is confusing to users and misleading in the `--json` output (`driftIssues` will have 2 entries instead of 1).

**Fix:** Guard step 3.5 so it only runs when a version value was actually found. The simplest guard is to skip the version check when `version === null`, since the missing-field check in step 3 already covers it:

```js
// Step 3.5: Version support check — only when a version value was actually parsed
if (version !== null) {
  const versionCheck = checkVersionSupport(version);
  if (!versionCheck.supported) {
    issues.push({
      severity: SEVERITY_CRITICAL,
      category: CATEGORY,
      location: LOCATION,
      issue: `Unsupported gsd_state_version: ${version} (expected one of ${SUPPORTED_VERSIONS.join(', ')})`,
      fix: versionCheck.upgrade_path,
    });
  }
}
```

---

### CR-02: `progress: null` triggers 5 sub-field CRITICALs with no parent diagnostic

**File:** `bin/lib/drift-detector.js:169–182`

**Issue:** When STATE.md has `progress:` as a bare YAML key with no sub-fields, js-yaml parses it as JavaScript `null`. This creates a split-brain:

- `Object.keys(raw)` **includes** `'progress'` → the top-level field is not flagged as missing
- `parseStateMdFields` sets `progressFields: []` (because `null && typeof null === 'object'` is `false`)
- Step 5 (`topLevelFields.includes('progress')` is `true`) fires and reports all 5 sub-fields as CRITICAL

Result: the user sees 5 CRITICALs for missing sub-fields but **no issue pointing at the null/empty `progress` value itself**. The fix hints all say "Add field X under the progress: section" with no diagnostic that `progress` is empty. Confirmed by runtime probe:

```
PROGRESS_NULL issue count: 5
  [0] critical | Missing required field: progress.total_phases
  [1] critical | Missing required field: progress.completed_phases
  [2] critical | Missing required field: progress.total_plans
  [3] critical | Missing required field: progress.completed_plans
  [4] critical | Missing required field: progress.percent
```

The same behaviour occurs for `progress: {}` (explicit empty mapping).

**Fix:** In step 5, distinguish between a null/empty `progress` value and a populated-but-incomplete one. Emit a single parent diagnostic when progress is null/empty, replacing the 5 individual sub-field issues:

```js
// Step 5: Missing progress sub-fields
if (topLevelFields.includes('progress')) {
  const raw = parseStateMdFields(content).raw;
  if (raw.progress == null || typeof raw.progress !== 'object') {
    // progress key exists but has no sub-fields
    issues.push({
      severity: SEVERITY_CRITICAL,
      category: CATEGORY,
      location: LOCATION,
      issue: 'Field progress: is empty or null — expected a mapping with sub-fields',
      fix: 'Populate the progress: section with required sub-fields: '
        + EXPECTED_STATE_SCHEMA.requiredProgressFields.join(', '),
    });
  } else {
    for (const field of EXPECTED_STATE_SCHEMA.requiredProgressFields) {
      if (!progressFields.includes(field)) {
        issues.push({
          severity: SEVERITY_CRITICAL,
          category: CATEGORY,
          location: LOCATION,
          issue: `Missing required field: progress.${field}`,
          fix: `Add field ${field} under the progress: section in STATE.md`,
        });
      }
    }
  }
}
```

Alternatively, pass `raw` into the function instead of calling `parseStateMdFields` a second time — but since `detectSchemaDrift` already destructures `raw` indirectly, exposing it via the return of `parseStateMdFields` at the top is the cleanest path:

```js
// At top of detectSchemaDrift:
const { version, topLevelFields, progressFields, raw } = parseStateMdFields(content);
```

Then use `raw.progress` in step 5 directly (it is already available; the function already returns `raw`).

---

## Warnings

### WR-01: Test suite masks the CR-01 double-reporting bug

**File:** `test/drift-detector.test.js:129–137`

**Issue:** The `MISSING_VERSION` test uses `issues.length >= 1` (not `=== 1`) and `issues.find(i => i.issue.includes('gsd_state_version'))` to locate the relevant issue. This assertion pattern passes whether 1 or 2 issues are returned. The silent contract that "one missing field = exactly one issue" is violated but no test enforces it, so CR-01 was undetected through all 31 tests.

The same lax pattern appears in every per-field test (all use `find` + `length >= 1`), so if similar double-reporting were introduced for other fields, it would also escape the suite.

**Fix:** Add exact-count assertions for single-field-missing cases:

```js
test("MISSING_VERSION produces exactly one critical issue", () => {
  const issues = detectSchemaDrift(MISSING_VERSION);
  // Only one root-cause: the field is absent. Not two.
  assert.strictEqual(issues.length, 1);
  assert.strictEqual(issues[0].severity, 'critical');
  assert.ok(issues[0].issue.includes('gsd_state_version'));
});
```

Add a similar fixture and test for `progress: null` to cover CR-02.

---

### WR-02: Field-level checks run before version check — false positives for future versions

**File:** `bin/lib/drift-detector.js:132–154`

**Issue:** The step ordering is: (3) check required fields → (3.5) check version → (4) check unknown fields → (5) check progress sub-fields. Steps 3, 4, and 5 all evaluate against the **v1.0 schema** unconditionally, even when the document declares an unsupported future version. Confirmed by runtime probe with a simulated `gsd_state_version: 2.0` STATE.md that legitimately drops two v1.0 fields:

```
[0] critical | Missing required field: milestone_name   ← false positive
[1] critical | Missing required field: last_activity    ← false positive
[2] critical | Unsupported gsd_state_version: 2.0 ...  ← real issue (buried last)
```

The user sees the version mismatch buried after false-positive field failures. When v2.0 is eventually introduced with different required fields, this ordering will routinely produce misleading output. The version CRITICAL should be the *first* issue when a document declares an unsupported version.

**Fix:** Move the version check to before the field checks (make it step 1), and optionally short-circuit or annotate subsequent field issues as "checked against v1.0 schema" when the version is unsupported:

```js
function detectSchemaDrift(content) {
  const { version, topLevelFields, progressFields, raw } = parseStateMdFields(content);

  if (topLevelFields.length === 0) {
    return [{ severity: SEVERITY_CRITICAL, ... }];
  }

  const issues = [];

  // Step 1 (was 3.5): Version check first — determines schema context
  if (version !== null) {
    const versionCheck = checkVersionSupport(version);
    if (!versionCheck.supported) {
      issues.push({ ... });
    }
  }

  // Steps 3, 4, 5: Field checks (always against v1.0 schema; note in comments)
  ...
}
```

---

## Info

### IN-01: Redundant second clause in `detectSchemaDrift` guard condition

**File:** `bin/lib/drift-detector.js:119`

**Issue:** The guard reads:

```js
if (topLevelFields.length === 0 && progressFields.length === 0) {
```

The second clause (`&& progressFields.length === 0`) is unreachable dead code. `progressFields` is derived from `raw.progress` which requires `progress` to be a key in `raw`. If `topLevelFields.length === 0`, then `raw` is `{}` or `null`, and `progressFields` is necessarily `[]`. The `&&` second condition is always `true` when the first is `true`.

**Fix:** Simplify to:

```js
if (topLevelFields.length === 0) {
```

---

### IN-02: `toFixed(1)` normalization silently coerces bare integer versions

**File:** `bin/lib/drift-detector.js:95`

**Issue:** `gsd_state_version: 2` (a bare YAML integer, not `2.0`) is normalized to `'2.0'` via `toFixed(1)`. The comment documents this for `1.0 → 1 → '1.0'` but the inverse is also true for hypothetical `gsd_state_version: 2`: it becomes `'2.0'`, not `'2'`. If a future version token is `'2'` (without decimal), it would be mis-matched as `'2.0'` and reported unsupported. The behavior is implicit and untested.

**Fix:** Document the assumption explicitly in the JSDoc or add a test for `gsd_state_version: 2` (integer) producing `'2.0'`:

```js
// js-yaml parses YAML scalars:
//   1.0  → JS number 1   (integer)  → toFixed(1) → '1.0'
//   1.5  → JS number 1.5 (float)    → String()   → '1.5'
//   2    → JS number 2   (integer)  → toFixed(1) → '2.0'
//
// Convention: all supported version tokens use X.Y decimal form.
// A bare integer N in YAML will be normalized to 'N.0', matching
// SUPPORTED_VERSIONS tokens of the same form.
```

---

### IN-03: Stale "Success when" criterion in `health.md`

**File:** `commands/pd/health.md:66`

**Issue:** The success criterion reads:

> "Health report is displayed with all **3 check categories** (missing files, state schema, orphaned dirs)"

Phase 144 adds drift as a fourth check category. The criterion is now inaccurate, and any agent reading it as a completion signal may falsely mark the command as complete after outputting only the first three sections.

**Fix:** Update to:

> "Health report is displayed with all **4 check categories** (missing files, state schema, orphaned dirs, schema drift)"

---

_Reviewed: 2025-01-31_  
_Reviewer: gsd-code-reviewer_  
_Depth: standard_
