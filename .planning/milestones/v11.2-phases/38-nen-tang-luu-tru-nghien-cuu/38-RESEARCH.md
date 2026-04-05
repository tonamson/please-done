# Phase 38: Nen tang Luu tru Nghien cuu - Research

**Researched:** 2026-03-25
**Domain:** Pure function module cho research storage voi frontmatter validation, auto-increment ID, va index generation
**Confidence:** HIGH

## Summary

Phase 38 tao nen tang luu tru nghien cuu cho toan bo v3.0 Research Squad. Pham vi gom: (1) di chuyen 5 files research hien co sang `.planning/milestones/v3.0-research/`, (2) tao cau truc thu muc `internal/` va `external/`, (3) dinh nghia frontmatter schema 8 fields bat buoc, (4) xay dung `research-store.js` voi 6 pure functions.

Du an da co moi thu can thiet de implement phase nay: `parseFrontmatter()` va `buildFrontmatter()` tu `utils.js` parse/build YAML frontmatter hoan chinh (ke ca arrays), `createBugRecord()` tu `bug-memory.js` la pattern truc tiep cho `createEntry()`, `generateSlug()` tu `session-manager.js` la pattern cho slug generation, va `buildIndex()` tu `bug-memory.js` la pattern cho `generateIndex()`. KHONG can them bat ky dependency nao.

**Primary recommendation:** Implement `research-store.js` theo dung pattern cua `bug-memory.js` — pure functions, khong I/O, content truyen qua tham so. Reuse `parseFrontmatter`/`buildFrontmatter`/`assembleMd` tu `utils.js`. TDD voi `node:test` runner.

<user_constraints>
## User Constraints (tu CONTEXT.md)

### Locked Decisions
- **D-01:** Extended schema 8 fields: `agent`, `created` (ISO-8601), `source` (internal/external), `topic`, `confidence` (HIGH/MEDIUM/LOW), `scope` (project name), `expires` (ISO-8601), `tags` (YAML array).
- **D-02:** Tat ca 8 fields bat buoc trong moi research file. `parseFrontmatter()` tu utils.js co the parse — chi can validate them cac fields moi.
- **D-03:** Confidence 3 bac: HIGH = Context7/official docs/codebase truc tiep, MEDIUM = nhieu nguon web dong y, LOW = 1 nguon duy nhat hoac khong xac minh duoc.
- **D-04:** Format: `RES-[3-digit]-[SLUG].md` (VD: `RES-001-CVE-NESTJS.md`).
- **D-05:** Auto-increment: scan existing files trong external/, tim so lon nhat, +1. Dung `nextResId(existingFiles)`.
- **D-06:** Slug generation: normalize tieng Viet (NFD + regex), lowercase, replace spaces voi dash, gioi han 40 ky tu. Reuse pattern tu session-manager.js.
- **D-07:** 6 functions trong 1 module pure function:
  - `createEntry({ source, topic, content, agent, confidence, tags, scope })` -> `{ filePath, fileName, frontmatter }`
  - `parseEntry(content)` -> `{ frontmatter, body, sections }` (reuse parseFrontmatter internally)
  - `nextResId(existingFiles)` -> `'RES-004'` (3-digit padded)
  - `listEntries(dir)` -> `[{ id, source, topic, confidence, created, filePath }]`
  - `generateIndex(entries)` -> markdown table string
  - `appendAuditLog({ agent, action, topic, sourceCount, confidence })` -> updated log string
- **D-08:** TDD pattern nhat quan voi v2.1 — test truoc, code sau. File: `bin/lib/research-store.js`, test: `test/smoke-research-store.test.js`.
- **D-09:** Di chuyen 5 files research milestone (STACK.md, FEATURES.md, ARCHITECTURE.md, PITFALLS.md, SUMMARY.md) tu `.planning/research/` vao `.planning/milestones/v3.0-research/`. Giu sach `.planning/research/` cho he thong moi.
- **D-10:** Sau khi di chuyen, tao `.planning/research/internal/` va `.planning/research/external/` rong.
- **D-11:** Internal files dung ten mo ta: `TECHNICAL_STRATEGY.md`, `CODEBASE_MAP.md`, etc. Khong dung RES-ID numbering.
- **D-12:** Frontmatter internal files co `source: internal`, `scope: [project-name]`.

