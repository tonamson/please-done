# Feature Research: v2.1 Detective Orchestrator

**Domain:** Dieu phoi da Agent cho debug workflow trong CLI AI coding framework
**Researched:** 2026-03-24
**Confidence:** HIGH (dua tren tai lieu chinh thuc Claude Code + existing codebase)

## Feature Landscape

### Danh muc A: Dynamic Resource Orchestration

#### Table Stakes (Nguoi dung ky vong co)

| Feature | Ly do ky vong | Do phuc tap | Ghi chu |
|---------|---------------|-------------|---------|
| **A-TS1: Tier-to-Model mapping table** | Cac agent khac nhau can model khac nhau de toi uu chi phi/chat luong | LOW | Config YAML frontmatter tren 5 agent files da co. Claude Code ho tro truong `model:` native (sonnet/opus/haiku/inherit). Chi can cap nhat frontmatter cua 5 file tai `commands/pd/agents/`. Scout=haiku, Builder=sonnet, Architect=opus. **Phu thuoc:** Khong. Doc lap config. |
| **A-TS2: Max 2 sub-agents song song** | Tranh qua tai tai nguyen may nguoi dung; Claude Code subagent tieu ton context window rieng | LOW | Convention trong workflow prompt. Claude Code da co co che chay `background: true` va foreground. Gioi han nay la logic trong orchestrator workflow, khong can code. Tai lieu Claude Code khuyen: "3-5 teammates" nhung cho debug workflow sequential, 2 la du. **Phu thuoc:** Khong. Orchestrator logic. |
| **A-TS3: Heavy Lock (1 tac vu nang moi luc)** | FastCode indexing + test suite chay dong thoi gay lag/crash tren may yeu | MEDIUM | Tracking state trong SESSION file: `> Heavy Task: [agent-name]`. Orchestrator kiem tra truoc khi spawn agent dung FastCode hoac chay test. Giai phong khi agent do xong. **Phu thuoc:** SESSION file format (da co). |
| **A-TS4: Ha cap thong minh (Sequential fallback)** | Khi spawn song song that bai (timeout/error), tu dong chuyen sang tuan tu thay vi crash | MEDIUM | Pattern: try spawn 2 background agents -> neu 1 fail (timeout > 120s hoac error) -> kill ca 2 -> chay tuan tu (Detective truoc, DocSpec sau). Ghi warning vao SESSION: "Ha cap sang tuan tu do [ly do]". **Phu thuoc:** A-TS2 (parallel spawning phai co truoc moi can fallback). |

#### Differentiators (Loi the canh tranh)

| Feature | Gia tri | Do phuc tap | Ghi chu |
|---------|---------|-------------|---------|
| **A-D1: Auto-detect resource constraint** | Tu dong do RAM/CPU truoc khi quyet dinh parallel vs sequential, thay vi doi crash roi fallback | HIGH | Can Bash command (`sysctl hw.memsize` macOS / `free -m` Linux) + threshold logic. Phuc tap vi cross-platform. Loi ich thap so voi chi phi — hau het may dev hien dai du RAM cho 2 subagent. Doi v2.2+. |
| **A-D2: Cost estimation per investigation** | Hien thi uoc tinh token cost truoc khi spawn agent team | MEDIUM | Can dem token estimate cho moi agent prompt + estimated tool calls. Phuc tap vi model pricing thay doi va output khong du doan duoc. Chua thiet yeu cho v2.1. |

#### Anti-Features (Khong nen lam)

| Feature | Ly do muon co | Ly do co van de | Thay the |
|---------|---------------|-----------------|----------|
| **A-AF1: Agent Teams (TeammateTool)** | Cac agent co the giao tiep truc tiep voi nhau, khong qua orchestrator | Experimental, chua stable. Claude Code docs ghi ro: "known limitations around session resumption, task coordination, and shutdown behavior". Token cost cao gap boi vi moi teammate la Claude instance rieng. Enable can `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS` env var. | Dung Subagent pattern: orchestrator spawn -> agent tra ket qua qua evidence file -> orchestrator tong hop. On dinh, cost thap, kiem soat duoc. |
| **A-AF2: Nested subagent spawning** | Agent spawn agent con (vd: Detective spawn DocSpecialist truc tiep) | Claude Code cam tuyet doi: "Subagents cannot spawn other subagents". Khong co cach vuot qua gioi han nay. | Orchestrator la diem DUY NHAT spawn. Moi agent bao cao ve orchestrator qua evidence file, orchestrator quyet dinh spawn ai tiep theo. |
| **A-AF3: Unlimited parallel agents** | Chay 3-5 agent cung luc de nhanh hon | Context window bung no khi nhieu agent tra ket qua ve. Claude Code docs: "Running many subagents that each return detailed results can consume significant context". Token cost tang tuyen tinh. Diminishing returns sau 2 agent cho debug workflow vi cac buoc phu thuoc nhau. | Gioi han 2 song song (Detective + DocSpec). Con lai chay tuan tu. |

