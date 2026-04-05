# Phase 45: AUDIT-03 Claim-Level Confidence API - Research

**Researched:** 2026-03-26
**Domain:** research-store.js API mo rong — claim-level confidence
**Confidence:** HIGH

## Summary

Phase nay mo rong `research-store.js` de ho tro confidence o cap claim, hoan thanh AUDIT-03. Hien tai research-store chi co file-level confidence (trong frontmatter). Phase nay them kha nang: (1) `createEntry()` nhan `claims[]` va render inline confidence tags trong `## Bang chung` section, (2) ham moi `parseClaims(content)` extract structured claims tu content, (3) refactor `validateEvidence()` de goi `parseClaims()` noi bo.

Day la thay doi noi bo module, backward-compatible. Khong co dependency ngoai, khong can CLI script moi. Code hien tai da co moi pattern can thiet — chi can mo rong va refactor.

**Primary recommendation:** Tao `parseClaims()` truoc (core extraction logic), sau do wire vao `createEntry()` (rendering) va refactor `validateEvidence()` (reuse). TDD: viet test truoc cho tung ham.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** Them parameter `claims: [{ text, source, confidence }]` vao createEntry(). createEntry tu dong render markdown voi inline confidence tags trong section `## Bang chung`.
- **D-02:** `claims` va `body` co the dung song song — neu co claims[], createEntry append rendered claims vao body. Neu khong co claims[], body giu nguyen nhu cu (backward-compatible).
- **D-03:** Tao function `parseClaims(content)` TACH RIENG — khong them vao parseEntry(). parseEntry() giu nguyen API hien co.
- **D-04:** parseClaims() tra ve `[{ text, source, confidence }]` — extract tu section `## Bang chung` trong content.
- **D-05:** Format: `- [text] — [source] (confidence: LEVEL)` — nhat quan voi comment trong validateEvidence hien co (dong 231).
- **D-06:** Parse bang regex, chap nhan ca em dash (\u2014) va double dash (--) lam source separator (giu nhat quan voi validateEvidence).
- **D-07:** parseClaims() la ham core extract claims. validateEvidence() REFACTOR de goi parseClaims() thay vi tu parse `## Bang chung` section.
- **D-08:** validateEvidence() giu nguyen API output `{ valid, warnings }` — chi thay doi noi bo implementation.
- **D-09:** Claim khong co inline `(confidence: LEVEL)` => parseClaims tra `confidence: null`. Caller tu quyet dinh fallback.
- Confidence 3 bac: HIGH/MEDIUM/LOW (Phase 38 D-03) — locked
- TDD pattern: test truoc, code sau (Phase 38 D-08) — locked
- parseEntry API shape khong thay doi (Phase 38 D-07) — locked
- Claim format `- [text] — [source] (confidence: LEVEL)` tu validateEvidence (Phase 38) — locked

### Claude's Discretion
- Test data fixtures va edge cases
- So luong plans va task breakdown
- Chi tiet regex pattern cho parseClaims
- Cach render claims khi createEntry co ca body va claims[]

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| AUDIT-03 | Confidence 3 bac (HIGH/MEDIUM/LOW) gan o ca cap file va cap claim | parseClaims() extract claim-level confidence; createEntry() render inline tags; validateEvidence() refactored de reuse parseClaims |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| node:test | Node.js built-in | Test framework | Da dung xuyen suot project |
| node:assert/strict | Node.js built-in | Assertions | Da dung xuyen suot project |

### Supporting
Khong can them dependency moi. Tat ca thay doi nam trong `bin/lib/research-store.js` va `test/smoke-research-store.test.js`.

## Architecture Patterns

### Affected Files
```
bin/lib/research-store.js    # Sua: createEntry, validateEvidence. Them: parseClaims
test/smoke-research-store.test.js  # Mo rong: tests cho parseClaims, createEntry claims, validateEvidence refactor
```

### Pattern 1: parseClaims() — Core Extraction
**What:** Tach rieng ham parse claims tu markdown content. Nhan full content string, tim section `## Bang chung`, extract structured claims.
**When to use:** Bat ky khi can doc claim-level data tu research file.

