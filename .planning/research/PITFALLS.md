# Domain Pitfalls

**Domain:** Tich hop OWASP Security Audit (`pd:audit`) vao he thong AI coding skill framework co san voi 13 security scanner agents, session-based evidence, wave-based parallel execution, va 5 platform converters
**Researched:** 2026-03-26
**Confidence:** HIGH (dua tren phan tich ma nguon hien tai cua 13 scanner agents + reporter, resource-config.js, parallel-dispatch.js, session-manager.js; ket hop nghien cuu OWASP false positive management, AI PoC pollution, incremental scanning edge cases)

## Critical Pitfalls

### Pitfall 1: False Positive Overload — 13 Scanners x Regex Pattern Matching = Alert Fatigue Huy Diet

**What goes wrong:**
He thong co 13 scanner agents, moi scanner dung Grep regex de tim pattern nguy hiem (vi du: `pd-sec-xss` grep `innerHTML`, `pd-sec-secrets` grep `password|secret|api_key`). Van de:
- Regex pattern matching co false positive rate 30-70% tuy loai (OWASP CRS research). Vi du: `const password = hashPassword(input)` match regex `password` nhung la code AN TOAN
- 13 scanners x trung binh 5-10 findings moi scanner = 65-130 findings. Neu 50% la false positive → 30-65 noise entries trong SECURITY_REPORT.md
- Reporter (`pd-sec-reporter.md`) tong hop TAT CA findings — khong co co che loc false positive. User nhan bao cao 200+ dong "phat hien" ma phan lon la nhieu
- Nghien cuu OWASP cho thay: "false positives take 32 minutes to investigate on average" va "approximately 50% of employees think they spend too much time on alerting issues"

Dac biet nguy hiem voi `pd-sec-secrets` scanner: grep `token|secret|api_key` se match moi cho dung tu "token" trong comments, variable names, va documentation. Du an Node.js thuong co hang tram match cho regex nay.

**Why it happens:**
Scanner agents hien tai dung Grep lam primary detection — day la taint-unaware pattern matching. Grep khong biet:
- Bien co duoc sanitize hay chua (khong co data flow analysis)
- Pattern nam trong code hay trong comment/string
- Bien co den tu user input hay tu internal source
Ket qua: moi match deu la "phat hien" bat ke context.

**Consequences:**
- User doc bao cao SECURITY_REPORT.md, thay 100+ findings, bo cuoc vi qua nhieu noise
- False positives lam mat tin tuong: "scanner bao SAI lan nay → co the SAI lan sau" → user bo qua CRITICAL that
- Fix phases tu dong tao tu findings (che do milestone) → tao phases sua loi khong ton tai → phung phi token va thoi gian
- Nham lan false positive voi true positive: user dismiss finding that la "noise" vi da quen voi false positives

**Prevention:**
1. **Moi scanner PHAI co secondary verification sau Grep.** Grep tim candidates, sau do Read ±15 dong de xac nhan context. Scanner da co buoc nay (buoc 4 trong pd-sec-xss.md: "doc context ±15 dong") nhung CHI voi CRITICAL/WARNING — phai ap dung cho TAT CA findings.
2. **Phan loai severity PHAI dua tren data flow, khong chi pattern match.**
   - Pattern trong comment/string → tu dong SKIP (khong bao cao)
   - Pattern co sanitize/escape gan do → SAFE (bao cao la "da xu ly")
   - Pattern nhan user input truc tiep → WARNING hoac CRITICAL
3. **Reporter PHAI co false positive filter.** Truoc khi tong hop:
   - Loai findings co `outcome: clean` hoac severity SAFE
   - Gom findings cung file:dong tu nhieu scanner → 1 entry (khong duplicate)
   - Hien thi tong findings vs findings sau loc: "130 ket qua tho → 23 can review"
4. **Configurable severity threshold:** `pd:audit --min-severity warning` de chi hien WARNING+ trong bao cao. Mac dinh: chi hien WARNING va CRITICAL (an SAFE patterns tu tong hop).
5. **Whitelist mechanism:** File `.pd-security-ignore` (giong `.eslintignore`) cho phep user danh dau false positive da review. Lan scan sau → skip entries da whitelist.

**Detection:**
- SECURITY_REPORT.md co >50 findings cho du an nho (<100 files) → qua nhieu noise
- >70% findings la SAFE → scanner quet qua rong
- User khong doc het bao cao (bao cao >300 dong) → alert fatigue
- Fix phases tu dong tao >10 phases tu 1 lan audit → nhieu phase khong co real vulnerability

**Phase to address:**
Phase dau tien (Scanner agents) — nhung logic false positive filter la phan cua Reporter agent. Ca hai can duoc thiet ke cung luc: scanner output format phai ho tro filtering, reporter phai implement filter.

---

### Pitfall 2: Scanner Token Consumption Bung No — 13 Agents x maxTurns x Grep Toan Bo Codebase

**What goes wrong:**
Hien tai `resource-config.js` chua co 13 security scanner agents trong AGENT_REGISTRY. Khi them vao:
- 13 scanners tier `scout` (maxTurns=15, model=haiku) = toi da 13 x 15 = 195 tool calls
- Moi scanner Glob + Grep TOAN BO codebase (vi du: `pd-sec-xss` grep `**/*.{jsx,tsx,vue,svelte,html,ejs,hbs,pug}`) → du an 500 files = 500 file reads potential
- PARALLEL_MAX = 4 nhung 13 scanners = 4 waves toi thieu → moi wave co 2-4 agents dong thoi Grep → I/O contention
- `pd-sec-vuln-deps` goi Bash (`npm audit`, `pip audit`) → ngoai troi gian (network call)
- `mcp__fastcode__code_qa` la heavy tool (HEAVY_TOOL_PATTERNS match) → scanners dung fastcode bi gioi han parallel

