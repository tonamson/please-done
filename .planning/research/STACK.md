# Stack Research: v3.0 Research Squad

**Domain:** Anti-hallucination research agents voi structured storage, audit reports, workflow guards
**Researched:** 2026-03-25
**Confidence:** HIGH
**Scope:** CHI nhung thu CAN THEM cho v3.0. Stack hien tai (Node.js 18+, CommonJS, zero runtime deps, 30+ JS modules, 601+ tests, node:test runner, 5 agent definitions, evidence-protocol.js, session-manager.js, resource-config.js) da validated va KHONG re-research.

## Quyet Dinh Tong Quat

**KHONG them bat ky runtime dependency nao.** v3.0 Research Squad xay dung hoan toan bang:

1. **Research agent definition files** (`commands/pd/agents/pd-evidence-collector.md`, `pd-fact-checker.md`) — Claude Code native subagent format, mo rong pattern tu v2.1
2. **Workflow markdown moi** (`workflows/research.md`) — huong dan AI thu thap + xac minh evidence
3. **Skill definition moi** (`commands/pd/research.md`) — lenh `pd research` entry point
4. **Pure function JS modules** (`bin/lib/`) — research storage parser, audit report generator, confidence scorer
5. **Guard reference files** (`references/guard-research.md`, `references/guard-evidence.md`) — micro-templates cho workflow enforcement
6. **Markdown storage** (`.planning/research/internal/`, `.planning/research/external/`, `.planning/research/INDEX.md`) — structured file hierarchy

Ly do KHONG them dependency:
- Du an co ZERO runtime dependencies — thiet ke co chu dich (constraint tu PROJECT.md)
- Tat ca chuc nang moi la text processing (parse markdown, validate structure, score confidence) — Node.js built-in du
- Pattern da duoc chung minh o v2.1: evidence-protocol.js, truths-parser.js, session-manager.js deu la pure functions khong can dependency
- Research storage = markdown files phan loai — KHONG can database

## Recommended Stack

### Agent Definitions (MOI — 2 agents cho Research Squad)

| Agent File | Tier/Model | Purpose | Tools |
|------------|-----------|---------|-------|
| `commands/pd/agents/pd-evidence-collector.md` | `builder` (sonnet) | Thu thap evidence tu codebase (internal) va documentation (external). Ghi structured research findings. | Read, Glob, Grep, Bash, mcp__context7__resolve-library-id, mcp__context7__query-docs |
| `commands/pd/agents/pd-fact-checker.md` | `scout` (haiku) | Xac minh claims tu evidence collector. Cross-reference nhieu nguon. Gan confidence level. | Read, Glob, Grep, mcp__context7__resolve-library-id, mcp__context7__query-docs |

**Tai sao chon nhu vay:**
- **Evidence Collector = sonnet (builder)** vi can doc code, tra cuu docs, tong hop findings — can suy luan trung binh, tuong tu pd-code-detective
- **Fact Checker = haiku (scout)** vi chi can cross-reference claims voi docs/code — don gian, nhanh, re, tuong tu pd-doc-specialist
- **Chi 2 agents** thay vi nhieu hon vi: (1) pipeline don gian = it loi hon, (2) 2 la du cho collect -> verify, (3) giu nhat quan voi RESOURCE_LIMITS.maxConcurrentAgents = 2

**Tai sao KHONG them WebSearch/WebFetch vao agent tools:**
- WebSearch va WebFetch la tools cua session chinh (orchestrator), KHONG phai cua subagents
- Subagents hoat dong trong sandbox voi tool restriction — chi dung tools trong `allowed-tools`
- Orchestrator co the thu thap web results TRUOC roi truyen noi dung vao agent qua prompt context
- Giu agents tap trung vao codebase analysis va doc verification — khong phan tan

### Module JS Moi Can Tao

| Module | File | Purpose | Pattern | Inputs/Outputs |
|--------|------|---------|---------|----------------|
| Research Storage | `bin/lib/research-storage.js` | Parse/validate `.planning/research/` hierarchy, tao INDEX.md, phan loai internal/external | Pure function, tuong tu session-manager.js | Input: directory listing + file contents. Output: structured index, validation warnings |
| Audit Reporter | `bin/lib/audit-reporter.js` | Tao bao cao audit tu research findings voi metadata, evidence links, confidence scoring | Pure function, tuong tu report-filler.js | Input: research findings array. Output: formatted markdown report |
| Confidence Scorer | `bin/lib/confidence-scorer.js` | Cham diem confidence cho tung claim dua tren so nguon, do tin cay, do moi | Pure function, tuong tu mermaid-validator.js | Input: claim object voi sources. Output: { level: HIGH/MEDIUM/LOW, reason, score } |

