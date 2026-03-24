# Pitfalls Research

**Domain:** Nang cap fix-bug workflow — them automated test generation, regression analysis, auto cleanup, business logic detection, PDF report auto-update, security linking, post-mortem suggestions
**Researched:** 2026-03-24
**Confidence:** HIGH

## Critical Pitfalls

### Pitfall 1: Workflow Step Explosion — Fix-Bug Da Co 10 Buoc, Them 7 Tinh Nang Moi Tao Ra "Distributed System of Interns"

**What goes wrong:**
Fix-bug hien tai co 10 buoc chinh (0.5 -> 10) voi nhieu sub-step (1a, 1b, 5a, 5b, 5c, 6a, 6b, 6c, 6.5a-d). Them 7 tinh nang moi (reproduction test, regression analysis, auto cleanup, business logic detection, PDF update, security linking, post-mortem) co the nang tong so buoc len 17+ buoc. Nghien cuu cua Anthropic cho thay agent tieu thu 4x nhieu token hon chat don gian; voi multi-step workflows dai hon 5 buoc, failure rate tang theo ham mu. Khi fix-bug dat 15+ buoc, agent se:
- Mat context giua cac buoc (token window exhaustion)
- Bo qua buoc vi prompt qua dai
- Thuc hien sai thu tu vi khong nho het flow
- Tieu hao token khong can thiet cho nhung buoc khong lien quan den bug cu the

**Why it happens:**
Moi tinh nang moi tu nhien tro thanh 1 buoc moi trong workflow. Dev nghi "them 1 buoc nua thi co gi dau" nhung hieu ung tich luy lam workflow khong the maintain. Fix-bug skill chay tren Sonnet (line 4 cua fix-bug.md: `model: sonnet`) — mot model gia re hon Opus, co context window nho hon va de bi "lost" trong prompt dai.

**How to avoid:**
1. **KHONG them buoc moi vao main flow.** Thay vao do, dung pattern "conditional sub-step" da co san (vi du Buoc 0.5 chi chay khi co nhieu bug, Buoc 6.5 chi chay khi la logic bug). Moi tinh nang moi PHAI la conditional — chi khi relevant.
2. **Nho buoc vao buoc hien tai thay vi tao buoc moi:**
   - Reproduction test → mo rong Buoc 5b (Tai hien toi gian) — thay vi chi mo ta, tao test case
   - Regression analysis → mo rong Buoc 4 (Tim hieu files lien quan) — them call chain check
   - Auto cleanup → mo rong Buoc 9 (Git commit) — them pre-commit cleanup
   - Business logic detection → mo rong Buoc 6.5 (Logic Update) da co san
   - PDF update → mo rong Buoc 9 sau commit
   - Security linking → mo rong Buoc 3 (Doc tai lieu ky thuat)
   - Post-mortem → mo rong Buoc 10 (Yeu cau xac nhan) sau khi user confirm
3. **Budget token cho moi sub-step.** Tham khao Buoc 1.7 cua write-code (`~100 token budget`). Moi sub-step moi cung can budget.
4. **Giu workflow file duoi 400 dong.** Hien tai fix-bug.md co 347 dong. Muc tieu: khong qua 420 dong.

**Warning signs:**
- Workflow file vuot 400 dong
- Them hon 3 buoc so moi (vi du "Buoc 11", "Buoc 12", "Buoc 13")
- Agent bat dau bo qua buoc trong qua trinh thuc hien
- Token usage tren moi fix-bug session tang >30%
- Buoc moi khong co dieu kien skip ("luon luon chay" thay vi "chi khi can")

**Phase to address:**
Phase dau tien (Thiet ke workflow) — quyet dinh cau truc truoc khi code bat ky module nao.

---

### Pitfall 2: Reproduction Test Generation Tao Test Khong Co Gia Tri — "Test That Tests Nothing"

**What goes wrong:**
AI tao reproduction test case tu mo ta bug, nhung test:
- Qua generic (chi assert `toBeDefined()` hoac `not.toThrow()`)
- Khong tai hien duoc bug thuc te vi thieu context runtime (database state, session, environment)
- Test pass ca khi bug chua duoc sua (false negative) vi assert sai logic
- Test fail vi ly do khong lien quan den bug (flaky test do environment)
- Framework-specific test (NestJS, Flutter) yeu cau setup phuc tap ma AI generate khong dung

Theo nghien cuu IEEE/ACM 2024 ve "Automatic Generation of Test Cases based on Bug Reports", LLM-generated test co ty le 27-48% false positive (test pass khi khong nen) va can human review bat buoc.

**Why it happens:**
AI co du bug description va code, nhung thieu runtime context. Mot unit test cho NestJS controller can mock Service, Repository, Guard, Pipe — nhung AI thuong mock sai hoac thieu mock. Flutter widget test can pumpWidget voi dung Provider tree — AI thuong bo qua. Ket qua: test compile duoc nhung khong test dung bug.

