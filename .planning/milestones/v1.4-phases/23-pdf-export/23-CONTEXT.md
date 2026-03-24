# Phase 23: PDF Export - Context

**Gathered:** 2026-03-24
**Status:** Ready for planning

<domain>
## Phase Boundary

Script `bin/generate-pdf-report.js` xuat Markdown+Mermaid sang PDF chuyen nghiep. Su dung Puppeteer headless Chrome de render Mermaid inline va print to PDF. Graceful fallback sang Markdown file khi thieu Puppeteer hoac Node < 18.

</domain>

<decisions>
## Implementation Decisions

### Mermaid Rendering
- **D-01:** Render Mermaid truc tiep trong Puppeteer page — load mermaid.js tu CDN (cdn.jsdelivr.net), render inline SVG, roi print toan bo page sang PDF. Khong dung mermaid-cli hay pre-render rieng.
- **D-02:** Mermaid la SVG inline trong HTML — sac net o moi zoom level, khong bi pixel.
- **D-03:** Mermaid.js load tu CDN — khong bundle local, khong them npm dependency. Can internet khi generate.

### PDF Styling
- **D-04:** Professional styling: font sans-serif, margin rong, heading colors theo Corporate Blue (#2563EB), table borders, page breaks hop ly. Giong bao cao tu van.
- **D-05:** CSS la template string inline trong script generate-pdf-report.js — tat ca trong 1 file, khong tach CSS rieng.
- **D-06:** Page size A4 (210x297mm) — chuan van phong Viet Nam.

### Dependency Strategy
- **D-07:** Puppeteer KHONG them vao package.json. Runtime detection: try/catch require('puppeteer'). User tu install khi can. Giu zero production deps.
- **D-08:** Khi Puppeteer khong co: log message ro rang voi install command cu the: "PDF export can Puppeteer. Chay: npm install puppeteer". Roi fallback.

### Output Path
- **D-12:** Script BAT BUOC dung `process.cwd()` lam base path de xuat file PDF/MD vao `./.planning/reports/` cua du an dang chay lenh. KHONG duoc fix cung duong dan vao thu muc goc cua `please-done`. Tu dong tao thu muc `.planning/reports/` neu chua co (mkdirSync recursive).

### Fallback Behavior
- **D-09:** Fallback output la Markdown file (.md) da duoc fill day du data (Mermaid text giu nguyen). User doc duoc tren GitHub/VS Code, Mermaid render duoc tren GitHub.
- **D-10:** Node.js < 18: same fallback nhu thieu Puppeteer — log warning + xuat Markdown. Logic chung cho ca 2 truong hop.
- **D-11:** Exit code 0 khi fallback + warning log. Non-blocking cho CI/CD va workflow (Phase 24). Chi exit non-zero khi that bai that su (file write error, etc.)

### Claude's Discretion
- Script CLI interface (args, options)
- HTML template structure cho Puppeteer page
- Markdown-to-HTML conversion approach (marked, markdown-it, hoac regex)
- Test strategy va test cases cu the
- Error handling chi tiet trong render pipeline

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase 21-22 Outputs (Foundation)
- `references/mermaid-rules.md` — Color palette, Shape-by-Role, label conventions, max nodes rule
- `bin/lib/mermaid-validator.js` — Validator API: validate(text) → { valid, errors, warnings }
- `bin/lib/generate-diagrams.js` — generateBusinessLogicDiagram(), generateArchitectureDiagram() output Mermaid text
- `templates/management-report.md` — Report template 7 sections tieng Viet voi Mermaid placeholders

### Requirements
- `.planning/REQUIREMENTS.md` — PDF-01 (xuat PDF ro net), PDF-02 (graceful fallback)

### Existing Patterns
- `bin/lib/plan-checker.js` — Pure function module pattern
- `bin/lib/utils.js` — parseFrontmatter(), extractXmlSection()
- `bin/plan-check.js` — CLI wrapper pattern: file I/O tach biet khoi library logic

### Codebase Conventions
- `.planning/codebase/CONVENTIONS.md` — Naming, code style, module structure

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `bin/lib/generate-diagrams.js` — generateBusinessLogicDiagram(planContents) va generateArchitectureDiagram(codebaseMaps, planArtifacts) output Mermaid text san sang nhung vao HTML
- `bin/lib/mermaid-validator.js` — validate() de kiem tra Mermaid output truoc khi render
- `bin/lib/utils.js` — parseFrontmatter() doc metadata, extractXmlSection() doc content sections
- `templates/management-report.md` — Template voi placeholders cho AI fill

### Established Patterns
- **Module structure:** 'use strict', require() imports, module.exports = { ... }
- **Pure functions:** Khong file I/O trong library code — content passed as args
- **CLI wrapper pattern:** bin/plan-check.js doc files, goi library — tuong tu cho bin/generate-pdf-report.js
- **Test pattern:** smoke-*.test.js dung node:test + node:assert/strict

### Integration Points
- Phase 24 (Workflow Integration) se goi generate-pdf-report.js tu complete-milestone workflow
- Input: management-report.md da duoc fill boi AI (voi Mermaid diagrams tu generate-diagrams.js)
- Output: .pdf file (hoac .md fallback) tai output path

</code_context>

<specifics>
## Specific Ideas

- Puppeteer page load HTML voi CSS inline + mermaid.js CDN → waitForSelector('.mermaid svg') → page.pdf({ format: 'A4' })
- Corporate Blue palette (#2563EB) cho headings, table headers trong CSS — nhat quan voi Mermaid diagrams
- Fallback Markdown van co gia tri vi GitHub auto-render Mermaid code blocks
- Script output message cho ca 2 paths: "PDF created: path/to/file.pdf" hoac "Fallback: Markdown created: path/to/file.md (install puppeteer for PDF)"

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 23-pdf-export*
*Context gathered: 2026-03-24*
