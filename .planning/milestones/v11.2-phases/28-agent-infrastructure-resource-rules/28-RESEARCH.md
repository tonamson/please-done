# Phase 28: Agent Infrastructure & Resource Rules - Research

**Researched:** 2026-03-24
**Domain:** Claude Code native subagent infrastructure, tier-to-model routing, resource management (parallel limit, heavy lock, degradation)
**Confidence:** HIGH

## Summary

Phase 28 tao nen tang ha tang cho toan bo v2.1 Detective Orchestrator: 5 agent files tai `.claude/agents/`, module `resource-config.js` cung cap pure functions doc/map tier va kiem soat tai nguyen, va logic ha cap tu dong khi loi. Day la phase CODE-ONLY, khong sua workflow, khong sua skill file.

Tai lieu chinh thuc Claude Code (xac minh 2026-03-24) xac nhan: subagent files dung YAML frontmatter voi `name`, `description`, `model`, `tools`, `maxTurns`, `memory`, `effort`, `background` la cac fields chinh. Model field nhan gia tri `haiku`, `sonnet`, `opus`, hoac full model ID. Mac dinh la `inherit` neu khong chi dinh — do do PHAI ghi ro model trong moi agent file.

Diem quan trong: Du an co ZERO runtime dependencies va pattern pure function da chung minh qua 12 modules + 601 tests. resource-config.js PHAI tuan theo pattern nay: nhan tham so, tra ket qua, khong doc file, khong co side effects.

**Primary recommendation:** Tao 5 agent files theo dung Claude Code native format (YAML frontmatter + markdown body), tao resource-config.js theo pattern pure function cua logic-sync.js, va viet test truoc theo TDD pattern da co.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** Tao 5 agent files tai `.claude/agents/` theo format NATIVE Claude Code (khong phai custom format). Fields: `name`, `description`, `model`, `tools`, `maxTurns`.
- **D-02:** Giu `commands/pd/agents/` lam reference/documentation cho cross-platform — KHONG xoa, nhung `.claude/agents/` la source-of-truth cho Claude Code runtime.
- **D-03:** Workflow fix-bug.md spawn agents bang Agent tool voi agent name (vd: `Agent(name="pd-bug-janitor")`).
- **D-04:** Scout (Janitor, DocSpec) = haiku. Builder (Detective, Repro) = sonnet. Architect (Fix Architect) = opus. Ghi truc tiep trong YAML `model:` field cua moi agent file.
- **D-05:** KHONG tao bang mapping rieng — model field nam trong agent file, resource-config.js doc tu do.
- **D-06:** Pure function module tai `bin/lib/resource-config.js`. Exports: `getModelForTier(tier)`, `getAgentConfig(agentName)`, `getParallelLimit()`, `shouldDegrade(error)`.
- **D-07:** Module KHONG doc file. Config truyen qua tham so hoac hardcoded defaults. Nhat quan voi pattern 12 modules hien tai.
- **D-08:** Heavy Lock la LOGIC trong workflow orchestrator, KHONG phai module rieng. Orchestrator biet agent nao dang chay vi no la nguoi spawn.
- **D-09:** Quy tac: khi FastCode indexing hoac test suite dang chay (agent co `mcp__fastcode__*` trong tools), khong spawn agent nang thu 2. Orchestrator kiem tra truoc khi spawn.
- **D-10:** KHONG can lock file, KHONG can in-memory state — workflow markdown ghi logic truc tiep.
- **D-11:** Khi spawn 2 background agents fail (timeout > 120s hoac Agent tool error), orchestrator tu dong: (1) Ghi warning vao SESSION file, (2) Chay agents tuan tu, (3) Tiep tuc workflow binh thuong.
- **D-12:** KHONG hoi user khi ha cap — tu dong, non-blocking. User thay warning trong output.
- **D-13:** Agent files tai `.claude/agents/` KHONG can converter pipeline — la Claude Code native format. Converter chi xu ly skills va workflows.
- **D-14:** Workflow fix-bug.md se can converter update khi rewrite thanh orchestrator (Phase 32-33), KHONG phai Phase 28.
- **D-15:** Phase 28 chi tao agent files va resource-config.js — KHONG sua workflow.

### Claude's Discretion
- maxTurns cho tung agent (khoi diem hop ly, tinh chinh sau)
- Error message format khi degradation
- Unit test structure cho resource-config.js

