# Feature Research

**Domain:** Nang cap skill fix-bug voi tu dong hoa dieu tra va an toan
**Researched:** 2026-03-24
**Confidence:** HIGH

## Boi canh

v1.5 nang cap skill `fix-bug` hien co (10 buoc: trieu chung -> gia thuyet -> cong kiem tra -> sua -> xac nhan). Khong viet lai workflow, chi BO SUNG cac buoc moi vao vi tri phu hop trong workflow hien co.

He thong da co san:
- **Fix-bug workflow** 10 buoc voi SESSION tracking, phan loai rui ro, Logic Update (Buoc 6.5)
- **FastCode MCP** cho code_qa, call chain analysis
- **Context7 MCP** cho library docs
- **Plan-checker** voi Truths parser, CHECK-01 den CHECK-05
- **generate-diagrams.js** (Business Logic + Architecture Mermaid)
- **report-filler.js** (fillManagementReport pure function)
- **pdf-renderer.js** + **generate-pdf-report.js** (MD -> PDF via Puppeteer)
- **scan workflow** voi npm audit, cau truc bao mat trong SCAN_REPORT.md
- **Buoc 6.5 Logic Update** da phat hien va cap nhat Truth khi bug do logic sai

7 target features tu PROJECT.md:
1. Tu dong tao Reproduction Test Case (NestJS/Flutter)
2. Regression Analysis qua FastCode Call Chain
3. Auto Cleanup log tam truoc commit
4. Dong bo Business Logic — phat hien thay doi logic/kien truc
5. Tu dong cap nhat bao cao quan ly + xuat PDF khi logic thay doi
6. Lien ket pd:scan canh bao bao mat cho file bi loi
7. Post-mortem de xuat cap nhat CLAUDE.md

---

## Table Stakes

Cac feature CAN THIET de v1.5 co gia tri. Thieu bat ky feature nao = workflow khong hoan chinh.

