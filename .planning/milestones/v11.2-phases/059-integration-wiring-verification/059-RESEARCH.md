# Phase 59: Integration Wiring & Verification Gaps - Research

**Researched:** 2026-03-27
**Domain:** Integration wiring (JS module wiring) + formal verification (documentation)
**Confidence:** HIGH

## Summary

Phase 59 dong 4 gap con lai tu v5.0 audit: (1) wire `getModelForTier(tier, platform)` vao production dispatch flow thong qua `getAgentConfig()`, (2) copy `pd-sec-scanner.md` sang `.claude/agents/` voi format chuyen doi, (3) tao VERIFICATION.md cho Phase 52, va (4) cap nhat 053-VERIFICATION.md phan anh trang thai hien tai.

Tat ca 4 thay doi deu straightforward — code da ton tai, chi can wire va document. `getModelForTier()` da co platform param tu Phase 54, `getAgentConfig()` chi can them 1 optional param va 1 dong goi. 053 gaps da duoc fix trong cac phases sau (agent files hien tai da co dung tools). Phase 52 verification chi can doc resource-config.js va confirm TIER_MAP + AGENT_REGISTRY.

**Primary recommendation:** Wire `platform` param vao `getAgentConfig()`, them it nhat 1 caller trong `parallel-dispatch.js` truyen platform. Copy + convert pd-sec-scanner.md. Tao 2 VERIFICATION.md documents.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** Wire `getModelForTier(tier, platform)` thong qua `getAgentConfig()` — them optional `platform` param vao `getAgentConfig(agentName, platform?)`. Khi co platform, goi `getModelForTier(tier, platform)` de resolve model cu the. Tat ca callers (`buildParallelPlan`, `buildScannerPlan`, `buildResearchSquadPlan`) tu dong huong loi.
- **D-02:** Backward compatible — `getAgentConfig('pd-code-detective')` khong truyen platform van tra ve generic model nhu hien tai.
- **D-03:** It nhat 1 production caller trong `parallel-dispatch.js` phai truyen platform param de satisfy PLAT-01/PLAT-02.
- **D-04:** Copy `commands/pd/agents/pd-sec-scanner.md` sang `.claude/agents/pd-sec-scanner.md` — nhat quan voi 6 agents khac da o `.claude/agents/`.
- **D-05:** Giu nguyen file goc tai `commands/pd/agents/` de khong break references hien co trong workflows.
- **D-06:** Cap nhat AGENT_REGISTRY neu can — dam bao path consistency.
- **D-07:** Verify trang thai HIEN TAI cua TIER_MAP va AGENT_REGISTRY — phan anh dung thuc te sau tat ca phases da chay.
- **D-08:** Scope verification: AGEN-01 (3-tier model system) va AGEN-09 (pd-regression-analyzer in registry).
- **D-09:** Format nhat quan voi cac VERIFICATION.md khac trong project (YAML frontmatter + Observable Truths table).
- **D-10:** Re-verify 3 gaps tu initial verification: pd-codebase-mapper (Write tool), pd-feature-analyst (Bash + Context7), pd-regression-analyzer (wrap library functions).
- **D-11:** Cap nhat status dua tren trang thai hien tai — neu gap da duoc fix o phase sau thi danh dau resolved.
- **D-12:** Neu gap van con → giu nguyen status, ghi chu "not addressed in subsequent phases".

### Claude's Discretion
- Test strategy cho verification (manual check vs automated)
- Exact wording trong VERIFICATION.md reports
- Whether to add platform param to specific callers beyond minimum requirement

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| AGEN-01 | 3-tier model system (Scout/Builder/Architect) replaces hardcoded model names | Phase 52 VERIFICATION.md xac nhan TIER_MAP co 3 tiers, getModelForTier() hoat dong |
| AGEN-09 | pd-regression-analyzer duoc them vao AGENT_REGISTRY | Phase 52 VERIFICATION.md xac nhan entry ton tai trong AGENT_REGISTRY |
| PLAT-01 | TIER_MAP config map tier->model per platform | Wire getModelForTier(tier, platform) vao getAgentConfig() de production callers dung platform mapping |
| PLAT-02 | Fallback tu dong — nen tang thieu tier cao -> ha cap | getModelForTier() da co fallback logic, wire vao getAgentConfig() la du |
| PARA-02 | isHeavyAgent() check truoc khi spawn | Da implement trong buildScannerPlan() — verification xac nhan |
</phase_requirements>