### Deferred Ideas (OUT OF SCOPE)
- Converter pipeline update cho agent files — Phase 32-33 khi rewrite workflow
- Agent memory (`memory: project`) — v2.2 (MEM-05)
- Auto-detect RAM/CPU — v2.2 (ORCH-05)
- Cost estimation — v2.2 (ORCH-06)
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| ORCH-01 | Orchestrator anh xa Tier (Scout/Builder/Architect) sang model cu the (haiku/sonnet/opus) qua YAML frontmatter trong 5 agent files | 5 agent files voi `model:` field ghi ro (haiku/sonnet/opus). resource-config.js cung cap `getModelForTier()` va `getAgentConfig()` de truy van mapping |
| ORCH-02 | Orchestrator gioi han toi da 2 sub-agents chay song song tai moi thoi diem | resource-config.js export `getParallelLimit()` tra ve 2. Logic enforcement nam trong workflow (Phase 32), Phase 28 chi cung cap config |
| ORCH-03 | Orchestrator ap dung Heavy Lock — chi 1 tac vu nang (FastCode indexing hoac test suite) chay tai moi thoi diem | resource-config.js export `isHeavyAgent(agentName)` xac dinh agent nao la heavy dua tren tools list. Logic enforcement nam trong workflow |
| ORCH-04 | Orchestrator tu dong ha cap sang tuan tu khi spawn song song that bai (timeout/error), ghi warning vao SESSION | resource-config.js export `shouldDegrade(error)` tra boolean khi error la timeout/resource exhaustion. Warning format cung cap san |
</phase_requirements>

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Node.js built-in `node:test` | Node 24.13+ | Test runner | Da dung tu v1.1, 601 tests hien tai, khong them dependency |
| Node.js built-in `node:assert/strict` | Node 24.13+ | Assertions | Pattern da chung minh qua 12 modules |
| Node.js built-in `node:fs` | Node 24.13+ | KHONG dung trong resource-config.js | Pure function — KHONG doc file |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Claude Code native subagents | v2.1.32+ | Agent spawning, model routing | Khi tao agent files tai `.claude/agents/` |
| YAML frontmatter (built-in) | — | Agent config format | Claude Code tu parse — khong can js-yaml |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Hardcoded defaults trong resource-config.js | Doc agent files tu disk | Vi pham D-07 (KHONG doc file), them I/O dependency, pha vo pure function pattern |
| Separate mapping table | Ghi mapping trong agent YAML frontmatter | D-05 chon ghi model truc tiep — resource-config chi la query interface |
| In-memory lock state | Lock file tren disk | D-10 cam lock file — logic tracking nam trong workflow orchestrator |

**Installation:**
```bash
# KHONG co package nao can cai dat — zero runtime dependencies
```

## Architecture Patterns

### Recommended Project Structure

```
.claude/agents/                      # MOI — 5 agent files (Claude Code native)
  pd-bug-janitor.md                  # Scout tier, model: haiku
  pd-code-detective.md               # Builder tier, model: sonnet
  pd-doc-specialist.md               # Scout tier, model: haiku
  pd-repro-engineer.md               # Builder tier, model: sonnet
  pd-fix-architect.md                # Architect tier, model: opus
bin/lib/
  resource-config.js                 # MOI — pure function module
test/
  smoke-resource-config.test.js      # MOI — tests cho resource-config
commands/pd/agents/                  # GIU NGUYEN — reference/cross-platform docs
  pd-bug-janitor.md                  # Khong xoa, khong sua
  pd-code-detective.md
  pd-doc-specialist.md
  pd-repro-engineer.md
  pd-fix-architect.md
```

### Pattern 1: Claude Code Native Agent File Format

**What:** YAML frontmatter + markdown body, theo dung tai lieu chinh thuc Claude Code
**When to use:** Khi tao subagent files tai `.claude/agents/`
**Source:** https://code.claude.com/docs/en/sub-agents

```yaml
---
name: pd-bug-janitor
description: Nhan vien ve sinh boi canh — Loc log rac va trich xuat trieu chung vang. Dung khi bat dau dieu tra loi moi de thu thap 5 thong tin trieu chung cot loi.
tools: Read, Glob, Grep, AskUserQuestion, Bash
model: haiku
maxTurns: 15
effort: low
---

<objective>
Loc sach cac thong tin nhieu tu input cua nguoi dung va log he thong...
</objective>

<process>
1. Doc $ARGUMENTS hoac log file duoc cung cap...
</process>

<rules>
- Luon su dung tieng Viet co dau...
</rules>
```

**Fields bat buoc (theo tai lieu chinh thuc):**
- `name` — Identifier duy nhat, lowercase + hyphen
- `description` — Mo ta khi nao Claude nen delegate. PHAI cu the de Claude dispatch dung

**Fields tuy chon dung cho Phase 28:**
- `tools` — Allowlist tools. Neu bo thi inherit tat ca tu main (KHONG muon — can restrict)
- `model` — `haiku`, `sonnet`, `opus`, hoac full model ID. Mac dinh `inherit` — PHAI ghi ro
- `maxTurns` — Gioi han so luot agent chay. Ngan agent loop vo han
- `effort` — `low`/`medium`/`high`/`max`. Override session effort level

