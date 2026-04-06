---
phase: "131"
plan: "01"
name: "AGENTS.md and Sync Script"
subsystem: "universal-runtime-support"
tags: [H-07, cross-runtime, agent-instructions, sync]
dependency_graph:
  requires: []
  provides: ["AGENTS.md", "bin/sync-instructions.js"]
  affects: ["bin/install.js", "package.json"]
tech_stack:
  added: [Node.js fs/path/os modules]
  patterns: [idempotent sync, cross-runtime deployment]
key_files:
  created:
    - "AGENTS.md"
    - "bin/sync-instructions.js"
  modified:
    - "bin/install.js"
    - "package.json"
decisions:
  - "Created AGENTS.md as single source of truth for all 12 runtimes"
  - "Implemented idempotent sync script that copies AGENTS.md to each runtime's config path"
  - "Integrated sync into bin/install.js after successful platform installation"
  - "Added sync and postinstall scripts to package.json for automatic sync on npm install"
metrics:
  duration: "2 minutes"
  completed: "2026-04-06"
---

# Phase 131 Plan 01: AGENTS.md and Sync Script Summary

## One-liner

Created AGENTS.md source of truth and bin/sync-instructions.js to deploy agent instructions across 12 AI coding runtimes.

## What Was Done

### Task 1: Created AGENTS.md Source of Truth
- Created comprehensive AGENTS.md at project root
- Contains Runtime Identification table (all 12 runtimes)
- Contains Core Agent Commands section with command tables
- Contains Capabilities Matrix (Commands, MCP Servers, Auto-Execute, Wave-Parallel)
- Contains Installation Paths section
- Contains Sync Requirements section
- Contains Tool Mappings section

### Task 2: Created bin/sync-instructions.js Script
- Created executable sync script with shebang `#!/usr/bin/env node`
- Implemented RUNTIMES array with all 12 runtime configurations
- Exports: `RUNTIMES`, `syncRuntime`, `expandPath`, `ensureDir`
- Supports `--dry-run`, `--verbose`, `--help` options
- Idempotent - safe to run multiple times

### Task 3: Integrated Sync into bin/install.js
- Added `PROJECT_ROOT` constant
- Added sync call after successful platform installation
- Wrapped in try-catch (non-fatal)
- Runs after each platform install completes

### Task 4: Added Sync to package.json
- Added `"sync": "node bin/sync-instructions.js"` script
- Added `"postinstall": "node bin/sync-instructions.js"` script

## Verification Results

| Check | Result |
|-------|--------|
| `AGENTS.md` exists at project root | ✓ |
| Contains all 12 runtimes | ✓ (grep found 5 Claude Code references, 3 Antigravity) |
| `bin/sync-instructions.js --help` works | ✓ |
| `bin/sync-instructions.js --dry-run` works | ✓ |
| `bin/sync-instructions.js` syncs all 12 runtimes | ✓ (12 synced, 0 errors) |
| `~/.claude/commands/pd/AGENTS.md` exists | ✓ |
| `~/.codex/commands/pd/AGENTS.md` exists | ✓ |
| `bin/install.js` contains sync call | ✓ (line 241) |
| `package.json` contains sync scripts | ✓ |

## Commits

- `35cb63a`: feat(131-01): add AGENTS.md and sync script for universal runtime support

## Deviations from Plan

None - plan executed exactly as written.

## Files Created/Modified

| File | Action | Lines |
|------|--------|-------|
| `AGENTS.md` | Created | 209 |
| `bin/sync-instructions.js` | Created | 143 |
| `bin/install.js` | Modified | +14 lines |
| `package.json` | Modified | +4 lines |