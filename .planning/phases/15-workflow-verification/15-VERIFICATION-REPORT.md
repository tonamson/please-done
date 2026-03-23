# Phase 15: Workflow Verification Report

**Date:** 2026-03-23
**Phase:** 15-workflow-verification
**Methodology:** 4-level verification (verification-patterns.md) adapted cho workflow context
**Baseline:** 14-AUDIT-REPORT.md (27 issues, 3 in-scope: C2, W4/W9, W7/W12)
**Report language:** Tieng Viet (per D-14)

## Executive Summary

| Workflow | Steps | Truths Verified | PASS | FAIL | Issues Found |
|----------|-------|-----------------|------|------|--------------|
| WFLOW-03: fix-bug | 20 | 4 CT + 5 IT = 9 | 18 | 2 | 2 moi (V1, V2) + 1 confirmed (C2) |
| WFLOW-01: new-milestone | 18 | 4 CT + 5 IT = 9 | 17 | 1 | 2 moi (V3, V4) + 1 confirmed (W12) |
| WFLOW-02: write-code | 22 | 5 CT + 6 IT = 11 | 21 | 1 | 2 moi (V5, V6) + 1 confirmed (W9) |
| **Total** | **60** | **29** | **56** | **4** | **6 moi + 3 confirmed = 9** |

**Tong quan:** 3 workflows chinh duoc trace end-to-end voi 4-level verification. 56/60 steps PASS (93%). 29 Truths (13 Critical + 16 Implicit) tat ca PASS. 4 steps FAIL o cac diem cu the: stack fallback (fix-bug), effort routing aspirational (fix-bug), AskUserQuestion conflict (new-milestone), parallel silent degradation (write-code). Khong co showstopper -- tat ca workflows hoat dong duoc nhung co 6 issues can fix de tang chat luong.

**Phase 14 confirmed:** 3 issues (C2 -> V1, W12 -> V3, W9 -> V5) -- tat ca deu co impact lon hon Phase 14 danh gia ban dau.
**Issues moi:** 3 issues (V2 effort routing aspirational, V4 reset-phase-numbers, V6 conventions.md subtle difference) -- Phase 14 audit khong phat hien.

## Methodology

### 4-Level Verification Framework (adapted)

| Level | Original | Workflow Adaptation | Cong cu |
|-------|----------|-------------------|---------|
| L1: Ton tai | File phai co tren disk | Moi @reference va @template ton tai | Glob |
| L2: Thuc chat | Code khong phai stub | Steps co logic that, khong placeholder | Read |
| L3: Ket noi | imports/exports/calls | Data flow giua steps lien tuc | Grep + Trace |
| L4: Hoat dong | Chay test logic | Edge cases, error handling, fallbacks | Logic review |

### Quy trinh per workflow
1. Pre-define Truth Inventory (3-5 Critical Truths)
2. L1: Verify tat ca references ton tai
3. L2-L3: Trace tung buoc logic, verify data flow
4. L4: Kiem tra edge cases va error handling
5. Deep-dive Phase 14 issues lien quan
6. Ghi nhan issues moi theo D-13 format

## WFLOW-03: fix-bug {#wflow-03}

**File:** `workflows/fix-bug.md` (325 dong)
**Steps:** 0.5, 1, 1a, 1b, 2, 3, 4, 5, 5a, 5b, 5c, 6, 6a, 6a.1, 6b, 6c, 7, 8, 9, 10
**References:** 3 required + 2 conditional (trong workflow) + 3 guards (trong skill file)
**Phase 14 issues:** C2 (Critical)

### Truth Inventory

#### Critical Truths (pre-defined)

| # | Truth | Cach kiem chung | Ket qua |
|---|-------|-----------------|---------|
| CT-1 | Tat ca 3 @reference references ton tai tren disk | Glob verify 3 paths: `references/context7-pipeline.md`, `references/guard-context.md`, `references/guard-fastcode.md` | **PASS** -- Ca 3 files ton tai. Them verify 2 refs phu: `references/conventions.md` (required_reading), `references/prioritization.md` (conditional_reading) -- deu ton tai. |
| CT-2 | Gate check (Step 6c) yeu cau 3 dieu kien truoc khi sua code | Verify 3 conditions listed tai lines 193-197 | **PASS** -- 3 dieu kien ro rang: (1) Da tai hien HOAC bang chung thay the du manh, (2) Da xac dinh file + logic cu the, (3) Da co ke hoach kiem tra sau sua. Thieu dieu kien -> quay Buoc 5b/5c. |
| CT-3 | Patch version logic (Step 2) xu ly dung ca current va old version bugs | Trace version logic paths tai lines 56-71 | **PASS** -- Bang (line 64-68) cover 2 truong hop: (1) Loi version CU -> Glob bugs/ -> Grep patch version -> tim cao nhat -> +1 hoac `[version-goc].1`, (2) Loi version HIEN TAI -> `[version].0` hoac tim cao nhat -> +1. Edge case: user khong chi version -> hoi (line 69). Milestone khong ton tai -> DUNG (line 70). |
| CT-4 | SESSION file duoc tao (5a) va cap nhat xuyen suot (5c, 6a, 6b, 10) | Grep SESSION mentions, verify update points | **PASS** -- SESSION flow hoan chinh: Tao (line 97, 5a) -> Cap nhat sau moi GT (line 146, 5c) -> Cap nhat phan loai (line 159, 6a) -> Cap nhat trang thai theo 3 outcomes (lines 178/181/185/189, 6b) -> Final status "Da giai quyet" + commit (lines 272/276, Step 10). 7 trang thai duoc dinh nghia day du. |

#### Implicit Truths (phat hien khi trace)

| # | Truth | Step | Cach kiem chung | Ket qua |
|---|-------|------|-----------------|---------|
| IT-1 | SESSION state machine co 7 trang thai va transitions hoan chinh | 1a, 5a, 5c, 6b, 10 | Liet ke tat ca states + transitions | **PASS** -- 7 states: Dang dieu tra, Diem dung, Cho quyet dinh, Da tim nguyen nhan, Chua ket luan, Tam dung, Da giai quyet. Transitions lien tuc, khong co dead state. |
| IT-2 | Effort routing table (6a.1) phu hop voi conventions.md | 6a.1 | Cross-verify mapping | **PASS** -- simple->haiku, standard->sonnet, complex->opus match conventions.md. Workflow them custom mapping tu risk classification -> effort. |
| IT-3 | FastCode co fallback sang Grep/Read | 4, rules | Verify fallback logic | **PASS** -- Line 90: "FastCode loi -> Grep/Read. Canh bao." va line 309: "FastCode loi -> Grep/Read, KHONG DUNG". Day du, khong block workflow. |
| IT-4 | Rules section enforce quy trinh khoa hoc (khong doan, khong sua mo) | rules | Doc rules section | **PASS** -- 20 rules (lines 291-311) cover: bao mat, quy trinh, commit, retry, session. Khong thieu rule nao critical. |
| IT-5 | Retry logic co escalation sau 3+ lan | 10 | Verify retry condition | **PASS** -- Line 286: "3+ lan -> goi y: phan tich lai, thay doi cach tiep can, them log tam". Co escalation, khong loop vo han. |

### Logic Trace

#### Buoc 0.5: Phan tich bug -- quyet dinh tai lieu tham khao
PASS. Logic don gian: nhieu bugs -> doc @references/prioritization.md, 1 bug -> bo qua. Dieu kien ro rang (line 18-20).

#### Buoc 1: Kiem tra phien dieu tra + thu thap trieu chung
PASS. Git check (line 24), tao thu muc debug (line 25). 2 sub-steps ro rang.

#### Buoc 1a: Kiem tra phien dieu tra dang mo
PASS. Glob + Grep de tim sessions (line 28). 4 trang thai "co the tiep tuc" (line 29). 3 trang thai "KHONG tu liet ke" (line 31-32). Logic dispatch: Dang dieu tra/Tam dung -> 5c, Diem dung -> cho tra loi -> 5c, Cho quyet dinh -> 6b -> 6c. $ARGUMENTS override -> thu thap moi (line 38). BUG reports mo cung duoc xu ly (lines 40-41).

#### Buoc 1b: Thu thap trieu chung (loi moi)
PASS. 5 thong tin bat buoc (lines 44-49): Mong doi, Thuc te, Thong bao loi, Dong thoi gian, Tai hien. $ARGUMENTS du -> khong hoi (line 51). Thieu -> hoi bo sung voi goi y (line 53). Flexible follow-up neu van thieu context (line 54).

#### Buoc 2: Xac dinh patch version
PASS. Doc conventions.md (line 58). CURRENT_MILESTONE.md -> version hien tai (line 60). Khong ton tai -> hoi user (line 61). Bang 2 truong hop (lines 64-68). Edge cases xu ly (lines 69-70).

#### Buoc 3: Doc tai lieu ky thuat
PASS. Chi doc PHAN LIEN QUAN (line 72). Strategy: Grep chuc nang loi trong PLAN.md truoc (line 76), chi doc phase lien quan (line 77), mo rong neu khong khop (line 78). 3 nguon: PLAN.md, CODE_REPORT, rules (lines 80-82).

#### Buoc 4: Tim hieu files lien quan
PASS. FastCode `mcp__fastcode__code_qa` (line 85) voi 3 cau hoi cu the (lines 86-88). Fallback: FastCode loi -> Grep/Read + canh bao (line 90). Loi thu vien -> context7-pipeline (line 92). Day du.

#### Buoc 5: Phan tich theo phuong phap khoa hoc
PASS (header section, sub-steps co chi tiet rieng).

#### Buoc 5a: Tao/cap nhat phien dieu tra
PASS. Template day du (lines 97-124): ten-tat max 30 ky tu, 6 sections (Trieu chung, Tai hien toi gian, Gia thuyet, Files da kiem tra, Ket luan). Format nhat quan.

#### Buoc 5b: Tai hien toi gian
PASS. Dieu kien kich hoat ro (line 127): buoc tai hien khong ro, luc co luc khong, 5+ buoc. Loi ro rang -> bo qua (line 129). Logic hop ly.

#### Buoc 5c: Hinh thanh + kiem chung gia thuyet
FAIL (1 issue -- C2 confirmed + V1 new)

**Logic Trace:**
Line 133: `CONTEXT.md -> stack -> doc .planning/rules/[stack].md -> truy vet luong`
Lines 135-141: Bang 5 stacks voi luong truy vet cu the.
Lines 143-148: Quy trinh 4 buoc cho moi gia thuyet.
Lines 149-152: Diem dung logic cho user verification.

**Issues:**
- C2 (Phase 14 confirmed): Bang stack (lines 135-141) chi co 5 stacks (NestJS, NextJS, WordPress, Solidity, Flutter). KHONG co row Generic/Other cho stacks nhu Express, FastAPI, Django, Rails, Spring Boot, Go, Rust, etc. Agent se khong co huong dan truy vet khi gap stack ngoai danh sach.
- V1 (moi): Ngoai C2, instruction `CONTEXT.md -> stack` (line 133) gia dinh CONTEXT.md luon chi ro stack. Neu CONTEXT.md khong co truong stack hoac project dung stack khong duoc ho tro, agent khong co fallback nao de xac dinh luong truy vet. Day la he luy truc tiep cua C2.

