# Phase 35: Fix Evidence Encoding & Critical Wiring - Research

**Researched:** 2026-03-25
**Domain:** Integration wiring fixes — evidence encoding, checkpoint params, path resolution, bug record params, session write-back
**Confidence:** HIGH

## Summary

Phase 35 la gap closure cuoi cung cua v2.1 milestone, sua 5 integration issues (INT-01 den INT-05) da duoc xac dinh trong v2.1-MILESTONE-AUDIT.md. Tat ca issues deu la wiring bugs — code logic dung nhung cac module khong khop nhau ve encoding, params, hoac missing calls.

Van de nghiem trong nhat (P0) la encoding mismatch: evidence-protocol.js dinh nghia section names bang ASCII khong dau (`Nguyen nhan`, `Bang chung`, `De xuat`) nhung 5 agent files ghi headings bang Unicode co dau (`Nguyên nhân`, `Bằng chứng`, `Đề xuất`). Dieu nay khien validateEvidence() luon fail va section lookups luon tra ve empty string cho real agent output.

Cac van de con lai (INT-02 den INT-05) la: roundNumber undefined khi goi buildContinuationContext, FIX-PLAN.md ghi vao sai path, createBugRecord thieu existingBugs param, va SESSION.md write-back bi thieu tai 2 vi tri. Tat ca deu co fix direction ro rang va chi can sua text trong workflow markdown hoac constants trong JS modules.

**Primary recommendation:** Sua encoding mismatch bang cach doi evidence-protocol.js (va outcome-router.js, checkpoint-handler.js) sang Unicode co dau de khop voi agent output. Dong thoi update tests va snapshots.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** Dong bo section names giua evidence-protocol.js/outcome-router.js/checkpoint-handler.js va 5 agent files. Ca hai phia deu can kiem tra va dong bo.
- **D-02:** Chon 1 huong: sua module JS de nhan dang ca ASCII lan Unicode, HOAC sua agent prompts de ghi ASCII. Claude quyet dinh cach nao it tac dong nhat.
- **D-03:** Khoi tao roundNumber = 1 truoc khi goi buildContinuationContext trong fix-bug.md. Doc tu SESSION.md neu la vong tiep theo.
- **D-04:** Doi planPath thanh `{session_dir}/FIX-PLAN.md` trong fix-bug.md — khong ghi vao project root.
- **D-05:** Truyen existingBugs tu Glob result truoc khi goi createBugRecord. Dung `result.content` thay vi `result.bugRecordMd`.
- **D-06:** Them Read -> updateSession -> write-back pattern tai 2 vi tri: isHeavyAgent warning (Buoc 2) va Repro FAIL (Buoc 3).
- **D-07:** Cap nhat REQUIREMENTS.md checkboxes ORCH-01/02 va MEM-01..04 thanh [x] sau khi fix xong.

### Claude's Discretion
- So luong plans va task breakdown
- Chon encoding direction cho INT-01 (ASCII vs Unicode vs dual-accept)
- Test strategy — them tests moi hay chi verify existing tests pass
- Snapshot regeneration strategy

