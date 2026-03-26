---
name: pd-audit
description: Quét bảo mật OWASP — dispatch 13 scanner song song và tổng hợp báo cáo
---
<codex_skill_adapter>
## Cách gọi skill này
Skill name: `$pd-audit`
Khi user gọi `$pd-audit {{args}}`, thực hiện toàn bộ instructions bên dưới.
## Tool mapping
- `AskUserQuestion` → `request_user_input`: Khi cần hỏi user, dùng request_user_input thay vì AskUserQuestion
- `Task()` → `spawn_agent()`: Khi cần spawn sub-agent, dùng spawn_agent với fork_context
  - Chờ kết quả: `wait(agent_ids)`
  - Kết thúc agent: `close_agent()`
## Fallback tương thích
- Nếu `request_user_input` không khả dụng trong mode hiện tại, hỏi user bằng văn bản thường bằng 1 câu ngắn gọn rồi chờ user trả lời
- Mọi chỗ ghi "PHẢI dùng `request_user_input`" được hiểu là: ưu tiên dùng khi tool khả dụng; nếu không thì fallback sang hỏi văn bản thường, không được tự đoán thay user
## Quy ước
- `$ARGUMENTS` chính là `{{GSD_ARGS}}` — input từ user khi gọi skill
- Tất cả paths config đã được chuyển sang `~/.codex/`
- Các MCP tools (`mcp__*`) hoạt động tự động qua config.toml
- Đọc `~/.codex/.pdconfig` (cat ~/.codex/.pdconfig) → lấy `SKILLS_DIR`
- Các tham chiếu `[SKILLS_DIR]/templates/*`, `[SKILLS_DIR]/references/*` → đọc từ thư mục source tương ứng
</codex_skill_adapter>
<objective>
Quét bảo mật toàn diện dựa trên OWASP Top 10. Dispatch 13 scanner song song (2/wave), tổng hợp báo cáo, phân tích chéo.
</objective>
<guards>
Tự động phát hiện chế độ hoạt động TRƯỚC khi chạy guards:
1. Kiểm tra `.planning/PROJECT.md` tồn tại (dùng Bash: `test -f .planning/PROJECT.md`)
2. Tồn tại → mode = "tich-hop": chạy đầy đủ 3 guards bên dưới
3. Không tồn tại → mode = "doc-lap": bỏ qua guard-context, chỉ chạy 2 guards còn lại (guard-valid-path, guard-fastcode)
Dừng và hướng dẫn người dùng nếu bất kỳ guard nào thất bại:
@references/guard-context.md (chỉ chế độ tích hợp)
- [ ] Tham so path hop le (neu co) -> "Path khong ton tai hoac khong phai thu muc."
- [ ] FastCode MCP ket noi thanh cong -> "Kiem tra Docker dang chay va FastCode MCP da duoc cau hinh."
</guards>
<context>
Người dùng nhập: {{GSD_ARGS}}
</context>
<process>
## Bước 1: Detect mode
Tự động phát hiện chế độ hoạt động:
1. Chạy: `test -f .planning/PROJECT.md`
2. Tồn tại → mode = "tich-hop", output_dir = ".planning/audit/"
3. Không tồn tại → mode = "doc-lap", output_dir = "./"
4. Tạo session dir: `/tmp/pd-audit-{hash}/` trong đó hash = md5 của scanPath + Date.now()
   ```bash
   SESSION_HASH=$(node -e "console.log(require('crypto').createHash('md5').update('${SCAN_PATH}' + Date.now()).digest('hex').slice(0,8))")
   SESSION_DIR="/tmp/pd-audit-${SESSION_HASH}"
   mkdir -p "$SESSION_DIR"
   ```
5. Ghi `{session_dir}/01-detect.md` với nội dung: mode, output_dir, timestamp ISO
6. Log: "Chế độ: {mode} — output sẽ ghi vào {output_dir}"
## Bước 2: Delta-aware
Phân loại hàm từ evidence phiên cũ để chỉ quét lại những gì thay đổi.
1. Tìm evidence cũ trong output_dir:
   ```bash
   ls ${OUTPUT_DIR}/evidence_sec_*.md 2>/dev/null
   ```
