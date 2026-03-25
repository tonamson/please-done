# Architecture: v3.0 Research Squad

**Domain:** Tich hop bo tac tu nghien cuu chong ao giac voi co che luu tru phan tach, danh so, dan chung minh bach, va audit-ready system vao framework AI coding skill hien tai
**Researched:** 2026-03-25
**Confidence:** HIGH (phan tich truc tiep toan bo codebase v2.1 + tai lieu chinh thuc Claude Code + patterns da chung minh tu 37 phases truoc)

## Tong quan he thong hien tai va diem tich hop v3.0

```
TRANG THAI HIEN TAI (v2.1):
=============================

Du lieu nghien cuu:
  .planning/research/          <-- 5 files (SUMMARY, STACK, FEATURES, ARCHITECTURE, PITFALLS)
                                   Khong co INDEX, khong phan tach internal/external
                                   Khong co audit log, khong confidence tracking

Workflow tao research:
  new-milestone.md (Buoc 5)    <-- "Fast Parallel Research" — goi FastCode + Context7 song song
                                   Ghi thang vao .planning/research/SUMMARY.md
                                   KHONG co validation, KHONG co audit trail

  plan.md (Buoc 3)             <-- Phase-level research vao RESEARCH.md cua phase
                                   Doc .planning/research/SUMMARY.md lam input
                                   KHONG verify do tin cay

Agents hien co:
  .claude/agents/              <-- 5 detective agents (janitor, detective, doc-specialist, repro, architect)
  commands/pd/agents/          <-- 5 file tuong tu (backward compat copies)

Pure function modules:
  bin/lib/                     <-- 22 modules, tat ca pure functions
                                   evidence-protocol.js — da co validate/parse evidence
                                   bug-memory.js — da co createBugRecord/searchBugs/buildIndex
                                   session-manager.js — da co session lifecycle
                                   truths-parser.js — da co parse Truth tables


MUC TIEU v3.0 (Research Squad):
=================================

Du lieu nghien cuu (CAU TRUC MOI):
  .planning/research/
    internal/                  <-- MOI: ket qua nghien cuu noi bo (code analysis)
      RS-001-*.md              <-- Danh so, YAML frontmatter, confidence
    external/                  <-- MOI: ket qua nghien cuu ben ngoai (web/docs)
      RS-002-*.md              <-- Danh so, YAML frontmatter, sources
    INDEX.md                   <-- MOI: Bang tong hop tat ca research entries
    SUMMARY.md                 <-- GIU NGUYEN: tuong thich nguoc voi plan.md Buoc 3

Agents moi:
  .claude/agents/
    pd-evidence-collector.md   <-- MOI: Thu thap bang chung tu nhieu nguon
    pd-fact-checker.md         <-- MOI: Kiem tra do chinh xac cua claims

Workflow guards:
  workflows/plan.md            <-- SUA DOI: them Plan-Gate (kiem tra research truoc khi plan)
  workflows/write-code.md      <-- SUA DOI: them Strategy Injection (doc research khi code)

Lenh CLI:
  commands/pd/research.md      <-- MOI: Skill file cho pd research command

Pure function modules:
  bin/lib/research-store.js    <-- MOI: CRUD cho research entries + INDEX
  bin/lib/audit-report.js      <-- MOI: Tao audit trail, confidence tracking
  bin/lib/fact-checker.js      <-- MOI: So sanh claims voi sources, flag contradictions
```

## Quyet dinh kien truc then chot

### 1. Tai su dung pattern Sub-agents tu v2.1 — KHONG phat minh lai

v2.1 da chung minh pattern: Orchestrator spawn sub-agents, giao tiep qua evidence files. v3.0 ap dung CUNG pattern cho research:

| Yeu to | v2.1 Detective | v3.0 Research | Ghi chu |
|--------|---------------|---------------|---------|
| Orchestrator | fix-bug-orchestrator.md | pd research command (hoac new-milestone Buoc 5) | Entry point khac, pattern giong |
| Sub-agents | 5 detective agents | 2 research agents | It hon, don gian hon |
| Communication | evidence_*.md trong .planning/debug/ | RS-NNN-*.md trong .planning/research/ | Format tuong tu, location khac |
| Protocol | evidence-protocol.js | research-store.js (mo rong) | Cung validateEvidence pattern |
| Memory | bug-memory.js + .planning/bugs/ | research-store.js + .planning/research/INDEX.md | Cung buildIndex pattern |