### Deferred Ideas (OUT OF SCOPE)
None — gap closure phase, scope fixed by milestone audit
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| PROT-02 | Moi agent tra ket qua theo 1 trong 3 outcomes chuan | INT-01 fix: encoding dong bo de validateEvidence() PASS cho real output |
| PROT-03 | ROOT CAUSE -> user chon 1 trong 3 | INT-01 (section lookups) + INT-03 (FIX-PLAN path) |
| PROT-04 | CHECKPOINT -> orchestrator hien cau hoi va truyen cho agent tiep | INT-02 fix: roundNumber khoi tao = 1 |
| PROT-05 | INCONCLUSIVE -> agent ghi Elimination Log | INT-01 fix: encoding dong bo de section validation pass |
| PROT-06 | CHECKPOINT -> orchestrator spawn continuation agent voi context | INT-02 fix: roundNumber = 1 de canContinue = true lan dau |
| MEM-04 | Tu dong tao va cap nhat bugs/INDEX.md | INT-04 fix: truyen existingBugs de ID tang dung |
| ORCH-03 | Heavy Lock — chi 1 tac vu nang tai 1 thoi diem | INT-05 fix: SESSION.md write-back tai isHeavyAgent warning |
| FLOW-01 | Buoc 1 — Janitor thu thap trieu chung | INT-01 fix: validateEvidence pass cho Janitor output |
| FLOW-02 | Buoc 2 — Detective + DocSpec | INT-01 fix: validateEvidence pass + INT-05 write-back |
| FLOW-03 | Buoc 3 — Repro Engineer | INT-05 fix: SESSION.md write-back tai Repro FAIL |
| FLOW-04 | Buoc 4 — Fix Architect tong hop va phan quyet | INT-01 fix: section lookups tra ve noi dung thuc |
| FLOW-05 | Buoc 5 — Sua code, commit, bug record | INT-04 fix: createBugRecord nhan existingBugs |
</phase_requirements>

## Project Constraints (from CLAUDE.md)

- Dung tieng Viet toan bo, co dau chuan — ap dung cho comments, messages, documentation

## Architecture Patterns

### Encoding Mismatch Analysis (INT-01 — P0)

**Hien trang:**
- `evidence-protocol.js` OUTCOME_TYPES dinh nghia requiredSections bang ASCII khong dau:
  - root_cause: `['Nguyen nhan', 'Bang chung', 'De xuat']`
  - checkpoint: `['Tien do dieu tra', 'Cau hoi cho User', 'Context cho Agent tiep']`
  - inconclusive: `['Elimination Log', 'Huong dieu tra tiep']`
- 5 agent files (.claude/agents/pd-*.md) huong dan agents ghi headings Unicode co dau:
  - `## Nguyên nhân`, `## Bằng chứng`, `## Đề xuất`
  - `## Tiến độ điều tra`, `## Câu hỏi cho User`, `## Context cho Agent tiếp`
  - `## Hướng điều tra tiếp`
- `outcome-router.js` lookup sections bang ASCII: `parsed.sections['Nguyen nhan']`, `parsed.sections['Bang chung']`, `parsed.sections['De xuat']`
- `checkpoint-handler.js` lookup sections bang ASCII: `parsed.sections['Cau hoi cho User']`, `parsed.sections['Context cho Agent tiep']`

**Recommendation: Doi JS modules sang Unicode co dau (it tac dong nhat)**

Ly do:
1. CLAUDE.md yeu cau "Dung tieng Viet toan bo, co dau chuan" — modules nen tuan thu
2. Agent output la runtime content tu LLM — khong kiem soat duoc 100% neu yeu cau bo dau
3. Sua 3 JS files (constants + lookups) de dong nhat — chi can doi strings
4. Tests hien tai dung ASCII — can update cung, nhung tests nam trong tam kiem soat
5. Agent prompts da co san headings Unicode — khong can sua
6. Dual-accept (nhan ca ASCII lan Unicode) phuc tap hon can thiet va tao ambiguity

**Files can sua cho INT-01:**
```
bin/lib/evidence-protocol.js  — OUTCOME_TYPES requiredSections: doi ASCII -> Unicode
bin/lib/outcome-router.js     — 4 section lookups: doi key ASCII -> Unicode
bin/lib/checkpoint-handler.js  — 2 section lookups: doi key ASCII -> Unicode
test/smoke-evidence-protocol.test.js — doi test data + assertions sang Unicode
test/smoke-outcome-router.test.js    — doi test data sang Unicode
test/smoke-checkpoint-handler.test.js — doi test data sang Unicode
```

**Section name mapping (ASCII -> Unicode):**

