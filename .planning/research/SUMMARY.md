# Research Summary: v3.0 Research Squad

**Project:** please-done
**Domain:** Anti-hallucination research agents voi structured storage, audit reports, workflow guards
**Synthesized:** 2026-03-25
**Overall Confidence:** HIGH
**Based on:** STACK.md, FEATURES.md, ARCHITECTURE.md, PITFALLS.md

---

## Executive Summary

v3.0 Research Squad la he thong chong ao giac (anti-hallucination) tich hop vao framework AI coding skill hien co cua please-done. He thong bao gom 2 sub-agents chuyen biet (Evidence Collector va Fact Checker), cau truc luu tru phan tach (internal/external), va 3 workflow guards (Plan-Gate, Mandatory Suggestion, Strategy Injection). Tat ca xay dung tren nen tang zero-dependency da co — khong them bat ky runtime package nao, chi them 3 pure function JS modules moi, 2 agent definition files, 1 skill, 1 workflow, va 2 guard reference files.

Cach tiep can duoc khuyen nghi: file-based markdown storage voi YAML frontmatter (parseable boi parseFrontmatter() da co trong utils.js), rule-based confidence scoring (KHONG dung LLM self-assessment), 2-agent pipeline tach biet thu thap va xac minh, va non-blocking guards (default WARN thay vi BLOCK). Day la su mo rong truc tiep tu cac pattern da chung minh cua v2.1 — evidence-protocol.js, bug-memory.js, sub-agent orchestration — ap dung cho domain research thay vi debug.

Rui ro chinh la "verified hallucination" — he thong co the tao bao cao co confidence level nhung level do la LLM self-assessment, khong phai evidence-based. Giai phap bat buoc: confidence scoring PHAI la pure function rule-based (`scoreConfidence(sources)`) dem so nguon va classify chat luong nguon, khong bao gio dung cam nhan cua agent. Rui ro thu hai la circular verification — Fact Checker verify bang cung tools nhu Evidence Collector. Giai phap: phan biet ro internal verification (doc code truc tiep, HIGH confidence) vs external verification (chi xac nhan source ton tai, MEDIUM toi da).

---

## Key Findings

### Tu STACK.md

- **Zero runtime dependency:** Tat ca chuc nang moi la text processing — Node.js built-in du, khong can them package nao. Day la constraint bat buoc tu PROJECT.md.
- **2 agents (KHONG hon):** Evidence Collector (sonnet/builder) cho thu thap, Fact Checker (haiku/scout) cho xac minh. Giu nhat quan voi `RESOURCE_LIMITS.maxConcurrentAgents = 2`.
- **3 modules JS moi:** `research-storage.js`, `audit-reporter.js`, `confidence-scorer.js` — tat ca pure functions, pattern tuong tu cac module v2.1.
- **3 modules mo rong:** `evidence-protocol.js` (them outcome types), `resource-config.js` (them 2 agents moi), `plan-checker.js` (them CHECK-06 Research Gate).
- **Storage format:** Markdown voi YAML frontmatter, danh so ID (INT-001/EXT-001), parseable boi parseFrontmatter() da co trong utils.js. KHONG dung JSON hoac database.
- **Confidence scoring:** Rule-based — Context7/official docs cho HIGH, WebSearch + verify cho MEDIUM, chi training data cho LOW. KHONG dung LLM.
- **WebSearch/WebFetch la tools cua orchestrator, KHONG cua subagents.**

### Tu FEATURES.md

**Must-have cho v3.0 (theo thu tu implement):**

1. A-TS1 + A-TS2: Thu muc `internal/` va `external/` — nen tang, LOW complexity
2. B-TS1: YAML frontmatter bat buoc — convention, LOW complexity
3. B-TS3: Confidence Level 3 bac (HIGH/MEDIUM/LOW) — convention, LOW complexity
4. B-TS2: Evidence section voi source citations — format chuan, MEDIUM complexity
5. C-TS1: Evidence Collector agent — MEDIUM complexity
6. A-TS3: INDEX.md tu dong — MEDIUM complexity
7. C-TS2: Fact Checker agent — MEDIUM complexity
8. B-TS4: Audit Log append-only — MEDIUM complexity
9. A-TS4: `pd research` command — MEDIUM complexity
10. D-TS1: Plan-Gate CHECK-06 — MEDIUM complexity
11. D-TS2: Mandatory Suggestion — non-blocking, LOW complexity
12. D-TS3: Strategy Injection — auto-load research vao agent context, MEDIUM complexity