**Tai sao 3 modules rieng biet thay vi 1 module lon:**
- Nhat quan voi du an: moi module 1 trach nhiem (evidence-protocol.js, truths-parser.js, session-manager.js deu nhu vay)
- Testable doc lap: research-storage test khong phu thuoc confidence-scorer
- Composable: audit-reporter goi confidence-scorer, research-storage cung cap data cho ca hai

### Module Hien Co Can Mo Rong

| Module | File | Thay Doi | Ly Do |
|--------|------|---------|-------|
| evidence-protocol.js | `bin/lib/evidence-protocol.js` | Them OUTCOME_TYPES cho research outcomes: `verified`, `unverified`, `contradicted` | Research agents can outcome types khac voi debug agents. Mo rong OUTCOME_TYPES la backward-compatible (existing types khong bi anh huong). |
| resource-config.js | `bin/lib/resource-config.js` | Them 2 agent moi vao AGENT_REGISTRY: pd-evidence-collector (builder), pd-fact-checker (scout) | De test verify agent config nhat quan voi agent files. Pattern da co tu v2.1. |
| plan-checker.js | `bin/lib/plan-checker.js` | Them CHECK-06: Research Gate — kiem tra plan co reference den research findings khi claim ve thu vien/pattern | Workflow Guard: Plan-Gate. Bat buoc plan phai dan chung research khi claim ve technology. |
| utils.js | `bin/lib/utils.js` | KHONG thay doi | parseFrontmatter, assembleMd da du cho modules moi. |

### Skill Definition Moi

| File | Purpose | Pattern |
|------|---------|---------|
| `commands/pd/research.md` | Lenh `pd research` — entry point cho research workflow | Tuong tu commands/pd/plan.md: YAML frontmatter + guards + context + execution_context + process |

### Workflow Moi

| File | Purpose | Pattern |
|------|---------|---------|
| `workflows/research.md` | Quy trinh research day du: detect context -> collect evidence -> verify -> store -> report | Tuong tu workflows/plan.md: buoc-by-buoc instructions cho AI |

### Guard Reference Files Moi

| File | Purpose | Pattern |
|------|---------|---------|
| `references/guard-research.md` | Kiem tra `.planning/research/INDEX.md` ton tai truoc khi plan reference research | Tuong tu guard-context.md: 1-2 dong checklist |
| `references/guard-evidence.md` | Kiem tra research finding co confidence level va source truoc khi dung trong plan | Tuong tu guard-context7.md: kiem tra tool hoat dong |

### Research Storage Format (MOI — .planning/research/)

```
.planning/research/
  INDEX.md                    # Danh muc tat ca research findings, auto-generated
  internal/                   # Findings tu codebase hien tai
    INT-001-auth-flow.md      # Danh so, slug, structured
    INT-002-db-schema.md
  external/                   # Findings tu thu vien/docs ben ngoai
    EXT-001-nextjs-15.md
    EXT-002-prisma-6.md
  audits/                     # Bao cao audit tong hop
    AUDIT-2026-03-25.md
```

**Format cho moi research finding:**

```markdown
---
id: EXT-001
type: external
topic: Next.js 15 App Router
sources:
  - url: https://nextjs.org/docs/app
    type: official-docs
    accessed: 2026-03-25
  - library: nextjs
    query: "app router migration"
    tool: context7
confidence: HIGH
created: 2026-03-25
updated: 2026-03-25
---

## Phat hien chinh

[Noi dung cu the, khong phai y kien]

## Bang chung

1. [Source 1] — [trich dan cu the]
2. [Source 2] — [trich dan cu the]

## Ap dung cho du an

[Lien ket cu the den codebase hien tai]

## Audit Log

| Thoi gian | Agent | Hanh dong | Ket qua |
|-----------|-------|-----------|---------|
| 2026-03-25T10:00:00Z | pd-evidence-collector | Thu thap | 3 sources found |
| 2026-03-25T10:01:00Z | pd-fact-checker | Xac minh | 2/3 verified -> HIGH |
```

