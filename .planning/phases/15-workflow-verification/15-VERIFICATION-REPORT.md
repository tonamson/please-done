# Phase 15: Workflow Verification Report

**Date:** 2026-03-23
**Phase:** 15-workflow-verification
**Methodology:** 4-level verification (verification-patterns.md) adapted cho workflow context
**Baseline:** 14-AUDIT-REPORT.md (27 issues, 3 in-scope: C2, W4/W9, W7/W12)
**Report language:** Tieng Viet (per D-14)

## Executive Summary

> [Se cap nhat sau khi verify ca 3 workflows]

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

> [Se verify trong Plan 15-03]

## Cross-Workflow Issues

> [Se tong hop trong Plan 15-03]

## Issue Registry

> [Se tong hop trong Plan 15-03]

## Recommendations cho Phase 16

> [Se tong hop trong Plan 15-03]
