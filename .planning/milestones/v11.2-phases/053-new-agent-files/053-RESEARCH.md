# Phase 53: New Agent Files - Research

**Researched:** 2026-03-27
**Domain:** Agent file creation, YAML frontmatter, registry integration, smoke tests
**Confidence:** HIGH

## Summary

Phase 53 tao 6 agent files moi tai `commands/pd/agents/`, them 5 entries vao `AGENT_REGISTRY` trong `resource-config.js` (pd-regression-analyzer da co tu Phase 52), va mo rong smoke tests trong `test/smoke-agent-files.test.js`. Moi agent co YAML frontmatter (`name`, `description`, `tier`, `allowed-tools`) va body gom 3 XML blocks (`<objective>`, `<process>`, `<rules>`).

Du an co 2 vi tri luu agent files voi 2 format frontmatter khac nhau. `.claude/agents/` dung format cu (flat `tools:` comma-separated, co `model`, `maxTurns`, `effort`). `commands/pd/agents/` dung format moi (YAML array `allowed-tools:`, co `tier`, KHONG co model/maxTurns/effort). Phase nay chi tao files tai `commands/pd/agents/` voi format moi theo D-04, D-05.

**Primary recommendation:** Tao tung agent file theo template cua `pd-sec-fixer.md` (architect) hoac `pd-sec-scanner.md` (scout) -- day la cac agent dung format frontmatter moi nhat. Tools trong frontmatter PHAI khop chinh xac voi AGENT_REGISTRY (D-10).

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** Scout agents dung tools read-only + search: `Read, Glob, Grep, Bash`. Ngoai le: pd-codebase-mapper them `Write`, pd-security-researcher them `mcp__fastcode__code_qa`, pd-feature-analyst them `mcp__context7__resolve-library-id, mcp__context7__query-docs`
- **D-02:** Architect agents dung full toolset: `Read, Write, Glob, Grep, Bash`. pd-research-synthesizer va pd-planner deu can Write
- **D-03:** pd-regression-analyzer (Builder): `Read, Glob, Grep, Bash, mcp__fastcode__code_qa` -- locked tu Phase 52 D-07
- **D-04:** Giu format YAML hien tai: `name`, `description` (tieng Viet co dau), `tier`, `allowed-tools` (YAML array voi dashes)
- **D-05:** KHONG them `model`, `maxTurns`, `effort` vao frontmatter -- nhung gia tri nay resolve tu `TIER_MAP` tai runtime
- **D-06:** Moi agent body gom 3 XML blocks: `<objective>`, `<process>` (5-7 steps), `<rules>`
- **D-07:** Noi dung process steps viet tieng Viet, cu the theo domain cua agent
- **D-08:** Moi agent ~30-50 dong body -- tuong duong existing agents
- **D-09:** Chi them `tier` + `tools` cho moi agent. KHONG them `categories` (chi dung cho security audit agents)
- **D-10:** Tools trong registry PHAI khop chinh xac voi `allowed-tools` trong frontmatter -- tests validate bidirectional
- **D-11:** pd-regression-analyzer agent wrap 2 functions tu `bin/lib/regression-analyzer.js`: `analyzeFromCallChain()` va `analyzeFromSourceFiles()`
- **D-12:** Process: nhan target file -> goi FastCode trace -> chay analyzeFromCallChain -> fallback BFS neu FastCode fail -> output affected files
- **D-13:** 8 existing agents KHONG bi sua doi -- chi them 6 agents moi
- **D-14:** `AGENT_NAMES` array trong test file mo rong them 6 entries, test patterns giu nguyen