#### Buoc 6: Danh gia ket qua dieu tra
PASS (header section).

#### Buoc 6a: Phan loai rui ro
PASS. Tham chieu @references/prioritization.md (line 159). Cap nhat SESSION. Anh huong 3 khia canh: format bao cao, muc kiem thu, chien luoc commit (line 160).

#### Buoc 6a.1: Effort routing cho fix-bug
FAIL (1 issue -- V2 new)

**Logic Trace:**
Lines 162-174: Bang mapping risk classification -> effort -> model.
Line 174: Thong bao format: "Spawning {model} agent cho fix-bug ({effort} -- {phan_loai})..."

**Issue:**
- V2 (moi): Skill file `commands/pd/fix-bug.md` (line 4) hardcode `model: sonnet`. Day la setting ma platform dung de spawn agent. Workflow Step 6a.1 dinh nghia effort routing voi haiku (green/blue) va opus (red), nhung agent DA DUOC SPAWN voi sonnet truoc khi workflow chay den Step 6a.1. Effort routing table la ASPIRATIONAL -- khong co mechanism de thay doi model sau khi agent da bat dau.

#### Buoc 6b: Danh gia ket qua
PASS. 3 outcomes ro rang (lines 178-190): Tim duoc -> 6c, Can quyet dinh -> user chon -> 6c, Khong tim duoc -> 3 goi y + loop ve 5c. KHONG tao BUG khi chua tim nguyen nhan (line 190). Day du.

#### Buoc 6c: Cong kiem tra truoc khi sua
PASS. 3 dieu kien bat buoc (lines 193-197) da verify o CT-2. Thieu -> quay 5b/5c. Logic gate dung.

#### Buoc 7: Viet bao cao loi
PASS. Template day du (lines 201-232): header metadata, mo ta loi, trieu chung, buoc tai hien, phan tich nguyen nhan, anh huong, ke hoach kiem tra, xac nhan checklist. Phan loai-specific sections (lines 222-224). Cap nhat lien ket SESSION (line 234).

#### Buoc 8: Sua code
PASS. Ap dung sua + tuan thu rules (lines 237-238). Lint + build bat buoc (line 239). Bang kiem thu theo phan loai (lines 241-249) voi 5 muc do. Day du va phu hop.

#### Buoc 9: Git commit
PASS. Chi commit khi HAS_GIT = true (line 251). Commit strategy theo phan loai (lines 253-256): green/yellow/blue gom 1 commit, orange tach migration, red tach rieng. Format commit ro rang (lines 258-264).

#### Buoc 10: Yeu cau xac nhan
PASS. 2 paths (lines 270-287): User xac nhan -> update bao cao, SESSION, TASKS.md (voi version GOC, line 273), commit. User bao chua sua -> thu thap them, tang "Lan sua", gia thuyet moi, loop ve 5c. Retry escalation 3+ lan (line 286). TIEP TUC cho den khi user xac nhan (line 287).

### Key Links

| Step tao | Artifact | Step dung | Verified |
|----------|----------|-----------|----------|
| 5a | SESSION_[ten-tat].md | 5c (cap nhat GT), 6a (phan loai), 6b (trang thai), 10 (final status + commit) | **PASS** -- 5 update points verified. Tao tai 5a, cap nhat lien tuc, commit tai 9 va 10. |
| 7 | BUG_[timestamp].md | 8 (reference cho fix), 9 (commit cung fix), 10 (status update) | **PASS** -- Tao tai Step 7 (line 201), commit tai Step 9 (line 259), update tai Step 10 (line 271/276). |
| 1b | Trieu chung (5 thong tin) | 5a (ghi vao SESSION), 5c (co so gia thuyet), 7 (ghi vao BUG report) | **PASS** -- Thu thap tai 1b, dung xuyen suot. |
| 10 | TASKS.md update (bug -> done) | N/A (end of workflow) | **PASS** -- Chi update sau user xac nhan. Dung version GOC (line 273), update CA HAI noi (bang + detail). |
| 2 | Patch version | 7 (ghi vao BUG report, line 207), 9 (commit metadata) | **PASS** -- Xac dinh tai Step 2, dung tai Step 7 va 9. |

### State Machine Compliance (D-05)

| Kiem tra | Ket qua | Chi tiet |
|----------|---------|----------|
| Task status chi danh dau hoan tat SAU code + build + commit | **PASS** | Step 8 (code + lint + build) -> Step 9 (commit) -> Step 10 (user confirm -> update TASKS.md). Dung thu tu. |
| Build fail -> giu trang thai "dang chay" | **PASS** | Step 8 yeu cau "Lint + build dung thu muc" (line 239). Khong co explicit "giu 🔄 khi build fail" nhung workflow khong advance qua Step 8 neu build fail. |
| SESSION state transitions hop le | **PASS** | 7 states voi transitions hoan chinh (xem IT-1). Khong co dead state hoac unreachable transition. |

### FastCode Fallback Verification (D-06)

| Kiem tra | Ket qua | Chi tiet |
|----------|---------|----------|
| FastCode loi co fallback | **PASS** | Line 90: "FastCode loi -> Grep/Read. Canh bao: 'FastCode khong kha dung.'" |
| Fallback khong block workflow | **PASS** | Line 309 (rules): "FastCode loi -> Grep/Read, KHONG DUNG" -- explicit rule. |
| D-06 "2 lan tu sua that bai -> STOP" | **N/A** | D-06 noi ve external tool artifact verification, khong ap dung truc tiep cho FastCode fallback trong fix-bug. Workflow co retry logic rieng (3+ lan sua -> goi y thay doi approach). |

### Phase 14 Issues Deep-Dive

#### C2: Stack-specific trace khong co generic fallback (Critical)

**Source:** 14-AUDIT-REPORT.md, AUDIT-02
**Lines:** 133-141 (workflows/fix-bug.md)
**Phase 14 assessment:** "Add a Generic/Other row to the stack trace table"

**Deep-dive:**

Stacks duoc cover (5):
| Stack | Co trong bang | Co rules file |
|-------|-------------|---------------|
| NestJS | Co (line 137) | `.planning/rules/nestjs.md` |
| NextJS | Co (line 138) | `.planning/rules/nextjs.md` |
| WordPress | Co (line 139) | `.planning/rules/wordpress.md` |
| Solidity | Co (line 140) | `.planning/rules/solidity.md` |
| Flutter | Co (line 141) | `.planning/rules/flutter.md` |

Stacks KHONG duoc cover (pho bien trong thuc te):
| Stack | Loai | Muc do pho bien |
|-------|------|-----------------|
| Express.js | Node.js backend | Rat cao |
| FastAPI | Python backend | Cao |
| Django | Python full-stack | Cao |
| Rails | Ruby full-stack | Trung binh |
| Spring Boot | Java backend | Cao |
| Go (Gin/Echo) | Go backend | Trung binh |
| ASP.NET | .NET backend | Trung binh |
| Laravel | PHP backend | Cao |
| React (thuần) | Frontend | Rat cao |
| Vue.js | Frontend | Cao |
| Angular | Frontend | Trung binh |
| Svelte | Frontend | Thap-Trung binh |

**Impact thuc te:** Uoc tinh 60-70% projects thuc te se gap van de nay. 5 stacks duoc cover (NestJS, NextJS, WordPress, Solidity, Flutter) la SUBSET nho cua cac framework pho bien. Dac biet, Express.js (framework phổ biến nhất cho Node.js) va React (frontend phổ biến nhất) deu KHONG co trong danh sach.

**Ket luan:** C2 la Critical dung. Impact lon hon Phase 14 danh gia ban dau. Khong chi thieu Generic/Other row ma con thieu nhieu stacks pho bien.

### Detailed Findings

| ID | Source | Lines | Severity | Description & Impact | Suggested Fix | Regression Risk | Phase 14 Ref |
|----|--------|-------|----------|---------------------|---------------|-----------------|--------------|
| V1 | WFLOW-03 | 133 | Warning | Line 133 `CONTEXT.md -> stack` gia dinh CONTEXT.md luon chi ro stack. Neu CONTEXT.md khong co truong stack hoac project dung stack ngoai 5 stacks listed, agent khong co fallback xac dinh luong truy vet. Impact: Agent bi "mat phuong huong" khi debug project khong co stack ro rang. | Them logic fallback: "Khong xac dinh duoc stack tu CONTEXT.md -> dung luong truy vet generic: entry point -> handler -> business logic -> data layer -> response. Ghi note: 'Stack khong xac dinh, dung luong generic.'" | Low | C2 (Phase 14) -- V1 la he luy cua C2 |
| V2 | WFLOW-03 | 162-174 | Warning | Step 6a.1 effort routing table dinh nghia haiku cho green/blue bugs va opus cho red bugs, nhung skill file `commands/pd/fix-bug.md` hardcode `model: sonnet` (line 4). Agent da duoc spawn voi sonnet TRUOC KHI workflow chay den Step 6a.1. Effort routing table la aspirational, khong co enforcement mechanism. Impact: Tat ca bugs deu chay voi sonnet bat ke do phuc tap -- green bugs ton nhieu token hon can, red bugs co the thieu capacity. | 2 phuong an: (A) Xoa effort routing table trong workflow, document rang fix-bug luon chay sonnet. (B) Update skill file de support dynamic model selection (phuc tap hon, can thay doi skill framework). Khuyen nghi: Phuong an A -- don gian, thuc te, khong tao ky vong sai. | Low | Khong co |

### Workflow Summary

| Metric | Gia tri |
|--------|---------|
| Tong steps traced | 20 (0.5, 1, 1a, 1b, 2, 3, 4, 5, 5a, 5b, 5c, 6, 6a, 6a.1, 6b, 6c, 7, 8, 9, 10) |
| Steps PASS | 18 |
| Steps FAIL | 2 (5c, 6a.1) |
| Critical Truths | 4/4 PASS |
| Implicit Truths | 5/5 PASS |
| Issues phat hien | 2 (V1 Warning, V2 Warning) + 1 confirmed (C2 Critical) |
| Phase 14 deep-dive | C2 confirmed va amplified -- impact 60-70% projects |
| Key Links | 5/5 PASS |
| State Machine compliance | PASS |
| FastCode fallback | PASS |

## WFLOW-01: new-milestone {#wflow-01}

**File:** `workflows/new-milestone.md` (404 dong)
**Steps:** 0, 0.5, 1, 2, 3, 4, 5, 6, 6a-6e, 7, 7a-7f, 8, 9, 9a-9d, 10
**References:** 11 execution_context (6 required + 5 optional) + 2 guards = 13 tong cong
**Phase 14 issues:** W12 (Warning -- AskUserQuestion fallback clarity)

### Truth Inventory

#### Critical Truths (pre-defined)

