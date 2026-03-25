# Phase 40: Tac tu Nghien cuu - Research

**Researched:** 2026-03-25
**Domain:** Claude Code agent definitions + AGENT_REGISTRY extension
**Confidence:** HIGH

## Summary

Phase 40 tao 2 agent definitions (Evidence Collector va Fact Checker) va dang ky chung trong `resource-config.js`. Day la phase thuan tuy ve tao file markdown (agent prompts) va sua code JS (registry + tests). Tat ca modules ma agents se su dung (research-store.js, confidence-scorer.js, audit-logger.js) da duoc xay dung o Phase 38-39.

Du an da co 5 agents lam pattern chuan. Cau truc agent file da duoc chot: YAML frontmatter (name, description, tools, model, maxTurns, effort) + body voi `<objective>`, `<process>`, `<rules>`. Test infrastructure da co san: smoke-agent-files.test.js kiem tra consistency giua agent files va AGENT_REGISTRY, smoke-resource-config.test.js kiem tra so luong agents.

**Primary recommendation:** Follow exactly pattern tu pd-code-detective.md va pd-bug-janitor.md. Moi thay doi chi la: (1) tao 2 file .md moi, (2) them 2 entries vao AGENT_REGISTRY, (3) cap nhat so luong va AGENT_NAMES trong tests.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- D-01: File: `.claude/agents/pd-evidence-collector.md` voi Claude Code native YAML frontmatter
- D-02: Tier: builder/sonnet. Effort: medium. MaxTurns: 25
- D-03: Allowed tools: Read, Grep, Glob, Bash, mcp__context7__resolve-library-id, mcp__context7__query-docs. KHONG co WebSearch
- D-04: Process: (1) Nhan topic + routing tu orchestrator, (2) Thu thap tu 2+ nguon doc lap, (3) Ghi ket qua theo research-store.js createEntry format, (4) source-or-skip rule
- D-05: Output format: Research file voi frontmatter 8 fields + section `## Bang chung` + inline confidence markers
- D-06: File: `.claude/agents/pd-fact-checker.md` voi Claude Code native YAML frontmatter
- D-07: Tier: architect/opus. Effort: high. MaxTurns: 15
- D-08: Allowed tools: Read, Grep, Glob, WebSearch, mcp__context7__resolve-library-id, mcp__context7__query-docs
- D-09: Process: (1) Doc research file, (2) Xac minh source, (3) LOW confidence -> tim them source hoac danh dau, (4) Ghi section `## Kiem tra Thuc te`
- D-10: KHONG ghi de noi dung Evidence Collector — chi THEM section kiem tra
- D-11: Them 2 entries vao AGENT_REGISTRY voi exact config
- D-12: Them 2 agent names vao integration tests
- D-13: Follow pattern tu pd-code-detective.md: YAML frontmatter + `<purpose>` + `<process>` + `<rules>` + `<success_criteria>`
- D-14: Agent process buoc cuoi PHAI goi appendAuditLog pattern

### Carrying Forward (Locked tu Phase 38-39)
- Frontmatter 8 fields (P38 D-01)
- Confidence 3 bac (P38 D-03)
- research-store.js API (P38 D-07)
- confidence-scorer.js rule-based (P39 D-12-D-15)
- validateEvidence (P39 D-01-D-04)

### Claude's Discretion
- So luong plans va task breakdown
- Exact prompt wording cho agent definitions
- Test strategy cho agent registration

### Deferred Ideas (OUT OF SCOPE)
None
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| AGENT-01 | Evidence Collector (builder/sonnet) thu thap bang chung tu 2+ nguon doc lap, ghi ket qua theo format chuan vao internal/ hoac external/ | Agent definition pattern tu 5 existing agents, research-store.js createEntry API, confidence-scorer.js scoreConfidence, AGENT_REGISTRY extension pattern |
| AGENT-02 | Fact Checker (architect/opus) xac minh source con valid, phat hien claim thieu bang chung, danh dau "KHONG XAC MINH DUOC" cho confidence LOW | Agent definition pattern, separation of concerns voi Evidence Collector (D-10: chi THEM section), audit-logger.js appendLogEntry API |
</phase_requirements>

## Architecture Patterns

### Agent File Structure (Established Pattern)

Moi agent file tai `.claude/agents/` theo cau truc chuan:

```markdown
---
name: pd-[agent-name]
description: [Mo ta ngan — tieng Viet co dau]
tools: [Tool1, Tool2, Tool3]
model: [haiku|sonnet|opus]
maxTurns: [number]
effort: [low|medium|high]
---

<objective>
[Muc tieu ngan gon]
</objective>

<process>
1. [Buoc 1]
2. [Buoc 2]
...
</process>

<rules>
- [Rule 1]
- [Rule 2]
</rules>
```

**Ghi chu D-13:** CONTEXT.md ghi `<purpose>` + `<process>` + `<rules>` + `<success_criteria>`. Nhung 5 agents hien tai dung `<objective>` thay vi `<purpose>`, va KHONG co `<success_criteria>`. Recommendation: dung `<objective>` + `<process>` + `<rules>` nhat quan voi 5 agents hien tai. Them `<success_criteria>` la optional — nhat quan voi existing pattern quan trong hon.

**Confidence: HIGH** — verified truc tiep tu pd-code-detective.md va pd-bug-janitor.md source code.

### AGENT_REGISTRY Extension Pattern

```javascript
// Them 2 entries moi vao AGENT_REGISTRY (resource-config.js dong 32-38)
const AGENT_REGISTRY = {
  // ... 5 entries hien tai ...
  'pd-evidence-collector': { tier: 'builder', tools: ['Read', 'Grep', 'Glob', 'Bash', 'mcp__context7__resolve-library-id', 'mcp__context7__query-docs'] },
  'pd-fact-checker':       { tier: 'architect', tools: ['Read', 'Grep', 'Glob', 'WebSearch', 'mcp__context7__resolve-library-id', 'mcp__context7__query-docs'] },
};
```

**Quan trong:** AGENT_REGISTRY chi luu `tier` va `tools`. Model, effort, maxTurns duoc derive tu TIER_MAP qua `getAgentConfig()`. Tuy nhien:
- D-07 ghi maxTurns: 15 cho Fact Checker nhung TIER_MAP architect co maxTurns: 30
- D-02 ghi maxTurns: 25 cho Evidence Collector va TIER_MAP builder co maxTurns: 25 — khop

**Giai phap cho Fact Checker maxTurns mismatch:** AGENT_REGISTRY hien tai KHONG co field `maxTurns` override. Nhung `getAgentConfig()` tra ve `tierConfig.maxTurns` (dong 110). Co 2 cach:
1. Them `maxTurns` override vao AGENT_REGISTRY entry va sua `getAgentConfig()` de uu tien override
2. Ghi maxTurns: 15 trong agent file frontmatter (da co) va de orchestrator doc tu file thay vi registry

**Recommendation:** Agent file frontmatter DA CO maxTurns field. Orchestrator su dung frontmatter khi spawn agent. AGENT_REGISTRY chi la metadata cho isHeavyAgent/shouldDegrade. Gia maxTurns trong TIER_MAP la default, frontmatter la override. Khong can sua getAgentConfig().

**Confidence: HIGH** — verified tu resource-config.js source code.

### Test Update Pattern

2 files test can cap nhat:

**1. smoke-resource-config.test.js (dong 190-191):**
```javascript
// Hien tai:
it('AGENT_REGISTRY co 5 agents', () => {
  assert.equal(Object.keys(AGENT_REGISTRY).length, 5);
});
// Doi thanh:
it('AGENT_REGISTRY co 7 agents', () => {
  assert.equal(Object.keys(AGENT_REGISTRY).length, 7);
});
```

**2. smoke-agent-files.test.js:**
- Dong 2, 18-24: Cap nhat AGENT_NAMES array them 2 entries
- Dong 82: Cap nhat so "5 agent files" thanh "7 agent files"
- Them 2 test cases frontmatter cho Evidence Collector va Fact Checker (theo pattern dong 95-138)
- Tests tu dong consistency (dong 157-181) se tu dong cover 2 agents moi vi chung iterate AGENT_REGISTRY

**Confidence: HIGH** — verified truc tiep tu test source code.

### Modules Ma Agents Su Dung (Reference Cho Prompt)

Agent prompts can reference cac APIs sau de dam bao output format chuan:

