# Phase 24: Workflow Integration - Nghien cuu

**Nghien cuu:** 2026-03-24
**Linh vuc:** Tich hop pipeline bao cao vao workflow complete-milestone
**Do tin cay:** CAO

<user_constraints>
## Rang buoc nguoi dung (tu CONTEXT.md)

### Quyet dinh da khoa
- **D-01:** Buoc moi nam SAU Buoc 3.5 (xac minh goal-backward), TRUOC Buoc 4 (bao cao tong ket). Luc nay milestone da duoc xac nhan OK — an toan de generate report.
- **D-02:** Thu tu sub-steps: (1) generateBusinessLogicDiagram + generateArchitectureDiagram tao Mermaid text, (2) fillManagementReport() fill template voi data + Mermaid, (3) generate-pdf-report.js xuat PDF.
- **D-03:** Bat ky loi nao trong pipeline (diagram/fill/PDF) chi log warning, ghi chu vao MILESTONE_COMPLETE.md, roi TIEP TUC. Milestone completion KHONG BAO GIO bi chan boi report generation.
- **D-04:** Khi diagram generation loi nhung PDF generation OK: giu placeholder goc tu template. Report van duoc fill va xuat PDF nhung khong co so do thuc te.
- **D-05:** Report luu tai process.cwd()/.planning/reports/ (theo D-12 Phase 23). Ten file: management-report-v{version}.pdf (hoac .md fallback).
- **D-06:** Them section "## Bao cao quan ly" trong MILESTONE_COMPLETE.md voi duong dan toi PDF. Neu fallback thi link toi .md file.
- **D-07:** Viet function fillManagementReport() — pure data extraction + template fill, KHONG can LLM. Doc data tu PLAN.md, SUMMARY.md, CODE_REPORT, STATE.md va replace placeholders trong template.
- **D-08:** Data mapping: Section 1-2 tu STATE.md (velocity, phases, plans). Section 3 tu generateBusinessLogicDiagram(PLAN contents). Section 4 tu generateArchitectureDiagram(codebase maps). Section 5-7 tu SUMMARY.md (key files, issues, metrics).

### Tuy y cua Claude
- fillManagementReport() function signature va internal implementation
- Cach doc va parse data tu cac source files
- Test strategy va test cases cu the
- Error message format va warning log details
- Cach integrate vao workflow file (modify workflow markdown)

### Y tuong hoan lai (NGOAI PHAM VI)
Khong co — discussion nam trong pham vi phase.
</user_constraints>

<phase_requirements>
## Yeu cau Phase

| ID | Mo ta | Ho tro nghien cuu |
|----|-------|--------------------|
| INTG-01 | Workflow complete-milestone tu dong goi buoc ve so do va tao bao cao quan ly | fillManagementReport() module + Buoc 3.6 trong workflow markdown |
| INTG-02 | Buoc ve so do la non-blocking — milestone completion khong bi fail neu PDF generation loi | Try/catch rieng tung sub-step + chi log warning + ghi chu MILESTONE_COMPLETE.md |
</phase_requirements>

## Tom tat

Phase nay tich hop toan bo pipeline bao cao (diagram generation + template fill + PDF export) vao workflow complete-milestone. Cong viec chinh gom 3 phan: (1) viet module `fillManagementReport()` moi trong `bin/lib/report-filler.js` de doc du lieu tu `.planning/` files va fill template, (2) cap nhat `workflows/complete-milestone.md` them Buoc 3.6, (3) viet tests.

Tat ca building blocks da san sang tu Phase 21-23: `generate-diagrams.js` (Mermaid generation), `pdf-renderer.js` (MD-to-HTML), `generate-pdf-report.js` (CLI PDF wrapper), `mermaid-validator.js` (validation). Phase 24 chi can glue code — goi cac module hien co theo dung thu tu va xu ly loi non-blocking.

**Khuyen nghi chinh:** Tao module `bin/lib/report-filler.js` la pure function (nhan content strings, tra ve filled markdown string). File I/O nam ngoai module — trong workflow instructions hoac test harness.

## Kiem kho codebase hien co

### Module san co (da implement Phase 21-23)

