# Phase 43: Wire INDEX.md vao Pipeline - Research

**Researched:** 2026-03-26
**Domain:** CLI scripting, workflow orchestration, module delegation
**Confidence:** HIGH

## Summary

Phase nay ket noi cac module da co (index-generator.js, research-store.js) vao pipeline thuc te thong qua CLI script va workflow update. Toan bo logic core da ton tai va da co tests — viec can lam la: (1) tao CLI script doc files tu disk va goi pure functions, (2) them 1 buoc vao workflow, (3) delegate generateIndex trong research-store.js sang index-generator.js, (4) xac nhan Strategy Injection va Fact Checker hoat dong dung voi INDEX.md.

**Primary recommendation:** Tao `bin/update-research-index.js` lam CLI entry point duy nhat, goi parseResearchFiles() + generateIndex() tu index-generator.js, ghi INDEX.md ra disk. Workflow chi can them 1 dong `node bin/update-research-index.js`.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** Goi generateIndex() 1 LAN duy nhat — SAU Fact Checker hoan tat (cuoi pipeline). INDEX.md phan anh trang thai da xac minh.
- **D-02:** Scan CA HAI thu muc internal/ + external/ — INDEX.md la chi muc toan bo research, khong chi source type cua lan chay hien tai.
- **D-03:** Dung `index-generator.js` lam source of truth cho generateIndex() — module chuyen biet co parseResearchFiles + buildIndexRow.
- **D-04:** `research-store.js` giu export generateIndex nhung DELEGATE sang index-generator.js noi bo — backward compatible, khong break callers hien co.
- **D-05:** Tao CLI script `bin/update-research-index.js` — doc tat ca .md trong internal/ + external/, goi parseResearchFiles() tu index-generator.js, goi generateIndex(), ghi INDEX.md.
- **D-06:** Workflow `workflows/research.md` chi can them 1 buoc cuoi: `node bin/update-research-index.js` sau Fact Checker xong. Khong can agent doc files — CLI script lo het.
- **D-07:** Dung parseResearchFiles() tu index-generator.js de parse frontmatter — khong tu parse lai.
- Carrying forward: generateIndex() format tu Phase 39, INDEX.md regenerate toan bo moi lan, Strategy Injection keyword match, Fact Checker cross-validate qua INDEX.md.

### Claude's Discretion
- Error handling cho edge cases (thu muc rong, file khong co frontmatter)
- Test data fixtures
- So luong plans va task breakdown

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| STORE-03 | INDEX.md duoc auto-generate tu frontmatter cua tat ca research files — bang markdown voi cot [File, Source Type, Topic, Confidence, Created] | CLI script `bin/update-research-index.js` goi parseResearchFiles() + generateIndex() tu index-generator.js. Logic da co, chi can wiring. |
| GUARD-03 | Strategy Injection tu dong load research context (max 2 files, 2000 tokens) vao agent prompts khi spawn — keyword match tu INDEX.md | Strategy Injection da wired vao write-code.md va plan.md (research_injection section). Hien tai silent fallback vi INDEX.md chua ton tai. Sau khi CLI tao INDEX.md, injection se hoat dong tu dong. |
| EXTRA-01 | Cross-validation tu dong — Fact Checker doc ca internal/ va external/ files cung topic, phat hien xung dot | Fact Checker da doc INDEX.md de tim files cung topic (workflows/research.md Buoc 3). Hien tai INDEX.md chua ton tai nen cross-validate khong hoat dong. Sau khi CLI tao INDEX.md, cross-validate se hoat dong tu dong. |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| node:fs | built-in | Doc research files tu disk, ghi INDEX.md | Pure Node.js, khong dependency |
| node:path | built-in | Resolve duong dan research directories | Pure Node.js, khong dependency |
| node:test | built-in | Test framework | Da dung xuyen suot project |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| index-generator.js | local | generateIndex, parseResearchFiles, buildIndexRow | Module chinh — source of truth |
| research-store.js | local | parseEntry (dung boi index-generator.js), generateIndex (se delegate) | Backward compatibility |

**Installation:** Khong can cai them gi — toan bo dung built-in Node.js va modules local.

## Architecture Patterns

### Recommended Project Structure
```
bin/
  update-research-index.js    # CLI script MOI — entry point
  lib/
    index-generator.js         # Source of truth (khong doi)
    research-store.js          # Delegate generateIndex (sua)
workflows/
  research.md                  # Them buoc cuoi (sua)
.planning/research/
  internal/                    # Research files
  external/                    # Research files
  INDEX.md                     # OUTPUT — auto-generated
```

