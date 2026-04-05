# Phase 48: Evidence & Smart Selection - Research

**Researched:** 2026-03-26
**Domain:** Smart scanner selection engine, function-level evidence, reporter aggregation
**Confidence:** HIGH

## Summary

Phase 48 thay the 3 stub (B4 smart selection, function checklist trong scanner, master table trong reporter) bang logic thuc. Ba mang chinh: (1) `selectScanners()` pure function phan tich package.json deps + file patterns de chon scanner lien quan, (2) bo sung `## Function Checklist` vao output cua pd-sec-scanner voi verdict PASS/FLAG/FAIL/SKIP cho tung ham, (3) mo rong pd-sec-reporter de tao master table sap theo severity + OWASP coverage voi hot spots.

He thong hoan toan rule-based (khong dung AI), dua vao 12 tin hieu anh xa den 10 scanner co dieu kien. 3 base scanner (secrets, misconfig, logging) luon chay. Toan bo code moi la pure functions trong `bin/lib/smart-selection.js`, sua template `pd-sec-scanner.md` va `pd-sec-reporter.md`, va thay stub B4 trong `workflows/audit.md`.

**Khuyen nghi chinh:** Trien khai theo thu tu: smart-selection.js (pure function + tests) -> sua scanner template (function checklist) -> sua reporter template (master table + hot spots) -> tich hop vao workflow B4.

<user_constraints>
## User Constraints (tu CONTEXT.md)

### Locked Decisions
- **D-01:** 3 base scanner luon chay khong can tin hieu: `secrets`, `misconfig`, `logging`
- **D-02:** 10 scanner con lai chay co dieu kien — kich hoat khi phat hien tin hieu phu hop
- **D-03:** Engine dat tai file moi `bin/lib/smart-selection.js` — pure function `selectScanners(projectContext)` tra ve `{ selected: string[], skipped: string[], signals: Signal[] }`
- **D-04:** 12 tin hieu dua tren ket hop **package.json deps** (express, prisma, sequelize...) + **file patterns** (file extensions, import statements). Khong dung AI phan tich — hoan toan rule-based
- **D-05:** Khi < 2 tin hieu match: hien thi danh sach tin hieu tim duoc, hoi user chon "chay 3 base + N matched" hay "--full 13 scanner"
- **D-06:** `--full` va `--only cat1,cat2` bypass B4 hoan toan — khong chay smart selection
- **D-07:** Bo sung section `## Function Checklist` vao evidence format hien tai — giu nguyen summary table + findings cu, them bang tung ham. Backward compatible
- **D-08:** Moi ham co verdict: PASS (an toan), FLAG (nghi ngo), FAIL (lo hong xac nhan), SKIP (khong lien quan den category) — SKIP ghi kem ly do ngan
- **D-09:** Phat hien ham bang FastCode query (dung `fastcode_queries[]` tu security-rules.yaml), Grep fallback khi FastCode unavailable
- **D-10:** Master table sap xep: Severity dau tien (CRITICAL -> HIGH -> MEDIUM -> LOW), cung severity sort theo OWASP (A01 -> A10)
- **D-11:** Hot spots hien thi 2 bang rieng: Top 5 files co nhieu finding nhat + Top 5 functions nguy hiem nhat
- **D-12:** Reporter merge function outcomes tu nhieu scanner — cung 1 function bi FLAG boi 2 scanner khac nhau -> gop thanh 1 dong voi nhieu findings
- **D-13:** Flow: B3 (scope) -> B4 `selectScanners(scanPath)` -> hien thi ket qua -> user confirm -> B5 `buildScannerPlan(selected)` -> dispatch
- **D-14:** `selectScanners()` va `buildScannerPlan()` la 2 function rieng biet, loose coupling. Workflow lay `.selected` tu selection roi truyen cho plan
- **D-15:** `--full` skip B4, dispatch 13/13. `--only` skip B4, dispatch danh sach chi dinh

### Claude's Discretion
- Chi tiet 12 tin hieu cu the (mapping signal -> category) — researcher se dieu tra pattern nao phu hop nhat
- Format chinh xac cua Function Checklist table (cot nao, width nao)
- Logic merge function outcomes trong reporter (key: file+function name hay hash)
- Cach hien thi confirm prompt cho user khi < 2 match

