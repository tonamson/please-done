---
phase: 48-evidence-smart-selection
plan: "02"
subsystem: scanner-reporter-workflow
tags: [scanner-template, reporter-template, workflow-integration, function-checklist, master-table]
dependency_graph:
  requires: [selectScanners, BASE_SCANNERS, ALL_CATEGORIES]
  provides: [function-checklist-format, master-table-format, hot-spots, workflow-b4-smart-selection]
  affects: [commands/pd/agents/pd-sec-scanner.md, commands/pd/agents/pd-sec-reporter.md, workflows/audit.md]
tech_stack:
  added: []
  patterns: [glob-based-discovery, function-merge-key, severity-owasp-sort]
key_files:
  created: []
  modified:
    - commands/pd/agents/pd-sec-scanner.md
    - commands/pd/agents/pd-sec-reporter.md
    - workflows/audit.md
decisions:
  - "Function Checklist la OPTIONAL section — backward compatible voi evidence-protocol.js"
  - "--only them 3 base scanners (secrets, misconfig, logging) + de-dup — theo D-15"
  - "Reporter doc evidence bang Glob evidence_sec_*.md — khong hardcode 13 ten file"
  - "Function merge key = file_path::function_name (string concat, khong hash) — de debug"
metrics:
  duration: 248s
  completed: "2026-03-26T15:37:50Z"
  tasks: 3
  files: 3
---

# Phase 48 Plan 02: Scanner Template + Reporter Template + Workflow B4 Integration Summary

Scanner template them Function Checklist (4 verdicts PASS/FLAG/FAIL/SKIP), reporter thay hardcode 13 files bang Glob + master table sort severity+OWASP + hot spots top 5 + function merge, workflow B4 thay stub bang selectScanners() logic thuc.

## Ket qua

| Task | Mo ta | Commit | Files |
|------|-------|--------|-------|
| 1 | Bo sung Function Checklist vao pd-sec-scanner.md | 14e6efc | commands/pd/agents/pd-sec-scanner.md |
| 2 | Mo rong pd-sec-reporter voi master table + hot spots + function merge | 5c6ecd9 | commands/pd/agents/pd-sec-reporter.md |
| 3 | Thay stub B4 trong workflow bang selectScanners() logic | 2f1e2fc | workflows/audit.md |

## Chi tiet ky thuat

### pd-sec-scanner.md (Task 1)
- Them buoc 8: tao Function Checklist voi bang kiem tra tung ham
- 4 verdicts: PASS (an toan), FLAG (nghi ngo), FAIL (lo hong), SKIP (khong lien quan + ly do ngan)
- Them `## Function Checklist` vao evidence output format (sau `## Chi tiet`)
- Them 2 rules moi: moi ham da quet phai xuat hien, SKIP ghi ly do
- Backward compatible — giu nguyen frontmatter, objective, buoc 1-7, sections cu

### pd-sec-reporter.md (Task 2)
- Thay hardcode 13 file names bang Glob pattern `evidence_sec_*.md`
- Them buoc 3.5: parse Function Checklist + merge key `file_path::function_name`
- Merge verdict rule: FAIL > FLAG > PASS (worst-case wins), SKIP bi override
- Them `## Master Table` voi sort: Severity (CRITICAL > HIGH > MEDIUM > LOW), cung severity sort OWASP (A01 > A10)
- Them `## Hot Spots`: top 5 files co nhieu finding nhat + top 5 functions nguy hiem nhat
- `## Chi tiet theo loai` dynamic tu Glob, khong hardcode 13 sections

### workflows/audit.md (Task 3)
- B3: sua --only them 3 base scanners (secrets, misconfig, logging) + de-dup, SKIP B4
- B4: thay toan bo stub bang selectScanners() logic:
  - Thu thap project context bang Bash/Glob/Grep (KHONG spawn AI)
  - Goi selectScanners() tu bin/lib/smart-selection.js
  - lowConfidence < 2 signals: hien thi prompt hoi user chon selected hoac --full
  - Non-interactive: default chay selected + log warning
- B5: sua reference "Lay categories_to_scan tu B3 hoac B4"
- Them tham chieu smart-selection.js trong purpose
- 03-selection.md ghi status: completed thay vi stub

## Xac minh

```
grep "STUB" workflows/audit.md | grep "Bước 4"
# (khong co ket qua — B4 khong con STUB)

grep -c "Function Checklist" commands/pd/agents/pd-sec-scanner.md
# 3

grep -c "Master Table" commands/pd/agents/pd-sec-reporter.md
# 1

grep -c "Hot Spots" commands/pd/agents/pd-sec-reporter.md
# 1

grep -c "selectScanners" workflows/audit.md
# 4

grep -c "evidence_sec_\*" commands/pd/agents/pd-sec-reporter.md
# 2
```

## Sai lech so voi ke hoach

Khong co — ke hoach thuc hien chinh xac nhu da viet.

## Known Stubs

Khong co stub moi. B2 (delta-aware) va B8 (fix routing) van la STUB nhu thiet ke (extension points cho Phase 49/50).

## Self-Check: PASSED

- [x] commands/pd/agents/pd-sec-scanner.md — FOUND
- [x] commands/pd/agents/pd-sec-reporter.md — FOUND
- [x] workflows/audit.md — FOUND
- [x] .planning/phases/48-evidence-smart-selection/48-02-SUMMARY.md — FOUND
- [x] Commit 14e6efc — FOUND
- [x] Commit 5c6ecd9 — FOUND
- [x] Commit 2f1e2fc — FOUND
