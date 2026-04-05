# Phase 26: Don dep & An toan - Research

**Nghien cuu:** 2026-03-24
**Linh vuc:** Debug cleanup + Security warning integration trong fix-bug workflow
**Do tin cay:** HIGH

## Tom tat

Phase 26 tao 1 module `bin/lib/debug-cleanup.js` chua 2 pure functions: `scanDebugMarkers()` (tim dong co `[PD-DEBUG]` trong staged files) va `matchSecurityWarnings()` (lien ket canh bao bao mat tu SCAN_REPORT.md cho file bi loi). Module nay duoc tich hop vao workflow fix-bug.md nhu sub-step 9a truoc buoc commit hien tai (Buoc 9).

Du an da co 12 modules trong `bin/lib/` — tat ca tuân thu pattern pure function: nhan content string, tra ket qua, KHONG doc file, KHONG co side effects. Phase 26 tiep tuc pattern nay. Viec xoa dong `[PD-DEBUG]` do AI thuc hien truc tiep trong workflow (Edit tool), module chi scan va bao cao.

**Khuyen nghi chinh:** Tao module `debug-cleanup.js` theo dung pattern cua `repro-test-generator.js` (pure function don gian nhat), viet smoke test theo pattern `smoke-repro-test-generator.test.js`, chen sub-step 9a vao fix-bug.md truoc Buoc 9 commit logic hien tai.

<user_constraints>
## Rang buoc tu User (tu CONTEXT.md)

### Quyet dinh da khoa
- **D-01:** Chen sub-step 9a trong Buoc 9 (Git commit) — gom ca cleanup + security check truoc khi commit. Buoc 9 hien tai tro thanh 9b.
- **D-02:** Theo D-10 Phase 25: chen vao buoc hien co, KHONG tao buoc moi so
- **D-03:** Chi scan staged files (`git diff --cached --name-only`) — KHONG scan unstaged changes
- **D-04:** Group theo file: hien file path, so dong, noi dung tung dong co marker
- **D-05:** Y/N xoa tat ca — khong cho chon tung file/dong rieng le
- **D-06:** Neu khong tim thay [PD-DEBUG] nao — skip im lang, khong hien thong bao
- **D-07:** Non-blocking — neu user tu choi xoa, hien warning roi van tiep tuc commit. User co the co ly do giu debug log (dang debug tiep).
- **D-08:** Neu khong co SCAN_REPORT.md hoac report cu hon 7 ngay — skip im lang, khong hien gi, tiep tuc commit
- **D-09:** Khi co report hop le — match file path: doc SCAN_REPORT.md, tim canh bao lien quan den file bi loi, hien toi da 3 canh bao non-blocking
- **D-10:** Security warnings luon non-blocking — chi hien thong tin, khong chan workflow
- **D-11:** Tao 1 module `bin/lib/debug-cleanup.js` chua 2 pure functions: `scanDebugMarkers()` va `matchSecurityWarnings()`
- **D-12:** `scanDebugMarkers(stagedFiles)` — Input: `[{path, content}]`, Output: `[{path, line, text}]`. Chi scan va bao cao, KHONG xoa.
- **D-13:** `matchSecurityWarnings(reportContent, filePaths)` — Input: `string, string[]`, Output: `[{file, severity, desc}]`. Filter theo file paths, max 3 results.
- **D-14:** Viec xoa dong [PD-DEBUG] do AI thuc hien truc tiep trong workflow (Edit tool) — module KHONG co side effects

### Tuy y Claude
- Function signatures chi tiet va return types
- Regex pattern cu the cho `[PD-DEBUG]` matching
- Test file naming va fixtures cho smoke test
- Error handling khi doc staged file content that bai
- Format chinh xac cua security warning display

### Y tuong tam hoan (NGOAI PHAM VI)
Khong co — thao luan nam trong pham vi phase.
</user_constraints>