### Pattern 1: CLI Script goi Pure Functions
**What:** CLI script doc files tu disk, truyen content vao pure functions, ghi output ra disk.
**When to use:** Khi can ket noi pure library functions voi filesystem.
**Example:**
```javascript
// bin/update-research-index.js
const fs = require('fs');
const path = require('path');
const { parseResearchFiles, generateIndex } = require('./lib/index-generator');

const researchDir = path.resolve('.planning/research');
const dirs = ['internal', 'external'];
const files = [];

for (const dir of dirs) {
  const dirPath = path.join(researchDir, dir);
  if (!fs.existsSync(dirPath)) continue;
  for (const name of fs.readdirSync(dirPath)) {
    if (!name.endsWith('.md')) continue;
    files.push({
      filename: name,
      content: fs.readFileSync(path.join(dirPath, name), 'utf8'),
    });
  }
}

const entries = parseResearchFiles(files);
const indexContent = generateIndex(entries);
fs.writeFileSync(path.join(researchDir, 'INDEX.md'), indexContent, 'utf8');
```

### Pattern 2: Module Delegation (backward compat)
**What:** research-store.js giu export generateIndex nhung delegate sang index-generator.js.
**When to use:** Khi refactor module ma co callers hien co.
**Example:**
```javascript
// Trong research-store.js — thay the function generateIndex hien co
const indexGen = require('./index-generator');

function generateIndex(entries) {
  // Chuyen doi field names neu can (fileName -> filename)
  const normalized = (entries || []).map(e => ({
    filename: e.fileName || e.filename || '-',
    source: e.source || '-',
    topic: e.topic || '-',
    confidence: e.confidence || '-',
    created: e.created || '-',
  }));
  return indexGen.generateIndex(normalized);
}
```

### Anti-Patterns to Avoid
- **Tu parse frontmatter trong CLI script:** Dung parseResearchFiles() tu index-generator.js — D-07 locked.
- **Goi generateIndex() nhieu lan trong pipeline:** D-01 locked — chi 1 lan cuoi pipeline.
- **Chi scan 1 thu muc:** D-02 locked — scan ca internal/ + external/.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Parse frontmatter | Custom regex | parseEntry() tu research-store.js (dung qua parseResearchFiles) | Da co, da test, xu ly edge cases |
| Tao INDEX table format | Custom string builder | generateIndex() tu index-generator.js | Da co, sort theo created, format chuan |
| Parse nhieu files | forEach + manual parse | parseResearchFiles() tu index-generator.js | Bo qua files invalid, return clean entries |

## Common Pitfalls

### Pitfall 1: Field name mismatch giua 2 modules
**What goes wrong:** index-generator.js dung `entry.filename`, research-store.js dung `entry.fileName` (camelCase khac nhau).
**Why it happens:** 2 modules duoc viet doc lap o Phase 39.
**How to avoid:** Khi delegate, normalize field names. CLI script dung parseResearchFiles() nen tra ve `filename` (lowercase) — khop voi index-generator.js. research-store.js delegate can map `fileName` -> `filename`.
**Warning signs:** INDEX.md co cot File toan la "-".

### Pitfall 2: Thu muc rong hoac chua ton tai
**What goes wrong:** fs.readdirSync() throw ENOENT khi thu muc khong ton tai.
**Why it happens:** internal/ hoac external/ co the rong hoac chua duoc tao.
**How to avoid:** Check fs.existsSync() truoc khi readdirSync(). Return empty array neu thu muc khong co.
**Warning signs:** CLI script crash voi ENOENT.

### Pitfall 3: Non-.md files trong research directories
**What goes wrong:** parseResearchFiles() nhan file khong phai research (vd: INDEX.md, SUMMARY.md, ARCHITECTURE.md).
**Why it happens:** Thu muc research co cac file .md khac khong phai research files.
**How to avoid:** Chi scan files trong subdirectories (internal/, external/), KHONG scan root .planning/research/. Dieu nay da duoc dam bao boi D-02 (scan CA HAI internal/ + external/).
**Warning signs:** INDEX.md liet ke chinh no hoac cac meta files.

### Pitfall 4: research-store.js generateIndex format khac index-generator.js
**What goes wrong:** research-store.js hien tai co generateIndex rieng voi format khac (co `Cap nhat:` timestamp, `Tong so:` counter, va header `| File | Source |` thay vi `| File | Source Type |`).
**Why it happens:** 2 implementations doc lap.
**How to avoid:** Sau delegation, tat ca callers se nhan format tu index-generator.js. Update tests tuong ung.
**Warning signs:** Tests fail sau delegation.

### Pitfall 5: Workflow instruction khong ro rang cho AI agent
**What goes wrong:** Agent khong chay CLI script vi instruction khong cu the.
**Why it happens:** Workflow la prompt cho AI — can cu the ve command va timing.
**How to avoid:** Ghi ro: "Chay `node bin/update-research-index.js` sau khi Fact Checker hoan tat."
**Warning signs:** INDEX.md khong duoc tao sau khi chay pd:research.

## Code Examples

