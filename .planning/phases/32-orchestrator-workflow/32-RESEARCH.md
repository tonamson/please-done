# Phase 32: Orchestrator Workflow - Research

**Researched:** 2026-03-25
**Domain:** Markdown workflow orchestration, Claude Code Agent tool, pure function module integration
**Confidence:** HIGH

## Summary

Phase 32 tich hop tat ca modules tu Phase 28-31 vao workflow `fix-bug.md` duy nhat, thay the 10 buoc v1.5 bang 5 buoc orchestrator. Day la phase "glue code" — tat ca building blocks da san sang (7 pure function modules, 5 agent files, 3 v1.5 modules), nhiem vu la viet markdown workflow dieu phoi chung dung thu tu va truyen dung du lieu.

Workflow hien tai (`fix-bug.md`) co 439 dong voi 10 buoc chi tiet. Phase nay giu lai preamble (purpose, required_reading) va Buoc 0.5, thay Buoc 1-10 bang 5 buoc orchestrator moi. Moi buoc goi pure functions da co san va spawn agents qua Claude Code Agent tool.

**Primary recommendation:** Viet lai `workflows/fix-bug.md` thanh orchestrator markdown, giu pattern "workflow = markdown, module = pure JS". Toan bo logic da nam trong modules — workflow chi can goi dung ham, spawn dung agent, truyen dung paths.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** Rewrite fix-bug.md thanh orchestrator moi. Giu lai preamble (purpose, required_reading) va Buoc 0.5 (phan tich bug). Thay toan bo Buoc 1-10 bang 5 buoc orchestrator.
- **D-02:** Backup fix-bug.md hien tai thanh `workflows/fix-bug-v1.5.md` truoc khi rewrite. Phase 33 dung lam reference/fallback cho --single mode.
- **D-03:** Ten file va invocation giu nguyen: `fix-bug.md`, user van goi `pd:fix-bug` nhu cu.
- **D-04:** Fail-forward voi warning: agent fail -> ghi warning vao SESSION.md, tiep tuc voi evidence co san. Chi STOP khi Janitor (Buoc 1) fail vi khong co trieu chung.
- **D-05:** Progressive disclosure bang milestone banners: moi buoc hien 1 banner ngan. Chi tiet agent an. Ket qua cuoi hien day du.
- **D-06:** DocSpec fail nhung Detective thanh cong -> tiep tuc voi evidence_code.md. DocSpec la bo sung, khong block workflow.
- **D-07:** Claude's Discretion — Claude tu chon cach tai su dung 3 modules v1.5 (debug-cleanup.js, logic-sync.js, regression-analyzer.js) trong Buoc 5.
- **D-08:** Commit message format: `fix([LOI]): mo ta`. Giu nguyen convention v1.5.
- **D-09:** Tao session ngay dau Buoc 1, sau Resume UI. User chon "Tao phien moi" hoac khong co session cu -> createSession() -> Janitor ghi evidence vao session dir.
- **D-10:** Tao bug record SAU user verify fix thanh cong. Flow: commit fix -> test pass -> user xac nhan -> createBugRecord() -> buildIndex() -> ghi INDEX.md.
- **D-11:** Session resolved SAU bug record + INDEX rebuild. Flow day du: fix commit -> user verify -> tao bug record -> rebuild INDEX.md -> updateSession(status=resolved).