**Defer sang v3.1+:**
- E-D1: Cross-validation internal vs external (HIGH complexity, can agents stable truoc)
- E-D2: Freshness tracking (can real-world data)
- E-D3: Research diff khi cap nhat (nice-to-have)
- E-D4: Confidence aggregation cho plan
- E-D5: Pipeline tu dong Collector → Checker

**Anti-features da xac dinh (KHONG lam):**
- LLM-as-judge cho fact-checking (circular reasoning — PROJECT.md cam ro)
- Embedding/vector database (vi pham no-dependency constraint)
- Blocking enforcement mac dinh (user se bypass)
- Real-time research khi dang code (token cost + interrupt flow)
- Auto-research truoc moi phase (phung phi tokens cho phase don gian)

### Tu ARCHITECTURE.md

- **Pattern tai su dung:** Sub-agent orchestration, evidence-as-communication, auto-increment ID, YAML frontmatter — tat ca ke thua truc tiep tu v2.1 detective system.
- **5 phases build duoc khuyen nghi:** (1) Research Storage Foundation, (2) Audit Report Standards, (3) Research Agents, (4) Workflow Guards, (5) `pd research` command. Phase 4 co the song song voi Phase 3.
- **Component mapping:**
  - `research-store.js` ~ `bug-memory.js` (createEntry, buildIndex, searchEntries)
  - `audit-report.js` ~ `report-filler.js` (addAuditEntry, calculateConfidence)
  - `fact-checker.js` ~ validation modules (extractClaims, compareClaim, generateVerdict)
- **Migration backward compatible:** 5 files cu (SUMMARY, STACK, FEATURES, ARCHITECTURE, PITFALLS) giu nguyen. INDEX.md la addition, khong replacement. plan.md Buoc 3 van doc SUMMARY.md nhu cu.
- **Non-blocking guards la pattern du an:** `debug-cleanup.js`, `logic-sync.js` deu non-blocking tu v1.5.
- **Thu tu build co ly do ro:** Storage truoc → Format/Scoring truoc → Agents sau → Guards song song voi Agents → Command cuoi.

### Tu PITFALLS.md

| # | Pitfall | Severity | Prevention chinh |
|---|---------|----------|-----------------|
| 1 | Confidence level la LLM self-assessment, khong calibrated | CRITICAL | Rule-based `scoreConfidence()` pure function. KHONG cho agent tu danh gia. |
| 2 | Evidence Collector fabricate citations (URL 404, tool call hallucination) | CRITICAL | Moi claim phai co tool call tuong ung. "Source-or-skip" rule bat buoc. |
| 3 | Fact Checker circular verification (dung cung sources nhu Evidence Collector) | HIGH | Internal = doc code truc tiep (HIGH). External = chi verify source ton tai (MEDIUM toi da). |
| 4 | INDEX.md stale (agent tao file nhung khong cap nhat INDEX) | HIGH | INDEX la GENERATED tu `generateIndex()`. Frontmatter la source of truth. |
| 5 | Workflow guards overblocking (false positives, user bypass) | HIGH | Default WARN. Test tren existing PLAN.md. False positive rate < 5%. |
| 6 | Routing sai internal/external | MEDIUM | Rule-based heuristics. `--internal/--external` flags cho override. |
| 7 | Converter pipeline thieu research files | MEDIUM | Them pd-research.md vao converter pipeline cung luc voi implementation. |
| 8 | Research storage phình to | MEDIUM | Retention policy voi `expires:`, dedup check, archive mechanism. |
| 9 | Audit log format khong tuong thich voi parsers | LOW | Reuse parseFrontmatter(), markdown table chuan. |
| 10 | Context7 goi qua nhieu (rate limit) | LOW | Theo context7-pipeline.md, cache library IDs, batch queries. |

---

## Implications for Roadmap

### Cau truc Phase Duoc Khuyen Nghi: 5 Phases