### 2. Phan tach internal/external — 2 thu muc, 1 INDEX

**Internal** (.planning/research/internal/): Ket qua tu FastCode, Grep, Read — phan tich CODE HIEN TAI cua project.
**External** (.planning/research/external/): Ket qua tu Context7, WebSearch, WebFetch — thong tin TU BEN NGOAI.

**Ly do phan tach:**
1. Do tin cay khac nhau — internal (code analysis) = CAO mac dinh, external (web) = can verify
2. Freshness khac nhau — internal thay doi theo code, external it thay doi
3. Audit trail khac nhau — internal chi can file:dong, external can URL + ngay truy cap

**INDEX.md** la bang tong hop DUY NHAT, lien ket den ca 2 thu muc.

### 3. Evidence Collector va Fact Checker — 2 agents voi vai tro ro rang

```
pd-evidence-collector (builder/sonnet):
  - Thu thap thong tin tu NHIEU nguon
  - Tools: Read, Glob, Grep, mcp__fastcode__code_qa, mcp__context7__*, WebSearch, WebFetch
  - Output: RS-NNN-*.md voi metadata, sources, confidence
  - KHONG danh gia do chinh xac — chi thu thap

pd-fact-checker (scout/haiku):
  - Kiem tra CLAIMS tu evidence-collector hoac tu user
  - Tools: Read, Grep, mcp__context7__*, WebSearch
  - So sanh claim voi source goc
  - Output: Audit entry voi verdict (CONFIRMED / CONTRADICTED / UNVERIFIABLE)
  - Chi KIEM TRA, khong thu thap moi
```

**Ly do tach 2 agent thay vi 1:**
1. Tranh "tu xac nhan" — agent thu thap khong nen tu danh gia chinh minh
2. Cost-effective — fact-checker dung haiku (re, nhanh) vi chi so sanh text
3. Co the chay doc lap — user goi fact-checker rieng de verify bat ky claim nao

## Thanh phan: Moi vs Sua doi vs Khong doi

### THANH PHAN MOI

| # | Thanh phan | Vi tri | Loai | Muc dich |
|---|-----------|--------|------|---------|
| N1 | Research storage module | `bin/lib/research-store.js` | Library (pure function) | CRUD research entries, build INDEX.md, danh so RS-NNN |
| N2 | Audit report module | `bin/lib/audit-report.js` | Library (pure function) | Tao audit trail, confidence scoring, source tracking |
| N3 | Fact checker module | `bin/lib/fact-checker.js` | Library (pure function) | So sanh claims voi evidence, flag contradictions |
| N4 | Evidence Collector agent | `.claude/agents/pd-evidence-collector.md` | Agent config | Sub-agent thu thap nghien cuu da nguon |
| N5 | Fact Checker agent | `.claude/agents/pd-fact-checker.md` | Agent config | Sub-agent kiem tra do chinh xac |
| N6 | Research skill | `commands/pd/research.md` | Skill file | Entry point cho lenh `pd research` |
| N7 | Research workflow | `workflows/research.md` | Workflow | Quy trinh nghien cuu day du |

### THANH PHAN SUA DOI

| # | Thanh phan | Vi tri | Thay doi cu the |
|---|-----------|--------|----------------|
| M1 | new-milestone workflow | `workflows/new-milestone.md` | Buoc 5: goi pd research thay vi inline FastCode+Context7 |
| M2 | plan workflow | `workflows/plan.md` | Buoc 3: them Plan-Gate kiem tra research co san truoc |
| M3 | write-code workflow | `workflows/write-code.md` | Them Strategy Injection doc research khi code |
| M4 | Config | `.planning/config.json` | Them research-related flags (research_guard, audit_mode) |
| M5 | Converter snapshots | `test/snapshots/*.txt` | Tai tao sau thay doi workflows |

### KHONG SUA DOI (tai su dung truc tiep)