<phase_requirements>
## Yeu cau Phase

| ID | Mo ta | Nghien cuu ho tro |
|----|-------|-------------------|
| CLEAN-01 | AI don dep debug log co marker `[PD-DEBUG]` truoc commit, hoi user truoc khi xoa | Module `scanDebugMarkers()` scan staged files, workflow 9a hoi Y/N truoc khi AI dung Edit tool xoa |
| SEC-01 | AI lien ket canh bao bao mat tu pd:scan cho file bi loi (max 3 canh bao, freshness 7 ngay) | Module `matchSecurityWarnings()` parse SCAN_REPORT.md, filter theo file paths, max 3 results |
</phase_requirements>

## Rang buoc du an (tu CLAUDE.md)

- Dung tieng Viet toan bo, co dau chuan — ap dung cho JSDoc, comments, commit messages, output
- Ten bien/function/class/file: Tieng Anh (tu conventions.md)

## Standard Stack

### Core
| Thu vien | Phien ban | Muc dich | Ly do |
|----------|-----------|----------|-------|
| node:test | Built-in (Node 24) | Test framework | Pattern du an hien tai, zero deps |
| node:assert/strict | Built-in (Node 24) | Assertion library | Pattern du an hien tai |

### Ho tro
Khong co thu vien bo sung — module nay zero dependencies, self-contained, chi dung string operations va regex.

### Khong can cai dat them
Module `debug-cleanup.js` la pure function, khong import bat ky thu vien ngoai nao. Chi dung JavaScript built-in: `String.prototype.split()`, `RegExp`, `Array.prototype.filter/map/slice`.

## Architecture Patterns

### Cau truc du an (files moi/sua)
```
bin/lib/
  debug-cleanup.js       # MỚI — 2 pure functions
test/
  smoke-debug-cleanup.test.js  # MỚI — smoke test
workflows/
  fix-bug.md             # SỬA — chen sub-step 9a
test/snapshots/          # CẬP NHẬT — 4 platform snapshots sau khi sửa workflow
```

### Pattern 1: Pure Function Module (da duoc chung minh trong du an)
**La gi:** Module export pure functions — nhan input data, tra output data, KHONG doc file, KHONG co side effects.
**Khi nao dung:** Tat ca modules trong `bin/lib/`.
**Vi du tu du an:**
```javascript
// Nguon: bin/lib/repro-test-generator.js
/**
 * Pure function: nhan params, tra ve test code string.
 * KHONG doc file — tat ca content truyen qua tham so.
 * Zero dependencies — self-contained.
 */
'use strict';

function generateReproTest(params) {
  if (!params || !params.symptoms) {
    throw new Error('generateReproTest: thieu params.symptoms hoac params.bugTitle');
  }
  // ... logic ...
  return { testCode, testFileName };
}

module.exports = { generateReproTest };
```

### Pattern 2: Smoke Test (da duoc chung minh trong du an)
**La gi:** Test file dung `node:test` + `node:assert/strict`, in-memory fixtures, khong can file system.
**Khi nao dung:** Moi module trong `bin/lib/` co 1 test tuong ung.
**Vi du tu du an:**
```javascript
// Nguon: test/smoke-repro-test-generator.test.js
'use strict';
const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { generateReproTest } = require('../bin/lib/repro-test-generator');

function makeParams(overrides = {}) {
  return { symptoms: { expected: 'ket qua dung', ... }, bugTitle: 'test-bug', ... };
}

describe('generateReproTest — happy path', () => {
  it('tra ve testCode va testFileName voi params hop le', () => {
    const result = generateReproTest(makeParams());
    assert.equal(typeof result.testCode, 'string');
  });
});
```

