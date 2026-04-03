# Phase 86: Error Handling Hardening - Context

**Gathered:** 2026-04-03
**Status:** Ready for planning

<domain>
## Phase Boundary

Replace bare `catch {}` blocks in `bin/plan-check.js` and `bin/lib/utils.js` with conditional debug logging, and refactor `process.exit(1)` calls in `bin/lib/installers/claude.js` to throw errors instead — centralizing exit handling in `bin/install.js`.

Scope is limited to 3 files and targeted edits. No new features, no new utilities.

</domain>

<decisions>
## Implementation Decisions

### Debug Env Var (ERR-01, ERR-02)
- **D-01:** Use `process.env.PD_DEBUG` as the debug flag — matches REQUIREMENTS.md spec (`PD_DEBUG=1`), namespaced to this tool, won't collide with system `DEBUG` vars.
- **D-02:** Also update `bin/install.js:396` from `process.env.DEBUG` → `process.env.PD_DEBUG` for consistency. One flag across all files.

### Silent Catches in utils.js (ERR-02)
- **D-03:** `fileHash` gets `if (process.env.PD_DEBUG) console.error(...)` — failure to read a file is meaningful debug info.
- **D-03b:** `commandExists` and `isWSL` stay **intentionally silent** — returning `false` on failure is expected behavior (command not installed, not on Linux). No debug log needed.

### claude.js Throw Refactor (ERR-03)
- **D-04:** Replace each `log.error(msg) + process.exit(1)` pattern with `throw new Error(msg)` only — remove the `log.error()` call. `install.js`'s `main().catch()` already handles display (`log.error(err.message)`) and exits. No duplicate messages.
- **D-05:** Use generic `new Error(message)` — no custom error types needed. The existing `install.js` catch handles all thrown errors uniformly.

### the agent's Discretion
- Exact debug log format in plan-check.js and utils.js: `console.error('[debug]', err)` or similar — agent decides based on existing patterns.
- Whether to add PD_DEBUG check to any additional catch blocks discovered during implementation — agent can add if genuinely useful.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Target Files
- `bin/plan-check.js` — lines 66, 76: bare `catch {}` blocks to fix (ERR-01)
- `bin/lib/utils.js` — lines 140, 169, 200: bare `catch` blocks; only fileHash (line 140) gets debug logging (ERR-02)
- `bin/lib/installers/claude.js` — 6 `process.exit(1)` calls to replace with `throw new Error(...)` (ERR-03)
- `bin/install.js` — line 396: update `process.env.DEBUG` → `process.env.PD_DEBUG`; line 394: existing main().catch handler that will receive thrown errors

### Requirements
- `.planning/REQUIREMENTS.md` — ERR-01, ERR-02, ERR-03 definitions with exact line numbers

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `install.js:394` `main().catch((err) => { log.error(err.message); process.exit(1); })` — already set up to handle thrown errors from installers; no changes needed to catch structure, just update DEBUG → PD_DEBUG on line 396.

### Established Patterns
- Debug logging pattern in install.js: `if (process.env.DEBUG) console.error(err.stack)` → becomes `if (process.env.PD_DEBUG) console.error(err.stack)`
- `catch (err)` blocks already exist in utils.js line 186 (non-bare) — use same variable name `err` for consistency

### Integration Points
- `claude.js` is called from `install.js` inside a try/catch (line 213): thrown errors propagate to `main().catch` automatically — no wiring changes needed.

</code_context>

<specifics>
## Specific Ideas

No specific requirements beyond REQUIREMENTS.md — open to standard debug logging approaches.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 86-error-handling-hardening*
*Context gathered: 2026-04-03*
