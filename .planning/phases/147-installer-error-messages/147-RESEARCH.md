# Phase 147 Research — Installer Error Messages

**Researched:** 2026-04-08
**Domain:** Node.js error handling, installer UX
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- **D-01**: New `bin/lib/error-classifier.js` with `classifyError(err)` → `{ category, message, hint }`
- **D-02**: 4 categories: MISSING_DEP, PERMISSION, PLATFORM_UNSUPPORTED, GENERIC
- **D-03**: Detection via `err.code` (EACCES/EPERM → PERMISSION, MODULE_NOT_FOUND → PLATFORM_UNSUPPORTED) + message regex (`/not installed|not found|requires|missing/i` → MISSING_DEP)
- **D-04**: PERMISSION hint: `sudo chown $(whoami) <err.path>`; fallback if `err.path` undefined: "Check file permissions in your home directory"
- **D-05**: MISSING_DEP hint: reuse existing message if it contains URL or "Install via"; otherwise append generic install hint
- **D-06**: PLATFORM_UNSUPPORTED hint: "This platform is not yet supported. See: https://github.com/tonamson/please-done for supported platforms"
- **D-07**: Output format: `✗ <Category>: <cause>` + `  Hint: <actionable fix>` — `log.error` for first line, `log.info` for Hint line
- **D-08**: `main().catch()` calls classifier, then `log.error(classified.message)` + `log.info("  Hint: " + classified.hint)` + `process.exit(1)`. Stack only when `PD_DEBUG=1`.
- **D-09**: Keep `throw err` in `install()`'s catch block — no change; classification happens in `main().catch()` only
- **D-10**: New `test/smoke-errors.test.js` — 4 test cases (EACCES, "not installed", MODULE_NOT_FOUND, generic)
- **D-11**: Do NOT modify individual installer `throw` messages
- **D-12**: `module.exports = { classifyError }`, signature: `classifyError(err) → { category, message, hint }`

### Inherited Prior Phase Constraints
- Zero-dependency constraint: Node.js built-ins only (no npm packages)
- `main().catch()` is guarded with `require.main === module` (Phase 146)
- `bin/lib/` houses all utilities

### the agent's Discretion
- None documented (all decisions locked)

### Deferred Ideas (OUT OF SCOPE)
- None documented
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| INSTALL-02 | Actionable error messages replace raw stack traces; each error category has a specific fix hint; exit code is non-zero on failure | D-01–D-12 cover full implementation; `main().catch()` already calls `process.exit(1)`; classifier is the new intercept point |
</phase_requirements>

---

## Summary

Phase 147 adds a `bin/lib/error-classifier.js` module that maps Node.js errors to user-friendly categories and fix hints. The `main().catch()` block in `bin/install.js` currently logs `err.message` and exits — it needs to route through `classifyError(err)` before output. Individual installer `throw` sites are left unchanged (D-11).

The codebase follows a consistent pattern: `"use strict"`, JSDoc, named `module.exports`, Node built-in `node:test` for tests with `PD_TEST_MODE` for test-only exports. All three existing patterns are well-established and directly applicable.

**Primary recommendation:** Implement `classifyError` as a pure function with no side effects, call it in `main().catch()`, and verify with 4 targeted smoke tests using the existing `node:test` pattern.

---

## Current Error Handling

### `install()` catch blocks

Two catch blocks in `install()` — one in the platform installer step, one in agent sync:

```js
// Step 2 — platform installer (bin/install.js ~lines 153–162)
try {
  const installer = require(`./lib/installers/${runtime}`);
  await installer.install(SCRIPT_DIR, targetDir, { isGlobal, version: VERSION });
  log.success(`${platform.name} skills installed`);
} catch (err) {
  if (err.code === "MODULE_NOT_FOUND") {
    log.warn(`Installer for ${platform.name} is not yet implemented.`);
    return;   // ← early return, does NOT reach main().catch()
  }
  log.error(`Installation failed: ${err.message}`);  // ← fires BEFORE rethrow
  throw err;                                          // ← propagates to main().catch()
}

// Step 4 — agent sync (~lines 175–183)
try {
  execSync('node bin/sync-instructions.js', { cwd: PROJECT_ROOT, stdio: 'pipe' });
  log.success("Agent instructions synced");
} catch (err) {
  log.warn(`Agent sync failed: ${err.stderr?.toString().trim() || err.message}`);
  // Non-fatal — does NOT rethrow, never reaches main().catch()
}
```

