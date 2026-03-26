# Phase 47: Luong Audit Cot loi - Research

**Researched:** 2026-03-26
**Domain:** Skill entry point + workflow orchestration + batch scanner dispatch
**Confidence:** HIGH

## Summary

Phase 47 tao skill `pd:audit [path] [flags]` voi workflow 9 buoc, 2 che do tu dong phat hien (Doc lap/Tich hop), va batch dispatch scanner song song 2/wave. Day la phase "khung xuong" — 6 buoc full implementation, 3 buoc stub cho phase sau (B2 Delta, B4 Smart selection, B8 Fix routing).

Tat ca code patterns da co san trong codebase: `pd:scan` la mau cho skill frontmatter + guards + argument parsing, `parallel-dispatch.js` la nen tang cho batch scanner dispatch (mo rong them `buildScannerPlan`), va `session-manager.js` cung cap pattern quan ly audit session directory. Khong can thu vien ngoai moi — chi mo rong code hien co.

**Primary recommendation:** Mo rong `parallel-dispatch.js` them `buildScannerPlan()` va `mergeScannerResults()`, tao `commands/pd/audit.md` skill file theo pattern `scan.md`, va tao `workflows/audit.md` workflow 9 buoc.

## Project Constraints (from CLAUDE.md)

- Dung tieng viet toan bo, co dau chuan

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** Model tier: Architect (Opus) orchestrator cho workflow 9 buoc
- **D-02:** Guards: giu y het pd:scan — 3 guards (guard-context, guard-valid-path, guard-fastcode). Che do Doc lap bo qua guard-context
- **D-03:** Argument syntax: `pd:audit [path] [flags]` — path mac dinh ".", flags: `--full`, `--only cat1,cat2`, `--poc`, `--auto-fix`
- **D-04:** --poc va --auto-fix: parse flag nhung bao "chua ho tro trong phien ban nay"
- **D-05:** 6 buoc full, 3 buoc stub: FULL: B1 Detect mode, B3 Scope/parse args, B5 Dispatch scanners, B6 Reporter, B7 Analyze/merge, B9 Save report. STUB: B2 Delta-aware, B4 Smart selection, B8 Fix routing
- **D-06:** Output format: Markdown files trong temp dir `/tmp/pd-audit-{hash}/01-detect.md`, `02-scope.md`, `03-dispatch/{category}.md`, `04-report.md`, `SECURITY_REPORT.md`
- **D-07:** Auto-detect: kiem tra `.planning/PROJECT.md` — ton tai = Tich hop, khong = Doc lap
- **D-08:** 3 diem khac giua 2 che do: (1) Output path, (2) Guard set, (3) Fix routing stub
- **D-09:** Mo rong `parallel-dispatch.js` — them `buildScannerPlan(categories, batchSize, scanPath)`. Tai dung `mergeParallelResults`. Khong tao file moi
- **D-10:** Batch size mac dinh: 2 scanners/wave (7 waves cho 13 categories)
- **D-11:** Failure handling: log error, tiep tuc wave — scanner fail khong chan ca audit
- **D-12:** Scanner dispatch dung `getAgentConfig('pd-sec-scanner').categories` de lay 13 slugs
- **D-13:** Moi scanner instance nhan `--category {slug}`, tier scout (Haiku)
- **D-14:** FastCode tool-first, Grep fallback

### Claude's Discretion
- Pattern tai dung tu cac module hien co (session-manager, utils)
- Cau truc noi bo cua workflow file
- Error message format

### Deferred Ideas (OUT OF SCOPE)
- Delta-aware scanning (git diff scope) — Phase 49
- Smart scanner selection (context analysis) — Phase 48
- Fix routing (tu dong tao fix phases) — Phase 50
- POC pipeline (gadget chain) — Phase 50
- Function-level evidence checklist — Phase 48
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| CORE-01 | User co the chay `pd:audit` voi tham so [path] [--full\|--only\|--poc\|--auto-fix] | Skill file `audit.md` theo pattern `scan.md`: frontmatter, argument parsing, guards |
| CORE-02 | Workflow audit thuc thi 9 buoc: detect -> delta -> scope -> smart selection -> dispatch -> reporter -> analyze -> fix -> save | Workflow file `workflows/audit.md` voi 9 buoc, 3 stub |
| CORE-03 | He thong tu phat hien che do Doc lap / Tich hop | B1 Detect mode: kiem tra `.planning/PROJECT.md` ton tai |
| BATCH-01 | Wave-based parallel dispatch toi da 2 scanner song song, backpressure cho ca wave xong | `buildScannerPlan()` trong `parallel-dispatch.js` chia 13 categories thanh waves of 2 |
| BATCH-02 | Failure isolation — 1 scanner loi/timeout ghi inconclusive, tiep tuc wave tiep | `mergeScannerResults()` pattern tu `mergeParallelResults()` — khong critical, ghi warning |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Node.js built-in `node:test` | Node v24.14.1 | Test framework | Da dung xuyen suot project, khong dependency ngoai |
| Node.js built-in `node:assert/strict` | Node v24.14.1 | Assertions | Nhat quan voi tat ca test hien co |
| js-yaml | devDep hien co | Parse security-rules.yaml | Da co trong devDependencies |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| node:crypto | built-in | Tao hash cho temp dir name | `createHash('md5').update(scanPath+timestamp).digest('hex').slice(0,8)` |
| node:path | built-in | Path manipulation | Join, resolve session dirs |
| node:os | built-in | Temp dir | `os.tmpdir()` cho fallback |

