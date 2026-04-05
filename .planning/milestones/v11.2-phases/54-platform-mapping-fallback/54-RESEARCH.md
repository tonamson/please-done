# Phase 54: Platform Mapping & Fallback - Research

**Researched:** 2026-03-27
**Domain:** Platform-specific model resolution cho 3-tier system (Scout/Builder/Architect)
**Confidence:** HIGH

## Summary

Phase 54 mở rộng hệ thống tier hiện tại (generic names: haiku/sonnet/opus) thành platform-specific model resolution. Mỗi platform (claude, codex, gemini, opencode, copilot, cursor, windsurf) sẽ có `PLATFORM_MODEL_MAP` map generic tier name sang model thực tế. Khi platform thiếu tier cao, fallback tự động xuống tier thấp hơn.

Codebase hiện tại đã có nền tảng vững: `TIER_MAP` 3 tiers, `getModelForTier()` pure function, `PLATFORMS` object 5 platforms. Thay đổi chính: (1) thêm `PLATFORM_MODEL_MAP` vào `resource-config.js`, (2) mở rộng `getModelForTier(tier, platform?)` thêm optional parameter, (3) thêm cursor/windsurf vào `platforms.js`, (4) test file mới `test/platform-models.test.js`.

**Primary recommendation:** Thêm `PLATFORM_MODEL_MAP` ngay bên dưới `TIER_MAP` trong `resource-config.js`, mở rộng `getModelForTier()` với optional `platform` parameter, giữ backward compatibility 100%.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** Map ALL platforms -- 5 hien co (claude, codex, gemini, opencode, copilot) + them cursor va windsurf vao `platforms.js` nhu platform entries moi.
- **D-02:** Cursor va Windsurf duoc them vao `PLATFORMS` object trong `platforms.js` voi day du config (dirName, commandPrefix, toolMap, etc.).
- **D-03:** Generic + runtime resolve -- giu `TIER_MAP` voi generic names (haiku/sonnet/opus). Tao `PLATFORM_MODEL_MAP` map generic -> model thuc te per platform.
- **D-04:** `PLATFORM_MODEL_MAP` chua mapping cho moi platform: `{ haiku: 'model-name', sonnet: 'model-name', opus: 'model-name' }`. Platform nao thieu tier thi khong co key do -> trigger fallback.
- **D-05:** `PLATFORM_MODEL_MAP` nam trong `resource-config.js`, gan `TIER_MAP` va `getModelForTier()`.
- **D-06:** `platforms.js` chi export platform names/definitions, khong chua model mapping.
- **D-07:** Mo rong `getModelForTier(tier, platform?)` -- them optional parameter `platform`. Khong truyen = tra ve generic (backward compatible).
- **D-08:** Silent downgrade -- khi platform khong ho tro tier, tu dong ha xuong tier thap hon (architect->builder->scout). Tra ve kem truong `fallback: true` khi xay ra downgrade.
- **D-09:** Workflow khong bao gio dut gay do thieu tier -- luon co model de dung.
- **D-10:** File test rieng `test/platform-models.test.js` -- test tat ca platform x tier combinations + fallback cases.
- **D-11:** Backward compatibility bat buoc -- `getModelForTier('scout')` khong truyen platform van tra ve `{ model: 'haiku', effort: 'low', maxTurns: 15 }` dung nhu hien tai.
- **D-12:** Existing tests (resource-config.test.js, smoke-agent-files.test.js) phai pass khong sua doi.

### Claude's Discretion
- Model names cu the cho tung platform (research trong giai doan research)
- Cursor/Windsurf platform config details (dirName, commandPrefix, toolMap)
- Return object structure khi co fallback (them fields nao)

### Deferred Ideas (OUT OF SCOPE)
None.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| PLAT-01 | `TIER_MAP` config trong `resource-config.js` map tier->model per platform (Claude Code, Gemini CLI, Cursor/Windsurf, Copilot) | PLATFORM_MODEL_MAP structure + model names per platform researched |
| PLAT-02 | Fallback tu dong -- nen tang thieu tier cao -> ha cap xuong model cao nhat hien co | Fallback chain architect->builder->scout + return object structure |
</phase_requirements>

