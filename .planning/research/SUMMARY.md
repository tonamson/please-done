# Project Research Summary

**Project:** please-done v1.5 — Nang cap Skill Fix-Bug
**Domain:** Tu dong hoa dieu tra loi, phan tich hoi quy, dong bo business logic, bao cao PDF
**Researched:** 2026-03-24
**Confidence:** HIGH

---

## Executive Summary

v1.5 nang cap workflow `fix-bug` hien co (10 buoc) bang cach them 7 tinh nang tu dong hoa: tao reproduction test case, phan tich regression qua FastCode call chain, don dep debug log truoc commit, dong bo business logic, cap nhat bao cao quan ly + PDF, lien ket canh bao bao mat, va de xuat post-mortem CLAUDE.md. Nghien cuu xac nhan tat ca 7 tinh nang co the xay dung hoan toan ma **khong them bat ky dependency moi** nao — chi can 2 module JS moi (repro-test-generator, regression-analyzer), mo rong workflow markdown, va tai su dung cac module v1.4 da co (report-filler, generate-diagrams, generate-pdf-report).

Kien truc chinh la **Workflow-First, Module-Lean**: phan lon logic nam trong workflow markdown (AI agent xu ly), module JS moi CHI duoc tao khi co logic phuc tap can test don vi doc lap. Nguyen tac pure function tuyet doi (khong doc file, khong goi MCP trong lib/) phai duoc duy tri — day la constraint kien truc cot loi tu v1.1 dam bao 526 tests hien tai van chay. Tat ca 7 tinh nang moi deu la "conditional sub-steps" nam trong cac buoc hien co (khong tao buoc moi so), giu workflow duoi nguong 420 dong.

Rui ro lon nhat la Workflow Step Explosion — them tinh nang sai cach co the lam fix-bug.md vuot 400 dong va agent mat context. Phuong an phong tranh ro rang: nho tinh nang vao buoc hien tai (khong tao buoc moi so), dung conditional pattern, giu moi sub-step non-blocking. Cac rui ro khac (false positive tu auto cleanup, regression analysis noise, PDF dependency vong tron) deu co phuong an cu the da duoc nghien cuu.

---

## Key Findings

### Recommended Stack

Khong co dependency moi nao can them. Toan bo v1.5 xay dung tren Node.js 18+ built-in APIs (regex, string, array, node:test). 5 module JS moi uoc tinh tong ~400-600 LOC — tat ca la pure functions, moi module co 1 test file tuong ung.

**Core technologies (lien quan v1.5):**
- **Node.js built-ins (regex, string, array, node:test, node:assert):** Xu ly text cho 5 module moi — thay the hoan toan ts-morph, jscodeshift, graphlib, diff library
- **Template literals JS:** Tao reproduction test skeleton theo stack (NestJS, Flutter, Generic) — ~100-150 LOC, khong can AST parser
- **Regex line filter:** Auto cleanup debug logs multi-stack (JS, TS, Dart, PHP) — chi match pattern co marker ro rang `[PD-DEBUG]`
- **Array-based BFS:** Regression dependency traversal 1-2 levels — thay the graphlib
- **FastCode MCP (da co):** Call chain analysis chinh xac cho regression — module regression-analyzer la FALLBACK
- **report-filler.js + generate-diagrams.js + generate-pdf-report.js (v1.4, da co):** Tai su dung truc tiep cho PDF pipeline, khong sua

**Van de shared parser can giai quyet o Phase 1:** `parseTruthsFromContent` hien ton tai inline o 2 noi (generate-diagrams.js va plan-checker.js noi bo). Can quyet dinh: tao shared helper `bin/lib/truths-parser.js` rieng hay de logic-change-detector.js inline (nhu generate-diagrams.js da lam). Trade-off: DRY vs circular dep risk.

**Chi tiet:** Xem `.planning/research/STACK.md`

### Expected Features

7 tinh nang chia lam 5 Table Stakes + 2 Differentiators, tat ca phai ship trong v1.5.