**How to avoid:**
1. **Pure function module tao test TEMPLATE, khong tao test hoan chinh.** Module `generateReproductionTest()` nhan input la: stack (NestJS/Flutter/...), bug description, affected files, root cause hypothesis → output la test template co TODO markers cho developer dien them. KHONG co tham vong tao test chay duoc ngay.
2. **Template theo stack.** Moi stack can template rieng:
   - NestJS: `Test.createTestingModule()` voi placeholder providers
   - Flutter: `testWidgets()` voi placeholder widget tree
   - Generic: simple function test voi placeholder input/output
3. **Output la Markdown block trong SESSION file, KHONG phai file .test.ts/.test.dart.** De user review va chinh sua truoc khi commit. Tranh tao file test roi vao test suite chay tu dong.
4. **Validate: test PHAI fail khi bug chua sua.** Them instruction cho AI: "Test nay PHAI fail khi chay tren code hien tai (truoc khi sua). Neu pass ngay → test sai."

**Warning signs:**
- Test generated chi co `expect(result).toBeDefined()` hoac tuong tu
- Test pass ngay ca khi bug chua duoc fix
- Test require import tu module khong ton tai
- Khong co TODO/placeholder nao trong test output — gia dinh AI biet het
- Test duoc tu dong tao file trong `test/` thay vi hien thi trong SESSION

**Phase to address:**
Phase rieng cho reproduction test (som) — xay dung va test module truoc khi tich hop vao workflow.

---

### Pitfall 3: Regression Analysis Qua MCP FastCode Tao Noise — False Dependency Cascade

**What goes wrong:**
Regression analysis goi `mcp__fastcode__code_qa` de tim "module phu thuoc qua call chain". FastCode tra ve dependency tree rong — vi du, sua 1 utility function thi FastCode bao 50+ files depend on no. Ket qua:
- AI mat thoi gian phan tich 50 files khong lien quan
- AI bao "anh huong rong" lam user hoang — quyet dinh khong sua hoac sua qua than trong
- Token exhaustion vi doc qua nhieu file
- False positive: file A import utility B nhung KHONG dung function bi loi trong B

Theo nghien cuu ve regression testing, "change impact analysis" thieu chinh xac khi chi dua vao static dependency — can ket hop voi actual usage pattern (dynamic analysis).

**Why it happens:**
FastCode tra ve tat ca references, khong phan biet:
- Direct usage cua function bi loi vs. import cua module chua function bi loi
- Active code path vs. dead code
- Test files vs. production files

**How to avoid:**
1. **Gioi han depth.** Regression analysis chi check 1-2 level dependency, KHONG full transitive closure. Vi du: file A goi function B bi loi → check A. File C import A nhung KHONG goi B → KHONG check C.
2. **Filter by affected function, khong phai affected file.** Neu bug o function `calculateTax()` trong `utils.js`, chi tim files goi `calculateTax()`, KHONG phai tat ca files import `utils.js`.
3. **Gioi han so luong file bao cao.** Maximum 5-10 files trong regression report. Nhieu hon → "Co the anh huong them [N] files. Dung FastCode de kiem tra chi tiet."
4. **Pure function: `analyzeRegressionImpact()` nhan list of affected functions + FastCode results → tra ve filtered list.** KHONG goi FastCode trong module — de workflow goi FastCode truoc, truyen ket qua vao module.
5. **Tach test files va production files.** Regression report chi bao production files. Test files khong can check regression — chung se duoc chay lai anyway.

**Warning signs:**
- Regression report liet ke >10 files
- Regression report bao gom test files
- Module tu goi MCP tool (vi pham pure function pattern)
- AI bat dau doc tung file trong regression list (token waste)
- User thay bao "anh huong 30 modules" cho bug nho

**Phase to address:**
Phase rieng cho regression analysis — can prototype va test voi real FastCode output truoc khi tich hop.

---

### Pitfall 4: Auto Cleanup Xoa Code Khong Phai Debug — "The Regex That Ate Production Code"

**What goes wrong:**
Auto cleanup co nhiem vu xoa `console.log`, `debugger`, `print()`, comment tam (`// TODO: debug`, `// TEMP`) truoc khi commit. Nhung:
- Regex match `console.log` trong production code (vi du logging framework, error handler)
- Xoa `console.error` hoac `console.warn` ma developer muon giu
- Xoa comment chua thong tin quan trong (vi du `// HACK: workaround for library bug #123`)
- Flutter: xoa `print()` statement trong production code (Dart dung `print()` cho ca debug lan production logging)
- NestJS: xoa `Logger.debug()` statement ma dev muon giu

Theo kinh nghiem git hooks community, auto-cleanup gom 2 truong hop: (1) xoa code AI tu them khi dieu tra, (2) xoa code developer tu them. Truong hop (2) rat nguy hiem vi AI khong biet intention.

**Why it happens:**
Pattern matching khong the hieu context. `console.log('User logged in:', userId)` co the la debug log hoac audit log — regex khong phan biet duoc. Auto cleanup chay truoc commit nen neu sai thi da muon — code bi xoa khong co undo (tru khi git stash).

