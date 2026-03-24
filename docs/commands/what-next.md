# Lệnh `pd what-next`

## Mục đích
Giúp AI Agent xác định hành động tiếp theo dựa trên trạng thái hiện tại của dự án. Đây là "la bàn" để Agent không bị lạc lối giữa hàng tá nhiệm vụ.

## Cách hoạt động
Khi chạy `pd what-next`, AI sẽ:
1. **Quét `STATE.md`:** Để biết mình đang ở Phase nào, Milestone nào.
2. **Đọc `ROADMAP.md` và `TASKS.md`:** Để tìm danh sách công việc chưa hoàn thành.
3. **Phân tích độ ưu tiên:** Ưu tiên các Task có trạng thái `PENDING` và không bị chặn bởi các Task khác.
4. **Đề xuất:** Chỉ định chính xác Task ID tiếp theo cần làm.

## Tại sao lệnh này quan trọng?
Trong quá trình phát triển, Agent có thể bị mất bối cảnh (context drift) do thay đổi lượt chat hoặc crash. `pd what-next` đảm bảo Agent luôn bắt đầu đúng nơi mình đã dừng lại.

## Kết quả (Output)
- Tên Phase hiện tại.
- ID và tên Task tiếp theo cần thực hiện.
- Hướng dẫn lệnh cụ thể cho bước tiếp theo (thường là `pd write-code`).

---
**Bước tiếp theo:** [pd write-code](write-code.md)
