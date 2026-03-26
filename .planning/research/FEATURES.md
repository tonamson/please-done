# Feature Landscape: v4.0 OWASP Security Audit

**Domain:** Lenh `pd:audit` quet bao mat OWASP Top 10 tich hop vao AI coding skill framework
**Researched:** 2026-03-26
**Confidence:** HIGH (dua tren tai lieu OWASP chinh thuc + 13 scanner agents da tao + 4_AUDIT_MILESTONE.md chi tiet + research domain SAST/AI-powered scanning 2025-2026)

---

## Table Stakes

Nhung features ma nguoi dung KY VONG CO khi nghe "OWASP Security Audit command". Thieu bat ky feature nao = lenh audit khong dang dung.

### Danh muc A: Lenh pd:audit Core (Skill + Workflow)

| Feature | Ly do ky vong | Do phuc tap | Ghi chu |
|---------|---------------|-------------|---------|
| **A-TS1: Skill `commands/pd/audit.md`** | Diem vao duy nhat cho user — `pd:audit [path] [--full\|--only\|--poc\|--auto-fix]`. Khong co skill = khong co lenh | MEDIUM | Tao skill file voi argument parsing (path, --full, --only, --poc, --auto-fix). Model: sonnet. Allowed tools: Read, Write, Edit, Bash, Glob, Grep, SubAgent, mcp__fastcode__code_qa. Pattern giong cac skill da co (scan.md, plan.md). **Phu thuoc:** Khong. Doc lap, nhung can workflow de thuc thi. |
| **A-TS2: Workflow `workflows/audit.md`** | Quy trinh thuc thi 9 buoc: detect context -> session delta -> scope -> smart selection -> dispatch scanners -> reporter -> analyze -> fix phases -> save. Khong co workflow = skill chi la shell rong | HIGH | 9 buoc workflow nhu mo ta trong 4_AUDIT_MILESTONE.md. Phuc tap nhat trong cac workflow da co vi ket hop: agent dispatch, wave execution, session management, va milestone integration. **Phu thuoc:** A-TS1 (skill goi workflow). |
| **A-TS3: 2 che do tu dong: Doc lap + Tich hop milestone** | User khong can chi dinh che do — he thong tu phat hien co `.planning/CURRENT_MILESTONE.md` hay khong. Doc lap quet toan bo, milestone quet git diff scope | MEDIUM | Doc lap: evidence -> `.security/evidence/`, report -> root `SECURITY_REPORT.md`. Milestone: evidence -> `.planning/milestones/[ver]/security/`, report -> `.planning/milestones/[ver]/SECURITY_REPORT.md`. **Phu thuoc:** A-TS2 workflow logic. |

### Danh muc B: Template Agent Dispatch (1 Template -> 13 Categories)

| Feature | Ly do ky vong | Do phuc tap | Ghi chu |
|---------|---------------|-------------|---------|
| **B-TS1: Template agent `pd-sec-scanner.md`** | 1 template thay vi 13 agent files rieng le. Nhan `--category` parameter, load rules tu YAML. DRY tu dau, de maintain | HIGH | Thay the 13 file pd-sec-*.md hien co (da tao nhung chua dung template pattern). Template co: discovery step (FastCode/grep), analysis step (AI), evidence write step. Cung input/output format cho moi category. **Phu thuoc:** B-TS2 (rules YAML). LUU Y: phai xoa hoac deprecate 13 agent files hien co. |
| **B-TS2: Config `config/security-rules.yaml`** | Tap trung rules cho 13 OWASP category — patterns (regex), severity mapping, common fixes, FastCode queries. Them/sua rule chi can update 1 file | MEDIUM | 13 sections trong 1 file YAML. Moi section: id, name, owasp_category, grep_patterns[], fastcode_query, severity_map, suggested_fixes[]. Tai su dung patterns tu 13 agent files da co (da co regex chi tiet). **Phu thuoc:** Khong. Doc lap. |
| **B-TS3: Reporter agent `pd-sec-reporter.md`** | Agent rieng biet (khong gop vao template) tong hop 13 evidence files thanh 1 SECURITY_REPORT.md voi OWASP mapping, severity ranking, hot spots, attack chains | MEDIUM | DA CO file `pd-sec-reporter.md` voi noi dung chi tiet. Can verify tuong thich voi template dispatch model moi (doc evidence theo convention moi). **Phu thuoc:** B-TS1 (evidence output format phai nhat quan). |
| **B-TS4: Dang ky agents trong resource-config.js** | 13 scanner agents + 1 reporter CHUA co trong AGENT_REGISTRY. Khong dang ky = workflow khong dispatch duoc | LOW | Them 14 entries vao AGENT_REGISTRY trong `bin/lib/resource-config.js`. Scanner: tier scout (nhe, nhanh). Reporter: tier builder. Tools: Read, Glob, Grep, mcp__fastcode__code_qa (scanner), Read, Write, Glob (reporter). **Phu thuoc:** resource-config.js (da co). |

