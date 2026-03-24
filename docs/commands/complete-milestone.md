# Lệnh `pd complete-milestone`

## Mục đích
Kết thúc một giai đoạn (Phase/Milestone) của dự án. Đây là bước dọn dẹp và đóng gói thành quả.

## Quy trình AI thực hiện
1. **Kiểm tra trạng thái:** Đảm bảo 100% Task trong `TASKS.md` đã `COMPLETED`.
2. **Xác nhận báo cáo:** Kiểm tra xem `verification-report.md` đã có kết quả Pass chưa.
3. **Cập nhật tài liệu:**
   - Đánh dấu trạng thái `Done` trong `ROADMAP.md`.
   - Tổng kết những gì đã làm vào `CHANGELOG.md`.
4. **Dọn dẹp:** Xóa các file rác hoặc ghi chú tạm thời không cần thiết.
5. **Đề xuất Phase tiếp theo:** Dựa trên `ROADMAP.md` để gợi ý bước đi tiếp theo.

## Tại sao lệnh này quan trọng?
Nó giúp dự án luôn ngăn nắp. Mỗi Milestone hoàn thành là một "điểm checkpoint" vững chắc để tiến lên giai đoạn sau.

## Kết quả (Output)
- Cập nhật `ROADMAP.md` và `CHANGELOG.md`.
- File `STATE.md` được reset để chuẩn bị cho Milestone mới.
- Một bản tổng kết ngắn gọn cho User về những gì đã đạt được.

---
**Bước tiếp theo:** [pd new-milestone](new-milestone.md)