| Module | Export | Signature | Tra ve |
|--------|--------|-----------|--------|
| `bin/lib/generate-diagrams.js` | `generateBusinessLogicDiagram` | `(planContents[], options?)` | `{ diagram, valid, errors, warnings, truthCount, planCount }` |
| `bin/lib/generate-diagrams.js` | `generateArchitectureDiagram` | `(codebaseMaps, planMeta, options?)` | `{ diagram, valid, errors, warnings, layerCount, nodeCount }` |
| `bin/lib/pdf-renderer.js` | `markdownToHtml` | `(md)` | `string (HTML)` |
| `bin/lib/pdf-renderer.js` | `buildHtml` | `(bodyHtml)` | `string (full HTML doc)` |
| `bin/lib/pdf-renderer.js` | `canUsePuppeteer` | `()` | `{ available, reason? }` |
| `bin/lib/pdf-renderer.js` | `renderMarkdownFallback` | `(markdownContent)` | `string` |
| `bin/lib/mermaid-validator.js` | `mermaidValidator` | `(mermaidText, options?)` | `{ valid, errors, warnings }` |
| `bin/lib/utils.js` | `parseFrontmatter` | `(content)` | `{ frontmatter, body, raw }` |
| `bin/lib/utils.js` | `log` | object | `.info()`, `.warn()`, `.error()`, `.success()` |
| `bin/generate-pdf-report.js` | CLI | `node bin/generate-pdf-report.js <input.md>` | Exit 0 (PDF hoac MD fallback) |

### Template placeholders (templates/management-report.md)

| Placeholder | Section | Data source |
|-------------|---------|-------------|
| `{{milestone_name}}` | Header | STATE.md `milestone_name` |
| `{{version}}` | Header | STATE.md `milestone` hoac CURRENT_MILESTONE.md |
| `{{date}}` | Header | Ngay hien tai |
| `{{phase_name}}` | Section 2 | STATE.md phases list |
| `{{status}}` | Section 2 | STATE.md phase status |
| `{{plan_count}}` | Section 2 | STATE.md plans count |
| `{{duration}}` | Section 2 | STATE.md duration |
| Mermaid code block Section 3 | Section 3 | generateBusinessLogicDiagram() output |
| Mermaid code block Section 4 | Section 4 | generateArchitectureDiagram() output |
| `{{metric_name}}` / `{{metric_value}}` | Section 6 | SUMMARY.md metrics |
| `<!-- AI fill: ... -->` comments | Section 1, 5, 7 | SUMMARY.md, CODE_REPORT data |

### Data sources va cach doc

| Source file | Doc bang | Data co san |
|-------------|---------|-------------|
| `.planning/STATE.md` | `parseFrontmatter()` cho YAML header | milestone, version, velocity, phases, plans |
| `.planning/phases/*/XX-*-PLAN.md` | `parseFrontmatter()` + doc body | Truths tables, dependencies, phase info |
| `.planning/phases/*/XX-*-SUMMARY.md` | Doc truc tiep | Key files, issues, metrics |
| `.planning/codebase/ARCHITECTURE.md` | Doc truc tiep | Layer definitions cho architecture diagram |
| `templates/management-report.md` | Doc truc tiep | Template voi placeholders |

## Kien truc Patterns

### Cau truc du an duoc khuyen nghi

```
bin/lib/
  report-filler.js          # MOI — fillManagementReport() pure function
  generate-diagrams.js      # DA CO — generateBusinessLogicDiagram, generateArchitectureDiagram
  pdf-renderer.js           # DA CO — markdownToHtml, buildHtml, etc.
  mermaid-validator.js      # DA CO — mermaidValidator
  utils.js                  # DA CO — parseFrontmatter, log

bin/
  generate-pdf-report.js    # DA CO — CLI wrapper

workflows/
  complete-milestone.md     # SUA — them Buoc 3.6

test/
  smoke-report-filler.test.js  # MOI — tests cho fillManagementReport
```

### Pattern 1: Pure Function Module (report-filler.js)

**La gi:** Module chi chua pure functions. Nhan content strings lam input, tra ve filled markdown string. Khong doc/ghi file.
**Khi nao dung:** Giong nhu generate-diagrams.js va pdf-renderer.js — tat ca Phase 21-23 modules deu theo pattern nay.
**Vi du:**

```javascript
// Source: Pattern tu bin/lib/generate-diagrams.js va bin/lib/pdf-renderer.js
'use strict';

const { parseFrontmatter } = require('./utils');
const { generateBusinessLogicDiagram, generateArchitectureDiagram } = require('./generate-diagrams');

/**
 * Fill management report template voi data tu milestone.
 *
 * @param {object} params
 * @param {string} params.templateContent - Noi dung template management-report.md
 * @param {string} params.stateContent - Noi dung STATE.md
 * @param {Array<{planNumber: number, content: string, phase: string}>} params.planContents - PLAN.md contents
 * @param {string[]} params.summaryContents - SUMMARY.md contents array
 * @param {object} params.codebaseMaps - { architecture: string }
 * @param {object} params.planMeta - { filesModified: string[] }
 * @param {string} params.version - Milestone version (e.g. 'v1.4')
 * @param {string} params.milestoneName - Ten milestone
 * @param {string} [params.date] - Ngay bao cao, mac dinh hom nay
 * @returns {{ filledMarkdown: string, diagramResults: { business: object, architecture: object } }}
 */
function fillManagementReport(params) {
  // ... pure data extraction + template replacement
}

module.exports = { fillManagementReport };
```

