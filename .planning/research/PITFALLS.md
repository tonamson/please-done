# Domain Pitfalls

**Domain:** Tich hop Research Squad (anti-hallucination agents, structured storage, workflow guards) vao he thong AI coding skill framework co san voi 601 tests, 15 JS modules, 12 skills, 5 platform targets
**Researched:** 2026-03-25
**Confidence:** HIGH (dua tren phan tich ma nguon hien tai, tai lieu chinh thuc, nghien cuu hoc thuat 2025-2026 ve anti-hallucination va workflow guards)

## Critical Pitfalls

### Pitfall 1: Confidence Level La Ao Giac Cua Chinh He Thong Chong Ao Giac — "Quis Custodiet Ipsos Custodes"

**What goes wrong:**
Thiet ke v3.0 yeu cau moi bao cao co Confidence Level (HIGH/MEDIUM/LOW). Nhung nghien cuu ICLR 2026 va arxiv chi ra: LLM self-reported confidence KHONG tuong quan voi do chinh xac thuc te. Cu the:
- Model bao "HIGH confidence" nhung do chinh xac chi 24% tai nguong 90% confidence (nghien cuu Amazon QA-Calibration 2025)
- Khi hallucinate, model su dung ngon ngu tu tin hon 34% so voi khi tra loi dung (MIT research)
- RAG models bieu hien "severe overconfidence" khi evidence bi nhieu hoac mau thuan (arxiv 2601.07264)

Ap dung vao v3.0: Fact Checker agent danh gia "HIGH confidence" cho mot claim — nhung day la LLM tu danh gia LLM. Confidence level trong bao cao tro thanh "verified hallucination" — nguoi dung tin tuong hon nhung thong tin SAI hon.

**Why it happens:**
Confidence scoring la verbal estimation (LLM viet chu "HIGH"), KHONG phai statistical calibration (tinh xac suat tu nhieu lan chay). He thong v3.0 khong co co che calibration — chi dung prompt de yeu cau agent tu danh gia. Ket qua: confidence level phan anh "do tu tin cua model" (luon cao) thay vi "xac suat dung" (thuong thap hon nhieu).

**Consequences:**
- Nguoi dung tin vao bao cao "HIGH confidence" ma khong kiem tra — quyet dinh sai
- Plan-Gate cho pass ke hoach dua tren research co confidence cao nhung thuc te sai
- Audit log ghi "verified with HIGH confidence" — nhung khong co bang chung thuc su

**Prevention:**
1. **KHONG dung LLM self-assessment lam confidence level.** Thay vao do, dung rule-based scoring:
   - HIGH: Co URL source chinh thuc (docs, GitHub) + noi dung match voi source
   - MEDIUM: Co source nhung noi dung la interpretation, hoac nhieu source dong y
   - LOW: Khong co source, chi tu training data
2. **Confidence = so luong va chat luong source, KHONG PHAI cam nhan cua agent.** Pure function `scoreConfidence(sources)` dem so source, kiem tra URL reachable, phan loai source type.
3. **Bat buoc: Moi claim phai co `source:` field.** Claim khong co source → tu dong LOW confidence. Khong co ngoai le.
4. **Tach biet "agent confidence" va "evidence confidence."** Agent co the rat tu tin nhung evidence yeu → hien thi evidence confidence cho user, an agent confidence.

**Detection:**
- Bao cao co nhieu claim "HIGH confidence" nhung thieu URL source
- Fact Checker danh gia moi thu la HIGH — khong co gradient
- Confidence level giong nhau cho claim de (ten thu vien) va claim kho (best practice)

**Phase to address:**
Phase som nhat (Tieu chuan bao cao) — dinh nghia confidence scoring RULES truoc khi bat ky agent nao su dung. Day la nen tang cua toan bo he thong "Chong Ao Giac."

---

### Pitfall 2: Evidence Collector Hallucinate Chinh Evidence — "Fabricated Citations"

**What goes wrong:**
Evidence Collector agent duoc thiet ke de thu thap bang chung tu Context7, WebSearch, va codebase. Nhung LLM agents co xu huong:
- Tao URL khong ton tai nhung trong hop ly (vi du: `https://docs.nestjs.com/v12/guards` khi v12 chua co)
- Trich dan sai noi dung tu source — paraphrase thanh y nghia khac
- Mix thong tin tu nhieu source thanh 1 claim — khong source nao thuc su noi dieu do
- Bao "Context7 tra ve..." nhung thuc te khong goi Context7 (tool call hallucination)

