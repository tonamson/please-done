# Architecture Patterns

**Domain:** OWASP Security Audit — tich hop lenh `pd:audit` vao AI coding skill framework (Please-Done v4.0)
**Researched:** 2026-03-26
**Confidence:** HIGH (phan tich truc tiep toan bo codebase v3.0 + 14 scanner agents da ton tai + patterns da chung minh tu 45 phases truoc)

## Recommended Architecture

### Tong quan he thong

```
User
  |
  v
pd:audit (skill) ── flags: --poc, --milestone, --delta
  |
  v
workflows/audit.md (orchestrator)
  |
  ├─ Buoc 1: Context + Smart Scanner Selection
  |     └─ config/security-rules.yaml + CONTEXT.md → chon subset 13 scanners
  |
  ├─ Buoc 2: Session Setup
  |     └─ .planning/security/S{NNN}-audit-{date}/
  |
  ├─ Buoc 3: Wave-based Scanner Dispatch (max 2 song song)
  |     ├─ Wave 1: [pd-sec-sql-injection, pd-sec-xss]
  |     ├─ Wave 2: [pd-sec-auth (heavy), pd-sec-cmd-injection]
  |     └─ ... (7 waves cho 13 scanners)
  |     Moi scanner → evidence_sec_{type}.md
  |
  ├─ Buoc 4: Session Delta (--delta)
  |     └─ compareSessions() → NEW / KNOWN-UNFIXED / RE-VERIFY / RESOLVED
  |
  ├─ Buoc 5: Reporter Agent
  |     └─ pd-sec-reporter → SECURITY_REPORT.md
  |
  ├─ Buoc 6: POC Pipeline (--poc)
  |     └─ Don le + Gadget Chain analysis
  |
  └─ Buoc 7: Milestone Integration (--milestone)
        └─ generateFixPhases() → auto-create phase directories
```

### Component Boundaries

| Component | Trach nhiem | Giao tiep voi |
|-----------|-------------|---------------|
| `commands/pd/audit.md` (MOI) | Skill entry point, parse flags, goi workflow | workflows/audit.md |
| `workflows/audit.md` (MOI) | Orchestrator: session, waves, delta, reporter, POC, fix-phase gen | Scanner agents, reporter agent, JS lib modules |
| `commands/pd/agents/pd-sec-*.md` (13 DA CO) | Scanner agents — quet 1 OWASP category, ghi evidence file | FastCode MCP, Grep, Glob, Read |
| `commands/pd/agents/pd-sec-reporter.md` (DA CO) | Tong hop 13 evidence files → SECURITY_REPORT.md | Doc evidence files, ghi report |
| `config/security-rules.yaml` (MOI) | Mapping scanner → OWASP, stack applicability, wave priority | Workflow doc de route scanners |
| `bin/lib/security-scanner.js` (MOI) | Pure functions: selectScanners(), buildScanWaves(), parseScanEvidence(), compareSessions() | Workflow goi, resource-config cung cap agent config |
| `bin/lib/security-reporter.js` (MOI) | Pure functions: generateFixPhases(), buildGadgetChain(), formatSecurityGate() | Workflow goi khi tao fix phases hoac security gate |
| `templates/security-fix-phase.md` (MOI) | Template cho auto-generated fix phases | Workflow dien template khi --milestone |
| `bin/lib/resource-config.js` (SUA) | Them 14 pd-sec-* agents vao AGENT_REGISTRY | security-scanner.js goi getAgentConfig() |
| `workflows/complete-milestone.md` (SUA) | Them Buoc 3.7 Security Gate (non-blocking) | Goi formatSecurityGate() |
| `workflows/what-next.md` (SUA) | Them priority 0.5 cho CRITICAL findings | Doc SECURITY_REPORT.md |

### Data Flow

