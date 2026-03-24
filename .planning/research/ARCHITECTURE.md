# Architecture: v2.1 Detective Orchestrator

**Domain:** Tich hop dieu phoi da Agent vao workflow fix-bug hien tai -- bien quy trinh tuan tu 1-agent thanh he thong Task Force voi 5 Agent chuyen biet
**Researched:** 2026-03-24
**Confidence:** HIGH (phan tich toan bo codebase hien tai + tai lieu chinh thuc Claude Code sub-agents)

## Tong quan he thong hien tai (v1.5) va diem chuyen doi v2.1

```
TRANG THAI HIEN TAI (v1.5):
=============================
                                 MOT AGENT DUY NHAT (sonnet)
                                 Chay toan bo 10+ buoc tuan tu

/pd:fix-bug
   |
   v
commands/pd/fix-bug.md ---- model: sonnet, 10 allowed-tools
   |
   v
workflows/fix-bug.md (426 dong, da gan limit 420)
   |
   +-- Buoc 0.5-1: Thu thap trieu chung
   +-- Buoc 2-4:   Tim hieu tai lieu + code
   +-- Buoc 5:     Phan tich khoa hoc (SESSION_*.md)
   +--   5b.1:     repro-test-generator.js
   +-- Buoc 6:     Danh gia + Cong kiem tra
   +-- Buoc 6.5:   Logic Update (Truth)
   +-- Buoc 7:     Bao cao loi (BUG_*.md)
   +-- Buoc 8:     Sua code
   +--   8a:       regression-analyzer.js
   +-- Buoc 9:     Git commit
   +--   9a:       debug-cleanup.js + security check
   +-- Buoc 10:    Xac nhan
   +--   10a:      logic-sync.js (detect + report + rules)


MUC TIEU v2.1 (Detective Orchestrator):
=========================================
                                 ORCHESTRATOR (opus) dieu phoi
                                 5 SUB-AGENTS chuyen biet

/pd:fix-bug
   |
   v
commands/pd/fix-bug.md ---- model: opus, them Agent tool
   |
   v
workflows/fix-bug-orchestrator.md (workflow MOI)
   |
   +-- Pha 1: KHOI DONG
   |     Orchestrator doc SESSION cu / thu thap trieu chung
   |     Spawn pd-bug-janitor (haiku) -> evidence_janitor.md
   |
   +-- Pha 2: DIEU TRA (song song)
   |     Spawn pd-code-detective (sonnet) + pd-doc-specialist (haiku)
   |     -> evidence_code.md + evidence_docs.md
   |
   +-- Pha 3: TAI HIEN
   |     Spawn pd-repro-engineer (sonnet) -> evidence_repro.md
   |     (Su dung repro-test-generator.js tu v1.5)
   |
   +-- Pha 4: PHAN QUYET
   |     Spawn pd-fix-architect (opus) -> evidence_architect.md
   |     (Su dung regression-analyzer.js tu v1.5)
   |
   +-- Pha 5: VE DICH
         Orchestrator tu sua code, commit, xac nhan
         (Su dung debug-cleanup.js, logic-sync.js tu v1.5)
```

## Quyet dinh kien truc then chot: Sub-agents, KHONG PHAI Agent Teams

### Tai sao chon Sub-agents

| Tieu chi | Sub-agents | Agent Teams |
|----------|-----------|-------------|
| **Tinh on dinh** | Stable, GA | Experimental, disabled mac dinh |
| **Do phuc tap** | Agent file + spawn tu main | Team lead + shared task list + mailbox |
| **Context control** | Ket qua tra ve main agent | Moi teammate co context doc lap |
| **Chi phi token** | Thap hon — chi tra ket qua | Cao hon — moi teammate la 1 instance |
| **Phu hop cho** | Task co ket qua ro rang | Task can teammates trao doi qua lai |
| **Gioi han** | Khong spawn nested sub-agents | 1 team/session, khong resume |