| Feature | Tai sao can | Do phuc tap | Ghi chu |
|---------|-------------|-------------|---------|
| **TS-1: Reproduction Test Case** | Buoc 5b hien tai chi "tim duong ngan nhat" de tai hien — KHONG tao file test co the chay lai. Khong co test tai hien = khong chung minh duoc loi da xay ra truoc khi sua, va khong co regression net cho tuong lai. Day la best practice duoc moi AI coding tool (Claude Code, Copilot, Cursor) ap dung: SWE-bench do luong kha nang "identify, reproduce, fix". | MEDIUM | Bo sung vao Buoc 5b. Tao file test trong `.planning/debug/repro/` (KHONG trong src/test/). NestJS: file `.spec.ts` mock service + assert loi. Flutter: file `_test.dart` mock controller + assert. Stack khac: file test generic hoac script bash. AI sinh test, KHONG can chay duoc — muc dich la GHI LAI cach tai hien de doc lai. Neu muon chay: user tu copy vao test suite. **Phu thuoc:** Khong. Doc lap. |
| **TS-2: Regression Analysis** | Buoc 8 hien tai chi sua code roi lint+build. KHONG kiem tra cac module phu thuoc bi anh huong. Nghien cuu cho thay 1 code change co the "ripple across the system" gay cascading failures. FastCode call chain da co san — chi can goi truoc khi bao cao hoan tat. | MEDIUM | Bo sung vao Buoc 8 (sau khi sua, truoc khi commit). Goi `mcp__fastcode__code_qa`: "Liet ke cac ham/module goi truc tiep [ham da sua]. Co ham nao bi anh huong boi thay doi nay?" Ket qua ghi vao SESSION + BUG report section "Anh huong". Neu FastCode loi → Grep import/require fallback. KHONG tu dong sua cac module phu thuoc — chi CANH BAO. **Phu thuoc:** FastCode MCP (da co). |
| **TS-3: Auto Cleanup** | 68% production issues stem from debug artifacts (console.log, print, debugger). Trong fix-bug, AI thuong them log tam (Buoc 5c "them log tam") nhung khong co co che dam bao xoa truoc commit. Loi tam trong commit = no ky thuat + rui ro bao mat (log sensitive data). | LOW | Bo sung vao Buoc 9 (truoc git commit). Pattern matching: tim `console.log`, `print()`, `debugger`, `// TODO: remove`, `// TEMP`, `// DEBUG` trong cac files staged. Liet ke cho user: "Tim thay [N] log tam. Xoa truoc commit? (Y/n)". User dong y → AI xoa. User tu choi → ghi warning trong BUG report. KHONG xoa tu dong khong hoi — mot so log la co y dinh. **Phu thuoc:** Khong. Doc lap. |
| **TS-4: Dong bo Business Logic** | Buoc 6.5 da phat hien logic bug va cap nhat Truth. Nhung SAU KHI SUA (Buoc 8), ban sua co the thay doi them logic/kien truc ma khong duoc ghi nhan. Vi du: sua loi tinh toan → thay doi formula → logic thay doi nhung khong ai cap nhat soi do/bao cao. Day la gap giua "phat hien" (Buoc 6.5) va "ghi nhan toan bo thay doi" (sau Buoc 8). | LOW | Bo sung vao Buoc 10 (truoc xac nhan user). AI tu danh gia: "Ban sua nay co lam thay doi luong nghiep vu/kien truc?" Tieu chi: (1) Thay doi signature ham public, (2) Them/xoa endpoint API, (3) Thay doi database schema, (4) Sua dieu kien nghiep vu (if/switch logic), (5) Thay doi thu tu xu ly. Ket qua: CO/KHONG. Neu CO → trigger TS-5. Ghi ket qua vao BUG report section "Logic Changes". **Phu thuoc:** Buoc 6.5 da co (chi mo rong scope kiem tra). |
| **TS-5: Tu dong cap nhat bao cao + PDF** | Neu logic thay doi (TS-4 = CO), bao cao quan ly cu tro nen loi thoi. Manager doc PDF cu se hieu sai kien truc hien tai. Can tu dong cap nhat diagrams + xuat PDF moi. Modules `report-filler.js`, `generate-diagrams.js`, `generate-pdf-report.js` da co san tu v1.4. | MEDIUM | Bo sung vao Buoc 10, SAU TS-4 (chi khi CO thay doi logic). Pipeline: (1) Doc tat ca PLAN.md (co Truth da cap nhat tu Buoc 6.5d), (2) Goi generateBusinessLogicDiagram(), (3) Goi generateArchitectureDiagram(), (4) Goi fillManagementReport(), (5) Ghi management-report-v{version-goc}.md, (6) Goi `node bin/generate-pdf-report.js [path]`, (7) Thong bao user PDF moi. Non-blocking: loi chi log warning. **Phu thuoc:** TS-4 (trigger). report-filler.js, generate-diagrams.js, pdf-renderer.js (da co). |

## Differentiators

Features KHONG bat buoc nhung tang gia tri dang ke. Please-done la framework DUY NHAT co cac tinh nang nay.

| Feature | Gia tri | Do phuc tap | Ghi chu |
|---------|---------|-------------|---------|
| **D-1: Lien ket pd:scan bao mat** | Khi sua file, co the file do da co canh bao bao mat tu SCAN_REPORT.md (npm audit, dep vulnerabilities). Hien tai AI khong biet — co the vo tinh de ngo lo hole khi sua. Lien ket nay cho AI boi canh bao mat TRUOC KHI sua. Nghien cuu 2025 cho thay 30+ CVE trong AI coding tools do thieu context bao mat. | LOW | Bo sung vao Buoc 4 (tim hieu files lien quan). Doc `.planning/scan/SCAN_REPORT.md` → Grep cac file bi loi trong section "Canh bao bao mat". Khop → hien thi cho AI + ghi SESSION: "File [X] co canh bao bao mat: [mo ta]". KHONG chan — chi thong tin bo sung. Neu SCAN_REPORT khong ton tai → bo qua. **Phu thuoc:** pd:scan workflow (da co). SCAN_REPORT.md format (da dinh nghia). |
| **D-2: Post-mortem de xuat CLAUDE.md** | 78% developers mat 7.5h/tuan giai thich lai context cho AI vi AI khong nho bai hoc cu. CLAUDE.md la "bo nho dai han" cua Claude Code. Sau moi bug fix, co the rut ra pattern/rule can ghi nho. Hien tai developer tu viet — AI co the de xuat. Day la "compounding engineering" — moi bug lam AI thong minh hon. | LOW | Bo sung vao Buoc 10 (sau user xac nhan DA SUA). AI phan tich: (1) Nguyen nhan goc, (2) File/module anh huong, (3) Pattern loi → de xuat 1-3 dong cho CLAUDE.md. Format: `"# Bai hoc tu [loi]: [quy tac]"`. Trinh bay cho user: "De xuat them vao CLAUDE.md: [noi dung]. Dong y? (Y/n)". User dong y → Append vao CLAUDE.md, commit rieng. KHONG tu dong — LUON hoi user. **Phu thuoc:** Khong. Doc lap. |

