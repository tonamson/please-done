# Phase 86: Error Handling Hardening - Research

**Researched:** 2026-04-03
**Domain:** Node.js error handling patterns — catch blocks, process.exit(), debug logging
**Confidence:** HIGH (all findings from direct source inspection)

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** Use `process.env.PD_DEBUG` as the debug flag — matches REQUIREMENTS.md spec (`PD_DEBUG=1`), namespaced to this tool, won't collide with system `DEBUG` vars.
- **D-02:** Also update `bin/install.js:396` from `process.env.DEBUG` → `process.env.PD_DEBUG` for consistency. One flag across all files.
- **D-03:** `fileHash` gets `if (process.env.PD_DEBUG) console.error(...)` — failure to read a file is meaningful debug info.
- **D-03b:** `commandExists` and `isWSL` stay **intentionally silent** — returning `false` on failure is expected behavior. No debug log needed.
- **D-04:** Replace each `log.error(msg) + process.exit(1)` pattern with `throw new Error(msg)` only — remove the `log.error()` call. `install.js`'s `main().catch()` already handles display and exits.
- **D-05:** Use generic `new Error(message)` — no custom error types needed.

### the agent's Discretion
- Exact debug log format in plan-check.js and utils.js: `console.error('[debug]', err)` or similar — agent decides based on existing patterns.
- Whether to add PD_DEBUG check to any additional catch blocks discovered during implementation — agent can add if genuinely useful.

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope.
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| ERR-01 | `bin/plan-check.js` bare `catch {}` blocks (lines 66, 76) replaced with conditional debug logging | Lines 61-76 inspected; both are bare `catch {}` needing `catch (err)` + PD_DEBUG guard |
| ERR-02 | `bin/lib/utils.js` bare `catch` blocks (lines 140, 169, 200) replaced with conditional debug logging | Lines 136-203 inspected; only fileHash (140) gets debug log; commandExists (169) and isWSL (200) stay silent per D-03b |
| ERR-03 | `bin/lib/installers/claude.js` — all 6 `process.exit(1)` calls replaced with `throw new Error(...)`, exit handling in `bin/install.js` | All 6 locations confirmed (lines 37, 48, 57, 86, 101, 335); propagation path verified through install.js catch chain |
</phase_requirements>

---

## Summary

This phase is a targeted surgical edit across 4 files (3 changed, 1 minor update). The goal is to surface previously swallowed errors via `PD_DEBUG=1` and centralize process exit in `bin/install.js`. No new utilities, no new modules, no architectural changes — just catch-block and process.exit refactoring.

All decisions are locked in CONTEXT.md. The implementer should follow the exact change specifications below without deviation. The primary risk is accidentally touching the intentionally-silent catch blocks in claude.js (file cleanup catches with `/* already gone */` / `/* not exists */` comments) — those must NOT be changed.

**Primary recommendation:** Make the 4 file changes in order (install.js → plan-check.js → utils.js → claude.js), run `node --test test/smoke-error-handling.test.js` after each file to catch regressions early.

---

## Current State of Each Target File

### 1. bin/plan-check.js (ERR-01)

Two bare `catch {}` blocks — both need `catch (err)` + PD_DEBUG guard:

```javascript
// Lines 61-66: filesystem reads for research directories
try {
  hasResearchFiles = (
    (fs.existsSync(researchInternalDir) && fs.readdirSync(researchInternalDir).filter(f => f.endsWith('.md')).length > 0) ||
    (fs.existsSync(researchExternalDir) && fs.readdirSync(researchExternalDir).filter(f => f.endsWith('.md')).length > 0)
  );
} catch {}   // ← BARE — needs PD_DEBUG logging

// Lines 72-76: JSON.parse for config.json
  try {
    const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    check06Severity = config?.checks?.research_backing?.severity;
    check07Severity = config?.checks?.hedging_language?.severity;
  } catch {}  // ← BARE — needs PD_DEBUG logging
```

**Required changes:**

```javascript
// Line 66 → replace bare catch {} with:
} catch (err) {
  if (process.env.PD_DEBUG) console.error('[plan-check] research dir read error:', err);
}

// Line 76 → replace bare catch {} with:
  } catch (err) {
    if (process.env.PD_DEBUG) console.error('[plan-check] config.json parse error:', err);
  }
```

### 2. bin/lib/utils.js (ERR-02)

Three bare `catch` blocks at lines 140, 169, 200. Only line 140 (`fileHash`) gets debug logging. Lines 169 (`commandExists`) and 200 (`isWSL`) are intentionally silent per D-03b.

