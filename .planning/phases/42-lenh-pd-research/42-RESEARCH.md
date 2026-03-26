# Phase 42: Lenh pd research - Research

**Researched:** 2026-03-26
**Domain:** CLI command orchestration, keyword-based routing, agent pipeline
**Confidence:** HIGH

## Summary

Phase 42 tao lenh `pd research` — mot user-facing command duy nhat de nghien cuu. He thong tu dong phan loai internal/external bang keyword heuristic (routeQuery pure function), chay pipeline Evidence Collector -> Fact Checker tuan tu, va cross-validate khi co ca 2 loai files cung topic.

Toan bo codebase da co san cac building blocks can thiet: research-store.js (6 functions, them routeQuery la function thu 7), 2 agent definitions (pd-evidence-collector.md va pd-fact-checker.md), index-generator.js (scan INDEX.md), audit-logger.js (ghi log), va 12 existing skills + workflows lam pattern reference. Converter pipeline (4 platforms x N skills) voi snapshot testing cung da san sang de extend.

**Primary recommendation:** Them routeQuery vao research-store.js, tao skill file `commands/pd/research.md` theo pattern cua fix-bug.md, tao workflow `workflows/research.md` theo pattern cua fix-bug.md nhung don gian hon (chi 2 agents thay vi 5), va regenerate snapshots.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- D-01: Them function `routeQuery(query)` vao `bin/lib/research-store.js` — pure function return `'internal'` | `'external'`
- D-02: Keyword heuristic: ten file/function/class/variable -> internal, ten thu vien/API/protocol -> external. Regex don gian
- D-03: Fallback khi khong match pattern nao: default `external`
- D-04: Hien thi routing decision: in 1 dong "Da phan loai: [internal|external] research"
- D-05: Workflow `workflows/research.md` orchestrate pipeline
- D-06: Flow: (1) route query, (2) spawn Evidence Collector, (3) doi output, (4) spawn Fact Checker voi output lam input. Tuan tu, tu dong
- D-07: Khi Evidence Collector fail: van chay Fact Checker — confidence LOW, non-blocking
- D-08: Fact Checker chay tu dong sau Evidence Collector — khong hoi user
- D-09: Output cuoi cung: tom tat ngan gon (topic, source type, confidence, so claims verified, path file ket qua)
- D-10: Fact Checker tu dong scan INDEX.md tim files cung topic o ca internal/ va external/
- D-11: Output ghi vao section `## Xung dot phat hien` trong file verification
- D-12: Khi phat hien xung dot: ghi nhan voi evidence tu ca 2 phia, KHONG tu resolve
- D-13: Skill file: `commands/pd/research.md` voi argument bat buoc la topic. Khong co flags
- D-14: Workflow file: `workflows/research.md` chua toan bo pipeline logic
- D-15: Them research.md vao converter pipeline + regenerate snapshots cho 4 platforms
- Carrying Forward: Frontmatter 8 fields chuan (P38), research-store.js API 6 functions (P38), Evidence Collector = sonnet / Fact Checker = opus (P40), Evidence Collector KHONG co WebSearch / Fact Checker CO (P40), Fact Checker KHONG ghi de Collector output (P40), INDEX.md format tu Phase 39

### Claude's Discretion
- So luong plans va task breakdown
- Exact regex patterns cho routeQuery heuristic
- Workflow prompt wording cho agent spawn
- Converter template cho research skill

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| STORE-04 | Lenh `pd research` tu dong route internal vs external dua tren noi dung cau hoi | routeQuery pure function trong research-store.js, keyword heuristic regex patterns |
| AGENT-03 | pd research tu dong chay pipeline Evidence Collector -> Fact Checker | Workflow file orchestrate 2 agent spawn tuan tu, theo pattern fix-bug.md workflow |
| EXTRA-01 | Cross-validation tu dong — Fact Checker so sanh internal/ va external/ files cung topic | Fact Checker dung index-generator.js parseResearchFiles + scan INDEX.md de tim files cung topic |
</phase_requirements>

## Project Constraints (from CLAUDE.md)

- Dung tieng viet toan bo, co dau chuan (ap dung cho skill files, workflow files, va output messages)

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| node:test | built-in (Node 24.14.1) | Test framework | Da dung trong 5 test files hien co |
| node:assert/strict | built-in | Assertions | Nhat quan voi tat ca tests hien co |

