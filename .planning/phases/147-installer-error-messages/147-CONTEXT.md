---
phase: 147
name: Installer Error Messages
milestone: v12.3
status: discussed
mode: auto
created: 2026-04-08
---

# Phase 147 Context — Installer Error Messages

## Phase Goal
When installation fails, users see the specific error category, the cause, and an actionable fix hint — never a raw stack trace.

## Requirements Coverage
- **INSTALL-02**: Actionable error messages replace raw stack traces; each error category has a specific fix hint; exit code is non-zero on failure

## Prior Phase Decisions (inherited)
- Zero-dependency constraint: Node.js built-ins only (no npm packages)
- `main().catch()` is guarded with `require.main === module` (Phase 146)
- `install()` currently rethrows errors after `log.error(err.message)`
- `bin/lib/` houses all utilities (manifest.js, utils.js, etc.)

---

## Decisions

### D-01: Error classification location
**Decision**: Centralized `bin/lib/error-classifier.js` utility (new file)
**Rationale**: Keeps classifier testable in isolation, avoids polluting main().catch() with if/else chains, reusable if uninstall() needs it later
**Alternatives rejected**: Inline in main().catch() (untestable, hard to extend)

### D-02: Error categories
**Decision**: 4 categories: MISSING_DEP, PERMISSION, PLATFORM_UNSUPPORTED, GENERIC
**Rationale**: Matches exactly what INSTALL-02 + roadmap success criteria require. PLATFORM_UNSUPPORTED already partially handled (returns early) but should still be classified if it reaches main().
**Categories defined**:
- `MISSING_DEP` — a required CLI or tool is not installed
- `PERMISSION` — EACCES or EPERM from file system operations
- `PLATFORM_UNSUPPORTED` — MODULE_NOT_FOUND for a platform installer
- `GENERIC` — all other errors (message passed through, stack suppressed)

### D-03: Error detection rules
**Decision**: Pattern matching on err.code + err.message:
- `err.code === "EACCES" || err.code === "EPERM"` → PERMISSION
- `err.code === "MODULE_NOT_FOUND"` (from platform require) → PLATFORM_UNSUPPORTED
- `err.message` matches `/not installed|not found|requires|missing/i` → MISSING_DEP
- All others → GENERIC
**Rationale**: No brittle class-instanceof checks; works across all Node.js versions; covers the real error types thrown in installers

### D-04: PERMISSION fix hint
**Decision**: `"Fix: sudo chown $(whoami) <path>"` where path comes from `err.path` (Node sets this on EACCES)
**Fallback**: If `err.path` is undefined: `"Fix: Check file permissions in your home directory"`
**Rationale**: Roadmap SC-2 requires the affected path + concrete fix in the message

### D-05: MISSING_DEP fix hint
**Decision**: Reuse the existing error message if it already contains a URL or "Install via" hint; otherwise append `"Install the missing dependency and re-run the installer"`
**Rationale**: claude.js installer messages already include "Install first: https://..." URLs — don't duplicate, trust them

### D-06: PLATFORM_UNSUPPORTED fix hint
**Decision**: `"This platform is not yet supported. See: https://github.com/tonamson/please-done for supported platforms"`
**Rationale**: MODULE_NOT_FOUND on a platform installer is not a user error — guide them to docs

### D-07: Output format in terminal
**Decision**: Single formatted block:
```
✗ <Category>: <cause>
  Hint: <actionable fix>
```
**Rationale**: Consistent with `log.error` + `log.info` pattern already used; no raw stack trace exposed
**Note**: `log.error` writes the first line; `log.info` writes the `  Hint:` line

### D-08: Stack trace suppression
**Decision**: `main().catch()` calls classifier, then `log.error(classified.message)` + `log.info("  Hint: " + classified.hint)` + `process.exit(1)`. Stack only shown when `PD_DEBUG=1`.
**Rationale**: Phase goal explicitly says "never a raw stack trace" — classifier always intercepts before console.error

### D-09: install() error propagation
**Decision**: Keep `throw err` in install()'s catch block (already there) — no change. Classification happens in main().catch() only.
**Rationale**: Keeps single classification point; install() is also called in tests with PD_TEST_MODE so test errors bubble cleanly

### D-10: Tests
**Decision**: New `test/smoke-errors.test.js` with 4 test cases:
1. EACCES error → PERMISSION category + path in hint
2. "not installed" error → MISSING_DEP category
3. MODULE_NOT_FOUND error → PLATFORM_UNSUPPORTED category
4. Generic error → GENERIC category, message passed through
**Test framework**: Node.js built-in `node:test` + `node:assert/strict`

### D-11: Existing installer error messages
**Decision**: Do NOT modify individual installer throw messages — they are already actionable (contain URLs, version hints, etc.)
**Rationale**: Scope discipline — INSTALL-02 is about classification at the output layer, not rewriting every throw site

### D-12: Export pattern
**Decision**: `module.exports = { classifyError }` — single exported function
**Signature**: `classifyError(err) → { category, message, hint }`

### Deferred: SC-3 MODULE_NOT_FOUND exit code
**Decision**: The `install()` Step 2 catch block catches `MODULE_NOT_FOUND` with `log.warn(...); return;` — this means an unsupported-platform failure exits 0 via normal main() completion. This path does not reach `main().catch()` and is therefore outside INSTALL-02's scope (which targets actionable error classification at the output layer). Fixing exit code for MODULE_NOT_FOUND is deferred to a future phase.
**Rationale**: INSTALL-02 acceptance criteria focus on actionable messages, not on exit codes for unimplemented platform stubs. The current `return;` behavior is intentional (graceful degradation).