**Ket luan:** Sub-agents la lua chon dung vi:
1. Moi agent thuc hien 1 nhiem vu CU THE va tra ket qua ve orchestrator
2. Khong can inter-agent communication — orchestrator tong hop tat ca
3. On dinh (GA), khong can flag experimental
4. Tiet kiem token vi chi ket qua summary tra ve main context

### Cach sub-agents hoat dong trong Claude Code

```
SUBAGENT LIFECYCLE:
====================

1. Dinh nghia: .claude/agents/pd-bug-janitor.md
   - YAML frontmatter: name, description, tools, model
   - Markdown body: system prompt

2. Spawn: Orchestrator goi Agent tool voi task description
   - Sub-agent nhan system prompt + task prompt
   - KHONG nhan conversation history cua parent
   - Chay trong context window rieng

3. Thuc thi: Sub-agent lam viec doc lap
   - Su dung tools duoc cap phep
   - Ghi ket qua vao file (.planning/debug/evidence_*.md)
   - KHONG the spawn sub-agents khac (gioi han 1 cap)

4. Tra ket qua: Sub-agent hoan thanh
   - Return text summary ve orchestrator
   - Orchestrator doc evidence file de lay chi tiet
   - Sub-agent context bi giai phong
```

### Gioi han ky thuat quan trong

1. **Sub-agents KHONG the spawn sub-agents khac** — chi co 1 cap. Orchestrator la cap duy nhat spawn.
2. **Sub-agents KHONG nhan conversation history** cua parent — chi nhan system prompt + task prompt.
3. **Sub-agents load CLAUDE.md va project context** tu working directory — KHONG ke thua skills tu parent.
4. **Model co the chi dinh per-agent** — `model: haiku`, `model: sonnet`, `model: opus`, hoac `inherit`.
5. **Tools co the restrict per-agent** — `tools: Read, Grep, Glob` hoac `disallowedTools: Write, Edit`.
6. **Background mode** co san (`background: true`) — sub-agent chay background, orchestrator tiep tuc.
7. **maxTurns** gioi han so luot agent — phong agent loop vo han.
8. **Persistent memory** co san (`memory: project`) — agent nho context qua cac phien.

## Thanh phan: Moi vs Sua doi vs Khong doi

### THANH PHAN MOI

| # | Thanh phan | Vi tri | Loai | Muc dich |
|---|-----------|--------|------|---------|
| N1 | Orchestrator workflow | `workflows/fix-bug-orchestrator.md` | Workflow | Dieu phoi 5 pha, spawn sub-agents, tong hop ket qua |
| N2 | Resource orchestration module | `bin/lib/resource-orchestrator.js` | Library (pure function) | Tier->Model mapping, heavy lock logic, downgrade rules |
| N3 | Session manager module | `bin/lib/session-manager.js` | Library (pure function) | Parse/create/update SESSION_*.md, resume logic |
| N4 | Evidence protocol module | `bin/lib/evidence-protocol.js` | Library (pure function) | Validate evidence format, merge evidence files |
| N5 | Bug history module | `bin/lib/bug-history.js` | Library (pure function) | Scan .planning/bugs/, match patterns, regression alerts |

### THANH PHAN SUA DOI

| # | Thanh phan | Vi tri | Thay doi cu the |
|---|-----------|--------|----------------|
| M1 | fix-bug skill | `commands/pd/fix-bug.md` | model: sonnet -> opus, them Agent tool, tro vao orchestrator workflow |
| M2 | Agent configs (5 files) | `commands/pd/agents/*.md` -> `.claude/agents/*.md` | Di chuyen tu commands/pd/agents/ sang .claude/agents/, bo sung frontmatter chuan Claude Code |
| M3 | Workflow fix-bug cu | `workflows/fix-bug.md` | Giu nguyen lam fallback khi sub-agents khong kha dung |
| M4 | Converter snapshots | `test/snapshots/*.txt` | Tai tao sau moi thay doi workflow/skill |

