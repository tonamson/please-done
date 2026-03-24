# Phase 21: Mermaid Foundation - Research

**Researched:** 2026-03-24
**Domain:** Mermaid diagram syntax, validation, report template infrastructure
**Confidence:** HIGH

## Summary

Phase 21 xay dung 3 deliverables nen tang: (1) file quy tac tham my mermaid-rules.md, (2) pure function mermaid-validator.js kiem tra syntax va style compliance, (3) template management-report.md voi 7 sections business-focused. Day la infrastructure phase -- khong tao diagram thuc te (Phase 22).

Du an da co pattern validator tuong tu: `plan-checker.js` (1007 dong, 8 checks, pure functions, nhan content tra ket qua). Mermaid validator se theo dung pattern nay: 'use strict', require() imports, module.exports, zero dependencies, content-in result-out. Test dung `node:test` + `node:assert/strict` theo pattern `smoke-*.test.js`.

Mermaid syntax co nhieu gotcha: reserved keywords (end, graph, subgraph, click, call, default), dau ngoac dac biet, node IDs bat dau bang 'o' hoac 'x'. Decision D-10 yeu cau LUON dung double quotes cho labels -- day la quy tac an toan nhat, dong thoi de validate bang regex.

**Primary recommendation:** Validator dung regex-based approach (khong can full parser) vi scope chi check flowchart/graph syntax + style compliance theo rules cu the. Pattern matching du cho use case nay va giu zero dependencies.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** Color palette: Corporate Blue -- primary #2563EB (blue), secondary #64748B (slate), accent #10B981 (green), warning #F59E0B (amber), error #DC2626 (red)
- **D-02:** Node shapes theo Shape-by-Role: Service=rectangle, Database=cylinder, API=rounded, Decision=diamond, Start/End=stadium, External=subroutine
- **D-03:** Labels ngan gon 3-5 tu, edge labels 1-3 tu. Khong viet tat kho hieu.
- **D-04:** Max 15 nodes per diagram. Vuot qua thi tach thanh subgraphs hoac diagrams rieng.
- **D-05:** Validator check ca Syntax (unclosed quotes, reserved keywords, missing arrows) LAN Style compliance (palette, shape mapping, max nodes). Syntax errors = invalid (errors), style violations = warnings.
- **D-06:** Error format co line number: `{ line, message, type }` de AI tu sua duoc. Return `{ valid, errors, warnings }`.
- **D-07:** 7 sections business-focused: (1) Executive Summary, (2) Milestone Overview, (3) Business Logic Flow (Mermaid), (4) Architecture Overview (Mermaid), (5) Key Achievements, (6) Quality Metrics, (7) Next Steps
- **D-08:** Ngon ngu report: tieng Viet toan bo -- nhat quan voi phong cach du an
- **D-09:** Labels tren Mermaid diagrams dung tieng Viet. VD: node="Xu ly don hang", edge="thanh cong"
- **D-10:** Quoting rule: LUON dung double quotes cho tat ca labels -- an toan cho dau tieng Viet, nhat quan, de validate. VD: `A["Xu ly don hang"] --> B["Thanh cong"]`

### Claude's Discretion
- Direction rules cho flowcharts (TD vs LR) -- Claude chon phu hop theo loai diagram
- Anti-patterns list cu the trong mermaid-rules.md
- Validator internal implementation (regex vs parser approach)
- Test case selection (cac truong hop cu the de test)

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| MERM-01 | AI tuan thu quy tac tham my Mermaid (mau sac, mui ten, nhan, layout) khi ve so do | Mermaid node shape syntax, color styling via classDef, direction keywords da duoc research day du. Shape-by-Role mapping D-02 co Mermaid syntax tuong ung cho moi role. |
| MERM-02 | Mermaid syntax duoc validate truoc khi dua vao bao cao (pure function, zero deps) | Plan-checker.js pattern da duoc phan tich (pure function, { valid, errors } return). Reserved keywords, quoting rules, arrow syntax da duoc research tu official docs. Regex approach du cho scope nay. |
| REPT-01 | Template MANAGEMENT_REPORT.md chuyen nghiep tap trung ket qua kinh doanh, tich hop so do Mermaid | 7 sections da duoc lock (D-07), ngon ngu Viet (D-08). Template pattern tu references/ va templates/ da co trong du an. |
</phase_requirements>

