# Technology Stack: v4.0 OWASP Security Audit

**Project:** v4.0 OWASP Security Audit (`pd:audit`)
**Researched:** 2026-03-26
**Confidence:** HIGH
**Scope:** CHI nhung thu CAN THEM cho v4.0. Stack hien tai (Node.js 16.7+, CommonJS, 1 devDep js-tiktoken, 22 JS modules, 13 skills, 11 workflows, 13 pd-sec-* agents, resource-config.js, parallel-dispatch.js, evidence-protocol.js, session-manager.js) da validated va KHONG re-research.

## Quyet Dinh Tong Quat

**Them 1 runtime dependency: `js-yaml` ^4.1.0** (22KB, zero transitive deps). Ngoai ra, xay dung hoan toan bang mo rong modules hien co va tao modules moi theo pure function pattern.

Ly do can js-yaml:
- `security-rules.yaml` co nested objects 3+ cap (category -> patterns -> severity -> file_globs) — `parseFrontmatter()` trong utils.js chi xu ly flat key-value va array 1 cap
- Tu viet nested YAML parser la loi va ton thoi gian — 22KB dependency la chap nhan duoc
- js-yaml 4.x la industry standard (25K+ npm dependents), zero transitive deps, stable API tu 2021

Ly do KHONG them gi khac:
- 13 scanner agents da ton tai (`pd-sec-*.md`) voi Grep/Glob/FastCode MCP — KHONG can them static analysis tool
- parallel-dispatch.js + resource-config.js da co wave execution — chi can tong quat hoa
- evidence-protocol.js + session-manager.js da co storage pattern — chi can mo rong
- Constraint du an: "No Build Step", Node.js 16.7+, backward compatible

## Recommended Stack

### Dependency Moi

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| js-yaml | ^4.1.0 | Parse `security-rules.yaml` config file | Nhe nhat trong cac YAML parser (22KB, zero transitive deps). API don gian: `yaml.load(str)` tra ve JS object. 25K+ npm dependents. Tuong thich Node.js >=14. Stable — khong co breaking change ke tu 2021. |

**Tai sao js-yaml thay vi yaml (eemeli)?**
- `yaml` (eemeli) nang hon (27KB gzip) voi nhieu feature khong can (YAML 1.2 full spec, custom types, comment preservation, document streaming)
- Du an chi can `yaml.load()` 1 file config — js-yaml du suc
- js-yaml la dependency gian tiep qua promptfoo ecosystem nen developer da quen API

**Tai sao khong mo rong parseFrontmatter()?**
- `parseFrontmatter()` trong utils.js duoc thiet ke cho flat YAML frontmatter (key: value, key: [array])
- `security-rules.yaml` can nested objects: `categories.sql-injection.patterns[0]` — 3+ cap
- Mo rong parseFrontmatter() de xu ly nested = viet lai YAML parser = xau hon dung thu vien chuan

### Module Hien Co — Can Mo Rong

| Module | File | Hien Tai | Mo Rong Cho v4.0 | Backward Compatible? |
|--------|------|----------|-------------------|---------------------|
| resource-config.js | `bin/lib/resource-config.js` | AGENT_REGISTRY cho 9 agents (bug 5 + research 2 + evidence 1 + fact 1) | Them 13 sec-scanner agents (tier `scout`) + 1 sec-reporter (tier `builder`) vao registry. Tong: 23 agents. | Co — them entries moi, khong sua entries cu |
| parallel-dispatch.js | `bin/lib/parallel-dispatch.js` | `buildParallelPlan()` hardcode cho 2 agents (detective + doc-spec) | Them `buildBatchPlan(agents[], maxParallel)` — tong quat hoa cho N agents chia waves. `buildParallelPlan()` van giu nguyen cho backward compat. | Co — them function moi, khong sua function cu |
| evidence-protocol.js | `bin/lib/evidence-protocol.js` | 3 outcome types: root_cause, checkpoint, inconclusive | Them outcome types: `vulnerability_found`, `no_issue`, `needs_manual_review`. Them `validateSecurityEvidence()` cho evidence_sec_*.md format. | Co — them types moi, khong xoa types cu |
| session-manager.js | `bin/lib/session-manager.js` | Debug sessions S{NNN}-{slug} | Them `createSecuritySession()` voi prefix `SEC{NNN}` va `session_type: 'security'` metadata. Them `listSecuritySessions()` loc theo type. | Co — them functions moi, session_type field optional |
| plan-checker.js | `bin/lib/plan-checker.js` | 7 checks (CHECK-01 den CHECK-07) | Them CHECK-08: Security Gate — kiem tra SECURITY_REPORT.md ton tai va khong co CRITICAL unfixed truoc khi complete-milestone. | Co — them check moi vao check registry |