| ASCII (hien tai trong JS) | Unicode (hien tai trong agents) |
|---------------------------|--------------------------------|
| `Nguyen nhan` | `Nguyên nhân` |
| `Bang chung` | `Bằng chứng` |
| `De xuat` | `Đề xuất` |
| `Tien do dieu tra` | `Tiến độ điều tra` |
| `Cau hoi cho User` | `Câu hỏi cho User` |
| `Context cho Agent tiep` | `Context cho Agent tiếp` |
| `Huong dieu tra tiep` | `Hướng điều tra tiếp` |
| `Elimination Log` | `Elimination Log` (da khop — tieng Anh) |

**Confidence:** HIGH — da doc truc tiep source code va so sanh.

### roundNumber Initialization (INT-02 — P1)

**Hien trang:**
- `fix-bug.md` dong 233 goi `buildContinuationContext({ ..., currentRound: roundNumber, ... })`
- `roundNumber` khong duoc khoi tao truoc do — undefined
- `buildContinuationContext` line 67: `canContinue = currentRound <= MAX_CONTINUATION_ROUNDS`
- `undefined <= 2` = false trong JavaScript → canContinue luon = false ngay lan dau

**Fix:**
- Them dong `roundNumber = 1` truoc block CHECKPOINT trong Buoc 4
- Neu la vong tiep theo (quay lai Buoc 4), roundNumber tang len 2
- Day la markdown workflow — chi can them text huong dan

**Confidence:** HIGH — da verify logic JS va workflow text.

### FIX-PLAN Path Resolution (INT-03 — P2)

**Hien trang:**
- `prepareFixPlan()` trong outcome-router.js dong 125 tra ve `planPath: 'FIX-PLAN.md'` (relative)
- `fix-bug.md` dong 218 ghi: `Ghi planContent vao planPath` — khong resolve voi session_dir
- Ket qua: FIX-PLAN.md ghi vao project root thay vi session dir

**Fix co 2 option:**
1. Sua outcome-router.js `prepareFixPlan()` de tra ve full path `${sessionDir}/FIX-PLAN.md` — DAY LA OPTION TOT HON vi module da nhan sessionDir param
2. Sua fix-bug.md de resolve `{session_dir}/{planPath}` — cung duoc nhung phai sua workflow text

**Recommendation:** Sua ca hai:
- outcome-router.js: doi `planPath: 'FIX-PLAN.md'` thanh `planPath: \`${sessionDir}/FIX-PLAN.md\``
- fix-bug.md: doi "Ghi planContent vao planPath" thanh "Ghi planContent vao {session_dir}/FIX-PLAN.md"
- Test prepareFixPlan assertion: doi `assert.equal(result.planPath, 'FIX-PLAN.md')` thanh kiem tra planPath chua session_dir

**Confidence:** HIGH — da doc source code truc tiep.

### createBugRecord Params (INT-04 — P2)

**Hien trang:**
- `fix-bug.md` dong 323-325:
  ```
  Goi `createBugRecord({ file: targetFile, ... })` tu `bin/lib/bug-memory.js`
     -> bugRecordMd
  Ghi bugRecordMd vao `.planning/bugs/BUG-{NNN}.md`
  ```
- Van de 1: KHONG truyen `existingBugs` param → default = [] → luon tao BUG-001
- Van de 2: Return value ten `bugRecordMd` nhung createBugRecord tra ve `{ id, fileName, content, number }` — khong co field `bugRecordMd`, field la `content`

**Fix trong fix-bug.md:**
1. Truoc khi goi createBugRecord, them buoc: `Glob .planning/bugs/BUG-*.md -> parse so tu filenames -> tao existingBugs array`
2. Truyen `existingBugs` vao createBugRecord call
3. Doi `bugRecordMd` thanh `result.content` (hoac `bugRecord.content`)
4. Dong 325-326: Dung `result.fileName` thay vi hardcode `BUG-{NNN}.md`, hoac dung `result.id`

**Confidence:** HIGH — da doc createBugRecord signature va fix-bug.md text.

