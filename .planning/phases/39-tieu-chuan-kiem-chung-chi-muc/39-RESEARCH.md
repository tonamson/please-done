# Phase 39: Tieu chuan Kiem chung & Chi muc - Research

**Researched:** 2026-03-25
**Domain:** Evidence validation, audit logging, index generation, confidence scoring — mo rong research-store.js va tao confidence-scorer.js
**Confidence:** HIGH

## Summary

Phase 39 them 4 kha nang vao he thong research: (1) `validateEvidence()` kiem tra section `## Bang chung` co source citation, (2) `appendAuditLog()` tao/cap nhat AUDIT_LOG.md append-only, (3) `generateIndex()` tao INDEX.md tu frontmatter entries, (4) `confidence-scorer.js` module rule-based scoring. Tat ca la pure functions, khong doc/ghi file truc tiep.

Code hien tai da co nen tang vung chac: `research-store.js` co 4 functions + 4 constants, `evidence-protocol.js` co `validateEvidence()` pattern (non-blocking, return `{ valid, warnings }`), `bug-memory.js` co `buildIndex()` pattern (generate markdown table tu records). Phase nay mo rong truc tiep tren cac pattern da co.

**Primary recommendation:** Them 3 functions vao `research-store.js` (validateEvidence, appendAuditLog, generateIndex) va tao 1 module moi `confidence-scorer.js`. Tat ca pure functions, TDD, non-blocking validation. Theo dung pattern da thiet lap tu Phase 38 va v2.1.

<user_constraints>
## User Constraints (tu CONTEXT.md)

### Locked Decisions
- **D-01:** Moi research file PHAI co section `## Bang chung` (heading level 2).
- **D-02:** Moi claim trong section co format: `- [Claim text] — [Source] (confidence: HIGH|MEDIUM|LOW)`. Source la URL, file path (file:dong), hoac ten tai lieu.
- **D-03:** Validation: kiem tra section ton tai va co it nhat 1 claim voi source. Claim khong co source = invalid. Return warnings (non-blocking, nhat quan voi evidence-protocol.js pattern).
- **D-04:** Them `validateEvidence(content)` function vao research-store.js (mo rong module hien co, KHONG tao module moi).
- **D-05:** File: `.planning/research/AUDIT_LOG.md` — append-only markdown table.
- **D-06:** Header: `| Timestamp | Agent | Action | Topic | Sources | Confidence |`.
- **D-07:** `appendAuditLog(existingContent, { agent, action, topic, sourceCount, confidence })` -> updated markdown string. Caller ghi file. Neu existingContent rong, tao header truoc.
- **D-08:** Actions: `collect` (Evidence Collector), `verify` (Fact Checker), `index` (auto-generate INDEX).
- **D-09:** `generateIndex(entries)` -> markdown string voi bang: `| File | Source | Topic | Confidence | Created |`.
- **D-10:** Entries la array cua `{ fileName, source, topic, confidence, created }` — caller doc files va parse frontmatter truoc khi goi.
- **D-11:** INDEX.md duoc regenerate toan bo moi lan (KHONG append). Ghi de file cu.
- **D-12:** Module pure function rieng: `bin/lib/confidence-scorer.js`.
- **D-13:** Function chinh: `scoreConfidence({ sources })` -> `{ level: 'HIGH'|'MEDIUM'|'LOW', reason: string }`.
- **D-14:** Rule-based scoring: HIGH >= 2 official sources, MEDIUM >= 2 sources dong y, LOW 1 source hoac khong xac minh.
- **D-15:** KHONG dung LLM self-assessment — chi rule-based. Per PITFALLS.md research.
- Frontmatter 8 fields schema (D-01 Phase 38) — locked
- parseFrontmatter/buildFrontmatter reuse (D-08 Phase 38) — locked
- research-store.js existing exports: createEntry, parseEntry, validateConfidence, generateFilename — DO NOT modify

### Claude's Discretion
- So luong plans va task breakdown
- Test data fixtures cho evidence section validation
- Edge cases cho appendAuditLog (empty file, malformed table)

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| AUDIT-02 | Moi research file co section `## Bang chung` voi source citation cho tung claim — claim khong co source = khong duoc ghi | validateEvidence() function trong research-store.js, regex-based section detection, claim format validation |
| AUDIT-04 | AUDIT_LOG.md append-only ghi lai moi hanh dong research (timestamp, agent, action, topic, source-count, confidence) | appendAuditLog() function trong research-store.js, markdown table generation pattern tu bug-memory.js |
| STORE-03 | INDEX.md duoc auto-generate tu frontmatter cua tat ca research files — bang markdown voi cot [File, Source Type, Topic, Confidence, Created] | generateIndex() function trong research-store.js, buildIndex pattern tu bug-memory.js |
</phase_requirements>