| # | Truth | Cach kiem chung | Ket qua |
|---|-------|-----------------|---------|
| CT-1 | Tat ca references trong skill file `commands/pd/new-milestone.md` ton tai tren disk | Glob verify tung path | **PASS** -- 13/13 references ton tai. Chi tiet: 6 required (workflows/new-milestone.md, templates/project.md, templates/requirements.md, templates/roadmap.md, templates/state.md, templates/current-milestone.md), 5 optional (references/questioning.md, references/conventions.md, references/ui-brand.md, references/prioritization.md, references/state-machine.md), 2 guards (references/guard-context.md, references/guard-context7.md). **Luu y:** Plan 15-02 pre-defined list 14 paths gom `templates/context.md` va `templates/retrospective.md` -- ca 2 KHONG ton tai tren disk va cung KHONG co trong skill file. Day la loi trong plan pre-definition, KHONG phai loi cua workflow. Thuc te workflow va skill file reference 13 files, tat ca ton tai. |
| CT-2 | STATE.md duoc cap nhat tai it nhat 4 checkpoints (Steps 1, 5, 6e, 7f) | Grep "STATE.md" in workflow, count update points | **PASS** -- 5 checkpoints verified: (1) Step 1 line 59: "Bat dau khoi tao milestone moi", (2) Step 5 line 165: "Nghien cuu chien luoc hoan tat", (3) Step 6e line 251: "Yeu cau milestone v[X.Y] da duyet", (4) Step 7f line 313: "Lo trinh milestone v[X.Y] da duyet", (5) Step 8 lines 317-337: full STATE.md reset/create. Them rule enforcement line 399: "PHAI cap nhat STATE.md o moi moc (Buoc 1, 5, 6e, 7f), KHONG chi cuoi". |
| CT-3 | 2 approval gates (requirements Step 6e + roadmap Step 7f) bat buoc voi AskUserQuestion + loop | Trace approval logic at both gates | **PASS** -- Gate #1 (Step 6e, lines 219-248): AskUserQuestion voi 2 options "Duyet" va "Dieu chinh". "Duyet" -> commit + tiep Buoc 7. "Dieu chinh" -> sua -> hoi duyet lai (lap den khi duyet). Exit condition ro rang. Gate #2 (Step 7f, lines 283-311): AskUserQuestion voi 3 options "Duyet", "Dieu chinh phases", "Xem file day du". "Duyet" -> commit + tiep Buoc 8. "Dieu chinh" -> sua -> hoi lai. "Xem file" -> hien thi -> hoi lai. Exit condition ro rang. Ca 2 gates co commit ngay sau khi duyet (lines 247-249, 307-309). Rules enforcement line 397: "PHAI co 2 cong duyet: yeu cau + lo trinh -- lap den khi duyet". |
| CT-4 | CONTEXT.md + rules/general.md thieu -> STOP (Step 0 guard) | Verify guard logic completeness | **PASS** -- Step 0 (lines 23-30): Bang 2 rows. Row 1: `.planning/CONTEXT.md` khong co -> "Chay `/pd:init` truoc." -> **DUNG**. Row 2: `.planning/rules/general.md` khong co -> "Rules bi thieu. Chay `/pd:init` de tao lai." -> **DUNG**. Ca 2 co error message cu the va STOP action. Them: skill file guards section (lines 23-30 cua commands/pd/new-milestone.md) cung check `@references/guard-context.md` va `rules/general.md` -- 2 lop guard (skill + workflow). |

### Logic Trace

#### Buoc 0: Tu kiem tra
PASS. Bang 2 dieu kien: CONTEXT.md + rules/general.md. Missing -> DUNG voi error message cu the. Doc ca 2 files, ghi nhan ngon ngu, format ngay thang, quy cach phien ban, bieu tuong trang thai (line 30). Day du.

#### Buoc 0.5: Xac dinh tai lieu tham khao (Auto-discovery)
PASS. Phan tich CONTEXT.md de kich hoat 4 tai lieu bo tro (lines 36-40): co giao dien -> ui-brand.md, can thao luan sau -> questioning.md, nhieu yeu cau -> prioritization.md, trang thai phuc tap -> state-machine.md. Logic don gian, dieu kien ro rang, khong co gap.

#### Buoc 1: Tao/Cap nhat PROJECT.md
PASS. 2 paths ro rang (lines 48-57): (1) Chua ton tai -> doc CONTEXT.md, hoi user (questioning.md), tao theo mau. (2) Da ton tai -> doc lich su milestones, hoi user tam nhin thay doi, cap nhat. Cap nhat STATE.md (line 59). Mau: @templates/project.md (line 46). Day du.

#### Buoc 2: Kiem tra bao cao quet
PASS. 3 paths (lines 63-68): (1) Khong co SCAN_REPORT + du an moi -> cho phep tiep tuc. (2) Khong co SCAN_REPORT + du an cu -> "Chay /pd:scan truoc" -> DUNG. (3) Co -> doc: trang thai, thu vien, van de. Logic phan biet du an moi/cu dua tren CONTEXT.md. Day du.

#### Buoc 3: Kiem tra lo trinh hien co
PASS voi 1 issue (W12 confirmed). Logic (lines 72-110): Neu ROADMAP.md ton tai -> AskUserQuestion voi 2 options (Ghi de/Viet tiep). Ghi de -> canh bao thu muc cu -> AskUserQuestion voi 3 options (Sao luu/Xoa tat ca/Chi xoa chua co code). Fallback line 105: "Khong hoi duoc -> tu dong sao luu". Flag `--reset-phase-numbers` xu ly (lines 107-110). Logic day du nhung fallback condition can lam ro (xem W12 deep-dive).

#### Buoc 4: Thu thap yeu cau milestone
PASS. Ap dung @references/questioning.md (line 117). $ARGUMENTS co noi dung -> dung lam boi canh ban dau (line 118). 3 paths (lines 120-124): (1) GHI DE -> trinh bay milestones da hoan tat, hoi toan bo. (2) VIET TIEP -> trinh bay milestones co, hoi moi. (3) Du an moi -> CONTEXT.md + PROJECT.md lam nen, hoi chuc nang chinh. Day du, phu hop voi cac paths tu Step 3.

#### Buoc 5: Nghien cuu chien luoc (Fast Parallel Research)
PASS. AskUserQuestion voi 2 options (lines 131-141): "Nghien cuu truoc" (de xuat) hoac "Bo qua". Bo qua -> nhay Buoc 6 (line 144). Nghien cuu -> tao thu muc (line 148), 3 parallel tool calls (lines 151-154): FastCode (tim component tai su dung), Context7/WebSearch (thu vien toi uu), Logic noi bo (data flow + edge cases). Tong hop -> .planning/research/SUMMARY.md (line 156). Commit (lines 161-163). Cap nhat STATE.md (line 165). Day du, logic ro rang.

#### Buoc 6: Dinh nghia yeu cau
PASS (header section, sub-steps chi tiet ben duoi).

#### Buoc 6a: Phan tich hien trang
PASS. 3 paths (lines 173-177): Co bao cao quet -> tinh nang theo nhom. Co nghien cuu -> doc SUMMARY.md. Du an moi -> dua vao yeu cau user tu Buoc 4. Rule: "KHONG goi FastCode cho thong tin da co trong bao cao quet" (line 177). Day du.

#### Buoc 6b: Xac dinh pham vi theo nhom
PASS. AskUserQuestion multiSelect cho moi nhom (lines 180-193). Options: chon tinh nang hoac "Khong dua nhom nay vao". Phan loai: Duoc chon -> v1, Bat buoc khong chon -> Tuong lai, Tao khac biet khong chon -> Ngoai pham vi (line 195). Day du, cho phep linh hoat.

#### Buoc 6c: Kiem tra thieu sot
PASS. AskUserQuestion (lines 198-211): "Co tinh nang chua liet ke?" -> "Khong, da du" hoac "Co, toi muon them". "Co" -> thu thap them -> xac dinh pham vi lai (line 211). Loop logic ngam: them tinh nang -> quay lai 6b de pham vi lai. Day du.

#### Buoc 6d: Tao REQUIREMENTS.md
PASS. Theo mau @templates/requirements.md (line 214). Ma dinh danh: [NHOM]-[SO] (line 215). Co REQUIREMENTS.md cu -> tiep tuc danh so (line 216). Ap dung tieu chi yeu cau tot (line 217). Day du.

#### Buoc 6e: Cong duyet -- Yeu cau
PASS. Trinh bay TOAN BO yeu cau (lines 221-227). AskUserQuestion (lines 230-241): "Duyet" hoac "Dieu chinh". "Duyet" -> commit + tiep Buoc 7. "Dieu chinh" -> sua -> hoi lai (lap den khi duyet). Commit (lines 247-249). Cap nhat STATE.md (line 251). Day du, approval gate #1 hoan chinh.

#### Buoc 7: Thiet ke lo trinh
PASS (header section, sub-steps chi tiet ben duoi).

#### Buoc 7a: Chia milestones va phases
PASS. Chia Milestones -> Phases (line 260). Moi phase PHAI co 5 thanh phan (line 261, tham chieu @templates/roadmap.md). Xac dinh phu thuoc, uu tien, danh so phien ban, kiem tra trung khi VIET TIEP (line 262). Day du.

#### Buoc 7b: Kiem tra do phu (BAT BUOC)
PASS. MOI yeu cau v1 PHAI gan vao dung 1 phase. Chua gan -> DUNG, sua truoc (line 265). Logic gate dung, enforcement ro rang.

#### Buoc 7c: Quyet dinh chien luoc
PASS. Claude PHAI ghi nhan: tai sao milestone X truoc Y, tai sao uu tien Z, tai sao chia N milestones, phu thuoc (line 268). Day du, dam bao reasoning duoc luu lai.

#### Buoc 7d: Tao ROADMAP.md
PASS. 2 paths (lines 271-273): GHI DE -> viet moi theo mau. VIET TIEP -> giu milestones cu, them moi SAU cuoi, cap nhat ngay. Them quyet dinh chien luoc vao bang hien co (line 273). Day du.

#### Buoc 7e: Cap nhat bang theo doi REQUIREMENTS.md
PASS. Bang mapping yeu cau -> phase -> trang thai (lines 276-280). Kiem tra: tat ca v1 da gan -> Du. Co yeu cau chua gan -> DUNG, sua truoc (line 281). Day du, enforcement nhat quan voi 7b.

#### Buoc 7f: Cong duyet -- Lo trinh
PASS. Trinh bay: so phases, so yeu cau da gan, do phu (line 285). AskUserQuestion voi 3 options (lines 288-300): "Duyet", "Dieu chinh phases", "Xem file day du". "Duyet" -> commit + tiep Buoc 8. "Dieu chinh" -> sua -> hoi lai (lap den khi duyet). "Xem file" -> hien thi -> hoi lai. Commit (lines 307-309). In bang quyet dinh + canh bao review truoc /pd:plan (line 311). Cap nhat STATE.md (line 313). Day du, approval gate #2 hoan chinh.

