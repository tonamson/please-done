# Stack Research

**Domain:** Dieu phoi da Agent cho dieu tra loi (Detective Orchestrator v2.1)
**Researched:** 2026-03-24
**Confidence:** HIGH
**Scope:** CHI nhung thu CAN THEM cho v2.1. Stack hien tai (Node.js 18+, CommonJS, zero runtime deps, 12 JS library modules, 601 tests, node:test runner) da validated va KHONG re-research.

## Quyet Dinh Tong Quat

**KHONG them bat ky runtime dependency nao.** v2.1 Detective Orchestrator xay dung hoan toan bang:

1. **Agent definition files** (`.claude/agents/pd-*.md`) — Claude Code native subagent format, YAML frontmatter + markdown body
2. **Workflow markdown moi/mo rong** (`workflows/fix-bug.md`, `workflows/detective-orchestrator.md`) — huong dan AI orchestrate 5 buoc
3. **Pure function JS modules** (`bin/lib/`) — xu ly session persistence, evidence parsing, bug memory
4. **Markdown files lam session storage** (`.planning/debug/`) — khong can database

Ly do KHONG them dependency:
- Du an co ZERO runtime dependencies — thiet ke co chu dich
- Claude Code da co native subagent infrastructure (model routing, tool restriction, memory, context isolation)
- Session persistence = markdown files (du an da dung pattern nay cho SESSION_*.md, BUG_*.md)
- "Agent spawning" = Claude Code tu dispatch dua tren agent `description` — khong can code Node.js
- Them dependency = pham constraint "No Build Step", "pure scripts, no bundler"

## Recommended Stack

### Agent Definitions (MOI — dung Claude Code native format)

| Agent File | Tier/Model | Purpose | Tools |
|------------|-----------|---------|-------|
| `.claude/agents/pd-bug-janitor.md` | `haiku` | Loc log, trich xuat 5 trieu chung vang, truy hoi bug history | Read, Glob, Grep, AskUserQuestion, Bash |
| `.claude/agents/pd-code-detective.md` | `sonnet` | Truy vet nguyen nhan trong code bang FastCode + Read | Read, Glob, Grep, mcp__fastcode__code_qa |
| `.claude/agents/pd-doc-specialist.md` | `haiku` | Tra cuu Context7 tim breaking changes/known issues | mcp__context7__resolve-library-id, mcp__context7__query-docs |
| `.claude/agents/pd-repro-engineer.md` | `sonnet` | Viet reproduction test tu trieu chung + evidence | Read, Write, Edit, Bash |
| `.claude/agents/pd-fix-architect.md` | `opus` | Tong hop evidence, thiet ke Fix Plan, danh gia regression | Read, Write, Edit, Bash, Glob, Grep |

**Tai sao chon nhu vay:**
- **Janitor = haiku** vi chi loc text + hoi user — khong can suy luan phuc tap, tiet kiem token
- **Detective = sonnet** vi can truy vet luong code, phan tich call chain — can suy luan trung binh
- **DocSpec = haiku** vi chi goi MCP tools va tom tat ket qua — don gian
- **Repro = sonnet** vi can viet test code co logic — can kha nang code
- **Architect = opus** vi can tong hop nhieu nguon evidence, quyet dinh chien luoc — can suy luan sau

### Agent Frontmatter Format (CONFIRMED — tu tai lieu chinh thuc Claude Code)

```yaml
---
name: pd-bug-janitor
description: Nhan vien ve sinh boi canh — Loc log rac va trich xuat trieu chung vang. Dung khi bat dau dieu tra loi moi.
tools: Read, Glob, Grep, AskUserQuestion, Bash
model: haiku
memory: project
effort: low
maxTurns: 15
---
```

**Cac truong frontmatter ho tro (HIGH confidence — xac minh tu docs chinh thuc):**