---

### Danh muc B: Detective Protocols

#### Table Stakes (Nguoi dung ky vong co)

| Feature | Ly do ky vong | Do phuc tap | Ghi chu |
|---------|---------------|-------------|---------|
| **B-TS1: Resume UI (danh sach phien danh so)** | Workflow v1.5 da co resume qua Glob SESSION_*.md nhung UX kho dung — phai doc ten file, nho trang thai. Can danh so ID de chon nhanh | MEDIUM | Sua Buoc 1a trong workflow: scan `.planning/debug/SESSION_*.md` + `.planning/debug/evidence_*.md` -> hien bang danh so voi trang thai + tom tat. User nhap so (tiep tuc) hoac mo ta moi (session moi). **Phu thuoc:** workflow fix-bug.md (sua Buoc 1a), SESSION file format hien tai (tuong thich nguoc). |
| **B-TS2: Evidence Format chuan (3 outcomes)** | Moi agent PHAI tra ket qua theo format nhat quan de orchestrator xu ly tu dong. Khong co format chuan -> orchestrator phai "doan" ket qua | LOW | Dinh nghia 3 section header bat buoc: `## ROOT CAUSE FOUND` (kem bang chung file:dong), `## CHECKPOINT REACHED` (kem cau hoi cho user), `## INVESTIGATION INCONCLUSIVE` (kem Elimination Log). Da co 1 phan trong pd-code-detective.md va pd-fix-architect.md. Can chuan hoa cho TAT CA 5 agents. **Phu thuoc:** 5 agent config files da co tai `commands/pd/agents/`. |
| **B-TS3: ROOT CAUSE -> 3 lua chon** | Khi tim ra nguyen nhan, user can chon huong xu ly thay vi bi ep vao 1 duong | LOW | Sau khi Architect xac nhan root cause, hien 3 option: **(1) Sua ngay** (orchestrator chay Buoc 5: Fix+Commit), **(2) Len ke hoach** (tao PLAN.md cho fix phuc tap), **(3) Tu sua** (user tu lam, chi ghi BUG report). **Phu thuoc:** B-TS2 (Evidence Format de biet ROOT CAUSE FOUND), pd-fix-architect.md output. |
| **B-TS4: CHECKPOINT -> hoi user roi tiep** | Dung dieu tra khi agent can xac nhan tu user (vd: "Loi nay chi xay ra tren production?") | LOW | Da co pattern tuong tu trong v1.5 Buoc 5c "Diem dung". Formalize thanh protocol: moi agent co quyen ghi `## CHECKPOINT REACHED` + cau hoi. Orchestrator doc checkpoint -> hien cau hoi -> user tra loi -> orchestrator gui thong tin moi cho agent (hoac spawn agent moi voi context). **Phu thuoc:** B-TS2 (Evidence Format), SESSION file (ghi checkpoint history). |
| **B-TS5: INCONCLUSIVE -> Elimination Log** | Khi be tac, PHAI ghi ro nhung gi DA kiem tra va BINH THUONG, de vong dieu tra tiep khong lap lai | MEDIUM | Them section bat buoc trong evidence file khi outcome = INCONCLUSIVE: `### Elimination Log` liet ke files/functions da kiem tra + ket qua binh thuong + ly do loai bo. Orchestrator doc log nay truoc khi spawn vong dieu tra tiep de truyen cho agent moi. **Phu thuoc:** B-TS2 (Evidence Format), SESSION file format. |

#### Differentiators (Loi the canh tranh)