| Thanh phan | Vi tri | Cach su dung trong v3.0 |
|-----------|--------|------------------------|
| evidence-protocol.js | `bin/lib/evidence-protocol.js` | Pattern validate dung cho research entries |
| bug-memory.js | `bin/lib/bug-memory.js` | Pattern buildIndex dung cho research INDEX.md |
| resource-config.js | `bin/lib/resource-config.js` | Them 2 agents moi vao AGENT_REGISTRY |
| truths-parser.js | `bin/lib/truths-parser.js` | parseFrontmatter cho research entries |
| utils.js | `bin/lib/utils.js` | parseFrontmatter, assembleMd dung chung |
| session-manager.js | `bin/lib/session-manager.js` | Pattern tham khao, khong goi truc tiep |

## Kien truc chi tiet

### 1. Research Entry Format — RS-NNN-slug.md

```markdown
---
id: RS-001
type: internal          # internal | external
topic: "NestJS module pattern"
source_type: fastcode   # fastcode | context7 | websearch | webfetch | codebase | manual
sources:
  - type: fastcode
    query: "NestJS module patterns"
    timestamp: 2026-03-25T10:30:00Z
  - type: codebase
    files: ["src/app.module.ts:15", "src/auth/auth.module.ts:8"]
confidence: CAO         # CAO | TRUNG BINH | THAP
created: 2026-03-25T10:30:00Z
updated: 2026-03-25T10:30:00Z
audit_log:
  - "2026-03-25T10:30:00Z: Tao boi pd-evidence-collector"
  - "2026-03-25T10:35:00Z: Xac nhan boi pd-fact-checker (CONFIRMED)"
---

# RS-001: NestJS Module Pattern

## Phat hien
[Noi dung nghien cuu]

## Bang chung
- `src/app.module.ts:15` — imports pattern hien tai
- Context7 NestJS docs: module forRoot/forFeature pattern

## Ket luan
[Khuyen nghi cu the]

## Audit Trail
| Thoi gian | Hanh dong | Agent | Ket qua |
|-----------|----------|-------|---------|
| 10:30 | Thu thap | pd-evidence-collector | Tao entry |
| 10:35 | Kiem tra | pd-fact-checker | CONFIRMED |
```

### 2. INDEX.md — Bang tong hop

```markdown
# Research Index

> Cap nhat: 2026-03-25T10:35:00Z
> Tong: 15 entries (10 internal, 5 external)

## Theo loai

### Internal (Code Analysis)
| ID | Topic | Confidence | File |
|----|-------|------------|------|
| RS-001 | NestJS module pattern | CAO | internal/RS-001-nestjs-module.md |
| RS-003 | Utils reuse | CAO | internal/RS-003-utils-reuse.md |

### External (Ecosystem)
| ID | Topic | Confidence | Sources | File |
|----|-------|------------|---------|------|
| RS-002 | Zod v4 migration | TRUNG BINH | Context7 | external/RS-002-zod-v4.md |

## Theo confidence
| Level | Count | Entries |
|-------|-------|---------|
| CAO | 10 | RS-001, RS-003, ... |
| TRUNG BINH | 3 | RS-002, ... |
| THAP | 2 | RS-005, RS-012 |
```

### 3. research-store.js — Pure function module

```javascript
// Pure functions — KHONG doc file, KHONG require('fs'), KHONG side effects.
// Content truyen qua tham so, return structured object.
//
// - createEntry(params) -> { id, fileName, content }
//   Tao research entry moi voi YAML frontmatter + body
//   Auto-increment RS-NNN tu existingEntries
//
// - parseEntry(content) -> { id, type, topic, sources, confidence, body, auditLog }
//   Parse frontmatter + body thanh structured object
//
// - updateEntry(existingContent, updates) -> string
//   Cap nhat entry (them audit log, doi confidence, etc)
//
// - buildIndex(entries) -> string
//   Generate INDEX.md tu tat ca entries, phan theo type va confidence
//
// - searchEntries(entries, query) -> { matches: [{entry, relevance}] }
//   Tim research entries theo keyword/topic
//
// - classifySource(sourceInfo) -> 'internal' | 'external'
//   Auto-detect loai tu source_type field
```

**Pattern tuong tu bug-memory.js:**
- `createEntry` ~ `createBugRecord` (auto-increment, YAML frontmatter)
- `buildIndex` ~ `buildIndex` (bang tong hop theo nhieu chieu)
- `searchEntries` ~ `searchBugs` (keyword matching voi scoring)

### 4. audit-report.js — Pure function module