### Supporting (existing modules — KHONG them dependency moi)
| Module | File | Purpose |
|--------|------|---------|
| research-store.js | bin/lib/research-store.js | Extend voi routeQuery — function thu 7 |
| index-generator.js | bin/lib/index-generator.js | parseResearchFiles + generateIndex — Fact Checker dung de scan topics |
| audit-logger.js | bin/lib/audit-logger.js | appendLogEntry — pipeline ghi audit log |
| confidence-scorer.js | bin/lib/confidence-scorer.js | scoreConfidence — Fact Checker dung |
| converters/base.js | bin/lib/converters/base.js | convertSkill pipeline — extend cho research skill |
| utils.js | bin/lib/utils.js | parseFrontmatter, buildFrontmatter, listSkillFiles, inlineWorkflow |

**Installation:** Khong can — tat ca la built-in modules va existing code.

## Architecture Patterns

### Recommended Project Structure (chi files moi/thay doi)
```
commands/pd/
  research.md          # NEW — skill file (user-facing command)
workflows/
  research.md          # NEW — workflow file (pipeline orchestration)
bin/lib/
  research-store.js    # EXTEND — them routeQuery function
test/
  smoke-research-store.test.js  # EXTEND — them routeQuery tests
test/snapshots/
  codex/research.md    # NEW — regenerated snapshot
  copilot/research.md  # NEW — regenerated snapshot
  gemini/research.md   # NEW — regenerated snapshot
  opencode/research.md # NEW — regenerated snapshot
```

### Pattern 1: Skill File Structure
**What:** Skill file = frontmatter + objective + guards + context + execution_context + process + output + rules
**When to use:** Moi user-facing command `/pd:*`
**Example (tu fix-bug.md — reference pattern):**
```markdown
---
name: pd:research
description: Nghien cuu tu dong — phan loai internal/external, thu thap bang chung, xac minh
model: sonnet
argument-hint: "[chu de can nghien cuu]"
allowed-tools:
  - Read
  - Write
  - Edit
  - Bash
  - Glob
  - Grep
  - Agent
  - mcp__context7__resolve-library-id
  - mcp__context7__query-docs
---
```
**Luu y:** Model = sonnet vi day la orchestrator (skill), KHONG phai agent. Orchestrator spawn agents (Evidence Collector = sonnet, Fact Checker = opus) qua Agent tool.

### Pattern 2: Workflow Pipeline
**What:** Workflow file chua pipeline logic, skill file tham chieu workflow qua `@workflows/research.md`
**When to use:** Khi skill can orchestrate nhieu buoc/agents
**Reference:** `workflows/fix-bug.md` orchestrate 5 agents theo 5 buoc. Research workflow don gian hon — chi 2 agents theo 3 buoc:
1. Route query (routeQuery pure function)
2. Spawn Evidence Collector, doi output
3. Spawn Fact Checker voi Collector output lam input

### Pattern 3: Agent Spawning trong Workflow
**What:** Workflow spawn agents qua Agent tool, truyen absolute paths, doi ket qua
**Reference tu fix-bug.md workflow:**
```
Spawn Agent `pd-evidence-collector`:
  "Thu muc research: {absolute_research_dir}.
   Topic: {topic}. Pham vi: {internal|external}.
   Thu thap bang chung va ghi file."
```
**Quy tac:** CHI orchestrator (workflow) moi spawn agent. Agent KHONG spawn agent khac.

### Pattern 4: Pure Function Module trong bin/lib/
**What:** Module export pure functions, KHONG doc file, KHONG side effects
**When to use:** Business logic nhu routeQuery
**Example:**
```javascript
// Pure function — nhan string, return string
function routeQuery(query) {
  if (typeof query !== 'string' || !query.trim()) {
    return 'external'; // D-03: fallback external
  }
  // D-02: Keyword heuristic
  // Internal patterns: file names, function names, class names, variable names
  // External patterns: library names, API names, protocol names
  // ... regex logic ...
  return 'external'; // D-03: default fallback
}
```

