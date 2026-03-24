# Lệnh `pd write-code`

## Mục đích
Thực thi các thay đổi mã nguồn (Coding) dựa trên Task đã được giao trong `TASKS.md`.

## Quy trình AI thực hiện
1. **Đọc mô tả Task:** Tìm hiểu cụ thể Task ID cần làm là gì, các file liên quan và tiêu chí nghiệm thu.
2. **Quét Context:** Tìm kiếm các đoạn code hiện có để hiểu cách implement chuẩn (ví dụ: dùng thư viện gì, naming convention nào).
3. **Thực thi thay đổi:**
   - **Surgical update:** Chỉ sửa đúng những file được liệt kê trong Task.
   - **Tuân thủ quy tắc:** Áp dụng các rules trong `.planning/rules/` (NestJS, React, Flutter...).
4. **Tự kiểm tra (Self-check):**
   - Chạy lệnh linting/formatting (nếu có).
   - Đảm bảo code build không lỗi.
5. **Cập nhật trạng thái:** Đánh dấu Task là `COMPLETED` trong `TASKS.md`.

## Quy tắc "Surgical" (Can thiệp chính xác)
Lệnh này cực kỳ nghiêm ngặt về việc không làm lan man:
- **KHÔNG** refactor code nằm ngoài phạm vi Task.
- **KHÔNG** thêm tính năng "tiện tay" nếu không có trong Plan.
- Mỗi dòng code thay đổi phải hướng tới việc hoàn thành "Truth" đã cam kết.

## Kết quả (Output)
- Code thay đổi trong codebase.
- Trạng thái Task được cập nhật trong `TASKS.md`.
- Gợi ý lệnh tiếp theo (thường là `pd what-next` hoặc `pd test`).

---
**Bước tiếp theo:** [pd what-next](what-next.md) (cho task kế tiếp) hoặc [pd test](test.md) (nếu xong Milestone).