### Module Moi Can Tao

| Module | File | Purpose | Pattern | Dependencies |
|--------|------|---------|---------|-------------|
| security-rules-loader.js | `bin/lib/security-rules-loader.js` | Load + validate `security-rules.yaml`, tra ve structured config. Validate schema: required fields (agent, owasp, severity), severity enum (CRITICAL/HIGH/MEDIUM/LOW/INFO). | Pure function: nhan YAML string → tra JS object + validation warnings | `js-yaml` (load), khong co dependency khac |
| security-scanner-dispatch.js | `bin/lib/security-scanner-dispatch.js` | Smart Scanner Selection: phan tich project context (tech stack, file types) de chon scanner lien quan. Chia waves cho batch execution. | Pure function: nhan project context + rules config → tra dispatch plan (waves array) | `security-rules-loader.js`, `resource-config.js` |
| security-delta.js | `bin/lib/security-delta.js` | Session Delta: so sanh findings phien moi vs phien cu. Phan loai: NEW / KNOWN-UNFIXED / RE-VERIFY / FIXED. | Pure function: nhan 2 arrays findings → tra delta object | Khong co dependency ngoai |
| security-report-builder.js | `bin/lib/security-report-builder.js` | Gop 13 evidence_sec_*.md files thanh SECURITY_REPORT.md voi OWASP mapping, severity stats, remediation priority. | Pure function: nhan evidence contents map → tra markdown string | `evidence-protocol.js` |
| security-fix-planner.js | `bin/lib/security-fix-planner.js` | Tu dong tao fix phases theo gadget chain order (che do milestone). Xac dinh dependency giua vulnerabilities. | Pure function: nhan findings + gadget chains → tra phases array | Khong co dependency ngoai |

### Skill va Workflow Moi

| File | Purpose | Pattern |
|------|---------|---------|
| `commands/pd/audit.md` | Lenh `pd:audit` — entry point skill definition | Tuong tu commands/pd/research.md: YAML frontmatter + guards + 2 che do (doc lap / tich hop milestone) |
| `workflows/audit.md` | Quy trinh audit day du: analyze context → select scanners → batch dispatch → collect evidence → build report → delta comparison | Tuong tu workflows/research.md: buoc-by-buoc instructions cho AI |

### Config File Moi

| File | Purpose | Format | Loaded By |
|------|---------|--------|-----------|
| `references/security-rules.yaml` | Dinh nghia 13 OWASP categories: agent mapping, severity defaults, Grep patterns, file globs, skip dirs | YAML (nested objects) | `security-rules-loader.js` via `js-yaml` |

**Vi du cau truc security-rules.yaml:**