**Fields KHONG dung trong Phase 28 (deferred):**
- `memory` — Deferred to v2.2 (MEM-05)
- `background` — Deferred to Phase 32 (workflow integration)
- `hooks` — Deferred to Phase sau
- `mcpServers` — Detective va DocSpec dung MCP servers da config trong session
- `permissionMode` — De mac dinh (`default`)
- `isolation` — KHONG dung `worktree` (agents can cung working directory)
- `skills` — Subagents khong inherit skills tu parent

### Pattern 2: Pure Function Module (resource-config.js)

**What:** Module export pure functions voi hardcoded defaults, khong doc file, khong co side effects
**When to use:** Khi can truy van tier mapping, parallel limit, degradation logic
**Source:** Pattern da chung minh tu logic-sync.js, debug-cleanup.js, repro-test-generator.js

```javascript
// Source: pattern tu bin/lib/logic-sync.js
'use strict';

// ─── Constants ────────────────────────────────────────────
const TIER_MAP = {
  scout:     { model: 'haiku',  effort: 'low',    maxTurns: 15 },
  builder:   { model: 'sonnet', effort: 'medium', maxTurns: 25 },
  architect: { model: 'opus',   effort: 'high',   maxTurns: 30 },
};

const AGENT_REGISTRY = {
  'pd-bug-janitor':      { tier: 'scout',     tools: ['Read', 'Glob', 'Grep', 'AskUserQuestion', 'Bash'] },
  'pd-code-detective':   { tier: 'builder',   tools: ['Read', 'Glob', 'Grep', 'mcp__fastcode__code_qa'] },
  'pd-doc-specialist':   { tier: 'scout',     tools: ['Read', 'mcp__context7__resolve-library-id', 'mcp__context7__query-docs'] },
  'pd-repro-engineer':   { tier: 'builder',   tools: ['Read', 'Write', 'Edit', 'Bash'] },
  'pd-fix-architect':    { tier: 'architect',  tools: ['Read', 'Write', 'Edit', 'Bash', 'Glob', 'Grep'] },
};

const HEAVY_TOOL_PATTERNS = ['mcp__fastcode__'];
const PARALLEL_LIMIT = 2;
const DEGRADATION_TIMEOUT_MS = 120_000;

// ─── Pure Functions ───────────────────────────────────────

function getModelForTier(tier) { ... }
function getAgentConfig(agentName) { ... }
function getParallelLimit() { return PARALLEL_LIMIT; }
function isHeavyAgent(agentName) { ... }
function shouldDegrade(error) { ... }

module.exports = { getModelForTier, getAgentConfig, getParallelLimit, isHeavyAgent, shouldDegrade };
```

### Pattern 3: Test-Driven Development (TDD)

**What:** Viet test truoc, module sau. Pattern da dung tu v1.1
**When to use:** Khi tao resource-config.js va khi verify agent files
**Source:** Pattern tu test/smoke-repro-test-generator.test.js

```javascript
'use strict';
const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { getModelForTier, getAgentConfig, shouldDegrade } = require('../bin/lib/resource-config');

describe('getModelForTier', () => {
  it('tra ve haiku cho scout tier', () => {
    assert.equal(getModelForTier('scout').model, 'haiku');
  });
  // ...
});

describe('shouldDegrade', () => {
  it('tra ve true khi error la timeout', () => {
    assert.equal(shouldDegrade({ code: 'TIMEOUT', duration: 130000 }), true);
  });
  it('tra ve false khi error binh thuong', () => {
    assert.equal(shouldDegrade({ code: 'SYNTAX_ERROR' }), false);
  });
});
```

### Anti-Patterns to Avoid

- **Doc file trong pure function:** resource-config.js KHONG DUOC doc `.claude/agents/*.md`. Config hardcoded hoac truyen qua tham so (D-07)
- **Tao lock file/in-memory state:** Heavy Lock la logic workflow, KHONG phai module state (D-08, D-10)
- **Dung `model: inherit`:** Mac dinh la inherit — PHAI ghi ro haiku/sonnet/opus de tranh tat ca agents chay cung model cua main session
- **Agent spawn agent:** Subagents KHONG the spawn subagents khac — chi main session co the dispatch
- **Sua workflow trong Phase 28:** D-15 cam ro — Phase 28 chi tao agent files va resource-config.js

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| YAML frontmatter parsing | Custom YAML parser | Claude Code built-in parser | Claude Code tu parse frontmatter khi load agent files |
| Agent spawning/dispatch | Custom dispatch logic | Claude Code native Agent tool | Platform da co infra: model routing, context isolation, tool restriction |
| Model routing | Dynamic model selection | Hardcoded `model:` field trong agent file | D-04: ghi truc tiep, khong can logic phuc tap |
| Inter-agent communication | IPC/messaging system | Evidence files (.planning/debug/) | Subagents khong giao tiep truc tiep — dung file-based handoff |
| Permission management | Custom permission logic | Claude Code `permissionMode` + `tools` allowlist | Platform da co 5 permission modes built-in |