Nghien cuu arxiv 2601.02574 (Fact-Checking with LLMs, 2026) xac nhan: "retrieval-augmented models can still hallucinate when evidence is noisy or conflicting."

**Why it happens:**
Agent prompt noi "thu thap evidence" nhung KHONG bat buoc dung tool. LLM co the "nho" thong tin tu training data va trinh bay nhu vua tim duoc. Dac biet khi WebSearch tra ve nhieu ket qua nhung khong ro rang, agent co xu huong "tom tat" bang cach them thong tin tu training data.

**Consequences:**
- Bao cao co citation nhung URL khong ton tai hoac noi dung khong khop
- Fact Checker verify claim dua tren evidence da bi hallucinate — "validating garbage with garbage"
- Nguoi dung audit bao cao, click link → 404 → mat tin tuong vao toan bo he thong

**Prevention:**
1. **Bat buoc: Evidence Collector CHI duoc bao cao thong tin co tool call tuong ung.** Pure function `validateEvidence(report)` kiem tra:
   - Moi claim co `source:` → source co tool_use tuong ung trong transcript
   - URL trong source phai match voi URL tu WebSearch/WebFetch result
   - Context7 claims phai co `libraryId` va `query` match voi tool call
2. **Tao audit log tu dong tu tool calls.** Moi lan Evidence Collector goi tool → ghi vao `audit_log.md`:
   ```
   | Tool | Input | Output Summary | Timestamp |
   ```
   Audit log la ground truth — claim khong co trong audit log = khong co evidence.
3. **"Source-or-skip" rule:** Agent KHONG DUOC viet claim khong co source. Thay vao do, ghi "KHONG TIM THAY thong tin ve [topic]" — day la gia tri, khong phai that bai.
4. **PostToolUse hook kiem tra evidence file sau moi lan ghi.** Script dem so claim, dem so source, bao warning neu ratio < 80%.

**Detection:**
- Evidence file co URL khong reachable (404, 403, domain khong ton tai)
- Claim noi "theo Context7" nhung transcript khong co context7 tool call
- Nhieu claim co cung 1 source nhung noi dung khac nhau hoan toan
- Evidence file dai nhung audit log ngan (nhieu claim khong co tool call tuong ung)

**Phase to address:**
Phase Evidence Collector agent — PHAI co audit log mechanism va validation TRUOC KHI Fact Checker su dung output.

---

### Pitfall 3: Fact Checker Khong Co Ground Truth — "Verify Against What?"

**What goes wrong:**
Fact Checker agent duoc thiet ke de kiem tra tinh chinh xac cua Evidence Collector. Nhung:
- Voi internal context (ma nguon du an), ground truth la codebase — Fact Checker co the Read file va kiem tra
- Voi external context (thu vien, API, best practices), ground truth la "the gioi ben ngoai" — Fact Checker CHI CO THE goi cung cac tool (Context7, WebSearch) ma Evidence Collector da dung
- Neu Evidence Collector hallucinate dua tren WebSearch result sai → Fact Checker goi WebSearch → nhan cung result sai → confirm hallucination

Day la "circular verification" — LLM A xac nhan output cua LLM B bang cung nguon thong tin. Nghien cuu arxiv cho thay: "LLM-as-judge review is circular when the judge uses the same knowledge base as the generator."

**Why it happens:**
External verification doi hoi ground truth doc lap. Nhung trong he thong CLI (khong co database, khong co curated knowledge base), tool calls la nguon duy nhat. 2 agent goi cung tool → nhan cung ket qua → verification la illusion.

**Consequences:**
- Bao cao ghi "Verified by Fact Checker" nhung thuc te chi la "repeated by Fact Checker"
- False sense of security — nguoi dung nghi bao cao da duoc kiem tra ky
- Audit log ghi "PASS" cho claim sai vi ca 2 agent dong y

**Prevention:**
1. **Phan biet ro: internal verification vs external verification.**
   - Internal (codebase): Fact Checker doc file truc tiep, kiem tra claim bang Grep/Read → HIEU QUA, HIGH confidence
   - External (thu vien, API): Fact Checker CHI xac nhan source TON TAI va REACHABLE, KHONG xac nhan NOI DUNG → MEDIUM confidence toi da