## Anti-Features

Features TUONG nhu tot nhung gay van de trong boi canh nay.

| Feature | Tai sao muon | Tai sao co van de | Thay the |
|---------|-------------|---------------------|----------|
| **AF-1: Tu dong CHAY reproduction test** | "Xac nhan loi bang test that" | Moi stack co test runner khac (jest, flutter test, hardhat test). Cau hinh test env phuc tap (database, env vars, mocks). AI khong dam bao test chay dung 100%. False negative → AI ket luan sai. Chi them complexity ma loi co the khong o code. | Tao FILE test de doc — user tu chay neu muon. Muc dich chinh: ghi lai cach tai hien, khong phai chay tu dong. |
| **AF-2: Tu dong sua module phu thuoc** | "Regression analysis tim loi → AI tu sua luon" | Scope creep nghiem trong. Sua 1 bug → trigger cascading fixes → co the gay them bug. Moi fix can dieu tra rieng (gia thuyet, kiem chung). Vi pham principle "CHI sua code lien quan den loi". | Chi CANH BAO modules anh huong. User quyet dinh co can fix-bug rieng cho tung module khong. |
| **AF-3: Full AST-based change detection** | "Phan tich AST de phat hien moi thay doi logic" | Can parser per-language (TypeScript AST, Dart AST, PHP AST, Solidity AST). Phuc tap vuot qua gia tri. Please-done la prompt-based framework, khong co runtime code analysis. Maintenance burden cho 5 stacks. | AI danh gia bang heuristics (signature change, endpoint change, schema change). Du chinh xac cho muc dich business logic detection. |
| **AF-4: Dashboard web theo doi tat ca bugs** | "Xem tong quan bugs qua trinh milestone" | Please-done la CLI tool, khong co web server. Them dashboard = them dependency (Express/Next.js), them maintenance. BUG_*.md files + git log da la "dashboard" dang text. | Dung Grep `.planning/bugs/BUG_*.md` de thong ke. Hoac tich hop vao management report (TS-5). |
| **AF-5: ML-based bug prediction** | "Du doan file nao se co bug tiep" | Can training data (lich su bugs), ML infrastructure. Vuot xa scope cua prompt-based framework. Cac tool lon (GitHub Copilot) moi bat dau lam dieu nay — qua som cho please-done. | FastCode call chain + manual code review. Bug patterns ghi vao CLAUDE.md (D-2) de AI hoc. |
| **AF-6: Tu dong tao CVE reference** | "Lien ket bug voi CVE database" | Hau het bugs la logic bugs, khong phai security vulnerabilities co CVE. Goi CVE API them dependency + phuc tap. npm audit da bao loi bao mat dependencies. | D-1 da lien ket SCAN_REPORT (co npm audit). Neu bug la security → ghi manual reference trong BUG report. |
| **AF-7: Auto-rollback khi fix fail** | "Tu dong revert git khi sua loi khong thanh cong" | Git destructive operations (reset, revert) nguy hiem trong AI context. User co the mat code. Hien tai workflow da co vong lap "user xac nhan" — an toan hon auto-rollback. | Giu vong lap hien tai: user bao chua sua → AI quay lai Buoc 5c. Git history giu moi commit [LOI]. |

