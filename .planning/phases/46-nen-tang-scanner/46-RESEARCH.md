# Phase 46: Nen tang Scanner - Research

**Researched:** 2026-03-26
**Domain:** Agent template consolidation, YAML rule config, AGENT_REGISTRY expansion
**Confidence:** HIGH

## Summary

Phase 46 gop 13 file scanner agent rieng le thanh 1 template `pd-sec-scanner.md` + 1 file `security-rules.yaml` tap trung. Dong thoi dang ky 2 entries moi trong AGENT_REGISTRY (`pd-sec-scanner` va `pd-sec-reporter`) va thiet lap FastCode tool-first pattern voi fallback Grep+Glob.

Day la phase config/template thuan tuy — khong can thu vien moi, khong can external dependency ngoai Docker (cho FastCode). Toan bo thay doi nam trong 4 files chinh: `references/security-rules.yaml` (moi), `commands/pd/agents/pd-sec-scanner.md` (moi), `bin/lib/resource-config.js` (sua), va xoa 13 files cu.

**Primary recommendation:** Tao YAML truoc (nguon su that), roi tao template doc YAML, roi cap nhat AGENT_REGISTRY, roi xoa files cu. Thu tu nay dam bao moi buoc co the kiem chung doc lap.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** File `references/security-rules.yaml` to chuc nested theo category slug (sql-injection, xss, cmd-injection...). Moi category chua 5 truong: owasp, severity, patterns[], fixes[], fastcode_queries[].
- **D-02:** Dat tai `references/security-rules.yaml` — nhat quan voi `references/security-checklist.md` da co.
- **D-03:** 1 template `pd-sec-scanner.md` nhan `--category` slug, doc `references/security-rules.yaml`, extract rules cua category tuong ung. Template chua logic chung (evidence format, FastCode flow), YAML chua rules rieng.
- **D-04:** Migrate rules tu 13 files cu vao YAML roi xoa 13 files. Chi giu `pd-sec-scanner.md` + `pd-sec-reporter.md`.
- **D-05:** Evidence output giu format hien tai: YAML frontmatter (agent, outcome, timestamp, session) + markdown body (summary table, findings voi file:line, severity). Function-level checklist (EVID-01) thuoc Phase 48.
- **D-06:** 1 entry `pd-sec-scanner` voi field `categories: [13 slugs]` + 1 entry `pd-sec-reporter`. Dispatch logic spawn nhieu instance tu 1 entry voi `--category` khac nhau.
- **D-07:** Tat ca 13 scanner categories cung tier `scout` (Haiku). Reporter giu tier `builder` (Sonnet).
- **D-08:** Tool-first flow: (1) Load YAML rules cho category, (2) Chay fastcode_queries[] tu YAML de discovery code, (3) AI phan tich ket qua FastCode de xac dinh PASS/FLAG/FAIL, (4) Xuat evidence. AI khong tu tim code ma chi danh gia.
- **D-09:** Khi FastCode khong available (Docker chua chay) — fallback dung Grep + Glob tim code thay the. Ghi note "FastCode unavailable" trong evidence. Khong chan pipeline.

### Claude's Discretion
- Chi tiet YAML schema (field names, value types) — Claude chon dua tren codebase conventions
- Thu tu migrate 13 files — Claude chon hieu qua nhat
- Cach ghi categories list trong AGENT_REGISTRY — array hoac object tuy thich hop

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| AGENT-01 | Template agent `pd-sec-scanner.md` nhan --category parameter, load rules tu YAML, output evidence chuan | Pattern tu 13 scanner cu da doc, format frontmatter da xac dinh, evidence format da chuan hoa |
| AGENT-02 | Config `security-rules.yaml` tap trung rules 13 OWASP category (patterns, severity, fixes, FastCode queries) | Da doc toan bo 13 scanner files, extract patterns/rules/fastcode queries tu moi file |
| AGENT-04 | 14 agents (13 scanner + 1 reporter) dang ky trong resource-config.js AGENT_REGISTRY | AGENT_REGISTRY hien co 7 entries, them 2 moi (pd-sec-scanner + pd-sec-reporter), D-06 xac dinh categories field |
| WIRE-04 | (Requirement ID trong traceability nhung THIEU dinh nghia trong REQUIREMENTS.md — xem Open Questions) | Can lam ro truoc khi plan — co the la "wiring" de cac phase sau dung duoc scanner |
</phase_requirements>