### Danh muc C: Smart Scanner Selection

| Feature | Ly do ky vong | Do phuc tap | Ghi chu |
|---------|---------------|-------------|---------|
| **C-TS1: Context analysis engine** | Phan tich ngu canh du an (milestone phases, code patterns, git diff) de CHI CHON scanner lien quan. Chay scanner khong lien quan = lang phi token + khong tim thay gi | HIGH | 2 nguon tin hieu: (1) Milestone mode: ROADMAP.md phase title -> PLAN.md tasks -> git diff files. (2) Standalone: FastCode code_qa toan repo hoac grep patterns fallback. Output: danh sach category can chay. **Phu thuoc:** A-TS3 (biet mode nao), FastCode MCP (optional). |
| **C-TS2: Bang anh xa tin hieu -> scanner** | Mapping cu the: pattern X trong code -> kich hoat scanner Y. 3 scanner luon chay (secrets, crypto, vuln-deps), 10 scanner co dieu kien | LOW | Bang anh xa da co chi tiet trong 4_AUDIT_MILESTONE.md. 12 dong tin hieu -> scanner. Vi du: `multer\|formidable\|upload` -> path-traversal + cmd-injection + xss. Co the luu trong security-rules.yaml hoac JS module rieng. **Phu thuoc:** B-TS2 (rules config). |
| **C-TS3: Fallback logic** | Khi khong du tin hieu (< 2 matches) -> hoi user chay full. `--full` luon chay 13. `--only` chi chay user chi dinh + 3 base | LOW | 3 nhanh: (1) smart mode (default), (2) --full bypass selection, (3) --only user-specified + 3 base. Fallback khi < 2 tin hieu. **Phu thuoc:** C-TS1 (context analysis). |

### Danh muc D: Batch Execution Waves

| Feature | Ly do ky vong | Do phuc tap | Ghi chu |
|---------|---------------|-------------|---------|
| **D-TS1: Wave-based parallel dispatch** | Xep scanner vao waves theo dependency logic — category nen tang truoc, phu thuoc sau. Toi da 2 instance song song. Pattern tuong tu v1.0 Phase 8 wave-based execution | MEDIUM | 8 waves cho full mode (13 categories). Smart mode bo wave rong. Backpressure: doi ca 2 agent trong wave xong moi bat dau wave tiep. Tai su dung pattern tu `bin/lib/parallel-dispatch.js` (buildParallelPlan, mergeParallelResults). **Phu thuoc:** B-TS1 (template dispatch), resource-config.js (agent config). |
| **D-TS2: Failure isolation** | 1 scanner loi/timeout KHONG chan toan bo audit. Ghi nhan `inconclusive`, tiep tuc wave tiep. Reporter canh bao scanner thieu | LOW | Giong pattern da co: DocSpec critical=false trong parallel-dispatch.js. Scanner loi -> ghi warning, tiep tuc. Timeout: 120s scout, 180s builder. **Phu thuoc:** D-TS1 (wave system). |

### Danh muc E: Function-Level Evidence Checklist

