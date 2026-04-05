---
phase: 43-wire-index-md-pipeline
plan: "01"
subsystem: research-pipeline
tags: [cli, delegation, index-generation, backward-compat]
dependency_graph:
  requires: [index-generator.js, research-store.js]
  provides: [bin/update-research-index.js, generateIndex-delegation]
  affects: [workflows/research.md, strategy-injection]
tech_stack:
  added: []
  patterns: [cli-calls-pure-functions, module-delegation]
key_files:
  created:
    - bin/update-research-index.js
    - test/smoke-update-research-index.test.js
  modified:
    - bin/lib/research-store.js
    - test/smoke-research-store.test.js
decisions:
  - "RESEARCH_DIR env variable cho test isolation — cho phep tests chay o temp directories"
  - "Circular dependency research-store <-> index-generator chap nhan duoc — chi warning, runtime hoat dong dung"
metrics:
  duration: 173s
  completed: "2026-03-26"
  tasks: 2
  files: 4
---

# Phase 43 Plan 01: CLI Script va Delegation cho INDEX.md Pipeline Summary

CLI script `bin/update-research-index.js` doc .md files tu internal/ + external/, goi parseResearchFiles() + generateIndex() tu index-generator.js, ghi INDEX.md. Delegation trong research-store.js dam bao 1 source of truth.

## Ket qua

### Task 1: Tao CLI script va tests (TDD)
- Tao `bin/update-research-index.js` voi shebang, chmod +x
- Script doc ca 2 thu muc `internal/` + `external/` (per D-02)
- Dung `parseResearchFiles()` + `generateIndex()` tu index-generator.js (per D-07)
- Ho tro `RESEARCH_DIR` env variable cho test isolation
- 6 tests: require, end-to-end, thu muc rong, khong ton tai, non-.md filter, no-frontmatter
- Commit: ed086e8

### Task 2: Delegate generateIndex va cap nhat tests
- Thay the body function generateIndex() bang delegation qua `_genIndex()`
- Map field names backward compatible: `fileName` -> `filename`
- Cap nhat 5 tests cho format moi (`Source Type`, `Chua co research files`)
- 107 tests pass toan bo (update-research-index + research-store + index-generator)
- Commit: ca8d67f

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

None — tat ca code duoc wire day du, khong co placeholder.

## Luu y

- Circular dependency warning giua research-store.js va index-generator.js (pre-existing tu khi index-generator require parseEntry). Runtime hoat dong binh thuong vi Node.js resolve lazy. Tat ca tests pass.

## Self-Check: PASSED