| Feature | Gia tri | Do phuc tap | Ghi chu |
|---------|---------|-------------|---------|
| **B-D1: Continuation Agent** | Khi user tra loi CHECKPOINT, spawn agent moi tiep nhan context tu diem dung thay vi bat dau tu dau | HIGH | Claude Code ho tro resume subagent qua `SendMessage` tool voi agent ID. NHUNG sau khi session mat (conversation reset), agent ID khong con valid. Giai phap: luu TOAN BO context can thiet vao evidence file → agent moi doc evidence file de tiep tuc. Khong phu thuoc agent ID. Gia tri cot loi: tranh lap lai cong viec da lam. **Phu thuoc:** B-TS2, B-TS4, B-TS5 (evidence files la "bo nho" cua investigation). |
| **B-D2: Structured handoff giua agents** | Evidence file tu agent A la input chinh thuc cua agent B. Agent B khong can doc lai toan bo codebase | MEDIUM | Pipeline: Janitor -> evidence_janitor.md -> Detective reads it -> evidence_code.md -> Architect reads ALL evidence_*.md. Tiet kiem token vi moi agent chi doc evidence files (nho), khong doc source code toan bo (lon). **Phu thuoc:** B-TS2 (Evidence Format chuan). |
| **B-D3: Parallel Detective + DocSpecialist** | Code Detective va Doc Specialist chay song song vi KHONG phu thuoc nhau — ca 2 chi can evidence_janitor.md lam input | LOW | Spawn 2 background subagents. Detective (builder/sonnet) dung FastCode. DocSpec (scout/haiku) dung Context7. Ket qua tra ve orchestrator qua 2 file rieng biet. **Phu thuoc:** A-TS3 Heavy Lock (FastCode la heavy task, kiem tra lock truoc). |

#### Anti-Features (Khong nen lam)

| Feature | Ly do muon co | Ly do co van de | Thay the |
|---------|---------------|-----------------|----------|
| **B-AF1: Real-time agent communication** | Agents trao doi truc tiep trong khi dang chay de ho tro nhau | Subagent pattern KHONG ho tro — chi Agent Teams (experimental, khong stable) moi co mailbox/messaging. Phuc tap hoa khong can thiet vi debug workflow la pipeline tuan tu co 1 buoc parallel. | File-based handoff: moi agent ghi evidence file, orchestrator doc va quyet dinh buoc tiep. |
| **B-AF2: Auto-retry agent vo han** | Khi agent fail, tu dong retry khong gioi han cho den khi thanh cong | Tieu hao token vo ich. Agent fail thuong do THIEU THONG TIN tu user, khong phai random failure. Retry cung input -> cung ket qua fail. | Retry TOI DA 1 lan voi thong tin bo sung. Van fail -> INCONCLUSIVE + hoi user quyet dinh tiep. |
| **B-AF3: Agent voting/consensus** | Nhieu agent bo phieu de quyet dinh root cause | Over-engineering cho debug. Debug can BANG CHUNG, khong can DAN CHU. 3 agent vote "loi o file A" nhung khong co bang chung thi van sai. | 1 Architect doc TAT CA evidence files va ra phan quyet duy nhat dua tren bang chung cu the (file:dong). |

---

### Danh muc C: Project Memory & Regression Detection

#### Table Stakes (Nguoi dung ky vong co)

| Feature | Ly do ky vong | Do phuc tap | Ghi chu |
|---------|---------------|-------------|---------|
| **C-TS1: Knowledge Recall (luc lai bug cu)** | pd-bug-janitor.md da co buoc 2 "Tim kiem tu khoa trong .planning/bugs/" nhung chi la mo ta chung, chua co logic cu the | MEDIUM | Can chi tiet hoa: (1) Grep error message/keyword tu trieu chung moi trong `.planning/bugs/BUG_*.md`, (2) Trich xuat section "Phan tich nguyen nhan" + "Mo ta loi" tu bug cu khop, (3) Ghi vao `evidence_janitor.md` muc `## RELATED HISTORICAL BUGS` voi link + tom tat. **Phu thuoc:** pd-bug-janitor.md (cap nhat buoc 2), `.planning/bugs/` directory (da co tu v1.5 workflow). Module can: Grep tool (da co trong allowed-tools cua Janitor). |
| **C-TS2: Regression Alert** | Canh bao khi loi hien tai GIONG voi bug cu da sua — dau hieu regression | MEDIUM | So sanh 3 tieu chi: (1) file loi trung voi file tu BUG cu, (2) function name trung, (3) error message tuong tu (substring match). Neu >= 2 tieu chi khop -> hien canh bao: "Loi nay co the la regression cua BUG_[timestamp].md — nguyen nhan cu: [tom tat]". **Phu thuoc:** C-TS1 Knowledge Recall (phai tim duoc bug cu truoc). regression-analyzer.js (co the mo rong hoac tao utility moi). |
| **C-TS3: Double-Check (khong pha ban sua cu)** | Dam bao ban sua moi khong pha vo cac ban sua cu co lien quan — 1 trong nhung rui ro lon nhat khi fix bug | MEDIUM | Sau khi co fix plan (Architect output): doc `.planning/bugs/` co lien quan (tu C-TS1) -> xac dinh files da sua truoc do -> kiem tra files do co bi anh huong boi fix moi khong. **Phu thuoc:** C-TS1 (phai co data bug cu), pd-fix-architect.md (them buoc double-check vao process), regression-analyzer.js `analyzeFromSourceFiles()` (da co, co the tai su dung). |

