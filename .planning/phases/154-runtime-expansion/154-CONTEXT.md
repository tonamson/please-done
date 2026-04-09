# Phase 154 — Runtime Expansion: Discuss Context

> Phase: 154
> Status: context-locked
> Locked: true

## Goal

Expand from 7 to 11 supported runtimes by adding Kilo, Antigravity, Augment, and Trae.
Also fix Windsurf's config path and add `--force-statusline` flag (parse-only, with warning).

## Locked Decisions

### D1: New Runtimes to Add
**Decision:** Add 4 new runtimes: kilo, antigravity, augment, trae
**Note:** cursor and windsurf already exist in platforms.js
**Config dirs (from GSD build repo):**
- kilo: `~/.config/kilo/`
- antigravity: `~/.gemini/antigravity/` (subdirectory inside gemini config)
- augment: `~/.augment/`
- trae: `~/.trae/`

### D2: Windsurf Path Fix
**Decision:** Update windsurf `dirName` from `.windsurf` to match `~/.codeium/windsurf/` path
**Implementation:** In `getGlobalDir()`, windsurf case returns `path.join(home, '.codeium', 'windsurf')`

### D3: --force-statusline Flag
**Decision:** Parse the flag and store in `flags.forceStatusline`. If set, log a warning:
  `"--force-statusline: statusline config not yet supported in this version"`
**Do NOT** implement any actual statusline writing logic.

## Files to Modify

1. `bin/lib/platforms.js` — Add 4 new runtime entries to PLATFORMS + TOOL_MAP; fix windsurf path in `getGlobalDir()`
2. `bin/install.js` — Add `--kilo`, `--antigravity`, `--augment`, `--trae`, `--force-statusline` flags to `parseArgs()`; add warning for forceStatusline; add new runtimes to `getInstalledDirs()`; update `showHelp()` with new flags
3. `bin/lib/prompt.js` — No changes needed (uses `getAllRuntimes()` which auto-picks up new platforms)

## Runtime Details

Each new runtime uses the same skill format as the closest existing equivalent:
- kilo: skillFormat `nested`, commandPrefix `/pd:`, same as claude/gemini/cursor
- antigravity: skillFormat `nested`, commandPrefix `/pd:`, same as gemini (shares ~/.gemini base)
- augment: skillFormat `nested`, commandPrefix `/pd:`, standard
- trae: skillFormat `nested`, commandPrefix `/pd:`, standard

All 4 new runtimes use empty TOOL_MAP (native Claude tool names).

## Constraints

- `getAllRuntimes()` reads from `Object.keys(PLATFORMS)` — adding to PLATFORMS auto-propagates to `--all`, interactive menu, etc.
- No new npm dependencies
- Keep all existing runtime behavior unchanged
- Update `showHelp()` to list all 11 runtimes (not just original 5)
