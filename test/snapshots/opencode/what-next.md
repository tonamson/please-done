---
description: Check project progress and suggest the next command when work is interrupted or forgotten
tools:
  - Read
  - Glob
  - Grep
  - Bash
---
<objective>
Scan `.planning/` to determine unfinished work and the next logical step, then display progress with a suggested command.
READ ONLY. DO NOT edit files. DO NOT call FastCode MCP.
</objective>
<guards>
Stop and instruct the user if any of the following conditions fail:
- [ ] `.planning/` directory exists -> "The project has not been initialized yet. Run `/pd-init` first."
      </guards>
<context>
User input: $ARGUMENTS (no arguments)
No rules or FastCode MCP needed - only read planning files.
</context>
<required_reading>
Đọc .pdconfig → lấy SKILLS_DIR, rồi đọc các files sau trước khi bắt đầu:
(Claude Code: cat ~/.config/opencode/.pdconfig — nền tảng khác: converter tự chuyển đổi đường dẫn)
- [SKILLS_DIR]/references/conventions.md → biểu tượng trạng thái, version filtering
</required_reading>
<conditional_reading>
Đọc CHỈ KHI cần (phân tích mô tả task trước):
- [SKILLS_DIR]/references/state-machine.md -- KHI task lien quan den milestone state transitions
</conditional_reading>
<process>
## Bước 1: Kiểm tra nền tảng
Đọc lần lượt (dừng ở điểm THIẾU đầu tiên):
1. `.planning/CONTEXT.md` → không có → gợi ý `/pd-init`, **DỪNG**
1.5. `.planning/PROJECT.md` (nếu có) → tầm nhìn + lịch sử milestones
2. `.planning/scan/SCAN_REPORT.md` → không có → ghi nhận (gợi ý phụ Bước 5), KHÔNG DỪNG
3. `.planning/ROADMAP.md` → không có → gợi ý `/pd-new-milestone`, **DỪNG**
4. `.planning/CURRENT_MILESTONE.md` → `version`, `phase`, `status`
   - status = `Hoàn tất toàn bộ` → "Tất cả milestones đã hoàn tất!", **DỪNG**