## Project Constraints (from CLAUDE.md)

- Dung tieng viet toan bo, co dau chuan

## Architecture Patterns

### Hien trang code can thay doi

#### 1. `getAgentConfig()` trong resource-config.js (line 269-292)

Hien tai chi nhan `agentName`, tra ve generic model tu TIER_MAP. Can them `platform` param:

```javascript
// HIEN TAI (line 269)
function getAgentConfig(agentName) {
  // ...
  const tierConfig = TIER_MAP[tier];
  return {
    name: agentName,
    tier,
    model: tierConfig.model,  // generic: "haiku", "sonnet", "opus"
    effort: tierConfig.effort,
    maxTurns: tierConfig.maxTurns,
    tools: [...tools],
    ...extra,
  };
}

// SAU KHI WIRE (D-01)
function getAgentConfig(agentName, platform) {
  // ...
  const tierConfig = getModelForTier(tier, platform);  // platform-aware
  return {
    name: agentName,
    tier,
    model: tierConfig.model,  // platform-specific khi co platform
    effort: tierConfig.effort,
    maxTurns: tierConfig.maxTurns,
    tools: [...tools],
    ...extra,
  };
}
```

**Diem quan trong:** `getModelForTier(tier)` khong truyen platform van tra ve generic model (backward compatible — D-02). Vay `getModelForTier(tier, undefined)` = `TIER_MAP[tier]` spread. Thay doi nay KHONG anh huong bat ky caller nao hien co.

#### 2. Production callers trong parallel-dispatch.js

Cac callers hien tai (khong truyen platform):
- `buildParallelPlan()` line 32-33: `getAgentConfig('pd-code-detective')`, `getAgentConfig('pd-doc-specialist')`
- `buildResearchSquadPlan()` line 227-230: 4 `getAgentConfig()` calls
- `buildScannerPlan()` line 124: khong goi `getAgentConfig()` truc tiep (caller truyen categories)

**D-03 yeu cau:** It nhat 1 production caller truyen platform. `buildParallelPlan` la ung vien tu nhien nhat — them `platform` param vao function signature, truyen xuong `getAgentConfig()`.

#### 3. pd-sec-scanner format conversion

File nguon (`commands/pd/agents/pd-sec-scanner.md`) dung format cu:
```yaml
tier: scout
allowed-tools:
  - Read
  - Glob
  - Grep
  - mcp__fastcode__code_qa
```

File dich (`.claude/agents/`) can format moi:
```yaml
tools: Read, Glob, Grep, mcp__fastcode__code_qa
model: haiku
maxTurns: 15
effort: low
```

Chuyen doi: `tier: scout` -> lay tu `TIER_MAP.scout` -> `model: haiku, maxTurns: 15, effort: low`. `allowed-tools` YAML array -> `tools: comma-separated string`.

Body (objective, process, rules) giu nguyen.

### Recommended Task Structure

```
Task 1: Wire platform vao getAgentConfig() + production caller
  - Sua getAgentConfig(agentName, platform?) trong resource-config.js
  - Sua buildParallelPlan(sessionDir, janitarEvidencePath, platform?)
  - Update exports/JSDoc
  - Cap nhat tests

Task 2: Copy pd-sec-scanner + update smoke test
  - Copy + convert format
  - Them vao AGENT_NAMES trong smoke test
  - Chay tests

Task 3: Tao Phase 52 VERIFICATION.md
  - Verify TIER_MAP (3 tiers, correct values)
  - Verify pd-regression-analyzer in AGENT_REGISTRY
  - Write 52-VERIFICATION.md

Task 4: Cap nhat 053-VERIFICATION.md
  - Re-verify 3 gaps
  - Update status based on current state
```

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Platform model resolution | Custom mapping logic | `getModelForTier(tier, platform)` da co san | Da implement, tested, co fallback chain |
| Agent config merge | Manual tier+registry merge | `getAgentConfig()` voi platform piped through | Pure function, copy-on-return, no mutation |
| YAML frontmatter format | Parse/generate YAML | Manual text editing | Frontmatter cuc ky don gian, khong can parser |

## Common Pitfalls

### Pitfall 1: getAgentConfig backward compat break
**What goes wrong:** Thay doi `getAgentConfig()` return value khi khong truyen platform
**Why it happens:** Neu dung `getModelForTier(tier, undefined)` thay vi `TIER_MAP[tier]`, ket qua co the khac
**How to avoid:** Verify rang `getModelForTier('scout')` tra ve exact same object nhu `{ ...TIER_MAP.scout }`. Hien tai da dung — `getModelForTier` khi khong co platform tra ve `{ ...entry }` = `{ ...TIER_MAP[tier] }`.
**Warning signs:** Existing tests fail sau khi thay doi