2. **KHONG goi he thong nay la "Fact Checker" cho external claims.** Goi la "Source Verifier" — nhiem vu la kiem tra source ton tai, khong phai kiem tra noi dung dung. Dieu nay thiet lap ky vong dung cho nguoi dung.
3. **Voi external claims: dung deterministic checks thay vi LLM judgment.**
   - URL reachable? (HTTP HEAD request)
   - Version number match? (regex extract tu page content)
   - Library name chinh xac? (Context7 resolve-library-id)
   - KHONG dung LLM de danh gia "noi dung nay co dung khong"
4. **Flag ro rang trong bao cao:** "External claims verified at SOURCE level only. Content accuracy requires human review."

**Detection:**
- Fact Checker bao "verified" cho external claim nhung chi goi WebSearch (khong co deterministic check)
- Moi claim deu PASS — khong co gradient (ca claim de va kho deu PASS)
- Fact Checker output giong het Evidence Collector output (copy thay vi verify)

**Phase to address:**
Phase Fact Checker agent — thiet ke verification protocol TRUOC KHI implement agent. Day la quyet dinh kien truc, khong phai chi tiet implementation.

---

### Pitfall 4: INDEX.md Tro Thanh Single Point of Failure — Stale Index, Lost Documents

**What goes wrong:**
Thiet ke v3.0 co INDEX.md lam catalog cho tat ca research documents trong `.planning/research/`. Nhung:
- Agent tao document moi nhung KHONG cap nhat INDEX.md → document "mat" (ton tai nhung khong tim duoc)
- 2 agent ghi INDEX.md dong thoi → race condition, 1 entry bi mat
- INDEX.md bi corrupt (sai format markdown table) → toan bo catalog khong doc duoc
- Document bi xoa/di chuyen nhung INDEX.md van tro den path cu → broken links

Nghien cuu Oracle (2026) ve AI agent memory: "Storage is where many implementations fail — extracted data gets written but index/metadata often end up scattered or lost entirely."

**Why it happens:**
INDEX.md la manual index — moi thao tac tao/xoa/di chuyen document can cap nhat index. Khong co foreign key constraint, khong co referential integrity. Day la van de co dien cua "index tach roi khoi data" trong file-based systems.

**Consequences:**
- `pd research` tim kiem → khong thay document vi INDEX.md thieu entry
- Nguoi dung tin khong co research nao ve topic X nhung thuc te co — chi la INDEX thieu
- Audit trail bi gay — khong the trace history day du

**Prevention:**
1. **INDEX.md la GENERATED, khong phai manually maintained.** Pure function `generateIndex(directory)`:
   - Scan `.planning/research/internal/` va `external/`
   - Doc YAML frontmatter tu moi `.md` file
   - Sinh INDEX.md tu ket qua scan
   - Goi SAU moi thao tac tao/xoa document
2. **Frontmatter la source of truth, INDEX la view.** Moi document co:
   ```yaml
   ---
   id: RES-001
   type: internal|external
   topic: [topic]
   created: [date]
   confidence: HIGH|MEDIUM|LOW
   ---
   ```
   INDEX.md duoc generate tu frontmatter — khong can cap nhat rieng.
3. **Validation pure function `validateIndex(indexContent, files[])`:** So sanh INDEX entries voi actual files. Bao warning neu:
   - File ton tai nhung thieu trong INDEX
   - INDEX entry tro den file khong ton tai
   - Frontmatter thieu required fields
4. **Git hook hoac workflow step:** Sau moi research command, chay `generateIndex()` va commit cung voi document moi.

**Detection:**
- So luong entries trong INDEX.md < so luong files trong directory
- INDEX.md co entries voi path khong ton tai
- `pd research` bao "khong co research nao" nhung directory co files

**Phase to address:**
Phase Cau truc luu tru — implement `generateIndex()` TRUOC KHI bat ky agent nao tao document. INDEX la infrastructure, khong phai feature.

---

### Pitfall 5: Workflow Guards Qua Chat — Plan-Gate Block Qua Nhieu, User Bo He Thong

