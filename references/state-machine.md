# State Machine — Luồng trạng thái dự án

> Dùng bởi: tất cả commands (validation), `/pd:what-next` (gợi ý)
> Định nghĩa trạng thái hợp lệ, chuyển tiếp, điều kiện

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

**Nhánh phụ** (bất kỳ lúc nào sau init):
- `/pd:fix-bug` → điều tra + sửa lỗi
- `/pd:what-next` → kiểm tra tiến trình
- `/pd:fetch-doc` → cache tài liệu
- `/pd:update` → cập nhật skills

## Trạng thái phase

```
⬜ Chưa plan
  → [/pd:plan] → Đã plan (có RESEARCH.md + PLAN.md + TASKS.md + Tiêu chí thành công) → commit kế hoạch
    → [/pd:write-code] → Đang code (có task 🔄)
      → [tất cả tasks ✅] → Xác minh 4 cấp (Tồn tại → Thực chất → Kết nối → Truths)
        → [xác minh đạt] → Phase hoàn tất → chuyển tiếp tự động
        → [có gap] → Tự sửa code (tối đa 2 vòng) → Xác minh lại
          → [vẫn fail sau 2 vòng] → DỪNG, hỏi user (fix-bug / re-plan / bỏ qua)
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

Khi TẤT CẢ tasks ✅:
1. Kiểm tra ROADMAP → có phase tiếp?
2. Phase tiếp có TASKS.md? → auto-advance `phase` trong CURRENT_MILESTONE.md
3. Chưa plan? → giữ nguyên, gợi ý `/pd:plan [phase tiếp]`

**Auto-advance + test:**
- Auto-advance xảy ra ngay khi phase hoàn tất, TRƯỚC `/pd:test`
- `/pd:test` tự phát hiện phase cũ chưa test: phase mới không có task ✅ → quét phases khác tìm phase hoàn tất chưa có TEST_REPORT
- `/pd:what-next` cũng quét phases phát hiện chưa test (Ưu tiên 5.5)

## Edge cases

### Skip phase
- KHÔNG có skip tự động
- User muốn skip → `/pd:plan [phase sau]` trực tiếp
- Phase bị skip hiện ROADMAP với deliverables `- [ ]`
- `/pd:complete-milestone` cảnh báo phases chưa triển khai → user chọn bỏ qua/plan thêm

### Rollback phase
- KHÔNG có rollback tự động
- User muốn redo → `/pd:plan [phase cũ]` → cảnh báo tasks đã hoàn thành → user chọn ghi đè
- Code đã commit giữ nguyên git history

### Re-plan phase đang code
- `/pd:plan [phase hiện tại]` khi có tasks 🔄/✅ → cảnh báo user
- User xác nhận ghi đè → tasks cũ mất trạng thái

### Test phát hiện lỗi (✅ → 🐛)
- `/pd:write-code` đánh ✅ sau code + build + commit
- `/pd:test` → test fail → đổi ✅ → 🐛
- Chuyển tiếp hợp lệ: code pass build nhưng fail test logic
- `/pd:complete-milestone` chặn nếu có 🐛 → chạy `/pd:fix-bug` trước

### Plan --discuss bị ngắt
- Trạng thái lưu `.planning/milestones/[version]/phase-[phase]/DISCUSS_STATE.md`
- Chạy lại → đọc DISCUSS_STATE.md → resume vấn đề chưa chốt
- Không có DISCUSS_STATE.md → bắt đầu lại

### Lỗi giữa chừng
- Build fail → giữ 🔄, không đánh ✅
- `.planning/` corrupt → `/pd:what-next` phát hiện thiếu file → gợi ý command
- Phiên bị ngắt → STATE.md + CURRENT_MILESTONE.md giữ context → `/pd:what-next`

### Circular dependency
- Tasks phụ thuộc lẫn nhau → `/pd:write-code` phát hiện → thông báo user
- KHÔNG tự pick task khi tất cả bị chặn
- **DỪNG** flow — user sửa TASKS.md (xóa/đảo dependency) rồi chạy lại