**Key insight:** Phase 28 chi TAO INFRASTRUCTURE (agent files + config module). Logic ENFORCEMENT (parallel limit, heavy lock, degradation) se nam trong workflow orchestrator o Phase 32.

## Common Pitfalls

### Pitfall 1: Model field bi bo trong — mac dinh `inherit`
**What goes wrong:** Agent file thieu `model:` field → Claude Code mac dinh `inherit` → tat ca agents chay cung model cua main session (co the la opus) → chi phi tang 10-20x, hoac tat ca chay haiku neu user dang dung haiku
**Why it happens:** `model` la optional field — de quen ghi khi tao agent file
**How to avoid:** Moi agent file PHAI co `model:` field ghi ro. Test kiem tra 5 agent files deu co model field khac `inherit`
**Warning signs:** Tat ca agents chay cung 1 model trong log. Chi phi bat thuong

### Pitfall 2: Description khong du cu the — Claude dispatch sai agent
**What goes wrong:** Claude khong biet khi nao nen dung agent nao, dispatch sai hoac khong dispatch
**Why it happens:** `description` la yeu to CHINH de Claude quyet dinh dispatch. Mo ta chung chung → dispatch khong chinh xac
**How to avoid:** Description phai ghi RO: (1) nhiem vu cu the, (2) khi nao dung, (3) input/output mong doi. Vi du: "Dung khi bat dau dieu tra loi moi de thu thap 5 thong tin trieu chung cot loi"
**Warning signs:** Claude khong tu dong chon agent khi duoc yeu cau. Chon sai agent cho task

### Pitfall 3: Tools allowlist thieu — agent inherit tat ca tools
**What goes wrong:** Scout agent (haiku) co Write/Edit access → co the sua code khi chi can doc → pha vo principle of least privilege
**Why it happens:** `tools` la optional — neu bo thi agent inherit TAT CA tools tu main session
**How to avoid:** MOI agent file PHAI co `tools:` field voi allowlist cu the. Janitor va DocSpec KHONG co Write/Edit. Detective KHONG co Write/Edit
**Warning signs:** Scout agent sua file. DocSpec ghi file ma khong nen ghi

### Pitfall 4: resource-config.js doc file thay vi hardcode
**What goes wrong:** Module co I/O side effects → khong con la pure function → khong test duoc don gian → pha vo pattern cua 12 modules hien tai
**Why it happens:** Developer muon "doc tu agent files de dong bo" — nhung D-07 cam ro
**How to avoid:** Hardcode TIER_MAP va AGENT_REGISTRY. Neu can dong bo, viet integration test verify agent files match voi hardcoded values
**Warning signs:** `require('fs')` xuat hien trong resource-config.js. Test can mock fs

### Pitfall 5: Nham lan scope Phase 28 — sua workflow hoac converter
**What goes wrong:** Mat thoi gian sua workflow fix-bug.md, tao converter cho agent files — nhung D-14, D-15 cam ro
**Why it happens:** Muon "lam xong luon" thay vi tuan theo build order
**How to avoid:** Phase 28 CHI tao: (1) 5 agent files, (2) resource-config.js, (3) tests. KHONG sua bat ky file nao khac
**Warning signs:** Git diff cho thay thay doi trong `workflows/`, `commands/pd/fix-bug.md`, hoac `bin/lib/converters/`

### Pitfall 6: maxTurns qua cao hoac qua thap
**What goes wrong:** Qua cao (50+) → agent chay vo han, tieu het token. Qua thap (3) → agent khong du thoi gian hoan thanh nhiem vu
**Why it happens:** Khong co benchmark — chon so tuy y
**How to avoid:** Dung gia tri khoi diem hop ly dua tren do phuc tap: Scout=15, Builder=25, Architect=30. Tinh chinh sau khi co du lieu thuc te
**Warning signs:** Agent tra ve ket qua khong day du vi het turns. Agent chay 40+ turns cho task don gian

## Code Examples

### Agent File: pd-bug-janitor.md (Scout/haiku)

