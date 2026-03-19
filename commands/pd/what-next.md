---
name: pd:what-next
description: Kiểm tra tiến trình dự án, gợi ý command tiếp theo khi quên hoặc bị gián đoạn
---

<objective>
Quét trạng thái toàn bộ .planning/ để xác định công việc đang dở hoặc bước tiếp theo. Hiển thị tiến trình + gợi ý chính xác command cần chạy.
</objective>

<context>
User input: $ARGUMENTS (không cần)

Skill này KHÔNG cần đọc rules — chỉ đọc trạng thái planning files.
Skill này KHÔNG gọi FastCode MCP — chỉ dùng built-in tools (Read, Glob, Bash cho version check).
</context>

<process>

## Bước 1: Kiểm tra nền tảng
Đọc lần lượt (dừng ở điểm THIẾU đầu tiên):

1. `.planning/CONTEXT.md` → tồn tại?
   - KHÔNG → gợi ý `/pd:init`, DỪNG
2. `.planning/scan/SCAN_REPORT.md` → tồn tại?
   - KHÔNG → ghi nhận thiếu scan (gợi ý phụ ở Bước 5), KHÔNG DỪNG — tiếp tục kiểm tra
3. `.planning/ROADMAP.md` → tồn tại?
   - KHÔNG → gợi ý `/pd:new-milestone`, DỪNG
4. `.planning/CURRENT_MILESTONE.md` → đọc `version`, `phase`, `status`
   - status = `Hoàn tất toàn bộ` → thông báo "Tất cả milestones đã hoàn tất!", DỪNG

## Bước 2: Kiểm tra bugs đang mở (filter theo milestone hiện tại)
Glob `.planning/bugs/BUG_*.md` → đọc header mỗi file:
- Grep dòng `> Trạng thái:` → tìm bugs có trạng thái **Chưa xử lý** hoặc **Đang sửa**
- Grep dòng `> Patch version:` → filter CHỈ bugs thuộc milestone hiện tại: match chính xác `[version]` HOẶC `[version].` theo sau bởi số (VD: milestone `1.0` → match `1.0`, `1.0.1`, `1.0.2` | KHÔNG match `1.1`, `1.10`, `10.0`)
- Nếu CÓ bugs mở thuộc milestone hiện tại → ghi nhận danh sách (sẽ báo ở Bước 4)
- Bugs thuộc milestone khác → ghi nhận riêng, hiện như gợi ý phụ (không ảnh hưởng ưu tiên chính)

## Bước 3: Kiểm tra tiến trình phase hiện tại
Đọc version + phase từ CURRENT_MILESTONE.md:

1. **Chưa có plan?** Glob `.planning/milestones/[version]/phase-[phase]/TASKS.md`
   - KHÔNG tồn tại → gợi ý `/pd:plan`, DỪNG

2. **Đọc TASKS.md** → đếm theo trạng thái:
   - Nếu TASKS.md tồn tại nhưng 0 tasks (đếm tất cả trạng thái = 0) → cảnh báo: "TASKS.md rỗng, có thể cần chạy `/pd:plan` lại." và DỪNG.
   - 🔄 (đang thực hiện) → ghi nhận task numbers
   - ⬜ (chưa bắt đầu) → ghi nhận task numbers
   - 🐛 (có lỗi) → ghi nhận task numbers
   - ✅ (hoàn tất) → đếm
   - ❌ (bị chặn) → ghi nhận task numbers

3. **Đọc CODE_REPORT** → Glob `.planning/milestones/[version]/phase-[phase]/reports/CODE_REPORT_TASK_*.md` → đếm

4. **Đọc ROADMAP.md** → xác định milestone hiện tại còn bao nhiêu phases và phases nào chưa plan/chưa hoàn tất.

5. **Đọc TEST_REPORT** (CHỈ nếu project có Backend HOẶC Flutter trong CONTEXT.md) → `.planning/milestones/[version]/phase-[phase]/TEST_REPORT.md` tồn tại?

## Bước 4: Phân tích + gợi ý
Dựa trên dữ liệu thu thập, xác định trạng thái và gợi ý theo **thứ tự ưu tiên** (chỉ gợi ý 1 hành động chính):