| Module | Function | Agent Dung | Muc Dich |
|--------|----------|------------|----------|
| research-store.js | createEntry({agent, source, topic, confidence, body, id, slug}) | Evidence Collector | Tao research file content + filename |
| research-store.js | validateEvidence(content) | Fact Checker | Kiem tra section Bang chung hop le |
| research-store.js | parseEntry(content) | Fact Checker | Parse research file de doc frontmatter + body |
| confidence-scorer.js | scoreConfidence(sources[]) | Evidence Collector | Tinh confidence tu sources |
| confidence-scorer.js | classifySource({type, url}) | Evidence Collector | Phan loai source quality |
| audit-logger.js | appendLogEntry(existing, {timestamp, agent, action, topic, sourceCount, confidence}) | Ca 2 (D-14) | Ghi audit log |

**Ghi chu D-14:** Agents KHONG truc tiep goi JS modules (agents la markdown prompts). "Goi appendAuditLog pattern" co nghia la agent prompt huong dan agent ghi output theo format tuong thich voi appendLogEntry — orchestrator se goi function thuc te SAU KHI agent hoan tat.

**Confidence: HIGH** — verified tu source code cua cac modules.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Research file format | Custom frontmatter format | research-store.js createEntry | Da co validation, tested |
| Confidence scoring | LLM self-assessment | confidence-scorer.js scoreConfidence | Rule-based, da co tests |
| Audit logging | Custom log format | audit-logger.js appendLogEntry | Format chuan, append-only |
| Agent config lookup | Hardcode model/effort | resource-config.js getAgentConfig | Centralized, type-safe |

## Common Pitfalls

### Pitfall 1: D-13 Noi `<purpose>` Nhung Pattern La `<objective>`
**What goes wrong:** CONTEXT.md D-13 ghi "follow pattern tu pd-code-detective.md: `<purpose>` + `<process>` + `<rules>` + `<success_criteria>`". Nhung doc pd-code-detective.md thuc te: dung `<objective>` (khong phai `<purpose>`) va KHONG co `<success_criteria>`.
**Why it happens:** D-13 viet tu nho, khong cross-check voi source code.
**How to avoid:** Dung `<objective>` + `<process>` + `<rules>` nhat quan voi 5 agents hien tai. Co the them `<success_criteria>` nhung tat ca 5 agents deu khong co — nen bo de nhat quan.
**Confidence: HIGH** — verified tu 2 agent files.

### Pitfall 2: Fact Checker MaxTurns Mismatch
**What goes wrong:** D-07 ghi maxTurns: 15. TIER_MAP architect co maxTurns: 30. Neu chi them vao AGENT_REGISTRY ma khong xu ly, getAgentConfig tra ve 30 thay vi 15.
**How to avoid:** Ghi maxTurns: 15 trong agent file frontmatter. Orchestrator doc tu frontmatter khi spawn. AGENT_REGISTRY khong can override.
**Confidence: HIGH** — verified tu resource-config.js.

### Pitfall 3: Circular Verification (Pitfall 3 tu PITFALLS.md)
**What goes wrong:** Fact Checker va Evidence Collector dung cung tools (Context7, WebSearch) — verify bang cung nguon = khong phai verify.
**How to avoid:** Fact Checker prompt PHAI phan biet:
- Internal claims: Read/Grep file truc tiep de verify — HIGH confidence
- External claims: Chi verify source TON TAI va reachable, KHONG verify noi dung — MEDIUM confidence toi da
**Confidence: HIGH** — tu PITFALLS.md section 3.

### Pitfall 4: Source-Or-Skip Rule Bi Ignore
**What goes wrong:** D-04 bat buoc source-or-skip nhung agent prompt khong nhan manh du — LLM co xu huong fabricate citations.
**How to avoid:** Prompt PHAI co rule ro rang: "KHONG DUOC ghi claim khong co source. Thay vao do ghi: KHONG TIM THAY thong tin ve [topic]." Dat lam rule dau tien trong `<rules>`.
**Confidence: HIGH** — tu PITFALLS.md section 2.

### Pitfall 5: Test Count Hardcode
**What goes wrong:** smoke-resource-config.test.js hardcode `5` agents, smoke-agent-files.test.js hardcode array 5 ten. Quen cap nhat 1 trong 2 se lam test fail.
**How to avoid:** Cap nhat CA HAI files dong thoi: (1) so luong trong resource-config test, (2) AGENT_NAMES array + so luong trong agent-files test.
**Confidence: HIGH** — verified tu test source code.

