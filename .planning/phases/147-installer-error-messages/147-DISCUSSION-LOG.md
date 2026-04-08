---
phase: 147
mode: auto
created: 2026-04-08
---

# Phase 147 Discussion Log — Auto Mode

## Mode: --auto
All decisions selected by agent based on codebase analysis. No user interaction required.

## Codebase Analysis

### Error Throw Sites Found
- `bin/lib/installers/claude.js`: 5 throw sites — all "not installed" / "not found" style with URLs already embedded
- `bin/lib/installers/codex.js`, `copilot.js`, `gemini.js`, `opencode.js`: no explicit throws (lighter installers)
- `bin/install.js` install() catch: rethrows with `log.error(err.message)` before throwing
- `bin/install.js` main().catch(): `log.error(err.message)` + optional stack if PD_DEBUG

### Gap Identified
- EACCES/EPERM from fs operations bubble up with Node.js default messages like "EACCES: permission denied, mkdir '/root/.claude/commands'" — no fix hint
- MODULE_NOT_FOUND for an unsupported platform gets `log.error("Installation failed: ...")` — not classified
- main().catch() shows `err.message` only — adequate for "already has URL" messages but poor for system errors

### Design Chosen
Centralized classifier at `bin/lib/error-classifier.js` → called from `main().catch()`. 4 categories. 12 decisions locked (D-01–D-12).

## Decisions Summary
| ID | Topic | Choice |
|----|-------|--------|
| D-01 | Classification location | bin/lib/error-classifier.js (new) |
| D-02 | Categories | MISSING_DEP, PERMISSION, PLATFORM_UNSUPPORTED, GENERIC |
| D-03 | Detection rules | err.code pattern matching + message regex |
| D-04 | PERMISSION hint | sudo chown $(whoami) + err.path |
| D-05 | MISSING_DEP hint | Reuse existing message URL if present |
| D-06 | PLATFORM hint | Guide to GitHub repo docs |
| D-07 | Output format | ✗ Category: cause + Hint: fix |
| D-08 | Stack suppression | classifier intercepts in main().catch() |
| D-09 | Error propagation | No change to install() catch |
| D-10 | Tests | 4 cases in test/smoke-errors.test.js |
| D-11 | Installer messages | Leave unchanged (already actionable) |
| D-12 | Export | classifyError(err) → { category, message, hint } |