**How to avoid:**
1. **CHI xoa code ma AI tu them trong buoc 5 (Phan tich).** Module can tracking: AI them `console.log` o dong nao, file nao → CHI xoa nhung dong do. KHONG xoa bat ky dong nao khac.
2. **Dung marker pattern.** Khi AI them debug log, PHAI dung marker: `// [DEBUG-SESSION]` hoac `console.log('[PD-DEBUG]', ...)`. Auto cleanup chi xoa dong co marker nay.
3. **Pure function: `identifyCleanupTargets(fileContent, markers)` → tra ve list of line numbers.** KHONG tu dong xoa — tra ve danh sach de workflow hien thi cho user xac nhan.
4. **Default: list-only mode.** Hien thi "Cac dong debug can xoa:" va de user confirm truoc khi xoa. CHI auto-xoa khi user opt-in (vi du flag `--auto-cleanup`).
5. **KHONG BAO GIO xoa code trong file ma AI KHONG them vao.** Auto cleanup chi ap dung cho files ma AI da sua trong buoc 8.

**Warning signs:**
- Module dung regex xoa `console.log` toan bo file thay vi chi dong co marker
- Khong co buoc xac nhan user truoc khi xoa
- Cleanup chay tren files ma AI khong sua
- Khong co list-only/dry-run mode
- Flutter files mat `print()` statements ma developer can

**Phase to address:**
Phase cung voi workflow integration — cleanup phai duoc thiet ke cung luc voi marker system.

---

### Pitfall 5: Business Logic Detection False Positives — Moi Thay Doi Deu Bi Flag La "Logic Change"

**What goes wrong:**
Buoc 6.5 hien tai hoat dong tot vi DEVELOPER (AI agent) tu phan loai: "bug nay do logic sai hay loi cu phap?". Khi tu dong hoa business logic detection, he thong se phai TU DONG phan biet:
- Sua condition `if (x > 10)` thanh `if (x >= 10)` → logic change ✅
- Sua typo `calcuate` thanh `calculate` → KHONG phai logic change ❌
- Them null check `if (!user) return` → defensive coding, khong phai logic change ❌
- Sua import path → KHONG phai logic change ❌

Theo NIST, false positive rate cua automated static analysis tools la 3-48%. Voi business logic detection (khong phai don gian nhu syntax check), false positive se o dau cao.

Qua nhieu false positive → user ignore tat ca warnings → true positive bi bo lo.

**Why it happens:**
Phan biet "logic change" va "bug fix" yeu cau hieu intent — dieu ma static analysis khong lam duoc. Hien tai Buoc 6.5 dung AI agent judgment (Sonnet) de phan loai, va pattern nay HOAT DONG TOT. Tu dong hoa buoc nay = thay the AI judgment bang rule-based system, thuong kem hon.

**How to avoid:**
1. **GIU Buoc 6.5 nhu hien tai — AI agent judgment.** KHONG thay the bang rule-based detection. Thay vao do, them tool HO TRO de AI phan loai nhanh hon.
2. **Module `detectBusinessLogicSignals()` chi tra ve SIGNALS, khong tra ve DECISIONS.** Vi du: "File nay co thay doi condition expressions: dong 45 `if (x > 10)` → `if (x >= 10)`". AI agent quyet dinh co phai logic change hay khong.
3. **Whitelist non-logic changes:** import changes, whitespace, comment-only changes, rename/refactor → tu dong loai tru, KHONG hien thi signal.
4. **Pure function: nhan old content + new content → tra ve list of change signals voi category (condition, arithmetic, string, import, comment, etc.).**
5. **Threshold: chi hien thi signal khi co condition/arithmetic/comparison changes.** String literal changes, import changes, etc. → im lang.

**Warning signs:**
- Module tra ve "logic change detected" cho moi diff
- User bat dau ignore logic change warnings
- Module co try/except quyet dinh "co phai logic change" thay vi de AI quyet
- Khong co category classification cho signals
- Module tu dong cap nhat PLAN.md ma khong hoi user

**Phase to address:**
Phase rieng cho business logic detection — test voi nhieu loai diff (typo fix, logic fix, refactor, feature add) de do false positive rate truoc khi tich hop.

---

### Pitfall 6: Pha Vo Pure Function Pattern — Module Moi Goi MCP/Doc File Truc Tiep

**What goes wrong:**
Du an da thiet lap pattern ro rang tu v1.1: "Tat ca functions la pure — nhan content, tra ket qua, khong doc file" (plan-checker.js dong 9, generate-diagrams.js dong 4, report-filler.js dong 4). 528 tests hien tai deu test pure functions — truyen content string, kiem tra output.

Khi them module moi, dev de bi cam do:
- `analyzeRegressionImpact()` goi truc tiep `mcp__fastcode__code_qa` de lay call chain
- `generateReproductionTest()` doc file source code de hieu context
- `detectBusinessLogicSignals()` goi `git diff` de lay changes
- `linkSecurityWarnings()` doc `.planning/scan/` de tim canh bao

Moi file I/O hoac MCP call trong module = khong the test bang unit test don gian. Se can mock MCP, mock filesystem → test phuc tap, de hong, kho maintain.

**Why it happens:**
"Tien qua" — de function tu lay du lieu thay vi yeu cau caller truyen vao. Developer nghi "chi 1 dong `require('fs')` thoi" nhung 1 dong do pha vo toan bo testing strategy.