### Claude's Discretion
- Chi tiet process steps cho moi agent (mien tuan thu 5-7 steps)
- Description tieng Viet cu the cho moi agent
- Test case naming conventions (giu pattern hien tai)

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| AGEN-02 | `pd-codebase-mapper` agent (Scout tier) quet cau truc codebase nhanh, cap nhat `.planning/codebase/` | Template: pd-sec-scanner.md (scout). Tools: Read, Glob, Grep, Bash, Write (D-01). Registry: tier scout |
| AGEN-03 | `pd-security-researcher` agent (Scout tier) bo sung research security chuyen sau | Template: pd-sec-scanner.md (scout). Tools: Read, Glob, Grep, Bash, mcp__fastcode__code_qa (D-01). Registry: tier scout |
| AGEN-04 | `pd-feature-analyst` agent (Scout tier) phan tich tinh nang | Template: pd-sec-scanner.md (scout). Tools: Read, Glob, Grep, Bash, mcp__context7__resolve-library-id, mcp__context7__query-docs (D-01). Registry: tier scout |
| AGEN-05 | `pd-research-synthesizer` agent (Architect tier) tong hop research tu nhieu agents | Template: pd-sec-fixer.md (architect). Tools: Read, Write, Glob, Grep, Bash (D-02). Registry: tier architect |
| AGEN-06 | `pd-planner` agent (Architect tier) chuyen plan cho PD phases | Template: pd-sec-fixer.md (architect). Tools: Read, Write, Glob, Grep, Bash (D-02). Registry: tier architect |
| AGEN-07 | `pd-regression-analyzer` agent (Builder tier) nang tu `regression-analyzer.js` thanh agent co dispatch | Template: pd-code-detective.md (builder). Tools: Read, Glob, Grep, Bash, mcp__fastcode__code_qa (D-03). Registry da co tu Phase 52 |
| AGEN-08 | Moi agent moi co smoke test trong `test/smoke-agent-files.test.js` | Mo rong AGENT_NAMES array, them per-agent frontmatter tests, body structure tests, registry consistency tests |
</phase_requirements>

## Architecture Patterns

### Agent File Structure (commands/pd/agents/ format)

```yaml
---
name: pd-{agent-name}
description: Mo ta tieng Viet co dau -- vai tro cua agent.
tier: scout|builder|architect
allowed-tools:
  - Read
  - Glob
  - Grep
  - Bash
---
```

Body tiep theo:
```markdown
<objective>
Mot doan ngan mo ta muc tieu chinh cua agent.
</objective>

<process>
1. Buoc 1...
2. Buoc 2...
3. Buoc 3...
4. Buoc 4...
5. Buoc 5...
</process>

<rules>
- Rule 1...
- Rule 2...
- Rule 3...
</rules>
```

### Registry Entry Format (resource-config.js)

```javascript
"pd-agent-name": {
  tier: "scout",  // hoac "builder", "architect"
  tools: ["Read", "Glob", "Grep", "Bash"],
},
```

**KHONG them `categories`** -- chi dung cho pd-sec-scanner (D-09).

### 6 Agent Specifications

| Agent | Tier | Tools (frontmatter) | Registry Entry |
|-------|------|---------------------|----------------|
| pd-codebase-mapper | scout | Read, Glob, Grep, Bash, Write | Them moi |
| pd-security-researcher | scout | Read, Glob, Grep, Bash, mcp__fastcode__code_qa | Them moi |
| pd-feature-analyst | scout | Read, Glob, Grep, Bash, mcp__context7__resolve-library-id, mcp__context7__query-docs | Them moi |
| pd-research-synthesizer | architect | Read, Write, Glob, Grep, Bash | Them moi |
| pd-planner | architect | Read, Write, Glob, Grep, Bash | Them moi |
| pd-regression-analyzer | builder | Read, Glob, Grep, Bash, mcp__fastcode__code_qa | DA CO (Phase 52) |

### Test Pattern

Test file hien tai (`test/smoke-agent-files.test.js`) co 2 phan:
1. **`.claude/agents/` tests (lines 17-240):** Dung `parseAgentFrontmatter()` noi bo -- parser nay chi hieu format cu (flat `tools:` comma-separated). KHONG dung cho agents moi.
2. **`commands/pd/agents/` tests (lines 206-227):** Hien chi test pd-sec-fixer.md don gian (existence + name + tier).

