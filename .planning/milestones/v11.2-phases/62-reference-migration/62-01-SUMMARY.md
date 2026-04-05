---
phase: 62-reference-migration
plan: 01
subsystem: testing
tags: [migration, agents, symlinks]

requires:
  - phase: 61-symlink-architecture
    provides: commands/pd/agents/ as source of truth with symlinks

provides:
  - Zero .claude/agents/ references in core code
  - AGENTS_DIR in smoke test points to commands/pd/agents/
  - All 4 snapshot files synced with workflow

affects: []

tech-stack:
  added: []
  patterns: [commands/pd/agents/ as canonical agent path]

key-files:
  created: []
  modified:
    - test/smoke-agent-files.test.js
    - workflows/fix-bug.md
    - test/snapshots/codex/fix-bug.md
    - test/snapshots/copilot/fix-bug.md
    - test/snapshots/gemini/fix-bug.md
    - test/snapshots/opencode/fix-bug.md

key-decisions:
  - "Only .claude/agents/pd-* references replaced — generic .claude/agents/ checks kept for symlink verification"

patterns-established:
  - "Agent references use commands/pd/agents/ path, not .claude/agents/"

requirements-completed: [REFR-01, REFR-02]

duration: 3min
completed: 2026-03-27
---

# Phase 62: Reference Migration Summary

**Migrated all .claude/agents/ references to commands/pd/agents/ across test, workflow, and 4 snapshot files — zero legacy references remain in core code.**

## What was done

1. **test/smoke-agent-files.test.js**: Updated AGENTS_DIR constant from `.claude/agents` to `commands/pd/agents`, updated comment and test description
2. **workflows/fix-bug.md**: Replaced 5 agent path references (pd-bug-janitor, pd-code-detective, pd-doc-specialist, pd-repro-engineer, pd-fix-architect)
3. **4 snapshot files** (codex, copilot, gemini, opencode): Synced all `.claude/agents/pd-*` references to `commands/pd/agents/pd-*`

## Verification

- `node --test test/smoke-agent-files.test.js`: 26/26 pass, 0 fail
- `grep -rn '.claude/agents/' --include='*.js' --include='*.md' --exclude-dir='.planning' --exclude-dir='node_modules'`: 0 hits
