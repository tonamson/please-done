---
phase: 39-tieu-chuan-kiem-chung-chi-muc
plan: 02
subsystem: research-store
tags: [tdd, pure-functions, evidence-validation, audit-log, index-generation]
dependency_graph:
  requires: [research-store.js, utils.js]
  provides: [validateEvidence, appendAuditLog, generateIndex]
  affects: [research workflow, AUDIT_LOG.md, INDEX.md]
tech_stack:
  added: []
  patterns: [non-blocking validation, markdown table generation, pure function module]
key_files:
  created: []
  modified: [bin/lib/research-store.js, test/smoke-research-store.test.js]
decisions:
  - validateEvidence return { valid, warnings } nhat quan voi evidence-protocol.js pattern
  - appendAuditLog va generateIndex return strings (pure functions), khong ghi file
  - Sort generateIndex theo created descending (moi nhat truoc)
metrics:
  duration: 236s
  completed: "2026-03-25T15:42:30Z"
  tasks: 2
  files: 2
requirements: [AUDIT-02, AUDIT-04, STORE-03]
---

# Phase 39 Plan 02: Mo rong research-store.js — validateEvidence, appendAuditLog, generateIndex

Mo rong research-store.js voi 3 pure functions moi (validateEvidence, appendAuditLog, generateIndex) theo TDD, 19 tests moi, toan bo 830 tests pass.

## Ket qua

| Task | Mo ta | Commit | Files |
|------|-------|--------|-------|
| 1 | TDD validateEvidence — RED + GREEN | `135facb`, `aeb6344` | research-store.js, smoke-research-store.test.js |
| 2 | TDD appendAuditLog + generateIndex — RED + GREEN | `e0d7529`, `5cb1970` | research-store.js, smoke-research-store.test.js |

## Chi tiet

### Task 1: validateEvidence

- **RED:** 7 test cases — valid content, thieu section, section rong, claim thieu source, null/empty/undefined
- **GREEN:** Implement function kiem tra section `## Bang chung`, extract claims, validate source separator (em dash hoac double dash)
- Return `{ valid, warnings }` non-blocking, throw Error chi khi null/empty input

### Task 2: appendAuditLog + generateIndex

- **RED:** 11 test cases — 6 cho appendAuditLog (tao header, append row, format, validation), 5 cho generateIndex (empty, null, 1 entry, sort, header format)
- **GREEN:** appendAuditLog tao header khi file rong, append row khi co header. generateIndex tao markdown table sorted theo created descending.
- Ca 2 la pure functions, return strings, khong ghi file

## Kiem chung

- research-store.js export 7 functions (4 cu + 3 moi) va 4 constants
- KHONG require('fs') trong module
- KHONG modify 4 functions cu (createEntry, parseEntry, validateConfidence, generateFilename)
- 67 smoke tests pass (48 cu + 19 moi)
- 830 full suite tests pass

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fix test assertion cho audit separator**
- **Found during:** Task 2
- **Issue:** Test kiem tra `|---|` nhung actual separator la `|-----------|` (dung format)
- **Fix:** Doi assertion sang `|---` de match ca 2 truong hop
- **Files modified:** test/smoke-research-store.test.js
- **Commit:** `5cb1970`

## Known Stubs

Khong co stub nao. Tat ca 3 functions da implement day du va test xanh.

## Self-Check: PASSED

- Tat ca files ton tai: research-store.js, smoke-research-store.test.js, 39-02-SUMMARY.md
- Tat ca commits ton tai: 135facb, aeb6344, e0d7529, 5cb1970