Token budget cho 1 lan `pd:audit` day du:
- 13 scanners x ~3000 tokens output moi scanner = 39,000 tokens evidence
- Reporter agent doc 13 evidence files + tong hop = ~15,000 tokens
- Tong: ~54,000+ tokens chi cho scanning, CHUA tinh fix phases

**Why it happens:**
Moi scanner duoc thiet ke doc lap — quet TOAN BO codebase cho loai loi cua no. Khong co shared scanning infrastructure:
- 13 scanners goi Glob tren cung cac file patterns → duplicate file discovery
- Cung 1 file bi Read 13 lan (1 lan moi scanner) → 13x redundant reads
- Khong co caching giua cac scanners

**Consequences:**
- `pd:audit` chay 5-15 phut tuy do lon codebase (vs `pd:plan` chay <30 giay)
- Token cost cao hon mong doi 5-10x → user bat ngo khi thay bill
- Rate limit risk: 4 agents dong thoi goi tools → API rate limit → DEGRADATION_CODES trigger → ha cap sang sequential → cham gap 4x
- User khong chay `pd:audit` thuong xuyen vi qua cham va dat → mat gia tri cua continuous security

**Prevention:**
1. **Smart Scanner Selection (da co trong active requirements).** Phan tich tech stack TRUOC khi dispatch:
   - Du an React/Next.js → KHONG chay `pd-sec-deserialization` (PHP/Java-focused), KHONG chay Solidity scanners
   - Du an khong co database → KHONG chay `pd-sec-sql-injection`
   - Giam tu 13 scanners xuong 5-8 scanners thuc su lien quan → giam 40-60% token
2. **Shared file discovery phase.** Truoc khi dispatch scanners:
   - 1 pre-scan step: Glob tat ca source files, phan loai theo type (frontend/backend/config/test)
   - Truyen danh sach files qua prompt cho moi scanner → scanner KHONG tu Glob
   - Tiet kiem 13 x Glob calls = 12 redundant Glob calls
3. **Batch execution waves (da co trong active requirements: toi da 2 instance song song).**
   - Wave 1: scanners nhe (secrets, misconfig, logging) — it Read, nhanh
   - Wave 2: scanners nang (sql-injection, xss, auth) — nhieu Read, can context
   - Wave 3: scanners phu thuoc (insecure-design, vuln-deps) — can ket qua wave 1-2
   - Reporter chay cuoi cung, sau tat ca waves
4. **maxTurns budget per scanner type:**
   - Simple scanners (secrets, logging): maxTurns=10
   - Complex scanners (auth, design): maxTurns=20
   - Khong dung chung maxTurns=15 cho tat ca
5. **Dry-run mode:** `pd:audit --dry-run` chi hien danh sach scanners se chay + estimated files se quet → user quyet dinh truoc khi tieu token.

**Detection:**
- `pd:audit` chay >10 phut cho du an <200 files → token waste
- >50% scanners tra ve `outcome: clean` → scanner khong can thiet da chay
- Rate limit errors trong log → qua nhieu parallel tool calls
- User chi chay `pd:audit` 1 lan roi khong chay lai → qua dat/cham

**Phase to address:**
Phase Smart Scanner Selection — PHAI implement truoc khi dispatch 13 scanners. Day la optimization co ban, khong phai nice-to-have.

---

### Pitfall 3: Session Delta Edge Cases — File Renames, Partial Fixes, va Git History Khong Tuyen Tinh

**What goes wrong:**
Session Delta (KNOWN-UNFIXED / RE-VERIFY / NEW) doi soat ket qua scan moi voi scan cu. Nhung:
- **File rename:** `src/auth.js` → `src/authentication.js`. Finding cu tro den `src/auth.js:42` — file khong con ton tai. Delta logic bao "KNOWN-UNFIXED duoc fix" (vi file cu mat) + "NEW finding" (vi file moi chua tung scan) → THUC TE la cung 1 loi, chi doi ten file
- **Partial fix:** User sua 1 trong 3 SQL injection trong cung file. Delta phai biet finding nao da sua, finding nao con. Nhung neu delta chi compare file:dong thi dong so thay doi (vi code them/xoa dong) → tat ca findings trong file do bi re-number
- **Code move:** Function di chuyen tu file A sang file B → delta thay "fix" o A va "new" o B
- **Branch switching:** User switch branch giua 2 lan scan → findings thay doi khong phai do fix ma do branch khac nhau
- **Incremental scan accuracy decay:** Nghien cuu Checkmarx chi ra: "Incremental scans become less accurate over time" — findings tu scan cu co the KHONG con valid ngay ca khi file khong thay doi (vi dependency thay doi)

**Why it happens:**
Delta comparison dua tren file:dong (file path + line number) la BRITTLE identifier. Bat ky thao tac nao thay doi file path hoac line numbers (refactor, add imports, reformat code) deu lam delta sai. Day la van de co dien cua "unstable identifiers" trong diff-based systems.

**Consequences:**
- "KNOWN-UNFIXED" findings bi xoa vi file rename → loi bao mat bi "quen"
- "NEW" findings cho code da quet → user review lai code da review → mat thoi gian
- Partial fix bao cao "0 KNOWN-UNFIXED" nhung thuc te con 2/3 loi → false sense of security
- SECURITY_REPORT.md delta section khong dang tin cay → user bo qua delta, coi moi lan la full scan → mat gia tri cua delta

