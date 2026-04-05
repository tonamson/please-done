# Phase 49: Session Delta - Research

**Researched:** 2026-03-26
**Domain:** Delta-aware audit scanning, git diff integration, evidence parsing/append
**Confidence:** HIGH

## Summary

Phase 49 thay the stub B2 trong `workflows/audit.md` bang logic delta-aware thuc su. Module moi `bin/lib/session-delta.js` la pure function (nhat quan voi smart-selection.js, evidence-protocol.js) nhan evidence cu + danh sach changed files, phan loai tung ham thanh SKIP / RE-SCAN / NEW / KNOWN-UNFIXED. Workflow caller (B2) chiu trach nhiem doc evidence file, chay git diff, va truyen du lieu vao.

Ky thuat cot loi: (1) parse Function Checklist table tu evidence_sec_*.md bang regex markdown table, (2) so sanh danh sach files doi tu `git diff --name-only {sha}..HEAD` voi file path trong checklist, (3) luu commit SHA vao YAML frontmatter de lam moc cho lan audit sau, (4) append Audit History table cuoi evidence file.

**Primary recommendation:** Tao session-delta.js voi 3 pure functions: `classifyDelta()` (phan loai), `appendAuditHistory()` (tao dong history moi), `parseAuditHistory()` (doc history cu). Cap nhat B2 trong workflow goi cac functions nay.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** Ham FLAG (nghi ngo) + code KHONG doi -> KNOWN-UNFIXED (skip). Giu ket qua cu trong bao cao, khong quet lai
- **D-02:** Ham PASS + code DA DOI (git diff) -> RE-SCAN. Day la yeu cau chinh cua DELTA-02
- **D-03:** Ham MOI (co trong code hien tai nhung khong co trong evidence cu) -> NEW (scan). Chua duoc kiem tra bao mat lan nao
- **D-04:** Ham PASS + code KHONG doi -> SKIP. An toan, bo qua hoan toan
- **D-05:** Ham FAIL + code KHONG doi -> KNOWN-UNFIXED. Van loi, ghi trong bao cao nhung khong quet lai
- **D-06:** Ham SKIP (khong lien quan category) + code KHONG doi -> giu SKIP
- **D-07:** Moc so sanh: commit SHA cua phien audit cuoi cung. Luu commit SHA vao evidence file khi audit. Lan sau diff tu SHA do den HEAD
- **D-08:** Granularity: file-level. `git diff --name-only {old_sha}..HEAD` -> danh sach files doi. Neu file doi, TAT CA ham trong file do duoc RE-SCAN
- **D-09:** Khong co evidence cu (lan dau hoac bi xoa) -> treat nhu full scan. Moi ham la NEW
- **D-10:** Append section `## Audit History` cuoi moi evidence_sec_*.md. Moi phien them 1 dong vao table
- **D-11:** 4 cot: Date (ISO) | Commit (7-char SHA) | Verdict (PASS/FLAG/FAIL count) | Delta (N new, M re-scan, K skip)
- **D-12:** Parse bang regex markdown table — nhat quan voi cach parse evidence hien tai
- **D-13:** Tao file moi `bin/lib/session-delta.js` — pure function, khong doc file, khong require('fs'). Nhat quan voi smart-selection.js (Phase 48)
- **D-14:** Function chinh: `classifyDelta(oldEvidence, changedFiles)` — nhan noi dung evidence cu (string) + danh sach files doi (string[]). Tra ve `{ functions: Map<name, {status, reason}>, summary: {skip, rescan, new, knownUnfixed} }`
- **D-15:** Workflow B2 (caller) chiu trach nhiem: doc evidence file, chay `git diff --name-only`, truyen vao classifyDelta()

### Claude's Discretion
- Thiet ke API bo sung ngoai classifyDelta: appendAuditHistory(), parseAuditHistory(), hoac cac helper khac
- Chi tiet regex patterns de parse function checklist va audit history table
- Cach luu commit SHA vao evidence (frontmatter hay section rieng)
- Logic xu ly edge cases: file bi rename, file bi xoa, merge conflicts