```
Phase A: Storage Foundation ──> Phase B: Audit Standards ──> Phase C: Agents ──+──> Phase E: Command
                                                                                 |
                                                              Phase D: Guards ───+
                                                              (song song voi C)
```

---

#### Phase A: Research Storage Foundation

**Rationale:** Moi thu phu thuoc vao storage format va directory structure — phai co truoc tat ca.
**Deliverable:** Thu muc `internal/`, `external/`, `research-store.js` (createEntry, parseEntry, buildIndex, searchEntries), `generateIndex()`, `audit-report.js` so bo.
**Features:** A-TS1, A-TS2, A-TS3, B-TS1, B-TS3.
**Pitfalls phai tranh:** Pitfall 4 (INDEX stale — implement `generateIndex()` ngay tu dau, frontmatter la source of truth, khong manually maintained).
**Research flag:** SKIP — pattern da ro tu bug-memory.js va manifest.js.

---

#### Phase B: Audit Report Standards

**Rationale:** Agents can biet format output TRUOC KHI implement. Confidence scoring la nen tang cua toan bo he thong "chong ao giac" — phai la rules-based tu dau.
**Deliverable:** `confidence-scorer.js` (scoreConfidence pure function), `audit-reporter.js` day du, evidence validation, standard format cho research findings.
**Features:** B-TS2, B-TS4.
**Pitfalls phai tranh:** Pitfall 1 (CRITICAL — implement `scoreConfidence()` truoc bau tien, KHONG cho LLM tu danh gia), Pitfall 9 (parser incompatibility — reuse parseFrontmatter()).
**Research flag:** SKIP — rule-based scoring da duoc dinh nghia day du trong STACK.md.

---

#### Phase C: Research Agents

**Rationale:** Agents can co storage (Phase A) va audit format (Phase B) truoc khi implement.
**Deliverable:** `pd-evidence-collector.md`, `pd-fact-checker.md`, cap nhat `resource-config.js` voi 2 agents moi.
**Features:** C-TS1, C-TS2.
**Pitfalls phai tranh:** Pitfall 2 (fabricated citations — "source-or-skip" rule trong agent prompt, audit log lien ket claim voi tool calls), Pitfall 3 (circular verification — phan biet ro internal vs external protocol), Pitfall 10 (Context7 abuse — tham chieu context7-pipeline.md).
**Research flag:** CO THE research phase neu muon xac minh tool allowlist va maxTurns toi uu cho agents.

---

#### Phase D: Workflow Guards

**Rationale:** Guards chi can INDEX.md (Phase A) va plan-checker.js (da co) — doc lap voi agents, co the chay SONG SONG voi Phase C.
**Deliverable:** CHECK-06 trong plan-checker.js, guard micro-templates (`guard-research.md`, `guard-evidence.md`), Plan-Gate + Mandatory Suggestion + Strategy Injection trong workflow files.
**Features:** D-TS1, D-TS2, D-TS3.
**Pitfalls phai tranh:** Pitfall 5 (CRITICAL — default WARN, test false positive rate tren existing plans truoc release, < 5% threshold), Pitfall 12 (Plan-Gate goi plan-checker, KHONG duplicate logic).
**Research flag:** SKIP — CHECK-05 pattern va non-blocking v1.5 da chung minh day du.

---

#### Phase E: pd research Command

**Rationale:** Tich hop tat ca thanh phan thanh user-facing command. Lam sau cung khi co agents + storage + guards on dinh.
**Deliverable:** `commands/pd/research.md`, `workflows/research.md`, cap nhat `new-milestone.md` Buoc 5, cap nhat converter snapshots.
**Features:** A-TS4, luong tu dong tu E-D5.
**Pitfalls phai tranh:** Pitfall 6 (routing sai — rule-based heuristics + `--internal/--external` flags bat buoc truoc auto-detect), Pitfall 7 (converter pipeline — them pd-research.md ngay khi tao skill file).
**Research flag:** SKIP — routing heuristics da dinh nghia ro, converter pattern da co tu v2.1 agents.

---

### Defer sang v3.1

- E-D1: Cross-validation (HIGH complexity, can Phase C stable, can du lieu thuc te)
- E-D2: Freshness tracking (can research files thuc te de calibrate policy)
- E-D3: Research diff (can logic-sync.js pattern, nice-to-have)
- E-D4: Confidence aggregation for plan
- Pitfall 8 retention/archive (implement khi co du files thuc te)