---

## Feature Dependencies

```
TS-1: Reproduction Test Case (Buoc 5b)
   [doc lap — khong phu thuoc gi]

TS-2: Regression Analysis (Buoc 8)
   └──requires──> FastCode MCP (da co)

TS-3: Auto Cleanup (Buoc 9)
   [doc lap — khong phu thuoc gi]

TS-4: Dong bo Business Logic (Buoc 10)
   └──requires──> Buoc 6.5 Logic Update (da co)

TS-5: Tu dong cap nhat bao cao + PDF (Buoc 10)
   └──requires──> TS-4 (trigger kiem tra)
   └──requires──> report-filler.js (da co)
   └──requires──> generate-diagrams.js (da co)
   └──requires──> generate-pdf-report.js (da co)

D-1: Lien ket pd:scan bao mat (Buoc 4)
   └──requires──> SCAN_REPORT.md (da co)

D-2: Post-mortem CLAUDE.md (Buoc 10)
   [doc lap — khong phu thuoc gi]
```

### Ghi chu phu thuoc

- **TS-1, TS-3, D-1, D-2 doc lap hoan toan.** Co the xay song song hoac bat ky thu tu nao.
- **TS-2 phu thuoc FastCode** da co san — chi la goi MCP tool moi trong workflow step moi.
- **TS-4 mo rong Buoc 6.5** da co — them kiem tra SAU khi sua (khong chi TRUOC khi sua).
- **TS-5 phu thuoc TS-4** lam trigger — CHI chay khi TS-4 phat hien CO thay doi logic.
- **TS-5 tai su dung toan bo v1.4 modules** — KHONG can viet code moi, chi goi functions da co.
- **D-1 va D-2 la differentiators** — co the defer sang v1.5.x neu can.

---

## MVP Definition

### Launch With (v1.5)

Tat ca 5 Table Stakes + 2 Differentiators. Thu tu build theo vi tri trong workflow:

- [x] **D-1: Lien ket pd:scan bao mat** (Buoc 4) — som nhat trong workflow, bo sung context
- [x] **TS-1: Reproduction Test Case** (Buoc 5b) — tu dong tao test tai hien
- [x] **TS-2: Regression Analysis** (Buoc 8) — kiem tra anh huong sau khi sua
- [x] **TS-3: Auto Cleanup** (Buoc 9) — don dep truoc commit
- [x] **TS-4: Dong bo Business Logic** (Buoc 10) — phat hien thay doi logic
- [x] **TS-5: Cap nhat bao cao + PDF** (Buoc 10) — tu dong xuat PDF moi
- [x] **D-2: Post-mortem CLAUDE.md** (Buoc 10) — de xuat bai hoc

### Defer (v1.5.x hoac v2+)

- [ ] **Tu dong chay test tai hien** — cho khi co test infrastructure chuan
- [ ] **Auto-fix regression modules** — cho khi regression analysis da chung minh gia tri
- [ ] **AST-based change detection** — cho khi heuristics khong du chinh xac
- [ ] **Bug tracking dashboard** — cho khi co nhu cau web UI

---

## Feature Prioritization Matrix

| Feature | Gia tri user | Chi phi trien khai | Rui ro | Uu tien |
|---------|-------------|-------------------|--------|---------|
| TS-1: Reproduction Test Case | HIGH | MEDIUM | LOW | P1 |
| TS-2: Regression Analysis | HIGH | MEDIUM | LOW | P1 |
| TS-3: Auto Cleanup | MEDIUM | LOW | LOW | P1 |
| TS-4: Dong bo Business Logic | HIGH | LOW | LOW | P1 |
| TS-5: Cap nhat bao cao + PDF | MEDIUM | MEDIUM | MEDIUM | P1 |
| D-1: Lien ket scan bao mat | MEDIUM | LOW | LOW | P1 |
| D-2: Post-mortem CLAUDE.md | HIGH | LOW | LOW | P1 |

