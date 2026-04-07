---
phase: 142-discussion-audit-trail
reviewed: 2026-04-07T11:50:40Z
depth: standard
files_reviewed: 3
files_reviewed_list:
  - bin/lib/audit-trail.js
  - test/audit-trail.test.js
  - commands/pd/audit.md
findings:
  critical: 0
  warning: 3
  info: 4
  total: 7
status: issues_found
---

# Phase 142: Code Review Report

**Reviewed:** 2026-04-07T11:50:40Z
**Depth:** standard
**Files Reviewed:** 3
**Status:** issues_found

## Summary

The audit-trail library is well-structured with clean separation of concerns — pure functions, zero I/O, sensible edge-case guards. All 30 tests pass. The core logic for frontmatter parsing, date normalization (including js-yaml's `Date` object output), and filter composition is correct.

Three **warnings** require attention before shipping:

1. `formatAuditTable` overflows its box border when `phase_name` is long — confirmed empirically: a 50-char name produces a line 115 chars wide against a 72-char border.
2. Keyword search is case-sensitive, which is almost certainly unintentional for a user-facing `--search` flag, and the test suite does not cover this gap.
3. A non-numeric `--phase` string (e.g. typo) silently returns zero results via `NaN !== NaN` without surfacing any diagnostic.

Four **info** items cover a dead test-fixture variable, duplicated normalization logic, a flag/parameter name mismatch, and a slightly loose frontmatter regex.

---

## Warnings

### WR-01: `formatAuditTable` — `padRight` never truncates, long `phase_name` busts box border

**File:** `bin/lib/audit-trail.js:26-29` (padRight) and `bin/lib/audit-trail.js:192-199` (formatAuditTable)

**Issue:** `padRight` pads short strings but returns long strings unchanged — it never truncates. The data row is built as:
```
`${padRight(phaseStr, 6)} ${padRight(dateStr, 12)} ${countStr}${nameStr}`
```
If `phase_name` is long, `nameStr` (e.g. `" — A Very Long Phase Name That Exceeds Column Width"`) pushes the row past the 69-char column limit, producing a ragged right wall that visually breaks the box. Confirmed: a 50-char phase name produces a 115-wide line against a 72-wide border.

```
╔══════════════════════════════════════════════════════════════════════╗
║ 1      2026-04-07   5 — A Very Long Phase Name That Exceeds Column Width║
╚══════════════════════════════════════════════════════════════════════╝
```

**Fix:** Add a `truncate` helper (or extend `padRight`) and cap the row to `W - 1` characters:

```js
function padRight(str, length) {
  const s = String(str || '');
  if (s.length > length) return s.slice(0, length - 1) + '…'; // truncate
  if (s.length === length) return s;
  return s + ' '.repeat(length - s.length);
}
```

Or, truncate only the optional `nameStr` portion inside `formatAuditTable`:
```js
const baseRow = `${padRight(phaseStr, 6)} ${padRight(dateStr, 12)} ${countStr}`;
const remaining = W - 1 - baseRow.length - 1; // -1 for the '—' space
const namePart = nameStr.length > remaining
  ? nameStr.slice(0, remaining - 1) + '…'
  : nameStr;
const row = baseRow + namePart;
```

---

### WR-02: Keyword filter is case-sensitive — silent user-experience bug

**File:** `bin/lib/audit-trail.js:148-150`

**Issue:** The `--search` filter uses `String.prototype.includes()` which is case-sensitive:
```js
if (!decisionsText.includes(String(keyword))) return false;
```
Searching for `Frontmatter` returns 0 results even though `"Markdown with YAML frontmatter"` exists. This is almost certainly unintentional for a user-facing CLI search. The test suite only exercises lowercase keywords, so the gap is undetected by the existing 30 tests.

**Fix:** Normalise both sides to lowercase before comparison:
```js
const needle = String(keyword).toLowerCase();
const decisionsText = ctx.decisions.join(' ').toLowerCase();
if (!decisionsText.includes(needle)) return false;
```

---

### WR-03: Invalid `--phase` string produces silent empty results via `NaN !== NaN`

**File:** `bin/lib/audit-trail.js:154-157`

**Issue:** When `phase` is a non-numeric string (e.g. a typo like `"1O"` for `"10"`), `parseInt` returns `NaN`. Because `NaN !== NaN` is always `true`, every context is excluded and `filterContexts` returns `[]` with no indication that the input was invalid:
```js
const phaseVal = typeof phase === 'string' ? parseInt(phase, 10) : phase;
// If phase = 'abc': phaseVal = NaN
// ctxPhase !== NaN  →  true for every ctx  →  all filtered out
```

**Fix:** Guard against `NaN` explicitly and short-circuit with an empty array (or throw, depending on the desired contract):
```js
if (phase !== undefined && phase !== null) {
  const phaseVal = typeof phase === 'string' ? parseInt(phase, 10) : phase;
  if (Number.isNaN(phaseVal)) return []; // invalid phase — nothing can match
  const ctxPhase = typeof ctx.phase === 'string' ? parseInt(ctx.phase, 10) : ctx.phase;
  if (ctxPhase !== phaseVal) return false;
}
```
Or validate earlier in `filterContexts` before the `.filter()` loop and surface a diagnostic to the caller.

---

## Info

### IN-01: Dead `contexts` variable in `filterContexts` test setup — never read by other tests

**File:** `test/audit-trail.test.js:137-143`

**Issue:** The `describe('filterContexts')` block declares a shared `let contexts` variable and populates it in a "setup" test. However, every subsequent test in the block declares its own `const parsed = listContexts(CONTEXT_LIST)` locally and never reads `contexts`. The setup test is dead code and creates a misleading impression of a shared test fixture pattern.

**Fix:** Remove the `let contexts` variable and the "setup" test; the other tests already initialize their own data:
```js
describe('filterContexts', () => {
  // Remove: let contexts;
  // Remove: test('setup: listContexts returns data for filtering', ...

  test('filters by keyword substring in decisions (D-08)', () => {
    const parsed = listContexts(CONTEXT_LIST);
    // ...
  });
  // ...
});
```

---

### IN-02: Date normalization logic duplicated between `parseContextFile` and `normalizeDate`

**File:** `bin/lib/audit-trail.js:38-44` (normalizeDate) and `bin/lib/audit-trail.js:69-71` (inline in parseContextFile)

**Issue:** The `normalizeDate` helper exists precisely to normalize `Date | string → 'YYYY-MM-DD'`, but `parseContextFile` duplicates the same logic inline instead of calling it:
```js
// inline in parseContextFile — duplicated:
if (frontmatter.date instanceof Date) {
  frontmatter.date = frontmatter.date.toISOString().split('T')[0];
}
```
If the normalization rule ever changes (e.g., handling `number` epoch values), one copy is easy to miss.

**Fix:** Replace the inline block with a single call to the helper:
```js
if (frontmatter.date !== undefined) {
  frontmatter.date = normalizeDate(frontmatter.date);
}
```
Then `listContexts` calling `normalizeDate(frontmatter.date)` again is a no-op for already-normalized strings.

---

### IN-03: `--search` flag name in `audit.md` does not match the `keyword` parameter name in the API

**File:** `commands/pd/audit.md:5` and `commands/pd/audit.md:57`

**Issue:** The argument hint and user-facing documentation use `--search`, but the `filterContexts` API accepts a `{ keyword }` field. Step 7 of the process does describe the mapping (`--search "keyword"` → `keyword` filter), but the flag-to-parameter impedance requires an LLM implementer to deliberately translate `search` → `keyword`. If the mapping is missed, the filter silently has no effect (undefined key in filters object).

**Fix (option 1 — preferred):** Rename the filter parameter in `audit-trail.js` from `keyword` to `search` to match the CLI flag:
```js
// filterContexts({ search, phase, from, to })
const needle = String(search).toLowerCase();
```

**Fix (option 2):** Add an explicit note in `audit.md` step 9 to reinforce the mapping:
```
- Build filters: { keyword: searchArg, phase, from, to }  // --search maps to 'keyword'
```

---

### IN-04: Frontmatter closing `---` not anchored to end-of-line

**File:** `bin/lib/audit-trail.js:58`

**Issue:** The regex `/^---\n([\s\S]*?)\n---/` matches the first occurrence of `\n---` in the YAML block, regardless of whether the dashes are followed by more characters on the same line. For example, a YAML value like `description: "see ---changelog"` on a single line is safe, but a bare `---suffix` at the start of a line would prematurely terminate frontmatter extraction.

**Fix:** Anchor the closing delimiter to end-of-line:
```js
const fmMatch = content.match(/^---\r?\n([\s\S]*?)\n---(?:\r?\n|$)/);
```
This also handles Windows `\r\n` line endings in the delimiter, which the current pattern misses entirely.

---

_Reviewed: 2026-04-07T11:50:40Z_
_Reviewer: gsd-code-reviewer (agent)_
_Depth: standard_
