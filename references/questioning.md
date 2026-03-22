# Hướng dẫn hỏi người dùng

> Dùng bởi: `/pd:new-milestone`, `/pd:plan --discuss`
> Đảm bảo cách hỏi nhất quán, hiệu quả, dễ hiểu

## Nguyên tắc

| # | Nguyên tắc | Chi tiết |
|---|-----------|----------|
| 1 | Hỏi ít, hỏi đúng | Tối đa 3-5 câu mỗi lượt. Gộp câu hỏi liên quan |
| 2 | Dùng AskUserQuestion | User chọn phím mũi tên — KHÔNG yêu cầu gõ text |
| 3 | Option đầu là khuyến nghị | Thêm "(Đề xuất)" ở cuối label |
| 4 | Ngôn ngữ đơn giản | Viết cho người KHÔNG phải lập trình viên cũng hiểu |
| 5 | Fallback | AskUserQuestion không khả dụng → hỏi văn bản, chờ trả lời |

## Khi nào hỏi sâu

- Trả lời mơ hồ ("làm cho đẹp") → hỏi tiêu chí cụ thể
- Nhiều cách hiểu → đưa ví dụ + options
- Ràng buộc ngầm (deadline, ngân sách, kỹ thuật) → hỏi thẳng
- Liệt kê chung chung → hỏi chia nhỏ

## Khi nào KHÔNG hỏi

- Đã rõ từ CONTEXT.md, ROADMAP.md, SCAN_REPORT.md
- Chỉ 1 lựa chọn hợp lý
- Chi tiết kỹ thuật user không cần quyết định
- Đã hỏi trong cùng phiên

## Cách viết options

### Label
- 3-7 từ, động từ/danh từ rõ nghĩa
- VD: "Nghiên cứu trước", "Bỏ qua", "Thảo luận thêm"

### Description
- Giải thích bằng **kết quả/hệ quả** user cảm nhận được
- KHÔNG thuật ngữ kỹ thuật trần

| Xấu | Tốt |
|-----|-----|
| "httpOnly cookies — không đọc từ JS" | "Lưu đăng nhập an toàn — hacker không đánh cắp được qua lỗi website" |
| "WebSocket real-time" | "Cập nhật tức thì không cần tải lại trang" |
| "Server-side rendering" | "Trang tải nhanh hơn, tốt cho tìm kiếm Google" |
| "Redis cache layer" | "Tốc độ phản hồi nhanh hơn cho trang hay truy cập" |

- Thuật ngữ kỹ thuật chỉ khi không có cách đơn giản hơn → kèm giải thích ngắn
- Ưu/nhược viết ngắn: "Ưu: ..., Nhược: ..."

## Nhóm câu hỏi

| Số lượng | Cách hỏi |
|----------|----------|
| 1 câu | `multiSelect: false` — 2+ options |
| 2-4 câu | 1 `AskUserQuestion` với `multiSelect: true` |
| 5+ câu | Hỏi phạm vi trước ("Thảo luận tất cả / Chọn cụ thể / Bỏ qua"), chia nhóm ≤4 |

## Điều hướng

Sau AskUserQuestion có "Other":
> Chọn "Other" và gõ "back" để quay lại, hoặc "cancel" để hủy.

- `back` → quay lại câu hỏi trước (câu đầu → bước trước)
- `cancel` → giữ quyết định đã chốt, phần còn lại Claude tự quyết → tóm tắt
- Nội dung khác → câu trả lời tự do → xác nhận hiểu đúng trước khi tiếp
