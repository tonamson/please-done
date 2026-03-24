# Lệnh `pd research` (Hệ thống Nghiên cứu Phân tầng & Minh bạch)

## Mục đích
Hệ thống nghiên cứu kỹ thuật đa năng phục vụ cả việc triển khai dự án (Internal) lẫn mở rộng tri thức cho người dùng (External). Mỗi bản nghiên cứu đều được chuẩn hóa theo định dạng **Audit-Ready** để chống ảo giác và lưu trữ vĩnh viễn.

## Phân vùng Dữ liệu (Storage Structure)
Mọi kết quả nghiên cứu đều được lưu trong thư mục `.planning/research/`:

1. **`internal/` (Nghiên cứu dự án)**:
   - File chính: `TECHNICAL_STRATEGY.md`, `CODEBASE_MAP.md`.
   - Đặc điểm: Được cập nhật liên tục theo từng Phase. Phục vụ trực tiếp cho AI khi code.
2. **`external/` (Nghiên cứu ngoài)**:
   - File định dạng: `RES-[ID]-[SLUG].md` (Ví dụ: `RES-001-CVE-NESTJS.md`).
   - Đặc điểm: **Không ghi đè**. Mỗi yêu cầu nghiên cứu mới sẽ tạo ra một file mới có mã số ID riêng.
3. **`INDEX.md`**:
   - Bảng tổng hợp (Danh mục) tất cả các bản nghiên cứu, giúp người dùng tra cứu lại dễ dàng.

## Chế độ hoạt động (Modes)
- **`pd research`**: Chế độ mặc định, quét codebase phục vụ `plan`. Kết quả lưu vào `internal/`.
- **`pd research [chủ đề/thư viện/lỗi]`**: Chế độ nghiên cứu mở rộng. 
  - AI sẽ tìm kiếm thông tin bên ngoài dự án.
  - Tạo file báo cáo mới trong `external/` và cập nhật ID vào `INDEX.md`.

## Tiêu chuẩn Audit (Audit Standard)
Mỗi bản nghiên cứu (đặc biệt là nghiên cứu ngoài) PHẢI tuân thủ cấu trúc:
- **Nguồn dẫn chứng**: Link URL, snippet tài liệu hoặc API thực tế.
- **Log Tìm kiếm**: Danh sách các tài liệu đã đọc để đi đến kết luận.
- **Mức độ tin cậy**: AI tự đánh giá độ chính xác (High/Medium/Low).

## Kết quả (Output)
- File báo cáo kỹ thuật minh bạch.
- Cập nhật danh mục nghiên cứu (`INDEX.md`).
- Bổ sung tri thức vào hồ sơ dự án (`.planning/codebase/`).

---
**Bước tiếp theo:** [pd plan](plan.md)
