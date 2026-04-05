# Phase 31: Project Memory & Regression Detection - Research

**Nghien cuu:** 2026-03-25
**Linh vuc:** Bug history storage, keyword matching, regression detection
**Do tin cay:** HIGH

## Tong quan

Phase nay xay dung he thong tri nho du an: luu tru lich su bug trong `.planning/bugs/` duoi dang BUG-{NNN}.md files voi YAML frontmatter, cung cap keyword matching de tim bug tuong tu, canh bao regression khi loi hien tai khop >= 2/3 tieu chi (file, function, error message) voi bug cu, va tu dong tao/cap nhat INDEX.md. Module chinh la `bin/lib/bug-memory.js` — pure function, tach biet concern voi session-manager va evidence-protocol.

Toan bo he thong dua tren Markdown + Grep, khong dung database (SQLite da bi loai tru — xem REQUIREMENTS.md Out of Scope). Pattern nhat quan voi cac module da co: pure function nhan content strings qua tham so, tra structured object voi warnings array, khong doc file truc tiep.

**Khuyen nghi chinh:** Tao module `bug-memory.js` voi 3 ham core — `createBugRecord()`, `searchBugs()`, `buildIndex()` — tuan thu pure function pattern da co. Integration vao pd-bug-janitor (ghi section "Bug tuong tu" trong evidence_janitor.md) va pd-fix-architect (kiem tra fix moi khong pha vo fix cu).

<user_constraints>

## Rang buoc tu User (tu CONTEXT.md)

### Quyet dinh da khoa
- **D-01:** Moi bug = 1 file BUG-{NNN}.md trong `.planning/bugs/`. Ten file theo thu tu tang dan (BUG-001.md, BUG-002.md).
- **D-02:** YAML frontmatter toi thieu: `file`, `function`, `error_message`, `session_id`, `resolved_date`. Body: 1-2 dong mo ta nguyen nhan + fix. Khong bloat.
- **D-03:** Module moi `bin/lib/bug-memory.js` — pure function, tach biet concern voi session-manager va evidence-protocol. Exports: createBugRecord(), searchBugs(), buildIndex().
- **D-04:** 3-field scoring: so khop file path, function name, error message. Moi truong khop = 1 diem. Score >= 2/3 = regression alert (MEM-02).
- **D-05:** Case-insensitive substring matching: file path dung includes(), function dung exact match (case-insensitive), error message dung substring match (case-insensitive).
- **D-06:** Ket qua tim bug tuong tu ghi trong evidence_janitor.md — section "Bug tuong tu". Downstream agents (Detective, Architect) thay qua evidence chain. Khong tao file rieng.
- **D-09:** Bug record tao SAU KHI user verify fix thanh cong (khong phai sau commit). Dam bao chi ghi bug that su da duoc fix.
- **D-10:** INDEX.md tu dong rebuild moi khi tao/cap nhat bug record. buildIndex() generate lai toan bo tu tat ca BUG-*.md files. Luon dong bo.
- **D-11:** Bug records giu nguyen vinh vien trong .planning/bugs/. Khong archive, khong xoa. INDEX.md phan biet resolved/active.

### Claude tu quyet dinh
- Regression alert UX (D-07): blocking vs non-blocking, format hien thi
- Architect double-check approach (D-08): prompt-based vs test-based
- Unit test structure cho bug-memory.js
- Error handling khi .planning/bugs/ chua ton tai (tao tu dong)

### Y tuong hoan lai (NGOAI PHAM VI)
- Agent memory cross-session (MEM-05) — v2.2
- AI-powered bug similarity scoring — Out of Scope (can embedding API)
- Auto-fix tu lich su bug — Out of Scope (nguy hiem)
- Orchestrator workflow loop tong the — Phase 32
- Loop-back khi INCONCLUSIVE — Phase 33

</user_constraints>

<phase_requirements>

## Yeu cau Phase

