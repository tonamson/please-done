# Phase 41: Bao ve Workflow - Research

**Researched:** 2026-03-25
**Domain:** Plan checker extension (CHECK-06, CHECK-07) + workflow guard injection
**Confidence:** HIGH

## Summary

Phase 41 them 3 workflow guards vao he thong hien co: CHECK-06 (Research Backing) va CHECK-07 (Hedging Language) la 2 functions moi trong `bin/lib/plan-checker.js`, va Strategy Injection la text block moi trong `workflows/write-code.md` + `workflows/plan.md`. Tat ca NON-BLOCKING, WARN default.

He thong plan-checker hien co 8 checks (CHECK-01 den CHECK-05, ADV-01 den ADV-03) voi pattern nhat quan: moi check la pure function nhan content tra `{ checkId, status, issues }`. `runAllChecks()` aggregate tat ca checks. Phase nay tang len 10 checks. Test file hien co dung `node:test` framework va assert `checks.length === 8` o 4 cho — can cap nhat thanh 10.

Strategy Injection la text block trong workflow markdown (khong phai JS module). Pattern tuong tu `<conditional_reading>` va guard references hien co (`references/guard-context.md`). Doc INDEX.md, keyword match topic, inject max 2 files / 2000 tokens vao `<research-context>` block.

**Primary recommendation:** Extend plan-checker.js voi 2 functions moi theo dung pattern CHECK-05, them vao runAllChecks, cap nhat tests tu 8 len 10 checks. Strategy Injection la markdown block trong 2 workflow files.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- D-01: Extend plan-checker.js voi function `checkResearchBacking(planContent, researchDir)`.
- D-02: Logic: doc Key Links / References section trong PLAN.md -> kiem tra co lien ket den `.planning/research/` files khong. Neu khong co ref nao -> WARN.
- D-03: Severity: WARN default. Configurable qua `config.json` key `checks.research_backing.severity` (WARN/BLOCK/OFF). Nhat quan voi CHECK-05 pattern.
- D-04: Chi fire khi `.planning/research/internal/` hoac `.planning/research/external/` co files (khong fire khi research dir rong).
- D-05: Register trong CHECK_REGISTRY nhu CHECK-06 voi name "Research Backing".
- D-06: Extend plan-checker.js voi function `checkHedgingLanguage(planContent)`.
- D-07: Regex patterns: `/chua ro|can tim hieu|co the.*hoac|khong chac|chua xac dinh|can nghien cuu/gi`. Phat hien >= 2 matches -> WARN voi goi y `pd research`.
- D-08: Severity: WARN default, configurable qua `checks.hedging_language.severity`.
- D-09: Register trong CHECK_REGISTRY nhu CHECK-07 voi name "Hedging Language".
- D-10: Them guard vao `workflows/write-code.md` va `workflows/plan.md` — tu dong doc INDEX.md va inject research context.
- D-11: Logic: (1) Doc `.planning/research/INDEX.md`, (2) Keyword match topic voi task/plan dang lam, (3) Doc toi da 2 matching files, (4) Inject noi dung (toi da 2000 tokens) vao agent prompt nhu `<research-context>` block.
- D-12: Fallback: neu INDEX.md khong ton tai hoac khong co match -> skip silently (khong loi, khong canh bao).
- D-13: Implement nhu guard micro-template (reuse pattern tu Phase 2 v1.0).
- plan-checker.js CHECK_REGISTRY pattern (8 existing checks) — locked
- Severity configurable pattern tu CHECK-05 — locked
- Guard micro-template pattern tu Phase 2 — locked
- INDEX.md format tu Phase 39 — locked