## Code Examples

### Evidence Collector Agent File Structure
```markdown
---
name: pd-evidence-collector
description: Thu thap bang chung tu nhieu nguon doc lap — ghi ket qua co source citation theo format chuan
tools: Read, Grep, Glob, Bash, mcp__context7__resolve-library-id, mcp__context7__query-docs
model: sonnet
maxTurns: 25
effort: medium
---

<objective>
Thu thap bang chung tu 2+ nguon doc lap cho topic duoc giao. Moi claim PHAI co source citation.
</objective>

<process>
1. Doc topic va routing (internal/external) tu prompt.
2. [Thu thap evidence — internal: Read/Grep codebase, external: Context7/Bash]
3. Voi moi claim tim duoc: ghi source (file:dong cho internal, URL/library cho external)
4. Tinh confidence theo rule: HIGH = official docs/codebase, MEDIUM = 2+ sources, LOW = 1 source
5. Ghi ket qua theo research-store.js createEntry format:
   - Frontmatter: agent, created, source, topic, confidence [+ cac fields khac]
   - Body: `## Bang chung` voi claims co inline `(confidence: LEVEL)`
   - Claim format: `- [noi dung claim] — [source] (confidence: LEVEL)`
6. [Buoc cuoi: ghi log entry theo appendAuditLog format de orchestrator xu ly]
</process>

<rules>
- KHONG DUOC ghi claim khong co source — ghi "KHONG TIM THAY" thay vi fabricate
- Moi claim PHAI co source separator (—) va confidence marker
- Thu thap tu IT NHAT 2 nguon doc lap
- Dung tieng Viet co dau
</rules>
```

### Fact Checker Agent File Structure
```markdown
---
name: pd-fact-checker
description: Xac minh bang chung tu Evidence Collector — kiem tra source con valid, phat hien claim thieu co so
tools: Read, Grep, Glob, WebSearch, mcp__context7__resolve-library-id, mcp__context7__query-docs
model: opus
maxTurns: 15
effort: high
---

<objective>
Kiem tra tinh chinh xac cua research file tu Evidence Collector. Verify sources, phat hien claim thieu bang chung.
</objective>

<process>
1. Doc research file duoc chi dinh tu prompt.
2. Parse frontmatter va body de lay danh sach claims.
3. Voi moi claim co source:
   - Internal source (file:dong): Read file, kiem tra dong do co noi dung khop
   - External source (URL/library): Dung WebSearch/Context7 kiem tra source TON TAI
4. Voi claim confidence LOW: tim them source. Neu khong tim duoc — danh dau "KHONG XAC MINH DUOC"
5. KHONG ghi de noi dung Evidence Collector. Chi THEM section `## Kiem tra Thuc te` voi:
   - Danh sach claims da verified/unverified
   - Claims thieu source bi flag
   - Summary confidence assessment
6. [Buoc cuoi: ghi log entry theo appendAuditLog format]
</process>

<rules>
- KHONG ghi de bat ky noi dung nao cua Evidence Collector
- Internal claims verify bang Read/Grep — co the dat HIGH confidence
- External claims chi verify source TON TAI — MEDIUM confidence toi da
- Dung tieng Viet co dau
</rules>
```

### AGENT_REGISTRY Extension
```javascript
// resource-config.js — them 2 entries
'pd-evidence-collector': {
  tier: 'builder',
  tools: ['Read', 'Grep', 'Glob', 'Bash', 'mcp__context7__resolve-library-id', 'mcp__context7__query-docs']
},
'pd-fact-checker': {
  tier: 'architect',
  tools: ['Read', 'Grep', 'Glob', 'WebSearch', 'mcp__context7__resolve-library-id', 'mcp__context7__query-docs']
},
```

### Test Updates
```javascript
// smoke-agent-files.test.js — cap nhat AGENT_NAMES
const AGENT_NAMES = [
  'pd-bug-janitor',
  'pd-code-detective',
  'pd-doc-specialist',
  'pd-repro-engineer',
  'pd-fix-architect',
  'pd-evidence-collector',
  'pd-fact-checker',
];

