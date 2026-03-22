# State Machine — Luồng trạng thái dự án

> Dùng bởi: tất cả commands (validation), `/pd:what-next` (gợi ý)
> Mục đích: định nghĩa rõ trạng thái hợp lệ, chuyển tiếp, điều kiện

## Luồng chính

```
Chưa khởi tạo
  → [/pd:init] → Đã khởi tạo
    → [/pd:scan] → Đã quét (tùy chọn)
    → [/pd:new-milestone] → Có lộ trình
      → [/pd:plan] → Có kế hoạch
        → [/pd:write-code] → Đang code
          → [/pd:test] → Đã test (tùy chọn)
          → [/pd:complete-milestone] → Milestone hoàn tất
            → [/pd:new-milestone] → Có lộ trình (cycle mới)
```

**Nhánh phụ** (chạy bất kỳ lúc nào sau init):
- `/pd:fix-bug` → điều tra + sửa lỗi
- `/pd:what-next` → kiểm tra tiến trình
- `/pd:fetch-doc` → cache tài liệu
- `/pd:update` → cập nhật skills

## Trạng thái phase

```
⬜ Chưa plan
  → [/pd:plan] → Đã plan (có RESEARCH.md + PLAN.md + TASKS.md + Tiêu chí thành công) → commit kế hoạch
    → [/pd:write-code] → Đang code (có task 🔄)
      → [tất cả tasks ✅] → Goal-backward verify (Truths check) → Phase hoàn tất
        → auto-advance CURRENT_MILESTONE (nếu phase tiếp đã plan)
          → [/pd:test] → tự phát hiện phase cũ chưa test
```

## Điều kiện tiên quyết

| Command | Yêu cầu tồn tại | Nếu thiếu |
|---------|-----------------|-----------|
| `/pd:init` | — | Luôn chạy được |
| `/pd:scan` | CONTEXT.md | "Chạy `/pd:init` trước" |
| `/pd:new-milestone` | CONTEXT.md + rules/general.md | "Chạy `/pd:init` trước" |
| `/pd:plan` | CONTEXT.md + ROADMAP.md + CURRENT_MILESTONE.md | Gợi ý command phù hợp |
| `/pd:write-code` | CONTEXT.md + PLAN.md + TASKS.md | "Chạy `/pd:plan` trước" |
| `/pd:test` | CONTEXT.md + PLAN.md + TASKS.md (≥1 task ✅) | "Chạy `/pd:write-code` trước" |
| `/pd:fix-bug` | CONTEXT.md | "Chạy `/pd:init` trước" |
| `/pd:complete-milestone` | CONTEXT.md + CURRENT_MILESTONE.md + tất cả tasks ✅ + bugs đã đóng | Liệt kê blockers |
| `/pd:what-next` | — | Gợi ý `/pd:init` nếu thiếu CONTEXT.md |
| `/pd:fetch-doc` | CONTEXT.md | "Chạy `/pd:init` trước" |
| `/pd:update` | — | Luôn chạy được |

## Chuyển tiếp phase (Auto-advance)

Khi TẤT CẢ tasks trong phase hiện tại ✅:
1. `/pd:write-code` kiểm tra ROADMAP → có phase tiếp?
2. Phase tiếp đã có TASKS.md? → auto-advance `phase` trong CURRENT_MILESTONE.md
3. Phase tiếp chưa plan? → giữ nguyên, gợi ý `/pd:plan [phase tiếp]`

**Lưu ý auto-advance + test:**
- Auto-advance xảy ra ngay khi phase hoàn tất, TRƯỚC khi user chạy `/pd:test`
- `/pd:test` tự phát hiện phase cũ chưa test: khi phase hiện tại (mới) không có task ✅ → quét phases khác tìm phase hoàn tất chưa có TEST_REPORT → tự chuyển sang test phase đó
- `/pd:what-next` cũng quét tất cả phases để phát hiện phase chưa test (Ưu tiên 5.5)

## Edge cases

### Skip phase
- KHÔNG có cơ chế skip tự động
- User muốn skip → chạy `/pd:plan [phase sau]` trực tiếp
- Phase bị skip hiện trong ROADMAP với deliverables `- [ ]`
- `/pd:complete-milestone` cảnh báo phases chưa triển khai → user chọn bỏ qua hoặc plan thêm

### Rollback phase
- KHÔNG có cơ chế rollback tự động
- User muốn redo → chạy `/pd:plan [phase cũ]` → hệ thống cảnh báo tasks đã hoàn thành → user chọn ghi đè
- Code đã commit giữ nguyên trong git history

### Re-plan phase đang code
- `/pd:plan [phase hiện tại]` khi có tasks 🔄 hoặc ✅ → cảnh báo user
- User phải xác nhận ghi đè → tasks cũ mất trạng thái

### Test phát hiện lỗi sau khi code xong (✅ → 🐛)
- `/pd:write-code` đánh ✅ sau khi code + build + commit thành công
- `/pd:test` chạy sau → nếu test fail → đổi task từ ✅ sang 🐛
- Đây là chuyển tiếp hợp lệ: code pass build nhưng fail test logic
- `/pd:complete-milestone` sẽ chặn nếu có task 🐛 → user phải chạy `/pd:fix-bug` trước
- Sau fix → task quay lại ✅

### Plan --discuss bị ngắt giữa chừng
- Trạng thái thảo luận lưu trong `.planning/milestones/[version]/phase-[phase]/DISCUSS_STATE.md`
- Chạy `/pd:plan --discuss` lại → đọc DISCUSS_STATE.md → resume từ vấn đề chưa chốt
- Nếu không có DISCUSS_STATE.md → bắt đầu thảo luận lại từ đầu

### Lỗi giữa chừng
- Task build fail → giữ 🔄, không đánh ✅
- `.planning/` corrupt → `/pd:what-next` phát hiện thiếu file → gợi ý command phù hợp
- Phiên bị ngắt → STATE.md + CURRENT_MILESTONE.md giữ context → user chạy `/pd:what-next`

### Circular dependency
- Tasks phụ thuộc lẫn nhau → `/pd:write-code` phát hiện → thông báo user: "Phát hiện circular dependency hoặc missing dependency giữa [tasks]. Kiểm tra lại TASKS.md."
- KHÔNG tự pick task khi tất cả bị chặn
- **DỪNG** flow write-code — user cần sửa TASKS.md (xóa hoặc đảo dependency) rồi chạy lại `/pd:write-code`