```javascript
// Input: full markdown content (bao gom frontmatter)
// Output: [{ text: string, source: string, confidence: string|null }]
function parseClaims(content) {
  // 1. Tim section ## Bang chung (reuse logic tu validateEvidence dong 253)
  // 2. Extract cac dong bat dau bang "- "
  // 3. Parse tung dong: split bang em dash hoac double dash
  // 4. Extract confidence tag (confidence: LEVEL) neu co
  // 5. Return array of { text, source, confidence }
}
```

**Regex goi y cho parse 1 claim line:**
```javascript
// Match: "- [text] — [source] (confidence: LEVEL)"
// Hoac: "- [text] -- [source] (confidence: LEVEL)"
// Confidence la optional
const CLAIM_REGEX = /^-\s+(.+?)(?:\s*(?:\u2014|--)\s*)(.+?)(?:\s*\(confidence:\s*(HIGH|MEDIUM|LOW)\))?$/i;
```

**Edge cases can xu ly:**
- Claim khong co source separator => `{ text: full_line, source: null, confidence: null }` hoac skip? (Recommendation: return voi source = null de caller quyet dinh)
- Claim co source nhung khong co confidence tag => `confidence: null` (D-09)
- Section `## Bang chung` rong => return `[]`
- Content khong co section `## Bang chung` => return `[]`
- Source text co dau ngoac don `(abc)` truoc confidence tag — regex can greedy match source

### Pattern 2: createEntry() Claims Rendering
**What:** Khi `claims[]` duoc truyen vao, createEntry render chung thanh markdown lines trong `## Bang chung` section.
**Logic:**

```javascript
// Trong createEntry, sau khi build bodyContent:
if (Array.isArray(claims) && claims.length > 0) {
  const renderedClaims = claims.map(c => {
    let line = `- ${c.text}`;
    if (c.source) line += ` \u2014 ${c.source}`;
    if (c.confidence) line += ` (confidence: ${c.confidence.toUpperCase()})`;
    return line;
  }).join('\n');

  const claimsSection = `\n## Bang chung\n\n${renderedClaims}\n`;

  // Neu body da co ## Bang chung => append claims vao cuoi section
  // Neu body KHONG co ## Bang chung => them section moi
  // Logic: kiem tra body.includes('## Bang chung')
}
```

**D-02 handling (body + claims song song):**
- `body` co, `claims` co: append rendered claims vao cuoi body (sau `## Bang chung` neu co, hoac them section moi)
- `body` co, `claims` khong co: giu nguyen (backward-compatible)
- `body` khong co, `claims` co: dung default body + append claims
- `body` khong co, `claims` khong co: giu nguyen (backward-compatible, body mac dinh)

### Pattern 3: validateEvidence() Refactor
**What:** Thay the noi bo parsing logic bang goi parseClaims().
**Constraint:** Output API `{ valid, warnings }` KHONG THAY DOI (D-08).

```javascript
function validateEvidence(content) {
  // Giu nguyen: throw khi content null/undefined/empty
  // Giu nguyen: check section ## Bang chung ton tai

  // THAY THE: tu parse claims => goi parseClaims()
  const claims = parseClaims(content);

  // Logic warnings giu nguyen:
  // - section khong co => warning
  // - section rong (claims.length === 0) => warning
  // - claim thieu source (source === null) => warning

  return { valid: warnings.length === 0, warnings };
}
```

### Anti-Patterns to Avoid
- **Sua parseEntry() API:** D-03 lock ro — parseClaims la ham rieng, parseEntry giu nguyen
- **Throw khi claim thieu confidence:** D-09 noi ro tra `null`, khong throw
- **Duplicate section parsing:** parseClaims la single source of truth, validateEvidence PHAI goi no

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Section extraction tu markdown | Custom parser moi | Reuse regex pattern tu validateEvidence dong 253 | Da proven, da co tests |
| Frontmatter handling | Tu viet parser | `parseFrontmatter`/`buildFrontmatter` tu utils.js | Da co, da test |
| Confidence validation | Inline check | `validateConfidence()` da export | Single source of truth |