| Field | Required | Muc dich | Gia tri cho v2.1 |
|-------|----------|---------|-------------------|
| `name` | Co | ID duy nhat, lowercase + hyphen | `pd-bug-janitor`, `pd-code-detective`, v.v. |
| `description` | Co | Claude dung de quyet dinh khi nao dispatch | Mo ta nhiem vu bang tieng Viet |
| `tools` | Khong | Allowlist tools | Tuy agent — xem bang tren |
| `disallowedTools` | Khong | Denylist tools | Dung cho Architect (cam Agent de tranh nesting) |
| `model` | Khong | `haiku`, `sonnet`, `opus`, `inherit`, hoac full model ID | Theo tier mapping |
| `maxTurns` | Khong | Gioi han so luot agent chay | Janitor: 15, Detective: 25, Architect: 30 |
| `memory` | Khong | `user`, `project`, `local` — persistent cross-session | `project` — bug knowledge tich luy theo du an |
| `effort` | Khong | `low`, `medium`, `high`, `max` | haiku: low, sonnet: medium, opus: high |
| `skills` | Khong | Skills nap vao context agent | Nap conventions, prioritization |
| `permissionMode` | Khong | `default`, `acceptEdits`, `dontAsk`, `bypassPermissions`, `plan` | Architect: `acceptEdits`, Scout: `plan` |
| `background` | Khong | `true` de chay background | DocSpec: `true` (chay song song voi Detective) |
| `isolation` | Khong | `worktree` de co repo rieng | KHONG dung — tat ca agent can cung working directory |
| `hooks` | Khong | Lifecycle hooks scoped cho agent | Xem phan Hooks ben duoi |
| `mcpServers` | Khong | MCP servers rieng cho agent | FastCode cho Detective, Context7 cho DocSpec |

### Session Persistence Format (MO RONG tu v1.5)

| File | Muc dich | Format | Moi/Mo rong |
|------|---------|--------|-------------|
| `.planning/debug/SESSION_[ten].md` | Phien dieu tra chinh | Markdown co structured sections | Mo rong — them sections cho multi-agent evidence |
| `.planning/debug/evidence_janitor.md` | Bao cao cua Janitor agent | Markdown — 5 trieu chung + historical bugs | MOI |
| `.planning/debug/evidence_code.md` | Bao cao cua Detective agent | Markdown — root cause hoac inconclusive | MOI |
| `.planning/debug/evidence_docs.md` | Bao cao cua DocSpec agent | Markdown — breaking changes, known issues | MOI |
| `.planning/debug/evidence_repro.md` | Bao cao cua Repro agent | Markdown — test file path, pass/fail | MOI |
| `.planning/debug/evidence_architect.md` | Bao cao cua Architect agent | Markdown — tong hop, fix plan, regression | MOI |
| `.planning/bugs/history.jsonl` | Bug memory — lich su bug toan du an | JSONL — 1 dong/bug, searchable | MOI |

**Tai sao Markdown + JSONL thay vi SQLite/JSON:**
- Markdown: nguoi dung doc duoc truc tiep, AI agent doc/ghi tu nhien, git-trackable, khong can parser
- JSONL: append-only (khong can doc toan bo file de them bug moi), grep-able, 1 dong = 1 record
- SQLite: them binary dependency, khong git-friendly, khong doc duoc truc tiep
- JSON array: phai doc + parse toan bo file moi khi append — O(n) voi n bugs

### Module JS Moi Can Tao

| Module | File | Purpose | Inputs/Outputs |
|--------|------|---------|----------------|
| Bug Memory | `bin/lib/bug-memory.js` | Ghi/truy hoi bug history, phat hien regression | Input: bug data object. Output: matched historical bugs, regression warnings |
| Evidence Parser | `bin/lib/evidence-parser.js` | Parse cac evidence_*.md thanh structured data | Input: evidence file contents. Output: parsed evidence objects voi confidence levels |
| Resource Config | `bin/lib/resource-config.js` | Cau hinh tier mapping, resource limits | Input: none (export constants). Output: TIER_MAP, MODEL_ALIASES, RESOURCE_LIMITS |

### Module Hien Co Can Mo Rong

| Module | File | Thay Doi | Ly Do |
|--------|------|---------|-------|
| repro-test-generator.js | `bin/lib/repro-test-generator.js` | Nhan evidence object thay vi raw symptoms | Repro agent goi voi parsed evidence tu evidence-parser |
| regression-analyzer.js | `bin/lib/regression-analyzer.js` | Them mode: nhan evidence_code.md content | Architect agent dung ket qua tu Detective thay vi goi FastCode truc tiep |
| debug-cleanup.js | `bin/lib/debug-cleanup.js` | Khong thay doi | Giu nguyen — goi tu workflow sau khi Architect xong |
| logic-sync.js | `bin/lib/logic-sync.js` | Khong thay doi | Giu nguyen — goi tu workflow sau khi fix |