**What goes wrong:**
Thiet ke v3.0 co 3 workflow guards: Plan-Gate, Mandatory Suggestion, Strategy Injection. Rui ro:
- Plan-Gate BLOCK ke hoach vi research thieu 1 field (vi du: thieu `confidence` cho 1 claim nho) → user phai chay lai toan bo research
- Mandatory Suggestion bat buoc doc research nhung research khong lien quan den task hien tai → mat thoi gian
- Strategy Injection chen research findings vao plan nhung context cua plan da qua dai → tang token, giam chat luong
- Tat ca guards chay moi lan plan → them 3-5 giay latency cho moi /pd:plan invocation

Nghien cuu Authority Partners (2026): "Common pitfalls with guardrails include overblocking and latency; judge bias/over-rejection and the need for calibration."

**Why it happens:**
Guards duoc thiet ke boi developer (hieu gia tri cua verification) nhung su dung boi user (muon ship nhanh). Tension giua "an toan" va "toc do" luon nghieng ve "an toan" khi thiet ke va "toc do" khi su dung. Ket qua: guards duoc thiet ke strict, user bo qua hoac tat.

**Consequences:**
- User tim cach bypass guards (xoa flag, sua file manually) → guards vo nghia
- Latency tang → user khong dung /pd:plan, viet plan manual → mat loi the cua he thong
- Guards block nhung truong hop hop le (false positive) → user mat tin tuong

**Prevention:**
1. **Plan-Gate la WARN, KHONG PHAI BLOCK (mac dinh).** Severity configurable:
   - `planGateSeverity: warn` (mac dinh) → hien warning, user quyet dinh tiep tuc hay khong
   - `planGateSeverity: block` → block chi khi user bat buoc trong project config
   - Giong nhu CHECK-05 (logicCoverage) da lam: mac dinh WARN, configurable len BLOCK
2. **Mandatory Suggestion chi goi y research LIEN QUAN.** Matching algorithm:
   - Extract keywords tu task/phase description
   - Tim research documents co matching keywords trong frontmatter `topic`
   - CHI goi y documents co relevance score > threshold
   - KHONG goi y "doc tat ca research" — day la spam
3. **Strategy Injection co budget token.** Toi da 500 tokens injected context. Neu research dai hon → summarize. Neu khong lien quan → khong inject.
4. **Latency guard: Tat ca guards phai chay < 2 giay.** Neu guard can doc nhieu files → lazy load, chi doc frontmatter (khong doc full content).

**Detection:**
- User bao "Plan-Gate block nhung plan cua toi dung" (false positive)
- Latency cua /pd:plan tang > 5 giay so voi truoc v3.0
- Mandatory Suggestion goi y research khong lien quan den task
- User bypass guards bang cach sua file truc tiep

**Phase to address:**
Phase Workflow Guards — implement voi mac dinh WARN. Test voi tat ca PLAN.md trong `.planning/milestones/` de do false positive rate TRUOC KHI release.

---

### Pitfall 6: Internal vs External Routing Sai — Codebase Question Gui Ra WebSearch, External Question Tim Trong Code

**What goes wrong:**
Lenh `pd research` auto-detect internal vs external context. Nhung LLM-based routing se:
- Hoi "NestJS guard pattern" → router phan loai la "external" vi co ten thu vien → nhung thuc te user hoi ve cach du an DANG dung guards → can internal research
- Hoi "Cau truc thu muc nao tot?" → router phan loai la "internal" vi noi ve du an → nhung user hoi best practice chung → can external research
- Hoi "So sanh Prisma va TypeORM" → external RO RANG → nhung sau do user hoi "du an dang dung cai nao?" → can switch sang internal GIUA CUOC
- Ambiguous queries nhu "cach test tot nhat" → 50/50 internal/external, router chon ngau nhien

**Why it happens:**
Natural language queries khong co metadata "internal" hay "external." LLM phai infer tu context — nhung inference nay khong chinh xac 100%. Dac biet voi tieng Viet, query thuong ngan va thieu context.

**Consequences:**
- Research sai loai → ket qua khong huu ich → user phai chay lai
- Evidence Collector goi WebSearch cho cau hoi ve codebase → hallucinate cau tra loi thay vi doc code
- Fact Checker kiem tra internal claim bang external source → false negative

**Prevention:**
1. **Khong dung LLM de route. Dung rule-based heuristics:**
   - Query co ten file, path, hoac function name cu the → INTERNAL
   - Query co ten thu vien/framework + "best practice/pattern/setup" → EXTERNAL
   - Query co "du an/project/cua minh/codebase" → INTERNAL
   - Mac dinh: hoi user "Ban hoi ve du an hay ve thu vien/ky thuat noi chung?"