```
1. pd:audit [--poc] [--milestone] [--delta]
     |
2. Workflow doc CONTEXT.md → xac dinh stack (NestJS/Next.js/WP/Flutter/Solidity)
     |
3. security-scanner.js selectScanners(stack, rulesYAML) → subset cua 13
     |
4. security-scanner.js buildScanWaves(selectedScanners, parallelLimit=2) → waves
     |
5. Moi wave: spawn 2 Agent tool song song
     |  Moi agent ghi: .planning/security/S{NNN}/evidence_sec_{type}.md
     |  Post-wave: kiem tra evidence ton tai, log failures, tiep wave ke
     |
6. [--delta] security-scanner.js compareSessions(currentDir, previousDir)
     |  → findings tagged: NEW / KNOWN-UNFIXED / RE-VERIFY / RESOLVED
     |
7. Spawn pd-sec-reporter → doc tat ca evidence → ghi SECURITY_REPORT.md
     |
8. [--poc] Workflow doc SECURITY_REPORT → loc CRITICAL → POC_REPORT.md + GADGET_CHAIN.md
     |
9. [--milestone] security-reporter.js generateFixPhases(findings, gadgetChains)
     |  → Tao phase directories voi PLAN.md + TASKS.md tu template
     |  → Cap nhat ROADMAP.md
     |
10. Hien thi tom tat + goi y buoc tiep
```

## Chi tiet tung component

### 1. Skill Entry — `commands/pd/audit.md` (MOI)

```markdown
---
name: pd:audit
description: Quet bao mat OWASP Top 10 — doc lap hoac tich hop milestone
model: sonnet
argument-hint: "[--poc] [--milestone] [--delta]"
allowed-tools:
  - Read
  - Write
  - Edit
  - Bash
  - Glob
  - Grep
  - Agent
  - mcp__fastcode__code_qa
---
```

Pattern chinh xac nhu `commands/pd/research.md`:
- Skill chi parse args va flags
- Goi `@workflows/audit.md`
- Guards: kiem tra CONTEXT.md ton tai (da scan)
- Hien thi tom tat + goi y `/pd:what-next` khi xong

### 2. Workflow Orchestrator — `workflows/audit.md` (MOI)

Ket hop patterns tu 2 workflow da co:
- `workflows/write-code.md` Buoc 10 --parallel → wave dispatch pattern
- `workflows/research.md` → agent pipeline pattern (spawn tuần tự)

**Buoc 1: Context + Smart Scanner Selection**
- Doc `.planning/CONTEXT.md` → stack (NestJS, Next.js, WordPress, Flutter, Solidity)
- Doc `config/security-rules.yaml` → scanner applicability matrix
- Goi `selectScanners(stack, rules)` conceptually (workflow thuc hien logic nay)
- Hien thi: "Da chon [N]/13 scanners cho stack [stack]: [list]"
- User xac nhan hoac chinh sua danh sach

**Buoc 2: Session Setup**
- Tim `.planning/security/` → dem sessions hien co → S{max+1}
- Tao `.planning/security/S{NNN}-audit-{YYYYMMDD}/`
- Ghi `SESSION.md` metadata: date, stack, flags, scanner list selected
- Reuse naming pattern tu `session-manager.js` (S{NNN} format)

**Buoc 3: Wave-based Scanner Dispatch**
- Phan nhom scanners thanh waves (logic inline trong workflow, ho tro boi security-rules.yaml):
  - Sort theo `wave_priority` (1 = chay som nhat)
  - Max 2 scanners / wave
  - Max 1 heavy scanner (dung fastcode) / wave
- Moi wave:
  1. Spawn 2 Agent tool SONG SONG
  2. Moi agent nhan: stack context, session dir path, chi dan ghi evidence file
  3. Cho CA 2 agents hoan thanh
  4. Kiem tra evidence files ton tai + khong rong
  5. Agent fail → log warning, tiep tuc (non-blocking)
- Pattern CHINH XAC nhu write-code.md Buoc 10 --parallel

**Buoc 4: Session Delta** (chi khi co --delta flag)
- Tim session truoc: glob `.planning/security/S*-audit-*/SESSION.md`, sort, lay truoc S{NNN}
- Doc tat ca evidence files tu ca 2 sessions
- So sanh findings: match bang file + line range (fuzzy ±5 dong) + type
- Tag: NEW (chi co session moi), KNOWN-UNFIXED (ca 2), RE-VERIFY (co nhung line shift), RESOLVED (chi co session cu)
- Ghi `DELTA_REPORT.md`

**Buoc 5: Reporter Dispatch**
- Spawn `pd-sec-reporter` agent
- Input: session dir path, tat ca evidence files
- Output: `SECURITY_REPORT.md` (format da dinh nghia trong pd-sec-reporter.md)