**How to avoid:**
1. **Rule bat buoc: TAT CA module trong `bin/lib/` PHAI la pure function.** Khong `require('fs')`, khong `require('child_process')`, khong MCP call.
2. **Workflow file (`.md`) chiu trach nhiem goi MCP/doc file va truyen ket qua cho module.** Day la pattern da thiet lap — Buoc 3.6 cua complete-milestone goi FastCode roi truyen ket qua cho `fillManagementReport()`.
3. **Test litmus: neu test can mock filesystem hoac MCP → module vi pham pure function pattern.** Tat ca test chi can `const result = myFunction(inputString)` → check result.
4. **Code review checkpoint: moi module moi PHAI co `// KHÔNG đọc file` trong JSDoc header.** Tham khao `report-filler.js` dong 5.

**Warning signs:**
- `require('fs')` xuat hien trong file `bin/lib/*.js` moi
- `require('child_process')` trong module moi
- Test file can `jest.mock()` hoac `sinon.stub()` cho filesystem
- Module nhan `filePath` thay vi `fileContent` lam parameter
- JSDoc khong co "KHONG doc file" declaration

**Phase to address:**
MOI phase — day la architectural constraint, khong phai 1-phase concern. Review moi module truoc khi merge.

---

### Pitfall 7: 528 Tests Va 48 Snapshots Bi Pha Khi Sua Fix-Bug Workflow

**What goes wrong:**
Sua `workflows/fix-bug.md` (them sub-steps) → 5 converter pipelines inline workflow content → 4 platform outputs thay doi → 4 snapshots (codex/fix-bug.md, copilot/fix-bug.md, gemini/fix-bug.md, opencode/fix-bug.md) out-of-sync → `smoke-snapshot.test.js` fail 4 tests. Con `smoke-integrity.test.js` validate file structure consistency va co the fail neu cau truc workflow thay doi.

Nghiem trong hon: moi thay doi trong `workflows/fix-bug.md` cung thay doi output cua `commands/pd/fix-bug.md` tren tat ca 5 platforms. Neu dev chi test tren Claude ma khong chay snapshot tests → 4 platforms khac bi hu ma khong biet.

**Why it happens:**
Converter pipeline inline workflow content — moi tu them/xoa trong workflow propagate den tat ca platform outputs. Day la BY DESIGN (dam bao consistency) nhung cung la trap khi developer quen chay snapshot test. Hien tai co 48 snapshots (4 platforms x 12 skills) — fix-bug la 1 trong 12.

**How to avoid:**
1. **Chay `node --test test/smoke-snapshot.test.js` SAU MOI THAY DOI workflow.** Khong doi den cuoi phase.
2. **Regenerate snapshots trong commit rieng:** `node test/generate-snapshots.js` → commit "chore: update fix-bug snapshots" TACH BIET khoi commit logic change.
3. **Diff snapshots truoc khi commit.** Dung `git diff test/snapshots/` de xac nhan CHI fix-bug snapshots thay doi. Neu snapshot khac (vi du write-code) cung thay doi → co loi.
4. **KHONG sua workflow va module cung 1 commit.** Workflow changes va library module changes PHAI la commits rieng de de revert.
5. **Test all 528 tests truoc moi PR/phase transition.** Nay la safety net chinh cua du an.

**Warning signs:**
- `smoke-snapshot.test.js` fail nhung dev chi update snapshots ma khong xem diff
- Snapshot diff cho thay thay doi o skills khac ngoai fix-bug
- Commit message "update snapshots" khong co commit truoc do giai thich tai sao snapshot thay doi
- Dev skip snapshot test vi "chi sua module, khong sua workflow"

**Phase to address:**
MOI phase co thay doi workflow — dac biet phases tich hop tinh nang vao fix-bug.md.

---

### Pitfall 8: PDF Report Auto-Update Trong Fix-Bug Tao Dependency Vong Tron Voi Complete-Milestone

**What goes wrong:**
v1.4 da thiet lap: complete-milestone Buoc 3.6 tao PDF report (non-blocking). v1.5 muon: fix-bug cung tu dong cap nhat PDF report khi logic thay doi. Day tao ra van de:
- Fix-bug goi `fillManagementReport()` + `generateBusinessLogicDiagram()` de cap nhat report
- Nhung report do thuoc ve milestone, va milestone co the chua duoc complete
- Fix-bug patch version (vi du v1.3.1) cap nhat report cua milestone v1.3 — nhung v1.3 da "shipped"
- Report template expect data tu STATE.md (performance metrics) — fix-bug khong co data nay
- Fix-bug chay tren Sonnet (gia re) — goi Puppeteer cho PDF render la overkill cho bug fix

**Why it happens:**
Report generation duoc thiet ke cho milestone completion context (co STATE.md, co tat ca PLAN.md, co SUMMARY.md). Fix-bug context hoan toan khac (co 1 bug, co 1-2 files). Dung cung module cho 2 context khac nhau → impedance mismatch.

