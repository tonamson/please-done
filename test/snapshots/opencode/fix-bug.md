---
description: Tìm và sửa lỗi theo phương pháp khoa học, tìm hiểu, báo cáo, sửa code, commit [LỖI] và xác nhận cho đến khi thành công
tools:
  - Read
  - Write
  - Edit
  - Bash
  - Glob
  - Grep
  - AskUserQuestion
  - mcp__fastcode__code_qa
  - mcp__context7__resolve-library-id
  - mcp__context7__query-docs
---
<objective>
Sửa lỗi theo quy trình rõ ràng: triệu chứng -> phân loại rủi ro -> giả thuyết -> kiểm chứng -> cổng kiểm tra -> sửa -> xác nhận.
Lưu trạng thái điều tra vào `.planning/debug/` để có thể phục hồi khi mất phiên.
Lặp lại cho đến khi người dùng xác nhận. Tạo patch version cho milestone đã hoàn tất.
**Sau khi xong:** `/pd-what-next`
</objective>
<guards>
Dừng và hướng dẫn người dùng nếu bất kỳ điều kiện nào sau đây thất bại:
- [ ] `.planning/CONTEXT.md` ton tai -> "Chay `/pd-init` truoc."
- [ ] Có mô tả lỗi được cung cấp -> "Hãy cung cấp mô tả lỗi hoặc tên phiên điều tra."
- [ ] FastCode MCP ket noi thanh cong -> "Kiem tra Docker dang chay va FastCode MCP da duoc cau hinh."
- [ ] Context7 MCP ket noi thanh cong -> "Kiem tra Context7 MCP da duoc cau hinh."
- [ ] Context7 MCP hoat dong (thu resolve-library-id "react") -> "Context7 khong phan hoi. Kiem tra ket noi MCP."
</guards>
<context>
Người dùng nhập: $ARGUMENTS
Đọc thêm:
- `.planning/rules/general.md` -> quy tắc chung
- `.planning/rules/{nestjs,nextjs,wordpress,solidity,flutter}.md` -> theo loại lỗi (CHỈ nếu tồn tại)
</context>
<required_reading>
Đọc .pdconfig → lấy SKILLS_DIR, rồi đọc các files sau trước khi bắt đầu:
(Claude Code: cat ~/.config/opencode/.pdconfig — nền tảng khác: converter tự chuyển đổi đường dẫn)
Doc truoc khi bat dau:
- [SKILLS_DIR]/references/conventions.md -> version matching, patch version, bieu tuong, commit prefixes
</required_reading>
<conditional_reading>
Đọc CHỈ KHI cần (phân tích mô tả task trước):
- [SKILLS_DIR]/references/prioritization.md -- KHI task ordering/ranking nhieu tasks hoac triage
- [SKILLS_DIR]/references/context7-pipeline.md -- KHI task can
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
- Nhieu bugs can uu tien? -> doc [SKILLS_DIR]/references/prioritization.md
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
## Buoc 5: Sua code va commit
--- Buoc 5/5: Sua code va commit ---
### 5a: Regression analysis (truoc khi sua)
1. Doc fixInstructions tu prepareFixNow() (Buoc 4) -> lay targetFiles, targetFunction
2. Try:
   - Dung FastCode `code_qa`: "Liet ke cac files import hoac goi {targetFunction} trong {targetFile}"
   - Thanh cong -> goi `analyzeFromCallChain({ callChainText, targetFile, targetFunction })` tu `bin/lib/regression-analyzer.js`
   - FastCode loi -> doc source files quanh targetFile -> goi `analyzeFromSourceFiles({ sourceFiles, targetFile, targetFunction })` tu `bin/lib/regression-analyzer.js`
   Catch: WARNING: "Khong phan tich duoc regression: {error.message}". Tiep tuc.
3. Ket qua affectedFiles -> Read `{session_dir}/SESSION.md` -> currentMd
   Goi `updateSession(currentMd, { appendToBody: 'Regression: {N} files bi anh huong: {list}' })` tu `bin/lib/session-manager.js`
   Ghi ket qua vao `{session_dir}/SESSION.md`
### 5b: Sua code
1. Doc fixInstructions va rootCause tu prepareFixNow() output
2. Ap dung fix theo huong dan
3. Chay test: xac dinh test command tu project (package.json scripts hoac .planning rules)
4. Test FAIL -> doc error, dieu chinh fix, chay lai (toi da 3 lan)
5. Test PASS -> tiep tuc 5c
### 5c: Debug cleanup (truoc commit)
1. `git diff --cached --name-only` -> danh sach staged files
2. Read noi dung tung staged file -> tao array [{path, content}]
3. Try: goi `scanDebugMarkers(stagedFiles)` tu `bin/lib/debug-cleanup.js`
   Catch: WARNING: "Debug cleanup loi: {error.message}". Tiep tuc.
4. Ket qua co markers -> hien danh sach theo file:
   ```
   [PD-DEBUG] Tim thay debug markers:
     {file}: Dong {line}: {content}
   Xoa tat ca debug markers? (Y/n)
   ```
   User Y -> xoa markers, git add lai files
   User n -> WARNING: "Debug markers van con trong commit."
5. Try: doc `.planning/scan/SCAN_REPORT.md` (neu ton tai va < 7 ngay)
   -> goi `matchSecurityWarnings(reportContent, filePaths)` tu `bin/lib/debug-cleanup.js`
   Catch: bo qua.
   Co canh bao -> hien non-blocking (toi da 3):
   ```
   Canh bao bao mat lien quan:
   - {file}: [{severity}] {message}
   ```