## Architecture Patterns

### Recommended Project Structure
```
references/
  security-rules.yaml          # MOI — nguon su that cho 13 OWASP categories
  security-checklist.md         # Da co — khong thay doi
  guard-fastcode.md             # Da co — khong thay doi

commands/pd/agents/
  pd-sec-scanner.md             # MOI — template nhan --category
  pd-sec-reporter.md            # DA CO — giu nguyen
  (13 pd-sec-*.md files)        # XOA sau khi migrate xong

bin/lib/
  resource-config.js            # SUA — them 2 entries vao AGENT_REGISTRY

test/
  smoke-resource-config.test.js # SUA — cap nhat assertions cho 9 agents
  smoke-agent-files.test.js     # SUA — cap nhat AGENT_NAMES va assertions
```

### Pattern 1: YAML Rule Config Schema
**What:** Moi category la 1 top-level key, chua 5 truong co dinh
**When to use:** Khi scanner load rules cho 1 category cu the

```yaml
# references/security-rules.yaml
sql-injection:
  owasp: "A03:2021 Injection"
  severity: critical
  patterns:
    - regex: 'query\(.*\+|query\(.*\$\{'
      description: "Raw SQL concatenation"
      stack: [js, ts, php, py]
    - regex: '\$wpdb->(query|get_row|get_results|get_var)\('
      description: "WordPress thiếu prepare"
      stack: [php]
  fixes:
    - pattern: "Raw SQL concatenation"
      fix: "Dùng parameterized query: $wpdb->prepare() (WP), @Param (TypeORM), $1 (Prisma raw)"
    - pattern: "Template literal trong SQL"
      fix: "Dùng prepared statements với bind parameters"
  fastcode_queries:
    - "Liệt kê các files/functions có raw SQL query nối chuỗi user input"
    - "Tìm tất cả nơi dùng $wpdb không qua prepare()"

xss:
  owasp: "A03:2021 Injection"
  severity: high
  patterns:
    - regex: 'innerHTML\s*=|dangerouslySetInnerHTML'
      description: "DOM-based XSS"
      stack: [js, ts, jsx, tsx]
  fixes:
    - pattern: "dangerouslySetInnerHTML"
      fix: "Thêm DOMPurify.sanitize() trước khi render"
  fastcode_queries:
    - "Tìm tất cả nơi dùng dangerouslySetInnerHTML hoặc innerHTML với user input"
```

### Pattern 2: Template Agent voi --category Parameter
**What:** 1 template doc YAML, extract category, thuc thi FastCode tool-first flow
**When to use:** Khi dispatch scanner cho 1 OWASP category

Template `pd-sec-scanner.md` se co frontmatter:
```yaml
---
name: pd-sec-scanner
description: Scanner bảo mật tổng hợp — Quét mã nguồn theo OWASP category được chỉ định.
tier: scout
allowed-tools:
  - Read
  - Glob
  - Grep
  - mcp__fastcode__code_qa
---
```

Va body se co logic:
1. Nhan `--category` tu prompt (vd: `--category sql-injection`)
2. Doc `references/security-rules.yaml`
3. Extract rules cua category tuong ung
4. Chay `fastcode_queries[]` — moi query goi `mcp__fastcode__code_qa`
5. Neu FastCode unavailable → fallback Grep voi `patterns[].regex`
6. AI phan tich ket qua → PASS/FLAG/FAIL
7. Xuat evidence file

### Pattern 3: AGENT_REGISTRY voi Categories Field
**What:** 1 entry `pd-sec-scanner` co them field `categories` la array cua 13 slugs
**When to use:** Khi dispatch logic can biet co bao nhieu scanner categories