**Tai sao format nay:**
- **YAML frontmatter**: parseable boi parseFrontmatter() da co trong utils.js — KHONG can parser moi
- **Danh so ID (INT-001, EXT-001)**: traceable, dan chung duoc tu PLAN.md (vd: "Theo EXT-001, Next.js 15...")
- **Sources array**: moi claim co nguon cu the — chong hallucination core
- **Confidence level**: HIGH/MEDIUM/LOW — score tu confidence-scorer.js
- **Audit Log bang**: timestamp + agent + action + result — audit trail day du
- **internal/ vs external/**: phan loai ro rang — codebase findings vs library/external findings

**Tai sao KHONG dung JSON hoac database:**
- Markdown: AI agents doc/ghi tu nhien, git-trackable, nguoi dung review truc tiep
- Nhat quan voi evidence files trong `.planning/debug/` (v2.1 pattern)
- parseFrontmatter() trong utils.js da parse duoc YAML frontmatter — zero effort
- INDEX.md la "database" — auto-generated, grep-able, link-able

### INDEX.md Format

```markdown
# Research Index

**Du an:** [ten du an]
**Cap nhat:** 2026-03-25

## Internal Findings

| ID | Topic | Confidence | Cap nhat |
|----|-------|------------|----------|
| INT-001 | Auth flow architecture | HIGH | 2026-03-25 |
| INT-002 | Database schema patterns | MEDIUM | 2026-03-25 |

## External Findings

| ID | Topic | Confidence | Cap nhat |
|----|-------|------------|----------|
| EXT-001 | Next.js 15 App Router | HIGH | 2026-03-25 |
| EXT-002 | Prisma 6 migration | LOW | 2026-03-25 |

## Audit History

| Ngay | Findings | Verified | Confidence TB |
|------|----------|----------|---------------|
| 2026-03-25 | 4 | 3/4 | MEDIUM |
```

### Confidence Scoring Logic

```javascript
// bin/lib/confidence-scorer.js — pure function, khong side effects

/**
 * Cham diem confidence cho 1 claim.
 *
 * Quy tac:
 * - HIGH: >= 2 nguon, it nhat 1 la official-docs hoac context7
 * - MEDIUM: 1 nguon official-docs/context7, hoac >= 2 nguon web-search
 * - LOW: chi 1 nguon web-search, hoac khong co nguon xac minh
 *
 * @param {{ sources: Array<{type: string, verified: boolean}> }} claim
 * @returns {{ level: 'HIGH'|'MEDIUM'|'LOW', score: number, reason: string }}
 */
function scoreConfidence(claim) {
  // ...logic dua tren source types va verification status
}

// Source type priority:
// 1. context7 (thu vien docs chinh thuc, version-aware)
// 2. official-docs (URL docs chinh thuc)
// 3. codebase (tim trong code hien tai)
// 4. web-search (ket qua search — can verify)
// 5. training-data (AI training — thap nhat, can flag)
```

**Tai sao rule-based thay vi LLM-as-judge:**
- PROJECT.md constraint: "LLM-as-judge review — plan already in context, calling another LLM is circular"
- Rule-based = deterministic, testable, reproducible
- Source hierarchy ro rang: Context7 > official docs > codebase > web search > training data
- Confidence = so nguon x chat luong nguon — tinh duoc bang arithmetic

### Workflow Guards

**3 loai guard cho v3.0:**

| Guard | Loai | Noi ap dung | Co che |
|-------|------|-------------|--------|
| **Plan-Gate** | Blocking | pd:plan workflow | CHECK-06 trong plan-checker.js: neu plan claim ve thu vien/pattern MA KHONG reference research finding -> ISSUES FOUND |
| **Mandatory Suggestion** | Non-blocking | pd:write-code workflow | Khi write-code gap claim chua co research -> warning: "Claim '[X]' chua co research finding. Chay `pd research` de xac minh." |
| **Strategy Injection** | Auto-inject | pd:plan workflow | Khi research findings ton tai -> tu dong inject vao plan context: "Research da xac minh: [danh sach findings]" |

**Tai sao 3 loai rieng biet:**
- **Plan-Gate (blocking)**: Plan la noi rui ro hallucination cao nhat — claim sai o plan -> code sai ca milestone. PHAI block.
- **Mandatory Suggestion (non-blocking)**: Write-code dang chay — khong nen break flow. Warning du de AI tu dieu chinh.
- **Strategy Injection (auto-inject)**: Research findings da xac minh -> tu dong dung, khong can nhac lai.

**Implementation pattern:**
- Plan-Gate: them CHECK-06 vao plan-checker.js (tuong tu CHECK-04 Truth coverage, CHECK-05 Logic coverage)
- Mandatory Suggestion: them guard micro-template `references/guard-evidence.md`, inject vao write-code.md `<guards>` section
- Strategy Injection: them `@references/research-context.md` vao plan.md `<context>` section, file nay doc `.planning/research/INDEX.md`

### Core Technologies (Da Co — KHONG them moi)

| Technology | Version | Purpose | Vai tro trong v3.0 |
|------------|---------|---------|---------------------|
| Claude Code Subagents | v2.1.32+ | Agent spawning, model routing | Evidence Collector + Fact Checker agents |
| Node.js built-in `node:test` | Node 18+ | Test runner | Test 3 module moi |
| Node.js built-in `fs`, `path` | Node 18+ | File I/O (chi o CLI wrappers) | Doc/ghi research files, INDEX.md |
| Context7 MCP | - | Library docs | Evidence Collector tra cuu docs thu vien |
| FastCode MCP | - | Code analysis | Evidence Collector phan tich codebase |
| parseFrontmatter() | bin/lib/utils.js | YAML frontmatter parser | Parse research finding files |

## Chi Tiet Ky Thuat Tung Thanh Phan

### 1. Research Agent Spawning Pattern

**Luong chinh:**

```
pd research [topic]
  |
  v