2. **Cho phep user override:** `pd research --internal "cau hoi"` hoac `pd research --external "cau hoi"`. Auto-detect chi la convenience, khong phai bat buoc.
3. **Hybrid mode:** Voi cau hoi ambiguous, chay CA HAI internal va external, trinh bay ket qua phan biet:
   ```
   ## Trong du an hien tai (Internal)
   [findings]
   ## Best practices chung (External)
   [findings]
   ```
4. **Feedback loop:** Neu user bao "khong phai y toi" → ghi lai pattern de cai thien routing rules.

**Detection:**
- Evidence Collector goi WebSearch cho cau hoi ve code cu the cua du an
- Evidence Collector doc codebase cho cau hoi ve setup moi (chua co trong code)
- User phai chay `pd research` 2 lan vi lan dau routing sai

**Phase to address:**
Phase `pd research` command — implement routing logic voi flag override TRUOC KHI implement auto-detect. Auto-detect la optimization, flag la baseline.

---

## Moderate Pitfalls

### Pitfall 7: Converter Pipeline Khong Biet Den Research Files — 4 Platform Bi Thieu Feature

**What goes wrong:**
v3.0 them cau truc `.planning/research/` va lenh `pd research`. Nhung converter pipeline (`base.js`) chi transpile files trong `commands/pd/`. Neu `pd research` la skill moi:
- Converter phai biet transpile no sang 4 platforms
- Research agent files (Evidence Collector, Fact Checker) can transpile tuong tu detective agents trong v2.1
- Workflow guards la phan cua workflow files — converter da xu ly, nhung guard logic co the platform-specific
- 48 converter snapshots (hoac 68 sau v2.1) can cap nhat

**Prevention:**
1. **Them `pd-research.md` skill file vao converter pipeline cung luc voi implementation.**
2. **Research agents (neu la subagents) theo cung pattern voi detective agents tu v2.1** — converter da co precedent.
3. **Chay snapshot tests SAU MOI thay doi** — `npm test` phai cover tat ca files moi.
4. **Xem xet: Research features co the KHONG can transpile** neu chi dung tren Claude Code (MCP tools). Nhung skill file van phai ton tai cho tat ca platforms.

### Pitfall 8: Research Storage Phnh To Khong Kiem Soat — `.planning/research/` Tro Thanh Junkyard

**What goes wrong:**
Moi lan chay `pd research`, he thong tao files trong `.planning/research/`. Sau 50 lan chay:
- 50+ files markdown, nhieu cai outdated hoac duplicate
- INDEX.md dai 200+ dong, kho navigate
- Git history cua `.planning/` phinh to, lam cham git operations
- Context7/FastCode index `.planning/` → token budget bi chiem boi research cu

**Prevention:**
1. **Retention policy:** Research files co `expires:` field trong frontmatter. Pure function `cleanExpired()` xoa files qua han.
2. **Dedup check:** Truoc khi tao research moi, kiem tra INDEX.md co document cung topic va gần day (< 7 ngay) → hoi user "Da co research ve [topic] ngay [date]. Cap nhat hay tao moi?"
3. **Archive mechanism:** Research cu (> 30 ngay) di chuyen sang `.planning/research/archive/` — khong hien trong INDEX chinh nhung van searchable.
4. **`.gitignore` pattern:** Can nhac ignore `.planning/research/archive/` de giam git bloat.

### Pitfall 9: Audit Log Format Khong Tuong Thich Voi Plan Checker — 2 He Thong Verify Khong Noi Voi Nhau

**What goes wrong:**
Plan Checker (CHECK-01 → CHECK-05, ADV-01 → ADV-03) kiem tra PLAN.md/TASKS.md. v3.0 them Audit Log cho research reports. Nhung:
- Plan Checker dung frontmatter parsing (parseFrontmatter tu utils.js) → Audit Log co format khac → 2 parser
- Truths table (truths-parser.js) dung regex parse 3-col/5-col tables → Audit Log dung table format khac → khong reuse duoc
- Plan-Gate can doc CA plan checker results VA audit log → phai hieu 2 format