### SESSION.md Write-back Gaps (INT-05 — P3)

**Hien trang — 2 vi tri thieu write-back:**

**Vi tri 1: isHeavyAgent warning (Buoc 2, dong 107-108)**
- fix-bug.md dong 108: `Ghi warning vao {session_dir}/SESSION.md qua updateSession() neu co`
- Nhung thieu pattern day du: Read SESSION.md -> goi updateSession -> ghi ket qua

**Vi tri 2: Repro FAIL (Buoc 3, dong 189-191)**
- fix-bug.md dong 189-190: `WARNING: "Khong tao duoc test tai hien. Tiep tuc voi evidence phan tich."` va `Ghi warning vao SESSION.md qua updateSession()`
- Nhung thieu Read -> updateSession -> Write pattern cu the

**Fix:** Them pattern day du giong cac vi tri khac:
```
Read `{session_dir}/SESSION.md` -> currentMd
Goi `updateSession(currentMd, { appendToBody: '...' })` tu `bin/lib/session-manager.js`
Ghi ket qua sessionMd vao `{session_dir}/SESSION.md`
```

**Confidence:** HIGH — pattern da co san o nhieu vi tri khac trong fix-bug.md (dong 94-95, 141-142, 185-186).

### Documentation Sync (D-07)

**Hien trang:**
- REQUIREMENTS.md co 6 checkboxes can cap nhat:
  - `[ ] ORCH-01` → `[x]` (da satisfied theo audit)
  - `[ ] ORCH-02` → `[x]` (da satisfied theo audit)
  - `[ ] MEM-01` → `[x]` (da partial → verified qua Phase 35 fix)
  - `[ ] MEM-02` → `[x]` (da partial → verified qua Phase 35 fix)
  - `[ ] MEM-03` → `[x]` (da partial → verified qua Phase 35 fix)
  - `[ ] MEM-04` → `[x]` (da partial → verified qua Phase 35 fix)
- Ngoai ra REQUIREMENTS.md dong 89-104 co Traceability table can update Status tu Pending -> Complete

**Confidence:** HIGH — da doc REQUIREMENTS.md va audit report.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Unicode normalization | Custom regex strip diacritics | Doi constants truc tiep sang Unicode | Don gian nhat, khong can runtime normalization |
| Bug ID sequencing | Manual file counting | existingBugs param cua createBugRecord() | Module da xu ly max+1 logic |
| Session write-back | Custom file I/O | updateSession() tu session-manager.js | Pattern da chuan hoa, xu ly frontmatter dung |

## Common Pitfalls

### Pitfall 1: Test data van dung ASCII sau khi sua constants
**What goes wrong:** Doi OUTCOME_TYPES sang Unicode nhung quen update test fixtures — tests fail
**Why it happens:** Tests co helper `makeEvidence()` va body constants dung ASCII headings
**How to avoid:** Moi file test can update: BODY_ROOT_CAUSE, BODY_CHECKPOINT, BODY_INCONCLUSIVE, va tat ca inline evidence strings
**Warning signs:** Tests fail voi "thieu section: ## Nguyên nhân"

### Pitfall 2: Snapshot tests fail sau encoding change
**What goes wrong:** Snapshot tests co the reference section names
**Why it happens:** Snapshots duoc generate tu converter output — co the khong lien quan truc tiep
**How to avoid:** Chay full test suite sau moi thay doi, regenerate snapshots neu can
**Warning signs:** smoke-snapshot.test.js failures

### Pitfall 3: outcome-router.js prepareFixPlan planPath
**What goes wrong:** Sua planPath trong prepareFixPlan nhung khong sua test assertion
**Why it happens:** Test hien tai assert `result.planPath === 'FIX-PLAN.md'`
**How to avoid:** Update test de kiem tra planPath chua sessionDir prefix
**Warning signs:** Test fail o prepareFixPlan