### Pitfall 2: pd-sec-scanner format mismatch
**What goes wrong:** Copy file nguyen trang — smoke test fail vi format khac (tier vs model, allowed-tools vs tools)
**Why it happens:** `commands/pd/agents/` dung format cu, `.claude/agents/` dung format moi
**How to avoid:** Convert frontmatter khi copy. Giu body nguyen ven.
**Warning signs:** `parseFrontmatter()` / `parseAgentFrontmatter()` tra ve undefined cho tools

### Pitfall 3: 053 gaps — confuse "fixed" voi "verified"
**What goes wrong:** Danh dau gap la "resolved" nhung khong thuc su verify hien trang
**Why it happens:** Assumptions tu code changes khong duoc kiem tra
**How to avoid:** Doc truc tiep file hien tai, compare voi gap description

### Pitfall 4: Smoke test AGENT_NAMES list outdated
**What goes wrong:** Copy pd-sec-scanner vao .claude/agents/ nhung khong them vao AGENT_NAMES trong test
**Why it happens:** Test file hardcode danh sach agents
**How to avoid:** Them 'pd-sec-scanner' vao AGENT_NAMES array (hien tai 13, se thanh 14)

## Code Examples

### Wire platform vao getAgentConfig()

```javascript
// Source: bin/lib/resource-config.js — hien tai line 269
function getAgentConfig(agentName, platform) {
  if (agentName == null || typeof agentName !== "string") {
    throw new Error("thieu tham so agentName");
  }

  const agent = AGENT_REGISTRY[agentName];
  if (!agent) {
    throw new Error(`agent khong ton tai: ${agentName}`);
  }

  const { tier, tools, ...extra } = agent;
  const tierConfig = getModelForTier(tier, platform);

  return {
    name: agentName,
    tier,
    model: tierConfig.model,
    effort: tierConfig.effort,
    maxTurns: tierConfig.maxTurns,
    tools: [...tools],
    ...extra,
  };
}
```

### Wire platform vao buildParallelPlan()

```javascript
// Source: bin/lib/parallel-dispatch.js — hien tai line 29
function buildParallelPlan(sessionDir, janitarEvidencePath, platform) {
  const warnings = [];

  const detectiveConfig = getAgentConfig('pd-code-detective', platform);
  const docSpecConfig = getAgentConfig('pd-doc-specialist', platform);

  // ... rest unchanged
}
```

### pd-sec-scanner frontmatter conversion

```yaml
# TU (commands/pd/agents/pd-sec-scanner.md):
---
name: pd-sec-scanner
description: Scanner bao mat tong hop — ...
tier: scout
allowed-tools:
  - Read
  - Glob
  - Grep
  - mcp__fastcode__code_qa
---

# SANG (.claude/agents/pd-sec-scanner.md):
---
name: pd-sec-scanner
description: Scanner bao mat tong hop — ...
tools: Read, Glob, Grep, mcp__fastcode__code_qa
model: haiku
maxTurns: 15
effort: low
---
```

## Hien trang 053 Gaps (da verify)

### Gap 1: pd-codebase-mapper thieu Write tool
**Trang thai hien tai:** DA FIX
- File `.claude/agents/pd-codebase-mapper.md` line 4: `tools: Read, Write, Glob, Grep, Bash` — co Write
- `AGENT_REGISTRY['pd-codebase-mapper'].tools` (resource-config.js line 157): `['Read', 'Write', 'Glob', 'Grep', 'Bash']` — co Write
**Confidence:** HIGH — doc truc tiep tu file

### Gap 2: pd-feature-analyst thieu Bash + Context7 tools
**Trang thai hien tai:** DA FIX
- File `.claude/agents/pd-feature-analyst.md` line 4: `tools: Read, Glob, Grep, Bash, mcp__context7__resolve-library-id, mcp__context7__query-docs` — du 6 tools
- `AGENT_REGISTRY['pd-feature-analyst'].tools` (resource-config.js line 165): `['Read', 'Glob', 'Grep', 'Bash', 'mcp__context7__resolve-library-id', 'mcp__context7__query-docs']` — du 6 tools
**Confidence:** HIGH — doc truc tiep tu file