### Pattern 2: Non-blocking Pipeline trong Workflow

**La gi:** Moi sub-step nam trong try/catch rieng. Loi chi log warning, KHONG throw. Pipeline tiep tuc voi du lieu con lai.
**Khi nao dung:** INTG-02 yeu cau bat buoc.
**Vi du (workflow markdown):**

```markdown
## Buoc 3.6: Tao bao cao quan ly

> Non-blocking: Moi sub-step deu try/catch rieng. Loi chi log warning va ghi chu MILESTONE_COMPLETE.md.

### 3.6a — Tao so do Mermaid
1. Doc tat ca PLAN.md files cua milestone
2. Goi generateBusinessLogicDiagram(planContents)
3. Goi generateArchitectureDiagram(codebaseMaps, planMeta)
4. Loi → giu placeholder goc tu template, log warning

### 3.6b — Fill template bao cao
1. Doc templates/management-report.md
2. Goi fillManagementReport() voi data da thu thap
3. Ghi filled markdown ra file tam .planning/reports/management-report-v{version}.md
4. Loi → log warning, bo qua

### 3.6c — Xuat PDF
1. Chay: node bin/generate-pdf-report.js .planning/reports/management-report-v{version}.md
2. Kiem tra output: .pdf hoac .md fallback
3. Loi → log warning, fallback markdown van duoc giu lai

### 3.6d — Ghi ket qua vao MILESTONE_COMPLETE.md
Them section:
## Bao cao quan ly
- {reportPath ? "Duong dan: " + reportPath : "Khong tao duoc bao cao"}
- {reportWarnings.length > 0 ? "Canh bao: " + reportWarnings.join(", ") : ""}
```

### Anti-Patterns can tranh
- **Anti-pattern: File I/O trong library module:** report-filler.js KHONG duoc doc file. Content phai duoc truyen vao qua params. Workflow (AI agent) doc file va truyen content.
- **Anti-pattern: Throw error trong pipeline:** Pipeline KHONG BAO GIO throw. Moi loi duoc catch, log, va pipeline tiep tuc.
- **Anti-pattern: Depend vao LLM cho data extraction:** fillManagementReport() la pure function — regex/string ops, KHONG goi AI API.

## Khong tu viet

| Van de | Khong tu viet | Dung thay the | Tai sao |
|--------|---------------|---------------|---------|
| Mermaid generation | Tu code flowchart parser | `generateBusinessLogicDiagram()` da co | Phase 22 da implement + validate + retry |
| Architecture diagram | Tu code codebase analyzer | `generateArchitectureDiagram()` da co | Phase 22 da implement voi layer matching |
| MD-to-HTML | Tu code markdown parser | `markdownToHtml()` da co | Phase 23 da implement regex-based |
| PDF export | Tu code PDF renderer | `bin/generate-pdf-report.js` da co | Phase 23 da implement voi Puppeteer + fallback |
| Mermaid validation | Tu code syntax checker | `mermaidValidator()` da co | Phase 21 da implement |
| Frontmatter parsing | Tu code YAML parser | `parseFrontmatter()` da co | Existing utility |

**Insight chinh:** Phase 24 KHONG tao tool moi. Chi tao 1 pure function (fillManagementReport) va sua 1 workflow markdown file. Tat ca heavy lifting da xong.

## Loi thuong gap

### Loi 1: Pipeline throw lam fail milestone completion
**Dieu gi sai:** Mot loi trong diagram/fill/PDF throw exception ra ngoai, lam Buoc 4 va cac buoc sau khong chay.
**Tai sao xay ra:** Khong wrap moi sub-step trong try/catch rieng.
**Cach tranh:** Moi sub-step (3.6a, 3.6b, 3.6c, 3.6d) phai co try/catch doc lap. Loi chi log, KHONG throw.
**Dau hieu canh bao:** Workflow khong co `try/catch` hoac chi co 1 try/catch bao quanh toan bo pipeline.

### Loi 2: Template replacement bo sot HTML comments
**Dieu gi sai:** Template co `<!-- AI fill: ... -->` comments — replace placeholders `{{...}}` nhung khong thay the comments.
**Tai sao xay ra:** Chi dung regex cho `{{...}}` ma quen `<!-- ... -->`.
**Cach tranh:** fillManagementReport() phai: (1) replace `{{...}}` placeholders, (2) replace `<!-- AI fill ... -->` comments bang content thuc te, (3) replace Mermaid code blocks placeholder.
**Dau hieu canh bao:** Output van chua `<!-- AI fill` text.

