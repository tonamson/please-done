# Lệnh `pd update`

## Mục đích
Cập nhật hoặc điều chỉnh Kế hoạch (Plan) và Danh sách công việc (Tasks) khi có thay đổi từ phía User hoặc trong quá trình thực thi.

## Cách hoạt động
1. **Phân tích yêu cầu thay đổi:** Đọc feedback của User hoặc lỗi phát sinh cần đổi hướng.
2. **Cập nhật `PLAN.md`:** Điều chỉnh giải pháp kỹ thuật, thêm/bớt các Truths.
3. **Cập nhật `TASKS.md`:** Thêm task mới, hủy task cũ hoặc sửa lại mô tả file.
4. **Tái kiểm tra (Plan-Check):** Đảm bảo kế hoạch sau khi sửa vẫn đạt chuẩn chất lượng.

## Khi nào cần chạy lệnh này?
- User đổi ý về một tính năng đang làm.
- Phát hiện ra giải pháp trong `pd plan` trước đó không khả thi.
- Cần bổ sung thêm Task vào Milestone hiện tại mà không muốn hủy bỏ toàn bộ.

## Kết quả (Output)
- File `PLAN.md` và `TASKS.md` được cập nhật.
- Báo cáo kết quả kiểm tra kế hoạch mới.

---
**Bước tiếp theo:** [pd what-next](what-next.md)
