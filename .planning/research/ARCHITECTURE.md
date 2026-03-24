# Architecture: Nang cap Skill Fix-Bug (v1.5)

**Domain:** Tich hop tu dong hoa dieu tra loi, phan tich hoi quy, dong bo business logic, va bao cao PDF vao workflow fix-bug hien tai
**Researched:** 2026-03-24
**Confidence:** HIGH (phan tich toan bo codebase: 10 workflows, 12 commands, 7 library modules, 5 converters)

## Tong quan he thong -- Trang thai hien tai (v1.4) va diem tich hop v1.5

```
FIX-BUG WORKFLOW HIEN TAI (10 buoc):
======================================

/pd:fix-bug
   |
   v
commands/pd/fix-bug.md (model: sonnet, 10 allowed-tools)
   |
   v
workflows/fix-bug.md
   |
   +-- Buoc 0.5: Phan tich bug, quyet dinh tai lieu tham khao
   +-- Buoc 1: Kiem tra phien dieu tra + thu thap trieu chung
   +-- Buoc 2: Xac dinh patch version
   +-- Buoc 3: Doc tai lieu ky thuat (PLAN.md, CODE_REPORT)
   +-- Buoc 4: Tim hieu files lien quan (FastCode + Context7)
   +-- Buoc 5: Phan tich theo phuong phap khoa hoc (SESSION_*.md)
   +------ 5a: Tao/cap nhat phien dieu tra
   +------ 5b: Tai hien toi gian (cho loi kho)        <--- DIEM TICH HOP: Reproduction Test
   +------ 5c: Hinh thanh + kiem chung gia thuyet
   +-- Buoc 6: Danh gia ket qua dieu tra
   +------ 6a: Phan loai rui ro
   +------ 6b: Danh gia ket qua
   +------ 6c: Cong kiem tra truoc khi sua
   +-- Buoc 6.5: Logic Update (cap nhat Truth khi bug do logic sai)
   +-- Buoc 7: Viet bao cao loi (BUG_*.md)
   +-- Buoc 8: Sua code                               <--- DIEM TICH HOP: Regression Analysis
   +-- Buoc 9: Git commit
   +-- Buoc 10: Yeu cau xac nhan                      <--- DIEM TICH HOP: Auto Cleanup + Report + Post-mortem


v1.5 DIEM TICH HOP (>>>):
===========================

   +-- Buoc 4a: >>> Lien ket scan bao mat (doc SCAN_REPORT.md, trich canh bao file loi)
   +-- Buoc 5b: >>> Mo rong: Uu tien tao reproduction test truoc khi phan tich
   +-- Buoc 8a: >>> Regression Analysis (FastCode Call Chain truoc khi sua)
   +-- Buoc 8 (mo rong): >>> Sua code + chay reproduction test xac nhan
   +-- Buoc 9.5: >>> Auto Cleanup (don dep log tam truoc commit)
   +-- Buoc 9.7: >>> Business Logic Sync (phat hien thay doi logic/kien truc)
   +------ 9.7a: Phat hien thay doi
   +------ 9.7b: Cap nhat bao cao + xuat PDF
   +-- Buoc 10.5: >>> Post-mortem (de xuat cap nhat CLAUDE.md)
```

## Thanh phan: Moi vs Sua doi

### THANH PHAN MOI (2 modules, 0 scripts)

| # | Thanh phan | Vi tri | Loai | Muc dich |
|---|-----------|--------|------|---------|
| N1 | Reproduction Test Generator | `bin/lib/repro-test-generator.js` | Library (pure function) | Tao code test tai hien loi cho NestJS/Flutter |
| N2 | Regression Analyzer | `bin/lib/regression-analyzer.js` | Library (pure function) | Phan tich call chain, tim module phu thuoc |

### THANH PHAN SUA DOI (3 files)

| # | Thanh phan | Vi tri | Thay doi |
|---|-----------|--------|---------|
| M1 | fix-bug workflow | `workflows/fix-bug.md` | Them 6 buoc moi (4a, 5b mo rong, 8a, 9.5, 9.7, 10.5) |
| M2 | fix-bug command | `commands/pd/fix-bug.md` | Khong can thay doi (da co du allowed-tools) |
| M3 | Converter snapshots | `test/snapshots/*.txt` | Tai tao sau khi sua workflow |

