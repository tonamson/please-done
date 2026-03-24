# Tra Cứu Hệ Lệnh please-done (PD)

Hệ thống **please-done (PD)** bao gồm các lệnh CLI được thiết kế để dẫn dắt AI Agent đi qua quy trình phát triển phần mềm chuẩn. Mỗi lệnh dưới đây có một tài liệu hướng dẫn chi tiết về mục đích, cách hoạt động và kết quả mong đợi.

---

### 🚀 Giai đoạn Khởi tạo & Lộ trình
- [**`pd init`**](commands/init.md): Khởi tạo dự án hoặc thiết lập cấu trúc PD lần đầu.
- [**`pd new-milestone`**](commands/new-milestone.md): Bắt đầu một giai đoạn (Phase) mới từ Roadmap.

### 🧠 Giai đoạn Lập kế hoạch & Nghiên cứu
- [**`pd research`**](commands/research.md): **MỚI** - Kích hoạt Research Squad để nghiên cứu đa tầng (Parallel Research).
- [**`pd plan`**](commands/plan.md): Trái tim của PD - Thiết kế giải pháp dựa trên kết quả nghiên cứu.
- [**`pd fetch-doc`**](commands/fetch-doc.md): Nghiên cứu tài liệu thư viện mới nhất từ bên ngoài.
- [**`pd update`**](commands/update.md): Điều chỉnh kế hoạch khi có thay đổi hoặc feedback.

### 💻 Giai đoạn Thực thi & Điều hướng
- [**`pd what-next`**](commands/what-next.md): La bàn xác định Task tiếp theo cần làm.
- [**`pd write-code`**](commands/write-code.md): Thực hiện thay đổi mã nguồn (Coding) theo kế hoạch.

### 🛠️ Giai đoạn Kiểm soát & Sửa lỗi
- [**`pd fix-bug`**](commands/fix-bug.md): Quy trình sửa lỗi có kiểm soát (Reproduction -> Plan -> Fix).
- [**`pd scan`**](commands/scan.md): Quét sự đồng bộ giữa Code và Thiết kế.

### ✅ Giai đoạn Nghiệm thu & Kết thúc
- [**`pd test`**](commands/test.md): Chạy test suite và viết báo cáo nghiệm thu.
- [**`pd complete-milestone`**](commands/complete-milestone.md): Đóng Phase, tổng kết và cập nhật Roadmap.

---

### Mẹo cho User & Agent:
- Luôn kiểm tra [**Workflow Overview**](WORKFLOW_OVERVIEW.md) để hiểu triết lý vận hành.
- Nếu một lệnh thất bại, đừng cố làm tiếp lệnh sau; hãy dùng `pd fix-bug` hoặc quay lại `pd scan` để tìm nguyên nhân.
- Tài liệu hóa mọi hành động trong `.planning/` là bắt buộc để duy trì bối cảnh (context).