```markdown
---
name: pd-bug-janitor
description: Nhan vien ve sinh boi canh — Loc log rac va trich xuat trieu chung vang. Dung khi bat dau dieu tra loi moi de thu thap 5 thong tin trieu chung cot loi.
tools: Read, Glob, Grep, AskUserQuestion, Bash
model: haiku
maxTurns: 15
effort: low
---

<objective>
Loc sach cac thong tin nhieu tu input cua nguoi dung va log he thong de trich xuat 5 thong tin trieu chung cot loi.
</objective>

<process>
1. Doc $ARGUMENTS hoac log file duoc cung cap.
2. **Truy hoi tri thuc (Knowledge Recall):**
   - Su dung `Grep` hoac `Glob` de tim kiem tu khoa/thong bao loi trong `.planning/bugs/`.
   - Neu co trung khop, trich xuat link den BUG cu va nguyen nhan da tung sua.
3. Loai bo cac phan log lap lai, log thanh cong khong lien quan.
4. Neu thong tin thieu, su dung AskUserQuestion de hoan thien 5 cau hoi vang:
   - **Mong doi:** Ket qua dung phai nhu the nao?
   - **Thuc te:** Ket qua sai dang dien ra la gi?
   - **Log/Error:** Thong bao loi cu the (Stack trace).
   - **Timeline:** Loi xuat hien tu khi nao? Co thay doi gi gan day khong?
   - **Repro:** Cac buoc toi gian de nhin thay loi.
5. Tong hop thanh file tom tat tai `.planning/debug/evidence_janitor.md` (Kem muc `## RELATED HISTORICAL BUGS` neu co).
</process>

<rules>
- Luon su dung tieng Viet co dau.
- Cuc ky ngan gon, chi giu lai thong tin co gia tri dieu tra.
- Khong duoc tu y suy doan nguyen nhan code o buoc nay.
</rules>
```

### Module: resource-config.js (Pure Function Pattern)

```javascript
// Source: pattern tu bin/lib/logic-sync.js va bin/lib/debug-cleanup.js
'use strict';

// ─── Constants ────────────────────────────────────────────

const TIER_MAP = {
  scout:     { model: 'haiku',  effort: 'low',    maxTurns: 15 },
  builder:   { model: 'sonnet', effort: 'medium', maxTurns: 25 },
  architect: { model: 'opus',   effort: 'high',   maxTurns: 30 },
};

const AGENT_REGISTRY = {
  'pd-bug-janitor':      { tier: 'scout',     tools: ['Read', 'Glob', 'Grep', 'AskUserQuestion', 'Bash'] },
  'pd-code-detective':   { tier: 'builder',   tools: ['Read', 'Glob', 'Grep', 'mcp__fastcode__code_qa'] },
  'pd-doc-specialist':   { tier: 'scout',     tools: ['Read', 'mcp__context7__resolve-library-id', 'mcp__context7__query-docs'] },
  'pd-repro-engineer':   { tier: 'builder',   tools: ['Read', 'Write', 'Edit', 'Bash'] },
  'pd-fix-architect':    { tier: 'architect',  tools: ['Read', 'Write', 'Edit', 'Bash', 'Glob', 'Grep'] },
};

const HEAVY_TOOL_PATTERNS = ['mcp__fastcode__'];

const PARALLEL_LIMIT = 2;
const DEGRADATION_TIMEOUT_MS = 120_000;

// ─── getModelForTier ──────────────────────────────────────

/**
 * Tra ve model config tu tier string.
 *
 * @param {string} tier - 'scout' | 'builder' | 'architect'
 * @returns {{ model: string, effort: string, maxTurns: number }}
 * @throws {Error} Khi tier khong hop le
 */
function getModelForTier(tier) {
  if (!tier || typeof tier !== 'string') {
    throw new Error('getModelForTier: thieu tham so tier');
  }
  const config = TIER_MAP[tier.toLowerCase()];
  if (!config) {
    throw new Error(`getModelForTier: tier khong hop le: ${tier}`);
  }
  return { ...config };
}

// ─── getAgentConfig ───────────────────────────────────────

/**
 * Tra ve full config cua agent: tier, model, tools, maxTurns, effort.
 *
 * @param {string} agentName - Ten agent (vi du: 'pd-bug-janitor')
 * @returns {{ name: string, tier: string, model: string, tools: string[], maxTurns: number, effort: string }}
 * @throws {Error} Khi agent khong ton tai trong registry
 */
function getAgentConfig(agentName) {
  if (!agentName || typeof agentName !== 'string') {
    throw new Error('getAgentConfig: thieu tham so agentName');
  }
  const agentInfo = AGENT_REGISTRY[agentName];
  if (!agentInfo) {
    throw new Error(`getAgentConfig: agent khong ton tai: ${agentName}`);
  }
  const tierConfig = TIER_MAP[agentInfo.tier];
  return {
    name: agentName,
    tier: agentInfo.tier,
    model: tierConfig.model,
    tools: [...agentInfo.tools],
    maxTurns: tierConfig.maxTurns,
    effort: tierConfig.effort,
  };
}