**Must have — Table Stakes:**
- **TS-1: Reproduction Test Case** (Buoc 5b) — tao skeleton test file trong `.planning/debug/repro/`, AI dien TODO markers, khong chay tu dong
- **TS-2: Regression Analysis** (Buoc 8) — goi FastCode call chain truoc khi sua, bao cao modules anh huong (toi da 5-10 files), chi canh bao, khong tu dong sua
- **TS-3: Auto Cleanup** (Buoc 9) — scan marker `[PD-DEBUG]` ma AI tu them, hoi user truoc khi xoa (list-only mode mac dinh), KHONG tu dong
- **TS-4: Dong bo Business Logic** (Buoc 10) — AI danh gia thay doi logic bang heuristics (condition/arithmetic/endpoint signals), khong thay the AI judgment bang rule-based
- **TS-5: Cap nhat bao cao + PDF** (Buoc 10, chi khi TS-4 = CO) — chi cap nhat Mermaid diagram trong report co san (khong tao report moi), PDF re-render la tuy chon

**Should have — Differentiators:**
- **D-1: Lien ket pd:scan bao mat** (Buoc 4) — loc canh bao lien quan theo file/function, max 3 canh bao, freshness check 7 ngay, non-blocking
- **D-2: Post-mortem CLAUDE.md** (Buoc 10) — de xuat 1-2 rule, hoi user truoc khi append, KHONG tu dong ghi, KHONG truoc khi user xac nhan

**Anti-features — khong lam:**
- Tu dong chay reproduction test (test runner khac nhau moi stack, false negative nguy hiem)
- Auto-fix regression modules (scope creep, co the gay them bug)
- AST-based change detection (maintenance burden cho 5 stacks)
- Bug tracking dashboard web (ngoai scope CLI tool)
- ML-based bug prediction (qua som cho please-done)

**Defer sang v2+:**
- Tu dong chay test tai hien khi co test infrastructure chuan
- Auto-fix cascade khi regression analysis da chung minh gia tri
- AST analysis khi heuristics khong du chinh xac

**Chi tiet:** Xem `.planning/research/FEATURES.md`

### Architecture Approach

Kien truc v1.5 dua tren nguyen tac **Workflow-First, Module-Lean**: phan lon 7 tinh nang moi nam trong workflow markdown duoi dang conditional sub-steps, chi 2 module JS moi can tao (repro-test-generator va regression-analyzer) vi chung co logic phuc tap can unit test doc lap. 5 tinh nang con lai (auto cleanup, business logic signals, PDF update, security linking, post-mortem) duoc xu ly truc tiep boi AI agent trong workflow — khong can module rieng. Nguyen tac pure function tuyet doi: tat ca module trong `bin/lib/` nhan content string, tra ket qua, khong doc file, khong goi MCP.

**Major components:**
1. `workflows/fix-bug.md` (sua doi) — them 6 conditional sub-steps: 4a, 5b mo rong, 8a, 9.5, 9.7, 10.5
2. `bin/lib/repro-test-generator.js` (moi) — pure function, tao skeleton test theo stack (NestJS/Flutter/Generic), ~100-150 LOC
3. `bin/lib/regression-analyzer.js` (moi, fallback) — pure function, BFS 2 levels khi FastCode khong kha dung, ~80-120 LOC
4. `test/snapshots/` (tai tao) — 4 platform snapshots (codex, copilot, gemini, opencode) can regenerate sau khi sua fix-bug.md
5. Modules v1.4 khong sua — report-filler.js, generate-diagrams.js, generate-pdf-report.js

**Luong du lieu:**
- D-1: SCAN_REPORT.md -> Grep file bi loi -> SESSION (canh bao)
- TS-1: Trieu chung + Stack + File/function -> repro-test-generator.js -> test file trong .planning/debug/repro/
- TS-2: File bi loi -> regression-analyzer.js HOAC FastCode call chain -> SESSION + BUG report
- TS-3: `git diff --cached` -> Grep markers -> Edit xoa -> git add lai
- TS-4/TS-5: BUG_*.md Logic Changes -> CO/KHONG -> fillManagementReport pipeline -> report + optional PDF
- D-2: BUG_*.md + SESSION -> de xuat text -> user confirm -> append CLAUDE.md

**Chi tiet:** Xem `.planning/research/ARCHITECTURE.md`

### Critical Pitfalls

1. **Workflow Step Explosion** — Them tinh nang nhu buoc moi so co the day workflow len 17+ buoc, agent mat context, bo qua buoc. **Phong tranh:** nho tinh nang vao buoc hien tai (5b, 8, 9, 10), dung conditional pattern, giu file duoi 420 dong, moi sub-step phai co skip condition.