#### Differentiators (Loi the canh tranh)

| Feature | Gia tri | Do phuc tap | Ghi chu |
|---------|---------|-------------|---------|
| **C-D1: Bug pattern INDEX file** | Tao `.planning/bugs/INDEX.md` tu dong liet ke tat ca bug theo file/function/keyword de tim kiem nhanh thay vi Grep toan bo thu muc | MEDIUM | Sinh tu dong moi khi BUG file duoc tao/cap nhat. Format: bang markdown voi cot [Bug ID, File, Function, Keyword, Trang thai]. Giup Janitor tim bug cu nhanh hon khi du an co 10+ bugs. Doi den v2.2+. |
| **C-D2: Persistent agent memory (cross-session)** | Agent nho duoc pattern tu cac session debug truoc, vd: "file auth.js thuong gay loi timeout" | HIGH | Claude Code native ho tro `memory: project` trong subagent frontmatter -> luu tai `.claude/agent-memory/<name>/MEMORY.md`. Nhung can thiet ke memory schema can than de khong phinh to vo han. Risk: memory cu tro thanh misleading khi codebase thay doi. Doi v2.2+. |

#### Anti-Features (Khong nen lam)

| Feature | Ly do muon co | Ly do co van de | Thay the |
|---------|---------------|-----------------|----------|
| **C-AF1: Database bug tracking** | Luu bug vao SQLite/JSON DB de query nhanh | Them dependency moi (sqlite3), pha vo pattern "No Build Step, pure Node.js" cua project. Markdown files la du cho quy mo 1 du an (100+ bugs). | Dung INDEX.md flat file + Grep. Performance du cho scale nay. |
| **C-AF2: AI-powered bug similarity scoring** | Dung embedding de so sanh do tuong tu giua bugs chinh xac hon keyword match | Can model rieng (embedding API), phuc tap, chi phi cao, accuracy khong dam bao tot hon keyword match cho structured BUG reports. | Keyword matching + file path matching la du. Bug reports da co cau truc chuan -> substring match hieu qua. |
| **C-AF3: Auto-fix tu lich su bug** | Tu dong ap dung cach sua cu khi gap bug tuong tu | Cuc ky nguy hiem — cung TRIEU CHUNG khong chac la cung NGUYEN NHAN. Risk tao bug moi hoac override fix dung. Vi pham principle "PHAI hinh thanh gia thuyet truoc khi sua". | Chi CANH BAO va GOI Y cach sua cu. KHONG tu dong sua. User va Architect quyet dinh. |

---

### Danh muc D: Workflow Execution Loop (5-step Orchestrator)

#### Table Stakes (Nguoi dung ky vong co)