**Danh gia rui ro:**
- **TS-1 LOW risk:** AI chi TAO file test, khong chay. Output la markdown/code snippet trong `.planning/debug/repro/`. Khong anh huong source code.
- **TS-2 LOW risk:** FastCode MCP da duoc chung minh qua v1.0-v1.4. Fallback Grep da co. Chi them 1 buoc query.
- **TS-3 LOW risk:** Pattern matching don gian. LUON hoi user truoc khi xoa. Worst case: user tu choi, khong mat gi.
- **TS-4 LOW risk:** Heuristics-based, khong can parser phuc tap. Sai → chi miss 1 update bao cao, khong lam hong code.
- **TS-5 MEDIUM risk:** Goi 3 modules v1.4 lien tiep. Pipeline co the fail o bat ky buoc nao. Giai phap: non-blocking nhu Buoc 3.6 cua complete-milestone — try/catch moi sub-step, chi log warning.
- **D-1 LOW risk:** Read-only. Doc SCAN_REPORT, khong sua gi. Khong co SCAN_REPORT → bo qua.
- **D-2 LOW risk:** LUON hoi user truoc khi append CLAUDE.md. User tu choi → khong lam gi.

---

## Diem tich hop vao Workflow hien co

Mapping chinh xac vi tri bo sung trong `workflows/fix-bug.md`:

| Buoc hien tai | Hanh vi hien tai | v1.5 Bo sung |
|---------------|------------------|--------------|
| Buoc 4: Tim hieu files | FastCode + Context7 tim files lien quan | **THEM D-1:** Doc SCAN_REPORT.md → Grep file bi loi trong "Canh bao bao mat". Khop → ghi SESSION. |
| Buoc 5b: Tai hien toi gian | Tim duong ngan nhat tai hien, ghi SESSION | **THEM TS-1:** Sau khi tai hien, tao file test trong `.planning/debug/repro/repro_[ten-tat].[ext]`. NestJS → .spec.ts. Flutter → _test.dart. Khac → .test.js hoac script.sh. |
| Buoc 8: Sua code | Ap dung ban sua, lint+build, test theo phan loai | **THEM TS-2:** Sau lint+build, goi FastCode: "Cac ham/module nao goi [ham da sua]? Anh huong?" Ghi ket qua vao SESSION + BUG report. |
| Buoc 9: Git commit | git add + commit [LOI] | **THEM TS-3:** TRUOC git add, scan staged files tim debug artifacts. Liet ke → hoi user → xoa hoac giu. |
| Buoc 10: Xac nhan | User xac nhan da sua / chua sua | **THEM TS-4:** TRUOC hoi user, AI danh gia thay doi logic. **THEM TS-5:** Neu CO thay doi → goi pipeline bao cao. **THEM D-2:** SAU user xac nhan DA SUA → de xuat CLAUDE.md. |

### Du lieu da co san cho tung feature

| Feature | Du lieu can | Nguon | Do kho truy cap |
|---------|------------|-------|-----------------|
| TS-1 | Stack type, trieu chung, buoc tai hien | CONTEXT.md (stack), SESSION (trieu chung) | LOW — da doc o Buoc 1+5 |
| TS-2 | Ten ham/file da sua | Buoc 8 code changes | LOW — AI vua sua xong, biet files |
| TS-3 | Files staged cho commit | `git diff --cached --name-only` | LOW — git command don gian |
| TS-4 | Diff truoc/sau sua | Git diff hoac AI nho changes | LOW — AI vua sua xong |
| TS-5 | PLAN.md files, templates | `.planning/milestones/[ver]/phase-*/PLAN.md` | LOW — da doc o Buoc 3 |
| D-1 | SCAN_REPORT.md | `.planning/scan/SCAN_REPORT.md` | LOW — doc 1 file |
| D-2 | Nguyen nhan goc, pattern loi | SESSION + BUG report | LOW — da co tu Buoc 5-6 |

---

## Phan tich canh tranh