### KHONG SUA DOI (tai su dung truc tiep)

| Thanh phan | Vi tri | Cach su dung trong v2.1 |
|-----------|--------|------------------------|
| repro-test-generator.js | `bin/lib/repro-test-generator.js` | pd-repro-engineer goi truc tiep |
| regression-analyzer.js | `bin/lib/regression-analyzer.js` | pd-fix-architect goi truc tiep |
| debug-cleanup.js | `bin/lib/debug-cleanup.js` | Orchestrator goi o Pha 5 (truoc commit) |
| logic-sync.js | `bin/lib/logic-sync.js` | Orchestrator goi o Pha 5 (sau fix) |
| truths-parser.js | `bin/lib/truths-parser.js` | pd-fix-architect goi khi kiem tra Truth |
| generate-diagrams.js | `bin/lib/generate-diagrams.js` | Orchestrator goi khi cap nhat report |
| report-filler.js | `bin/lib/report-filler.js` | Orchestrator goi khi cap nhat report |
| generate-pdf-report.js | `bin/generate-pdf-report.js` | Orchestrator goi CLI khi xuat PDF |
| plan-checker.js | `bin/lib/plan-checker.js` | Khong lien quan fix-bug |
| base converter + 4 platform converters | `bin/lib/converters/*.js` | Tai tao snapshots, khong sua logic |

## Kien truc chi tiet

### 1. Di chuyen Agent configs sang .claude/agents/

```
HIEN TAI (v1.5):                    SAU v2.1:
commands/pd/agents/                  .claude/agents/
  pd-bug-janitor.md                    pd-bug-janitor.md
  pd-code-detective.md                 pd-code-detective.md
  pd-doc-specialist.md                 pd-doc-specialist.md
  pd-fix-architect.md                  pd-fix-architect.md
  pd-repro-engineer.md                 pd-repro-engineer.md
```

**Ly do:** Claude Code chi nhan dien sub-agents tu `.claude/agents/` hoac `~/.claude/agents/`. Thu muc `commands/pd/agents/` la custom location khong duoc Claude Code tu dong load.

**Frontmatter can bo sung:**

```yaml
---
name: pd-bug-janitor
description: Nhan vien ve sinh boi canh - Loc log rac va trich xuat trieu chung vang. Su dung khi can loc va phan tich thong tin loi ban dau.
tools: Read, Bash, Grep, Glob
disallowedTools: Write, Edit
model: haiku
maxTurns: 15
memory: project
---
```

**Cac field moi can them cho tung agent:**

| Agent | model | tools | maxTurns | memory | background |
|-------|-------|-------|----------|--------|-----------|
| pd-bug-janitor | haiku | Read, Bash, Grep, Glob, AskUserQuestion | 15 | project | false |
| pd-code-detective | sonnet | Read, Glob, Grep, mcp__fastcode__code_qa | 25 | project | false |
| pd-doc-specialist | haiku | Read, mcp__context7__resolve-library-id, mcp__context7__query-docs | 15 | project | true |
| pd-repro-engineer | sonnet | Read, Write, Edit, Bash | 20 | none | false |
| pd-fix-architect | opus | Read, Write, Edit, Bash | 30 | project | false |

### 2. Workflow Orchestrator — Luong dieu phoi 5 pha