**Quan trong:** Test moi cho 6 agents can:
- Dung `parseFrontmatter()` tu `bin/lib/utils.js` (hieu YAML array `allowed-tools:`) HOAC viet parser moi tuong thich
- Test existence (file ton tai, co noi dung)
- Test frontmatter fields: `name`, `description`, `tier`, `allowed-tools`
- Test body structure: `<objective>`, `<process>`, `<rules>`
- Test consistency: `allowed-tools` trong frontmatter KHOP voi `tools` trong AGENT_REGISTRY (bidirectional)
- Test tier: `tier` trong frontmatter KHOP voi `tier` trong AGENT_REGISTRY

### Existing parseAgentFrontmatter Limitation

Parser tai line 35-79 cua `smoke-agent-files.test.js` dung regex `/^(\w+):\s*(.+)$/` -- chi match key-value tren 1 dong. Key `allowed-tools` co hyphen (khong match `\w+`) va value la YAML array (nhieu dong). Parser nay KHONG tuong thich voi format moi.

**Giai phap:** Dung `parseFrontmatter` tu `bin/lib/utils.js` -- da co test xac nhan parse dung `allowed-tools` array (test/smoke-utils.test.js line 52-56).

### File Locations Summary

| File | Action | Lines affected |
|------|--------|----------------|
| `commands/pd/agents/pd-codebase-mapper.md` | Tao moi | ~40-50 dong |
| `commands/pd/agents/pd-security-researcher.md` | Tao moi | ~40-50 dong |
| `commands/pd/agents/pd-feature-analyst.md` | Tao moi | ~40-50 dong |
| `commands/pd/agents/pd-research-synthesizer.md` | Tao moi | ~40-50 dong |
| `commands/pd/agents/pd-planner.md` | Tao moi | ~40-50 dong |
| `commands/pd/agents/pd-regression-analyzer.md` | Tao moi | ~40-50 dong |
| `bin/lib/resource-config.js` | Them 5 entries (lines 91-94) | ~25 dong them |
| `test/smoke-agent-files.test.js` | Mo rong tests | ~80-120 dong them |

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| YAML frontmatter parsing | Custom regex parser | `parseFrontmatter()` tu `bin/lib/utils.js` | Da tested, hieu YAML arrays |
| Agent config resolution | Hardcode model/effort/maxTurns | `getAgentConfig()` tu `resource-config.js` | Tu dong merge tier config |
| Test framework | Custom test runner | `node:test` + `node:assert/strict` | Pattern chuan cua du an |

## Common Pitfalls

### Pitfall 1: Frontmatter Format Mismatch
**What goes wrong:** Dung format cu (flat `tools:` comma-separated) thay vi format moi (`allowed-tools:` YAML array)
**Why it happens:** Copy tu `.claude/agents/` thay vi `commands/pd/agents/`
**How to avoid:** Luon copy template tu `commands/pd/agents/pd-sec-fixer.md` hoac `pd-sec-scanner.md`
**Warning signs:** Tests khong parse duoc `allowed-tools`

### Pitfall 2: Tools Mismatch giua Frontmatter va Registry
**What goes wrong:** `allowed-tools` trong frontmatter khong khop voi `tools` trong AGENT_REGISTRY
**Why it happens:** Them/xoa tool o 1 noi ma quen noi kia
**How to avoid:** D-10 yeu cau bidirectional validation. Test phai check ca 2 huong
**Warning signs:** Bidirectional consistency test fail

### Pitfall 3: Them model/maxTurns/effort vao Frontmatter
**What goes wrong:** Vi pham D-05 -- nhung gia tri nay resolve tu TIER_MAP tai runtime
**Why it happens:** Copy tu `.claude/agents/` (format cu co model/maxTurns/effort)
**How to avoid:** Chi copy tu `commands/pd/agents/` templates
**Warning signs:** Frontmatter co fields khong can thiet