## Architecture Patterns

### Recommended Code Changes

```
bin/lib/
  resource-config.js    # Them PLATFORM_MODEL_MAP, mo rong getModelForTier()
  platforms.js          # Them cursor + windsurf vao PLATFORMS object

test/
  platform-models.test.js           # Moi: test platform x tier matrix + fallback
  smoke-resource-config.test.js     # Khong sua doi — phai pass nguyen trang
  smoke-agent-files.test.js         # Khong sua doi — phai pass nguyen trang
```

### Pattern 1: PLATFORM_MODEL_MAP Structure

**What:** Constant object map platform key -> { haiku?, sonnet?, opus? } voi model name thuc te. Platform thieu tier thi bo key.
**When to use:** Khi `getModelForTier()` nhan `platform` parameter.
**Example:**

```javascript
// Trong resource-config.js, ngay sau TIER_MAP
const PLATFORM_MODEL_MAP = {
  claude: {
    haiku: 'claude-haiku-4-5-20251001',
    sonnet: 'claude-sonnet-4-6-20250217',
    opus: 'claude-opus-4-6-20250205',
  },
  codex: {
    haiku: 'gpt-5.4-mini',
    sonnet: 'gpt-5.3-codex',
    opus: 'gpt-5.4',
  },
  gemini: {
    haiku: 'gemini-2.5-flash',
    sonnet: 'gemini-2.5-pro',
    // khong co opus -> fallback sang sonnet
  },
  opencode: {
    haiku: 'claude-haiku-4-5-20251001',
    sonnet: 'claude-sonnet-4-6-20250217',
    opus: 'claude-opus-4-6-20250205',
  },
  copilot: {
    haiku: 'claude-haiku-4-5-20251001',
    sonnet: 'claude-sonnet-4-6-20250217',
    opus: 'claude-opus-4-6-20250205',
  },
  cursor: {
    haiku: 'claude-haiku-4-5-20251001',
    sonnet: 'claude-sonnet-4-6-20250217',
    opus: 'claude-opus-4-6-20250205',
  },
  windsurf: {
    haiku: 'claude-haiku-4-5-20251001',
    sonnet: 'claude-sonnet-4-6-20250217',
    opus: 'claude-opus-4-6-20250205',
  },
};
```

**Luu y ve model names:** Model names cu the la MEDIUM confidence -- co the thay doi nhanh. Cau truc quan trong hon ten model cu the. Khi implement, nen verify model names moi nhat.

### Pattern 2: Mo rong getModelForTier() voi Fallback

**What:** Them optional `platform` parameter. Khi co platform, resolve model name tu `PLATFORM_MODEL_MAP`. Khi platform thieu tier, cascade xuong.
**Example:**

```javascript
// Fallback order
const FALLBACK_CHAIN = ['architect', 'builder', 'scout'];

function getModelForTier(tier, platform) {
  if (tier == null || typeof tier !== 'string') {
    throw new Error('thieu tham so tier');
  }

  const normalized = tier.toLowerCase();
  const entry = TIER_MAP[normalized];

  if (!entry) {
    throw new Error(`tier khong hop le: ${tier}`);
  }

  // Khong co platform -> tra ve generic (backward compatible)
  if (!platform) {
    return { ...entry };
  }

  const platformMap = PLATFORM_MODEL_MAP[platform];
  if (!platformMap) {
    // Platform khong biet -> tra ve generic
    return { ...entry };
  }

  // Tim model cho tier, neu khong co thi fallback
  const startIdx = FALLBACK_CHAIN.indexOf(normalized);
  for (let i = startIdx; i < FALLBACK_CHAIN.length; i++) {
    const fallbackTier = FALLBACK_CHAIN[i];
    const tierEntry = TIER_MAP[fallbackTier];
    if (platformMap[tierEntry.model]) {
      const result = {
        ...tierEntry,
        model: platformMap[tierEntry.model],
      };
      if (fallbackTier !== normalized) {
        result.fallback = true;
        result.requestedTier = normalized;
        result.resolvedTier = fallbackTier;
      }
      return result;
    }
  }

  // Khong nen xay ra, nhung de phong
  return { ...entry };
}
```

