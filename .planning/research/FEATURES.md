# Feature Landscape: v3.0 Research Squad

**Domain:** Anti-hallucination research agents voi structured storage, audit-ready reports, va workflow guards cho AI coding skill framework
**Researched:** 2026-03-25
**Confidence:** HIGH (dua tren tai lieu chinh thuc + codebase hien co + nghien cuu domain 2025-2026)

---

## Table Stakes

Nhung features ma nguoi dung KY VONG CO khi nghe "Research Squad voi anti-hallucination". Thieu bat ky feature nao = he thong khong dang tin cay.

### Danh muc A: Cau truc Luu tru Phan tach (Storage)

| Feature | Ly do ky vong | Do phuc tap | Ghi chu |
|---------|---------------|-------------|---------|
| **A-TS1: Thu muc internal/ cho research noi bo** | Research ve codebase hien tai (scan, plan analysis, bug history) KHONG duoc tron voi research tu web/docs ben ngoai. Nguoi dung can phan biet "dieu da biet chac" vs "dieu tra cuu duoc" | LOW | Tao `.planning/research/internal/` chua ket qua phan tich codebase, plan history, regression patterns. Moi file co frontmatter chuan: `source: internal`, `scope: [project-name]`, `created: ISO-8601`. **Phu thuoc:** Khong. Doc lap hoan toan. |
| **A-TS2: Thu muc external/ cho research ben ngoai** | Research tu web, tai lieu thu vien, best practices, API docs can duoc tach rieng vi co confidence thap hon va can source citation | LOW | Tao `.planning/research/external/` chua ket qua tra cuu tu Context7, WebSearch, official docs. Moi file PHAI co: `source: external`, `url: [nguon]`, `retrieved: ISO-8601`, `confidence: HIGH/MEDIUM/LOW`. **Phu thuoc:** Khong. Doc lap hoan toan. |
| **A-TS3: INDEX.md tu dong** | Khi co 5+ research files, tim kiem bang tay la bat kha thi. INDEX la manifest giup agent va nguoi dung tim nhanh | MEDIUM | Auto-generate `.planning/research/INDEX.md` moi khi file research moi duoc tao. Format: bang markdown voi cot [File, Source Type, Topic, Confidence, Created]. Tai su dung pattern tu `bin/lib/manifest.js` (SHA256 tracking da co). **Phu thuoc:** A-TS1 + A-TS2 (phai co thu muc truoc). |
| **A-TS4: Lenh pd research voi auto-detect context** | Nguoi dung go `pd research "topic"` va he thong TU DONG biet la research noi bo (codebase) hay ngoai (web/docs) dua tren noi dung cau hoi | MEDIUM | Heuristic: neu topic chua ten file/function/module trong project -> internal routing (dung FastCode/Grep). Neu topic la ten thu vien/API/pattern -> external routing (dung Context7/WebSearch). Mixed -> chay ca 2 agents. Output ghi vao thu muc tuong ung. **Phu thuoc:** A-TS1 + A-TS2, agent infrastructure. |

### Danh muc B: Tieu chuan Bao cao Chong Ao Giac (Anti-Hallucination Audit)

| Feature | Ly do ky vong | Do phuc tap | Ghi chu |
|---------|---------------|-------------|---------|
| **B-TS1: Metadata bat buoc trong moi research output** | Khong co metadata = khong biet ai tao, khi nao, tu nguon nao. Vo dung cho audit | LOW | YAML frontmatter bat buoc: `agent:`, `created:`, `source: internal/external`, `topic:`, `confidence: HIGH/MEDIUM/LOW`. Tuong tu evidence-protocol.js da co o v2.1 (parseFrontmatter da co trong utils.js). **Phu thuoc:** utils.js parseFrontmatter (da co). |
| **B-TS2: Evidence section voi source citation** | Moi claim PHAI co bang chung kem theo. Claim khong co source = hallucination cho den khi chung minh nguoc lai | MEDIUM | Moi research file phai co section `## Bang chung` voi format: `- [Claim]: [Source URL hoac file:dong] (confidence: HIGH/MEDIUM/LOW)`. Agent KHONG DUOC ghi claim ma khong co it nhat 1 source. Validator kiem tra section nay ton tai va khong rong. **Phu thuoc:** B-TS1 (metadata de biet source type). |
| **B-TS3: Confidence Level 3 bac** | Nguoi dung can biet muc do tin cay cua tung phan research de quyet dinh co dung hay can xac minh them | LOW | 3 bac: HIGH (Context7/official docs/codebase truc tiep), MEDIUM (nhieu nguon web dong y), LOW (1 nguon duy nhat hoac khong xac minh duoc). Gan o ca cap file (frontmatter) va cap claim (trong Evidence section). **Phu thuoc:** Khong. Convention, khong can code. |
| **B-TS4: Audit Log append-only** | Moi hanh dong research phai duoc ghi lai de truy vet. Tuong tu git log cho research activities | MEDIUM | File `.planning/research/AUDIT_LOG.md` append-only. Moi entry: `| ISO-timestamp | agent-name | action | topic | source-count | confidence |`. Khong bao gio xoa entry cu, chi them moi. Validator canh bao neu file bi sua (kiem tra dong cu van con). **Phu thuoc:** B-TS1 (metadata cung cap data cho log entry). |