### Deferred Ideas (OUT OF SCOPE)
- Auto-fix suggestions (--auto-fix flag) — da thong bao "chua ho tro" trong audit.md
- PoC generation (--poc flag) — tuong tu, chua ho tro
- ML-based signal detection thay vi rule-based — qua phuc tap cho scope hien tai
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| SMART-01 | Context analysis engine phan tich milestone/code patterns de chon scanner lien quan | `selectScanners()` pure function dua tren 12 signals rule-based. Xem bang Signal Mapping ben duoi |
| SMART-02 | Bang anh xa tin hieu -> scanner (12 patterns -> 10 scanner co dieu kien + 3 base luon chay) | 12 signals da thiet ke day du, mapping cu the trong Architecture Patterns |
| SMART-03 | Fallback logic: --full chay 13, --only chay user chi dinh + 3 base, < 2 tin hieu hoi user | 3 nhanh logic ro rang trong workflow integration. Xem code example B4 |
| EVID-01 | Moi scanner xuat bang kiem tra TUNG HAM voi PASS/FLAG/FAIL + ghi ro ham bi bo qua | Function Checklist format va scanner template update. Xem Architecture Patterns |
| EVID-02 | SECURITY_REPORT.md tong hop bang master sap theo severity + OWASP coverage + hot spots | Reporter template update voi master table + 2 hot spots tables. Xem Code Examples |
| AGENT-03 | Reporter agent pd-sec-reporter.md tong hop N evidence files thanh 1 SECURITY_REPORT.md | Mo rong reporter template hien tai, them function merge logic. Xem Architecture Patterns |
</phase_requirements>

## Project Constraints (tu CLAUDE.md)

- Dung tieng viet toan bo, co dau chuan — ap dung cho moi output, comment code, evidence files

## Architecture Patterns

### Recommended Project Structure

```
bin/lib/
  smart-selection.js     # MO'I — selectScanners() pure function
  parallel-dispatch.js   # CO SAN — buildScannerPlan(), mergeScannerResults()
  resource-config.js     # CO SAN — getAgentConfig(), AGENT_REGISTRY

commands/pd/agents/
  pd-sec-scanner.md      # SUA — them Function Checklist section vao process
  pd-sec-reporter.md     # SUA — them master table, hot spots, function merge

workflows/
  audit.md               # SUA — thay stub B4 bang selectScanners() logic

references/
  security-rules.yaml    # CO SAN — khong sua, chi doc
```

### Pattern 1: Signal Mapping (12 tin hieu -> 10 scanner)

**Bang anh xa 12 tin hieu de xuat:**

| # | Signal ID | Detection Method | Kich hoat Scanner |
|---|-----------|-----------------|-------------------|
| 1 | `sig-sql-deps` | package.json co `sequelize`, `knex`, `prisma`, `typeorm`, `pg`, `mysql2`, `mongodb`, `mongoose` HOAC `requirements.txt` co `sqlalchemy`, `django`, `psycopg2` | `sql-injection` |
| 2 | `sig-web-framework` | package.json co `express`, `koa`, `fastify`, `hapi`, `nestjs` HOAC `requirements.txt` co `flask`, `django`, `fastapi` HOAC file `*.php` ton tai | `xss`, `auth`, `prototype-pollution` |
| 3 | `sig-cmd-exec` | Grep tim `child_process`, `exec(`, `spawn(`, `subprocess` trong code | `cmd-injection` |
| 4 | `sig-file-io` | Grep tim `fs.readFile`, `fs.writeFile`, `path.join(.*req`, `open(` trong code | `path-traversal` |
| 5 | `sig-deserialize` | package.json co `node-serialize`, `js-yaml` HOAC Grep tim `pickle`, `unserialize`, `yaml.load` | `deserialization` |
| 6 | `sig-crypto-usage` | Grep tim `createHash`, `createCipher`, `jwt.sign`, `bcrypt`, `crypto` import | `crypto` |
| 7 | `sig-template-engine` | package.json co `ejs`, `pug`, `handlebars`, `nunjucks` HOAC Grep tim `render_template` | `deserialization` (SSTI vector) |
| 8 | `sig-deps-lockfile` | `package-lock.json` HOAC `yarn.lock` HOAC `requirements.txt` HOAC `Pipfile.lock` ton tai | `vuln-deps` |
| 9 | `sig-api-endpoints` | Grep tim `app.get(`, `app.post(`, `router.get(`, `@Get(`, `@Post(` | `auth`, `insecure-design` |
| 10 | `sig-financial` | Grep tim `payment`, `charge`, `transfer`, `balance`, `price`, `amount` | `insecure-design` |
| 11 | `sig-user-input` | Grep tim `req.body`, `req.params`, `req.query`, `request.form`, `$_GET`, `$_POST` | `xss`, `sql-injection`, `cmd-injection` |
| 12 | `sig-frontend-code` | File `*.jsx`, `*.tsx`, `*.vue`, `*.svelte` ton tai | `xss` |