| ID | Mo ta | Ho tro tu nghien cuu |
|----|-------|----------------------|
| MEM-01 | Janitor luc lai .planning/bugs/ tim bug tuong tu bang keyword matching khi bat dau dieu tra | searchBugs() pure function voi 3-field scoring (D-04, D-05). Janitor agent prompt cap nhat de goi searchBugs va ghi ket qua vao evidence_janitor.md section "Bug tuong tu" (D-06) |
| MEM-02 | Orchestrator canh bao regression khi loi hien tai khop >= 2/3 tieu chi voi bug cu (file, function, error message) | searchBugs() tra ve score cho moi bug. Orchestrator doc evidence_janitor.md, neu co bug score >= 2 thi hien regression alert. UX la Claude's Discretion (D-07) |
| MEM-03 | Architect kiem tra fix moi khong pha vo cac fix cu lien quan truoc khi ra phan quyet | pd-fix-architect.md cap nhat prompt de doc related bugs tu evidence chain. Approach la Claude's Discretion (D-08) — khuyen nghi prompt-based |
| MEM-04 | He thong tu dong tao va cap nhat .planning/bugs/INDEX.md liet ke tat ca bug theo file/function/keyword | buildIndex() pure function nhan array bug records, tra markdown string. Goi moi khi createBugRecord() duoc su dung (D-10) |

</phase_requirements>

## Kien truc va Patterns

### Cau truc thu muc lien quan
```
.planning/
  bugs/
    BUG-001.md          # Bug record dau tien
    BUG-002.md          # Bug record thu hai
    INDEX.md            # Auto-generated, rebuild tu tat ca BUG-*.md
bin/
  lib/
    bug-memory.js       # Module moi — createBugRecord, searchBugs, buildIndex
    utils.js            # parseFrontmatter, assembleMd (da co)
    evidence-protocol.js # Pattern reference (da co)
    session-manager.js   # Pattern reference (da co)
.claude/
  agents/
    pd-bug-janitor.md   # Cap nhat: ghi section "Bug tuong tu"
    pd-fix-architect.md # Cap nhat: doc related bugs
test/
  smoke-bug-memory.test.js  # Tests moi
```

### Pattern 1: Pure Function Module (theo evidence-protocol.js va session-manager.js)
**La gi:** Module JS exports pure functions, KHONG doc file, KHONG require('fs'), content truyen qua tham so, return structured object voi warnings array.
**Khi nao dung:** Moi khi tao module moi trong bin/lib/
**Vi du tham khao:**
```javascript
// Theo pattern tu evidence-protocol.js va session-manager.js
'use strict';

const { parseFrontmatter, assembleMd } = require('./utils');

/**
 * Tao bug record markdown tu thong tin bug.
 * @param {object} params
 * @param {Array<{number: number}>} [params.existingBugs=[]] - Bugs hien co (de tinh NNN tiep theo)
 * @param {string} params.file - File path bi loi
 * @param {string} params.functionName - Function bi loi
 * @param {string} params.errorMessage - Error message
 * @param {string} params.sessionId - Session ID (vd: S001)
 * @param {string} params.rootCause - Mo ta nguyen nhan
 * @param {string} params.fix - Mo ta cach fix
 * @returns {{ id: string, fileName: string, content: string }}
 */
function createBugRecord({ existingBugs = [], file, functionName, errorMessage, sessionId, rootCause, fix } = {}) {
  // Validate required fields
  // Tinh NNN tiep theo (giong nextSessionNumber trong session-manager.js)
  // Tao YAML frontmatter + body
  // Return structured object
}
```

### Pattern 2: 3-Field Keyword Scoring (D-04, D-05)
**La gi:** So khop 3 truong (file, function, error_message) giua loi hien tai va bug cu. Moi truong khop = 1 diem. Score >= 2 = regression alert.
**Chi tiet matching:**
- **file path:** `bugFile.toLowerCase().includes(queryFile.toLowerCase())` hoac nguoc lai — substring match
- **function name:** `bugFunc.toLowerCase() === queryFunc.toLowerCase()` — exact match, case-insensitive
- **error message:** `bugMsg.toLowerCase().includes(queryMsg.toLowerCase())` hoac nguoc lai — substring match
**Khi nao dung:** searchBugs() — Janitor goi khi bat dau dieu tra