**Prevention:**
1. **Finding ID dua tren content hash, KHONG PHAI file:dong.**
   - Hash = `sha256(vulnerability_type + code_snippet_normalized + function_name)`
   - Code snippet normalized: strip whitespace, strip line numbers, giu logic
   - Vi du: SQL injection trong `db.query("SELECT * FROM " + input)` co cung hash bat ke file nao chua no
2. **Function-level anchoring thay vi line-level.**
   - Finding gan voi function name (`handleLogin`) thay vi dong so (`:42`)
   - File rename nhung function name giu nguyen → delta van match
   - Dung `mcp__fastcode__code_qa` de resolve function boundaries
3. **Git-aware delta (khi co git):**
   - Dung `git diff --name-status` de detect renames (`R100 auth.js authentication.js`)
   - Dung `git log --follow` de trace file history
   - Findings trong renamed files → tu dong RE-VERIFY (khong phai NEW)
4. **"Fuzzy matching" cho partial fixes:**
   - Khi file co findings cu va findings moi, match theo:
     1. Exact: cung content hash → KNOWN-UNFIXED
     2. Near: cung function + cung vulnerability type nhung code khac → RE-VERIFY
     3. None: khong match → NEW
   - Explicit category cho "findings trong renamed files" → MOVED (khong phai NEW)
5. **Full re-scan cadence:** Moi 5 delta scans → bat buoc 1 full scan de reset baseline. Tranh accuracy decay.

**Detection:**
- Delta bao cao nhieu "NEW" findings cho code khong moi (chi refactored/renamed)
- Delta bao cao "0 KNOWN-UNFIXED" sau 1 commit chi sua 1 file nhung co findings o 5 files
- So luong KNOWN-UNFIXED giam sau rename/refactor ma khong co fix commit
- User phan nan "scan cu bao 5 loi, scan moi bao 2 loi cu + 4 loi moi" khi chi sua 1 loi

**Phase to address:**
Phase Session Delta — thiet ke finding ID schema TRUOC KHI implement delta comparison. Day la data model decision, khong phai implementation detail. Sai o day = phai rewrite toan bo delta logic.

---

### Pitfall 4: POC Generation Safety — Tu Scanner Bao Mat Thanh Cong Cu Tan Cong

**What goes wrong:**
Feature `--poc` sinh Proof-of-Concept exploits cho findings. Rui ro:
- **POC hoat dong that:** Scanner tim SQL injection, POC sinh `'; DROP TABLE users; --` → neu POC duoc chay nham tren production DB → huy data
- **Gadget chain POC:** Ket hop nhieu loi nho thanh chuoi tan cong lon (vi du: XSS → session hijack → admin access → RCE). POC cho chain nay la FULL EXPLOIT co kha nang tan cong that
- **POC luu vao file:** `evidence_sec_*.md` chua POC code → file nay duoc commit vao git → POC leak ra public repo → attacker dung chinh POC cua du an de tan cong du an
- **AI-generated POC quality:** Nghien cuu GreyNoise Labs (2025) chi ra: "AI-generated PoCs that look legitimate at first glance but crumble under technical scrutiny are flooding public repositories" → POC co the khong chinh xac nhung TRONG nhu that → user tin va chay
- **LLM hallucinate POC:** Scanner agent co the sinh POC khong dung — exploit khong hoat dong nhung user tin vi "he thong sinh tu dong" → false sense of (in)security

**Why it happens:**
POC generation la dual-use technology: cung 1 exploit dung de verify vulnerability (defensive) va de tan cong (offensive). Trong context AI coding workflow, user mong doi POC "just works" nhung:
- Agent khong co sandboxed environment de test POC
- Agent khong phan biet production vs development environment
- Gadget chain analysis doi hoi hieu biet sau ve application state — LLM chi co static code

**Consequences:**
- POC chay nham tren production → data loss, service disruption
- POC commit vao public repo → weaponized against project
- False POC (khong hoat dong) → user nghi vulnerability khong co that → khong fix
- Gadget chain POC qua phuc tap → user khong hieu → khong verify → khong fix hoac fix sai

**Prevention:**
1. **POC KHONG BAO GIO chay tu dong.** Chi SINH code, KHONG THUC THI. Ghi ro trong evidence:
   ```
   ⚠️ POC CHI DE THAM KHAO — KHONG chay tren production
   ⚠️ Review va test trong sandbox truoc khi su dung
   ```
2. **POC severity gating:**
   - CRITICAL findings: sinh POC chi khi user explicit `--poc`
   - WARNING findings: KHONG sinh POC (chi mo ta vulnerability)
   - Gadget chain POC: chi sinh khi `--poc --chain` (double opt-in)
3. **POC redaction trong evidence files:**
   - Evidence ghi trong `.planning/sessions/` (da co .gitignore pattern)
   - Neu evidence commit vao git: POC section duoc redact `[POC REDACTED — chay pd:audit --poc de xem]`
   - `.gitignore` them: `**/evidence_sec_*.md` hoac `.planning/sessions/**/evidence_sec_*.md`
4. **POC validation markers:** Moi POC co:
   - `verified: true/false` — agent da verify POC hoat dong (qua reasoning, khong phai execution)
   - `confidence: high/medium/low` — do tin cay cua POC
   - `requires: [database_access, admin_session, ...]` — prerequisites de POC hoat dong
5. **Gadget chain analysis gioi han:**
   - Toi da 3 steps trong chain (A → B → C). Chain dai hon → qua phuc tap de LLM phan tich chinh xac
   - Moi step trong chain PHAI co finding rieng (khong suy doan step khong co evidence)
   - Chain confidence = MIN(step confidences) — chain yeu nhu mat xich yeu nhat