**How to avoid:**
1. **Fix-bug CHI cap nhat Mermaid diagram, KHONG cap nhat toan bo report.** Khi bug thay doi business logic (Buoc 6.5), chi call `generateBusinessLogicDiagram()` de cap nhat diagram trong report file co san. KHONG call `fillManagementReport()` vi no can toan bo milestone data.
2. **Tao function rieng `updateReportDiagram(reportPath, newDiagram, sectionPrefix)` thay vi dung `fillManagementReport()`.** Function nay chi thay the mermaid block trong 1 section, khong fill toan bo template.
3. **Chi cap nhat report neu report da ton tai.** Neu `.planning/reports/management-report-v*.md` chua co → skip. Fix-bug khong tao report moi.
4. **PDF re-render la TUY CHON, khong bat buoc.** Hien thi: "Diagram da cap nhat trong report. Chay `node bin/generate-pdf-report.js [path]` de xuat PDF moi." KHONG tu dong chay Puppeteer.
5. **Non-blocking pattern nhu Buoc 3.6.** Moi loi khi cap nhat report chi la warning, khong bao gio chan fix-bug flow.

**Warning signs:**
- Fix-bug goi `fillManagementReport()` truc tiep
- Fix-bug can doc STATE.md, tat ca PLAN.md, tat ca SUMMARY.md
- Fix-bug fail khi report file chua ton tai
- Puppeteer duoc goi tu fix-bug workflow
- Fix-bug session mat >30 giay cho report generation

**Phase to address:**
Phase cho PDF/report integration — PHAI thiet ke rieng, khong dung lai truc tiep module cua complete-milestone.

---

### Pitfall 9: Security Reference Linking Tao Canh Bao Gia — "Wolf Cry" Pattern

**What goes wrong:**
Tinh nang lien ket `pd:scan` canh bao bao mat cho file bi loi. Van de:
- Scan report co the cu (chay tuan truoc), file da thay doi tu do
- Canh bao bao mat trong scan report la cho toan bo file, khong phai function bi loi
- AI hien thi canh bao "SQL injection risk in user.service.ts" cho bug "login button khong hoat dong" — khong lien quan
- Qua nhieu canh bao khong lien quan → user bo qua tat ca → bao loi canh bao that

**Why it happens:**
Scan report lien ket theo FILE, khong phai theo FUNCTION. Neu file A co 10 canh bao bao mat, va bug o file A, he thong se hien thi ca 10 canh bao — du bug chi anh huong 1 function khong lien quan den bao mat.

**How to avoid:**
1. **Filter theo function/line range.** Chi hien thi canh bao bao mat overlap voi vung code bi loi (line range cua bug).
2. **Check freshness.** Neu scan report cu hon 7 ngay → warning: "Scan report co the loi thoi. Chay `pd:scan` de cap nhat."
3. **Relevance scoring.** Module `filterSecurityWarnings(warnings, bugContext)` nhan canh bao + bug context → tra ve CHI canh bao lien quan (cung function, cung module, cung data flow).
4. **Maximum 3 canh bao.** Hien thi toi da 3 canh bao lien quan nhat. Nhieu hon → "Va [N] canh bao khac. Xem chi tiet tai [file]."
5. **CHI hien thi, KHONG chan.** Canh bao bao mat la thong tin bo sung, KHONG phai gate check. Fix-bug khong dung vi file co canh bao bao mat.

**Warning signs:**
- Moi fix-bug session hien thi 5+ canh bao bao mat
- Canh bao khong lien quan den bug hien tai
- User bat dau ignore security section
- Module doc toan bo scan report thay vi filter
- Scan report khong co timestamp → khong biet do moi hay cu

**Phase to address:**
Phase cho security linking — can test voi real scan data de do relevance accuracy.

---

### Pitfall 10: Post-Mortem CLAUDE.md Suggestion Ghi De User Configuration

**What goes wrong:**
Post-mortem de xuat cap nhat CLAUDE.md (vi du them rule "luon check null truoc khi access property"). Van de:
- AI append rule vao CLAUDE.md ma user khong biet
- Rule bi trung voi rule da co
- Rule qua cu the (chi ap dung cho 1 bug) nhung duoc viet nhu rule chung
- Rule xung dot voi rule hien tai cua user
- CLAUDE.md la config file ca nhan — tu dong sua la xam pham user autonomy

Bai hoc tu Zed editor auto-update post-mortem: auto-update config file khong co consent tao trust erosion lon.

**Why it happens:**
AI agent co kha nang Write file, va CLAUDE.md la file text binh thuong. Khong co gi ngan AI ghi truc tiep. Nhung CLAUDE.md la "constitution" cua codebase — moi dong trong do anh huong den MOI conversation tiep theo. Tu dong sua no giong nhu tu dong sua .bashrc — nguy hiem.

**How to avoid:**
1. **CHI DE XUAT, KHONG TU DONG SUA.** Module `generatePostMortemSuggestions()` tra ve list of suggestions dang Markdown. Hien thi cho user. User tu quyet dinh co them vao CLAUDE.md khong.
2. **Output la Markdown block trong BUG report, khong phai diff/patch cho CLAUDE.md.** User copy-paste neu muon.
3. **De-duplicate: check CLAUDE.md hien tai de tranh de xuat rule da ton tai.** Module `filterExistingSuggestions(currentClaudeMd, suggestions)` loai bo trung lap.
4. **Scope qualifier.** Moi suggestion phai co scope: "[Du an nay]" vs "[Tat ca du an]". Vi du: "Nen them vao project CLAUDE.md: Luon validate input truoc khi xu ly" vs. "Nen them vao global CLAUDE.md".
5. **Maximum 2 suggestions per bug.** Nhieu hon → noise. AI nen chon 2 bai hoc quan trong nhat.

