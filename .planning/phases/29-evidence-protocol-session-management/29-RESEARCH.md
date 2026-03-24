# Phase 29: Evidence Protocol & Session Management - Research

**Researched:** 2026-03-24
**Domain:** File-based session management, evidence protocol, YAML frontmatter parsing, pure JS modules
**Confidence:** HIGH

## Summary

Phase 29 xay dung 2 pure JS modules (`session-manager.js` va `evidence-protocol.js`) de chuan hoa cach agents giao tiep qua evidence files va cho phep user tiep tuc phien debug cu. Day la phase noi bo du an, khong phu thuoc thu vien ben ngoai — chi dung Node.js built-in va `parseFrontmatter()` co san trong `bin/lib/utils.js`.

Du an da co pattern pure function rat ro rang tu 14 modules hien tai (resource-config.js, repro-test-generator.js, logic-sync.js, debug-cleanup.js...). Ca 2 modules moi theo cung pattern: KHONG doc file, content truyen qua tham so, return structured object, warnings array cho non-blocking errors. Test framework la `node:test` + `node:assert/strict` voi naming convention `smoke-*.test.js`.

Diem then chot: chuyen tu flat evidence files (`evidence_*.md`) sang session-based folders (`S001-slug/`), cap nhat 5 agent files bo hardcode paths, va tao Resume UI flow dung AskUserQuestion menu. Tat ca decisions da duoc lock trong CONTEXT.md — khong can explore alternatives.

**Primary recommendation:** Tao 2 modules pure function theo dung pattern resource-config.js, viet TDD voi node:test, cap nhat 5 agent files thay paths cu bang huong dan doc tu session dir qua prompt.

<user_constraints>
## User Constraints (tu CONTEXT.md)

### Locked Decisions
- **D-01:** Moi session debug = 1 folder rieng tai `.planning/debug/S{NNN}-{slug}/`. VD: `S001-timeout-api-call/`.
- **D-02:** Session ID format: `S001` + slug (so tang dan + slug tu mo ta loi). De doc, de sort, de hien thi trong Resume UI.
- **D-03:** Moi session folder chua `SESSION.md` (metadata) + cac `evidence_*.md` files.
- **D-04:** SESSION.md co YAML frontmatter day du: id, slug, status (active|paused|resolved), created, updated, outcome (root_cause|checkpoint|inconclusive|null), va Markdown body voi mo ta + Evidence Trail checklist.
- **D-05:** Evidence files co YAML frontmatter (agent, outcome, timestamp, session) + Markdown body. Nhat quan voi SESSION.md, parseable bang parseFrontmatter() co san.
- **D-06:** 3 outcome types chuan: `root_cause`, `checkpoint`, `inconclusive`. Moi outcome co required sections rieng.
- **D-07:** ROOT CAUSE FOUND: 3 sections bat buoc — Nguyen nhan, Bang chung (file:dong cu the), De xuat.
- **D-08:** CHECKPOINT REACHED: 3 sections bat buoc — Tien do dieu tra, Cau hoi cho User, Context cho Agent tiep (files da kiem tra, gia thuyet, evidence key).
- **D-09:** INVESTIGATION INCONCLUSIVE: 2 sections bat buoc — Elimination Log (table: File/Logic | Ket qua | Ghi chu), Huong dieu tra tiep.
- **D-10:** Elimination Log dung format bang Markdown: 3 cot (File/Logic, Ket qua BINH THUONG/NGHI NGO, Ghi chu).
- **D-11:** Orchestrator truyen session dir qua prompt khi spawn agent (prompt injection). Agent doc/ghi evidence tu session dir duoc truyen. KHONG hardcode paths trong agent files.
- **D-12:** Cap nhat 5 agent files trong Phase 29: bo hardcode `.planning/debug/evidence_*.md`, ghi huong dan agent doc tu session dir duoc truyen qua prompt.
- **D-13:** Evidence validation nhe: evidence-protocol.js export validateEvidence(), orchestrator goi sau khi agent ghi. Neu invalid, ghi warning vao SESSION.md va tiep tuc (non-blocking).
- **D-14:** Khi khoi dong pd:fix-bug, dung AskUserQuestion menu hien danh sach sessions active/paused + option "Tao phien moi". Nhat quan voi UX please-done.
- **D-15:** Neu khong co session nao (active/paused), bo qua menu, tao session moi ngay.
- **D-16:** Sessions da resolved KHONG hien trong Resume UI (van nam trong folder de Phase 31 Memory dung).
- **D-17:** Khi user chon tiep tuc session cu: orchestrator doc SESSION.md de biet outcome cuoi cung, tim evidence file cuoi cung co outcome, route theo outcome (root_cause -> Phase 30 choices, checkpoint -> hien cau hoi cho user, inconclusive -> spawn vong dieu tra moi, null/paused -> tiep tu agent cuoi).
- **D-18:** `bin/lib/session-manager.js` — Pure JS module: createSession(), listSessions(), getSession(), updateSession(). Nhat quan voi 12 modules hien tai.
- **D-19:** `bin/lib/evidence-protocol.js` — Pure JS module rieng: validateEvidence(), parseEvidence(), OUTCOME_TYPES, getRequiredSections(). Tach biet concern: session != evidence format.
- **D-20:** Ca 2 modules theo pattern pure function: KHONG doc file, content truyen qua tham so, return structured object.