### KHONG SUA DOI (ly do ro rang)

| Thanh phan | Tai sao khong |
|-----------|--------------|
| `bin/lib/report-filler.js` | Goi truc tiep tu workflow, khong can sua module |
| `bin/lib/generate-diagrams.js` | Goi truc tiep tu workflow, khong can sua module |
| `bin/lib/pdf-renderer.js` | Goi qua `bin/generate-pdf-report.js`, khong can sua |
| `bin/generate-pdf-report.js` | CLI wrapper da hoan chinh, goi tu workflow |
| `bin/lib/plan-checker.js` | Plan checker chay luc plan, khong lien quan fix-bug |
| `bin/lib/mermaid-validator.js` | Da duoc goi boi generate-diagrams.js |
| `templates/management-report.md` | Template da hoan chinh tu v1.4 |
| `workflows/complete-milestone.md` | Buoc 3.6 da xu ly report generation |
| `commands/pd/fix-bug.md` | Da co du tools: Read, Write, Edit, Bash, Glob, Grep, AskUserQuestion, FastCode, Context7 |

## Kien truc de xuat

### Nguyen tac: Workflow-First, Module-Lean

Kien truc v1.5 khac v1.4 o cho: v1.4 can tao nhieu module library moi (mermaid-validator, generate-diagrams, pdf-renderer, report-filler) vi do la kha nang hoan toan moi. v1.5 chu yeu **mo rong workflow** va **tai su dung module co san**.

```
NGUYEN TAC KIEN TRUC:
=======================

1. Workflow extensions     -- Phan lon logic nam trong workflow markdown
2. Tai su dung module v1.4 -- report-filler, generate-diagrams, generate-pdf-report
3. Module moi CHI KHI      -- Logic phuc tap can pure function testable
4. Non-blocking pipeline   -- Moi buoc moi co the that bai ma khong chan workflow
```

### Ranh gioi thanh phan

| Thanh phan | Trach nhiem | Dau vao | Dau ra | Giao tiep voi |
|-----------|------------|---------|--------|---------------|
| `workflows/fix-bug.md` (Buoc 4a) | Trich canh bao bao mat tu SCAN_REPORT cho file loi | SCAN_REPORT.md + danh sach files loi | Canh bao lien quan trong SESSION | Doc .planning/scan/SCAN_REPORT.md |
| `workflows/fix-bug.md` (Buoc 5b mo rong) | Tao reproduction test tu trieu chung + stack | Trieu chung, stack rules | File test tai hien (.spec.ts / _test.dart) | Goi repro-test-generator.js |
| `bin/lib/repro-test-generator.js` | Tao skeleton code test tu trieu chung | {stack, symptoms, filePath, functionName} | {testCode, testPath, framework} | Duoc goi boi workflow |
| `workflows/fix-bug.md` (Buoc 8a) | Phan tich call chain truoc khi sua | File bi loi + function name | Danh sach modules anh huong | Goi regression-analyzer.js hoac FastCode truc tiep |
| `bin/lib/regression-analyzer.js` | Phan tich import/export graph, tim phu thuoc | {sourceFiles, targetFile, targetFunction} | {affectedModules[], callChain[], riskLevel} | Doc qua content truyen vao |
| `workflows/fix-bug.md` (Buoc 9.5) | Don dep log tam (console.log debug) | Diff cua cac file da sua | Danh sach dong can xoa | Grep + Edit truc tiep |
| `workflows/fix-bug.md` (Buoc 9.7) | Phat hien thay doi business logic | BUG_*.md Logic Changes + PLAN.md Truths | Co/Khong thay doi logic | So sanh Buoc 6.5 output |
| `workflows/fix-bug.md` (Buoc 9.7b) | Cap nhat bao cao + xuat PDF | Template + data | management-report-v*.md + .pdf | Goi fillManagementReport() + generate-pdf-report.js |
| `workflows/fix-bug.md` (Buoc 10.5) | De xuat cap nhat CLAUDE.md | Nguyen nhan + cach sua + bai hoc | De xuat text cho CLAUDE.md | Hoi user xac nhan |

### Luong du lieu