### Pitfall 4: fix-bug.md la markdown khong phai code
**What goes wrong:** Sua workflow markdown nhung khong thay doi duoc runtime behavior
**Why it happens:** fix-bug.md la instruction cho Claude, khong phai executable code
**How to avoid:** Hieu rang moi "fix" trong fix-bug.md la thay doi text huong dan, khong phai code patch
**Warning signs:** Confusing markdown edits with code changes

### Pitfall 5: REQUIREMENTS.md checkbox update thieu Traceability
**What goes wrong:** Cap nhat checkboxes nhung khong update Traceability table Status
**Why it happens:** Traceability table o cuoi file de quen
**How to avoid:** Cap nhat ca checkboxes LAN Traceability table Status trong cung 1 task
**Warning signs:** Inconsistency giua checkbox va table

## Code Examples

### INT-01: Evidence Protocol Unicode constants

```javascript
// Truoc (ASCII):
const OUTCOME_TYPES = {
  root_cause:   { label: 'ROOT CAUSE FOUND',          requiredSections: ['Nguyen nhan', 'Bang chung', 'De xuat'] },
  checkpoint:   { label: 'CHECKPOINT REACHED',         requiredSections: ['Tien do dieu tra', 'Cau hoi cho User', 'Context cho Agent tiep'] },
  inconclusive: { label: 'INVESTIGATION INCONCLUSIVE', requiredSections: ['Elimination Log', 'Huong dieu tra tiep'] },
};

// Sau (Unicode co dau):
const OUTCOME_TYPES = {
  root_cause:   { label: 'ROOT CAUSE FOUND',          requiredSections: ['Nguyên nhân', 'Bằng chứng', 'Đề xuất'] },
  checkpoint:   { label: 'CHECKPOINT REACHED',         requiredSections: ['Tiến độ điều tra', 'Câu hỏi cho User', 'Context cho Agent tiếp'] },
  inconclusive: { label: 'INVESTIGATION INCONCLUSIVE', requiredSections: ['Elimination Log', 'Hướng điều tra tiếp'] },
};
```

### INT-01: Outcome Router section lookup update

```javascript
// Truoc:
const rootCause = parsed.sections['Nguyen nhan'] || 'Khong co mo ta';
const evidence = parsed.sections['Bang chung'] || '';
const suggestion = parsed.sections['De xuat'] || '';

// Sau:
const rootCause = parsed.sections['Nguyên nhân'] || 'Khong co mo ta';
const evidence = parsed.sections['Bằng chứng'] || '';
const suggestion = parsed.sections['Đề xuất'] || '';
```

### INT-01: Checkpoint Handler section lookup update

```javascript
// Truoc:
const question = parsed.sections['Cau hoi cho User'] || '';
const context = parsed.sections['Context cho Agent tiep'] || '';

// Sau:
const question = parsed.sections['Câu hỏi cho User'] || '';
const context = parsed.sections['Context cho Agent tiếp'] || '';
```

### INT-03: prepareFixPlan planPath fix

```javascript
// Truoc:
return {
  action: 'fix_plan',
  planContent,
  planPath: 'FIX-PLAN.md',
  warnings: [],
};

// Sau:
return {
  action: 'fix_plan',
  planContent,
  planPath: `${sessionDir}/FIX-PLAN.md`,
  warnings: [],
};
```

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Node.js built-in test runner (node:test) |
| Config file | none — uses node --test directly |
| Quick run command | `node --test test/smoke-evidence-protocol.test.js test/smoke-outcome-router.test.js test/smoke-checkpoint-handler.test.js test/smoke-bug-memory.test.js` |
| Full suite command | `node --test test/smoke-*.test.js` |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| PROT-02 | validateEvidence PASS cho Unicode headings | unit | `node --test test/smoke-evidence-protocol.test.js` | Co — can update test data |
| PROT-03 | planPath resolve vao session_dir | unit | `node --test test/smoke-outcome-router.test.js` | Co — can update assertion |
| PROT-04 | buildContinuationContext voi currentRound=1 | unit | `node --test test/smoke-checkpoint-handler.test.js` | Co — da test round=1 |
| PROT-05 | Elimination Log validation pass Unicode | unit | `node --test test/smoke-evidence-protocol.test.js` | Co — da test |
| PROT-06 | Continuation agent nhan canContinue=true round 1 | unit | `node --test test/smoke-checkpoint-handler.test.js` | Co — da test |
| MEM-04 | createBugRecord voi existingBugs tang ID dung | unit | `node --test test/smoke-bug-memory.test.js` | Co — da test |
| ORCH-03 | SESSION.md write-back pattern | manual | Verify workflow text | N/A (workflow markdown) |
| FLOW-01..05 | E2E flow hoat dong | manual | Verify workflow text | N/A (workflow markdown) |