### Pattern 3: Workflow Sub-step Wiring (da duoc chung minh o Phase 25)
**La gi:** Chen sub-step vao buoc hien co trong workflow markdown, KHONG tao buoc moi so.
**Tham khao:** Phase 25 da chen 5b.1 (repro test) va 8a (regression) thanh cong.
**Ap dung:** Chen 9a (debug cleanup + security check) truoc Buoc 9 commit logic hien tai. Buoc 9 commit hien tai tro thanh 9b.

### Anti-Patterns Can Tranh
- **Module doc file truc tiep:** Module KHONG DUOC doc file — workflow truyen content vao. Ly do: testable, reusable, tach biet concern.
- **Module xoa code:** Module chi scan va bao cao — viec xoa do AI thuc hien trong workflow bang Edit tool. Ly do: module KHONG co side effects (D-14).
- **Blocking security warnings:** Security warnings LUON non-blocking (D-10) — chi hien thong tin, khong chan workflow.
- **Scan unstaged files:** Chi scan staged files qua `git diff --cached --name-only` (D-03).

## Don't Hand-Roll

| Van de | Dung build | Dung thay | Ly do |
|--------|-----------|-----------|-------|
| Regex phuc tap cho code parsing | AST parser | Literal string match `[PD-DEBUG]` | Marker la literal string co dinh, khong can AST. Regex don gian du chinh xac. |
| Date parsing cho freshness check | Custom date parser | So sanh `Date.now()` voi file mtime | SCAN_REPORT.md co ngay quet trong header, nhung file mtime don gian hon va du chinh xac cho freshness 7 ngay |
| Git operations | Custom git wrapper | Workflow goi `git diff --cached` truc tiep | Module KHONG goi git — workflow truyen content vao |

**Nhan dinh quan trong:** Module `debug-cleanup.js` chi lam 2 viec: (1) tim literal string `[PD-DEBUG]` trong text, (2) match file paths voi security report content. Ca 2 deu la string operations don gian — KHONG can thu vien ngoai.

## Common Pitfalls

### Pitfall 1: Xoa dong khong co marker
**Van de:** Regex sai co the match dong khong co `[PD-DEBUG]` — xoa code production.
**Nguyen nhan:** Regex qua rong hoac khong escape dung bracket characters.
**Cach tranh:** Dung literal string match `/\[PD-DEBUG\]/` — escape ca 2 bracket. Test voi fixtures co cac dong tuong tu nhung KHONG co marker (vi du: `[DEBUG]`, `[PD-INFO]`, `PD-DEBUG` khong co brackets).
**Dau hieu canh bao:** Test case nao co false positive → sua regex ngay.

### Pitfall 2: Module co side effects (doc file, xoa code)
**Van de:** Neu module doc file hoac xoa code, khong test duoc voi in-memory fixtures.
**Nguyen nhan:** Vi pham pure function pattern cua du an.
**Cach tranh:** Module chi nhan content string va tra ket qua. Viec doc file (git diff, Read tool) va xoa code (Edit tool) do workflow thuc hien.

### Pitfall 3: Security report freshness check sai
**Van de:** Report qua cu nhung van hien canh bao — noise, giam tin tuong.
**Nguyen nhan:** Khong kiem tra ngay quet hoac dung sai logic so sanh.
**Cach tranh:** D-08 quy dinh: report cu hon 7 ngay → skip im lang. Kiem tra freshness TRUOC khi goi `matchSecurityWarnings()`. Dung file mtime cua SCAN_REPORT.md (don gian, chinh xac).
**Dau hieu canh bao:** Workflow hien canh bao tu report 30 ngay truoc.

### Pitfall 4: Workflow dong so vuot qua 420 dong
**Van de:** Phase 25 (D-12) gioi han fix-bug.md duoi 420 dong. Chen them sub-step 9a co the vuot.
**Nguyen nhan:** Moi sub-step them ~15-25 dong workflow text.
**Cach tranh:** Viet sub-step 9a ngan gon. Hien tai fix-bug.md co 385 dong (tu Phase 25). Chen ~20 dong cho 9a → ~405 dong, con trong gioi han.
**Dau hieu canh bao:** `wc -l workflows/fix-bug.md` > 420 sau khi chen.