```yaml
version: "1.0"
categories:
  sql-injection:
    agent: pd-sec-sql-injection
    owasp: ["A03"]
    default_severity: CRITICAL
    patterns:
      - "\\$\\{.*\\}.*(?:SELECT|INSERT|UPDATE|DELETE)"
      - "req\\.(body|params|query).*(?:find|where|query)"
    file_globs: ["**/*.{js,ts,py,php,rb}"]
    skip_dirs: ["node_modules", "vendor", "dist", ".next", "build"]
    relevance_signals:
      - "package.json:sequelize|knex|prisma|mongoose|pg|mysql"
      - "*.py:sqlalchemy|django|flask"
  xss:
    agent: pd-sec-xss
    owasp: ["A03", "A07"]
    default_severity: HIGH
    patterns:
      - "innerHTML\\s*="
      - "dangerouslySetInnerHTML"
      - "v-html"
    file_globs: ["**/*.{jsx,tsx,vue,svelte,html,ejs,hbs,pug,php}"]
    skip_dirs: ["node_modules", "vendor", "dist"]
    relevance_signals:
      - "package.json:react|vue|svelte|angular"
      - "*.php:echo|print"
  # ... 11 categories con lai tuong tu
```

### Infrastructure Hien Co — Dung Nguyen, KHONG Thay Doi

| Component | Vai Tro Trong v4.0 | Thay Doi? |
|-----------|---------------------|-----------|
| FastCode MCP (`mcp__fastcode__code_qa`) | Scanner agents goi de hieu code context. Da co trong allowed-tools cua 13 pd-sec-* agents. | KHONG |
| Context7 MCP | Khong dung truc tiep — security audit khong can tra cuu library docs. | KHONG |
| `confidence-scorer.js` | Tinh confidence cho security findings — reuse `scoreConfidence()` hien co. | KHONG |
| `audit-logger.js` | Ghi audit trail cho security scan sessions. | KHONG |
| `index-generator.js` | Generate INDEX.md cho security evidence files. | KHONG |
| Wave-based execution (resource-config.js) | `getAdaptiveParallelLimit()` da co — security waves dung cung logic. | KHONG (chi parallel-dispatch.js can mo rong) |
| `utils.js` parseFrontmatter/buildFrontmatter | Parse agent .md files, evidence .md files — khong can thay doi. | KHONG |

## Agent Registry Update Chi Tiet

```javascript
// Them vao AGENT_REGISTRY trong resource-config.js
// Tat ca 13 scanner la tier "scout" (haiku) — scan nhanh, re
// Reporter la tier "builder" (sonnet) — can tong hop phuc tap hon

"pd-sec-sql-injection":      { tier: "scout",   tools: ["Read", "Glob", "Grep", "mcp__fastcode__code_qa"] },
"pd-sec-xss":                { tier: "scout",   tools: ["Read", "Glob", "Grep", "mcp__fastcode__code_qa"] },
"pd-sec-cmd-injection":      { tier: "scout",   tools: ["Read", "Glob", "Grep", "mcp__fastcode__code_qa"] },
"pd-sec-path-traversal":     { tier: "scout",   tools: ["Read", "Glob", "Grep", "mcp__fastcode__code_qa"] },
"pd-sec-secrets":            { tier: "scout",   tools: ["Read", "Glob", "Grep"] },
"pd-sec-auth":               { tier: "scout",   tools: ["Read", "Glob", "Grep", "mcp__fastcode__code_qa"] },
"pd-sec-deserialization":    { tier: "scout",   tools: ["Read", "Glob", "Grep", "mcp__fastcode__code_qa"] },
"pd-sec-misconfig":          { tier: "scout",   tools: ["Read", "Glob", "Grep"] },
"pd-sec-prototype-pollution":{ tier: "scout",   tools: ["Read", "Glob", "Grep", "mcp__fastcode__code_qa"] },
"pd-sec-crypto":             { tier: "scout",   tools: ["Read", "Glob", "Grep"] },
"pd-sec-insecure-design":    { tier: "builder", tools: ["Read", "Glob", "Grep", "mcp__fastcode__code_qa"] },
"pd-sec-vuln-deps":          { tier: "scout",   tools: ["Read", "Glob", "Grep", "Bash"] },
"pd-sec-logging":            { tier: "scout",   tools: ["Read", "Glob", "Grep"] },
"pd-sec-reporter":           { tier: "builder", tools: ["Read", "Write", "Glob"] },
```