## Common Pitfalls

### Pitfall 1: Regex khong match source co dau ngoac
**What goes wrong:** Source text chua parentheses (vd: "React docs (v18)") bi parse sai thanh confidence tag.
**Why it happens:** Greedy match `(.+)` truoc `\(confidence:` khong du specific.
**How to avoid:** Confidence tag regex phai match chinh xac `(confidence: HIGH|MEDIUM|LOW)` — chi 3 gia tri cu the. Dung non-greedy match cho source va anchor confidence pattern o cuoi dong.
**Warning signs:** Test voi source chua parentheses fail.

### Pitfall 2: validateEvidence refactor lam thay doi output
**What goes wrong:** Sau refactor, warning messages hoac valid boolean thay doi so voi truoc.
**Why it happens:** parseClaims co logic khac voi inline parsing cu.
**How to avoid:** Chay tat ca tests hien co TRUOC KHI refactor. Tests cu phai pass 100% sau refactor.
**Warning signs:** Existing validateEvidence tests fail.

### Pitfall 3: createEntry body + claims append sai vi tri
**What goes wrong:** Claims bi render NGOAI section `## Bang chung` hoac duplicate section header.
**Why it happens:** Khong kiem tra body da co section `## Bang chung` chua truoc khi append.
**How to avoid:** Check body.includes('## Bang chung'). Neu co: tim vi tri cuoi section, insert claims. Neu khong: them section header + claims.
**Warning signs:** parseEntry -> parseClaims round-trip khong khop.

### Pitfall 4: Em dash vs double dash inconsistency khi render
**What goes wrong:** createEntry render voi em dash nhung parseClaims chi match double dash (hoac nguoc lai).
**Why it happens:** D-06 noi parse CA HAI nhung khong specify render dung cai nao.
**How to avoid:** createEntry RENDER voi em dash (\u2014) — nhat quan voi D-05. parseClaims PARSE ca hai (\u2014 va --).
**Warning signs:** Round-trip test (createEntry -> parseClaims) fail.

## Code Examples

### parseClaims — Implementation Pattern

```javascript
// Source: research-store.js validateEvidence dong 253 (section extraction)
function parseClaims(content) {
  if (content == null || typeof content !== 'string') return [];

  // Reuse section extraction regex tu validateEvidence
  const sectionMatch = content.match(/^## Bang chung\s*\n([\s\S]*?)(?=^## |\s*$)/m);
  if (!sectionMatch || !sectionMatch[1].trim()) return [];

  const lines = sectionMatch[1].match(/^- .+/gm) || [];
  return lines.map(line => {
    const text = line.slice(2).trim(); // Bo "- " prefix

    // Tim source separator: em dash hoac double dash
    const sepMatch = text.match(/^(.+?)\s*(?:\u2014|--)\s*(.+)$/);
    if (!sepMatch) {
      return { text, source: null, confidence: null };
    }

    const claimText = sepMatch[1].trim();
    let sourceText = sepMatch[2].trim();
    let confidence = null;

    // Extract confidence tag tu cuoi source
    const confMatch = sourceText.match(/^(.*?)\s*\(confidence:\s*(HIGH|MEDIUM|LOW)\)\s*$/i);
    if (confMatch) {
      sourceText = confMatch[1].trim();
      confidence = confMatch[2].toUpperCase();
    }

    return { text: claimText, source: sourceText, confidence };
  });
}
```

### createEntry claims rendering

```javascript
// Trong createEntry, sau khi build bodyContent:
function renderClaims(claims) {
  return claims.map(c => {
    let line = `- ${c.text}`;
    if (c.source) line += ` \u2014 ${c.source}`;
    if (c.confidence && validateConfidence(c.confidence)) {
      line += ` (confidence: ${c.confidence.toUpperCase()})`;
    }
    return line;
  }).join('\n');
}
```

### Test fixture mau

```javascript
// Content voi claims co confidence
const CONTENT_WITH_CLAIMS = `---
agent: evidence-collector
created: 2026-03-25T10:00:00.000Z
source: internal
topic: Auth Module
confidence: MEDIUM
---
# Auth Module

