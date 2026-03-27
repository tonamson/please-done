---
phase: "057"
plan: "01"
subsystem: references, installers, converters
tags: [dedup, dry, refactor, installer-utils]
dependency_graph:
  requires: []
  provides: [verification.md, installer-utils.js]
  affects: [workflows, commands, templates, installers]
tech_stack:
  added: [installer-utils.js]
  patterns: [shared-utils, reference-dedup]
key_files:
  created:
    - references/verification.md
    - bin/lib/installer-utils.js
  modified:
    - workflows/write-code.md
    - workflows/plan.md
    - workflows/complete-milestone.md
    - templates/verification-report.md
    - templates/plan.md
    - commands/pd/write-code.md
    - commands/pd/plan.md
    - commands/pd/complete-milestone.md
    - bin/lib/installers/codex.js
    - bin/lib/installers/gemini.js
    - bin/lib/installers/opencode.js
    - bin/lib/installers/copilot.js
  deleted:
    - references/verification-patterns.md
    - references/plan-checker.md
decisions:
  - "Gop verification-patterns.md + plan-checker.md thanh verification.md duy nhat"
  - "Chi cap nhat file active, giu nguyen .planning/ archive"
  - "Trich 6 ham dung chung vao installer-utils.js (ensureDir, validateGitRoot, copyWithBackup, savePdconfig, cleanLegacyDir, cleanOldFiles)"
  - "Converter configs da nhat quan - khong can thay doi (DRYU-03 confirmed)"
metrics:
  duration: "~14 phut"
  completed: "2026-03-27"
requirements: [DEDU-01, DEDU-02, DRYU-01, DRYU-02, DRYU-03]
---

# Phase 57 Plan 01: Reference Dedup & Runtime DRY Summary

Gop 2 reference files thanh 1, cap nhat 8 file tham chieu, trich installer-utils.js giam 60 dong trung lap, xac nhan converter configs nhat quan.

## Ket qua

### DEDU-01: Gop reference files
- `references/verification-patterns.md` + `references/plan-checker.md` -> `references/verification.md`
- Phan A: mau xac minh stub/placeholder (tu verification-patterns.md)
- Phan B: plan checker rules 8 checks (tu plan-checker.md)
- 2 file cu da xoa

### DEDU-02: Cap nhat references
- 8 file active da cap nhat (workflows, templates, commands)
- 13 file .planning/ historical giu nguyen (archive, khong anh huong runtime)
- Zero broken `@references/` trong code hoat dong

### DRYU-01: installer-utils.js
- 6 ham dung chung: `ensureDir`, `validateGitRoot`, `copyWithBackup`, `savePdconfig`, `cleanLegacyDir`, `cleanOldFiles`
- Input validation, error handling day du
- 152 dong, pure functions, no side effects ngoai fs

### DRYU-02: Cap nhat 4 installers
- codex.js: savePdconfig, ensureDir
- gemini.js: savePdconfig, ensureDir, cleanLegacyDir, cleanOldFiles
- opencode.js: savePdconfig, ensureDir, cleanOldFiles
- copilot.js: savePdconfig, ensureDir
- Giam ~60 dong code trung lap

### DRYU-03: Review converter configs
- 4 converters (codex, gemini, opencode, copilot) deu dung cung config schema tu base.js
- Key names nhat quan: runtime, skillsDir, pathReplace, toolMap, buildFrontmatter, pdconfigFix, postProcess
- Khong can thay doi - da nhat quan san

## Kiem tra

- 30/30 installer smoke tests PASS
- 38/38 converter smoke tests PASS
- 4/4 installers require() thanh cong
- installer-utils.js exports 6 ham dung

## Commits

| Task | Mo ta | Commit | Files |
|------|-------|--------|-------|
| DEDU-01 | Gop reference files | 7c52e6a | references/verification.md (created), 2 files deleted |
| DEDU-02 | Cap nhat references | 5820dc9 | 8 files (workflows, templates, commands) |
| DRYU-01 | Tao installer-utils.js | 2932906 | bin/lib/installer-utils.js |
| DRYU-02 | Cap nhat 4 installers | a3cbee8 | 4 installer files |
| DRYU-03 | Review converters | N/A (review only) | Confirmed consistent |

## Deviations from Plan

None - plan executed exactly as written.

## Known Stubs

None - all code is functional, no placeholders.