```javascript
"pd-sec-scanner": {
  tier: "scout",
  tools: ["Read", "Glob", "Grep", "mcp__fastcode__code_qa"],
  categories: [
    "sql-injection", "xss", "cmd-injection", "path-traversal",
    "secrets", "auth", "deserialization", "misconfig",
    "prototype-pollution", "crypto", "insecure-design",
    "vuln-deps", "logging"
  ],
},
"pd-sec-reporter": {
  tier: "builder",
  tools: ["Read", "Write", "Glob"],
},
```

### Anti-Patterns to Avoid
- **Khong tao 13 entries rieng trong AGENT_REGISTRY** — D-06 chi dinh 1 entry `pd-sec-scanner` voi categories array. Dispatch logic spawn nhieu instance tu 1 entry.
- **Khong hardcode patterns trong template** — Moi pattern phai nam trong YAML. Template chi doc va thuc thi.
- **Khong dung tier builder/architect cho scanner** — D-07 lock tat ca 13 scanner = scout (Haiku). Chi reporter la builder (Sonnet).

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| YAML parsing | Custom parser | Agent doc YAML truc tiep (AI hieu YAML format) | Agent la AI, khong can JS parser |
| Code discovery | AI tu browse code | FastCode `mcp__fastcode__code_qa` queries | D-08: tool-first, AI chi danh gia |
| Pattern matching fallback | Custom regex engine | Grep + Glob tools co san | D-09: fallback khi FastCode unavailable |

## Existing Code Insights

### 13 Scanner Files - Tier Mapping Hien Tai
| Scanner | Tier hien tai | Tier moi (D-07) |
|---------|--------------|-----------------|
| pd-sec-sql-injection | scout | scout |
| pd-sec-xss | scout | scout |
| pd-sec-cmd-injection | scout | scout |
| pd-sec-path-traversal | scout | scout |
| pd-sec-secrets | scout | scout |
| pd-sec-auth | **builder** | scout (ha cap) |
| pd-sec-deserialization | scout | scout |
| pd-sec-misconfig | scout | scout |
| pd-sec-prototype-pollution | scout | scout |
| pd-sec-crypto | scout | scout |
| pd-sec-insecure-design | **builder** | scout (ha cap) |
| pd-sec-vuln-deps | scout | scout |
| pd-sec-logging | scout | scout |

**Luu y:** `pd-sec-auth` va `pd-sec-insecure-design` hien tai la builder, se ha cap xuong scout theo D-07.

### 13 Category Slugs (tu ten file hien tai)
1. `sql-injection` (evidence: `evidence_sec_sqli.md`)
2. `xss` (evidence: `evidence_sec_xss.md`)
3. `cmd-injection` (evidence: `evidence_sec_cmdi.md`)
4. `path-traversal` (evidence: `evidence_sec_pathtr.md`)
5. `secrets` (evidence: `evidence_sec_secrets.md`)
6. `auth` (evidence: `evidence_sec_auth.md`)
7. `deserialization` (evidence: `evidence_sec_deser.md`)
8. `misconfig` (evidence: `evidence_sec_misconfig.md`)
9. `prototype-pollution` (evidence: `evidence_sec_pollution.md`)
10. `crypto` (evidence: `evidence_sec_crypto.md`)
11. `insecure-design` (evidence: `evidence_sec_design.md`)
12. `vuln-deps` (evidence: `evidence_sec_deps.md`)
13. `logging` (evidence: `evidence_sec_logging.md`)

### Evidence File Name Mapping
Template can biet ten evidence file cho moi category. Co 2 cach:
1. Them field `evidence_file` vao YAML (tuong minh)
2. Convention-based: `evidence_sec_{slug_short}.md` (nhung mapping khong deu — vd sql-injection → sqli, path-traversal → pathtr)

**Recommendation:** Them field `evidence_file` vao moi category trong YAML de tuong minh — tranh logic mapping phuc tap.

### Agent File Locations
- `.claude/agents/` — 7 files hien tai, format flat frontmatter (tools comma-separated, model/maxTurns/effort explicit)
- `commands/pd/agents/` — 19 files (7 base + 13 scanner + reporter), format YAML list (tier/allowed-tools)