**Buoc 6: POC Pipeline** (chi khi co --poc flag)
- Doc SECURITY_REPORT.md → loc CRITICAL findings
- Voi moi CRITICAL finding: tao Proof-of-Concept (mo ta cach khai thac)
- Phan tich gadget chain: finding A enable finding B (VD: SQLi + secrets leak → full DB compromise)
- Ghi `POC_REPORT.md` (don le) + `GADGET_CHAIN.md` (chuoi)

**Buoc 7: Milestone Integration** (chi khi co --milestone flag)
- Goi `generateFixPhases(findings, gadgetChains)` conceptually
- Sap xep fix phases theo:
  1. Gadget chain order (fix dependency chain tu goc truoc)
  2. CRITICAL truoc WARNING
  3. Nhom theo file/module (giam context switching)
- Tao phase directories: `.planning/milestones/[version]/phase-XX-sec-fix-YY/`
  - PLAN.md tu `templates/security-fix-phase.md`
  - TASKS.md tu findings nhom theo phase
- Cap nhat ROADMAP.md them fix phases
- Cap nhat CURRENT_MILESTONE.md neu can

### 3. Config — `config/security-rules.yaml` (MOI)

```yaml
scanners:
  pd-sec-sql-injection:
    owasp: [A03]
    stacks: [nestjs, nextjs, wordpress, python]
    tier: scout
    wave_priority: 1
    uses_fastcode: true
    evidence_file: evidence_sec_sqli.md

  pd-sec-xss:
    owasp: [A03, A07]
    stacks: [nestjs, nextjs, wordpress]
    tier: scout
    wave_priority: 1
    uses_fastcode: true
    evidence_file: evidence_sec_xss.md

  pd-sec-cmd-injection:
    owasp: [A03]
    stacks: [nestjs, nextjs, wordpress, python]
    tier: scout
    wave_priority: 1
    uses_fastcode: true
    evidence_file: evidence_sec_cmdi.md

  pd-sec-path-traversal:
    owasp: [A10]
    stacks: [nestjs, nextjs, wordpress, python]
    tier: scout
    wave_priority: 2
    uses_fastcode: true
    evidence_file: evidence_sec_pathtr.md

  pd-sec-secrets:
    owasp: [A02]
    stacks: [all]
    tier: scout
    wave_priority: 1
    uses_fastcode: false
    evidence_file: evidence_sec_secrets.md

  pd-sec-auth:
    owasp: [A01, A07]
    stacks: [all]
    tier: builder        # can phan tich sau hon
    wave_priority: 2
    uses_fastcode: true
    evidence_file: evidence_sec_auth.md

  pd-sec-deserialization:
    owasp: [A08]
    stacks: [nestjs, nextjs, python]
    tier: scout
    wave_priority: 3
    uses_fastcode: true
    evidence_file: evidence_sec_deser.md

  pd-sec-misconfig:
    owasp: [A05]
    stacks: [all]
    tier: scout
    wave_priority: 3
    uses_fastcode: false
    evidence_file: evidence_sec_misconfig.md

  pd-sec-prototype-pollution:
    owasp: [A03, A08]
    stacks: [nestjs, nextjs]
    tier: scout
    wave_priority: 3
    uses_fastcode: true
    evidence_file: evidence_sec_pollution.md

  pd-sec-crypto:
    owasp: [A02]
    stacks: [all]
    tier: scout
    wave_priority: 3
    uses_fastcode: false
    evidence_file: evidence_sec_crypto.md

  pd-sec-insecure-design:
    owasp: [A04]
    stacks: [all]
    tier: builder        # can phan tich kien truc
    wave_priority: 4
    uses_fastcode: true
    evidence_file: evidence_sec_design.md

  pd-sec-vuln-deps:
    owasp: [A06]
    stacks: [all]
    tier: scout
    wave_priority: 2
    uses_fastcode: false
    evidence_file: evidence_sec_deps.md

  pd-sec-logging:
    owasp: [A09]
    stacks: [all]
    tier: scout
    wave_priority: 4
    uses_fastcode: false
    evidence_file: evidence_sec_logging.md

# Wave configuration
waves:
  parallel_limit: 2
  heavy_scanner_limit: 1  # scanner dung fastcode chi 1/wave
  timeout_ms: 180000      # 3 phut / scanner

# Stack detection keywords (match voi CONTEXT.md)
stack_keywords:
  nestjs: ["nestjs", "nest", "@nestjs/"]
  nextjs: ["next.js", "nextjs", "next"]
  wordpress: ["wordpress", "wp-", "php"]
  flutter: ["flutter", "dart"]
  solidity: ["solidity", "hardhat", "foundry"]
  python: ["python", "django", "flask", "fastapi"]
```