**fileHash (lines 136-143) — NEEDS CHANGE:**
```javascript
function fileHash(filePath) {
  try {
    const content = fs.readFileSync(filePath);
    return crypto.createHash("sha256").update(content).digest("hex");
  } catch {        // ← needs (err) + PD_DEBUG
    return null;
  }
}
```

Required change at line 140:
```javascript
  } catch (err) {
    if (process.env.PD_DEBUG) console.error('[fileHash]', err);
    return null;
  }
```

**commandExists (lines 164-172) — STAYS SILENT (D-03b):**
```javascript
function commandExists(cmd) {
  // ...
  try {
    execSync(`command -v ${cmd}`, { stdio: "ignore" });
    return true;
  } catch {   // ← intentionally silent — command just not installed
    return false;
  }
}
```
No change required.

**isWSL (lines 195-203) — STAYS SILENT (D-03b):**
```javascript
function isWSL() {
  // ...
  try {
    const release = fs.readFileSync("/proc/version", "utf8").toLowerCase();
    return release.includes("microsoft") || release.includes("wsl");
  } catch {   // ← intentionally silent — not on Linux, no /proc/version
    return false;
  }
}
```
No change required.

### 3. bin/lib/installers/claude.js (ERR-03)

**All 6 `process.exit(1)` calls with their surrounding context:**

| Line | Context | Current Pattern | Required Change |
|------|---------|-----------------|-----------------|
| 33-38 | Claude CLI check | `log.error("Claude Code CLI not installed...")` + `process.exit(1)` | Remove log.error, add `throw new Error("Claude Code CLI not installed. Install first: https://claude.ai/download")` |
| 47-48 | Python check | `log.error("Python not installed...")` + `process.exit(1)` | Remove log.error, add `throw new Error("Python not installed. Requires Python 3.12+")` |
| 56-57 | Python version check | `log.error(\`Python 3.12+ required (currently ${pyVersion})\`)` + `process.exit(1)` | Remove log.error, add `throw new Error(\`Python 3.12+ required (currently ${pyVersion})\`)` |
| 85-86 | Git check | `log.error("Git not installed.")` + `process.exit(1)` | Remove log.error, add `throw new Error("Git not installed.")` |
| 100-101 | FastCode submodule check | `log.error("FastCode submodule missing...")` + `process.exit(1)` | Remove log.error, add `throw new Error("FastCode submodule missing. Run: git submodule update --init")` |
| 332-335 | API key prompt | Two `log.error()` calls + `process.exit(1)` | Remove both log.error calls, add `throw new Error("Gemini API Key not entered! FastCode MCP requires this key. Re-run the installer when you have a key.")` |

**IMPORTANT — DO NOT TOUCH these catch blocks (intentionally silent):**
- Lines 177-179: `catch { /* already gone */ }` — file cleanup, file may not exist
- Lines 190-192: `catch { /* not exists */ }` — symlink cleanup
- Lines 204-206: `catch { /* not exists */ }` — rules symlink cleanup
- Lines 225-227: `catch { log.warn("FastCode MCP registration failed") }` — already has logging ✓
- Lines 237-239: `catch { log.warn("Context7 MCP registration failed (optional)") }` — already has logging ✓
- Lines 297-299, 304-306: `catch { /* not exists/not empty */ }` in uninstall — intentionally silent
- Lines 381-383, 394-396, 407-409: `catch { /* already gone/not exists */ }` in installSkillsOnly — intentionally silent

### 4. bin/install.js (minor update)

**Single line change at line 396:**
```javascript
// Current:
if (process.env.DEBUG) console.error(err.stack);

// Required:
if (process.env.PD_DEBUG) console.error(err.stack);
```

**Propagation chain (verified):** claude.js `install()` is called at install.js line 209 inside `try { await installer.install(...) }`. Thrown errors hit the catch at line 213. Non-`MODULE_NOT_FOUND` errors are re-thrown (`throw err` at line 218), propagating to `main().catch()` at line 394 which calls `log.error(err.message)` and `process.exit(1)`. No wiring changes needed.

---

## Architecture Patterns

### Debug Logging Pattern (from install.js)
```javascript
// Source: bin/install.js:394-398 (existing pattern)
main().catch((err) => {
  log.error(err.message);
  if (process.env.PD_DEBUG) console.error(err.stack);  // after our fix
  process.exit(1);
});
```