## Standard Stack

### Core

Khong can thu vien ngoai. Phase nay la pure Node.js code + Markdown files.

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| node:test | built-in (Node 18+) | Test runner | Da dung cho moi test file trong du an |
| node:assert/strict | built-in | Assertions | Thong nhat voi codebase hien tai |

### Supporting

Khong co. Zero dependencies theo yeu cau MERM-02.

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Regex-based validator | merval (npm) | merval la full parser cho 13 diagram types -- overkill cho scope nay, them dependency, 0 style checking |
| Regex-based validator | Goi mermaid CLI de parse | Can Puppeteer/Chromium, heavy dependency, khong check style |
| Self-built template | Template engine (Handlebars) | Du an khong dung template engines -- template la Markdown voi placeholders |

**Installation:**
```bash
# Khong can install gi -- zero production dependencies
# Test dung built-in node:test
```

## Architecture Patterns

### Recommended Project Structure
```
bin/lib/
  mermaid-validator.js    # Pure function validator (D-05, D-06)
references/
  mermaid-rules.md        # Rules spec (MERM-01) -- tuong tu plan-checker.md
templates/
  management-report.md    # 7-section template (REPT-01, D-07)
test/
  smoke-mermaid-validator.test.js  # Tests (theo naming convention)
```

### Pattern 1: Pure Function Validator (theo plan-checker.js)

**What:** Module export function nhan Mermaid text string, tra ve structured result, khong doc file.
**When to use:** Moi khi can validate Mermaid syntax truoc khi nhung vao report.
**Example:**
```javascript
// Source: Pattern tu bin/lib/plan-checker.js
'use strict';

// ─── Mermaid Validator ────────────────────────────────────

/**
 * Validate Mermaid diagram text cho syntax va style compliance.
 * @param {string} mermaidText - Noi dung Mermaid diagram
 * @param {object} [options] - Tuy chon: { rules } override rules mac dinh
 * @returns {{ valid: boolean, errors: Array<{line, message, type}>, warnings: Array<{line, message, type}> }}
 */
function mermaidValidator(mermaidText, options = {}) {
  const errors = [];   // Syntax errors -> valid = false
  const warnings = []; // Style violations -> valid van co the true

  // ... validation logic ...

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

module.exports = { mermaidValidator };
```

### Pattern 2: Rules Spec Document (theo references/plan-checker.md)

**What:** Markdown file la "nguon su that duy nhat" cho validator rules. Validator implement, test validate.
**When to use:** Moi rules spec deu theo pattern nay -- mermaid-rules.md lam tuong tu.
**Example:**
```markdown
# Mermaid Rules
> Nguon su that duy nhat cho mermaid-validator.js
> Doc boi: mermaid-validator.js (implement), test (validate), AI skills (generate diagrams)

## 1. Color Palette
...

## 2. Node Shapes
...
```

### Pattern 3: Test Pattern (theo smoke-plan-checker.test.js)

**What:** Test file dung node:test + node:assert/strict, helper functions tao test fixtures.
**When to use:** Moi module test file.
**Example:**
```javascript
'use strict';
const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { mermaidValidator } = require('../bin/lib/mermaid-validator');

// Helper de tao valid Mermaid diagram
function makeFlowchart(overrides = {}) {
  const direction = overrides.direction || 'TD';
  const nodes = overrides.nodes || ['A["Bat dau"] --> B["Ket thuc"]'];
  return `flowchart ${direction}\n  ${nodes.join('\n  ')}`;
}

describe('mermaidValidator', () => {
  it('valid flowchart passes', () => {
    const result = mermaidValidator(makeFlowchart());
    assert.equal(result.valid, true);
    assert.equal(result.errors.length, 0);
  });
});
```