### Claude's Discretion
- maxTurns cho session-manager va evidence-protocol (hop ly, tinh chinh sau)
- Chi tiet error messages khi validation fail
- Unit test structure cho 2 modules moi
- Slug generation algorithm (tu mo ta loi -> kebab-case)

### Deferred Ideas (NGOAI PHAM VI)
- ROOT CAUSE choices (Sua ngay/Len ke hoach/Tu sua) — Phase 30
- CHECKPOINT flow va Continuation Agent — Phase 30
- Parallel dispatch (Detective + DocSpec song song) — Phase 30
- Bug history recall va regression alerts — Phase 31
- `.planning/bugs/INDEX.md` auto-generation — Phase 31
- Orchestrator workflow loop — Phase 32
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Mo ta | Research Support |
|----|-------|------------------|
| PROT-01 | User thay danh sach phien debug danh so ID khi khoi dong, co the nhap so de tiep tuc hoac mo ta moi de tao session moi | listSessions() tra ve sessions active/paused, sorted by ID. Resume UI dung AskUserQuestion menu. Pattern: resource-config.js constants + pure functions |
| PROT-02 | Moi agent tra ket qua theo 1 trong 3 outcomes chuan: ROOT CAUSE FOUND, CHECKPOINT REACHED, hoac INVESTIGATION INCONCLUSIVE | OUTCOME_TYPES constant + validateEvidence() kiem tra outcome + required sections. Pattern: TIER_MAP trong resource-config.js |
| PROT-05 | Khi INCONCLUSIVE, agent PHAI ghi Elimination Log liet ke files/logic da kiem tra va xac nhan binh thuong | getRequiredSections('inconclusive') tra ve ['Elimination Log', 'Huong dieu tra tiep']. validateEvidence() kiem tra Elimination Log co bang Markdown 3 cot |
| PROT-07 | Evidence file tu agent truoc la input chinh thuc cua agent sau — agent khong doc lai toan bo codebase | Cap nhat 5 agent files: bo hardcode paths, ghi huong dan doc tu session dir. Session dir truyen qua prompt injection |
</phase_requirements>

## Project Constraints (tu CLAUDE.md)

- **Ngon ngu:** Dung tieng Viet toan bo, co dau chuan — ap dung cho comments trong code, error messages, test descriptions
- **Pattern:** Pure function, KHONG doc file, content truyen qua tham so
- **Test:** TDD voi `node:test` + `node:assert/strict`, file naming `smoke-*.test.js`
- **Dependencies:** Zero external dependencies — chi dung Node.js built-in

