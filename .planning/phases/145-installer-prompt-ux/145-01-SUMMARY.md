---
phase: 145
plan: 01
subsystem: installer
tags: [tty, ansi, colors, colorize, no-color]

dependency_graph:
  requires: []
  provides: [tty-guarded-colorize]
  affects: [log.success, log.warn, log.error, log.step, log.banner]

tech_stack:
  added: []
  patterns: [tty-detection, no-color-standard]

key_files:
  created: []
  modified: [bin/lib/utils.js]

decisions:
  - "D-01: TTY detection added to colorize() (single function)"
  - "D-02: Guard condition process.stdout.isTTY && !process.env.NO_COLOR"
  - "D-03: Returns bare text when guard fires (no ANSI substitution)"
  - "D-04: All log.* callers inherit this guard transitively"

metrics:
  duration_seconds: 45
  completed: 2026-04-07T19:54:54Z
  tasks: 1
  files_modified: 1
---

# Phase 145 Plan 01: TTY Guard Summary

**One-liner:** TTY guard in colorize() preventing ANSI escape codes in piped/CI output, honoring NO_COLOR standard.

## What Changed

Added TTY detection to the `colorize()` function in `bin/lib/utils.js`:

```javascript
function colorize(color, text) {
  if (!process.stdout.isTTY || process.env.NO_COLOR) return text;
  return `${COLORS[color] || ""}${text}${COLORS.reset}`;
}
```

This single-line addition provides:
- **POSIX TTY detection**: `process.stdout.isTTY` check prevents ANSI codes in pipes/redirects
- **NO_COLOR standard compliance**: Respects the `NO_COLOR` environment variable
- **Transitive inheritance**: All `log.*` helpers (success, warn, error, step, banner) automatically inherit the guard

## Commits

| Task | Description | Commit | Files |
|------|-------------|--------|-------|
| 1 | Add TTY guard to colorize() | faf1442 | bin/lib/utils.js |

## Verification Results

All acceptance criteria verified:

1. ✅ `bin/lib/utils.js` contains `if (!process.stdout.isTTY || process.env.NO_COLOR) return text;` inside colorize()
2. ✅ `printf 'x\n' | node bin/install.js --help 2>&1 | grep -c $'\x1b'` returns 0
3. ✅ `NO_COLOR=1 node bin/install.js --help 2>&1 | grep -c $'\x1b'` returns 0
4. ✅ Direct TTY execution retains colored output (colorize() returns ANSI codes when isTTY=true)

## Deviations from Plan

None - plan executed exactly as written.

## Requirement Completion

- **INSTALL-04** (partial): TTY guard component complete. Full requirement also needs numbered selector and descriptions (plan 145-02).

## Self-Check: PASSED