### Core Technologies (Da Co — KHONG them moi)

| Technology | Version | Purpose | Vai tro trong v2.1 |
|------------|---------|---------|---------------------|
| Claude Code Subagents | v2.1.32+ | Agent spawning, model routing, context isolation | **CORE** — toan bo detective orchestration dua tren native subagent system |
| Claude Code Agent Memory | v2.1.33+ | Persistent knowledge across sessions | `memory: project` cho bug history retention |
| Node.js built-in `node:test` | Node 18+ | Test runner | Test cac module moi |
| Node.js built-in `fs`, `path` | Node 18+ | File I/O (chi o CLI wrappers) | Doc/ghi evidence files, bug history |
| FastCode MCP | - | Code analysis | Detective agent truy vet code |
| Context7 MCP | - | Library docs | DocSpec agent tra cuu docs |

## Chi Tiet Ky Thuat Tung Thanh Phan

### 1. Agent Spawning Pattern

**Cach orchestrator dispatch agents (HIGH confidence — xac minh tu docs chinh thuc):**

Claude Code tu dong dispatch subagent dua tren `description` field. Orchestrator workflow chi can MO TA nhiem vu, Claude Code se match voi agent phu hop.

```markdown
<!-- Trong workflow fix-bug.md — Buoc 1 -->
## Buoc 1: Janitor — Thu thap trieu chung
Goi pd-bug-janitor de loc log va trich xuat 5 trieu chung vang.
Agent se ghi ket qua vao `.planning/debug/evidence_janitor.md`.
```

**Pattern: Chuoi tuần tu (Sequential Chaining)**
- Orchestrator (main session) dispatch agent A → doi ket qua
- Doc evidence file cua A → dispatch agent B voi context tu A
- Lặp cho den khi tat ca evidence du

**Pattern: Song song cho Scout tier (Parallel)**
- Detective + DocSpec chay DONG THOI (ca hai la read-only, khong xung dot)
- Detective: `background: false` (can ket qua de tiep)
- DocSpec: `background: true` (bo sung, khong blocking)

**RANG BUOC QUAN TRONG:** Subagents KHONG THE spawn subagents khac. Chi main session (orchestrator) co the dispatch. Do do workflow phai la "hub-and-spoke" — orchestrator la trung tam.

### 2. Model Tier Routing

**Cau hinh trong `bin/lib/resource-config.js`:**

```javascript
'use strict';

// Tier -> Model mapping
// haiku: nhanh, re, cho viec don gian (loc log, tra cuu docs)
// sonnet: can doi kha nang va toc do (code analysis, test writing)
// opus: suy luan sau (tong hop evidence, thiet ke fix plan)
const TIER_MAP = {
  scout:     { model: 'haiku',  effort: 'low',    maxTurns: 15 },
  builder:   { model: 'sonnet', effort: 'medium', maxTurns: 25 },
  architect: { model: 'opus',   effort: 'high',   maxTurns: 30 },
};

// Agent -> Tier mapping
const AGENT_TIERS = {
  'pd-bug-janitor':      'scout',
  'pd-doc-specialist':   'scout',
  'pd-code-detective':   'builder',
  'pd-repro-engineer':   'builder',
  'pd-fix-architect':    'architect',
};

// Resource safety rules
const RESOURCE_LIMITS = {
  maxConcurrentAgents: 2,    // Toi da 2 agent chay cung luc
  heavyLockModels: ['opus'], // Opus chi 1 instance tai 1 thoi diem
  downgradeRules: {
    // Neu opus khong kha dung (rate limit) -> sonnet
    opus: 'sonnet',
    // Neu sonnet khong kha dung -> haiku
    sonnet: 'haiku',
  },
};

module.exports = { TIER_MAP, AGENT_TIERS, RESOURCE_LIMITS };
```

**TAI SAO resource-config la JS module thay vi hardcode trong agent files:**
- Agent files (.md) DA CO `model:` field — do la cau hinh CHINH
- JS module cung cap REFERENCE cho workflow docs va tests
- Cho phep test: verify agent files co model dung voi TIER_MAP
- Cho phep downgrade logic: khi rate limit, workflow biet chon model thay the