### Claude's Discretion
- So luong plans va task breakdown cho Phase 32
- Chi tiet Buoc 0.5 giu nguyen bao nhieu tu v1.5
- Error message format cho milestone banners
- Unit test strategy cho orchestrator workflow (neu can)

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| FLOW-01 | Buoc 1 — Orchestrator spawn Janitor agent (scout/haiku) thu thap trieu chung va kiem tra session cu | Agent file `pd-bug-janitor.md` san sang; `session-manager.js` co createSession/listSessions; Agent tool spawn bang ten |
| FLOW-02 | Buoc 2 — Orchestrator spawn Code Detective + Doc Specialist song song sau Janitor | `parallel-dispatch.js` co buildParallelPlan/mergeParallelResults; `resource-config.js` co getParallelLimit()=2 |
| FLOW-03 | Buoc 3 — Repro Engineer tao Red Test tu evidence Buoc 2 | Agent file `pd-repro-engineer.md` san sang; doc evidence_janitor.md + evidence_code.md |
| FLOW-04 | Buoc 4 — Fix Architect tong hop evidence va ra phan quyet | Agent file `pd-fix-architect.md` san sang; `outcome-router.js` co buildRootCauseMenu/prepareFixNow; `checkpoint-handler.js` co extractCheckpointQuestion/buildContinuationContext |
| FLOW-05 | Buoc 5 — Orchestrator truc tiep sua code, commit [LOI], goi v1.5 modules | `debug-cleanup.js` (scanDebugMarkers, matchSecurityWarnings), `logic-sync.js` (runLogicSync), `regression-analyzer.js` (analyzeFromCallChain/analyzeFromSourceFiles); `bug-memory.js` (createBugRecord, buildIndex) |
| FLOW-08 | Progressive disclosure — an chi tiet agent, chi hien ket qua cuoi | Milestone banners trong workflow markdown; agent output khong hien truc tiep cho user |
</phase_requirements>

## Project Constraints (from CLAUDE.md)

- Dung tieng viet toan bo, co dau chuan

## Standard Stack

### Core (da co san — KHONG can cai them)

| Module | Purpose | Phase goc |
|--------|---------|-----------|
| `bin/lib/resource-config.js` | getModelForTier(), getAgentConfig(), getParallelLimit(), shouldDegrade() | Phase 28 |
| `bin/lib/session-manager.js` | createSession(), listSessions(), getSession(), updateSession() | Phase 29 |
| `bin/lib/evidence-protocol.js` | validateEvidence(), parseEvidence(), OUTCOME_TYPES | Phase 29 |
| `bin/lib/outcome-router.js` | buildRootCauseMenu(), prepareFixNow(), prepareFixPlan(), prepareSelfFix() | Phase 30 |
| `bin/lib/checkpoint-handler.js` | extractCheckpointQuestion(), buildContinuationContext() | Phase 30 |
| `bin/lib/parallel-dispatch.js` | buildParallelPlan(), mergeParallelResults() | Phase 30 |
| `bin/lib/bug-memory.js` | createBugRecord(), searchBugs(), buildIndex() | Phase 31 |
| `bin/lib/debug-cleanup.js` | scanDebugMarkers(), matchSecurityWarnings() | v1.5 |
| `bin/lib/logic-sync.js` | detectLogicChanges(), updateReportDiagram(), suggestClaudeRules(), runLogicSync() | v1.5 |
| `bin/lib/regression-analyzer.js` | analyzeFromCallChain(), analyzeFromSourceFiles() | v1.5 |

### Agent Files (da co san)

| Agent | Tier/Model | Buoc | File |
|-------|-----------|------|------|
| pd-bug-janitor | scout/haiku | 1 | `.claude/agents/pd-bug-janitor.md` |
| pd-code-detective | builder/sonnet | 2 | `.claude/agents/pd-code-detective.md` |
| pd-doc-specialist | scout/haiku | 2 | `.claude/agents/pd-doc-specialist.md` |
| pd-repro-engineer | builder/sonnet | 3 | `.claude/agents/pd-repro-engineer.md` |
| pd-fix-architect | architect/opus | 4 | `.claude/agents/pd-fix-architect.md` |

### Workflow Files

| File | Vai tro |
|------|---------|
| `workflows/fix-bug.md` | File chinh — se duoc REWRITE |
| `workflows/fix-bug-v1.5.md` | Se duoc TAO — backup v1.5 cho Phase 33 |
| `commands/pd/fix-bug.md` | Skill entry point — KHONG thay doi (chi tro den workflows/fix-bug.md) |

## Architecture Patterns

### Workflow Structure (sau rewrite)

```
workflows/fix-bug.md
  <purpose> ... </purpose>          # Giu nguyen tu v1.5
  <required_reading> ... </required_reading>  # Giu nguyen
  <process>
    Buoc 0.5: Phan tich bug         # Giu phan lon tu v1.5
    Buoc 1: Janitor                  # MOI — spawn agent
    Buoc 2: Detective + DocSpec      # MOI — spawn 2 agent song song
    Buoc 3: Repro Engineer           # MOI — spawn agent
    Buoc 4: Fix Architect            # MOI — spawn agent, route outcome
    Buoc 5: Fix + Commit             # MOI — orchestrator truc tiep fix
  </process>
  <rules> ... </rules>              # Cap nhat cho orchestrator mode
  <success_criteria> ... </success_criteria>  # Cap nhat
```