## Standard Stack

### Core
| Library | Version | Muc dich | Ly do dung |
|---------|---------|----------|------------|
| node:test | Built-in (Node >= 18) | Test runner | Du an dung xuyen suot, 601+ tests hien tai |
| node:assert/strict | Built-in | Assertions | Nhat quan voi moi test file trong du an |
| parseFrontmatter() | utils.js | Parse YAML frontmatter | Co san, da kiem chung, dung cho SESSION.md va evidence files |
| buildFrontmatter() | utils.js | Build YAML frontmatter | Co san, dung de tao content cho SESSION.md |
| assembleMd() | utils.js | Combine frontmatter + body | Co san, tao markdown hoan chinh tu frontmatter object + body string |

### Supporting
| Utility | Vi tri | Muc dich | Khi dung |
|---------|--------|----------|----------|
| parseFrontmatter | bin/lib/utils.js | Parse YAML frontmatter tu markdown | parseEvidence() va getSession() can parse frontmatter |
| buildFrontmatter | bin/lib/utils.js | Rebuild YAML tu object | createSession() va updateSession() can tao markdown output |
| assembleMd | bin/lib/utils.js | Ghep frontmatter + body | Tao SESSION.md va evidence file content hoan chinh |

### Alternatives Considered
| Thay vi | Co the dung | Danh doi |
|---------|-------------|----------|
| Custom YAML parser | js-yaml npm | parseFrontmatter() da du manh, them dependency pha vo pattern zero-dep |
| SQLite session store | Markdown files | Explicitly out of scope — "no build step" pattern |
| JSON metadata | YAML frontmatter | Khong nhat quan voi tat ca existing files trong du an |

## Architecture Patterns

### Recommended Project Structure
```
bin/lib/
  session-manager.js       # Pure JS: createSession, listSessions, getSession, updateSession
  evidence-protocol.js     # Pure JS: validateEvidence, parseEvidence, OUTCOME_TYPES, getRequiredSections
test/
  smoke-session-manager.test.js
  smoke-evidence-protocol.test.js
.claude/agents/
  pd-bug-janitor.md        # Cap nhat: bo hardcode paths
  pd-code-detective.md     # Cap nhat: bo hardcode paths
  pd-doc-specialist.md     # Cap nhat: bo hardcode paths
  pd-repro-engineer.md     # Cap nhat: bo hardcode paths
  pd-fix-architect.md      # Cap nhat: bo hardcode paths
.planning/debug/
  S001-timeout-api-call/   # Session folder mau
    SESSION.md             # Metadata + Evidence Trail
    evidence_janitor.md    # Evidence tu bug-janitor
    evidence_code.md       # Evidence tu code-detective
    evidence_docs.md       # Evidence tu doc-specialist
    evidence_repro.md      # Evidence tu repro-engineer
    evidence_architect.md  # Evidence tu fix-architect
  resolved/                # Giu nguyen folder cu — backward compatible
```

### Pattern 1: Pure Function Module (Tham chieu: resource-config.js)
**What:** Module export pure functions + constants, KHONG doc file, KHONG require('fs')
**When to use:** Moi module moi trong du an
**Example:**
```javascript
// Source: bin/lib/resource-config.js (pattern da xac lap)
'use strict';

// Constants — exported de test co the verify
const OUTCOME_TYPES = {
  root_cause:    { label: 'ROOT CAUSE FOUND',          requiredSections: ['Nguyen nhan', 'Bang chung', 'De xuat'] },
  checkpoint:    { label: 'CHECKPOINT REACHED',         requiredSections: ['Tien do dieu tra', 'Cau hoi cho User', 'Context cho Agent tiep'] },
  inconclusive:  { label: 'INVESTIGATION INCONCLUSIVE', requiredSections: ['Elimination Log', 'Huong dieu tra tiep'] },
};

// Pure function — nhan content string, tra structured object
function validateEvidence(content) {
  if (!content || typeof content !== 'string') {
    throw new Error('validateEvidence: thieu tham so content');
  }
  // ... parse + validate
  return { valid: true, outcome: 'root_cause', warnings: [] };
}

module.exports = { validateEvidence, OUTCOME_TYPES };
```