### Danh muc C: Research Squad Agents

| Feature | Ly do ky vong | Do phuc tap | Ghi chu |
|---------|---------------|-------------|---------|
| **C-TS1: Evidence Collector agent** | Agent chuyen thu thap bang chung tu nhieu nguon (codebase, Context7, web) va ghi ket qua theo format chuan | MEDIUM | Tao `commands/pd/agents/pd-evidence-collector.md`. Tier: builder/sonnet. Allowed tools: Read, Grep, Glob, Bash, mcp__context7. Process: (1) nhan topic tu orchestrator, (2) xac dinh internal vs external, (3) thu thap tu 2+ nguon doc lap, (4) ghi vao internal/ hoac external/ voi frontmatter chuan. KHONG duoc ket luan — chi thu thap. **Phu thuoc:** A-TS1 + A-TS2 (thu muc luu tru), B-TS1 (format output). |
| **C-TS2: Fact Checker agent** | Agent doc-lap kiem tra lai nhung gi Evidence Collector da thu thap. Phat hien mau thuan, claim khong co source, thong tin loi thoi | MEDIUM | Tao `commands/pd/agents/pd-fact-checker.md`. Tier: architect/opus (can suy luan sau). Allowed tools: Read, Grep, WebSearch, mcp__context7. Process: (1) doc research file tu Collector, (2) voi moi claim co source — xac minh source con valid, (3) voi moi claim confidence LOW — tim them source hoac danh dau "KHONG XAC MINH DUOC", (4) ghi ket qua vao `## Kiem tra Thuc te` section trong cung file hoac file rieng. **Phu thuoc:** C-TS1 (phai co output tu Collector truoc). |

### Danh muc D: Workflow Guards & Enforcement

| Feature | Ly do ky vong | Do phuc tap | Ghi chu |
|---------|---------------|-------------|---------|
| **D-TS1: Plan-Gate — chan plan thieu research** | Plan khong co research backing = plan dua tren gia thuyet. Plan-Gate kiem tra: co research file cho cac decision trong plan khong? | MEDIUM | Mo rong plan-checker.js (da co 8 checks). Them CHECK-06: `checkResearchBacking`. Logic: doc Key Links / References section trong PLAN.md -> kiem tra co lien ket den `.planning/research/` files khong. Severity: WARN mac dinh (configurable). **Phu thuoc:** plan-checker.js (da co), A-TS3 INDEX.md (de cross-reference). |
| **D-TS2: Mandatory Suggestion — goi y research khi phat hien uncertainty** | Khi plan chua "chua ro", "can tim hieu", "co the" (hedging language) -> tu dong goi y chay `pd research` | LOW | Regex scan trong plan body tim hedging patterns: `/chua ro|can tim hieu|co the.*hoac|khong chac/gi`. Neu tim thay >= 2 matches -> hien warning: "Plan co N diem chua chac chan. Goi y chay `pd research [topic]` truoc khi code." Non-blocking, chi goi y. **Phu thuoc:** Khong. Doc lap, co the tich hop vao plan-checker hoac workflow. |
| **D-TS3: Strategy Injection — tu dong truyen research context vao agent** | Khi spawn agent (write-code, fix-bug), tu dong tim va load research files lien quan vao context cua agent | MEDIUM | Khi workflow spawn agent: (1) doc INDEX.md, (2) tim research files co topic match voi task dang lam (keyword match), (3) inject noi dung vao prompt cua agent nhu `<research-context>` block. Gioi han: toi da 2 files, toi da 2000 tokens de khong phình context. **Phu thuoc:** A-TS3 INDEX.md, workflow integration points da co. |

