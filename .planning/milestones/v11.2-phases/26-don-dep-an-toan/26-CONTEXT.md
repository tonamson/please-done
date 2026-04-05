# Phase 26: Don dep & An toan - Context

**Gathered:** 2026-03-24
**Status:** Ready for planning

<domain>
## Phase Boundary

Tu dong don dep debug log tam thoi (marker `[PD-DEBUG]`) trong staged files va hien thi canh bao bao mat tu pd:scan report cho file bi loi, truoc khi user commit ban sua trong workflow fix-bug.

</domain>

<decisions>
## Implementation Decisions

### Vi tri workflow
- **D-01:** Chen sub-step 9a trong Buoc 9 (Git commit) — gom ca cleanup + security check truoc khi commit. Buoc 9 hien tai tro thanh 9b.
- **D-02:** Theo D-10 Phase 25: chen vao buoc hien co, KHONG tao buoc moi so
- **D-03:** Chi scan staged files (`git diff --cached --name-only`) — KHONG scan unstaged changes

### Hien thi debug lines
- **D-04:** Group theo file: hien file path, so dong, noi dung tung dong co marker
- **D-05:** Y/N xoa tat ca — khong cho chon tung file/dong rieng le
- **D-06:** Neu khong tim thay [PD-DEBUG] nao — skip im lang, khong hien thong bao

### Blocking behavior
- **D-07:** Non-blocking — neu user tu choi xoa, hien warning roi van tiep tuc commit. User co the co ly do giu debug log (dang debug tiep).

### Nguon bao mat
- **D-08:** Neu khong co SCAN_REPORT.md hoac report cu hon 7 ngay — skip im lang, khong hien gi, tiep tuc commit
- **D-09:** Khi co report hop le — match file path: doc SCAN_REPORT.md, tim canh bao lien quan den file bi loi, hien toi da 3 canh bao non-blocking
- **D-10:** Security warnings luon non-blocking — chi hien thong tin, khong chan workflow

### Kien truc module
- **D-11:** Tao 1 module `bin/lib/debug-cleanup.js` chua 2 pure functions: `scanDebugMarkers()` va `matchSecurityWarnings()`
- **D-12:** `scanDebugMarkers(stagedFiles)` — Input: `[{path, content}]`, Output: `[{path, line, text}]`. Chi scan va bao cao, KHONG xoa.
- **D-13:** `matchSecurityWarnings(reportContent, filePaths)` — Input: `string, string[]`, Output: `[{file, severity, desc}]`. Filter theo file paths, max 3 results.
- **D-14:** Viec xoa dong [PD-DEBUG] do AI thuc hien truc tiep trong workflow (Edit tool) — module KHONG co side effects

### Claude's Discretion
- Function signatures chi tiet va return types
- Regex pattern cu the cho `[PD-DEBUG]` matching
- Test file naming va fixtures cho smoke test
- Error handling khi doc staged file content that bai
- Format chinh xac cua security warning display

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Workflow hien tai
- `workflows/fix-bug.md` — Workflow 10 buoc, vi tri chen sub-step 9a (truoc Buoc 9 commit hien tai)
- `references/conventions.md` — Version matching, commit prefixes, bieu tuong

### Module patterns
- `bin/lib/repro-test-generator.js` — Pattern pure function module (Phase 25)
- `bin/lib/regression-analyzer.js` — Pattern pure function voi dual-mode (Phase 25)
- `bin/lib/mermaid-validator.js` — Pattern pure function don gian nhat

### Testing
- `test/smoke-repro-test-generator.test.js` — Pattern test cho pure function (Phase 25)
- `test/smoke-regression-analyzer.test.js` — Pattern test (Phase 25)

### Scan report
- `workflows/scan.md` — Workflow pd:scan, cau truc SCAN_REPORT.md (section "Canh bao bao mat")

### Prior context
- `.planning/phases/25-dieu-tra-tai-hien-loi/25-CONTEXT.md` — D-10 sub-step wiring, D-11 blocking mode, D-12 size limit

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `bin/lib/repro-test-generator.js` — Pattern module: pure function, nhan content, tra string
- `bin/lib/regression-analyzer.js` — Pattern module: dual-mode (primary + fallback)
- `test/smoke-*.test.js` — Pattern test: node:test, node:assert/strict, in-memory fixtures

### Established Patterns
- Pure function pattern: tat ca modules trong bin/lib/ nhan content string, tra ket qua, KHONG doc file
- Test pattern: `smoke-*.test.js`, in-memory fixtures, khong can file system
- Module naming: `lowercase-with-hyphens.js`, camelCase functions
- JSDoc header voi `// KHONG doc file` annotation

### Integration Points
- `workflows/fix-bug.md` Buoc 9 — diem chen sub-step 9a truoc commit logic hien tai
- `bin/lib/` — thu muc chua tat ca library modules
- `test/` — thu muc chua tat ca test files
- `test/snapshots/` — 4 platform snapshots can regenerate sau khi sua workflow
- `.planning/scan/SCAN_REPORT.md` — nguon du lieu canh bao bao mat (neu ton tai)

</code_context>

<specifics>
## Specific Ideas

- User muon non-blocking cho ca cleanup va security — khac voi Phase 25 blocking mode
- Group theo file la format hien thi — khi co nhieu files de doc hon danh sach phang
- Module chi scan + bao cao, KHONG thuc hien xoa — tach biet concern

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 26-don-dep-an-toan*
*Context gathered: 2026-03-24*