| Feature | Ly do ky vong | Do phuc tap | Ghi chu |
|---------|---------------|-------------|---------|
| **D-TS1: Buoc 1 — Khoi dong (Janitor agent)** | Thu thap trieu chung + luc lai bug cu. Tuong ung Buoc 1 hien tai nhung uy quyen cho Janitor agent thay vi orchestrator tu lam | MEDIUM | Spawn pd-bug-janitor (scout tier, haiku model). Input: $ARGUMENTS hoac user input. Output: `.planning/debug/evidence_janitor.md`. Janitor PHAI kiem tra session cu (Resume UI) truoc khi thu thap moi. **Phu thuoc:** B-TS1 Resume UI, C-TS1 Knowledge Recall, pd-bug-janitor.md config. |
| **D-TS2: Buoc 2 — Phan viec (Detective + DocSpec song song)** | Spawn Code Detective va Doc Specialist dong thoi vi ca 2 chi can evidence_janitor.md lam input | MEDIUM | 2 background subagents. Detective (builder/sonnet) dung FastCode tim file/dong loi. DocSpec (scout/haiku) dung Context7 tra Breaking Changes/Known Issues. Ca 2 doc evidence_janitor.md. Output: `evidence_code.md` + `evidence_docs.md`. **Phu thuoc:** D-TS1 hoan tat, A-TS3 Heavy Lock (FastCode indexing), B-TS2 Evidence Format, B-D3 parallel spawning. |
| **D-TS3: Buoc 3 — Tai hien (Repro Engineer agent)** | Tao Red Test tu bang chung de chung minh loi ton tai TRUOC khi sua | MEDIUM | Spawn pd-repro-engineer (builder/sonnet). Input: evidence_janitor.md + evidence_code.md. Output: `evidence_repro.md` + test file tai `.planning/debug/repro/`. Tai su dung repro-test-generator.js da co tu v1.5. **Phu thuoc:** D-TS2 hoan tat (can biet file loi), repro-test-generator.js (da co). |
| **D-TS4: Buoc 4 — Phan quyet (Fix Architect agent)** | Tong hop TAT CA evidence -> xac dinh root cause -> thiet ke fix plan | MEDIUM | Spawn pd-fix-architect (architect/opus). Input: TAT CA evidence_*.md files. Output: `evidence_architect.md` voi 1 trong 3 outcomes (B-TS2). Them buoc Double-Check (C-TS3) truoc khi ra phan quyet. **Phu thuoc:** D-TS2+D-TS3 hoan tat, B-TS2 Evidence Format, C-TS3 Double-Check, B-TS3 (3 lua chon sau ROOT CAUSE). |
| **D-TS5: Buoc 5 — Ve dich (Fix + Verify + Commit)** | Sua code, chay test, commit [LOI] — orchestrator thuc hien truc tiep, KHONG spawn agent | LOW (tai su dung logic da co) | Tai su dung Buoc 8-10 cua workflow hien tai: sua code (8) + regression analysis (8a) + debug cleanup (9a) + security check (9a) + git commit (9b) + user confirm (10) + logic sync (10a). **Phu thuoc:** debug-cleanup.js, logic-sync.js, regression-analyzer.js — TAT CA da co tu v1.5. |

#### Differentiators (Loi the canh tranh)

| Feature | Gia tri | Do phuc tap | Ghi chu |
|---------|---------|-------------|---------|
| **D-D1: Loop-back thong minh** | Khi INCONCLUSIVE o Buoc 4, tu dong quay lai Buoc 2 voi thong tin moi tu user THAY VI bat dau lai tu Buoc 1 (Janitor da lam xong) | MEDIUM | Tracking "investigation round" trong SESSION. Moi round: agent nhan them Elimination Log tu round truoc + thong tin moi tu user. Prevent infinite loop: max 3 rounds. Sau round 3 -> bat buoc hoi user: "3 vong dieu tra chua tim ra. Tiep tuc/Dung/Bo sung thong tin?". **Phu thuoc:** B-TS5 Elimination Log (de agent moi biet gi da kiem tra). |
| **D-D2: Backward-compatible single-agent mode** | User co the chon chay single-agent (nhu v1.5 cu) hoac multi-agent tuy preference | LOW | Logic don gian: kiem tra `commands/pd/agents/` co ton tai khong. Neu khong co hoac user truyen flag `--single` -> chay workflow v1.5 nhu cu (khong spawn agent). Dam bao v1.5 users khong bi break khi update. |
| **D-D3: Progressive disclosure** | An chi tiet agent spawning/evidence phia sau. Chi hien ket qua cuoi cung: "Da tim nguyen nhan: [tom tat]. Sua ngay? Len ke hoach? Tu sua?" | LOW | Subagent chay background mac dinh. Orchestrator chi in summary tu evidence_architect.md. Chi tiet nam trong `.planning/debug/evidence_*.md` cho ai muon doc. Giam cognitive load cho user. |

#### Anti-Features (Khong nen lam)

| Feature | Ly do muon co | Ly do co van de | Thay the |
|---------|---------------|-----------------|----------|
| **D-AF1: Toan bo workflow trong JS module** | Viet orchestrator bang Node.js thay vi workflow markdown | Pha vo pattern cot loi cua project: workflow = markdown doc, module = pure JS function. Workflow markdown la "executable specification" ma AI doc va thuc hien truc tiep. Chuyen sang JS mat tinh linh hoat cua natural language instructions. | Giu orchestration logic trong fix-bug.md. JS modules chi cho pure functions (repro-test, regression-analyzer, debug-cleanup, logic-sync). |
| **D-AF2: Real-time progress bar** | Hien thi tien trinh cua tung agent khi dang chay | Claude Code khong co API cho custom UI rendering trong terminal. Subagent output chi co the doc khi HOAN TAT. Background subagent khong co cach report progress. | In message khi spawn: "[Dang chay: Code Detective...]". In khi xong: "[Hoan tat: Code Detective -> ROOT CAUSE FOUND]". Don gian, hieu qua. |
| **D-AF3: Auto-select investigation depth** | AI tu quyet dinh loi don gian (1 agent) hay phuc tap (5 agent) dua tren do kho | Risk over-engineering cho loi don gian (stack trace chi thang file:dong) hoac under-engineering cho loi phuc tap. AI chua du tot de tu danh gia do kho truoc khi dieu tra. | Mac dinh multi-agent. Loi hien nhien (error message chi thang file) co the skip Buoc 2-3 khi Janitor ghi nhan "Root cause hien nhien". Orchestrator quyet dinh, khong phai AI tu dong. |