### 3. Session Persistence — Evidence Format

**Evidence file template (moi agent ghi 1 file):**

```markdown
# Evidence: [Agent Name]
> Agent: pd-code-detective | Model: sonnet | Thoi gian: [timestamp]
> Trang thai: ROOT CAUSE FOUND | INVESTIGATION INCONCLUSIVE

## Phat hien
- **File:** `src/auth/jwt.service.ts:42`
- **Ham:** `validateToken()`
- **Van de:** [mo ta cu the]

## Bang chung
1. [file:dong] — [phat hien cu the]
2. [file:dong] — [phat hien cu the]

## Kết luận
[ROOT CAUSE hoac ly do inconclusive]

## Metadata
- Thoi gian chay: [X]s
- Tools su dung: [Read x5, Grep x3, FastCode x2]
- Confidence: HIGH/MEDIUM/LOW
```

**Tai sao structured markdown thay vi JSON:**
- AI agents doc/ghi markdown tu nhien — la native format cua Claude
- Nguoi dung review duoc truc tiep (khong can tool)
- Git diff cho thay thay doi ro rang
- Regex parseable (cho evidence-parser.js) — `> Trang thai:`, `## Phat hien`

### 4. Bug Memory (JSONL)

**Format `.planning/bugs/history.jsonl`:**

```jsonl
{"id":"BUG_24_03_2026_14_30","title":"Login timeout","rootCause":"JWT expiry check off-by-one","files":["src/auth/jwt.ts"],"fix":"Changed <= to <","tags":["auth","jwt","off-by-one"],"date":"2026-03-24","severity":"high"}
{"id":"BUG_24_03_2026_16_45","title":"Cart empty after refresh","rootCause":"localStorage key mismatch","files":["src/store/cart.ts"],"fix":"Fixed key name","tags":["state","localStorage"],"date":"2026-03-24","severity":"medium"}
```

**Pure function API trong `bin/lib/bug-memory.js`:**

```javascript
'use strict';

// Append 1 bug vao history — append-only, khong doc toan bo file
function formatBugEntry(bugData) {
  return JSON.stringify({
    id: bugData.id,
    title: bugData.title,
    rootCause: bugData.rootCause,
    files: bugData.files,
    fix: bugData.fix,
    tags: bugData.tags,
    date: bugData.date,
    severity: bugData.severity,
  });
}

// Tim bugs lien quan tu history content
function searchBugHistory(historyContent, query) {
  if (!historyContent || !historyContent.trim()) return [];
  const lines = historyContent.trim().split('\n');
  const bugs = lines.map(line => {
    try { return JSON.parse(line); }
    catch { return null; }
  }).filter(Boolean);

  const keywords = query.toLowerCase().split(/\s+/);
  return bugs.filter(bug => {
    const searchable = [bug.title, bug.rootCause, ...bug.files, ...(bug.tags || [])].join(' ').toLowerCase();
    return keywords.some(kw => searchable.includes(kw));
  }).slice(0, 5); // Toi da 5 ket qua
}

// Phat hien regression — bug lap lai o cung file/function
function detectRegression(historyContent, currentFiles) {
  if (!historyContent || !historyContent.trim()) return [];
  const lines = historyContent.trim().split('\n');
  const bugs = lines.map(line => {
    try { return JSON.parse(line); }
    catch { return null; }
  }).filter(Boolean);

  return bugs.filter(bug =>
    bug.files.some(f => currentFiles.includes(f))
  ).map(bug => ({
    previousBug: bug.id,
    title: bug.title,
    rootCause: bug.rootCause,
    warning: `File ${bug.files.join(', ')} da tung co bug "${bug.title}" — kiem tra ky regression`,
  }));
}

module.exports = { formatBugEntry, searchBugHistory, detectRegression };
```

### 5. Orchestrator Workflow (5 buoc)

**Luong chinh trong workflow (markdown instructions cho AI):**

