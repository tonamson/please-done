# Phase 25: Dieu tra & Tai hien Loi - Research

**Researched:** 2026-03-24
**Domain:** Tao 2 pure function modules moi (repro-test-generator, regression-analyzer) + shared truths-parser + tich hop workflow fix-bug
**Confidence:** HIGH

## Summary

Phase 25 tao 2 module JS moi (`repro-test-generator.js`, `regression-analyzer.js`) va 1 shared helper (`truths-parser.js`) theo dung pure function pattern da thiet lap tu v1.1. Dong thoi refactor `generate-diagrams.js` de import truths-parser thay vi inline regex. Cuoi cung, them 2 sub-steps vao `workflows/fix-bug.md` (5b.1 repro, 8a regression) voi blocking mode.

Du an hien tai co 526 tests pass, 8 library modules trong `bin/lib/`, zero runtime dependencies. Fix-bug workflow co 360 dong. Tat ca module moi PHAI tuan thu pure function pattern: nhan content string, tra string/object, KHONG doc file, KHONG goi MCP.

**Primary recommendation:** Tao tung module mot theo thu tu: truths-parser (shared helper) truoc, refactor generate-diagrams, roi repro-test-generator va regression-analyzer. Test moi module ngay khi tao. Cuoi cung moi sua workflow va regenerate snapshots.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** Output la file test rieng trong `.planning/debug/repro/` — KHONG phai markdown trong BUG report
- **D-02:** Chi 1 template Generic (khong tao templates rieng cho NestJS/Flutter) — don gian, du dung
- **D-03:** File test la skeleton voi TODO markers de AI dien logic — KHONG chay tu dong
- **D-04:** Call chain depth toi da 1-2 levels (caller truc tiep + caller cua caller)
- **D-05:** Maximum 5 files trong bao cao regression — tap trung vao impact lon nhat, giam noise
- **D-06:** Su dung FastCode call chain lam primary, regression-analyzer.js (BFS) lam fallback khi FastCode khong kha dung
- **D-07:** Tao shared helper `bin/lib/truths-parser.js` rieng — DRY, thay vi inline o moi consumer
- **D-08:** Refactor generate-diagrams.js de import tu truths-parser.js thay vi inline regex hien tai
- **D-09:** plan-checker.js giu internal parser rieng (de tranh circular deps voi check functions)
- **D-10:** Them sub-steps (5b.1 repro, 8a regression) trong buoc hien co — KHONG tao buoc moi so
- **D-11:** Blocking mode — neu repro test generation hoac regression analysis that bai, workflow DUNG
- **D-12:** Giu fix-bug.md duoi 420 dong sau khi them sub-steps

### Claude's Discretion
- Function signatures va return types cua 2 module moi
- Regex patterns cu the cho template generation
- Test file naming convention trong `.planning/debug/repro/`
- Error messages va error types khi blocking

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| REPRO-01 | AI tu dong tao skeleton test case tai hien loi theo stack (NestJS/Flutter/Generic) trong `.planning/debug/repro/` | Module `repro-test-generator.js` — pure function nhan symptoms + stack info, tra ve test code string. CHI dung 1 Generic template (D-02). Output vao `.planning/debug/repro/` (D-01). Skeleton co TODO markers (D-03). |
| REGR-01 | AI phan tich module phu thuoc qua FastCode call chain (fallback BFS) va bao cao toi da 5-10 files bi anh huong | Module `regression-analyzer.js` — pure function nhan dependency data (tu FastCode hoac source files), tra ve danh sach files bi anh huong. Depth 1-2 levels (D-04). Max 5 files (D-05). FastCode primary, BFS fallback (D-06). |
</phase_requirements>

## Project Constraints (from CLAUDE.md)

- Dung tieng viet toan bo, co dau chuan
- Tat ca giao tiep bang tieng Viet

## Standard Stack

### Core (Da co — KHONG them dependency moi)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Node.js built-in `node:test` | Node 24.13.0 (>= 18 required) | Test runner cho tat ca module | Da dung tu v1.1, 526 tests |
| Node.js built-in `node:assert/strict` | Node 24.13.0 | Assertions | Da dung tu v1.1 |
| Node.js built-in regex | - | Parse import/require, truths table, template generation | Du an chi dung regex cho text processing, zero AST deps |