**Key observation:** For platform installer failures (non-MODULE_NOT_FOUND), `install()` calls `log.error("Installation failed: " + err.message)` **and then rethrows**. This means `main().catch()` will produce a **second** log line when the classifier fires. The planner must decide whether to remove the pre-rethrow `log.error` call in `install()` or accept double output.

> D-09 says "Keep `throw err` — no change", but does not address the `log.error` line that precedes the rethrow. The safe interpretation is: remove only the `log.error(...)` before `throw err` (keeping the throw), since D-09 refers specifically to preserving propagation, not preserving the redundant log.

### `main().catch()`

```js
// bin/install.js (near end of file)
if (require.main === module) {
  main().catch((err) => {
    log.error(err.message);
    if (process.env.PD_DEBUG) console.error(err.stack);
    process.exit(1);
  });
}
```

**What to change here (D-08):**
```js
if (require.main === module) {
  main().catch((err) => {
    const { classifyError } = require("./lib/error-classifier");
    const classified = classifyError(err);
    log.error(classified.message);
    log.info(`  Hint: ${classified.hint}`);
    if (process.env.PD_DEBUG) console.error(err.stack);
    process.exit(1);
  });
}
```

---

## Error Types Thrown by Installers

### Plain `new Error()` — no err.code set

All throws in `bin/lib/installers/claude.js` are plain `new Error(msg)` with no `.code` property. They classify to **MISSING_DEP** via message regex:

| Throw site | Message | Regex match |
|------------|---------|-------------|
| Claude CLI check | `"Claude Code CLI not installed. Install first: https://claude.ai/download"` | `not installed` → MISSING_DEP |
| Python missing | `"Python not installed. Requires Python 3.12+"` | `not installed` → MISSING_DEP |
| Python version | `"Python 3.12+ required (currently X.Y)"` | `requires` → MISSING_DEP |
| Git missing | `"Git not installed."` | `not installed` → MISSING_DEP |
| FastCode submodule | `"FastCode submodule missing. Run: git submodule update --init"` | `missing` → MISSING_DEP |
| Gemini key missing | `"Gemini API Key not entered! FastCode MCP requires this key..."` | no regex match → falls to GENERIC |

**Note on Gemini key error**: message does not contain "not installed/found/requires/missing" literally (uses "not entered" and "requires" is followed by "this key"). Verify if regex `/requires/i` matches the fragment "requires this key" — it does! So this would classify as MISSING_DEP. Fine for purposes of Phase 147.

### MODULE_NOT_FOUND — from `require()` of platform installer

```js
const installer = require(`./lib/installers/${runtime}`);
// If file doesn't exist → err.code === "MODULE_NOT_FOUND", err.path === undefined
```
- `err.code`: `"MODULE_NOT_FOUND"` [VERIFIED: Node.js v24.14.1 runtime test]
- `err.path`: `undefined` [VERIFIED: Node.js v24.14.1 runtime test]
- `err.message`: `"Cannot find module './lib/installers/X'\nRequire stack:\n- ..."` [VERIFIED]

**Note:** In `install()`, MODULE_NOT_FOUND is already caught and returns early with `log.warn(...)`, so it never reaches `main().catch()`. PLATFORM_UNSUPPORTED category is for completeness / if that guard is removed or bypassed.

### err.code values and err.path availability

| Error | `err.code` | `err.path` | Source |
|-------|-----------|-----------|--------|
| Permission denied on write | `EACCES` | Set to affected path (e.g., `"/sys/test-pd-file"`) | VERIFIED: Node.js v24.14.1 |
| Permission denied on mkdir | `EPERM` | Set to affected path (e.g., `"/sys/test-pd"`) | VERIFIED: Node.js v24.14.1 |
| Module not found | `MODULE_NOT_FOUND` | `undefined` | VERIFIED: Node.js v24.14.1 |
| Plain `new Error()` | `undefined` | `undefined` | VERIFIED: claude.js source |

**err.path is reliably set by Node.js for all `fs.*` EACCES/EPERM operations.** [VERIFIED: runtime test]

---

## `log.error` / `log.info` Signatures

From `bin/lib/utils.js` [VERIFIED: source read]:

```js
const log = {
  info:    (msg) => console.log(msg),
  success: (msg) => console.log(colorize("green",  `  ✓ ${msg}`)),
  warn:    (msg) => console.log(colorize("yellow", `  ⚠ ${msg}`)),
  error:   (msg) => console.log(colorize("red",    `  ✗ ${msg}`)),
  step:    (num, total, msg) => console.log(colorize("cyan", `[${num}/${total}] ${msg}`)),
  banner:  (lines) => { /* box drawing */ },
};
```

**Key details:**
- `log.error(msg)` → outputs `  ✗ {msg}` in red. The `✗` and two-space indent are added automatically — do NOT include them in the message string passed to `classifyError`.
- `log.info(msg)` → plain `console.log(msg)` with NO prefix and NO color. For the Hint line, pass the full `  Hint: {text}` string including the indent.
- Both accept a single string argument only. No format specifiers.
- `colorize` is skipped when `!process.stdout.isTTY || process.env.NO_COLOR` — safe in test environments.

**D-07 output trace for PERMISSION error:**

```
  ✗ PERMISSION: EACCES: permission denied, open '/etc/shadow'
  Hint: Fix: sudo chown $(whoami) /etc/shadow
```

(`log.error` adds `  ✗ `, `log.info` adds nothing — the `  Hint:` indent comes from the hint string itself)

---

## Test Pattern Reference

From `test/smoke-install.test.js` [VERIFIED: source read]:

```js
"use strict";

const { describe, it, beforeEach, afterEach } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const path = require("path");
const os = require("os");
```

**Key patterns:**

1. **Framework**: `node:test` built-in + `node:assert/strict` — no npm test runner [VERIFIED]
2. **Describe/it**: Standard nested `describe` + `it` blocks
3. **PD_TEST_MODE**: Set `process.env.PD_TEST_MODE = "1"` in `beforeEach`, clean up in `afterEach`
4. **Require cache clearing**:
   ```js
   afterEach(() => {
     delete require.cache[require.resolve("../bin/install.js")];
   });
   ```
5. **Direct module import**: `const { classifyError } = require("../bin/lib/error-classifier");` — no cache clearing needed for pure functions
6. **Run command**: `node --test test/smoke-errors.test.js` (inferred from npm test scripts pattern)

**For `smoke-errors.test.js`**, since `classifyError` is a pure function with no side effects, no `beforeEach`/`afterEach` or cache clearing is needed — just call and assert:

```js
"use strict";

const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const { classifyError } = require("../bin/lib/error-classifier");

describe("classifyError", () => {
  it("EACCES → PERMISSION with path in hint", () => {
    const err = Object.assign(new Error("EACCES: permission denied, open '/home/user/.config'"), {
      code: "EACCES",
      path: "/home/user/.config",
    });
    const result = classifyError(err);
    assert.strictEqual(result.category, "PERMISSION");
    assert.ok(result.hint.includes("/home/user/.config"));
  });
  // ...3 more cases
});
```

---

## Module Structure Reference

From `bin/lib/manifest.js` [VERIFIED: source read]:

```js
// Pattern:
'use strict';

const fs = require('fs');
const path = require('path');
const { dep } = require('./utils');  // local deps

const CONSTANT = 'value';

/**
 * JSDoc for each exported function.
 */
function doThing(arg) {
  // ...
}

module.exports = {
  CONSTANT,
  doThing,
  otherFunc,
};
```

**For `error-classifier.js`:** No external or local dependencies needed — pure function using only `err.code`, `err.message`, `err.path`. No `require()` calls needed at all.

```js
'use strict';

// No requires needed

/**
 * Classify an installation error into a user-friendly category + hint.
 * @param {Error} err - The caught error object
 * @returns {{ category: string, message: string, hint: string }}
 */
function classifyError(err) { /* ... */ }

module.exports = { classifyError };
```

---

## Implementation Notes

### ⚠️ Gotcha: Double-logging in `install()` catch block

`install()`'s Step 2 catch block currently runs `log.error("Installation failed: " + err.message)` **before** `throw err`. When `main().catch()` fires the classifier, it will produce a **second** formatted error line. The result without a fix:

```
  ✗ Installation failed: Claude Code CLI not installed. Install first: ...
  ✗ MISSING_DEP: Claude Code CLI not installed. Install first: ...
  Hint: Install the missing dependency and re-run the installer
```

**Resolution**: Remove `log.error(`Installation failed: ${err.message}`)` from `install()`'s catch block, keeping only `throw err`. D-09 says "Keep `throw err` — no change" which refers to propagation, not the log line. The planner should add this as an explicit sub-task.