Apply same gate in catch blocks:
```javascript
} catch (err) {
  if (process.env.PD_DEBUG) console.error('[context]', err);
  return <safe_default>;
}
```

### Throw-Instead-of-Exit Pattern
```javascript
// Before (library code calling process.exit):
log.error("Prerequisite missing.");
process.exit(1);

// After (throw, let bin/install.js handle exit):
throw new Error("Prerequisite missing.");
```

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Custom error classes | `class InstallError extends Error` | `new Error(msg)` | D-05 explicitly forbids custom types; install.js catch handles all uniformly |
| Debug logger utility | New `debug()` helper function | Inline `if (process.env.PD_DEBUG) console.error(...)` | Phase scope is 3 targeted files; adding a shared utility is out of scope |
| Error code system | `err.code = 'ERR_PREREQ'` | Plain string message | Unnecessary complexity; message already identifies the issue |

---

## Common Pitfalls

### Pitfall 1: Touching Intentionally Silent Catches in claude.js
**What goes wrong:** Accidentally adding debug logging to the file-cleanup catches (`/* already gone */`, `/* not exists */`) — these fire constantly during normal installs and would spam debug output.
**Why it happens:** The task says "fix bare catches" — developer pattern-matches all `catch {}` blocks.
**How to avoid:** Only change the 6 `process.exit(1)` locations. The cleanup catches are already correct (they document intent with comments).
**Warning signs:** If you see `/* already gone */` or `/* not exists */` in a catch block, leave it alone.

### Pitfall 2: Forgetting the log.error() Removal in claude.js
**What goes wrong:** Leaving `log.error(msg)` before the new `throw new Error(msg)` — results in duplicate error output (log.error prints once, then main().catch prints err.message again).
**Why it happens:** Keeping existing logging "just in case."
**How to avoid:** D-04 is explicit: replace the ENTIRE `log.error(msg) + process.exit(1)` block with only `throw new Error(msg)`.

### Pitfall 3: Two-Line Error in promptGeminiKey
**What goes wrong:** Only throwing one of the two messages from lines 333-334.
**Why it happens:** The pattern is two `log.error()` calls followed by `process.exit(1)` — easy to miss the second line.
**How to avoid:** Combine both messages into one Error string (or use the most important one — line 333 is primary, line 334 is a hint).

### Pitfall 4: Using `DEBUG` Instead of `PD_DEBUG`
**What goes wrong:** Leaving install.js:396 as `process.env.DEBUG` after updating all other files — inconsistent behavior.
**How to avoid:** D-02 is clear. Change install.js FIRST so the pattern is established before working on the other files.

### Pitfall 5: Existing smoke-error-handling.test.js Regex Sensitivity
**What goes wrong:** Post-change, the test's `bareCatch` regex (`/catch\s*\{[\s]*\}/g`) could trip on catch blocks with only whitespace.
**How to avoid:** After adding `if (process.env.PD_DEBUG)...` inside the catch bodies, those blocks are no longer bare. The commented catches in claude.js (`/* already gone */`) already pass the regex because they contain non-whitespace characters.

---

## Test Strategy

### Existing Tests That Cover These Files

| Test File | What It Tests | Current Status |
|-----------|--------------|----------------|
| `test/smoke-error-handling.test.js` | No bare `catch {}` in claude.js (and manifest.js, gemini.js); no catch-with-variable missing log.warn/throw | ✅ 6/6 pass |
| `test/smoke-utils.test.js` | fileHash, commandExists, listSkillFiles, etc. — functional behavior | ✅ 36/36 pass |
| `test/smoke-plan-checker.test.js` | plan-checker module logic (165 tests) | ✅ 165/165 pass |
| `test/smoke-installers.test.js` | install/uninstall flows via installSkillsOnly | ✅ 30/30 pass |

### What Phase 86 Changes Won't Break

- **smoke-error-handling.test.js:** The test uses `bareCatch = /catch\s*\{[\s]*\}/g` — after our fixes, bare catches are replaced with `catch (err) { ... }`, so regex won't match. The `ignoreCatch` regex (`/catch\s*\{[\s]*\/\*\s*ignore\s*\*\/[\s]*\}/g`) won't match either. The "uses log.warn()" check applies to `catch (variable)` blocks — the new fileHash catch uses `console.error` not `log.warn`, but fileHash is in utils.js which is NOT in this test's `TARGET_FILES`. ✅
- **smoke-utils.test.js:** fileHash tests check return values (`null` on failure) — still returns `null`. No behavior change, just added logging. ✅
- **smoke-installers.test.js:** Tests use `installSkillsOnly` which has no process.exit calls — unchanged. ✅

