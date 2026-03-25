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