| Feature | Ly do ky vong | Do phuc tap | Ghi chu |
|---------|---------------|-------------|---------|
| **E-TS1: Evidence format theo ham/endpoint** | Moi scanner PHAI xuat bang kiem tra TUNG HAM da kiem tra — khong duoc chi noi "da quet xong". Day la yeu cau cot loi de biet scanner co quet dung trong tam | MEDIUM | Format: bang voi cot File, Ham/Endpoint, Loai kiem tra, Ket qua (PASS/FLAG/FAIL), Ghi chu. Phai liet ke ca ham BI BO QUA va ly do. YAML frontmatter: agent, outcome, timestamp, session. **Phu thuoc:** B-TS1 (template agent output format). |
| **E-TS2: SECURITY_REPORT.md tong hop** | Reporter gop N evidence files thanh 1 bang master sap theo severity. OWASP coverage table 10/10. Hot spots analysis. Remediation plan P0/P1/P2 | MEDIUM | DA CO format chi tiet trong pd-sec-reporter.md. Them: Status column (NEW/KNOWN-UNFIXED/RE-VERIFIED/FIXED), cross-check voi CODE_REPORT milestone, gadget chain section. **Phu thuoc:** B-TS3 (reporter agent), E-TS1 (evidence input format). |

---

## Differentiators

Features tao LOI THE CANH TRANH. Khong bat buoc cho v4.0 core nhung tang gia tri dang ke. Moi feature co the defer ma khong anh huong core functionality.

### Danh muc F: Session Delta (Incremental Scanning)

| Feature | Gia tri | Do phuc tap | Ghi chu |
|---------|---------|-------------|---------|
| **F-D1: Doc va phan loai evidence cu** | Khong scan lai cai da biet — chi verify cai da fix. Tiet kiem token dang ke khi chay audit nhieu lan. Pattern tuong tu incremental SAST cua SonarQube, Snyk | HIGH | Buoc 0 trong pipeline moi scanner: doc evidence cu -> phan loai KNOWN-UNFIXED (skip scan) / RE-VERIFY (scan lai ham da fix) / NEW (scan moi). Tim evidence cu theo path convention (milestone vs standalone). **Phu thuoc:** E-TS1 (evidence format phai parse duoc). |
| **F-D2: Git diff scope cho RE-SCAN** | Ham da PASS nhung code doi (git diff) -> RE-SCAN. Ham da PASS va code khong doi -> SKIP giu ket qua cu. Toi uu token cho repo lon | MEDIUM | Can git integration: `git diff [base]..HEAD -- [file]`. Parse diff xac dinh ham nao bi sua. Ket hop voi F-D1 de quyet dinh SKIP vs RE-SCAN. **Phu thuoc:** F-D1 (session delta logic), git repo (optional — khong co git thi scan toan bo). |
| **F-D3: Audit history trong evidence** | Moi evidence file giu lich su phien o cuoi: Session N, ngay, ket qua, ghi chu. Giup track tien trinh fix loi qua thoi gian | LOW | Append-only table cuoi evidence file. Reporter tong hop status column (NEW/KNOWN-UNFIXED/RE-VERIFIED/FIXED). Pattern tuong tu AUDIT_LOG tu v3.0 research squad. **Phu thuoc:** F-D1 (doc evidence cu de biet lich su). |

### Danh muc G: POC / Gadget Chain Analysis

| Feature | Gia tri | Do phuc tap | Ghi chu |
|---------|---------|-------------|---------|
| **G-D1: POC don le (tung ham)** | Chung minh khai thac thuc su — khong chi bao "co loi". Voi moi FAIL/FLAG: input vector, payload mau, buoc tai hien (curl/script), ket qua du kien. Chi khi dung `--poc` | HIGH | Buoc 2.5a trong pipeline. AI phan tich ham da FLAG/FAIL -> tao payload + reproduction steps. Output: POC section trong evidence file. Token cost cao (AI phai hieu call chain + tao exploit), nen chi khi user yeu cau. **Phu thuoc:** E-TS1 (evidence co FAIL/FLAG findings de tao POC). |
| **G-D2: Gadget Chain POC (lien ket loi hong)** | Chain nhieu loi nho thanh chuoi tan cong — impact thuc te lon hon tong individual severity. Vi du: IDOR -> Secret Leak -> SQLi -> Data Breach. Day la ky thuat red team that su | VERY HIGH | Buoc 2.5b: thu thap TAT CA FAIL/FLAG tu MOI category (bao gom KNOWN-UNFIXED tu phien cu) -> phan tich lien ket (output A la input B?) -> chain diagram -> combined payload. Severity danh lai: chain impact > individual. **Phu thuoc:** G-D1 (POC don le lam input), F-D1 (KNOWN-UNFIXED giu cho chain). |