2. Nếu KHÔNG có evidence cũ nào:
   - delta_mode = "full-scan"
   - Log: "Không tìm thấy evidence phiên cũ — chạy full scan"
   - Ghi `{session_dir}/02-delta.md` với: status=full-scan, reason="no prior evidence"
   - Chuyển qua B3
3. Nếu CÓ evidence cũ:
   a. Với MỖI evidence file `evidence_sec_{cat}.md`:
      - Đọc nội dung file bằng Read
      - Parse frontmatter lấy commit_sha:
        ```bash
        node -e "const {parseFrontmatter}=require('./bin/lib/utils');const fm=parseFrontmatter(require('fs').readFileSync('${OUTPUT_DIR}/evidence_sec_${cat}.md','utf8'));console.log(fm.frontmatter.commit_sha||'')"
        ```
      - Nếu có commit_sha:
        ```bash
        git diff --name-only ${COMMIT_SHA}..HEAD
        ```
        Truyền kết quả (danh sách files) vào changedFiles
      - Nếu KHÔNG có commit_sha (evidence cũ từ trước Phase 49):
        Treat như full scan cho category này — classifyDelta('', [])
   b. Gọi classifyDelta:
      ```bash
      node -e "
        const {classifyDelta}=require('./bin/lib/session-delta');
        const evidence=require('fs').readFileSync('${EVIDENCE_PATH}','utf8');
        const changed=${CHANGED_FILES_JSON};
        const result=classifyDelta(evidence, changed);
        // Convert Map to object for JSON output
        const fns=Object.fromEntries(result.functions);
        console.log(JSON.stringify({...result, functions: fns}));
      "
      ```
   c. Lưu kết quả classification vào `{session_dir}/02-delta.md`:
      - Per category: số hàm SKIP, RE-SCAN, KNOWN-UNFIXED
      - Tổng: delta_mode="delta", summary counts
4. Truyền classification results cho B5:
   - B5 dispatch scanner với bổ sung context: danh sách hàm cần scan lại (RE-SCAN) và hàm mới (NEW)
   - Hàm SKIP và KNOWN-UNFIXED không cần quét lại — scanner nhận danh sách này để bỏ qua