// ─── getParallelLimit ─────────────────────────────────────

/**
 * Tra ve gioi han so luong agents chay song song.
 *
 * @returns {number}
 */
function getParallelLimit() {
  return PARALLEL_LIMIT;
}

// ─── isHeavyAgent ─────────────────────────────────────────

/**
 * Kiem tra agent co phai "heavy" (dung FastCode indexing hoac tuong tu).
 *
 * @param {string} agentName - Ten agent
 * @returns {boolean}
 */
function isHeavyAgent(agentName) {
  const agentInfo = AGENT_REGISTRY[agentName];
  if (!agentInfo) return false;
  return agentInfo.tools.some(tool =>
    HEAVY_TOOL_PATTERNS.some(pattern => tool.startsWith(pattern))
  );
}

// ─── shouldDegrade ────────────────────────────────────────

/**
 * Kiem tra error co nen trigger ha cap sang tuan tu.
 *
 * @param {{ code: string, duration?: number, message?: string }} error
 * @returns {boolean}
 */
function shouldDegrade(error) {
  if (!error || typeof error !== 'object') return false;
  // Timeout
  if (error.code === 'TIMEOUT' || (error.duration && error.duration > DEGRADATION_TIMEOUT_MS)) {
    return true;
  }
  // Resource exhaustion
  if (error.code === 'RESOURCE_EXHAUSTED' || error.code === 'RATE_LIMIT') {
    return true;
  }
  // Agent tool error
  if (error.message && /agent.*fail|spawn.*fail|subagent.*error/i.test(error.message)) {
    return true;
  }
  return false;
}

module.exports = {
  getModelForTier,
  getAgentConfig,
  getParallelLimit,
  isHeavyAgent,
  shouldDegrade,
  // Export constants cho testing
  TIER_MAP,
  AGENT_REGISTRY,
  PARALLEL_LIMIT,
  HEAVY_TOOL_PATTERNS,
};
```

### Test: smoke-resource-config.test.js (TDD Pattern)

```javascript
'use strict';
const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const {
  getModelForTier, getAgentConfig, getParallelLimit,
  isHeavyAgent, shouldDegrade, TIER_MAP, AGENT_REGISTRY,
} = require('../bin/lib/resource-config');

describe('getModelForTier', () => {
  it('tra ve haiku cho scout', () => {
    const result = getModelForTier('scout');
    assert.equal(result.model, 'haiku');
    assert.equal(result.effort, 'low');
  });
  it('tra ve sonnet cho builder', () => {
    assert.equal(getModelForTier('builder').model, 'sonnet');
  });
  it('tra ve opus cho architect', () => {
    assert.equal(getModelForTier('architect').model, 'opus');
  });
  it('throw khi tier null', () => {
    assert.throws(() => getModelForTier(null), /thieu tham so/);
  });
  it('throw khi tier khong hop le', () => {
    assert.throws(() => getModelForTier('invalid'), /khong hop le/);
  });
});

describe('getAgentConfig', () => {
  it('tra ve full config cho pd-bug-janitor', () => {
    const config = getAgentConfig('pd-bug-janitor');
    assert.equal(config.tier, 'scout');
    assert.equal(config.model, 'haiku');
    assert.ok(config.tools.includes('Read'));
    assert.ok(config.maxTurns > 0);
  });
  it('throw khi agent khong ton tai', () => {
    assert.throws(() => getAgentConfig('unknown-agent'), /khong ton tai/);
  });
});

describe('getParallelLimit', () => {
  it('tra ve 2', () => {
    assert.equal(getParallelLimit(), 2);
  });
});

describe('isHeavyAgent', () => {
  it('true cho pd-code-detective (co fastcode)', () => {
    assert.equal(isHeavyAgent('pd-code-detective'), true);
  });
  it('false cho pd-bug-janitor (khong co fastcode)', () => {
    assert.equal(isHeavyAgent('pd-bug-janitor'), false);
  });
  it('false cho agent khong ton tai', () => {
    assert.equal(isHeavyAgent('nonexistent'), false);
  });
});