### Alternatives Considered
Khong co — tat ca deu la code/pattern hien co trong project, khong can thu vien ngoai moi.

## Architecture Patterns

### Recommended Project Structure
```
commands/pd/
  audit.md                    # Skill entry point (NEW)
workflows/
  audit.md                    # Workflow 9 buoc (NEW)
bin/lib/
  parallel-dispatch.js        # Mo rong: buildScannerPlan + mergeScannerResults (MODIFY)
```

### Pattern 1: Skill Entry Point (theo pd:scan)
**What:** Frontmatter YAML + guards + argument parsing + workflow reference
**When to use:** Tao bat ky skill `pd:*` nao moi
**Example:**
```markdown
---
name: pd:audit
description: Quet bao mat OWASP — dispatch 13 scanner song song va tong hop bao cao
model: opus
argument-hint: "[path du an] [--full|--only cat1,cat2|--poc|--auto-fix]"
allowed-tools:
  - Read
  - Write
  - Edit
  - Bash
  - Glob
  - Grep
  - mcp__fastcode__code_qa
  - SubAgent
---

<guards>
@references/guard-context.md  (bo qua khi che do Doc lap)
@references/guard-valid-path.md
@references/guard-fastcode.md
</guards>

<execution_context>
@workflows/audit.md (required)
</execution_context>
```

### Pattern 2: Workflow 9 buoc voi stub
**What:** Workflow file dieu phoi 9 buoc tuan tu, 3 buoc stub chi log va tiep tuc
**When to use:** Khi workflow phuc tap can chia thanh cac buoc ro rang
**Example stub buoc:**
```markdown
## Buoc 2: Delta-aware (STUB)
> Phien ban hien tai chua ho tro delta-aware scanning.
> Treat toan bo codebase nhu full scan.
> Extension point cho Phase 49.

Ghi `/tmp/pd-audit-{hash}/02-delta.md`:
- Status: stub
- Note: Full scan — delta-aware chua duoc trien khai
```

### Pattern 3: Wave-based batch dispatch (mo rong parallel-dispatch.js)
**What:** Chia N categories thanh waves of K, dispatch tung wave, doi xong roi moi bat dau wave sau
**When to use:** Khi can chay nhieu agent instances song song voi backpressure
**Example:**
```javascript
/**
 * Tao ke hoach dispatch N scanner theo waves.
 * @param {string[]} categories - Danh sach category slugs
 * @param {number} batchSize - So scanner moi wave (mac dinh 2)
 * @param {string} scanPath - Path can quet
 * @returns {{ waves: Array<Array<{category, config, outputFile}>>, totalWaves: number, warnings: string[] }}
 */
function buildScannerPlan(categories, batchSize = 2, scanPath = '.') {
  const scannerConfig = getAgentConfig('pd-sec-scanner');
  const waves = [];
  const warnings = [];

  for (let i = 0; i < categories.length; i += batchSize) {
    const wave = categories.slice(i, i + batchSize).map(cat => ({
      category: cat,
      config: { ...scannerConfig, category: cat },
      outputFile: `evidence_sec_${cat.replace(/-/g, '_')}.md`,  // Khong dung — lay tu YAML
    }));
    waves.push(wave);
  }

  return { waves, totalWaves: waves.length, warnings };
}
```

### Pattern 4: Auto-detect che do (D-07)
**What:** Kiem tra `.planning/PROJECT.md` de xac dinh Doc lap hay Tich hop
**When to use:** Buoc 1 cua workflow
**Example:**
```markdown
## Buoc 1: Detect mode

1. Kiem tra file `.planning/PROJECT.md` ton tai (dung Read hoac Bash `test -f`)
2. Ton tai → mode = "tich-hop", output_dir = ".planning/audit/"
3. Khong ton tai → mode = "doc-lap", output_dir = "./" (root)
4. Ghi `/tmp/pd-audit-{hash}/01-detect.md` voi mode va output_dir
5. Neu mode = "doc-lap": bo qua guard-context (da check o skill level)
```

