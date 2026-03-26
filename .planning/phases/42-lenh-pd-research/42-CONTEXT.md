# Phase 42: Lenh pd research - Context

**Gathered:** 2026-03-26
**Status:** Ready for planning

<domain>
## Phase Boundary

Tao lenh `pd research` — user-facing command duy nhat de nghien cuu. He thong tu phan loai internal/external bang keyword heuristic, chay pipeline Evidence Collector → Fact Checker tu dong, va cross-validate khi co ca 2 loai files cung topic.

</domain>

<decisions>
## Implementation Decisions

### Routing Logic (STORE-04)
- **D-01:** Them function `routeQuery(query)` vao `bin/lib/research-store.js` — pure function return `'internal'` | `'external'`.
- **D-02:** Keyword heuristic: ten file/function/class/variable → internal, ten thu vien/API/protocol → external. Regex don gian.
- **D-03:** Fallback khi khong match pattern nao: default `external` (an toan hon — tra cuu docs rong hon cuc bo).
- **D-04:** Hien thi routing decision ngan gon: in 1 dong "Da phan loai: [internal|external] research" truoc khi chay pipeline.

### Pipeline Orchestration (AGENT-03)
- **D-05:** Workflow `workflows/research.md` orchestrate pipeline — nhat quan voi fix-bug.md orchestrate 5 agents.
- **D-06:** Flow: (1) route query, (2) spawn Evidence Collector agent, (3) doi output, (4) spawn Fact Checker agent voi output lam input. Tuan tu, tu dong.
- **D-07:** Khi Evidence Collector fail (khong tim du source): van chay Fact Checker — ghi file voi confidence LOW, Fact Checker verify nhung gi co. Non-blocking.
- **D-08:** Fact Checker chay tu dong sau Evidence Collector — khong hoi user. Pipeline seamless.
- **D-09:** Output cuoi cung: tom tat ngan gon (topic, source type, confidence, so claims verified, path file ket qua). User muon xem chi tiet thi mo file.

### Cross-validation (EXTRA-01)
- **D-10:** Fact Checker tu dong scan INDEX.md tim files cung topic o ca internal/ va external/. Neu tim thay → so sanh va ghi xung dot.
- **D-11:** Output ghi vao section `## Xung dot phat hien` trong file verification cua Fact Checker — nhat quan voi EXTRA-01 requirement.
- **D-12:** Khi phat hien xung dot: ghi nhan voi evidence tu ca 2 phia, KHONG tu resolve. User tu quyet dinh. Nhat quan voi non-blocking philosophy.

### Skill & Converter
- **D-13:** Skill file: `commands/pd/research.md` voi argument bat buoc la topic. Khong co flags — routing tu dong.
- **D-14:** Workflow file: `workflows/research.md` chua toan bo pipeline logic. Tach skill vs workflow nhat quan voi 12 skills hien co.
- **D-15:** Them research.md vao converter pipeline + regenerate snapshots cho 4 platforms. Nhat quan voi success criteria #4.

### Carrying Forward
- Frontmatter 8 fields chuan (P38 D-01) — locked
- research-store.js API 6 functions (P38 D-07) — locked, them routeQuery la function thu 7
- Evidence Collector = sonnet, Fact Checker = opus (P40 D-02, D-07) — locked
- Evidence Collector KHONG co WebSearch, Fact Checker CO (P40 D-03, D-08) — locked
- Fact Checker KHONG ghi de Collector output — chi THEM section (P40 D-10) — locked
- INDEX.md format tu Phase 39 — locked

### Claude's Discretion
- So luong plans va task breakdown
- Exact regex patterns cho routeQuery heuristic
- Workflow prompt wording cho agent spawn
- Converter template cho research skill

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Existing modules (extend/follow)
- `bin/lib/research-store.js` — Them routeQuery function. Existing: createEntry, parseEntry, generateFilename, validateConfidence
- `bin/lib/index-generator.js` — generateIndex function (Fact Checker dung de scan topics)
- `bin/lib/audit-logger.js` — appendLogEntry (pipeline ghi audit log)
- `bin/lib/confidence-scorer.js` — scoreConfidence (Fact Checker dung)

### Agent definitions (spawn trong pipeline)
- `.claude/agents/pd-evidence-collector.md` — Agent thu thap bang chung
- `.claude/agents/pd-fact-checker.md` — Agent xac minh + cross-validate

### Skill patterns (follow structure)
- `commands/pd/fix-bug.md` — Reference skill command structure (guards, objective, workflow ref)
- `workflows/fix-bug.md` — Reference workflow orchestrating multiple agents
- `commands/pd/write-code.md` — Skill argument pattern

### Converter pipeline
- `bin/lib/converters/codex.js` — Converter pattern to follow
- `test/snapshots/` — Snapshot files to regenerate

### Requirements
- `.planning/REQUIREMENTS.md` — STORE-04, AGENT-03, EXTRA-01

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `research-store.js` — 6 existing functions, them routeQuery la function thu 7
- `parseFrontmatter()` tu utils.js — dung trong routeQuery neu can parse
- 7 existing pd agents trong `.claude/agents/` — pattern cho agent spawn
- 12 existing skills + workflows — pattern cho skill/workflow structure
- 4 platform converters — extend pipeline

### Established Patterns
- Pure function modules trong bin/lib/ voi TDD
- Skill file = frontmatter + objective + guards + workflow reference
- Workflow file = process steps voi agent spawning
- Converter pipeline = process skill files, generate platform-specific output
- Snapshot testing cho converter output

### Integration Points
- `commands/pd/research.md` — new skill file
- `workflows/research.md` — new workflow file
- `bin/lib/research-store.js` — extend voi routeQuery
- `test/smoke-research-store.test.js` — extend voi routeQuery tests
- `test/snapshots/` — regenerate after adding new skill
- Converter pipeline — register new skill

</code_context>

<specifics>
## Specific Ideas

- routeQuery la pure function testable — khong doc file, chi nhan string query
- Pipeline non-blocking — Evidence Collector fail thi van tiep tuc voi Fact Checker
- Cross-validation tu dong — khong can flag, Fact Checker tu scan INDEX.md
- User chi can 1 argument (topic) — he thong lo het

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 42-lenh-pd-research*
*Context gathered: 2026-03-26*