**Warning signs:**
- Module goi `Write` tool de sua CLAUDE.md truc tiep
- Suggestion khong co scope qualifier
- Suggestion trung voi rule da co trong CLAUDE.md
- Moi bug deu co suggestion (qua nhieu → user ignore)
- Suggestion qua cu the: "Khong dung `user.name` ma khong check null" thay vi "Validate object properties truoc khi access"

**Phase to address:**
Phase cuoi cung — post-mortem la tinh nang it quan trong nhat va co risk ghi de config cao nhat.

---

## Technical Debt Patterns

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Goi MCP truc tiep trong module lib/ | Khong can workflow truyen data | Pha vo pure function pattern, test phuc tap 10x, mock hell | Khong bao gio — workflow goi MCP, truyen ket qua cho module |
| Tao file test tu dong trong `test/` | User co reproduction test ngay | File test khong dung chay trong CI, false pass, test suite bloat | Khong bao gio — output la Markdown template, khong phai file |
| Them tat ca tinh nang nhu buoc moi trong workflow | Workflow doc ro rang tung buoc | 17+ buoc, agent lost context, token waste | Khong bao gio — dung conditional sub-step pattern |
| Auto cleanup chay khong can user confirm | Developer khong can review | Xoa code production, data loss, trust erosion | Chi khi co marker system va user opt-in |
| Dung `fillManagementReport()` cho ca fix-bug va complete-milestone | Reuse code | Impedance mismatch, fix-bug can data khong co, fail khi report chua ton tai | Khong bao gio — tao function rieng cho partial update |
| Skip snapshot regeneration sau khi sua workflow | Nhanh hon | 4 platform outputs sai, regression o platform khac | Khong bao gio — snapshot la safety net |
| Post-mortem tu dong ghi CLAUDE.md | User khong can lam gi | Ghi de config ca nhan, rule xung dot, trust erosion | Khong bao gio — chi de xuat, user tu quyet dinh |

## Integration Gotchas

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| Reproduction test + fix-bug workflow | Tao test o Buoc 5 (phan tich) truoc khi co ket luan | Chi tao test TEMPLATE sau khi xac dinh nguyen nhan (sau Buoc 6c gate check) |
| Regression analysis + FastCode MCP | Goi FastCode trong module lib/ | Workflow goi FastCode o Buoc 4, truyen ket qua cho `analyzeRegressionImpact(fastcodeResults)` |
| Auto cleanup + git commit | Cleanup chay SAU git add | Cleanup chay TRUOC git add — xoa debug markers → git add → commit |
| Business logic detection + Buoc 6.5 | Thay the AI judgment bang rule-based | Them signals tool HO TRO AI judgment, khong thay the no |
| PDF update + fix-bug | Goi fillManagementReport() | Tao updateReportDiagram() rieng chi thay the mermaid block |
| Security linking + scan data | Doc toan bo scan report | Filter theo line range cua bug va relevance scoring |
| Post-mortem + CLAUDE.md | Tu dong Write vao CLAUDE.md | Output Markdown block trong BUG report, user tu copy |
| Module moi + converter snapshots | Chi test Claude output | Chay 48 snapshot tests sau moi thay doi workflow |
| Buoc moi + existing flow | Insert buoc giua cac buoc hien tai (vi du "Buoc 7.5") | Mo rong buoc hien tai (vi du them sub-step 5b.1) |

## Performance Traps

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| Regression analysis chay FastCode cho moi file trong project | Fix-bug session mat 2-3 phut cho analysis | Gioi han FastCode query: chi file truc tiep lien quan, max 5 queries | >5 FastCode calls per session |
| Reproduction test generation cho moi bug | Token waste cho bug don gian (typo fix khong can test) | Chi generate test cho logic bugs (phan loai 🟡 tro len) | Bug don gian (🟢) bi bat tao test |
| PDF re-render khi moi logic change | Puppeteer launch 2-5 giay, khong can thiet | Chi cap nhat markdown, de user tu render PDF | Moi fix-bug session goi Puppeteer |
| Security scan file read cho moi bug | I/O unnecessary khi bug khong lien quan security | Chi doc scan data khi bug la 🔴 (bao mat) hoac file co known vulnerability | Moi fix-bug session doc scan data |
| Full dependency tree traversal | FastCode timeout, token explosion | Gioi han depth 2, max 10 files | Utility function co 50+ dependents |

## Security Mistakes