### Deferred Ideas (OUT OF SCOPE)
- Function-level diff granularity (chi scan ham bi sua, khong phai ca file) — co the nang cap sau neu file-level qua rong
- Git tag tu dong (pd-audit-*) sau moi audit — huu ich nhung tao nhieu tags
- --re-verify-all flag de scan lai tat ca FLAG cu mac du code khong doi — edge case, co the them sau
- Delta-aware cho reporter (chi update phan thay doi trong SECURITY_REPORT.md) — scope Phase 49 chi la scanner delta
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| DELTA-01 | Doc evidence cu, phan loai KNOWN-UNFIXED (skip) / RE-VERIFY (scan lai) / NEW | classifyDelta() parse Function Checklist table, ap dung D-01 den D-06 classification rules |
| DELTA-02 | Git diff scope — ham da PASS + code doi -> RE-SCAN, khong doi -> SKIP | changedFiles parameter tu `git diff --name-only`, file-level match voi Function Checklist file column |
| DELTA-03 | Audit history append-only table cuoi evidence file | appendAuditHistory() tao markdown table row, parseAuditHistory() doc table cu |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Node.js built-in `node:test` | 24.x | Test framework | Da dung trong toan bo project (28+ test files) |
| Node.js built-in `node:assert/strict` | 24.x | Assertions | Nhat quan voi test suite hien tai |
| git CLI | 2.43.0 | Diff engine | `git diff --name-only` — caller chay, khong phai module |

### Supporting
Khong co thu vien ngoai nao can them. Tat ca logic la string parsing voi regex.

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Regex parse markdown table | Markdown parser (remark) | Over-engineering cho pipe-delimited table. Regex don gian, nhat quan voi codebase |
| YAML frontmatter manual parse | js-yaml | parseFrontmatter() tu utils.js da lam tot viec nay, khong can them dep |

## Architecture Patterns

### Recommended Project Structure
```
bin/lib/
  session-delta.js       # NEW — pure functions: classifyDelta, appendAuditHistory, parseAuditHistory
  smart-selection.js     # EXISTING — pattern tham khao
  evidence-protocol.js   # EXISTING — parseEvidence, parseFrontmatter co the tai dung
  parallel-dispatch.js   # EXISTING — buildScannerPlan, evidence_sec_* naming
test/
  smoke-session-delta.test.js  # NEW — smoke tests
workflows/
  audit.md               # UPDATE — B2 stub -> delta logic thuc
```

### Pattern 1: Pure Function Module (tu smart-selection.js)
**What:** Module export pure functions, KHONG require('fs'), KHONG doc file. Caller truyen string content + structured data vao.
**When to use:** Tat ca modules trong bin/lib/
**Example:**
```javascript
// Source: bin/lib/smart-selection.js (pattern hien tai)
'use strict';

// Constants o dau file
const DELTA_STATUS = { SKIP: 'SKIP', RESCAN: 'RE-SCAN', NEW: 'NEW', KNOWN_UNFIXED: 'KNOWN-UNFIXED' };

/**
 * JSDoc chi tiet voi @param va @returns
 * @param {string} oldEvidence - Noi dung evidence file cu (full string)
 * @param {string[]} changedFiles - Danh sach file da doi tu git diff
 * @returns {{ functions: Map<string, {status: string, reason: string}>, summary: {skip: number, rescan: number, new: number, knownUnfixed: number} }}
 */
function classifyDelta(oldEvidence, changedFiles) {
  // ...
}

module.exports = { classifyDelta, appendAuditHistory, parseAuditHistory, DELTA_STATUS };
```