#### Buoc 8: Tao/Dat lai STATE.md
PASS. Template day du (lines 319-335): Vi tri hien tai (Milestone, Phase, Ke hoach, Trang thai, Hoat dong cuoi), Boi canh tich luy, Van de chan. Co STATE.md cu -> doc "Boi canh tich luy" -> giu lai -> dat lai phan con lai (line 337). Rule enforcement line 400: "STATE.md PHAI giu 'Boi canh tich luy' tu milestone truoc -- KHONG xoa sach". Day du.

#### Buoc 9: Tao theo doi + Commit
PASS (header section, sub-steps chi tiet ben duoi).

#### Buoc 9a: Tao/cap nhat CURRENT_MILESTONE.md
PASS. 2 paths (lines 343-345): GHI DE hoac chua ton tai -> tao moi (milestone, version, phase dau tien, status: Chua bat dau). VIET TIEP va da ton tai -> giu nguyen. Day du.

#### Buoc 9b: Tao thu muc milestones
PASS. Tao `.planning/milestones/[version]/` cho TAT CA milestones moi (line 347). Day du.

#### Buoc 9c: Cap nhat PROJECT.md
PASS. Cap nhat `> Cap nhat: [DD_MM_YYYY]` (line 349). Day du, dam bao PROJECT.md co ngay cap nhat moi nhat.

#### Buoc 9d: Commit
PASS. git add STATE.md + CURRENT_MILESTONE.md + PROJECT.md (lines 352-354). Commit message ro rang. Day du.

#### Buoc 10: Thong bao
PASS. Bang ket qua hoan chinh (lines 360-380): 6 san pham (Du an, Nghien cuu, Yeu cau, Lo trinh, Trang thai, Theo doi) voi duong dan va trang thai. Tong so phases + yeu cau + do phu. Goi y tiep theo: `/pd:plan` voi ten phase dau tien (lines 378-380). Day du, user co cai nhin tong quan ngay.

#### Implicit Truths (phat hien khi trace)

| # | Truth | Step | Cach kiem chung | Ket qua |
|---|-------|------|-----------------|---------|
| IT-1 | Rules section co 19 rules enforcement ro rang, khong thieu rule critical | rules | Doc toan bo rules section (lines 384-404) | **PASS** -- 19 rules cover: general.md compliance, milestone prioritization, backend/frontend ordering, du an moi setup, bao mat, FastCode restriction, CONTEXT.md guard, PROJECT.md ordering, coverage enforcement, requirement quality, milestone directories, 2 approval gates, commit per gate, STATE.md updates, boi canh tich luy, parallel research, research output path, AskUserQuestion fallback. Day du. |
| IT-2 | AskUserQuestion co fallback chung (line 403) ngoai fallback cu the o Step 3 (line 105) | 3, rules | Cross-verify 2 fallback mechanisms | **PASS** -- Line 403 (rules): "AskUserQuestion khong kha dung -> hoi van ban thuong, cho tra loi". Line 105 (Step 3): "Khong hoi duoc -> tu dong sao luu". 2 fallback khac nhau: rules fallback la GENERAL (hoi van ban), Step 3 fallback la SPECIFIC (tu dong sao luu). Tuy nhien, co CONFLICT tiem tang (xem V3). |
| IT-3 | Workflow phan biet ro 3 paths: GHI DE, VIET TIEP, DU AN MOI | 3, 4, 7d | Trace 3 paths xuyen suot | **PASS** -- GHI DE path: Step 3 -> chon "Ghi de" -> Step 4 (hoi toan bo) -> Step 7d (viet moi). VIET TIEP path: Step 3 -> chon "Viet tiep" -> Step 4 (hoi moi) -> Step 7d (giu cu + them moi). DU AN MOI path: Step 3 skip (khong co ROADMAP.md) -> Step 4 (CONTEXT.md + PROJECT.md lam nen) -> Step 7d (viet moi). 3 paths nhat quan xuyen suot. |
| IT-4 | Commit xay ra tai 3 diem: research (Step 5), requirements (Step 6e), roadmap+state (Step 9d) | 5, 6e, 9d | Grep "git commit" in workflow | **PASS** -- 3 commits: (1) Step 5 line 162: `git add .planning/research/ && git commit`. (2) Step 6e line 248: `git add .planning/REQUIREMENTS.md && git commit`. (3) Step 9d line 353: `git add STATE.md CURRENT_MILESTONE.md PROJECT.md && git commit`. Commit messages co format nhat quan. Them: Step 7f line 308: `git add ROADMAP.md REQUIREMENTS.md && git commit` -- tong cong 4 commits. |
| IT-5 | Cross-workflow handoff (Step 10) dung format ma /pd:plan ky vong | 10 | Verify CURRENT_MILESTONE.md format alignment | **PASS** -- Step 10 goi y `/pd:plan` (line 378). Step 9a tao CURRENT_MILESTONE.md voi milestone, version, phase dau tien, status. state-machine.md (line 47) xac nhan `/pd:plan` can CONTEXT.md + ROADMAP.md + CURRENT_MILESTONE.md -- tat ca duoc tao/cap nhat boi new-milestone workflow. Handoff hoan chinh. |

### Key Links

| Step tao | Artifact | Step dung | Verified |
|----------|----------|-----------|----------|
| Step 1 | PROJECT.md (tao/cap nhat) | Step 4 (doc lich su milestones, line 120-121), Step 9c (cap nhat ngay), Step 10 (hien thi) | **PASS** -- Tao/cap nhat tai Step 1 (line 46). Doc lai o Step 4 de lay context. Cap nhat ngay o Step 9c (line 349). Hien thi trang thai o Step 10 (line 369). Data flow lien tuc. |
| Step 6d | REQUIREMENTS.md (tao) | Step 7b (kiem tra do phu, line 265), Step 7e (cap nhat bang theo doi, lines 276-281), Step 7f (commit cung ROADMAP.md, line 308) | **PASS** -- Tao tai Step 6d theo mau (line 214). Step 7b kiem tra MOI yeu cau v1 da gan phase. Step 7e cap nhat bang mapping yeu cau->phase->trang thai. Step 7f commit ca REQUIREMENTS.md lan ROADMAP.md cung nhau. Data flow lien tuc. |
| Step 7d | ROADMAP.md (tao) | Step 9a (CURRENT_MILESTONE.md doc de xac dinh phase dau tien), Step 10 (hien thi so phases) | **PASS** -- Tao tai Step 7d (line 270). Step 9a tao CURRENT_MILESTONE.md dua tren ROADMAP.md phases. Step 10 hien thi "[N] phases" (line 376). Data flow lien tuc. |
| Step 8 | STATE.md (tao/dat lai) | Duoc cap nhat tai Steps 1, 5, 6e, 7f (truoc Step 8), Step 8 dat lai/tao moi, Step 9d commit | **PASS** -- CT-2 da verify 5 checkpoints. Step 8 (lines 317-337) tao template day du. Step 9d commit (line 353). Rule enforcement (line 399): "PHAI cap nhat STATE.md o moi moc". Data flow lien tuc. |
| Step 9a | CURRENT_MILESTONE.md (tao) | Cross-workflow: /pd:plan doc de xac dinh phase hien tai | **PASS** -- IT-5 da verify cross-workflow handoff. state-machine.md (line 47) xac nhan /pd:plan can CURRENT_MILESTONE.md. Step 9a tao voi milestone, version, phase dau tien, status "Chua bat dau". Format phu hop voi templates/current-milestone.md. |
| Step 5 | research/SUMMARY.md (tao, optional) | Step 6a (doc nghien cuu, line 175) | **PASS** -- Tao tai Step 5 (line 156). Step 6a doc SUMMARY.md de "tinh nang theo nhom" (line 175). Dieu kien: chi ton tai khi user chon "Nghien cuu truoc". Step 6a co path rieng cho "Co nghien cuu" va "Khong co nghien cuu". Khong co gap. |

### State Machine Compliance (D-05)

| Kiem tra | Ket qua | Chi tiet |
|----------|---------|----------|
| STATE.md chi update SAU hanh dong hoan tat | **PASS** | Step 1: update SAU doc/tao PROJECT.md. Step 5: update SAU commit research. Step 6e: update SAU commit requirements. Step 7f: update SAU commit roadmap. Thu tu dung. |
| Trang thai phase transitions hop le | **PASS** | Workflow khong quan ly phase execution -- chi tao structure. STATE.md cuoi cung (Step 8): "Trang thai: San sang len ke hoach". Phu hop voi state-machine.md: new-milestone -> "Co lo trinh" -> plan. |
| Commit truoc khi ghi nhan hoan tat | **PASS** | Moi cong duyet: commit (lines 248, 308) truoc khi cap nhat STATE.md (lines 251, 313). Step 9d commit truoc Step 10 thong bao. Thu tu dung. |

### Phase 14 Issues Deep-Dive

#### W12: AskUserQuestion fallback thieu clarity (Warning)

**Source:** 14-AUDIT-REPORT.md, AUDIT-02, W7 (W12 la ID noi bo Phase 15, W7 la ID goc Phase 14)
**Lines:** 105 (workflows/new-milestone.md)
**Phase 14 assessment:** "Clarify: If AskUserQuestion is not available as a tool OR user does not respond within reasonable time -> auto backup."

**Deep-dive:**

Line 105: `Khong hoi duoc -> tu dong sao luu: .planning/milestones/ -> .planning/milestones_backup_[DD_MM_YYYY]/`

**Dieu kien trigger analysis:**

| Dieu kien | Duoc cover | Evidence |
|-----------|-----------|---------|
| AskUserQuestion khong co trong allowed-tools | Khong ro | Line 105 noi "Khong hoi duoc" -- co the la khong co tool, nhung cung co the la tool fail |
| User khong tra loi (timeout) | Khong | Khong co mention timeout. AskUserQuestion API khong co timeout mechanism |
| User tu choi tra loi | Khong | "Khong hoi duoc" khong cover truong hop user chon "khong tra loi" |
| AskUserQuestion tool loi ky thuat | Co (ngam) | "Khong hoi duoc" bao gom tool error |

**Them context tu rules section (line 403):** "AskUserQuestion khong kha dung -> hoi van ban thuong, cho tra loi"

**CONFLICT phat hien (V3 moi):** Rules section (line 403) noi "AskUserQuestion khong kha dung -> hoi van ban thuong, cho tra loi" (tuc la KHONG tu dong, ma phai hoi text). Nhung Step 3 (line 105) noi "Khong hoi duoc -> tu dong sao luu" (tuc la TU DONG, khong hoi). 2 instructions TRAI NHAU:

- Rules noi: fallback = hoi van ban -> CHO tra loi
- Step 3 noi: fallback = tu dong hanh dong (sao luu) -> KHONG cho

Agent se theo dau? Rules co vi tri cao hon (general rule), nhung Step 3 co chi tiet cu the hon (specific override). Khong co priority mechanism ro rang.

**Impact thuc te:** Agent co the:
1. Theo rules -> hoi user bang text -> cho mai khong duoc tra loi (blocking)
2. Theo Step 3 -> tu dong sao luu khong hoi -> user mat data khong mong doi (nhu xoa milestones cu)
3. Lam ca 2 (hoi text, khong duoc tra loi, roi tu dong sao luu) -- nham nhung co the chap nhan duoc