```
Buoc 1: Janitor (haiku) — Thu thap trieu chung
  -> Ghi evidence_janitor.md
  -> Truy hoi bug history (searchBugHistory)
  -> Neu co regression -> canh bao som

Buoc 2: Detective + DocSpec (sonnet + haiku) — Song song
  -> Detective: truy vet code, ghi evidence_code.md
  -> DocSpec: tra cuu docs (background), ghi evidence_docs.md
  -> CHO ca hai xong truoc khi tiep

Buoc 3: Repro Engineer (sonnet) — Tai hien
  -> Doc evidence_janitor + evidence_code
  -> Viet reproduction test
  -> Ghi evidence_repro.md

Buoc 4: Fix Architect (opus) — Tong hop + Fix Plan
  -> Doc TAT CA evidence files
  -> Tong hop, danh gia consistency
  -> Thiet ke Fix Plan
  -> Ghi evidence_architect.md

Buoc 5: Orchestrator — Thuc thi fix + cleanup
  -> Ap dung Fix Plan (su dung Write/Edit truc tiep)
  -> Chay debug-cleanup (9a pattern tu v1.5)
  -> Chay logic-sync (10a pattern tu v1.5)
  -> Ghi bug vao history (formatBugEntry -> append)
  -> Commit + xac nhan user
```

### 6. Agent Memory Configuration

**Dung `memory: project` cho tat ca agents (HIGH confidence):**

```yaml
# Trong moi agent file
memory: project
```

**Ket qua:** Tao thu muc `.claude/agent-memory/pd-bug-janitor/` (va tuong tu cho moi agent).

**Tai sao `project` thay vi `user` hoac `local`:**
- `project`: knowledge specific cho codebase hien tai, chia se duoc qua git — DUNG cho bug patterns cua du an cu the
- `user`: cross-project — KHONG dung vi bug patterns cua du an A khong lien quan du an B
- `local`: khong git-trackable — KHONG dung vi team can chia se bug knowledge

**Chu y:** Agent memory KHAC voi bug history JSONL:
- Agent memory: Claude Code built-in, agent tu quan ly MEMORY.md, luu general learnings
- Bug history JSONL: du an tu quan ly, structured data, searchable boi pure function

### 7. Hooks (Tuy chon — Phase sau)

**PreToolUse hook cho Architect (bao ve an toan):**

```yaml
# Trong pd-fix-architect.md
hooks:
  PreToolUse:
    - matcher: "Bash"
      hooks:
        - type: command
          command: "./bin/hooks/validate-fix-command.sh"
```

**Muc dich:** Chan cac lenh nguy hiem (git push, rm -rf, v.v.) tu Architect agent.

**Chuyen sang Phase sau vi:**
- Hooks can script rieng, testing rieng, trai qua verification
- v2.1 uu tien core orchestration truoc
- Architect da co `maxTurns` limit lam safety net co ban

## Alternatives Considered

| Recommended | Alternative | Tai Sao Khong |
|-------------|-------------|---------------|
| Claude Code native subagents (`.claude/agents/`) | Tu viet agent spawning logic bang Node.js | Claude Code DA CO infra: model routing, context isolation, tool restriction, memory. Viet lai = reinvent wheel + maintenance burden. |
| Markdown evidence files | JSON evidence files | AI agents viet markdown tu nhien hon JSON. Nguoi dung doc duoc truc tiep. Git diff ro rang. Regex parseable du chinh xac cho cac structured sections. |
| JSONL cho bug history | SQLite | Them binary dependency, khong git-friendly, khong doc duoc truc tiep. JSONL la append-only, grep-able, 1 dong = 1 record. |
| JSONL cho bug history | JSON array | Phai doc + parse toan bo file moi khi append — O(n). JSONL append la O(1). |
| `model:` trong agent frontmatter | Env var `CLAUDE_CODE_SUBAGENT_MODEL` | Env var chi set 1 model cho TAT CA subagents. Agent frontmatter cho phep model KHAC NHAU tung agent. |
| `memory: project` | Custom MEMORY.md logic | Claude Code da co built-in: tu inject 200 dong dau MEMORY.md vao system prompt, tu enable Read/Write/Edit. Khong can viet lai. |
| Hub-and-spoke (orchestrator dispatch) | Agent teams (experimental) | Agent teams yeu cau `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS`, co nhieu limitations (no session resumption, task status lag). Subagents stable va du cho workflow 5-step. |
| Sequential chaining (A -> B -> C) | Parallel all agents | Evidence co phu thuoc: Detective can Janitor output, Architect can tat ca. Chi Buoc 2 (Detective + DocSpec) chay song song duoc. |

## What NOT to Use