---

## Feature Dependencies

```
[B-TS1: Resume UI]
    |
    v
[D-TS1: Janitor + C-TS1: Knowledge Recall]
    |
    v
[B-TS2: Evidence Format chuan]
    |
    +-------song song-------+
    |                        |
    v                        v
[D-TS2a: Code Detective]  [D-TS2b: Doc Specialist]
    |                        |
    +---A-TS3: Heavy Lock----+  (guard FastCode)
    |                        |
    +--------merge-----------+
    |
    v
[D-TS3: Repro Engineer]
    |
    v
[C-TS2: Regression Alert] --canh bao--> [D-TS4: Fix Architect]
    |
    v
[C-TS3: Double-Check] --xac nhan--> [D-TS4: Fix Architect]
    |
    v
[D-TS4: Fix Architect] --> evidence_architect.md
    |
    +--- ROOT CAUSE FOUND ---> [B-TS3: 3 lua chon]
    |       |
    |       +--- "Sua ngay" --> [D-TS5: Fix+Commit]
    |       |                       |
    |       |                       v
    |       |                  [debug-cleanup.js] (v1.5)
    |       |                  [logic-sync.js] (v1.5)
    |       |                  [regression-analyzer.js] (v1.5)
    |       |
    |       +--- "Len ke hoach" --> Tao PLAN.md (exit orchestrator)
    |       +--- "Tu sua" --> Ghi BUG report (exit orchestrator)
    |
    +--- CHECKPOINT ---------> [B-TS4: Hoi user]
    |                              |
    |                              v
    |                          [B-D1: Continuation Agent]
    |
    +--- INCONCLUSIVE -------> [B-TS5: Elimination Log]
                                   |
                                   v
                               [D-D1: Loop-back Buoc 2] (max 3 rounds)
```

```
[A-TS1: Tier-to-Model] --configures--> [moi agent spawning]

[A-TS4: Ha cap thong minh] --fallback--> [D-TS2 parallel fail -> sequential]

[D-D2: Backward-compat mode] --conflicts-- [toan bo multi-agent features]
    (chi 1 trong 2 active tai 1 thoi diem)
```

### Ghi chu Dependency

- **B-TS2 Evidence Format PHAI co truoc D-TS1-5 Workflow Loop:** Neu khong chuan hoa output, orchestrator khong the tu dong phan loai ket qua agent (ROOT CAUSE vs CHECKPOINT vs INCONCLUSIVE)
- **C-TS1 Knowledge Recall PHAI co truoc C-TS2 Regression Alert:** Alert can data tu recall de so sanh
- **A-TS3 Heavy Lock PHAI co truoc D-TS2 parallel spawning:** Tranh 2 FastCode indexing cung luc crash system
- **B-TS1 Resume UI can cap nhat truoc khi thay doi Buoc 1:** Vi Buoc 1 cua loop moi la diem vao cua toan bo workflow
- **A-TS1 Tier-to-Model KHONG phu thuoc gi:** Chi la config update, lam bat ky luc nao (nen lam dau tien)
- **D-D2 Backward-compat mode CONFLICTS voi multi-agent:** Khi single-agent active, skip TOAN BO orchestration, chay v1.5 workflow cu
- **D-TS5 Fix+Commit TAI SU DUNG v1.5 modules:** debug-cleanup.js, logic-sync.js, regression-analyzer.js — KHONG can viet moi

---

## MVP Definition

### Launch v2.1 (Minimum Viable Orchestrator)

Features THIET YEU de orchestrator hoat dong — thieu bat ky feature nao = orchestrator khong the chay:

- [ ] **A-TS1: Tier-to-Model mapping** — config co san, chi update frontmatter, lam dau tien
- [ ] **B-TS2: Evidence Format chuan 3 outcomes** — nen tang cua moi orchestration logic
- [ ] **B-TS1: Resume UI danh so** — UX thiet yeu cho Buoc 1 cua workflow
- [ ] **B-TS3: ROOT CAUSE -> 3 lua chon** — output chinh cua orchestrator
- [ ] **B-TS4: CHECKPOINT -> hoi user** — bat buoc cho workflow co tuong tac
- [ ] **C-TS1: Knowledge Recall trong Janitor** — gia tri lon, chi tiet hoa buoc da co
- [ ] **A-TS3: Heavy Lock cho FastCode** — an toan cho parallel spawning
- [ ] **D-TS1-5: Workflow Execution Loop 5 buoc** — core cua milestone
- [ ] **D-D2: Backward-compatible single-agent mode** — bao ve v1.5 user hien tai