### Pattern 2: Session ID Generation
**What:** Tao session ID tu danh sach sessions hien co + mo ta loi
**When to use:** createSession()
**Example:**
```javascript
// Slug generation: mo ta loi -> kebab-case, gioi han 40 ky tu
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

// Next session number: tim max hien tai + 1
function nextSessionNumber(existingSessions) {
  if (!existingSessions || existingSessions.length === 0) return 1;
  const maxNum = Math.max(...existingSessions.map(s => s.number));
  return maxNum + 1;
}

// Format: S001, S002, ...
function formatSessionId(num) {
  return `S${String(num).padStart(3, '0')}`;
}
```

### Pattern 3: Non-blocking Validation (Tham chieu: logic-sync.js runLogicSync)
**What:** Validation that cua khi fail — ghi warning thay vi throw
**When to use:** validateEvidence() duoc orchestrator goi sau khi agent ghi evidence
**Example:**
```javascript
// Pattern tu logic-sync.js: non-blocking pipeline
function validateEvidence(content) {
  const warnings = [];
  const { frontmatter, body } = parseFrontmatter(content);

  // Kiem tra outcome
  if (!frontmatter.outcome || !OUTCOME_TYPES[frontmatter.outcome]) {
    warnings.push(`outcome khong hop le: ${frontmatter.outcome || 'thieu'}`);
    return { valid: false, outcome: null, warnings };
  }

  // Kiem tra required sections
  const required = OUTCOME_TYPES[frontmatter.outcome].requiredSections;
  for (const section of required) {
    if (!body.includes(`## ${section}`)) {
      warnings.push(`thieu section: ## ${section}`);
    }
  }

  return {
    valid: warnings.length === 0,
    outcome: frontmatter.outcome,
    warnings,
  };
}
```

### Pattern 4: SESSION.md Format
**What:** YAML frontmatter + Markdown body cho session metadata
**Example:**
```markdown
---
id: S001
slug: timeout-api-call
status: active
created: 2026-03-24T10:00:00+07:00
updated: 2026-03-24T10:30:00+07:00
outcome: null
---

# S001: timeout-api-call

## Mo ta
API call bi timeout sau 30 giay khi goi endpoint /api/users

## Evidence Trail
- [ ] evidence_janitor.md
- [ ] evidence_code.md
- [ ] evidence_docs.md
- [ ] evidence_repro.md
- [ ] evidence_architect.md
```

### Pattern 5: Evidence File Format
**Example:**
```markdown
---
agent: pd-bug-janitor
outcome: inconclusive
timestamp: 2026-03-24T10:15:00+07:00
session: S001
---

## INVESTIGATION INCONCLUSIVE

## Elimination Log

| File/Logic | Ket qua | Ghi chu |
|------------|---------|---------|
| src/api/users.js:45 | BINH THUONG | Timeout config dung 30s |
| src/middleware/auth.js:12 | NGHI NGO | Goi external API khong co timeout |