### Claude's Discretion
- So luong plans va task breakdown
- Exact regex patterns cho hedging detection
- Token counting strategy cho Strategy Injection (character count vs word count)

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| GUARD-01 | CHECK-06 trong plan-checker kiem tra plan co research backing — kiem tra Key Links/References den `.planning/research/` files (severity: WARN default, configurable) | Pattern CHECK-05 configurable severity da co. Pure function pattern tu 8 checks hien co. researchDir check logic documented. |
| GUARD-02 | Mandatory Suggestion phat hien >= 2 hedging patterns (chua ro, can tim hieu, co the...hoac, khong chac) trong plan body va goi y chay `pd research` | Regex pattern defined in D-07. Threshold >= 2 matches. Return pattern nhu existing checks. |
| GUARD-03 | Strategy Injection tu dong load research context (max 2 files, 2000 tokens) vao agent prompts khi spawn — keyword match tu INDEX.md | INDEX.md format tu index-generator.js (table voi cot File, Source Type, Topic, Confidence, Created). Guard micro-template pattern tu references/guard-context.md. |
</phase_requirements>

## Project Constraints (from CLAUDE.md)

- Dung tieng viet toan bo, co dau chuan (ap dung cho comments, JSDoc, error messages)
- Ten bien/function/class/file: tieng Anh

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| node:test | built-in | Test framework | Da dung cho toan bo test suite (601+ tests) |
| node:assert/strict | built-in | Assertions | Nhat quan voi test hien co |
| node:fs | built-in | File I/O | Chi dung trong bin/plan-check.js CLI, KHONG trong lib |
| node:path | built-in | Path handling | Chi dung trong bin/plan-check.js CLI |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| bin/lib/utils.js | existing | parseFrontmatter, extractXmlSection | Khi can parse PLAN.md frontmatter |
| bin/lib/research-store.js | existing | parseEntry, generateIndex | Reference cho INDEX.md format |
| bin/lib/index-generator.js | existing | parseResearchFiles, generateIndex | Reference cho INDEX.md table format |

**Installation:** Khong can cai them — tat ca la built-in Node.js va modules hien co.

## Architecture Patterns

### Recommended Project Structure
```
bin/lib/plan-checker.js     # Them 2 functions: checkResearchBacking, checkHedgingLanguage
bin/plan-check.js           # Cap nhat runAllChecks call (them researchDir param)
workflows/write-code.md     # Them <research-context> guard block
workflows/plan.md           # Them <research-context> guard block
test/smoke-plan-checker.test.js  # Them tests cho CHECK-06, CHECK-07
test/snapshots/*/write-code.md   # Regenerate snapshots
test/snapshots/*/plan.md         # Regenerate snapshots
```

### Pattern 1: Pure Check Function (CHECK-06, CHECK-07)
**What:** Moi check la pure function nhan content string, tra `{ checkId, status, issues }`.
**When to use:** Luon — nhat quan voi 8 checks hien co.
**Example:**
```javascript
// Source: bin/lib/plan-checker.js (CHECK-05 pattern)
/**
 * CHECK-06: Research Backing
 * Kiem tra plan co reference den research files hay khong.
 * Chi fire khi research directories co files.
 *
 * @param {string} planContent - Noi dung PLAN.md
 * @param {object} options
 * @param {boolean} options.hasResearchFiles - Co files trong research dirs khong
 * @param {string} [options.severity='warn'] - WARN/BLOCK/OFF
 * @returns {{ checkId: string, status: string, issues: Array }}
 */
function checkResearchBacking(planContent, options = {}) {
  const severity = options.severity || 'warn';
  const result = { checkId: 'CHECK-06', status: 'pass', issues: [] };

  // D-04: khong fire khi research dir rong
  if (!options.hasResearchFiles) return result;

  // OFF = skip
  if (severity === 'off') return result;

  // D-02: Tim references den .planning/research/
  const hasRef = /\.planning\/research\//.test(planContent);
  if (!hasRef) {
    result.issues.push({
      message: 'Plan khong co reference den research files (.planning/research/)',
      location: 'PLAN.md',
      fixHint: 'Them Key Links/References den research files hoac chay `pd research`'
    });
  }

  result.status = result.issues.length > 0 ? severity : 'pass';
  return result;
}
```