5. `.planning/REQUIREMENTS.md` (nếu có) → thống kê độ phủ
6. `.planning/STATE.md` (nếu có) → vấn đề chặn, bối cảnh, hoạt động cuối
## Bước 2: Kiểm tra bugs đang mở
Glob `.planning/bugs/BUG_*.md` → grep `> Trạng thái:` (Chưa xử lý/Đang sửa) + `> Patch version:` → filter milestone hiện tại theo [SKILLS_DIR]/references/conventions.md → "Version filtering"
- CÓ bugs mở → ghi nhận
- Bugs milestone khác → ghi riêng, gợi ý phụ
## Bước 3: Kiểm tra tiến trình phase
1. Glob `.planning/milestones/[version]/phase-[phase]/TASKS.md` → không tồn tại → gợi ý `/pd-plan`, **DỪNG**
2. Đọc TASKS.md → đếm: 🔄 ⬜ 🐛 ✅ ❌. TASKS.md rỗng (0 tasks) → "TASKS.md rỗng, chạy `/pd-plan` lại." **DỪNG**
3. Glob `phase-[phase]/reports/CODE_REPORT_TASK_*.md` → đếm
4. ROADMAP.md → phases còn lại milestone
5. `phase-[phase]/TEST_REPORT.md` tồn tại?
6. **Quét phases cũ chưa test**: mỗi `milestones/[version]/phase-*/` → TẤT CẢ tasks ✅ + KHÔNG TEST_REPORT → ghi nhận (Ưu tiên 5.6)
7. `VERIFICATION_REPORT.md` tồn tại? → `Đạt`/`Có gap`/`Cần kiểm tra thủ công`
## Bước 4: Phân tích + gợi ý (1 hành động chính, thứ tự ưu tiên)
| Ưu tiên | Điều kiện | Gợi ý |
|---------|-----------|-------|
| 1 | Bugs đang mở | `/pd-fix-bug` |
| 2 | Task 🔄 (kiểm tra PROGRESS.md nếu có) | `/pd-write-code [N]` tiếp tục |
| 3 | Task 🐛 (kiểm tra bug report tương ứng) | `/pd-fix-bug` |
| 4 | Còn task ⬜ | `/pd-write-code` hoặc `--parallel` |
| 5 | Tất cả còn lại ❌/🐛 | `/pd-fix-bug` hoặc kiểm tra lý do chặn |
| 5.5 | VERIFICATION_REPORT `Có gap` | `/pd-fix-bug` hoặc `/pd-write-code` re-verify |
| 5.6 | Phase cũ hoàn tất chưa test | `/pd-test` (tự phát hiện phase) |
| 6 | Tất cả ✅, chưa test/test fail | `/pd-test` hoặc `/pd-fix-bug` |
| 7 | Phase hoàn tất, còn phases tiếp | `/pd-plan [y.y]` |
| 7.5 | Tất cả phases ✅ + chưa có `.planning/audit/SECURITY_REPORT.md` | `/pd-audit` — "Chưa kiểm toán bảo mật. Chạy `/pd-audit` trước khi đóng milestone." |
| 8 | Tất cả phases hoàn tất | `/pd-complete-milestone` |
## Bước 5: Hiển thị báo cáo
```
╔══════════════════════════════════════╗
║         TIẾN TRÌNH DỰ ÁN            ║
╠══════════════════════════════════════╣
║ Dự án/Tầm nhìn (từ PROJECT.md)     ║
║ Milestone: [tên] (v[x.x])          ║
║ Phase: [x.x]                        ║
║ Trạng thái: ✅[N] 🔄[N] ⬜[N] 🐛[N] ❌[N] ║
║ Yêu cầu: [X]/[Y] | Bugs mở: [N]   ║
║ Vấn đề chặn: [từ STATE.md]         ║
╠══════════════════════════════════════╣
║ GỢI Ý: [command] — [lý do]         ║
╚══════════════════════════════════════╝
```
Thiếu SCAN_REPORT → gợi ý phụ `/pd-scan`
## Bước 6: Kiểm tra phiên bản Skills
Nếu đã kiểm tra trong conversation → bỏ qua.
`.pdconfig` → `SKILLS_DIR`. Kiểm tra `git rev-parse --git-dir` trong SKILLS_DIR → không phải git → bỏ qua.
`LOCAL=$(cat [SKILLS_DIR]/VERSION)` vs `REMOTE=$(cd [SKILLS_DIR] && git fetch origin main --quiet && git show origin/main:VERSION)` → semver compare → REMOTE mới hơn → "Skills v[REMOTE] đã có. Chạy `/pd-update`."
Fetch lỗi/version giống → bỏ qua.
</process>
<output>
**Create/Update:**
- No files are created or modified, read-only only
**Next step:** Suggested command based on the actual state
**Success when:**
- Progress is displayed clearly
- The suggested command matches the real current state
**Common errors:**
- `.planning/` does not exist -> run `/pd-init`
- `STATE.md` is missing or broken -> run `/pd-new-milestone` to recreate it
  </output>
<rules>
- All output MUST be in English
- READ ONLY. DO NOT edit any files
- DO NOT call FastCode MCP or Context7 MCP
- The suggested command MUST be based on the actual current state, never guessed
- KHÔNG gọi FastCode MCP — chỉ Read/Glob (Bash cho version check Bước 6)
- KHÔNG sửa file — chỉ đọc và báo cáo
- Thiếu CONTEXT.md → `/pd-init` rồi **DỪNG**
- Chỉ 1 gợi ý chính (ưu tiên cao nhất), kèm gợi ý phụ
- Task 🔄 hiển thị số + tên cụ thể
- Bugs mở hiển thị mô tả ngắn
- Format ngày DD_MM_YYYY
- Output PHẢI tiếng Việt có dấu
</rules>