```javascript
/**
 * Tim bug tuong tu tu danh sach bug records.
 * @param {object} params
 * @param {Array<{frontmatter: object, body: string}>} params.bugRecords - Parsed bug records
 * @param {string} params.file - File path hien tai
 * @param {string} [params.functionName=''] - Function name hien tai
 * @param {string} [params.errorMessage=''] - Error message hien tai
 * @returns {{ matches: Array<{id: string, score: number, file: string, function: string, error_message: string}>, warnings: string[] }}
 */
function searchBugs({ bugRecords, file, functionName = '', errorMessage = '' } = {}) {
  // Voi moi bug record:
  //   score = 0
  //   if file matches: score++
  //   if function matches: score++
  //   if error_message matches: score++
  //   if score >= 1: them vao matches (sort by score desc)
  // Return matches + warnings
}
```

### Pattern 3: buildIndex() — Full Rebuild
**La gi:** Generate lai INDEX.md toan bo tu tat ca BUG-*.md files. Khong incremental update — luon rebuild (D-10).
**Cau truc INDEX.md:**
```markdown
# Bug Index

**Cap nhat:** 2026-03-25T10:00:00Z
**Tong so:** 5 bugs

## Theo File

| File | Bug IDs | Count |
|------|---------|-------|
| src/api.js | BUG-001, BUG-003 | 2 |
| bin/lib/utils.js | BUG-002 | 1 |

## Theo Function

| Function | Bug IDs | Count |
|----------|---------|-------|
| parseFrontmatter | BUG-002 | 1 |
| handleRequest | BUG-001, BUG-003 | 2 |

## Theo Keyword (Error Message)

| Keyword | Bug IDs | Count |
|---------|---------|-------|
| timeout | BUG-001, BUG-004 | 2 |
| undefined | BUG-002, BUG-005 | 2 |

## Tat ca Bugs

| ID | File | Function | Error | Status | Session | Resolved |
|----|------|----------|-------|--------|---------|----------|
| BUG-001 | src/api.js | handleRequest | timeout error | resolved | S001 | 2026-03-24 |
```

### Pattern 4: BUG-{NNN}.md Format (D-01, D-02)
**La gi:** Moi bug record la 1 file markdown voi YAML frontmatter.
**Format:**
```markdown
---
file: src/api.js
function: handleRequest
error_message: timeout after 30s
session_id: S001
resolved_date: 2026-03-24
status: resolved
---

Nguyen nhan: Request khong co timeout handler, Promise treo vinh vien.
Fix: Them AbortController voi timeout 30s cho moi fetch call.
```

### Anti-Patterns can tranh
- **Doc file trong module:** KHONG require('fs') trong bug-memory.js. Moi file content truyen qua tham so.
- **Incremental index update:** KHONG update tung dong trong INDEX.md. Luon rebuild toan bo (D-10).
- **Reuse bug number:** KHONG tai su dung so thu tu. Luon dung max+1 (theo session-manager.js pattern).
- **Tao bug record tu dong khi fix:** KHONG. Chi tao SAU KHI user verify (D-09).

## Khong Tu Tao

| Van de | Khong tu build | Dung san | Ly do |
|--------|---------------|----------|-------|
| YAML parsing | Custom parser | `parseFrontmatter()` tu utils.js | Da co, da test, project dung chung |
| Markdown assembly | Template string tho | `assembleMd()` tu utils.js | Nhat quan voi session-manager.js |
| Slug generation | Custom slug function | Khong can slug cho bug | Bug dung BUG-{NNN}, khong can slug |
| Regression analysis (dependency) | Custom dependency scanner | `regression-analyzer.js` | Da co, KHAC voi bug history — khong trung lap |

**Nhan xet quan trong:** `regression-analyzer.js` hien tai phan tich dependency/call chain (import graph). Module `bug-memory.js` moi lam viec khac — tim bug tuong tu dua tren keyword matching tu lich su. Hai module khong trung lap va khong can merge.

## Quyet dinh thiet ke (Claude's Discretion)

