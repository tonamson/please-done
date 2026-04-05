# Phase 27: Dong bo Logic & Bao cao - Research

**Researched:** 2026-03-24
**Domain:** Diff heuristics, Mermaid diagram update, workflow integration
**Confidence:** HIGH

## Summary

Phase 27 tich hop 3 tinh nang cuoi cung vao workflow fix-bug: (1) phat hien thay doi business logic qua diff heuristics (LOGIC-01), (2) tu dong cap nhat Mermaid diagram trong report co san (RPT-01), (3) de xuat rule moi cho CLAUDE.md (PM-01). Toan bo pipeline la non-blocking — loi chi tao warning, khong chan workflow.

Codebase da co san tat ca module can reuse: `generateBusinessLogicDiagram()`, `replaceMermaidBlock()` (internal trong report-filler.js — CAN EXPORT), va `generate-pdf-report.js`. Module moi `logic-sync.js` chi can viet pure functions orchestrate 3 features nay. Workflow fix-bug hien 419 dong, chi con 1 dong room — module approach bat buoc (D-02).

**Primary recommendation:** Tao `bin/lib/logic-sync.js` chua 3 pure functions (detectLogicChanges, updateReportDiagram, suggestClaudeRules) + 1 orchestrator. Export `replaceMermaidBlock` tu report-filler.js. Chen 1 sub-step ngan (Buoc 10a) vao workflow, toi da 15-20 dong.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** fix-bug.md hien tai 419/420 dong — KHONG con room cho inline sub-steps dai
- **D-02:** Tao module `bin/lib/logic-sync.js` chua toan bo logic LOGIC-01 + RPT-01 + PM-01 nhu pure functions
- **D-03:** Workflow chi them 1 sub-step ngan (Buoc 10a hoac 9c) goi module — toi da 15-20 dong them vao workflow
- **D-04:** Nen phat them workflow text hien tai de giai phong dong nua — nhung NEU can thi tang limit tu 420 len 450 (reasonable cho 7 tinh nang moi)
- **D-05:** Diff-based heuristics: phan tich git diff staged files tim signals (condition, arithmetic, endpoint, database changes)
- **D-06:** Output: `{ hasLogicChange: true/false, signals: [...], summary: string }` — ghi ket qua CO/KHONG vao BUG report
- **D-07:** Pure function: nhan diff text (string), tra ket qua — KHONG chay git commands
- **D-08:** Heuristics du cho v1.5 — AST-based detection la v2 (LOGIC-02 deferred)
- **D-09:** CHI khi LOGIC-01 = CO — trigger pipeline cap nhat report
- **D-10:** Tim report moi nhat: Glob `.planning/reports/*.md` hoac `.planning/milestones/*/` — lay file moi nhat theo mtime
- **D-11:** Reuse module hien co: `generateBusinessLogicDiagram()` tu generate-diagrams.js + `replaceMermaidBlock()` tu report-filler.js
- **D-12:** KHONG tao report moi — chi cap nhat report co san. Neu khong co report nao -> skip voi warning
- **D-13:** Hoi user co muon re-render PDF khong (Y/n) — neu co, goi generate-pdf-report.js. Non-blocking
- **D-14:** Pipeline toan bo non-blocking — try/catch moi sub-step, loi chi log warning
- **D-15:** AI phan tich bug pattern tu SESSION + BUG report -> de xuat 1-2 rules ngan cho CLAUDE.md
- **D-16:** Hien thi de xuat plain text -> hoi user Y/N -> CHI append khi user xac nhan
- **D-17:** Format rule: 1-2 dong, bat dau voi "- ", ghi vao cuoi CLAUDE.md
- **D-18:** Non-blocking — user co the skip, workflow van tiep tuc
- **D-19:** Chen sub-step SAU Buoc 10 (xac nhan) — vi LOGIC-01, RPT-01, PM-01 chi co y nghia sau khi user confirm bug da fix
- **D-20:** Tat ca 3 features trong 1 sub-step (Buoc 10a) — goi orchestrator function tu logic-sync.js
- **D-21:** Theo D-10 Phase 25: chen vao buoc hien co, KHONG tao buoc so moi