**3 base scanner luon chay (khong can tin hieu):** `secrets`, `misconfig`, `logging`

**Logic de-dup:** Mot scanner co the duoc kich hoat boi nhieu signal. `selectScanners()` tra ve unique list. Vi du: `sig-web-framework` + `sig-user-input` deu kich hoat `xss` → chi chay `xss` 1 lan.

**Confidence:** HIGH — patterns lay truc tiep tu `security-rules.yaml` stack fields va dep names. Rule-based, de verify.

### Pattern 2: selectScanners() Interface

```javascript
// bin/lib/smart-selection.js
'use strict';

const BASE_SCANNERS = ['secrets', 'misconfig', 'logging'];
const ALL_CATEGORIES = [
  'sql-injection', 'xss', 'cmd-injection', 'path-traversal',
  'secrets', 'auth', 'deserialization', 'misconfig',
  'prototype-pollution', 'crypto', 'insecure-design',
  'vuln-deps', 'logging',
];

/**
 * @typedef {Object} Signal
 * @property {string} id - Signal identifier (e.g., 'sig-sql-deps')
 * @property {string} description - Mo ta ngan bang tieng Viet
 * @property {string[]} categories - Categories kich hoat boi signal nay
 * @property {string} evidence - File/dep da phat hien
 */

/**
 * @typedef {Object} SelectionResult
 * @property {string[]} selected - Danh sach categories se chay (de-duped, bao gom base)
 * @property {string[]} skipped - Danh sach categories bi bo qua
 * @property {Signal[]} signals - Cac tin hieu da phat hien
 * @property {boolean} lowConfidence - true khi < 2 signal match (can hoi user)
 */

/**
 * Phan tich project context va chon scanners lien quan.
 * Pure function — KHONG doc file. Caller truyen context da thu thap.
 *
 * @param {Object} projectContext
 * @param {string[]} projectContext.deps - Ten dependencies (tu package.json)
 * @param {string[]} projectContext.fileExtensions - Cac file extension co trong project
 * @param {string[]} projectContext.codePatterns - Ket qua grep cac pattern quan trong
 * @param {boolean} projectContext.hasLockfile - Co lockfile khong
 * @returns {SelectionResult}
 */
function selectScanners(projectContext) {
  // ... pure function logic
}
```

**Quan trong:** `selectScanners()` la PURE FUNCTION. No KHONG doc file truc tiep. Workflow B4 chiu trach nhiem thu thap `projectContext` (doc package.json, chay Glob/Grep) roi truyen vao.

### Pattern 3: Function Checklist Format (EVID-01)

Them vao cuoi moi evidence file, SAU section `## Chi tiet`:

```markdown
## Function Checklist

| # | File | Ham | Dong | Verdict | Chi tiet |
|---|------|-----|------|---------|----------|
| 1 | src/api/users.js | getUserById | 42 | FLAG | IDOR — params.id khong kiem tra ownership |
| 2 | src/api/users.js | createUser | 78 | PASS | Whitelist fields, bcrypt password |
| 3 | src/api/users.js | deleteUser | 105 | FAIL | Khong co auth middleware |
| 4 | src/utils/helper.js | formatDate | 12 | SKIP | Khong lien quan den auth category |
```