### Anti-Patterns to Avoid
- **Doc file trong validator:** Validator la pure function -- nhan text, khong doc file. Caller lo viec doc file.
- **Dung mermaid npm package de validate:** Them dependency nang (Puppeteer/Chromium), khong check style.
- **Hard-code rules trong validator:** Rules nen configurable hoac doc tu references -- nhung cho Phase 21, hard-code la acceptable vi rules chua thay doi.
- **Mix syntax errors va style warnings:** D-05 phan biet ro: syntax = errors (block), style = warnings (inform).

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Full Mermaid parser | Complete AST parser cho moi diagram type | Regex pattern matching cho flowchart | Mermaid co 13+ diagram types, chi can flowchart + co the sequence. Regex du. |
| Color validation | Custom hex parser | Regex `/^#[0-9A-Fa-f]{6}$/` | Hex color validation la trivial regex |
| Template engine | Custom Mustache-like replacer | Static Markdown voi comment placeholders | Template chi can scaffold, Phase 22 se fill noi dung |

**Key insight:** Phase nay tao infrastructure -- validator chi can check nhung gi AI generate (flowcharts theo rules cu the), khong can validate arbitrary Mermaid.

## Common Pitfalls

### Pitfall 1: Mermaid Reserved Keywords Trong Vietnamese Labels
**What goes wrong:** Tu nhu "end", "graph", "subgraph", "click", "call" trong tieng Viet co the trung voi reserved keywords.
**Why it happens:** Mermaid parser interpret keywords bat ke context. VD: node co label "Transcend" chua "end" o cuoi.
**How to avoid:** D-10 da giai quyet -- LUON dung double quotes cho labels. `A["Transcend"]` an toan. Validator nen check unquoted labels.
**Warning signs:** Diagram render loi o node co label chua "end" hoac "graph".

### Pitfall 2: Node ID Bat Dau Bang 'o' Hoac 'x'
**What goes wrong:** `A---oB` tao circle edge, `A---xB` tao cross edge -- khong phai node connection.
**Why it happens:** Mermaid dung 'o' va 'x' sau arrows la edge decorators.
**How to avoid:** Node IDs nen dung uppercase hoac descriptive names (>= 2 ky tu). Validator nen warn khi node ID la single lowercase 'o' hoac 'x'.
**Warning signs:** Diagram hien thi cross/circle o edge thay vi connect binh thuong.

### Pitfall 3: Unclosed Quotes Trong Vietnamese Labels
**What goes wrong:** Label tieng Viet co dau ngoac kep ben trong se break parser. VD: `A["Noi dung "chinh""]`.
**Why it happens:** Double quotes trong double quotes khong duoc escape.
**How to avoid:** Labels khong nen chua double quotes ben trong. Validator nen check balanced quotes per line.
**Warning signs:** Parse error ngay dong co unbalanced quotes.

### Pitfall 4: AND/OR La Logical Operators
**What goes wrong:** Tu "AND" va "OR" trong label text co the interfere voi Mermaid parser ngay ca khi quoted trong mot so context.
**Why it happens:** Mermaid internal parser co logical operator precedence.
**How to avoid:** Dung "va" (tieng Viet) thay "AND", "hoac" thay "OR" trong labels. Phu hop voi D-09 (labels tieng Viet).
**Warning signs:** Diagram break khi label chua "AND" hoac "OR".

### Pitfall 5: HTML Tags Trong Labels
**What goes wrong:** Text trong angle brackets `<text>` bi interpret la HTML tag, dac biet khi text la tieng Anh.
**Why it happens:** Mermaid render HTML trong labels.
**How to avoid:** Khong dung angle brackets trong labels. Validator nen flag `<...>` patterns trong unquoted labels.
**Warning signs:** Label hien thi rong hoac bi cat.