### 4. JS Library — `bin/lib/security-scanner.js` (MOI)

Pure functions — KHONG doc file, KHONG require('fs'), KHONG side effects. Nhat quan voi 22 modules hien co.

```javascript
/**
 * selectScanners(stack, rulesConfig) → string[]
 *
 * Chon subset scanners phu hop voi stack.
 * @param {string} stack - Stack name (nestjs, nextjs, wordpress, flutter, solidity, python)
 * @param {object} rulesConfig - Parsed security-rules.yaml content
 * @returns {string[]} - Sorted list scanner names (theo wave_priority)
 *
 * Logic:
 * - Filter scanners co stacks includes stack HOAC stacks includes 'all'
 * - Sort theo wave_priority (thap = chay truoc)
 * - Return names only
 */

/**
 * buildScanWaves(scanners, parallelLimit, heavyLimit) → Wave[]
 *
 * Phan nhom scanners thanh waves.
 * @param {Array<{name, wave_priority, uses_fastcode, tier}>} scanners
 * @param {number} parallelLimit - Max scanners / wave (default 2)
 * @param {number} heavyLimit - Max heavy scanners / wave (default 1)
 * @returns {Array<{wave: number, scanners: Array}>}
 *
 * Logic:
 * - Da sort theo wave_priority (tu selectScanners)
 * - Lap: lay toi da parallelLimit scanners, dam bao max heavyLimit uses_fastcode=true
 * - Builder tier scanners uu tien rieng wave (de khong bi timeout)
 */

/**
 * parseScanEvidence(content) → { findings: Finding[], stats: Stats }
 *
 * Parse evidence file markdown → structured findings.
 * @param {string} content - Noi dung evidence_sec_*.md
 * @returns {{ findings: Finding[], stats: { critical: number, warning: number, safe: number } }}
 *
 * Finding = { file, line, severity ('CRITICAL'|'WARNING'|'SAFE'),
 *             type, owasp, description, suggestion }
 */

/**
 * compareSessions(currentFindings, previousFindings) → TaggedFinding[]
 *
 * So sanh 2 session → tag moi finding.
 * @param {Finding[]} currentFindings
 * @param {Finding[]} previousFindings
 * @returns {Array<Finding & { delta: 'NEW'|'KNOWN-UNFIXED'|'RE-VERIFY'|'RESOLVED' }>}
 *
 * Match logic: same file + same type + line within ±5 range
 * - NEW: chi co current
 * - KNOWN-UNFIXED: co ca 2, cung location
 * - RE-VERIFY: co ca 2, line shifted
 * - RESOLVED: chi co previous (returned separately)
 */

/**
 * buildFunctionChecklist(findings) → ChecklistEntry[]
 *
 * Chuyen findings thanh function-level checklist (evidence format).
 * @param {Finding[]} findings
 * @returns {Array<{ function: string, file: string,
 *   checks: string[], status: 'vulnerable'|'mitigated'|'safe' }>}
 */
```

### 5. JS Library — `bin/lib/security-reporter.js` (MOI)

Pure functions — KHONG doc file, KHONG require('fs'), KHONG side effects.