**Severity re-assessment:** Nang tu Warning len **Warning-High**. Khong phai Critical vi consequence chi la backup (khong mat data), nhung conflict giua rules va step logic can duoc resolve.

**Suggested Fix:**
- File: `workflows/new-milestone.md`
- Line 105: Doi tu `- Không hỏi được → tự động sao lưu: .planning/milestones/ → .planning/milestones_backup_[DD_MM_YYYY]/`
- Thanh: `- AskUserQuestion không khả dụng như tool → hỏi văn bản thường (theo rules). Người dùng không phản hồi HOẶC tool lỗi kỹ thuật → tự động sao lưu: .planning/milestones/ → .planning/milestones_backup_[DD_MM_YYYY]/. Ghi chú: "Đã tự động sao lưu do không nhận được phản hồi."`
- Ly do: Resolve conflict voi rules line 403 bang cach: (1) hoi text truoc, (2) tu dong sao luu CHI KHI khong phan hoi, (3) log action de user biet

### Detailed Findings

| ID | Source | Lines | Severity | Description & Impact | Suggested Fix | Regression Risk | Phase 14 Ref |
|----|--------|-------|----------|---------------------|---------------|-----------------|--------------|
| V3 | WFLOW-01 | 105, 403 | Warning-High | Step 3 line 105 noi "Khong hoi duoc -> tu dong sao luu" nhung rules line 403 noi "AskUserQuestion khong kha dung -> hoi van ban thuong, cho tra loi". 2 instructions TRAI NHAU ve fallback behavior. Agent khong biet theo dau. Impact: agent co the tu dong hanh dong (sao luu/xoa) ma khong hoi user, hoac block cho user tra loi vinh vien. | Doi line 105 thanh: "AskUserQuestion khong kha dung nhu tool -> hoi van ban thuong (theo rules). Nguoi dung khong phan hoi HOAC tool loi ky thuat -> tu dong sao luu: .planning/milestones/ -> .planning/milestones_backup_[DD_MM_YYYY]/. Ghi chu: 'Da tu dong sao luu do khong nhan duoc phan hoi.'" | Low | W12/W7 (Phase 14) -- V3 la he luy cua W12, va phat hien THEM conflict voi rules section |
| V4 | WFLOW-01 | 107-110 | Info | `--reset-phase-numbers` flag xu ly 3 truong hop nhung khong verify thu muc phase cu co TRUNG TEN voi phase moi sau khi reset khong. Vd: milestone cu co phase-3, reset -> milestone moi cung co phase-3 -> xung dot. Line 109 noi "luu tru truoc de tranh xung dot" nhung khong chi ro mechanism kiem tra xung dot. | Them instruction: "Truoc khi reset: Glob .planning/milestones/[version-moi]/phase-* -> co trung ten -> luu tru (doi ten _old) truoc khi tao moi. KHONG ghi de silent." | Low | Khong co |

### Workflow Summary

| Metric | Gia tri |
|--------|---------|
| Tong steps traced | 18 (0, 0.5, 1, 2, 3, 4, 5, 6, 6a, 6b, 6c, 6d, 6e, 7, 7a-7f, 8, 9/9a-9d, 10) |
| Steps PASS | 17 |
| Steps FAIL | 1 (Step 3 -- W12 confirmed + V3 conflict moi) |
| Critical Truths | 4/4 PASS |
| Implicit Truths | 5/5 PASS |
| Issues phat hien | 2 moi (V3 Warning-High, V4 Info) + 1 confirmed (W12/W7) |
| Phase 14 deep-dive | W12 confirmed va NANG LEVEL -- phat hien conflict voi rules section |
| Key Links | 6/6 PASS |
| State Machine compliance | PASS |
| Data flow | PROJECT.md->REQUIREMENTS.md->ROADMAP.md->STATE.md->CURRENT_MILESTONE.md verified lien tuc |

## WFLOW-02: write-code {#wflow-02}

**File:** `workflows/write-code.md` (422 dong)
**Steps:** 1, 1.1, 1.5, 1.6, 2, 3, 4, 5, 6, 6.5, 6.5a, 6.5b, 7, 7a, 7b, 8, 9, 9.5, 9.5a-9.5f, 10
**Modes:** 3 (mac dinh, --auto, --parallel)
**References:** 1 required (conventions.md) + 4 conditional (prioritization, security-checklist, ui-brand, verification-patterns) + 3 guards (guard-context, guard-fastcode, guard-context7) + 1 template (verification-report.md) = 9 tong cong
**Phase 14 issues:** W9 (Warning -- parallel mode silent degradation), W4 (Warning -- context7-pipeline khong trong skill execution_context)

### Truth Inventory

#### Critical Truths (pre-defined)

| # | Truth | Cach kiem chung | Ket qua |
|---|-------|-----------------|---------|
| CT-1 | Tat ca 9 references trong skill file `commands/pd/write-code.md` ton tai tren disk | Glob verify tung path | **PASS** -- 9/9 ton tai. Chi tiet: 1 workflow (workflows/write-code.md), 1 required (references/conventions.md), 4 conditional (references/prioritization.md, references/security-checklist.md, references/ui-brand.md, references/verification-patterns.md), 3 guards (references/guard-context.md, references/guard-fastcode.md, references/guard-context7.md). Them: workflow reference 1 template (templates/verification-report.md, line 320) -- ton tai. **Luu y:** Plan 15-03 pre-defined list gom `references/context7-pipeline.md`, `references/state-machine.md`, `references/plan-checker.md` -- 3 files nay TON TAI tren disk nhung KHONG co trong skill file `commands/pd/write-code.md`. Workflow `write-code.md` reference `@references/context7-pipeline.md` (line 172) va `@references/conventions.md` (line 8), nhung skill file execution_context chi list 6 files (1 workflow + 1 required + 4 optional). context7-pipeline la lazy-loaded dependency (W4 Phase 14 da ghi nhan). |
| CT-2 | TASKS.md status update xay ra TRUOC commit (Step 7a truoc 7b) | Trace step ordering trong workflow | **PASS** -- Step 7 (line 255): "7a -- Cap nhat TASKS.md (luon, TRUOC commit):" ro rang. Line 257-259: cap nhat 🔄 -> ✅ CA HAI noi (bang Tong quan + task detail), cap nhat `> Files:`. Line 261: "7b -- Git commit (CHI HAS_GIT = true):" SAU 7a. Thu tu dung. Them: conventions.md (line 18) noi "Danh ✅ TRUOC commit" -- NHAT QUAN voi workflow. |
| CT-3 | PROGRESS.md recovery mechanism cover 6 resume points | Verify Step 1.1 case table completeness | **PASS** -- Step 1.1 (lines 55-83) co 3 truong hop chinh va 6 resume points. **Truong hop 0** (line 58): Task ✅ + PROGRESS.md ton tai (gian doan giua 7a va 7b) -- 2 paths: (a) Da commit -> xoa PROGRESS.md -> xong, (b) Chua commit -> revert TASKS.md ve 🔄 -> nhay Buoc 7. **Truong hop 1** (line 63): Task 🔄 + PROGRESS.md ton tai -- 6 resume points tai bang line 71-78: (1) Da commit -> xoa PROGRESS.md -> xong, (2) Co CODE_REPORT + chua commit -> Buoc 7, (3) Co files + lint/build da pass -> Buoc 6, (4) Co files + chua lint/build -> Buoc 5, (5) Co files nhung chua du -> Buoc 4 (CHI viet thieu, GIU da viet), (6) Chua co files -> Buoc 2. **Truong hop 2** (line 82): Task moi hoac 🔄 khong co PROGRESS.md -> tao PROGRESS.md. TAT CA 6 resume points co handling cu the, khong co gap. |
| CT-4 | Effort routing table (simple->haiku, standard->sonnet, complex->opus) match conventions.md | Cross-verify tables | **PASS** -- Write-code.md (lines 41-46): simple->haiku, standard->sonnet, complex->opus, (thieu/khong ro)->sonnet. Conventions.md (lines 74-80): simple->haiku, standard->sonnet, complex->opus, Mac dinh: standard (sonnet). **KHOP HOAN TOAN.** Ca 2 files co cung mapping va cung default behavior. Khong co conflict. **Them cross-check:** Step 10 parallel mode (line 358) cung reference effort->model mapping -- nhat quan. |
| CT-5 | Verification loop (Step 9.5) co MAX_ROUNDS=2 va 3 user options khi fail | Trace verification loop logic | **PASS** -- Step 9.5 (lines 295-327). Line 301: `VERIFY_ROUND = 0`, `MAX_ROUNDS = 2`. Line 303: `VERIFY_ROUND += 1`. 4 cap verification (9.5a-9.5d): Ton tai, Thuc chat, Ket noi, Logic Truths. Line 323: TAT CA Truths dat + khong 🛑 -> "Xac minh thanh cong" -> thoat loop. Line 324: Co gap + VERIFY_ROUND < MAX_ROUNDS -> tu sua -> lint/build -> commit -> quay dau loop. Line 325: Co gap + VERIFY_ROUND >= MAX_ROUNDS -> **DUNG**, hoi user 3 options: (1) `/pd:fix-bug`, (2) re-plan, (3) bo qua + ghi no ky thuat. Logic hoan chinh, khong co infinite loop risk (MAX_ROUNDS enforce). |

#### Implicit Truths (phat hien khi trace)

| # | Truth | Step | Cach kiem chung | Ket qua |
|---|-------|------|-----------------|---------|
| IT-1 | Conventions.md va workflow effort routing table KHOP HOAN TOAN -- khong co mismatch | 1, 10 | Cross-verify chi tiet | **PASS** -- 4 rows mapping giong het. Default behavior giong (standard/sonnet). Khac biet duy nhat: workflow co them row "(thieu/khong ro) -> sonnet" explicit, conventions.md noi "Mac dinh: standard (sonnet)" -- nghia tuong duong, cach dien dat khac. |
| IT-2 | FastCode co fallback sang Grep/Read trong write-code | 3, rules | Verify fallback logic | **PASS** -- Line 170: "FastCode loi -> Grep/Read fallback. Warning: 'FastCode loi -- dung built-in.'" Line 412: rules "FastCode loi -> Grep/Read fallback, ghi warning". 2 noi nhat quan. Khong block workflow. |
| IT-3 | PROGRESS.md lifecycle hoan chinh: tao -> cap nhat -> xoa | 1.1, 4, 7b, rules | Trace lifecycle | **PASS** -- Tao: Step 1.1 truong hop 2 (line 83). Cap nhat: Step 4 (line 199) "Cap nhat PROGRESS.md sau moi file". Xoa: Step 7b (line 278) "rm -f PROGRESS.md" sau commit. Rules (line 421): "tao khi bat dau, cap nhat moi file, xoa sau commit". Lifecycle hoan chinh, khong co orphan risk (xoa SAU commit dam bao). |
| IT-4 | Circular dependency detection co logic DUNG ro rang | 1.5 | Verify Kahn's algorithm logic | **PASS** -- Step 1.5 (lines 87-98): Kahn's algorithm / topological sort. Line 91-97: xay adjacency list, tinh in-degree, Wave 1 = in-degree 0 + ⬜, moi wave tiep xoa tasks wave truoc + tinh lai. Line 98: "Khong task nao in-degree 0 + con tasks chua xu ly -> DUNG: 'Circular dependency phat hien.'" State-machine.md (lines 101-104) cung xac nhan: circular dependency -> thong bao user, KHONG tu pick, DUNG flow. 2 files nhat quan. |
| IT-5 | Security checklist duoc integrate vao 3 buoc khac nhau (2, 4, 6.5b) | 2, 4, 6.5b | Trace security flow | **PASS** -- Step 2 (lines 159-161): Phan tich bao mat -> xac dinh loai endpoint, muc nhay cam, loai xac thuc. Step 4 (lines 180-189): Ap dung bao mat theo nghe canh (PUBLIC/ADMIN/INTERNAL). Step 6.5b (lines 245-251): Kiem tra bao mat — bang kiem ky thuat (Phan D), review tong the (Phan E), ghi CODE_REPORT. 3 buoc tao defense-in-depth. |
| IT-6 | --auto mode co scope boundary ro rang (INITIAL_PHASE) | 10 | Verify auto mode logic | **PASS** -- Line 381: "Luu phase ban dau: INITIAL_PHASE = [phase tu CURRENT_MILESTONE.md]. Dung gia tri nay (KHONG doc lai) de xac dinh scope." Line 384: "Het task -> Buoc 9 -> DUNG auto loop (KHONG nhay phase tiep du CURRENT_MILESTONE da advance)." Co 4 dieu kien dung: het task, tat ca blocked, lint/build fail bat buoc, lint/build skip (tiep binh thuong). Scope boundary ro rang, khong co runaway risk. |