### CLI Script hoan chinh (tham khao)
```javascript
#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const { parseResearchFiles, generateIndex } = require('./lib/index-generator');

const researchDir = path.resolve('.planning/research');
const subDirs = ['internal', 'external'];
const allFiles = [];

for (const sub of subDirs) {
  const dirPath = path.join(researchDir, sub);
  if (!fs.existsSync(dirPath)) continue;
  const names = fs.readdirSync(dirPath).filter(n => n.endsWith('.md'));
  for (const name of names) {
    const content = fs.readFileSync(path.join(dirPath, name), 'utf8');
    allFiles.push({ filename: name, content });
  }
}

const entries = parseResearchFiles(allFiles);
const indexContent = generateIndex(entries);

const indexPath = path.join(researchDir, 'INDEX.md');
fs.writeFileSync(indexPath, indexContent, 'utf8');

console.log(`INDEX.md cap nhat: ${entries.length} entries`);
```

### Delegation trong research-store.js
```javascript
// Thay the function generateIndex hien co
const { generateIndex: _genIndex } = require('./index-generator');

function generateIndex(entries) {
  // Map field names cho backward compat
  const mapped = (Array.isArray(entries) ? entries : []).map(e => ({
    filename: e.fileName || e.filename || '-',
    source: e.source || '-',
    topic: e.topic || '-',
    confidence: e.confidence || '-',
    created: e.created || '-',
  }));
  return _genIndex(mapped);
}
```

### Them buoc vao workflow
```markdown
## Buoc 4: Cap nhat INDEX.md
Sau khi Fact Checker hoan tat, chay:
node bin/update-research-index.js
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| 2 generateIndex rieng biet | Delegate research-store -> index-generator | Phase 43 | Thong nhat format, 1 source of truth |
| INDEX.md khong ton tai | Auto-generate moi lan chay pipeline | Phase 43 | Unblock Strategy Injection + Fact Checker cross-validate |
| Strategy Injection silent fallback | Doc INDEX.md thanh cong | Phase 43 | Research context duoc inject vao agent prompts |

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | node:test (built-in) |
| Config file | none (standard node --test) |
| Quick run command | `node --test test/smoke-index-generator.test.js test/smoke-research-store.test.js` |
| Full suite command | `node --test test/smoke-*.test.js` |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| STORE-03 | CLI tao INDEX.md tu research files | unit + integration | `node --test test/smoke-update-research-index.test.js -x` | Wave 0 |
| STORE-03 | generateIndex delegation backward compat | unit | `node --test test/smoke-research-store.test.js -x` | Co (can update) |
| GUARD-03 | Strategy Injection doc INDEX.md thanh cong | manual | Doc workflow + verify INDEX.md format match | Manual only |
| EXTRA-01 | Fact Checker cross-validate qua INDEX.md | manual | Chay pd:research + verify cross-validate output | Manual only |

### Sampling Rate
- **Per task commit:** `node --test test/smoke-index-generator.test.js test/smoke-research-store.test.js`
- **Per wave merge:** `node --test test/smoke-*.test.js`
- **Phase gate:** Full suite green truoc /gsd:verify-work

### Wave 0 Gaps
- [ ] `test/smoke-update-research-index.test.js` — covers STORE-03 (CLI script)
- [ ] Update `test/smoke-research-store.test.js` — sua tests cho generateIndex sau delegation

## Open Questions

1. **Field name normalization strategy**
   - What we know: index-generator.js dung `filename`, research-store.js dung `fileName`. Callers hien co cua research-store.js dung `fileName`.
   - What's unclear: Co bao nhieu callers truc tiep cua research-store.js.generateIndex() ngoai tests?
   - Recommendation: Delegate voi field mapping (D-04 locked). Search callers bang Grep truoc khi implement.

## Project Constraints (from CLAUDE.md)

- Dung tieng Viet toan bo, co dau chuan — ap dung cho comments, JSDoc, console output, commit messages.

## Sources

### Primary (HIGH confidence)
- Doc truc tiep source code: `bin/lib/index-generator.js` (129 dong) — generateIndex, parseResearchFiles, buildIndexRow
- Doc truc tiep source code: `bin/lib/research-store.js` (409 dong) — generateIndex (ban duplicate can delegate), parseEntry
- Doc truc tiep workflow: `workflows/research.md` (74 dong) — pipeline hien tai 3 buoc
- Doc truc tiep workflow: `workflows/write-code.md` dong 19-32 — research_injection section
- Doc truc tiep workflow: `workflows/plan.md` dong 22-35 — research_injection section
- Doc truc tiep tests: `test/smoke-index-generator.test.js`, `test/smoke-research-store.test.js`
- Doc truc tiep agent: `.claude/agents/pd-fact-checker.md` — doc INDEX.md de tim files cung topic

### Secondary (MEDIUM confidence)
- Khong co — toan bo thong tin tu source code truc tiep.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - toan bo dung built-in Node.js va modules da co
- Architecture: HIGH - CONTEXT.md D-01 den D-07 xac dinh ro rang moi quyet dinh
- Pitfalls: HIGH - doc truc tiep source code, phat hien field name mismatch cu the

**Research date:** 2026-03-26
**Valid until:** 2026-04-26 (stable — internal modules, khong phu thuoc external)
