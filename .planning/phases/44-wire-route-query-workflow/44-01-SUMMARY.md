---
phase: 44-wire-route-query-workflow
plan: 01
subsystem: workflow-integration
tags: [routeQuery, CLI, workflow, research, snapshots]
dependency_graph:
  requires: [research-store.js/routeQuery, update-research-index.js/pattern]
  provides: [bin/route-query.js, workflow-research-buoc1-cli]
  affects: [workflows/research.md, test/snapshots/*/research.md]
tech_stack:
  added: []
  patterns: [CLI-wrapper-thin-script]
key_files:
  created: [bin/route-query.js]
  modified: [workflows/research.md, test/snapshots/codex/research.md, test/snapshots/copilot/research.md, test/snapshots/gemini/research.md, test/snapshots/opencode/research.md]
decisions:
  - CLI script chi la thin wrapper — khong them logic, routeQuery() la source of truth duy nhat
  - Xoa hoan toan inline heuristic, khong giu comment lich su
metrics:
  duration: 99s
  completed: 2026-03-26T05:27:15Z
  tasks: 2
  files: 6
---

# Phase 44 Plan 01: Wire routeQuery vao Workflow Summary

CLI wrapper bin/route-query.js goi routeQuery() (10+ regex patterns) thay the inline heuristic (5 rules) trong workflows/research.md Buoc 1

## Completed Tasks

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Tao CLI script va cap nhat workflow | 0a9f05e | bin/route-query.js, workflows/research.md |
| 2 | Regenerate converter snapshots | f89933e | test/snapshots/{codex,copilot,gemini,opencode}/research.md |

## Key Changes

1. **bin/route-query.js** (moi): CLI script nhan 1 argument topic, goi routeQuery() tu research-store.js, in 'internal' hoac 'external' ra stdout. Follow pattern tu bin/update-research-index.js (Phase 43).

2. **workflows/research.md Buoc 1**: Thay 3 dong inline heuristic (file extensions, path patterns, camelCase/PascalCase) bang 1 dong `ROUTE=$(node bin/route-query.js "$TOPIC")`. Buoc 2-4 va rules giu nguyen.

3. **4 converter snapshots**: Regenerate cho codex, copilot, gemini, opencode — phan anh workflow moi.

## Verification Results

- `node bin/route-query.js "ham createUser"` -> internal (dung)
- `node bin/route-query.js "React hooks"` -> external (dung)
- `node bin/route-query.js` (khong argument) -> external (dung, fallback)
- 139 tests pass (routeQuery unit tests + 52 snapshot tests), 0 failures
- Workflow khong con inline heuristic (`grep "camelCase"` -> 0 matches)
- Workflow co CLI call (`grep "route-query.js"` -> 1 match)

## Deviations from Plan

None — plan thuc hien chinh xac nhu da viet.

## Known Stubs

None — khong co stub hay placeholder nao.