### Loi 3: Mermaid code block replacement sai
**Dieu gi sai:** Replace Mermaid placeholder trong Section 3 nhung vo tinh anh huong Section 4 hoac nguoc lai.
**Tai sao xay ra:** Regex qua rong match tat ca mermaid code blocks.
**Cach tranh:** Parse template theo section (## 3. va ## 4.), replace Mermaid block trong dung section.
**Dau hieu canh bao:** Architecture diagram xuat hien o vi tri business logic.

### Loi 4: STATE.md frontmatter parse loi
**Dieu gi sai:** STATE.md co nested YAML (progress.total_phases, progress.completed_phases) ma parseFrontmatter() hien tai khong ho tro nested objects.
**Tai sao xay ra:** parseFrontmatter() chi parse flat key-value va arrays.
**Cach tranh:** Doc STATE.md body (phan Markdown sau frontmatter) de lay velocity data tu bang va bullet points, thay vi chi doc frontmatter.
**Dau hieu canh bao:** `parseFrontmatter()` tra ve undefined cho nested fields.

### Loi 5: File path sai khi generate-pdf-report.js duoc goi
**Dieu gi sai:** CLI wrapper can absolute path hoac path tuong doi tu process.cwd(), nhung workflow truyen sai path.
**Tai sao xay ra:** generate-pdf-report.js dung `path.resolve(process.argv[2])` — can input path chinh xac.
**Cach tranh:** Workflow instruction phai chi ro: dung duong dan tuyet doi hoac `.planning/reports/management-report-v{version}.md` (tuong doi tu project root).
**Dau hieu canh bao:** "File khong ton tai" error tu generate-pdf-report.js.

## Vi du code

### fillManagementReport() — Core Logic

```javascript
// Source: Thiet ke moi dua tren pattern generate-diagrams.js
'use strict';

const { parseFrontmatter } = require('./utils');
const { generateBusinessLogicDiagram, generateArchitectureDiagram } = require('./generate-diagrams');

/**
 * Fill management report template voi du lieu milestone.
 * Pure function — khong doc file, khong goi AI.
 *
 * @param {object} params
 * @param {string} params.templateContent
 * @param {string} params.stateContent
 * @param {Array<{planNumber: number, content: string, phase: string}>} params.planContents
 * @param {string[]} params.summaryContents
 * @param {object} params.codebaseMaps - { architecture: string }
 * @param {object} params.planMeta - { filesModified: string[] }
 * @param {string} params.version
 * @param {string} params.milestoneName
 * @param {string} [params.date]
 * @returns {{ filledMarkdown: string, diagramResults: { business: object, architecture: object } }}
 */
function fillManagementReport(params) {
  const {
    templateContent,
    stateContent,
    planContents = [],
    summaryContents = [],
    codebaseMaps = {},
    planMeta = {},
    version = '',
    milestoneName = '',
    date = new Date().toISOString().split('T')[0],
  } = params;

  let filled = templateContent;

  // 1. Replace header placeholders
  filled = filled.replace(/\{\{milestone_name\}\}/g, milestoneName);
  filled = filled.replace(/\{\{version\}\}/g, version);
  filled = filled.replace(/\{\{date\}\}/g, date);

  // 2. Parse STATE.md body cho velocity data
  const stateData = parseStateData(stateContent);

  // 3. Fill Section 2 — bang phases
  filled = fillPhaseTable(filled, stateData);

  // 4. Fill Section 3 — Business Logic Diagram
  let businessResult = { diagram: '', valid: false, errors: [], warnings: [] };
  try {
    businessResult = generateBusinessLogicDiagram(planContents);
  } catch { /* non-blocking */ }
  filled = replaceMermaidBlock(filled, '## 3.', businessResult.diagram);

  // 5. Fill Section 4 — Architecture Diagram
  let archResult = { diagram: '', valid: false, errors: [], warnings: [] };
  try {
    archResult = generateArchitectureDiagram(codebaseMaps, planMeta);
  } catch { /* non-blocking */ }
  filled = replaceMermaidBlock(filled, '## 4.', archResult.diagram);

  // 6. Fill Sections 1, 5, 6, 7 — tu SUMMARY data
  filled = fillSummarySections(filled, summaryContents, stateData);

  // 7. Xoa con lai <!-- AI fill ... --> comments
  filled = filled.replace(/<!--\s*AI fill[^>]*-->\n?/g, '');

  return {
    filledMarkdown: filled,
    diagramResults: {
      business: businessResult,
      architecture: archResult,
    },
  };
}
```

### replaceMermaidBlock() — Section-specific Replacement

```javascript
/**
 * Replace Mermaid code block trong 1 section cu the.
 * Match section heading, roi tim mermaid block gan nhat sau heading.
 *
 * @param {string} content
 * @param {string} sectionPrefix - e.g. '## 3.' hoac '## 4.'
 * @param {string} newDiagram - Mermaid text moi (khong co fences)
 * @returns {string}
 */
function replaceMermaidBlock(content, sectionPrefix, newDiagram) {
  if (!newDiagram) return content;

  // Tim vi tri section heading
  const sectionIdx = content.indexOf(sectionPrefix);
  if (sectionIdx === -1) return content;

  // Tim mermaid code block SAU section heading
  const afterSection = content.slice(sectionIdx);
  const mermaidRegex = /```mermaid\n[\s\S]*?```/;
  const match = afterSection.match(mermaidRegex);
  if (!match) return content;

  const before = content.slice(0, sectionIdx + match.index);
  const after = content.slice(sectionIdx + match.index + match[0].length);
  return before + '```mermaid\n' + newDiagram + '\n```' + after;
}
```

### Workflow Integration Pattern (Buoc 3.6 instructions)

```markdown
## Buoc 3.6: Tao bao cao quan ly (non-blocking)

> QUAN TRONG: Toan bo buoc nay la non-blocking.
> Bat ky loi nao chi log warning va ghi chu — KHONG BAO GIO chan milestone completion.

### Bien luu ket qua
- reportPath = null
- reportWarnings = []

### 3.6a — Thu thap du lieu va tao so do
Trong try/catch:
1. Doc tat ca `.planning/phases/*/XX-*-PLAN.md` cua milestone hien tai
2. Goi `generateBusinessLogicDiagram(planContents)` -> luu ket qua
3. Doc `.planning/codebase/ARCHITECTURE.md`
4. Thu thap `filesModified` tu SUMMARY.md cac plans
5. Goi `generateArchitectureDiagram(codebaseMaps, planMeta)` -> luu ket qua
6. NEU loi -> ghi reportWarnings, diagram = placeholder goc

### 3.6b — Fill template
Trong try/catch:
1. Doc `templates/management-report.md`
2. Doc `.planning/STATE.md`
3. Doc tat ca `*-SUMMARY.md` files
4. Goi `fillManagementReport()` voi toan bo data
5. Ghi ket qua ra `.planning/reports/management-report-v{version}.md`
6. NEU loi -> ghi reportWarnings

### 3.6c — Xuat PDF
Trong try/catch:
1. Chay `node bin/generate-pdf-report.js .planning/reports/management-report-v{version}.md`
2. Kiem tra `.planning/reports/management-report-v{version}.pdf` ton tai
3. reportPath = pdf path (hoac md fallback path)
4. NEU loi -> reportPath = md path (fallback), ghi reportWarnings

### 3.6d — Ghi ket qua
Them vao MILESTONE_COMPLETE.md (Buoc 4):
## Bao cao quan ly
- {reportPath ? "Duong dan: " + reportPath : "Khong tao duoc bao cao"}
- {reportWarnings.length > 0 ? "Canh bao: " + reportWarnings.join(", ") : ""}
```

## Phan tich chi tiet fillManagementReport()

### Data extraction tu STATE.md

STATE.md co YAML frontmatter va Markdown body. Frontmatter fields:
```yaml
milestone: v1.4
milestone_name: Mermaid Diagrams
progress:
  total_phases: 13
  completed_phases: 11
  total_plans: 28
  completed_plans: 27
```

**Chu y:** `parseFrontmatter()` hien tai KHONG ho tro nested YAML (`progress.total_phases`). Phai doc body markdown de lay velocity data tu performance metrics table va bullet points.

Body STATE.md chua:
- `## Performance Metrics` -> bang voi plans, duration
- Bang `| Phase XX-name PYY | ~Xmin | Y tasks | Z files |`

### Data extraction tu SUMMARY.md files

SUMMARY.md files nam tai `.planning/phases/XX-name/XX-YY-SUMMARY.md`. Moi file chua:
- Files modified/created
- Key metrics
- Issues found

### Template replacement strategy

1. **{{...}} placeholders:** Simple string.replace()
2. **<!-- AI fill ... --> comments:** Replace bang generated content (bullet lists, tables)
3. **Mermaid code blocks:** Section-specific replacement (## 3. va ## 4.)
4. **Table rows {{...}}:** Replace ca dong voi data rows thuc te

### Gia tri default khi data khong co

| Field | Default |
|-------|---------|
| milestone_name | "(chua co ten)" |
| version | "(chua co version)" |
| date | ISO date hom nay |
| Phase table | "(Khong co du lieu phases)" |
| Mermaid diagram | Giu placeholder goc tu template |
| Summary sections | "(Khong co du lieu)" |

## Tien trinh code

### Buoc ghi workflow cu the

Phan workflow `complete-milestone.md` can thay doi:
1. Chen Buoc 3.6 giua dong 92 (ket thuc Buoc 3.5) va dong 96 (bat dau Buoc 4)
2. Dong `---` separator giua 3.5 va 4 duoc giu nguyen
3. Them `---` separator moi giua 3.6 va 4

Vi tri chinh xac trong file:
```
Dong 91: - TAT CA dat -> Buoc 4          <- thay "Buoc 4" thanh "Buoc 3.6"
Dong 92: - Co van de -> ...               <- ghi chu "Buoc 3.6" thay vi "Buoc 4"
Dong 93: (blank)
Dong 94: ---
Dong 95: (blank)
Dong 96: ## Buoc 4: ...                   <- giu nguyen
```

Chen Buoc 3.6 complete markdown text SAU dong 94 `---` va TRUOC `## Buoc 4`.

### Dong Buoc 4 reference update

Buoc 3.6d khong tao MILESTONE_COMPLETE.md rieng — no chi cung cap data (reportPath, reportWarnings) de Buoc 4 them vao MILESTONE_COMPLETE.md khi viet.

## Validation Architecture

### Tieu chi chap nhan (Acceptance Criteria)

| ID | Tieu chi | Loai | Kiem tra bang |
|----|----------|------|-------------|
| AC-01 | `bin/lib/report-filler.js` ton tai va export `fillManagementReport` | Ton tai + Export | Grep + require |
| AC-02 | fillManagementReport() nhan templateContent va tra ve filledMarkdown string | Unit | Test assertion |
| AC-03 | `{{milestone_name}}`, `{{version}}`, `{{date}}` duoc replace dung | Unit | String includes check |
| AC-04 | Mermaid code block Section 3 duoc replace bang business logic diagram | Unit | Section-specific content check |
| AC-05 | Mermaid code block Section 4 duoc replace bang architecture diagram | Unit | Section-specific content check |
| AC-06 | Section 3 va Section 4 replacement KHONG lan nhau | Unit | Cross-check ca 2 sections |
| AC-07 | `<!-- AI fill ... -->` comments duoc xoa khoi output | Unit | Regex negative match |
| AC-08 | Khi generateBusinessLogicDiagram throw, pipeline tiep tuc va giu placeholder | Unit | Try/catch test |
| AC-09 | Khi generateArchitectureDiagram throw, pipeline tiep tuc va giu placeholder | Unit | Try/catch test |
| AC-10 | fillManagementReport() KHONG doc file — chi nhan content strings | Code review | Grep khong co `require('fs')` |
| AC-11 | `workflows/complete-milestone.md` co Buoc 3.6 giua 3.5 va 4 | Content | Grep pattern match |
| AC-12 | Buoc 3.6 co 4 sub-steps (3.6a, 3.6b, 3.6c, 3.6d) | Content | Grep sub-step headings |
| AC-13 | Buoc 3.6 co chi dan non-blocking ro rang | Content | Grep "non-blocking" |
| AC-14 | Workflow huong dan ghi "## Bao cao quan ly" vao MILESTONE_COMPLETE.md | Content | Grep section reference |
| AC-15 | Test file `test/smoke-report-filler.test.js` ton tai va pass | Test | node --test |

### Diem tich hop (Integration Points)

| Tu module | Toi module | Interface | Validation |
|-----------|-----------|-----------|------------|
| `report-filler.js` | `generate-diagrams.js` | Goi `generateBusinessLogicDiagram(planContents)` | Unit test: mock throw -> pipeline con chay |
| `report-filler.js` | `generate-diagrams.js` | Goi `generateArchitectureDiagram(codebaseMaps, planMeta)` | Unit test: mock throw -> pipeline con chay |
| `report-filler.js` | `utils.js` | Goi `parseFrontmatter(stateContent)` | Unit test: STATE.md mau tra ve data dung |
| `workflows/complete-milestone.md` | `report-filler.js` | Huong dan AI goi fillManagementReport() | Grep: workflow chua ten function |
| `workflows/complete-milestone.md` | `generate-pdf-report.js` | Huong dan AI chay CLI | Grep: workflow chua CLI command |

### Lenh xac nhan (Validation Commands)

**1. File ton tai va exports dung:**
```bash
# AC-01: report-filler.js export fillManagementReport
node -e "const m = require('./bin/lib/report-filler'); if (typeof m.fillManagementReport !== 'function') process.exit(1)"
```

**2. Pure function — khong require('fs'):**
```bash
# AC-10: Khong co file I/O trong report-filler.js
grep -c "require.*fs" bin/lib/report-filler.js | grep -q "^0$" && echo "PASS" || echo "FAIL: co require fs"
```

**3. Unit tests pass:**
```bash
# AC-15: Tat ca tests pass
node --test test/smoke-report-filler.test.js
```

**4. Full suite khong regression:**
```bash
# Tat ca existing tests van pass
node --test 'test/*.test.js'
```

**5. Workflow content dung:**
```bash
# AC-11: Buoc 3.6 ton tai
grep -c "Buoc 3.6" workflows/complete-milestone.md | grep -qv "^0$" && echo "PASS" || echo "FAIL"

# AC-12: 4 sub-steps ton tai
grep -c "3\.6[abcd]" workflows/complete-milestone.md | grep -q "[4-9]" && echo "PASS" || echo "FAIL"

# AC-13: Non-blocking directive
grep -ci "non-blocking" workflows/complete-milestone.md | grep -qv "^0$" && echo "PASS" || echo "FAIL"

# AC-14: Bao cao quan ly section reference
grep -c "Bao cao quan ly" workflows/complete-milestone.md | grep -qv "^0$" && echo "PASS" || echo "FAIL"
```

**6. Template replacement kiem tra:**
```bash
# AC-03, AC-07: Unit test trong test file kiem tra chi tiet
node --test test/smoke-report-filler.test.js --test-name-pattern "placeholder"
```

### Assertions cu the cho test file

| Test | Assert | Input | Expected |
|------|--------|-------|----------|
| Header placeholders | `filled.includes('v1.4')` | `version: 'v1.4'` | Output chua 'v1.4' tai vi tri header |
| Mermaid Section 3 | `section3.includes('flowchart TD')` | planContents co Truths | Section 3 co flowchart TD, Section 4 KHONG co flowchart TD |
| Mermaid Section 4 | `section4.includes('flowchart LR')` | codebaseMaps + planMeta | Section 4 co flowchart LR, Section 3 KHONG co flowchart LR |
| AI comments xoa | `!filled.includes('<!-- AI fill')` | Template goc co comments | Output khong con comments |
| Non-blocking business | `filled.includes('Bat dau')` (placeholder) | planContents = `[]`, generateBusinessLogicDiagram throw | Output van hoan chinh, co diagram mac dinh hoac placeholder |
| Non-blocking arch | `filled.includes(sectionPrefix)` | codebaseMaps = `{}` | Output van co Section 4 heading |
| Return structure | `typeof result.filledMarkdown === 'string'` | Bat ky input hop le | Luon tra ve { filledMarkdown, diagramResults } |

### Phu thuoc xac nhan (Validation Dependencies)

| Dependency | Can truoc khi xac nhan | Cach kiem tra |
|-----------|----------------------|---------------|
| `bin/lib/generate-diagrams.js` | Da ton tai tu Phase 22 | `node -e "require('./bin/lib/generate-diagrams')"` |
| `bin/lib/pdf-renderer.js` | Da ton tai tu Phase 23 | `node -e "require('./bin/lib/pdf-renderer')"` |
| `bin/lib/utils.js` | Da ton tai | `node -e "require('./bin/lib/utils')"` |
| `bin/generate-pdf-report.js` | Da ton tai tu Phase 23 | `ls bin/generate-pdf-report.js` |
| `templates/management-report.md` | Da ton tai tu Phase 21 | `ls templates/management-report.md` |
| `workflows/complete-milestone.md` | Da ton tai — can sua | `ls workflows/complete-milestone.md` |
| `node:test` | Built-in Node.js 24 | `node --test --help 2>&1 | head -1` |

### Ket qua xac nhan mong doi

Sau khi phase hoan thanh:
- `node --test test/smoke-report-filler.test.js` -> **0 failures**
- `node --test 'test/*.test.js'` -> **0 failures** (khong regression)
- `node -e "require('./bin/lib/report-filler').fillManagementReport"` -> **khong loi**
- `grep "3.6" workflows/complete-milestone.md` -> **co ket qua**

## Kien truc xac thuc (Nyquist Validation)

### Test Framework

| Thuoc tinh | Gia tri |
|-----------|---------|
| Framework | node:test + node:assert/strict (built-in Node.js 24) |
| File config | Khong co config file — dung built-in test runner |
| Lenh chay nhanh | `node --test test/smoke-report-filler.test.js` |
| Lenh chay full | `node --test 'test/*.test.js'` |

### Yeu cau Phase -> Ban do Test

| Req ID | Hanh vi | Loai test | Lenh tu dong | File ton tai? |
|--------|---------|-----------|--------------|---------------|
| INTG-01 | fillManagementReport() fill template dung voi data thuc te | unit | `node --test test/smoke-report-filler.test.js` | Chua — Wave 0 |
| INTG-01 | Mermaid diagrams duoc replace dung section (3 vs 4) | unit | `node --test test/smoke-report-filler.test.js` | Chua — Wave 0 |
| INTG-01 | Header placeholders {{...}} duoc replace | unit | `node --test test/smoke-report-filler.test.js` | Chua — Wave 0 |
| INTG-01 | `<!-- AI fill -->` comments duoc xoa | unit | `node --test test/smoke-report-filler.test.js` | Chua — Wave 0 |
| INTG-01 | Workflow markdown co Buoc 3.6 voi dung noi dung | grep | `grep "3.6" workflows/complete-milestone.md` | N/A — kiem tra truc tiep |
| INTG-02 | Diagram generation loi -> pipeline tiep tuc, placeholder goc duoc giu | unit | `node --test test/smoke-report-filler.test.js` | Chua — Wave 0 |
| INTG-02 | fillManagementReport voi empty inputs khong throw | unit | `node --test test/smoke-report-filler.test.js` | Chua — Wave 0 |
| INTG-02 | Workflow 3.6 co chi dan non-blocking moi sub-step | grep | `grep -c "non-blocking" workflows/complete-milestone.md` | N/A — kiem tra truc tiep |

### Ty le lay mau
- **Moi task commit:** `node --test test/smoke-report-filler.test.js`
- **Moi wave merge:** `node --test 'test/*.test.js'`
- **Phase gate:** Full suite green truoc `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `test/smoke-report-filler.test.js` — covers INTG-01, INTG-02
- [ ] Khong can framework install — node:test da co san

## Kha dung moi truong

| Dependency | Yeu cau boi | Kha dung | Version | Fallback |
|-----------|-------------|----------|---------|----------|
| Node.js | Tat ca modules | Co | 24.13.0 | — |
| node:test | Test runner | Co | Built-in | — |
| Puppeteer | PDF export | Khong bat buoc | — | Markdown fallback (da implement) |

Khong co dependency nao bi thieu hoac can fallback. Tat ca modules la zero-dependency (ngoai tru Puppeteer optional).

## Cau hoi mo

1. **SUMMARY.md path format cho v1.4 phases**
   - Da biet: Phases 21-23 co SUMMARY files tai `.planning/phases/XX-name/XX-YY-SUMMARY.md`
   - Chua ro: Phase 24 chua co SUMMARY (dang implement). fillManagementReport() can xu ly truong hop thieu SUMMARY.
   - Khuyen nghi: Skip phases khong co SUMMARY, khong throw error.

2. **Lam sao fill Section 1, 5, 7 (free-text) ma KHONG dung LLM?**
   - Da biet: D-07 noi ro "KHONG can LLM, pure data extraction"
   - Khuyen nghi: Section 1 lay tu STATE.md milestone info + completion stats. Section 5 concatenate features tu SUMMARY. Section 7 doc ROADMAP.md cho next milestone.
   - Do tin cay: TRUNG BINH — cac section nay co the can cau truc don gian hon template goi y.

## Nguon

### Chinh (do tin cay CAO)
- `bin/lib/generate-diagrams.js` — API signatures, pure function pattern
- `bin/lib/pdf-renderer.js` — markdownToHtml, buildHtml, canUsePuppeteer APIs
- `bin/generate-pdf-report.js` — CLI wrapper behavior, exit codes
- `bin/lib/utils.js` — parseFrontmatter, log utilities
- `templates/management-report.md` — Template placeholders va structure
- `workflows/complete-milestone.md` — Workflow steps va insertion point
- `.planning/STATE.md` — Data format va available fields
- `test/smoke-generate-diagrams.test.js` — Test pattern reference
- `test/smoke-pdf-renderer.test.js` — Test pattern reference

### Phu (do tin cay CAO)
- `.planning/phases/24-workflow-integration/24-CONTEXT.md` — User decisions
- `.planning/REQUIREMENTS.md` — INTG-01, INTG-02 definitions

## Rang buoc du an (tu CLAUDE.md)

- **Ngon ngu:** Dung tieng Viet toan bo, co dau chuan — ap dung cho comments trong code, workflow text, va test descriptions.

## Metadata

**Do tin cay chi tiet:**
- Standard stack: CAO — tat ca modules da co san, da test, da implement
- Kien truc: CAO — pattern pure function da duoc chung minh qua Phase 21-23
- Loi thuong gap: CAO — dua tren phan tich truc tiep code va template
- Validation Architecture: CAO — dua tren codebase hien co, test patterns da chung minh, lenh cu the da kiem tra

**Ngay nghien cuu:** 2026-03-24
**Hop le den:** 2026-04-24 (stable — khong co dependency ngoai thay doi)