**4 verdicts:**
- **PASS** — Ham an toan voi category dang quet
- **FLAG** — Nghi ngo, can review them
- **FAIL** — Lo hong xac nhan
- **SKIP** — Khong lien quan, kem ly do ngan

**Backward compatible:** Giu nguyen frontmatter, `## Tom tat`, `## Phat hien`, `## Chi tiet`. Chi THEM section `## Function Checklist` o cuoi.

### Pattern 4: Reporter Master Table + Hot Spots (EVID-02)

**Master table** thay the bang "Phat hien tong hop" hien tai:

```markdown
## Master Table

| # | Severity | OWASP | Category | File | Ham | Dong | Verdict | Mo ta |
|---|----------|-------|----------|------|-----|------|---------|-------|
| 1 | CRITICAL | A03 | sql-injection | src/db.js | rawQuery | 42 | FAIL | SQL noi chuoi |
| 2 | HIGH | A01 | auth | src/api.js | getUser | 15 | FLAG | IDOR nghi ngo |
```

**Sort order:** Severity (CRITICAL > HIGH > MEDIUM > LOW), cung severity sort OWASP (A01 > A02 > ... > A10).

**Hot spots — 2 bang rieng:**

```markdown
## Hot Spots

### Top 5 files co nhieu finding nhat

| # | File | FAIL | FLAG | Total | Categories |
|---|------|------|------|-------|------------|
| 1 | src/api/users.js | 3 | 2 | 5 | auth, xss, sqli |

### Top 5 functions nguy hiem nhat

| # | File | Ham | FAIL | FLAG | Categories |
|---|------|-----|------|------|------------|
| 1 | src/db.js | rawQuery | 2 | 1 | sqli, cmdi |
```

### Pattern 5: Function Merge Logic (D-12)

**Merge key:** `file_path + function_name` (string concat). Khong dung hash — de debug.

Khi cung 1 function bi FLAG boi `sql-injection` va `auth`:
```markdown
| # | File | Ham | Dong | Verdicts | Categories |
|---|------|-----|------|----------|------------|
| 1 | src/api.js | getUserById | 42 | FLAG(sqli), FLAG(auth) | sql-injection, auth |
```

**Rule merge verdict:**
- FAIL + bat ky = FAIL (worst-case)
- FLAG + PASS = FLAG
- SKIP + bat ky khac = giu verdict khac (SKIP la "khong lien quan")

### Pattern 6: User Confirm Prompt (khi < 2 signals)

```
Smart Selection ket qua:
  Tin hieu tim duoc: 1/12
    - sig-deps-lockfile: Co package-lock.json

  Scanner se chay (4):
    - secrets (base)
    - misconfig (base)
    - logging (base)
    - vuln-deps (tu sig-deps-lockfile)

  Scanner bo qua (9): sql-injection, xss, cmd-injection, ...

  [1] Chay 4 scanner da chon
  [2] Chay --full (13 scanner)

Chon (1/2):
```

Dung `Bash` tool de hien thi prompt va cho user phan hoi.

### Anti-Patterns to Avoid

- **KHONG doc file trong selectScanners():** Ham nay la pure function. Workflow B4 chiu trach nhiem thu thap context.
- **KHONG dung AI de phan tich signals:** Hoan toan rule-based. Glob + Grep + doc package.json.
- **KHONG thay doi buildScannerPlan() interface:** Nhan categories[] nhu cu, chi thay doi DANH SACH truyen vao.
- **KHONG sua security-rules.yaml:** Chi doc, khong them signal config vao day. Signal mapping nam trong smart-selection.js.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Scanner dispatch | Custom dispatch logic | `buildScannerPlan()` da co | Da test, wave-based, failure isolation |
| Evidence merge | Custom merge logic | `mergeScannerResults()` da co | Handles incomplete results, inconclusive |
| YAML parsing | Custom YAML parser | Scanner tu doc YAML | Scanner da co logic doc security-rules.yaml |
| File pattern detection | Custom file scanner | Glob tool | Nhanh, co san, chinh xac |
| Dep detection | Custom parser | `node -e "JSON.parse(fs.readFileSync('package.json'))"` | Don gian, khong can thu vien ngoai |