### Danh muc H: Tu dong tao Fix Phases (Che do Milestone)

| Feature | Gia tri | Do phuc tap | Ghi chu |
|---------|---------|-------------|---------|
| **H-D1: Fix phase generation theo gadget chain order** | Khi audit tim CRITICAL/WARNING trong milestone mode -> tu dong tao fix phases dang decimal (3.1, 3.2...). Sap xep theo nguoc gadget chain: fix RCE endpoint truoc, gadget source sau | HIGH | 7 muc uu tien: P0-RCE-Endpoint -> P0-Data-Breach -> P0-Auth-Bypass -> P1-Gadget-Source -> P1-Config-Hardening -> P2-Monitoring -> P2-Dependencies. Moi fix phase co frontmatter: phase, title, priority, owasp, related-evidence, gadget-chain-position. **Phu thuoc:** G-D2 (gadget chain analysis xac dinh thu tu), B-TS3 (reporter cung cap findings). |
| **H-D2: Template `security-fix-phase.md`** | Template chuan cho fix phases tu dong tao — bao gom evidence trich dan, huong sua de xuat, tieu chi thanh cong. Giong template plan nhung chuyên cho security fix | MEDIUM | Template co: Muc tieu (files + dong can sua), Tu Evidence (trich nguyen van), Huong sua de xuat (tu scanner suggested_fixes), Tieu chi thanh cong (re-audit PASS). **Phu thuoc:** H-D1 (fix phase generation logic). |
| **H-D3: Re-verify phase tu dong** | Phase cuoi cung luon la `[SEC-VERIFY]` — chay lai audit chi tren files da fix. Xac nhan fix thuc su khac phuc loi hong | MEDIUM | Tao 1 phase cuoi `Phase X.N — [SEC-VERIFY] Re-audit`. Logic: `pd:audit --only [categories da tim thay loi]` chi tren files da sua. Ket hop F-D1 session delta de chi RE-VERIFY. **Phu thuoc:** H-D1 (fix phases phai co truoc), F-D1 (session delta RE-VERIFY logic). |

### Danh muc I: Tich hop Ecosystem

| Feature | Gia tri | Do phuc tap | Ghi chu |
|---------|---------|-------------|---------|
| **I-D1: Security gate trong complete-milestone** | Them kiem tra: chua co SECURITY_REPORT.md -> yeu cau chay pd:audit truoc khi dong milestone. CRITICAL con -> CHAN. WARNING -> hoi user | MEDIUM | Cap nhat `workflows/complete-milestone.md`: them buoc glob `.planning/milestones/[version]/SECURITY_REPORT.md`. Khong co -> chan: "Chay /pd:audit truoc." Co + CRITICAL -> chan: "Con N loi CRITICAL." Co + chi WARNING -> hoi: "Fix/Accept." **Phu thuoc:** E-TS2 (SECURITY_REPORT.md ton tai). |
| **I-D2: Uu tien audit trong what-next** | Them priority 7.5: tat ca phases hoan tat + chua co SECURITY_REPORT -> goi y pd:audit truoc pd:complete-milestone | LOW | Cap nhat `workflows/what-next.md` bang uu tien. Glob kiem tra SECURITY_REPORT.md ton tai. **Phu thuoc:** Khong. Doc lap. |
| **I-D3: State machine update** | Them pd:audit vao luong trang thai — sau test, truoc complete-milestone. Nhanh phu: chay bat ky luc nao sau init | LOW | Cap nhat `references/state-machine.md`. Dieu kien tien quyet: CONTEXT.md (milestone mode) hoac khong can (standalone). **Phu thuoc:** Khong. Doc lap. |
| **I-D4: FastCode MCP tool-first integration** | Uu tien dung FastCode tree-sitter de discovery (list functions, endpoints) TRUOC KHI AI phan tich. Giam token dang ke — tool tim, AI chi phan tich ket qua | MEDIUM | Pipeline 5 buoc: discovery (FastCode/grep) -> analysis (AI) -> POC (optional) -> evidence (write). FastCode queries mau da co cho 12/13 categories (vuln-deps dung npm audit). Fallback grep khi FastCode khong co. **Phu thuoc:** B-TS1 (template co discovery step), mcp__fastcode__code_qa (optional). |