```
fix-bug-orchestrator.md
========================

PHA 1: KHOI DONG (Orchestrator truc tiep, KHONG spawn)
---------------------------------------------------------
1.1  Kiem tra .planning/debug/SESSION_*.md — co phien cu?
     - Co phien tiep tuc duoc -> hien danh sach, user chon
     - Khong -> thu thap trieu chung (5 cau hoi vang)
1.2  Xac dinh patch version (giu logic Buoc 2 hien tai)
1.3  Spawn pd-bug-janitor voi task:
     "Loc va trich xuat trieu chung tu: [arguments + context]
      Kiem tra .planning/bugs/ tim bug tuong tu.
      Ghi ket qua vao .planning/debug/evidence_janitor.md"
1.4  Doc evidence_janitor.md -> danh gia:
     - Co bug tuong tu trong qua kho? -> REGRESSION ALERT
     - Trieu chung du 5 thong tin? -> tiep Pha 2
     - Thieu -> hoi user bo sung


PHA 2: DIEU TRA (2 sub-agents SONG SONG)
-------------------------------------------
2.1  Spawn pd-code-detective (foreground):
     "Tim file va dong gay loi dua tren trieu chung:
      [dan noi dung evidence_janitor.md]
      Doc PLAN.md + CODE_REPORT cua phase lien quan.
      Ghi ket qua vao .planning/debug/evidence_code.md"

2.2  Spawn pd-doc-specialist (background):
     "Kiem tra thu vien lien quan: [danh sach tu package.json]
      Tim Breaking Changes, Known Issues.
      Ghi ket qua vao .planning/debug/evidence_docs.md"

2.3  Cho ca 2 hoan thanh -> doc evidence files
2.4  Danh gia:
     - ROOT CAUSE FOUND o evidence_code? -> Pha 3 (xac nhan)
     - INCONCLUSIVE? -> Orchestrator tu dieu tra them (fallback)
     - CHECKPOINT? -> hien cau hoi cho user


PHA 3: TAI HIEN (1 sub-agent)
-------------------------------
3.1  Spawn pd-repro-engineer:
     "Tao Red Test tu:
      [trieu chung + evidence_code.md]
      Dung repro-test-generator.js tu bin/lib.
      Chay test, xac nhan FAIL.
      Ghi ket qua vao .planning/debug/evidence_repro.md"

3.2  Doc evidence_repro.md:
     - Test FAIL -> xac nhan bug, tiep Pha 4
     - Test PASS -> bug khong tai hien duoc, hoi user
     - LOI -> bo qua repro, tiep Pha 4 voi warning


PHA 4: PHAN QUYET (1 sub-agent)
---------------------------------
4.1  Spawn pd-fix-architect:
     "Tong hop tat ca evidence:
      [evidence_janitor + evidence_code + evidence_docs + evidence_repro]
      Dung regression-analyzer.js phan tich anh huong.
      Kiem tra Truth lien quan (truths-parser.js).
      De xuat Fix Plan cu the.
      Ghi ket qua vao .planning/debug/evidence_architect.md"

4.2  Doc evidence_architect.md:
     - ROOT CAUSE + FIX PLAN -> Cong kiem tra 3 dieu kien
     - CHECKPOINT -> hien phuong an cho user chon
     - Can quyet dinh user? -> hien A/B voi uu/nhuoc


PHA 5: VE DICH (Orchestrator truc tiep, KHONG spawn)
------------------------------------------------------
5.1  Logic Update: Kiem tra Truth sai? -> cap nhat PLAN.md (Buoc 6.5 cu)
5.2  Viet bao cao loi BUG_*.md (Buoc 7 cu)
5.3  Sua code theo Fix Plan (Buoc 8 cu)
5.4  Git commit:
     - debug-cleanup.js: don dep debug markers
     - matchSecurityWarnings: canh bao bao mat
     - Commit [LOI]
5.5  Xac nhan:
     - logic-sync.js: detect + report update + rule suggestion
     - Hoi user xac nhan
     - Chua xua -> quay Pha 2 voi gia thuyet moi
```

### 3. Evidence Protocol — Dinh dang bang chung thong nhat

```markdown
# Evidence: [agent-name]
> Thoi gian: [timestamp]
> Agent: [pd-bug-janitor | pd-code-detective | pd-doc-specialist | pd-repro-engineer | pd-fix-architect]
> Trang thai: [ROOT CAUSE FOUND | CHECKPOINT REACHED | INVESTIGATION INCONCLUSIVE]

## Ket qua
[Noi dung chinh]

## Bang chung
- File: [path:line] — [phat hien]

## Danh sach da loai tru (Elimination Log)
- [file/logic]: DA KIEM TRA — BINH THUONG vi [ly do]

## Related Historical Bugs
- BUG_[timestamp].md: [mo ta] — [tuong tu/khong lien quan]

## De xuat hanh dong tiep theo
[Cho orchestrator quyet dinh]
```