## Common Pitfalls

### Pitfall 1: Signal detection qua cham
**What goes wrong:** Chay nhieu Grep commands cho 12 signals -> mat 30s+ truoc khi bat dau scan
**Why it happens:** Moi signal chay 1 Grep rieng
**How to avoid:** Gom cac Grep pattern thanh it lenh nhat co the. Glob cho file extensions la 1 lenh. Package.json doc 1 lan, kiem tra nhieu deps. Grep cac code patterns co the gom voi `|` regex.
**Warning signs:** B4 mat hon 10s

### Pitfall 2: Signal false positive cho base scanners
**What goes wrong:** Signal mapping vo tinh kich hoat base scanner (secrets/misconfig/logging), lam trung voi base list
**Why it happens:** Khong de-dup selected list
**How to avoid:** De-dup bang `[...new Set([...BASE_SCANNERS, ...signalSelected])]`

### Pitfall 3: Function checklist khong backward compatible
**What goes wrong:** Them Function Checklist lam hong evidence-protocol.js validation
**Why it happens:** validateEvidence() kiem tra required sections
**How to avoid:** `## Function Checklist` la OPTIONAL section. Kiem tra validateEvidence() hien tai khong reject extra sections (da verify: no chi kiem tra required sections co mat, khong reject extra).

### Pitfall 4: Reporter khong xu ly evidence file thieu
**What goes wrong:** Smart selection chi chay 6/13 scanner → reporter tim 13 evidence files → 7 files thieu → loi
**Why it happens:** Reporter hien tai list 13 evidence files cu the
**How to avoid:** Reporter phai doc danh sach evidence files thuc te tu session dir (Glob `evidence_sec_*.md`), khong hardcode 13 files

### Pitfall 5: --only khong them base scanners
**What goes wrong:** User chay `--only xss` → chi chay xss, thieu 3 base
**Why it happens:** D-06 noi "bypass B4 hoan toan" nhung CONTEXT.md D-15 noi "--only dispatch danh sach chi dinh"
**How to avoid:** CONTEXT.md D-06 noi "--only cat1,cat2 bypass B4" — tuc la khong chay smart selection, nhung van them 3 base. Cuoi cung: `--only xss` → chay `xss` + `secrets` + `misconfig` + `logging` = 4 scanners. Tuy nhien re-read D-15: "--only skip B4, dispatch danh sach chi dinh + 3 base". Vay --only = user list + 3 base. Da ro.

### Pitfall 6: Confirm prompt block workflow khi non-interactive
**What goes wrong:** User chay tu CI/CD, khong co terminal -> hang o prompt
**Why it happens:** AskUserQuestion khong kha dung trong non-interactive mode
**How to avoid:** Khi < 2 signals va khong co AskUserQuestion tool, default chay selected + base (khong hoi). Ghi warning vao log.

## Code Examples

### selectScanners() — Core Logic