| Avoid | Tai Sao | Dung Thay The |
|-------|---------|---------------|
| Agent Teams (`CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS`) | Experimental, disabled by default, nhieu limitations: no session resumption, task status lag, shutdown slow, no nested teams. v2.1 can stability. | Native subagents — stable, du cho 5-step workflow |
| `isolation: worktree` cho agents | Tao git worktree rieng — tat ca agents can doc/ghi cung `.planning/debug/`. Worktree isolation se lam mat evidence sharing. | Mac dinh (cung working directory) |
| SQLite/Database cho bug history | Binary dependency, khong git-friendly, pham constraint "no bundler, pure scripts". | JSONL — append-only, text-based, grep-able |
| Custom IPC/messaging giua agents | Subagents KHONG giao tiep truc tiep (only report to main). Viet IPC = fight against platform design. | Evidence files — agents ghi file, orchestrator doc file |
| `disallowedTools` thay vi `tools` allowlist | Kho bao tri — khi Claude Code them tools moi, disallowed list co the thieu. Allowlist an toan hon. | `tools:` allowlist cho moi agent |
| `bypassPermissions` cho bat ky agent nao | Nguy hiem — skip permission prompts. Dac biet voi Architect agent co Write/Edit/Bash. | `acceptEdits` cho Architect (auto-accept file edits nhung van prompt cho Bash) |
| LLM call tu JS module | Du an cam "LLM-as-judge" (Out of Scope). Post-mortem, evidence parsing phai rule-based. | Regex parsing + rule-based logic |

## Stack Patterns Theo Thanh Phan

**Neu can them agent moi:**
- Tao `.claude/agents/pd-[ten].md` voi YAML frontmatter
- `description` phai mo ta RO khi nao agent duoc dung (Claude dua vao de dispatch)
- `tools` = allowlist CU THE — khong de mac dinh (inherit all)
- `model` = chon tier phu hop (haiku/sonnet/opus)
- `memory: project` neu agent can nho cross-session
- Them vao `AGENT_TIERS` trong resource-config.js

**Neu can agents chay song song:**
- Agent read-only (khong Write/Edit) co the chay `background: true`
- Agent co Write/Edit KHONG nen chay song song (file conflict risk)
- Toi da 2 agents dong thoi (RESOURCE_LIMITS.maxConcurrentAgents)

**Neu can resume phien dieu tra:**
- Doc `.planning/debug/SESSION_*.md` + evidence files
- Orchestrator tu quyet dinh tiep tu buoc nao dua tren trang thai evidence
- KHONG can Claude Code session resume — du an tu quan ly state bang markdown

**Neu agent bi rate limit (model khong kha dung):**
- Workflow doc RESOURCE_LIMITS.downgradeRules
- opus -> sonnet, sonnet -> haiku
- Ghi canh bao: "Agent [X] ha cap tu [model A] xuong [model B]"

## Version Compatibility

| Component | Compatible Voi | Ghi Chu |
|-----------|----------------|---------|
| Agent files (`.claude/agents/pd-*.md`) | Claude Code v2.1.32+ | Subagent system stable tu v2.1.32 |
| `memory: project` field | Claude Code v2.1.33+ | Introduced in v2.1.33 (Feb 2026) |
| `effort:` field | Claude Code v2.1.33+ | Override session effort level |
| `background: true` field | Claude Code v2.1.32+ | Concurrent subagent execution |
| `maxTurns:` field | Claude Code v2.1.32+ | Safety limit cho agent |
| `hooks:` field | Claude Code v2.1.32+ | Lifecycle hooks — nhung chi can cho Phase sau |
| Module JS moi (v2.1) | Node.js >= 18 | Chi dung built-in APIs |
| node:test runner | Node.js >= 18 | Da dung tu v1.1 |
| `.claude/agents/` directory | Claude Code native | Project-scoped agents — Priority 2 (sau CLI flag) |
| Evidence markdown files | Tat ca Claude models | AI native format — doc/ghi tu nhien |
| JSONL bug history | Node.js built-in JSON.parse/stringify | Khong can parser library |

## Platform Transpilation Impact

**QUAN TRONG:** Agents la Claude Code-specific feature. Cac platform khac (Codex, Gemini, OpenCode, Copilot) KHONG co subagent system tuong duong.