## Bang chung

- API dung JWT tokens \u2014 Source code auth.js (confidence: HIGH)
- Session timeout 30 phut \u2014 Config docs (confidence: MEDIUM)
- Rate limiting chua implement -- Grep ket qua (confidence: LOW)
`;

// Content voi claims KHONG co confidence
const CONTENT_WITHOUT_CONF = `---
agent: test
created: 2026-03-25T10:00:00.000Z
source: internal
topic: Test
confidence: MEDIUM
---
# Test

## Bang chung

- Claim A \u2014 SourceX
- Claim B -- SourceY
`;
```

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | node:test (Node.js built-in) |
| Config file | khong can — chay truc tiep |
| Quick run command | `node --test test/smoke-research-store.test.js` |
| Full suite command | `node --test test/smoke-research-store.test.js` |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| AUDIT-03a | parseClaims extract claims tu content | unit | `node --test test/smoke-research-store.test.js` | Co file, can them tests |
| AUDIT-03b | parseClaims return confidence per claim | unit | `node --test test/smoke-research-store.test.js` | Co file, can them tests |
| AUDIT-03c | parseClaims return null khi thieu confidence tag | unit | `node --test test/smoke-research-store.test.js` | Co file, can them tests |
| AUDIT-03d | createEntry render claims voi inline confidence | unit | `node --test test/smoke-research-store.test.js` | Co file, can them tests |
| AUDIT-03e | createEntry body + claims song song | unit | `node --test test/smoke-research-store.test.js` | Co file, can them tests |
| AUDIT-03f | validateEvidence refactor — API output khong doi | unit | `node --test test/smoke-research-store.test.js` | Co — tests hien co |
| AUDIT-03g | Round-trip: createEntry(claims) -> parseClaims | integration | `node --test test/smoke-research-store.test.js` | Co file, can them tests |

### Sampling Rate
- **Per task commit:** `node --test test/smoke-research-store.test.js`
- **Per wave merge:** `node --test test/smoke-research-store.test.js`
- **Phase gate:** Full suite green truoc `/gsd:verify-work`

### Wave 0 Gaps
- [ ] Them describe blocks cho `parseClaims` (extraction, edge cases, confidence null)
- [ ] Them describe blocks cho `createEntry` voi `claims[]` parameter
- [ ] Them tests round-trip createEntry -> parseClaims
- [ ] Verify validateEvidence tests hien co van pass sau refactor

## Open Questions

1. **Claim khong co source separator**
   - What we know: D-05 define format voi separator. validateEvidence hien tai warn khi thieu separator.
   - What's unclear: parseClaims nen return claim voi source=null hay skip hoan toan?
   - Recommendation: Return `{ text, source: null, confidence: null }` — cho phep caller quyet dinh. Nhat quan voi D-09 philosophy (caller quyet dinh fallback).

2. **Body da co section `## Bang chung` voi noi dung — claims[] append o dau?**
   - What we know: D-02 noi claims va body co the dung song song.
   - What's unclear: Append cuoi section? Thay the noi dung section?
   - Recommendation: Append SAU noi dung hien co trong section. Khong xoa noi dung cu. Neu body KHONG co section, them section moi o cuoi body.

## Sources

### Primary (HIGH confidence)
- `bin/lib/research-store.js` — doc truc tiep source code, xac nhan API hien co
- `test/smoke-research-store.test.js` — doc truc tiep tests, xac nhan coverage hien co
- `bin/lib/confidence-scorer.js` — reference cho confidence logic
- `.planning/phases/45-audit-03-claim-confidence-api/45-CONTEXT.md` — user decisions

### Secondary (MEDIUM confidence)
- Khong can — tat ca thong tin tu codebase truc tiep

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — khong them dependency moi, chi dung nhung gi da co
- Architecture: HIGH — mo rong API hien co voi pattern da established
- Pitfalls: HIGH — dua tren doc code thuc te, xac dinh edge cases tu regex logic hien co

**Research date:** 2026-03-26
**Valid until:** 2026-04-26 (stable — noi bo module, khong phu thuoc external)