### Pitfall 4: pd-regression-analyzer Registry Duplication
**What goes wrong:** Them entry pd-regression-analyzer vao AGENT_REGISTRY lan nua (da co tu Phase 52)
**Why it happens:** Khong kiem tra registry truoc khi them
**How to avoid:** Chi them 5 entries moi (KHONG them pd-regression-analyzer)
**Warning signs:** Duplicate key error hoac overwrite existing entry

### Pitfall 5: Test Parser Khong Tuong Thich
**What goes wrong:** Dung `parseAgentFrontmatter()` noi bo (line 35-79) de test agents moi -- parser nay khong hieu `allowed-tools` YAML array
**Why it happens:** Reuse code cu khong kiem tra tuong thich
**How to avoid:** Dung `parseFrontmatter()` tu `bin/lib/utils.js` hoac viet parser moi hieu YAML arrays
**Warning signs:** Test parse `allowed-tools` thanh undefined hoac string thay vi array

### Pitfall 6: Body Khong Co Dau Tieng Viet
**What goes wrong:** Viet body khong dau hoac tieng Anh
**Why it happens:** Copy tu agent co san khong co dau (vd: pd-sec-scanner.md khong co dau)
**How to avoid:** D-07 yeu cau tieng Viet co dau. CLAUDE.md yeu cau tieng Viet co dau toan bo
**Warning signs:** Noi dung body thieu dau tieng Viet

## Code Examples

### Template Agent File (Scout tier)

```markdown
---
name: pd-codebase-mapper
description: Quet cau truc codebase nhanh va cap nhat ban do codebase trong .planning/codebase/.
tier: scout
allowed-tools:
  - Read
  - Glob
  - Grep
  - Bash
  - Write
---

<objective>
Quet toan bo cau truc codebase va tao/cap nhat ban do tong the...
</objective>

<process>
1. Buoc 1...
2. Buoc 2...
...
5. Buoc 5...
</process>

<rules>
- Rule 1...
- Rule 2...
</rules>
```

### Registry Entry Addition (resource-config.js)

```javascript
// Them sau pd-regression-analyzer (line 94):
"pd-codebase-mapper": {
  tier: "scout",
  tools: ["Read", "Glob", "Grep", "Bash", "Write"],
},
"pd-security-researcher": {
  tier: "scout",
  tools: ["Read", "Glob", "Grep", "Bash", "mcp__fastcode__code_qa"],
},
"pd-feature-analyst": {
  tier: "scout",
  tools: ["Read", "Glob", "Grep", "Bash", "mcp__context7__resolve-library-id", "mcp__context7__query-docs"],
},
"pd-research-synthesizer": {
  tier: "architect",
  tools: ["Read", "Write", "Glob", "Grep", "Bash"],
},
"pd-planner": {
  tier: "architect",
  tools: ["Read", "Write", "Glob", "Grep", "Bash"],
},
```

### Test Pattern (new agents)