**Detection:**
- Evidence files chua executable exploit code (curl commands, SQL payloads) ma khong co warning
- POC sinh cho WARNING severity findings → qua aggressive
- Gadget chain co >3 steps → accuracy thap, can review
- POC confidence khong tuong quan voi finding severity → agent hallucinate POC

**Phase to address:**
Phase POC Pipeline — implement SAU khi scanner agents da on dinh (findings chinh xac). POC dua tren findings sai = POC sai. Thu tu: Scanners → Reporter → Session Delta → POC.

---

### Pitfall 5: Template Agent Dispatch Reliability — 13 Agents Spawn, 3 Agents Die Tham Lang

**What goes wrong:**
Dispatch 13 scanner agents qua Agent tool. Cac failure modes:
- **Silent failure:** Agent spawn nhung khong tra ve ket qua (timeout, crash). Reporter doc session dir, thieu evidence file, bao "Scanner chua chay" nhung thuc te da chay va fail
- **Partial output:** Agent viet nua evidence file roi die (context window het). Evidence file co YAML frontmatter nhung thieu `## Phat hien` section → Reporter parse fail
- **Wrong session dir:** Agent nhan session dir qua prompt nhung hallucinate path khac → evidence ghi vao sai cho → Reporter khong tim thay
- **Tool permission mismatch:** Agent config co `allowed-tools: [Read, Glob, Grep]` nhung runtime khong enforce → agent goi Write/Bash khi khong duoc phep
- **Race condition:** 2 scanners trong cung wave doc va ghi cung file (vi du: ca hai doc `package.json` → ok, nhung ca hai ghi vao cung evidence file → corrupt)

Precedent tu v2.1: `parallel-dispatch.js` da xu ly parallel failures voi `critical` flag — nhung chi cho 2 agents (Detective + DocSpec). 13 agents = complexity gap lon.

**Why it happens:**
Agent tool trong Claude Code khong co built-in health check. Khi agent spawn:
- Khong co heartbeat mechanism
- Khong co output validation hook
- Khong co automatic retry
- Khong co partial result recovery

Voi 13 agents, probability of at least 1 failure = 1 - (1-p)^13. Neu moi agent co 5% failure rate → 1 - 0.95^13 = 48.7% chance co it nhat 1 failure moi lan scan.

**Consequences:**
- SECURITY_REPORT.md ghi "Scanner hoan tat: 10/13" nhung khong ro 3 scanner nao fail va tai sao
- OWASP coverage gap: neu `pd-sec-auth` fail → A01 (Broken Access Control) khong duoc quet → bao cao noi "10/10 OWASP" nhung thuc te chi 9/10
- User khong biet ket qua khong day du → false sense of security
- Retry toan bo 13 scanners vi 1 scanner fail → phung phi 12 scanner da thanh cong

**Prevention:**
1. **Evidence file validation sau moi agent.** Pure function `validateScannerEvidence(content)`:
   - YAML frontmatter co `agent`, `outcome`, `timestamp`, `session`?
   - Co `## Tom tat` section?
   - Co `## Phat hien` section (hoac `## Ket qua` neu clean)?
   - outcome la 1 trong `vulnerabilities_found | clean | inconclusive`?
   - KHONG pass → ghi warning, danh dau scanner can re-run
2. **Per-scanner retry (khong retry toan bo).** Khi scanner fail:
   - Retry 1 lan voi cung config
   - Neu fail lai → danh dau `status: failed` trong session metadata
   - Reporter ghi ro: "pd-sec-auth: FAILED — A01 coverage gap"
3. **Critical scanner designation:**
   - Critical scanners (auth, injection, xss, secrets): fail → BLOCK report, bat buoc retry
   - Non-critical scanners (logging, design, misconfig): fail → WARNING trong report, tiep tuc
4. **Wave completion gates:**
   - Wave N+1 chi bat dau khi Wave N hoan tat (tat ca agents tra ve hoac timeout)
   - Timeout per wave: 120 giay (DEGRADATION_TIMEOUT_MS tu resource-config.js)
   - Agent timeout → `shouldDegrade()` logic tu resource-config.js de ha cap
5. **Session dir validation truoc dispatch:**
   - Truyen session dir la ABSOLUTE PATH trong prompt
   - Agent bat dau bang buoc 0: verify session dir ton tai (Read SESSION.md)
   - Neu khong ton tai → agent bao loi ngay, khong chay

**Detection:**
- Reporter bao "Scanner hoan tat: X/13" voi X < 13 → co scanner fail
- Evidence files co YAML frontmatter nhung section rong → partial failure
- Session dir co evidence files tu scanner khong lien quan → wrong session dir
- 2 evidence files co cung timestamp va cung findings → race condition

**Phase to address:**
Phase Batch Execution Waves — implement validation + retry logic TRUOC KHI chay 13 scanners that. Test voi 2-3 scanners truoc, sau do mo rong.

---

### Pitfall 6: Gadget Chain Analysis Accuracy — LLM Khong Phai Static Analyzer

**What goes wrong:**
Gadget chain analysis doi hoi:
- Hieu data flow xuyen qua nhieu files (input → controller → service → database)
- Hieu application state tai thoi diem runtime
- Hieu authentication/authorization context cua moi endpoint
- Ket noi nhieu vulnerabilities thanh chuoi khai thac