### Claude's Discretion
- So luong plans va task breakdown
- Test data fixtures
- Error handling chi tiet cho edge cases (empty dir, corrupt frontmatter, etc.)

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| STORE-01 | Thu muc internal/ luu ket qua phan tich codebase voi frontmatter `source: internal`, `scope: [project-name]`, `created: ISO-8601` | D-11, D-12: Internal file naming va frontmatter conventions. `parseFrontmatter()` da verify parse duoc tat ca field types. |
| STORE-02 | Thu muc external/ luu ket qua tra cuu web/docs voi ten `RES-[ID]-[SLUG].md`, KHONG GHI DE — moi ban la file rieng biet co so tang dan | D-04, D-05, D-06: RES-ID format, auto-increment logic, slug generation. Pattern `nextSessionNumber()` tu session-manager.js va `createBugRecord()` tu bug-memory.js da chung minh. |
| AUDIT-01 | Moi research file co YAML frontmatter bat buoc: agent, created, source (internal/external), topic, confidence (HIGH/MEDIUM/LOW) | D-01, D-02: 8-field schema (bao gom 5 fields AUDIT-01 + 3 them). `parseFrontmatter()` da verify handle tat ca types. |
| AUDIT-03 | Confidence 3 bac (HIGH = official docs/codebase, MEDIUM = nhieu nguon dong y, LOW = 1 nguon/khong xac minh) gan o ca cap file va cap claim | D-03: Confidence conventions dinh nghia ro. `generateIndex()` se group theo confidence level. |
</phase_requirements>

## Project Constraints (tu CLAUDE.md)

- **Ngon ngu:** Dung tieng Viet toan bo, co dau chuan. Ap dung cho comments trong code, test descriptions, va documentation.

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Node.js built-in `node:test` | Node 24.14.1 (project runtime) | Test runner | 763 tests hien tai dung node:test, KHONG them dependency |
| `parseFrontmatter()` tu `utils.js` | N/A (internal) | Parse YAML frontmatter | Da verify: handle key-value, arrays, tieng Viet. Reuse truc tiep. |
| `buildFrontmatter()` tu `utils.js` | N/A (internal) | Build YAML tu object | Da verify: handle arrays dung format `- item`. |
| `assembleMd()` tu `utils.js` | N/A (internal) | Combine frontmatter + body | Pattern nhat quan voi bug-memory.js, session-manager.js. |

### Supporting

Khong can them bat ky library nao. Zero runtime dependencies la constraint cua du an.

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| parseFrontmatter() (custom) | gray-matter npm | Them dependency, parseFrontmatter() da du cho use case nay |
| File-based storage | SQLite | Out of scope (PROJECT.md constraint: "no build step", no dependencies) |
| Manual YAML arrays | js-yaml npm | parseFrontmatter() da handle arrays, khong can full YAML parser |

## Architecture Patterns

### Recommended Project Structure

```
bin/lib/research-store.js          # 6 pure functions (D-07)
test/smoke-research-store.test.js  # TDD tests (D-08)
.planning/research/
  internal/                        # Internal research files (D-10, D-11)
  external/                        # External research files (D-10)
  INDEX.md                         # Auto-generated index (Pitfall 4 prevention)
  AUDIT_LOG.md                     # Append-only audit log
.planning/milestones/v3.0-research/  # 5 legacy files di chuyen (D-09)
  STACK.md
  FEATURES.md
  ARCHITECTURE.md
  PITFALLS.md
  SUMMARY.md
```

### Pattern 1: Pure Function Module (ke thua bug-memory.js)

**What:** Module chi chua pure functions, KHONG doc/ghi file, KHONG require('fs'). Content truyen qua tham so, return structured object.
**When to use:** Moi function trong research-store.js.
**Example:**