### Pattern 2: Configurable Severity (tu CHECK-05)
**What:** Severity doc tu options, default WARN. Caller truyen tu config.json.
**When to use:** CHECK-06 va CHECK-07 deu dung pattern nay.
**Example:**
```javascript
// Source: bin/lib/plan-checker.js line 698-699
const severity = options.severity || 'warn';
// ...
result.status = result.issues.length > 0 ? severity : 'pass';
```

### Pattern 3: runAllChecks Extension
**What:** Them 2 checks moi vao array checks trong `runAllChecks()`.
**When to use:** Khi register CHECK-06, CHECK-07.
**Example:**
```javascript
// Source: bin/lib/plan-checker.js line 954-971
function runAllChecks({ planContent, tasksContent, requirementIds,
                        check05Severity, check06Options, check07Severity }) {
  const checks = [
    // ... 8 checks hien co ...
    checkResearchBacking(planContent, check06Options),
    checkHedgingLanguage(planContent, { severity: check07Severity }),
  ];
  // aggregate unchanged
}
```

### Pattern 4: Guard Micro-Template (Strategy Injection)
**What:** Conditional text block trong workflow markdown chi dan doc research context.
**When to use:** Trong workflows/write-code.md va workflows/plan.md.
**Example:**
```markdown
<!-- Strategy Injection guard -->
<research_injection>
## Research Context Injection
Truoc khi bat dau:
1. Kiem tra `.planning/research/INDEX.md` ton tai
2. Neu co: doc INDEX.md, tim entries co topic match voi task/phase hien tai (keyword match)
3. Voi toi da 2 entries match: doc noi dung file (toi da 2000 ky tu moi file)
4. Inject noi dung vao context nhu block:
   ```
   <research-context>
   [noi dung research file 1]
   [noi dung research file 2]
   </research-context>
   ```
5. Khong co INDEX.md hoac khong match -> bo qua, tiep tuc binh thuong
</research_injection>
```

### Anti-Patterns to Avoid
- **Dung fs.existsSync trong lib function:** plan-checker.js la pure module — KHONG doc file. Caller (bin/plan-check.js) doc file roi truyen content/flags vao.
- **CHECK-06 hardcode duong dan research:** Truyen `hasResearchFiles` flag tu caller, khong check filesystem trong lib.
- **Strategy Injection la JS module:** KHONG. No la text instructions trong workflow markdown. AI agent doc instructions va thuc hien — khong phai code chay.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| YAML frontmatter parsing | Custom parser | `parseFrontmatter` tu utils.js | Da co, da test, xử ly edge cases |
| Research file validation | Custom validator | `parseEntry` tu research-store.js | Da validate required fields, confidence levels |
| INDEX.md generation | Custom generator | `generateIndex` tu index-generator.js | Da co format chuan, sorted, pure function |
| Test helpers (makePlanV11, makeTasksV11) | New helpers | Extend existing helpers trong test file | Da co pattern, chi can them options cho research refs |

## Common Pitfalls

### Pitfall 1: checks.length Assertion Breakage
**What goes wrong:** Test file assert `result.checks.length === 8` o 4 vi tri. Them 2 checks moi ma khong cap nhat → 4 test cases fail.
**Why it happens:** Hardcoded check count trong tests.
**How to avoid:** Grep `checks.length` trong test file, cap nhat TAT CA tu 8 len 10. Vi tri: khoang line 828, 909, 1380, 1452.
**Warning signs:** `node --test test/smoke-plan-checker.test.js` fail voi "expected 8, got 10".

### Pitfall 2: Historical Plan Validation False Positives
**What goes wrong:** Historical validation chay runAllChecks tren 22 v1.0 plans va ~20 v1.1 plans. Them CHECK-06/CHECK-07 co the tao false positive tren plans cu (plans cu khong co research references, co the co hedging language).
**Why it happens:** Plans cu khong duoc viet voi research backing — CHECK-06 se WARN cho moi plan cu.
**How to avoid:**
- CHECK-06: Dung D-04 — chi fire khi hasResearchFiles = true. Trong test, truyen hasResearchFiles = false → graceful PASS.
- CHECK-07: Hedging patterns la tieng Viet khong dau — plans cu co the khong co patterns nay. Test tren 5-10 plans cu de verify.
**Warning signs:** Historical validation tests fail voi unexpected WARN/BLOCK.