```javascript
// bin/lib/smart-selection.js
// Source: Thiet ke tu CONTEXT.md D-01..D-06

const BASE_SCANNERS = ['secrets', 'misconfig', 'logging'];

const SIGNAL_MAP = [
  {
    id: 'sig-sql-deps',
    deps: ['sequelize', 'knex', 'prisma', '@prisma/client', 'typeorm', 'pg', 'mysql2', 'mongodb', 'mongoose', 'better-sqlite3'],
    pyDeps: ['sqlalchemy', 'django', 'psycopg2', 'pymongo'],
    codePatterns: [],
    filePatterns: [],
    categories: ['sql-injection'],
  },
  {
    id: 'sig-web-framework',
    deps: ['express', 'koa', 'fastify', '@hapi/hapi', '@nestjs/core', 'next', 'nuxt'],
    pyDeps: ['flask', 'django', 'fastapi', 'tornado'],
    codePatterns: [],
    filePatterns: ['.php'],
    categories: ['xss', 'auth', 'prototype-pollution'],
  },
  {
    id: 'sig-cmd-exec',
    deps: [],
    pyDeps: [],
    codePatterns: ['child_process', 'exec\\(', 'spawn\\(', 'subprocess'],
    filePatterns: [],
    categories: ['cmd-injection'],
  },
  {
    id: 'sig-file-io',
    deps: [],
    pyDeps: [],
    codePatterns: ['fs\\.readFile', 'fs\\.createReadStream', 'path\\.join\\(.*req', 'sendFile\\('],
    filePatterns: [],
    categories: ['path-traversal'],
  },
  {
    id: 'sig-deserialize',
    deps: ['node-serialize', 'js-yaml', 'serialize-javascript'],
    pyDeps: ['pyyaml'],
    codePatterns: ['pickle\\.load', 'unserialize\\(', 'yaml\\.load\\('],
    filePatterns: [],
    categories: ['deserialization'],
  },
  {
    id: 'sig-crypto-usage',
    deps: ['bcrypt', 'argon2', 'jsonwebtoken', 'jose', 'crypto-js'],
    pyDeps: ['cryptography', 'pyjwt', 'passlib'],
    codePatterns: ['createHash\\(', 'createCipher', 'jwt\\.sign'],
    filePatterns: [],
    categories: ['crypto'],
  },
  {
    id: 'sig-template-engine',
    deps: ['ejs', 'pug', 'handlebars', 'nunjucks', 'mustache', 'eta'],
    pyDeps: ['jinja2', 'mako'],
    codePatterns: ['render_template_string'],
    filePatterns: ['.ejs', '.pug', '.hbs'],
    categories: ['deserialization'],
  },
  {
    id: 'sig-deps-lockfile',
    deps: [],
    pyDeps: [],
    codePatterns: [],
    filePatterns: [],
    lockfiles: ['package-lock.json', 'yarn.lock', 'pnpm-lock.yaml', 'requirements.txt', 'Pipfile.lock', 'Gemfile.lock'],
    categories: ['vuln-deps'],
  },
  {
    id: 'sig-api-endpoints',
    deps: [],
    pyDeps: [],
    codePatterns: ['app\\.(get|post|put|delete)\\(', 'router\\.(get|post|put|delete)\\(', '@(Get|Post|Put|Delete)\\('],
    filePatterns: [],
    categories: ['auth', 'insecure-design'],
  },
  {
    id: 'sig-financial',
    deps: ['stripe', 'paypal', 'braintree'],
    pyDeps: ['stripe', 'paypalrestsdk'],
    codePatterns: ['payment', 'charge', 'transfer', 'balance', 'withdraw'],
    filePatterns: [],
    categories: ['insecure-design'],
  },
  {
    id: 'sig-user-input',
    deps: [],
    pyDeps: [],
    codePatterns: ['req\\.body', 'req\\.params', 'req\\.query', 'request\\.form', '\\$_GET', '\\$_POST'],
    filePatterns: [],
    categories: ['xss', 'sql-injection', 'cmd-injection'],
  },
  {
    id: 'sig-frontend-code',
    deps: ['react', 'vue', 'svelte', '@angular/core'],
    pyDeps: [],
    codePatterns: [],
    filePatterns: ['.jsx', '.tsx', '.vue', '.svelte'],
    categories: ['xss'],
  },
];

function selectScanners(projectContext) {
  const { deps = [], fileExtensions = [], codePatterns = [], hasLockfile = false } = projectContext;
  const signals = [];
  const categoriesFromSignals = new Set();

  for (const signal of SIGNAL_MAP) {
    let matched = false;
    let evidence = '';

    // Check deps
    const depMatch = signal.deps?.find(d => deps.includes(d));
    if (depMatch) { matched = true; evidence = `dep: ${depMatch}`; }

    // Check pyDeps
    if (!matched) {
      const pyMatch = signal.pyDeps?.find(d => deps.includes(d));
      if (pyMatch) { matched = true; evidence = `py-dep: ${pyMatch}`; }
    }

    // Check file patterns
    if (!matched && signal.filePatterns?.length > 0) {
      const extMatch = signal.filePatterns.find(ext => fileExtensions.includes(ext));
      if (extMatch) { matched = true; evidence = `file: ${extMatch}`; }
    }

    // Check lockfiles
    if (!matched && signal.lockfiles) {
      if (hasLockfile) { matched = true; evidence = 'lockfile present'; }
    }

    // Check code patterns
    if (!matched && signal.codePatterns?.length > 0) {
      const codeMatch = signal.codePatterns.find(p => codePatterns.includes(p));
      if (codeMatch) { matched = true; evidence = `code: ${codeMatch}`; }
    }

    if (matched) {
      signals.push({ id: signal.id, description: evidence, categories: signal.categories });
      signal.categories.forEach(c => categoriesFromSignals.add(c));
    }
  }

  // De-dup: base + signal-selected
  const selected = [...new Set([...BASE_SCANNERS, ...categoriesFromSignals])];
  const skipped = ALL_CATEGORIES.filter(c => !selected.includes(c));
  const lowConfidence = signals.length < 2;

  return { selected, skipped, signals, lowConfidence };
}
```

