# Phase 22: Diagram Generation - Context

**Gathered:** 2026-03-24
**Status:** Ready for planning

<domain>
## Phase Boundary

AI tu dong ve Business Logic Flowchart va Architecture Diagram tu milestone data. Script JS scaffold + AI fill, validate bang mermaid-validator.js. Output la Mermaid text san sang nhung vao management-report.md.

</domain>

<decisions>
## Implementation Decisions

### Nguon du lieu
- **D-01:** Business Logic Flowchart dung Truths table (main flow) ket hop tasks (bo sung chi tiet khi can)
- **D-02:** Architecture Diagram dung .planning/codebase/ maps (ARCHITECTURE.md, STRUCTURE.md, INTEGRATIONS.md) ket hop PLAN artifacts (files_modified, dependencies)

### Co che tao diagram
- **D-03:** Hybrid approach: Script JS scaffold tao cau truc co ban (nodes, subgraphs), AI bo sung connections va tinh chinh
- **D-04:** Module JS rieng `bin/lib/generate-diagrams.js` — export generateBusinessLogicDiagram() va generateArchitectureDiagram(). Tuong tu pattern mermaid-validator.js
- **D-05:** Luon validate output bang mermaid-validator.js sau khi generate. Neu loi syntax → thu lai max 2 lan

### Business Logic mapping
- **D-06:** 1 Truth = 1 node. Truth Description lam label. VD: T01["Xu ly don hang"]
- **D-07:** Arrows theo thu tu plan: Plan 1 → Plan 2 → Plan 3. Dung depends_on de xac dinh flow direction
- **D-08:** Milestone lon (>15 Truths): tach thanh subgraphs theo wave/plan. Moi subgraph giu duoi 15 nodes

### Architecture extraction
- **D-09:** Layered layout (flowchart LR) voi subgraphs theo layers: CLI → Lib → Converters → Platforms
- **D-10:** Milestone-scoped: chi hien thi modules/files bi thay doi trong milestone do. Khong ve toan bo project
- **D-11:** Shapes theo mermaid-rules.md Shape-by-Role: Service=rectangle, DB=cylinder, API=rounded, External=subroutine

### Claude's Discretion
- Chi tiet implementation cua scaffold function (regex parsing vs structured parsing)
- Edge labels cu the cho arrows giua nodes
- Subgraph naming convention
- Cach detect module role (service vs db vs api) tu codebase maps
- Start/End node placement trong flowchart

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Mermaid Foundation (Phase 21 outputs)
- `references/mermaid-rules.md` — Color palette, Shape-by-Role, label conventions, max nodes rule
- `bin/lib/mermaid-validator.js` — Validator API: validate(text) → { valid, errors, warnings }
- `templates/management-report.md` — Report template voi Section 3 (BL Flow) va Section 4 (Arch) placeholders

### Requirements
- `.planning/REQUIREMENTS.md` — DIAG-01 (Business Logic Flowchart), DIAG-02 (Architecture Diagram)

### Existing Patterns
- `bin/lib/plan-checker.js` — Pure function module pattern tuong tu cho generate-diagrams.js
- `bin/lib/utils.js` — parseFrontmatter(), extractXmlSection() co the dung de parse PLAN content

### Codebase Maps
- `.planning/codebase/ARCHITECTURE.md` — Module boundaries, component relationships
- `.planning/codebase/STRUCTURE.md` — Directory layout, file purposes
- `.planning/codebase/INTEGRATIONS.md` — Integration points between modules

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `bin/lib/mermaid-validator.js` — Goi validate() de kiem tra output truoc khi nhung vao report
- `bin/lib/utils.js` — parseFrontmatter() doc plan metadata, extractXmlSection() doc Truths sections
- `bin/lib/plan-checker.js` — Reference pattern cho pure function module

### Established Patterns
- **Module structure:** 'use strict', require() imports, module.exports = { ... }
- **Pure functions:** Khong file I/O trong library code — content passed as args
- **Test pattern:** smoke-*.test.js dung node:test + node:assert/strict
- **References:** Markdown files trong references/ — loaded by skills khi can

### Integration Points
- `templates/management-report.md` Section 3 + Section 4 — noi nhung Mermaid output
- Phase 24 (Workflow Integration) se goi generate-diagrams.js tu complete-milestone workflow
- Phase 23 (PDF Export) se render Mermaid text thanh hinh anh trong PDF

</code_context>

<specifics>
## Specific Ideas

- Script scaffold doc Truths bang parseFrontmatter() + regex, output Mermaid text theo mermaid-rules.md
- Validate loop: generate → validate → neu loi thi AI sua → validate lai (max 2 retries)
- Architecture diagram chi focus modules thay doi trong milestone — giu diagram gon cho Manager
- Vietnamese labels cho tat ca nodes (nhat quan voi D-09 Phase 21), Corporate Blue palette

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 22-diagram-generation*
*Context gathered: 2026-03-24*