### Pitfall 3: Guard Logic Duplicate Voi Plan Checker (Pitfall 12 tu PITFALLS.md)
**What goes wrong:** Plan-Gate (D-TS1) va Plan Checker (CHECK-01) co the kiem tra cung 1 thu — requirement coverage. User thay 2 warnings cho cung van de.
**Why it happens:** Overlap giua "references to research" va "requirement coverage".
**How to avoid:** CHECK-06 chi kiem tra research references (`.planning/research/` links), KHONG kiem tra requirements. Scope ro rang.

### Pitfall 4: Strategy Injection Token Bloat
**What goes wrong:** Inject 2 files * 2000 tokens = 4000 tokens them vao moi agent prompt. Voi tasks don gian, day la waste.
**Why it happens:** Khong phan loai — inject cho moi task bat ke do phuc tap.
**How to avoid:** D-12 da handle: neu INDEX.md khong ton tai hoac khong match → skip silently. Keyword matching tu nhien loc bot. Max 2 files la gioi han hop ly.

### Pitfall 5: Snapshot Regeneration
**What goes wrong:** Thay doi workflows/write-code.md va workflows/plan.md lam snapshot tests fail.
**Why it happens:** Test suite co snapshot comparison cho workflow files (test/snapshots/*/write-code.md, test/snapshots/*/plan.md).
**How to avoid:** Regenerate snapshots SAU khi thay doi workflow files. Chay test de verify.
**Warning signs:** Snapshot tests fail sau khi sua workflow files.

### Pitfall 6: Hedging Regex False Positives
**What goes wrong:** Regex `/co the.*hoac/gi` match rong qua — "co the A hoac B" (hedging) nhung cung match "file co the duoc doc hoac ghi" (technical description, khong phai hedging).
**Why it happens:** Regex khong co context — match bat ky string nao.
**How to avoid:** Threshold >= 2 matches giam false positive rate. Test tren 5-10 existing PLAN.md files. Neu false positive rate > 10% → thu hep regex.

## Code Examples

### CHECK-07: Hedging Language Detection
```javascript
// Pattern tu D-07 (CONTEXT.md)
const HEDGING_PATTERNS = /chua ro|can tim hieu|co the.*hoac|khong chac|chua xac dinh|can nghien cuu/gi;
const HEDGING_THRESHOLD = 2;

/**
 * CHECK-07: Hedging Language
 * Phat hien ngon ngu chua chac chan trong plan body.
 * >= 2 matches -> WARN voi goi y chay `pd research`.
 *
 * @param {string} planContent - Noi dung PLAN.md
 * @param {object} [options]
 * @param {string} [options.severity='warn'] - WARN/BLOCK/OFF
 * @returns {{ checkId: string, status: string, issues: Array }}
 */
function checkHedgingLanguage(planContent, options = {}) {
  const severity = options.severity || 'warn';
  const result = { checkId: 'CHECK-07', status: 'pass', issues: [] };

  if (severity === 'off') return result;
  if (!planContent) return result;

  const matches = planContent.match(HEDGING_PATTERNS) || [];
  if (matches.length >= HEDGING_THRESHOLD) {
    result.issues.push({
      message: `Plan co ${matches.length} hedging patterns. Goi y chay \`pd research\` de lam ro truoc khi code`,
      location: 'PLAN.md body',
      fixHint: 'Chay `pd research [topic]` cho cac diem chua chac chan'
    });
  }

  result.status = result.issues.length > 0 ? severity : 'pass';
  return result;
}
```

### runAllChecks Extension
```javascript
// Them 2 params moi vao runAllChecks options
function runAllChecks({ planContent, tasksContent, requirementIds,
                        check05Severity, check06Options, check07Severity }) {
  const checks = [
    checkRequirementCoverage(planContent, requirementIds),
    checkTaskCompleteness(planContent, tasksContent),
    checkDependencyCorrectness(planContent, tasksContent),
    checkTruthTaskCoverage(planContent, tasksContent),
    checkLogicCoverage(planContent, tasksContent, { severity: check05Severity }),
    checkKeyLinks(planContent, tasksContent),
    checkScopeThresholds(planContent, tasksContent),
    checkEffortClassification(planContent, tasksContent),
    checkResearchBacking(planContent, check06Options || {}),
    checkHedgingLanguage(planContent, { severity: check07Severity }),
  ];
  // ... aggregate unchanged
}
```

### bin/plan-check.js CLI Extension
```javascript
// Doc config cho CHECK-06, CHECK-07
let check06Options = {};
let check07Severity;

