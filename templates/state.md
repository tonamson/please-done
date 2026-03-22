# Mẫu STATE.md

> `/pd:new-milestone` tạo/đặt lại | `/pd:plan`, `/pd:write-code`, `/pd:complete-milestone` cập nhật | `/pd:plan`, `/pd:what-next` đọc

Trạng thái làm việc hiện tại: vị trí, hoạt động cuối, bối cảnh tích lũy, vấn đề chặn.

- `CURRENT_MILESTONE.md` = con trỏ nhỏ (4 trường) — @templates/current-milestone.md
- `STATE.md` = trạng thái chi tiết + bối cảnh tích lũy

## Mẫu

```markdown
# Trạng thái làm việc
> Cập nhật: [DD_MM_YYYY]

## Vị trí hiện tại
- Milestone: v[X.Y] — [Tên milestone]
- Phase: [Chưa bắt đầu | x.x]
- Kế hoạch: [— | Kế hoạch hoàn tất, sẵn sàng code | Đang code]
- Trạng thái: [Sẵn sàng lên kế hoạch | Đang thực hiện | Milestone v[X.Y] hoàn tất]
- Hoạt động cuối: [DD_MM_YYYY] — [mô tả ngắn]

## Bối cảnh tích lũy
[Milestone trước → giữ bối cảnh có giá trị. Milestone đầu → "Chưa có bối cảnh tích lũy."]

## Vấn đề chặn
[Không | Mô tả vấn đề]
```

## Quy tắc cập nhật

| Thời điểm | Hành động |
|-----------|-----------|
| Tạo milestone mới | Đặt lại, **GIỮ** "Bối cảnh tích lũy" |
| Bắt đầu milestone | `Hoạt động cuối: [ngày] — Bắt đầu milestone mới` |
| Nghiên cứu xong | `Hoạt động cuối: [ngày] — Nghiên cứu hoàn tất` |
| Yêu cầu duyệt | `Hoạt động cuối: [ngày] — Yêu cầu v[X.Y] đã duyệt` |
| Lộ trình duyệt | `Hoạt động cuối: [ngày] — Lộ trình v[X.Y] đã duyệt` |
| Plan phase xong | Phase → [x.x], Kế hoạch → `sẵn sàng code` |
| Bắt đầu code | Kế hoạch → `Đang code` |
| Phase xong | `Hoạt động cuối: [ngày] — Phase [x.x] hoàn tất` |
| Auto-advance | Phase → [mới], Kế hoạch → `sẵn sàng code` (đồng bộ CURRENT_MILESTONE) |
| Đóng milestone | Trạng thái → `Milestone v[X.Y] hoàn tất` |

**"Bối cảnh tích lũy" KHÔNG BAO GIỜ bị xóa sạch** — chỉ bổ sung hoặc giữ nguyên.
