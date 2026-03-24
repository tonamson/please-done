# Phase 27: Dong bo Logic & Bao cao - Context

**Gathered:** 2026-03-24
**Status:** Ready for planning

<domain>
## Phase Boundary

AI phat hien khi ban sua thay doi business logic (heuristics), tu dong cap nhat Mermaid diagram trong management report co san, va de xuat 1-2 rule moi cho CLAUDE.md sau khi fix. Toan bo pipeline la non-blocking — loi chi tao warning, khong chan workflow fix-bug.

</domain>

<decisions>
## Implementation Decisions

### Workflow size strategy
- **D-01:** fix-bug.md hien tai 419/420 dong — KHONG con room cho inline sub-steps dai
- **D-02:** Tao module `bin/lib/logic-sync.js` chua toan bo logic LOGIC-01 + RPT-01 + PM-01 nhu pure functions
- **D-03:** Workflow chi them 1 sub-step ngan (Buoc 10a hoac 9c) goi module — toi da 15-20 dong them vao workflow
- **D-04:** Nen phat them workflow text hien tai de giai phong dong nua — nhung NEU can thi tang limit tu 420 len 450 (reasonable cho 7 tinh nang moi)

### Logic detection heuristics (LOGIC-01)
- **D-05:** Diff-based heuristics: phan tich git diff staged files tim signals:
  - Condition changes: if/else/switch/ternary thay doi
  - Arithmetic changes: operators, formula, threshold values
  - Endpoint changes: route/URL/API definition thay doi
  - Database changes: query/schema/migration thay doi
- **D-06:** Output: `{ hasLogicChange: true/false, signals: [...], summary: string }` — ghi ket qua CO/KHONG vao BUG report
- **D-07:** Pure function: nhan diff text (string), tra ket qua — KHONG chay git commands
- **D-08:** Heuristics du cho v1.5 — AST-based detection la v2 (LOGIC-02 deferred)

### Report update pipeline (RPT-01)
- **D-09:** CHI khi LOGIC-01 = CO — trigger pipeline cap nhat report
- **D-10:** Tim report moi nhat: Glob `.planning/reports/*.md` hoac `.planning/milestones/*/` — lay file moi nhat theo mtime
- **D-11:** Reuse module hien co: `generateBusinessLogicDiagram()` tu generate-diagrams.js + `replaceMermaidBlock()` tu report-filler.js
- **D-12:** KHONG tao report moi — chi cap nhat report co san. Neu khong co report nao → skip voi warning
- **D-13:** Hoi user co muon re-render PDF khong (Y/n) — neu co, goi generate-pdf-report.js. Non-blocking
- **D-14:** Pipeline toan bo non-blocking — try/catch moi sub-step, loi chi log warning

### Post-mortem rules (PM-01)
- **D-15:** AI phan tich bug pattern tu SESSION + BUG report → de xuat 1-2 rules ngan cho CLAUDE.md
- **D-16:** Hien thi de xuat plain text → hoi user Y/N → CHI append khi user xac nhan
- **D-17:** Format rule: 1-2 dong, bat dau voi "- ", ghi vao cuoi CLAUDE.md
- **D-18:** Non-blocking — user co the skip, workflow van tiep tuc

### Workflow wiring
- **D-19:** Chen sub-step SAU Buoc 10 (xac nhan) — vi LOGIC-01, RPT-01, PM-01 chi co y nghia sau khi user confirm bug da fix
- **D-20:** Tat ca 3 features trong 1 sub-step (Buoc 10a) — goi orchestrator function tu logic-sync.js
- **D-21:** Theo D-10 Phase 25: chen vao buoc hien co, KHONG tao buoc so moi

### Claude's Discretion
- Chi tiet regex/patterns cho moi loai heuristic signal
- Logic tim report moi nhat (glob pattern + sort strategy)
- Noi dung cu the cua rule de xuat (phu thuoc bug context)
- Error messages va warning format

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Workflow hien tai
- `workflows/fix-bug.md` — Workflow 10 buoc + sub-steps, 419 dong hien tai, vi tri chen Buoc 10a
- `references/conventions.md` — Version matching, commit prefixes, bieu tuong

### Module hien co (REUSE)
- `bin/lib/generate-diagrams.js` — generateBusinessLogicDiagram(), generateArchitectureDiagram() — reuse cho RPT-01
- `bin/lib/report-filler.js` — fillManagementReport(), replaceMermaidBlock() — reuse cho RPT-01
- `bin/lib/pdf-renderer.js` — renderPdf() — reuse cho PDF re-render
- `bin/lib/truths-parser.js` — parseTruthsFromContent() — reuse cho diagram generation

### Module patterns (follow)
- `bin/lib/debug-cleanup.js` — Pattern pure function module (Phase 26, moi nhat)
- `bin/lib/regression-analyzer.js` — Pattern dual-mode analysis (Phase 25)

### Testing
- `test/smoke-debug-cleanup.test.js` — Pattern test gan nhat
- `test/smoke-report-filler.test.js` — Pattern test cho report module

### Prior context
- `.planning/phases/25-dieu-tra-tai-hien-loi/25-CONTEXT.md` — D-10 sub-step wiring, D-12 size limit
- `.planning/phases/26-don-dep-an-toan/26-CONTEXT.md` — D-07 non-blocking, D-11 module pattern

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `bin/lib/generate-diagrams.js` — generateBusinessLogicDiagram() da co san, nhan planContents → Mermaid flowchart
- `bin/lib/report-filler.js` — fillManagementReport() + replaceMermaidBlock() da co san
- `bin/lib/pdf-renderer.js` — renderPdf() da co san
- `bin/lib/truths-parser.js` — parseTruthsFromContent() shared helper
- `bin/lib/mermaid-validator.js` — validate Mermaid output

### Established Patterns
- Pure function pattern: nhan content string, tra ket qua, KHONG doc file
- Module naming: `lowercase-with-hyphens.js`, camelCase functions
- Test pattern: `smoke-*.test.js`, node:test, node:assert/strict
- Non-blocking pipeline: try/catch per sub-step (Buoc 3.6 complete-milestone.md)

### Integration Points
- `workflows/fix-bug.md` Buoc 10 — diem chen Buoc 10a sau xac nhan
- `workflows/complete-milestone.md` Buoc 3.6 — non-blocking pipeline mau (tham khao)
- `bin/lib/` — thu muc chua tat ca library modules
- `test/` — thu muc chua tat ca test files
- `test/snapshots/` — 4 platform snapshots can regenerate

</code_context>

<specifics>
## Specific Ideas

- Workflow 419 dong la constraint chinh — module approach bat buoc
- Reuse 3 module hien co (generate-diagrams, report-filler, pdf-renderer) thay vi viet moi
- Non-blocking pipeline giong complete-milestone Buoc 3.6 — da co mau chuan
- Heuristics chi can don gian (regex trên diff) — du tot cho v1.5, AST cho v2

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 27-dong-bo-logic-bao-cao*
*Context gathered: 2026-03-24*
