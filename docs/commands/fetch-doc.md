# Lệnh `pd fetch-doc`

## Mục đích
Giúp AI Agent lấy thông tin và tài liệu mới nhất từ các thư viện hoặc dịch vụ bên ngoài (thông qua Context7).

## Cách hoạt động
1. **Phân tích yêu cầu:** AI xác định thư viện hoặc API cần tìm hiểu.
2. **Truy vấn Context7:** Gọi công cụ `mcp__context7` để tìm tài liệu chính thức và các ví dụ code mẫu.
3. **Lọc thông tin:** Chọn lọc những phần quan trọng nhất (như hướng dẫn cài đặt, hàm API chính).
4. **Lưu trữ:** Kết quả được lưu vào file `RESEARCH.md` trong Milestone hiện tại.

## Tại sao lệnh này quan trọng?
Nó giúp AI luôn làm việc với kiến thức cập nhật nhất, thay vì chỉ dựa vào dữ liệu huấn luyện cũ. Điều này đặc biệt quan trọng với các thư viện thay đổi nhanh như Next.js, Flutter, hoặc Solidity.

## Kết quả (Output)
- Danh sách thư viện đã được nghiên cứu.
- Các ví dụ code mẫu được lưu vào thư mục `milestones`.
- Báo cáo nghiên cứu (RESEARCH.md) giúp lập kế hoạch (`pd plan`) tốt hơn.

## Mẹo sử dụng
- Nếu AI đang loay hoay với một thư viện mới, hãy bảo nó "chạy pd fetch-doc cho thư viện X".

---
**Bước tiếp theo:** [pd plan](plan.md)
