# Lệnh `pd init`

## Mục đích
Khởi tạo cấu trúc quản lý dự án theo chuẩn **please-done (PD)**. Đây là bước đầu tiên để biến một thư mục code thông thường thành một dự án được AI hỗ trợ quản lý chặt chẽ.

## Cách hoạt động
Khi chạy `pd init`, AI sẽ:
1. **Phân tích bối cảnh:** Quét thư mục hiện tại để hiểu loại dự án (Node.js, Flutter, NestJS, v.v.).
2. **Tạo cấu trúc `.planning/`:** Đây là "não bộ" của dự án, nơi lưu trữ mọi kế hoạch và trạng thái.
3. **Khởi tạo tài liệu gốc:**
   - `PROJECT.md`: Tầm nhìn và các ràng buộc cốt lõi.
   - `ROADMAP.md`: Danh sách các Milestone và Phase cần thực hiện.
   - `STATE.md`: Lưu trữ trạng thái hiện tại của Agent (đang làm gì, ở đâu).

## Đầu vào (Input)
- **Yêu cầu từ User:** Mô tả tổng quan về dự án hoặc tính năng muốn xây dựng.
- **Codebase hiện tại (nếu có):** AI sẽ tự đọc cấu trúc file để thích nghi.

## Kết quả (Output)
- Thư mục `.planning/` với đầy đủ các template cần thiết.
- File `ROADMAP.md` chứa lộ trình sơ bộ.
- Dự án sẵn sàng để chạy `pd plan` cho Milestone đầu tiên.

## Mẹo sử dụng
- Hãy cung cấp yêu cầu càng chi tiết càng tốt ở bước này để AI tạo ra một `ROADMAP.md` sát với thực tế.
- Nếu bạn đã có file thiết kế hoặc tài liệu PRD, hãy nhắc AI đọc chúng trong quá trình `init`.

---
**Bước tiếp theo:** [pd plan](plan.md) hoặc [pd new-milestone](new-milestone.md)