```
LUONG DU LIEU TONG QUAN:
=========================

--- Buoc 4a: Lien ket bao mat ---

.planning/scan/SCAN_REPORT.md
   |
   v (Grep "Canh bao bao mat" + match file bi loi)
   |
   v
SESSION_*.md (ghi chu canh bao lien quan)


--- Buoc 5b: Reproduction Test ---

Trieu chung (Buoc 1b)
   + Stack (.planning/rules/[stack].md)
   + File/function loi (Buoc 4 FastCode)
   |
   v
bin/lib/repro-test-generator.js
   |
   v
[project]/test/repro-[ten-tat].spec.ts      (NestJS)
[project]/test/repro_[ten_tat]_test.dart     (Flutter)
   |
   v (chay test -> FAIL xac nhan tai hien)
   |
   v
SESSION_*.md (ghi ket qua tai hien)


--- Buoc 8a: Regression Analysis ---

File bi loi + function name
   |
   v
bin/lib/regression-analyzer.js (phan tich import graph)
   HOAC
mcp__fastcode__code_qa "Call chain cua [function]?"
   |
   v
Danh sach modules anh huong -> SESSION_*.md + BUG_*.md (muc Anh huong)


--- Buoc 9.5: Auto Cleanup ---

git diff --cached (hoac diff files da sua)
   |
   v (Grep "console.log|debugger|TODO.*debug|print(")
   |
   v
Danh sach dong debug -> Edit xoa -> git add lai


--- Buoc 9.7: Business Logic Sync ---

BUG_*.md "Logic Changes" (tu Buoc 6.5)
   |
   v (Co dong nao trong bang Logic Changes?)
   |
   YES                          NO
   |                            |
   v                            v (Bo qua)
Doc tat ca PLAN.md cua milestone
   + Doc ARCHITECTURE.md
   + Thu thap filesModified
   |
   v
fillManagementReport() (bin/lib/report-filler.js)
   + generateBusinessLogicDiagram() (bin/lib/generate-diagrams.js)
   + generateArchitectureDiagram() (bin/lib/generate-diagrams.js)
   |
   v
.planning/reports/management-report-v{version}.md
   |
   v
node bin/generate-pdf-report.js [path]
   |
   v
.planning/reports/management-report-v{version}.pdf


--- Buoc 10.5: Post-mortem ---

Nguyen nhan goc (BUG_*.md)
   + Loai loi (Buoc 6a phan loai)
   + Bai hoc
   |
   v
De xuat text cho CLAUDE.md
   |
   v (User dong y?)
   |
   YES -> Append vao CLAUDE.md + git add
   NO  -> Bo qua
```

## Thiet ke chi tiet: Thanh phan moi

### N1: bin/lib/repro-test-generator.js

Pure function library. KHONG doc file. Content truyen qua tham so.

```javascript
/**
 * Repro Test Generator — Tao skeleton test tai hien loi.
 *
 * Pure function: nhan params, tra ve test code string.
 * KHONG doc file — tat ca content truyen qua tham so.
 */

/**
 * @param {object} params
 * @param {string} params.stack - 'nestjs' | 'flutter' | 'generic'
 * @param {object} params.symptoms - { expected, actual, errorMessage, steps }
 * @param {string} params.filePath - Duong dan file bi loi
 * @param {string} params.functionName - Ten function bi loi
 * @param {string} [params.httpMethod] - GET/POST/PUT/DELETE (NestJS)
 * @param {string} [params.route] - API route (NestJS)
 * @returns {{ testCode: string, testPath: string, framework: string, runCommand: string }}
 */
function generateReproTest(params) { ... }

// Templates theo stack:
// - NestJS: Jest + supertest, describe/it structure
// - Flutter: flutter_test, group/test structure
// - Generic: basic assert structure

module.exports = { generateReproTest };
```

**Quyet dinh thiet ke:**
- CHI tao skeleton (khung test), KHONG tao logic phuc tap — AI se dien logic tu trieu chung
- Template theo stack de phu hop conventions (Jest cho NestJS, flutter_test cho Flutter)
- testPath tu dong tu filePath + ten-tat bug (vi du: `test/repro-login-timeout.spec.ts`)
- runCommand de workflow biet cach chay test (vi du: `npx jest test/repro-*.spec.ts`)

### N2: bin/lib/regression-analyzer.js

Pure function library. Phan tich dependency graph tu source code content.

