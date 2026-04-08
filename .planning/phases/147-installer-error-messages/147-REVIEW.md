---
phase: 147-installer-error-messages
reviewed: 2025-07-17T00:00:00Z
depth: standard
files_reviewed: 3
files_reviewed_list:
  - bin/lib/error-classifier.js
  - bin/install.js
  - test/smoke-errors.test.js
findings:
  critical: 0
  warning: 3
  info: 3
  total: 6
status: issues_found
---

# Phase 147: Code Review Report

**Reviewed:** 2025-07-17  
**Depth:** standard  
**Files Reviewed:** 3  
**Status:** issues_found

## Summary

The overall design is solid: `classifyError()` is a clean pure function with no dependencies, the
four-category dispatch is easy to follow, and wiring it into `main().catch()` is the right
integration point. Step 2's double-log has been removed and `throw err` is still present (✓).
The `PD_DEBUG` stack-trace guard survives (✓). All four branches return the full `{ category,
message, hint }` shape (✓).

Three issues need attention before this phase can be considered production-ready:

- The URL extraction regex will swallow trailing punctuation, producing non-clickable URLs in hints.
- `classifyError` crashes on a `null`/`undefined` throw, which would re-expose the raw stack trace
  it was designed to hide.
- An empty `err.message` (`new Error('')` or `new Error()`) silently becomes the string `"Error"`,
  losing all diagnostic context.

---

## Warnings

### WR-01: URL regex captures trailing punctuation, producing broken hint URLs

**File:** `bin/lib/error-classifier.js:36`  
**Issue:** The pattern `/(https?:\/\/[^\s]+)/` matches any non-whitespace character after the
URL, so trailing punctuation is included verbatim. Confirmed with live execution:

```
Input:  "Install at https://python.org/download."
Hint:   "Install via: https://python.org/download."   ← period breaks the link
Input:  "Install at https://python.org/download,"
Hint:   "Install via: https://python.org/download,"   ← comma breaks the link
Input:  "Install at https://python.org/download)"
Hint:   "Install via: https://python.org/download)"   ← paren breaks the link
```

The install-hint URL is meant to be actionable (clicked or pasted). A trailing `.` silently
makes it 404.

**Fix:** Strip common trailing punctuation from the captured group:

```js
// bin/lib/error-classifier.js  line 36
const urlMatch = msg.match(/(https?:\/\/[^\s]+)/);
const url = urlMatch ? urlMatch[1].replace(/[.,;:)>\]'"!?]+$/, '') : null;
return {
  category: 'MISSING_DEP',
  message: msg,
  hint: url
    ? 'Install via: ' + url
    : 'Install the missing dependency and re-run the installer',
};
```

---

### WR-02: `classifyError(null)` / `classifyError(undefined)` crashes the error handler

**File:** `bin/lib/error-classifier.js:11`  
**Issue:** `const code = err.code || '';` throws `TypeError: Cannot read properties of null
(reading 'code')` when `err` is `null` or `undefined`.

```bash
# confirmed:
$ node -e "require('./bin/lib/error-classifier').classifyError(null)"
TypeError: Cannot read properties of null (reading 'code')
```

JavaScript allows `throw null`, `throw undefined`, and `throw 0`. Third-party libraries
(notably some async queue/stream libraries) do this in error paths. When they do, the catch
handler in `main().catch()` itself throws a second TypeError, Node falls back to its default
unhandled-rejection behaviour, and the user sees the raw stack trace — the exact outcome
this phase was designed to prevent.

**Fix:** Guard at the top of `classifyError`:

```js
function classifyError(err) {
  // Defensive: handle non-object throws (null, undefined, strings, numbers)
  if (err == null || typeof err !== 'object') {
    return {
      category: 'GENERIC',
      message: String(err),
      hint: 'Run with PD_DEBUG=1 for more details',
    };
  }
  const code = err.code || '';
  // ... rest unchanged
```

---

### WR-03: Empty `err.message` silently becomes the string `"Error"`, hiding the error

**File:** `bin/lib/error-classifier.js:12`  
**Issue:** `const msg = err.message || String(err);` uses `||`, so an empty string
(`new Error('')` or `new Error()`) falls through to `String(err)`.
`String(new Error(''))` is `"Error"` — just the constructor name, with no useful context.

```bash
$ node -e "console.log(String(new Error('')))"
Error
```

The `message` field of every returned object would be `"Error"`, which `log.error()` prints
verbatim: `GENERIC: Error` — giving the user nothing to act on.

**Fix:** Use nullish coalescing and handle the empty-string case:

```js
const msg = err.message != null && err.message !== ''
  ? err.message
  : err.stack || String(err) || '(no message)';
```

This preserves the stack's first line when the message is blank, which is more informative
than just `"Error"`.

---

## Info

### IN-01: `require('./lib/error-classifier')` is lazy-loaded inside the catch handler

**File:** `bin/install.js:379`  
**Issue:** The require call sits inside `main().catch()`. If `error-classifier.js` has a
syntax error or is accidentally absent from a build artefact, the catch handler itself throws
and the formatted error output is lost. Moving the import to the top of the file provides
fail-fast startup detection at no cost.

```js
// Top of bin/install.js — alongside the other requires (line 24–41)
const { classifyError } = require('./lib/error-classifier');

// Then in main().catch() — just reference classifyError directly:
main().catch((err) => {
  const classified = classifyError(err);
  ...
```

---

### IN-02: PERMISSION-without-path branch (fallback hint) is not tested

**File:** `test/smoke-errors.test.js`  
**Issue:** The only PERMISSION test uses an error that has `err.path` set. The other branch
of the ternary — `'Check file permissions in your home directory'` — is never exercised.
Not a blocking issue, but it leaves a hint branch unverified.

**Fix:** Add a second `it` inside the PERMISSION `describe`:

```js
it("classifies EACCES without path using fallback hint", () => {
  const err = Object.assign(new Error("EACCES: permission denied"), { code: "EACCES" });
  // no err.path
  const result = classifyError(err);
  assert.equal(result.category, "PERMISSION");
  assert.ok(
    result.hint.includes("Check file permissions"),
    `expected fallback hint, got: ${result.hint}`
  );
});
```

---

### IN-03: `PLATFORM_UNSUPPORTED` classification is unreachable for the installer-not-found case

**File:** `bin/install.js:182-186`, `bin/lib/error-classifier.js:26-31`  
**Issue:** The `MODULE_NOT_FOUND` that fires when an installer module doesn't exist (e.g.,
`require('./lib/installers/unknown')`) is caught locally in the Step 2 catch block and handled
with a `log.warn()` + `return`. It never reaches `main().catch()`, so `classifyError` will
never classify it as `PLATFORM_UNSUPPORTED`.

The `PLATFORM_UNSUPPORTED` branch in `classifyError` can only be reached by a
`MODULE_NOT_FOUND` thrown from *within* a running installer (e.g., the installer itself
requires a native add-on that is absent). For that case, `PLATFORM_UNSUPPORTED` may be a
misleading category name — it could be a missing optional dependency rather than a platform
issue.

No action required unless the category semantics matter for automated tooling that parses
the log output. The smoke test is correct in isolation (it tests the pure function's
dispatch logic, which works as documented).

---

_Reviewed: 2025-07-17_  
_Reviewer: gsd-code-reviewer_  
_Depth: standard_