### D-07: Regression Alert UX
**Khuyen nghi: Non-blocking warning.**
- Ly do: Nhat quan voi pattern `warnings: []` da dung trong evidence-protocol.js va session-manager.js
- searchBugs() tra ve matches voi score. Orchestrator doc evidence_janitor.md, thay section "Bug tuong tu" co bug score >= 2, hien warning.
- Format: Ghi ro trong evidence_janitor.md de downstream agents (Detective, Architect) doc duoc qua evidence chain
- Khong can blocking dialog — Architect la nguoi ra quyet dinh cuoi cung, se doc evidence chain

### D-08: Architect Double-Check Approach
**Khuyen nghi: Prompt-based.**
- Ly do: Phu hop voi do phuc tap hien tai cua project. Auto-test can tao test runner rieng — over-engineering cho v2.1.
- Cach lam: pd-fix-architect.md prompt duoc cap nhat de:
  1. Doc section "Bug tuong tu" tu evidence_janitor.md (hoac evidence chain)
  2. Voi moi related bug co score >= 2: doc BUG-{NNN}.md goc de hieu fix cu
  3. Kiem tra fix moi co conflict voi fix cu khong (logic check, khong phai auto-test)
  4. Ghi ket qua kiem tra vao evidence_architect.md

### Error Handling: .planning/bugs/ chua ton tai
**Khuyen nghi: Guard clause trong orchestrator, khong trong pure function.**
- `bug-memory.js` la pure function — nhan content, khong doc file
- Orchestrator (ben ngoai module) kiem tra `.planning/bugs/` ton tai chua, tao neu chua co
- searchBugs() nhan array rong → tra matches rong, khong loi
- createBugRecord() nhan existingBugs rong → tra BUG-001

## Bay loi thuong gap

### Bay 1: Bug number khong tang dan
**Sai gi:** Dem file trong folder de tinh so tiep theo, nhung co the bi gap (xoa file, rename).
**Nguyen nhan:** Logic dem khong robust.
**Tranh cach nao:** Dung max+1 pattern giong session-manager.js — scan tat ca BUG-*.md, lay so lon nhat, +1. Khong bao gio reuse.
**Dau hieu nhan biet:** 2 bug files cung so, hoac so nhay loi.

### Bay 2: Matching qua rong hoac qua hep
**Sai gi:** substring match "api" khop voi moi file co "api" trong ten → false positives. Hoac exact match tren file path → false negatives.
**Nguyen nhan:** Khong can bang giua precision va recall.
**Tranh cach nao:** D-05 da dinh ro: file path dung includes() (rong de bat), function dung exact match (chat de tranh false positive), error message dung substring. Score >= 2 moi alert — 1 truong khop chua du.
**Dau hieu nhan biet:** Qua nhieu false alerts (score 1 khap noi) hoac khong bao gio alert (match qua chat).

### Bay 3: INDEX.md bi desync
**Sai gi:** INDEX.md khong phan anh dung trang thai thuc cua bugs/ folder.
**Nguyen nhan:** Update incremental bo sot truong hop edge case.
**Tranh cach nao:** D-10 da giai quyet — luon full rebuild. buildIndex() nhan toan bo bug records, generate lai toan bo INDEX.md. Chi phi rebuild thap (text processing, khong phai database query).
**Dau hieu nhan biet:** INDEX.md thieu bug ID ma file BUG-*.md van ton tai.

### Bay 4: YAML frontmatter khong parse duoc
**Sai gi:** parseFrontmatter() tra ve frontmatter rong vi format YAML sai.
**Nguyen nhan:** Tao bug record voi format khong chuan (thieu ---, sai indent).
**Tranh cach nao:** createBugRecord() dung assembleMd() de dam bao format chuan. searchBugs() co warnings array de bao loi parse.
**Dau hieu nhan biet:** Bug record co nhung searchBugs() khong tim thay.

### Bay 5: Ghi bug truoc khi verify
**Sai gi:** Tao BUG record ngay sau commit, nhung user chua verify fix dung.
**Nguyen nhan:** Khong tuan thu D-09.
**Tranh cach nao:** createBugRecord() chi duoc goi SAU KHI user verify pass. Orchestrator kiem soat thoi diem goi. Module khong tu quyet dinh thoi diem.
**Dau hieu nhan biet:** Bug records ghi fix khong chinh xac vi fix chua duoc kiem chung.

## Vi du Code

