<purpose>
Dieu phoi 5 agents dieu tra va sua loi theo phuong phap khoa hoc: thu thap trieu chung (Janitor) -> phan tich code + tai lieu (Detective + DocSpec) -> tao test tai hien (Repro) -> tong hop va ra phan quyet (Architect) -> sua code va commit (Orchestrator truc tiep).
Luu trang thai dieu tra (.planning/debug/) de tiep tuc khi hoi thoai bi mat. Lap den khi user xac nhan.
</purpose>

<required_reading>
Doc truoc khi bat dau:
- @references/conventions.md -> version matching, patch version, bieu tuong, commit prefixes
</required_reading>

<conditional_reading>
Doc CHI KHI can:
- @references/prioritization.md -> phan loai rui ro bug -- KHI nhieu bugs can uu tien
</conditional_reading>

<process>

## Buoc 0: Resume UI

`git rev-parse --git-dir 2>/dev/null` -> luu `HAS_GIT`
`mkdir -p .planning/debug`

1. Glob `.planning/debug/S*` -> lay danh sach folder names
2. Voi moi folder, Read `{folder}/SESSION.md` -> lay content
3. Goi `listSessions(folderNames, sessionContents)` tu `bin/lib/session-manager.js`
   - folderNames: mang ten folders (VD: `['S001-login-timeout', 'S002-cart-empty']`)
   - sessionContents: mang `[{folderName, sessionMdContent}]`
   - Tra ve danh sach sessions chua resolved, gom { number, id, slug, status, outcome, updated }
4. Neu co sessions active/paused:
   Hien bang:
   ```
   Phien dieu tra dang mo:
   | # | ID   | Mo ta            | Trang thai |
   |---|------|------------------|------------|
   | 1 | S001 | login-timeout    | active     |
   | 2 | S003 | cart-empty       | paused     |
   ```
   Hoi: "Nhap so de tiep tuc, hoac mo ta loi moi de tao phien."
5. User nhap so -> doc SESSION.md cua phien do -> xac dinh buoc tiep theo tu status:
   - status=active -> Buoc 1 (tiep tuc voi session hien tai, truyen session_dir)
   - status=paused -> doc evidence files da co -> nhay buoc phu hop
6. User nhap mo ta moi -> Buoc 0.5
7. Khong co sessions nao VA co $ARGUMENTS -> Buoc 0.5
8. Khong co sessions nao VA khong co $ARGUMENTS -> hoi user mo ta loi -> Buoc 0.5

## Buoc 0.5: Phan tich bug -- quyet dinh tai lieu tham khao

- Nhieu bugs can uu tien? -> doc @references/prioritization.md
Neu chi co 1 bug -> BO QUA.

### Tao session moi (per D-09)

Goi `createSession({ existingSessions, description })` tu `bin/lib/session-manager.js`
- existingSessions: danh sach sessions tu Buoc 0 (mang { number })
- description: mo ta loi tu user ($ARGUMENTS hoac input)
- Ket qua: { id, slug, folderName, sessionMd }
- `mkdir -p .planning/debug/{folderName}`
- Ghi sessionMd vao `.planning/debug/{folderName}/SESSION.md`
- Luu `session_dir` = duong dan tuyet doi toi `.planning/debug/{folderName}` de truyen cho cac buoc sau

## Buoc 1: Thu thap trieu chung

--- Buoc 1/5: Thu thap trieu chung ---

Spawn Agent `pd-bug-janitor`:
  "Session dir: {absolute_session_dir}.
   Mo ta loi: {user_description}.
   Thu thap 5 trieu chung cot loi va ghi evidence_janitor.md vao session dir."

Sau khi agent hoan tat:
1. Read `{session_dir}/evidence_janitor.md`
2. Goi `validateEvidence(content)` tu `bin/lib/evidence-protocol.js`
3. Kiem tra ket qua:
   - valid=true -> tiep tuc Buoc 2
   - valid=false VA content chua trieu chung (grep "Trieu chung" hoac "Mong doi") -> WARNING, ghi vao SESSION.md, tiep tuc Buoc 2
   - valid=false VA KHONG co trieu chung -> STOP: "Khong du thong tin de dieu tra. Vui long mo ta loi chi tiet hon."
4. Goi `updateSession(currentMd, { status: 'active', appendToBody: '- evidence_janitor.md: da ghi' })` tu `bin/lib/session-manager.js`
   - Ghi ket qua sessionMd vao `{session_dir}/SESSION.md`

Janitor FAIL (agent throw/timeout):
- Co $ARGUMENTS du trieu chung -> WARNING: "Janitor khong phan hoi. Tiep tuc voi thong tin ban dau."
  Tao evidence_janitor.md thu cong tu $ARGUMENTS (5 trieu chung theo format evidence), tiep Buoc 2.
- KHONG co trieu chung -> STOP: "Khong the thu thap trieu chung. Vui long thu lai."

## Buoc 2: Phan tich code va tai lieu

--- Buoc 2/5: Phan tich code va tai lieu ---