**Module evidence-protocol.js:**

```javascript
// Pure functions:
// - validateEvidence(content) -> { valid: boolean, errors: string[] }
// - mergeEvidences(evidenceFiles) -> { rootCause, confidence, eliminationLog, recommendations }
// - formatForArchitect(mergedEvidence) -> string (task prompt cho pd-fix-architect)
```

### 4. Session Persistence — Vong doi file debug

```
.planning/debug/
  SESSION_login-timeout.md        <-- Phien dieu tra (format hien tai, giu nguyen)
  evidence_janitor.md             <-- MOI: output cua pd-bug-janitor
  evidence_code.md                <-- MOI: output cua pd-code-detective
  evidence_docs.md                <-- MOI: output cua pd-doc-specialist
  evidence_repro.md               <-- MOI: output cua pd-repro-engineer
  evidence_architect.md           <-- MOI: output cua pd-fix-architect
  repro/
    repro-login-timeout.test.js   <-- GIU NGUYEN: output cua repro-test-generator
```

**Vong doi:**
1. Pha 1: Tao/cap nhat SESSION_*.md + evidence_janitor.md
2. Pha 2: Tao evidence_code.md + evidence_docs.md
3. Pha 3: Tao evidence_repro.md + repro test file
4. Pha 4: Tao evidence_architect.md
5. Pha 5: Cap nhat SESSION (Da giai quyet) + BUG_*.md
6. Sau xac nhan: evidence_*.md GIU LAI (cho project memory)

**Resume logic (session-manager.js):**

```javascript
// Pure functions:
// - parseSession(content) -> { status, hypotheses, checkpoints, bugReport }
// - listResumableSessions(sessionFiles) -> { resumable: [], closed: [] }
// - canResumeFromEvidence(evidenceFiles) -> { phase, lastAgent, nextAction }
// - createSessionFromEvidence(evidences) -> string (SESSION content moi)
```

### 5. Resource Orchestration — Tier/Model mapping

```
resource-orchestrator.js
=========================

// Pure functions:
// - mapTierToModel(tier, platform) -> { model, fallback }
// - checkResourceSafety(activeAgents, heavyTasks) -> { canSpawn, reason }
// - shouldDowngrade(errorContext) -> { downgrade: boolean, newConfig }

BANG MAPPING:
| Tier      | Claude Code    | Fallback       |
|-----------|---------------|----------------|
| scout     | haiku         | haiku          |
| builder   | sonnet        | haiku          |
| architect | opus          | sonnet         |

QUY TAC AN TOAN:
1. Toi da 2 sub-agents song song
2. Heavy Lock: chi 1 tac vu nang (indexing/testing) tai 1 thoi diem
3. Ha cap thong minh: loi tai nguyen -> giam tier
4. Fallback: sub-agent loi -> orchestrator tu lam (v1.5 workflow)
```

### 6. Bug History — Tri nho du an

```
bug-history.js
===============

// Pure functions:
// - scanBugHistory(bugFiles) -> { bugs: [{date, category, rootCause, files}] }
// - findSimilarBugs(symptoms, bugHistory) -> { matches: [{bug, similarity, reason}] }
// - checkRegression(currentFix, bugHistory) -> { isRegression: boolean, relatedBug }
// - formatHistoryContext(matches) -> string (context cho pd-bug-janitor)
```

### 7. Backward Compatibility — Fallback ve v1.5