### createBugRecord() — API surface
```javascript
// Source: theo pattern session-manager.js createSession()
function createBugRecord({ existingBugs = [], file, functionName, errorMessage, sessionId, rootCause, fix } = {}) {
  if (!file || typeof file !== 'string' || file.trim() === '') {
    throw new Error('createBugRecord: thieu tham so file');
  }
  if (!rootCause || typeof rootCause !== 'string') {
    throw new Error('createBugRecord: thieu tham so rootCause');
  }

  const num = nextBugNumber(existingBugs);
  const id = `BUG-${String(num).padStart(3, '0')}`;
  const fileName = `${id}.md`;
  const now = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

  const frontmatter = {
    file: file.trim(),
    function: (functionName || '').trim(),
    error_message: (errorMessage || '').trim(),
    session_id: (sessionId || '').trim(),
    resolved_date: now,
    status: 'resolved',
  };

  const body = `\n${rootCause.trim()}\n${fix ? fix.trim() : ''}\n`;
  const content = assembleMd(frontmatter, body);

  return { id, fileName, content, number: num };
}
```

### searchBugs() — API surface
```javascript
// Source: theo D-04, D-05 tu CONTEXT.md
function searchBugs({ bugRecords = [], file = '', functionName = '', errorMessage = '' } = {}) {
  if (!file && !functionName && !errorMessage) {
    return { matches: [], warnings: ['thieu tat ca tieu chi tim kiem'] };
  }

  const warnings = [];
  const matches = [];

  for (const record of bugRecords) {
    if (!record || !record.frontmatter) {
      warnings.push('bug record khong co frontmatter');
      continue;
    }

    const fm = record.frontmatter;
    let score = 0;

    // File path: case-insensitive substring match (ca 2 chieu)
    if (file && fm.file) {
      const f1 = file.toLowerCase();
      const f2 = fm.file.toLowerCase();
      if (f1.includes(f2) || f2.includes(f1)) score++;
    }

    // Function: case-insensitive exact match
    if (functionName && fm.function) {
      if (functionName.toLowerCase() === fm.function.toLowerCase()) score++;
    }

    // Error message: case-insensitive substring match (ca 2 chieu)
    if (errorMessage && fm.error_message) {
      const e1 = errorMessage.toLowerCase();
      const e2 = fm.error_message.toLowerCase();
      if (e1.includes(e2) || e2.includes(e1)) score++;
    }

    if (score >= 1) {
      matches.push({
        id: record.id || 'UNKNOWN',
        score,
        file: fm.file || '',
        function: fm.function || '',
        error_message: fm.error_message || '',
      });
    }
  }

  // Sort score giam dan
  matches.sort((a, b) => b.score - a.score);

  return { matches, warnings };
}
```

### buildIndex() — API surface
```javascript
// Source: theo D-10, D-11 tu CONTEXT.md
function buildIndex(bugRecords = []) {
  if (bugRecords.length === 0) {
    return '# Bug Index\n\n**Cap nhat:** ' + new Date().toISOString() + '\n**Tong so:** 0 bugs\n';
  }

  // Group by file
  const byFile = {};
  // Group by function
  const byFunction = {};
  // All bugs table
  const allBugs = [];

  for (const record of bugRecords) {
    const fm = record.frontmatter || {};
    const id = record.id || 'UNKNOWN';

    // By file
    const file = fm.file || 'unknown';
    (byFile[file] = byFile[file] || []).push(id);

    // By function
    const func = fm.function || '';
    if (func) {
      (byFunction[func] = byFunction[func] || []).push(id);
    }

    // All bugs
    allBugs.push({
      id, file, function: func,
      error: fm.error_message || '',
      status: fm.status || 'resolved',
      session: fm.session_id || '',
      resolved: fm.resolved_date || '',
    });
  }

  // Generate markdown sections...
  // Return complete INDEX.md content string
}
```

## Trang thai hien tai cua codebase

