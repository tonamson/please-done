# Mẫu CURRENT_MILESTONE.md

> Dùng bởi: `/pd:new-milestone` (tạo)
> Cập nhật bởi: `/pd:plan`, `/pd:write-code`, `/pd:complete-milestone`
> Đọc bởi: tất cả commands (xác định version + phase hiện tại)

## Mục đích

CURRENT_MILESTONE.md là **con trỏ** đến milestone/phase đang hoạt động. File nhỏ, chỉ chứa 4 trường.

**Phân biệt với STATE.md:**
- `CURRENT_MILESTONE.md` = con trỏ (4 trường — version, phase, status)
- `STATE.md` = trạng thái chi tiết + bối cảnh tích lũy (xem @templates/state.md)

## Mẫu — Đang hoạt động

```markdown
# Milestone hiện tại
- milestone: [tên milestone]
- version: [x.x]
- phase: [x.x]
- status: [Chưa bắt đầu | Đang thực hiện]
```

## Mẫu — Hoàn tất toàn bộ

```markdown
# Milestone hiện tại
- milestone: Tất cả đã hoàn tất
- version: [version cuối]
- phase: -
- status: Hoàn tất toàn bộ
```

## Quy tắc cập nhật

| Thời điểm | Hành động |
|-----------|-----------|
| Tạo milestone (ghi đè) | Tạo mới với version + phase đầu tiên, status = `Chưa bắt đầu` |
| Tạo milestone (viết tiếp) | **Giữ nguyên** nếu đã tồn tại — milestone hiện tại vẫn đang hoạt động |
| Plan phase mới | Cập nhật `phase` CHỈ NẾU phase hiện tại chưa plan hoặc đã hoàn tất. KHÔNG cập nhật nếu phase hiện tại đang thực hiện (user đang plan trước cho phase sau). Cập nhật `status` → `Đang thực hiện` nếu đang là `Chưa bắt đầu` |
| Phase hoàn tất + phase tiếp đã plan | Auto-advance `phase` sang phase tiếp |
| Phase hoàn tất + phase tiếp chưa plan | Giữ nguyên, gợi ý `/pd:plan [phase tiếp]` |
| Đóng milestone (còn milestone tiếp) | Chuyển sang milestone tiếp: milestone, version, phase đầu tiên, `Chưa bắt đầu` |
| Đóng milestone (hết milestone) | `Tất cả đã hoàn tất`, version cuối, phase `-`, `Hoàn tất toàn bộ` |

## Lưu ý

- So sánh version bằng semver (tách major.minor thành số), KHÔNG dùng string comparison
- Phase đầu tiên = phase có số nhỏ nhất trong milestone