```javascript
/**
 * generateFixPhases(findings, gadgetChains) → Phase[]
 *
 * Tao fix phases tu findings, ordering:
 * 1. Gadget chain dependencies (fix root cause truoc)
 * 2. CRITICAL truoc WARNING
 * 3. Nhom theo file/module (giam context switching)
 *
 * @param {Finding[]} findings
 * @param {Chain[]} gadgetChains
 * @returns {Array<{ name: string, findings: Finding[], priority: number }>}
 */

/**
 * buildGadgetChain(findings) → Chain[]
 *
 * Phan tich chuoi tan cong tu findings.
 * VD: SQLi (A03) + secrets leak (A02) → full DB compromise
 *     Auth bypass (A01) + IDOR (A01) → horizontal privilege escalation
 *
 * @param {Finding[]} findings
 * @returns {Array<{ name: string, steps: Finding[], impact: string, priority: number }>}
 */

/**
 * formatSecurityGate(reportContent) → GateResult
 *
 * Danh gia security gate cho complete-milestone.
 * @param {string} reportContent - Noi dung SECURITY_REPORT.md
 * @returns {{ pass: boolean, summary: string, blockers: string[],
 *             stats: { critical: number, warning: number, safe: number } }}
 *
 * Logic:
 * - BLOCK: con CRITICAL chua fix → pass=false, blockers list
 * - WARN: con WARNING chua fix → pass=true, summary co canh bao
 * - PASS: khong con issue → pass=true
 */

/**
 * fillFixPhaseTemplate(templateContent, phaseData) → string
 *
 * Dien template security-fix-phase.md voi du lieu cu the.
 * @param {string} templateContent
 * @param {{ name, findings, priority, owasp_categories }} phaseData
 * @returns {string} - Filled PLAN.md content
 */
```

### 6. resource-config.js Update (SUA)

Them 14 agents vao `AGENT_REGISTRY`:

```javascript
// 12 scanner agents — scout tier
'pd-sec-sql-injection':     { tier: 'scout', tools: ['Read', 'Glob', 'Grep', 'mcp__fastcode__code_qa'] },
'pd-sec-xss':               { tier: 'scout', tools: ['Read', 'Glob', 'Grep', 'mcp__fastcode__code_qa'] },
'pd-sec-cmd-injection':     { tier: 'scout', tools: ['Read', 'Glob', 'Grep', 'mcp__fastcode__code_qa'] },
'pd-sec-path-traversal':    { tier: 'scout', tools: ['Read', 'Glob', 'Grep', 'mcp__fastcode__code_qa'] },
'pd-sec-secrets':           { tier: 'scout', tools: ['Read', 'Glob', 'Grep'] },
'pd-sec-deserialization':   { tier: 'scout', tools: ['Read', 'Glob', 'Grep', 'mcp__fastcode__code_qa'] },
'pd-sec-misconfig':         { tier: 'scout', tools: ['Read', 'Glob', 'Grep'] },
'pd-sec-prototype-pollution': { tier: 'scout', tools: ['Read', 'Glob', 'Grep', 'mcp__fastcode__code_qa'] },
'pd-sec-crypto':            { tier: 'scout', tools: ['Read', 'Glob', 'Grep'] },
'pd-sec-vuln-deps':         { tier: 'scout', tools: ['Read', 'Glob', 'Grep'] },
'pd-sec-logging':           { tier: 'scout', tools: ['Read', 'Glob', 'Grep'] },

// 2 scanner agents — builder tier (can phan tich sau hon)
'pd-sec-auth':              { tier: 'builder', tools: ['Read', 'Glob', 'Grep', 'mcp__fastcode__code_qa'] },
'pd-sec-insecure-design':   { tier: 'builder', tools: ['Read', 'Glob', 'Grep', 'mcp__fastcode__code_qa'] },

// Reporter agent — builder tier (tong hop, can nhieu context)
'pd-sec-reporter':          { tier: 'builder', tools: ['Read', 'Write', 'Glob'] },
```

**HEAVY_TOOL_PATTERNS da co `mcp__fastcode__`** — tu dong ap dung cho scanners dung fastcode. Khong can sua.

### 7. Integration voi Existing Workflows (3 file SUA)

#### 7a. complete-milestone.md — Security Gate (Buoc 3.7 MOI)

Vi tri: sau Buoc 3.6 (bao cao quan ly), truoc Buoc 4 (bao cao tong ket).

```
## Buoc 3.7: Security Gate (non-blocking)

> QUAN TRONG: Toan bo buoc nay la non-blocking.
> Bat ky loi nao chi log warning va ghi chu — KHONG BAO GIO chan milestone completion.

1. Glob `.planning/security/S*-audit-*/SECURITY_REPORT.md`
2. Khong co → bo qua (chua chay pd:audit). Ghi: "Khong co security audit."
3. Co → doc SECURITY_REPORT.md moi nhat (sort theo session number)
4. Parse report → dem CRITICAL va WARNING counts
5. Quyet dinh:
   - CRITICAL > 0 → CANH BAO:
     "Con [N] CRITICAL security issues chua fix.
     (1) Chay `/pd:audit --milestone` de tao fix phases
     (2) Bo qua (ghi nhan no ky thuat)"
     → Bo qua → ghi vao MILESTONE_COMPLETE.md section "No ky thuat"
   - WARNING > 0 → ghi nhan vao MILESTONE_COMPLETE.md
   - Tat ca SAFE → ghi "Security audit: PASS"
```