## Bước 3: Scope / parse args
Parse {{GSD_ARGS}}:
1. **path** — path cần quét, mặc định "."
2. **--full** — chạy 13 categories
3. **--only cat1,cat2** — chỉ chạy categories chỉ định + validate slugs
4. **--poc** — parse nhưng báo "Chưa hỗ trợ trong phiên bản này" (per D-04)
5. **--auto-fix** — parse nhưng báo "Chưa hỗ trợ trong phiên bản này" (per D-04)
Lấy danh sách 13 valid slugs bằng Bash:
```bash
node -e "const {getAgentConfig}=require('./bin/lib/resource-config');console.log(JSON.stringify(getAgentConfig('pd-sec-scanner').categories))"
```
Xác định categories_to_scan:
- --full → 13 categories, SKIP Bước 4
- --only cat1,cat2 → validate slugs + THÊM 3 base (secrets, misconfig, logging) + de-dup, SKIP Bước 4 (per D-06, D-15). Slug không hợp lệ → warning và bỏ qua
- Không có flag → chuyển qua Bước 4 Smart Selection
Ghi `{session_dir}/02-scope.md` với: scan_path, mode (full|only), categories list, flags (poc/auto-fix status), warnings
## Bước 4: Smart selection
Nếu --full hoặc --only: SKIP bước này (đã có categories từ B3).
Không có flag → chạy smart selection (toàn bộ bước này KHÔNG spawn AI — chỉ Bash/Glob/Grep):
1. **Thu thập project context:**
   a. Đọc package.json (nếu tồn tại) → lấy deps:
      ```bash
      node -e "try{const p=JSON.parse(require('fs').readFileSync('package.json','utf8'));console.log(JSON.stringify([...Object.keys(p.dependencies||{}),...Object.keys(p.devDependencies||{})]))}catch(e){console.log('[]')}"
      ```
   b. Đọc requirements.txt (nếu tồn tại) → lấy Python deps:
      ```bash
      grep -v '^#' requirements.txt 2>/dev/null | sed 's/[>=<].*//' | tr -d ' ' || echo ""
      ```
   c. Glob file extensions: kiểm tra tồn tại của *.jsx, *.tsx, *.vue, *.svelte, *.php, *.ejs, *.pug, *.hbs
   d. Grep code patterns (3-4 lệnh gom nhóm):
      - `grep -rl "req\.\(body\|params\|query\)" --include="*.js" --include="*.ts" . 2>/dev/null | head -1`
      - `grep -rl "child_process\|exec(\|spawn(" --include="*.js" --include="*.ts" . 2>/dev/null | head -1`
      - `grep -rl "createHash\|createCipher\|jwt\.sign" --include="*.js" --include="*.ts" . 2>/dev/null | head -1`
      - `grep -rl "app\.\(get\|post\|put\|delete\)(\|router\.\(get\|post\)" --include="*.js" --include="*.ts" . 2>/dev/null | head -1`
   e. Kiểm tra lockfile: test -f package-lock.json || test -f yarn.lock || test -f pnpm-lock.yaml || test -f requirements.txt
2. **Gọi selectScanners():**
   ```bash
   node -e "
     const {selectScanners}=require('./bin/lib/smart-selection');
     const ctx={
       deps: $DEPS_JSON,
       fileExtensions: $EXTENSIONS_JSON,
       codePatterns: $CODE_PATTERNS_JSON,
       hasLockfile: $HAS_LOCKFILE
     };
     console.log(JSON.stringify(selectScanners(ctx)));
   "
   ```
3. **Xử lý kết quả:**
   a. Nếu lowConfidence=false:
      - Log: "Smart Selection: {selected.length}/{13} scanners, {skipped.length} bỏ qua"
      - Log từng signal: "  - {signal.id}: {signal.description}"
      - Dùng selected làm categories_to_scan
   b. Nếu lowConfidence=true (< 2 signals — per D-05):
      - Hiển thị prompt:
        ```
        Smart Selection kết quả:
          Tín hiệu tìm được: {signals.length}/12
          {Liệt kê từng signal}
          Scanner sẽ chạy ({selected.length}):
          {Liệt kê selected, đánh dấu base}
          Scanner bỏ qua ({skipped.length}): {liệt kê skipped}
          [1] Chạy {selected.length} scanner đã chọn
          [2] Chạy --full (13 scanner)
        Chọn (1/2):
        ```
      - Nếu user chọn 1: dùng selected
      - Nếu user chọn 2: dùng ALL_CATEGORIES (13)
      - Nếu không có interactive (không thể hỏi user): default chạy selected + log warning "Không thể hỏi user — chạy {selected.length} scanner đã chọn"
4. **Ghi {session_dir}/03-selection.md** với:
   - status: completed
   - signals: [{id, description, categories}]
   - selected_categories: [...]
   - skipped_categories: [...]
   - lowConfidence: true/false
   - user_choice: (nếu lowConfidence=true)
## Bước 5: Dispatch scanners
Đây là bước chính — dispatch scanners song song 2/wave.
1. Lấy categories_to_scan từ B3 (--full/--only) hoặc B4 (smart selection)
2. Chia categories thành waves of 2 theo logic buildScannerPlan:
   ```bash
   node -e "const {buildScannerPlan}=require('./bin/lib/parallel-dispatch');const plan=buildScannerPlan(categories, 2, scanPath);console.log(JSON.stringify(plan))"
   ```
   13 categories → 7 waves. Ví dụ: wave 1 = [sql-injection, xss], wave 2 = [cmd-injection, path-traversal], ...