### Pattern 1: Agent Spawn va Evidence Chain

**What:** Orchestrator spawn agent qua Agent tool, truyen session dir path trong prompt. Agent ghi evidence file vao session dir. Agent sau doc evidence cua agent truoc.

**Evidence chain:**
```
Buoc 1: Janitor -> session_dir/evidence_janitor.md
Buoc 2: Detective -> session_dir/evidence_code.md
         DocSpec -> session_dir/evidence_docs.md
Buoc 3: Repro -> session_dir/evidence_repro.md
Buoc 4: Architect -> session_dir/evidence_architect.md
```

**Agent spawn pattern (trong markdown workflow):**
```markdown
Spawn Agent `pd-bug-janitor`:
  "Session dir: {session_dir}. Mo ta loi: {description}. Thuc hien thu thap trieu chung."
```

Claude Code Agent tool nhan ten agent (khop voi YAML `name` trong agent file) va prompt string. Agent doc instructions tu file `.claude/agents/{name}.md`.

### Pattern 2: Fail-Forward voi Warning (D-04)

**What:** Agent fail -> ghi warning vao SESSION.md, tiep tuc workflow.

**Logic:**
```
Janitor fail (khong co trieu chung) -> STOP workflow
Janitor fail (co trieu chung tu $ARGUMENTS) -> WARNING, tiep tuc
Detective fail -> WARNING, stop (critical path)
DocSpec fail -> WARNING, tiep tuc (D-06, non-critical)
Repro fail -> WARNING, tiep tuc (evidence tu Buoc 2 van con)
Architect fail -> hien evidence da co cho user tu chon
```

**Session update khi fail:**
```javascript
// Orchestrator goi updateSession() voi appendToBody
updateSession(currentMd, {
  appendToBody: '\n## Warning\n- DocSpec khong tra ket qua: timeout\n'
});
```

### Pattern 3: Progressive Disclosure (D-05, FLOW-08)

**What:** Workflow hien milestone banners ngan cho user. Chi tiet agent an.

**Banner format:**
```
--- Buoc 1/5: Thu thap trieu chung ---
--- Buoc 2/5: Phan tich code va tai lieu ---
--- Buoc 3/5: Tao test tai hien ---
--- Buoc 4/5: Tong hop va ra phan quyet ---
--- Buoc 5/5: Sua code va commit ---
```

### Pattern 4: Outcome Routing sau Buoc 4

**What:** Sau khi Architect tra evidence, orchestrator doc outcome va route:

```
outcome = root_cause -> buildRootCauseMenu() -> hien 3 lua chon cho user:
  fix_now -> prepareFixNow() -> Buoc 5 (orchestrator fix)
  fix_plan -> prepareFixPlan() -> ghi FIX-PLAN.md, DUNG
  self_fix -> prepareSelfFix() -> updateSession(paused), DUNG

outcome = checkpoint -> extractCheckpointQuestion() -> hoi user ->
  buildContinuationContext() -> spawn lai agent (max 2 vong)

outcome = inconclusive -> hien Elimination Log cho user, de xuat:
  (1) Bo sung thong tin -> quay Buoc 2 [ngoai scope Phase 32 — FLOW-06 la Phase 33]
  (2) Dung dieu tra -> updateSession(paused)
```

### Pattern 5: Session Lifecycle Day Du

**What:** Full lifecycle tu tao den dong:
```
Resume UI (AskUserQuestion + listSessions)
  -> User chon "Tao phien moi" HOAC tiep tuc phien cu
  -> createSession() (neu moi)
  -> Buoc 1-5
  -> User verify fix thanh cong
  -> createBugRecord()
  -> buildIndex() -> ghi INDEX.md
  -> updateSession(status='resolved')
```

### Anti-Patterns to Avoid

