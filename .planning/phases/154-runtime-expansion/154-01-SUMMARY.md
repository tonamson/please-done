---
phase: 154-runtime-expansion
plan: "01"
subsystem: platforms
tags: [runtimes, platforms, installer, cli-flags]
dependency_graph:
  requires: []
  provides: [kilo-runtime, antigravity-runtime, augment-runtime, trae-runtime, windsurf-path-fix, force-statusline-flag]
  affects: [bin/lib/platforms.js, bin/install.js]
tech_stack:
  added: []
  patterns: [runtime-registry, cli-flag-dispatch]
key_files:
  created: []
  modified:
    - bin/lib/platforms.js
    - bin/install.js
decisions:
  - "windsurf path corrected to ~/.codeium/windsurf to match actual Codeium installation path"
  - "kilo uses XDG_CONFIG_HOME pattern (like opencode) per XDG base dir spec"
  - "antigravity placed under ~/.gemini/antigravity (Gemini ecosystem)"
  - "--force-statusline implemented as parse-only with warning; statusline wiring deferred"
metrics:
  duration: "3 minutes"
  completed: "2026-04-09"
  tasks_completed: 2
  files_modified: 2
requirements: [RT-01, RT-02, RT-03, RT-04, RT-05, RT-06, CFG-01, CFG-02]
---

# Phase 154 Plan 01: Runtime Expansion Summary

**One-liner:** Expanded platform registry from 7 to 11 runtimes (kilo, antigravity, augment, trae) with windsurf path fix and --force-statusline CLI flag.

## What Was Built

Added 4 new AI coding runtimes to the please-done platform registry and installer CLI. Fixed the incorrect windsurf global config path. Added `--force-statusline` flag as a parse-only feature with a warning.

## Tasks Completed

| # | Task | Commit | Files |
|---|------|--------|-------|
| 1 | Add 4 new runtimes to platforms.js + fix windsurf path | `43d7b6e` | `bin/lib/platforms.js` |
| 2 | Add CLI flags for new runtimes + --force-statusline | `80f55e9` | `bin/install.js` |

## Verification Results

```
Count: 11
Runtimes: claude, codex, gemini, opencode, copilot, cursor, windsurf, kilo, antigravity, augment, trae
windsurf: /root/.codeium/windsurf   ✅ (was .windsurf)
kilo: /root/.config/kilo            ✅
antigravity: /root/.gemini/antigravity  ✅
augment: /root/.augment             ✅
trae: /root/.trae                   ✅
```

Tests: 5/5 install smoke tests passing, 36/36 platforms smoke tests passing.

## Decisions Made

1. **windsurf path corrected** — `.windsurf` → `.codeium/windsurf` to match the actual Codeium installation directory structure
2. **kilo uses XDG_CONFIG_HOME** — follows the same XDG pattern as opencode, defaulting to `~/.config/kilo`
3. **antigravity under `.gemini/`** — placed as `.gemini/antigravity` since Antigravity runs on Gemini's ecosystem
4. **`--force-statusline` is parse-only** — logs a warning; actual statusline config wiring deferred to a future plan

## Deviations from Plan

None - plan executed exactly as written.

## Known Stubs

None — new runtimes are real definitions with correct paths. The `--force-statusline` flag intentionally logs a "not yet supported" warning, which is the specified behavior for this plan.

## Self-Check: PASSED

- `bin/lib/platforms.js` — modified ✅
- `bin/install.js` — modified ✅
- Commit `43d7b6e` — exists ✅
- Commit `80f55e9` — exists ✅
- Runtime count: 11 ✅
- Tests passing ✅
- Pushed to main ✅