### Pattern 2: Function Checklist Table Parse
**What:** Parse markdown pipe-delimited table tu section `## Function Checklist` trong evidence file
**When to use:** classifyDelta() can extract tung ham + verdict + file path tu evidence cu
**Example:**
```javascript
// Format evidence_sec_*.md Function Checklist (tu pd-sec-scanner.md):
// | # | File | Ham | Dong | Verdict | Chi tiet |
// |---|------|-----|------|---------|----------|
// | 1 | src/api/users.js | getUserById | 42 | FLAG | IDOR |

function parseFunctionChecklist(evidenceContent) {
  // Tim section ## Function Checklist
  const sectionMatch = evidenceContent.match(
    /## Function Checklist\s*\n([\s\S]*?)(?=\n## |\s*$)/
  );
  if (!sectionMatch) return [];

  const lines = sectionMatch[1].split('\n');
  const functions = [];

  for (const line of lines) {
    // Bo qua header row va separator row
    if (!line.includes('|') || line.match(/^\s*\|[\s-|]+\|$/)) continue;

    const cols = line.split('|').map(c => c.trim()).filter(Boolean);
    if (cols.length >= 5) {
      functions.push({
        file: cols[1],       // File path
        name: cols[2],       // Function name
        line: cols[3],       // Line number
        verdict: cols[4],    // PASS/FLAG/FAIL/SKIP
        detail: cols[5] || '',
      });
    }
  }
  return functions;
}
```

### Pattern 3: Commit SHA trong YAML Frontmatter
**What:** Luu commit SHA vao frontmatter evidence file de lam moc diff lan sau
**When to use:** Khi tao/cap nhat evidence file sau moi audit session
**Example:**
```yaml
---
agent: pd-sec-scanner
category: xss
outcome: vulnerabilities_found
timestamp: 2026-03-26T10:00:00+07:00
session: abc123
commit_sha: a1b2c3d
---
```
**Rationale:** Frontmatter da duoc parseFrontmatter() ho tro. Them truong `commit_sha` tu nhien, khong can section rieng. Workflow B2 goi `git rev-parse --short HEAD` de lay SHA truoc khi ghi evidence.

### Pattern 4: Audit History Append Table
**What:** Append-only markdown table cuoi evidence file
**When to use:** Sau moi audit session, them 1 dong vao Audit History
**Example:**
```markdown
## Audit History

| Date | Commit | Verdict | Delta |
|------|--------|---------|-------|
| 2026-03-25 | a1b2c3d | 3 PASS, 1 FLAG, 0 FAIL | 4 new, 0 re-scan, 0 skip |
| 2026-03-26 | e4f5g6h | 3 PASS, 0 FLAG, 0 FAIL | 0 new, 1 re-scan, 3 skip |
```

### Anti-Patterns to Avoid
- **Require('fs') trong module:** Tat ca bin/lib/ modules la pure functions. Workflow caller doc/ghi file
- **Hardcode evidence file names:** Dung pattern `evidence_sec_*.md` tu parallel-dispatch.js (line 135)
- **Parse YAML thu cong:** Dung parseFrontmatter() tu utils.js, da duoc test ky
- **Truyen Map qua JSON:** Map khong serialize thanh JSON. classifyDelta() tra ve Map nhung caller co the convert bang Object.fromEntries() neu can

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| YAML frontmatter parse | Tu viet regex parse | `parseFrontmatter()` tu `bin/lib/utils.js` | Da test, handle edge cases |
| Evidence file parse | Tu viet full parser | `parseEvidence()` tu `evidence-protocol.js` | Tra ve frontmatter + sections structured |
| Scanner plan naming | Tu generate evidence_sec_*.md names | `buildScannerPlan()` output pattern | Naming convention nhat quan |

**Key insight:** Evidence format da duoc chuan hoa qua Phase 46-48. Session delta chi can PARSE format do, khong tao format moi.

## Common Pitfalls

### Pitfall 1: Markdown Table Separator Row Matched as Data
**What goes wrong:** Regex bat nham dong `|---|------|-----|` la data row
**Why it happens:** Moi dong co `|` nhu data rows
**How to avoid:** Them check `line.match(/^\s*\|[\s-|]+\|$/)` de loai separator rows. Hoac kiem tra column count + content co phai dashes khong
**Warning signs:** Function checklist tra ve row voi file = "---"

