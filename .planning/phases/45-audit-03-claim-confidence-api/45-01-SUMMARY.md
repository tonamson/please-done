---
phase: 45-audit-03-claim-confidence-api
plan: 01
subsystem: research-store
tags: [parseClaims, claim-confidence, createEntry, validateEvidence, TDD, AUDIT-03]
dependency_graph:
  requires: [research-store.js/validateEvidence, research-store.js/createEntry]
  provides: [research-store.js/parseClaims, createEntry-claims-rendering]
  affects: [bin/lib/research-store.js, test/smoke-research-store.test.js]
tech_stack:
  added: []
  patterns: [pure-function, TDD-red-green-refactor]
key_files:
  created: []
  modified: [bin/lib/research-store.js, test/smoke-research-store.test.js]
decisions:
  - Regex section extraction bo flag /m de tranh \s*$ match giua cac dong — dung (?=\n## |$) thay vi (?=^## |\s*$)/m
  - validateEvidence giu hasSection check rieng truoc parseClaims de phan biet "thieu section" vs "section rong"
metrics:
  duration: 271s
  completed: 2026-03-26T06:11:50Z
  tasks: 1
  files: 2
---

# Phase 45 Plan 01: TDD parseClaims + createEntry claims + validateEvidence refactor Summary

parseClaims(content) extract claim-level confidence tu section ## Bang chung, createEntry() render inline confidence tags, validateEvidence() refactored de reuse parseClaims — hoan thanh AUDIT-03

## Completed Tasks

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1-RED | Viet failing tests cho parseClaims, createEntry claims, round-trip | 0660e01 | test/smoke-research-store.test.js |
| 1-GREEN | Implement parseClaims, createEntry claims, refactor validateEvidence | 74a2cdd | bin/lib/research-store.js |

## Key Changes

1. **parseClaims(content)** (moi): Pure function extract structured claims tu section `## Bang chung`. Moi claim tra ve `{ text, source, confidence }`. Ho tro em dash va double dash lam separator. Confidence tag optional (tra null neu khong co).

2. **createEntry({ claims })**: Mo rong de nhan claims array. Render `- text — source (confidence: LEVEL)` trong section Bang chung. Backward-compatible khi khong truyen claims hoac truyen mang rong.

3. **validateEvidence refactor**: Dung parseClaims() noi bo thay vi tu regex parse. API output `{ valid, warnings }` khong thay doi (D-08).

## Verification Results

- 101 tests pass (8 parseClaims + 5 createEntry claims + 1 round-trip + 87 existing), 0 failures
- `function parseClaims` ton tai trong bin/lib/research-store.js
- parseClaims duoc export trong module.exports
- validateEvidence goi parseClaims(content) noi bo
- Round-trip: createEntry(claims) -> parseClaims khop data dau vao
- Tat ca existing tests backward-compatible

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Sua regex section extraction trong parseClaims**
- **Found during:** Task 1 GREEN phase
- **Issue:** Regex `/^## Bang chung\s*\n([\s\S]*?)(?=^## |\s*$)/m` voi flag /m khien `\s*$` match end-of-line giua cac dong, lazy quantifier dung sau dong dau tien
- **Fix:** Doi thanh `/## Bang chung\s*\n([\s\S]*?)(?=\n## |$)/` khong co flag /m — `$` match end-of-string
- **Files modified:** bin/lib/research-store.js
- **Commit:** 74a2cdd

## Known Stubs

None — khong co stub hay placeholder nao.

## Self-Check: PASSED