### Pattern 3: Return Object Structure

**What:** Khi co fallback, them 3 truong vao return object.
**Example:**

```javascript
// Khong fallback (binh thuong):
{ model: 'claude-opus-4-6-20250205', effort: 'high', maxTurns: 30 }

// Co fallback:
{
  model: 'gemini-2.5-pro',   // resolved model
  effort: 'medium',           // effort cua tier duoc resolve
  maxTurns: 25,               // maxTurns cua tier duoc resolve
  fallback: true,             // flag bao co downgrade
  requestedTier: 'architect', // tier ban dau yeu cau
  resolvedTier: 'builder',    // tier thuc te duoc dung
}
```

### Pattern 4: Cursor/Windsurf Platform Config

**What:** Them 2 entries moi vao `PLATFORMS` object trong `platforms.js`.
**Example:**

```javascript
// Trong TOOL_MAP, them:
cursor: {},    // Cursor su dung Claude native tool names
windsurf: {},  // Windsurf su dung Claude native tool names

// Trong PLATFORMS, them:
cursor: {
  name: 'Cursor',
  dirName: '.cursor',
  commandPrefix: '/pd:',
  commandSeparator: ':',
  envVar: 'CURSOR_CONFIG_DIR',
  skillFormat: 'nested',
  frontmatterFormat: 'yaml',
  toolMap: TOOL_MAP.cursor,
},
windsurf: {
  name: 'Windsurf',
  dirName: '.windsurf',
  commandPrefix: '/pd:',
  commandSeparator: ':',
  envVar: 'WINDSURF_CONFIG_DIR',
  skillFormat: 'nested',
  frontmatterFormat: 'yaml',
  toolMap: TOOL_MAP.windsurf,
},
```

**Luu y:** Cursor dung `.cursor/` directory va Windsurf dung `.windsurf/`. Ca hai deu ho tro Claude models nen tool map co the rong (giong claude). Confidence: MEDIUM -- can verify chinh xac khi implement.

### Anti-Patterns to Avoid
- **Sua TIER_MAP structure:** TIER_MAP giu nguyen generic names. Platform mapping la tang rieng.
- **Sua return type cua getModelForTier() khi khong co platform:** Backward compatibility bat buoc. Ket qua phai giong het cu.
- **Import platforms.js trong resource-config.js:** resource-config.js la pure module, khong nen them dependency. Platform names la string literals.
- **Throw error khi fallback:** D-09 yeu cau workflow khong bao gio dut gay. Fallback phai silent.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Platform validation | Custom platform name checker | `getAllRuntimes()` tu platforms.js | Da co san, nhat quan |
| Tier normalization | Manual toLowerCase/trim | Pattern hien tai `tier.toLowerCase()` | Da tested, case-insensitive |
| Object copying | Manual field copying | Spread operator `{ ...entry }` | Pattern da established trong codebase |

## Platform Model Research

### Model Names Per Platform (MEDIUM confidence)

| Platform | haiku (Scout) | sonnet (Builder) | opus (Architect) | Notes |
|----------|---------------|-------------------|-------------------|-------|
| claude | claude-haiku-4-5-20251001 | claude-sonnet-4-6-20250217 | claude-opus-4-6-20250205 | Full support tat ca tiers |
| codex | gpt-5.4-mini | gpt-5.3-codex | gpt-5.4 | OpenAI models, day du 3 tiers |
| gemini | gemini-2.5-flash | gemini-2.5-pro | (khong co) | Khong co opus-equivalent -> fallback |
| opencode | claude-haiku-4-5-20251001 | claude-sonnet-4-6-20250217 | claude-opus-4-6-20250205 | Multi-provider, dung Anthropic default |
| copilot | claude-haiku-4-5-20251001 | claude-sonnet-4-6-20250217 | claude-opus-4-6-20250205 | Ho tro Claude models, availability tuy plan |
| cursor | claude-haiku-4-5-20251001 | claude-sonnet-4-6-20250217 | claude-opus-4-6-20250205 | Ho tro Claude via ACP |
| windsurf | claude-haiku-4-5-20251001 | claude-sonnet-4-6-20250217 | claude-opus-4-6-20250205 | Ho tro Claude Sonnet 4.6 confirmed |