1. Goi `buildParallelPlan(sessionDir, janitorEvidencePath)` tu `bin/lib/parallel-dispatch.js`
   - sessionDir: gia tri session_dir tu Buoc 0.5
   - janitorEvidencePath: `{session_dir}/evidence_janitor.md`
   - Ket qua: { agents, warnings } — agents gom pd-code-detective (critical) va pd-doc-specialist (optional)

2. Spawn Agent `pd-code-detective`:
   "Session dir: {absolute_session_dir}.
    Doc evidence_janitor.md va phan tich code nguon. Ghi evidence_code.md."

3. Read `{session_dir}/evidence_code.md` -> detectiveContent
   - Goi `validateEvidence(detectiveContent)` tu `bin/lib/evidence-protocol.js` -> detectiveResult

4. Spawn Agent `pd-doc-specialist`:
   "Session dir: {absolute_session_dir}.
    Doc evidence_janitor.md va tra cuu tai lieu thu vien. Ghi evidence_docs.md."

5. Read `{session_dir}/evidence_docs.md` -> docSpecContent (co the khong ton tai)
   - Neu file ton tai: validateEvidence(docSpecContent) -> docSpecResult
   - Neu file KHONG ton tai hoac invalid: docSpecResult = null

6. Goi `mergeParallelResults({ detective: detectiveResult, docSpec: docSpecResult })` tu `bin/lib/parallel-dispatch.js`
   - detective: { evidenceContent: detectiveContent } hoac { error: { message: '...' } }
   - docSpec: { evidenceContent: docSpecContent } hoac { error: { message: '...' } } hoac null
   - Ket qua: { results, allSucceeded, warnings }

7. Ghi warnings vao SESSION.md (neu co):
   - Read `{session_dir}/SESSION.md` -> currentMd
   - Goi `updateSession(currentMd, { appendToBody: '\n' + warnings.join('\n') })` tu `bin/lib/session-manager.js`
   - Ghi ket qua sessionMd vao `{session_dir}/SESSION.md`

8. Kiem tra:
   - Detective THANH CONG -> tiep tuc Buoc 3
   - Detective FAIL + DocSpec THANH CONG -> WARNING: "Code Detective khong tra ket qua. Chi co tai lieu." Tiep tuc Buoc 3 voi evidence_docs.md.
   - CA HAI FAIL -> STOP: "Khong the phan tich. Vui long kiem tra lai mo ta loi."

DocSpec fail la NON-BLOCKING (per D-06). Chi Detective fail moi co the block workflow.

### Progressive Disclosure (FLOW-08)
Moi buoc bat dau bang banner format:
```
--- Buoc N/5: [Mo ta ngan] ---
```
Danh sach banner:
- `--- Buoc 1/5: Thu thap trieu chung ---`
- `--- Buoc 2/5: Phan tich code va tai lieu ---`
- `--- Buoc 3/5: Tao test tai hien ---`
- `--- Buoc 4/5: Tong hop va ra phan quyet ---`
- `--- Buoc 5/5: Sua code va commit ---`

Chi hien banner va ket qua cuoi. KHONG hien chi tiet agent output cho user.

## Buoc 3: Tao test tai hien

--- Buoc 3/5: Tao test tai hien ---

Spawn Agent `pd-repro-engineer`:
  "Session dir: {absolute_session_dir}.
   Doc evidence_janitor.md va evidence_code.md (va evidence_docs.md neu co).
   Tao reproduction test va ghi evidence_repro.md."

Sau khi agent hoan tat:
1. Read `{session_dir}/evidence_repro.md`
2. Goi `validateEvidence(content)` tu `bin/lib/evidence-protocol.js`
3. Kiem tra:
   - valid=true -> tiep tuc Buoc 4
   - valid=false -> WARNING: "Repro Engineer khong tao duoc test tai hien." Tiep tuc Buoc 4 voi evidence tu Buoc 2.
4. Read `{session_dir}/SESSION.md` -> currentMd
   Goi `updateSession(currentMd, { appendToBody: '- evidence_repro.md: da ghi' })` tu `bin/lib/session-manager.js`
   Ghi ket qua sessionMd vao `{session_dir}/SESSION.md`

Repro FAIL (agent throw/timeout):
- WARNING: "Khong tao duoc test tai hien. Tiep tuc voi evidence phan tich."
- Ghi warning vao SESSION.md qua updateSession()
- Tiep tuc Buoc 4 (Repro la bo sung, khong block workflow)

## Buoc 4: Tong hop va ra phan quyet

--- Buoc 4/5: Tong hop va ra phan quyet ---

Spawn Agent `pd-fix-architect`:
  "Session dir: {absolute_session_dir}.
   Doc TAT CA evidence files (evidence_janitor.md, evidence_code.md, evidence_docs.md, evidence_repro.md).
   Tong hop va ra phan quyet. Ghi evidence_architect.md."

Sau khi agent hoan tat:
1. Read `{session_dir}/evidence_architect.md`
2. Goi `validateEvidence(content)` tu `bin/lib/evidence-protocol.js` -> { valid, outcome }
3. Goi `parseEvidence(content)` tu `bin/lib/evidence-protocol.js` -> { frontmatter, body, sections }