LLM lam viec tren TEXT, khong co:
- AST (Abstract Syntax Tree) — khong biet cau truc code chinh xac
- Call graph — khong biet function A goi function B goi function C
- Type information — khong biet variable la string hay object
- Runtime state — khong biet gia tri thuc cua bien

**Why it happens:**
Scanner agents dung Grep + Read — day la text search, khong phai program analysis. `mcp__fastcode__code_qa` co kha nang hieu code tot hon nhung van la text-based reasoning, khong phai formal analysis. Gadget chain doi hoi CHINH XAC — 1 mat xich sai = toan bo chain sai.

**Consequences:**
- Chain analysis bao "critical: XSS → session hijack → admin" nhung thuc te XSS bi framework auto-escape → chain khong hoat dong → false critical alarm
- Chain analysis BO SOT chain that vi khong trace duoc data flow qua 3+ files → false negative
- User fix chain theo thu tu sai vi chain analysis sai priority → fix costly, khong hieu qua
- Fix phases tu dong (milestone mode) dua tren chain sai → phases sai thu tu

**Prevention:**
1. **Gadget chain la ADVISORY, khong phai FINDING.** Hien thi rieng biet:
   ```
   ## Phat hien (verified) — X findings
   ## Chuoi tan cong tiem nang (can review) — Y chains
   ```
   User biet chain can human review, khong phai ground truth.
2. **Chain chi duoc tao tu verified findings.** Moi step trong chain PHAI co finding rieng tu scanner (khong suy doan). Chain = ket noi findings co san, KHONG PHAI tim findings moi.
3. **Chain confidence formula:**
   - Chain confidence = MIN(finding confidences) x chain_length_penalty
   - chain_length_penalty: 2 steps = 0.9, 3 steps = 0.7, 4+ steps = 0.5
   - Vi du: 2 CRITICAL findings (0.9 confidence) → chain = 0.9 x 0.9 = 0.81
4. **FastCode cho data flow verification:**
   - Sau khi chain duoc de xuat, dung `mcp__fastcode__code_qa` de verify:
     "Du lieu tu endpoint A co thuc su truyen den function B trong chain nay khong?"
   - FastCode bao "khong tim thay data flow" → chain bi downgrade
5. **Gioi han chain length:** Toi da 3 steps. Moi step them = accuracy giam 30%+. Chain 5 steps hau nhu luon sai.

**Detection:**
- Chain analysis de xuat chain nhung khong co data flow evidence → chain la guesswork
- Tat ca chains deu co confidence > 0.8 → khong co gradient, overconfident
- Chain co step dung framework feature (vi du: React auto-escape) nhung van bao "exploitable" → agent khong hieu framework
- Chain analysis mat >5 phut cho 1 chain → too complex for LLM

**Phase to address:**
Phase POC Pipeline (gadget chain la phan cua POC) — implement SAU khi individual scanners da on dinh. Chain dua tren findings, findings phai chinh xac truoc.

---

## Moderate Pitfalls

### Pitfall 7: YAML Config Complexity — security-rules.yaml Tro Thanh Maintenance Nightmare

**What goes wrong:**
Thiet ke co `security-rules.yaml` (1 template → 13 OWASP categories). Rui ro:
- YAML file lon (13 categories x N rules moi category = hang tram rules) → kho doc, kho sua
- YAML syntax sensitivity: 1 indent sai = toan bo config sai, khong co clear error message
- Rules phu thuoc vao nhau nhung YAML khong ho tro references giua sections
- Version control: thay doi 1 rule → diff kho doc vi YAML context
- Scanner agents doc rules tu YAML → YAML parse error → agent nhan rules rong → quet khong chinh xac

**Prevention:**
1. **Tach thanh nhieu files nho thay vi 1 file lon:**
   - `rules/owasp-a01-access-control.yaml`
   - `rules/owasp-a03-injection.yaml`
   - Moi file <100 dong → doc duoc, diff duoc
2. **YAML validation pure function:** `validateSecurityRules(yamlContent)` kiem tra:
   - Syntax hop le
   - Required fields ton tai (pattern, severity, owasp_category)
   - Severity la enum hop le
   - Pattern la valid regex
3. **Default rules built-in, YAML chi override.** Scanner agents co hardcoded default patterns (nhu hien tai trong .md files). YAML chi them/sua/tat rules cu the. Neu YAML sai → fallback ve defaults, KHONG fail.
4. **Schema validation:** Dung JSON Schema cho YAML (tools nhu ajv) de validate truoc khi scanner doc.

### Pitfall 8: Evidence File Sprawl — `.planning/sessions/` Bung No Sau 10 Lan Audit

**What goes wrong:**
Moi lan `pd:audit`:
- 13 evidence files (`evidence_sec_*.md`) x ~50-200 dong moi file = 650-2600 dong
- 1 SECURITY_REPORT.md = ~300-500 dong
- 1 SESSION.md metadata
- Tong: ~15-20 files, ~3000-5000 dong text

Sau 10 lan audit: 150-200 files, 30,000-50,000 dong evidence. Van de:
- Git repo phinh to (evidence la markdown nhung nhieu content)
- Session dir kho navigate
- Delta scan phai doc evidence cu → cham khi co nhieu sessions
- `.planning/` directory tro thanh bottleneck cho FastCode indexing

**Prevention:**
1. **Session cleanup policy:** Chi giu N sessions gan nhat (default N=3). Sessions cu → archive hoac xoa.
   - `pd:audit --keep-sessions 5` cho user muon giu nhieu hon
2. **Evidence compression:** Sau khi Reporter tong hop, evidence files co the duoc compress:
   - Giu SECURITY_REPORT.md (tong hop)
   - Giu SESSION.md (metadata + delta info)
   - Archive evidence_sec_*.md vao 1 file zip hoac xoa (da duoc tong hop trong report)
