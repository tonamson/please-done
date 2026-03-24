# Lệnh `pd new-milestone`

## Mục đích
Khởi tạo một Milestone hoặc Phase mới dựa trên `ROADMAP.md`.

## Cách hoạt động
1. **Quét ROADMAP:** Tìm Phase tiếp theo chưa thực hiện (VD: `Phase 1.2`).
2. **Cập nhật CURRENT_MILESTONE.md:** Đánh dấu giai đoạn đang làm việc.
3. **Tạo cấu trúc thư mục:** `.planning/milestones/[version]/phase-[phase]/`.
4. **Chuẩn bị file:** Copy các template cần thiết (Plan, Tasks, Research) vào thư mục mới.

## Khi nào cần chạy lệnh này?
- Ngay sau khi `pd init` hoàn tất để bắt đầu Phase đầu tiên.
- Sau khi `pd complete-milestone` để chuyển sang Phase tiếp theo.

## Kết quả (Output)
- Thư mục milestone mới sẵn sàng để chạy `pd plan`.
- Cập nhật trạng thái trong `STATE.md`.

---
**Bước tiếp theo:** [pd plan](plan.md)