### Sampling Rate
- **Per task commit:** `node --test test/smoke-evidence-protocol.test.js test/smoke-outcome-router.test.js test/smoke-checkpoint-handler.test.js test/smoke-bug-memory.test.js`
- **Per wave merge:** `node --test test/smoke-*.test.js`
- **Phase gate:** Full suite green truoc /gsd:verify-work

### Wave 0 Gaps
None — existing test infrastructure covers all phase requirements. Chi can update test data tu ASCII sang Unicode.

## Open Questions

1. **Snapshot regeneration**
   - What we know: Snapshots nam trong test/snapshots/ cho 4 platforms (codex, copilot, gemini, opencode). Day la converter output snapshots, KHONG lien quan truc tiep den evidence encoding.
   - What's unclear: Lieu thay doi encoding co anh huong converter snapshots khong
   - Recommendation: Chay snapshot tests sau encoding fix. Neu fail, regenerate. Kha nang cao la KHONG anh huong vi converters khong dung evidence-protocol.

2. **smoke-integrity.test.js regression**
   - What we know: 56 tests pass hien tai. Integrity tests kiem tra workflow text.
   - What's unclear: Lieu thay doi text trong fix-bug.md co break integrity tests khong
   - Recommendation: Chay sau moi thay doi fix-bug.md. Integrity tests kiem tra patterns cu the — can verify.

## Sources

### Primary (HIGH confidence)
- `bin/lib/evidence-protocol.js` — Doc truc tiep, line 31-33: OUTCOME_TYPES ASCII definitions
- `bin/lib/outcome-router.js` — Doc truc tiep, line 57-83: section lookups ASCII keys
- `bin/lib/checkpoint-handler.js` — Doc truc tiep, line 41-42: section lookups ASCII keys
- `bin/lib/bug-memory.js` — Doc truc tiep, line 32-66: createBugRecord signature va return
- `.claude/agents/pd-*.md` (5 files) — Doc truc tiep: Unicode headings trong output format
- `workflows/fix-bug.md` — Doc truc tiep: roundNumber undefined, planPath issue, write-back gaps
- `.planning/v2.1-MILESTONE-AUDIT.md` — Doc truc tiep: INT-01..INT-05 gap descriptions
- Test files (4) — Doc truc tiep: hien tai dung ASCII test data, all 77 tests pass

## Metadata

**Confidence breakdown:**
- Encoding fix (INT-01): HIGH — da verify source code ca 2 phia, mapping ro rang
- roundNumber fix (INT-02): HIGH — da verify JS undefined <= 2 behavior
- planPath fix (INT-03): HIGH — da doc prepareFixPlan return va workflow text
- createBugRecord fix (INT-04): HIGH — da verify function signature va return shape
- Write-back fix (INT-05): HIGH — da so sanh pattern voi cac vi tri da co
- Test updates: HIGH — da doc tat ca test files, biet chinh xac diem can sua
- Documentation sync: HIGH — da doc REQUIREMENTS.md va audit report

**Research date:** 2026-03-25
**Valid until:** 2026-04-25 (stable — internal wiring fixes, khong phu thuoc external deps)