**Ghi chu quan trong:**
- Model names co the thay doi nhanh (model releases moi). Cau truc `PLATFORM_MODEL_MAP` cho phep cap nhat de dang.
- Gemini la platform duy nhat thieu opus-equivalent -> can fallback test.
- OpenCode, Copilot, Cursor, Windsurf deu ho tro Claude models nen mapping tuong tu Claude Code.
- Codex la OpenAI-only platform, mapping sang GPT models.

### Fallback Matrix

| Platform | architect -> | builder -> | scout |
|----------|-------------|-----------|-------|
| claude | opus (no fallback) | sonnet (no fallback) | haiku (no fallback) |
| codex | gpt-5.4 (no fallback) | gpt-5.3-codex (no fallback) | gpt-5.4-mini (no fallback) |
| gemini | **FALLBACK: gemini-2.5-pro** | gemini-2.5-pro (no fallback) | gemini-2.5-flash (no fallback) |
| opencode | opus (no fallback) | sonnet (no fallback) | haiku (no fallback) |
| copilot | opus (no fallback) | sonnet (no fallback) | haiku (no fallback) |
| cursor | opus (no fallback) | sonnet (no fallback) | haiku (no fallback) |
| windsurf | opus (no fallback) | sonnet (no fallback) | haiku (no fallback) |

Hien tai chi Gemini co fallback case thuc te. Nhung cau truc phai ho tro bat ky platform nao thieu bat ky tier nao.

## Common Pitfalls

### Pitfall 1: Pha vo backward compatibility
**What goes wrong:** `getModelForTier('scout')` tra ve object khac structure cu.
**Why it happens:** Them fields moi (fallback, requestedTier) vao ket qua mac dinh.
**How to avoid:** Chi them fields moi khi (1) co platform parameter VA (2) xay ra fallback. Khi khong co platform, return chinh xac `{ model, effort, maxTurns }`.
**Warning signs:** Test `smoke-resource-config.test.js` line 20-24 fail.

### Pitfall 2: Fallback infinite loop
**What goes wrong:** architect -> builder -> scout nhung scout cung khong co -> loop.
**Why it happens:** Logic fallback khong co termination condition.
**How to avoid:** Dung FALLBACK_CHAIN array co index. Khi het chain, tra ve generic model name (khong resolve).
**Warning signs:** Test hang hoac stack overflow.

### Pitfall 3: PLATFORM_MODEL_MAP key mismatch voi TIER_MAP
**What goes wrong:** PLATFORM_MODEL_MAP dung `haiku/sonnet/opus` nhung lookup dung `scout/builder/architect`.
**Why it happens:** Nham lan giua tier name (scout) va model name (haiku).
**How to avoid:** PLATFORM_MODEL_MAP keys phai la generic model names (haiku/sonnet/opus) de match voi `TIER_MAP[tier].model`. HOAC keys la tier names (scout/builder/architect) -- chon 1 va nhat quan.
**Warning signs:** Tat ca platform lookups tra ve undefined.

### Pitfall 4: getAgentConfig() khong huong loi tu platform resolution
**What goes wrong:** `getAgentConfig()` van goi `TIER_MAP[tier]` truc tiep, bo qua platform mapping.
**Why it happens:** `getAgentConfig()` khong duoc cap nhat de truyen platform parameter.
**How to avoid:** Xac dinh ro: Phase 54 chi mo rong `getModelForTier()`. `getAgentConfig()` se duoc cap nhat trong phase sau (neu can) hoac caller phai goi `getModelForTier(tier, platform)` rieng.
**Warning signs:** Agent voi platform-specific model van nhan generic model name.

### Pitfall 5: Export PLATFORM_MODEL_MAP nhung quen them vao module.exports
**What goes wrong:** Test file import PLATFORM_MODEL_MAP nhung nhan undefined.
**Why it happens:** Them constant nhung quen update module.exports block.
**How to avoid:** Checklist: them constant -> them vao exports -> them vao test imports.