### Pitfall 5: Khong cap nhat snapshots
**Van de:** 4 platform snapshots trong `test/snapshots/` can regenerate sau khi sua workflow.
**Nguyen nhan:** Quen chay `node test/generate-snapshots.js` sau khi sua fix-bug.md.
**Cach tranh:** Task cuoi cung trong plan PHAI chay snapshot regeneration va verify tests pass.

### Pitfall 6: matchSecurityWarnings khong tim thay canh bao do format SCAN_REPORT.md thay doi
**Van de:** Regex parse section "Canh bao bao mat" nhung format co the khac voi ky vong.
**Nguyen nhan:** SCAN_REPORT.md do scan.md workflow tao — format co the thay doi theo stack.
**Cach tranh:** Thiet ke regex linh hoat — match heading `## Cảnh báo bảo mật` hoac `## Canh bao bao mat` (co/khong dau), sau do match cac dong co severity indicators (critical, high, moderate, low). Test voi nhieu fixture variants.

## Code Examples

### scanDebugMarkers() — Thiet ke khuyen nghi

```javascript
// Khuyen nghi — chua la code cuoi cung
/**
 * Quet staged files tim dong co marker [PD-DEBUG].
 *
 * @param {Array<{path: string, content: string}>} stagedFiles - Noi dung staged files
 * @returns {Array<{path: string, line: number, text: string}>} Danh sach dong co marker
 */
function scanDebugMarkers(stagedFiles) {
  if (!stagedFiles || !Array.isArray(stagedFiles)) {
    throw new Error('scanDebugMarkers: thieu tham so stagedFiles');
  }

  const results = [];
  const MARKER = /\[PD-DEBUG\]/;

  for (const file of stagedFiles) {
    if (!file.path || typeof file.content !== 'string') continue;

    const lines = file.content.split('\n');
    for (let i = 0; i < lines.length; i++) {
      if (MARKER.test(lines[i])) {
        results.push({
          path: file.path,
          line: i + 1,
          text: lines[i].trimEnd(),
        });
      }
    }
  }

  return results;
}
```

**Diem noi bat:**
- Regex `/\[PD-DEBUG\]/` — literal match, escape brackets, KHONG greedy
- `line: i + 1` — 1-indexed de khop voi editor/git line numbers
- `text: lines[i].trimEnd()` — giu indent nhung bo trailing whitespace
- Tra mang rong khi khong tim thay — workflow kiem tra `.length === 0` de skip (D-06)

### matchSecurityWarnings() — Thiet ke khuyen nghi

```javascript
// Khuyen nghi — chua la code cuoi cung
const MAX_WARNINGS = 3;

/**
 * Lien ket canh bao bao mat tu SCAN_REPORT.md voi danh sach file paths.
 *
 * @param {string} reportContent - Noi dung SCAN_REPORT.md
 * @param {string[]} filePaths - Danh sach file paths can kiem tra
 * @returns {Array<{file: string, severity: string, desc: string}>} Toi da 3 canh bao
 */
function matchSecurityWarnings(reportContent, filePaths) {
  if (!reportContent || typeof reportContent !== 'string') {
    throw new Error('matchSecurityWarnings: thieu tham so reportContent');
  }
  if (!filePaths || !Array.isArray(filePaths)) {
    throw new Error('matchSecurityWarnings: thieu tham so filePaths');
  }

  // Tim section "Canh bao bao mat" trong report
  const sectionRegex = /## C[aả]nh b[aá]o b[aả]o m[aậ]t\s*\n([\s\S]*?)(?=\n## |\n$|$)/i;
  const sectionMatch = reportContent.match(sectionRegex);
  if (!sectionMatch) return [];

  const sectionContent = sectionMatch[1];
  const warnings = [];

  // Match tung file path voi noi dung section
  for (const fp of filePaths) {
    if (warnings.length >= MAX_WARNINGS) break;

    // Tim dong chua file path (hoac basename) + severity
    const escapedPath = fp.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const basename = fp.split('/').pop();
    const escapedBasename = basename.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    const lineRegex = new RegExp(
      `^.*(?:${escapedPath}|${escapedBasename}).*$`, 'gm'
    );

    let lineMatch;
    while ((lineMatch = lineRegex.exec(sectionContent)) !== null) {
      if (warnings.length >= MAX_WARNINGS) break;

      const line = lineMatch[0];
      // Extract severity tu cac pattern: critical, high, moderate, low
      const severityMatch = line.match(/\b(critical|high|moderate|low)\b/i);
      const severity = severityMatch ? severityMatch[1].toLowerCase() : 'unknown';

      warnings.push({
        file: fp,
        severity,
        desc: line.trim(),
      });
    }
  }

  return warnings.slice(0, MAX_WARNINGS);
}
```