**Chien luoc:**
- Agent files (`.claude/agents/`) KHONG can transpile — chi danh cho Claude Code
- Workflow markdown (`workflows/fix-bug.md`) VAN transpile — nhung phan agent dispatch se bi skip tren platform khac
- Pure function JS modules (`bin/lib/`) platform-independent — hoat dong o moi noi
- Backward compatibility: neu khong co agents dir, fix-bug workflow chay nhu v1.5 (single-agent mode)

**Fallback cho non-Claude platforms:**
```markdown
<!-- Trong workflow -->
Neu platform KHONG ho tro subagents:
- Bo qua buoc dispatch agent
- Orchestrator tu thuc hien tat ca buoc (nhu v1.5)
- Evidence files van duoc tao (boi single agent)
```

## Rui Ro Ky Thuat

| Rui Ro | Muc Do | Giam Thieu |
|--------|--------|------------|
| Claude Code version qua cu (khong co subagent) | THAP | Kiem tra version trong guard. Fallback ve single-agent mode. |
| Agent dispatch khong dung (Claude chon sai agent) | TRUNG BINH | `description` phai cuc ky ro rang va specific. Test thu dispatch voi nhieu cach dien dat. |
| Evidence file bi overwrite khi nhieu agent chay | THAP | Moi agent ghi file RIENG (evidence_janitor, evidence_code, v.v.). Khong co file chung. |
| Rate limit voi opus model | TRUNG BINH | downgradeRules: opus -> sonnet. Canh bao user. Architect van chay duoc voi sonnet (chi cham hon). |
| Agent memory (MEMORY.md) phinh to | THAP | Claude Code tu curate khi vuot 200 dong. Plus du an co the them hook clean up. |
| Bug history JSONL lon (1000+ bugs) | THAP | searchBugHistory chi scan text — O(n) nhung n bugs thuong < 100/du an. Neu can, them index file sau. |
| Transpilation break (agent-specific workflow) | TRUNG BINH | Conditional: `Neu platform ho tro subagents -> dispatch, khong thi -> single-agent`. Converters bo qua agent-specific sections. |

## Tong Ket

| Metric | Gia Tri |
|--------|---------|
| Runtime dependency moi | 0 |
| Agent definition files moi | 5 (janitor, detective, docspec, repro, architect) |
| Module JS moi | 3 (bug-memory, evidence-parser, resource-config) |
| Module JS mo rong | 2 (repro-test-generator, regression-analyzer) |
| Workflow files moi/mo rong | 1-2 (fix-bug.md mo rong + detective-orchestrator.md moi) |
| Evidence file templates | 5 (1 per agent) |
| Session format thay doi | Mo rong SESSION_*.md co multi-agent sections |
| Test files moi | 3+ (1 per module moi) |
| Claude Code version toi thieu | v2.1.33 (cho memory field) |

## Sources

- [Claude Code Sub-Agents Documentation](https://code.claude.com/docs/en/sub-agents) — Tai lieu chinh thuc: frontmatter fields, model routing, tool restriction, memory, hooks, nesting limits — HIGH confidence
- [Claude Code Model Configuration](https://code.claude.com/docs/en/model-config) — Tai lieu chinh thuc: model aliases (haiku/sonnet/opus), effort levels, opusplan, env vars — HIGH confidence
- [Claude Code Agent Teams](https://code.claude.com/docs/en/agent-teams) — Tai lieu chinh thuc: experimental status, limitations, comparison voi subagents — HIGH confidence (cho quyet dinh KHONG dung)
- [Claude Code Memory Documentation](https://code.claude.com/docs/en/memory) — Tai lieu chinh thuc: agent memory scopes (user/project/local), MEMORY.md auto-curation — HIGH confidence
- Codebase analysis: `commands/pd/agents/pd-*.md` (5 existing agent drafts), `workflows/fix-bug.md` (v1.5 workflow), `commands/pd/fix-bug.md` (skill definition) — HIGH confidence
- `.planning/codebase/ARCHITECTURE.md`, `.planning/codebase/STACK.md`, `.planning/codebase/CONVENTIONS.md` — Existing architecture patterns — HIGH confidence
- `.planning/PROJECT.md` — Project constraints ("No Build Step", "Node.js 16.7+", backward compatibility) — HIGH confidence

---
*Stack research for: v2.1 Detective Orchestrator trong please-done*
*Researched: 2026-03-24*