describe('shouldDegrade', () => {
  it('true khi TIMEOUT', () => {
    assert.equal(shouldDegrade({ code: 'TIMEOUT' }), true);
  });
  it('true khi duration vuot nguong', () => {
    assert.equal(shouldDegrade({ code: 'OTHER', duration: 130000 }), true);
  });
  it('true khi RESOURCE_EXHAUSTED', () => {
    assert.equal(shouldDegrade({ code: 'RESOURCE_EXHAUSTED' }), true);
  });
  it('true khi RATE_LIMIT', () => {
    assert.equal(shouldDegrade({ code: 'RATE_LIMIT' }), true);
  });
  it('true khi message co agent fail', () => {
    assert.equal(shouldDegrade({ code: 'ERR', message: 'Agent spawn failed' }), true);
  });
  it('false khi error binh thuong', () => {
    assert.equal(shouldDegrade({ code: 'SYNTAX_ERROR' }), false);
  });
  it('false khi null', () => {
    assert.equal(shouldDegrade(null), false);
  });
});
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `allowed-tools` trong custom frontmatter | `tools` (Claude Code native field) | Claude Code v2.1.32 | Agent files PHAI dung `tools:` khong phai `allowed-tools:` |
| `tier` field trong custom frontmatter | `model:` field truc tiep | Claude Code v2.1.32 | Khong co `tier:` field native — ghi model truc tiep |
| Custom agent format | Claude Code YAML frontmatter + markdown body | Claude Code v2.1.32 | Cac agent files hien tai tai `commands/pd/agents/` dung custom format can chuyen sang native |
| Task tool | Agent tool (renamed v2.1.63) | Claude Code v2.1.63 | Dung `Agent` thay vi `Task` — nhung `Task` van hoat dong nhu alias |

**Deprecated/outdated:**
- `allowed-tools` field trong agent files hien tai — chuyen sang `tools:` (native Claude Code)
- `tier` field trong agent files hien tai — thay bang `model:` truc tiep
- Agent files tai `commands/pd/agents/` — van giu lam reference nhung `.claude/agents/` la source-of-truth

## Agent File Conversion Map

Chi tiet chuyen doi tu format hien tai (`commands/pd/agents/`) sang Claude Code native (`.claude/agents/`):

| Agent | Field hien tai | Field moi (native) | Gia tri |
|-------|---------------|---------------------|---------|
| pd-bug-janitor | `tier: scout` | `model: haiku` | Them `effort: low`, `maxTurns: 15` |
| pd-bug-janitor | `allowed-tools: Read, AskUserQuestion, Bash` | `tools: Read, Glob, Grep, AskUserQuestion, Bash` | Them Glob, Grep (can cho Knowledge Recall) |
| pd-code-detective | `tier: builder` | `model: sonnet` | Them `effort: medium`, `maxTurns: 25` |
| pd-code-detective | `allowed-tools: Read, Glob, Grep, mcp__fastcode__code_qa` | `tools: Read, Glob, Grep, mcp__fastcode__code_qa` | Khong doi |
| pd-doc-specialist | `tier: scout` | `model: haiku` | Them `effort: low`, `maxTurns: 15` |
| pd-doc-specialist | `allowed-tools: mcp__context7__*` | `tools: Read, mcp__context7__resolve-library-id, mcp__context7__query-docs` | Them Read, tach cu the mcp tools |
| pd-repro-engineer | `tier: builder` | `model: sonnet` | Them `effort: medium`, `maxTurns: 25` |
| pd-repro-engineer | `allowed-tools: Read, Write, Edit, Bash` | `tools: Read, Write, Edit, Bash` | Khong doi |
| pd-fix-architect | `tier: architect` | `model: opus` | Them `effort: high`, `maxTurns: 30` |
| pd-fix-architect | `allowed-tools: Read, Write, Edit, Bash` | `tools: Read, Write, Edit, Bash, Glob, Grep` | Them Glob, Grep (can cho evidence tong hop) |

**Body (markdown system prompt):** Giu nguyen noi dung tu `commands/pd/agents/`, chi cap nhat heading style phu hop.

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Node.js built-in `node:test` (v24.13.0) |
| Config file | Khong can — chay truc tiep qua `node --test` |
| Quick run command | `node --test test/smoke-resource-config.test.js` |
| Full suite command | `node --test 'test/*.test.js'` |

### Phase Requirements -> Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| ORCH-01 | 5 agent files co model mapping dung (haiku/sonnet/opus theo tier) | unit + integration | `node --test test/smoke-resource-config.test.js -x` | Wave 0 |
| ORCH-02 | getParallelLimit() tra ve 2 | unit | `node --test test/smoke-resource-config.test.js -x` | Wave 0 |
| ORCH-03 | isHeavyAgent() xac dinh dung agent nao la heavy | unit | `node --test test/smoke-resource-config.test.js -x` | Wave 0 |
| ORCH-04 | shouldDegrade() tra ve true cho timeout/resource errors | unit | `node --test test/smoke-resource-config.test.js -x` | Wave 0 |

