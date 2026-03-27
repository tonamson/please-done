# Phase 57: Reference Dedup & Runtime DRY - Context

**Gathered:** 2026-03-27
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 57 delivers 2 things:
1. **Reference Dedup** — Gộp `references/verification-patterns.md` + `references/plan-checker.md` thành `references/verification.md`, cập nhật tất cả references trong source files
2. **Runtime DRY** — Trích xuất shared installer utilities thành `bin/lib/installer-utils.js`, cập nhật 4 platform installers để import utils, review converter config consistency

Phase này KHÔNG handle: token budget (Phase 58), integration wiring (Phase 59), hoặc thay đổi behavior của plan-checker engine.

</domain>

<decisions>
## Implementation Decisions

### Reference Merge Strategy
- **D-01:** Gộp `verification-patterns.md` + `plan-checker.md` → `verification.md` bằng cách nối nội dung, giữ cả 2 sections riêng biệt trong 1 file. Section headers rõ ràng để phân biệt verification patterns vs plan checker rules.
- **D-02:** File mới tên `verification.md` đặt trong `references/`. Xóa 2 file cũ sau khi merge.

### Reference Update Scope
- **D-03:** Chỉ cập nhật references trong source files: `commands/`, `workflows/`, `templates/`, `bin/lib/`. Đây là các file "nguồn".
- **D-04:** Snapshots trong `test/snapshots/` sẽ tự cập nhật khi chạy converter — KHÔNG sửa thủ công snapshots.
- **D-05:** Planning docs (`.planning/`) KHÔNG cập nhật — đây là historical records.
- **D-06:** `bin/lib/utils.js` line ~254 có conditional_reading map reference `verification-patterns.md` — CẦN cập nhật key thành `verification.md`.
- **D-07:** `bin/lib/plan-checker.js` line ~10 có JSDoc reference `references/plan-checker.md` — CẦN cập nhật thành `references/verification.md`.
- **D-08:** `test/baseline-tokens.json` có entry cho `verification-patterns.md` — CẦN cập nhật key.

### Installer Utils API
- **D-09:** Tạo `bin/lib/installer-utils.js` exports: `ensureDir(path)` (wrapper cho `fs.mkdirSync(path, { recursive: true })`), `validateGitRoot()` (check `.git` exists), `copyWithBackup(src, dest)` (copy file với backup nếu dest tồn tại).
- **D-10:** 4 platform installers (codex, copilot, gemini, opencode) import utils. `claude.js` installer có logic khác biệt (symlink-based) — chỉ import nếu có shared pattern.
- **D-11:** Giữ logic platform-specific nguyên vẹn trong mỗi installer. Chỉ extract patterns lặp rõ ràng (mkdirSync recursive).

### Converter Config Consistency
- **D-12:** Review 4 converter configs (codex, copilot, gemini, opencode) cho consistent key names và format. Sửa inconsistency nếu phát hiện.

### Claude's Discretion
- Chi tiết merge format (heading levels, ordering) trong `verification.md`
- Tên hàm cụ thể ngoài 3 hàm đã quyết định (nếu phát hiện thêm pattern lặp)
- Mức độ refactor converter configs (minor fixes vs restructure)
- Test naming và test structure cho installer-utils

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Reference Files (merge targets)
- `references/verification-patterns.md` — Source file 1: multi-level verification patterns
- `references/plan-checker.md` — Source file 2: plan checker rules spec

### Source Files with References to Update
- `bin/lib/utils.js` §254 — conditional_reading map có `verification-patterns.md` key
- `bin/lib/plan-checker.js` §10 — JSDoc reference tới `plan-checker.md`
- `templates/plan.md` §147 — Template reference tới `verification-patterns.md`
- `templates/verification-report.md` §63 — Reference tới `verification-patterns.md`
- `workflows/plan.md` — Workflow reference tới cả 2 files
- `workflows/write-code.md` — Workflow reference tới `verification-patterns.md`
- `workflows/complete-milestone.md` — Workflow reference tới `verification-patterns.md`

### Installer Files (DRY targets)
- `bin/lib/installers/codex.js` — mkdirSync pattern tại lines 34, 47, 58, 96
- `bin/lib/installers/copilot.js` — mkdirSync pattern tại lines 40, 69, 91, 105
- `bin/lib/installers/gemini.js` — mkdirSync pattern tại lines 22, 54, 73
- `bin/lib/installers/opencode.js` — mkdirSync pattern tại line 22
- `bin/lib/installers/claude.js` — mkdirSync pattern tại lines 142, 313

### Converter Files (consistency review)
- `bin/lib/converters/codex.js`
- `bin/lib/converters/copilot.js`
- `bin/lib/converters/gemini.js`
- `bin/lib/converters/opencode.js`
- `bin/lib/converters/base.js` — Base converter logic

### Test Files
- `test/baseline-tokens.json` — Token baseline có entry `verification-patterns.md`
- `test/smoke-utils.test.js` — Smoke tests cho utils
- `test/smoke-integrity.test.js` — Integrity tests

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `bin/lib/utils.js` — Shared utilities đã có pattern (frontmatter, XML, hashing). `installer-utils.js` follow cùng pattern.
- `bin/lib/converters/base.js` — Base converter shared logic. Converter configs nên follow format từ base.
- `bin/lib/plan-checker.js` — Plan checker engine, JSDoc references `plan-checker.md` spec.

### Established Patterns
- Naming: `lowercase-with-hyphens.js` cho module files
- Import: relative paths, no aliases
- Module structure: `'use strict';` + imports + exports
- Test: smoke tests verify file existence + basic structure

### Integration Points
- `bin/lib/utils.js` conditional_reading map — cần update key khi rename reference
- `bin/lib/plan-checker.js` — cần update JSDoc ref
- 4 converters regenerate snapshots — snapshots auto-update sau converter run
- `test/baseline-tokens.json` — token baselines cần update keys

</code_context>

<specifics>
## Specific Ideas

No specific requirements — open to standard approaches

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 057-reference-dedup-runtime-dry*
*Context gathered: 2026-03-27*