## Code Examples

### Existing getModelForTier() (baseline phai giu)

```javascript
// Source: bin/lib/resource-config.js:153-167
function getModelForTier(tier) {
  if (tier == null || typeof tier !== 'string') {
    throw new Error('thieu tham so tier');
  }
  const normalized = tier.toLowerCase();
  const entry = TIER_MAP[normalized];
  if (!entry) {
    throw new Error(`tier khong hop le: ${tier}`);
  }
  return { ...entry };
}
```

### Existing TIER_MAP (khong thay doi)

```javascript
// Source: bin/lib/resource-config.js:22-26
const TIER_MAP = {
  scout: { model: 'haiku', effort: 'low', maxTurns: 15 },
  builder: { model: 'sonnet', effort: 'medium', maxTurns: 25 },
  architect: { model: 'opus', effort: 'high', maxTurns: 30 },
};
```

### Test Pattern (node:test + assert/strict)

```javascript
// Source: test/smoke-resource-config.test.js - Pattern hien tai
const { describe, it } = require('node:test');
const assert = require('node:assert/strict');

describe('getModelForTier voi platform', () => {
  it('tra ve platform-specific model cho claude scout', () => {
    const result = getModelForTier('scout', 'claude');
    assert.equal(result.model, 'claude-haiku-4-5-20251001');
    assert.equal(result.effort, 'low');
    assert.equal(result.maxTurns, 15);
  });

  it('fallback architect->builder cho gemini', () => {
    const result = getModelForTier('architect', 'gemini');
    assert.equal(result.model, 'gemini-2.5-pro');
    assert.equal(result.fallback, true);
    assert.equal(result.requestedTier, 'architect');
    assert.equal(result.resolvedTier, 'builder');
  });

  it('backward compatible: khong truyen platform', () => {
    const result = getModelForTier('scout');
    assert.equal(result.model, 'haiku');
    assert.equal(result.effort, 'low');
    assert.equal(result.maxTurns, 15);
    assert.equal(result.fallback, undefined);
  });
});
```

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | node:test (built-in, khong can install) |
| Config file | Khong co config file -- dung truc tiep |
| Quick run command | `node --test test/platform-models.test.js` |
| Full suite command | `node --test 'test/*.test.js'` |

### Phase Requirements -> Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| PLAT-01 | Moi platform resolve dung model cho moi tier | unit | `node --test test/platform-models.test.js -x` | Wave 0 |
| PLAT-01 | PLATFORM_MODEL_MAP co du 7 platforms | unit | `node --test test/platform-models.test.js -x` | Wave 0 |
| PLAT-02 | Missing tier fallback xuong tier thap hon | unit | `node --test test/platform-models.test.js -x` | Wave 0 |
| PLAT-02 | Fallback result co truong fallback: true | unit | `node --test test/platform-models.test.js -x` | Wave 0 |
| COMPAT | getModelForTier('scout') khong platform = generic | unit | `node --test test/smoke-resource-config.test.js` | Co |
| COMPAT | Existing 38 tests van pass | regression | `node --test test/smoke-resource-config.test.js` | Co |

