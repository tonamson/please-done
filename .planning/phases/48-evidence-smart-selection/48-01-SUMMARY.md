---
phase: 48-evidence-smart-selection
plan: "01"
subsystem: smart-selection
tags: [pure-function, tdd, scanner-selection, security-audit]
dependency_graph:
  requires: []
  provides: [selectScanners, BASE_SCANNERS, ALL_CATEGORIES, SIGNAL_MAP]
  affects: [workflows/audit.md, bin/lib/parallel-dispatch.js]
tech_stack:
  added: []
  patterns: [pure-function, signal-mapping, de-dup-set]
key_files:
  created:
    - bin/lib/smart-selection.js
    - test/smoke-smart-selection.test.js
  modified: []
decisions:
  - "12 signals rule-based, khong dung AI — deps + filePatterns + codePatterns + lockfiles"
  - "codePatterns matching dung exact string includes (khong dung regex) — don gian, du chinh xac cho signal detection"
metrics:
  duration: 133s
  completed: "2026-03-26T15:30:43Z"
  tasks: 1
  files: 2
---

# Phase 48 Plan 01: TDD selectScanners() Pure Function Summary

selectScanners() pure function voi 12 signals rule-based, 3 base scanners luon co mat, de-dup bang Set, lowConfidence khi < 2 signal match — 13 tests pass.

## Ket qua

| Task | Mo ta | Commit | Files |
|------|-------|--------|-------|
| 1 | TDD selectScanners() + 13 test cases | 203ac1f | bin/lib/smart-selection.js, test/smoke-smart-selection.test.js |

## Chi tiet ky thuat

### bin/lib/smart-selection.js
- **BASE_SCANNERS**: `['secrets', 'misconfig', 'logging']` — 3 scanner luon chay (D-01)
- **ALL_CATEGORIES**: 13 OWASP slugs tu security-rules.yaml
- **SIGNAL_MAP**: 12 signals voi deps[], pyDeps[], codePatterns[], filePatterns[], lockfiles[], categories[]
- **selectScanners(projectContext)**: Pure function, KHONG doc file, KHONG side effects
  - Input: `{ deps[], fileExtensions[], codePatterns[], hasLockfile }`
  - Output: `{ selected[], skipped[], signals[], lowConfidence }`
  - De-dup: `[...new Set([...BASE_SCANNERS, ...categoriesFromSignals])]`
  - lowConfidence = `signals.length < 2`

### test/smoke-smart-selection.test.js
- 13 test cases voi node:test framework
- Bao phu: empty context, single signal, multi signal, de-dup, file extensions, lockfile, code patterns, signal structure, exports

## Xac minh

```
node --test test/smoke-smart-selection.test.js
# 13 pass, 0 fail

node -e "const {selectScanners}=require('./bin/lib/smart-selection');console.log(JSON.stringify(selectScanners({})))"
# {"selected":["secrets","misconfig","logging"],"skipped":[...],"signals":[],"lowConfidence":true}

node -e "const {selectScanners}=require('./bin/lib/smart-selection');const r=selectScanners({deps:['express','sequelize'],hasLockfile:true});console.log(r.selected.length, r.lowConfidence)"
# 8 false
```

## Sai lech so voi ke hoach

Khong co — ke hoach thuc hien chinh xac nhu da viet.

## Known Stubs

Khong co stub — selectScanners() la production code hoan chinh.

## Self-Check: PASSED

- [x] bin/lib/smart-selection.js — FOUND
- [x] test/smoke-smart-selection.test.js — FOUND
- [x] .planning/phases/48-evidence-smart-selection/48-01-SUMMARY.md — FOUND
- [x] Commit 203ac1f — FOUND
