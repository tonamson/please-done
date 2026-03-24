# Stack Research

**Domain:** Nang cap skill fix-bug — tu dong hoa dieu tra, phan tich hoi quy, doc dep log, dong bo logic, cap nhat PDF
**Researched:** 2026-03-24
**Confidence:** HIGH
**Scope:** CHI nhung thu CAN THEM cho v1.5. Stack hien tai (Node.js 18+, CommonJS, zero runtime deps, 7 JS library modules, 526 tests, node:test runner) da validated va KHONG re-research.

## Quyet dinh tong quat

**KHONG them bat ky dependency nao.** Tat ca 7 feature moi cua v1.5 co the xay dung hoan toan bang:

1. **Buoc moi trong workflow markdown** (fix-bug.md) — chi them huong dan cho AI agent
2. **Pure function JS modules moi** (bin/lib/) — dung Node.js built-in APIs
3. **Tai su dung module hien co** — report-filler.js, generate-diagrams.js, pdf-renderer.js, plan-checker.js

Ly do KHONG them dependency:
- Du an hien tai co ZERO runtime dependencies (chi `js-tiktoken` devDep) — day la thiet ke co chu dich
- Tat ca 7 JS library modules deu la pure functions (zero file I/O, content passed as args)
- Cac feature v1.5 xu ly TEXT (markdown, regex, string diff) — Node.js built-in du suc
- Them dependency = tang attack surface, phuc tap install, pham triet ly "pure scripts, no bundler"

## Recommended Stack

### Module JS Moi Can Tao

| Module | File | Purpose | Why Pure Function |
|--------|------|---------|-------------------|
| Reproduction Test Generator | `bin/lib/repro-test-generator.js` | Tao test template tu trieu chung + stack info | Nhan symptom data + stack type, tra ve test code string. Khong can library — chi string template interpolation. |
| Regression Analyzer | `bin/lib/regression-analyzer.js` | Phan tich call chain tu FastCode de tim module phu thuoc | Nhan call chain text, tra ve dependency tree + impacted modules list. Regex parsing du cho structured text cua FastCode. |
| Log Cleanup | `bin/lib/log-cleanup.js` | Tim va xoa log tam thoi truoc commit | Nhan file content + rules, tra ve cleaned content + report nhung dong da xoa. Regex-based, zero I/O. |
| Logic Change Detector | `bin/lib/logic-change-detector.js` | So sanh Truths bang truoc/sau de phat hien thay doi | Nhan old PLAN content + new PLAN content, tra ve diff list. Tai su dung parseTruthsFromContent tu generate-diagrams.js hoac extract thanh shared helper. |
| Post-mortem Suggester | `bin/lib/postmortem-suggester.js` | De xuat cap nhat CLAUDE.md tu bug pattern | Nhan SESSION/BUG report content, tra ve suggested CLAUDE.md additions. String analysis + template generation. |

### Module Hien Co Can Mo Rong

| Module | File | Thay Doi | Ly Do |
|--------|------|---------|-------|
| Report Filler | `bin/lib/report-filler.js` | Them API de cap nhat section bug-related trong report | Hien tai chi fill template 1 lan khi complete-milestone. Can them incremental update khi fix-bug thay doi logic. |
| Plan Checker (Truths parser) | `bin/lib/plan-checker.js` | Export parseTruthsV11 de share voi logic-change-detector | Hien tai la internal function. Can extract hoac re-export de tranh duplicate parsing logic. |
| Generate Diagrams | `bin/lib/generate-diagrams.js` | Khong thay doi | Da export parseTruthsFromContent — co the dung truc tiep. Nhung CAN CHU Y: comment noi "Inline regex from plan-checker.js — do NOT require plan-checker to avoid circular deps." Can quyet dinh noi dat shared parser. |

### Core Technologies (Da Co — KHONG them moi)