### Anti-Patterns to Avoid
- **Agent spawn agent:** CHI workflow spawn agents, KHONG de agent goi agent khac
- **Hardcode research paths:** Agent doc/ghi tu path duoc orchestrator truyen qua prompt
- **Blocking pipeline khi Collector fail:** D-07 — van chay Fact Checker voi confidence LOW
- **Tu resolve xung dot:** D-12 — chi ghi nhan, KHONG tu quyet dinh

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| File naming | Custom slug logic | `generateFilename()` tu research-store.js | Da co slugification, zero-padding, source type routing |
| Frontmatter | Manual string concat | `buildFrontmatter()` tu utils.js | Da co field ordering, escaping |
| INDEX scanning | Manual glob + parse | `parseResearchFiles()` tu index-generator.js | Da co filtering, validation, sorting |
| Confidence scoring | Custom rules | `scoreConfidence()` tu confidence-scorer.js | Da co rule-based logic, source quality map |
| Audit logging | Manual append | `appendLogEntry()` tu audit-logger.js | Da co header management, format |
| Converter pipeline | Custom transpile | `convertSkill()` tu base.js + platform converters | Da co 8-step pipeline, workflow inlining |
| Snapshot generation | Manual | `node test/generate-snapshots.js` | Da co — chi can chay lai sau khi them skill |

**Key insight:** Tat ca building blocks da co tu Phase 38-41. Phase 42 chi CAN NAP va CONNECT, khong can tao module moi.

## Common Pitfalls

### Pitfall 1: Snapshot test fail sau khi them skill
**What goes wrong:** Them `commands/pd/research.md` nhung khong regenerate snapshots -> 4 platform snapshot tests fail
**Why it happens:** `listSkillFiles()` tu dong tim tat ca `.md` trong `commands/pd/` -> snapshot test expect file tuong ung trong `test/snapshots/{platform}/research.md`
**How to avoid:** Chay `node test/generate-snapshots.js` SAU khi tao skill file va TRUOC khi chay tests
**Warning signs:** `Missing snapshot: test/snapshots/codex/research.md`

### Pitfall 2: routeQuery khong phu regex cho cac pattern tieng Viet
**What goes wrong:** User hoi bang tieng Viet (vd: "ham authenticate trong auth.service.ts") -> regex chi match tieng Anh -> fallback external sai
**Why it happens:** D-02 noi "ten file/function" nhung khong noi ngon ngu nao
**How to avoid:** Regex can match ca: (1) file extensions (.ts, .js, .md), (2) function/class names (camelCase, PascalCase, snake_case), (3) file paths (src/..., ./...). Day la pattern-based, KHONG phai language-based
**Warning signs:** routeQuery("ham createUser trong user.service.ts") tra ve 'external'

### Pitfall 3: Evidence Collector output khong dung format cho Fact Checker
**What goes wrong:** Fact Checker khong doc duoc output cua Collector vi format khac nhau
**Why it happens:** 2 agents duoc tao o Phase 40 rieng biet
**How to avoid:** Workflow truyen explicit file path cua Collector output cho Fact Checker. Fact Checker doc file bang Read tool
**Warning signs:** Fact Checker khong tim thay evidence file

### Pitfall 4: Workflow khong truyen du context cho Agent
**What goes wrong:** Agent spawn nhung khong biet topic, source type, hay research directory
**Why it happens:** Prompt cho Agent thieu thong tin
**How to avoid:** Truyen day du: (1) research dir absolute path, (2) topic, (3) source type (internal/external), (4) Evidence Collector output path (cho Fact Checker)

### Pitfall 5: Cross-validation khong tim duoc files cung topic
**What goes wrong:** Fact Checker scan INDEX.md nhung topic khong match chinh xac
**Why it happens:** Topic string khac nhau giua internal va external files (vd: "react-hooks" vs "React Hooks API")
**How to avoid:** Match bang substring/fuzzy thay vi exact match. INDEX.md co cot Topic — so sanh case-insensitive va cho phep partial match

## Code Examples

### routeQuery — Keyword Heuristic