3. **Delta chi can SECURITY_REPORT.md cua session truoc, KHONG can evidence files cu.** Delta compare findings table, khong can raw evidence.
4. **`.gitignore` pattern:** Evidence files khong can commit. Chi commit SECURITY_REPORT.md.
   ```
   .planning/sessions/**/evidence_sec_*.md
   ```

### Pitfall 9: Integration Breaking Existing Workflows — pd:audit Lam Hong pd:plan va pd:complete-milestone

**What goes wrong:**
v4.0 them tich hop vao existing workflows:
- `complete-milestone`: them security gate (block completion neu co CRITICAL findings)
- `what-next`: them security priority (audit findings vao priority list)
- State machine: them security states

Rui ro:
- Security gate trong `complete-milestone` BLOCK milestone completion vi audit chua chay → user bi ket: "Chay audit truoc" nhung user khong muon/khong can audit cho milestone nay
- `what-next` de xuat "Fix security findings" nhung findings la false positives → user bi redirect sai
- State machine them states nhung existing session code (`session-manager.js`) khong biet den states moi → `SESSION_STATUSES` validation fail

**Prevention:**
1. **Security gate la OPT-IN, KHONG BAT BUOC.**
   - Mac dinh: `complete-milestone` KHONG check security
   - User bat: `complete-milestone --security-gate` hoac config trong `.planning/milestones/*/config.yaml`
   - Vi du: milestone "Payment Integration" → bat security gate. Milestone "UI Redesign" → khong can
2. **Feature flag pattern:** Toan bo v4.0 integration dung feature flags:
   ```javascript
   // Trong workflow
   if (config.securityGate) { checkSecurityFindings(); }
   ```
   Flags OFF mac dinh → existing workflows KHONG BI ANH HUONG cho den khi user bat.
3. **State machine backward compatibility:**
   - KHONG sua `SESSION_STATUSES` truc tiep. Them `SECURITY_SESSION_STATUSES` rieng
   - Security sessions dung `session-manager.js` voi extended statuses nhung fallback ve existing statuses khi can
   - Hoac: security sessions dung folder rieng (`.planning/security-sessions/` thay vi `.planning/sessions/`)
4. **Smoke test:** Sau khi them integration, chay tat ca existing workflows 1 lan:
   - `pd:plan` → van hoat dong nhu truoc
   - `pd:complete-milestone` → van hoat dong KHONG can audit
   - `pd:what-next` → van hoat dong voi va khong co security findings

### Pitfall 10: Reporter Agent Tong Hop Sai — "OWASP 10/10 Coverage" Nhung Thuc Te 7/10

**What goes wrong:**
Reporter (`pd-sec-reporter.md`) tong hop 13 evidence files thanh SECURITY_REPORT.md voi OWASP Top 10 Coverage table. Nhung:
- Scanner fail/skip → Reporter van ghi "0 phat hien" cho OWASP category do (thay vi "CHUA QUET")
- Smart Scanner Selection bo 5 scanners (khong lien quan tech stack) → Reporter ghi "0 phat hien" cho categories do → bao cao noi "10/10 OWASP" nhung 5 categories khong duoc quet
- 1 scanner cover 2+ OWASP categories (vi du: pd-sec-auth cover A01 + A07) → neu auth scanner fail, 2 categories bi anh huong nhung Reporter co the chi ghi 1

**Prevention:**
1. **Ba trang thai cho moi OWASP category: SCANNED (0 findings) / FINDINGS / NOT SCANNED**
   - SCANNED: scanner chay va tra ve `outcome: clean` → an toan
   - FINDINGS: scanner tim thay vulnerabilities → can action
   - NOT SCANNED: scanner khong chay (skip/fail) → coverage gap, ghi ro ly do
2. **Coverage % chinh xac:** `OWASP Coverage: 7/10 (3 categories not scanned: A04, A08, A09)`
   Khong bao gio hien 10/10 khi co categories NOT SCANNED.
3. **Scanner → OWASP mapping la metadata, KHONG PHAI hardcode trong reporter.**
   - Moi scanner agent co `owasp_categories: [A01, A07]` trong frontmatter
   - Reporter doc frontmatter de biet scanner nao cover categories nao
   - Them scanner moi → tu dong cap nhat coverage mapping

---

## Minor Pitfalls

### Pitfall 11: Tieng Viet Trong Evidence Files — Grep Pattern Match Voi Tieng Viet Co Dau

**What goes wrong:**
Scanner agents quet code va ghi evidence bang tieng Viet. Nhung:
- Evidence chua code snippets (tieng Anh) + mo ta (tieng Viet) → mixed encoding
- Delta comparison tren evidence chua tieng Viet co the bi encoding issues
- Grep patterns trong scanner agents la ASCII — match code nhung khong match tieng Viet comments

**Prevention:**
1. Code snippets giu nguyen tieng Anh, mo ta/nhan xet dung tieng Viet
2. Evidence file PHAI UTF-8 with BOM header de tranh encoding issues
3. Delta comparison chi compare structured fields (file, dong, severity, type) — KHONG compare free-text tieng Viet

### Pitfall 12: Converter Pipeline Cho 13 Scanner Agents — 5 Platforms x 13 Agents = 65 Files

**What goes wrong:**
13 scanner agent files + 1 reporter = 14 agent files can transpile sang 5 platforms. Nhung:
- Cac platform khac (Codex, Gemini, OpenCode, Copilot) co the KHONG ho tro Agent tool → scanner dispatch khong hoat dong
- Agent files dung MCP tools (fastcode) → platform khong co MCP → tools khong kha dung
- Snapshot tests can cap nhat: 14 files x 5 platforms = 70 snapshots moi (tren 48/68 hien tai)