---

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | Phan tich truc tiep codebase v2.1 + PROJECT.md constraints. Zero-dependency decision la bat buoc. |
| Features | HIGH | Academic sources (arXiv, Nature, ACM) + codebase analysis. MVP scope duoc validate tu nhieu huong. |
| Architecture | HIGH | 601+ tests chung minh cac pattern (bug-memory, evidence-protocol, sub-agents). Moi quyet dinh co tien le trong codebase. |
| Pitfalls | HIGH | Nghien cuu hoc thuat 2025-2026 ve LLM calibration + codebase analysis. Critical pitfalls xac minh boi nhieu nguon doc lap. |

### Gaps Can Chu Y Trong Planning

1. **Context7 rate limits cu the:** PITFALLS.md neu risk nhung khong co so lieu cu the. Can monitor trong Phase C.
2. **False positive rate baseline:** Khuyen nghi < 5% nhung khong co data tu codebase hien tai. Can do tren existing PLAN.md files truoc Phase D.
3. **maxTurns va token budget cho agents:** De xuat nhung chua lock down so cu the. Can calibrate trong Phase C.
4. **Routing heuristics accuracy:** Khuyen nghi > 80% accuracy nhung heuristics chua duoc test voi real queries. Can validate trong Phase E.

---

## Research Flags

| Phase | Flag | Ly do |
|-------|------|-------|
| Phase A: Storage Foundation | SKIP research | Pattern da co: bug-memory.js, manifest.js, parseFrontmatter() — khong co ambiguity |
| Phase B: Audit Standards | SKIP research | Scoring rules dinh nghia day du trong STACK.md, khong can them |
| Phase C: Research Agents | CO THE research | Neu muon xac minh tool allowlist agent, maxTurns toi uu, Context7 rate limits |
| Phase D: Workflow Guards | SKIP research | CHECK-05 pattern + non-blocking v1.5 da chung minh, false positive test la du |
| Phase E: pd research Command | SKIP research | Converter pattern co tu v2.1, routing heuristics da dinh nghia ro |

---

## Sources Tong Hop

### Academic / Industry (HIGH confidence)
- [arXiv: Confidence Dichotomy — Miscalibration in LLMs (ICLR 2025)](https://www.arxiv.org/pdf/2601.07264)
- [Amazon QA-Calibration (ICLR 2025)](https://assets.amazon.science/6d/70/c50b2eb141d3bcf1565e62b60211/qa-calibration-of-language-model-confidence-scores.pdf)
- [arXiv: Fact-Checking with LLMs (2026)](https://www.arxiv.org/pdf/2601.02574)
- [Deep Research Survey (arXiv 2508.12752)](https://arxiv.org/html/2508.12752v1)
- [Multi-agent Fact-Checking (Nature)](https://www.nature.com/articles/s41598-026-41862-z)
- [LoCal: Logical Fact-Checking (ACM)](https://dl.acm.org/doi/10.1145/3696410.3714748)
- [Practical Hallucination Detection (arXiv 2026)](https://arxiv.org/pdf/2603.10060)

### Industry Guides (MEDIUM confidence)
- [Authority Partners: AI Guardrails Guide 2026](https://authoritypartners.com/insights/ai-agent-guardrails-production-guide-for-2026/)
- [Oracle: File Systems vs Databases for AI Agent Memory](https://blogs.oracle.com/developers/comparing-file-systems-and-databases-for-effective-ai-agent-memory-management)
- [AI Coding Workflow Best Practices 2026](https://addyosmani.com/blog/ai-coding-workflow/)

### Codebase (PRIMARY, HIGH confidence)
- `bin/lib/evidence-protocol.js`, `bin/lib/bug-memory.js`, `bin/lib/plan-checker.js`, `bin/lib/session-manager.js`, `bin/lib/utils.js`
- `commands/pd/agents/` (5 agents), `references/guard-*.md` (4 guards), `workflows/*.md` (10 workflows)
- `.planning/PROJECT.md` — constraints bat buoc

---

*Research synthesized: 2026-03-25*
*Synthesizer: gsd-research-synthesizer*
*Ready for roadmap: yes*