---

## Anti-Features

Features KHONG NEN LAM. Moi feature co ly do muon lam va ly do khong nen.

| Anti-Feature | Ly do muon co | Ly do co van de | Thay the |
|--------------|---------------|-----------------|----------|
| **AF-1: DAST (Dynamic Application Security Testing)** | Quet runtime, tim loi ma SAST khong thay (race conditions, timing attacks, actual HTTP responses) | Can chay server — khong phai moi du an co the start len duoc tu CLI. Them dependency (server runtime, database). Pham vi vuot xa AI coding tool — day la penetration testing tool. Token cost cuc cao | SAST-only voi AI analysis (da du cho code review scope). Ghi note trong report: "Nen bo sung DAST voi ZAP/Burp Suite cho production" |
| **AF-2: AST-based analysis thay vi regex** | Regex co false positives. AST (Abstract Syntax Tree) chinh xac hon vi hieu cau truc code thuc su | Them dependency nang (tree-sitter bindings, babel parser). Pha vo "No Build Step" constraint. FastCode MCP da cung cap tree-sitter analysis — dung MCP thay vi tu build AST parser. Regex + AI analysis du chinh xac cho scope nay | FastCode MCP code_qa cho deep analysis. Regex cho quick discovery. AI phan loai false positive trong Analysis step. 3 lop nay du chinh xac |
| **AF-3: CVE database lookup real-time** | Mapping loi hong voi CVE IDs cu the, cung cap CVSS scores chinh xac | Can external API (NVD, OSV). Network dependency lam audit khong chay offline. `npm audit` / `pip audit` da mapping CVE san — khong can lam lai | `pd-sec-vuln-deps` chay `npm audit --json` / `pip audit` — da co CVE mapping + severity. Voi cac category khac, ghi OWASP ID thay vi CVE (chinh xac hon cho code patterns) |
| **AF-4: Auto-fix code truc tiep (khong qua fix phase)** | Nhu GitHub Copilot Autofix / Aikido AutoFix — tu dong tao PR fix loi. Nhanh hon tao fix phase roi manual code | SAST re-scan passes vi pattern cu bien mat, khong vi code moi an toan. AI fix co the dung library function khong ton tai trong version dang chay. Fix khong qua test = nguy hiem. PROJECT.md ghi ro: "Code-level verification — plan checker only checks plan documents, not code" | Tao fix phases voi huong sua de xuat chi tiet (H-D1 + H-D2). Developer review + implement + test. An toan hon auto-fix |
| **AF-5: Blocking enforcement — audit bat buoc moi phase** | Bat buoc audit sau moi phase thay vi chi truoc complete-milestone | Qua nghiem ngat. Phase "update README" khong can security audit. Lam cham workflow cho 70% phases khong co security-relevant code. Precedent: CHECK-05 mac dinh WARN khong BLOCK | Audit la security gate CHI truoc complete-milestone (I-D1). User co the chay pd:audit bat ky luc nao (nhanh phu trong state machine I-D3). --full khi can toan dien |
| **AF-6: Giu 13 agent files rieng le** | Da co 13 file pd-sec-*.md voi noi dung chi tiet. Tai sao khong dung luon? | Maintain 13 files vs 1 template + 1 YAML config. Khi them scanner moi phai tao file moi. Khi sua format evidence phai sua 13 files. DRY principle bi vi pham. 4_AUDIT_MILESTONE.md da ghi ro: "Tao 13 file roi gop = lang phi cong suc" | Template `pd-sec-scanner.md` + `config/security-rules.yaml`. Chuyen regex/patterns tu 13 files hien co vao YAML. Xoa 13 files cu sau khi migrate |