## Huong dieu tra tiep
- Kiem tra external API response time
- Xac nhan network latency giua services
```

### Anti-Patterns Can Tranh
- **Doc file trong module:** TUYET DOI KHONG — tat ca content truyen qua tham so. Module khong `require('fs')`.
- **Hardcode evidence paths trong agent files:** KHONG — agent nhan session dir qua prompt injection tu orchestrator.
- **Block workflow khi validation fail:** KHONG — validateEvidence() tra warnings, orchestrator ghi warning vao SESSION.md va tiep tuc.
- **Luu tru session state trong memory/DB:** KHONG — dung file-based approach (Markdown + folder structure).
- **Parse frontmatter thu cong:** KHONG — dung parseFrontmatter() co san trong utils.js.

## Don't Hand-Roll

| Van de | Dung tu lam | Dung thay the | Ly do |
|--------|-------------|---------------|-------|
| YAML frontmatter parsing | Regex matching | parseFrontmatter() tu utils.js | Da handle edge cases: arrays, empty values, multiline |
| YAML frontmatter building | String concatenation | buildFrontmatter() tu utils.js | Da handle arrays format, key ordering |
| Markdown assembly | Template literals | assembleMd() tu utils.js | Dam bao `---` separators dung format |
| Session ID padding | Manual string ops | `String(num).padStart(3, '0')` | JavaScript built-in, ro rang, khong loi |

**Key insight:** Du an da co bo cong cu frontmatter parsing/building day du trong utils.js. 2 modules moi chi can goi cac utility nay, khong can viet lai.

## Common Pitfalls

### Pitfall 1: parseFrontmatter() chi parse simple YAML
**What goes wrong:** parseFrontmatter() hien tai chi ho tro key-value pairs va arrays don gian. Nested objects, multiline strings, hoac YAML phuc tap se khong parse dung.
**Why it happens:** Parser tu viet, khong phai full YAML spec.
**How to avoid:** Giu frontmatter cua SESSION.md va evidence files o dang flat key-value. KHONG dung nested objects. VD: `status: active` (OK), `config: { timeout: 30 }` (KHONG OK).
**Warning signs:** Frontmatter tra ve empty object `{}` khi co content.

### Pitfall 2: Session number gap khi co deleted sessions
**What goes wrong:** Neu user xoa session S002, nextSessionNumber() van tra ve S004 (max+1), khong phai S002.
**Why it happens:** Dung max() thay vi tim gap.
**How to avoid:** Luon dung max+1 — gap la chap nhan duoc, dam bao ID luon tang. KHONG reuse IDs.
**Warning signs:** Khong co — day la behavior mong muon.

### Pitfall 3: Slug collision
**What goes wrong:** 2 bugs co mo ta tuong tu tao ra cung slug, dan den folder trung ten.
**Why it happens:** Slug generation loai bo dau tieng Viet va ky tu dac biet.
**How to avoid:** Session ID (S001, S002) la unique identifier, slug chi de doc. Folder name = `S{NNN}-{slug}`, luon unique vi session number khac nhau.
**Warning signs:** mkdir fail vi folder da ton tai.

### Pitfall 4: Agent file update lam hong frontmatter
**What goes wrong:** Khi cap nhat agent files, vo tinh thay doi format frontmatter -> resource-config tests fail.
**Why it happens:** Agent files co frontmatter duoc test trong `smoke-agent-files.test.js`.
**How to avoid:** Chi sua phan `<process>` va `<rules>` body, KHONG sua frontmatter. Chay `node --test test/smoke-agent-files.test.js` sau khi cap nhat.
**Warning signs:** smoke-agent-files.test.js fail.

### Pitfall 5: Elimination Log table format sai
**What goes wrong:** validateEvidence() khong phat hien Elimination Log thieu cot hoac format sai.
**Why it happens:** Validate section heading co the bo qua noi dung table.
**How to avoid:** Sau khi kiem tra `## Elimination Log` ton tai, kiem tra body co `|` characters va it nhat 1 data row (ngoai header va separator).
**Warning signs:** Agent ghi INCONCLUSIVE nhung khong co table data.

### Pitfall 6: Resolved folder co san khong tuong thich
**What goes wrong:** `.planning/debug/resolved/` da co file `gemini-cli-skill-not-found.md` tu v1.x, khong theo session format moi.
**Why it happens:** Du an da dung flat file structure truoc.
**How to avoid:** KHONG di chuyen hoac doi ten files cu. Session system chi quan ly folders bat dau voi `S{NNN}-`. listSessions() chi scan folders match pattern `/^S\d{3}-/`.
**Warning signs:** listSessions() tra ve entries la file, khong phai folder.