### Claude's Discretion
- Chi tiet regex/patterns cho moi loai heuristic signal
- Logic tim report moi nhat (glob pattern + sort strategy)
- Noi dung cu the cua rule de xuat (phu thuoc bug context)
- Error messages va warning format

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| LOGIC-01 | AI danh gia ban sua co thay doi business logic/kien truc khong bang heuristics | detectLogicChanges() pure function nhan diff text, tra hasLogicChange + signals. Regex patterns cho 4 loai signal da xac dinh. |
| RPT-01 | Khi logic thay doi (LOGIC-01 = CO), tu dong cap nhat Mermaid diagram trong report + tuy chon PDF re-render | updateReportDiagram() reuse generateBusinessLogicDiagram() + replaceMermaidBlock() (can export). generate-pdf-report.js da co san. |
| PM-01 | AI de xuat 1-2 rule moi cho CLAUDE.md sau khi fix, hoi user truoc khi append | suggestClaudeRules() phan tich SESSION + BUG content, tra de xuat rules plain text. Workflow hoi Y/N, append vao cuoi CLAUDE.md. |
</phase_requirements>

## Project Constraints (from CLAUDE.md)

- Dung tieng Viet toan bo, co dau chuan

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| node:test | built-in (Node 24) | Test runner | Da dung xuyen suot project, khong can install |
| node:assert/strict | built-in | Assertions | Da dung xuyen suot project |

### Supporting (REUSE — KHONG install moi)
| Module | Location | Purpose | Reuse How |
|--------|----------|---------|-----------|
| generate-diagrams.js | bin/lib/ | generateBusinessLogicDiagram() | Import truc tiep, truyen planContents |
| report-filler.js | bin/lib/ | replaceMermaidBlock() | CAN EXPORT ham nay (hien internal) |
| pdf-renderer.js | bin/lib/ | canUsePuppeteer(), buildHtml(), markdownToHtml() | Cho PDF re-render check |
| generate-pdf-report.js | bin/ | CLI wrapper render PDF | Goi qua child_process hoac import |
| mermaid-validator.js | bin/lib/ | Validate Mermaid output | Gian tiep qua generate-diagrams.js |
| truths-parser.js | bin/lib/ | parseTruthsFromContent() | Gian tiep qua generate-diagrams.js |
| utils.js | bin/lib/ | parseFrontmatter() | Gian tiep |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Regex heuristics | AST-based detection | AST chinh xac hon nhung phuc tap, maintenance burden 5+ stacks — deferred LOGIC-02 |
| Mermaid CDN render | Local mermaid-js | Khong can voi heuristic approach, validate-only du |

**Installation:** Khong can install gi moi — tat ca da co san trong project.

## Architecture Patterns

### Recommended Project Structure
```
bin/lib/
  logic-sync.js         # Module moi — 3 pure functions + orchestrator
  generate-diagrams.js  # Reuse (khong sua)
  report-filler.js      # Export them replaceMermaidBlock
  pdf-renderer.js       # Reuse (khong sua)
test/
  smoke-logic-sync.test.js  # Test moi cho logic-sync module
workflows/
  fix-bug.md            # Them Buoc 10a (15-20 dong)
```

### Pattern 1: Pure Function Module (theo debug-cleanup.js)
**What:** Module chua pure functions, nhan input strings, tra ket qua objects. KHONG doc file, KHONG chay git commands.
**When to use:** Moi module moi trong project nay
**Example:**
```javascript
// Source: bin/lib/debug-cleanup.js (pattern hien co)
'use strict';

/**
 * Detect logic changes tu git diff text.
 * @param {string} diffText - Noi dung git diff
 * @returns {{ hasLogicChange: boolean, signals: Array<{type: string, file: string, detail: string}>, summary: string }}
 */
function detectLogicChanges(diffText) {
  if (!diffText || typeof diffText !== 'string') {
    throw new Error('detectLogicChanges: thieu tham so diffText');
  }
  // ... heuristic logic
  return { hasLogicChange, signals, summary };
}

module.exports = { detectLogicChanges, updateReportDiagram, suggestClaudeRules, runLogicSync };
```