```javascript
// Them vao bin/lib/research-store.js

/**
 * Phan loai query thanh internal hoac external.
 * Pure function: nhan string, return 'internal' | 'external'.
 *
 * Heuristic (D-02):
 * - Internal: ten file (.ts, .js, .md...), function/class name (camelCase, PascalCase),
 *   path patterns (src/, ./), variable references
 * - External: ten thu vien, API, protocol, URL, package names
 * - Fallback (D-03): external (an toan hon)
 *
 * @param {string} query - Cau hoi research
 * @returns {'internal' | 'external'}
 */
function routeQuery(query) {
  if (typeof query !== 'string' || !query.trim()) {
    return 'external';
  }

  const q = query.trim();

  // Internal patterns — nhan dien references toi codebase
  const internalPatterns = [
    /\.[tj]sx?(?:\s|$|,|:)/i,          // .ts, .js, .tsx, .jsx extensions
    /\.[mc]js(?:\s|$|,|:)/i,           // .mjs, .cjs
    /\.(?:py|rb|go|rs|java|dart)(?:\s|$|,|:)/i, // other source extensions
    /\.(?:md|json|yaml|yml|toml)(?:\s|$|,|:)/i, // config/doc extensions
    /(?:src|lib|bin|test|commands|workflows)\//i, // path patterns
    /\.\/[a-zA-Z]/,                      // relative paths
    /(?:^|\s)(?:ham|function|class|interface|type|enum)\s+[a-zA-Z]/i, // definitions
    /[a-z][a-zA-Z]+\.(test|spec)\./i,    // test file patterns
    /(?:^|\s)[a-z]+[A-Z][a-zA-Z]*(?:\s|$|\()/,  // camelCase function names
    /(?:^|\s)[A-Z][a-z]+[A-Z][a-zA-Z]*(?:\s|$)/,// PascalCase class names
  ];

  for (const pattern of internalPatterns) {
    if (pattern.test(q)) {
      return 'internal';
    }
  }

  // Default fallback — external (D-03)
  return 'external';
}
```

### Skill File — commands/pd/research.md

```markdown
---
name: pd:research
description: Nghien cuu tu dong — phan loai internal/external, thu thap bang chung, xac minh va cross-validate
model: sonnet
argument-hint: "[chu de can nghien cuu]"
allowed-tools:
  - Read
  - Write
  - Edit
  - Bash
  - Glob
  - Grep
  - Agent
  - mcp__context7__resolve-library-id
  - mcp__context7__query-docs
---

<objective>
Nghien cuu 1 chu de tu dong: phan loai internal/external, chay pipeline Evidence Collector -> Fact Checker, cross-validate khi co ca 2 loai.
**Sau khi xong:** Hien tom tat ket qua.
</objective>

<guards>
@references/guard-context.md
- [ ] Co chu de nghien cuu duoc cung cap -> "Hay cung cap chu de can nghien cuu."
</guards>

<context>
Nguoi dung nhap: $ARGUMENTS
</context>

<execution_context>
@workflows/research.md (required)
@references/conventions.md (required)
</execution_context>

<process>
Thuc thi @workflows/research.md tu dau den cuoi.
</process>

<output>
**Tao/Cap nhat:**
- Research file trong `.planning/research/internal/` hoac `.planning/research/external/`
- Verification file tu Fact Checker
- INDEX.md cap nhat
- AUDIT_LOG.md cap nhat

**Thanh cong khi:**
- Research file co frontmatter day du
- Fact Checker da xac minh
- Tom tat hien cho user
</output>

<rules>
- Moi output PHAI bang tieng Viet co dau
- PHAI chay pipeline day du: route -> collect -> verify
- KHONG skip Fact Checker khi Collector fail — chay voi confidence LOW
</rules>
```

### Workflow — workflows/research.md (cau truc)

```markdown
<purpose>
Dieu phoi pipeline nghien cuu: route query -> spawn Evidence Collector -> spawn Fact Checker.
2 agents chay tuan tu. Output Collector la input Checker.
</purpose>

<process>
## Buoc 1: Route query
1. Lay topic tu $ARGUMENTS
2. Goi routeQuery(topic) -> 'internal' | 'external'
3. Hien: "Da phan loai: [internal|external] research" (D-04)

## Buoc 2: Thu thap bang chung
Spawn Agent `pd-evidence-collector`:
  "Thu muc research: {absolute_research_dir}.
   Topic: {topic}. Pham vi: {source_type}.
   Thu thap bang chung va ghi file."

Sau khi agent hoan tat:
- Doc output file
- Neu fail: WARNING, tiep tuc Buoc 3 (D-07)

## Buoc 3: Xac minh va cross-validate
Spawn Agent `pd-fact-checker`:
  "Thu muc research: {absolute_research_dir}.
   File can xac minh: {collector_output_path}.
   Topic: {topic}.
   Cross-validate: scan INDEX.md tim files cung topic o ca internal/ va external/."

Sau khi agent hoan tat:
- Doc verification output
- Hien tom tat (D-09): topic, source type, confidence, so claims verified, path file

</process>

<rules>
- CHI orchestrator spawn agents — agents KHONG spawn agents khac
- PHAI truyen absolute paths khi spawn agents
- KHONG block khi Evidence Collector fail — tiep tuc voi Fact Checker
- KHONG hoi user giua pipeline — chay seamless (D-08)
- Cross-validate tu dong khi Fact Checker phat hien files cung topic (D-10)
</rules>
```

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | node:test (built-in, Node 24.14.1) |
| Config file | none — dung node --test truc tiep |
| Quick run command | `node --test test/smoke-research-store.test.js` |
| Full suite command | `node --test test/smoke-*.test.js` |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| STORE-04 | routeQuery phan loai internal vs external | unit | `node --test test/smoke-research-store.test.js` | Co (extend) |
| STORE-04 | routeQuery fallback external khi khong match | unit | `node --test test/smoke-research-store.test.js` | Co (extend) |
| STORE-04 | routeQuery xu ly null/empty/invalid input | unit | `node --test test/smoke-research-store.test.js` | Co (extend) |
| AGENT-03 | Workflow file parseable (frontmatter + body) | smoke | `node --test test/smoke-snapshot.test.js` | Co (auto — snapshot test se cover) |
| EXTRA-01 | Cross-validation logic | manual-only | N/A — Fact Checker agent logic, khong unit test duoc | N/A |