```javascript
/**
 * Regression Analyzer — Phan tich call chain va module phu thuoc.
 *
 * Pure function: nhan file contents, tra ve danh sach phu thuoc.
 * KHONG doc file — tat ca content truyen qua tham so.
 *
 * Luu y: Day la FALLBACK khi FastCode khong kha dung.
 * Khi co FastCode, workflow uu tien dung mcp__fastcode__code_qa.
 */

/**
 * @param {object} params
 * @param {Array<{path: string, content: string}>} params.sourceFiles - Tat ca source files
 * @param {string} params.targetFile - File bi loi
 * @param {string} [params.targetFunction] - Function bi loi
 * @returns {{
 *   affectedModules: Array<{path: string, reason: string}>,
 *   callChain: string[],
 *   importedBy: string[],
 *   riskLevel: 'low' | 'medium' | 'high'
 * }}
 */
function analyzeRegression(params) { ... }

// Logic:
// 1. Parse import/require statements tu moi sourceFile
// 2. Xay dung dependency graph (ai import ai)
// 3. Tu targetFile, tim tat ca files import no (importedBy)
// 4. Tu importedBy, tim tiep (2 cap)
// 5. riskLevel: 0-2 affected = low, 3-5 = medium, 6+ = high

module.exports = { analyzeRegression };
```

**Quyet dinh thiet ke:**
- Module nay la FALLBACK — khi co FastCode, workflow goi FastCode truc tiep vi no chinh xac hon
- Parse import/require bang regex (khong can AST parser — giu zero dependencies)
- Chi di sau 2 cap phu thuoc (tranh bung no exponential)
- riskLevel giup workflow quyet dinh muc do kiem thu can thiet

## Thiet ke chi tiet: Cac buoc workflow moi

### Buoc 4a: Lien ket canh bao bao mat

```markdown
## Buoc 4a: Lien ket canh bao bao mat (CHI KHI co SCAN_REPORT)

Glob `.planning/scan/SCAN_REPORT.md` -> ton tai?
- KHONG -> bo qua Buoc 4a
- CO -> doc section "Canh bao bao mat"
  - Grep ten file bi loi trong danh sach canh bao
  - Tim thay -> ghi vao SESSION: "## Canh bao bao mat lien quan" + danh sach
  - Khong tim thay -> bo qua

**Quy tac:** Non-blocking. SCAN_REPORT khong ton tai hoac khong co canh bao -> tiep tuc binh thuong.
```

**Diem tich hop:**
- Buoc nay nam SAU Buoc 4 (FastCode) vi can biet file nao bi loi
- Doc tu `SCAN_REPORT.md` — file nay do `pd:scan` tao, KHONG doi hoi chay scan lai
- Ket qua ghi vao SESSION de thong tin hoan chinh, KHONG chan workflow

### Buoc 5b mo rong: Reproduction Test

```markdown
## Buoc 5b: Tai hien toi gian (mo rong)

[Giu nguyen logic hien tai cho loi kho]

**BO SUNG — Tu dong tao Reproduction Test:**

SAU KHI xac dinh duoc buoc tai hien (tu arguments hoac phan tich):

1. Xac dinh stack tu CONTEXT.md
2. Goi `generateReproTest()` tu `bin/lib/repro-test-generator.js`:
   - Input: stack, trieu chung, file/function loi
   - Output: testCode, testPath, runCommand
3. Viet file test tai hien (vi du: `test/repro-login-timeout.spec.ts`)
4. Chay test: expect FAIL (xac nhan tai hien duoc)
   - FAIL -> "Tai hien thanh cong qua test"
   - PASS -> "Test khong bat duoc loi — can dieu chinh test" -> dieu chinh hoac bo qua
5. Ghi ket qua vao SESSION muc "Tai hien toi gian"
6. Sau khi sua (Buoc 8) -> chay lai test -> expect PASS

**Ap dung KHI:**
- Stack la NestJS hoac Flutter (co template)
- Loi co buoc tai hien ro rang
- Loi KHONG phai config/infra (🔵)

**BO QUA KHI:**
- Stack khong ho tro (WordPress, Solidity, generic)
- Loi chi la typo/import thieu
- Loi khong the tai hien bang automated test (UI-only, timing)
```

### Buoc 8a: Regression Analysis