```javascript
// Pure functions — KHONG doc file, KHONG require('fs'), KHONG side effects.
//
// - addAuditEntry(existingLog, entry) -> string
//   Them dong audit moi vao log (timestamp, action, agent, result)
//
// - calculateConfidence(sources) -> 'CAO' | 'TRUNG BINH' | 'THAP'
//   Tu dong tinh confidence tu loai va so luong sources
//   - Context7/FastCode/official docs = CAO
//   - WebSearch + 1 verify source = TRUNG BINH
//   - WebSearch only hoac training data = THAP
//
// - generateAuditReport(entries) -> string
//   Tao bao cao tong hop confidence across all entries
//   Highlight entries THAP can verify
//
// - validateSources(entry) -> { valid: boolean, warnings: string[] }
//   Kiem tra sources co du metadata (URL, timestamp, query)
```

**Confidence calculation logic:**

```
Source hierarchy (tu cao den thap):
1. Context7 docs           -> weight 3
2. FastCode code analysis  -> weight 3
3. Official docs (WebFetch verified URL) -> weight 2
4. WebSearch + verify      -> weight 1.5
5. WebSearch only          -> weight 1
6. Training data only      -> weight 0.5

Tong weight >= 5  -> CAO
Tong weight >= 2  -> TRUNG BINH
Tong weight < 2   -> THAP
```

### 5. fact-checker.js — Pure function module

```javascript
// Pure functions — KHONG doc file, KHONG require('fs'), KHONG side effects.
//
// - extractClaims(content) -> string[]
//   Trich xuat cac claim/assertion tu research entry
//   Nhan dien cau khang dinh (X la Y, X ho tro Z, X khong the Z)
//
// - compareClaim(claim, sourceContent) -> { verdict, evidence }
//   So sanh 1 claim voi source content
//   verdict: 'CONFIRMED' | 'CONTRADICTED' | 'UNVERIFIABLE'
//
// - flagContradictions(claims, sources) -> { contradictions: [{claim, source, detail}] }
//   Tim cac mau thuan giua claims va sources
//
// - generateVerdict(results) -> { overall, details, recommendations }
//   Tong hop ket qua kiem tra thanh verdict tong the
```

### 6. Agent Configs — 2 Research Agents

#### pd-evidence-collector.md

```yaml
---
name: pd-evidence-collector
description: Thu thap bang chung nghien cuu tu nhieu nguon — code analysis, thu vien docs, web search. Ghi ket qua co cau truc voi metadata va sources.
tools: Read, Glob, Grep, mcp__fastcode__code_qa, mcp__context7__resolve-library-id, mcp__context7__query-docs, WebSearch, WebFetch
model: sonnet
maxTurns: 25
effort: medium
---
```

**Tier:** builder (sonnet) — can suy luan trung binh de tong hop nhieu nguon
**Tools:** Day du — can truy cap ca internal (FastCode, Read) va external (Context7, WebSearch)

#### pd-fact-checker.md

```yaml
---
name: pd-fact-checker
description: Kiem tra do chinh xac cua claims trong research entries. So sanh voi source goc, flag mau thuan, danh gia confidence.
tools: Read, Grep, mcp__context7__resolve-library-id, mcp__context7__query-docs, WebSearch
model: haiku
maxTurns: 15
effort: low
---
```

**Tier:** scout (haiku) — chi can so sanh text, khong can suy luan phuc tap
**Tools:** Han che — chi doc va verify, KHONG co Write/Edit (read-only)

### 7. pd research Command — Workflow

