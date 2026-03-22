<purpose>
Quét trạng thái toàn bộ .planning/ để xác định công việc đang dở hoặc bước tiếp theo.
Hiển thị tiến trình + gợi ý chính xác command cần chạy. Skill này CHỈ ĐỌC, KHÔNG sửa bất kỳ file nào.
</purpose>

<required_reading>
Đọc tất cả files được tham chiếu trước khi bắt đầu:
- @references/conventions.md → biểu tượng trạng thái Task, version filtering (match bugs thuộc milestone)
- @references/state-machine.md → điều kiện tiên quyết các commands, luồng trạng thái
</required_reading>

<process>

## Bước 1: Kiểm tra nền tảng
Đọc lần lượt (dừng ở điểm THIẾU đầu tiên):

1. `.planning/CONTEXT.md` → tồn tại?
   - KHÔNG → gợi ý `/pd:init`, DỪNG
1.5. `.planning/PROJECT.md` (nếu có) → đọc tầm nhìn dự án + lịch sử milestones (hiển thị ở Bước 5)
2. `.planning/scan/SCAN_REPORT.md` → tồn tại?
   - KHÔNG → ghi nhận thiếu scan (gợi ý phụ ở Bước 5), KHÔNG DỪNG — tiếp tục kiểm tra
3. `.planning/ROADMAP.md` → tồn tại?
   - KHÔNG → gợi ý `/pd:new-milestone`, DỪNG
4. `.planning/CURRENT_MILESTONE.md` → đọc `version`, `phase`, `status`
   - status = `Hoàn tất toàn bộ` → thông báo "Tất cả milestones đã hoàn tất!", DỪNG
5. `.planning/REQUIREMENTS.md` (nếu có) → đọc thống kê độ phủ (đã gắn/chưa gắn), trạng thái yêu cầu
6. `.planning/STATE.md` (nếu có) → đọc vấn đề chặn, bối cảnh tích lũy, hoạt động cuối

## Bước 2: Kiểm tra bugs đang mở (filter theo milestone hiện tại)
Glob `.planning/bugs/BUG_*.md` → đọc header mỗi file:
- Grep dòng `> Trạng thái:` → tìm bugs có trạng thái **Chưa xử lý** hoặc **Đang sửa**
- Grep dòng `> Patch version:` → filter CHỈ bugs thuộc milestone hiện tại theo @references/conventions.md → "Version filtering"
- Nếu CÓ bugs mở thuộc milestone hiện tại → ghi nhận danh sách (sẽ báo ở Bước 4)
- Bugs thuộc milestone khác → ghi nhận riêng, hiện như gợi ý phụ (không ảnh hưởng ưu tiên chính)

## Bước 3: Kiểm tra tiến trình phase hiện tại
Đọc version + phase từ CURRENT_MILESTONE.md:

1. **Chưa có plan?** Glob `.planning/milestones/[version]/phase-[phase]/TASKS.md`
   - KHÔNG tồn tại → gợi ý `/pd:plan`, DỪNG

2. **Đọc TASKS.md** → đếm theo trạng thái (xem @references/conventions.md → "Biểu tượng trạng thái Task"):
   - Nếu TASKS.md tồn tại nhưng 0 tasks (đếm tất cả trạng thái = 0) → cảnh báo: "TASKS.md rỗng, có thể cần chạy `/pd:plan` lại." và DỪNG.
   - 🔄 (đang thực hiện) → ghi nhận task numbers
   - ⬜ (chưa bắt đầu) → ghi nhận task numbers
   - 🐛 (có lỗi) → ghi nhận task numbers
   - ✅ (hoàn tất) → đếm
   - ❌ (bị chặn) → ghi nhận task numbers

3. **Đọc CODE_REPORT** → Glob `.planning/milestones/[version]/phase-[phase]/reports/CODE_REPORT_TASK_*.md` → đếm

4. **Đọc ROADMAP.md** → xác định milestone hiện tại còn bao nhiêu phases và phases nào chưa plan/chưa hoàn tất.

5. **Đọc TEST_REPORT** → `.planning/milestones/[version]/phase-[phase]/TEST_REPORT.md` tồn tại? (kiểm tra cho MỌI project — backend lẫn frontend-only)