```markdown
## Buoc 8a: Phan tich hoi quy (TRUOC KHI sua code)

**Muc dich:** Xac dinh vung anh huong TRUOC khi sua de biet can kiem tra gi sau khi sua.

1. Tu file + function loi (Buoc 5c), xac dinh phu thuoc:
   - FastCode kha dung -> `mcp__fastcode__code_qa`: "Call chain cua [function] trong [file]? Modules nao import/goi function nay?"
   - FastCode LOI -> Goi `analyzeRegression()` tu `bin/lib/regression-analyzer.js`
     (truyen source files da doc tu Buoc 4)

2. Ghi ket qua vao SESSION muc "Phan tich hoi quy":
   ```markdown
   ## Phan tich hoi quy
   | Module | Ly do anh huong | Muc do |
   |--------|----------------|--------|
   | [file] | Import truc tiep [function] | Cao |
   | [file] | Goi qua [intermediate] | Trung binh |
   ```

3. Ket qua anh huong Buoc 8 (sua code):
   - riskLevel = high -> PHAI kiem tra tat ca modules anh huong
   - riskLevel = medium -> Kiem tra modules import truc tiep
   - riskLevel = low -> Chi kiem tra file bi loi

**Quy tac:** Non-blocking. FastCode loi VA regression-analyzer loi -> ghi warning, tiep tuc sua binh thuong.
```

### Buoc 9.5: Auto Cleanup