Orchestrator detect context:
  - topic lien quan den codebase? -> internal research
  - topic lien quan den thu vien? -> external research
  - ca hai? -> ca hai (sequential)
  |
  v
Buoc 1: Evidence Collector (sonnet) — Thu thap
  -> Doc codebase (Glob, Grep, Read) cho internal
  -> Tra cuu Context7 cho external
  -> Ghi findings vao internal/ hoac external/
  |
  v
Buoc 2: Fact Checker (haiku) — Xac minh
  -> Doc findings tu Buoc 1
  -> Cross-reference voi nguon khac
  -> Gan confidence level (scoreConfidence)
  -> Cap nhat finding file voi verification results
  |
  v
Buoc 3: Orchestrator — Tong hop
  -> Cap nhat INDEX.md
  -> Tao audit report neu can
  -> Hien ket qua cho user
```

**Tai sao 2-agent pipeline thay vi 1 agent lam tat ca:**
- Tach biet thu thap vs xac minh = kiem soat hallucination tot hon
- Evidence Collector co the "hallucinate" — Fact Checker la checkpoint
- Pattern nay la co so cua chong hallucination: KHONG tin 1 nguon duy nhat

### 2. Anti-Hallucination Enforcement

**5 lop bao ve:**

| Lop | Co che | Implementation |
|-----|--------|----------------|
| 1. Source requirement | Moi claim PHAI co >= 1 source | evidence-protocol.js validation — missing source = warning |
| 2. Confidence scoring | Tu dong cham diem dua tren source quality | confidence-scorer.js pure function |
| 3. Fact checking agent | Agent rieng xac minh claims | pd-fact-checker.md subagent |
| 4. Plan gate | Plan khong duoc claim khong co research | CHECK-06 trong plan-checker.js |
| 5. Audit trail | Moi hanh dong ghi log | Audit Log table trong moi finding file |

**Tai sao 5 lop thay vi 1:**
- Hallucination la KHONG THE loai bo hoan toan (nghien cuu 2025 chung minh: hallucinations are structurally inevitable under existing LLM architectures)
- Giai phap: DETECT + CONTAIN + MITIGATE — nhieu lop tang kha nang bat
- Moi lop bat loai loi khac: missing source vs low confidence vs contradicted claim vs plan-level vs audit

### 3. CHECK-06: Research Gate (Plan-Gate)

```javascript
// Them vao plan-checker.js