---

## Differentiators

Features tao LOI THE CANH TRANH. Khong bat buoc cho v3.0 launch nhung tang gia tri dang ke.

| Feature | Gia tri | Do phuc tap | Ghi chu |
|---------|---------|-------------|---------|
| **E-D1: Cross-validation tu dong giua internal va external** | So sanh ket qua research noi bo (codebase analysis) voi ben ngoai (docs/web) de phat hien xung dot. Vd: code dung API deprecated ma docs moi noi API da thay doi | HIGH | Fact Checker (C-TS2) doc ca internal/ va external/ files cung topic -> tim mau thuan -> ghi vao `## Xung dot phat hien` section. Gia tri lon nhung can Fact Checker chay 2 luot. **Phu thuoc:** C-TS1 + C-TS2 (ca 2 agents), A-TS1 + A-TS2 (ca 2 thu muc). |
| **E-D2: Research freshness tracking** | Danh dau research file "het han" khi qua N ngay (configurable, mac dinh 14 ngay). Dependencies thay doi nhanh — research 2 tuan truoc co the sai | MEDIUM | Them field `expires: ISO-8601` trong frontmatter. INDEX.md hien trang thai: FRESH (< 7 ngay), AGING (7-14 ngay), STALE (> 14 ngay). Plan-Gate canh bao khi plan reference research STALE. **Phu thuoc:** A-TS3 INDEX.md, B-TS1 metadata. |
| **E-D3: Research diff khi cap nhat** | Khi chay lai research cho topic da co, hien thi THAY DOI so voi lan truoc thay vi ghi de. Giup phat hien dependencies da thay doi | HIGH | Truoc khi ghi file moi: doc file cu -> diff 2 versions -> ghi `## Thay doi so voi lan truoc` section. Tuong tu logic-sync.js detectLogicChanges (da co o v1.5). **Phu thuoc:** logic-sync.js pattern (tai su dung), A-TS1/A-TS2 (thu muc). |
| **E-D4: Confidence aggregation cho plan** | Tinh confidence trung binh cua tat ca research backing 1 plan. Plan voi avg confidence LOW -> canh bao manh hon | MEDIUM | Plan-Gate (D-TS1) doc confidence tu tung research file referenced -> tinh trung binh -> hien trong PASS table: `RESEARCH-CONFIDENCE: HIGH/MEDIUM/LOW`. **Phu thuoc:** D-TS1 Plan-Gate, B-TS3 confidence levels. |
| **E-D5: Pipeline Evidence Collector -> Fact Checker tu dong** | Thay vi chay thu cong 2 agent, `pd research` tu dong chay Collector roi Fact Checker theo pipeline | LOW | Orchestration don gian: (1) spawn Evidence Collector, (2) doi hoan tat, (3) spawn Fact Checker voi output tu buoc 1. Tuong tu pattern D-TS1->D-TS2 trong v2.1 detective workflow. **Phu thuoc:** C-TS1 + C-TS2 (ca 2 agents). |

---

## Anti-Features

Features KHONG NEN LAM. Moi feature co ly do muon lam va ly do khong nen.