### Sampling Rate
- **Per task commit:** `node --test test/smoke-research-store.test.js`
- **Per wave merge:** `node --test test/smoke-*.test.js`
- **Phase gate:** Full suite green truoc verify

### Wave 0 Gaps
- None — test infrastructure da co. Chi can extend `test/smoke-research-store.test.js` voi routeQuery tests va chay `node test/generate-snapshots.js` de tao snapshots moi.

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| User tu phan loai internal/external | routeQuery tu dong phan loai | Phase 42 | User chi can 1 lenh, khong can chon |
| Manual chay Evidence Collector roi Fact Checker | Pipeline tu dong Collector -> Checker | Phase 42 | 1 lenh chay 2 agents tuan tu |
| Fact Checker chi verify 1 file | Cross-validate internal/ va external/ cung topic | Phase 42 | Phat hien xung dot giua cac nguon |

## Open Questions

1. **Exact regex patterns cho routeQuery**
   - What we know: D-02 noi "ten file/function -> internal, ten thu vien/API -> external"
   - What's unclear: Toi uu regex set cho cac use case tieng Viet + tieng Anh
   - Recommendation: Bat dau voi patterns co ban (file extensions, camelCase, paths), iterate dua tren usage. Claude's discretion area.

2. **Cross-validation topic matching**
   - What we know: INDEX.md co cot Topic, Fact Checker scan de tim cung topic
   - What's unclear: Exact matching strategy (exact vs substring vs fuzzy)
   - Recommendation: Case-insensitive substring match la du. Claude's discretion area — de Fact Checker agent tu quyet dinh khi spawn.

## Sources

### Primary (HIGH confidence)
- `bin/lib/research-store.js` — doc truc tiep, 6 existing functions, module pattern
- `bin/lib/index-generator.js` — doc truc tiep, parseResearchFiles + generateIndex
- `bin/lib/audit-logger.js` — doc truc tiep, appendLogEntry
- `bin/lib/confidence-scorer.js` — doc truc tiep, scoreConfidence
- `commands/pd/fix-bug.md` — doc truc tiep, skill file pattern (frontmatter + sections)
- `workflows/fix-bug.md` — doc truc tiep, workflow pattern (agent spawning, process steps)
- `.claude/agents/pd-evidence-collector.md` — doc truc tiep, agent definition
- `.claude/agents/pd-fact-checker.md` — doc truc tiep, agent definition
- `bin/lib/converters/base.js` — doc truc tiep, converter pipeline
- `test/smoke-snapshot.test.js` — doc truc tiep, snapshot test pattern
- `test/generate-snapshots.js` — doc truc tiep, snapshot generation

### Secondary (MEDIUM confidence)
- `42-CONTEXT.md` — user decisions tu discuss phase

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — tat ca da co trong codebase, khong them dependency
- Architecture: HIGH — follow exact patterns tu fix-bug.md skill/workflow
- Pitfalls: HIGH — derived tu doc truc tiep codebase (snapshot tests, agent format)

**Research date:** 2026-03-26
**Valid until:** 2026-04-26 (stable — internal codebase patterns)