### Sampling Rate
- **Per task commit:** `node --test test/platform-models.test.js && node --test test/smoke-resource-config.test.js`
- **Per wave merge:** `node --test 'test/*.test.js'`
- **Phase gate:** Full suite green truoc `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `test/platform-models.test.js` -- covers PLAT-01, PLAT-02 (all platform x tier + fallback)
- Framework install: Khong can -- node:test la built-in

## Design Decision: PLATFORM_MODEL_MAP Key Strategy

Co 2 cach design key cho PLATFORM_MODEL_MAP:

**Option A: Keys la generic model names (haiku/sonnet/opus)**
```javascript
claude: { haiku: 'claude-haiku-4-5-20251001', sonnet: 'claude-sonnet-4-6-20250217', opus: 'claude-opus-4-6-20250205' }
```
- Pro: Match truc tiep voi `TIER_MAP[tier].model`
- Con: Nham lan semantics -- "haiku" vua la tier model generic vua la lookup key

**Option B: Keys la tier names (scout/builder/architect)**
```javascript
claude: { scout: 'claude-haiku-4-5-20251001', builder: 'claude-sonnet-4-6-20250217', architect: 'claude-opus-4-6-20250205' }
```
- Pro: Nhat quan voi cach dung tier names trong toan bo codebase
- Con: Can extra mapping step (tier -> model name la implicit)

**Recommendation:** Option A (generic model names) -- phu hop voi D-04 trong CONTEXT.md: "`{ haiku: 'model-name', sonnet: 'model-name', opus: 'model-name' }`". Lookup: `platformMap[TIER_MAP[normalized].model]`.

## Project Constraints (from CLAUDE.md)

- **Ngon ngu:** Dung tieng Viet toan bo, co dau chuan -- ap dung cho comments, test descriptions, error messages trong code moi.

## Open Questions

1. **Model names chinh xac**
   - What we know: Claude models co date-stamped versions, Codex dung GPT-5.x, Gemini dung 2.5-pro/flash
   - What's unclear: Versions co the da update tu thoi diem research. Windsurf va OpenCode co the thay doi default provider.
   - Recommendation: Dung model names tu research, co the update sau. Structure quan trong hon exact names.

2. **getAgentConfig() co can platform parameter khong?**
   - What we know: D-07 chi noi mo rong `getModelForTier()`. `getAgentConfig()` hien goi `TIER_MAP[tier]` truc tiep.
   - What's unclear: Caller nao can platform-specific model? `getAgentConfig()` hay `getModelForTier()` truc tiep?
   - Recommendation: Phase 54 chi mo rong `getModelForTier()`. Caller tu quyet dinh goi function nao. `getAgentConfig()` giu nguyen de backward compatible.

3. **getGlobalDir() cho cursor va windsurf**
   - What we know: Can them case trong switch statement cua `getGlobalDir()`.
   - Recommendation: Them case `cursor` va `windsurf` tra ve `path.join(home, '.cursor')` va `path.join(home, '.windsurf')`.

## Sources

### Primary (HIGH confidence)
- `bin/lib/resource-config.js` -- TIER_MAP, getModelForTier(), getAgentConfig() source code
- `bin/lib/platforms.js` -- PLATFORMS, TOOL_MAP, 5 platform definitions
- `test/smoke-resource-config.test.js` -- 38 tests, baseline verified passing
- `.planning/phases/54-platform-mapping-fallback/54-CONTEXT.md` -- 12 locked decisions

### Secondary (MEDIUM confidence)
- [Claude models overview](https://platform.claude.com/docs/en/about-claude/models/overview) -- claude-haiku-4-5, claude-sonnet-4-6, claude-opus-4-6
- [Codex CLI models](https://developers.openai.com/codex/models) -- gpt-5.4, gpt-5.3-codex, gpt-5.4-mini
- [Gemini API models](https://ai.google.dev/gemini-api/docs/models) -- gemini-2.5-pro, gemini-2.5-flash
- [GitHub Copilot supported models](https://docs.github.com/en/copilot/reference/ai-models/supported-models) -- Claude models available
- [Windsurf AI models](https://docs.windsurf.com/windsurf/models) -- Claude Sonnet 4.6 confirmed
- [Cursor models & pricing](https://cursor.com/docs/models) -- Claude models via ACP
- [OpenCode models](https://opencode.ai/docs/models/) -- multi-provider, Anthropic supported

### Tertiary (LOW confidence)
- Cursor/Windsurf exact dirName conventions -- inferred from IDE conventions, not verified from official install docs

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- code 100% local, pure JS, no external deps
- Architecture: HIGH -- existing patterns clear, extension straightforward
- Model names: MEDIUM -- web research, models change frequently
- Cursor/Windsurf config: MEDIUM -- inferred from common patterns
- Pitfalls: HIGH -- based on actual code analysis

**Research date:** 2026-03-27
**Valid until:** 2026-04-10 (model names may change; structure stable)