---

## Feature Dependencies

```
[A-TS1: Skill audit.md] ──> [A-TS2: Workflow audit.md]
                                    |
                                    v
                [A-TS3: 2 che do (Doc lap + Milestone)]
                    |                   |
                    v                   v
[B-TS2: security-rules.yaml] ──> [B-TS1: Template pd-sec-scanner.md]
                                    |
                                    v
                        [B-TS4: Resource-config registry]
                                    |
                                    v
            [C-TS1: Smart Selection] + [C-TS2: Bang anh xa]
                        |
                        v
            [D-TS1: Wave-based dispatch] + [D-TS2: Failure isolation]
                        |
                        v
            [E-TS1: Function-Level Evidence] ──> [E-TS2: SECURITY_REPORT.md]
                        |                               |
                        v                               v
            [F-D1: Session Delta] ──> [F-D2: Git diff scope]
                        |
                        v
            [G-D1: POC don le] ──> [G-D2: Gadget Chain POC]
                                          |
                                          v
            [H-D1: Fix phase generation] ──> [H-D2: Template fix-phase]
                                          |
                                          v
                                [H-D3: Re-verify phase]

[I-D1: Security gate] <── [E-TS2: SECURITY_REPORT.md]
[I-D2: what-next priority] (doc lap)
[I-D3: State machine] (doc lap)
[I-D4: FastCode integration] <── [B-TS1: Template scanner]
```

### Ghi chu Dependency quan trong

- **B-TS2 (YAML config) PHAI co truoc B-TS1 (template):** Template load rules tu YAML — khong co YAML thi template khong biet quet gi.
- **B-TS4 (registry) PHAI co truoc D-TS1 (dispatch):** Workflow can getAgentConfig() de spawn agents.
- **E-TS1 (evidence format) PHAI co truoc F-D1 (session delta):** Delta doc lai evidence cu — format phai parse duoc.
- **G-D1 (POC don le) PHAI co truoc G-D2 (gadget chain):** Chain xay tren POC tung ham.
- **I-D1 (security gate) co the lam doc lap:** Chi can kiem tra SECURITY_REPORT.md ton tai.

---

## Mapping toi Module/File hien co

| Feature moi | Module/File da co | Thay doi can thiet |
|-------------|-------------------|--------------------|
| A-TS1: Skill audit | `commands/pd/scan.md` (pattern) | Tao `commands/pd/audit.md` moi |
| A-TS2: Workflow | `workflows/scan.md`, `workflows/research.md` (pattern) | Tao `workflows/audit.md` moi |
| B-TS1: Template scanner | 13 files `commands/pd/agents/pd-sec-*.md` (regex/patterns) | Tao 1 template moi, migrate patterns tu 13 files |
| B-TS2: Rules YAML | Khong co | Tao `config/security-rules.yaml` moi |
| B-TS3: Reporter | `commands/pd/agents/pd-sec-reporter.md` (DA CO) | Verify tuong thich voi template model |
| B-TS4: Registry | `bin/lib/resource-config.js` AGENT_REGISTRY | Them 14 entries (13 scanner + 1 reporter) |
| C-TS1: Smart selection | Khong co | Tao JS module moi `bin/lib/scanner-selector.js` |
| D-TS1: Wave dispatch | `bin/lib/parallel-dispatch.js` (pattern) | Mo rong hoac tao `bin/lib/security-dispatch.js` |
| E-TS1: Evidence format | `bin/lib/evidence-protocol.js` (v2.1 pattern) | Tai su dung validateEvidence, mo rong cho security format |
| F-D1: Session delta | `bin/lib/session-manager.js` (pattern) | Tao `bin/lib/security-session.js` hoac mo rong session-manager |
| H-D2: Fix template | `templates/management-report.md` (pattern) | Tao `templates/security-fix-phase.md` moi |
| I-D1: Security gate | `workflows/complete-milestone.md` (Buoc 2-3) | Them buoc kiem tra SECURITY_REPORT.md |
| I-D2: what-next | `workflows/what-next.md` (Buoc 4 bang uu tien) | Them priority 7.5 |

