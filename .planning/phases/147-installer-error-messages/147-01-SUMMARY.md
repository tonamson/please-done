---
phase: 147
plan: "01"
subsystem: installer
tags: [error-handling, pure-function, zero-dependency]
dependency_graph:
  requires: []
  provides: [classifyError]
  affects: [bin/install.js]
tech_stack:
  added: []
  patterns: [pure-function, module.exports]
key_files:
  created:
    - bin/lib/error-classifier.js
  modified: []
decisions:
  - "Detection priority: err.code checks before message regex to avoid false positives"
  - "MISSING_DEP URL extraction uses first URL found in message"
  - "PERMISSION hint uses err.path when available for precise sudo chown command"
metrics:
  duration: "35s"
  completed: "2026-04-08T04:48:44Z"
  tasks_completed: 1
  files_created: 1
  files_modified: 0
---

# Phase 147 Plan 01: Create error-classifier.js Summary

## One-liner
Pure zero-dependency `classifyError(err)` mapping Node.js errors to `{ category, message, hint }` across 4 actionable categories (PERMISSION, PLATFORM_UNSUPPORTED, MISSING_DEP, GENERIC).

## What Was Built

Created `bin/lib/error-classifier.js` — a strict-mode, zero-dependency classifier that inspects any thrown error and returns a structured result for clean terminal output.

### Detection Logic (priority order)
1. **PERMISSION** — `err.code === 'EACCES' || 'EPERM'` → hint with `sudo chown $(whoami) <path>` when `err.path` present
2. **PLATFORM_UNSUPPORTED** — `err.code === 'MODULE_NOT_FOUND'` → hint pointing to GitHub repo
3. **MISSING_DEP** — `/not installed|not found|requires|missing/i.test(err.message)` → extracts URL from message when available
4. **GENERIC** — fallback → hint to use `PD_DEBUG=1`

## Tasks Completed

| Task | Description | Commit | Files |
|------|-------------|--------|-------|
| 1 | Create bin/lib/error-classifier.js | 89c6109 | bin/lib/error-classifier.js |

## Verification Results

All 4 inline checks passed:
- `PERMISSION OK` — EACCES with path → sudo chown hint ✓
- `MISSING_DEP OK` — URL extracted from message ✓
- `PLATFORM_UNSUPPORTED OK` — MODULE_NOT_FOUND → "not yet supported" hint ✓
- `GENERIC OK` — unknown error → PD_DEBUG=1 hint ✓

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

None — all return values are fully wired with real logic.

## Self-Check: PASSED
