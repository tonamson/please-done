# Lệnh `pd plan` (Trái tim của PD)

## Mục đích
Thiết kế giải pháp kỹ thuật và phân rã công việc cho Phase hiện tại. Đây là lúc AI "suy nghĩ" trước khi "làm".

## Quy trình AI thực hiện
1. **Nghiên cứu (Research):** Tìm kiếm các thư viện hiện có, đọc code liên quan để đảm bảo tính khả thi.
2. **Thiết kế (PLAN.md):** Mô tả chiến lược kỹ thuật, các thay đổi quan trọng và danh sách "Truths" (những điều phải đúng sau khi xong).
3. **Phân việc (TASKS.md):** Chia kế hoạch thành các Task nhỏ (thường tối đa 6 tasks) để thực hiện.
4. **Thẩm định (Plan-Check):** AI tự chạy bộ kiểm tra chất lượng kế hoạch.

## Chế độ hoạt động
- `--auto` (mặc định): AI tự quyết định toàn bộ giải pháp.
- `--discuss`: AI liệt kê các lựa chọn kỹ thuật và hỏi ý kiến User trước khi chốt kế hoạch.

## Bộ kiểm tra chất lượng (Plan-Checker)
Để kế hoạch đạt trạng thái `PASS`, nó phải vượt qua các bài kiểm tra:
- **CHECK-01 (Requirements):** Mọi yêu cầu trong ROADMAP phải được phản ánh trong Plan.
- **CHECK-02 (Completeness):** Mỗi Task phải có đầy đủ: Mô tả, Danh sách file sẽ sửa, và Tiêu chí nghiệm thu.
- **CHECK-03 (Dependencies):** Đảm bảo không có vòng lặp phụ thuộc giữa các Task.
- **CHECK-04 (Truth-Task Coverage):** Mọi "Truth" đề ra phải có ít nhất một Task thực hiện nó.
- **ADV-01 (Key Links):** Các liên kết logic giữa các file quan trọng phải được xử lý đồng thời trong một Task.
- **ADV-02 (Scope Sanity):** Giới hạn số lượng Task (<= 6) và số file mỗi Task (<= 7) để tránh AI bị "quá tải".

## Kết quả (Output)
- File `PLAN.md` và `TASKS.md` trong thư mục milestone tương ứng.
- Báo cáo kết quả kiểm tra `plan-check`.

## Mẹo sử dụng
- Nếu kế hoạch bị `BLOCK`, hãy đọc kỹ `fixHint` trong báo cáo để biết AI cần sửa gì (thường là chia nhỏ task hoặc bổ sung file).
- Luôn ưu tiên dùng `--discuss` nếu bạn muốn kiểm soát chặt chẽ kiến trúc hệ thống.

---
**Bước tiếp theo:** [pd what-next](what-next.md)