```
commands/pd/research.md
========================

Skill file:
  name: pd:research
  model: sonnet
  argument-hint: "[topic hoac URL]"
  allowed-tools: Read, Write, Edit, Bash, Glob, Grep, Agent,
                 mcp__fastcode__code_qa, mcp__context7__*, WebSearch, WebFetch

Execution:
  @workflows/research.md


workflows/research.md
======================

BUOC 1: PHAN LOAI
  1.1  Doc $ARGUMENTS
  1.2  Auto-detect loai:
       - Argument la URL -> external research
       - Argument la file path / module name -> internal research
       - Argument la topic chung -> ca hai
  1.3  Doc .planning/research/INDEX.md -> da co research tuong tu?
       - Co, confidence CAO -> "Da co RS-NNN. Dung lai hay nghien cuu lai?"
       - Co, confidence THAP -> tu dong nghien cuu lai

BUOC 2: THU THAP (Spawn pd-evidence-collector)
  2.1  Spawn pd-evidence-collector voi task:
       "Nghien cuu [topic] tu [sources phu hop].
        Doc .planning/CONTEXT.md de biet tech stack.
        Ghi ket qua vao .planning/research/[internal|external]/RS-NNN-[slug].md
        Theo format research entry chuan."
  2.2  Doc ket qua -> validate voi research-store.js

BUOC 3: KIEM TRA (Spawn pd-fact-checker — TUY CHON)
  3.1  Confidence entry la THAP hoac TRUNG BINH?
       - Co -> spawn pd-fact-checker
       - CAO (Context7/FastCode) -> bo qua, da du tin cay
  3.2  Spawn pd-fact-checker voi task:
       "Kiem tra cac claim trong RS-NNN-[slug].md.
        So sanh voi source goc.
        Ghi audit entry vao file."
  3.3  Cap nhat confidence dua tren ket qua fact-check

BUOC 4: LUU TRU
  4.1  research-store.js: createEntry() hoac updateEntry()
  4.2  research-store.js: buildIndex() -> cap nhat INDEX.md
  4.3  audit-report.js: addAuditEntry()

BUOC 5: BAO CAO
  5.1  Hien tom tat cho user:
       - Topic, confidence, key findings
       - Sources da dung
       - Audit trail
  5.2  "Nghien cuu them?" -> quay Buoc 1 voi topic moi
```

### 8. Workflow Guards — 3 diem tich hop

#### Guard 1: Plan-Gate (trong plan.md Buoc 3)

```
HIEN TAI (plan.md Buoc 3):
  - Chay research inline (FastCode + Context7)
  - Ghi RESEARCH.md cho phase

THEM Plan-Gate:
  Buoc 3.0 (TRUOC Buoc 3A):
  1. Doc .planning/research/INDEX.md
  2. Tim entries lien quan den phase deliverables
  3. Co entries CAO/TRUNG BINH? -> "Da co nghien cuu: [list]. Su dung lam input."
  4. Chi co entries THAP? -> "Nghien cuu do tin cay THAP. Chay `/pd:research [topic]` truoc?"
  5. Khong co? -> tiep tuc Buoc 3A binh thuong (backward compatible)
```

**Dac diem:** NON-BLOCKING. Chi khuyen nghi, khong bat buoc. User co the bo qua.

#### Guard 2: Mandatory Suggestion (trong plan.md Buoc 4)

```
THEM vao plan.md Buoc 4 (thiet ke):
  Khi chon thu vien/approach:
  1. Check .planning/research/INDEX.md co entry lien quan
  2. Co -> chen "Research RS-NNN goi y: [summary]" vao PLAN.md
  3. PLAN.md co section "## Nghien cuu lien quan" -> liet ke RS-NNN IDs
```

#### Guard 3: Strategy Injection (trong write-code.md)

```
THEM vao write-code.md Buoc 1 (doc context):
  Doc .planning/research/INDEX.md:
  1. Tim entries lien quan den task hien tai (match keywords)
  2. Co entries CAO? -> doc entry -> ap dung patterns/warnings
  3. Entry co "Cam bay" (pitfall)? -> hien canh bao truoc khi code
  4. KHONG thay doi logic hien tai — chi THEM thong tin
```

**Dac diem:** NON-BLOCKING. Doc research nhu doc RESEARCH.md hien tai, chi them INDEX.md lookup.

## Luong du lieu chi tiet