### Logic Trace

#### DEFAULT MODE

##### Buoc 1: Xac dinh task
PASS. Doc CURRENT_MILESTONE.md -> version + phase + status (line 22). 3 DUNG conditions (lines 23-25): status hoan tat, TASKS.md khong co, PLAN.md khong co. Doc PLAN.md + TASKS.md (line 26). Kiem tra git (line 27). Bang chon task (lines 31-37): 6 dieu kien ro rang voi hanh dong cu the. Effort routing (lines 40-46): match conventions.md (CT-4 PASS). Persist 🔄 ngay (lines 50-53): cap nhat TASKS.md CA HAI noi, ghi dia TRUOC tao PROGRESS.md. STATE.md chi cap nhat task dau tien 🔄 trong phase. Day du.

##### Buoc 1.1: Diem khoi phuc
PASS. 3 truong hop + 6 resume points (CT-3 PASS). Truong hop 0: gian doan giua 7a-7b (line 58-61). Truong hop 1: phuc hoi sau gian doan (lines 63-80). Truong hop 2: task moi (lines 82-83). Thong bao user (line 80). Day du.

##### Buoc 1.5: Phan tich dependency (CHI --parallel)
PASS (skip trong default mode, line 136: "Khong --parallel -> bo qua Buoc 1.5"). Buoc nay duoc trace chi tiet trong PARALLEL MODE section.

##### Buoc 1.6: Phan tich task -- quyet dinh tai lieu tham khao
PASS. 4 conditional readings (lines 141-145): security-checklist.md, ui-brand.md, verification-patterns.md, prioritization.md. Logic: doc mo ta task -> xac dinh -> doc khi can. Line 147: "Khong ro -> BO QUA. Phat hien can giua chung -> doc khi can." Flexible va khong block.

##### Buoc 2: Doc context cho task
PASS. Doc task detail + PLAN.md (lines 152-153). 4 yeu cau tu PLAN.md (lines 153-156): Quyet dinh thiet ke, UX States, UI Ke thua patterns, thieu thong tin -> DUNG. Doc .planning/rules/ (line 157). Phan tich bao mat (lines 159-161). Day du.

##### Buoc 3: Research code hien co + tra cuu thu vien
PASS. 2 paths: du an moi (skip FastCode, chi Context7) va co code (FastCode code_qa, line 168). Fallback FastCode (line 170). Context7 pipeline (line 172) tham chieu @references/context7-pipeline.md. Day du.

##### Buoc 4: Viet code
PASS. Quy tac sai lech (line 178 -> Rules). Bao mat theo ngu canh (lines 180-189): bang 4 loai endpoint. Quy tac code rules/ (lines 192-197): JSDoc/Logger/Comments tieng Viet, ten bien tieng Anh, gioi han 300 dong / bat buoc tach >500. Per-stack (line 197). Cap nhat PROGRESS.md sau moi file (line 199). Day du.

##### Buoc 5: Lint + Build
PASS. CONTEXT.md -> Tech Stack (line 204). Doc rules file -> Build & Lint (line 206). Fallback package.json (line 207). Chay trong dung thu muc (line 208). Fail -> sua + chay lai. Toi da 3 lan -> DUNG (line 209). Chua co config -> skip (line 210). Day du.

##### Buoc 6: Tao bao cao
PASS. Path: `reports/CODE_REPORT_TASK_[N].md` (line 215). Template day du (lines 217-232): header, files, review bao mat, sai lech, van de hoan lai, ghi chu. Day du.

##### Buoc 6.5: Tu kiem tra bao cao + bao mat
PASS. 2 sub-steps: 6.5a kiem tra bao cao (lines 239-243): file ton tai, endpoints, migration, sai lech. 6.5b kiem tra bao mat (lines 246-248): bang kiem ky thuat (Phan D), review tong the (Phan E), ghi ket qua. Line 250-251: phat hien lo hong -> sua ngay, chay lai lint/build. Day du.

##### Buoc 7: Cap nhat TASKS.md + Git commit
PASS. 7a (lines 257-259): TASKS.md 🔄 -> ✅ CA HAI noi, cap nhat `> Files:`. TRUOC commit (CT-2 PASS). 7b (lines 261-279): git add + commit voi format message. Commit FAIL -> revert 🔄, sua, thu lai (line 275). Sau commit: xoa PROGRESS.md (line 278). Day du.

##### Buoc 8: Cap nhat CONTEXT.md
PASS. Logic don gian (line 284): CONTEXT.md `Du an moi: Co` VA task dau tien hoan tat -> `Du an moi: Khong`. Day du.

##### Buoc 9: Cap nhat ROADMAP + REQUIREMENTS + STATE
PASS. Dieu kien: TAT CA tasks ✅ (line 289). 4 cap nhat (lines 290-293): ROADMAP deliverables, REQUIREMENTS trang thai, STATE hoat dong cuoi, auto-advance. Day du.

##### Buoc 9.5: Xac minh tinh nang
PASS. Dieu kien trigger: PLAN.md co "Tieu chi thanh cong" (line 297). 4 cap verification (9.5a-9.5d, lines 305-318). Verification loop voi MAX_ROUNDS=2 (CT-5 PASS). Tu suc loop (line 324). 3 options khi fail (line 325). Auto-advance (lines 329-333). Tracking commit (lines 335-343). Day du.

##### Buoc 10: Tiep tuc hoac dung (MAC DINH)
PASS. Lines 389-396: DUNG sau moi task. Task hoan thanh -> thong tin files + build status. Con ⬜ -> hoi "Tiep tuc?" (line 392). Het ⬜ -> de xuat /pd:test (CHI khi co backend/specific stacks), /pd:plan, /pd:complete-milestone. Day du.

#### --AUTO MODE

##### Buoc 10 --auto: Tuan tu tat ca
PASS. Lines 380-387. Luu INITIAL_PHASE (line 381). Loop: con 🔄/⬜ trong INITIAL_PHASE -> Buoc 1 pick tiep, KHONG hoi user, uu tien 🔄 truoc ⬜. 4 dieu kien dung (lines 383-387): (1) het task -> Buoc 9 -> DUNG auto loop, (2) tat ca blocked -> DUNG + thong bao, (3) lint/build fail BAT BUOC -> dung, (4) lint/build skip -> tiep. **Diem quan trong:** Line 384 "KHONG nhay phase tiep du CURRENT_MILESTONE da advance" -> scope boundary ro rang (IT-6 PASS). Day du, khong co runaway risk.

#### --PARALLEL MODE

##### Buoc 1.5: Phan tich dependency + nhom wave
PASS voi 1 issue (W9 confirmed + V5 new).

**Logic Trace:**
Lines 87-136. 6 sub-steps:

1. **Doc TASKS.md** (line 89): tasks ⬜ + cot Phu thuoc. Khong co ⬜ -> DUNG parallel.

2. **Dependency graph** (lines 90-98): Kahn's algorithm / topological sort. Adjacency list tu cot Phu thuoc (lines 91-94): 3 loai edge (code dependency, design dependency = khong edge, shared file). In-degree tinh cho moi task. Wave 1 = in-degree 0 + ⬜. Moi wave tiep: xoa wave truoc -> tinh lai in-degree -> in-degree 0 moi. Circular detection (line 98): khong co in-degree 0 + con tasks -> DUNG. **Nhat quan voi state-machine.md (lines 101-104).**

3. **Phat hien shared files** (lines 100-118): 2 layers:
   - Layer 1 Static (lines 102-112): Bang hotspot patterns cho 6 stacks (Chung, NestJS, Next.js, Flutter, WordPress, Solidity).
   - Layer 2 Dynamic (lines 114-118): Thu thap `> Files:` tu tat ca tasks cung wave. So sanh tung cap: giao nhau > 0 -> conflict. Hotspot match + 2+ tasks -> conflict.
   - **Line 118: "Task thieu `> Files:` -> canh bao nhung van cho chay song song (degraded detection)"** -> day la van de W9 (xem deep-dive).

4. **Xu ly conflict** (lines 120-123): Auto-serialize, KHONG hard-stop. Giu task so nho, doi task so lon sang wave tiep. Deadlock fallback: tat ca conflict -> chuyen sequential. Logic hop ly.

5. **Backend + Frontend song song** (line 125): PLAN.md co thiet ke API -> Frontend dung response shape. Day du.

6. **Hien thi wave plan** (lines 127-134): Bang compact, xac nhan 1 lan roi chay. Day du.

##### Buoc 10 --parallel: Multi-agent song song
FAIL (1 issue -- W9 confirmed + V5 new)

**Logic Trace:**
Lines 349-377. 7 sub-steps:

1. **Spawn Agent tool** (lines 353-361): Moi task nhan: task detail, PLAN.md sections lien quan, rules, CONTEXT.md path, effort->model mapping. Agent chi chay Buoc 2->3->4->5. KHONG report, KHONG commit, KHONG cap nhat TASKS.md. Day du.

2. **Agent Frontend dac biet** (line 362): Song song Backend, tao types tu response shape, verify types sau khi Backend xong. Day du.

3. **Cho tat ca agents** (line 363). Day du.

4. **Post-wave safety net** (lines 364-368):
   a. `git diff --name-only` -> files da sua.
   b. **2+ agents sua cung file -> DUNG**: "Conflict phat hien." Day la SECONDARY conflict detection -- xay ra SAU agents chay, doi nghi voi Layer 2 TRUOC KHI chay.
   c. Build check: lint + build. Fail -> DUNG. KHONG chay wave tiep.
   d. OK -> report + TASKS.md + commit cho TUNG task.

