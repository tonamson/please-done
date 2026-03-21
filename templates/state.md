# Mẫu STATE.md

> Dùng bởi: `/pd:new-milestone` (tạo/đặt lại)
> Cập nhật bởi: `/pd:plan`, `/pd:write-code`, `/pd:complete-milestone`
> Đọc bởi: `/pd:plan`, `/pd:what-next`

## Mục đích

STATE.md là **trạng thái làm việc** hiện tại. Chứa:
- Vị trí hiện tại (milestone, phase, trạng thái)
- Hoạt động cuối
- Bối cảnh tích lũy (kế thừa giữa các milestones — KHÔNG BAO GIỜ xóa sạch)
- Vấn đề chặn

**Phân biệt với các file khác:**
- `CURRENT_MILESTONE.md` = con trỏ nhỏ (4 trường) — xem @templates/current-milestone.md
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
[Nếu có milestone trước → giữ lại bối cảnh có giá trị: mô hình đã xác lập, quy ước, bài học kinh nghiệm.
Nếu milestone đầu tiên → "Chưa có bối cảnh tích lũy."]

## Vấn đề chặn
[Không | Mô tả vấn đề]
```

## Quy tắc cập nhật

| Thời điểm | Hành động |
|-----------|-----------|
| Tạo milestone mới | Đặt lại toàn bộ, **GIỮ** "Bối cảnh tích lũy" từ milestone trước |
| Bắt đầu milestone | `Hoạt động cuối: [ngày] — Bắt đầu khởi tạo milestone mới` |
| Nghiên cứu hoàn tất | `Hoạt động cuối: [ngày] — Nghiên cứu lĩnh vực hoàn tất` |
| Yêu cầu đã duyệt | `Hoạt động cuối: [ngày] — Yêu cầu milestone v[X.Y] đã duyệt` |
| Lộ trình đã duyệt | `Hoạt động cuối: [ngày] — Lộ trình milestone v[X.Y] đã duyệt` |
| Plan phase hoàn tất | Phase → [x.x] (CHỈ nếu CURRENT_MILESTONE cũng cập nhật), Kế hoạch → `Kế hoạch hoàn tất, sẵn sàng code` |
| Bắt đầu code (task đầu tiên 🔄) | Kế hoạch → `Đang code` |
| Phase code hoàn tất | `Hoạt động cuối: [ngày] — Phase [x.x] hoàn tất` |
| Auto-advance (phase tiếp đã plan) | Phase → [phase mới], Kế hoạch → `Kế hoạch hoàn tất, sẵn sàng code` (đồng bộ CURRENT_MILESTONE) |
| Đóng milestone | Trạng thái → `Milestone v[X.Y] hoàn tất` |

**"Bối cảnh tích lũy" KHÔNG BAO GIỜ bị xóa sạch** — chỉ được bổ sung hoặc giữ nguyên.