6. **Quét phases cũ chưa test** (phát hiện auto-advance bỏ qua test):
   - Glob `milestones/[version]/phase-*/TASKS.md` → với MỖI phase:
     - Đọc TASKS.md → nếu TẤT CẢ tasks ✅ VÀ `phase-[N]/TEST_REPORT.md` KHÔNG tồn tại → ghi nhận là "phase hoàn tất chưa test"
   - Danh sách này dùng ở Ưu tiên 5.5 (bên dưới)

7. **Đọc VERIFICATION_REPORT** → `.planning/milestones/[version]/phase-[phase]/VERIFICATION_REPORT.md` tồn tại? Nếu CÓ → đọc trạng thái (`Đạt` / `Có gap` / `Cần kiểm tra thủ công`)

## Bước 4: Phân tích + gợi ý
Dựa trên dữ liệu thu thập, xác định trạng thái và gợi ý theo **thứ tự ưu tiên** (chỉ gợi ý 1 hành động chính):

### Ưu tiên 1: Có bugs đang mở
> 🐛 Có [X] bug chưa giải quyết.
> → Chạy `/pd:fix-bug` để xử lý

### Ưu tiên 2: Có task đang làm dở (🔄)
Kiểm tra PROGRESS.md (`milestones/[version]/phase-[phase]/PROGRESS.md`):
- Nếu CÓ → đọc giai đoạn + files đã viết → hiển thị chi tiết cho user
- Nếu KHÔNG → chỉ biết task đang 🔄, không rõ tiến trình
> 🔄 Task [N]: [tên] đang thực hiện. [Nếu có PROGRESS.md: "Giai đoạn: [X], files: [Y]/[Z]"]
> → Chạy `/pd:write-code [N]` để tiếp tục (tự khôi phục từ chỗ dừng)

### Ưu tiên 3: Có task bị lỗi (🐛)
Nếu có task 🐛 nhưng không có bug report mở tương ứng → cảnh báo: "Task [N] có trạng thái 🐛 nhưng không tìm thấy bug report mở. Có thể cần cập nhật trạng thái task."
> 🐛 Task [N]: [tên] có lỗi cần sửa.
> → Chạy `/pd:fix-bug` để debug

### Ưu tiên 4: Còn task chưa bắt đầu (⬜)
> ⬜ Còn [X] tasks chưa bắt đầu trong phase [x.x].
> → Chạy `/pd:write-code` để pick task tiếp theo
> → Hoặc `/pd:write-code --parallel` để chạy song song tasks độc lập

### Ưu tiên 5: TẤT CẢ tasks còn lại bị chặn (❌) hoặc lỗi (🐛)
> ❌ Tất cả [X] tasks còn lại đều bị chặn hoặc có lỗi.
> → Chạy `/pd:fix-bug` để xử lý lỗi, hoặc kiểm tra lý do chặn

### Ưu tiên 5.5: Phase có verification gaps
Nếu Bước 3.7 phát hiện VERIFICATION_REPORT.md với trạng thái `Có gap`:
> ⚠️ Phase [x.x] có [N] gaps chưa sửa trong verification.
> → Chạy `/pd:fix-bug` để sửa gaps, hoặc `/pd:write-code` để re-verify

### Ưu tiên 5.6: Phase cũ hoàn tất nhưng chưa test (phát hiện auto-advance)
Nếu Bước 3.6 phát hiện phase(s) hoàn tất chưa test VÀ phase đó KHÁC phase hiện tại:
> ⚠️ Phase [x.x] đã hoàn tất [N] tasks nhưng chưa có TEST_REPORT.
> → Chạy `/pd:test` để kiểm thử phase [x.x] (sẽ tự phát hiện phase chưa test)

### Ưu tiên 6: Tất cả tasks ✅ nhưng chưa test hoặc test fail
Áp dụng cho MỌI project (backend, frontend-only, hoặc kết hợp). Kiểm tra TEST_REPORT:
- Nếu TEST_REPORT không tồn tại → gợi ý `/pd:test`
- Nếu tồn tại → Grep pattern `❌` → nếu có tests fail → gợi ý `/pd:fix-bug` trước
> ✅ Phase [x.x] hoàn tất [N] tasks. Chưa có báo cáo kiểm thử (hoặc có tests fail).
> → Chạy `/pd:test` để kiểm thử (hoặc `/pd:fix-bug` nếu có tests fail)