## Project Constraints (tu CLAUDE.md)

- Dung tieng viet toan bo, co dau chuan
- Comment va documentation trong code PHAI dung tieng Viet co dau

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Node.js | 24.14.1 | Runtime | Da cai dat, toan bo project dung |
| node:test | built-in | Test framework | Pattern da thiet lap tu v1.0 |
| node:assert/strict | built-in | Assertions | Pattern da thiet lap tu v1.0 |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| bin/lib/utils.js | project | parseFrontmatter(), buildFrontmatter() | Parse/build YAML frontmatter cho research files |
| bin/lib/research-store.js | project | Module hien co — extend | Them validateEvidence, appendAuditLog, generateIndex |
| bin/lib/evidence-protocol.js | project | Pattern tham khao | validateEvidence non-blocking pattern |
| bin/lib/bug-memory.js | project | Pattern tham khao | buildIndex markdown table generation |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Regex-based claim parsing | YAML-based claim structure | Regex don gian hon, phu hop voi markdown body. YAML chi dung cho frontmatter |
| Them vao research-store.js | Tao module rieng (audit-log.js, research-index.js) | CONTEXT.md locked: them vao research-store.js. Chi confidence-scorer.js la module rieng |

## Architecture Patterns

### Recommended Project Structure
```
bin/lib/
  research-store.js      # Mo rong: them validateEvidence, appendAuditLog, generateIndex
  confidence-scorer.js   # Module MỚI: scoreConfidence pure function
test/
  smoke-research-store.test.js    # Mo rong: them tests cho 3 functions moi
  smoke-confidence-scorer.test.js # File MỚI: tests cho confidence-scorer
.planning/research/
  AUDIT_LOG.md   # Tao boi workflow (khong phai module)
  INDEX.md       # Tao boi workflow (khong phai module)
```

### Pattern 1: Non-blocking Validation (tu evidence-protocol.js)
**What:** Validation return `{ valid, warnings }` thay vi throw Error. Warnings la mang string.
**When to use:** Khi validate content format — khong can chan workflow, chi canh bao.
**Example:**
```javascript
// Source: bin/lib/evidence-protocol.js (dong 68-109)
function validateEvidence(content) {
  if (content == null || typeof content !== 'string' || content.trim() === '') {
    throw new Error('thieu tham so content');
  }
  const warnings = [];
  // ... kiem tra cac dieu kien ...
  const valid = warnings.length === 0;
  return { valid, outcome, agent, warnings };
}
```

### Pattern 2: Markdown Table Generation (tu bug-memory.js)
**What:** Pure function nhan data array, return markdown string voi header + rows.
**When to use:** generateIndex, appendAuditLog.
**Example:**
```javascript
// Source: bin/lib/bug-memory.js (dong 153-231)
function buildIndex(bugRecords) {
  let md = `# Bug Index\n\n**Cap nhat:** ${timestamp}\n`;
  md += '| ID | File | ... |\n';
  md += '|----|------| ... |\n';
  for (const record of bugRecords) {
    md += `| ${id} | ${fm.file} | ... |\n`;
  }
  return md;
}
```

### Pattern 3: Pure Function Module (khong I/O)
**What:** Module chi export pure functions. Caller truyen data qua tham so, module return ket qua. KHONG require('fs'), KHONG doc/ghi file.
**When to use:** Tat ca functions trong research-store.js va confidence-scorer.js.

### Anti-Patterns to Avoid
- **Ghi file trong pure function:** Module KHONG duoc require('fs'). Caller ghi file.
- **Throw Error cho validation failure:** Dung warnings array, chi throw khi loi lap trinh (null input).
- **Modify existing exports:** DO NOT thay doi 4 functions + 4 constants da co trong research-store.js.
- **LLM self-assessment cho confidence:** KHONG BAO GIO. Chi rule-based scoring.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Frontmatter parsing | Custom YAML parser | `parseFrontmatter()` tu utils.js | Da co, da test voi 600+ tests |
| Markdown table format | HTML table hoac JSON | Markdown table string | Nhat quan voi toan bo project, human-readable |
| Confidence validation | Custom enum check | `validateConfidence()` tu research-store.js | Da co, case-insensitive |
| Section heading detection | Custom AST parser | Regex `^## Heading` | Don gian, da proven trong evidence-protocol.js |

**Key insight:** Toan bo Phase 39 la mo rong patterns da proven. KHONG co gi moi — chi ap dung lai patterns tu evidence-protocol.js va bug-memory.js vao research domain.

## Common Pitfalls