```
USER INPUT
    |
    v
[pd research "topic"]  HOAC  [pd new-milestone (Buoc 5)]
    |                              |
    v                              v
commands/pd/research.md      workflows/new-milestone.md
    |                              |
    v                              v
workflows/research.md         Buoc 5: goi research workflow
    |
    |  BUOC 1: PHAN LOAI
    |  +-> research-store.js: searchEntries(INDEX.md, topic)
    |  +-> Auto-detect: internal vs external vs both
    |
    |  BUOC 2: THU THAP
    |  +-> resource-config.js: getAgentConfig('pd-evidence-collector')
    |  +-> [Spawn] pd-evidence-collector
    |  |     +-> Internal path: FastCode + Grep + Read
    |  |     +-> External path: Context7 + WebSearch + WebFetch
    |  |     +-> Write RS-NNN-slug.md vao internal/ hoac external/
    |  +-> research-store.js: parseEntry() + validate
    |
    |  BUOC 3: KIEM TRA (conditional)
    |  +-> audit-report.js: calculateConfidence(sources)
    |  +-> Confidence < CAO?
    |  |     +-> [Spawn] pd-fact-checker
    |  |     |     +-> fact-checker.js: extractClaims()
    |  |     |     +-> Verify qua Context7/WebSearch
    |  |     |     +-> fact-checker.js: compareClaim() + generateVerdict()
    |  |     |     +-> audit-report.js: addAuditEntry()
    |  |     +-> research-store.js: updateEntry(confidence)
    |
    |  BUOC 4: LUU TRU
    |  +-> research-store.js: buildIndex(all entries) -> INDEX.md
    |
    v
OUTPUT:
  .planning/research/internal/RS-NNN-slug.md  (hoac external/)
  .planning/research/INDEX.md (cap nhat)

    |
    | (Downstream consumers)
    v
[pd plan] -> Plan-Gate doc INDEX.md -> dung research entries
[pd write-code] -> Strategy Injection doc entries lien quan
```

## Anti-Patterns can tranh

### Anti-Pattern 1: Fact-checker tu verify chinh minh
**Van de:** Agent A tao claim, Agent A verify claim — vo nghia
**Thay the:** Evidence Collector THU THAP, Fact Checker VERIFY — 2 agents tach biet

### Anti-Pattern 2: Blocking guards
**Van de:** Bat user phai chay research truoc moi buoc -> workflow cham, phien phuc
**Thay the:** NON-BLOCKING guards — chi khuyen nghi, khong bat buoc. Backward compatible.

### Anti-Pattern 3: Luu research trong conversation context
**Van de:** Mat khi het phien, khong audit duoc, khong share giua workflows
**Thay the:** File-based storage voi YAML frontmatter — persist, auditable, searchable

### Anti-Pattern 4: Mot file INDEX monolith
**Van de:** INDEX.md lon dan kho doc, merge conflict
**Thay te:** INDEX.md chi la generated view — source of truth la cac RS-NNN files rieng le. Rebuild INDEX bat ky luc nao.

### Anti-Pattern 5: Research cho moi task nho
**Van de:** Tieu hao token cho CRUD don gian
**Thay the:** Chi research khi: thu vien moi, domain phuc tap, confidence THAP. CRUD co ban -> "Dung stack co san."

## Patterns nen theo