### What Phase 87 (TEST-02) Will Add Later

Per REQUIREMENTS.md TEST-02, the smoke-error-handling test will be expanded to include `bin/plan-check.js` and `bin/lib/utils.js` in `TARGET_FILES`. Phase 86 changes will make those files pass that future test naturally.

### Manual Smoke Test

After implementation, verify PD_DEBUG behavior:
```bash
# Verify debug flag renamed in install.js
PD_DEBUG=1 node bin/install.js --help 2>&1  # should not error

# Verify plan-check debug output (trigger parse error by pointing at bad dir)
PD_DEBUG=1 node bin/plan-check.js /tmp/nonexistent 2>&1

# Verify no process.exit in claude.js (static check)
grep -n "process\.exit" bin/lib/installers/claude.js
# Expected: 0 results
```

---

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Node.js built-in `node:test` (v18+) |
| Config file | none — direct invocation |
| Quick run command | `node --test test/smoke-error-handling.test.js` |
| Full suite command | `node --test test/*.test.js` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| ERR-01 | plan-check.js bare catches removed | static analysis | `node --test test/smoke-error-handling.test.js` (Phase 87 expands TARGET_FILES) | ✅ exists, but TARGET_FILES expansion is Phase 87 |
| ERR-02 | utils.js fileHash gets PD_DEBUG logging; commandExists/isWSL stay silent | unit + static | `node --test test/smoke-utils.test.js` | ✅ exists |
| ERR-03 | claude.js throws instead of process.exit(1) | static + integration | `grep -c "process.exit" bin/lib/installers/claude.js` → 0; `node --test test/smoke-error-handling.test.js` | ✅ exists |

### Sampling Rate
- **Per task commit:** `node --test test/smoke-error-handling.test.js && node --test test/smoke-utils.test.js`
- **Per wave merge:** `node --test test/*.test.js`
- **Phase gate:** Full suite green before `/gsd-verify-work`

### Wave 0 Gaps
None — existing test infrastructure covers regression detection. ERR-01 verification for plan-check.js specifically is done via grep/static check until Phase 87 expands the test. No new test files needed in Phase 86.

---

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Accidentally modifying "intentionally silent" catches in claude.js | Medium | Breaks install behavior / spams debug output | CONTEXT.md explicitly lists which catches to leave alone |
| promptGeminiKey double-log.error not fully removed | Low | Duplicate error messages to user | Count the log.error lines before removing (there are 2, not 1) |
| install.js DEBUG→PD_DEBUG missed | Low | install.js doesn't log stack on error, DEBUG env var users see no stack | Listed as first task to do |
| `smoke-error-handling.test.js` regex match on new catch bodies | Low | Test false positive | New bodies contain `if (process.env.PD_DEBUG) ...` — not whitespace-only, passes bareCatch regex |
| claude.js `installSkillsOnly` catch blocks | None | N/A | Those catches are `/* already gone */` / `/* not exists */` — same pattern as install(), no process.exit() involved |

---

## Sources

### Primary (HIGH confidence)
- Direct source inspection: `bin/plan-check.js` lines 61-77 (both catch blocks)
- Direct source inspection: `bin/lib/utils.js` lines 136-203 (all three catch blocks)
- Direct source inspection: `bin/lib/installers/claude.js` full file (all 6 process.exit locations)
- Direct source inspection: `bin/install.js` lines 194-219, 394-398 (catch chain + main().catch handler)
- Direct test inspection: `test/smoke-error-handling.test.js` (existing test scope and regexes)
- CONTEXT.md decisions D-01 through D-05 (all locked, no alternatives to research)

### Secondary (MEDIUM confidence)
- `test/smoke-utils.test.js` — functional test coverage of fileHash return values
- `test/smoke-installers.test.js` — installSkillsOnly test coverage

---

## Metadata

**Confidence breakdown:**
- Exact change locations: HIGH — confirmed by direct line-number inspection
- Propagation chain (throw → main().catch): HIGH — verified install.js lines 207-219
- Test impact: HIGH — all affected tests inspected, regexes analyzed
- Debug format: MEDIUM — agent discretion per CONTEXT.md; existing install.js pattern used as reference

**Research date:** 2026-04-03
**Valid until:** Until any of the 4 target files are modified (stable — no external dependencies)