### Workflow B4 Replacement

```markdown
## Buoc 4: Smart selection

Neu --full: SKIP buoc nay, categories = 13 categories tu B3. Ghi log "--full: chay 13/13 scanners".
Neu --only: SKIP buoc nay, categories = user list + 3 base (secrets, misconfig, logging). De-dup.

Khong co flag → chay smart selection:

1. Thu thap project context:
   a. Doc package.json → lay deps (Object.keys(dependencies) + Object.keys(devDependencies))
   b. Glob file extensions: *.{js,ts,jsx,tsx,php,py,rb,java,go,vue,svelte}
   c. Grep code patterns: req.body, child_process, createHash, app.get(, payment...
   d. Kiem tra lockfile: package-lock.json / yarn.lock / requirements.txt ton tai

2. Goi selectScanners(projectContext):
   ```bash
   node -e "const {selectScanners}=require('./bin/lib/smart-selection');
   const ctx={deps:[...],fileExtensions:[...],codePatterns:[...],hasLockfile:true};
   console.log(JSON.stringify(selectScanners(ctx)))"
   ```

3. Hien thi ket qua:
   - Neu lowConfidence=false: log "Smart Selection: {selected.length} scanners, {skipped.length} bo qua"
   - Neu lowConfidence=true: hien thi prompt xac nhan (xem Pattern 6)

4. Ghi {session_dir}/03-selection.md voi: signals[], selected[], skipped[], lowConfidence
```

### Reporter Function Merge Example