3. Khởi tạo biến `scanResults = []` để tích lũy kết quả từ tất cả waves (mảng các object `{category, evidenceContent, error}`)
4. Agent pd-sec-scanner dùng FastCode tool-first, Grep fallback (per D-14 Phase 46)
5. Tạo thư mục `{session_dir}/03-dispatch/` trước khi dispatch:
   ```bash
   mkdir -p "${SESSION_DIR}/03-dispatch"
   ```
6. Với MỖI WAVE (tuần tự — wave trước PHẢI xong trước khi bắt đầu wave sau):
   a. Spawn tối đa 2 scanner agents SONG SONG bằng SubAgent tool:
      - Agent name: pd-sec-scanner (per D-12, lấy từ getAgentConfig)
      - Tham số truyền cho agent: `--category {slug} --path {scanPath}`
      - Prompt cho mỗi scanner: "Quét bảo mật category {slug} tại path {scanPath}. Session dir: {session_dir}/03-dispatch/. Ghi evidence file vào session dir."
      - Tier: scout / Haiku (per D-13)
      - Mỗi scanner tự đọc references/security-rules.yaml và quét theo category
   b. Đợi TẤT CẢ scanners trong wave hoàn tất (backpressure per D-10)
   c. Thu thập kết quả mỗi scanner:
      - Thành công → đọc evidence file output từ scanner, thêm `{category, evidenceContent: <nội dung evidence>, error: null}` vào `scanResults`
      - Thất bại / timeout → thêm `{category, evidenceContent: null, error: <error message>}` vào `scanResults`, KHÔNG dừng lại (per D-11 — failure isolation, ghi inconclusive)
   d. Ghi `{session_dir}/03-dispatch/{category}.md` cho mỗi scanner result
7. Log sau mỗi wave: "Wave {N}/{totalWaves} hoàn tất: {completed} thành công, {failed} thất bại"
**QUAN TRỌNG:** Đợi TẤT CẢ scanners trong wave hoàn tất rồi mới bắt đầu wave tiếp theo (backpressure per D-10). KHÔNG dispatch tất cả 13 scanners cùng lúc.
## Bước 5b: Cập nhật evidence metadata
Sau khi TẤT CẢ waves dispatch hoàn tất (B5 xong):
1. Lấy commit SHA hiện tại:
   ```bash
   CURRENT_SHA=$(git rev-parse --short HEAD)
   ```
2. Với MỖI evidence file mới từ B5 (trong session_dir/03-dispatch/):
   a. Đọc nội dung evidence file
   b. Thêm/cập nhật `commit_sha: ${CURRENT_SHA}` vào frontmatter YAML:
      - Nếu evidence có frontmatter (---...---): thêm trường commit_sha
      - Nếu không có: tạo frontmatter mới với commit_sha
   c. Gọi appendAuditHistory để thêm dòng history:
      ```bash
      node -e "
        const {appendAuditHistory}=require('./bin/lib/session-delta');
        const content=require('fs').readFileSync('${EVIDENCE_PATH}','utf8');
        const entry={
          date: new Date().toISOString().split('T')[0],
          commit: '${CURRENT_SHA}',
          verdictSummary: '${PASS_COUNT} PASS, ${FLAG_COUNT} FLAG, ${FAIL_COUNT} FAIL',
          deltaSummary: '${NEW_COUNT} new, ${RESCAN_COUNT} re-scan, ${SKIP_COUNT} skip'
        };
        const updated=appendAuditHistory(content, entry);
        require('fs').writeFileSync('${EVIDENCE_PATH}', updated);
      "
      ```
   d. Copy evidence file ra output_dir (ghi đè file cũ)
