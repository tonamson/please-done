# Phase 25: Dieu tra & Tai hien Loi - Context

**Gathered:** 2026-03-24
**Status:** Ready for planning

<domain>
## Phase Boundary

Tao 2 module pure function moi (repro-test-generator.js, regression-analyzer.js) va tich hop vao workflow fix-bug Buoc 5b va Buoc 8. AI co the tu dong tao skeleton test tai hien loi va phan tich module phu thuoc bi anh huong truoc khi sua.

</domain>

<decisions>
## Implementation Decisions

### Reproduction test output
- **D-01:** Output la file test rieng trong `.planning/debug/repro/` — KHONG phai markdown trong BUG report
- **D-02:** Chi 1 template Generic (khong tao templates rieng cho NestJS/Flutter) — don gian, du dung
- **D-03:** File test la skeleton voi TODO markers de AI dien logic — KHONG chay tu dong

### Regression analysis depth
- **D-04:** Call chain depth toi da 1-2 levels (caller truc tiep + caller cua caller)
- **D-05:** Maximum 5 files trong bao cao regression — tap trung vao impact lon nhat, giam noise
- **D-06:** Su dung FastCode call chain lam primary, regression-analyzer.js (BFS) lam fallback khi FastCode khong kha dung

### Truths parser
- **D-07:** Tao shared helper `bin/lib/truths-parser.js` rieng — DRY, thay vi inline o moi consumer
- **D-08:** Refactor generate-diagrams.js de import tu truths-parser.js thay vi inline regex hien tai
- **D-09:** plan-checker.js giu internal parser rieng (de tranh circular deps voi check functions)

### Workflow wiring
- **D-10:** Them sub-steps (5b.1 repro, 8a regression) trong buoc hien co — KHONG tao buoc moi so
- **D-11:** Blocking mode — neu repro test generation hoac regression analysis that bai, workflow DUNG. User muon biet ngay neu co van de.
- **D-12:** Giu fix-bug.md duoi 420 dong sau khi them sub-steps

### Claude's Discretion
- Function signatures va return types cua 2 module moi
- Regex patterns cu the cho template generation
- Test file naming convention trong `.planning/debug/repro/`
- Error messages va error types khi blocking

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Workflow hien tai
- `workflows/fix-bug.md` — Workflow 10 buoc hien tai, vi tri chen sub-steps (Buoc 5b, Buoc 8)
- `references/conventions.md` — Version matching, commit prefixes, bieu tuong

### Module patterns
- `bin/lib/generate-diagrams.js` — parseTruthsFromContent inline (dong 34-45), pattern pure function, mermaidValidator retry
- `bin/lib/mermaid-validator.js` — Pattern pure function voi zero deps
- `bin/lib/report-filler.js` — Pattern pure function voi content string args
- `bin/lib/plan-checker.js` — parseTruthsV11 internal, check functions pattern

### Testing
- `test/smoke-generate-diagrams.test.js` — Pattern test cho pure function module
- `test/smoke-mermaid-validator.test.js` — Pattern test don gian nhat

### Research
- `.planning/research/SUMMARY.md` — Tong hop research v1.5
- `.planning/research/STACK.md` — Zero new deps, module design
- `.planning/research/ARCHITECTURE.md` — Integration points, data flow
- `.planning/research/PITFALLS.md` — 10 critical pitfalls

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `bin/lib/generate-diagrams.js:34-45` — parseTruthsFromContent regex pattern (se refactor sang shared helper)
- `bin/lib/utils.js` — parseFrontmatter(), co the dung cho plan content parsing
- `bin/lib/mermaid-validator.js` — Pattern mau cho module pure function don gian

### Established Patterns
- Pure function pattern: tat ca 8 modules trong bin/lib/ nhan content string, tra ket qua, KHONG doc file
- Test pattern: `smoke-*.test.js`, node:test, node:assert/strict, in-memory fixtures
- Module naming: `lowercase-with-hyphens.js`, camelCase functions
- JSDoc header voi `// KHONG doc file` annotation

### Integration Points
- `workflows/fix-bug.md` Buoc 5b — diem chen repro test generation (sau gia thuyet)
- `workflows/fix-bug.md` Buoc 8 — diem chen regression analysis (truoc khi fix code)
- `bin/lib/` — thu muc chua tat ca library modules
- `test/` — thu muc chua tat ca test files
- `test/snapshots/` — 4 platform snapshots can regenerate sau khi sua workflow

</code_context>

<specifics>
## Specific Ideas

- User muon blocking mode de biet ngay khi co van de — khac voi research suggestion (non-blocking)
- Chi can 1 Generic template cho repro test — don gian hoa, khong can stack-specific templates
- Shared Truths parser la quyet dinh kien truc quan trong — can refactor generate-diagrams.js dong thoi

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 25-dieu-tra-tai-hien-loi*
*Context gathered: 2026-03-24*