### Supporting (Da co — tai su dung)

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `bin/lib/utils.js` (parseFrontmatter) | internal | Parse YAML frontmatter tu markdown | Khi can doc frontmatter tu PLAN.md content |
| `bin/lib/generate-diagrams.js` (parseTruthsFromContent) | internal | Parse Truths table — SE DUOC REFACTOR sang truths-parser.js | Dong 34-45 se duoc move sang shared helper |
| `bin/lib/mermaid-validator.js` | internal | Pattern mau cho pure function module don gian | Tham khao pattern coding style |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Regex cho import/require parsing | ts-morph / @babel/parser | 5-10MB dep cho ~20 LOC regex. Regex du chinh xac cho CommonJS require() va ES import patterns. |
| Array-based BFS cho call chain | graphlib | Call chain chi 1-2 levels deep — array + loop du, khong can graph library. |
| Template literals cho test gen | ts-morph code generation | Test output la skeleton voi TODO — chi can string interpolation, khong can AST generation. |

**Installation:**
```bash
# KHONG can install them bat ky package nao
# Tat ca module moi dung Node.js built-in APIs
node --version  # >= 18 (hien tai: v24.13.0)
npm test        # 526 tests pass
```

## Architecture Patterns

### Recommended Project Structure (Files moi/sua)

```
bin/lib/
├── truths-parser.js          # MOI — shared helper, extract tu generate-diagrams.js
├── repro-test-generator.js   # MOI — tao skeleton test tu trieu chung
├── regression-analyzer.js    # MOI — phan tich call chain, tim phu thuoc
├── generate-diagrams.js      # SUA — import parseTruthsFromContent tu truths-parser.js
├── plan-checker.js           # GIU NGUYEN — giu internal parser rieng (D-09)
├── report-filler.js          # GIU NGUYEN
├── mermaid-validator.js      # GIU NGUYEN
└── utils.js                  # GIU NGUYEN

test/
├── smoke-truths-parser.test.js          # MOI
├── smoke-repro-test-generator.test.js   # MOI
├── smoke-regression-analyzer.test.js    # MOI
├── smoke-generate-diagrams.test.js      # DA CO — se van pass sau refactor
└── ...                                   # 13 test files hien tai

workflows/
└── fix-bug.md                # SUA — them sub-steps 5b.1 va 8a

test/snapshots/
├── codex/fix-bug.md          # CAN REGENERATE sau khi sua workflow
├── copilot/fix-bug.md        # CAN REGENERATE
├── gemini/fix-bug.md         # CAN REGENERATE
└── opencode/fix-bug.md       # CAN REGENERATE
```

### Pattern 1: Pure Function Module

**What:** Moi module trong `bin/lib/` la pure function — nhan content string args, tra ve ket qua, KHONG doc file, KHONG goi MCP.

**When to use:** TAT CA module moi trong phase nay.

**Example (tu mermaid-validator.js — module don gian nhat):**

```javascript
/**
 * Module Name — Mo ta ngan.
 *
 * Pure function: nhan [input], tra ve [output].
 * KHONG doc file — tat ca content truyen qua tham so.
 */

'use strict';

/**
 * @param {string} input - Noi dung dau vao
 * @returns {object} - Ket qua xu ly
 */
function myFunction(input) {
  // Logic xu ly...
  return { result: '...', valid: true };
}

module.exports = { myFunction };
```

**Source:** `bin/lib/mermaid-validator.js` dong 1-7 — established pattern tu v1.1

### Pattern 2: Test Pattern (smoke-*.test.js)

**What:** Test file dung node:test + node:assert/strict, in-memory fixtures, khong mock filesystem.

**When to use:** Moi module moi PHAI co 1 test file tuong ung.

**Example (tu smoke-mermaid-validator.test.js):**