- **KHONG viet logic phuc tap trong markdown:** Logic da nam trong JS modules. Workflow chi goi ham, khong tinh toan.
- **KHONG de agent spawn agent:** Claude Code cam subagent spawning subagents. Chi orchestrator (workflow) moi spawn agent.
- **KHONG hardcode paths trong agent prompt:** Truyen session_dir qua prompt, agent dung path tuong doi tu do.
- **KHONG block workflow khi DocSpec fail:** DocSpec la optional (D-06). Workflow PHAI tiep tuc khi chi co evidence_code.md.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Session management | Custom session tracking | `session-manager.js` | Da xu ly slug, numbering, status |
| Evidence validation | Manual format checking | `evidence-protocol.js` | Da co OUTCOME_TYPES, requiredSections |
| Parallel agent dispatch | Custom parallel logic | `parallel-dispatch.js` | Da co buildParallelPlan, mergeParallelResults |
| Outcome routing | If/else cho 3 choices | `outcome-router.js` | Da co menu builder, action preparers |
| Checkpoint handling | Manual question extraction | `checkpoint-handler.js` | Da co extractCheckpointQuestion, buildContinuationContext |
| Bug record + index | Custom bug file creation | `bug-memory.js` | Da co createBugRecord, buildIndex |
| Debug cleanup | Manual marker scan | `debug-cleanup.js` | Da co scanDebugMarkers, matchSecurityWarnings |
| Logic sync | Custom diff analysis | `logic-sync.js` | Da co runLogicSync pipeline |
| Regression analysis | Manual dependency scan | `regression-analyzer.js` | Da co 2 modes: FastCode + BFS fallback |

**Key insight:** Phase 32 la integration phase — KHONG viet module moi. Tat ca logic da nam trong 10 modules. Chi can viet workflow markdown goi chung dung thu tu.

## Common Pitfalls

### Pitfall 1: Session dir path inconsistency
**What goes wrong:** Agent nhan sai path, ghi evidence nham folder.
**Why it happens:** Session folder la `S{NNN}-{slug}/` duoi `.planning/debug/`. Neu khong truyen absolute path, agent co the ghi nham.
**How to avoid:** Workflow tinh absolute path = `.planning/debug/{folderName}/` va truyen qua prompt cho moi agent.
**Warning signs:** Evidence files khong xuat hien trong session dir.

### Pitfall 2: Outcome routing khong xu ly tat ca cases
**What goes wrong:** Architect tra outcome la checkpoint nhung workflow chi expect root_cause.
**Why it happens:** Co 3 outcomes (root_cause, checkpoint, inconclusive) — de bo sot.
**How to avoid:** Workflow PHAI xu ly ca 3 outcomes sau moi buoc spawn agent. Dung validateEvidence() de xac nhan outcome truoc khi route.
**Warning signs:** Workflow im lang khi agent tra checkpoint.

### Pitfall 3: Resume UI khong khop voi session manager API
**What goes wrong:** listSessions() can folderNames va sessionData, nhung workflow chi truyen folderNames.
**Why it happens:** listSessions() la pure function, can ca 2 inputs de filter resolved sessions.
**How to avoid:** Workflow phai Glob `.planning/debug/S*` lay folderNames, roi Read moi SESSION.md de lay sessionData.
**Warning signs:** Tat ca sessions (ke ca resolved) deu hien trong Resume UI.

### Pitfall 4: Parallel dispatch nhung Agent tool la sequential
**What goes wrong:** Workflow viet "spawn song song" nhung Claude Code Agent tool thuc te la sequential.
**Why it happens:** Claude Code Agent tool spawn 1 agent tai 1 thoi diem. "Song song" o day la intent, khong phai runtime parallel.
**How to avoid:** Workflow ghi ro: "Spawn Detective truoc, roi DocSpec. Ca 2 doc evidence_janitor.md (khong xung dot)." Dung buildParallelPlan() de lay config, nhung spawn sequential. mergeParallelResults() van hoat dong dung.
**Warning signs:** Hieu nham rang 2 agents chay dong thoi tren 2 threads.

### Pitfall 5: Bug record tao truoc khi user verify
**What goes wrong:** Bug record co status=resolved nhung user chua xac nhan fix dung.
**Why it happens:** Workflow goi createBugRecord() ngay sau commit thay vi sau user verify.
**How to avoid:** Theo D-10: commit fix -> test pass -> user xac nhan -> createBugRecord() -> buildIndex().
**Warning signs:** Bug records co resolved_date nhung user chua bao "da sua".