| Yeu to | Trang thai cu | Trang thai moi (Phase 31) | Anh huong |
|--------|---------------|--------------------------|-----------|
| `.planning/bugs/` | Chua ton tai | Tao moi, chua BUG-*.md va INDEX.md | Folder moi |
| `bug-memory.js` | Chua ton tai | Module moi, 3 exports | File moi |
| `pd-bug-janitor.md` | Co process buoc 2 nhac tim bugs/ | Cap nhat chi tiet hon: ghi section "Bug tuong tu" | Cap nhat file hien co |
| `pd-fix-architect.md` | Co rules "kiem tra regression" | Cap nhat: doc related bugs tu evidence chain | Cap nhat file hien co |
| `utils.js` | parseFrontmatter, assembleMd | Khong thay doi — chi reuse | Khong anh huong |
| `regression-analyzer.js` | Phan tich dependency graph | Khong thay doi — khac concern | Khong anh huong |

## Validation Architecture

### Test Framework
| Thuoc tinh | Gia tri |
|------------|---------|
| Framework | node:test (built-in, khong dependency) |
| Config file | Khong co file config rieng — dung `node --test` |
| Lenh chay nhanh | `node --test test/smoke-bug-memory.test.js` |
| Lenh chay toan bo | `node --test 'test/*.test.js'` |

### Yeu cau Phase -> Test Map
| Req ID | Hanh vi | Loai test | Lenh tu dong | File ton tai? |
|--------|---------|-----------|-------------|--------------|
| MEM-01 | searchBugs() tim bug tuong tu bang keyword matching | unit | `node --test test/smoke-bug-memory.test.js` | Chua — Wave 0 |
| MEM-02 | searchBugs() tra ve score >= 2 cho regression matches | unit | `node --test test/smoke-bug-memory.test.js` | Chua — Wave 0 |
| MEM-03 | Agent prompt integration (manual verify) | manual | N/A — verify agent prompt text | Khong can test file |
| MEM-04 | buildIndex() tao INDEX.md dung format | unit | `node --test test/smoke-bug-memory.test.js` | Chua — Wave 0 |

### Sampling Rate
- **Moi task commit:** `node --test test/smoke-bug-memory.test.js`
- **Moi wave merge:** `node --test 'test/*.test.js'`
- **Phase gate:** Toan bo test suite xanh truoc verify

### Wave 0 Gaps
- [ ] `test/smoke-bug-memory.test.js` — covers MEM-01, MEM-02, MEM-04
- [ ] Khong can conftest (node:test khong dung fixtures chung)
- [ ] Framework da co san (node:test built-in)

## Nguon tham khao

### Chinh (Do tin cay CAO)
- `bin/lib/evidence-protocol.js` — pattern reference: pure function, warnings array, parseFrontmatter
- `bin/lib/session-manager.js` — pattern reference: createSession, nextSessionNumber, folder-based storage
- `bin/lib/resource-config.js` — pattern reference: module moi nhat, pure function
- `bin/lib/utils.js` — parseFrontmatter(), assembleMd(), buildFrontmatter()
- `bin/lib/regression-analyzer.js` — xac nhan KHAC concern (dependency graph vs bug history)
- `.claude/agents/pd-bug-janitor.md` — agent hien tai, buoc 2 da nhac tim .planning/bugs/
- `.claude/agents/pd-fix-architect.md` — agent hien tai, rules nhac kiem tra regression
- `test/smoke-evidence-protocol.test.js` — test pattern reference: node:test, describe/it, assert.strict
- `test/smoke-session-manager.test.js` — test pattern reference: helper functions tao test data

### Phu (Do tin cay TRUNG BINH)
- `2.1_UPGRADE_DEBUG.md` Section 2.5 — chien luoc tong the project memory
- `.planning/REQUIREMENTS.md` — MEM-01 den MEM-04

## Metadata

**Phan tich do tin cay:**
- Standard stack: CAO — dung hoan toan cac module va pattern da co trong project, khong them dependency moi
- Kien truc: CAO — pure function pattern da duoc chung minh qua 5+ modules (evidence-protocol, session-manager, resource-config, logic-sync, regression-analyzer)
- Bay loi: CAO — dua tren kinh nghiem thuc te tu session-manager.js (nextSessionNumber anti-reuse) va evidence-protocol.js (non-blocking warnings)

**Ngay nghien cuu:** 2026-03-25
**Hieu luc den:** 2026-04-25 (stable — khong co thu vien ngoai thay doi)