| Mistake | Risk | Prevention |
|---------|------|------------|
| Reproduction test hardcode credentials/tokens tu bug report | Test file chua secrets, committed vao git | Test template PHAI co placeholder `[CREDENTIALS_HERE]`, KHONG bao gio copy tu bug description |
| Auto cleanup xoa security-related logs | Mat audit trail khi debug security incident | Whitelist `console.error`, `Logger.error`, `Logger.warn` khoi cleanup |
| Post-mortem suggest disable security check | User follow suggestion → vuln moi | Module KHONG bao gio suggest disable/skip security (null check, auth check, validation) |
| Security linking hien thi vulnerability details trong SESSION file | SESSION file co the bi share/commit | Chi hien thi title + severity, KHONG hien thi exploit details |

## UX Pitfalls

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| Moi fix-bug session chay tat ca 7 tinh nang moi | Bug don gian mat 5 phut thay vi 1 phut | Conditional: chi chay features lien quan den bug type |
| Regression report dai 50 dong | User khong doc, skip | Max 10 dong, summary first, detail on demand |
| 5+ canh bao bao mat moi bug | Alert fatigue, ignore tat ca | Max 3 canh bao lien quan nhat |
| Post-mortem de xuat sau MOI bug | Moi fix-bug session co "bai hoc" | Chi de xuat cho bug 🟡 tro len (logic, data, security) |
| Auto cleanup hoi confirm cho moi dong | 20 prompts "Xoa dong nay? (y/n)" | Hien thi danh sach, confirm 1 lan: "Xoa [N] dong debug? (y/n)" |
| PDF render fail lam fix-bug cham | User doi Puppeteer | KHONG tu dong render PDF trong fix-bug. Chi cap nhat markdown |

## "Looks Done But Isn't" Checklist

- [ ] **Reproduction test module:** Thuong thieu stack-specific template — verify co template cho NestJS, Flutter, va Generic
- [ ] **Reproduction test output:** Thuong output file .test.ts thay vi Markdown — verify output la Markdown block trong SESSION file
- [ ] **Regression analysis module:** Thuong goi FastCode truc tiep — verify module nhan ket qua FastCode qua parameter, khong tu goi
- [ ] **Auto cleanup:** Thuong thieu marker system — verify AI them marker `[PD-DEBUG]` khi insert debug log, va cleanup chi xoa marker dong
- [ ] **Auto cleanup:** Thuong thieu user confirm — verify co buoc hien thi list va cho user approve
- [ ] **Business logic detection:** Thuong flag moi thay doi la "logic change" — verify co whitelist cho import/comment/whitespace changes
- [ ] **PDF update:** Thuong goi fillManagementReport() — verify dung function rieng updateReportDiagram()
- [ ] **PDF update:** Thuong fail khi report chua ton tai — verify co check existence va skip gracefully
- [ ] **Security linking:** Thuong hien thi tat ca canh bao — verify co filter theo line range va max 3
- [ ] **Post-mortem:** Thuong tu dong Write CLAUDE.md — verify CHI output Markdown suggestion, KHONG write file
- [ ] **Post-mortem:** Thuong de xuat rule trung voi rule da co — verify co de-duplication check
- [ ] **Workflow file:** Thuong vuot 400 dong — verify fix-bug.md duoi 420 dong sau thay doi
- [ ] **Snapshot tests:** Thuong bi bo qua sau sua workflow — verify 48 snapshots in-sync sau moi workflow change
- [ ] **Pure function:** Thuong bi vi pham boi module moi — verify 0 instances cua `require('fs')` trong `bin/lib/*.js` moi

## Recovery Strategies

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| Workflow qua dai, agent mat context | MEDIUM | Refactor: nhom sub-steps thanh conditional blocks, xoa steps khong can thiet, them skip conditions |
| Test generation tao file trong test suite | LOW | Xoa generated test files, chuyen output sang Markdown format, update module |
| Module vi pham pure function | MEDIUM | Refactor: tach I/O ra workflow, chuyen module sang pure input/output, sua tat ca tests |
| Auto cleanup xoa production code | HIGH | `git stash pop` hoac `git checkout -- [file]` de khoi phuc. Them marker system, them user confirm |
| Snapshot out of sync | LOW | `node test/generate-snapshots.js`, verify diff, commit snapshots rieng |
| Report update fail khi report chua ton tai | LOW | Them existence check va skip. No error, no warning — just skip |
| CLAUDE.md bi overwrite | MEDIUM | `git checkout -- CLAUDE.md` de khoi phuc. Chuyen module sang suggestion-only mode |
| False positive security alerts | LOW | Them relevance filter, giam max alerts tu 10 xuong 3, them freshness check |
| Regression analysis bao 50 files | LOW | Them depth limit (2), them max files (10), them function-level filter |