### Pitfall 6: V1.5 modules goi trong Buoc 5 khong co error handling
**What goes wrong:** scanDebugMarkers() throw khi stagedFiles la null, lam dung workflow.
**Why it happens:** V1.5 modules throw Error khi input invalid (strict validation).
**How to avoid:** Wrap moi v1.5 module call trong try/catch. Loi -> ghi warning, tiep tuc (non-blocking per D-04).
**Warning signs:** Workflow crash o Buoc 5 voi "thieu tham so".

## Code Examples

### Resume UI Pattern
```markdown
## Buoc 0: Resume UI

1. `mkdir -p .planning/debug`
2. Glob `.planning/debug/S*` -> lay danh sach folder names
3. Voi moi folder, Read `SESSION.md` -> lay content
4. Goi listSessions(folderNames, sessionData) -> danh sach sessions chua resolved
5. Neu co sessions:
   Hien: "Phien dieu tra dang mo:"
   | # | ID | Mo ta | Trang thai |
   Hoi: "Nhap so de tiep tuc, hoac mo ta loi moi de tao phien."
6. User chon so -> doc session, nhay buoc phu hop
7. User nhap mo ta -> createSession() -> tao folder moi -> Buoc 1
```

### Agent Spawn + Evidence Read Pattern
```markdown
## Buoc 1: Thu thap trieu chung

Banner: "--- Buoc 1/5: Thu thap trieu chung ---"

Spawn Agent `pd-bug-janitor`:
  "Session dir: {absolute_session_dir}.
   Mo ta loi: {user_description}.
   Thu thap 5 trieu chung cot loi va ghi evidence_janitor.md."

Sau khi agent hoan tat:
- Read `{session_dir}/evidence_janitor.md`
- validateEvidence(content) -> kiem tra format
- Neu valid=false VA khong co trieu chung -> STOP: "Khong du thong tin de dieu tra."
- Neu valid=false NHUNG co trieu chung -> WARNING, tiep tuc
- Cap nhat SESSION.md: tick evidence_janitor.md
```

### Buoc 2: Parallel Dispatch
```markdown
## Buoc 2: Phan tich code va tai lieu

Banner: "--- Buoc 2/5: Phan tich code va tai lieu ---"

1. buildParallelPlan(sessionDir, janitarEvidencePath) -> plan
2. Spawn Agent `pd-code-detective`:
   "Session dir: {session_dir}. Doc evidence_janitor.md va phan tich code."
3. Read evidence_code.md -> detectiveResult
4. Spawn Agent `pd-doc-specialist`:
   "Session dir: {session_dir}. Doc evidence_janitor.md va tra cuu thu vien."
5. Read evidence_docs.md -> docSpecResult (co the null neu fail)
6. mergeParallelResults({ detectiveResult, docSpecResult }) -> merged
7. Ghi warnings vao SESSION.md
8. Neu Detective fail -> STOP hoac tiep tuc tuy evidence con san
```

### Buoc 4: Outcome Routing
```markdown
## Buoc 4: Tong hop va ra phan quyet

Banner: "--- Buoc 4/5: Tong hop va ra phan quyet ---"

Spawn Agent `pd-fix-architect`:
  "Session dir: {session_dir}. Doc tat ca evidence files va ra phan quyet."

Read evidence_architect.md -> architect evidence
validateEvidence(content) -> { outcome }

NEU outcome = root_cause:
  buildRootCauseMenu(evidence) -> { question, choices }
  Hien question va 3 lua chon cho user (AskUserQuestion)
  User chon fix_now -> prepareFixNow(evidence) -> Buoc 5
  User chon fix_plan -> prepareFixPlan(evidence, sessionDir) -> ghi FIX-PLAN.md, DUNG
  User chon self_fix -> prepareSelfFix(evidence) -> updateSession(paused), DUNG

NEU outcome = checkpoint:
  extractCheckpointQuestion(evidence) -> { question }
  Hoi user (AskUserQuestion)
  buildContinuationContext(...) -> { canContinue, prompt }
  canContinue = true -> spawn lai Architect voi continuation prompt
  canContinue = false -> thong bao: "Da vuot 2 vong, can nguoi xem xet"

NEU outcome = inconclusive:
  Hien Elimination Log cho user
  De xuat: (1) Bo sung info, (2) Dung dieu tra
  User chon dung -> updateSession(paused)
```