**Ghi chu:**
- `pd-sec-insecure-design` la tier `builder` (khong phai scout) vi can suy luan ve design patterns, khong chi grep patterns
- `pd-sec-vuln-deps` co Bash de chay `npm audit --json` (neu co)
- `pd-sec-secrets`, `pd-sec-misconfig`, `pd-sec-crypto`, `pd-sec-logging` KHONG can FastCode vi chi dung Grep pattern matching

## Batch Execution Pattern

```
Smart Selection (loai bo scanners khong lien quan)
  |
  v
Chia waves theo getAdaptiveParallelLimit() (2-4 parallel)
  |
  v
Wave 1: [sql-injection, xss]           — 2 parallel
Wave 2: [cmd-injection, path-traversal] — 2 parallel
Wave 3: [secrets, auth]                 — 2 parallel
Wave 4: [deserialization, misconfig]    — 2 parallel
Wave 5: [prototype-pollution, crypto]   — 2 parallel
Wave 6: [insecure-design, vuln-deps]    — 2 parallel
Wave 7: [logging]                       — 1 (con lai)
  |
  v (doi tat ca waves xong)
Wave 8: [reporter]                      — 1 (tong hop)
```

**Toi uu hoa Smart Selection:**
- Phan tich project files: co `.jsx/.tsx` → bat xss, co `.sql`/ORM imports → bat sql-injection
- Dung `relevance_signals` tu security-rules.yaml
- Co the giam tu 13 xuong 5-7 scanners cho du an cu the → tiet kiem 40-60% tokens

## Nhung Thu KHONG Can Them

| Thu | Ly Do Khong Can | Dung Thay The |
|-----|-----------------|---------------|
| ESLint / Semgrep / CodeQL | Du an la AI agent framework, KHONG phai static analysis tool. 13 agents da dung Grep + FastCode MCP — linh hoat hon, khong can cai tool rieng. | Grep patterns trong agents + FastCode MCP |
| tree-sitter truc tiep | FastCode MCP da wrap tree-sitter — goi qua MCP thay vi import. Giu nhat quan voi cac agent khac. | `mcp__fastcode__code_qa` |
| Docker / sandbox | Scanner agents chi READ code (Glob/Grep/Read), khong execute untrusted code. | Khong can sandbox |
| Database (SQLite, etc) | File-based sessions da du. So luong findings < 100/scan — khong can DB. | session-manager.js + markdown files |
| Web UI / dashboard | Output la SECURITY_REPORT.md — AI va developer doc truc tiep. | Markdown report |
| npm audit / Snyk API | `pd-sec-vuln-deps` agent da co — check package.json/lock files. External API them complexity. | Agent-based analysis |
| SARIF output format | Markdown nhat quan voi toan bo codebase. AI doc markdown tot hon SARIF. | SECURITY_REPORT.md |
| yaml (eemeli package) | Nang hon js-yaml, nhieu feature khong can. | js-yaml ^4.1.0 |
| TypeScript | Codebase la pure JS, CommonJS. | JavaScript |
| Bundler | Constraint du an: "No Build Step". | Pure Node.js scripts |

## Installation

```bash
# Dependency moi duy nhat
npm install js-yaml@^4.1.0
```

Khong co dev dependency moi. Test dung `node --test` nhu cu.

## Node.js Compatibility

| Feature | Required | Node 16.7+ Support |
|---------|----------|---------------------|
| js-yaml 4.x | Yes | Yes — pure JS, zero native addons |
| `fs.readFileSync` | Yes (load YAML) | Yes — built-in |
| Optional chaining `?.` | Yes (code style) | Yes — tu Node 14 |
| `Set`, `Map` | Yes (delta comparison) | Yes — tu Node 12 |