### Pitfall 2: Evidence File Chua Co Function Checklist
**What goes wrong:** Evidence tu Phase 46-47 (truoc khi D-07/D-08 Phase 48 them Function Checklist) khong co section `## Function Checklist`
**Why it happens:** Backward compatibility — evidence cu format khac
**How to avoid:** classifyDelta() return empty functions Map + treat nhu full scan (D-09) khi khong tim thay Function Checklist section
**Warning signs:** parseFunctionChecklist() tra ve mang rong

### Pitfall 3: File Path Mismatch giua Git Diff va Evidence
**What goes wrong:** git diff tra ve `src/api/users.js` nhung evidence ghi `./src/api/users.js` hoac `src\\api\\users.js`
**Why it happens:** Path format khac nhau giua git output va file paths trong evidence
**How to avoid:** Normalize paths: strip leading `./`, replace `\\` thanh `/` truoc khi so sanh
**Warning signs:** Ham co file doi nhung van bi SKIP vi path khong match

### Pitfall 4: Commit SHA khong hop le
**What goes wrong:** evidence cu co commit_sha = undefined hoac SHA da bi rebase/force-push mat
**Why it happens:** Lan audit dau chua co SHA, hoac git history bi rewrite
**How to avoid:** Khi commit_sha khong co hoac `git cat-file -t {sha}` fail -> treat nhu full scan (D-09). classifyDelta() khong can kiem tra SHA validity (workflow caller lam)
**Warning signs:** git diff fail voi "fatal: bad object"

### Pitfall 5: Map Key Collision
**What goes wrong:** 2 ham trung ten (cung ten nhung khac file) bi ghi de trong Map
**Why it happens:** Dung function name lam key thay vi file+function compound key
**How to avoid:** Map key = `${file}::${functionName}` — compound key dam bao unique
**Warning signs:** Summary counts khong khop voi so ham trong evidence

### Pitfall 6: Audit History Table Parsing Fragile
**What goes wrong:** appendAuditHistory() ghi dong moi o vi tri sai (truoc table header, sau EOF)
**Why it happens:** Regex tim section `## Audit History` nhung khong handle case section chua ton tai
**How to avoid:** 2 branches: (a) co section -> tim cuoi table, insert dong moi, (b) chua co section -> append section + header + dong dau tien cuoi file

## Code Examples

### classifyDelta() — Logic phan loai chinh

```javascript
// Source: Design tu D-01 den D-06, nhat quan voi smart-selection.js pattern
function classifyDelta(oldEvidence, changedFiles) {
  if (!oldEvidence || typeof oldEvidence !== 'string' || oldEvidence.trim() === '') {
    // D-09: khong co evidence cu -> full scan
    return { functions: new Map(), summary: { skip: 0, rescan: 0, new: 0, knownUnfixed: 0 }, isFullScan: true };
  }

  const checklist = parseFunctionChecklist(oldEvidence);
  if (checklist.length === 0) {
    // Khong co Function Checklist -> treat nhu full scan
    return { functions: new Map(), summary: { skip: 0, rescan: 0, new: 0, knownUnfixed: 0 }, isFullScan: true };
  }

  const changedSet = new Set(changedFiles.map(f => normalizePath(f)));
  const functions = new Map();
  const summary = { skip: 0, rescan: 0, new: 0, knownUnfixed: 0 };

  for (const fn of checklist) {
    const key = `${fn.file}::${fn.name}`;
    const fileChanged = changedSet.has(normalizePath(fn.file));
    const verdict = fn.verdict.toUpperCase();

    if (verdict === 'PASS' && !fileChanged) {
      // D-04: PASS + khong doi -> SKIP
      functions.set(key, { status: 'SKIP', reason: 'PASS truoc, code khong doi' });
      summary.skip++;
    } else if (verdict === 'PASS' && fileChanged) {
      // D-02: PASS + doi -> RE-SCAN
      functions.set(key, { status: 'RE-SCAN', reason: 'PASS truoc, code da doi' });
      summary.rescan++;
    } else if (verdict === 'FLAG' && !fileChanged) {
      // D-01: FLAG + khong doi -> KNOWN-UNFIXED
      functions.set(key, { status: 'KNOWN-UNFIXED', reason: 'FLAG truoc, code khong doi' });
      summary.knownUnfixed++;
    } else if (verdict === 'FLAG' && fileChanged) {
      // FLAG + doi -> RE-SCAN (co the da fix)
      functions.set(key, { status: 'RE-SCAN', reason: 'FLAG truoc, code da doi — can kiem tra lai' });
      summary.rescan++;
    } else if (verdict === 'FAIL' && !fileChanged) {
      // D-05: FAIL + khong doi -> KNOWN-UNFIXED
      functions.set(key, { status: 'KNOWN-UNFIXED', reason: 'FAIL truoc, code khong doi' });
      summary.knownUnfixed++;
    } else if (verdict === 'FAIL' && fileChanged) {
      // FAIL + doi -> RE-SCAN (co the da fix)
      functions.set(key, { status: 'RE-SCAN', reason: 'FAIL truoc, code da doi — can kiem tra lai' });
      summary.rescan++;
    } else if (verdict === 'SKIP') {
      // D-06: SKIP (khong lien quan) -> giu SKIP
      functions.set(key, { status: 'SKIP', reason: 'Khong lien quan category' });
      summary.skip++;
    }
  }

  return { functions, summary, isFullScan: false };
}
```