```javascript
// Source: bin/lib/bug-memory.js - createBugRecord pattern
'use strict';

const { parseFrontmatter, buildFrontmatter, assembleMd } = require('./utils');

function createEntry({ source, topic, content, agent, confidence, tags, scope, existingFiles = [] }) {
  // Validation
  if (!topic || typeof topic !== 'string' || topic.trim() === '') {
    throw new Error('thieu tham so topic');
  }
  if (!agent || typeof agent !== 'string') {
    throw new Error('thieu tham so agent');
  }
  // ... validate other required fields

  const id = nextResId(existingFiles);
  const slug = generateSlug(topic);
  const fileName = source === 'external'
    ? `${id}-${slug}.md`
    : `${slug.toUpperCase().replace(/-/g, '_')}.md`;

  const now = new Date().toISOString();
  const expires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

  const frontmatter = {
    agent,
    created: now,
    source,
    topic,
    confidence,
    scope,
    expires,
    tags,    // Array — buildFrontmatter() handles arrays correctly
  };

  const body = `\n# ${id}: ${topic}\n\n${content}\n`;
  const fileContent = assembleMd(frontmatter, body);
  const filePath = source === 'external'
    ? `external/${fileName}`
    : `internal/${fileName}`;

  return { filePath, fileName, frontmatter, content: fileContent };
}

module.exports = { createEntry, parseEntry, nextResId, listEntries, generateIndex, appendAuditLog };
```

### Pattern 2: Auto-Increment ID (ke thua bug-memory.js + session-manager.js)

**What:** Scan existing files, extract so lon nhat, +1. KHONG reuse IDs.
**When to use:** `nextResId()`.
**Example:**

```javascript
// Source: bin/lib/session-manager.js - nextSessionNumber pattern
const RES_FILE_RE = /^RES-(\d{3})-/;