2. **Auto Cleanup Xoa Code Production** — Regex match `console.log` toan bo file co the xoa audit log, production logging, Flutter print() can thiet. **Phong tranh:** CHI xoa dong co marker `[PD-DEBUG]` ma AI tu them; luon hoi user truoc (list-only mode mac dinh); khong chay tren file AI khong sua.

3. **Regression Analysis False Positive Cascade** — FastCode tra ve 50+ files phu thuoc cho 1 utility function, gay token waste va user hoang loan. **Phong tranh:** Gioi han 1-2 level depth, filter theo function bi loi (khong theo file), cap toi da 5-10 files trong bao cao.

4. **Vi Pham Pure Function Pattern** — Module moi co `require('fs')` hoac goi MCP truc tiep pha vo toan bo testing strategy (526 tests can mock phuc tap, kho maintain). **Phong tranh:** Bat buoc `// KHONG doc file` trong JSDoc header; test litmus: neu test can mock filesystem -> vi pham.

5. **528 Tests + 48 Snapshots Bi Pha** — Sua fix-bug.md lan truyen den 4 platform snapshots (codex, copilot, gemini, opencode). **Phong tranh:** Chay `smoke-snapshot.test.js` sau moi thay doi workflow; regenerate snapshots trong commit rieng tach biet.

6. **PDF Circular Dependency voi Complete-Milestone** — Fix-bug khong co STATE.md va toan bo PLAN.md context ma fillManagementReport() can. **Phong tranh:** CHI cap nhat Mermaid diagram trong report co san (ham rieng updateReportDiagram()), KHONG goi fillManagementReport() truc tiep.

7. **Post-mortem Ghi De CLAUDE.md** — Auto ghi CLAUDE.md la xam pham user autonomy, rule co the xung dot voi config hien tai. **Phong tranh:** CHI de xuat (output la Markdown block trong BUG report), LUON hoi user, toi da 2 suggestions per bug.

**Chi tiet:** Xem `.planning/research/PITFALLS.md`

---

## Implications for Roadmap

Dua tren nghien cuu, de xuat cau truc 3 phase theo thu tu phu thuoc va rui ro:

### Phase 1: Nen Tang Module va Workflow Shell

**Rationale:** Phai giai quyet quyet dinh kien truc truoc khi code bat ky tinh nang nao. Tao 2 module pure function moi voi test files tuong ung. Them conditional sub-steps vao fix-bug.md theo dung vi tri. Giai quyet van de shared Truths parser (inline hay rieng). Day la phase mat nhieu quyet dinh kien truc nhat va sai o day se lan truyen den moi feature.

**Delivers:**
- `bin/lib/repro-test-generator.js` + test file
- `bin/lib/regression-analyzer.js` + test file
- Quyet dinh Truths parser (inline trong logic-change-detector hay tao truths-parser.js rieng)
- fix-bug.md voi 6 sub-steps moi duoi dang skeleton/placeholder
- Tat ca 526 tests van xanh sau khi them module moi
- Snapshots da duoc regenerate neu workflow thay doi

**Addresses:** TS-1 (skeleton module), TS-2 (skeleton module)

**Avoids:** Pitfall 6 (pure function), Pitfall 7 (snapshot), Pitfall 1 (workflow structure — quyet dinh vi tri sub-steps)

---

### Phase 2: Tich hop Core Features (Buoc 5b, 8, 9 + D-1)

**Rationale:** Sau khi co module va workflow shell, tich hop 3 tinh nang co gia tri cao nhat theo thu tu trong workflow: reproduction test (Buoc 5b), regression analysis (Buoc 8), auto cleanup (Buoc 9), va security linking (Buoc 4a). Ba tinh nang nay doc lap nhau va doc lap voi PDF/post-mortem.

**Delivers:**
- TS-1 day du: repro-test-generator tich hop vao Buoc 5b, tao file test trong `.planning/debug/repro/`
- TS-2 day du: FastCode call chain tich hop vao Buoc 8a, regression-analyzer lam fallback, bao cao anh huong (max 5-10 files)
- TS-3 day du: marker system `[PD-DEBUG]`, list-only mode, hoi user truoc khi xoa
- D-1 day du: security warning linking voi freshness check (7 ngay), loc theo function, max 3 canh bao