### Them sau khi core on dinh (v2.1.x)

Features nang cao, them khi da co feedback thuc te:

- [ ] **B-D1: Continuation Agent** — khi user report mat context thuong xuyen
- [ ] **B-TS5: Elimination Log** — di kem voi loop-back
- [ ] **D-D1: Loop-back thong minh** — khi INCONCLUSIVE xay ra thuong xuyen
- [ ] **C-TS2: Regression Alert** — khi du an tich luy 5+ bug reports
- [ ] **C-TS3: Double-Check** — khi co case regression thuc te xay ra
- [ ] **A-TS4: Ha cap thong minh** — khi user bao loi tai nguyen
- [ ] **B-D2: Structured handoff** — toi uu token khi evidence files da chuan
- [ ] **D-D3: Progressive disclosure** — polish UX

### Doi den v2.2+ (Future)

- [ ] **C-D1: Bug pattern INDEX.md** — khi so luong bug > 10
- [ ] **C-D2: Persistent agent memory cross-session** — can kinh nghiem thuc te + memory schema design
- [ ] **A-D1: Auto-detect resource constraint** — phuc tap, loi ich thap
- [ ] **A-D2: Cost estimation** — nice-to-have, khong urgent

---

## Feature Prioritization Matrix

| Feature | Gia tri User | Chi phi Implement | Uu tien |
|---------|-------------|-------------------|---------|
| A-TS1: Tier-to-Model mapping | HIGH | LOW | **P1** |
| B-TS2: Evidence Format 3 outcomes | HIGH | LOW | **P1** |
| B-TS1: Resume UI danh so | HIGH | MEDIUM | **P1** |
| B-TS3: ROOT CAUSE 3 lua chon | HIGH | LOW | **P1** |
| B-TS4: CHECKPOINT hoi user | MEDIUM | LOW | **P1** |
| C-TS1: Knowledge Recall (Janitor) | HIGH | MEDIUM | **P1** |
| A-TS3: Heavy Lock | MEDIUM | MEDIUM | **P1** |
| D-TS1-5: Workflow Loop 5 buoc | HIGH | HIGH | **P1** |
| D-D2: Backward-compatible mode | HIGH | LOW | **P1** |
| B-D1: Continuation Agent | MEDIUM | HIGH | **P2** |
| B-TS5: Elimination Log | MEDIUM | MEDIUM | **P2** |
| D-D1: Loop-back thong minh | MEDIUM | MEDIUM | **P2** |
| C-TS2: Regression Alert | MEDIUM | MEDIUM | **P2** |
| C-TS3: Double-Check | MEDIUM | MEDIUM | **P2** |
| A-TS4: Ha cap thong minh | LOW | MEDIUM | **P2** |
| B-D2: Structured handoff | MEDIUM | MEDIUM | **P2** |
| D-D3: Progressive disclosure | LOW | LOW | **P2** |
| C-D1: Bug INDEX.md | LOW | MEDIUM | **P3** |
| C-D2: Persistent agent memory | LOW | HIGH | **P3** |
| A-D1: Auto-detect resource | LOW | HIGH | **P3** |
| A-D2: Cost estimation | LOW | MEDIUM | **P3** |

**Priority key:**
- P1: Bat buoc cho v2.1 launch — thieu thi orchestrator khong hoat dong duoc
- P2: Nen co, them khi core on dinh — tang chat luong va UX
- P3: Tuong lai, doi du lieu thuc te — optimization va polish

---

## Mapping toi Module/File hien co