```javascript
'use strict';

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');

const { myFunction } = require('../bin/lib/my-module');

// Helper: tao fixture in-memory
function makeInput(overrides = {}) {
  return { ...defaults, ...overrides };
}

describe('myFunction — happy path', () => {
  it('valid input returns expected output', () => {
    const result = myFunction(makeInput());
    assert.equal(result.valid, true);
    assert.equal(typeof result.output, 'string');
  });
});

describe('myFunction — edge cases', () => {
  it('empty input returns safe default', () => {
    const result = myFunction('');
    assert.equal(result.valid, false);
  });
});
```

**Source:** `test/smoke-mermaid-validator.test.js` — pattern test don gian nhat trong du an

### Pattern 3: Shared Helper Extract + Refactor

**What:** Extract function tu module A sang shared helper, roi import lai trong module A.

**When to use:** truths-parser.js — extract `parseTruthsFromContent()` tu `generate-diagrams.js`.

**Example:**

```javascript
// bin/lib/truths-parser.js (MOI)
'use strict';

/**
 * Parse Truths table tu plan body content.
 * Shared helper — duoc import boi generate-diagrams.js va cac module khac.
 * KHONG doc file.
 *
 * @param {string} content - Plan body content (sau frontmatter)
 * @returns {Array<{id: string, description: string}>}
 */
function parseTruthsFromContent(content) {
  const truths = [];
  const tableRegex = /\|\s*(T\d+)\s*\|\s*([^|\n]+)\s*\|(?:\s*[^|\n]+\s*\|)+/g;
  let match;
  while ((match = tableRegex.exec(content)) !== null) {
    truths.push({ id: match[1].trim(), description: match[2].trim() });
  }
  return truths;
}

module.exports = { parseTruthsFromContent };

// bin/lib/generate-diagrams.js (SUA)
// TRUOC: function parseTruthsFromContent(content) { ... } (dong 34-45)
// SAU:
const { parseTruthsFromContent } = require('./truths-parser');
```

**Source:** `bin/lib/generate-diagrams.js` dong 34-45 — code hien tai se duoc move

### Anti-Patterns to Avoid

- **KHONG doc file trong module:** `require('fs')` cam xuat hien trong `bin/lib/*.js` moi. Workflow truyen content vao module.
- **KHONG goi MCP tu module:** `mcp__fastcode__code_qa` chi goi tu workflow markdown. Module nhan KET QUA tu MCP.
- **KHONG tao buoc workflow moi voi so moi:** D-10 quy dinh them sub-steps (5b.1, 8a) trong buoc hien co, KHONG them Buoc 11 hay Buoc 12.
- **KHONG tao multiple stack templates:** D-02 quy dinh chi 1 Generic template. KHONG tao NestJS-specific hay Flutter-specific templates.
- **KHONG de module that bai im lang:** D-11 quy dinh blocking mode — neu module that bai, workflow DUNG va thong bao.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Parse Truths table tu PLAN.md | Inline regex moi noi | `bin/lib/truths-parser.js` (shared helper D-07) | DRY — hien tai da duplicate o generate-diagrams.js va plan-checker.js |
| Parse frontmatter tu markdown | Custom YAML parser | `parseFrontmatter()` tu `bin/lib/utils.js` | Da co san, da test qua 526 tests |
| Full dependency graph analysis | Graph library voi traversal algorithms | Array-based BFS 1-2 levels | Call chain chi can 1-2 levels (D-04), array du cho bai nay |
| AST-based import parsing | ts-morph, @babel/parser | Regex pattern cho require()/import | Zero dependency du an. Regex du chinh xac cho CommonJS + ES module patterns |

**Key insight:** Phase nay TAT CA deu la text processing (markdown parsing, string template, regex matching). Node.js built-in string/regex APIs du cho moi bai toan. KHONG can bat ky dependency moi nao.

## Common Pitfalls

### Pitfall 1: Pha Vo Pure Function Pattern

**What goes wrong:** Module moi goi `require('fs')` hoac MCP truc tiep thay vi nhan content tu workflow.
**Why it happens:** "Tien qua" — de function tu lay du lieu thay vi yeu cau caller truyen vao.
**How to avoid:** Tat ca module trong `bin/lib/` PHAI co `// KHONG doc file` trong JSDoc header. Test litmus: neu test can mock filesystem → module vi pham pattern.
**Warning signs:** `require('fs')` hoac `require('child_process')` trong file `bin/lib/*.js` moi. Module nhan `filePath` thay vi `fileContent`.