**Diem noi bat:**
- Section regex linh hoat — match ca "Cảnh báo bảo mật" (co dau) va "Canh bao bao mat" (khong dau)
- Match ca full path va basename — tang kha nang match
- `MAX_WARNINGS = 3` — hardcoded theo D-09
- Tra mang rong khi khong match — workflow skip im lang

### Workflow sub-step 9a — Thiet ke khuyen nghi

```markdown
### 9a: Dọn dẹp debug log + Cảnh báo bảo mật (TRƯỚC commit)

1. **Debug cleanup:** `git diff --cached --name-only` → Read nội dung staged files → gọi `scanDebugMarkers()` từ `bin/lib/debug-cleanup.js`
   - Tìm thấy `[PD-DEBUG]` → hiện danh sách (group theo file: path, số dòng, nội dung) → hỏi "Xóa tất cả debug markers? (Y/n)"
     - Y → dùng Edit tool xóa từng dòng có marker → `git add` lại files đã sửa
     - n → hiện warning "⚠️ Debug markers vẫn còn trong commit" → tiếp tục
   - Không tìm thấy → bỏ qua, không hiện gì
2. **Security check:** `.planning/scan/SCAN_REPORT.md` tồn tại VÀ mtime < 7 ngày?
   - Có → Read nội dung → gọi `matchSecurityWarnings(reportContent, filePaths)` → hiện cảnh báo (nếu có, tối đa 3) → tiếp tục (non-blocking)
   - Không → bỏ qua, không hiện gì
```

## State of the Art

| Cach cu | Cach hien tai | Thay doi khi | Anh huong |
|---------|---------------|-------------|-----------|
| Debug log bo sot trong commit | Scan marker `[PD-DEBUG]` truoc commit | Phase 26 | Giam debug log trong production code |
| Khong co security awareness khi fix bug | Hien canh bao tu SCAN_REPORT.md cho file bi loi | Phase 26 | Nang cao nhan thuc bao mat trong workflow |

## Open Questions

1. **Format chinh xac cua section "Canh bao bao mat" trong SCAN_REPORT.md**
   - Biet gi: Workflow scan.md tao file nay voi section headers chuan. Section co ten "Cảnh báo bảo mật" (tieng Viet co dau).
   - Chua ro: Format cac dong canh bao cu the (markdown table, bullet list, hay text tu do). Chua co SCAN_REPORT.md mau de verify.
   - Khuyen nghi: Thiet ke regex linh hoat match nhieu format. Test voi ca markdown table va bullet list fixtures. LOW confidence cho phan nay — can validate khi co report thuc te.

2. **Freshness check: dung file mtime hay parse ngay trong report header?**
   - Biet gi: Report header co `> Ngày quét: [DD_MM_YYYY HH:MM]`. File mtime cung co.
   - Chua ro: Neu file bi copy/move, mtime thay doi nhung ngay quet van cu.
   - Khuyen nghi: Dung file mtime (don gian, chinh xac cho 99% truong hop). Freshness check nam o workflow, KHONG nam trong module. MEDIUM confidence.