### 5d: Commit
```
git add {fixed files} {session_dir}/SESSION.md {session_dir}/evidence_*.md
git commit -m "fix([LOI]): {mo_ta_ngan}"
```
### 5e: User verify (per D-10)
Hoi: "Da sua {mo_ta}. Vui long kiem tra va xac nhan."
**User xac nhan OK:**
  1. Goi `createBugRecord({ file: targetFile, functionName: targetFunction, errorMessage: originalError, rootCause, fix: fixDescription, sessionId: folderName })` tu `bin/lib/bug-memory.js`
     -> bugRecordMd
  2. Ghi bugRecordMd vao `.planning/bugs/BUG-{NNN}.md`
     (Xac dinh NNN: Glob `.planning/bugs/BUG-*.md` -> tim so cao nhat + 1, bat dau tu 001)
  3. Glob `.planning/bugs/BUG-*.md` -> Read tat ca -> parse thanh records
     Goi `buildIndex(bugRecords)` tu `bin/lib/bug-memory.js` -> indexMd
     Ghi indexMd vao `.planning/bugs/INDEX.md`
  4. Read `{session_dir}/SESSION.md` -> currentMd
     Goi `updateSession(currentMd, { status: 'resolved' })` tu `bin/lib/session-manager.js`
     Ghi ket qua vao `{session_dir}/SESSION.md`
  5. Git add va commit:
     ```
     git add .planning/bugs/BUG-{NNN}.md .planning/bugs/INDEX.md {session_dir}/SESSION.md
     git commit -m "fix([LOI]): ghi bug record va dong session {sessionId}"
     ```
**User xac nhan CHUA SUA:**
  - Thu thap them trieu chung moi tu user
  - Quay lai 5b voi thong tin bo sung
  - Toi da 3 lan -> goi y: "Da thu 3 lan. De xuat: phan tich lai tu Buoc 2 hoac dung lai."
### 5f: Logic sync (non-blocking, SAU user verify thanh cong)
1. `git diff HEAD~1` -> diffText
2. Read `{session_dir}/SESSION.md` -> sessionContent
3. Read BUG report vua tao (`.planning/bugs/BUG-{NNN}.md`) -> bugReportContent
4. Read `CLAUDE.md` -> claudeContent (neu ton tai)
5. Glob `.planning/reports/*.md` -> reportContent (file moi nhat, neu co)
6. Try: goi `runLogicSync({ diffText, bugReportContent, sessionContent, claudeContent, reportContent, planContents: [] })` tu `bin/lib/logic-sync.js`
   -> { hasLogicChange, signals, diagramUpdated, rulesSuggested }
   Catch: WARNING: "Logic sync loi: {error.message}". KHONG block.
7. hasLogicChange = true va diagramUpdated -> hoi: "Cap nhat lai PDF? (Y/n)"
   Y -> `node bin/generate-pdf-report.js {reportPath}`
8. rulesSuggested co noi dung -> hien va hoi: "Them vao CLAUDE.md? (Y/n)"
   Y -> append vao CLAUDE.md, git add va commit:
   ```
   git add CLAUDE.md
   git commit -m "fix([LOI]): them rule tu post-mortem"
   ```
</process>
<output>
**Tạo/Cập nhật:**
- Source code đã sửa lỗi
- `.planning/debug/` -- trạng thái phiên điều tra
- Cập nhật `TASKS.md` nếu liên quan
**Bước tiếp theo:** `/pd-what-next`
**Thành công khi:**
- Người dùng xác nhận đã sửa thành công
- Các test liên quan chạy thành công nếu có
- Commit `[LỖI]` đã được tạo
**Lỗi thường gặp:**
- Không tái hiện được lỗi -> yêu cầu người dùng cung cấp thêm thông tin
- Lỗi nằm ở dependency -> cập nhật package, kiểm tra phiên bản
- MCP không kết nối -> kiểm tra Docker và cấu hình
</output>
<rules>
- Mọi output PHẢI bằng tiếng Việt có dấu
- PHẢI lưu trạng thái điều tra vào `.planning/debug/` để phục hồi
- PHẢI qua cổng kiểm tra (gate check) trước khi sửa code
- PHẢI lặp lại vòng lặp cho đến khi người dùng xác nhận thành công
- KHÔNG được sửa code không liên quan đến lỗi
- Tuan thu `.planning/rules/` (general + stack-specific)
- CAM doc/hien thi file nhay cam (`.env`, `credentials.*`, `*.pem`, `*.key`, `*secret*`, `wp-config.php`)
- PHAI spawn agents theo dung thu tu: Janitor -> Detective+DocSpec -> Repro -> Architect -> Fix
- PHAI truyen absolute session_dir path khi spawn moi agent
- PHAI goi validateEvidence() sau moi agent hoan tat
- PHAI xu ly ca 3 outcomes sau Buoc 4: root_cause, checkpoint, inconclusive
- PHAI tao bug record SAU user verify (KHONG truoc) — per D-10
- PHAI dong session SAU bug record + INDEX rebuild — per D-11
- KHONG hien chi tiet agent output cho user — chi hien banners va ket qua cuoi (progressive disclosure)
- KHONG block workflow khi DocSpec hoac Repro fail — chi WARNING va tiep tuc
- CHI STOP khi: (1) Janitor fail khong co trieu chung, (2) Detective fail, (3) User chon dung
- Moi v1.5 module call (debug-cleanup, logic-sync, regression-analyzer) PHAI wrap trong try/catch — loi chi tao WARNING
- Commit message format: `fix([LOI]): mo ta` — per D-08
- Tiep tuc phien cu -> doc SESSION.md TRUOC, khong bat dau lai
- KHONG de agent spawn agent — chi orchestrator (workflow nay) moi spawn agent
</rules>