**Quan trong:** Test `smoke-agent-files.test.js` chi kiem tra `.claude/agents/` directory. Template scanner moi co the can them vao ca 2 noi hoac cap nhat test scope.

### AGENT_REGISTRY - Hien tai
7 entries: pd-bug-janitor, pd-code-detective, pd-doc-specialist, pd-repro-engineer, pd-fix-architect, pd-evidence-collector, pd-fact-checker.

Them 2 entries moi → tong 9 entries. Test `smoke-resource-config.test.js` dong 218 assert `Object.keys(AGENT_REGISTRY).length` = 7, can update len 9.

### Heavy Tool Impact
`pd-sec-scanner` co `mcp__fastcode__code_qa` trong tools → `isHeavyAgent('pd-sec-scanner')` se return true. Dispatch logic (Phase 47) can handle: khong cho 2 heavy scanner chay dong thoi.

## Common Pitfalls

### Pitfall 1: Test Assertions Hardcode Agent Count
**What goes wrong:** Them 2 entries vao AGENT_REGISTRY nhung quen update test assertions
**Why it happens:** Test `smoke-resource-config.test.js` hardcode `length === 7`, test `smoke-agent-files.test.js` hardcode `AGENT_NAMES` array
**How to avoid:** Cap nhat ca 2 test files khi them entries
**Warning signs:** `node --test test/smoke-resource-config.test.js` fail sau khi sua resource-config.js

### Pitfall 2: Xoa 13 Files Truoc Khi Verify Template Hoat Dong
**What goes wrong:** Xoa files cu roi phat hien template moi thieu logic/patterns
**Why it happens:** Rush de "clean up"
**How to avoid:** Xoa files cu o buoc cuoi cung, SAU khi verify template + YAML day du
**Warning signs:** Template khong co du patterns cho 1 category nao do

### Pitfall 3: YAML Indentation Sai
**What goes wrong:** YAML bi parse loi vi indent khong deu
**Why it happens:** Copy-paste tu nhieu nguon, mix tab/space
**How to avoid:** Dung 2-space indent nhat quan, validate voi `node -e "require('js-yaml').load(require('fs').readFileSync('references/security-rules.yaml'))"` sau khi tao
**Warning signs:** Agent doc YAML nhung khong extract duoc rules

### Pitfall 4: Evidence File Name Inconsistency
**What goes wrong:** Template tao evidence file ten khac voi reporter expect
**Why it happens:** Mapping slug → evidence filename khong tuong minh
**How to avoid:** Ghi ro `evidence_file` trong YAML cho moi category. Reporter doc tu YAML thay vi hardcode
**Warning signs:** Reporter khong tim thay evidence files

### Pitfall 5: Categories Array vs AGENT_REGISTRY Schema
**What goes wrong:** `getAgentConfig()` return config thieu `categories` field vi function chi merge tier + tools
**Why it happens:** `getAgentConfig()` hien tai chi tra ve `{ name, tier, model, effort, maxTurns, tools }` — khong co `categories`
**How to avoid:** Sua `getAgentConfig()` de spread extra fields tu AGENT_REGISTRY, hoac them function moi `getAgentCategories(agentName)`
**Warning signs:** Dispatch logic (Phase 47) khong truy cap duoc categories list

## Code Examples

### AGENT_REGISTRY Entry Moi
```javascript
// bin/lib/resource-config.js — them vao AGENT_REGISTRY object
"pd-sec-scanner": {
  tier: "scout",
  tools: ["Read", "Glob", "Grep", "mcp__fastcode__code_qa"],
  categories: [
    "sql-injection", "xss", "cmd-injection", "path-traversal",
    "secrets", "auth", "deserialization", "misconfig",
    "prototype-pollution", "crypto", "insecure-design",
    "vuln-deps", "logging",
  ],
},
"pd-sec-reporter": {
  tier: "builder",
  tools: ["Read", "Write", "Glob"],
},
```

