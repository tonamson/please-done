# Hướng dẫn hỏi người dùng

> Dùng bởi: `/pd:new-milestone`, `/pd:plan --discuss`
> Mục đích: đảm bảo cách hỏi nhất quán, hiệu quả, dễ hiểu

## Nguyên tắc

| # | Nguyên tắc | Chi tiết |
|---|-----------|----------|
| 1 | Hỏi ít, hỏi đúng | Tối đa 3-5 câu mỗi lượt. Gộp câu hỏi liên quan |
| 2 | Dùng AskUserQuestion | User chọn bằng phím mũi tên — KHÔNG yêu cầu gõ text |
| 3 | Option đầu là khuyến nghị | Thêm "(Đề xuất)" ở cuối label |
| 4 | Ngôn ngữ đơn giản | Viết cho người KHÔNG phải lập trình viên cũng hiểu |
| 5 | Fallback | Nếu AskUserQuestion không khả dụng → hỏi bằng văn bản, chờ trả lời |

## Khi nào hỏi sâu

- User trả lời mơ hồ ("làm cho đẹp", "tối ưu hơn") → hỏi tiêu chí cụ thể: "Đẹp nghĩa là gì? Tốc độ tải? Giao diện? Trải nghiệm?"
- Tính năng có nhiều cách hiểu → đưa ví dụ cụ thể kèm options
- Có ràng buộc ngầm (deadline, ngân sách, kỹ thuật) → hỏi thẳng
- User liệt kê tính năng chung chung → hỏi chia nhỏ: "Tính năng X bao gồm những gì cụ thể?"

## Khi nào KHÔNG hỏi

- Đã rõ ràng từ CONTEXT.md, ROADMAP.md, hoặc SCAN_REPORT.md
- Câu trả lời chỉ có 1 lựa chọn hợp lý (VD: dự án NestJS thì backend dùng NestJS)
- Chi tiết kỹ thuật thuần túy mà user không cần quyết định
- Thông tin đã hỏi trong cùng phiên làm việc

## Cách viết options

### Label
- Ngắn gọn: 3-7 từ
- Dùng động từ hoặc danh từ rõ nghĩa
- VD: "Nghiên cứu trước", "Bỏ qua", "Thảo luận thêm"

### Description
- Giải thích bằng **kết quả/hệ quả** mà người dùng cảm nhận được
- KHÔNG dùng thuật ngữ kỹ thuật trần mà không giải thích

| Xấu | Tốt |
|-----|-----|
| "httpOnly cookies — không đọc từ JS" | "Lưu đăng nhập an toàn — hacker không đánh cắp được qua lỗi website" |
| "WebSocket real-time" | "Cập nhật tức thì không cần tải lại trang" |
| "Server-side rendering" | "Trang tải nhanh hơn, tốt cho tìm kiếm Google" |
| "Redis cache layer" | "Tốc độ phản hồi nhanh hơn cho trang hay truy cập" |

- Thuật ngữ kỹ thuật CHỈ dùng khi không có cách diễn đạt đơn giản hơn → kèm giải thích ngắn trong ngoặc
- Ưu/nhược viết ngắn: "Ưu: ..., Nhược: ..."

## Nhóm câu hỏi

| Số lượng | Cách hỏi |
|----------|----------|
| 1 câu | `multiSelect: false` — 2+ options |
| 2-4 câu | 1 `AskUserQuestion` với `multiSelect: true` |
| 5+ câu | Hỏi phạm vi trước ("Thảo luận tất cả / Chọn cụ thể / Bỏ qua"), rồi chia nhóm ≤4 |

## Điều hướng

Sau mỗi AskUserQuestion có "Other", in:
> Chọn "Other" và gõ "back" để quay lại, hoặc "cancel" để hủy.

Xử lý keyword từ "Other":
- `back` → quay lại câu hỏi trước (nếu đang ở câu đầu → quay bước trước)
- `cancel` → giữ quyết định đã chốt, phần còn lại Claude tự quyết → hiển thị tóm tắt
- Nội dung khác → coi là câu trả lời tự do → xác nhận hiểu đúng trước khi tiếp