3. Log: "Evidence metadata cập nhật: commit_sha=${CURRENT_SHA}, {N} files có audit history"
## Bước 6: Reporter
Spawn pd-sec-reporter agent:
- Input: session_dir (chứa tất cả evidence files từ B5 trong 03-dispatch/)
- Prompt: "Tổng hợp báo cáo bảo mật từ evidence files trong {session_dir}/03-dispatch/. Ghi SECURITY_REPORT.md vào {session_dir}/SECURITY_REPORT.md."
- Output: {session_dir}/SECURITY_REPORT.md
- Reporter đọc tất cả {session_dir}/03-dispatch/*.md và tổng hợp thành 1 báo cáo
Nếu reporter fail: tạo SECURITY_REPORT.md đơn giản liệt kê các evidence files đã thu thập và thống kê cơ bản.
## Bước 7: Analyze / merge
Dùng `scanResults` đã tích lũy từ B5 (mảng các `{category, evidenceContent, error}`). Truyền vào mergeScannerResults(scanResults) để tổng hợp:
1. Đếm completedCount (scanners thành công), failedCount (scanners fail/inconclusive)
2. Liệt kê categories có findings (FAIL/FLAG)
3. Liệt kê categories sạch (PASS)
4. Liệt kê categories inconclusive (fail/timeout)
5. Ghi {session_dir}/04-analysis.md với: total_scanners, completed, failed, categories_with_findings, categories_clean, categories_inconclusive
6. Log thống kê tóm tắt cho user
## Bước 8: Fix routing (STUB)
> Phiên bản hiện tại chưa hỗ trợ tự động tạo fix phases. Extension point cho Phase 50.
Nếu mode = "tich-hop": ghi note "Fix phases sẽ được tạo tự động trong phiên bản sau"
Nếu mode = "doc-lap": ghi note "Xem SECURITY_REPORT.md để biết gợi ý sửa lỗi"
Ghi {session_dir}/05-fix-routing.md với: status=stub, note
## Bước 9: Save report
1. Đọc {session_dir}/SECURITY_REPORT.md (từ B6)
2. Copy ra output_dir (từ B1):
   - mode "doc-lap" → ./SECURITY_REPORT.md
   - mode "tich-hop" → .planning/audit/SECURITY_REPORT.md (tạo thư mục .planning/audit/ nếu chưa có bằng `mkdir -p`)
3. Log: "Báo cáo bảo mật đã lưu tại: {output_path}"
4. In tóm tắt ngắn cho user: số findings theo severity (CRITICAL/HIGH/MEDIUM/LOW), số categories đã quét, số categories inconclusive (nếu có)
</process>
<output>
**Tạo:**
- SECURITY_REPORT.md (vị trí tùy mode: doc-lap → ./, tich-hop → .planning/audit/)
- Evidence files trong temp dir
**Bước tiếp theo:** Đọc SECURITY_REPORT.md để xem kết quả
**Thành công khi:**
- Tất cả scanners đã dispatch và trả kết quả (hoặc inconclusive)
- SECURITY_REPORT.md đã tạo tại đúng vị trí
**Lỗi thường gặp:**
- FastCode MCP không kết nối → kiểm tra Docker đang chạy
- SubAgent không khả dụng → kiểm tra cấu hình tool cho phép SubAgent
</output>
<rules>
- Mọi output PHẢI bằng tiếng Việt có dấu
- KHÔNG sửa code của dự án — chỉ quét và báo cáo
- Khi --poc hoặc --auto-fix được truyền: thông báo "Chưa hỗ trợ trong phiên bản này" và tiếp tục
- Mọi output PHẢI bằng tiếng Việt có dấu
- KHÔNG sửa code của dự án — chỉ quét và báo cáo
- Khi --poc hoặc --auto-fix được truyền: thông báo "Chưa hỗ trợ trong phiên bản này" và tiếp tục
- Wave trước PHẢI hoàn tất trước khi bắt đầu wave sau — tuân thủ backpressure
- Scanner thất bại ghi inconclusive, không dừng toàn bộ audit
</rules>