```
LOGIC FALLBACK:
================

fix-bug.md (skill file):
  1. Kiem tra Agent tool co kha dung?
     - CO -> @workflows/fix-bug-orchestrator.md
     - KHONG -> @workflows/fix-bug.md (workflow cu, giu nguyen)

  2. Sub-agent spawn that bai?
     - Orchestrator tu thuc hien buoc do (downgrade ve 1-agent)
     - Ghi warning vao SESSION: "Sub-agent [name] that bai, fallback"

  3. Moi pha co timeout:
     - Sub-agent chay qua maxTurns -> tra ket qua hien tai
     - Orchestrator quyet dinh tiep tuc hay dung
```

## Luong du lieu chi tiet

```
USER INPUT (mo ta loi)
    |
    v
commands/pd/fix-bug.md
    |  doc: .planning/rules/*.md, CONTEXT.md
    |
    v
workflows/fix-bug-orchestrator.md
    |
    |  PHA 1
    |  +-> session-manager.js: listResumableSessions()
    |  +-> bug-history.js: scanBugHistory(.planning/bugs/)
    |  +-> [Spawn] pd-bug-janitor
    |  |     +-> Grep .planning/bugs/ (knowledge recall)
    |  |     +-> AskUserQuestion (neu thieu)
    |  |     +-> Write evidence_janitor.md
    |  +-> evidence-protocol.js: validateEvidence()
    |
    |  PHA 2
    |  +-> resource-orchestrator.js: checkResourceSafety()
    |  +-> [Spawn song song] pd-code-detective + pd-doc-specialist
    |  |     +-> pd-code-detective:
    |  |     |     Read evidence_janitor.md
    |  |     |     mcp__fastcode__code_qa (tim files lien quan)
    |  |     |     Grep/Read source code
    |  |     |     Write evidence_code.md
    |  |     +-> pd-doc-specialist:
    |  |           Read evidence_janitor.md
    |  |           context7 resolve + query
    |  |           Write evidence_docs.md
    |  +-> evidence-protocol.js: mergeEvidences()
    |
    |  PHA 3
    |  +-> [Spawn] pd-repro-engineer
    |  |     Read evidence_janitor.md + evidence_code.md
    |  |     repro-test-generator.js (generateReproTest)
    |  |     Bash (chay test)
    |  |     Write evidence_repro.md
    |
    |  PHA 4
    |  +-> [Spawn] pd-fix-architect
    |  |     Read ALL evidence_*.md
    |  |     regression-analyzer.js (analyzeFromCallChain/analyzeFromSourceFiles)
    |  |     truths-parser.js (parseTruthsFromContent)
    |  |     Write evidence_architect.md
    |
    |  PHA 5 (Orchestrator truc tiep)
    |  +-> Cap nhat PLAN.md (logic update)
    |  +-> Viet BUG_*.md
    |  +-> Sua code
    |  +-> debug-cleanup.js (scanDebugMarkers + matchSecurityWarnings)
    |  +-> Git commit [LOI]
    |  +-> logic-sync.js (detectLogicChanges + updateReportDiagram + suggestClaudeRules)
    |  +-> Hoi user xac nhan
    |
    v
OUTPUT: Bug da sua, evidence files, SESSION updated, BUG report
```

## Anti-Patterns can tranh

### Anti-Pattern 1: Spawn sub-agent cho moi buoc nho
**Van de:** Token overhead, latency, mat context
**Thay the:** Orchestrator tu lam cac buoc don gian (version check, git commit, doc file)

### Anti-Pattern 2: Truyen qua nhieu context cho sub-agent
**Van de:** Sub-agent co context window gioi han, truyen tat ca se bi tran
**Thay the:** Chi truyen evidence file relevants + task description cu the

### Anti-Pattern 3: Nested sub-agents
**Van de:** Claude Code khong cho phep sub-agent spawn sub-agent khac
**Thay the:** Tat ca sub-agents duoc spawn boi orchestrator (1 cap duy nhat)

### Anti-Pattern 4: Agent Teams cho debug workflow
**Van de:** Experimental, token-expensive, overpower cho task nay
**Thay the:** Sub-agents voi evidence files la communication channel