### Gap 3: pd-regression-analyzer khong wrap regression-analyzer.js
**Trang thai hien tai:** DA FIX
- File `.claude/agents/pd-regression-analyzer.md` lines 22-34: Co buoc 3 goi `analyzeFromCallChain()` va buoc 4 fallback `analyzeFromSourceFiles()` tu `bin/lib/regression-analyzer.js`
**Confidence:** HIGH — doc truc tiep tu file

### Ket luan 053 Gaps
Ca 3 gaps da duoc fix trong cac phases sau. 053-VERIFICATION.md can cap nhat status tu "failed" sang "resolved" voi evidence tu trang thai hien tai.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | node:test (built-in) |
| Config file | Khong co config rieng — dung node --test truc tiep |
| Quick run command | `node --test test/smoke-resource-config.test.js test/smoke-agent-files.test.js test/platform-models.test.js` |
| Full suite command | `node --test test/smoke-*.test.js test/platform-models.test.js` |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| PLAT-01/02 | getAgentConfig(name, platform) tra ve platform-specific model | unit | `node --test test/smoke-resource-config.test.js` | Can them test moi |
| PLAT-01/02 | buildParallelPlan(session, path, platform) truyen platform xuong | unit | `node --test test/smoke-resource-config.test.js` | Can them test moi |
| AGEN-01 | TIER_MAP co 3 tiers voi dung values | unit | `node --test test/smoke-resource-config.test.js` | Co san (line 21-26) |
| AGEN-09 | pd-regression-analyzer trong AGENT_REGISTRY | unit | `node --test test/smoke-resource-config.test.js` | Co san (AGENT_REGISTRY test) |
| PARA-02 | isHeavyAgent check trong buildScannerPlan | unit | `node --test test/smoke-resource-config.test.js` | Co san |

### Sampling Rate
- **Per task commit:** `node --test test/smoke-resource-config.test.js test/smoke-agent-files.test.js test/platform-models.test.js`
- **Per wave merge:** `node --test test/smoke-*.test.js test/platform-models.test.js`
- **Phase gate:** Full suite green truoc verify

### Wave 0 Gaps
- [ ] Test cho `getAgentConfig(name, platform)` voi platform param — can them vao smoke-resource-config.test.js
- [ ] Test cho `buildParallelPlan(session, path, platform)` voi platform — can them vao parallel-dispatch test (neu co) hoac smoke test
- [ ] Them 'pd-sec-scanner' vao AGENT_NAMES trong smoke-agent-files.test.js sau khi copy file

## Environment Availability

Buoc 2.6: SKIPPED — Phase nay chi thay doi code/config, khong co external dependencies.

## Sources

### Primary (HIGH confidence)
- `bin/lib/resource-config.js` — Doc truc tiep: getAgentConfig(), getModelForTier(), TIER_MAP, AGENT_REGISTRY
- `bin/lib/parallel-dispatch.js` — Doc truc tiep: buildParallelPlan(), buildScannerPlan(), buildResearchSquadPlan()
- `.claude/agents/pd-codebase-mapper.md` — Xac nhan gap 1 da fix (co Write tool)
- `.claude/agents/pd-feature-analyst.md` — Xac nhan gap 2 da fix (co 6 tools)
- `.claude/agents/pd-regression-analyzer.md` — Xac nhan gap 3 da fix (wrap analyzeFromCallChain)
- `commands/pd/agents/pd-sec-scanner.md` — File nguon can copy, format cu
- `.claude/agents/pd-sec-scanner.md` — CHUA TON TAI (can tao)
- `test/smoke-agent-files.test.js` — AGENT_NAMES list hien co 13, can them pd-sec-scanner
- `.planning/phases/053-new-agent-files/053-VERIFICATION.md` — 3 gaps can re-verify
- `.planning/phases/52-agent-tier-system/` — KHONG co VERIFICATION.md, can tao

### Secondary (MEDIUM confidence)
- `.planning/v5.0-MILESTONE-AUDIT.md` — Gap summary, AGEN-01/AGEN-09 verification missing

## Metadata

**Confidence breakdown:**
- Architecture/wiring: HIGH — doc truc tiep source code, logic don gian
- 053 gap status: HIGH — verify truc tiep tung file
- pd-sec-scanner conversion: HIGH — compare format 2 directories
- Phase 52 verification scope: HIGH — CONTEXT.md chi dinh ro AGEN-01 + AGEN-09

**Research date:** 2026-03-27
**Valid until:** 2026-04-27 (stable — internal project code)