### getAgentConfig() - Xu ly Extra Fields
```javascript
// Hien tai getAgentConfig chi spread tierConfig, khong spread extra fields tu agent entry
// Can sua de categories (va bat ky field nao khac) duoc tra ve:
function getAgentConfig(agentName) {
  // ... validation ...
  const agent = AGENT_REGISTRY[agentName];
  const tierConfig = TIER_MAP[agent.tier];
  const { tier, tools, ...extra } = agent;

  return {
    name: agentName,
    tier,
    model: tierConfig.model,
    effort: tierConfig.effort,
    maxTurns: tierConfig.maxTurns,
    tools: [...tools],
    ...extra,  // categories va bat ky field moi nao
  };
}
```

### Template Frontmatter (commands/pd/agents/pd-sec-scanner.md)
```yaml
---
name: pd-sec-scanner
description: Scanner bảo mật tổng hợp — Quét mã nguồn theo OWASP category được chỉ định từ security-rules.yaml.
tier: scout
allowed-tools:
  - Read
  - Glob
  - Grep
  - mcp__fastcode__code_qa
---
```

### YAML Category Entry Day Du
```yaml
sql-injection:
  owasp: "A03:2021 Injection"
  severity: critical
  evidence_file: evidence_sec_sqli.md
  patterns:
    - regex: 'query\(.*\+|query\(.*\$\{'
      description: "Raw SQL concatenation"
      stack: [js, ts]
    - regex: '\$wpdb->(query|get_row|get_results|get_var)\('
      description: "WordPress thiếu prepare"
      stack: [php]
    - regex: '`SELECT.*\$\{|`INSERT.*\$\{|`UPDATE.*\$\{|`DELETE.*\$\{'
      description: "Template literal trong SQL"
      stack: [js, ts]
    - regex: 'sequelize\.query\(|\$queryRaw|\$executeRaw'
      description: "ORM raw mode"
      stack: [js, ts]
    - regex: 'cursor\.execute\(f[''"]|cursor\.execute\(.*\.format\('
      description: "Python f-string/format SQL"
      stack: [py]
  fixes:
    - pattern: "Raw SQL concatenation"
      fix: "Dùng parameterized query: $wpdb->prepare() (WP), @Param (TypeORM), $1 (Prisma raw)"
    - pattern: "ORM raw mode"
      fix: "Dùng ORM query builder hoặc prepared statements với bind parameters"
  fastcode_queries:
    - "Liệt kê tất cả files có raw SQL query nối chuỗi với user input"
    - "Tìm nơi dùng $wpdb mà không có prepare()"
    - "Tìm nơi dùng sequelize.query, $queryRaw, $executeRaw với template literal"
```

## Open Questions

1. **WIRE-04 khong co dinh nghia trong REQUIREMENTS.md**
   - What we know: WIRE-04 nam trong traceability table mapped to Phase 46, nhung Phan "Tich hop Ecosystem" chi co WIRE-01 den WIRE-03. WIRE-04 co the la "wiring" de cac component Phase 46 san sang cho Phase 47+ su dung.
   - What's unclear: WIRE-04 la gi cu the? Co the la: (a) references/security-rules.yaml la nguon su that duy nhat, (b) AGENT_REGISTRY entry co categories field, hoac (c) 1 requirement khac chua duoc ghi.
   - Recommendation: Coi WIRE-04 nhu "tat ca outputs cua Phase 46 tich hop dung de Phase 47 co the dispatch scanner" — nghia la success criteria 1-4 da bao phu. Neu can lam ro, hoi user.

2. **Template dat o dau — commands/pd/agents/ hay .claude/agents/ hay ca 2?**
   - What we know: 13 scanner files cu chi nam o `commands/pd/agents/`. 7 agent goc nam o ca 2 noi (`.claude/agents/` dung flat format, `commands/pd/agents/` dung YAML list format).
   - What's unclear: Dispatch pipeline cua Phase 47 se doc agent tu dau?
   - Recommendation: Dat template o `commands/pd/agents/pd-sec-scanner.md` (nhat quan voi 13 files cu). Neu Phase 47 can `.claude/agents/` version, them o buoc deploy. Test `smoke-agent-files.test.js` hien chi check `.claude/agents/` — can quyet dinh co them scanner vao test scope khong.

3. **getAgentConfig() co can tra ve categories field khong?**
   - What we know: Function hien tai chi tra ve 6 fields co dinh. Them `categories` vao AGENT_REGISTRY entry se khong tu dong duoc return.
   - What's unclear: Phase 47 dispatch logic can truy cap categories qua getAgentConfig() hay doc truc tiep tu AGENT_REGISTRY?
   - Recommendation: Sua getAgentConfig() de spread extra fields — future-proof cho bat ky field moi nao. Chi thay doi nho, khong break API hien tai.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | node:test (built-in, Node.js) |
| Config file | Khong co config file rieng — chay truc tiep |
| Quick run command | `node --test test/smoke-resource-config.test.js test/smoke-agent-files.test.js` |
| Full suite command | `node --test test/smoke-*.test.js` |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| AGENT-01 | Template pd-sec-scanner.md ton tai, co dung frontmatter, co objective/process/rules | integration | `node --test test/smoke-agent-files.test.js` | Co (can cap nhat) |
| AGENT-02 | security-rules.yaml co 13 categories, moi category co 5 truong bat buoc | unit | `node --test test/smoke-security-rules.test.js` | Khong — Wave 0 |
| AGENT-04 | AGENT_REGISTRY co 9 entries, pd-sec-scanner co categories[13], pd-sec-reporter co tier builder | unit | `node --test test/smoke-resource-config.test.js` | Co (can cap nhat) |
| WIRE-04 | (Xem Open Questions) | — | — | — |

### Sampling Rate
- **Per task commit:** `node --test test/smoke-resource-config.test.js test/smoke-agent-files.test.js`
- **Per wave merge:** `node --test test/smoke-*.test.js`
- **Phase gate:** Full suite green truoc /gsd:verify-work

### Wave 0 Gaps
- [ ] `test/smoke-security-rules.test.js` — kiem tra YAML co 13 categories, moi category co owasp/severity/patterns/fixes/fastcode_queries
- [ ] Cap nhat `test/smoke-resource-config.test.js` — assert AGENT_REGISTRY.length === 9, test pd-sec-scanner va pd-sec-reporter configs
- [ ] Cap nhat `test/smoke-agent-files.test.js` — quyet dinh co them pd-sec-scanner vao .claude/agents/ scope khong

## Project Constraints (from CLAUDE.md)

- **Ngon ngu:** Dung tieng Viet toan bo, co dau chuan — ap dung cho comments trong code, noi dung YAML descriptions/fixes, template content, va test descriptions
- Template agent phai viet bang tieng Viet co dau (nhu 13 files cu da lam)
- YAML fixes/descriptions phai bang tieng Viet co dau

## Sources

### Primary (HIGH confidence)
- `bin/lib/resource-config.js` — Doc truc tiep, hieu ro AGENT_REGISTRY schema va getAgentConfig() logic
- `commands/pd/agents/pd-sec-sql-injection.md` — Mau scanner cu, patterns chi tiet, evidence format
- `commands/pd/agents/pd-sec-xss.md` — Mau scanner cu, patterns chi tiet
- `commands/pd/agents/pd-sec-reporter.md` — Reporter evidence consumption pattern, 13 evidence file names
- `commands/pd/agents/pd-code-detective.md` — Mau FastCode tool-first pattern
- `test/smoke-resource-config.test.js` — Hien tai assert 7 agents, can update len 9
- `test/smoke-agent-files.test.js` — Hien tai check 7 .claude/agents/ files
- `references/security-checklist.md` — OWASP patterns chi tiet, la co so cho YAML patterns
- `references/guard-fastcode.md` — Docker requirement cho FastCode MCP

### Secondary (MEDIUM confidence)
- Inferred WIRE-04 meaning tu context (khong co official definition)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — khong can thu vien moi, chi config/template thay doi
- Architecture: HIGH — patterns ro rang tu 13 files cu va CONTEXT.md decisions
- Pitfalls: HIGH — da doc test files va hieu dependency chain

**Research date:** 2026-03-26
**Valid until:** 2026-04-25 (stable — internal project config)