| Technology | Version | Purpose | Status v1.5 |
|------------|---------|---------|-------------|
| Node.js built-in `node:test` | Node 18+ | Test runner cho tat ca module moi | Tiep tuc su dung. Moi module moi can 1 test file tuong ung. |
| Node.js built-in `node:assert/strict` | Node 18+ | Assertions | Tiep tuc su dung. |
| Node.js built-in `fs`, `path`, `crypto` | Node 18+ | File I/O (chi o CLI wrappers), path manipulation, hashing | Chi dung trong CLI wrappers (bin/*.js), KHONG trong lib modules. |
| Puppeteer (optional runtime) | ^24.x | PDF generation khi logic thay doi | Da co. generate-pdf-report.js se duoc goi tu workflow khi can. |
| FastCode MCP | - | Call chain analysis cho regression | Da co. Workflow fix-bug da co quyen goi `mcp__fastcode__code_qa`. |
| Context7 MCP | - | Library docs lookup | Da co. Workflow fix-bug da co quyen goi Context7. |

## Chi Tiet Ky Thuat Tung Feature

### 1. Reproduction Test Generator

**Dau vao:** Trieu chung (5 thong tin tu Buoc 1b), stack type (NestJS/Flutter/NextJS/WordPress/Solidity/Generic), file loi
**Dau ra:** Test code string (`.spec.ts` cho NestJS, `_test.dart` cho Flutter, v.v.)

**Ky thuat:** Template literals voi conditional sections theo stack.

```javascript
// Pattern — KHONG can AST parser hay code generation library
function generateReproTest({ symptoms, stack, bugFile, bugFunction }) {
  const templates = {
    nestjs: (ctx) => `
import { Test } from '@nestjs/testing';
import { ${ctx.className} } from '${ctx.importPath}';

describe('${ctx.className} - Reproduction: ${ctx.bugTitle}', () => {
  it('should reproduce: ${ctx.symptom}', async () => {
    // Arrange — setup theo trieu chung
    // Act — thuc hien buoc tai hien
    // Assert — kiem tra ket qua mong doi
    throw new Error('TODO: Dien logic tai hien');
  });
});`,
    flutter: (ctx) => `
import 'package:flutter_test/flutter_test.dart';
import '${ctx.importPath}';

void main() {
  test('Reproduction: ${ctx.bugTitle}', () {
    // Arrange
    // Act
    // Assert — fail neu bug con ton tai
    fail('TODO: Dien logic tai hien');
  });
}`,
    generic: (ctx) => `
const { describe, it } = require('node:test');
const assert = require('node:assert/strict');

describe('Reproduction: ${ctx.bugTitle}', () => {
  it('should reproduce bug', () => {
    // TODO: Dien logic tai hien tu trieu chung
    assert.fail('Bug chua duoc tai hien');
  });
});`,
  };
  return (templates[stack] || templates.generic)(buildContext(symptoms, bugFile, bugFunction));
}
```

**Tai sao KHONG can code generation library (ts-morph, @babel/generator):**
- Output la test TEMPLATE (skeleton) — AI agent se dien logic cu the
- Khong can parse AST cua file loi — chi can ten class/function tu trieu chung
- Template literal du cho cac stack dang ho tro (6 stacks)
- Complexity thap: ~100-150 LOC

### 2. Regression Analyzer (via FastCode Call Chain)

**Dau vao:** Call chain text tu `mcp__fastcode__code_qa`, file da sua
**Dau ra:** Danh sach module bi anh huong + muc do rui ro

**Ky thuat:** Parse structured text response tu FastCode, xay dung dependency graph.

```javascript
// Pattern — regex parsing cho FastCode output format
function analyzeRegression({ callChainText, fixedFiles }) {
  // Parse caller/callee relationships
  const dependencies = parseCallChain(callChainText);
  // Tim tat ca callers cua fixedFiles (upstream impact)
  const impacted = findUpstreamCallers(dependencies, fixedFiles);
  // Phan loai rui ro
  return impacted.map(dep => ({
    file: dep.file,
    function: dep.function,
    risk: dep.distance === 1 ? 'HIGH' : dep.distance === 2 ? 'MEDIUM' : 'LOW',
    reason: `Goi ${dep.callPath.join(' -> ')}`,
  }));
}
```

**Tai sao KHONG can graph library (graphlib, dagre):**
- FastCode tra ve call chains dang text — chi can regex parse
- Graph chi co 1-3 levels deep (caller -> callee -> callee) — KHONG can thuoc bai graph traversal
- Simple array-based BFS du cho bai nay
- Complexity thap: ~80-120 LOC

### 3. Auto Log Cleanup

**Dau vao:** File content (string), cleanup rules
**Dau ra:** Cleaned content + report (dong nao da xoa)

**Ky thuat:** Regex matching + line-by-line filtering.

```javascript
// Pattern — regex-based, pure function
const DEFAULT_PATTERNS = [
  /^\s*console\.log\(.+DEBUG.+\)/,        // console.log DEBUG
  /^\s*console\.log\(.+TODO.+\)/,          // console.log TODO
  /^\s*console\.log\(.+TEMP.+\)/,          // console.log TEMP
  /^\s*\/\/\s*DEBUG:/,                       // // DEBUG: comments
  /^\s*\/\/\s*TODO:\s*remove/i,             // // TODO: remove
  /^\s*print\(.+debug.+\)/,                 // Flutter print debug
];

function cleanupLogs(content, options = {}) {
  const patterns = options.patterns || DEFAULT_PATTERNS;
  const lines = content.split('\n');
  const removed = [];
  const cleaned = lines.filter((line, i) => {
    const match = patterns.some(p => p.test(line));
    if (match) removed.push({ line: i + 1, content: line.trim() });
    return !match;
  });
  return { content: cleaned.join('\n'), removed, count: removed.length };
}
```

**Tai sao KHONG can AST-based cleanup (jscodeshift, ts-morph):**
- Muc dich la xoa LOG TAM THOI (debug/temp markers) — KHONG phai tat ca console.log
- Markers ro rang (DEBUG, TEMP, TODO:remove) — regex du chinh xac
- False positive it vi chi match nhung patterns co marker cu the
- AST parser se qua nang (parse toan bo file) cho viec don gian nay
- Multi-stack support (JS, TS, Dart, PHP) — regex lam duoc, AST khong lam duoc (can parser rieng moi ngon ngu)
- Complexity thap: ~60-80 LOC

### 4. Logic Change Detector

**Dau vao:** Old PLAN.md content, new PLAN.md content (sau khi fix bug)
**Dau ra:** Diff list (Truth nao thay doi, cot nao, gia tri cu/moi)

**Ky thuat:** Tai su dung Truths parser + string comparison.

```javascript
// Pattern — tai su dung parseTruthsFromContent
function detectLogicChanges(oldPlanContent, newPlanContent) {
  const oldTruths = parseTruthsExtended(oldPlanContent); // {id, description, edgeCases, verification}
  const newTruths = parseTruthsExtended(newPlanContent);

  const changes = [];
  for (const newT of newTruths) {
    const oldT = oldTruths.find(t => t.id === newT.id);
    if (!oldT) continue; // Truth moi — khong phai change
    if (oldT.description !== newT.description) {
      changes.push({ truthId: newT.id, column: 'Su that', old: oldT.description, new: newT.description });
    }
    // So sanh cac cot khac...
  }
  return { changes, hasLogicChange: changes.length > 0 };
}
```

**Van de shared parser:** Hien tai `parseTruthsFromContent` ton tai o 2 noi:
- `bin/lib/generate-diagrams.js` — inline (chi lay id + description)
- `bin/lib/plan-checker.js` — `parseTruthsV11` (noi bo, khong export)

**Quyet dinh:** Tao shared helper `parseTruthsExtended()` trong file moi hoac extract tu plan-checker. Khong import tu generate-diagrams (vi no thieu cac cot edge cases, verification).

### 5. PDF Report Auto-Update khi Logic Thay Doi

**Ky thuat:** Goi lai `fillManagementReport()` + `generate-pdf-report.js` da co.

**KHONG can module moi.** Chi can them buoc trong workflow:
1. Buoc 6.5d cap nhat PLAN.md (da co)
2. Goi `fillManagementReport()` voi PLAN moi
3. Goi `node bin/generate-pdf-report.js` de re-export PDF

**Can mo rong `report-filler.js`:** Them function `updateReportSection()` nhan existing filled markdown + new data, thay vi fill tu template moi. Dieu nay tranh ghi de toan bo report khi chi 1 phan thay doi.

### 6. Lien Ket Bao Mat (pd:scan Security Warnings)

**Dau vao:** File path bi loi, noi dung security-checklist.md
**Dau ra:** Danh sach checks lien quan

**Ky thuat:** Keyword matching giua file extension/content va security checks.

```javascript
// Pattern — cross-reference file context voi checklist sections
function linkSecurityChecks(bugFile, bugContent, securityChecklist) {
  const ext = path.extname(bugFile);
  const relevantSections = [];

  // Map file type -> relevant sections
  if (['.js', '.ts'].includes(ext)) relevantSections.push('Secrets', 'Injection');
  if (ext === '.sol') relevantSections.push('Solidity');
  if (ext === '.dart') relevantSections.push('Flutter');
  // ...

  // Keyword scan trong bug content
  if (/eval\(|Function\(/.test(bugContent)) relevantSections.push('Injection');
  if (/password|token|secret/i.test(bugContent)) relevantSections.push('Secrets');

  return relevantSections;
}
```

**Complexity:** Thap (~40-60 LOC). Khong can NLP hay semantic analysis — keyword matching la du vi security-checklist.md da co structure ro rang voi section headers.

### 7. Post-mortem CLAUDE.md Suggester

**Dau vao:** SESSION file content, BUG report content, CLAUDE.md hien tai
**Dau ra:** Suggested additions cho CLAUDE.md

**Ky thuat:** Pattern extraction tu bug data + de-duplication voi existing CLAUDE.md entries.

**KHONG can AI/LLM call** (du an cam "LLM-as-judge" — Out of Scope). Chi dung rule-based suggestions:
- Bug do logic sai -> suggest "Kiem tra [logic X] truoc khi..."
- Bug o file cu the -> suggest "File [X] can chu y khi sua..."
- Bug lap lai (3+ lan sua) -> suggest "Pattern loi: [X]"

Complexity: ~80-100 LOC.

## Alternatives Considered

| Recommended | Alternative | Tai Sao Khong |
|-------------|-------------|---------------|
| Template literals cho test generation | ts-morph / @babel/generator | Qua nang cho test skeleton. Chi can interpolate variable vao template, khong can parse/generate AST. Them ~5MB dependency cho ~50 LOC tiet kiem. |
| Regex cho log cleanup | jscodeshift / eslint custom rule | Multi-stack (JS, TS, Dart, PHP, Solidity). AST parser chi ho tro 1 ngon ngu. Regex lam duoc tat ca voi patterns co marker ro rang. |
| Array-based BFS cho call chain | graphlib / d3-hierarchy | Call chain chi 1-3 levels. Graph library qua phuc tap. Array + loop du cho bai nay. |
| String diff cho Truths comparison | diff / jsdiff library | Chi can so sanh cell-by-cell trong bang markdown. Khong can character-level diff. Strict equality (`!==`) du chinh xac. |
| Rule-based post-mortem | LLM call | Out of Scope: "LLM-as-judge — plan already in context, calling another LLM is circular". Rule-based extraction tu structured data (SESSION, BUG report) la du. |
| Keyword matching cho security links | NLP/semantic search | security-checklist.md da co structure ro rang. Keyword matching (file ext + content patterns) du chinh xac. False positive thap. |

## What NOT to Use

| Avoid | Tai Sao | Dung Thay The |
|-------|---------|---------------|
| ts-morph, @babel/generator | Test generation chi can template string, khong can AST manipulation. Them 5-10MB dep cho zero benefit. | Template literals |
| jscodeshift | AST-based code transforms — overkill cho "xoa dong co marker DEBUG". Khong multi-stack. | Regex line filter |
| graphlib, dagre | Graph traversal library — call chain chi 1-3 levels, BFS array-based du. | Simple array BFS |
| diff, jsdiff | Character-level diff — Truths comparison chi can cell equality check. | String `!==` comparison |
| Any LLM API call | Du an cam LLM-as-judge. Post-mortem suggestions phai rule-based. | Rule-based pattern extraction |
| eslint-plugin-no-debug | Chi ho tro JS/TS, khong multi-stack. Yeu cau eslint config. | Regex patterns with markers |
| cheerio / jsdom | HTML parsing — khong can thiet. Tat ca data la markdown/text. | Regex/string parsing |

## Installation

```bash
# v1.5 KHONG can install them bat ky package nao
# Tat ca module moi dung Node.js built-in APIs

# Verify hien tai:
node --version  # >= 18 (da nang tu v1.4)
npm test        # 526 tests pass
```

## Stack Patterns theo Feature

**Neu feature xu ly TEXT (markdown, structured text):**
- Dung regex parsing + string manipulation
- Vi: du an xu ly prompts/templates/plans — tat ca la text
- Pattern: `bin/lib/[feature].js` — pure function, zero I/O

**Neu feature can goi MCP tool (FastCode, Context7):**
- KHONG goi tu JS module. Goi tu WORKFLOW markdown (AI agent goi MCP)
- JS module chi xu ly KET QUA tra ve tu MCP
- Vi: MCP tools la AI agent capabilities, khong phai Node.js APIs

**Neu feature can cap nhat file (.planning/):**
- CLI wrapper (`bin/[feature].js`) lam I/O
- Library (`bin/lib/[feature].js`) nhan content, tra content
- Vi: tach I/O khoi logic — testable, composable

**Neu feature lien quan PDF:**
- Tai su dung report-filler.js + generate-pdf-report.js
- KHONG viet PDF logic moi
- Vi: infrastructure da co, chi can goi lai

## Version Compatibility

| Component | Compatible Voi | Ghi Chu |
|-----------|----------------|---------|
| Module JS moi (v1.5) | Node.js >= 18 | Chi dung built-in APIs: regex, string, array |
| node:test runner | Node.js >= 18 | Da dung tu v1.1 (140+ tests) |
| report-filler.js (existing) | Tat ca module v1.5 | Pure function, nhan content tra content |
| generate-pdf-report.js (existing) | Puppeteer optional | Fallback .md khi khong co Puppeteer |
| FastCode MCP | fix-bug workflow | Da co trong allowed-tools cua skill |
| plan-checker.js parseTruthsV11 | logic-change-detector.js | Can export hoac extract shared helper |

## Rui Ro Ky Thuat

| Rui Ro | Muc Do | Giam Thieu |
|--------|--------|------------|
| parseTruthsFromContent duplicate | THAP | Extract shared helper vao `bin/lib/truths-parser.js`. Hoac de logic-change-detector.js tự inline (nhu generate-diagrams.js da lam). Trade-off: DRY vs circular dep risk. |
| Regex false positive trong log cleanup | THAP | Chi match patterns co marker ro rang (DEBUG, TEMP, TODO:remove). User co the them custom patterns. Preview truoc khi xoa (dry-run mode). |
| FastCode output format thay doi | TRUNG BINH | regression-analyzer.js parse co fallback. Neu format khong nhan dien duoc -> tra ve empty list + warning, khong crash. |
| Test template khong khop project convention | THAP | Template chi la skeleton (TODO markers). AI agent se customize sau. Template khong can chay duoc — chi can structure dung. |
| PDF re-generation cham (Puppeteer launch) | THAP | Chi trigger khi logic THAY DOI (khong phai moi bug). Non-blocking (try/catch, warning only). |

## Tong Ket

| Metric | Gia Tri |
|--------|---------|
| Dependency moi | 0 |
| Module JS moi | 5 (repro-test-generator, regression-analyzer, log-cleanup, logic-change-detector, postmortem-suggester) |
| Module JS mo rong | 2 (report-filler, plan-checker export) |
| Shared helper moi | 1 (truths-parser hoac inline) |
| Tong LOC uoc tinh | ~400-600 cho 5 modules + tests |
| Test files moi | 5 (1 per module) |
| Workflow changes | 1 (fix-bug.md them 3-4 buoc moi) |

## Sources

- Codebase analysis: `bin/lib/*.js` (7 existing modules), `workflows/fix-bug.md`, `commands/pd/fix-bug.md` — HIGH confidence
- `package.json` — zero runtime deps confirmed — HIGH confidence
- `test/*.test.js` — node:test runner confirmed (13 test files, 526 tests) — HIGH confidence
- `references/security-checklist.md` — structured sections for keyword matching — HIGH confidence
- `bin/lib/generate-diagrams.js:34` — parseTruthsFromContent inline regex — HIGH confidence
- `bin/lib/report-filler.js` — fillManagementReport() pure function API — HIGH confidence
- `bin/generate-pdf-report.js` — Puppeteer optional, fallback .md — HIGH confidence
- Node.js 18+ built-in APIs (fs, path, crypto, node:test, node:assert) — HIGH confidence

---
*Stack research for: v1.5 Nang cap Skill Fix-Bug trong please-done*
*Researched: 2026-03-24*