**Prevention:**
1. **Scanner agents la Claude Code specific.** Cac platform khac: `pd:audit` cung cap checklist manual thay vi agent dispatch.
2. **Platform feature detection:** Converter kiem tra platform co Agent tool → co: transpile agent files. Khong: transpile `pd:audit` voi manual checklist mode.
3. **Snapshot tests them incremental:** Khong tao 70 snapshots cung luc. Them 2-3 scanner snapshots moi phase.

---

## Phase-Specific Warnings

| Phase Topic | Likely Pitfall | Mitigation |
|-------------|---------------|------------|
| Scanner agents (13 scanners) | False positive overload (#1), token explosion (#2) | Smart Scanner Selection, secondary verification, severity filtering |
| Reporter agent | Coverage sai (#10), tong hop findings duplicate | 3-state coverage, dedup findings by file:dong |
| Smart Scanner Selection | Chon sai scanners → miss vulnerability category | Mapping tech stack → OWASP categories phai explicit, khong dung LLM inference |
| Session Delta | File renames, partial fixes, line number drift (#3) | Content hash ID, function-level anchoring, git-aware delta |
| POC Pipeline | Safety concerns (#4), LLM accuracy for chains (#6) | POC chi sinh khong chay, chain toi da 3 steps, confidence decay |
| Gadget Chain Analysis | LLM khong co AST/call graph (#6) | Advisory label, verified findings only, FastCode verification |
| Batch Execution Waves | Agent silent failure (#5), rate limits | Per-scanner retry, critical scanner designation, wave completion gates |
| security-rules.yaml | Config complexity (#7), parse errors | Tach files nho, validation function, defaults fallback |
| Evidence storage | File sprawl (#8), git bloat | Session cleanup policy, .gitignore evidence files |
| Milestone integration | Breaking existing workflows (#9) | Feature flags, opt-in security gate, smoke tests |
| Fix phases tu dong | Dua tren findings sai → phases sai | Chi tao fix phase cho CRITICAL + verified findings |
| Converter pipeline | 13 agents x 5 platforms (#12) | Platform feature detection, manual checklist fallback |

## Integration Gotchas

| Tich hop | Loi thuong gap | Cach dung |
|----------|---------------|-----------|
| 13 Scanners + resource-config.js | AGENT_REGISTRY chua co 13 scanner entries → getAgentConfig() throw error | Them 13 entries vao AGENT_REGISTRY TRUOC khi dispatch |
| Scanner + parallel-dispatch.js | parallel-dispatch.js hien chi ho tro 2 agents (Detective + DocSpec) → khong scale len 13 | Tao `security-dispatch.js` moi hoac generalize parallel-dispatch |
| Reporter + session-manager.js | Reporter ghi SECURITY_REPORT.md nhung session-manager khong biet file nay | Them security report awareness vao session metadata |
| Session Delta + bug-memory.js | Bug memory track bugs, security findings la khac biet | KHONG reuse bug-memory cho security. Tao security-memory rieng hoac extend interface |
| pd:audit + complete-milestone | Security gate block milestone nhung user khong muon audit | Opt-in gate, khong bat buoc |
| pd:audit + what-next | Security findings vao priority list nhung findings co the la false positive | Chi inject CRITICAL findings vao what-next, khong inject WARNING |
| Scanner agents + context7-pipeline | Scanners KHONG can Context7 (quet code, khong tra cuu thu vien) | Khong them Context7 vao scanner tools — giu tools toi thieu |
| Fix phases + plan-checker | Fix phases tu dong phai pass plan-checker | Fix phase template PHAI tuyen thu plan-checker format (PLAN.md + TASKS.md) |
| Evidence files + research-store.js | Research store quan ly `.planning/research/`, security evidence o `.planning/sessions/` | HAI he thong luu tru KHAC NHAU — khong mix. Research store KHONG quan ly security evidence |

## "Looks Done But Isn't" Checklist

- [ ] **False positive rate:** Scanner chay va tra ve findings NHUNG >50% findings la false positive → user mat tin tuong, bo he thong
- [ ] **OWASP coverage:** Report ghi "10/10 OWASP" NHUNG co categories NOT SCANNED → bao cao sai coverage
- [ ] **Session delta accuracy:** Delta comparison hoat dong NHUNG file renames/partial fixes lam sai ket qua → delta khong dang tin cay
- [ ] **POC safety:** POC duoc sinh NHUNG khong co warning/redaction → POC leak ra git = weaponized
- [ ] **Agent reliability:** 13 agents chay NHUNG 2-3 fail tham lang → report thieu data, user khong biet
- [ ] **Token budget:** pd:audit chay NHUNG tieu 50K+ tokens moi lan → user khong chay lai, mat gia tri continuous security
- [ ] **Integration isolation:** Security features them vao NHUNG lam cham/hong existing pd:plan, pd:complete-milestone → regression
- [ ] **Evidence cleanup:** Evidence duoc tao NHUNG khong co mechanism xoa/archive → storage bloat
- [ ] **Gadget chain accuracy:** Chains duoc de xuat NHUNG dua tren text matching thay vi data flow → chains sai, fix priority sai
- [ ] **Config validation:** security-rules.yaml ton tai NHUNG khong co validation → 1 syntax error = toan bo rules sai
- [ ] **Fix phase quality:** Fix phases tu dong tao NHUNG dua tren false positive findings → phases khong co real vulnerability de fix
- [ ] **Converter coverage:** pd:audit skill ton tai NHUNG scanner agents khong transpile sang 4 platforms khac → feature gap

## Recovery Strategies

| Pitfall | Chi phi khoi phuc | Cach khoi phuc |
|---------|-------------------|----------------|
| False positive overload (#1) | THAP | Them severity filter trong reporter, whitelist mechanism |
| Token explosion (#2) | THAP | Them smart scanner selection, giam scanners theo tech stack |
| Session delta sai (#3) | CAO | Phai thay doi finding ID schema tu file:dong sang content hash — anh huong toan bo delta logic |
| POC safety (#4) | TRUNG BINH | Them warnings + redaction + .gitignore retroactively, nhung POC da commit can git history rewrite |
| Agent silent failure (#5) | THAP | Them evidence validation + per-scanner retry |
| Gadget chain inaccuracy (#6) | THAP | Them "advisory" label, khong thay doi output format |
| YAML complexity (#7) | TRUNG BINH | Tach 1 file thanh nhieu files, update tat ca scanner references |
| Evidence sprawl (#8) | THAP | Them cleanup policy, chay 1 lan de xoa sessions cu |
| Integration regression (#9) | CAO | Phai rollback integration changes, re-test existing workflows |
| Reporter coverage sai (#10) | THAP | Them 3-state coverage logic, update report template |

## Pitfall-to-Phase Mapping

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| False positive (#1) | Scanner agents + Reporter | False positive rate <30% tren 3 du an test. Reporter co filter summary. |
| Token explosion (#2) | Smart Scanner Selection | pd:audit cho du an React chi chay 6-8 scanners (khong 13). Total tokens <30K. |
| Session delta (#3) | Session Delta | File rename + partial fix test cases pass. Finding ID la content hash. |
| POC safety (#4) | POC Pipeline | Evidence files co warning header. .gitignore cover evidence files. POC chi khi --poc. |
| Agent failure (#5) | Batch Execution Waves | validateScannerEvidence() co tests. Retry logic hoat dong. Critical scanner fail → block report. |
| Chain accuracy (#6) | POC Pipeline (gadget chain) | Chains label "advisory". Chain toi da 3 steps. Confidence decay applied. |
| YAML complexity (#7) | Scanner agents (config) | Moi YAML file <100 dong. validateSecurityRules() co tests. Default fallback hoat dong. |
| Evidence sprawl (#8) | Session management | Cleanup policy configurable. .gitignore pattern applied. Delta khong can evidence cu. |
| Integration regression (#9) | Milestone integration | pd:plan, pd:complete-milestone, pd:what-next smoke tests pass KHONG can audit. Feature flags OFF mac dinh. |
| Reporter coverage (#10) | Reporter agent | 3-state coverage (SCANNED/FINDINGS/NOT SCANNED). Coverage % chinh xac khi scanners skip. |
| Agent dispatch (#5) | Batch Execution Waves | 13 agents registered trong AGENT_REGISTRY. security-dispatch.js generalized tu parallel-dispatch.js. |
| Fix phases quality | Fix phases generation | Chi tao fix phases tu CRITICAL verified findings. Plan-checker validation pass. |

## Sources

- [OWASP CRS: False Positives and Tuning](https://coreruleset.org/docs/2-how-crs-works/2-3-false-positives-and-tuning/) — false positive rate va tuning strategies, MEDIUM confidence
- [Snyk: False Negatives and False Positives](https://learn.snyk.io/lesson/false-negatives-and-false-positives/) — developer trust erosion tu false positives, MEDIUM confidence
- [OWASP Top 10 2025 Key Changes](https://orca.security/resources/blog/owasp-top-10-2025-key-changes/) — OWASP categories update, HIGH confidence
- [CSA: Token Sprawl in the AI Era](https://cloudsecurityalliance.org/blog/2026/02/18/token-sprawl-in-the-age-of-ai) — token/credential management challenges, MEDIUM confidence
- [GreyNoise Labs: PoC Pollution Problem](https://www.labs.greynoise.io/grimoire/2025-07-30-ai-poc/) — AI-generated PoC accuracy va safety concerns, HIGH confidence
- [arxiv: PoCGen — Generating Proof-of-Concept Exploits](https://arxiv.org/pdf/2506.04962) — automated PoC generation methodology, MEDIUM confidence
- [GitLab: Incremental SAST Scanning](https://gitlab.com/gitlab-org/gitlab/-/issues/419734) — incremental scan edge cases, MEDIUM confidence
- [Checkmarx: SAST Scanner Incremental Analysis](https://docs.checkmarx.com/en/34965-324470-sast-scanner.html) — incremental scan accuracy decay, MEDIUM confidence
- [Snyk: SAST Benefits and Limitations](https://snyk.io/articles/application-security/static-application-security-testing/) — static analysis accuracy limitations, HIGH confidence
- Ma nguon hien tai: `commands/pd/agents/pd-sec-*.md` (13 scanner + 1 reporter), `bin/lib/resource-config.js`, `bin/lib/parallel-dispatch.js`, `bin/lib/session-manager.js`, `references/security-checklist.md` — PRIMARY source, HIGH confidence
- v3.0 PITFALLS.md (`.planning/research/PITFALLS.md` truoc) — precedent patterns cho evidence sprawl va agent reliability, HIGH confidence

---
*Pitfalls research cho: v4.0 OWASP Security Audit — them pd:audit command voi 13 scanner agents, session delta, POC pipeline, gadget chain analysis, va milestone integration*
*Researched: 2026-03-26*