function nextResId(existingFiles) {
  if (!existingFiles || existingFiles.length === 0) return 'RES-001';
  const numbers = existingFiles
    .map(f => { const m = f.match(RES_FILE_RE); return m ? parseInt(m[1], 10) : 0; })
    .filter(n => n > 0);
  if (numbers.length === 0) return 'RES-001';
  const max = Math.max(...numbers);
  return `RES-${String(max + 1).padStart(3, '0')}`;
}
```

### Pattern 3: Slug Generation (ke thua session-manager.js)

**What:** Normalize tieng Viet (NFD + strip combining marks), lowercase, kebab-case, gioi han 40 ky tu.
**When to use:** `createEntry()` khi tao filename.
**Example:**

```javascript
// Source: bin/lib/session-manager.js - generateSlug
function generateSlug(description) {
  return description
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // bo dau tieng Viet
    .replace(/[^a-z0-9\s-]/g, '')   // chi giu alphanumeric, space, dash
    .replace(/\s+/g, '-')           // space -> dash
    .replace(/-+/g, '-')            // nhieu dash -> 1 dash
    .replace(/^-|-$/g, '')          // trim dash dau/cuoi
    .slice(0, 40);                  // gioi han 40 ky tu
}
```

### Pattern 4: Generated Index (ke thua bug-memory.js buildIndex)

**What:** INDEX.md la GENERATED tu entries, KHONG phai manually maintained. Pure function nhan entries array, return markdown string.
**When to use:** `generateIndex()`.
**Example:**

```javascript
// Source: bin/lib/bug-memory.js - buildIndex pattern
function generateIndex(entries) {
  const timestamp = new Date().toISOString();
  if (entries.length === 0) {
    return `# Research Index\n\n**Cap nhat:** ${timestamp}\n**Tong so:** 0 entries\n`;
  }

  let md = `# Research Index\n\n**Cap nhat:** ${timestamp}\n**Tong so:** ${entries.length} entries\n`;

  // Table: File, Source Type, Topic, Confidence, Created (per STORE-03)
  md += '\n| File | Source | Topic | Confidence | Created |\n';
  md += '|------|--------|-------|------------|--------|\n';
  for (const e of entries) {
    md += `| ${e.filePath} | ${e.source} | ${e.topic} | ${e.confidence} | ${e.created} |\n`;
  }

  return md;
}
```

### Pattern 5: Append-Only Audit Log

**What:** `appendAuditLog()` return string moi (khong ghi file). Caller ghi file.
**When to use:** Moi hanh dong research (create, update, verify).
**Example:**

```javascript
function appendAuditLog({ agent, action, topic, sourceCount, confidence, existingLog = '' }) {
  const timestamp = new Date().toISOString();
  const entry = `| ${timestamp} | ${agent} | ${action} | ${topic} | ${sourceCount} | ${confidence} |`;

  if (!existingLog || existingLog.trim() === '') {
    const header = '# Audit Log\n\n| Timestamp | Agent | Action | Topic | Sources | Confidence |\n|-----------|-------|--------|-------|---------|------------|';
    return `${header}\n${entry}\n`;
  }

  return `${existingLog.trimEnd()}\n${entry}\n`;
}
```

### Anti-Patterns to Avoid

- **Module doc file truc tiep:** KHONG require('fs') trong research-store.js. Content truyen qua tham so. Caller (CLI wrapper) chiu trach nhiem I/O.
- **INDEX.md manually maintained:** INDEX.md PHAI la output cua `generateIndex()`, khong bao gio edit thu cong. (Pitfall 4 tu PITFALLS.md)
- **Confidence tu LLM self-assessment:** Confidence PHAI la rule-based tu source counting, KHONG phai tu agent tu danh gia. (Pitfall 1 tu PITFALLS.md)
- **parseFrontmatter voi double quotes:** Khi value co double quotes, parseFrontmatter() GIU NGUYEN quotes trong ket qua (vd: `"Cau truc"` → `"\"Cau truc\""`). KHONG dung quotes quanh values trong frontmatter.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| YAML frontmatter parsing | Custom YAML parser | `parseFrontmatter()` tu utils.js | Da co, 763 tests chung minh, handle arrays |
| YAML frontmatter building | Manual string concat | `buildFrontmatter()` tu utils.js | Handle arrays dung format, da tested |
| Frontmatter + body assembly | Manual `---\n` + concat | `assembleMd()` tu utils.js | Consistent format, da tested |
| Slug generation | Custom regex | Copy pattern tu `session-manager.js` `generateSlug()` | Da handle tieng Viet, NFD normalize, 40 char limit |
| Auto-increment numbering | UUID hoac timestamp | `nextResId()` reuse `nextSessionNumber()` pattern | Ngan, doc duoc, tham chieu duoc trong plan |

**Key insight:** Toan bo infrastructure da co trong codebase. Phase nay chi can compose existing patterns thanh module moi.

## Common Pitfalls

### Pitfall 1: parseFrontmatter() giu double quotes trong values

**What goes wrong:** Neu frontmatter value boc trong double quotes (`topic: "Cau truc"`), parseFrontmatter() tra ve string co quotes (`"Cau truc"` thay vi `Cau truc`). Validation se fail khi so sanh.
**Why it happens:** parseFrontmatter() la lightweight parser, khong strip YAML string quotes.
**How to avoid:** KHONG boc values trong double quotes khi dung `buildFrontmatter()` (no tu dong format dung). Khi validate, strip quotes neu can. Hoac don gian: KHONG dung quotes.
**Warning signs:** Test `parseEntry()` tra ve frontmatter values co dau `"` o dau/cuoi.

### Pitfall 2: listEntries() chua xu ly directory names

**What goes wrong:** `listEntries(dir)` nhan dir listing — neu dir listing chua subdirectories (vd: `.git`, `archive/`), function co the crash hoac return sai.
**Why it happens:** Function chi expect `.md` files nhung directory listing co the co items khac.
**How to avoid:** Filter chi `.md` files truoc khi parse. Pattern tu `listSkillFiles()` trong utils.js: `.filter(f => f.endsWith('.md') && !f.startsWith('.'))`.
**Warning signs:** listEntries return entries voi undefined fields.

### Pitfall 3: nextResId() voi mixed file naming

**What goes wrong:** Internal files KHONG dung RES-ID pattern (D-11). Neu nextResId nhan mixed list (internal + external files), no co the khong tim thay RES-NNN pattern va reset ve RES-001 mac du da co external files.
**Why it happens:** D-11 quy dinh internal files dung descriptive names, chi external dung RES-ID.
**How to avoid:** nextResId() CHI nhan danh sach files tu `external/` directory, KHONG phai toan bo research dir.
**Warning signs:** 2 files co cung RES-ID trong external/.

### Pitfall 4: Frontmatter tags field la array — buildFrontmatter da handle

