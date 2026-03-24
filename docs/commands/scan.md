# Lệnh `pd scan`

## Mục đích
Kiểm tra sức khỏe tổng quát của dự án và sự đồng bộ (Sync) giữa Code thực tế và Tài liệu thiết kế.

## Cách hoạt động
1. **Quét Codebase:** AI xem xét những file đã thay đổi gần đây.
2. **Đối chiếu với `PLAN.md`:** Kiểm tra xem các thay đổi có đúng như kế hoạch ban đầu không.
3. **Phát hiện "Trôi lệch" (Desync):**
   - Nếu bạn tự sửa code mà không báo cho AI qua Plan.
   - Nếu AI thực hiện sai so với kế hoạch.
4. **Báo cáo:** Liệt kê các điểm lệch pha và đề xuất cách sửa (thường là chạy `pd fix-bug` hoặc cập nhật lại Plan).

## Khi nào cần chạy lệnh này?
- Khi bạn vừa thực hiện một thay đổi thủ công lớn trong code.
- Khi Agent có vẻ đang làm sai hướng.
- Trước khi bắt đầu một Milestone mới để đảm bảo "nền móng" đang sạch.

## Kết quả (Output)
- Danh sách các file bị lệch pha.
- Đề xuất hành động để đồng bộ lại dự án.

---
**Bước tiếp theo:** [pd fix-bug](fix-bug.md) hoặc [pd what-next](what-next.md).