### Buoc 5: Fix + Commit + Post-fix
```markdown
## Buoc 5: Sua code va commit

Banner: "--- Buoc 5/5: Sua code va commit ---"

### 5a: Regression analysis (truoc khi sua)
Try: analyzeFromCallChain() hoac analyzeFromSourceFiles()
Catch: warning, tiep tuc

### 5b: Sua code
Doc De xuat tu evidence_architect.md
Ap dung fix, chay test

### 5c: Debug cleanup (truoc commit)
git diff --cached --name-only -> staged files
scanDebugMarkers(stagedFiles) -> markers
Neu co markers -> hoi user xoa?
matchSecurityWarnings(reportContent, filePaths) -> warnings (non-blocking)

### 5d: Commit
git commit -m "fix([LOI]): {mo_ta}"

### 5e: User verify
Hoi: "Da sua {mo ta}. Vui long kiem tra va xac nhan."
User xac nhan OK:
  -> createBugRecord({file, functionName, errorMessage, sessionId, rootCause, fix})
  -> Glob .planning/bugs/BUG-*.md -> parse all -> buildIndex() -> ghi INDEX.md
  -> updateSession(currentMd, { status: 'resolved' })

User xac nhan CHUA:
  -> Thu thap them trieu chung moi
  -> Quay Buoc 5b (fix lai)

### 5f: Logic sync (non-blocking, sau user verify)
git diff HEAD~1 -> diffText
runLogicSync({ diffText, bugReportContent, sessionContent, ... }) -> results
Neu co rules suggestions -> hoi user
```

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Node.js built-in test runner (node:test) v24.14.1 |
| Config file | Khong co — chay truc tiep qua `node --test` |
| Quick run command | `node --test test/smoke-*.test.js` |
| Full suite command | `npm test` |

### Phase Requirements -> Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| FLOW-01 | Janitor spawn va evidence chain | smoke | `node --test test/smoke-session-manager.test.js` (session creation) | Co (test session da co) |
| FLOW-02 | Detective+DocSpec song song | smoke | `node --test test/smoke-parallel-dispatch.test.js` | Co |
| FLOW-03 | Repro Engineer spawn | manual-only | N/A — agent spawn la markdown, khong test duoc bang unit test | N/A |
| FLOW-04 | Architect outcome routing | smoke | `node --test test/smoke-outcome-router.test.js` + `node --test test/smoke-checkpoint-handler.test.js` | Co |
| FLOW-05 | Fix + commit + bug record | smoke | `node --test test/smoke-bug-memory.test.js` + `node --test test/smoke-debug-cleanup.test.js` + `node --test test/smoke-logic-sync.test.js` | Co |
| FLOW-08 | Progressive disclosure | manual-only | N/A — banner text trong markdown | N/A |

### Sampling Rate
- **Per task commit:** `node --test test/smoke-*.test.js` (tat ca modules van pass sau rewrite)
- **Per wave merge:** `npm test`
- **Phase gate:** Full suite green truoc `/gsd:verify-work`

### Wave 0 Gaps
- Khong can tao test moi — tat ca modules da co smoke tests tu Phase 28-31
- Workflow la markdown file, khong co unit test cho markdown
- Validation bang manual: chay `pd:fix-bug` voi 1 bug thuc te

## Sources

### Primary (HIGH confidence)
- Source code truc tiep: 10 modules JS da doc va phan tich chi tiet
- 5 agent files da doc
- `workflows/fix-bug.md` v1.5 (439 dong) da doc toan bo
- `commands/pd/fix-bug.md` skill entry point da doc

### Secondary (HIGH confidence)
- `32-CONTEXT.md` — 11 locked decisions va canonical refs
- Phase 28-31 context files (referenced nhung khong can doc lai — decisions da duoc tong hop trong 32-CONTEXT.md)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — tat ca modules da doc source code truc tiep, verified APIs
- Architecture: HIGH — patterns da duoc thiet lap tu Phase 28-31, chi can tich hop
- Pitfalls: HIGH — da phan tich module APIs va xac dinh edge cases tu source code

**Research date:** 2026-03-25
**Valid until:** 2026-04-25 (stable — internal codebase, khong co external dependencies moi)