### Pattern 2: Non-blocking Pipeline (theo complete-milestone.md Buoc 3.6)
**What:** Moi sub-step trong try/catch, loi chi log warning va tiep tuc.
**When to use:** Pipeline RPT-01 va PM-01
**Example:**
```javascript
// Source: workflows/complete-milestone.md Buoc 3.6 pattern
// Trong workflow fix-bug.md Buoc 10a:

// Sub-step 1: Logic detection (LOGIC-01)
// try: git diff -> detectLogicChanges(diffText) -> ghi BUG report
// catch: warning "Khong phan tich duoc logic changes"

// Sub-step 2: Report update (RPT-01) — CHI KHI hasLogicChange = true
// try: tim report -> cap nhat diagram -> hoi PDF re-render
// catch: warning "Khong cap nhat duoc report diagram"

// Sub-step 3: Rule suggestion (PM-01)
// try: doc SESSION + BUG -> suggestClaudeRules() -> hien de xuat -> hoi Y/N -> append
// catch: warning "Khong de xuat duoc rules"
```

### Pattern 3: Orchestrator Function
**What:** 1 ham goi 3 sub-features theo thu tu, moi feature trong try/catch rieng.
**When to use:** Buoc 10a goi 1 ham duy nhat thay vi inline logic
**Example:**
```javascript
// Source: D-20 trong CONTEXT.md
/**
 * Orchestrate toan bo logic sync pipeline.
 * @param {object} params - { diffText, bugReportContent, sessionContent, planContents, reportContent }
 * @returns {{ logicResult, reportResult, rulesResult, warnings: string[] }}
 */
function runLogicSync(params) {
  const warnings = [];
  let logicResult = null;
  let reportResult = null;
  let rulesResult = null;

  // 1. LOGIC-01
  try { logicResult = detectLogicChanges(params.diffText); }
  catch (e) { warnings.push(`Logic detection: ${e.message}`); }

  // 2. RPT-01 (chi khi hasLogicChange)
  if (logicResult?.hasLogicChange) {
    try { reportResult = updateReportDiagram(params); }
    catch (e) { warnings.push(`Report update: ${e.message}`); }
  }

  // 3. PM-01
  try { rulesResult = suggestClaudeRules(params); }
  catch (e) { warnings.push(`Rule suggestion: ${e.message}`); }

  return { logicResult, reportResult, rulesResult, warnings };
}
```

### Anti-Patterns to Avoid
- **Inline logic trong workflow:** Workflow da 419 dong, KHONG inline — phai delegate sang module
- **Doc file trong pure function:** Tat ca module trong project theo pure function pattern — nhan content qua tham so
- **Blocking pipeline:** Pipeline PHAI non-blocking, loi chi tao warning (D-14)
- **Tao report moi:** CHI cap nhat report co san, KHONG tao moi (D-12)

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Business logic diagram generation | Custom Mermaid builder | generateBusinessLogicDiagram() tu generate-diagrams.js | Da co san, da test, validate + retry |
| Mermaid block replacement | Custom regex parser | replaceMermaidBlock() tu report-filler.js | Da co san, xu ly edge cases (khong co section, khong co block) |
| PDF rendering | Custom HTML->PDF | generate-pdf-report.js + pdf-renderer.js | Da co san, Puppeteer detection + fallback |
| Mermaid validation | Custom checker | mermaidValidator() tu mermaid-validator.js | Da co san, check syntax + style |
| Truths parsing | Custom table parser | parseTruthsFromContent() tu truths-parser.js | Shared helper da co |

**Key insight:** 5/6 thanh phan cua RPT-01 pipeline da duoc build o v1.4 (Phase 22-24). Phase 27 chi can orchestrate chung lai.

## Common Pitfalls

### Pitfall 1: replaceMermaidBlock chua duoc export
**What goes wrong:** `replaceMermaidBlock` la internal function trong report-filler.js, KHONG co trong module.exports
**Why it happens:** Function nay chi duoc dung internal boi fillManagementReport()
**How to avoid:** Them vao module.exports truoc khi import tu logic-sync.js: `module.exports = { fillManagementReport, replaceMermaidBlock };`
**Warning signs:** Import error "replaceMermaidBlock is not a function"

### Pitfall 2: Diff format khac nhau giua git versions
**What goes wrong:** Regex heuristics khong match vi diff format khac nhau
**Why it happens:** `git diff` va `git diff --cached` co format khac nhau (staged vs unstaged). Unified diff format co `+`/`-` prefix.
**How to avoid:** Heuristics chi scan dong bat dau voi `+` (dong moi them) de phat hien thay doi, bo qua dong `-` (dong cu bi xoa). Doc unified diff spec.
**Warning signs:** False positives khi scan dong context (khong co `+`/`-`)