```javascript
// Pseudocode cho reporter merge logic
// Key = "file_path::function_name"

const functionMap = new Map();

for (const evidence of evidenceFiles) {
  for (const row of evidence.functionChecklist) {
    const key = `${row.file}::${row.function}`;
    if (functionMap.has(key)) {
      const existing = functionMap.get(key);
      existing.findings.push({ category: evidence.category, verdict: row.verdict, detail: row.detail });
      // Merge verdict: FAIL > FLAG > PASS (worst-case wins)
      if (row.verdict === 'FAIL') existing.mergedVerdict = 'FAIL';
      else if (row.verdict === 'FLAG' && existing.mergedVerdict !== 'FAIL') existing.mergedVerdict = 'FLAG';
    } else {
      functionMap.set(key, {
        file: row.file, function: row.function, line: row.line,
        mergedVerdict: row.verdict,
        findings: [{ category: evidence.category, verdict: row.verdict, detail: row.detail }],
      });
    }
  }
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| B4 stub (chay tat ca) | selectScanners() rule-based | Phase 48 | Giam 40-60% scanners khi project chi dung 1 stack |
| Scanner chi co summary table | Function-level checklist | Phase 48 | Moi ham co verdict rieng, minh bach hon |
| Reporter list 13 evidence files | Reporter Glob evidence_sec_*.md | Phase 48 | Tuong thich voi smart selection (< 13 files) |

## Open Questions

1. **codePatterns detection method**
   - What we know: Workflow B4 can chay Grep de phat hien code patterns (req.body, child_process, v.v.)
   - What's unclear: Nen chay 1 Grep voi regex lon hay nhieu Grep nho? Grep tool co gioi han pattern length khong?
   - Recommendation: Chay 3-4 Grep voi pattern gom nhom (vd: `req\.(body|params|query)` cho user-input). Moi Grep lay `files_with_matches` mode, chi can biet co/khong.

2. **--only co them base scanners khong?**
   - What we know: D-06 noi "bypass B4 hoan toan", D-15 noi "dispatch danh sach chi dinh + 3 base"
   - What's unclear: D-06 va D-15 co chut mau thuan
   - Recommendation: Theo D-15: `--only cat1,cat2` = user list + 3 base. De-dup neu user chi dinh base scanner.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | node:test (built-in) |
| Config file | Khong co config file rieng — dung `node --test 'test/*.test.js'` |
| Quick run command | `node --test test/smoke-smart-selection.test.js` |
| Full suite command | `node --test 'test/*.test.js'` |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| SMART-01 | selectScanners() tra ve selected/skipped/signals tu projectContext | unit | `node --test test/smoke-smart-selection.test.js -x` | Wave 0 |
| SMART-02 | 12 signals mapping dung 10 scanner co dieu kien + 3 base luon chay | unit | `node --test test/smoke-smart-selection.test.js -x` | Wave 0 |
| SMART-03 | lowConfidence=true khi < 2 signals; --full tra 13; --only tra user+base | unit | `node --test test/smoke-smart-selection.test.js -x` | Wave 0 |
| EVID-01 | Scanner template co section Function Checklist | manual-only | Kiem tra pd-sec-scanner.md co `## Function Checklist` section | N/A |
| EVID-02 | Reporter template co master table + hot spots | manual-only | Kiem tra pd-sec-reporter.md co `## Master Table` va `## Hot Spots` | N/A |
| AGENT-03 | Reporter doc evidence files, merge function outcomes | manual-only | Chay `pd:audit --full` tren test project va kiem tra SECURITY_REPORT.md | N/A |

### Sampling Rate
- **Per task commit:** `node --test test/smoke-smart-selection.test.js`
- **Per wave merge:** `node --test 'test/*.test.js'`
- **Phase gate:** Full suite green truoc `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `test/smoke-smart-selection.test.js` — covers SMART-01, SMART-02, SMART-03
- [ ] Framework install: Khong can — node:test da co san

## Sources

### Primary (HIGH confidence)
- `/home/please-done/.planning/phases/48-evidence-smart-selection/48-CONTEXT.md` — Tat ca decisions D-01..D-15
- `/home/please-done/references/security-rules.yaml` — 13 OWASP categories voi patterns[], stack[], fastcode_queries[]
- `/home/please-done/bin/lib/parallel-dispatch.js` — buildScannerPlan(), mergeScannerResults() interface
- `/home/please-done/bin/lib/resource-config.js` — AGENT_REGISTRY, pd-sec-scanner categories list
- `/home/please-done/workflows/audit.md` — Workflow 9 buoc, B4 stub hien tai
- `/home/please-done/commands/pd/agents/pd-sec-scanner.md` — Scanner template hien tai
- `/home/please-done/commands/pd/agents/pd-sec-reporter.md` — Reporter template hien tai

### Secondary (MEDIUM confidence)
- Signal mapping table — thiet ke tu analysis security-rules.yaml stack fields + common dependency names

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — chi dung modules hien co (parallel-dispatch.js, resource-config.js) + 1 file moi
- Architecture: HIGH — pure function pattern nhat quan voi buildScannerPlan(), decisions cu the tu CONTEXT.md
- Pitfalls: HIGH — da verify validateEvidence() chi kiem tra required sections, khong reject extra sections
- Signal mapping: MEDIUM — 12 signals la thiet ke moi, can test thuc te tren nhieu project de tinh chinh

**Research date:** 2026-03-26
**Valid until:** 2026-04-26 (stable — rule-based, khong phu thuoc thu vien ngoai)