Pattern NHAT QUAN voi Buoc 3.6 (non-blocking, try/catch, chi warning).

#### 7b. what-next.md — Security Priority (Buoc 4 SUA)

Them hang vao bang uu tien:

```
| Uu tien | Dieu kien | Goi y |
| 0.5 | SECURITY_REPORT co CRITICAL chua fix | `/pd:audit --milestone` hoac `/pd:fix-bug` |
```

Logic: Glob `.planning/security/S*-audit-*/SECURITY_REPORT.md` → doc moi nhat → parse CRITICAL count > 0 → goi y.

Security CRITICAL cao hon bugs thuong (uu tien 1) vi co the bi khai thac.

#### 7c. templates/state.md — Them audit events

```
| Thoi diem | Hanh dong |
| Audit xong | Hoat dong cuoi: [ngay] — Security audit hoan tat ([N] CRITICAL, [M] WARNING) |
| Fix phases tao | Hoat dong cuoi: [ngay] — Tao [N] fix phases tu security audit |
```

### 8. Templates

#### `templates/security-fix-phase.md` (MOI)

```markdown
# Phase {phase_number}: Security Fix — {owasp_category}

## Tiêu chí thành công

### Sự thật phải đạt
| # | Sự thật | Kiểm tra |
|---|---------|----------|
{truths_table}

## Quyết định thiết kế
- Fix approach: {approach}
- Không thay đổi: {preserved_behavior}

## Tasks
{tasks_from_findings}

## Ghi chú bảo mật
- OWASP Category: {owasp}
- Severity: {severity}
- Attack vector: {attack_description}
- Remediation guidance: {remediation}
```

#### `templates/security-report.md` (MOI — extract tu pd-sec-reporter.md)

Extract template SECURITY_REPORT.md ra file rieng de:
1. Reporter agent reference template thay vi inline
2. Nhat quan voi pattern templates/management-report.md

## File Organization

### Session Directory Structure

```
.planning/security/
  S001-audit-20260326/
    SESSION.md              # metadata: date, stack, flags, selected scanners
    evidence_sec_sqli.md    # ← pd-sec-sql-injection
    evidence_sec_xss.md     # ← pd-sec-xss
    evidence_sec_cmdi.md    # ← pd-sec-cmd-injection
    evidence_sec_pathtr.md  # ← pd-sec-path-traversal
    evidence_sec_secrets.md # ← pd-sec-secrets
    evidence_sec_auth.md    # ← pd-sec-auth
    evidence_sec_deser.md   # ← pd-sec-deserialization
    evidence_sec_misconfig.md   # ← pd-sec-misconfig
    evidence_sec_pollution.md   # ← pd-sec-prototype-pollution
    evidence_sec_crypto.md      # ← pd-sec-crypto
    evidence_sec_design.md      # ← pd-sec-insecure-design
    evidence_sec_deps.md        # ← pd-sec-vuln-deps
    evidence_sec_logging.md     # ← pd-sec-logging
    SECURITY_REPORT.md      # ← pd-sec-reporter
    POC_REPORT.md           # (--poc) Proof-of-Concept
    GADGET_CHAIN.md         # (--poc) Chuoi tan cong
    DELTA_REPORT.md         # (--delta) So sanh voi session truoc
  S002-audit-20260327/      # Session tiep theo
    ...
```

**Ly do dung .planning/security/ (khong phai .planning/research/):**
- Security audit la hoat dong rieng biet, khong phai research
- Session-based (chay lai nhieu lan), khong phai entry-based
- Evidence format khac (findings, severity, OWASP mapping) vs research (claims, confidence, sources)
- Tuong tu .planning/debug/ (session-based) hon .planning/research/ (entry-based)

## New vs Modified — Explicit Summary

### DA TON TAI — Khong can tao moi

| File | So luong | Ghi chu |
|------|----------|---------|
| `commands/pd/agents/pd-sec-*.md` | 13 scanners | Da co day du, co process + rules + evidence format |
| `commands/pd/agents/pd-sec-reporter.md` | 1 reporter | Da co, co OWASP mapping + report format |