**Uses:** repro-test-generator.js, regression-analyzer.js, FastCode MCP (da co), Grep (da co)

**Avoids:** Pitfall 2 (test that tests nothing), Pitfall 3 (false dependency cascade), Pitfall 4 (cleanup xoa production code), Pitfall 9 (wolf cry security warnings)

---

### Phase 3: Business Logic Sync, PDF Update, Post-mortem (Buoc 9.7, 10.5 + D-2)

**Rationale:** Ba tinh nang nay phu thuoc vao nhau theo chieu: TS-4 trigger TS-5, D-2 chay sau khi user xac nhan DA SUA. Deu nam o Buoc 9.7 va 10.5 cua workflow. Can giai quyet Pitfall 8 (PDF circular dependency) truoc khi trien khai TS-5 — tao ham `updateReportDiagram()` rieng thay vi goi `fillManagementReport()`.

**Delivers:**
- TS-4 day du: heuristics phat hien logic signals (condition/arithmetic/endpoint changes), AI quyet dinh CO/KHONG
- TS-5 day du: chi cap nhat Mermaid diagram trong report co san (ham updateReportDiagram() moi), PDF re-render la tuy chon do user chay
- D-2 day du: de xuat 1-2 rule CLAUDE.md, hoi user, output la Markdown block trong BUG report
- fix-bug.md hoan chinh, tat ca 526 tests xanh, snapshots cap nhat

**Avoids:** Pitfall 5 (false positive logic detection), Pitfall 8 (PDF circular dependency), Pitfall 10 (CLAUDE.md overwrite)

---

### Phase Ordering Rationale

- **Phase 1 truoc:** Kien truc + module shell phai on truoc khi tich hop. Vi pham pure function pattern o Phase 1 se lan truyen den moi feature. Snapshot tests phai pass ngay tu dau.
- **Phase 2 truoc Phase 3:** TS-1/TS-2/TS-3 doc lap, it rui ro, gia tri cao — hoan thien truoc khi tackle TS-4/TS-5 co phu thuoc phuc tap hon (TS-4 trigger TS-5).
- **D-1 o Phase 2, D-2 o Phase 3:** D-1 (security linking) nam o Buoc 4a — som trong workflow, doc lap hoan toan. D-2 (post-mortem) nam o Buoc 10.5 — cuoi workflow, can context tu TS-4 (logic change) de suggestion co y nghia.
- **TS-5 o Phase 3:** PDF update co rui ro Pitfall 8 (circular dependency voi complete-milestone) — can ham rieng `updateReportDiagram()` duoc thiet ke sau khi hieu ro impedance mismatch voi fillManagementReport().

### Research Flags

**Phases can deeper research trong planning:**
- **Phase 2 (Regression Analysis):** FastCode output format chua duoc document chinh thuc — can prototype regression-analyzer voi real FastCode output truoc khi merge. Fallback Grep logic cung can xac nhan.
- **Phase 2 (Auto Cleanup + Marker System):** Marker `[PD-DEBUG]` phai duoc them vao huong dan Buoc 5c (khi AI them debug log) dong thoi voi Buoc 9.5 (xoa). Neu hai buoc build tach biet, marker se khong nhat quan.
- **Phase 3 (PDF Update):** `updateReportDiagram()` function chua ton tai — can xac dinh API contract truoc khi Phase 3 bat dau, tranh impedance mismatch voi `fillManagementReport()`.

**Phases co standard patterns (co the skip research-phase):**
- **Phase 1 (Module Creation):** Pure function pattern da duoc chung minh trong 7 modules v1.4. Template la ro rang.
- **Phase 2 (Reproduction Test):** Template literal approach da duoc validate trong STACK.md — khong can library, ~100-150 LOC.
- **Phase 3 (Post-mortem):** Rule-based suggestion pattern don gian, LUON hoi user. Khong co ambiguity.