| Anti-Feature | Ly do muon co | Ly do co van de | Thay the |
|--------------|---------------|-----------------|----------|
| **AF-1: LLM-as-judge cho fact-checking** | Dung 1 LLM kiem tra output cua LLM khac de cross-validate | Circular reasoning: 2 LLMs co cung training data co the dong y ve cung 1 thong tin sai. PROJECT.md da ghi ro "LLM-as-judge — plan already in context, calling another LLM is circular" trong Out of Scope. Chi phi gap doi. | Fact Checker dung TOOL-based verification: Context7 tra docs, Grep kiem tra code, WebSearch tim nguon. Bang chung tu TOOLS, khong tu LLM khac. |
| **AF-2: Embedding-based semantic search cho research files** | Tim research lien quan bang semantic similarity thay vi keyword match | Them dependency (embedding model/API), pha vo "No Build Step" constraint. So luong research files trong 1 du an nho (10-50 files) — keyword match + INDEX.md du hieu qua. Chi phi phuc tap khong tuong xung voi loi ich. | INDEX.md + Grep keyword match. Neu can chinh xac hon: them tags trong frontmatter de filter theo tag. |
| **AF-3: Database luu research (SQLite/JSON DB)** | Query nhanh hon, structured queries, relationships giua research files | Cung ly do nhu C-AF1 o v2.1: them dependency, pha vo pure Node.js pattern. Markdown files la du cho quy mo 1 du an. Grep + INDEX.md la du nhanh cho 100+ files. | Flat file INDEX.md + frontmatter structured + Grep. Pattern da duoc chung minh hieu qua o v1.5 bug tracking (.planning/bugs/). |
| **AF-4: Real-time research khi dang code** | Tu dong chay research ngam khi developer dang viet code de cung cap suggestions | Token cost cuc cao (research chay lien tuc). Gay nhieu ngat workflow. Nguoi dung khong ky vong AI tu research khi khong duoc yeu cau. Vi pham nguyên tac "minimum tokens and time" trong Core Value. | On-demand research: nguoi dung go `pd research` khi CAN. Strategy Injection (D-TS3) truyen research DA CO vao context — khong chay research moi. |
| **AF-5: Blocking enforcement (research bat buoc truoc moi plan)** | Bat buoc moi plan phai co research backing, khong cho pass neu thieu | Qua nghiem ngat cho task don gian (fix typo, update version). Lam cham workflow cho 80% task khong can research. Plan-checker da co precedent: CHECK-05 mac dinh WARN khong phai BLOCK. | WARN severity mac dinh. Nguoi dung co the cau hinh BLOCK cho du an quan trong qua `.plan-checker.yml` (pattern da co tu v1.3). |
| **AF-6: Auto-research truoc moi phase** | Tu dong chay research cho moi phase trong roadmap truoc khi bat dau | Phung phi tokens cho phases don gian (refactor, test, docs). Research chi can thiet cho phases co uncertainty cao (new tech, complex architecture). | Danh dau phases CAN research trong roadmap (flag `needs_research: true`). Chi phases do moi trigger research tu dong. |

---

## Feature Dependencies

```
[A-TS1: internal/] ──┐
                      ├──> [A-TS3: INDEX.md]
[A-TS2: external/] ──┘        |
                               v
[B-TS1: Metadata] ────> [B-TS4: Audit Log]
       |                       |
       v                       v
[B-TS2: Evidence section] ──> [B-TS3: Confidence Level]
       |
       v
[C-TS1: Evidence Collector] ──> [C-TS2: Fact Checker]
       |                               |
       v                               v
[A-TS4: pd research cmd] ────> [E-D5: Pipeline tu dong]
                                       |
                                       v
                               [E-D1: Cross-validation]

[D-TS1: Plan-Gate] ──> [E-D4: Confidence aggregation]
       ^
       |
[plan-checker.js da co] ──> [D-TS2: Mandatory Suggestion]

[D-TS3: Strategy Injection] <── [A-TS3: INDEX.md]

[E-D2: Freshness tracking] <── [B-TS1: Metadata]
[E-D3: Research diff] <── [logic-sync.js pattern v1.5]
```

### Ghi chu Dependency quan trong

- **A-TS1 + A-TS2 PHAI co truoc moi feature khac:** Thu muc luu tru la nen tang. Khong co thu muc = khong co cho ghi research.
- **B-TS1 Metadata PHAI co truoc B-TS2, B-TS4, C-TS1:** Format chuan la prerequisite cho moi output/validation.
- **C-TS1 Evidence Collector PHAI co truoc C-TS2 Fact Checker:** Fact Checker can co output de kiem tra.
- **D-TS1 Plan-Gate co the lam doc lap:** Chi can plan-checker.js (da co) + research files (tu A-TS1/A-TS2).
- **D-TS3 Strategy Injection can INDEX.md:** De tim research files lien quan.

---

## Mapping toi Module/File hien co

