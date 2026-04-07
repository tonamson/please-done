---
phase: 145
plan: "03"
title: "Prompt Extraction with TTY Handling"
subsystem: "installer/prompt"
tags: [installer, prompt, tty, non-interactive, ux]
dependency_graph:
  requires: [tty-guarded-colorize, platform_description_field]
  provides: [prompt-module, non-interactive-defaults, confirmation-line]
  affects: [bin/install.js, installer-ux]
tech_stack:
  added: []
  patterns: [module-extraction, tty-detection-at-entry, non-interactive-defaults]
key_files:
  created:
    - bin/lib/prompt.js
  modified:
    - bin/install.js
decisions:
  - "D-05: promptRuntime() and promptLocation() extracted to bin/lib/prompt.js"
  - "D-06: Module exports { promptRuntime, promptLocation }"
  - "D-08: createRL() and ask() kept private (not exported)"
  - "D-11: Display format uses em dash separator with description"
  - "D-12: Non-TTY detection at top of both functions"
  - "D-13: Non-TTY platform selection returns getAllRuntimes()"
  - "D-14: Non-TTY location selection returns true (global)"
  - "D-15: Non-TTY messages use log.info() (no color)"
  - "D-16: Confirmation line added after prompt in main()"
metrics:
  duration: "200s"
  tasks: 2
  completed: "2026-04-07T20:02:19Z"
---

# Phase 145 Plan 03: Prompt Extraction with TTY Handling Summary

**One-liner:** Extracted prompt functions to bin/lib/prompt.js with numbered selector showing descriptions, non-TTY defaults for all platforms, and confirmation line.

## What Was Built

### New Module: bin/lib/prompt.js

Created a new module extracting prompt functions from install.js with enhanced TTY handling:

```javascript
// Non-TTY path (piped/CI input)
if (!process.stdin.isTTY) {
  log.info("Non-interactive mode: installing for all platforms");
  return getAllRuntimes();
}

// Interactive path with descriptions
runtimes.forEach((rt, i) => {
  console.log(`  ${i + 1}. ${PLATFORMS[rt].name} — ${PLATFORMS[rt].description}`);
});
console.log(`  ${runtimes.length + 1}. All platforms`);
```

### Changes to bin/install.js

- Removed 54 lines of inline prompt code (createRL, ask, promptRuntime, promptLocation)
- Removed `readline` require (moved to prompt.js)
- Removed non-TTY special case in main() (now handled by prompt.js)
- Added import: `require("./lib/prompt")`
- Added confirmation line after prompt

### Behavior Changes

| Scenario | Before | After |
|----------|--------|-------|
| Non-TTY (piped) | Silent default to Claude only | Announces "installing for all platforms", installs all |
| Interactive | Numbered list with bare names | Numbered list with em dash + description |
| After selection | Silent continuation | Confirmation line: "Installing for: ..." |

## Verification Results

All acceptance criteria verified:

```
=== Verification 1: prompt.js exports ===
[ 'promptRuntime', 'promptLocation' ]

=== Verification 2: install.js imports prompt.js ===
1

=== Verification 3: createRL removed from install.js ===
0

=== Verification 4: Non-interactive path (piped input) ===
Non-interactive mode: installing for all platforms
Non-interactive mode: using global install
Installing for: Claude Code, Codex CLI, Gemini CLI, OpenCode, GitHub Copilot, Cursor, Windsurf
```

## Commits

| Task | Description | Commit | Files |
|------|-------------|--------|-------|
| 1 | Create prompt.js with TTY handling and descriptions | 453ce91 | bin/lib/prompt.js |
| 2 | Use prompt.js and add confirmation line | 7777c43 | bin/install.js |

## Deviations from Plan

None — plan executed exactly as written.

## Success Criteria Checklist

- [x] `bin/lib/prompt.js` exists and exports `{ promptRuntime, promptLocation }`
- [x] `promptRuntime()` shows numbered list with descriptions (format: `N. Name — Description`)
- [x] Non-TTY `promptRuntime()` prints "Non-interactive mode: installing for all platforms"
- [x] Non-TTY `promptLocation()` prints "Non-interactive mode: using global install"
- [x] `bin/install.js` imports from `./lib/prompt` and removed inline prompt functions
- [x] Confirmation line `Installing for: ...` appears after interactive selection
- [x] `echo "1" | node bin/install.js` triggers non-interactive path with announcement

## Requirement Completion

- **INSTALL-04**: Complete. All UX improvements delivered:
  - TTY guard (Plan 01)
  - Platform descriptions (Plan 02)
  - Numbered selector with descriptions (this plan)
  - Non-TTY announcement (this plan)
  - Confirmation line (this plan)

## Self-Check: PASSED

- [x] bin/lib/prompt.js exists
- [x] bin/install.js modified
- [x] Commit 453ce91 exists in git log
- [x] Commit 7777c43 exists in git log