### Ưu tiên 7: Phase hiện tại hoàn tất, còn phases tiếp theo
Áp dụng khi tất cả tasks ✅ VÀ đã có TEST_REPORT pass (bất kể stack).
Đọc ROADMAP.md → kiểm tra milestone hiện tại còn phases chưa plan:
> ✅ Phase [x.x] hoàn tất. Milestone còn phase [y.y] chưa triển khai.
> → Chạy `/pd:plan [y.y]` để lên kế hoạch phase tiếp

### Ưu tiên 8: Tất cả phases hoàn tất → sẵn sàng đóng milestone
> ✅ Tất cả phases trong milestone v[x.x] đã hoàn tất.
> → Chạy `/pd:complete-milestone` để đóng phiên bản

## Bước 5: Hiển thị báo cáo
```
╔══════════════════════════════════════╗
║         TIẾN TRÌNH DỰ ÁN            ║
╠══════════════════════════════════════╣
║ Dự án:     [tên — từ PROJECT.md]   ║
║ Tầm nhìn:  [1 dòng — từ PROJECT.md]║
║ Milestone: [tên] (v[x.x])          ║
║ Phase:     [x.x] - [tên phase]     ║
║ Trạng thái:                         ║
║   ✅ [N] hoàn tất                   ║
║   🔄 [N] đang làm                  ║
║   ⬜ [N] chưa bắt đầu              ║
║   🐛 [N] có lỗi                    ║
║   ❌ [N] bị chặn                   ║
║ Yêu cầu: [X]/[Y] hoàn tất           ║
║ Bugs mở: [N]                       ║
║ Vấn đề chặn: [từ STATE.md hoặc "Không"]║
╠══════════════════════════════════════╣
║ 👉 GỢI Ý: [command gợi ý]         ║
║    [mô tả ngắn lý do]              ║
╚══════════════════════════════════════╝
```

Nếu không có SCAN_REPORT nhưng có ROADMAP → thêm dòng gợi ý phụ:
> 💡 Nên chạy `/pd:scan` để cập nhật báo cáo quét dự án.

## Bước 6: Kiểm tra phiên bản Skills (CHỈ nếu chưa kiểm tra trong conversation này)
Nếu đã kiểm tra version trong conversation hiện tại (VD: skill trước đã thông báo) → bỏ qua bước này.

Đọc `.pdconfig` → lấy `SKILLS_DIR`.
(Claude Code: `cat ~/.claude/commands/pd/.pdconfig` — nền tảng khác: trình cài đặt chuyển đổi đường dẫn tự động)
Kiểm tra `git rev-parse --git-dir` trong SKILLS_DIR trước khi fetch. Nếu không phải git repo → bỏ qua version check.
So sánh version bằng semver (tách thành số, so sánh từng phần major.minor.patch — KHÔNG dùng string comparison):
`LOCAL=$(cat [SKILLS_DIR]/VERSION 2>/dev/null)` và `REMOTE=$(cd [SKILLS_DIR] && git fetch origin main --quiet 2>/dev/null && git show origin/main:VERSION 2>/dev/null)`
Nếu `REMOTE` mới hơn `LOCAL` (semver so sánh) và `REMOTE` không rỗng → thêm dòng trong báo cáo:
> 💡 Skills v[REMOTE] đã có. Chạy `/pd:update` để cập nhật.

Nếu fetch lỗi hoặc version giống → bỏ qua.

</process>

<rules>
- KHÔNG gọi FastCode MCP — chỉ dùng Read/Glob để đọc planning files (Bash cho version check ở Bước 6)
- KHÔNG sửa bất kỳ file nào — chỉ đọc và báo cáo
- Nếu thiếu CONTEXT.md → gợi ý `/pd:init` rồi DỪNG (xử lý an toàn, không crash)
- Chỉ gợi ý 1 hành động chính (ưu tiên cao nhất), có thể kèm gợi ý phụ
- Hiển thị task đang dở (🔄) với số thứ tự + tên cụ thể để user dễ tiếp tục
- Hiển thị bugs mở với mô tả ngắn
- Tuân thủ format ngày tháng DD_MM_YYYY từ @references/conventions.md
- Mọi output PHẢI bằng tiếng Việt có dấu — bao gồm thông báo, gợi ý, bảng tiến trình
</rules>