## Code Examples

### session-manager.js — API Surface
```javascript
// Source: Pattern tu resource-config.js + CONTEXT.md decisions

'use strict';

// ─── Constants ────────────────────────────────────────────
const SESSION_STATUSES = ['active', 'paused', 'resolved'];
const SESSION_FOLDER_RE = /^S(\d{3})-(.+)$/;

// ─── createSession ────────────────────────────────────────
/**
 * Tao session object moi tu danh sach sessions hien co va mo ta loi.
 *
 * @param {object} params
 * @param {Array<{number: number}>} params.existingSessions - Sessions hien co (de tinh next number)
 * @param {string} params.description - Mo ta loi tu user
 * @returns {{ id: string, slug: string, folderName: string, sessionMd: string }}
 */
function createSession(params) { /* ... */ }

// ─── listSessions ─────────────────────────────────────────
/**
 * Parse danh sach session folders thanh structured list.
 * Chi tra ve sessions match pattern S{NNN}-{slug}.
 *
 * @param {string[]} folderNames - Ten cac folders trong .planning/debug/
 * @param {Array<{folderName: string, sessionMdContent: string}>} sessionData - Content cua moi SESSION.md
 * @returns {Array<{number: number, id: string, slug: string, status: string, outcome: string|null, updated: string}>}
 */
function listSessions(folderNames, sessionData) { /* ... */ }

// ─── getSession ───────────────────────────────────────────
/**
 * Parse SESSION.md content thanh structured session object.
 *
 * @param {string} sessionMdContent - Noi dung SESSION.md
 * @returns {{ id: string, slug: string, status: string, outcome: string|null, created: string, updated: string, evidenceTrail: string[] }}
 */
function getSession(sessionMdContent) { /* ... */ }

// ─── updateSession ────────────────────────────────────────
/**
 * Tao noi dung SESSION.md moi tu session hien tai + updates.
 *
 * @param {string} currentSessionMd - Noi dung SESSION.md hien tai
 * @param {object} updates - { status?, outcome?, appendToBody? }
 * @returns {{ sessionMd: string, warnings: string[] }}
 */
function updateSession(currentSessionMd, updates) { /* ... */ }

module.exports = {
  createSession, listSessions, getSession, updateSession,
  SESSION_STATUSES, SESSION_FOLDER_RE,
};
```

### evidence-protocol.js — API Surface
```javascript
// Source: Pattern tu resource-config.js + CONTEXT.md decisions

'use strict';

// ─── Constants ────────────────────────────────────────────
const OUTCOME_TYPES = {
  root_cause:   { label: 'ROOT CAUSE FOUND',          requiredSections: ['Nguyen nhan', 'Bang chung', 'De xuat'] },
  checkpoint:   { label: 'CHECKPOINT REACHED',         requiredSections: ['Tien do dieu tra', 'Cau hoi cho User', 'Context cho Agent tiep'] },
  inconclusive: { label: 'INVESTIGATION INCONCLUSIVE', requiredSections: ['Elimination Log', 'Huong dieu tra tiep'] },
};

// ─── validateEvidence ─────────────────────────────────────
/**
 * Validate evidence file content. Non-blocking: tra warnings thay vi throw.
 *
 * @param {string} content - Noi dung evidence file (frontmatter + body)
 * @returns {{ valid: boolean, outcome: string|null, agent: string|null, warnings: string[] }}
 */
function validateEvidence(content) { /* ... */ }

// ─── parseEvidence ────────────────────────────────────────
/**
 * Parse evidence file content thanh structured object.
 *
 * @param {string} content - Noi dung evidence file
 * @returns {{ agent: string, outcome: string, timestamp: string, session: string, body: string, sections: object }}
 */
function parseEvidence(content) { /* ... */ }

// ─── getRequiredSections ──────────────────────────────────
/**
 * Tra ve danh sach sections bat buoc cho 1 outcome type.
 *
 * @param {string} outcomeType - 'root_cause', 'checkpoint', hoac 'inconclusive'
 * @returns {string[]}
 */
function getRequiredSections(outcomeType) { /* ... */ }

module.exports = {
  validateEvidence, parseEvidence, getRequiredSections,
  OUTCOME_TYPES,
};
```