### Anti-Patterns to Avoid
- **Tao file moi cho batch dispatch:** D-09 khoa quyet dinh mo rong `parallel-dispatch.js`, KHONG tao module moi
- **Hardcode evidence file names:** Lay `evidence_file` tu `security-rules.yaml` thong qua YAML parse, khong hardcode 13 ten file
- **Block toan bo audit khi 1 scanner fail:** D-11 yeu cau failure isolation — ghi inconclusive va tiep tuc
- **Dung model nang cho scanner:** D-13 khoa scanner o tier scout (Haiku) — chi orchestrator la Architect

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Agent config lookup | Tu hardcode 13 scanner configs | `getAgentConfig('pd-sec-scanner').categories` | Config da co trong AGENT_REGISTRY |
| Parallel plan creation | Tu viet wave logic tu dau | Mo rong `buildParallelPlan` pattern | Pattern da duoc test va hoat dong |
| Result merging | Tu viet merge logic | Mo rong `mergeParallelResults` pattern | Failure handling da duoc chung minh |
| Session dir management | Tu viet mkdir/hash logic | Tai dung `session-manager.js` patterns | generateSlug, createSession da on dinh |
| YAML parsing | Tu viet parser | `js-yaml` (da co trong devDeps) | Codebase da dung cho security-rules.yaml |
| Argument parsing | Tu viet CLI parser | Regex parse trong workflow (nhu pd:scan) | Pattern don gian, da chung minh |

**Key insight:** Phase 47 la 90% tai dung pattern hien co, 10% tao moi. Khong can thu vien moi, chi mo rong code da co.

## Common Pitfalls

### Pitfall 1: Evidence file name mismatch
**What goes wrong:** Hardcode evidence file name trong dispatch khong khop voi `evidence_file` trong security-rules.yaml
**Why it happens:** 13 categories co ten file khong theo quy luat thong nhat (vd: `evidence_sec_sqli.md` khong phai `evidence_sec_sql-injection.md`)
**How to avoid:** LUON doc `evidence_file` tu YAML cho moi category, khong tu suy ra tu slug
**Warning signs:** Scanner ghi file A, reporter tim file B

### Pitfall 2: Guard-context chay trong che do Doc lap
**What goes wrong:** Guard-context chan pd:audit khi khong co `.planning/CONTEXT.md` — nhung Doc lap DUNG la khong co `.planning/`
**Why it happens:** Guard chay truoc khi detect mode
**How to avoid:** Skill file pd:audit can logic dac biet: kiem tra `.planning/PROJECT.md` TRUOC khi chay guards. Neu Doc lap → bo qua guard-context
**Warning signs:** pd:audit bao loi "Chay /pd:init truoc" tren du an khong dung please-done

### Pitfall 3: Temp dir conflict khi chay nhieu audit song song
**What goes wrong:** 2 audit session ghi chung 1 temp dir
**Why it happens:** Hash khong unique (vi dung cung path + timestamp can bang nhau)
**How to avoid:** Hash bao gom scanPath + Date.now() + random suffix
**Warning signs:** Evidence files bi ghi de

### Pitfall 4: SubAgent tool khong co trong allowed-tools
**What goes wrong:** Workflow can spawn scanner agents nhung SubAgent khong co trong allowed-tools cua skill
**Why it happens:** pd:scan khong can SubAgent vi khong dispatch agents
**How to avoid:** Them SubAgent (hoac Task) vao allowed-tools cua pd:audit skill file
**Warning signs:** "Tool not allowed" error khi dispatch scanner

### Pitfall 5: Backpressure — wave sau bat dau truoc wave truoc xong
**What goes wrong:** Tat ca scanners chay dong thoi thay vi 2/wave
**Why it happens:** Workflow orchestrator (AI) khong doi wave hoan tat
**How to avoid:** Workflow phai ghi ro: "Doi TAT CA scanners trong wave hoan tat roi moi bat dau wave tiep theo"
**Warning signs:** > 2 scanner agents chay cung luc

### Pitfall 6: --only flag voi category khong ton tai
**What goes wrong:** User truyen `--only fake-cat` va khong co error handling
**Why it happens:** Khong validate category slugs truoc khi dispatch
**How to avoid:** B3 Scope validate `--only` slugs against `getAgentConfig('pd-sec-scanner').categories`
**Warning signs:** Dispatch scanner voi category khong co trong YAML → scanner bao loi

