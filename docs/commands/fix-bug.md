# Lệnh `pd fix-bug`

## Mục đích
Khắc phục lỗi (Bugs) một cách có hệ thống và kiểm soát được. Không bao giờ sửa bug mà không có kế hoạch.

## Quy trình 4 bước của PD
1. **Tái hiện (Reproduction):** AI sẽ viết một script hoặc test case nhỏ để chứng minh bug đang tồn tại. Nếu không tái hiện được, AI sẽ không sửa.
2. **Phân tích (Root Cause):** Tìm hiểu nguyên nhân sâu xa (ví dụ: lỗi logic, sai lệch kiểu dữ liệu, thiếu context).
3. **Lên kế hoạch sửa (Fix Plan):** Đưa ra giải pháp sửa lỗi và liệt kê các file cần can thiệp.
4. **Thực thi & Kiểm chứng (Execute & Verify):** Áp dụng thay đổi và chạy lại script tái hiện ở Bước 1 để đảm bảo bug đã biến mất.

## Tại sao quy trình này hiệu quả?
- **Ngăn chặn lỗi lặp lại:** Bằng cách có script tái hiện, bạn có thể chạy lại nó sau này để đảm bảo lỗi không quay lại.
- **Minh bạch:** Mọi bước sửa lỗi đều được tài liệu hóa trong `CHANGELOG.md` hoặc báo cáo fix bug.

## Kết quả (Output)
- Code sửa lỗi trong codebase.
- Script/Test tái hiện bug.
- Cập nhật `CHANGELOG.md`.

## Mẹo sử dụng
- Hãy cung cấp log lỗi hoặc mô tả các bước người dùng thực hiện dẫn đến bug để AI tái hiện nhanh hơn.

---
**Bước tiếp theo:** [pd test](test.md) hoặc [pd what-next](what-next.md).