**What goes wrong:** Developer tu tay build tags string thay vi dung buildFrontmatter().
**Why it happens:** Khong biet buildFrontmatter() da handle arrays.
**How to avoid:** DA VERIFY: `buildFrontmatter({ tags: ['foo', 'bar'] })` tra ve `tags:\n  - foo\n  - bar`. Luon dung buildFrontmatter(), khong tu build.
**Warning signs:** Tags field trong file output la 1 dong thay vi multi-line array.

### Pitfall 5: Di chuyen files (D-09) khong cap nhat git

**What goes wrong:** Di chuyen 5 files tu `.planning/research/` sang `.planning/milestones/v3.0-research/` bang copy+delete thay vi `git mv` → git coi la delete + new file, mat history.
**Why it happens:** Task chi noi "di chuyen" khong specify dung git mv.
**How to avoid:** Dung `git mv` de giu commit history. Tao target directory truoc.
**Warning signs:** `git log --follow` cho file moi khong hien history cu.

## Code Examples

### Research Entry File Format (8 fields bat buoc)

```markdown
---
agent: pd-evidence-collector
created: 2026-03-25T10:00:00.000Z
source: external
topic: NestJS guard pattern
confidence: HIGH
scope: please-done
expires: 2026-04-24T10:00:00.000Z
tags:
  - nestjs
  - guards
  - security
---

# RES-001: NestJS guard pattern

[Content here]
```

### Internal Research Entry (khong co RES-ID)

```markdown
---
agent: pd-evidence-collector
created: 2026-03-25T10:00:00.000Z
source: internal
topic: Codebase module structure
confidence: HIGH
scope: please-done
expires: 2026-04-24T10:00:00.000Z
tags:
  - architecture
  - modules
---

# Codebase Module Structure

[Content here]
```

### Frontmatter Validation Logic

```javascript
// 8 required fields per D-01
const REQUIRED_FIELDS = ['agent', 'created', 'source', 'topic', 'confidence', 'scope', 'expires', 'tags'];
const VALID_SOURCES = ['internal', 'external'];
const VALID_CONFIDENCE = ['HIGH', 'MEDIUM', 'LOW'];

function validateFrontmatter(frontmatter) {
  const warnings = [];

  for (const field of REQUIRED_FIELDS) {
    if (!frontmatter[field] && frontmatter[field] !== 0) {
      warnings.push(`thieu field bat buoc: ${field}`);
    }
  }

  if (frontmatter.source && !VALID_SOURCES.includes(frontmatter.source)) {
    warnings.push(`source khong hop le: ${frontmatter.source}`);
  }

  if (frontmatter.confidence && !VALID_CONFIDENCE.includes(frontmatter.confidence)) {
    warnings.push(`confidence khong hop le: ${frontmatter.confidence}`);
  }

  if (frontmatter.tags && !Array.isArray(frontmatter.tags)) {
    warnings.push('tags phai la array');
  }

  return { valid: warnings.length === 0, warnings };
}
```

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | node:test (built-in Node 24.14.1) |
| Config file | Khong can config — node:test chay truc tiep |
| Quick run command | `node --test test/smoke-research-store.test.js` |
| Full suite command | `npm test` |

### Phase Requirements -> Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| STORE-01 | createEntry voi source=internal tao frontmatter dung | unit | `node --test test/smoke-research-store.test.js` | Wave 0 |
| STORE-01 | Internal files dung ten mo ta, khong RES-ID | unit | `node --test test/smoke-research-store.test.js` | Wave 0 |
| STORE-02 | createEntry voi source=external tao RES-ID file | unit | `node --test test/smoke-research-store.test.js` | Wave 0 |
| STORE-02 | nextResId auto-increment tu existing files | unit | `node --test test/smoke-research-store.test.js` | Wave 0 |
| STORE-02 | Slug generation normalize tieng Viet | unit | `node --test test/smoke-research-store.test.js` | Wave 0 |
| AUDIT-01 | parseEntry extract 8 fields tu frontmatter | unit | `node --test test/smoke-research-store.test.js` | Wave 0 |
| AUDIT-01 | Validation bao warning khi thieu field | unit | `node --test test/smoke-research-store.test.js` | Wave 0 |
| AUDIT-03 | Confidence conventions (HIGH/MEDIUM/LOW) validate dung | unit | `node --test test/smoke-research-store.test.js` | Wave 0 |
| AUDIT-03 | generateIndex group theo confidence | unit | `node --test test/smoke-research-store.test.js` | Wave 0 |
| D-07 | listEntries return structured array | unit | `node --test test/smoke-research-store.test.js` | Wave 0 |
| D-07 | generateIndex return markdown table string | unit | `node --test test/smoke-research-store.test.js` | Wave 0 |
| D-07 | appendAuditLog return updated log string | unit | `node --test test/smoke-research-store.test.js` | Wave 0 |