5. **Verify integration** (line 369): So sanh TS interfaces vs response DTO. Mismatch -> sua frontend. Day du.

6. **Wave tiep** (line 370). Day du.

7. **Het waves** (lines 371-378): Buoc 9 -> thong bao tong ket. Day du.

**Issues:**
- W9 (Phase 14 confirmed) + V5 (moi): `> Files:` metadata missing trong TASKS.md -> conflict detection bi degraded. Xem W9 deep-dive chi tiet.

### Key Links

| Step tao | Artifact | Step dung | Verified |
|----------|----------|-----------|----------|
| [plan input] | PLAN.md | Step 1 (doc plan, line 26), Step 2 (doc context, lines 152-156), Step 10 parallel (PLAN.md sections cho agents, line 355) | **PASS** -- PLAN.md duoc doc tai 3 buoc khac nhau voi muc dich khac nhau: Step 1 (overview), Step 2 (chi tiet task), Step 10 (parallel agent context). Data flow lien tuc. |
| Step 1 | TASKS.md (parsed) | Step 1.1 (recovery check, line 58-61), Step 3 (task detail reference), Step 7a (cap nhat status, line 257), Step 8 (context update check) | **PASS** -- TASKS.md duoc doc tai Step 1, cap nhat tai Step 1 (🔄 persist, line 50), Step 7a (✅), va kiem tra tai nhieu buoc. Data flow lien tuc. |
| Step 4 | Source code files | Step 5 (lint/build, line 203), Step 6 (bao cao, line 215), Step 6.5a (kiem tra ton tai, line 239), Step 7b (git add, line 264) | **PASS** -- Files tao tai Step 4, verified tai Step 5 (lint), bao cao tai Step 6, kiem tra ton tai tai Step 6.5a, commit tai Step 7b. Pipeline lien tuc. |
| Step 7b | Git commit | Step 9 (verify khi phase hoan tat), Step 9.5 (verification loop dua tren committed code) | **PASS** -- Commit tai Step 7b. Step 9 chi chay khi TAT CA tasks ✅ (da commit). Step 9.5 verify tren code da commit. Data flow lien tuc. |
| Step 1.1 | PROGRESS.md (recovery) | Step 4 (cap nhat sau moi file, line 199), Step 7b (xoa sau commit, line 278) | **PASS** -- Tao tai Step 1.1 (truong hop 2, line 83). Cap nhat tai Step 4 (line 199). Xoa tai Step 7b (line 278). Lifecycle hoan chinh (IT-3 PASS). |
| Step 6 | CODE_REPORT_TASK_[N].md | Step 6.5a (kiem tra, line 239), Step 7b (commit cung source, line 268) | **PASS** -- Tao tai Step 6 (line 215). Kiem tra tai Step 6.5a. Commit cung source code tai Step 7b. Data flow lien tuc. |
| Step 9.5e | VERIFICATION_REPORT.md | Step 9.5f (xu ly ket qua, line 322), tracking commit (line 337) | **PASS** -- Tao tai Step 9.5e theo @templates/verification-report.md (line 320). Xu ly ket qua tai Step 9.5f. Commit tai tracking commit (line 337). Data flow lien tuc. |

### State Machine Compliance (D-05)

| Kiem tra | Ket qua | Chi tiet |
|----------|---------|----------|
| Task status chi danh dau ✅ SAU code + build + commit | **PASS** | Step 4 (code) -> Step 5 (lint/build) -> Step 7a (TASKS.md ✅) -> Step 7b (commit). Thu tu dung. Conventions.md (line 18): "Danh ✅ TRUOC commit" -- workflow nhat quan: 7a (✅) truoc 7b (commit). |
| Build fail -> giu trang thai 🔄 | **PASS** | Step 5 (line 209): fail -> sua + chay lai, toi da 3 lan -> DUNG. Khong advance qua Step 5 neu fail. Task giu 🔄. Conventions.md (line 18): "Commit fail -> revert 🔄, sua roi thu lai." |
| PROGRESS.md recovery khong tao duplicate states | **PASS** | Step 1.1 truong hop 0 (line 58): Task ✅ + PROGRESS.md = gian doan giua 7a-7b. Kiem tra git log. Da commit -> xoa PROGRESS.md -> xong (khong re-run). Chua commit -> revert 🔄 -> nhay Buoc 7. Khong co duplicate state risk. |
| Auto-advance chi khi phase hoan tat | **PASS** | Step 9 (line 289): "TAT CA tasks ✅" truoc khi cap nhat ROADMAP/REQUIREMENTS/STATE. Step 9.5 (line 295): verification chi chay khi phase hoan tat. state-machine.md (lines 58-61): auto-advance logic nhat quan. |

### FastCode Fallback Verification (D-06)

| Kiem tra | Ket qua | Chi tiet |
|----------|---------|----------|
| FastCode loi co fallback | **PASS** | Line 170: "FastCode loi -> Grep/Read fallback. Warning." |
| Fallback khong block workflow | **PASS** | Line 412 (rules): "FastCode loi -> Grep/Read fallback, ghi warning". Explicit rule, khong block. |
| Du an moi skip FastCode | **PASS** | Line 167: "Moi, chua co source: skip FastCode, chi Context7 tra docs." Logic hop ly -- du an moi chua co code de query. |

### Phase 14 Issues Deep-Dive

#### W9: Parallel mode silent degradation (Warning)

**Source:** 14-AUDIT-REPORT.md, AUDIT-02, W4 (W9 la ID Phase 15, W4 la ID goc Phase 14 AUDIT-02)
**Lines:** 114-118, 353-377 (workflows/write-code.md)
**Phase 14 assessment:** "Add explicit warning to user when `> Files:` is missing."

**Deep-dive:**

**Van de chinh:** Step 1.5 Layer 2 conflict detection (line 114-118) dua vao `> Files:` metadata trong TASKS.md. Line 118: "Task thieu `> Files:` -> canh bao nhung van cho chay song song (degraded detection)."

**Khi `> Files:` missing, conflict detection lam gi?**

1. **Layer 1** (static hotspot patterns, lines 102-112): Van hoat dong -- kiem tra dua tren stack patterns (barrel exports, config files, module registrations). KHONG can `> Files:` metadata.
2. **Layer 2** (dynamic cross-reference, lines 114-118): BI DEGRADED -- khong co `> Files:` thi khong the so sanh tung cap tasks. Line 118 chi noi "canh bao" nhung khong chi ro FORMAT canh bao, TIMING (truoc hay sau wave), hay CONSEQUENCE (user co biet de review khong).
3. **Post-wave safety net** (Step 10, lines 364-368): git diff --name-only SAU khi agents chay -> phat hien conflict SAU KHI da xay ra. Luc nay code da bi ghi de -- damage da done.

**Impact thuc te:**

| Scenario | `> Files:` | Layer 1 | Layer 2 | Post-wave | Ket qua |
|----------|-----------|---------|---------|-----------|---------|
| 2 tasks cung sua app.module.ts | Co | CATCH (hotspot) | CATCH | N/A | **An toan** |
| 2 tasks cung sua app.module.ts | Thieu | CATCH (hotspot) | MISS | CATCH (nhung da late) | **An toan** (Layer 1 bao ve) |
| 2 tasks cung sua custom-service.ts | Co | MISS | CATCH | N/A | **An toan** |
| 2 tasks cung sua custom-service.ts | Thieu | MISS | MISS | CATCH (damage done) | **NGUY HIEM** -- agents ghi de nhau |

**Severity assessment:** **Warning** (khong phai Critical). Ly do:
1. Layer 1 bao ve cho cac file hotspot pho bien (config, module, barrel exports)
2. Post-wave safety net van catch conflict -- chi la SAU KHI damage xay ra
3. Planner thuong generate `> Files:` (la phan cua plan output) -- truong hop thieu la edge case
4. Nhung khi xay ra voi custom files, data loss la THUC SU (agent A ghi de code cua agent B)

**Suggested Fix CU THE:**

- **File:** `workflows/write-code.md`
- **Line 118:** Doi tu:
  `- Task thiếu > Files: → cảnh báo nhưng vẫn cho chạy song song (degraded detection)`
- **Thanh:**
  ```
  - Task thiếu `> Files:` → **CẢNH BÁO RÕ RÀNG** trước khi spawn agents:
    "⚠️ Task [N] thiếu `> Files:` metadata. Conflict detection bị giảm cấp — chỉ phát hiện hotspot patterns.
    Khuyến nghị: thêm `> Files:` vào TASKS.md trước khi chạy --parallel, hoặc chấp nhận rủi ro conflict."
  - Hiển thị CẢ danh sách tasks thiếu `> Files:` trong wave plan (Bước 1.5 sub-step 6)
  ```
- **Them tai line 366 (post-wave safety net):**
  ```
  b2. Tasks thiếu `> Files:` trong wave vừa chạy → hiển thị:
    "⚠️ [N] tasks thiếu `> Files:` metadata. Review kỹ các files sau đây (có thể bị conflict không phát hiện): [list files from git diff]"
  ```

#### W4: context7-pipeline.md khong trong skill execution_context (Warning)

**Source:** 14-AUDIT-REPORT.md, AUDIT-01, W4
**Lines:** workflows/write-code.md line 172, commands/pd/write-code.md execution_context
**Phase 14 assessment:** "Add @references/context7-pipeline.md (optional) to relevant skills."

**Deep-dive:**
Workflow `write-code.md` line 172 reference `@references/context7-pipeline.md`. Nhung skill file `commands/pd/write-code.md` execution_context (lines 50-57) khong list file nay. Context7-pipeline la lazy-loaded dependency -- duoc doc KHI task dung thu vien ngoai (line 172: "Context7 (task dung thu vien ngoai)").

**Impact thuc te:** Thap. Agent se doc file nay khi gap @references/context7-pipeline.md trong workflow text. Viec khong list trong skill file chi anh huong transparency -- khong anh huong hoat dong.

**Ket luan:** Giu muc Warning. Fix la them dong `@references/context7-pipeline.md (optional)` vao skill file execution_context.

### Kahn's Algorithm Verification

| Kiem tra | Ket qua | Chi tiet |
|----------|---------|----------|
| Adjacency list tu cot Phu thuoc | **PASS** | Lines 91-94: 3 loai edge. Code dependency -> edge. Design dependency -> khong edge. Shared file -> edge. Day du. |
| In-degree tinh dung | **PASS** | Line 95: "Tinh in-degree cho moi task." Logic Kahn's standard. |
| Wave computation | **PASS** | Lines 96-97: Wave 1 = in-degree 0 + ⬜. Moi wave tiep: xoa -> tinh lai -> in-degree 0 moi. Standard topological sort. |
| Circular detection | **PASS** | Line 98: "Khong task nao in-degree 0 + con tasks chua xu ly -> DUNG." Dieu kien chinh xac cho Kahn's -- neu khong tien trien duoc thi co cycle. state-machine.md (lines 101-104) nhat quan. |
| Deadlock fallback | **PASS** | Line 123: "TAT CA tasks con lai conflict lan nhau -> chuyen sequential." Fallback hop ly. |