## Pitfall-to-Phase Mapping

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| Workflow step explosion (#1) | Phase 1 (Thiet ke workflow) | fix-bug.md duoi 420 dong; 0 buoc moi, chi sub-steps conditional |
| Test generation khong gia tri (#2) | Phase reproduction test | Test template output co TODO markers; output la Markdown; test PHAI fail truoc fix |
| Regression false cascade (#3) | Phase regression analysis | Max 10 files trong report; module KHONG goi MCP; depth <= 2 |
| Auto cleanup xoa code (#4) | Phase auto cleanup + workflow integration | Co marker system `[PD-DEBUG]`; co user confirm; chi xoa files AI da sua |
| Business logic false positives (#5) | Phase business logic detection | Co whitelist (import/comment/whitespace); false positive rate <20% tren test cases |
| Pha vo pure function (#6) | MOI phase | 0 `require('fs')` trong bin/lib/ moi; tat ca test la `const result = fn(input)` |
| Snapshot breakage (#7) | MOI phase co workflow change | 528+ tests pass; 48 snapshots in-sync; diff chi o fix-bug snapshots |
| PDF dependency vong tron (#8) | Phase PDF integration | KHONG goi fillManagementReport() tu fix-bug; co updateReportDiagram() rieng |
| Security wolf cry (#9) | Phase security linking | Max 3 alerts; filter theo line range; freshness check |
| CLAUDE.md overwrite (#10) | Phase post-mortem (cuoi cung) | Module KHONG goi Write; output la Markdown suggestion; co de-dup |

## Phase-Specific Risk Summary

### Phase 1: Thiet ke workflow (HIGH RISK)
Quyet dinh co ban: them buoc moi hay mo rong buoc hien tai? Sai o day = workflow khong maintain duoc cho toan bo v1.5. Phai xac dinh: moi tinh nang la conditional sub-step cua buoc nao, trigger condition la gi, skip condition la gi.
- **Primary risks:** Pitfall 1 (step explosion), Pitfall 6 (pure function)
- **Mitigation:** Budget max 420 dong, conditional-only additions, pure function contract

### Phase module development (MEDIUM RISK)
Tao cac pure function module. Risk chinh la vi pham pure function pattern va tao test khong co gia tri.
- **Primary risks:** Pitfall 2 (test generation), Pitfall 3 (regression noise), Pitfall 5 (false positives), Pitfall 6 (pure function)
- **Mitigation:** Pure function enforcement, template-not-file output, depth limits, signal-not-decision pattern

### Phase workflow integration (HIGH RISK)
Tich hop module vao fix-bug.md. Risk chinh la snapshot breakage va workflow complexity.
- **Primary risks:** Pitfall 1 (step explosion), Pitfall 4 (auto cleanup), Pitfall 7 (snapshot)
- **Mitigation:** Moi thay doi workflow → snapshot test ngay. Conditional sub-steps only.

### Phase PDF + report (MEDIUM RISK)
Cap nhat report khi logic thay doi. Risk chinh la dependency vong tron voi complete-milestone.
- **Primary risks:** Pitfall 8 (PDF dependency)
- **Mitigation:** Function rieng cho partial update. Khong dung fillManagementReport().

### Phase post-mortem (LOW-MEDIUM RISK)
De xuat cap nhat CLAUDE.md. Risk chinh la tu dong ghi file.
- **Primary risks:** Pitfall 10 (CLAUDE.md overwrite)
- **Mitigation:** Suggestion-only output. Maximum 2 suggestions. De-duplication check.

## Sources

- [IEEE/ACM 2024 — Automatic Generation of Test Cases based on Bug Reports: Feasibility Study with LLMs](https://dl.acm.org/doi/abs/10.1145/3639478.3643119)
- [Anthropic research on agent token consumption — referenced via TowardsDataScience](https://towardsdatascience.com/a-developers-guide-to-building-scalable-ai-workflows-vs-agents/)
- [DEV Community — Why Your AI Workflow Design Might Be Overcomplicated](https://dev.to/lofcz/why-your-ai-workflow-design-might-be-overcomplicated-1hfb)
- [DEV Community — I Let an AI Agent Handle a Multi-Step Task. Here's Where It Broke](https://dev.to/leena_malhotra/i-let-an-ai-agent-handle-a-multi-step-task-heres-where-it-broke-m31)
- [BrowserStack — How to avoid False Positives and False Negatives in Testing](https://www.browserstack.com/guide/false-positives-and-false-negatives-in-testing)
- [NIST SAST false positive rates — referenced via Abnormal AI](https://abnormal.ai/blog/detection-engineering)
- [Aikido — Remove Debugging and Temporary Code Before Commits](https://www.aikido.dev/code-quality/rules/remove-debugging-and-temporary-code-before-commits-a-security-and-performance-guide)
- [Zed Editor — Auto Update Post-Mortem](https://zed.dev/blog/auto-update-post-mortem)
- [QualityLogic — 5 Big Mistakes in Test Automation](https://www.qualitylogic.com/knowledge-center/top-5-reasons-test-automation-fails/)
- Direct codebase analysis: `workflows/fix-bug.md` (347 dong, 10 buoc chinh voi sub-steps)
- Direct codebase analysis: `commands/pd/fix-bug.md` (model: sonnet, 14 allowed-tools)
- Direct codebase analysis: `bin/lib/*.js` (8 pure function modules, 0 file I/O)
- Direct codebase analysis: `test/` (528 tests, 48 converter snapshots, 13 test files)
- Direct codebase analysis: `bin/lib/report-filler.js` (pure function pattern, non-blocking try/catch)
- Direct codebase analysis: `workflows/complete-milestone.md` Buoc 3.6 (non-blocking pattern precedent)

---
*Pitfalls research for: Nang cap fix-bug workflow v1.5 — Please-Done*
*Researched: 2026-03-24*