### Ưu tiên 1: Có bugs đang mở
> 🐛 Có [X] bug chưa giải quyết.
> → Chạy `/pd:fix-bug` để xử lý

### Ưu tiên 2: Có task đang làm dở (🔄)
> 🔄 Task [N]: [tên] đang thực hiện.
> → Chạy `/pd:write-code [N]` để tiếp tục

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

### Ưu tiên 6: Tất cả tasks ✅ nhưng chưa test hoặc test fail
CHỈ áp dụng khi project có (Backend NestJS HOẶC WordPress HOẶC Flutter) VÀ (chưa có TEST_REPORT HOẶC TEST_REPORT có tests fail).
Kiểm tra: Nếu TEST_REPORT không tồn tại → gợi ý `/pd:test`. Nếu tồn tại → Grep pattern `❌` → nếu có tests fail → gợi ý `/pd:fix-bug` trước.
> ✅ Phase [x.x] hoàn tất [N] tasks. Chưa có test report (hoặc có tests fail).
> → Chạy `/pd:test` để kiểm thử (hoặc `/pd:fix-bug` nếu có tests fail)

### Ưu tiên 7: Phase hiện tại hoàn tất, còn phases tiếp theo
Áp dụng khi tất cả tasks ✅ VÀ (không cần test HOẶC đã có TEST_REPORT pass). Bao gồm frontend-only projects.
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
║ Milestone: [tên] (v[x.x])          ║
║ Phase:     [x.x] - [tên phase]     ║
║ Trạng thái:                         ║
║   ✅ [N] hoàn tất                   ║
║   🔄 [N] đang làm                  ║
║   ⬜ [N] chưa bắt đầu              ║
║   🐛 [N] có lỗi                    ║
║   ❌ [N] bị chặn                   ║
║ Bugs mở: [N]                       ║
╠══════════════════════════════════════╣
║ 👉 GỢI Ý: [command gợi ý]         ║
║    [mô tả ngắn lý do]              ║
╚══════════════════════════════════════╝
```

Nếu không có SCAN_REPORT nhưng có ROADMAP → thêm dòng gợi ý phụ:
> 💡 Nên chạy `/pd:scan` để cập nhật báo cáo quét dự án.

## Bước 6: Kiểm tra phiên bản Skills (CHỈ nếu chưa kiểm tra trong conversation này)
Nếu đã kiểm tra version trong conversation hiện tại (VD: skill trước đã thông báo) → bỏ qua bước này.

Đọc `.pdconfig` (Bash: `cat ~/.claude/commands/pd/.pdconfig`) → lấy `SKILLS_DIR`.
Kiểm tra `git rev-parse --git-dir` trong SKILLS_DIR trước khi fetch. Nếu không phải git repo → bỏ qua version check.
So sánh version: `LOCAL=$(cat [SKILLS_DIR]/VERSION 2>/dev/null)` và `REMOTE=$(cd [SKILLS_DIR] && git fetch origin main --quiet 2>/dev/null && git show origin/main:VERSION 2>/dev/null)`
Nếu `REMOTE` khác `LOCAL` và `REMOTE` không rỗng → thêm dòng trong báo cáo:
> 💡 Skills v[REMOTE] đã có. Chạy `/pd:update` để cập nhật.

Nếu fetch lỗi hoặc version giống → bỏ qua.

</process>

<rules>
- KHÔNG gọi FastCode MCP — chỉ dùng Read/Glob để đọc planning files (Bash cho version check ở Bước 6)
- KHÔNG sửa bất kỳ file nào — chỉ đọc và báo cáo
- KHÔNG cần CONTEXT.md để chạy — nếu thiếu thì gợi ý `/pd:init`
- Chỉ gợi ý 1 hành động chính (ưu tiên cao nhất), có thể kèm gợi ý phụ
- Hiển thị task đang dở (🔄) với số thứ tự + tên cụ thể để user dễ tiếp tục
- Hiển thị bugs mở với mô tả ngắn
- Tuân thủ format ngày tháng DD_MM_YYYY từ general.md
- Mọi output PHẢI bằng tiếng Việt có dấu — bao gồm thông báo, gợi ý, bảng tiến trình
</rules>