| Feature moi | Module/File da co | Thay doi can thiet |
|-------------|-------------------|--------------------|
| A-TS1 + A-TS2: Thu muc luu tru | `.planning/research/` (da ton tai) | Tao sub-dirs `internal/` va `external/` |
| A-TS3: INDEX.md | `bin/lib/manifest.js` (SHA256 pattern) | Tao `bin/lib/research-index.js` pure function moi |
| A-TS4: pd research | `commands/pd/` (pattern da co) | Tao `commands/pd/research.md` skill moi |
| B-TS1: Metadata | `bin/lib/utils.js` parseFrontmatter (da co) | Khong thay doi — tai su dung |
| B-TS2: Evidence section | `bin/lib/evidence-protocol.js` (v2.1) | Mo rong hoac tao research-validator.js tuong tu |
| B-TS4: Audit Log | Chua co | Tao `bin/lib/audit-log.js` pure function (append content) |
| C-TS1: Evidence Collector | `commands/pd/agents/` (5 agents da co) | Tao `pd-evidence-collector.md` agent moi |
| C-TS2: Fact Checker | `commands/pd/agents/` (5 agents da co) | Tao `pd-fact-checker.md` agent moi |
| D-TS1: Plan-Gate | `bin/lib/plan-checker.js` (8 checks) | Them CHECK-06 checkResearchBacking |
| D-TS2: Mandatory Suggestion | `bin/lib/plan-checker.js` | Co the tich hop nhu CHECK-07 hoac doc lap |
| D-TS3: Strategy Injection | Workflow files (`workflows/*.md`) | Them buoc inject research context |
| E-D3: Research diff | `bin/lib/logic-sync.js` detectLogicChanges | Tai su dung pattern, tao research-diff.js |

---

## MVP Recommendation

### v3.0 Launch (Minimum Viable Research Squad)

Uu tien theo thu tu implement:

1. **A-TS1 + A-TS2: Thu muc luu tru** — Nen tang, lam dau tien, LOW complexity
2. **B-TS1: Metadata frontmatter chuan** — Convention, ap dung ngay, LOW complexity
3. **B-TS3: Confidence Level 3 bac** — Convention, kem voi B-TS1, LOW complexity
4. **B-TS2: Evidence section voi citations** — Format chuan cho moi output, MEDIUM complexity
5. **C-TS1: Evidence Collector agent** — Agent dau tien, tao duoc research files, MEDIUM complexity
6. **A-TS3: INDEX.md tu dong** — Tu dong hoa tracking, MEDIUM complexity
7. **C-TS2: Fact Checker agent** — Agent thu 2, kiem tra output agent 1, MEDIUM complexity
8. **B-TS4: Audit Log** — Ghi lai moi hoat dong, MEDIUM complexity
9. **A-TS4: pd research command** — Diem vao cho nguoi dung, MEDIUM complexity
10. **D-TS1: Plan-Gate CHECK-06** — Enforcement, lam sau cung khi da co research files de test, MEDIUM complexity
11. **D-TS2: Mandatory Suggestion** — Non-blocking goi y, LOW complexity
12. **D-TS3: Strategy Injection** — Auto-load research vao agent context, MEDIUM complexity

**Defer sang v3.1+:**
- E-D1: Cross-validation (HIGH complexity, can ca 2 agents stable truoc)
- E-D2: Freshness tracking (can kinh nghiem thuc te ve research lifecycle)
- E-D3: Research diff (nice-to-have, can research files thuc te de test)
- E-D4: Confidence aggregation (can Plan-Gate stable truoc)
- E-D5: Pipeline tu dong (polish, can manual flow hoat dong tot truoc)

---

## Feature Prioritization Matrix

| Feature | Gia tri User | Chi phi Implement | Uu tien |
|---------|-------------|-------------------|---------|
| A-TS1+A-TS2: Thu muc phan tach | HIGH | LOW | **P1** |
| B-TS1: Metadata bat buoc | HIGH | LOW | **P1** |
| B-TS3: Confidence Level | HIGH | LOW | **P1** |
| B-TS2: Evidence + citations | HIGH | MEDIUM | **P1** |
| C-TS1: Evidence Collector | HIGH | MEDIUM | **P1** |
| A-TS3: INDEX.md tu dong | MEDIUM | MEDIUM | **P1** |
| C-TS2: Fact Checker | HIGH | MEDIUM | **P1** |
| B-TS4: Audit Log | MEDIUM | MEDIUM | **P1** |
| A-TS4: pd research cmd | HIGH | MEDIUM | **P1** |
| D-TS1: Plan-Gate | MEDIUM | MEDIUM | **P1** |
| D-TS2: Mandatory Suggestion | LOW | LOW | **P1** |
| D-TS3: Strategy Injection | MEDIUM | MEDIUM | **P1** |
| E-D5: Pipeline tu dong | MEDIUM | LOW | **P2** |
| E-D2: Freshness tracking | MEDIUM | MEDIUM | **P2** |
| E-D1: Cross-validation | HIGH | HIGH | **P2** |
| E-D3: Research diff | MEDIUM | HIGH | **P2** |
| E-D4: Confidence aggregation | LOW | MEDIUM | **P2** |

