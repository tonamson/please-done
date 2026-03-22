# Mẫu CURRENT_MILESTONE.md

> `/pd:new-milestone` tạo | `/pd:plan`, `/pd:write-code`, `/pd:complete-milestone` cập nhật | Tất cả commands đọc

Con trỏ milestone/phase đang hoạt động (4 trường). Khác STATE.md (trạng thái chi tiết + bối cảnh tích lũy — @templates/state.md).

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
| Tạo milestone (ghi đè) | Tạo mới, status = `Chưa bắt đầu` |
| Tạo milestone (viết tiếp) | **Giữ nguyên** nếu đã tồn tại |
| Plan phase mới | Cập nhật `phase` CHỈ NẾU phase hiện tại chưa plan/đã xong. KHÔNG nếu đang thực hiện. `status` → `Đang thực hiện` nếu `Chưa bắt đầu` |
| Phase xong + tiếp đã plan | Auto-advance `phase` |
| Phase xong + tiếp chưa plan | Giữ nguyên, gợi ý `/pd:plan` |
| Đóng (còn tiếp) | Chuyển milestone tiếp, `Chưa bắt đầu` |
| Đóng (hết) | `Tất cả đã hoàn tất`, version cuối, `-`, `Hoàn tất toàn bộ` |

So sánh version bằng semver (tách major.minor thành số), KHÔNG string comparison. Phase đầu = số nhỏ nhất trong milestone.