### Pitfall 3: Thu muc .planning/reports/ chua ton tai
**What goes wrong:** Glob `.planning/reports/*.md` tra rong vi thu muc chua duoc tao
**Why it happens:** Thu muc chi duoc tao khi complete-milestone chay lan dau
**How to avoid:** Khi khong tim thay report nao -> skip voi warning (D-12). KHONG tao report moi.
**Warning signs:** "No report files found" trong testing

### Pitfall 4: Workflow dong limit
**What goes wrong:** Them sub-step qua dai lam workflow vuot 420 (hoac 450) dong
**Why it happens:** Sub-step inline qua nhieu chi tiet
**How to avoid:** Sub-step chi goi orchestrator function, logic nam trong module. Toi da 15-20 dong them (D-03). Dem dong sau khi edit.
**Warning signs:** `wc -l workflows/fix-bug.md` > 450

### Pitfall 5: PM-01 append duplicate rules
**What goes wrong:** Moi lan fix bug deu append rule giong nhau vao CLAUDE.md
**Why it happens:** Khong kiem tra rule da ton tai
**How to avoid:** suggestClaudeRules() nen nhan claudeContent hien tai de kiem tra trung lap truoc khi de xuat
**Warning signs:** CLAUDE.md co nhieu dong giong nhau

## Code Examples

### Heuristic Signal Detection (LOGIC-01)
```javascript
// Regex patterns cho 4 loai signal (D-05)
// Chi scan dong bat dau voi '+' (dong moi them trong diff)

const SIGNALS = {
  condition: {
    // if/else/switch/ternary thay doi
    pattern: /^\+.*\b(if|else|switch|case|default|\?)\b/,
    label: 'Condition change',
  },
  arithmetic: {
    // operators, formula, threshold values
    pattern: /^\+.*(\b\d+\b.*[+\-*/%<>=!]+|\b(Math\.|parseInt|parseFloat|Number|\.toFixed|\.ceil|\.floor)\b)/,
    label: 'Arithmetic/threshold change',
  },
  endpoint: {
    // route/URL/API definition thay doi
    pattern: /^\+.*\b(router\.|app\.(get|post|put|delete|patch)|@(Get|Post|Put|Delete|Patch|Controller)|fetch\(|axios\.|\.route\(|endpoint|api\/)/i,
    label: 'Endpoint/API change',
  },
  database: {
    // query/schema/migration thay doi
    pattern: /^\+.*\b(SELECT|INSERT|UPDATE|DELETE|CREATE|ALTER|DROP|\.query\(|\.execute\(|\.findOne|\.findMany|\.create\(|\.update\(|\.delete\(|schema\.|migration|\.model\()/i,
    label: 'Database/query change',
  },
};

// Parse diff text theo tung file
function detectLogicChanges(diffText) {
  const signals = [];
  const lines = diffText.split('\n');
  let currentFile = '';

  for (const line of lines) {
    // Track current file
    const fileMatch = line.match(/^\+\+\+ b\/(.+)/);
    if (fileMatch) {
      currentFile = fileMatch[1];
      continue;
    }

    // Chi scan dong moi them (bat dau voi +, khong phai +++)
    if (!line.startsWith('+') || line.startsWith('+++')) continue;

    for (const [type, { pattern, label }] of Object.entries(SIGNALS)) {
      if (pattern.test(line)) {
        signals.push({ type, file: currentFile, detail: label });
        break; // 1 signal per line du
      }
    }
  }

  const hasLogicChange = signals.length > 0;
  const summary = hasLogicChange
    ? `${signals.length} logic signal(s): ${[...new Set(signals.map(s => s.type))].join(', ')}`
    : 'Khong phat hien thay doi logic';

  return { hasLogicChange, signals, summary };
}
```