### Detailed Findings

| ID | Source | Lines | Severity | Description & Impact | Suggested Fix | Regression Risk | Phase 14 Ref |
|----|--------|-------|----------|---------------------|---------------|-----------------|--------------|
| V5 | WFLOW-02 | 114-118, 364-368 | Warning | Layer 2 conflict detection (dynamic `> Files:` cross-reference) bi degraded khi tasks thieu `> Files:` metadata. Line 118 noi "canh bao" nhung khong chi ro format, timing, hay consequence. Post-wave safety net (line 366) catch conflict SAU KHI agents da chay -- damage da done (code bi ghi de). Impact: 2 parallel tasks sua cung custom file ma khong co hotspot pattern -> agent A ghi de code cua agent B ma khong ai biet cho den post-wave check. | (1) Line 118: doi thanh canh bao RO RANG truoc khi spawn agents, list tasks thieu `> Files:`, de xuat them metadata hoac chap nhan rui ro. (2) Line 366: them sub-step b2 -- tasks thieu `> Files:` trong wave vua chay -> hien thi danh sach files can review thu cong. Chi tiet: xem W9 deep-dive. | Low | W9/W4 (Phase 14) -- V5 la he luy cua W9 (silent degradation), lien quan W4 (context7-pipeline transparency) |
| V6 | WFLOW-02 | 18 (conventions.md) | Info | Conventions.md line 18 noi "Danh ✅ TRUOC commit. Commit fail -> revert 🔄, sua roi thu lai." Workflow write-code.md Step 7 cung logic nay (7a ✅ truoc 7b commit, line 275 "Commit FAIL -> revert TASKS.md ve 🔄"). HAI files NHAT QUAN nhung co 1 subtle difference: conventions.md noi "Danh ✅ TRUOC commit" nhu GENERAL rule, nhung dieu nay chi dung cho write-code workflow. Fix-bug workflow (Step 10) update TASKS.md SAU user confirm, khong phai truoc commit. Impact: Thap -- conventions.md la general guideline, moi workflow co specific logic. Nhung co the gay confusion neu doc conventions.md doc lap. | Them note vao conventions.md line 18: "Ap dung cho /pd:write-code. Cac workflow khac (fix-bug) co logic rieng." | Low | Khong co |

### Workflow Summary

| Metric | Gia tri |
|--------|---------|
| Tong steps traced | 22 (1, 1.1, 1.5, 1.6, 2, 3, 4, 5, 6, 6.5, 6.5a, 6.5b, 7, 7a, 7b, 8, 9, 9.5, 9.5a-f, 10-default, 10-auto, 10-parallel) |
| Steps PASS | 21 |
| Steps FAIL | 1 (Step 10 parallel -- W9 confirmed) |
| Critical Truths | 5/5 PASS |
| Implicit Truths | 6/6 PASS |
| Issues phat hien | 2 (V5 Warning, V6 Info) + 1 confirmed (W9 Warning) |
| Phase 14 deep-dive | W9 confirmed -- silent degradation khi `> Files:` missing, W4 confirmed -- transparency issue |
| Key Links | 7/7 PASS |
| State Machine compliance | PASS |
| FastCode fallback | PASS |
| Kahn's algorithm | PASS |
| Effort routing cross-verify | PASS (KHOP HOAN TOAN voi conventions.md) |

## Cross-Workflow Issues

### Phan tich cross-workflow

| Pattern | WFLOW-03 (fix-bug) | WFLOW-01 (new-milestone) | WFLOW-02 (write-code) | Nhat quan? |
|---------|--------------------|--------------------------|-----------------------|------------|
| State machine compliance | PASS -- ✅ SAU user confirm | PASS -- commit truoc khi ghi nhan | PASS -- ✅ truoc commit (7a truoc 7b) | **Co** -- moi workflow co logic rieng nhung deu tuong thich state-machine.md |
| AskUserQuestion fallback | Khong dung AskUserQuestion | **CONFLICT** -- Step 3 (tu dong sao luu) vs rules (hoi van ban) | Khong dung AskUserQuestion truc tiep trong default mode | **V3 chi anh huong WFLOW-01** |
| FastCode fallback | PASS -- Grep/Read fallback | Khong dung FastCode | PASS -- Grep/Read fallback + du an moi skip | **Nhat quan** giua 2 workflows dung FastCode |
| Commit flow ordering | Step 9 (commit) SAU Step 8 (code) | Step 6e, 7f, 9d (3 commits) | Step 7a (TASKS.md) truoc 7b (commit) | **Nhat quan** -- moi workflow co specific commit logic phu hop |
| Effort routing | Step 6a.1 -- **ASPIRATIONAL** (V2) | Khong co effort routing | Steps 1, 10 -- **KHOP conventions.md** (CT-4 PASS) | **KHONG nhat quan** -- fix-bug co table aspirational, write-code table khop |

### Ket luan

Khong phat hien cross-workflow issues MOI ngoai nhung gi da documented. Moi workflow co issues DOC LAP:
- WFLOW-03: C2 (stack fallback), V1 (CONTEXT.md stack assumption), V2 (aspirational effort routing)
- WFLOW-01: V3 (AskUserQuestion fallback conflict), V4 (reset-phase-numbers)
- WFLOW-02: V5 (parallel silent degradation), V6 (conventions.md subtle difference)

**Diem tich cuc:** FastCode fallback va state machine compliance NHAT QUAN across workflows. Commit flow ordering tuy khac nhau nhung deu hop ly cho tung use case.

**Effort routing KHONG nhat quan:** fix-bug co aspirational table (V2), write-code co table KHOP conventions.md. Can resolve: hoac fix-bug xoa table (Phuong an A tu V2), hoac ca 2 dong bo.

## Issue Registry

| ID | Source | Workflow | Lines | Severity | Description | Phase 14 Ref |
|----|--------|----------|-------|----------|-------------|--------------|
| V1 | WFLOW-03 | fix-bug | 133 | Warning | CONTEXT.md -> stack gia dinh luon co stack. Neu thieu hoac stack ngoai 5 listed -> agent khong co fallback xac dinh luong truy vet. | C2 (Phase 14) |
| V2 | WFLOW-03 | fix-bug | 162-174 | Warning | Effort routing table aspirational -- skill file hardcode sonnet, workflow table khong co enforcement. Tat ca bugs chay sonnet bat ke do phuc tap. | Khong co |
| V3 | WFLOW-01 | new-milestone | 105, 403 | Warning-High | Step 3 "tu dong sao luu" vs rules "hoi van ban" -- 2 instructions TRAI NHAU ve fallback behavior. Agent khong biet theo dau. | W12/W7 (Phase 14) |
| V4 | WFLOW-01 | new-milestone | 107-110 | Info | --reset-phase-numbers khong verify thu muc phase moi co TRUNG TEN voi phase cu khong. | Khong co |
| V5 | WFLOW-02 | write-code | 114-118, 364-368 | Warning | Parallel mode `> Files:` missing -> Layer 2 conflict detection degraded. Canh bao khong ro rang. Post-wave catch SAU damage. | W9/W4 (Phase 14) |
| V6 | WFLOW-02 | write-code | 18 (conv.) | Info | Conventions.md "Danh ✅ TRUOC commit" la general rule nhung chi dung cho write-code. Fix-bug co logic rieng. Co the gay confusion. | Khong co |

**Tong:** 6 issues (0 Critical, 1 Warning-High, 3 Warning, 2 Info)
**Phase 14 confirmed:** 3 (C2 -> V1, W12 -> V3, W9 -> V5)
**Issues moi:** 3 (V2, V4, V6)

## Recommendations cho Phase 16

### Critical Fixes (phai fix)

**Khong co issues muc Critical.** C2 (Phase 14) da duoc confirm nhung V1 la Warning vi co workaround (agent dung generic debugging flow tu training data). Tuy nhien, V1 + C2 nen duoc fix som vi impact 60-70% projects.

**Khuyen nghi fix V1 + C2 cung nhau:**
- **File:** `workflows/fix-bug.md`
- **Lines:** 133-141
- **Fix:** Them row "Generic/Khac" vao bang stack trace: "entry point -> handler -> business logic -> data layer -> response". Them fallback: "Khong xac dinh duoc stack tu CONTEXT.md -> dung luong truy vet generic." *(Confirmed by Phase 15 verification -- C2 impact 60-70% projects)*
- **Issue IDs:** V1, C2

### Warning Fixes (nen fix)

**1. V3 -- AskUserQuestion fallback conflict (Warning-High)**
- **File:** `workflows/new-milestone.md`
- **Line:** 105
- **Fix:** Doi thanh: "AskUserQuestion khong kha dung nhu tool -> hoi van ban thuong (theo rules). Nguoi dung khong phan hoi HOAC tool loi ky thuat -> tu dong sao luu. Ghi chu: 'Da tu dong sao luu do khong nhan duoc phan hoi.'" *(Confirmed by Phase 15 verification -- phat hien THEM conflict voi rules line 403)*
- **Issue IDs:** V3

**2. V2 -- Effort routing aspirational trong fix-bug (Warning)**
- **File:** `workflows/fix-bug.md`
- **Lines:** 162-174
- **Fix:** Phuong an A (khuyen nghi): Xoa effort routing table, them note: "fix-bug luon chay voi sonnet (theo skill file). Effort routing khong ap dung cho fix-bug do thiet ke hien tai." *(Phase 15 xac nhan: write-code effort routing KHOP conventions.md, nhung fix-bug la aspirational)*
- **Issue IDs:** V2

**3. V5 -- Parallel mode silent degradation (Warning)**
- **File:** `workflows/write-code.md`
- **Lines:** 118, 366
- **Fix:** (1) Line 118: canh bao RO RANG truoc spawn agents, list tasks thieu `> Files:`. (2) Line 366: them sub-step b2 -- tasks thieu `> Files:` -> hien thi files can review. *(Confirmed by Phase 15 verification -- W9 Phase 14)*
- **Issue IDs:** V5

### Info/Cleanup (neu co time)

**1. V4 -- reset-phase-numbers khong verify trung ten (Info)**
- **File:** `workflows/new-milestone.md`
- **Lines:** 107-110
- **Fix:** Them instruction: "Truoc khi reset: Glob phase-* -> co trung ten -> luu tru truoc."
- **Issue IDs:** V4

**2. V6 -- Conventions.md subtle difference (Info)**
- **File:** `references/conventions.md`
- **Line:** 18
- **Fix:** Them note: "Ap dung cho /pd:write-code. Cac workflow khac co logic rieng."
- **Issue IDs:** V6

**3. W4 -- context7-pipeline.md transparency (Warning, Phase 14)**
- **File:** `commands/pd/write-code.md` (va cac skill khac)
- **Fix:** Them `@references/context7-pipeline.md (optional)` vao execution_context cua skills dung context7. *(Confirmed by Phase 15 verification)*
- **Issue IDs:** W4 (Phase 14)