### ⚠️ MODULE_NOT_FOUND is already handled before propagation

In `install()`, MODULE_NOT_FOUND triggers `log.warn(...)` + `return` (no rethrow). So `main().catch()` will **never receive** a MODULE_NOT_FOUND error in the current flow. PLATFORM_UNSUPPORTED category is real but dormant — the classifier must still handle it correctly for robustness and for the test case (D-10 item 3).

### ✓ `err.path` is reliably set by Node.js fs operations

Confirmed: `fs.writeFileSync`, `fs.mkdirSync`, `fs.symlinkSync` all set `err.path` on EACCES/EPERM. [VERIFIED: Node.js v24.14.1 runtime test]

### ✓ D-07 output format alignment with log API

- `log.error(classified.message)` → renders as `  ✗ {classified.message}` in red
- `log.info("  Hint: " + classified.hint)` → renders as `  Hint: {hint}` with no color (already correct indentation)
- The `classified.message` should be `"CATEGORY: cause text"` — not include `✗` (already added by `log.error`)

### ✓ `classifyError` should be a pure function

No side effects, no `process.exit`, no logging. Returns `{ category, message, hint }`. Makes it trivially testable (D-10).

### ✓ MISSING_DEP URL detection (D-05)

`claude.js` errors that already contain a URL:
- `"Claude Code CLI not installed. Install first: https://claude.ai/download"` — contains `https://`

Simple check: `if (err.message.includes("http"))` → reuse message as hint. Otherwise append generic hint. No regex needed.

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Node.js built-in `node:test` (v24.14.1) |
| Config file | None — run directly |
| Quick run command | `node --test test/smoke-errors.test.js` |
| Full suite command | `node --test test/` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| INSTALL-02 | EACCES → PERMISSION + path hint | unit | `node --test test/smoke-errors.test.js` | ❌ Wave 0 |
| INSTALL-02 | "not installed" msg → MISSING_DEP | unit | `node --test test/smoke-errors.test.js` | ❌ Wave 0 |
| INSTALL-02 | MODULE_NOT_FOUND → PLATFORM_UNSUPPORTED | unit | `node --test test/smoke-errors.test.js` | ❌ Wave 0 |
| INSTALL-02 | Generic error → GENERIC, message passthrough | unit | `node --test test/smoke-errors.test.js` | ❌ Wave 0 |
| INSTALL-02 | Non-zero exit code on failure | integration | `node --test test/smoke-errors.test.js` | ❌ Wave 0 |

### Sampling Rate
- **Per task commit**: `node --test test/smoke-errors.test.js`
- **Per wave merge**: `node --test test/`
- **Phase gate**: Full suite green before `/gsd-verify-work`

### Wave 0 Gaps
- [ ] `test/smoke-errors.test.js` — covers all 4 INSTALL-02 test cases

*(All other test infrastructure exists — `node:test` is built-in, no install needed)*

---

## Security Domain

ASVS categories are not applicable to this phase. This phase is purely UX/output formatting — no authentication, session management, access control, cryptography, or user input processing. Error messages use static template strings with no user-controlled data interpolation beyond `err.message` and `err.path` (both from Node.js internals, not user input).

---

## Sources

### Primary (HIGH confidence)
- `bin/install.js` — verified exact catch block code and main().catch() pattern [VERIFIED: source read]
- `bin/lib/installers/claude.js` — verified all throw sites and error messages [VERIFIED: source read]
- `bin/lib/utils.js` — verified log API signatures [VERIFIED: source read]
- `bin/lib/manifest.js` — verified module export pattern [VERIFIED: source read]
- `test/smoke-install.test.js` — verified test structure and patterns [VERIFIED: source read]
- Node.js v24.14.1 runtime — verified `err.path` presence on EACCES/EPERM, `err.code` on MODULE_NOT_FOUND [VERIFIED: runtime test]

### Secondary (MEDIUM confidence)
- None needed — all required information was directly verifiable from source

---

## Metadata

**Confidence breakdown:**
- Current error handling: HIGH — verified from source
- err.path availability: HIGH — verified via Node.js runtime test
- Test patterns: HIGH — verified from existing smoke test file
- Module structure: HIGH — verified from manifest.js

**Research date:** 2026-04-08
**Valid until:** Stable — no external dependencies; valid until install.js or utils.js are refactored