### Agent File Update Pattern
```markdown
<!-- TRUOC (hardcode paths) -->
<process>
1. Doc `.planning/debug/evidence_janitor.md` de nam bat trieu chung.
5. Ghi bao cao vao `.planning/debug/evidence_code.md` theo format:
</process>

<!-- SAU (session-based paths) -->
<process>
1. Doc evidence_janitor.md tu session dir duoc truyen qua prompt.
   (Orchestrator se truyen day du duong dan session khi spawn agent.)
5. Ghi bao cao vao evidence_code.md trong session dir, theo format:
   - YAML frontmatter: agent, outcome, timestamp, session
   - Body theo outcome tuong ung (ROOT CAUSE FOUND / CHECKPOINT REACHED / INVESTIGATION INCONCLUSIVE)
</process>
```

## State of the Art

| Cach cu | Cach moi (Phase 29) | Thay doi | Anh huong |
|---------|---------------------|----------|-----------|
| Flat evidence files tai `.planning/debug/` | Session folders `S{NNN}-{slug}/` | Phase 29 | Moi session co folder rieng, khong ghi de nhau |
| Hardcode paths trong agent files | Agent doc tu session dir qua prompt injection | Phase 29 | Agents flexible, khong can sua khi doi structure |
| Khong co validation | validateEvidence() non-blocking | Phase 29 | Phat hien evidence format sai som, khong block workflow |
| Khong co resume | listSessions() + AskUserQuestion menu | Phase 29 | User tiep tuc phien debug cu |

**Backward compatibility:** Folder `resolved/` va file cu van giu nguyen. listSessions() chi scan folders match `S{NNN}-` pattern.

## Open Questions

1. **maxTurns cho session-manager tests**
   - What we know: resource-config tests co ~44 test cases, moi test < 1ms
   - What's unclear: Bao nhieu test cases du cho session-manager va evidence-protocol
   - Recommendation: Claude's discretion — uoc tinh ~30-40 tests moi module (happy path, edge cases, error handling, constants). Tinh chinh khi viet.

2. **Slug generation cho tieng Viet**
   - What we know: Mo ta loi co the bang tieng Viet co dau (VD: "Loi timeout khi goi API")
   - What's unclear: normalize('NFD') + regex co loai bo het dau tieng Viet khong
   - Recommendation: Co — `normalize('NFD')` tach dau thanh combining characters, `/[\u0300-\u036f]/g` xoa chung. VD: "Loi" -> "Loi", "dau" -> "dau". Test voi nhieu truong hop tieng Viet.

3. **Evidence Trail checklist trong SESSION.md**
   - What we know: D-04 noi SESSION.md co Evidence Trail checklist
   - What's unclear: Checklist tu dong update hay manual?
   - Recommendation: updateSession() nhan `appendToBody` string — orchestrator tu build checklist item va truyen vao. Module khong biet ve file system.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | node:test (Node.js built-in) |