### appendAuditHistory() — Tao dong history moi

```javascript
// Source: D-10, D-11 format
function appendAuditHistory(evidenceContent, auditEntry) {
  const { date, commit, verdictSummary, deltaSummary } = auditEntry;
  // verdictSummary: "3 PASS, 1 FLAG, 0 FAIL"
  // deltaSummary: "2 new, 1 re-scan, 4 skip"

  const newRow = `| ${date} | ${commit} | ${verdictSummary} | ${deltaSummary} |`;

  const historySection = evidenceContent.match(/## Audit History\s*\n/);
  if (historySection) {
    // Append row cuoi table hien tai
    // Tim vi tri cuoi cung cua table (dong cuoi co |)
    const lines = evidenceContent.split('\n');
    let lastTableLine = -1;
    let inHistory = false;
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].match(/^## Audit History/)) inHistory = true;
      if (inHistory && lines[i].includes('|')) lastTableLine = i;
      if (inHistory && lines[i].match(/^## /) && !lines[i].match(/^## Audit History/)) break;
    }
    if (lastTableLine >= 0) {
      lines.splice(lastTableLine + 1, 0, newRow);
      return lines.join('\n');
    }
  }

  // Chua co section -> append cuoi file
  const table = `\n## Audit History\n\n| Date | Commit | Verdict | Delta |\n|------|--------|---------|-------|\n${newRow}\n`;
  return evidenceContent.trimEnd() + '\n' + table;
}
```

### Workflow B2 Update — Caller Logic

```markdown
## Buoc 2: Delta-aware

1. Voi moi evidence file cu evidence_sec_*.md trong output_dir:
   a. Doc noi dung file bang Read
   b. Parse frontmatter lay commit_sha (parseFrontmatter tu utils.js)
   c. Neu co commit_sha:
      - Chay: git diff --name-only {commit_sha}..HEAD
      - Truyen vao classifyDelta(evidenceContent, changedFiles)
   d. Neu KHONG co commit_sha (lan dau):
      - classifyDelta('', []) -> isFullScan = true
   e. Luu classification result de truyen cho B5 (dispatch)

2. Sau dispatch (B5), voi moi evidence moi:
   a. Ghi commit_sha = git rev-parse --short HEAD vao frontmatter
   b. Goi appendAuditHistory(newContent, auditEntry) de them dong history
   c. Ghi file evidence ra output_dir