### Pitfall 2: Regression Analysis Bao Qua Nhieu Files (Noise)

**What goes wrong:** FastCode tra ve dependency tree rong (50+ files). AI mat thoi gian phan tich files khong lien quan.
**Why it happens:** FastCode tra ve tat ca references, khong phan biet direct usage vs module-level import.
**How to avoid:** D-04 gioi han depth 1-2 levels. D-05 cap maximum 5 files. Filter theo affected function, khong phai affected file. Tach test files khoi production files.
**Warning signs:** Regression report liet ke >5 files. Report bao gom test files. Module tu goi MCP tool.

### Pitfall 3: Repro Test Generation Tao Test Khong Co Gia Tri

**What goes wrong:** Test qua generic (chi `assert.fail('TODO')` khong co context). Hoac test compile khong duoc vi thieu import.
**Why it happens:** AI thieu runtime context. Template qua chung chung.
**How to avoid:** D-02 chi dung 1 Generic template — don gian, tranh loi framework-specific. D-03 skeleton co TODO markers ro rang — AI agent se dien logic cu the. Template PHAI co: imports section, describe/it structure, TODO comment voi instructions cu the.
**Warning signs:** Template khong co TODO markers. Template co import tu module khong ton tai. Output khong chay duoc vi syntax error.

### Pitfall 4: Truths Parser Refactor Lam Hu Test Hien Tai

**What goes wrong:** Extract `parseTruthsFromContent()` tu generate-diagrams.js sang truths-parser.js nhung generate-diagrams.js van goi function cu (da xoa) → test fail.
**Why it happens:** Refactor khong cap nhat tat ca import paths.
**How to avoid:** Refactor PHAI gom 3 buoc atomic: (1) tao truths-parser.js voi function copy, (2) sua generate-diagrams.js import tu truths-parser, (3) xoa function cu trong generate-diagrams.js. Chay `npm test` sau moi buoc.
**Warning signs:** `smoke-generate-diagrams.test.js` fail sau refactor. `parseTruthsFromContent is not a function` error.

### Pitfall 5: Workflow Edit Lam Pha Vo Snapshots

**What goes wrong:** Sua `workflows/fix-bug.md` → converter pipelines inline workflow → 4 platform snapshots out-of-sync → `smoke-snapshot.test.js` fail.
**Why it happens:** Converter pipeline inline workflow content. Moi tu them/xoa trong workflow propagate den tat ca platform outputs.
**How to avoid:** Chay `node test/generate-snapshots.js` SAU khi sua workflow. Chay `npm test` de verify 526 tests van pass. Diff snapshots (`git diff test/snapshots/`) de xac nhan CHI fix-bug snapshots thay doi.
**Warning signs:** `smoke-snapshot.test.js` fail. Snapshots khac (khong phai fix-bug) cung thay doi.

### Pitfall 6: Fix-Bug Workflow Vuot 420 Dong

**What goes wrong:** Them sub-steps lam workflow dai hon 420 dong (hien tai 360 dong). Agent (Sonnet) de mat context trong prompt dai.
**Why it happens:** Moi sub-step them 10-30 dong. 2 sub-steps + blocking logic co the them 60-80 dong.
**How to avoid:** D-12 gioi han 420 dong. Viet sub-steps ngan gon — chi dung va du. Su dung conditional skip ("CHI KHI...") de giam token consumption.
**Warning signs:** `wc -l workflows/fix-bug.md` > 420. Sub-step descriptions qua dai.

## Code Examples

### repro-test-generator.js — API Design (Claude's Discretion)