### Anti-Pattern 5: Thay the hoan toan workflow cu
**Van de:** Mat backward compatibility, khong co fallback
**Thay the:** Giu workflow cu lam fallback, tao workflow moi song song

## Patterns nen theo

### Pattern 1: Evidence-as-Communication
**Gi:** Sub-agents giao tiep qua evidence files trong .planning/debug/
**Khi nao:** Moi khi sub-agent can truyen ket qua cho agent khac
**Vi sao:** Tranh overhead cua inter-agent messaging, persist qua phien

### Pattern 2: Graceful Degradation
**Gi:** Moi buoc co fallback — sub-agent loi thi orchestrator tu lam
**Khi nao:** Bat ky sub-agent nao co the that bai
**Vi sao:** Workflow khong bao gio bi chan hoan toan

### Pattern 3: Pure Function Libraries
**Gi:** Logic phuc tap nam trong bin/lib/*.js, sub-agents goi truc tiep
**Khi nao:** Can testable, reusable logic
**Vi sao:** Nhat quan voi kien truc v1.0-v1.5 (pattern da chung minh)

### Pattern 4: Orchestrator-as-Executor
**Gi:** Pha 5 (sua code, commit, xac nhan) do orchestrator TRUC TIEP lam
**Khi nao:** Buoc can tuong tac voi user hoac thay doi code
**Vi sao:** Giam spawn overhead, giu control tap trung

## Thu tu build de xuat

```
PHASE 1: Agent Infrastructure
  1. Di chuyen + cap nhat 5 agent configs -> .claude/agents/
  2. Tao resource-orchestrator.js (Tier/Model mapping)
  3. Cap nhat commands/pd/fix-bug.md (model, tools, workflow ref)
  -> Ket qua: Sub-agents co the spawn duoc, skill file da cap nhat

PHASE 2: Evidence & Session Protocol
  4. Tao evidence-protocol.js (validate + merge)
  5. Tao session-manager.js (parse + resume logic)
  -> Ket qua: Co protocol thong nhat cho communication

PHASE 3: Bug History & Memory
  6. Tao bug-history.js (scan + match + regression)
  7. Cap nhat pd-bug-janitor.md voi knowledge recall logic
  -> Ket qua: Tri nho du an hoat dong

PHASE 4: Orchestrator Workflow
  8. Tao workflows/fix-bug-orchestrator.md (5 pha)
  9. Tich hop fallback logic (Agent khong kha dung -> workflow cu)
  10. Cap nhat converter snapshots
  -> Ket qua: Workflow moi hoan chinh, backward compatible

RATIONALE THU TU:
- Phase 1 truoc vi cac phase sau phu thuoc vao agent configs
- Phase 2 truoc Phase 4 vi orchestrator can protocol de giao tiep
- Phase 3 co the chay song song voi Phase 2 (doc lap)
- Phase 4 cuoi cung vi tich hop tat ca thanh phan truoc do
```

## Scalability Considerations

| Van de | Hien tai (1 bug) | 5 bugs/ngay | 20 bugs/ngay |
|--------|-----------------|-------------|-------------|
| Token cost | ~50K tokens/bug | Tier routing giam ~30% | Heavy Lock can thiet |
| Context window | Du cho 1 orchestrator | evidence files giu nho | Compaction tu dong |
| Session persistence | 1 SESSION file | Nhieu SESSION, resume UI | Bug history index can thiet |
| Performance | Chap nhan | Song song 2 agents tot | Can monitor resource |

## Sources

- [Tai lieu chinh thuc Claude Code: Custom sub-agents](https://code.claude.com/docs/en/sub-agents) — HIGH confidence
- [Tai lieu chinh thuc Claude Code: Agent teams](https://code.claude.com/docs/en/agent-teams) — HIGH confidence
- [Claude Code Sub-Agent patterns](https://claudefa.st/blog/guide/agents/sub-agent-best-practices) — MEDIUM confidence
- Phan tich truc tiep codebase please-done v1.5 — HIGH confidence