### Routing theo outcome:

**NEU outcome = 'root_cause':**
  1. Goi `buildRootCauseMenu(content)` tu `bin/lib/outcome-router.js`
     -> { question, choices } (3 lua chon: fix_now, fix_plan, self_fix)
  2. Hien question va 3 lua chon cho user (dung cau hoi truc tiep, KHONG hien agent output)
  3. User chon:
     - fix_now -> Goi `prepareFixNow(content)` tu `bin/lib/outcome-router.js`
       -> { fixInstructions, targetFiles, rootCause } -> Buoc 5
     - fix_plan -> Goi `prepareFixPlan(content, sessionDir)` tu `bin/lib/outcome-router.js`
       -> { planPath, planContent }
       Ghi planContent vao planPath. Thong bao: "Da tao ke hoach sua tai {planPath}."
       Read `{session_dir}/SESSION.md` -> currentMd
       Goi `updateSession(currentMd, { status: 'paused' })` tu `bin/lib/session-manager.js`
       Ghi ket qua vao `{session_dir}/SESSION.md`. DUNG workflow.
     - self_fix -> Goi `prepareSelfFix(content)` tu `bin/lib/outcome-router.js`
       -> { summary, suggestedSteps }
       Hien summary va suggestedSteps cho user.
       Read `{session_dir}/SESSION.md` -> currentMd
       Goi `updateSession(currentMd, { status: 'paused' })` tu `bin/lib/session-manager.js`
       Ghi ket qua vao `{session_dir}/SESSION.md`. DUNG workflow.

**NEU outcome = 'checkpoint':**
  1. Goi `extractCheckpointQuestion(content)` tu `bin/lib/checkpoint-handler.js`
     -> { question, context }
  2. Hien question cho user, cho tra loi
  3. User tra loi -> Goi `buildContinuationContext(content, userAnswer, roundNumber)` tu `bin/lib/checkpoint-handler.js`
     -> { canContinue, prompt, warnings }
  4. canContinue = true -> Spawn lai `pd-fix-architect` voi continuation prompt. Quay lai dau Buoc 4.
  5. canContinue = false (da vuot MAX_CONTINUATION_ROUNDS = 2 vong) ->
     Thong bao: "Da vuot 2 vong hoi dap. Can nguoi xem xet."
     Read `{session_dir}/SESSION.md` -> currentMd
     Goi `updateSession(currentMd, { status: 'paused' })` tu `bin/lib/session-manager.js`
     Ghi ket qua vao `{session_dir}/SESSION.md`. DUNG workflow.

**NEU outcome = 'inconclusive':**
  1. Hien Elimination Log tu evidence_architect.md (section ## Elimination Log)
  2. De xuat 2 lua chon:
     (1) Bo sung thong tin moi -> ghi thong tin vao SESSION.md qua updateSession(), status='paused'. DUNG workflow.
         (Quay lai Buoc 2 la FLOW-06 — Phase 33, NGOAI scope Phase 32)
     (2) Dung dieu tra -> Read `{session_dir}/SESSION.md` -> currentMd
         Goi `updateSession(currentMd, { status: 'paused' })`. Ghi ket qua. DUNG workflow.

Architect FAIL (agent throw/timeout):
- Hien tat ca evidence da thu thap (janitor, detective, docs, repro) truc tiep cho user
- Hoi: "Architect khong tra phan quyet. Ban muon: (1) Xem evidence va tu quyet dinh, (2) Dung lai?"
- User chon (1) -> hien evidence, cho user quyet dinh fix_now/fix_plan/self_fix
  Neu fix_now -> tao fixInstructions thu cong tu evidence -> Buoc 5
- User chon (2) -> Read `{session_dir}/SESSION.md` -> currentMd
  Goi `updateSession(currentMd, { status: 'paused' })`. Ghi ket qua. DUNG workflow.

</process>

<rules>
- Tuan thu `.planning/rules/` (general + stack-specific)
- CAM doc/hien thi file nhay cam (`.env`, `credentials.*`, `*.pem`, `*.key`, `*secret*`, `wp-config.php`)
- KHONG tu dong loi — PHAI cho user xac nhan
- KHONG gioi han lan sua — lap den khi xac nhan
- Moi lan sua: commit rieng fix([LOI])
- FastCode loi -> Grep/Read, KHONG DUNG
- Tiep tuc phien -> doc SESSION TRUOC, khong bat dau lai
- Chi hien banner va ket qua cuoi. KHONG hien chi tiet agent output cho user.
</rules>

<success_criteria>
- [ ] Trieu chung du 5 thong tin
- [ ] Session tao va cap nhat xuyen suot
- [ ] Evidence files hop le (validateEvidence pass)
- [ ] Cong kiem tra dat 3 dieu kien truoc khi sua
- [ ] Test pass sau khi sua
- [ ] User xac nhan thanh cong
</success_criteria>