**Prevention:**
1. **Audit Log PHAI dung cung frontmatter format voi PLAN.md.** Reuse `parseFrontmatter()` tu `utils.js`.
2. **Audit entries dung Markdown table voi separator row chuan** — giong Truths table de truths-parser co the mo rong parse.
3. **Tao shared `parseAuditLog()` function trong `utils.js`** — khong tao file rieng. Giu so luong parsers toi thieu.
4. **Plan-Gate goi plan-checker VA audit validator qua 1 interface chung** — tra ve `{checks: [], passed: boolean}` format giong nhau.

### Pitfall 10: Research Agents Goi Context7 Qua Nhieu — Rate Limit va Token Waste

**What goes wrong:**
Evidence Collector goi Context7 cho moi claim can verify. Nhung:
- `resolve-library-id` va `query-docs` la 2 tool calls moi lan → 1 claim = 2 calls
- 10 claims = 20 Context7 calls → rate limit risk, 30+ giay latency
- Context7 tra ve documentation chunk lon (2000+ tokens) → context window day nhanh
- Cung 1 library duoc resolve nhieu lan vi agent khong cache

Da co precedent: v1.0 Phase 6 standardized Context7 pipeline (`context7-pipeline.md`) voi canonical flow: resolve → query → extract. v3.0 agents PHAI theo pipeline nay.

**Prevention:**
1. **Research agents tham chieu `@references/context7-pipeline.md`** — giong nhu write-code va plan da lam.
2. **Cache library IDs trong session.** Sau resolve-library-id, ghi vao file `context7-cache.md`:
   ```
   | Library | ID | Resolved |
   | nestjs | /nestjs/nest | 2026-03-25 |
   ```
   Agent kiem tra cache truoc khi resolve.
3. **Batch queries:** Thay vi 1 query/claim, gom claims cung library → 1 query voi multiple questions.
4. **maxTurns cho Evidence Collector** de gioi han tong so tool calls.

## Minor Pitfalls

### Pitfall 11: Tieng Viet Trong Frontmatter — Dau Tieng Viet Lam Hong Parser

**What goes wrong:**
Tat ca skill files va workflows dung tieng Viet. Frontmatter YAML voi gia tri tieng Viet co dau co the gay loi:
- `topic: "Cau truc du an"` → ok
- `topic: Cau truc du an` → YAML parser co the split sai tai dau phay
- `description: Kiem tra xem API co hoat dong khong?` → dau `?` co the gay loi YAML
- `confidence: Trung binh` thay vi `confidence: MEDIUM` → matching logic fail

**Prevention:**
1. **Frontmatter values LUON trong double quotes** neu chua tieng Viet hoac ky tu dac biet.
2. **Enum fields (confidence, type) dung tieng Anh:** HIGH/MEDIUM/LOW, internal/external. Chi free-text fields dung tieng Viet.
3. **Test parseFrontmatter() voi tieng Viet input** — them test cases voi dau, ky tu dac biet.

### Pitfall 12: Guard Logic Duplicate Voi Plan Checker — 2 Noi Kiem Tra Cung 1 Thu

**What goes wrong:**
Plan Checker da co 8 checks. Plan-Gate (v3.0) them layer kiem tra nua. Neu ca hai kiem tra "requirements coverage" → user thay 2 warning cho cung 1 van de → confusing. Hoac: Plan Checker bao PASS nhung Plan-Gate bao FAIL → contradictory.

**Prevention:**
1. **Plan-Gate goi Plan Checker, KHONG duplicate logic.** Plan-Gate = "chay plan-checker + kiem tra research exists." Logic kiem tra plan NAM TRONG plan-checker.
2. **Plan-Gate chi them checks MA PLAN CHECKER KHONG CO:** research coverage, confidence thresholds, source verification. Khong trung lap voi CHECK-01 → CHECK-05.
3. **Dung `plan-checker.js` nhu dependency** — goi `runChecks(planContent, tasksContent, options)` tu trong Plan-Gate.

---

## Phase-Specific Warnings