## Code Examples

### Skill file entry point (audit.md)
```markdown
---
name: pd:audit
description: Quet bao mat OWASP — dispatch 13 scanner va tong hop bao cao
model: opus
argument-hint: "[path] [--full|--only cat1,cat2|--poc|--auto-fix]"
allowed-tools:
  - Read
  - Write
  - Edit
  - Bash
  - Glob
  - Grep
  - mcp__fastcode__code_qa
  - SubAgent
---

<objective>
Quet bao mat toan dien dua tren OWASP Top 10. Dispatch 13 scanner song song (2/wave),
tong hop bao cao, phan tich cheo.
</objective>

<guards>
Buoc 1: Kiem tra `.planning/PROJECT.md` ton tai → xac dinh mode
Neu mode = "tich-hop":
  @references/guard-context.md
  @references/guard-valid-path.md
  @references/guard-fastcode.md
Neu mode = "doc-lap":
  @references/guard-valid-path.md
  @references/guard-fastcode.md
</guards>

<context>
Nguoi dung nhap: $ARGUMENTS
</context>

<execution_context>
@workflows/audit.md (required)
</execution_context>

<process>
Thuc thi @workflows/audit.md tu dau den cuoi.
</process>
```

### buildScannerPlan (mo rong parallel-dispatch.js)
```javascript
/**
 * Tao ke hoach dispatch N scanner theo waves.
 * Mo rong tu buildParallelPlan — cung pure function pattern.
 *
 * @param {string[]} categories - Danh sach category slugs can quet
 * @param {number} [batchSize=2] - So scanner moi wave
 * @param {string} [scanPath='.'] - Path can quet
 * @returns {{ waves: Array<Array<{category: string, agentName: string, outputFile: string}>>, totalWaves: number, totalScanners: number, warnings: string[] }}
 */
function buildScannerPlan(categories, batchSize = 2, scanPath = '.') {
  const warnings = [];

  if (!Array.isArray(categories) || categories.length === 0) {
    warnings.push('Danh sach categories rong — khong co scanner nao de dispatch');
    return { waves: [], totalWaves: 0, totalScanners: 0, warnings };
  }

  if (batchSize < 1) batchSize = 1;

  const waves = [];
  for (let i = 0; i < categories.length; i += batchSize) {
    const wave = categories.slice(i, i + batchSize).map(cat => ({
      category: cat,
      agentName: 'pd-sec-scanner',
      outputFile: `evidence_sec_${cat}.md`,  // Placeholder — workflow doc tu YAML
    }));
    waves.push(wave);
  }

  return {
    waves,
    totalWaves: waves.length,
    totalScanners: categories.length,
    warnings,
  };
}
```

### mergeScannerResults (mo rong parallel-dispatch.js)
```javascript
/**
 * Hop nhat ket qua tu N scanner, xu ly partial failure (D-11).
 * Scanner fail → ghi inconclusive, khong chan cac scanner con lai.
 *
 * @param {Array<{category: string, evidenceContent: string|null, error: object|null}>} scanResults
 * @returns {{ results: Array<{category: string, outcome: string|null, valid: boolean}>, completedCount: number, failedCount: number, warnings: string[] }}
 */
function mergeScannerResults(scanResults) {
  const warnings = [];
  const results = [];
  let completedCount = 0;
  let failedCount = 0;

  for (const scan of scanResults) {
    if (scan.evidenceContent) {
      const validation = validateEvidence(scan.evidenceContent);
      results.push({ category: scan.category, outcome: validation.outcome, valid: validation.valid });
      if (!validation.valid) {
        warnings.push(`Scanner ${scan.category}: evidence khong hop le`);
      }
      completedCount++;
    } else {
      const errMsg = scan.error?.message || 'Khong co ket qua';
      warnings.push(`Scanner ${scan.category} that bai: ${errMsg} — ghi inconclusive`);
      results.push({ category: scan.category, outcome: 'inconclusive', valid: false });
      failedCount++;
    }
  }

  return { results, completedCount, failedCount, warnings };
}
```