**Priority key:**
- P1: Bat buoc cho v3.0 launch — thieu thi Research Squad khong hoat dong
- P2: Them khi v3.0 on dinh — tang chat luong va automation

---

## Phan tich Competitor / Reference

| Feature | Claude Code vanilla | Cursor | Ring (LerianStudio) | Deep Research (OpenAI) | Please-Done v3.0 |
|---------|--------------------|---------|--------------------|----------------------|-------------------|
| Structured research storage | Khong | Khong | Khong (skills co nhung khong phan tach) | Internal only | internal/ + external/ phan tach + INDEX.md |
| Anti-hallucination audit | Khong | Khong | "Run command -> paste output" rule | Khong (citation nhung khong audit) | Metadata + Evidence + Confidence + Audit Log |
| Evidence collection agent | Khong | Khong | Khong | Single agent, khong phan tach | Specialized Collector + Fact Checker pipeline |
| Fact-checking agent | Khong | Khong | Khong | Khong rieng biet | Dedicated agent voi tool-based verification |
| Workflow guards | Khong | Khong | 89 skills, gate system | Khong | Plan-Gate + Suggestion + Strategy Injection |
| Confidence scoring | Khong | Khong | Khong | Khong ro rang | 3-level (HIGH/MEDIUM/LOW) o ca file va claim |
| Source separation | Khong | Khong | Khong | Single stream | Internal vs External routing |

**Insight chinh:** Khong co AI coding tool nao ket hop: phan tach luu tru theo nguon + anti-hallucination audit trail + fact-checking agent doc lap + workflow enforcement trong 1 he thong. Ring (LerianStudio) co gate system gan nhat nhung thieu research/fact-checking. OpenAI Deep Research co citation nhung khong co audit trail hay source separation. v3.0 la lop "research integrity" tren nen tang Claude Code.

---

## Sources

- [Deep Research: A Survey of Autonomous Research Agents (arXiv)](https://arxiv.org/html/2508.12752v1) — HIGH confidence, academic survey
- [Multi-agent systems and credibility-based scoring in fact-checking (Nature)](https://www.nature.com/articles/s41598-026-41862-z) — HIGH confidence, peer-reviewed
- [LoCal: Logical and Causal Fact-Checking with LLM-Based Multi-Agents (ACM)](https://dl.acm.org/doi/10.1145/3696410.3714748) — HIGH confidence, peer-reviewed
- [Ring: Mandatory workflow enforcement for AI agents (GitHub)](https://github.com/LerianStudio/ring) — MEDIUM confidence, open-source reference
- [Agentic Engineering Part 7: Dual Quality Gates](https://www.sagarmandal.com/2026/03/15/agentic-engineering-part-7-dual-quality-gates-why-validation-and-testing-must-be-separate-processes/) — MEDIUM confidence, industry blog
- [AI Agent Guardrails: Production Guide 2026](https://authoritypartners.com/insights/ai-agent-guardrails-production-guide-for-2026/) — MEDIUM confidence, industry guide
- [AI Audit Trail: Compliance & Accountability (Swept AI)](https://www.swept.ai/ai-audit-trail) — MEDIUM confidence, product reference
- [Practical Hallucination Detection for AI Agents (arXiv 2026)](https://arxiv.org/pdf/2603.10060) — HIGH confidence, academic paper
- Existing codebase: `bin/lib/evidence-protocol.js`, `bin/lib/plan-checker.js`, `bin/lib/session-manager.js`, `commands/pd/agents/` — HIGH confidence (primary source)
- Existing FEATURES.md v2.1: `.planning/research/FEATURES.md` — HIGH confidence (pattern reference)

---
*Feature research cho: v3.0 Research Squad (please-done)*
*Researched: 2026-03-25*