| Phase Topic | Likely Pitfall | Mitigation |
|-------------|---------------|------------|
| Cau truc luu tru (internal/external + INDEX) | INDEX.md stale, file ownership race condition | Generated INDEX, frontmatter la source of truth (#4) |
| Tieu chuan bao cao (Metadata, Evidence, Confidence) | Confidence level la LLM self-assessment, khong calibrated | Rule-based scoring, source count (#1) |
| Evidence Collector agent | Fabricated citations, tool call hallucination | Audit log tu tool calls, source-or-skip rule (#2) |
| Fact Checker agent | Circular verification, khong co ground truth cho external | Phan biet internal/external verification, deterministic checks (#3) |
| Plan-Gate guard | Overblocking, false positives, latency | Default WARN, test voi existing plans (#5) |
| Mandatory Suggestion guard | Spam irrelevant research, tang token | Keyword matching, relevance threshold (#5) |
| Strategy Injection guard | Context bloat, plan quality giam | 500 token budget, summarize (#5) |
| `pd research` command | Routing sai internal/external | Rule-based heuristics, flag override (#6) |
| Converter integration | Research skill/agents thieu tren 4 platforms | Them vao pipeline cung luc voi implementation (#7) |
| Research storage growth | File bloat, outdated research | Retention policy, dedup, archive (#8) |
| Audit log format | Khong tuong thich voi plan checker parsers | Reuse parseFrontmatter, shared interface (#9) |

## Integration Gotchas

| Tich hop | Loi thuong gap | Cach dung |
|----------|---------------|-----------|
| Evidence Collector + Context7 pipeline | Agent goi Context7 khong theo canonical flow | Agent PHAI tham chieu `@references/context7-pipeline.md` |
| Fact Checker + Plan Checker | 2 he thong verify khac format → khong compose duoc | Chung interface `{checks[], passed}`, reuse parsers |
| Plan-Gate + CHECK-01→05 | Duplicate checks → contradictory results | Plan-Gate goi plan-checker, chi them research-specific checks |
| Research documents + truths-parser | Audit table format khac Truths table → 2 parsers | Dung cung markdown table format, mo rong truths-parser |
| INDEX.md + session-manager | Session luu research refs nhung INDEX thay doi → stale refs | Session reference document ID (stable), khong reference path (co the thay doi) |
| v1.5 pure functions + v3.0 agents | Agent viet lai logic thay vi goi module | Research agents KHONG can goi v1.5 modules (khac voi detective agents). Nhung Plan-Gate/Guards PHAI goi plan-checker.js |
| Workflow guards + 5 platform converters | Guard logic trong workflow file → cac platform co the khong ho tro | Guards la phan cua workflow .md → converter da xu ly workflows. Nhung guard-specific references can kiem tra |

## "Looks Done But Isn't" Checklist

- [ ] **Confidence scoring:** Bao cao co confidence levels nhung KHONG co rule-based scoring function → levels la LLM guesswork
- [ ] **Evidence audit trail:** Evidence Collector ghi evidence nhung KHONG co audit log lien ket evidence voi tool calls → khong the verify
- [ ] **Fact Checker verification:** Fact Checker bao "verified" nhung chi goi cung tools nhu Evidence Collector → circular, khong phai verification
- [ ] **INDEX.md accuracy:** INDEX.md ton tai nhung so entries KHONG bang so files trong directory → stale index
- [ ] **Plan-Gate false positive rate:** Plan-Gate hoat dong nhung block >10% ke hoach hop le → overblocking, user se bypass
- [ ] **Internal/External routing:** `pd research` tra ve ket qua nhung routing sai loai → ket qua khong huu ich
- [ ] **Converter coverage:** Research skill ton tai nhung khong xuat hien trong output cua bat ky converter nao → 4 platforms thieu feature
- [ ] **Guard latency:** Guards hoat dong nhung /pd:plan cham hon 5 giay so voi truoc → user experience degraded
- [ ] **Research retention:** Research files duoc tao nhung khong co mechanism xoa/archive → storage bloat theo thoi gian
- [ ] **Parser compatibility:** Audit log duoc ghi nhung parseFrontmatter() khong parse duoc format moi → 2 parser tach biet, maintenance gap

## Recovery Strategies

| Pitfall | Chi phi khoi phuc | Cach khoi phuc |
|---------|-------------------|----------------|
| Confidence level khong calibrated | THAP | Them `scoreConfidence()` pure function, re-process existing reports |
| Evidence fabricated citations | TRUNG BINH | Them audit log, re-run Evidence Collector voi validation, kiem tra existing evidence |
| Circular verification | THAP | Rename "Fact Checker" thanh "Source Verifier", update verification protocol |
| INDEX.md stale | THAP | Implement `generateIndex()`, chay 1 lan de sync |
| Guards overblocking | THAP | Chuyen severity tu BLOCK sang WARN, add config option |
| Routing sai | THAP | Them `--internal/--external` flags, giu auto-detect nhu optional |
| Converter thieu research files | TRUNG BINH | Them vao converter config, generate snapshots, test all platforms |
| Research storage bloat | THAP | Implement retention policy, chay cleanup 1 lan |
| Parser incompatibility | TRUNG BINH | Refactor audit log format de reuse parseFrontmatter(), update tests |

## Pitfall-to-Phase Mapping

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| Confidence khong calibrated (#1) | Tieu chuan bao cao | `scoreConfidence()` pure function co tests, moi report co source count |
| Fabricated citations (#2) | Evidence Collector agent | Audit log ton tai, moi claim co tool call tuong ung |
| Circular verification (#3) | Fact Checker agent | Internal claims co file:line, external claims chi verified at source level |
| INDEX.md stale (#4) | Cau truc luu tru | `generateIndex()` output match actual files, validation pass |
| Guards overblocking (#5) | Workflow Guards | False positive rate < 5% tren existing plans, default severity = WARN |
| Routing sai (#6) | `pd research` command | `--internal/--external` flags hoat dong, auto-detect > 80% accuracy |
| Converter thieu (#7) | Moi phase co converter impact | Snapshot count tang tuong ung, tat ca platforms co research skill |
| Storage bloat (#8) | Cau truc luu tru | Retention policy configurable, archive mechanism hoat dong |
| Parser incompatibility (#9) | Tieu chuan bao cao | Audit log parsable boi `parseFrontmatter()`, shared interface |
| Context7 abuse (#10) | Evidence Collector agent | Agent follow context7-pipeline.md, cache library IDs |

## Sources

- [arxiv: The Confidence Dichotomy — Miscalibration in LLMs (ICLR 2025)](https://www.arxiv.org/pdf/2601.07264) — confidence scoring calibration problems, HIGH confidence
- [Amazon QA-Calibration (ICLR 2025)](https://assets.amazon.science/6d/70/c50b2eb141d3bcf1565e62b60211/qa-calibration-of-language-model-confidence-scores.pdf) — 90% threshold = 24% accuracy, HIGH confidence
- [arxiv: Fact-Checking with LLMs (2026)](https://www.arxiv.org/pdf/2601.02574) — RAG hallucination under noisy evidence, HIGH confidence
- [DEV.to: Stop AI Agent Hallucinations — 4 Essential Techniques](https://dev.to/aws/stop-ai-agent-hallucinations-4-essential-techniques-2i94) — tool-calling hallucinations scale with tool count, MEDIUM confidence
- [Authority Partners: AI Agent Guardrails Production Guide 2026](https://authoritypartners.com/insights/ai-agent-guardrails-production-guide-for-2026/) — overblocking, latency, judge bias, MEDIUM confidence
- [Oracle: File Systems vs Databases for AI Agent Memory](https://blogs.oracle.com/developers/comparing-file-systems-and-databases-for-effective-ai-agent-memory-management) — storage implementation failures, MEDIUM confidence
- [The New Stack: AI Agents on Markdown Files](https://thenewstack.io/skills-vs-mcp-agent-architecture/) — markdown as agent intelligence surface, MEDIUM confidence
- [MDPI: Mitigating LLM Hallucinations Using Multi-Agent Framework](https://www.mdpi.com/2078-2489/16/7/517) — multi-agent verification architecture, MEDIUM confidence
- [arxiv: Dunning-Kruger Effect in LLMs (2026)](https://arxiv.org/html/2603.09985v1) — models more confident when wrong, MEDIUM confidence
- Ma nguon hien tai: `bin/lib/plan-checker.js`, `bin/lib/truths-parser.js`, `bin/lib/utils.js`, `commands/pd/agents/`, `commands/pd/plan.md`, `commands/pd/write-code.md` — PRIMARY source, HIGH confidence
- v2.1 PITFALLS.md (`.planning/research/PITFALLS.md` truoc) — precedent patterns, HIGH confidence

---
*Pitfalls research cho: v3.0 Research Squad — tich hop research agents, anti-hallucination system, structured storage, workflow guards vao framework co san*
*Researched: 2026-03-25*