| Feature | Claude Code (vanilla) | GitHub Copilot Agent | Cursor BugBot | Please-Done v1.5 |
|---------|----------------------|---------------------|---------------|-------------------|
| Tai hien co he thong | Khong — fix truc tiep | Khong — fix truc tiep | Review PR, khong tai hien | **Tao file test tai hien + luu SESSION** |
| Regression analysis | Khong — chi sua file duoc chi dinh | Copilot chay test nhung khong phan tich impact | Khong | **FastCode call chain + canh bao module phu thuoc** |
| Don dep debug code | Khong — developer tu don | Khong | Khong | **Auto detect + hoi user truoc commit** |
| Dong bo logic/kien truc | Khong — khong co Truth tracking | Khong — khong co structured logic | Khong | **Heuristics danh gia + tu dong cap nhat diagram/PDF** |
| Bao cao tu dong | Khong | PR description tu dong | PR review comments | **Management report + PDF export khi logic thay doi** |
| Lien ket bao mat | Khong | Dependabot rieng biet | Khong | **Lien ket SCAN_REPORT vao bug investigation** |
| Hoc tu bug (memory) | CLAUDE.md manual | Khong — reset moi session | Khong | **De xuat CLAUDE.md tu dong sau xac nhan** |

**Insight chinh:** Khong AI coding tool nao hien co ket hop tat ca 7 features trong 1 workflow lien tuc. Claude Code manh ve fix code nhung khong co structured investigation. Copilot manh ve PR nhung khong co regression analysis. Please-done v1.5 la workflow DUY NHAT co: tai hien → sua → kiem tra anh huong → don dep → dong bo logic → bao cao → hoc bai.

---

## Sources

- [Qodo AI Code Review Tools](https://www.qodo.ai/) — business logic detection trong code review, MEDIUM confidence
- [Quash: Regression Testing 2025](https://quashbugs.com/blog/regression-testing-2025-ai) — AI-driven change impact analysis, MEDIUM confidence
- [Katalon: AI Regression Testing 2026](https://katalon.com/resources-center/blog/ai-in-regression-testing) — dependency analysis patterns, MEDIUM confidence
- [AlterSquare: AI Coding Tool No Memory](https://altersquare.io/ai-coding-tool-no-memory-bug-broke-prod-last-quarter/) — post-mortem memory gap, MEDIUM confidence
- [Pete Hodgson: AI Coding Assistant Keeps Doing It Wrong](https://blog.thepete.net/blog/2025/05/22/why-ai-coding-assistant-keeps-doing-it-wrong-and-how-to-fix-it/) — CLAUDE.md as institutional memory, MEDIUM confidence
- [Aikido: Remove Debug Code Before Commits](https://www.aikido.dev/code-quality/rules/remove-debugging-and-temporary-code-before-commits-a-security-and-performance-guide) — 68% production issues from debug artifacts, MEDIUM confidence
- [JetBrains: Cleanup Code Before Commit](https://www.jetbrains.com/guide/go/tips/vcs-cleanup-code-before-commit/) — pre-commit cleanup patterns, HIGH confidence
- [Dev Genius: Copilot vs Cursor vs Claude Code Bug Fix Comparison](https://blog.devgenius.io/github-copilot-vs-cursor-vs-claude-code-which-ai-actually-fixes-production-bugs-9485b33131c6) — competitive landscape, MEDIUM confidence
- [WorkOS: Cursor BugBot + Claude Code PRs](https://workos.com/blog/cursor-bugbot-autoreview-claude-code-prs) — BugBot autofix patterns, MEDIUM confidence
- [NestJS Testing Docs](https://docs.nestjs.com/fundamentals/testing) — NestJS test patterns, HIGH confidence
- Please-Done codebase: `workflows/fix-bug.md`, `commands/pd/fix-bug.md`, `workflows/scan.md`, `bin/lib/report-filler.js`, `bin/lib/generate-diagrams.js`, `bin/lib/pdf-renderer.js` — PRIMARY, HIGH confidence

---
*Feature research cho: Nang cap skill fix-bug (please-done v1.5)*
*Researched: 2026-03-24*
