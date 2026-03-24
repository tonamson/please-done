# Lệnh `pd init`

## Mục đích
Khởi tạo cấu trúc quản lý dự án theo chuẩn **please-done (PD)**. Đây là bước đầu tiên để biến một thư mục code thông thường thành một dự án được AI hỗ trợ quản lý chặt chẽ.

## Cách hoạt động
Khi chạy `pd init`, AI (Sử dụng **Haiku 4.5**) sẽ:
1. **Phân tích bối cảnh:** Quét thư mục hiện tại để hiểu loại dự án.
2. **Codebase Mapper (MỚI):** Tự động quét thực trạng hoặc đề xuất Blueprint (cho dự án mới).
3. **Tạo cấu trúc `.planning/`:** Khởi tạo thư mục `codebase/` với các file STACK, ARCHITECTURE.
4. **Khởi tạo tài liệu gốc:** PROJECT, ROADMAP, STATE.

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