// Them 2 frontmatter tests
it('pd-evidence-collector co dung frontmatter', () => {
  const fm = parseAgentFrontmatter(join(AGENTS_DIR, 'pd-evidence-collector.md'));
  assert.equal(fm.name, 'pd-evidence-collector');
  assert.equal(fm.model, 'sonnet');
  assert.equal(fm.maxTurns, 25);
  assert.equal(fm.effort, 'medium');
  assert.deepEqual(fm.tools, ['Read', 'Grep', 'Glob', 'Bash', 'mcp__context7__resolve-library-id', 'mcp__context7__query-docs']);
});

it('pd-fact-checker co dung frontmatter', () => {
  const fm = parseAgentFrontmatter(join(AGENTS_DIR, 'pd-fact-checker.md'));
  assert.equal(fm.name, 'pd-fact-checker');
  assert.equal(fm.model, 'opus');
  assert.equal(fm.maxTurns, 15);
  assert.equal(fm.effort, 'high');
  assert.deepEqual(fm.tools, ['Read', 'Grep', 'Glob', 'WebSearch', 'mcp__context7__resolve-library-id', 'mcp__context7__query-docs']);
});
```

## Project Constraints (from CLAUDE.md)

- Dung tieng Viet toan bo, co dau chuan — ap dung cho agent description, prompt content, comments

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | node:test (built-in) |
| Config file | Khong co config rieng — chay qua package.json script |
| Quick run command | `node --test test/smoke-agent-files.test.js test/smoke-resource-config.test.js` |
| Full suite command | `npm test` |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| AGENT-01 | Evidence Collector agent file ton tai, co dung frontmatter, khop voi AGENT_REGISTRY | integration | `node --test test/smoke-agent-files.test.js` | Co (can mo rong) |
| AGENT-01 | AGENT_REGISTRY co 7 agents | unit | `node --test test/smoke-resource-config.test.js` | Co (can sua count) |
| AGENT-02 | Fact Checker agent file ton tai, co dung frontmatter, khop voi AGENT_REGISTRY | integration | `node --test test/smoke-agent-files.test.js` | Co (can mo rong) |
| AGENT-02 | AGENT_REGISTRY co 7 agents | unit | `node --test test/smoke-resource-config.test.js` | Co (can sua count) |

### Sampling Rate
- **Per task commit:** `node --test test/smoke-agent-files.test.js test/smoke-resource-config.test.js`
- **Per wave merge:** `npm test`
- **Phase gate:** Full suite green truoc verify

### Wave 0 Gaps
- [ ] Them 2 entries vao AGENT_NAMES array trong smoke-agent-files.test.js
- [ ] Them 2 frontmatter test cases cho 2 agents moi
- [ ] Doi 5 thanh 7 trong smoke-resource-config.test.js
- [ ] Doi comment/description "5 agent files" thanh "7 agent files"

## Sources

### Primary (HIGH confidence)
- `/home/please-done/.claude/agents/pd-code-detective.md` — Agent file pattern reference
- `/home/please-done/.claude/agents/pd-bug-janitor.md` — Simpler agent file pattern
- `/home/please-done/bin/lib/resource-config.js` — AGENT_REGISTRY structure, TIER_MAP, getAgentConfig
- `/home/please-done/bin/lib/research-store.js` — createEntry API, validateEvidence API
- `/home/please-done/bin/lib/confidence-scorer.js` — scoreConfidence, classifySource APIs
- `/home/please-done/bin/lib/audit-logger.js` — appendLogEntry, formatLogEntry APIs
- `/home/please-done/test/smoke-agent-files.test.js` — Test patterns can cap nhat
- `/home/please-done/test/smoke-resource-config.test.js` — AGENT_REGISTRY count test
- `/home/please-done/.planning/research/PITFALLS.md` — Pitfall 2 (fabricated citations), Pitfall 3 (circular verification)

### Secondary (MEDIUM confidence)
- `/home/please-done/.planning/research/FEATURES.md` — C-TS1, C-TS2 feature specs

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — khong co dependencies moi, chi tao files va sua existing code
- Architecture: HIGH — pattern 100% tu codebase hien tai, da co 5 agents lam precedent
- Pitfalls: HIGH — da doc PITFALLS.md chi tiet + verified voi source code

**Research date:** 2026-03-25
**Valid until:** 2026-04-25 (stable — pattern da established)