```javascript
const { parseFrontmatter } = require('../bin/lib/utils');

const NEW_AGENT_NAMES = [
  'pd-codebase-mapper',
  'pd-security-researcher',
  'pd-feature-analyst',
  'pd-research-synthesizer',
  'pd-planner',
  'pd-regression-analyzer',
];

describe('New agent files (commands/pd/agents/)', () => {
  it('6 agent files ton tai', () => {
    for (const name of NEW_AGENT_NAMES) {
      const filePath = join(PD_AGENTS_DIR, `${name}.md`);
      const content = readFileSync(filePath, 'utf8');
      assert.ok(content.length > 0, `${name}.md phai co noi dung`);
    }
  });

  it('frontmatter co name, description, tier, allowed-tools', () => {
    for (const name of NEW_AGENT_NAMES) {
      const content = readFileSync(join(PD_AGENTS_DIR, `${name}.md`), 'utf8');
      const { frontmatter } = parseFrontmatter(content);
      assert.equal(frontmatter.name, name);
      assert.ok(frontmatter.description, `${name} thieu description`);
      assert.ok(frontmatter.tier, `${name} thieu tier`);
      assert.ok(Array.isArray(frontmatter['allowed-tools']), `${name} thieu allowed-tools`);
    }
  });

  it('allowed-tools khop voi AGENT_REGISTRY (bidirectional)', () => {
    for (const name of NEW_AGENT_NAMES) {
      const content = readFileSync(join(PD_AGENTS_DIR, `${name}.md`), 'utf8');
      const { frontmatter } = parseFrontmatter(content);
      const registryTools = AGENT_REGISTRY[name].tools;
      const fileTools = frontmatter['allowed-tools'];
      // Registry -> File
      for (const tool of registryTools) {
        assert.ok(fileTools.includes(tool), `${name}: thieu tool '${tool}' trong file`);
      }
      // File -> Registry
      for (const tool of fileTools) {
        assert.ok(registryTools.includes(tool), `${name}: thua tool '${tool}' trong file`);
      }
    }
  });
});
```

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | node:test (built-in, Node.js 24.14.1) |
| Config file | none (chay truc tiep) |
| Quick run command | `node --test test/smoke-agent-files.test.js` |
| Full suite command | `node --test test/smoke-*.test.js` |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| AGEN-02 | pd-codebase-mapper file ton tai va dung format | smoke | `node --test test/smoke-agent-files.test.js` | Co (can mo rong) |
| AGEN-03 | pd-security-researcher file ton tai va dung format | smoke | `node --test test/smoke-agent-files.test.js` | Co (can mo rong) |
| AGEN-04 | pd-feature-analyst file ton tai va dung format | smoke | `node --test test/smoke-agent-files.test.js` | Co (can mo rong) |
| AGEN-05 | pd-research-synthesizer file ton tai va dung format | smoke | `node --test test/smoke-agent-files.test.js` | Co (can mo rong) |
| AGEN-06 | pd-planner file ton tai va dung format | smoke | `node --test test/smoke-agent-files.test.js` | Co (can mo rong) |
| AGEN-07 | pd-regression-analyzer agent file ton tai va dung format | smoke | `node --test test/smoke-agent-files.test.js` | Co (can mo rong) |
| AGEN-08 | Moi agent moi co smoke test | smoke | `node --test test/smoke-agent-files.test.js` | Co (can mo rong) |

### Sampling Rate
- **Per task commit:** `node --test test/smoke-agent-files.test.js`
- **Per wave merge:** `node --test test/smoke-*.test.js`
- **Phase gate:** Full suite green truoc khi verify

### Wave 0 Gaps
- None -- test infrastructure ton tai. Chi can mo rong `test/smoke-agent-files.test.js` voi test cases moi.

## Project Constraints (from CLAUDE.md)

- Dung tieng Viet toan bo, co dau chuan -- ap dung cho description trong frontmatter va body content cua moi agent (D-07)

## Sources

### Primary (HIGH confidence)
- `bin/lib/resource-config.js` -- TIER_MAP, AGENT_REGISTRY, getAgentConfig() verified
- `test/smoke-agent-files.test.js` -- Test patterns, parseAgentFrontmatter() limitations verified
- `commands/pd/agents/pd-sec-fixer.md` -- Architect tier template (format moi) verified
- `commands/pd/agents/pd-sec-scanner.md` -- Scout tier template (format moi) verified
- `.claude/agents/pd-code-detective.md` -- Builder tier template (format cu) verified
- `bin/lib/regression-analyzer.js` -- 2 pure functions verified: analyzeFromCallChain(), analyzeFromSourceFiles()
- `bin/lib/utils.js` -- parseFrontmatter() verified qua test/smoke-utils.test.js
- `test/smoke-utils.test.js` -- parseFrontmatter hieu allowed-tools YAML array verified

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- du an dung node:test, YAML frontmatter, patterns da xac dinh ro
- Architecture: HIGH -- 2 format frontmatter khac nhau da xac nhan, template files da doc
- Pitfalls: HIGH -- frontmatter mismatch, parser limitation, registry duplication da xac nhan

**Research date:** 2026-03-27
**Valid until:** 2026-04-27 (stable -- internal project patterns)
