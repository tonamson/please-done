# Requirements: v12.5 Installer UX & Runtime Expansion

> Milestone: v12.5
> Status: Active
> Created: 2026-04-08

## Overview

Upgrade `please-done` installer experience to match GSD build repo quality:
- Rich visual output (ASCII banner, colorized help, progress steps)
- Expand from 5 to 11 supported runtimes (add Kilo, Antigravity, Cursor, Windsurf, Augment, Trae)
- Add `--config-dir` flag, `--force-statusline`, and statusline integration

---

## Requirements

### UX-01: ASCII Art Banner
Installer shows styled ASCII art banner in cyan at startup (TTY only, no external deps).

### UX-02: Colorized Help Output
`--help` output uses cyan/yellow/dim colors, documents all 11 runtimes and all flags with examples.

### UX-03: Progress Step Indicators
Install shows numbered steps `[1/N]` with ✓/✗ outcomes and final summary (file count + destination).

### RT-01 through RT-06: New Runtimes
Add Kilo (`~/.config/kilo/`), Antigravity (`~/.gemini/antigravity/`), Cursor (`~/.cursor/`),
Windsurf (`~/.codeium/windsurf/`), Augment (`~/.augment/`), Trae (`~/.trae/`) — each with
`--flag` support, inclusion in `--all`, and interactive menu entry.

### CFG-01: --config-dir Flag
`--config-dir <path>` (or `-c`) overrides the default config directory for any runtime.

### CFG-02: --force-statusline Flag
Replaces existing statusline config in IDE editors when provided; skips with warning otherwise.

---

## Traceability

| REQ-ID | Phase | Status |
|--------|-------|--------|
| UX-01 | Phase 153 | Complete |
| UX-02 | Phase 153 | Complete |
| UX-03 | Phase 153 | Complete |
| RT-01 | Phase 154 | Pending |
| RT-02 | Phase 154 | Pending |
| RT-03 | Phase 154 | Pending |
| RT-04 | Phase 154 | Pending |
| RT-05 | Phase 154 | Pending |
| RT-06 | Phase 154 | Pending |
| CFG-01 | Phase 154 | Pending |
| CFG-02 | Phase 154 | Pending |