```javascript
/**
 * Repro Test Generator — Tao skeleton test tai hien loi.
 *
 * Pure function: nhan params, tra ve test code string.
 * KHONG doc file — tat ca content truyen qua tham so.
 */
'use strict';

/**
 * @param {object} params
 * @param {object} params.symptoms - { expected, actual, errorMessage, timeline, reproduce }
 * @param {string} params.bugTitle - Ten tat cua bug (vi du: 'login-timeout')
 * @param {string} params.filePath - Duong dan file bi loi
 * @param {string} [params.functionName] - Ten function bi loi (optional)
 * @returns {{ testCode: string, testFileName: string }}
 */
function generateReproTest(params) {
  // Validate required params
  if (!params || !params.symptoms || !params.bugTitle) {
    throw new Error('generateReproTest: thieu params.symptoms hoac params.bugTitle');
  }

  const { symptoms, bugTitle, filePath, functionName } = params;
  const safeBugTitle = bugTitle.replace(/[^a-z0-9-]/gi, '-').toLowerCase();
  const testFileName = `repro-${safeBugTitle}.test.js`;

  // Generic template (D-02: chi 1 template)
  const testCode = `/**
 * Reproduction Test: ${bugTitle}
 * File loi: ${filePath || 'chua xac dinh'}
 * Function: ${functionName || 'chua xac dinh'}
 *
 * Skeleton test — AI dien logic tai hien vao cac TODO.
 * KHONG chay tu dong — can review va dien logic truoc.
 */
'use strict';

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');

describe('Tai hien: ${bugTitle}', () => {
  it('phai tai hien duoc loi', () => {
    // --- Trieu chung ---
    // Mong doi: ${symptoms.expected || 'TODO: mo ta ket qua mong doi'}
    // Thuc te: ${symptoms.actual || 'TODO: mo ta ket qua thuc te'}
    // Loi: ${symptoms.errorMessage || 'TODO: thong bao loi'}

    // --- Arrange ---
    // TODO: Khoi tao du lieu test, import module bi loi

    // --- Act ---
    // TODO: Thuc hien buoc tai hien loi
    // Buoc tai hien: ${symptoms.reproduce || 'TODO: mo ta buoc tai hien'}

    // --- Assert ---
    // TODO: Assert ket qua — test PHAI FAIL khi bug chua sua
    assert.fail('TODO: Dien logic tai hien loi');
  });
});
`;

  return { testCode, testFileName };
}

module.exports = { generateReproTest };
```

**Source:** Thiet ke dua tren established patterns tu `bin/lib/mermaid-validator.js` va D-01/D-02/D-03 decisions.

### regression-analyzer.js — API Design (Claude's Discretion)

```javascript
/**
 * Regression Analyzer — Phan tich module phu thuoc qua call chain.
 *
 * Pure function: nhan dependency data, tra ve danh sach files bi anh huong.
 * KHONG doc file, KHONG goi MCP.
 *
 * Co 2 mode:
 * 1. FastCode mode: nhan callChainText tu MCP ket qua, parse va filter
 * 2. BFS fallback: nhan sourceFiles array, parse import/require, tim phu thuoc
 */
'use strict';

const MAX_AFFECTED = 5;  // D-05: maximum 5 files
const MAX_DEPTH = 2;     // D-04: 1-2 levels

/**
 * Mode 1: Parse FastCode call chain response.
 * @param {object} params
 * @param {string} params.callChainText - Text response tu FastCode
 * @param {string} params.targetFile - File bi loi
 * @param {string} [params.targetFunction] - Function bi loi
 * @returns {{ affectedFiles: Array<{path: string, reason: string, depth: number}>, totalFound: number }}
 */
function analyzeFromCallChain(params) {
  if (!params || !params.callChainText || !params.targetFile) {
    throw new Error('analyzeFromCallChain: thieu params.callChainText hoac params.targetFile');
  }
  // Parse call chain text, filter by depth, cap max, sort by relevance
  // ...
  return { affectedFiles: [], totalFound: 0 };
}

/**
 * Mode 2: BFS fallback — parse import/require tu source files.
 * @param {object} params
 * @param {Array<{path: string, content: string}>} params.sourceFiles - Source files content
 * @param {string} params.targetFile - File bi loi
 * @param {string} [params.targetFunction] - Function bi loi
 * @returns {{ affectedFiles: Array<{path: string, reason: string, depth: number}>, totalFound: number }}
 */
function analyzeFromSourceFiles(params) {
  if (!params || !params.sourceFiles || !params.targetFile) {
    throw new Error('analyzeFromSourceFiles: thieu params.sourceFiles hoac params.targetFile');
  }
  // Parse imports, BFS 1-2 levels, cap max, sort by depth
  // ...
  return { affectedFiles: [], totalFound: 0 };
}

module.exports = { analyzeFromCallChain, analyzeFromSourceFiles };
```