### Pitfall 1: validateEvidence nham voi evidence-protocol.js validateEvidence
**What goes wrong:** 2 functions cung ten `validateEvidence` nhung khac module va khac muc dich. evidence-protocol.js validate bug investigation evidence. research-store.js validate research evidence (section `## Bang chung`).
**Why it happens:** Naming collision giua 2 modules.
**How to avoid:** Trong research-store.js, function validate khac hoan toan: kiem tra section `## Bang chung`, kiem tra claim format `- [text] — [source] (confidence: LEVEL)`. KHONG import/reuse logic tu evidence-protocol.js — chi tham khao pattern return `{ valid, warnings }`.
**Warning signs:** Import sai module trong test file.

### Pitfall 2: appendAuditLog khong xu ly file rong dung
**What goes wrong:** Lan dau AUDIT_LOG.md chua ton tai hoac rong → phai tao header. Lan tiep theo → chi append row.
**Why it happens:** Edge case dau tien khi file chua co.
**How to avoid:** D-07 da chi ro: "Neu existingContent rong, tao header truoc." Test ca 2 case: empty string va string co header san.
**Warning signs:** AUDIT_LOG.md thieu header hoac co header trung lap.

### Pitfall 3: generateIndex khong sort entries
**What goes wrong:** INDEX.md khong deterministic — thu tu thay doi moi lan generate.
**Why it happens:** entries array khong duoc sort truoc khi render.
**How to avoid:** Sort entries theo created (moi nhat truoc) hoac theo fileName (alphabetical). Chon 1 cach va nhat quan.
**Warning signs:** Git diff lien tuc thay doi vi thu tu dong khac nhau.

### Pitfall 4: Claim format regex qua strict hoac qua loose
**What goes wrong:** Regex `- [Claim] — [Source] (confidence: LEVEL)` co the khong match claim hop le hoac match claim sai.
**Why it happens:** Markdown claim format co nhieu bien the: dau `—` (em dash) vs `--` (double dash), khoang trang, line breaks.
**How to avoid:** Regex cho phep ca `—` (em dash) va `—` (en dash). Confidence level case-insensitive. Test voi nhieu bien the.
**Warning signs:** validateEvidence bao warnings cho file hop le.

### Pitfall 5: confidence-scorer.js khong phan biet source types
**What goes wrong:** scoreConfidence dem so luong sources nhung khong phan biet official vs web.
**Why it happens:** D-14 yeu cau: HIGH = >= 2 official sources. Can phan loai source type.
**How to avoid:** Input `{ sources }` phai co thong tin source type (official, web, codebase). Function dem theo type, khong chi dem tong.
**Warning signs:** Moi thu deu HIGH vi co >= 2 sources bat ky loai nao.

## Code Examples

Verified patterns tu codebase hien tai:

### validateEvidence cho research files (D-01 -> D-04)
```javascript
// Pattern: evidence-protocol.js validateEvidence (dong 68-109)
// Ap dung: kiem tra section ## Bang chung + claim format
function validateEvidence(content) {
  if (content == null || typeof content !== 'string' || content.trim() === '') {
    throw new Error('thieu tham so content');
  }
  const warnings = [];

  // Kiem tra section ## Bang chung ton tai
  const hasEvidenceSection = /^## Bang chung/m.test(content);
  if (!hasEvidenceSection) {
    warnings.push('thieu section: ## Bang chung');
    return { valid: false, warnings };
  }

  // Extract section content
  const sectionMatch = content.match(/^## Bang chung\s*\n([\s\S]*?)(?=^## |\s*$)/m);
  if (!sectionMatch || !sectionMatch[1].trim()) {
    warnings.push('section Bang chung rong');
    return { valid: false, warnings };
  }

  // Kiem tra co it nhat 1 claim voi source
  // Format: - [Claim] — [Source] (confidence: LEVEL)
  const claims = sectionMatch[1].match(/^- .+/gm) || [];
  if (claims.length === 0) {
    warnings.push('khong co claim nao trong Bang chung');
  }

  // Kiem tra tung claim co source khong
  for (const claim of claims) {
    if (!claim.includes('—') && !claim.includes('--')) {
      warnings.push(`claim thieu source: ${claim.slice(0, 60)}...`);
    }
  }

  return { valid: warnings.length === 0, warnings };
}
```