---

## MVP Recommendation

### v4.0 Launch (Minimum Viable Security Audit)

Uu tien theo thu tu implement — chia thanh 3 nhom:

**Nhom 1: Infrastructure (phases dau)**
1. **B-TS2: security-rules.yaml** — Nen tang rules, lam dau tien
2. **B-TS1: Template pd-sec-scanner.md** — 1 template thay 13 files
3. **B-TS4: Resource-config registry** — Dang ky agents
4. **E-TS1: Function-Level Evidence format** — Chuan output

**Nhom 2: Core Workflow (phases giua)**
5. **C-TS1 + C-TS2: Smart Scanner Selection** — Toi uu token
6. **D-TS1 + D-TS2: Wave-based dispatch** — Chay scanner
7. **A-TS1: Skill audit.md** — Diem vao user
8. **A-TS2: Workflow audit.md** — Quy trinh thuc thi
9. **A-TS3: 2 che do** — Doc lap + milestone
10. **E-TS2: SECURITY_REPORT.md** — Bao cao tong hop (reporter da co)
11. **I-D4: FastCode integration** — Tool-first discovery

**Nhom 3: Advanced Features (phases cuoi)**
12. **F-D1 + F-D2 + F-D3: Session Delta** — Incremental scanning
13. **G-D1: POC don le** — Chung minh khai thac (--poc)
14. **G-D2: Gadget Chain POC** — Lien ket loi hong
15. **H-D1 + H-D2 + H-D3: Fix phase generation** — Tu dong tao phases
16. **I-D1 + I-D2 + I-D3: Ecosystem integration** — Security gate + what-next + state machine

**Defer sang v4.1+ (neu v4.0 qua lon):**
- G-D2: Gadget Chain POC (VERY HIGH complexity, can POC don le stable truoc)
- H-D1: Fix phase generation (can gadget chain analysis)
- H-D3: Re-verify phase (can session delta + fix phases)

---

## Feature Prioritization Matrix

| Feature | Gia tri User | Chi phi Implement | Uu tien |
|---------|-------------|-------------------|---------|
| B-TS2: security-rules.yaml | HIGH | MEDIUM | **P0** |
| B-TS1: Template scanner | HIGH | HIGH | **P0** |
| B-TS4: Resource-config | HIGH | LOW | **P0** |
| E-TS1: Evidence format | HIGH | MEDIUM | **P0** |
| A-TS1: Skill audit | HIGH | MEDIUM | **P0** |
| A-TS2: Workflow audit | HIGH | HIGH | **P0** |
| A-TS3: 2 che do | HIGH | MEDIUM | **P0** |
| C-TS1+C-TS2: Smart selection | HIGH | HIGH | **P0** |
| D-TS1+D-TS2: Wave dispatch | HIGH | MEDIUM | **P0** |
| E-TS2: SECURITY_REPORT | HIGH | MEDIUM | **P0** |
| I-D4: FastCode integration | HIGH | MEDIUM | **P0** |
| F-D1+F-D2+F-D3: Session Delta | MEDIUM | HIGH | **P1** |
| G-D1: POC don le | MEDIUM | HIGH | **P1** |
| I-D1: Security gate | MEDIUM | MEDIUM | **P1** |
| I-D2: what-next priority | LOW | LOW | **P1** |
| I-D3: State machine | LOW | LOW | **P1** |
| G-D2: Gadget Chain POC | HIGH | VERY HIGH | **P2** |
| H-D1+H-D2: Fix phase gen | HIGH | HIGH | **P2** |
| H-D3: Re-verify phase | MEDIUM | MEDIUM | **P2** |