### Report Diagram Update (RPT-01)
```javascript
// Source: D-10, D-11, D-12 tu CONTEXT.md
// Reuse generateBusinessLogicDiagram + replaceMermaidBlock

const { generateBusinessLogicDiagram } = require('./generate-diagrams');
const { replaceMermaidBlock } = require('./report-filler'); // CAN EXPORT TRUOC

/**
 * Cap nhat Mermaid diagram trong report co san.
 * @param {object} params
 * @param {string} params.reportContent - Noi dung report hien tai
 * @param {Array} params.planContents - Plan contents cho diagram generation
 * @returns {{ updatedContent: string, diagramResult: object }}
 */
function updateReportDiagram(params) {
  if (!params.reportContent) {
    throw new Error('Khong co report content de cap nhat');
  }

  const diagramResult = generateBusinessLogicDiagram(params.planContents || []);

  if (!diagramResult.diagram || !diagramResult.valid) {
    return { updatedContent: params.reportContent, diagramResult };
  }

  const updatedContent = replaceMermaidBlock(
    params.reportContent,
    '## 3.',  // Section 3: Business Logic Flow
    diagramResult.diagram
  );

  return { updatedContent, diagramResult };
}
```

### Rule Suggestion (PM-01)
```javascript
// Source: D-15, D-16, D-17 tu CONTEXT.md

/**
 * De xuat rules moi cho CLAUDE.md dua tren bug pattern.
 * @param {object} params
 * @param {string} params.sessionContent - Noi dung SESSION file
 * @param {string} params.bugReportContent - Noi dung BUG report
 * @param {string} params.claudeContent - Noi dung CLAUDE.md hien tai (de check trung lap)
 * @returns {{ suggestions: string[], reasoning: string }}
 */
function suggestClaudeRules(params) {
  if (!params.sessionContent && !params.bugReportContent) {
    return { suggestions: [], reasoning: 'Khong co du lieu de phan tich' };
  }

  // Phan tich bug pattern — tra ve de xuat
  // Day la noi dung AI se generate dua tren context cu the
  // Module chi cung cap framework, AI dien noi dung

  const suggestions = []; // AI fill 1-2 rules
  const reasoning = '';   // AI giai thich tai sao

  return { suggestions, reasoning };
}
```

