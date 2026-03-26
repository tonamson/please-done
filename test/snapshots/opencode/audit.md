---
description: Quét bảo mật OWASP — dispatch 13 scanner song song và tổng hợp báo cáo
tools:
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
Người dùng nhập: $ARGUMENTS
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
## Bước 2: Delta-aware (STUB)
> Phiên bản hiện tại chưa hỗ trợ delta-aware scanning. Treat toàn bộ codebase như full scan. Extension point cho Phase 49.
Ghi `{session_dir}/02-delta.md` với: status=stub, scope=full-scan, note="Delta-aware chưa được triển khai"
## Bước 3: Scope / parse args
Parse $ARGUMENTS:
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
- Không có flag → mặc định --full (13 categories)
- --full → 13 categories
- --only cat1,cat2 → validate mỗi slug có trong valid slugs. Slug không hợp lệ → warning và bỏ qua (Pitfall 6: validate slugs trước khi dispatch)
Ghi `{session_dir}/02-scope.md` với: scan_path, mode (full|only), categories list, flags (poc/auto-fix status), warnings
## Bước 4: Smart selection (STUB)
> Phiên bản hiện tại chưa hỗ trợ smart scanner selection. Chạy tất cả categories từ B3. Extension point cho Phase 48.
Ghi `{session_dir}/03-selection.md` với: status=stub, selected_categories (copy từ B3), note="Smart selection chưa được triển khai"
## Bước 5: Dispatch scanners
Đây là bước chính — dispatch scanners song song 2/wave.
1. Lấy categories từ B3/B4
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