---

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | Phan tich truc tiep tren codebase — 7 existing modules, package.json, 526 tests. KHONG them dependency la quyet dinh first-principles, khong chi la tuy chon. |
| Features | HIGH | 7 features duoc xac dinh ro tu PROJECT.md. MVP scope ro rang. Anti-features xac dinh va co ly do cu the. Dependency map day du. |
| Architecture | HIGH | Phan tich toan bo 10 workflows, 12 commands, 7 library modules, 5 converters. Workflow-First pattern da validated qua v1.4. Nguyen tac pure function co 526 tests bao chung. |
| Pitfalls | HIGH | 10 pitfalls cu the voi warning signs va phase to address. Pitfall 1 (workflow explosion) va Pitfall 6 (pure function) la cot loi — phai tuan thu tuyet doi. |

**Overall confidence:** HIGH

### Gaps to Address

- **FastCode output format cho regression-analyzer:** Module can biet format chinh xac cua `mcp__fastcode__code_qa` response. STACK.md ghi "parse structured text" nhung chua co example output thuc te. Can prototype voi real call truoc khi viet parser chinh thuc.
- **Marker system design nhat quan:** Auto cleanup marker `[PD-DEBUG]` phai duoc them vao huong dan Buoc 5c (khi AI them debug log) dong thoi voi viec tao Buoc 9.5 (xoa). Neu hai buoc nay duoc build tach biet, marker co the khong nhat quan giua them va xoa.
- **`updateReportDiagram()` API contract:** TS-5 can function moi nay nhung STACK.md chi mo ta muc tieu, chua dinh nghia API. Can quyet dinh: (a) them vao report-filler.js hien tai hay (b) tao function trong workflow truc tiep. Phai quyet dinh o Phase 3 planning.
- **Truths parser shared helper:** Quyet dinh cuoi cung (inline trong logic-change-detector.js hay tao `bin/lib/truths-parser.js` rieng) can duoc thong nhat o Phase 1 de tranh refactor sau.

---

## Sources

### Primary (HIGH confidence)
- Codebase: `bin/lib/*.js` (7 existing modules), `workflows/fix-bug.md`, `commands/pd/fix-bug.md` — phan tich truc tiep
- `package.json` — zero runtime dependencies confirmed
- `test/*.test.js` (13 files, 526 tests) — node:test runner confirmed
- `references/security-checklist.md` — structured sections for keyword matching
- `bin/lib/generate-diagrams.js:34` — parseTruthsFromContent inline regex confirmed
- `bin/lib/report-filler.js` — fillManagementReport() pure function API confirmed
- `bin/generate-pdf-report.js` — Puppeteer optional, fallback .md confirmed
- Node.js 18+ built-in APIs documentation

### Secondary (MEDIUM confidence)
- [Qodo AI Code Review Tools](https://www.qodo.ai/) — business logic detection patterns
- [Quash: Regression Testing 2025](https://quashbugs.com/blog/regression-testing-2025-ai) — AI-driven change impact analysis
- [Katalon: AI Regression Testing 2026](https://katalon.com/resources-center/blog/ai-in-regression-testing) — dependency analysis patterns
- [Aikido: Remove Debug Code Before Commits](https://www.aikido.dev/code-quality/rules/remove-debugging-and-temporary-code-before-commits-a-security-and-performance-guide) — 68% production issues from debug artifacts
- [JetBrains: Cleanup Code Before Commit](https://www.jetbrains.com/guide/go/tips/vcs-cleanup-code-before-commit/) — pre-commit cleanup patterns
- [Dev Genius: AI Bug Fix Comparison](https://blog.devgenius.io/github-copilot-vs-cursor-vs-claude-code-which-ai-actually-fixes-production-bugs-9485b33131c6) — competitive landscape
- [AlterSquare: AI Coding Tool No Memory](https://altersquare.io/ai-coding-tool-no-memory-bug-broke-prod-last-quarter/) — CLAUDE.md institutional memory gap
- [NestJS Testing Docs](https://docs.nestjs.com/fundamentals/testing) — NestJS test patterns (HIGH confidence)
- IEEE/ACM 2024 "Automatic Generation of Test Cases based on Bug Reports" — 27-48% false positive rate LLM-generated tests
- NIST: false positive rate automated static analysis tools 3-48%
- [WorkOS: Cursor BugBot + Claude Code PRs](https://workos.com/blog/cursor-bugbot-autoreview-claude-code-prs) — BugBot autofix patterns

---
*Research completed: 2026-03-24*
*Ready for roadmap: yes*