### Pattern 1: Pure Function Library (nhat quan v1.0-v2.1)
**Gi:** Logic trong bin/lib/*.js, khong doc file, content truyen qua tham so
**Khi nao:** Moi module moi (research-store, audit-report, fact-checker)
**Vi sao:** 22 modules hien tai deu theo pattern nay, 601+ tests chung minh hieu qua

### Pattern 2: Evidence-as-Communication (ke thua v2.1)
**Gi:** Research agents giao tiep qua RS-NNN files, khong qua memory
**Khi nao:** Evidence Collector -> RS file -> Fact Checker doc RS file
**Vi sao:** Persist qua phien, audit-ready, searchable

### Pattern 3: Auto-Increment ID (ke thua bug-memory.js)
**Gi:** RS-NNN danh so tu dong, khong reuse, khong gap
**Khi nao:** Moi research entry moi
**Vi sao:** Tham chieu don gian (RS-001), khong phu thuoc timestamp phuc tap

### Pattern 4: YAML Frontmatter Metadata (ke thua evidence-protocol.js)
**Gi:** Metadata co cau truc o dau file, body la markdown tu do
**Khi nao:** Moi RS-NNN file
**Vi sao:** parseFrontmatter() da co trong utils.js, khong can parser moi

### Pattern 5: Non-Blocking Integration
**Gi:** Workflow guards chi khuyen nghi, khong block
**Khi nao:** Plan-Gate, Strategy Injection
**Vi sao:** Pattern da chung minh o v1.5 (debug-cleanup, logic-sync deu non-blocking)

## Thu tu build de xuat

```
PHASE 1: Research Storage Foundation
  1. Tao .planning/research/internal/ + external/ directories
  2. Tao bin/lib/research-store.js (createEntry, parseEntry, updateEntry, buildIndex, searchEntries)
  3. Tao bin/lib/audit-report.js (addAuditEntry, calculateConfidence, validateSources)
  -> Ket qua: Co the luu tru va truy van research entries
  -> Phu thuoc: utils.js (parseFrontmatter, assembleMd) — da co

PHASE 2: Audit Report Standards
  4. Tao bin/lib/fact-checker.js (extractClaims, compareClaim, flagContradictions, generateVerdict)
  5. Tich hop audit trail vao research-store.js (addAuditEntry khi create/update)
  -> Ket qua: Research entries co audit trail va confidence tracking
  -> Phu thuoc: Phase 1 (research-store.js)

PHASE 3: Research Agents
  6. Tao .claude/agents/pd-evidence-collector.md
  7. Tao .claude/agents/pd-fact-checker.md
  8. Cap nhat bin/lib/resource-config.js: them 2 agents vao AGENT_REGISTRY
  -> Ket qua: Agents co the spawn, co tier mapping
  -> Phu thuoc: Phase 1 (entry format), Phase 2 (audit format)

PHASE 4: Workflow Guards
  9. Sua workflows/plan.md: them Plan-Gate (Buoc 3.0) + Mandatory Suggestion (Buoc 4)
  10. Sua workflows/write-code.md: them Strategy Injection (Buoc 1)
  11. Cap nhat .planning/config.json: them research_guard flag
  -> Ket qua: Workflows hien co su dung research data
  -> Phu thuoc: Phase 1 (INDEX.md, searchEntries)

PHASE 5: pd research Command
  12. Tao commands/pd/research.md (skill file)
  13. Tao workflows/research.md (workflow day du)
  14. Tich hop vao new-milestone.md Buoc 5 (thay the inline research)
  15. Cap nhat converter snapshots
  -> Ket qua: User co the chay `pd research` doc lap
  -> Phu thuoc: Phase 1-3 (store + agents)

RATIONALE THU TU:
- Phase 1 truoc tat ca vi moi thu phu thuoc vao storage format
- Phase 2 truoc Phase 3 vi agents can biet format de ghi dung
- Phase 3 truoc Phase 5 vi workflow can agents de spawn
- Phase 4 co the chay SONG SONG voi Phase 3 (doc lap — guards chi doc INDEX, khong can agents)
- Phase 5 cuoi cung vi tich hop tat ca thanh phan
```

## Migration — Tuong thich nguoc voi research hien tai

```
HIEN TAI:                              SAU v3.0:
.planning/research/                    .planning/research/
  SUMMARY.md                             SUMMARY.md          (GIU NGUYEN)
  STACK.md                               STACK.md            (GIU NGUYEN)
  FEATURES.md                            FEATURES.md         (GIU NGUYEN)
  ARCHITECTURE.md                        ARCHITECTURE.md     (GIU NGUYEN)
  PITFALLS.md                            PITFALLS.md         (GIU NGUYEN)
                                         INDEX.md            (MOI)
                                         internal/           (MOI)
                                           RS-NNN-*.md
                                         external/           (MOI)
                                           RS-NNN-*.md

plan.md Buoc 3 van doc SUMMARY.md nhu cu -> KHONG break.
INDEX.md la THEM VAO, khong thay the.
5 file nghien cuu cu khong bi di chuyen hay doi ten.
```

## Scalability Considerations

| Van de | 10 entries | 100 entries | 1000 entries |
|--------|-----------|-------------|-------------|
| INDEX.md size | ~50 dong, de doc | ~500 dong, can filter | Can phan trang hoac INDEX per milestone |
| Search speed | Instant (regex) | ~1s (regex all files) | Can inverted index hoac tag-based lookup |
| Audit trail | Inline trong file | Inline van ok | Tach audit log rieng neu qua lon |
| Agent cost | ~5K tokens/entry | Batch mode tiet kiem | Cache frequently-used entries |

## Sources

- Phan tich truc tiep codebase please-done v2.1 (22 modules, 10 workflows, 7 agents) — HIGH confidence
- Pattern evidence-protocol.js, bug-memory.js, session-manager.js — HIGH confidence (da shipped, 601+ tests)
- Pattern non-blocking integration tu v1.5 (debug-cleanup.js, logic-sync.js) — HIGH confidence
- Tai lieu chinh thuc Claude Code sub-agents — HIGH confidence (da verify trong v2.1 research)
- resource-config.js AGENT_REGISTRY pattern — HIGH confidence (da hoat dong cho 5 detective agents)