| Feature moi | Module/File da co | Thay doi can thiet |
|-------------|-------------------|--------------------|
| A-TS1: Tier-to-Model | 5 file tai `commands/pd/agents/*.md` | Cap nhat `model:` field trong YAML frontmatter |
| B-TS2: Evidence Format | pd-code-detective.md, pd-fix-architect.md (co 1 phan) | Chuan hoa `<process>` section cho TAT CA 5 agents |
| B-TS1: Resume UI | `workflows/fix-bug.md` Buoc 1a | Viet lai hien thi tu text -> bang danh so |
| C-TS1: Knowledge Recall | pd-bug-janitor.md buoc 2 (da co) | Chi tiet hoa Grep pattern + output section format |
| A-TS3: Heavy Lock | Chua co | Them tracking logic trong workflow orchestration |
| C-TS2: Regression Alert | `bin/lib/regression-analyzer.js` | Mo rong hoac tao wrapper so sanh voi bug history |
| C-TS3: Double-Check | `bin/lib/regression-analyzer.js` (analyzeFromSourceFiles) | Tai su dung, truyen files tu bug cu |
| D-TS1-5: Workflow Loop | `workflows/fix-bug.md` | Them section orchestration moi (giua Buoc 1 va Buoc 6) |
| D-D2: Backward compat | `commands/pd/fix-bug.md` | Them check: co agents dir -> multi; khong -> single |
| B-D1: Continuation Agent | Chua co | Logic moi trong workflow + evidence file recovery |
| B-TS5: Elimination Log | SESSION file template | Them `### Elimination Log` section vao template |
| D-TS5: Fix+Commit | `bin/lib/debug-cleanup.js`, `bin/lib/logic-sync.js`, `bin/lib/regression-analyzer.js` | KHONG thay doi — tai su dung nguyen trang |

---

## Phan tich Competitor / Reference

| Feature | gsd:debug | Claude Code vanilla | Cursor Debug | Please-Done v2.1 |
|---------|-----------|--------------------|--------------|--------------------|
| Multi-agent orchestration | Khong (single) | Subagent co san nhung user tu setup | Khong (single + tab) | 5 specialized agents + orchestrator workflow |
| Resume session | Khong (mat context) | Khong native | Khong | Resume UI danh so + evidence file pipeline |
| Structured evidence | Informal (in-context) | Khong | Khong | 4 evidence files + 3 outcome protocol |
| Regression detection | Khong | Khong | Khong | Knowledge Recall + Regression Alert + Double-Check |
| Resource management | Khong | Khong | Internal | Tier mapping + Heavy Lock + Sequential fallback |
| Bug history/memory | Khong | Khong | Khong | .planning/bugs/ + Knowledge Recall |
| Checkpoint/Continue | Khong | Khong | Khong | CHECKPOINT protocol + Continuation Agent |
| File-based handoff | Khong (context window) | Subagent result only | Khong | evidence_*.md pipeline giua 5 agents |

**Insight chinh:** Khong co AI debugging tool nao hien co ket hop: multi-agent chuyên biet + evidence pipeline + checkpoint/continue + bug history recall trong 1 workflow thong nhat. Claude Code cung cap co so ha tang (subagent, background, model selection) nhung KHONG co pre-built debug orchestration. v2.1 la lop "workflow intelligence" tren nen tang Claude Code.

---

## Sources

- [Claude Code Subagent Documentation](https://code.claude.com/docs/en/sub-agents) — HIGH confidence, tai lieu chinh thuc Anthropic
- [Claude Code Agent Teams Documentation](https://code.claude.com/docs/en/agent-teams) — HIGH confidence, experimental feature docs
- [Multi-Agent Orchestration Patterns 2026](https://www.ai-agentsplus.com/blog/multi-agent-orchestration-patterns-2026) — MEDIUM confidence
- [The Multi-Agent Pattern That Actually Works in Production](https://www.chanl.ai/blog/multi-agent-orchestration-patterns-production-2026) — MEDIUM confidence
- [AI Agent State Checkpointing Guide](https://fast.io/resources/ai-agent-state-checkpointing/) — MEDIUM confidence
- [AgentRx Systematic Debugging Framework (Microsoft Research)](https://www.microsoft.com/en-us/research/blog/systematic-debugging-for-ai-agents-introducing-the-agentrx-framework/) — MEDIUM confidence
- [Beads: Git-Friendly Issue Tracker for AI Agents](https://betterstack.com/community/guides/ai/beads-issue-tracker-ai-agents/) — MEDIUM confidence
- [Azure AI Agent Design Patterns](https://learn.microsoft.com/en-us/azure/architecture/ai-ml/guide/ai-agent-design-patterns) — HIGH confidence
- [Claude Code Swarm Orchestration Skill (community)](https://gist.github.com/kieranklaassen/4f2aba89594a4aea4ad64d753984b2ea) — LOW confidence
- Existing codebase: `commands/pd/agents/`, `workflows/fix-bug.md`, `bin/lib/*.js`, `2.1_UPGRADE_DEBUG.md` — HIGH confidence (primary source)

---
*Feature research cho: v2.1 Detective Orchestrator (please-done)*
*Researched: 2026-03-24*