### MOI — Can tao (7 files)

| # | File | Loai | Phu thuoc |
|---|------|------|-----------|
| N1 | `bin/lib/security-scanner.js` | JS lib (pure functions) | resource-config.js (getAgentConfig) |
| N2 | `bin/lib/security-reporter.js` | JS lib (pure functions) | security-scanner.js (Finding type) |
| N3 | `config/security-rules.yaml` | Config | Khong |
| N4 | `commands/pd/audit.md` | Skill file | workflows/audit.md |
| N5 | `workflows/audit.md` | Workflow | N1, N2, N3, resource-config.js |
| N6 | `templates/security-fix-phase.md` | Template | Khong |
| N7 | `templates/security-report.md` | Template | Khong |

### SUA — Can chinh sua (3 files)

| # | File | Thay doi cu the | Do phuc tap |
|---|------|----------------|-------------|
| M1 | `bin/lib/resource-config.js` | Them 14 entries vao AGENT_REGISTRY | Thap — chi them dong vao object |
| M2 | `workflows/complete-milestone.md` | Them Buoc 3.7 Security Gate (non-blocking) | Trung binh — them ~20 dong |
| M3 | `workflows/what-next.md` | Them priority 0.5 row + SECURITY_REPORT glob | Thap — them ~5 dong |

## Patterns to Follow

### Pattern 1: Pure Function Library (nhat quan voi 22 modules)

**What:** Moi JS module trong bin/lib/ la pure functions — KHONG doc file, KHONG require('fs'), content truyen qua tham so.
**When:** security-scanner.js va security-reporter.js.
**Why:** 22 modules hien co deu theo pattern nay. 600+ tests chung minh hieu qua.

### Pattern 2: Wave-based Agent Dispatch (reuse write-code.md --parallel)

**What:** Nhom scanners thanh waves, spawn Agent tool song song, max 2/wave.
**When:** Buoc 3 cua audit workflow.
**Why:** Da chung minh trong write-code.md voi conflict detection, post-wave safety net.

### Pattern 3: Agent Communication via Evidence Files (reuse fix-bug pattern)

**What:** Scanner agents ghi evidence file → reporter doc evidence files → SECURITY_REPORT.
**When:** Scanner → evidence → reporter pipeline.
**Why:** Pattern da thanh cong trong fix-bug (janitor → evidence → detective). Avoid race condition.

### Pattern 4: Non-blocking Workflow Integration (reuse Buoc 3.6 pattern)

**What:** Security gate CANH BAO nhung khong CHAN milestone completion.
**When:** complete-milestone.md Buoc 3.7, what-next.md priority.
**Why:** Nhat quan voi report generation (Buoc 3.6) — optional features KHONG BAO GIO chan core workflow.

### Pattern 5: YAML Config for Scanner Routing (khong hardcode)

**What:** Scanner applicability, wave priority, stack mapping trong YAML — khong inline trong workflow.
**When:** Smart Scanner Selection.
**Why:** De test, de review, de mo rong (them scanner = them entry YAML, khong sua workflow).

## Anti-Patterns to Avoid

### Anti-Pattern 1: Dump toan bo codebase cho scanner

**What:** Truyen tat ca source code vao scanner agent context.
**Why bad:** Token waste. Scanner chi can patterns cu the (regex), khong can doc moi file.
**Instead:** Scanner tu dung Glob/Grep tim patterns, Read doc context ±15 dong. FastCode cho call chain analysis.

### Anti-Pattern 2: Scanner ghi truc tiep vao SECURITY_REPORT

**What:** Moi scanner append vao 1 file report chung.
**Why bad:** Race condition khi 2 scanners chay song song. Format khong nhat quan.
**Instead:** Moi scanner ghi evidence file RIENG. Reporter tong hop SAU KHI tat ca xong.

### Anti-Pattern 3: Blocking security gate

**What:** complete-milestone CHAN khi con CRITICAL.
**Why bad:** Vi pham non-blocking pattern da thiet lap (Buoc 3.6). User co the co ly do proceed.
**Instead:** CANH BAO + cho user quyet dinh. Ghi no ky thuat neu bo qua.

### Anti-Pattern 4: Hardcode scanner list trong workflow