```

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Node.js built-in test runner (node:test) |
| Config file | Khong co config rieng — chay truc tiep `node --test` |
| Quick run command | `node --test test/smoke-session-delta.test.js` |
| Full suite command | `npm test` |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| DELTA-01 | classifyDelta phan loai dung 6 truong hop (D-01 den D-06) | unit | `node --test test/smoke-session-delta.test.js` | Wave 0 |
| DELTA-01 | parseFunctionChecklist extract dung tu evidence string | unit | `node --test test/smoke-session-delta.test.js` | Wave 0 |
| DELTA-01 | Khong co evidence cu -> isFullScan = true | unit | `node --test test/smoke-session-delta.test.js` | Wave 0 |
| DELTA-02 | changedFiles match voi file column trong checklist | unit | `node --test test/smoke-session-delta.test.js` | Wave 0 |
| DELTA-02 | Path normalization (strip ./, normalize separators) | unit | `node --test test/smoke-session-delta.test.js` | Wave 0 |
| DELTA-03 | appendAuditHistory tao dong moi dung format | unit | `node --test test/smoke-session-delta.test.js` | Wave 0 |
| DELTA-03 | appendAuditHistory tao section moi khi chua co | unit | `node --test test/smoke-session-delta.test.js` | Wave 0 |
| DELTA-03 | parseAuditHistory doc history cu chinh xac | unit | `node --test test/smoke-session-delta.test.js` | Wave 0 |

### Sampling Rate
- **Per task commit:** `node --test test/smoke-session-delta.test.js`
- **Per wave merge:** `npm test`
- **Phase gate:** Full suite green truoc /gsd:verify-work

### Wave 0 Gaps
- [ ] `test/smoke-session-delta.test.js` — covers DELTA-01, DELTA-02, DELTA-03 voi fixture evidence strings
- Framework install: khong can — da co san `node:test`

## Open Questions

1. **FLAG + code DA DOI -> RE-SCAN hay KNOWN-UNFIXED?**
   - What we know: D-01 chi noi "FLAG + code KHONG doi -> KNOWN-UNFIXED". Khong co rule cho FLAG + code DOI
   - What's unclear: Nguoi dung co muon re-scan FLAG cu khi code doi khong?
   - Recommendation: RE-SCAN — vi code da doi, co the da fix issue. Nhat quan voi logic FAIL + code doi = RE-SCAN. Planner nen confirm

2. **FAIL + code DA DOI -> RE-SCAN?**
   - What we know: D-05 chi noi "FAIL + code KHONG doi -> KNOWN-UNFIXED"
   - Recommendation: RE-SCAN — logic tuong tu FLAG + code doi. Da phan anh trong code example

3. **Commit SHA luu o dau trong evidence file?**
   - What we know: D-07 noi "luu commit SHA vao evidence file". Claude's Discretion cho phep chon frontmatter hay section rieng
   - Recommendation: YAML frontmatter `commit_sha: a1b2c3d` — tu nhien nhat, parseFrontmatter() da ho tro, khong can section rieng

## Sources

### Primary (HIGH confidence)
- `bin/lib/smart-selection.js` — Pattern tham khao cho pure function module, constants, export structure
- `bin/lib/evidence-protocol.js` — parseFrontmatter, parseEvidence, validateEvidence
- `bin/lib/utils.js` — parseFrontmatter() implementation
- `bin/lib/parallel-dispatch.js` — buildScannerPlan, evidence_sec_* naming convention (line 135)
- `commands/pd/agents/pd-sec-scanner.md` — Function Checklist format (6 cot: #, File, Ham, Dong, Verdict, Chi tiet)
- `workflows/audit.md` — B2 stub can thay the, 9-step workflow
- `test/smoke-evidence-protocol.test.js` — Test pattern: node:test + assert/strict, makeEvidence helper
- `.planning/phases/49-session-delta/49-CONTEXT.md` — 15 locked decisions

### Secondary (MEDIUM confidence)
- `.planning/phases/48-evidence-smart-selection/48-CONTEXT.md` — D-07/D-08 Function Checklist format decisions

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Khong co library moi, chi Node.js built-in + git CLI
- Architecture: HIGH - Pattern da chuan hoa qua 3 phases truoc (46-48), chi tao 1 module moi theo dung pattern
- Pitfalls: HIGH - Da doc codebase thuc te, xac nhan format evidence va Function Checklist

**Research date:** 2026-03-26
**Valid until:** 2026-04-26 (stable — pure function module, khong phu thuoc external dependencies)