### Workflow Wiring (Buoc 10a)
```markdown
## Buoc 10a: Dong bo Logic & Bao cao (non-blocking)

> Toan bo buoc nay la non-blocking — loi chi tao warning.

**1. Logic detection:**
Lay `git diff HEAD~1` → goi `detectLogicChanges(diffText)` tu `bin/lib/logic-sync.js`
- Ghi ket qua vao BUG report section "Logic Changes": CO/KHONG + signals

**2. Report update (CHI KHI hasLogicChange = CO):**
Glob `.planning/reports/*.md` → lay file moi nhat → goi `updateReportDiagram()`
- Khong co report → warning: "Khong tim thay report de cap nhat"
- Thanh cong → hoi: "Cap nhat lai PDF? (Y/n)" → Y: `node bin/generate-pdf-report.js [path]`

**3. Rule suggestion:**
Doc SESSION + BUG report → goi `suggestClaudeRules()`
- Co de xuat → hien: "[De xuat rule] ..." → hoi "Them vao CLAUDE.md? (Y/n)"
- User Y → append vao cuoi CLAUDE.md → commit
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| fillManagementReport() tao report tu scratch | replaceMermaidBlock() cap nhat block cu the | v1.4 (Phase 22) | Co the cap nhat chi 1 section thay vi re-generate toan bo |
| Inline logic trong workflow | Pure function modules | v1.5 (Phase 25) | Giu workflow gon, logic testable rieng |
| Blocking sub-steps | Non-blocking pipeline | v1.5 (Phase 26) | Loi khong chan workflow |

**Deprecated/outdated:**
- Inline truths parser trong generate-diagrams.js: da refactor sang truths-parser.js (Phase 25)

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | node:test (built-in Node 24) |
| Config file | none — dung truc tiep qua npm script |
| Quick run command | `node --test test/smoke-logic-sync.test.js` |
| Full suite command | `npm test` |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| LOGIC-01 | detectLogicChanges tra hasLogicChange=true khi diff co condition/arithmetic/endpoint/database signals | unit | `node --test test/smoke-logic-sync.test.js` | Wave 0 |
| LOGIC-01 | detectLogicChanges tra hasLogicChange=false khi diff chi co whitespace/comment changes | unit | `node --test test/smoke-logic-sync.test.js` | Wave 0 |
| LOGIC-01 | detectLogicChanges throw Error khi diffText null/undefined | unit | `node --test test/smoke-logic-sync.test.js` | Wave 0 |
| RPT-01 | updateReportDiagram cap nhat Mermaid block trong report content | unit | `node --test test/smoke-logic-sync.test.js` | Wave 0 |
| RPT-01 | updateReportDiagram skip khi khong co reportContent | unit | `node --test test/smoke-logic-sync.test.js` | Wave 0 |
| PM-01 | suggestClaudeRules tra suggestions array (co the rong) | unit | `node --test test/smoke-logic-sync.test.js` | Wave 0 |
| PM-01 | suggestClaudeRules kiem tra trung lap voi claudeContent hien tai | unit | `node --test test/smoke-logic-sync.test.js` | Wave 0 |
| ALL | runLogicSync orchestrator non-blocking — throw tu sub-function chi tao warning | unit | `node --test test/smoke-logic-sync.test.js` | Wave 0 |
| ALL | Toan bo existing tests van pass | integration | `npm test` | Co san |

### Sampling Rate
- **Per task commit:** `node --test test/smoke-logic-sync.test.js`
- **Per wave merge:** `npm test`
- **Phase gate:** Full suite green truoc `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `test/smoke-logic-sync.test.js` — covers LOGIC-01, RPT-01, PM-01, orchestrator
- [ ] Khong can them test infrastructure — node:test da co san

*(Existing test infrastructure covers framework needs. Chi can 1 test file moi.)*

## Open Questions

1. **suggestClaudeRules() la pure function hay AI-driven?**
   - What we know: D-15 noi "AI phan tich bug pattern" — nen function nay chi extract/format data, AI (trong workflow) se generate noi dung rule cu the
   - What's unclear: Function nay return gi chinh xac? Extracted patterns de AI dung? Hay pre-generated rules?
   - Recommendation: Function extract bug patterns (root cause type, category, affected area) tu SESSION + BUG content. Workflow text huong dan AI generate rule tu patterns. Function KHONG generate rule text — vi moi bug context khac nhau.

2. **Buoc 10a goi `git diff HEAD~1` hay `git diff --cached`?**
   - What we know: D-07 noi "nhan diff text (string)" — pure function. Diff text duoc lay O DAU la viec cua workflow.
   - What's unclear: Tai Buoc 10a (sau commit), staged diff da mat. Can diff cua commit vua tao.
   - Recommendation: Dung `git diff HEAD~1` hoac `git show HEAD` de lay diff cua commit vua tao tai Buoc 9b.

## Sources

### Primary (HIGH confidence)
- `bin/lib/generate-diagrams.js` — API generateBusinessLogicDiagram(planContents, options), return { diagram, valid, errors, warnings, truthCount, planCount }
- `bin/lib/report-filler.js` — replaceMermaidBlock(content, sectionPrefix, newDiagram) internal function, fillManagementReport(params)
- `bin/lib/debug-cleanup.js` — Pattern pure function module (Phase 26)
- `bin/lib/regression-analyzer.js` — Pattern dual-mode analysis (Phase 25)
- `workflows/fix-bug.md` — 419 dong hien tai, Buoc 10 la diem chen
- `workflows/complete-milestone.md` Buoc 3.6 — Non-blocking pipeline mau
- `bin/lib/pdf-renderer.js` — canUsePuppeteer(), markdownToHtml(), buildHtml()
- `bin/generate-pdf-report.js` — CLI wrapper cho PDF rendering
- `templates/management-report.md` — Template report voi Mermaid placeholders

### Secondary (MEDIUM confidence)
- `.planning/phases/25-dieu-tra-tai-hien-loi/25-CONTEXT.md` — Sub-step wiring patterns, workflow size constraint
- `.planning/phases/26-don-dep-an-toan/26-CONTEXT.md` — Non-blocking pattern, module pattern

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Tat ca module da co san, da verified qua source code
- Architecture: HIGH - Pattern da thiet lap tu Phase 25-26, chi follow
- Pitfalls: HIGH - Xac dinh tu doc source code truc tiep (vd: replaceMermaidBlock chua export)

**Research date:** 2026-03-24
**Valid until:** 2026-04-24 (stable — internal project patterns)