### Sampling Rate

- **Per task commit:** `node --test test/smoke-research-store.test.js`
- **Per wave merge:** `npm test`
- **Phase gate:** Full suite green truoc `/gsd:verify-work`

### Wave 0 Gaps

- [ ] `test/smoke-research-store.test.js` — covers STORE-01, STORE-02, AUDIT-01, AUDIT-03
- [ ] Framework install: Khong can — node:test da co san

## Open Questions

1. **listEntries nhan gi lam input?**
   - What we know: D-07 dinh nghia `listEntries(dir)` nhan `dir` parameter
   - What's unclear: `dir` la path string (can require fs) hay la array of `{filename, content}` (pure function)?
   - Recommendation: Theo pure function pattern, `listEntries` nen nhan `fileEntries: Array<{fileName: string, content: string}>` — caller doc directory va truyen content vao. Nhat quan voi bug-memory.js pattern.

2. **expires field — ai set gia tri mac dinh?**
   - What we know: D-01 yeu cau expires la ISO-8601
   - What's unclear: Mac dinh bao nhieu ngay? (30? 14?)
   - Recommendation: Mac dinh 30 ngay tu thoi diem tao (nhat quan voi PITFALLS.md goi y archive sau 30 ngay). Caller co the override.

3. **appendAuditLog — format cua existingLog?**
   - What we know: D-07 dinh nghia return "updated log string"
   - What's unclear: Format cu the cua audit log (markdown table? plain text?)
   - Recommendation: Dung markdown table nhat quan voi INDEX.md va bug-memory.js buildIndex(). Header row + separator + data rows.

## Sources

### Primary (HIGH confidence)
- `bin/lib/utils.js` — parseFrontmatter, buildFrontmatter, assembleMd API va behavior. DA VERIFY bang runtime test: arrays, tieng Viet, ISO dates deu hoat dong.
- `bin/lib/bug-memory.js` — createBugRecord, buildIndex pattern. Truc tiep reusable cho createEntry, generateIndex.
- `bin/lib/session-manager.js` — generateSlug, nextSessionNumber pattern. Truc tiep reusable cho slug generation va nextResId.
- `bin/lib/evidence-protocol.js` — validateEvidence non-blocking pattern. Truc tiep reusable cho frontmatter validation (warnings thay vi throw).
- `test/smoke-bug-memory.test.js` — Test pattern: describe/it structure, makeBugRecord helper, parseFrontmatter-based assertions.
- `.planning/research/PITFALLS.md` — 12 pitfalls cho v3.0, dac biet Pitfall 4 (INDEX must be generated) va Pitfall 1 (confidence rule-based).
- `.planning/research/ARCHITECTURE.md` — Kien truc tong the v3.0, phan biet internal/external, agent communication pattern.
- `.planning/phases/38-nen-tang-luu-tru-nghien-cuu/38-CONTEXT.md` — 12 locked decisions D-01 toi D-12.

### Secondary (MEDIUM confidence)
- `.planning/research/STACK.md` — Stack research v3.0, mo hinh 3 modules (research-store, audit-report, confidence-scorer). Note: CONTEXT.md D-07 da consolidate thanh 1 module `research-store.js` voi 6 functions thay vi 3 modules rieng.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — 100% reuse tu codebase hien tai, da verify bang runtime tests
- Architecture: HIGH — Pattern truc tiep ke thua tu bug-memory.js, session-manager.js, evidence-protocol.js
- Pitfalls: HIGH — Da phan tich tu PITFALLS.md research + verify parseFrontmatter edge cases

**Research date:** 2026-03-25
**Valid until:** 2026-04-24 (30 ngay — stable domain, khong co external dependencies thay doi)