| Config file | Khong can — built-in |
| Quick run command | `node --test test/smoke-session-manager.test.js test/smoke-evidence-protocol.test.js` |
| Full suite command | `node --test 'test/*.test.js'` |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| PROT-01 | listSessions() tra ve sessions active/paused, sorted by number | unit | `node --test test/smoke-session-manager.test.js` | Wave 0 |
| PROT-01 | listSessions() KHONG tra ve sessions resolved | unit | `node --test test/smoke-session-manager.test.js` | Wave 0 |
| PROT-01 | createSession() tao ID tang dan + slug | unit | `node --test test/smoke-session-manager.test.js` | Wave 0 |
| PROT-02 | OUTCOME_TYPES co 3 outcomes voi dung required sections | unit | `node --test test/smoke-evidence-protocol.test.js` | Wave 0 |
| PROT-02 | validateEvidence() nhan dien dung outcome type | unit | `node --test test/smoke-evidence-protocol.test.js` | Wave 0 |
| PROT-05 | validateEvidence() kiem tra Elimination Log khi inconclusive | unit | `node --test test/smoke-evidence-protocol.test.js` | Wave 0 |
| PROT-05 | validateEvidence() tra warning khi thieu Elimination Log | unit | `node --test test/smoke-evidence-protocol.test.js` | Wave 0 |
| PROT-07 | Agent files khong con hardcode paths | smoke | `node --test test/smoke-agent-files.test.js` | Co san (cap nhat) |

### Sampling Rate
- **Per task commit:** `node --test test/smoke-session-manager.test.js test/smoke-evidence-protocol.test.js`
- **Per wave merge:** `node --test 'test/*.test.js'`
- **Phase gate:** Full suite green truoc khi verify

### Wave 0 Gaps
- [ ] `test/smoke-session-manager.test.js` — covers PROT-01 (createSession, listSessions, getSession, updateSession)
- [ ] `test/smoke-evidence-protocol.test.js` — covers PROT-02, PROT-05 (validateEvidence, parseEvidence, getRequiredSections, OUTCOME_TYPES)
- [ ] Cap nhat `test/smoke-agent-files.test.js` neu can — covers PROT-07 (verify agent files khong con hardcode paths)

## Environment Availability

Phase nay chi dung Node.js built-in, khong co external dependencies.

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | Module runtime + test | Co | >= 18 (node:test) | -- |
| parseFrontmatter | YAML parsing | Co | bin/lib/utils.js | -- |
| buildFrontmatter | YAML building | Co | bin/lib/utils.js | -- |
| assembleMd | Markdown assembly | Co | bin/lib/utils.js | -- |

**Missing dependencies:** Khong co — tat ca da co san.

## Sources

### Primary (HIGH confidence)
- `bin/lib/resource-config.js` — Pure function module pattern, TIER_MAP/AGENT_REGISTRY constants, export structure
- `bin/lib/utils.js` — parseFrontmatter(), buildFrontmatter(), assembleMd() — verified doc code truc tiep
- `bin/lib/repro-test-generator.js` — Simple pure function pattern, validation style
- `bin/lib/logic-sync.js` — Non-blocking pipeline pattern, warnings array
- `bin/lib/debug-cleanup.js` — scanDebugMarkers pattern, input validation
- `test/smoke-resource-config.test.js` — 44 tests, naming convention, helper pattern (makeParams)
- `test/smoke-repro-test-generator.test.js` — Happy path, template content, sanitization, error handling test groups
- `.claude/agents/*.md` — 5 agent files hien tai voi hardcode paths can cap nhat
- `.planning/debug/` — Structure hien tai: chi co `resolved/` folder voi 1 file cu
- `package.json` — Test script: `node --test 'test/*.test.js'`

### Secondary (MEDIUM confidence)
- `2.1_UPGRADE_DEBUG.md` — Chien luoc tong the, xac nhan Resume UI + 3 outcomes + Elimination Log

### Tertiary (LOW confidence)
- Khong co — tat ca findings tu code truc tiep trong du an.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — du an zero-dep, chi dung Node.js built-in da co san
- Architecture: HIGH — pattern pure function da xac lap qua 14 modules, CONTEXT.md lock tat ca decisions
- Pitfalls: HIGH — dua tren analysis truc tiep cua parseFrontmatter() source code va existing debug structure

**Research date:** 2026-03-24
**Valid until:** Khong gioi han — du an noi bo, khong phu thuoc thu vien ben ngoai co the thay doi