/**
 * CHECK-06: Research Gate
 * Kiem tra plan co reference research findings khi claim ve thu vien/pattern.
 *
 * Rules:
 * - Neu plan mention ten thu vien/framework KHONG co trong package.json/tech stack
 *   MA KHONG reference research finding (INT-xxx, EXT-xxx) -> ISSUES FOUND
 * - Severity: configurable (default WARN, co the set BLOCK)
 * - Skip: neu khong co .planning/research/INDEX.md (research chua chay)
 *
 * @param {string} planContent - Noi dung PLAN.md
 * @param {string} indexContent - Noi dung INDEX.md (null neu khong co)
 * @param {object} options - { severity: 'WARN'|'BLOCK' }
 * @returns {{ status: 'PASS'|'WARN'|'BLOCK', issues: string[] }}
 */
function checkResearchGate(planContent, indexContent, options) {
  // ...
}
```

**Tai sao default WARN thay vi BLOCK:**
- Nhat quan voi CHECK-05 (Logic Coverage) — default WARN, configurable
- BLOCK se lam gian doan workflow khi chua chay research — can trai nghiem mem
- Project co the opt-in BLOCK khi muon strict enforcement

## Alternatives Considered

| Recommended | Alternative | Tai Sao Khong |
|-------------|-------------|---------------|
| Markdown files phan loai (internal/external) | SQLite FTS cho search | Binary dependency, pham constraint "no bundler". Markdown grep-able, git-trackable. So luong findings thuong < 50/du an — search O(n) du nhanh. |
| 2 research agents (Collector + Checker) | 1 agent lam ca hai | Tach biet thu thap vs xac minh la nguyen tac co ban chong hallucination. 1 agent tu xac minh minh = khong co value. |
| Rule-based confidence scoring | LLM-based scoring | PROJECT.md cam "LLM-as-judge". Rule-based = deterministic, testable, 0 token cost. |
| CHECK-06 trong plan-checker.js | Guard markdown rieng | plan-checker.js da co 8 checks, them 1 check = nhat quan. Infrastructure da co (check registry, dynamic PASS table). |
| YAML frontmatter cho research findings | JSON metadata file rieng | parseFrontmatter() da co trong utils.js. 1 file = metadata + content — don gian hon 2 files. |
| Danh so ID (INT-001, EXT-001) | UUID hoac hash | ID ngan, doc duoc, dan chung duoc trong plan. UUID dai va khong co nghia. |
| Audit Log bang trong finding file | Audit log file rieng | 1 file = tat ca thong tin — khong can mo nhieu file. Pattern nhat quan voi evidence files v2.1. |
| Guard micro-templates (references/) | Inline guards trong skill files | Du an DA co pattern guard micro-templates (guard-context.md, guard-context7.md, guard-fastcode.md). Reusable across skills. |

## What NOT to Use

| Avoid | Tai Sao | Dung Thay The |
|-------|---------|---------------|
| Embedding/vector database cho research search | Them dependency lon (chromadb, faiss), overkill cho < 50 findings/du an, pham "no bundler" constraint | Grep + structured INDEX.md — du cho scale cua du an nay |
| LLM-as-judge cho fact checking | PROJECT.md cam ro: "LLM-as-judge review — plan already in context, calling another LLM is circular" | Rule-based confidence scoring + source counting |
| External API cho fact verification | Them network dependency, rate limit risk, cost, khong deterministic | Context7 MCP (da co, stable, version-aware) + codebase analysis |
| Phuc tap hoa agent pipeline (3+ agents) | Them agent = them token cost, them failure points, them maintenance. 2 agents du cho collect -> verify. | 2 agents: Evidence Collector (sonnet) + Fact Checker (haiku) |
| Real-time research updates | Research la snapshot tai 1 thoi diem, khong phai live feed. Auto-refresh se confuse workflow. | Manual trigger: `pd research [topic]`. Cap nhat khi can. |
| BibTeX/CSL citation format | Over-engineering cho AI coding workflow. BibTeX can parser library. | Don gian: source URL + type + accessed date trong YAML frontmatter |

## Stack Patterns Theo Thanh Phan

**Neu can them research finding moi:**
- Tao file trong `internal/` hoac `external/` voi danh so ID tiep theo
- YAML frontmatter: id, type, topic, sources, confidence, created, updated
- Body: Phat hien chinh, Bang chung, Ap dung cho du an, Audit Log
- Chay research-storage.js de cap nhat INDEX.md

**Neu can them guard moi:**
- Tao `references/guard-[ten].md` voi 1-2 dong checklist
- Inject vao skill file's `<guards>` section voi `@references/guard-[ten].md`
- Guard la non-blocking (warning) tru khi explicitly set blocking

**Neu can them check moi cho plan-checker:**
- Them function `check[TenCheck]` vao plan-checker.js
- Register vao check name mapping (dynamic PASS table tu Phase 13)
- Default severity WARN, configurable qua options
- Viet test truoc (TDD — nhat quan voi 154 existing plan-checker tests)

**Neu can them research agent moi:**
- Tao `commands/pd/agents/pd-[ten].md` voi YAML frontmatter
- Them vao AGENT_REGISTRY trong resource-config.js
- Giu tools allowlist toi thieu (principle of least privilege)
- Chon tier phu hop: scout (haiku) cho don gian, builder (sonnet) cho phuc tap

## Version Compatibility

| Component | Compatible Voi | Ghi Chu |
|-----------|----------------|---------|
| Agent files moi | Claude Code v2.1.32+ | Cung format voi 5 agents da co tu v2.1 |
| Module JS moi | Node.js >= 18 | Chi dung built-in APIs |
| CHECK-06 trong plan-checker | plan-checker.js existing | Mo rong check registry, khong break existing checks |
| Research storage format | parseFrontmatter() existing | YAML frontmatter — da duoc parse boi utils.js |
| Guard micro-templates | Existing guard pattern | Tuong tu guard-context.md, guard-fastcode.md |
| INDEX.md | Markdown standard | Khong can parser dac biet |

## Platform Transpilation Impact

**TUONG TU v2.1:** Research agents la Claude Code-specific. Non-Claude platforms fallback:

- Agent files (`commands/pd/agents/pd-evidence-collector.md`, `pd-fact-checker.md`) KHONG can transpile
- Research workflow (`workflows/research.md`) VAN transpile — phan agent dispatch bi skip tren platform khac
- Pure function JS modules (`bin/lib/research-storage.js`, `audit-reporter.js`, `confidence-scorer.js`) platform-independent
- Research storage format (`.planning/research/`) platform-independent — chi la markdown files
- Backward compatibility: neu khong co research dir, plan workflow chay binh thuong (CHECK-06 skip khi khong co INDEX.md)

## Tong Ket

| Metric | Gia Tri |
|--------|---------|
| Runtime dependency moi | 0 |
| Agent definition files moi | 2 (evidence-collector, fact-checker) |
| Module JS moi | 3 (research-storage, audit-reporter, confidence-scorer) |
| Module JS mo rong | 3 (evidence-protocol, resource-config, plan-checker) |
| Skill definition moi | 1 (commands/pd/research.md) |
| Workflow file moi | 1 (workflows/research.md) |
| Guard reference files moi | 2 (guard-research.md, guard-evidence.md) |
| Storage directories moi | 3 (internal/, external/, audits/) |
| Test files moi | 3+ (1 per module moi) |
| Checks moi trong plan-checker | 1 (CHECK-06 Research Gate) |

## Sources

- Codebase analysis: `bin/lib/evidence-protocol.js`, `bin/lib/resource-config.js`, `bin/lib/plan-checker.js`, `bin/lib/session-manager.js`, `bin/lib/utils.js` — existing patterns va APIs — HIGH confidence
- Codebase analysis: `commands/pd/agents/pd-*.md` (5 existing agent definitions), `references/guard-*.md` (4 existing guard templates) — existing conventions — HIGH confidence
- `.planning/PROJECT.md` — Project constraints ("No Build Step", "Node.js 16.7+", "LLM-as-judge circular", backward compatibility) — HIGH confidence
- `.planning/research/STACK.md` (v2.1) — Previous stack research, zero-dependency pattern, agent tier system — HIGH confidence
- [Anti-hallucination research 2025-2026](https://www.lakera.ai/blog/guide-to-hallucinations-in-large-language-models) — Hallucinations structurally inevitable, must detect+contain+mitigate — MEDIUM confidence
- [Structured markdown for AI interpretation](https://blog.trysteakhouse.com/blog/syntax-for-citations-using-markdown-patterns-force-ai-extraction) — Headers, lists, tables create parseable "chunks" — MEDIUM confidence
- [AI coding workflow best practices 2026](https://addyosmani.com/blog/ai-coding-workflow/) — Spec-first, review AI-written code, strong linting/testing guards — MEDIUM confidence

---
*Stack research for: v3.0 Research Squad trong please-done*
*Researched: 2026-03-25*
