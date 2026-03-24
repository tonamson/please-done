# Phase 24: Workflow Integration - Context

**Gathered:** 2026-03-24
**Status:** Ready for planning

<domain>
## Phase Boundary

Cap nhat workflow complete-milestone de tu dong goi ve so do Mermaid + fill bao cao quan ly + xuat PDF. Pipeline toan bo la non-blocking — milestone completion khong bao gio bi fail boi report generation.

</domain>

<decisions>
## Implementation Decisions

### Thu tu tich hop
- **D-01:** Buoc moi nam SAU Buoc 3.5 (xac minh goal-backward), TRUOC Buoc 4 (bao cao tong ket). Luc nay milestone da duoc xac nhan OK — an toan de generate report.
- **D-02:** Thu tu sub-steps: (1) generateBusinessLogicDiagram + generateArchitectureDiagram → Mermaid text, (2) fillManagementReport() fill template voi data + Mermaid, (3) generate-pdf-report.js xuat PDF.

### Error Handling
- **D-03:** Bat ky loi nao trong pipeline (diagram/fill/PDF) chi log warning, ghi chu vao MILESTONE_COMPLETE.md, roi TIEP TUC. Milestone completion KHONG BAO GIO bi chan boi report generation. Phu hop voi INTG-02.
- **D-04:** Khi diagram generation loi nhung PDF generation OK: giu placeholder goc tu template. Report van duoc fill va xuat PDF nhung khong co so do thuc te.

### Bao cao output
- **D-05:** Report luu tai process.cwd()/.planning/reports/ (theo D-12 Phase 23). Ten file: management-report-v{version}.pdf (hoac .md fallback). Vi du: management-report-v1.4.pdf.
- **D-06:** Them section "## Bao cao quan ly" trong MILESTONE_COMPLETE.md voi duong dan toi PDF. Neu fallback thi link toi .md file.

### AI fill strategy
- **D-07:** Viet function fillManagementReport() — pure data extraction + template fill, KHONG can LLM. Doc data tu PLAN.md, SUMMARY.md, CODE_REPORT, STATE.md va replace placeholders trong template.
- **D-08:** Data mapping: Section 1-2 tu STATE.md (velocity, phases, plans). Section 3 tu generateBusinessLogicDiagram(PLAN contents). Section 4 tu generateArchitectureDiagram(codebase maps). Section 5-7 tu SUMMARY.md (key files, issues, metrics).

### Claude's Discretion
- fillManagementReport() function signature va internal implementation
- Cach doc va parse data tu cac source files
- Test strategy va test cases cu the
- Error message format va warning log details
- Cach integrate vao workflow file (modify workflow markdown)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase 21-23 Outputs (Foundation)
- `bin/lib/generate-diagrams.js` — generateBusinessLogicDiagram(planContents), generateArchitectureDiagram(codebaseMaps, planArtifacts)
- `bin/lib/pdf-renderer.js` — markdownToHtml(), buildHtml(), canUsePuppeteer(), renderMarkdownFallback()
- `bin/generate-pdf-report.js` — CLI wrapper: reads MD input, outputs PDF to process.cwd()/.planning/reports/
- `bin/lib/mermaid-validator.js` — validate(text) → { valid, errors, warnings }
- `templates/management-report.md` — Report template 7 sections tieng Viet voi Mermaid placeholders

### Workflow (Target)
- `workflows/complete-milestone.md` — Workflow hien tai can them buoc generate report (sau Buoc 3.5)
- `commands/pd/complete-milestone.md` — Command wrapper goi workflow

### Requirements
- `.planning/REQUIREMENTS.md` — INTG-01 (tu dong goi ve so do + bao cao), INTG-02 (non-blocking)

### Existing Patterns
- `bin/lib/utils.js` — parseFrontmatter(), extractXmlSection()
- `bin/lib/plan-checker.js` — Pure function module pattern
- `bin/plan-check.js` — CLI wrapper pattern

### Codebase Conventions
- `.planning/codebase/CONVENTIONS.md` — Naming, code style, module structure

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `bin/lib/generate-diagrams.js` — generateBusinessLogicDiagram(planContents) tra ve Mermaid flowchart TD, generateArchitectureDiagram(codebaseMaps, planArtifacts) tra ve Mermaid flowchart LR
- `bin/lib/pdf-renderer.js` — markdownToHtml(), buildHtml(), canUsePuppeteer(), renderMarkdownFallback() — tat ca pure functions
- `bin/generate-pdf-report.js` — CLI wrapper da co san, nhan input MD va xuat PDF/fallback MD
- `bin/lib/utils.js` — parseFrontmatter() doc PLAN.md metadata, extractXmlSection() doc content
- `templates/management-report.md` — Template voi {{placeholders}} va Mermaid code blocks

### Established Patterns
- **Module structure:** 'use strict', require() imports, module.exports = { ... }
- **Pure functions:** Khong file I/O trong library code — content passed as args
- **CLI wrapper pattern:** bin/plan-check.js, bin/generate-pdf-report.js — file I/O tach biet
- **Test pattern:** smoke-*.test.js dung node:test + node:assert/strict

### Integration Points
- `workflows/complete-milestone.md` — them buoc moi "Buoc 3.6" giua 3.5 va 4
- fillManagementReport() se doc .planning/ files (PLAN.md, SUMMARY.md, STATE.md) va goi generate-diagrams functions
- Output PDF/MD toi .planning/reports/ — thu muc tu dong tao boi generate-pdf-report.js

</code_context>

<specifics>
## Specific Ideas

- fillManagementReport() nhan milestone version + paths, doc du lieu, replace {{placeholders}} trong template, tra ve filled Markdown string
- Workflow Buoc 3.6: goi fillManagementReport() → ghi filled MD → goi generate-pdf-report.js → log ket qua → ghi link vao MILESTONE_COMPLETE.md
- Moi sub-step wrap trong try/catch rieng — 1 buoc loi khong anh huong buoc khac
- Ket qua pipeline ghi vao MILESTONE_COMPLETE.md: "Bao cao quan ly: .planning/reports/management-report-v1.4.pdf" hoac "Bao cao quan ly: khong tao duoc (loi: ...)"

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 24-workflow-integration*
*Context gathered: 2026-03-24*