**Source:** Thiet ke dua tren D-04/D-05/D-06 decisions va ARCHITECTURE.md section N2.

### Workflow Sub-step Pattern (5b.1 va 8a)

```markdown
### 5b.1: Tao Reproduction Test (SAU gia thuyet, TRUOC fix)

1. `mkdir -p .planning/debug/repro`
2. Goi `generateReproTest()` tu `bin/lib/repro-test-generator.js`:
   - Input: symptoms (tu Buoc 1b), bugTitle (tu SESSION), filePath (tu Buoc 4)
   - Loi → DUNG. Bao: "Khong tao duoc reproduction test: [loi]"
3. Ghi file `.planning/debug/repro/[testFileName]`
4. Ghi SESSION: "Reproduction test: .planning/debug/repro/[testFileName]"
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| parseTruthsFromContent inline o generate-diagrams.js (dong 34-45) | Shared helper truths-parser.js | Phase 25 (D-07) | DRY — 1 source of truth cho Truths parsing |
| 3 templates rieng (NestJS/Flutter/Generic) theo research goc | Chi 1 Generic template | Phase 25 (D-02) | Don gian hoa, giam maintenance, du dung |
| Non-blocking mode cho repro/regression (research goc) | Blocking mode (D-11) | Phase 25 | User biet ngay khi co van de |

**Deprecated/outdated:**
- Research v1.5 ban dau de xuat 3 stack-specific templates → User quyet dinh chi 1 Generic (D-02)
- Research v1.5 de xuat non-blocking cho repro/regression → User quyet dinh blocking (D-11)
- Research v1.5 de xuat output repro test trong SESSION file → User quyet dinh file rieng trong `.planning/debug/repro/` (D-01)

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | node:test (Node.js built-in, v24.13.0) |
| Config file | none — chay truc tiep qua `npm test` |
| Quick run command | `node --test test/smoke-truths-parser.test.js test/smoke-repro-test-generator.test.js test/smoke-regression-analyzer.test.js` |
| Full suite command | `npm test` (526 tests, ~600ms) |

### Phase Requirements -> Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| REPRO-01 | generateReproTest() nhan symptoms + bugTitle, tra ve testCode + testFileName | unit | `node --test test/smoke-repro-test-generator.test.js -x` | Wave 0 |
| REPRO-01 | testCode co TODO markers, node:test structure, describe/it blocks | unit | `node --test test/smoke-repro-test-generator.test.js -x` | Wave 0 |
| REPRO-01 | testFileName follow pattern `repro-{bugTitle}.test.js` | unit | `node --test test/smoke-repro-test-generator.test.js -x` | Wave 0 |
| REPRO-01 | Loi khi thieu required params (symptoms, bugTitle) | unit | `node --test test/smoke-repro-test-generator.test.js -x` | Wave 0 |
| REGR-01 | analyzeFromCallChain() parse FastCode text, filter by depth, cap max 5 | unit | `node --test test/smoke-regression-analyzer.test.js -x` | Wave 0 |
| REGR-01 | analyzeFromSourceFiles() parse import/require, BFS 1-2 levels, cap max 5 | unit | `node --test test/smoke-regression-analyzer.test.js -x` | Wave 0 |
| REGR-01 | Loi khi thieu required params | unit | `node --test test/smoke-regression-analyzer.test.js -x` | Wave 0 |
| N/A | parseTruthsFromContent() extract tu generate-diagrams hoat dong dung | unit | `node --test test/smoke-truths-parser.test.js -x` | Wave 0 |
| N/A | generate-diagrams.js van pass sau refactor import | regression | `node --test test/smoke-generate-diagrams.test.js -x` | Co san |
| N/A | 526 tests van pass va snapshots da regenerate | regression | `npm test` | Co san |

### Sampling Rate

- **Per task commit:** `node --test test/smoke-truths-parser.test.js test/smoke-repro-test-generator.test.js test/smoke-regression-analyzer.test.js`
- **Per wave merge:** `npm test` (full 526+ tests)
- **Phase gate:** Full suite green truoc `/gsd:verify-work`

### Wave 0 Gaps

- [ ] `test/smoke-truths-parser.test.js` — test cho shared helper parseTruthsFromContent
- [ ] `test/smoke-repro-test-generator.test.js` — test cho generateReproTest()
- [ ] `test/smoke-regression-analyzer.test.js` — test cho analyzeFromCallChain() + analyzeFromSourceFiles()
- [ ] Framework install: khong can — da co node:test built-in

## Open Questions

1. **FastCode output format chua document chinh thuc**
   - What we know: FastCode tra ve text response voi call chain info. Format co the thay doi.
   - What's unclear: Exact format cua response (JSON? plain text? structured markdown?). Can prototype voi real output.
   - Recommendation: `analyzeFromCallChain()` nhan plain text va dung regex flexible. Neu parse that bai → tra ve empty list + warning (non-crash). Can prototype truoc khi finalize regex patterns.

2. **`.planning/debug/repro/` chua ton tai**
   - What we know: `.planning/debug/` ton tai (duoc tao boi workflow fix-bug Buoc 1). `repro/` subfolder chua co.
   - What's unclear: Ai tao folder — module hay workflow?
   - Recommendation: Workflow tao folder (`mkdir -p .planning/debug/repro`) truoc khi goi module. Module chi tra ve string, KHONG tao file.

3. **Truths parser — parseTruthsFromContent chi parse 2 cot (id, description)**
   - What we know: generate-diagrams.js parseTruthsFromContent (dong 34-45) chi parse 2 cot (id va description). plan-checker.js parseTruthsV11 parse nhieu hon.
   - What's unclear: Shared helper can parse bao nhieu cot? Phase 25 chi can id + description. Phase 27 (logic-change-detector) co the can nhieu cot hon.
   - Recommendation: Phase 25 tao truths-parser voi 2 cot (id + description) — du cho generate-diagrams va phase 25. Phase 27 co the mo rong them cot khi can.

## Sources

### Primary (HIGH confidence)

- `bin/lib/generate-diagrams.js` dong 34-45 — parseTruthsFromContent inline regex hien tai
- `bin/lib/mermaid-validator.js` — pattern mau cho pure function module don gian
- `bin/lib/report-filler.js` — pattern pure function voi content string args
- `test/smoke-generate-diagrams.test.js` — pattern test cho pure function module
- `test/smoke-mermaid-validator.test.js` — pattern test don gian nhat
- `workflows/fix-bug.md` — 360 dong, integration points tai Buoc 5b va Buoc 8
- `package.json` — zero runtime deps confirmed, test command `node --test 'test/*.test.js'`
- `.planning/phases/25-dieu-tra-tai-hien-loi/25-CONTEXT.md` — 12 locked decisions

### Secondary (MEDIUM confidence)

- `.planning/research/STACK.md` — zero new deps, module design patterns
- `.planning/research/ARCHITECTURE.md` — integration points, data flow, API design
- `.planning/research/PITFALLS.md` — 10 critical pitfalls

### Tertiary (LOW confidence)

- FastCode output format — chua co official docs, can prototype validation

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — du an da co stack ro rang, KHONG them dependency, da verify qua 526 tests
- Architecture: HIGH — patterns da thiet lap tu v1.1 (pure function, node:test, smoke-*.test.js), chi ap dung cho module moi
- Pitfalls: HIGH — phan tich codebase truc tiep + research pitfalls da document
- Workflow integration: MEDIUM — FastCode output format chua verify, blocking mode chua prototype

**Research date:** 2026-03-24
**Valid until:** 2026-04-24 (stable domain — pure function modules, no external deps)

---
*Phase: 25-dieu-tra-tai-hien-loi*
*Research completed: 2026-03-24*