### appendAuditLog (D-05 -> D-08)
```javascript
// Pattern: bug-memory.js buildIndex markdown table
// Ap dung: append row vao markdown table, tao header neu chua co
const AUDIT_HEADER = '| Timestamp | Agent | Action | Topic | Sources | Confidence |';
const AUDIT_SEPARATOR = '|-----------|-------|--------|-------|---------|------------|';

function appendAuditLog(existingContent, { agent, action, topic, sourceCount, confidence }) {
  // Validate inputs
  // ...

  let content = (existingContent || '').trim();

  // Tao header neu chua co
  if (!content || !content.includes(AUDIT_HEADER)) {
    content = `# Audit Log\n\n${AUDIT_HEADER}\n${AUDIT_SEPARATOR}`;
  }

  // Append row
  const timestamp = new Date().toISOString();
  const row = `| ${timestamp} | ${agent} | ${action} | ${topic} | ${sourceCount} | ${confidence} |`;
  content += `\n${row}`;

  return content;
}
```

### generateIndex (D-09 -> D-11)
```javascript
// Pattern: bug-memory.js buildIndex (dong 153-231)
// Ap dung: bang INDEX tu entries array
function generateIndex(entries) {
  const timestamp = new Date().toISOString();

  if (!entries || entries.length === 0) {
    return `# Research Index\n\n**Cap nhat:** ${timestamp}\n**Tong so:** 0 files\n`;
  }

  let md = `# Research Index\n\n**Cap nhat:** ${timestamp}\n**Tong so:** ${entries.length} files\n\n`;
  md += '| File | Source | Topic | Confidence | Created |\n';
  md += '|------|--------|-------|------------|----------|\n';

  for (const entry of entries) {
    md += `| ${entry.fileName} | ${entry.source} | ${entry.topic} | ${entry.confidence} | ${entry.created} |\n`;
  }

  return md;
}
```

### scoreConfidence (D-12 -> D-15)
```javascript
// Module moi: bin/lib/confidence-scorer.js
// Rule-based, KHONG LLM self-assessment
function scoreConfidence({ sources }) {
  if (!sources || !Array.isArray(sources) || sources.length === 0) {
    return { level: 'LOW', reason: 'khong co source nao' };
  }

  const officialCount = sources.filter(s => s.type === 'official').length;
  const totalCount = sources.length;

  if (officialCount >= 2) {
    return { level: 'HIGH', reason: `${officialCount} official sources` };
  }
  if (totalCount >= 2) {
    return { level: 'MEDIUM', reason: `${totalCount} sources dong y` };
  }
  return { level: 'LOW', reason: '1 source duy nhat' };
}
```

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Node.js built-in test runner (node:test) v24.14.1 |
| Config file | package.json `"test": "node --test 'test/*.test.js'"` |
| Quick run command | `node --test test/smoke-research-store.test.js test/smoke-confidence-scorer.test.js` |
| Full suite command | `npm test` |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| AUDIT-02 | validateEvidence kiem tra section Bang chung va claim format | unit | `node --test test/smoke-research-store.test.js -x` | Co (mo rong) |
| AUDIT-04 | appendAuditLog tao header + append row | unit | `node --test test/smoke-research-store.test.js -x` | Co (mo rong) |
| STORE-03 | generateIndex tao markdown table tu entries | unit | `node --test test/smoke-research-store.test.js -x` | Co (mo rong) |
| AUDIT-03 (enforcement) | scoreConfidence rule-based scoring | unit | `node --test test/smoke-confidence-scorer.test.js -x` | Khong — Wave 0 |

### Sampling Rate
- **Per task commit:** `node --test test/smoke-research-store.test.js test/smoke-confidence-scorer.test.js`
- **Per wave merge:** `npm test`
- **Phase gate:** Full suite green truoc `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `test/smoke-confidence-scorer.test.js` — covers scoreConfidence (AUDIT-03 enforcement)
- [ ] Mo rong `test/smoke-research-store.test.js` — them tests cho validateEvidence, appendAuditLog, generateIndex

## Sources

### Primary (HIGH confidence)
- `bin/lib/research-store.js` — Module hien tai, 4 functions + 4 constants, 234 dong
- `bin/lib/evidence-protocol.js` — validateEvidence pattern, non-blocking `{ valid, warnings }`, 172 dong
- `bin/lib/bug-memory.js` — buildIndex markdown table generation pattern, 235 dong
- `bin/lib/utils.js` — parseFrontmatter() function, reuse cho frontmatter parsing
- `test/smoke-research-store.test.js` — 48 tests hien co, pattern cho tests moi
- `.planning/phases/39-tieu-chuan-kiem-chung-chi-muc/39-CONTEXT.md` — 15 locked decisions

### Secondary (MEDIUM confidence)
- `.planning/research/PITFALLS.md` — Pitfall 1: LLM confidence scoring la unreliable, phai dung rule-based
- `.planning/research/FEATURES.md` — B-TS2 (evidence format), B-TS4 (audit log), A-TS3 (INDEX)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — toan bo la Node.js built-in + project modules da co
- Architecture: HIGH — mo rong patterns da proven (evidence-protocol, bug-memory)
- Pitfalls: HIGH — dua tren phan tich codebase thuc te + PITFALLS.md research

**Research date:** 2026-03-25
**Valid until:** 2026-04-25 (stable — pure function modules, khong phu thuoc external)