### Sampling Rate
- **Per task commit:** `node --test test/smoke-resource-config.test.js`
- **Per wave merge:** `node --test 'test/*.test.js'` (full suite 601+ tests)
- **Phase gate:** Full suite green truoc khi verify

### Wave 0 Gaps
- [ ] `test/smoke-resource-config.test.js` — covers ORCH-01, ORCH-02, ORCH-03, ORCH-04
- [ ] Framework: da co san (node:test), khong can cai dat gi them

## Open Questions

1. **maxTurns toi uu cho tung agent?**
   - What we know: Scout can it turns (15), Builder can trung binh (25), Architect can nhieu nhat (30)
   - What's unclear: Gia tri toi uu phu thuoc vao do phuc tap thuc te cua task — chi biet khi chay
   - Recommendation: Dung gia tri khoi diem tren, tinh chinh sau khi co du lieu tu Phase 32 (workflow integration)

2. **DocSpec tools: ghi cu the hay dung pattern?**
   - What we know: Tai lieu Claude Code cho phep `tools:` la allowlist cu the. MCP tools ghi theo ten day du (`mcp__context7__resolve-library-id`)
   - What's unclear: Neu Context7 them tool moi, phai cap nhat agent file
   - Recommendation: Ghi cu the 2 tools hien tai + Read. Cap nhat khi Context7 them tool moi

3. **Integration test: verify agent files match resource-config.js?**
   - What we know: D-07 cam resource-config.js doc file. Nhung can dam bao 2 nguon dong bo
   - What's unclear: Co nen tao integration test doc agent files va so sanh voi hardcoded values?
   - Recommendation: CO — tao integration test trong test file rieng, chay nhu phan cua full suite. Test nay doc file (vi la test, khong phai module) va verify model/tools khop

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | Test runner, module execution | Co | 24.13.0 | — |
| npm | Package scripts | Co | 11.6.2 | — |
| Claude Code | Agent file loading, subagent spawning | Co (inference) | — | Agents khong load nhung module van hoat dong |
| `.claude/` directory | Agent files | Co (nhung chua co `agents/` sub-dir) | — | Tao moi |

**Missing dependencies with no fallback:** Khong co

**Missing dependencies with fallback:** Khong co

## Project Constraints (from CLAUDE.md)

- **Ngon ngu:** Dung tieng Viet toan bo, co dau chuan — ap dung cho agent descriptions, comments, error messages
- **Zero runtime dependencies:** KHONG them bat ky package nao
- **Pure function pattern:** Module KHONG doc file, content truyen qua tham so
- **TDD:** Viet test truoc, module sau
- **node:test runner:** Dung built-in test framework

## Sources

### Primary (HIGH confidence)
- [Claude Code Sub-Agents Documentation](https://code.claude.com/docs/en/sub-agents) — YAML frontmatter fields, model routing, tool restriction, background mode, memory, hooks, nesting limits. Xac minh truc tiep 2026-03-24
- Codebase analysis: `commands/pd/agents/pd-*.md` (5 files hien tai), `bin/lib/logic-sync.js`, `bin/lib/debug-cleanup.js`, `bin/lib/repro-test-generator.js` — Pattern pure function da chung minh
- `.planning/research/STACK.md` — Stack decisions, agent frontmatter format verified
- `.planning/research/ARCHITECTURE.md` — Build order, component boundaries
- `.planning/research/PITFALLS.md` — No-nesting constraint, context window limits, 8 pitfalls documented

### Secondary (MEDIUM confidence)
- [DEV.to: How to Structure Claude Code for Production](https://dev.to/lizechengnet/how-to-structure-claude-code-for-production-mcp-servers-subagents-and-claudemd-2026-guide-4gjn) — Subagent best practices
- [eesel.ai: Claude Code multiple agent systems guide](https://www.eesel.ai/blog/claude-code-multiple-agent-systems-complete-2026-guide) — Multi-agent coordination patterns

### Tertiary (LOW confidence)
- Khong co — tat ca findings da xac minh qua tai lieu chinh thuc

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — zero dependencies, dung built-in Node.js APIs, pattern da chung minh qua 12 modules
- Architecture: HIGH — tai lieu Claude Code chinh thuc xac nhan frontmatter fields, pattern pure function da co 601 tests
- Pitfalls: HIGH — xac minh tu tai lieu chinh thuc (nesting constraint, inherit default) + PITFALLS.md da nghien cuu chi tiet

**Research date:** 2026-03-24
**Valid until:** 2026-04-24 (30 ngay — stack on dinh, Claude Code subagent API stable)

---
*Phase: 28-agent-infrastructure-resource-rules*
*Research completed: 2026-03-24*
