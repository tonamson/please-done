# Phase 21: Mermaid Foundation - Context

**Gathered:** 2026-03-24
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 21 cung cap nen tang cho Mermaid diagrams: quy tac tham my (mermaid-rules.md), validator syntax+style (mermaid-validator.js), va template bao cao quan ly (management-report.md). Day la infrastructure phase — chua tao diagram thuc te (Phase 22) hay xuat PDF (Phase 23).

</domain>

<decisions>
## Implementation Decisions

### Visual Style
- **D-01:** Color palette: Corporate Blue — primary #2563EB (blue), secondary #64748B (slate), accent #10B981 (green), warning #F59E0B (amber), error #DC2626 (red)
- **D-02:** Node shapes theo Shape-by-Role: Service=rectangle, Database=cylinder, API=rounded, Decision=diamond, Start/End=stadium, External=subroutine
- **D-03:** Labels ngan gon 3-5 tu, edge labels 1-3 tu. Khong viet tat kho hieu.
- **D-04:** Max 15 nodes per diagram. Vuot qua thi tach thanh subgraphs hoac diagrams rieng.

### Validator Scope
- **D-05:** Validator check ca Syntax (unclosed quotes, reserved keywords, missing arrows) LAN Style compliance (palette, shape mapping, max nodes). Syntax errors = invalid (errors), style violations = warnings.
- **D-06:** Error format co line number: `{ line, message, type }` de AI tu sua duoc. Return `{ valid, errors, warnings }`.

### Report Template
- **D-07:** 7 sections business-focused: (1) Executive Summary, (2) Milestone Overview, (3) Business Logic Flow (Mermaid), (4) Architecture Overview (Mermaid), (5) Key Achievements, (6) Quality Metrics, (7) Next Steps
- **D-08:** Ngon ngu report: tieng Viet toan bo — nhat quan voi phong cach du an

### Diagram Language
- **D-09:** Labels tren Mermaid diagrams dung tieng Viet. VD: node="Xu ly don hang", edge="thanh cong"
- **D-10:** Quoting rule: LUON dung double quotes cho tat ca labels — an toan cho dau tieng Viet, nhat quan, de validate. VD: `A["Xu ly don hang"] --> B["Thanh cong"]`

### Claude's Discretion
- Direction rules cho flowcharts (TD vs LR) — Claude chon phu hop theo loai diagram
- Anti-patterns list cu the trong mermaid-rules.md
- Validator internal implementation (regex vs parser approach)
- Test case selection (cac truong hop cu the de test)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Requirements
- `.planning/REQUIREMENTS.md` — MERM-01 (quy tac tham my), MERM-02 (validator), REPT-01 (template report)

### Existing Patterns
- `bin/lib/plan-checker.js` — Pure function validator pattern tuong tu cho mermaid-validator.js
- `references/plan-checker.md` — Rules spec pattern tuong tu cho mermaid-rules.md
- `test/smoke-plan-checker.test.js` — Test pattern cho validator

### Codebase Conventions
- `.planning/codebase/CONVENTIONS.md` — Naming, code style, module structure conventions

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `bin/lib/utils.js` — parseFrontmatter(), extractXmlSection() co the dung de parse content
- `bin/lib/plan-checker.js` — Pure function pattern: nhan content, tra ket qua, khong doc file. mermaid-validator.js nen theo pattern nay.

### Established Patterns
- **Module structure:** 'use strict', require() imports, module.exports = { ... }
- **Pure functions:** Khong file I/O trong library code — content passed as args
- **Error format:** Plan checker tra ve { valid, errors } — mermaid validator mo rong thanh { valid, errors, warnings }
- **Test pattern:** smoke-*.test.js dung node:test + node:assert/strict
- **References:** Markdown files trong references/ — loaded by skills khi can

### Integration Points
- `references/mermaid-rules.md` — Se duoc referenced boi Phase 22 (diagram generation) va Phase 24 (workflow integration)
- `bin/lib/mermaid-validator.js` — Se duoc called boi Phase 22 truoc khi nhung diagram vao report
- `templates/management-report.md` — Se duoc filled boi Phase 22 va exported boi Phase 23

</code_context>

<specifics>
## Specific Ideas

- Corporate Blue palette lay cam hung tu professional business reporting — Manager-friendly
- Shape-by-Role mapping giup phan biet truc quan service/DB/API/decision tu cai nhin dau tien
- Validator return { valid, errors, warnings } thay vi chi { valid, errors } — style violations la warnings, khong block
- Vietnamese labels can double quotes vi dau tieng Viet co the break Mermaid syntax neu khong quote

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 21-mermaid-foundation*
*Context gathered: 2026-03-24*