### Pitfall 6: Thieu Direction Declaration
**What goes wrong:** Mermaid flowchart khong co direction (`flowchart TD`) se dung default hoac fail.
**Why it happens:** Thieu keyword declaration o dong dau tien.
**How to avoid:** Validator check dong dau tien phai la `flowchart [direction]` hoac `graph [direction]`.
**Warning signs:** Diagram render theo huong khong mong muon.

## Mermaid Syntax Reference (cho Validator)

### Direction Keywords
| Keyword | Meaning | Khi nao dung |
|---------|---------|-------------|
| `TD` / `TB` | Top-Down | Process flows, hierarchies -- **DEFAULT** cho business logic |
| `LR` | Left-Right | Timelines, sequences, pipelines |
| `BT` | Bottom-Top | Hierarchy inversion (hiem dung) |
| `RL` | Right-Left | Reverse flows (hiem dung) |

**Recommendation (Claude's Discretion):** TD cho business logic flows, LR cho architecture/pipeline diagrams. Ghi trong mermaid-rules.md.

### Node Shape Syntax (mapped to D-02 Shape-by-Role)

| Role | Shape Name | Mermaid Syntax | VD |
|------|-----------|---------------|-----|
| Service | Rectangle | `A["Label"]` | `svc["Xu ly don hang"]` |
| Database | Cylinder | `A[("Label")]` | `db[("PostgreSQL")]` |
| API | Rounded | `A("Label")` | `api("REST API")` |
| Decision | Diamond | `A{"Label"}` | `dec{"Hop le?"}` |
| Start/End | Stadium | `A(["Label"])` | `start(["Bat dau"])` |
| External | Subroutine | `A[["Label"]]` | `ext[["Payment Gateway"]]` |

### Arrow Types
| Arrow | Syntax | Meaning |
|-------|--------|---------|
| Solid | `-->` | Normal flow |
| Solid with text | `-->\|text\|` hoac `-- text -->` | Labeled flow |
| Dotted | `-.->` | Optional/async |
| Thick | `==>` | Emphasis/critical path |

### Style Syntax (cho color palette D-01)
```mermaid
classDef primary fill:#2563EB,stroke:#1e40af,color:#fff
classDef secondary fill:#64748B,stroke:#475569,color:#fff
classDef accent fill:#10B981,stroke:#059669,color:#fff
classDef warning fill:#F59E0B,stroke:#d97706,color:#000
classDef error fill:#DC2626,stroke:#b91c1c,color:#fff
```

### Reserved Keywords (MUST check)
| Keyword | Context | Workaround |
|---------|---------|------------|
| `end` | Node label/ID | Capitalize "End" hoac quote `["end"]` |
| `graph` | Node label/ID | Quote `["graph"]` |
| `subgraph` | Node label/ID | Quote `["subgraph"]` |
| `click` | Node label/ID | Quote `["click"]` |
| `call` | Node label/ID | Quote `["call"]` |
| `default` | Node label/ID | Quote `["default"]` |
| `_self`, `_blank`, `_parent`, `_top` | Node ending | Khong dung lam suffix |
| `AND`, `OR` | Label text | Dung tieng Viet: "va", "hoac" |

## Code Examples

### Mermaid Validator Core Structure
```javascript
// Source: Pattern derived from bin/lib/plan-checker.js + Mermaid official docs

'use strict';

// ─── Constants ────────────────────────────────────────────

const VALID_DIRECTIONS = ['TD', 'TB', 'BT', 'LR', 'RL'];

const RESERVED_KEYWORDS = [
  'end', 'graph', 'subgraph', 'click', 'call', 'default',
  'style', 'classDef', 'class', 'linkStyle',
];

const PALETTE = {
  primary: '#2563EB',
  secondary: '#64748B',
  accent: '#10B981',
  warning: '#F59E0B',
  error: '#DC2626',
};

const SHAPE_BY_ROLE = {
  service: { syntax: /\w+\["[^"]*"\]/, description: 'rectangle' },
  database: { syntax: /\w+\[\("[^"]*"\)\]/, description: 'cylinder' },
  api: { syntax: /\w+\("[^"]*"\)/, description: 'rounded' },
  decision: { syntax: /\w+\{"[^"]*"\}/, description: 'diamond' },
  'start-end': { syntax: /\w+\(\["[^"]*"\]\)/, description: 'stadium' },
  external: { syntax: /\w+\[\["[^"]*"\]\]/, description: 'subroutine' },
};

const MAX_NODES = 15;

// ─── Syntax Checks (errors) ──────────────────────────────

function checkDeclaration(lines) { /* check flowchart/graph + direction */ }
function checkUnclosedQuotes(lines) { /* balanced double quotes per line */ }
function checkReservedKeywords(lines) { /* unquoted reserved words as node IDs */ }
function checkArrowSyntax(lines) { /* valid arrow patterns --> -.-> ==> */ }

// ─── Style Checks (warnings) ─────────────────────────────

function checkPalette(lines) { /* classDef colors match PALETTE */ }
function checkShapeMapping(lines) { /* node shapes match SHAPE_BY_ROLE */ }
function checkNodeCount(lines) { /* count nodes <= MAX_NODES */ }
function checkLabelQuoting(lines) { /* all labels use double quotes */ }

// ─── Main Function ────────────────────────────────────────

function mermaidValidator(mermaidText, options = {}) {
  const lines = mermaidText.split('\n');
  const errors = [];
  const warnings = [];

  // Syntax checks -> errors
  errors.push(...checkDeclaration(lines));
  errors.push(...checkUnclosedQuotes(lines));
  errors.push(...checkReservedKeywords(lines));
  errors.push(...checkArrowSyntax(lines));

  // Style checks -> warnings
  warnings.push(...checkPalette(lines));
  warnings.push(...checkShapeMapping(lines));
  warnings.push(...checkNodeCount(lines));
  warnings.push(...checkLabelQuoting(lines));

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

module.exports = { mermaidValidator };
```

### Error Object Format (D-06)
```javascript
// Source: Decision D-06 from CONTEXT.md
{
  line: 3,           // 1-based line number
  message: 'Reserved keyword "end" used as unquoted node ID',
  type: 'syntax',    // 'syntax' (error) hoac 'style' (warning)
}
```

### Management Report Template Structure (D-07, D-08)
```markdown
# Bao cao quan ly
> Milestone: {{milestone_name}} ({{version}})
> Ngay: {{date}}

## 1. Tom tat dieu hanh
<!-- AI fill: 3-5 bullet points tong quan milestone -->

## 2. Tong quan Milestone
<!-- AI fill: bang tien do phases, thong ke -->

## 3. Luong nghiep vu (Business Logic Flow)
<!-- AI fill: Mermaid flowchart tu Truths/PLAN.md -->
```mermaid
flowchart TD
  %% Placeholder -- Phase 22 se generate
```

## 4. Kien truc tong quan (Architecture Overview)
<!-- AI fill: Mermaid diagram modules/services/DB/APIs -->
```mermaid
flowchart LR
  %% Placeholder -- Phase 22 se generate
```

## 5. Thanh tuu noi bat
<!-- AI fill: danh sach features/fixes/improvements -->

## 6. Chi so chat luong
<!-- AI fill: test coverage, code quality metrics -->

## 7. Buoc tiep theo
<!-- AI fill: next milestone plans, risks -->
```

### Test Case Categories
```javascript
// Source: Pattern tu smoke-plan-checker.test.js

describe('mermaidValidator', () => {
  // ─── Valid cases ────────────────────────────
  describe('valid diagrams', () => {
    it('basic flowchart TD with quoted labels');
    it('flowchart LR with all shape types');
    it('diagram with classDef and valid palette');
    it('diagram with subgraph');
    it('diagram with edge labels');
  });

  // ─── Syntax errors ─────────────────────────
  describe('syntax errors', () => {
    it('missing flowchart/graph declaration');
    it('invalid direction keyword');
    it('unclosed double quotes');
    it('unquoted reserved keyword as node ID');
    it('missing arrow between nodes');
  });

  // ─── Style warnings ────────────────────────
  describe('style warnings', () => {
    it('color not in palette');
    it('wrong shape for role');
    it('more than 15 nodes');
    it('unquoted label (even if valid syntax)');
  });

  // ─── Edge cases ─────────────────────────────
  describe('edge cases', () => {
    it('empty string');
    it('only comments');
    it('Vietnamese characters in labels');
    it('special characters: parentheses, brackets');
    it('node ID starting with o or x');
  });
});
```

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | node:test (built-in, Node 24.13.0) |
| Config file | Khong can -- built-in runner |
| Quick run command | `node --test test/smoke-mermaid-validator.test.js` |
| Full suite command | `node --test 'test/*.test.js'` |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| MERM-01 | Rules file co day du color palette, node shapes, label conventions, max nodes, direction rules, quoting rules, anti-patterns | manual | N/A -- verify file content | N/A |
| MERM-02 | mermaidValidator() nhan text, tra { valid, errors, warnings } voi valid syntax + invalid syntax | unit | `node --test test/smoke-mermaid-validator.test.js` | Wave 0 |
| REPT-01 | Template co 7 sections + Mermaid placeholders | manual | N/A -- verify file content | N/A |

### Sampling Rate
- **Per task commit:** `node --test test/smoke-mermaid-validator.test.js`
- **Per wave merge:** `node --test 'test/*.test.js'`
- **Phase gate:** Full suite green before verification

### Wave 0 Gaps
- [ ] `test/smoke-mermaid-validator.test.js` -- covers MERM-02 (validator unit tests)

## Sources

### Primary (HIGH confidence)
- [Mermaid Flowcharts Syntax](https://mermaid.ai/docs/mermaid-oss/syntax/flowchart.html) -- node shapes, directions, arrows, special characters
- [Mermaid Diagram Syntax Reference](https://mermaid.js.org/intro/syntax-reference.html) -- reserved keywords, comments, config
- `bin/lib/plan-checker.js` -- existing validator pattern (1007 lines, 8 checks, pure functions)
- `references/plan-checker.md` -- rules spec pattern
- `test/smoke-plan-checker.test.js` -- test pattern (node:test + assert/strict)

### Secondary (MEDIUM confidence)
- [Mermaid Issue #4645](https://github.com/mermaid-js/mermaid/issues/4645) -- reserved keywords: call, graph, _self, _blank, _parent, _top
- [mermaid-syntax-skill](https://github.com/awesome-skills/mermaid-syntax-skill) -- common errors, escaping rules
- [Troubleshooting Mermaid Syntax](https://youngunghan.github.io/scitechblog/posts/troubleshooting-mermaid-diagram-syntax/) -- AND/OR operator issues, HTML tag issues

### Tertiary (LOW confidence)
- [merval validator](https://github.com/aj-archipelago/merval) -- validation architecture reference (lexer/parser approach -- khong dung nhung tham khao)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- zero dependencies, dung built-in Node.js modules da co trong du an
- Architecture: HIGH -- follow exact patterns tu plan-checker.js da duoc validate qua 4 milestones
- Pitfalls: HIGH -- verified tu Mermaid official docs va multiple GitHub issues
- Mermaid syntax: HIGH -- verified tu official docs (mermaid.ai, mermaid.js.org)

**Research date:** 2026-03-24
**Valid until:** 2026-04-24 (stable domain -- Mermaid syntax stable, project patterns stable)
