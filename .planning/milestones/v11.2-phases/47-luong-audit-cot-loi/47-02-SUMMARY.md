---
phase: 47-luong-audit-cot-loi
plan: 02
subsystem: audit-workflow
tags: [skill, workflow, owasp, scanner-dispatch, wave-based]
dependency_graph:
  requires: [buildScannerPlan, mergeScannerResults, pd-sec-scanner, pd-sec-reporter]
  provides: [pd:audit, audit-workflow]
  affects: [security-audit-pipeline]
tech_stack:
  added: []
  patterns: [auto-detect-mode, stub-first-design, wave-dispatch-backpressure]
key_files:
  created:
    - commands/pd/audit.md
    - workflows/audit.md
    - test/snapshots/codex/audit.md
    - test/snapshots/copilot/audit.md
    - test/snapshots/gemini/audit.md
    - test/snapshots/opencode/audit.md
  modified: []
decisions:
  - "pd:audit dung model opus (Architect tier) vi workflow 9 buoc phuc tap can AI manh dieu phoi"
  - "Auto-detect mode doc-lap/tich-hop bang kiem tra .planning/PROJECT.md — quyet dinh guard set va output path"
  - "3 buoc stub (B2 Delta-aware, B4 Smart selection, B8 Fix routing) la extension points cho Phase 48-50"
metrics:
  duration: 218s
  completed: "2026-03-26"
---

# Phase 47 Plan 02: Tao skill pd:audit va workflow 9 buoc Summary

Skill pd:audit (model opus, 8 allowed-tools ke ca SubAgent) voi workflow 9 buoc: auto-detect doc-lap/tich-hop, dispatch 13 scanner song song 2/wave voi backpressure, 3 buoc stub cho extension.

## Task Results

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Tao commands/pd/audit.md skill entry point | 423d62b | commands/pd/audit.md |
| 2 | Tao workflows/audit.md — workflow 9 buoc | 3af6456 | workflows/audit.md, commands/pd/audit.md (fix body text), 4 snapshots |

## Verification

- `grep "Buoc [1-9]" workflows/audit.md | wc -l` tra ve 9
- `grep "STUB" workflows/audit.md | wc -l` tra ve 3 (B2, B4, B8)
- `npm test` — 974/974 PASS, 0 regression
- Frontmatter pd:audit: name, model opus, 8 allowed-tools, argument-hint dung
- Guards auto-detect: doc-lap bo guard-context, tich-hop chay day du

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fix body text "allowed-tools" leak trong Gemini converter output**
- **Found during:** Task 2 verification (npm test)
- **Issue:** commands/pd/audit.md co dong "kiem tra allowed-tools co SubAgent" trong body text. Gemini converter strip frontmatter allowed-tools nhung body text van con, gay fail test smoke-integrity
- **Fix:** Doi "kiem tra allowed-tools co SubAgent" thanh "kiem tra cau hinh tool cho phep SubAgent"
- **Files modified:** commands/pd/audit.md
- **Commit:** 3af6456

## Known Stubs

- workflows/audit.md Buoc 2: Delta-aware (STUB) — extension point Phase 49
- workflows/audit.md Buoc 4: Smart selection (STUB) — extension point Phase 48
- workflows/audit.md Buoc 8: Fix routing (STUB) — extension point Phase 50
- Cac stub nay la thiet ke co chu dich (D-05), khong can blocking

## Self-Check: PASSED