### Workflow 9 buoc outline
```markdown
## Buoc 1: Detect mode
Kiem tra `.planning/PROJECT.md` → mode tich-hop / doc-lap

## Buoc 2: Delta-aware (STUB)
Skip — treat as full scan

## Buoc 3: Scope / parse args
Parse $ARGUMENTS: path, --full, --only, --poc, --auto-fix
Validate categories, tao danh sach categories can quet

## Buoc 4: Smart selection (STUB)
Skip — chay het 13 categories (hoac --only)

## Buoc 5: Dispatch scanners
buildScannerPlan → dispatch tung wave → doi wave xong → wave tiep

## Buoc 6: Reporter
Spawn pd-sec-reporter voi session dir

## Buoc 7: Analyze / merge
mergeScannerResults → thong ke completed/failed

## Buoc 8: Fix routing (STUB)
Bao "chua ho tro" → ghi note trong report

## Buoc 9: Save report
Copy SECURITY_REPORT.md tu temp dir ra output_dir (tuy mode)
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| 13 agent files rieng le | 1 template + YAML config | Phase 46 | DRY, de maintain |
| Manual scanner chon | Auto dispatch 13 | Phase 47 | User chi can chay 1 lenh |
| Sequential scan | Wave-based parallel (2/wave) | Phase 47 | Giam thoi gian ~6x |

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Node.js built-in `node:test` (v24.14.1) |
| Config file | Khong can — chay truc tiep `node --test` |
| Quick run command | `node --test test/smoke-parallel-dispatch.test.js` |
| Full suite command | `npm test` |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| CORE-01 | Parse arguments [path] [flags] | unit | `node --test test/smoke-audit-workflow.test.js` | Wave 0 |
| CORE-02 | Workflow 9 buoc thuc thi dung thu tu | unit | `node --test test/smoke-audit-workflow.test.js` | Wave 0 |
| CORE-03 | Auto-detect Doc lap / Tich hop | unit | `node --test test/smoke-audit-workflow.test.js` | Wave 0 |
| BATCH-01 | Wave dispatch 2/wave voi backpressure | unit | `node --test test/smoke-parallel-dispatch.test.js` | Co (mo rong) |
| BATCH-02 | Failure isolation — inconclusive | unit | `node --test test/smoke-parallel-dispatch.test.js` | Co (mo rong) |

### Sampling Rate
- **Per task commit:** `node --test test/smoke-parallel-dispatch.test.js`
- **Per wave merge:** `npm test`
- **Phase gate:** Full suite green truoc `/gsd:verify-work`

### Wave 0 Gaps
- [ ] Mo rong `test/smoke-parallel-dispatch.test.js` — them tests cho `buildScannerPlan` va `mergeScannerResults`
- [ ] `test/smoke-audit-workflow.test.js` khong bat buoc — workflow la markdown orchestration, khong co pure function de test. Chi test cac ham JS duoc mo rong

## Open Questions

1. **SubAgent tool name chinh xac**
   - What we know: Workflow can spawn scanner agents song song
   - What's unclear: Tool name la `SubAgent`, `Task`, hay `Agent` trong Claude Code allowed-tools
   - Recommendation: Kiem tra tài liệu Claude Code — neu khong co SubAgent tool, workflow se spawn agents qua Bash commands hoac inline instructions

2. **Evidence file name mapping**
   - What we know: YAML co `evidence_file` field cho moi category
   - What's unclear: `buildScannerPlan` nen lay `evidence_file` tu YAML hay workflow tu doc YAML
   - Recommendation: Workflow doc YAML tai B3, truyen `evidence_file` vao plan. `buildScannerPlan` la pure function khong doc file, nen nhan evidence_file nhu parameter hoac workflow tu map

## Sources

### Primary (HIGH confidence)
- `commands/pd/scan.md` — Mau skill entry point: frontmatter, guards, argument parsing
- `bin/lib/parallel-dispatch.js` — Pattern buildParallelPlan + mergeParallelResults
- `bin/lib/resource-config.js` — AGENT_REGISTRY voi pd-sec-scanner categories[13]
- `bin/lib/session-manager.js` — Session management pattern
- `commands/pd/agents/pd-sec-scanner.md` — Scanner agent template
- `commands/pd/agents/pd-sec-reporter.md` — Reporter agent template
- `references/security-rules.yaml` — 13 OWASP categories, evidence_file mapping
- `workflows/fix-bug.md` — Multi-agent workflow orchestration pattern
- `.planning/phases/47-luong-audit-cot-loi/47-CONTEXT.md` — 14 locked decisions

### Secondary (MEDIUM confidence)
- `test/smoke-parallel-dispatch.test.js` — Test pattern cho parallel dispatch

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — tat ca deu la code/pattern hien co trong project
- Architecture: HIGH — theo sat 14 locked decisions tu CONTEXT.md, mau co san
- Pitfalls: HIGH — rut ra tu phan tich code hien co va domain knowledge

**Research date:** 2026-03-26
**Valid until:** 2026-04-25 (stable — internal project patterns)