**Priority key:**
- P0: Bat buoc cho v4.0 launch — thieu thi pd:audit khong hoat dong
- P1: Nen co cho v4.0 — tang gia tri dang ke, co the lam song song voi P0
- P2: Co the defer sang v4.1 — can P0+P1 stable truoc

---

## Phan tich Competitive / Reference

| Feature | Semgrep | Snyk Code | OpenAI Aardvark | GitHub Copilot Autofix | Please-Done v4.0 |
|---------|---------|-----------|-----------------|----------------------|-------------------|
| OWASP Top 10 coverage | 10/10 (rules) | 10/10 (DeepCode AI) | Threat model based | Partial (SAST only) | 10/10 (13 categories) |
| Template-based dispatch | Config rules | Internal | Multi-stage pipeline | Internal | 1 template + YAML config |
| Smart scanner selection | Rule filtering | Auto-triage | Full repo threat model | PR-scoped | Context analysis (milestone/standalone) |
| Incremental scanning | Diff-aware | PR-scoped | Commit-level | PR-scoped | Session Delta (function-level) |
| POC generation | Khong | Khong | Vulnerability PoC | Khong | POC don le + Gadget Chain |
| Auto-fix generation | Khong | Fix suggestions | Fix suggestions | PR auto-fix | Fix phases (plan-level, khong code-level) |
| Function-level evidence | Finding-level | Finding-level | Finding-level | Finding-level | Function checklist (PASS/FLAG/FAIL per function) |
| Milestone integration | CI/CD | CI/CD | Repo-level | PR-level | Milestone workflow (fix phases + security gate) |

**Insight chinh:** Please-Done v4.0 khac biet o 3 diem:
1. **Function-Level Checklist** — khong chi liet ke findings ma liet ke TUNG HAM da kiem tra (bao gom PASS), giup biet chinh xac nhung gi DA quet va CHUA quet.
2. **Gadget Chain Analysis** — chain nhieu loi thanh exploit chuoi, giong red team thuc te. Cac SAST tool thuong chi bao tung loi rieng le.
3. **Milestone Integration** — tu dong tao fix phases theo gadget chain order, tich hop vao workflow planning hien co. Khong tool nao khac tao "plan to fix" — chi "suggestion to fix".

---

## Sources

- [OWASP Top 10:2021 — Official](https://owasp.org/Top10/2021/) — HIGH confidence, authoritative source
- [OpenAI Aardvark — Agentic Security Researcher](https://openai.com/index/introducing-aardvark/) — MEDIUM confidence, competitive reference
- [AI-Powered SAST Tools 2026 — Aikido](https://www.aikido.dev/blog/top-10-ai-powered-sast-tools-in-2025) — MEDIUM confidence, industry overview
- [Semgrep AI Agent Trends 2026](https://semgrep.dev/blog/2025/what-a-hackathon-reveals-about-ai-agent-trends-to-expect-2026/) — MEDIUM confidence, industry trends
- [GitLab SAST Documentation](https://docs.gitlab.com/user/application_security/sast/) — HIGH confidence, template-based scanning reference
- [PoCo: Agentic PoC Exploit Generation](https://arxiv.org/pdf/2511.02780) — HIGH confidence, academic paper on automated POC
- [AquilaX AI Auto-Remediation](https://aquilax.ai/blog/ai-auto-remediation-security-vulnerabilities) — MEDIUM confidence, auto-fix reference
- [SonarQube Incremental SAST](https://www.sonarsource.com/solutions/security/sast/) — HIGH confidence, incremental scanning reference
- Existing codebase: 13 `commands/pd/agents/pd-sec-*.md` files, `bin/lib/parallel-dispatch.js`, `bin/lib/resource-config.js`, `bin/lib/session-manager.js`, `bin/lib/evidence-protocol.js` — HIGH confidence (primary source)
- `4_AUDIT_MILESTONE.md` — HIGH confidence (project design document, primary source)

---
*Feature research cho: v4.0 OWASP Security Audit (please-done)*
*Researched: 2026-03-26*