// Check if research directories have files
const researchInternalDir = path.resolve(planDir, '../../../research/internal');
const researchExternalDir = path.resolve(planDir, '../../../research/external');
const hasResearchFiles = (
  (fs.existsSync(researchInternalDir) && fs.readdirSync(researchInternalDir).filter(f => f.endsWith('.md')).length > 0) ||
  (fs.existsSync(researchExternalDir) && fs.readdirSync(researchExternalDir).filter(f => f.endsWith('.md')).length > 0)
);

check06Options = { hasResearchFiles, severity: 'warn' };
// Config override if available
// ... read from config.json checks.research_backing.severity
// ... read from config.json checks.hedging_language.severity

const result = runAllChecks({
  planContent, tasksContent, requirementIds,
  check06Options,
  check07Severity
});
```

### Strategy Injection Workflow Block
```markdown
<!-- Them vao workflows/write-code.md sau <required_reading> -->
<research_injection>
## Tu dong tai research context
Truoc khi code, kiem tra research lien quan:
1. Doc `.planning/research/INDEX.md` — neu khong co, bo qua buoc nay
2. Tim entries co topic match voi task hien tai (keyword match ten task, ten file, ten module)
3. Doc toi da 2 entries match (uu tien HIGH confidence truoc)
4. Moi file doc toi da 2000 ky tu (character count)
5. Wrap noi dung trong `<research-context>` block:
```
<research-context>
### [Topic 1] (Confidence: HIGH)
[Noi dung trich...]

### [Topic 2] (Confidence: MEDIUM)
[Noi dung trich...]
</research-context>
```
6. Khong co INDEX.md hoac khong match -> tiep tuc binh thuong, KHONG bao loi
</research_injection>
```

## Token Counting Strategy (Claude's Discretion)

**Recommendation:** Dung character count (khong phai word count hoac token count).

| Strategy | Uu diem | Nhuoc diem |
|----------|---------|------------|
| Character count | Don gian, deterministic, `str.length` | 1 "token" ~= 4 chars, 2000 tokens ~= 8000 chars |
| Word count | Gan voi token count hon | `str.split(/\s+/).length` phuc tap hon 1 chut |
| Token count (tiktoken) | Chinh xac nhat | Can them dependency, cham |

**Chon character count** voi limit 8000 chars (~2000 tokens). Ly do: "no build step" constraint, khong them dependency, deterministic, nhat quan voi pure function pattern. Workflow instructions se ghi "toi da 2000 ky tu moi file" (D-11 noi "2000 tokens" nhung character count la implementation detail).

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | node:test (built-in) |
| Config file | none (chay truc tiep) |
| Quick run command | `node --test test/smoke-plan-checker.test.js` |
| Full suite command | `node --test test/smoke-plan-checker.test.js` |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| GUARD-01 | CHECK-06 checkResearchBacking tra PASS khi khong co research files | unit | `node --test test/smoke-plan-checker.test.js` | Co (extend) |
| GUARD-01 | CHECK-06 checkResearchBacking tra WARN khi co research files nhung plan khong reference | unit | `node --test test/smoke-plan-checker.test.js` | Co (extend) |
| GUARD-01 | CHECK-06 configurable severity (WARN/BLOCK/OFF) | unit | `node --test test/smoke-plan-checker.test.js` | Co (extend) |
| GUARD-02 | CHECK-07 checkHedgingLanguage tra PASS khi < 2 matches | unit | `node --test test/smoke-plan-checker.test.js` | Co (extend) |
| GUARD-02 | CHECK-07 checkHedgingLanguage tra WARN khi >= 2 matches | unit | `node --test test/smoke-plan-checker.test.js` | Co (extend) |
| GUARD-02 | CHECK-07 configurable severity (WARN/BLOCK/OFF) | unit | `node --test test/smoke-plan-checker.test.js` | Co (extend) |
| GUARD-03 | Strategy Injection text block co trong workflows/write-code.md | snapshot | `node --test test/` | Co (regen) |
| GUARD-03 | Strategy Injection text block co trong workflows/plan.md | snapshot | `node --test test/` | Co (regen) |

### Sampling Rate
- **Per task commit:** `node --test test/smoke-plan-checker.test.js`
- **Per wave merge:** `node --test test/`
- **Phase gate:** Full suite green truoc khi verify

### Wave 0 Gaps
- [ ] `test/smoke-plan-checker.test.js` — them describe blocks cho CHECK-06, CHECK-07
- [ ] Cap nhat `checks.length === 8` → `checks.length === 10` tai 4 vi tri
- [ ] Historical validation cho 2 checks moi (graceful PASS tren plans cu)
- [ ] Snapshot regeneration cho workflow files

## Critical Integration Points

### 1. runAllChecks signature change
File: `bin/lib/plan-checker.js` line 954
Hien tai: `{ planContent, tasksContent, requirementIds, check05Severity }`
Can them: `check06Options, check07Severity`
**Impact:** bin/plan-check.js (CLI caller) can cap nhat. Tests can cap nhat.

### 2. module.exports extension
File: `bin/lib/plan-checker.js` line 975
Can them: `checkResearchBacking, checkHedgingLanguage` vao exports.
**Impact:** Tests import truc tiep functions de test.

### 3. bin/plan-check.js caller update
File: `bin/plan-check.js` line 57
Can them: doc research dir status, truyen check06Options + check07Severity.
**Impact:** CLI output se hien 10 checks thay vi 8.

### 4. Workflow files
Files: `workflows/write-code.md`, `workflows/plan.md`
Can them: `<research_injection>` block.
**Impact:** Snapshot tests se fail → can regenerate.

## Sources

### Primary (HIGH confidence)
- `bin/lib/plan-checker.js` — 1007 lines, 8 checks, pure function pattern
- `bin/plan-check.js` — CLI wrapper, reads files + calls runAllChecks
- `test/smoke-plan-checker.test.js` — 601+ tests, node:test framework
- `bin/lib/research-store.js` — parseEntry, generateIndex, INDEX.md format
- `bin/lib/index-generator.js` — generateIndex, parseResearchFiles
- `references/guard-context.md` — guard micro-template pattern (1 line)
- `workflows/write-code.md` — 457 lines, target cho Strategy Injection
- `workflows/plan.md` — 200+ lines, target cho Strategy Injection
- `.planning/research/PITFALLS.md` — Pitfall 5 (overblocking), Pitfall 12 (duplicate logic)
- `.planning/research/FEATURES.md` — D-TS1, D-TS2, D-TS3 specifications

### Secondary (MEDIUM confidence)
- `.planning/research/ARCHITECTURE.md` — Guard integration points design
- `.planning/research/STACK.md` — Stack decisions, guard patterns

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — tat ca la built-in Node.js, khong them dependency
- Architecture: HIGH — extend existing 8-check pattern, well-documented
- Pitfalls: HIGH — dua tren phan tich ma nguon hien tai + research PITFALLS.md

**Research date:** 2026-03-25
**Valid until:** 2026-04-25 (stable — internal module extension, khong phu thuoc external)
