# Phase 153 — Installer UX Polish: Discuss Context

> Phase: 153
> Status: context-locked
> Locked: true

## Goal

Upgrade `bin/install.js` and `bin/lib/utils.js` with:
1. ASCII art "PD" banner (block character `██` style, like GSD uses "GSD")
2. Colorized `--help` output
3. Improved progress step output (keep 4 steps, improve format)

No external npm dependencies — pure Node.js ANSI colors only.

## Locked Decisions

### D1: Banner Content
**Decision:** "PD" ASCII art using `██` block characters
**Rationale:** User explicitly chose this. Mirrors GSD build repo which spells "GSD" in block art.
**Reference:** https://raw.githubusercontent.com/gsd-build/get-shit-done/main/bin/install.js

### D2: Banner Placement
**Decision:** Show banner in BOTH cases:
- When `--help` is used (non-interactive)
- When running interactive install (TTY mode)

**Rationale:** User selected "Cả hai" (both). Banner should always appear at startup.
**Implementation note:** Banner is displayed at program start before routing to help or interactive mode.

### D3: Progress Step Count
**Decision:** Keep 4 steps — improve existing output format only
**Rationale:** User chose not to add a 5th summary step. Focus on better formatting of existing 4 steps.
**Current INSTALL_STEPS = 4** — do not change this constant.

## Files to Modify

1. `bin/install.js` — Add banner display at startup (before help/interactive branch)
2. `bin/lib/utils.js` — Replace `log.banner()` box drawing with ASCII art `██` PD banner; colorize help text output

## Constraints

- No new npm dependencies
- Pure ANSI escape codes (already used in utils.js)
- Keep all existing flags working: `--help`, `--local`, `--config-dir`, `--force-statusline`
- Keep INSTALL_STEPS = 4
- Banner must render correctly in standard terminals