## Platform Transpilation Impact

**TUONG TU v2.1/v3.0:** Security agents la Claude Code-specific. Non-Claude platforms:

- Agent files (`commands/pd/agents/pd-sec-*.md`) — KHONG can transpile, chi Claude Code dung
- Audit workflow (`workflows/audit.md`) — transpile, agent dispatch section bi skip tren platform khac
- Pure function JS modules (`bin/lib/security-*.js`) — platform-independent
- `security-rules.yaml` — platform-independent config file
- SECURITY_REPORT.md — platform-independent output
- Backward compatibility: neu khong co security-rules.yaml, workflow bao loi ro rang thay vi silent fail

## Tong Ket

| Metric | Gia Tri |
|--------|---------|
| Runtime dependency moi | 1 (js-yaml ^4.1.0, 22KB, zero transitive deps) |
| Module JS moi | 5 (rules-loader, scanner-dispatch, delta, report-builder, fix-planner) |
| Module JS mo rong | 5 (resource-config, parallel-dispatch, evidence-protocol, session-manager, plan-checker) |
| Skill definition moi | 1 (commands/pd/audit.md) |
| Workflow file moi | 1 (workflows/audit.md) |
| Config file moi | 1 (references/security-rules.yaml) |
| Agent files da co | 14 (13 scanners + 1 reporter — DA TON TAI, chi can wire) |
| Checks moi trong plan-checker | 1 (CHECK-08 Security Gate) |

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| js-yaml la lua chon dung | HIGH | 25K+ npm dependents, zero deps, stable 4.x, verified npm page |
| Khong can static analysis tool | HIGH | 13 agents da ton tai voi Grep/FastCode MCP, codebase verified |
| Mo rong parallel-dispatch cho N agents | MEDIUM | getAdaptiveParallelLimit() da co nhung chi test voi 2 agents — can verify voi 13 |
| Smart Scanner Selection kha thi | HIGH | relevance_signals pattern don gian — check file existence + package.json grep |
| Session Delta logic | HIGH | session-manager.js da co pattern, chi them comparison pure function |
| security-rules.yaml schema | MEDIUM | De xuat — can validate khi implement, co the can dieu chinh fields |
| CHECK-08 Security Gate | HIGH | plan-checker.js da co check registry + dynamic PASS table — them check la trivial |

## Sources

- [js-yaml npm](https://www.npmjs.com/package/js-yaml) — version 4.1.0, download stats, API — HIGH confidence
- [js-yaml GitHub](https://github.com/nodeca/js-yaml) — source code, Node.js compatibility — HIGH confidence
- [yaml npm](https://www.npmjs.com/package/yaml) — alternative considered, size comparison — HIGH confidence
- Codebase analysis: `bin/lib/resource-config.js` (AGENT_REGISTRY, TIER_MAP, getAdaptiveParallelLimit) — HIGH confidence
- Codebase analysis: `bin/lib/parallel-dispatch.js` (buildParallelPlan, wave execution) — HIGH confidence
- Codebase analysis: `bin/lib/evidence-protocol.js` (OUTCOME_TYPES, validateEvidence) — HIGH confidence
- Codebase analysis: `bin/lib/session-manager.js` (createSession, SESSION_FOLDER_RE) — HIGH confidence
- Codebase analysis: `bin/lib/utils.js` (parseFrontmatter — flat YAML only) — HIGH confidence
- Codebase analysis: 13 `commands/pd/agents/pd-sec-*.md` files (da ton tai, tools va process verified) — HIGH confidence
- Codebase analysis: `commands/pd/agents/pd-sec-reporter.md` (13 scanner mapping, evidence file naming) — HIGH confidence
- `.planning/PROJECT.md` — v4.0 scope, constraints, key decisions — HIGH confidence

---
*Stack research for: v4.0 OWASP Security Audit trong please-done*
*Researched: 2026-03-26*