```markdown
## Buoc 9.5: Don dep log tam (TRUOC commit)

**Muc dich:** Xoa tat ca log debug/tam thoi da them trong qua trinh dieu tra.

1. Kiem tra diff cac file da sua:
   ```bash
   git diff [files da sua] | grep -n "console.log\|debugger\|TODO.*debug\|print("
   ```

2. Tim thay dong debug:
   - Liet ke: "[file]:[dong]: [noi dung]"
   - Hoi user: "Tim thay [N] dong debug/log tam. (1) Xoa tat ca (2) Chon tung dong (3) Giu nguyen"
   - User chon 1 -> Edit xoa -> git add lai
   - User chon 2 -> Liet ke, user chon -> Edit xoa -> git add lai
   - User chon 3 -> Giu nguyen, ghi chu BUG_*.md

3. Khong tim thay -> bo qua

**Luu y:** Chi quet DONG MOI THEM (trong diff), KHONG xoa log co san cua du an.
**Luu y:** Pattern quet co the mo rong theo stack:
   - NestJS: `this.logger.debug`, `console.log`
   - Flutter: `print(`, `debugPrint(`
   - Generic: `console.log`, `debugger`, `TODO.*debug`
```

### Buoc 9.7: Business Logic Sync

```markdown
## Buoc 9.7: Dong bo Business Logic (CHI KHI logic thay doi)

**Dieu kien kich hoat:** Buoc 6.5 da thuc hien (logic bug -> co Logic Changes trong BUG_*.md)

### 9.7a: Phat hien thay doi

Doc BUG_*.md vua tao -> muc "Logic Changes":
- Bang RONG hoac khong co muc -> BO QUA 9.7, toi Buoc 10
- Co thay doi -> tiep tuc 9.7b

### 9.7b: Cap nhat bao cao + xuat PDF

Trong try/catch (NON-BLOCKING):

1. Doc template `templates/management-report.md`
2. Doc `CURRENT_MILESTONE.md` -> version
3. Doc tat ca PLAN.md cua milestone hien tai
4. Doc `.planning/codebase/ARCHITECTURE.md` (neu co)
5. Thu thap filesModified tu SUMMARY.md
6. Doc `.planning/STATE.md`
7. Goi `fillManagementReport()` tu `bin/lib/report-filler.js`
8. Ghi ra `.planning/reports/management-report-v{version}.md`
9. Chay `node bin/generate-pdf-report.js [path]`
10. Thanh cong -> thong bao: "Da cap nhat bao cao quan ly + PDF do logic thay doi"
11. Loi -> warning, KHONG chan workflow

**Quan trong:** Buoc nay TAI SU DUNG HOAN TOAN module v1.4:
- fillManagementReport() (bin/lib/report-filler.js)
- generateBusinessLogicDiagram() (bin/lib/generate-diagrams.js)
- generateArchitectureDiagram() (bin/lib/generate-diagrams.js)
- generate-pdf-report.js CLI (bin/generate-pdf-report.js)
KHONG can tao module moi.
```

### Buoc 10.5: Post-mortem

```markdown
## Buoc 10.5: Post-mortem — De xuat cap nhat CLAUDE.md (SAU user xac nhan)

**Dieu kien:** User da xac nhan bug da sua (Buoc 10 thanh cong)

1. Phan tich nguyen nhan goc + cach phong tranh:
   - Loai loi (tu Buoc 6a phan loai)
   - Nguyen nhan (tu BUG_*.md)
   - Pattern loi (di lap lai khong?)

2. Soan de xuat cho CLAUDE.md:
   ```markdown
   De xuat cap nhat CLAUDE.md:

   ### [Tieu de bai hoc]
   - Nguyen nhan: [...]
   - Quy tac moi: [...]
   - Vi du: [...]

   Them vao CLAUDE.md? (Y/n)
   ```

3. User dong y:
   - Doc CLAUDE.md hien tai
   - Append muc moi (giu nguyen noi dung cu)
   - git add CLAUDE.md
   - Them vao commit xac nhan (Buoc 10)

4. User tu choi -> bo qua

**Quy tac:**
- CHI de xuat cho loi 🟡 (logic) va 🔴 (bao mat) — KHONG de xuat cho 🟢 (sua nhanh)
- De xuat NGAN GON (3-5 dong), KHONG viet paragraph
- KHONG tu dong them — PHAI co user xac nhan
```

## Patterns can tuan theo

### Pattern 1: Non-Blocking Pipeline

**La gi:** Moi buoc moi co the that bai ma khong chan fix-bug workflow.
**Tai sao:** Fix-bug la workflow quan trong nhat — KHONG duoc de feature moi lam hong no.
**Vi du hien co:** Buoc 3.6 trong complete-milestone (report generation) — try/catch, warning only.

Ap dung cho: TAT CA 6 buoc moi (4a, 5b, 8a, 9.5, 9.7, 10.5).

```
Moi buoc moi:
try {
  [logic buoc moi]
} catch {
  Ghi warning vao SESSION
  Tiep tuc buoc tiep theo
}
```

### Pattern 2: Pure Functions cho Library Code

**La gi:** Code trong `bin/lib/` nhan content qua args, tra ket qua, KHONG doc file.
**Tai sao:** Testable, composable, khong side effects. Da duoc chung minh boi plan-checker.js, mermaid-validator.js, report-filler.js.
**Vi du:** `runAllChecks({ planContent, tasksContent, requirementIds })` trong plan-checker.js.

Ap dung cho: `repro-test-generator.js` va `regression-analyzer.js`.

### Pattern 3: FastCode-First, Fallback-Second

**La gi:** Uu tien FastCode MCP cho phan tich code, co fallback khi FastCode loi.
**Tai sao:** FastCode chinh xac hon regex parsing, nhung khong phai luc nao cung kha dung.
**Vi du hien co:** Buoc 4 fix-bug: "FastCode loi -> Grep/Read. Canh bao: FastCode khong kha dung."

Ap dung cho: Buoc 8a Regression Analysis — FastCode cho call chain, fallback la regression-analyzer.js.

### Pattern 4: Conditional Execution theo Phan loai

**La gi:** Hanh vi thay doi theo phan loai rui ro (🟢🟡🟠🔴🔵).
**Tai sao:** Da la pattern cot loi cua fix-bug (Buoc 8, Buoc 9 da co).
**Vi du:** "🟢 Sua nhanh: lint + build du | 🟡 Loi logic: PHAI them test"

Ap dung cho:
- Reproduction test: CHI cho 🟡🟠🔴, BO QUA cho 🟢🔵
- Post-mortem: CHI cho 🟡🔴, BO QUA cho 🟢🟠🔵
- Auto Cleanup: TAT CA phan loai

### Pattern 5: Stack-Specific Templates

**La gi:** Output khac nhau theo stack (NestJS, Flutter, etc).
**Tai sao:** Da la pattern cua workflow — luong truy vet theo stack (Buoc 5c).

Ap dung cho: Reproduction test templates va cleanup patterns.

## Anti-Patterns can tranh

### Anti-Pattern 1: Sua nhieu module library cung luc

**La gi:** Tao module moi cho moi buoc workflow.
**Tai sao xau:** v1.5 khong can nhieu module moi — phan lon logic nam trong workflow markdown (AI thuc thi).
**Thay the:** CHI tao module khi logic phuc tap can unit test (repro-test-generator, regression-analyzer). Cac buoc khac (cleanup, security link, post-mortem) don gian du de viet truc tiep trong workflow.

### Anti-Pattern 2: Blocking workflow vi feature phu

**La gi:** De reproduction test FAIL lam chan workflow.
**Tai sao xau:** Bug can sua NGAY, khong the doi test framework setup.
**Thay the:** Test tai hien la BONUS — that bai thi ghi note, tiep tuc sua.

### Anti-Pattern 3: Tu dong sua CLAUDE.md khong hoi user

**La gi:** Append vao CLAUDE.md ma khong xac nhan.
**Tai sao xau:** CLAUDE.md anh huong MOI phien Claude Code — them sai thi hai lau dai.
**Thay the:** LUON hoi user xac nhan truoc khi sua CLAUDE.md.

### Anti-Pattern 4: Chay scan lai de lay canh bao bao mat

**La gi:** Goi `pd:scan` tu trong fix-bug.
**Tai sao xau:** Scan mat thoi gian, fix-bug can nhanh. Skill khong nen goi skill khac.
**Thay the:** Doc SCAN_REPORT.md co san — neu khong co thi bo qua.

### Anti-Pattern 5: Module regression-analyzer phan tich AST

**La gi:** Dung babel/typescript parser de phan tich dependency graph chinh xac.
**Tai sao xau:** Them dependency nang, vi pham constraint "no build step, pure Node.js".
**Thay te:** Regex parse import/require statements — du tot cho 2-cap phu thuoc. FastCode lam tot hon khi kha dung.

## Phan tich tac dong tich hop

### Converter Pipeline

Khi `workflows/fix-bug.md` thay doi:
1. Converter pipeline (`bin/lib/converters/`) tu dong inline workflow vao command
2. Tat ca 5 platform outputs (Claude, Codex, Gemini, OpenCode, Copilot) cap nhat tu dong
3. 48 converter snapshots can tai tao (`node test/generate-snapshots.js`)

**KHONG can sua code converter** — pipeline hien tai xu ly tu dong.

### allowed-tools trong command

Doc `commands/pd/fix-bug.md` hien tai:
```
allowed-tools:
  - Read, Write, Edit, Bash, Glob, Grep
  - AskUserQuestion
  - mcp__fastcode__code_qa
  - mcp__context7__resolve-library-id, mcp__context7__query-docs
```

TAT CA tools can thiet DA CO:
- Read/Write/Edit: doc SCAN_REPORT, viet test file, sua CLAUDE.md
- Bash: chay test, chay generate-pdf-report.js, git diff
- Grep: tim log debug, tim import statements
- Glob: tim PLAN.md files, SCAN_REPORT.md
- AskUserQuestion: xac nhan cleanup, post-mortem
- FastCode: call chain analysis

**KHONG can them tool moi** vao command file.

### Test Impact

| Test File | Tac dong | Hanh dong |
|-----------|---------|---------|
| `smoke-snapshot.test.js` | Snapshots thay doi do workflow sua | Tai tao qua `node test/generate-snapshots.js` |
| `smoke-utils.test.js` | Khong tac dong | Khong |
| `smoke-plan-checker.test.js` | Khong tac dong | Khong |
| `smoke-mermaid-validator.test.js` | Khong tac dong | Khong |
| `smoke-generate-diagrams.test.js` | Khong tac dong | Khong |
| `smoke-report-filler.test.js` | Khong tac dong | Khong |
| `smoke-pdf-renderer.test.js` | Khong tac dong | Khong |
| MOI: `smoke-repro-test-generator.test.js` | Test module moi | Viet tests cho generateReproTest() |
| MOI: `smoke-regression-analyzer.test.js` | Test module moi | Viet tests cho analyzeRegression() |

## Thu tu build (theo phu thuoc)

```
Phase 1: Foundation — Module moi (khong phu thuoc lan nhau)
  1a. bin/lib/repro-test-generator.js + tests
  1b. bin/lib/regression-analyzer.js + tests
  (1a va 1b doc lap, co the lam song song)

Phase 2: Workflow Integration — Cac buoc don gian (khong can module moi)
  2a. Buoc 4a: Lien ket bao mat (chi can Read + Grep)
  2b. Buoc 9.5: Auto Cleanup (chi can Bash + Grep + Edit)
  2c. Buoc 10.5: Post-mortem (chi can Read + Write + AskUserQuestion)
  (2a, 2b, 2c doc lap, co the lam song song)

Phase 3: Workflow Integration — Cac buoc phuc tap (phu thuoc Phase 1)
  3a. Buoc 5b mo rong: Reproduction Test (phu thuoc repro-test-generator.js)
  3b. Buoc 8a: Regression Analysis (phu thuoc regression-analyzer.js)

Phase 4: Business Logic Sync (phu thuoc module v1.4 da co)
  4a. Buoc 9.7: Phat hien thay doi + cap nhat report + xuat PDF

Phase 5: Finalization
  5a. Cap nhat workflows/fix-bug.md (gop tat ca buoc moi)
  5b. Tai tao converter snapshots
  5c. Cap nhat tests tong the
```

**Ly do thu tu:**
- Phase 1 tao module doc lap, testable rieng le
- Phase 2 la cac buoc workflow don gian, khong can module moi
- Phase 3 tich hop module Phase 1 vao workflow
- Phase 4 tai su dung module v1.4, can workflow da co cac buoc truoc do
- Phase 5 tong hop tat ca vao workflow chinh thuc

## Tuong thich nguoc

| Khia canh | Trang thai | Ghi chu |
|-----------|----------|---------|
| Skill name `pd:fix-bug` | Khong doi | Giu nguyen ten goi |
| allowed-tools | Khong doi | Da co du tools can thiet |
| model: sonnet | Khong doi | |
| 10 buoc hien tai | Giu nguyen | Cac buoc moi la INSERT, khong thay the |
| SESSION_*.md format | Tuong thich | Them sections moi, khong xoa sections cu |
| BUG_*.md format | Tuong thich | Them muc "Phan tich hoi quy", khong sua format cu |
| .planning/ structure | Tuong thich | Khong tao thu muc moi |
| Commit format [LOI] | Khong doi | Giu nguyen convention |

## File System Layout sau v1.5

```
please-done/
  bin/
    lib/
      repro-test-generator.js     [MOI]
      regression-analyzer.js      [MOI]
      report-filler.js            (khong doi)
      generate-diagrams.js        (khong doi)
      pdf-renderer.js             (khong doi)
      mermaid-validator.js        (khong doi)
      plan-checker.js             (khong doi)
      utils.js                    (khong doi)
    generate-pdf-report.js        (khong doi)
    plan-check.js                 (khong doi)
  workflows/
    fix-bug.md                    [SUA — them 6 buoc moi]
    complete-milestone.md         (khong doi)
    ...                           (khong doi)
  commands/pd/
    fix-bug.md                    (khong doi)
    ...                           (khong doi)
  test/
    smoke-repro-test-generator.test.js   [MOI]
    smoke-regression-analyzer.test.js    [MOI]
    snapshots/                           [TAI TAO]
    ...                                  (khong doi)
```

**Tong ket:** 2 file library moi, 1 file workflow sua, 2 file test moi, snapshots tai tao. Tac dong toi thieu len codebase hien tai.

## Sources

- Phan tich codebase: workflows/fix-bug.md (348 dong, 10 buoc)
- Phan tich codebase: commands/pd/fix-bug.md (81 dong, 10 tools)
- Phan tich codebase: bin/lib/report-filler.js (219 dong, fillManagementReport)
- Phan tich codebase: bin/lib/generate-diagrams.js (550 dong, 2 ham chinh)
- Phan tich codebase: bin/generate-pdf-report.js (112 dong, CLI wrapper)
- Phan tich codebase: bin/lib/pdf-renderer.js (237 dong, MD->HTML->PDF)
- Phan tich codebase: workflows/scan.md (section "Canh bao bao mat")
- Phan tich codebase: workflows/complete-milestone.md (Buoc 3.6 pattern)
- Phan tich codebase: .planning/PROJECT.md (v1.5 milestone context)
- Phan tich codebase: 2_UPGRADE_FIX_BUG.md (deliverables goc)