## Validation Architecture

### Test Framework
| Thuoc tinh | Gia tri |
|------------|---------|
| Framework | node:test (built-in Node 24.13.0) |
| Config file | Khong can — built-in |
| Quick run | `node --test test/smoke-debug-cleanup.test.js` |
| Full suite | `node --test test/smoke-*.test.js` |

### Phase Requirements -> Test Map
| Req ID | Hanh vi | Loai test | Automated Command | File ton tai? |
|--------|---------|-----------|-------------------|--------------|
| CLEAN-01a | scanDebugMarkers tra ve dung ket qua voi marker | unit | `node --test test/smoke-debug-cleanup.test.js` | Wave 0 |
| CLEAN-01b | scanDebugMarkers tra mang rong khi khong co marker | unit | `node --test test/smoke-debug-cleanup.test.js` | Wave 0 |
| CLEAN-01c | scanDebugMarkers KHONG match dong tuong tu nhung thieu marker | unit | `node --test test/smoke-debug-cleanup.test.js` | Wave 0 |
| SEC-01a | matchSecurityWarnings tra ve canh bao match file path | unit | `node --test test/smoke-debug-cleanup.test.js` | Wave 0 |
| SEC-01b | matchSecurityWarnings tra mang rong khi khong co report section | unit | `node --test test/smoke-debug-cleanup.test.js` | Wave 0 |
| SEC-01c | matchSecurityWarnings gioi han toi da 3 ket qua | unit | `node --test test/smoke-debug-cleanup.test.js` | Wave 0 |
| SEC-01d | matchSecurityWarnings tra mang rong khi file paths khong match | unit | `node --test test/smoke-debug-cleanup.test.js` | Wave 0 |

### Sampling Rate
- **Per task commit:** `node --test test/smoke-debug-cleanup.test.js`
- **Per wave merge:** `node --test test/smoke-*.test.js`
- **Phase gate:** Full suite green truoc `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `test/smoke-debug-cleanup.test.js` — covers CLEAN-01a, CLEAN-01b, CLEAN-01c, SEC-01a, SEC-01b, SEC-01c, SEC-01d
- Framework install: Khong can — node:test da co san

## Sources

### Primary (HIGH confidence)
- `bin/lib/repro-test-generator.js` — Pattern module pure function, dung lam template
- `bin/lib/regression-analyzer.js` — Pattern dual-mode module, reference cho function signatures
- `bin/lib/truths-parser.js` — Pattern module don gian nhat
- `test/smoke-repro-test-generator.test.js` — Pattern test voi makeParams helper
- `test/smoke-regression-analyzer.test.js` — Pattern test voi in-memory fixtures
- `workflows/fix-bug.md` — Workflow hien tai, 385 dong, diem chen Buoc 9 (dong 312)
- `workflows/scan.md` — Cau truc SCAN_REPORT.md, section headers

### Secondary (MEDIUM confidence)
- `.planning/phases/25-dieu-ta-tai-hien-loi/25-CONTEXT.md` — D-10 sub-step wiring pattern, D-12 420 dong limit

### Tertiary (LOW confidence)
- Format chi tiet dong canh bao trong SCAN_REPORT.md — chua co file mau de verify

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — du an da co pattern ro rang, zero new deps
- Architecture: HIGH — 3 module mau da verified, pattern nhat quan
- Pitfalls: HIGH — dua tren phan tich code hien tai va decisions tu CONTEXT.md
- SCAN_REPORT.md format: LOW — chua co file mau thuc te de verify regex

**Ngay nghien cuu:** 2026-03-24
**Co hieu luc den:** 2026-04-23 (30 ngay — stack on dinh, khong co thu vien ngoai)