**What:** Workflow liet ke 13 scanners bang tay.
**Why bad:** Them/bot scanner = sua workflow. Kho maintain.
**Instead:** security-rules.yaml chua danh sach. Workflow doc YAML, filter theo stack.

### Anti-Pattern 5: Tao session dir rieng cho moi scanner

**What:** Moi scanner co session folder rieng.
**Why bad:** Reporter khong biet doc dau. Delta compare phuc tap.
**Instead:** 1 session dir / audit run. Tat ca evidence trong cung dir.

## Scalability Considerations

| Concern | Small project (5 scanners) | Full scan (13 scanners) | Full + POC + Delta |
|---------|---------------------------|------------------------|-------------------|
| Thoi gian | ~3 phut (3 waves) | ~10 phut (7 waves) | ~15 phut |
| Token cost | ~50K (scout agents) | ~150K (mixed tiers) | ~200K |
| Files output | 5 evidence + report | 13 evidence + report | 13 evidence + 3 reports |
| Waves | 3 | 7 | 7 + reporter + POC |

## Build Order (dependency-aware, suggested phases)

```
Phase 1: Foundation (libs + config)
  Tasks:
  - security-rules.yaml (N3)
  - security-scanner.js: selectScanners(), buildScanWaves() (N1 partial)
  - resource-config.js: them 14 agents (M1)
  Dependencies: khong (foundation layer)
  Testable: unit tests cho selectScanners, buildScanWaves

Phase 2: Core Audit Workflow (skill + workflow Buoc 1-3-5)
  Tasks:
  - commands/pd/audit.md (N4)
  - workflows/audit.md: Buoc 1 (context), 2 (session), 3 (waves), 5 (reporter)
  - templates/security-report.md (N7)
  Dependencies: Phase 1 (config + lib)
  Testable: chay pd:audit doc lap, thay evidence files + SECURITY_REPORT

Phase 3: Evidence Parsing + Function Checklist
  Tasks:
  - security-scanner.js: parseScanEvidence(), buildFunctionChecklist() (N1 complete)
  - security-reporter.js: formatSecurityGate() (N2 partial)
  Dependencies: Phase 2 (co evidence files de parse)
  Testable: unit tests, parse evidence tu Phase 2

Phase 4: Advanced — Delta + POC + Fix Phases
  Tasks:
  - security-scanner.js: compareSessions() (delta)
  - security-reporter.js: buildGadgetChain(), generateFixPhases() (N2 complete)
  - templates/security-fix-phase.md (N6)
  - workflows/audit.md: Buoc 4 (delta), 6 (POC), 7 (milestone)
  Dependencies: Phase 3 (parseScanEvidence cho delta compare)
  Testable: delta compare, fix phase generation, gadget chain

Phase 5: Workflow Integration
  Tasks:
  - complete-milestone.md: Buoc 3.7 (M2)
  - what-next.md: priority 0.5 (M3)
  - STATE.md template update
  Dependencies: Phase 3 (formatSecurityGate)
  Testable: end-to-end: pd:audit → pd:complete-milestone voi security gate
```

**Rationale:**
- Phase 1 truoc tat ca vi moi thu phu thuoc YAML config + AGENT_REGISTRY
- Phase 2 truoc Phase 3 vi can evidence files thuc te de test parser
- Phase 3 truoc Phase 4 vi delta compare can parseScanEvidence()
- Phase 4 va Phase 5 co the SONG SONG (doc lap — integration chi can formatSecurityGate tu Phase 3)
- 13 scanner agents + 1 reporter DA CO — khong co phase nao can tao agent files

## Sources

- Phan tich truc tiep codebase v3.0: 14 pd-sec-* agent files, 22 JS lib modules, 11 workflows — HIGH confidence
- `bin/lib/resource-config.js` AGENT_REGISTRY pattern (7 agents hien co) — HIGH confidence
- `bin/lib/parallel-dispatch.js` wave dispatch pattern — HIGH confidence
- `bin/lib/session-manager.js` session naming pattern — HIGH confidence
- `workflows/write-code.md` Buoc 10 --parallel wave execution — HIGH confidence
- `workflows/research.md` agent pipeline pattern — HIGH confidence
- `workflows/complete-milestone.md` Buoc 3.6 non-blocking pattern — HIGH confidence
- 14 pd-sec-* agent files: evidence format, OWASP mapping, tool lists — HIGH confidence
