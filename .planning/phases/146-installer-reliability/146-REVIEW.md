---
phase: 146-installer-reliability
reviewed: 2025-01-31T00:00:00Z
depth: standard
files_reviewed: 4
files_reviewed_list:
  - bin/lib/manifest.js
  - bin/lib/utils.js
  - bin/install.js
  - test/smoke-install.test.js
findings:
  critical: 1
  warning: 2
  info: 2
  total: 5
status: issues_found
---

# Phase 146: Code Review Report

**Reviewed:** 2025-01-31
**Depth:** standard
**Files Reviewed:** 4
**Status:** issues_found

## Summary

Phase 146 adds `checkUpToDate()` to `manifest.js`, step labels + idempotency to `install()`, and five smoke tests. The production code in `manifest.js` and `install.js` is clean — the `checkUpToDate()` logic is correct and the step-label refactor preserves all prior behavior including the AGENTS.md edge case. One minor type contract gap exists in `checkUpToDate` but has no runtime impact.

The test file contains one critical defect and two warnings. The critical issue is that `require("../bin/install.js")` triggers `main()` unconditionally — there is no `PD_TEST_MODE` guard on the `main()` invocation — causing the idempotency test to execute a real global install (for all platforms) as a side effect, and creating a race condition that can make the `!hasStepLabel` assertion non-deterministic.

---

## Critical Issues

### CR-01: `main()` fires on `require()` — not guarded by `PD_TEST_MODE`

**File:** `bin/install.js:378`  
**Issue:** `main().catch(...)` is called unconditionally at module load time. The `PD_TEST_MODE` guard at line 385 only controls `module.exports`; it does **not** prevent `main()` from running. When the idempotency test executes `require("../bin/install.js")` (line 129 of the test), `main()` fires and:

1. Detects non-TTY (`process.stdin.isTTY` is falsy in the test runner)  
2. `promptRuntime()` returns all platforms  
3. Calls `await install(runtime, true, null)` for each platform — performing a real global installation  
4. Emits step-label output (`[1/4]`, `[2/4]` …) into the captured `console.log` while the test's capture hook is still active  

This means the `assert.ok(!hasStepLabel, ...)` assertion at line 149 of the test is **non-deterministic**: it passes or fails depending on whether `main()`'s async chain races ahead of `await install("claude", true, testDir)` returning. It also produces real side effects on the developer's machine.

**Fix:** Guard `main()` with a `require.main === module` or `PD_TEST_MODE` check, consistent with the existing exports guard:

```js
// bin/install.js — replace the unconditional call at line 378:

if (require.main === module) {
  main().catch((err) => {
    log.error(err.message);
    if (process.env.PD_DEBUG) console.error(err.stack);
    process.exit(1);
  });
}

// Test exports (unchanged)
if (process.env.PD_TEST_MODE) {
  module.exports = { parseArgs, install, uninstall };
}
```

`require.main === module` is the idiomatic Node.js pattern and requires no extra env var.

---

## Warnings

### WR-01: `process.env = originalEnv` does not properly restore environment

**File:** `test/smoke-install.test.js:104`  
**Issue:** `process.env = originalEnv` replaces the `process.env` reference with a plain object spread. This works for pure-JS reads of `process.env` within Node, but:
- Child processes spawned by `execSync` inherit the **OS-level** environment, not the replaced JS object. If a later test relies on `PD_TEST_MODE` being absent for a subprocess check, the restore silently fails.
- It leaves `process.env` as a prototype-less plain object instead of the special `process.env` proxy, which can break third-party modules that call `Object.getPrototypeOf(process.env)`.

**Fix:** Delete only the keys that were added, rather than replacing the reference:

```js
afterEach(() => {
  // Restore only what was changed — don't replace process.env itself
  delete process.env.PD_TEST_MODE;
  delete require.cache[require.resolve("../bin/install.js")];
});
```

---

### WR-02: Step 4 swallows useful stderr — `err.message` is not the failure detail

**File:** `bin/install.js:218`  
**Issue:** When `execSync('node bin/sync-instructions.js', { stdio: 'pipe' })` throws, the error's `.message` is always the boilerplate `"Command failed: node bin/sync-instructions.js"`. The actual failure reason is in `err.stderr` (a `Buffer` when `stdio: 'pipe'`). The current code logs the unhelpful boilerplate and discards the real cause, making debugging agent-sync failures difficult.

```js
} catch (err) {
  log.warn(`Agent sync failed: ${err.message}`);  // always generic
}
```

**Fix:**

```js
} catch (err) {
  const detail = err.stderr
    ? err.stderr.toString().trim()
    : err.message;
  log.warn(`Agent sync failed: ${detail}`);
}
```

---

## Info

### IN-01: `checkUpToDate` returns `undefined` for `installedVersion` when manifest lacks `version` field

**File:** `bin/lib/manifest.js:113`  
**Issue:** If a manifest JSON file exists but has no `version` key (corrupted, hand-edited, or written by a future format), `manifest.version` is `undefined`. The return value becomes `{ upToDate: false, installedVersion: undefined }`, violating the JSDoc contract of `string | null`. The caller in `install.js` line 155 (`if (installedVersion)`) is unaffected because both `null` and `undefined` are falsy, but the type inconsistency could confuse future callers.

**Fix:** Normalise the missing-version case explicitly:

```js
function checkUpToDate(configDir, currentVersion) {
  const manifest = readManifest(configDir);
  if (!manifest) return { upToDate: false, installedVersion: null };
  const installedVersion = manifest.version ?? null;
  return {
    upToDate: installedVersion === currentVersion,
    installedVersion,
  };
}
```

---

### IN-02: `log.step` test does not restore `console.log` on assertion failure

**File:** `test/smoke-install.test.js:73-92`  
**Issue:** If either assertion at lines 84 or 89 throws, `console.log = originalLog` at line 81 has already run — but only because it's placed before the assertions. The structure is correct by luck of ordering. However, the capture pattern should use try/finally to make teardown robust to future changes:

```js
it("outputs [N/M] format", () => {
  const { log } = require("../bin/lib/utils");
  const originalLog = console.log;
  let captured = "";
  console.log = (msg) => { captured = msg; };
  try {
    log.step(1, 4, "Test message");
  } finally {
    console.log = originalLog;
  }
  assert.ok(captured.includes("[1/4]"), `Expected [1/4] in output, got: ${captured}`);
  assert.ok(captured.includes("Test message"), `Expected "Test message" in output, got: ${captured}`);
});
```

---

## Files with no issues

- **`bin/lib/utils.js`** — color change (yellow → cyan for `log.step`) is a one-line cosmetic change with no logic impact. Correct.
- **`bin/lib/manifest.js`** — `checkUpToDate()` logic is correct. `readManifest()` fallback, null guard, and equality comparison are all sound. Version comparison is intentionally exact-string (not semver), which is correct given the installer controls both the write and the read side.
- **`bin/install.js`** (production logic) — The `[1/4]–[4/4]` step labels are correctly placed. The idempotent early-return at lines 148–152 correctly fires before the blank line separator and step output, so no output is emitted on a no-op run. The AGENTS.md edge case (lines 212–223) is handled: `fs.existsSync` check before invoking `sync-instructions.js`, and the missing-file branch emits `log.success("Agent sync skipped (no AGENTS.md found)")` — the success path for step 4 is always reached.

---

_Reviewed: 2025-01-31_  
_Reviewer: gsd-code-reviewer_  
_Depth: standard_
